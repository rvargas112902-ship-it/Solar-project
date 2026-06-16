import { WebSocketServer } from 'ws';
import { verifyToken } from './auth.js';

// Maps userId -> Set<WebSocket>
const clients = new Map();

let dbRef = null;

export function initWebSocket(server, db) {
  dbRef = db;
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url, 'http://localhost');
    const token = url.searchParams.get('token');
    const payload = token && verifyToken(token);
    if (!payload) {
      ws.close(4001, 'unauthorized');
      return;
    }
    const userId = payload.uid;
    ws._userId = userId;
    if (!clients.has(userId)) clients.set(userId, new Set());
    clients.get(userId).add(ws);

    ws.send(JSON.stringify({ type: 'connected' }));

    ws.on('close', () => {
      const set = clients.get(userId);
      if (set) {
        set.delete(ws);
        if (set.size === 0) clients.delete(userId);
      }
    });
    ws.on('error', () => {});
  });
}

function sendToUser(userId, message) {
  const set = clients.get(userId);
  if (!set) return;
  const data = JSON.stringify(message);
  for (const ws of set) {
    if (ws.readyState === ws.OPEN) ws.send(data);
  }
}

// Broadcast an event to every member of a couple.
export function broadcastToCouple(coupleId, message, opts = {}) {
  if (!dbRef) return;
  const members = dbRef
    .prepare('SELECT id FROM users WHERE couple_id = ?')
    .all(coupleId);
  for (const m of members) {
    if (opts.exceptUserId && m.id === opts.exceptUserId) continue;
    sendToUser(m.id, message);
  }
}
