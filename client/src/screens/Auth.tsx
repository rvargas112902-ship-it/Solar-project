import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../store';
import { BackIcon } from '../icons';

export default function Auth() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login, register } = useStore();
  const [mode, setMode] = useState<'signup' | 'login'>(
    params.get('mode') === 'login' ? 'login' : 'signup'
  );
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'signup') await register(email, name, password);
      else await login(email, password);
    } catch (err: any) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="app">
      <div className="screen screen-pad-sm">
        <button className="icon-btn" onClick={() => navigate('/')} aria-label="Back">
          <BackIcon />
        </button>

        <div style={{ marginTop: 24, marginBottom: 26 }}>
          <div className="eyebrow">{mode === 'signup' ? 'Welcome' : 'Welcome back'}</div>
          <h1 className="title" style={{ marginTop: 6 }}>
            {mode === 'signup' ? 'Create your account' : 'Sign in'}
          </h1>
          <p className="subtitle">
            {mode === 'signup'
              ? 'Then pair with your partner using a sweet little invite code.'
              : 'Pick up right where you both left off.'}
          </p>
        </div>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={submit}>
          {mode === 'signup' && (
            <div className="field">
              <label>Your name</label>
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aria"
                autoComplete="name"
                required
              />
            </div>
          )}
          <div className="field">
            <label>Email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              required
            />
          </div>

          <button className="btn" disabled={busy} style={{ marginTop: 8 }}>
            {busy ? 'One moment…' : mode === 'signup' ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <p className="center muted" style={{ marginTop: 22, fontSize: 14 }}>
          {mode === 'signup' ? 'Already have an account?' : 'New here?'}{' '}
          <a
            onClick={() => {
              setError('');
              setMode(mode === 'signup' ? 'login' : 'signup');
            }}
            style={{ cursor: 'pointer', fontWeight: 600 }}
          >
            {mode === 'signup' ? 'Sign in' : 'Create one'}
          </a>
        </p>
      </div>
    </div>
  );
}
