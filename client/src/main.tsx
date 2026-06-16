import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { StoreProvider } from './store';
import App from './App';
import './styles.css';

// Capture an invite code from a shared link (?invite=CODE) so it survives
// the sign-up redirect and can prefill the pairing screen.
try {
  const invite = new URLSearchParams(location.search).get('invite');
  if (invite) localStorage.setItem('pending_invite', invite.toUpperCase());
} catch {}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <StoreProvider>
        <App />
      </StoreProvider>
    </BrowserRouter>
  </StrictMode>
);
