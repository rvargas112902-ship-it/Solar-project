import WebSocket from 'ws';

const BASE = 'http://localhost:4000/api';
const WS = 'ws://localhost:4000/ws';

async function post(path, body, token) {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.status);
  return data;
}

function wsConnect(token, label) {
  return new Promise((resolve) => {
    const ws = new WebSocket(`${WS}?token=${token}`);
    ws.events = [];
    ws.on('message', (m) => ws.events.push(JSON.parse(m.toString())));
    ws.on('open', () => resolve(ws));
  });
}

const waitFor = (ws, type, ms = 3000) =>
  new Promise((resolve, reject) => {
    const start = Date.now();
    const t = setInterval(() => {
      const ev = ws.events.find((e) => e.type === type);
      if (ev) {
        clearInterval(t);
        resolve(ev);
      } else if (Date.now() - start > ms) {
        clearInterval(t);
        reject(new Error(`timeout waiting for ${type}`));
      }
    }, 30);
  });

const rnd = Math.random().toString(36).slice(2, 7);
const run = async () => {
  const a = await post('/register', { email: `amy_${rnd}@x.com`, name: 'Amy', password: 'secret1' });
  const b = await post('/register', { email: `ben_${rnd}@x.com`, name: 'Ben', password: 'secret1' });
  const { inviteCode } = await post('/couple/create', {}, a.token);
  await post('/couple/join', { code: inviteCode }, b.token);
  console.log('✓ paired with code', inviteCode);

  const wsA = await wsConnect(a.token, 'A');
  const wsB = await wsConnect(b.token, 'B');
  console.log('✓ both sockets connected');

  // A adds a goal -> B should receive goals_changed
  const g = await post('/goals', { type: 'daily', title: 'Evening walk', emoji: '🌿' }, a.token);
  const evB = await waitFor(wsB, 'goals_changed');
  console.log('✓ B received live add ->', evB.goals.map((x) => x.title).join(', '), '| createdBy', evB.goals[0].createdByName);

  // B completes the goal -> A should receive goals_changed with completed
  await post(`/goals/${g.goal.id}/complete`, {}, b.token);
  const evA = await waitFor(wsA, 'goals_changed');
  const done = evA.goals.find((x) => x.id === g.goal.id);
  console.log('✓ A received live completion -> completed:', done.completed, '| completedBy:', done.completedByName, '| streak:', done.streak);

  // B edits the goal -> A sees update
  wsA.events.length = 0;
  await post(`/goals/${g.goal.id}/uncomplete`, {}, b.token);
  const evA2 = await waitFor(wsA, 'goals_changed');
  console.log('✓ A received live uncomplete -> completed:', evA2.goals.find((x) => x.id === g.goal.id).completed);

  if (!evB.goals.length || !done.completed) throw new Error('sync assertions failed');
  console.log('\nALL REALTIME CHECKS PASSED ✅');
  wsA.close();
  wsB.close();
  process.exit(0);
};
run().catch((e) => {
  console.error('TEST FAILED ❌', e.message);
  process.exit(1);
});
