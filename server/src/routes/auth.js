import express from 'express';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { signToken } from '../auth.js';

export default function authRoutes(db) {
  const router = express.Router();

  function publicUser(u) {
    if (!u) return null;
    return {
      id: u.id,
      email: u.email,
      name: u.name,
      coupleId: u.couple_id,
      remindersEnabled: !!u.reminders_enabled,
      reminderTime: u.reminder_time,
      hasPush: !!u.push_subscription,
    };
  }

  router.post('/register', (req, res) => {
    const { email, name, password } = req.body || {};
    if (!email || !name || !password) {
      return res.status(400).json({ error: 'Name, email and password are required.' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    const normEmail = String(email).trim().toLowerCase();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normEmail);
    if (existing) {
      return res.status(409).json({ error: 'An account with that email already exists.' });
    }
    const id = nanoid();
    const hash = bcrypt.hashSync(String(password), 10);
    db.prepare(
      'INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)'
    ).run(id, normEmail, String(name).trim(), hash);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    res.json({ token: signToken(id), user: publicUser(user) });
  });

  router.post('/login', (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const normEmail = String(email).trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(normEmail);
    if (!user || !bcrypt.compareSync(String(password), user.password_hash)) {
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }
    res.json({ token: signToken(user.id), user: publicUser(user) });
  });

  return { router, publicUser };
}
