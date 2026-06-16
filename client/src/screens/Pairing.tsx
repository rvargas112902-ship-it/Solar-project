import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { HeartIcon } from '../icons';

export default function Pairing() {
  const { me, createCouple, joinCouple, logout } = useStore();
  const [tab, setTab] = useState<'invite' | 'join'>('invite');
  const [code, setCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);

  useEffect(() => {
    const pending = localStorage.getItem('pending_invite');
    if (pending) {
      setJoinCode(pending);
      setTab('join');
    }
  }, []);

  const generate = async () => {
    setError('');
    setBusy(true);
    try {
      setCode(await createCouple());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const join = async () => {
    setError('');
    setBusy(true);
    try {
      await joinCouple(joinCode.trim().toUpperCase());
      localStorage.removeItem('pending_invite');
    } catch (err: any) {
      setError(err.message);
      setBusy(false);
    }
  };

  const link = code ? `${location.origin}/?invite=${code}` : '';
  const copy = async (text: string, which: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
    setCopied(which);
    setTimeout(() => setCopied(null), 1600);
  };

  return (
    <div className="app">
      <div className="screen screen-pad-sm">
        <div className="center" style={{ margin: '10px 0 22px' }}>
          <div style={{ fontSize: 44 }}>💞</div>
          <div className="eyebrow" style={{ marginTop: 8 }}>
            Hi {me?.user.name}
          </div>
          <h1 className="title" style={{ marginTop: 4 }}>
            Pair with your partner
          </h1>
          <p className="subtitle">Link your two phones so every goal stays in sync.</p>
        </div>

        <div className="segment">
          <button
            className={tab === 'invite' ? 'active' : ''}
            onClick={() => setTab('invite')}
          >
            Invite partner
          </button>
          <button className={tab === 'join' ? 'active' : ''} onClick={() => setTab('join')}>
            I have a code
          </button>
        </div>

        {error && <div className="error-msg">{error}</div>}

        {tab === 'invite' && (
          <div className="card">
            {!code ? (
              <>
                <p className="subtitle" style={{ marginTop: 0, textAlign: 'center' }}>
                  Create a private invite code, then share it with your partner.
                </p>
                <button className="btn" onClick={generate} disabled={busy}>
                  {busy ? 'Creating…' : 'Create invite code'}
                </button>
              </>
            ) : (
              <>
                <div className="code-box">{code}</div>
                <div className="btn-row" style={{ marginTop: 16 }}>
                  <button className="btn btn-soft" onClick={() => copy(code, 'code')}>
                    {copied === 'code' ? 'Copied!' : 'Copy code'}
                  </button>
                  <button className="btn btn-lav" onClick={() => copy(link, 'link')}>
                    {copied === 'link' ? 'Copied!' : 'Copy link'}
                  </button>
                </div>
                <p className="muted center" style={{ fontSize: 13, marginTop: 16 }}>
                  Waiting for your partner to join…
                  <br />
                  This screen will continue automatically. 🌷
                </p>
              </>
            )}
          </div>
        )}

        {tab === 'join' && (
          <div className="card">
            <div className="field" style={{ marginBottom: 12 }}>
              <label>Enter your partner's code</label>
              <input
                className="input"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="e.g. 8XTPFM"
                maxLength={6}
                style={{ textAlign: 'center', letterSpacing: 6, fontWeight: 600 }}
              />
            </div>
            <button className="btn" onClick={join} disabled={busy || !joinCode.trim()}>
              {busy ? 'Pairing…' : 'Pair our hearts'}
            </button>
          </div>
        )}

        <p className="center" style={{ marginTop: 28 }}>
          <a onClick={logout} style={{ cursor: 'pointer', color: 'var(--muted)' }}>
            Sign out
          </a>
        </p>

        <p
          className="center muted"
          style={{ fontSize: 12, marginTop: 30, display: 'flex', gap: 6, justifyContent: 'center' }}
        >
          <HeartIcon size={14} /> two people, one set of goals
        </p>
      </div>
    </div>
  );
}
