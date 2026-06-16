// Date / period helpers. Uses server-local time (set TZ env to match the couple).

function pad(n) {
  return String(n).padStart(2, '0');
}

export function dateKey(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addDaysKey(key, delta) {
  const [y, m, day] = key.split('-').map(Number);
  const d = new Date(y, m - 1, day);
  d.setDate(d.getDate() + delta);
  return dateKey(d);
}

// ISO week key, e.g. "2026-W25"
export function weekKey(d = new Date()) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (date.getUTCDay() + 6) % 7; // Mon=0..Sun=6
  date.setUTCDate(date.getUTCDate() - dayNum + 3); // nearest Thursday
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const week =
    1 +
    Math.round(
      ((date - firstThursday) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7
    );
  return `${date.getUTCFullYear()}-W${pad(week)}`;
}

export function periodKeyFor(type, d = new Date()) {
  return type === 'weekly' ? weekKey(d) : dateKey(d);
}
