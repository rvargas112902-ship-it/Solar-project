import { Navigate, Route, Routes } from 'react-router-dom';
import { useStore } from './store';
import { CelebrationProvider } from './components/Celebration';
import { AppLayout } from './components/Layout';
import { HeartIcon } from './icons';

import Welcome from './screens/Welcome';
import Auth from './screens/Auth';
import Pairing from './screens/Pairing';
import Home from './screens/Home';
import Weekly from './screens/Weekly';
import AddGoal from './screens/AddGoal';
import GoalDetails from './screens/GoalDetails';
import SummaryScreen from './screens/Summary';
import Settings from './screens/Settings';

export default function App() {
  const { ready, me } = useStore();

  if (!ready) {
    return (
      <div className="loader">
        <span className="spin">
          <HeartIcon size={48} />
        </span>
      </div>
    );
  }

  const signedIn = !!me;
  // "Paired" means a partner has actually joined — not just that you created a
  // couple/invite code. Otherwise the inviter would be redirected away from the
  // pairing screen before they could see and share their code.
  const paired = !!me?.partner;

  return (
    <CelebrationProvider>
      {!signedIn && (
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}

      {signedIn && !paired && (
        <Routes>
          <Route path="/pair" element={<Pairing />} />
          <Route path="*" element={<Navigate to="/pair" replace />} />
        </Routes>
      )}

      {signedIn && paired && (
        <AppLayout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/weekly" element={<Weekly />} />
            <Route path="/add" element={<AddGoal />} />
            <Route path="/goal/:id" element={<GoalDetails />} />
            <Route path="/summary" element={<SummaryScreen />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppLayout>
      )}
    </CelebrationProvider>
  );
}
