import express from 'express';
import { getPublicKey, pushEnabled, sendToUser } from '../push.js';

export default function pushRoutes(db, auth) {
  const router = express.Router();

  router.get('/push/key', (req, res) => {
    res.json({ publicKey: getPublicKey(), enabled: pushEnabled() });
  });

  router.post('/push/subscribe', auth, (req, res) => {
    const sub = req.body?.subscription;
    if (!sub) return res.status(400).json({ error: 'Missing subscription.' });
    db.prepare('UPDATE users SET push_subscription = ? WHERE id = ?').run(
      JSON.stringify(sub),
      req.user.id
    );
    res.json({ ok: true });
  });

  router.post('/push/unsubscribe', auth, (req, res) => {
    db.prepare('UPDATE users SET push_subscription = NULL WHERE id = ?').run(req.user.id);
    res.json({ ok: true });
  });

  router.post('/push/test', auth, async (req, res) => {
    await sendToUser(db, req.user, {
      title: 'Dainty Goals 🌸',
      body: 'Notifications are working beautifully.',
      url: '/',
    });
    res.json({ ok: true, enabled: pushEnabled() });
  });

  return router;
}
