import { useNavigate } from 'react-router-dom';
import type { Goal } from '../types';
import { useStore } from '../store';
import { useCelebration } from './Celebration';
import { CheckIcon, FlameIcon } from '../icons';

export function GoalCard({ goal, meId }: { goal: Goal; meId: string }) {
  const navigate = useNavigate();
  const { completeGoal, uncompleteGoal } = useStore();
  const { celebrate } = useCelebration();
  const mine = goal.createdBy === meId;
  const pct = Math.round((goal.progress / goal.target) * 100);

  const toggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (goal.completed) {
      await uncompleteGoal(goal.id);
    } else {
      const just = await completeGoal(goal.id);
      if (just) celebrate(goal.title, 'you');
    }
  };

  return (
    <div
      className={`goal ${goal.completed ? 'done' : ''}`}
      onClick={() => navigate(`/goal/${goal.id}`)}
    >
      <div className="goal-emoji">{goal.emoji}</div>
      <div className="goal-body">
        <div className="goal-title">{goal.title}</div>
        <div className="goal-meta">
          <span className={`chip ${mine ? 'mine' : ''}`}>
            {mine ? 'You' : goal.createdByName}
          </span>
          {goal.streak > 0 && (
            <span className="chip streak">
              <FlameIcon size={12} /> {goal.streak}
            </span>
          )}
          {goal.completed && goal.completedByName && (
            <span className="chip">✓ {goal.completedByName}</span>
          )}
        </div>
        {goal.target > 1 && !goal.completed && (
          <div className="progress" aria-label={`${pct}%`}>
            <span style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>
      <button
        className={`check ${goal.completed ? 'done' : ''}`}
        onClick={toggle}
        aria-label={goal.completed ? 'Mark not done' : 'Mark complete'}
      >
        <CheckIcon size={20} />
      </button>
    </div>
  );
}
