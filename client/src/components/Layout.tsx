import { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { HomeIcon, CalendarIcon, SparkIcon, GearIcon, PlusIcon } from '../icons';

export function AppLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  return (
    <div className="app">
      {children}
      <button className="fab" aria-label="Add goal" onClick={() => navigate('/add')}>
        <PlusIcon />
      </button>
      <nav className="nav">
        <NavLink to="/" end>
          <HomeIcon />
          <span>Today</span>
        </NavLink>
        <NavLink to="/weekly">
          <CalendarIcon />
          <span>Weekly</span>
        </NavLink>
        <NavLink to="/summary">
          <SparkIcon />
          <span>Summary</span>
        </NavLink>
        <NavLink to="/settings">
          <GearIcon />
          <span>Settings</span>
        </NavLink>
      </nav>
    </div>
  );
}

export function Avatars({ me, partner }: { me: string; partner?: string | null }) {
  const initial = (n: string) => (n || '?').trim().charAt(0).toUpperCase();
  return (
    <div className="avatars">
      <div className="avatar me" title={me}>
        {initial(me)}
      </div>
      {partner && (
        <div className="avatar partner" title={partner}>
          {initial(partner)}
        </div>
      )}
    </div>
  );
}
