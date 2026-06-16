import { useEffect, useState } from 'react';
import { useStore } from '../store';
import type { Summary } from '../types';
import { FlameIcon } from '../icons';

export default function SummaryScreen() {
  const { getSummary, goals } = useStore();
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getSummary().then(setData).catch((e) => setError(e.message));
    // re-fetch when goals change (live updates)
  }, [getSummary, goals]);

  if (error) {
    return (
      <div className="screen">
        <div className="error-msg">{error}</div>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="screen">
        <div className="empty">
          <span className="spin big">🌸</span>
          <p>Gathering your week…</p>
        </div>
      </div>
    );
  }

  const totalGoals = data.daily.total + data.weekly.total;
  const totalDone = data.daily.completed + data.weekly.completed;
  const pct = totalGoals ? Math.round((totalDone / totalGoals) * 100) : 0;
  const unfinished = [...data.daily.unfinished, ...data.weekly.unfinished];

  return (
    <div className="screen">
      <div className="page-head">
        <div>
          <div className="greet-date">{data.weekKey}</div>
          <h1 className="title" style={{ marginTop: 2 }}>
            Weekly summary ✨
          </h1>
        </div>
      </div>

      <div className="card center" style={{ marginBottom: 16 }}>
        <div className="ring" style={{ ['--p' as any]: pct }}>
          <span>{pct}%</span>
        </div>
        <p className="subtitle" style={{ marginTop: 14 }}>
          {totalDone} of {totalGoals} goals complete
          {pct === 100 && totalGoals > 0 ? ' — perfect week! 🎉' : ''}
        </p>
      </div>

      <div className="stat-grid" style={{ marginBottom: 12 }}>
        <div className="stat">
          <div className="num">
            {data.daily.completed}/{data.daily.total}
          </div>
          <div className="lbl">Daily done</div>
        </div>
        <div className="stat">
          <div className="num">
            {data.weekly.completed}/{data.weekly.total}
          </div>
          <div className="lbl">Weekly done</div>
        </div>
      </div>

      <div className="stat" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        <FlameIcon size={26} className="" />
        <div>
          <div className="num" style={{ fontSize: 26 }}>
            {data.bestStreak}
          </div>
          <div className="lbl">Best current streak</div>
        </div>
      </div>

      <h2 style={{ fontSize: 20, marginBottom: 12 }}>
        {unfinished.length === 0 ? 'Nothing left undone 💗' : 'Still to finish'}
      </h2>

      {unfinished.length === 0 ? (
        <div className="empty" style={{ padding: '20px' }}>
          <div className="big">🌷</div>
          <p>You two completed everything. Beautiful teamwork.</p>
        </div>
      ) : (
        <div className="goal-list">
          {unfinished.map((g) => (
            <div className="goal" key={g.id} style={{ cursor: 'default' }}>
              <div className="goal-emoji">{g.emoji}</div>
              <div className="goal-body">
                <div className="goal-title">{g.title}</div>
                <div className="goal-meta">
                  <span className="chip">{g.type === 'daily' ? 'Daily' : 'Weekly'}</span>
                  <span className="chip">by {g.createdByName}</span>
                  {g.target > 1 && (
                    <span className="chip">
                      {g.progress}/{g.target}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
