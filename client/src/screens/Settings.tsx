import { useState } from 'react';
import { useStore } from '../store';
import { api } from '../api';
import { enablePush, disablePush, pushSupported } from '../push';
import { Avatars } from '../components/Layout';

export default function Settings() {
  const { me, updateSettings, leaveCouple, logout, refreshMe } = useStore();
  const user = me!.user;
  const [name, setName] = useState(user.name);
  const [reminderTime, setReminderTime] = useState(user.reminderTime);
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [pushOn, setPushOn] = useState(user.hasPush);
  const [pushMsg, setPushMsg] = useState('');
  const [remOn, setRemOn] = useState(user.remindersEnabled);

  const saveName = async () => {
    setSavingName(true);
    try {
      await updateSettings({ name });
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 1600);
    } finally {
      setSavingName(false);
    }
  };

  const togglePush = async () => {
    setPushMsg('');
    if (!pushOn) {
      const res = await enablePush();
      if (res.ok) {
        setPushOn(true);
        await refreshMe();
        setPushMsg('Notifications on 💕');
      } else {
        setPushMsg(res.reason || 'Could not enable notifications.');
      }
    } else {
      await disablePush();
      setPushOn(false);
      setPushMsg('Notifications off.');
    }
  };

  const toggleReminders = async () => {
    const v = !remOn;
    setRemOn(v);
    await updateSettings({ remindersEnabled: v });
  };

  const saveTime = async (t: string) => {
    setReminderTime(t);
    await updateSettings({ reminderTime: t });
  };

  const test = async () => {
    setPushMsg('');
    try {
      const r = await api.post<{ enabled: boolean }>('/push/test', {});
      setPushMsg(r.enabled ? 'Sent! Check your notifications.' : 'Push not configured on the server.');
    } catch (e: any) {
      setPushMsg(e.message);
    }
  };

  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true;

  return (
    <div className="screen">
      <div className="page-head">
        <h1 className="title">Settings</h1>
        <Avatars me={user.name} partner={me!.partner?.name} />
      </div>

      <h2 style={{ fontSize: 18, margin: '8px 0 10px' }}>Your profile</h2>
      <div className="card" style={{ marginBottom: 18 }}>
        <div className="field" style={{ marginBottom: 10 }}>
          <label>Display name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <button className="btn btn-soft" onClick={saveName} disabled={savingName || !name.trim()}>
          {savingName ? 'Saving…' : nameSaved ? 'Saved ✓' : 'Save name'}
        </button>
        <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>
          Signed in as {user.email}
        </p>
      </div>

      <h2 style={{ fontSize: 18, margin: '8px 0 10px' }}>Your pair</h2>
      <div className="card" style={{ marginBottom: 18 }}>
        {me!.partner ? (
          <div className="row" style={{ borderBottom: 'none' }}>
            <span className="muted">Paired with</span>
            <strong>{me!.partner.name} 💞</strong>
          </div>
        ) : (
          <p className="muted" style={{ margin: 0 }}>
            Waiting for your partner to join with your invite code.
          </p>
        )}
      </div>

      <h2 style={{ fontSize: 18, margin: '8px 0 10px' }}>Notifications</h2>
      <div className="card" style={{ marginBottom: 18 }}>
        <div className="row">
          <div>
            <strong>Push on this device</strong>
            <div className="muted" style={{ fontSize: 13 }}>
              Get nudges when your partner adds or finishes a goal.
            </div>
          </div>
          <button
            className={`switch ${pushOn ? 'on' : ''}`}
            onClick={togglePush}
            aria-label="Toggle push"
            disabled={!pushSupported()}
          />
        </div>
        <div className="row">
          <div>
            <strong>Daily reminder</strong>
            <div className="muted" style={{ fontSize: 13 }}>
              A gentle reminder if goals are still open.
            </div>
          </div>
          <button
            className={`switch ${remOn ? 'on' : ''}`}
            onClick={toggleReminders}
            aria-label="Toggle reminders"
          />
        </div>
        {remOn && (
          <div className="row">
            <span className="muted">Reminder time</span>
            <input
              className="input"
              type="time"
              value={reminderTime}
              onChange={(e) => saveTime(e.target.value)}
              style={{ width: 130 }}
            />
          </div>
        )}
        <div style={{ marginTop: 14 }}>
          <button className="btn btn-soft" onClick={test} disabled={!pushOn}>
            Send a test notification
          </button>
          {pushMsg && (
            <p className="center muted" style={{ fontSize: 13, marginTop: 10 }}>
              {pushMsg}
            </p>
          )}
          {!pushSupported() && (
            <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>
              This browser doesn't support push. On iPhone, add to your Home Screen first.
            </p>
          )}
        </div>
      </div>

      {!isStandalone && (
        <div className="banner" style={{ background: 'linear-gradient(120deg, #e9e1f7, #dcebd6)' }}>
          <span className="big">📲</span>
          <div style={{ fontSize: 13 }}>
            <strong>Add to Home Screen</strong> for the full app feel — tap your browser's Share
            menu, then “Add to Home Screen.”
          </div>
        </div>
      )}

      <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          className="btn btn-soft"
          onClick={async () => {
            if (confirm('Unpair from your partner? Your shared goals stay with them.')) {
              await leaveCouple();
            }
          }}
        >
          Unpair
        </button>
        <button className="btn-ghost" onClick={logout} style={{ margin: '0 auto' }}>
          Sign out
        </button>
      </div>

      <p className="center muted" style={{ fontSize: 12, marginTop: 24 }}>
        Dainty Goals · made with 💗 for two
      </p>
    </div>
  );
}
