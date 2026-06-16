import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../store';
import { BackIcon } from '../icons';
import type { GoalType } from '../types';

const EMOJIS = ['🌸', '💗', '🌿', '☀️', '💧', '📚', '🏃', '🧘', '🍓', '🛁', '💌', '🌙', '🎨', '🍵'];

export default function AddGoal() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { addGoal } = useStore();
  const [type, setType] = useState<GoalType>(params.get('type') === 'weekly' ? 'weekly' : 'daily');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [emoji, setEmoji] = useState('🌸');
  const [target, setTarget] = useState(1);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await addGoal({ type, title, note, emoji, target });
      navigate(type === 'weekly' ? '/weekly' : '/');
    } catch (err: any) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="screen screen-pad-sm">
      <div className="page-head" style={{ alignItems: 'center' }}>
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Back">
          <BackIcon />
        </button>
        <h1 className="title">New goal</h1>
        <div style={{ width: 42 }} />
      </div>

      {error && <div className="error-msg">{error}</div>}

      <form onSubmit={submit}>
        <div className="segment">
          <button type="button" className={type === 'daily' ? 'active' : ''} onClick={() => setType('daily')}>
            Daily
          </button>
          <button
            type="button"
            className={type === 'weekly' ? 'active' : ''}
            onClick={() => setType('weekly')}
          >
            Weekly
          </button>
        </div>

        <div className="field">
          <label>Pick an icon</label>
          <div className="emoji-picker">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                className={emoji === e ? 'active' : ''}
                onClick={() => setEmoji(e)}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>What's the goal?</label>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={type === 'daily' ? 'e.g. Drink water together' : 'e.g. Plan a date night'}
            required
            autoFocus
          />
        </div>

        <div className="field">
          <label>A little note (optional)</label>
          <textarea
            className="input"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add details, encouragement, or a reminder…"
          />
        </div>

        <div className="field">
          <label>How many times to reach it? ({target})</label>
          <div className="btn-row" style={{ alignItems: 'center' }}>
            <button
              type="button"
              className="icon-btn"
              onClick={() => setTarget((t) => Math.max(1, t - 1))}
            >
              –
            </button>
            <div
              className="card"
              style={{ flex: 1, padding: '12px', textAlign: 'center', boxShadow: 'none', background: 'var(--cream-2)' }}
            >
              <strong style={{ fontSize: 18 }}>{target}</strong>{' '}
              <span className="muted">step{target > 1 ? 's' : ''}</span>
            </div>
            <button
              type="button"
              className="icon-btn"
              onClick={() => setTarget((t) => Math.min(50, t + 1))}
            >
              +
            </button>
          </div>
          <p className="muted" style={{ fontSize: 12, marginTop: 8, marginLeft: 4 }}>
            Set more than one step to track progress toward bigger goals.
          </p>
        </div>

        <button className="btn" disabled={busy} style={{ marginTop: 6 }}>
          {busy ? 'Adding…' : 'Add goal 🌸'}
        </button>
      </form>
    </div>
  );
}
