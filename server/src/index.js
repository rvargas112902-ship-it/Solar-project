import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import db from './db.js';
import { authMiddleware } from './auth.js';
import authRoutes from './routes/auth.js';
import coupleRoutes from './routes/couple.js';
import goalRoutes from './routes/goals.js';
import pushRoutes from './routes/push.js';
import { initWebSocket } from './ws.js';
import { initPush } from './push.js';
import { startReminders } from './reminders.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

const auth = authMiddleware(db);
const { router: authRouter, publicUser } = authRoutes(db);

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api', authRouter);
app.use('/api', coupleRoutes(db, auth, publicUser));
app.use('/api', goalRoutes(db, auth));
app.use('/api', pushRoutes(db, auth));

// Serve the built PWA in production.
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

initPush();

const server = http.createServer(app);
initWebSocket(server, db);
startReminders(db);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🌸 Dainty Goals server running on http://localhost:${PORT}`);
});
