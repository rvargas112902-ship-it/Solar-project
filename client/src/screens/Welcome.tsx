import { useNavigate } from 'react-router-dom';

export default function Welcome() {
  const navigate = useNavigate();
  return (
    <div className="app">
      <div className="hero">
        <div
          className="blob"
          style={{ width: 240, height: 240, background: '#f7d9e3', top: -40, left: -40 }}
        />
        <div
          className="blob"
          style={{ width: 220, height: 220, background: '#e7def5', bottom: 40, right: -50 }}
        />
        <div
          className="blob"
          style={{ width: 160, height: 160, background: '#dcebd6', top: 120, right: 30 }}
        />

        <div className="mark">🌸</div>
        <div className="eyebrow">for two hearts</div>
        <h1 className="display" style={{ marginTop: 8 }}>
          Dainty Goals
        </h1>
        <p className="subtitle" style={{ maxWidth: 300, margin: '12px auto 0' }}>
          Set, track, and celebrate your daily &amp; weekly goals together. Every check-in syncs
          to your partner, instantly. 💕
        </p>

        <div style={{ marginTop: 36, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button className="btn" onClick={() => navigate('/auth?mode=signup')}>
            Start together
          </button>
          <button className="btn btn-soft" onClick={() => navigate('/auth?mode=login')}>
            I already have an account
          </button>
        </div>

        <p className="muted" style={{ fontSize: 12, marginTop: 28 }}>
          Free forever · No app store needed · Add to your home screen
        </p>
      </div>
    </div>
  );
}
