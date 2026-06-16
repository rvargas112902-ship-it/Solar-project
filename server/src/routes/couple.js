import express from 'express';
import { nanoid, customAlphabet } from 'nanoid';
import { broadcastToCouple } from '../ws.js';

const codeGen = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6);

export default function coupleRoutes(db, auth, publicUser) {
  const router = express.Router();

  function partnerOf(user) {
    if (!user.couple_id) return null;
    const p = db
      .prepare('SELECT id, name, email FROM users WHERE couple_id = ? AND id != ?')
      .get(user.couple_id, user.id);
    return p ? { id: p.id, name: p.name, email: p.email } : null;
  }

  function coupleInfo(user) {
    if (!user.couple_id) return null;
    return db.prepare('SELECT id, invite_code FROM couples WHERE id = ?').get(user.couple_id);
  }

  // Current user + relationship state
  router.get('/me', auth, (req, res) => {
    const couple = coupleInfo(req.user);
    res.json({
      user: publicUser(req.user),
      partner: partnerOf(req.user),
      couple: couple ? { id: couple.id, inviteCode: couple.invite_code } : null,
    });
  });

  // Update profile + notification preferences
  router.put('/settings', auth, (req, res) => {
    const { name, remindersEnabled, reminderTime } = req.body || {};
    const u = req.user;
    db.prepare(
      `UPDATE users SET
         name = COALESCE(?, name),
         reminders_enabled = COALESCE(?, reminders_enabled),
         reminder_time = COALESCE(?, reminder_time)
       WHERE id = ?`
    ).run(
      name != null ? String(name).trim() : null,
      remindersEnabled != null ? (remindersEnabled ? 1 : 0) : null,
      reminderTime != null ? String(reminderTime) : null,
      u.id
    );
    const fresh = db.prepare('SELECT * FROM users WHERE id = ?').get(u.id);
    if (fresh.couple_id) {
      broadcastToCouple(fresh.couple_id, { type: 'partner_updated' }, { exceptUserId: fresh.id });
    }
    res.json({ user: publicUser(fresh) });
  });

  // Create a couple and get an invite code
  router.post('/couple/create', auth, (req, res) => {
    if (req.user.couple_id) {
      const couple = coupleInfo(req.user);
      return res.json({ inviteCode: couple.invite_code, coupleId: couple.id });
    }
    const id = nanoid();
    const code = codeGen();
    db.prepare('INSERT INTO couples (id, invite_code) VALUES (?, ?)').run(id, code);
    db.prepare('UPDATE users SET couple_id = ? WHERE id = ?').run(id, req.user.id);
    res.json({ inviteCode: code, coupleId: id });
  });

  // Join a partner's couple via invite code
  router.post('/couple/join', auth, (req, res) => {
    const code = String(req.body?.code || '').trim().toUpperCase();
    if (!code) return res.status(400).json({ error: 'Enter an invite code.' });
    const couple = db.prepare('SELECT * FROM couples WHERE invite_code = ?').get(code);
    if (!couple) return res.status(404).json({ error: 'That invite code was not found.' });

    if (req.user.couple_id === couple.id) {
      return res.json({ ok: true, coupleId: couple.id });
    }
    const members = db
      .prepare('SELECT COUNT(*) AS n FROM users WHERE couple_id = ?')
      .get(couple.id);
    if (members.n >= 2) {
      return res.status(409).json({ error: 'This couple is already paired.' });
    }
    if (req.user.couple_id) {
      return res.status(409).json({ error: 'You are already paired. Unpair first.' });
    }

    db.prepare('UPDATE users SET couple_id = ? WHERE id = ?').run(couple.id, req.user.id);
    // Rotate the code so it cannot be reused once the couple is full.
    db.prepare('UPDATE couples SET invite_code = NULL WHERE id = ?').run(couple.id);

    broadcastToCouple(couple.id, { type: 'partner_joined' }, { exceptUserId: req.user.id });
    res.json({ ok: true, coupleId: couple.id });
  });

  // Leave the current couple (keeps shared goals with the remaining partner)
  router.post('/couple/leave', auth, (req, res) => {
    const coupleId = req.user.couple_id;
    if (!coupleId) return res.json({ ok: true });
    db.prepare('UPDATE users SET couple_id = NULL WHERE id = ?').run(req.user.id);
    const remaining = db
      .prepare('SELECT COUNT(*) AS n FROM users WHERE couple_id = ?')
      .get(coupleId);
    if (remaining.n === 0) {
      db.prepare('DELETE FROM couples WHERE id = ?').run(coupleId);
    } else {
      // Re-open the couple with a fresh invite code for a new partner.
      db.prepare('UPDATE couples SET invite_code = ? WHERE id = ?').run(codeGen(), coupleId);
      broadcastToCouple(coupleId, { type: 'partner_left' }, { exceptUserId: req.user.id });
    }
    res.json({ ok: true });
  });

  return router;
}
