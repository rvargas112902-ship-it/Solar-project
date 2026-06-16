import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { CheckIcon, HeartIcon } from '../icons';

interface CelebrationCtx {
  celebrate: (title: string, by?: string) => void;
}
const Ctx = createContext<CelebrationCtx>({ celebrate: () => {} });
export const useCelebration = () => useContext(Ctx);

const COLORS = ['#f4a6c0', '#c3b1e6', '#a9c79e', '#f6c87a', '#ec9cb8'];
const MESSAGES = [
  'Look at you two go!',
  'Another one, together.',
  'Proud of you both.',
  'Sweet success!',
  'Hearts and high-fives.',
];

export function CelebrationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ title: string; by?: string; msg: string } | null>(null);

  const celebrate = useCallback((title: string, by?: string) => {
    setState({ title, by, msg: MESSAGES[Math.floor(Math.random() * MESSAGES.length)] });
    setTimeout(() => setState(null), 2600);
  }, []);

  return (
    <Ctx.Provider value={{ celebrate }}>
      {children}
      {state && (
        <div className="celebrate" onClick={() => setState(null)}>
          {Array.from({ length: 24 }).map((_, i) => (
            <span
              key={i}
              className="confetti"
              style={{
                left: `${Math.random() * 100}%`,
                background: COLORS[i % COLORS.length],
                animationDuration: `${1.6 + Math.random() * 1.4}s`,
                animationDelay: `${Math.random() * 0.4}s`,
              }}
            />
          ))}
          {Array.from({ length: 8 }).map((_, i) => (
            <span
              key={`h${i}`}
              className="heart-float"
              style={{
                left: `${10 + Math.random() * 80}%`,
                animationDuration: `${2 + Math.random() * 1.5}s`,
                animationDelay: `${Math.random() * 0.5}s`,
              }}
            >
              {['💕', '💗', '🌸', '✨'][i % 4]}
            </span>
          ))}
          <div className="burst">
            <CheckIcon size={64} />
          </div>
          <div className="eyebrow">Goal complete</div>
          <h1 className="display" style={{ marginTop: 6 }}>
            {state.msg}
          </h1>
          <p className="subtitle" style={{ maxWidth: 280 }}>
            “{state.title}” is done{state.by ? ` — completed by ${state.by}` : ''}.
          </p>
          <p className="muted" style={{ marginTop: 18, display: 'flex', gap: 6, alignItems: 'center' }}>
            <HeartIcon size={16} className="" /> tap to continue
          </p>
        </div>
      )}
    </Ctx.Provider>
  );
}
