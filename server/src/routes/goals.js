import express from 'express';
import { nanoid } from 'nanoid';
import { dateKey, addDaysKey, weekKey, periodKeyFor } from '../util.js';
import { broadcastToCouple } from '../ws.js';
import { notifyPartner } from '../push.js';

export default function goalRoutes(db, auth) {
  const router = express.Router();

  function nameMap(coupleId) {
    const rows = db.prepare('SELECT id, name FROM users WHERE couple_id = ?').all(coupleId);
    const map = {};
    for (const r of rows) map[r.id] = r.name;
    return map;
  }

  function serialize(goal, names) {
    return {
      id: goal.id,
      type: goal.type,
      title: goal.title,
      note: goal.note,
      emoji: goal.emoji,
      target: goal.target,
      progress: goal.progress,
      completed: !!goal.completed,
      streak: goal.streak,
      createdBy: goal.created_by,
      createdByName: names[goal.created_by] || 'Someone',
      completedBy: goal.completed_by,
      completedByName: goal.completed_by ? names[goal.completed_by] || 'Someone' : null,
      createdAt: goal.created_at,
      updatedAt: goal.updated_at,
    };
  }

  // Reset goals whose period has rolled over (new day / new week).
  function refreshPeriods(coupleId) {
    const today = dateKey();
    const thisWeek = weekKey();
    const stale = db
      .prepare(
        `SELECT * FROM goals WHERE couple_id = ?
         AND ((type='daily' AND period_key != ?) OR (type='weekly' AND period_key != ?))`
      )
      .all(coupleId, today, thisWeek);
    const reset = db.prepare(
      `UPDATE goals SET progress = 0, completed = 0, completed_by = NULL,
        streak = ?, period_key = ?, updated_at = datetime('now') WHERE id = ?`
    );
    let changed = false;
    for (const g of stale) {
      const newStreak = g.completed ? g.streak : 0; // a missed period breaks the streak
      const newPeriod = g.type === 'weekly' ? thisWeek : today;
      reset.run(newStreak, newPeriod, g.id);
      changed = true;
    }
    return changed;
  }

  function requireCouple(req, res, next) {
    if (!req.user.couple_id) {
      return res.status(403).json({ error: 'Pair with your partner first.' });
    }
    next();
  }

  function loadGoal(req, res, next) {
    const goal = db
      .prepare('SELECT * FROM goals WHERE id = ? AND couple_id = ?')
      .get(req.params.id, req.user.couple_id);
    if (!goal) return res.status(404).json({ error: 'Goal not found.' });
    req.goal = goal;
    next();
  }

  function emitChange(coupleId, exceptUserId) {
    const names = nameMap(coupleId);
    const goals = db
      .prepare('SELECT * FROM goals WHERE couple_id = ? ORDER BY created_at ASC')
      .all(coupleId)
      .map((g) => serialize(g, names));
    broadcastToCouple(coupleId, { type: 'goals_changed', goals }, { exceptUserId });
  }

  // List all goals for the couple
  router.get('/goals', auth, requireCouple, (req, res) => {
    const changed = refreshPeriods(req.user.couple_id);
    const names = nameMap(req.user.couple_id);
    const goals = db
      .prepare('SELECT * FROM goals WHERE couple_id = ? ORDER BY created_at ASC')
      .all(req.user.couple_id)
      .map((g) => serialize(g, names));
    if (changed) broadcastToCouple(req.user.couple_id, { type: 'goals_changed', goals });
    res.json({ goals });
  });

  // Create a goal
  router.post('/goals', auth, requireCouple, (req, res) => {
    const { type, title, note, emoji, target } = req.body || {};
    if (!['daily', 'weekly'].includes(type)) {
      return res.status(400).json({ error: 'Goal type must be daily or weekly.' });
    }
    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: 'Give your goal a title.' });
    }
    const id = nanoid();
    const tgt = Math.max(1, parseInt(target, 10) || 1);
    db.prepare(
      `INSERT INTO goals (id, couple_id, type, title, note, emoji, target, period_key, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      req.user.couple_id,
      type,
      String(title).trim(),
      note ? String(note).trim() : null,
      emoji || '🌸',
      tgt,
      periodKeyFor(type),
      req.user.id
    );
    emitChange(req.user.couple_id, req.user.id);
    notifyPartner(db, req.user.couple_id, req.user.id, {
      title: 'New shared goal 💕',
      body: `${req.user.name} added “${String(title).trim()}”`,
      url: '/',
    });
    const names = nameMap(req.user.couple_id);
    const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(id);
    res.json({ goal: serialize(goal, names) });
  });

  // Edit a goal
  router.put('/goals/:id', auth, requireCouple, loadGoal, (req, res) => {
    const { title, note, emoji, target } = req.body || {};
    db.prepare(
      `UPDATE goals SET
         title = COALESCE(?, title),
         note = ?,
         emoji = COALESCE(?, emoji),
         target = COALESCE(?, target),
         updated_at = datetime('now')
       WHERE id = ?`
    ).run(
      title != null ? String(title).trim() : null,
      note != null ? String(note).trim() : req.goal.note,
      emoji != null ? emoji : null,
      target != null ? Math.max(1, parseInt(target, 10) || 1) : null,
      req.goal.id
    );
    emitChange(req.user.couple_id, req.user.id);
    const names = nameMap(req.user.couple_id);
    const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(req.goal.id);
    res.json({ goal: serialize(goal, names) });
  });

  // Delete a goal
  router.delete('/goals/:id', auth, requireCouple, loadGoal, (req, res) => {
    db.prepare('DELETE FROM goals WHERE id = ?').run(req.goal.id);
    emitChange(req.user.couple_id, req.user.id);
    res.json({ ok: true });
  });

  // Update progress (clamped). Auto-completes when target reached.
  router.post('/goals/:id/progress', auth, requireCouple, loadGoal, (req, res) => {
    const { progress, delta } = req.body || {};
    let next = req.goal.progress;
    if (typeof progress === 'number') next = progress;
    else if (typeof delta === 'number') next = req.goal.progress + delta;
    next = Math.max(0, Math.min(req.goal.target, Math.round(next)));

    const willComplete = next >= req.goal.target && !req.goal.completed;
    applyCompletionState(req, next, willComplete);

    emitChange(req.user.couple_id, req.user.id);
    if (willComplete) {
      notifyPartner(db, req.user.couple_id, req.user.id, {
        title: 'Goal complete! 🎉',
        body: `${req.user.name} finished “${req.goal.title}”`,
        url: '/',
      });
    }
    const names = nameMap(req.user.couple_id);
    const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(req.goal.id);
    res.json({ goal: serialize(goal, names), justCompleted: willComplete });
  });

  // Mark a goal complete
  router.post('/goals/:id/complete', auth, requireCouple, loadGoal, (req, res) => {
    if (req.goal.completed) {
      const names = nameMap(req.user.couple_id);
      return res.json({ goal: serialize(req.goal, names), justCompleted: false });
    }
    applyCompletionState(req, req.goal.target, true);
    emitChange(req.user.couple_id, req.user.id);
    notifyPartner(db, req.user.couple_id, req.user.id, {
      title: 'Goal complete! 🎉',
      body: `${req.user.name} finished “${req.goal.title}”`,
      url: '/',
    });
    const names = nameMap(req.user.couple_id);
    const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(req.goal.id);
    res.json({ goal: serialize(goal, names), justCompleted: true });
  });

  // Undo completion
  router.post('/goals/:id/uncomplete', auth, requireCouple, loadGoal, (req, res) => {
    let streak = req.goal.streak;
    if (req.goal.completed && streak > 0) streak -= 1; // roll the streak back
    db.prepare(
      `UPDATE goals SET completed = 0, completed_by = NULL,
        progress = CASE WHEN progress >= target THEN target - 1 ELSE progress END,
        streak = ?, last_completed_date = NULL, updated_at = datetime('now')
       WHERE id = ?`
    ).run(Math.max(0, streak), req.goal.id);
    emitChange(req.user.couple_id, req.user.id);
    const names = nameMap(req.user.couple_id);
    const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(req.goal.id);
    res.json({ goal: serialize(goal, names) });
  });

  function applyCompletionState(req, nextProgress, completing) {
    const goal = req.goal;
    if (!completing) {
      db.prepare(
        `UPDATE goals SET progress = ?, updated_at = datetime('now') WHERE id = ?`
      ).run(nextProgress, goal.id);
      return;
    }
    // Streak: continue if the previous period was completed, else start fresh.
    let prevKey;
    if (goal.type === 'weekly') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      prevKey = weekKey(d);
    } else {
      prevKey = addDaysKey(dateKey(), -1);
    }
    const streak = goal.last_completed_date === prevKey ? goal.streak + 1 : 1;
    const stamp = goal.type === 'weekly' ? weekKey() : dateKey();
    db.prepare(
      `UPDATE goals SET progress = ?, completed = 1, completed_by = ?, streak = ?,
        last_completed_date = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(goal.target, req.user.id, streak, stamp, goal.id);
  }

  // Weekly summary (completed vs unfinished, streak highlights)
  router.get('/summary', auth, requireCouple, (req, res) => {
    refreshPeriods(req.user.couple_id);
    const names = nameMap(req.user.couple_id);
    const goals = db
      .prepare('SELECT * FROM goals WHERE couple_id = ? ORDER BY created_at ASC')
      .all(req.user.couple_id)
      .map((g) => serialize(g, names));

    const daily = goals.filter((g) => g.type === 'daily');
    const weekly = goals.filter((g) => g.type === 'weekly');
    const summarize = (list) => ({
      total: list.length,
      completed: list.filter((g) => g.completed).length,
      unfinished: list.filter((g) => !g.completed),
    });
    const bestStreak = goals.reduce((m, g) => Math.max(m, g.streak), 0);
    res.json({
      weekKey: weekKey(),
      daily: summarize(daily),
      weekly: summarize(weekly),
      bestStreak,
      goals,
    });
  });

  return router;
}
