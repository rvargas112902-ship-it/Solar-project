import { api } from './api';

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function pushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export async function enablePush(): Promise<{ ok: boolean; reason?: string }> {
  if (!pushSupported()) return { ok: false, reason: 'Notifications are not supported on this device.' };
  const { publicKey, enabled } = await api.get<{ publicKey: string | null; enabled: boolean }>(
    '/push/key'
  );
  if (!enabled || !publicKey) {
    return { ok: false, reason: 'Push is not configured on the server yet.' };
  }
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return { ok: false, reason: 'Notification permission was declined.' };

  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }
  await api.post('/push/subscribe', { subscription: sub });
  return { ok: true };
}

export async function disablePush() {
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) await sub.unsubscribe();
  } catch {}
  await api.post('/push/unsubscribe', {});
}
