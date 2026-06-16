import webpush from 'web-push';

let configured = false;

export function initPush() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:hello@dainty.goals';
  if (publicKey && privateKey) {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    configured = true;
    console.log('🔔 Web push configured.');
  } else {
    console.log('🔕 Web push not configured (set VAPID keys to enable notifications).');
  }
}

export function pushEnabled() {
  return configured;
}

export function getPublicKey() {
  return process.env.VAPID_PUBLIC_KEY || null;
}

// Send a notification to a single user. Cleans up dead subscriptions.
export async function sendToUser(db, user, payload) {
  if (!configured || !user?.push_subscription) return;
  let sub;
  try {
    sub = JSON.parse(user.push_subscription);
  } catch {
    return;
  }
  try {
    await webpush.sendNotification(sub, JSON.stringify(payload));
  } catch (err) {
    if (err.statusCode === 404 || err.statusCode === 410) {
      db.prepare('UPDATE users SET push_subscription = NULL WHERE id = ?').run(user.id);
    }
  }
}

export async function notifyPartner(db, coupleId, exceptUserId, payload) {
  const partners = db
    .prepare('SELECT * FROM users WHERE couple_id = ? AND id != ?')
    .all(coupleId, exceptUserId);
  for (const p of partners) {
    await sendToUser(db, p, payload);
  }
}
