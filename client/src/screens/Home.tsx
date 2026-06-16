import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { GoalCard } from '../components/GoalCard';
import { Avatars } from '../components/Layout';

export default function Home() {
  const { me, goals, wsConnected } = useStore();
  const navigate = useNavigate();
  const daily = goals.filter((g) => g.type === 'daily');
  const done = daily.filter((g) => g.completed).length;
  const meId = me!.user.id;

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  const allDone = daily.length > 0 && done === daily.length;

  return (
    <div className="screen">
      <div className="page-head">
        <div>
          <div className="greet-date">{today}</div>
          <h1 className="title" style={{ marginTop: 2 }}>
            {greeting}, {me!.user.name} 🌸
          </h1>
        </div>
        <Avatars me={me!.user.name} partner={me!.partner?.name} />
      </div>

      <div className="banner">
        <span className="big">{allDone ? '🎉' : '💗'}</span>
        <div>
          <div style={{ fontWeight: 700 }}>
            {daily.length === 0
              ? 'No goals yet for today'
              : allDone
              ? 'All of today’s goals are done!'
              : `${done} of ${daily.length} done today`}
          </div>
          <div className="muted" style={{ fontSize: 13 }}>
            {me!.partner
              ? `You & ${me!.partner.name} · ${wsConnected ? 'synced live' : 'reconnecting…'}`
              : 'Waiting for your partner'}
          </div>
        </div>
      </div>

      <div className="page-head" style={{ marginBottom: 12 }}>
        <h2 style={{ fontSize: 22 }}>Today’s goals</h2>
      </div>

      {daily.length === 0 ? (
        <div className="empty">
          <div className="big">🌼</div>
          <p>Add your first daily goal together.</p>
          <button
            className="btn btn-soft"
            style={{ maxWidth: 220, margin: '14px auto 0' }}
            onClick={() => navigate('/add?type=daily')}
          >
            Add a daily goal
          </button>
        </div>
      ) : (
        <div className="goal-list">
          {daily.map((g) => (
            <GoalCard key={g.id} goal={g} meId={meId} />
          ))}
        </div>
      )}
    </div>
  );
}
