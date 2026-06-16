import cron from 'node-cron';
import { dateKey, weekKey } from './util.js';
import { sendToUser, pushEnabled } from './push.js';

// Runs every minute and sends a gentle reminder to users whose chosen
// reminder time matches the current local time and who still have
// unfinished goals for the day.
export function startReminders(db) {
  cron.schedule('* * * * *', async () => {
    if (!pushEnabled()) return;
    const now = new Date();
    const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    const users = db
      .prepare(
        'SELECT * FROM users WHERE reminders_enabled = 1 AND reminder_time = ? AND push_subscription IS NOT NULL AND couple_id IS NOT NULL'
      )
      .all(hhmm);

    const today = dateKey();
    const thisWeek = weekKey();
    for (const user of users) {
      const pending = db
        .prepare(
          `SELECT COUNT(*) AS n FROM goals WHERE couple_id = ? AND completed = 0
            AND ((type='daily' AND period_key = ?) OR (type='weekly' AND period_key = ?))`
        )
        .get(user.couple_id, today, thisWeek);
      if (pending.n > 0) {
        await sendToUser(db, user, {
          title: 'A gentle nudge 🌷',
          body: `You and your partner have ${pending.n} goal${
            pending.n === 1 ? '' : 's'
          } to finish today.`,
          url: '/',
        });
      }
    }
  });
  console.log('⏰ Daily reminders scheduled.');
}
