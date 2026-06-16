# Dainty Goals 🌸

A soft, romantic goal-tracking app for couples. Two partners set, track, and
celebrate **daily** and **weekly** goals together — every change syncs to the
other phone **in real time**.

It is built as an installable **PWA (Progressive Web App)**, so both of you can
use it on your phones by opening a link and tapping **"Add to Home Screen."**
No App Store, no Play Store, **no fees to publish** — host it once for free and
share the link.

## ✨ Features

- 💞 **Couple pairing** with a private invite code or shareable link
- ☀️ **Daily goals** and 🗓️ **weekly goals**, each with add / edit / delete
- ✅ One-tap **complete** with a confetti **celebration**
- 📊 **Progress tracker** for multi-step goals
- 🔥 **Streaks** for consecutive completed periods
- 🔄 **Real-time shared sync** between both partners (WebSockets)
- 👤 Shows **who created** and **who completed** each goal
- ✨ **Weekly summary** of completed vs. unfinished goals
- 🔔 **Push notifications** + gentle daily reminders (free Web Push)
- 🔐 Secure login (hashed passwords + signed tokens)
- 📲 Installable PWA, works offline for the basics

## 🧩 Tech

- **Client:** React + Vite, custom dainty pastel design, service worker for PWA + push
- **Server:** Node + Express, SQLite (zero-config DB), WebSockets, Web Push, cron reminders

## 🚀 Run locally

```bash
# 1. install everything (root installs server + client)
npm install

# 2. (optional) enable notifications — generate free VAPID keys
npm run keys
# copy the printed values into server/.env  (see server/.env.example)

# 3. start the app (server :4000 + client :5173 with live reload)
npm run dev
```

Open <http://localhost:5173>. To try it as two partners on one computer, use a
normal window for one account and an **incognito window** for the other.

### Production build

```bash
npm run build   # builds the client into client/dist
npm start       # server serves the API + the built app on :4000
```

## ☁️ Deploy for free (so you can both use it)

The whole thing is **one Node service** that serves the API *and* the app, so
any free Node host works. Recommended free options:

### Option A — Render (free web service)

1. Push this repo to GitHub.
2. On [render.com](https://render.com) → **New → Web Service** → connect the repo.
3. Settings:
   - **Build command:** `npm install && npm run build`
   - **Start command:** `npm start`
4. Add environment variables (from **Environment**):
   - `JWT_SECRET` = a long random string
   - `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (from `npm run keys`)
   - `TZ` = your timezone, e.g. `America/New_York` (controls when days/weeks reset)
5. Deploy, then open the URL on both phones and **Add to Home Screen**.

> Note: Render's free disk is ephemeral, so the SQLite database resets on
> redeploys. For permanent storage, mount a free volume (e.g. **Fly.io**) and set
> `DB_PATH` to a path on that volume.

### Option B — Fly.io (free volume = persistent data)

1. Install the Fly CLI and run `fly launch` (Node detected automatically).
2. Create a volume: `fly volumes create data --size 1` and mount it at `/data`.
3. Set `DB_PATH=/data/dainty.db` plus the same env vars as above
   (`fly secrets set JWT_SECRET=... VAPID_PUBLIC_KEY=...`).
4. `fly deploy`.

Other free Node hosts (Railway, Koyeb, etc.) work the same way: build with
`npm install && npm run build`, start with `npm start`, set the env vars, and —
if the host supports it — point `DB_PATH` at a persistent volume.

## 💑 How to pair

1. Both partners open the app link and create an account.
2. Partner 1: **Invite partner → Create invite code**, then share the code/link.
3. Partner 2: **I have a code → enter it → Pair**.
4. You're synced! Goals added or completed on one phone appear on the other
   instantly.

## ⚙️ Environment variables

See [`server/.env.example`](server/.env.example). All are optional for local
dev; set `JWT_SECRET`, the `VAPID_*` keys, and `TZ` in production.

---

Made with 💗 for two.
