import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { GoalCard } from '../components/GoalCard';
import { Avatars } from '../components/Layout';

export default function Weekly() {
  const { me, goals } = useStore();
  const navigate = useNavigate();
  const weekly = goals.filter((g) => g.type === 'weekly');
  const done = weekly.filter((g) => g.completed).length;
  const meId = me!.user.id;

  return (
    <div className="screen">
      <div className="page-head">
        <div>
          <div className="greet-date">This week</div>
          <h1 className="title" style={{ marginTop: 2 }}>
            Weekly goals 🗓️
          </h1>
        </div>
        <Avatars me={me!.user.name} partner={me!.partner?.name} />
      </div>

      <div className="banner" style={{ background: 'linear-gradient(120deg, #dcebd6, #e9e1f7)' }}>
        <span className="big">🌿</span>
        <div>
          <div style={{ fontWeight: 700 }}>
            {weekly.length === 0
              ? 'No weekly goals yet'
              : `${done} of ${weekly.length} done this week`}
          </div>
          <div className="muted" style={{ fontSize: 13 }}>
            Bigger dreams, one week at a time.
          </div>
        </div>
      </div>

      {weekly.length === 0 ? (
        <div className="empty">
          <div className="big">🌷</div>
          <p>Plan something special for the two of you this week.</p>
          <button
            className="btn btn-soft"
            style={{ maxWidth: 220, margin: '14px auto 0' }}
            onClick={() => navigate('/add?type=weekly')}
          >
            Add a weekly goal
          </button>
        </div>
      ) : (
        <div className="goal-list">
          {weekly.map((g) => (
            <GoalCard key={g.id} goal={g} meId={meId} />
          ))}
        </div>
      )}
    </div>
  );
}
