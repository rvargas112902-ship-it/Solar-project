import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store';
import { useCelebration } from '../components/Celebration';
import { BackIcon, CheckIcon, EditIcon, TrashIcon, FlameIcon } from '../icons';

const EMOJIS = ['🌸', '💗', '🌿', '☀️', '💧', '📚', '🏃', '🧘', '🍓', '🛁', '💌', '🌙', '🎨', '🍵'];

export default function GoalDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { me, goals, setProgress, completeGoal, uncompleteGoal, editGoal, deleteGoal } = useStore();
  const { celebrate } = useCelebration();
  const goal = goals.find((g) => g.id === id);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(goal?.title ?? '');
  const [note, setNote] = useState(goal?.note ?? '');
  const [emoji, setEmoji] = useState(goal?.emoji ?? '🌸');
  const [target, setTarget] = useState(goal?.target ?? 1);
  const [busy, setBusy] = useState(false);

  if (!goal) {
    return (
      <div className="screen">
        <div className="empty">
          <div className="big">🍃</div>
          <p>This goal is no longer here.</p>
          <button className="btn btn-soft" style={{ maxWidth: 200, margin: '14px auto 0' }} onClick={() => navigate('/')}>
            Back home
          </button>
        </div>
      </div>
    );
  }

  const mine = goal.createdBy === me!.user.id;
  const pct = Math.round((goal.progress / goal.target) * 100);

  const onComplete = async () => {
    if (goal.completed) {
      await uncompleteGoal(goal.id);
    } else {
      const just = await completeGoal(goal.id);
      if (just) celebrate(goal.title, 'you');
    }
  };

  const bump = async (delta: number) => {
    const just = await setProgress(goal.id, delta);
    if (just) celebrate(goal.title, 'you');
  };

  const saveEdit = async () => {
    setBusy(true);
    try {
      await editGoal(goal.id, { title, note, emoji, target });
      setEditing(false);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm('Delete this goal for both of you?')) return;
    await deleteGoal(goal.id);
    navigate(-1);
  };

  return (
    <div className="screen">
      <div className="page-head" style={{ alignItems: 'center' }}>
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Back">
          <BackIcon />
        </button>
        <div className="btn-row" style={{ width: 'auto', gap: 8 }}>
          <button className="icon-btn" onClick={() => setEditing((v) => !v)} aria-label="Edit">
            <EditIcon size={20} />
          </button>
          <button className="icon-btn" onClick={remove} aria-label="Delete" style={{ color: '#d9789a' }}>
            <TrashIcon size={20} />
          </button>
        </div>
      </div>

      {!editing ? (
        <>
          <div className="center" style={{ marginBottom: 22 }}>
            <div
              className="goal-emoji"
              style={{ width: 84, height: 84, fontSize: 42, margin: '0 auto 14px', borderRadius: 26 }}
            >
              {goal.emoji}
            </div>
            <span className="chip" style={{ marginBottom: 10 }}>
              {goal.type === 'daily' ? 'Daily goal' : 'Weekly goal'}
            </span>
            <h1 className="title" style={{ marginTop: 8 }}>
              {goal.title}
            </h1>
            {goal.note && <p className="subtitle">{goal.note}</p>}
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="row">
              <span className="muted">Created by</span>
              <strong>{mine ? 'You' : goal.createdByName}</strong>
            </div>
            <div className="row">
              <span className="muted">Status</span>
              <strong style={{ color: goal.completed ? 'var(--sage-deep)' : 'var(--blush-ink)' }}>
                {goal.completed ? `Done${goal.completedByName ? ` · ${goal.completedByName}` : ''}` : 'In progress'}
              </strong>
            </div>
            <div className="row">
              <span className="muted">Streak</span>
              <strong style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <FlameIcon size={16} className="" /> {goal.streak}{' '}
                {goal.type === 'daily' ? 'days' : 'weeks'}
              </strong>
            </div>
          </div>

          {goal.target > 1 && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="page-head" style={{ marginBottom: 10 }}>
                <strong>Progress</strong>
                <span className="muted">
                  {goal.progress} / {goal.target}
                </span>
              </div>
              <div className="progress">
                <span style={{ width: `${pct}%` }} />
              </div>
              <div className="btn-row" style={{ marginTop: 16 }}>
                <button
                  className="btn btn-soft"
                  onClick={() => bump(-1)}
                  disabled={goal.progress <= 0}
                >
                  − Step
                </button>
                <button
                  className="btn btn-lav"
                  onClick={() => bump(1)}
                  disabled={goal.progress >= goal.target}
                >
                  + Step
                </button>
              </div>
            </div>
          )}

          <button className={`btn ${goal.completed ? 'btn-soft' : ''}`} onClick={onComplete}>
            {goal.completed ? 'Mark as not done' : (
              <>
                <CheckIcon size={20} /> Complete this goal
              </>
            )}
          </button>
        </>
      ) : (
        <>
          <h2 style={{ fontSize: 22, marginBottom: 14 }}>Edit goal</h2>
          <div className="field">
            <label>Icon</label>
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
            <label>Title</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="field">
            <label>Note</label>
            <textarea className="input" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <div className="field">
            <label>Target steps ({target})</label>
            <div className="btn-row" style={{ alignItems: 'center' }}>
              <button type="button" className="icon-btn" onClick={() => setTarget((t) => Math.max(1, t - 1))}>
                –
              </button>
              <div className="card" style={{ flex: 1, padding: 12, textAlign: 'center', boxShadow: 'none', background: 'var(--cream-2)' }}>
                <strong style={{ fontSize: 18 }}>{target}</strong>
              </div>
              <button type="button" className="icon-btn" onClick={() => setTarget((t) => Math.min(50, t + 1))}>
                +
              </button>
            </div>
          </div>
          <div className="btn-row">
            <button className="btn btn-soft" onClick={() => setEditing(false)}>
              Cancel
            </button>
            <button className="btn" onClick={saveEdit} disabled={busy || !title.trim()}>
              {busy ? 'Saving…' : 'Save'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
