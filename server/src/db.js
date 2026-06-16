import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'dainty.db');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  couple_id TEXT,
  push_subscription TEXT,
  reminders_enabled INTEGER NOT NULL DEFAULT 1,
  reminder_time TEXT NOT NULL DEFAULT '20:00',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS couples (
  id TEXT PRIMARY KEY,
  invite_code TEXT UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  couple_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('daily','weekly')),
  title TEXT NOT NULL,
  note TEXT,
  emoji TEXT DEFAULT '🌸',
  target INTEGER NOT NULL DEFAULT 1,
  progress INTEGER NOT NULL DEFAULT 0,
  completed INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  last_completed_date TEXT,
  period_key TEXT NOT NULL,
  created_by TEXT NOT NULL,
  completed_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (couple_id) REFERENCES couples(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_goals_couple ON goals(couple_id);
`);

export default db;
