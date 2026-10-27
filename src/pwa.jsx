// PWA glue: service-worker registration, update-available toast, and the Install button
// (captures beforeinstallprompt). Works offline after the first load: sw.js precaches every asset.
import { useEffect, useState, useSyncExternalStore } from 'react';
import { Icon } from './ui/kit.jsx';

const listeners = new Set();
const store = { installEvent: null, installed: false, updateReady: null };
const emit = () => listeners.forEach((l) => l());
const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };
let snapshot = { ...store };
const getSnapshot = () => snapshot;
const set = (patch) => { Object.assign(store, patch); snapshot = { ...store }; emit(); };

export function initPWA() {
  if (typeof window === 'undefined') return;
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); set({ installEvent: e }); });
  window.addEventListener('appinstalled', () => set({ installEvent: null, installed: true }));
  if (window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone) set({ installed: true });
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (refreshing) return; refreshing = true; window.location.reload(); });
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      const watch = (w) => w && w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) set({ updateReady: w }); });
      if (reg.waiting && navigator.serviceWorker.controller) set({ updateReady: reg.waiting });
      reg.addEventListener('updatefound', () => watch(reg.installing));
      // check for a new deploy every 30 minutes while the game is open
      setInterval(() => reg.update().catch(() => {}), 30 * 60 * 1000);
    } catch { /* offline or blocked: the game still runs */ }
  });
}

export function usePWA() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
export async function promptInstall() {
  const e = store.installEvent;
  if (!e) return false;
  e.prompt();
  const choice = await e.userChoice.catch(() => null);
  set({ installEvent: null, installed: choice?.outcome === 'accepted' || store.installed });
  return choice?.outcome === 'accepted';
}
export function applyUpdate() {
  store.updateReady?.postMessage({ type: 'SKIP_WAITING' });
}

export function InstallButton({ className = 'btn sm' }) {
  const s = usePWA();
  if (s.installed || !s.installEvent) return null;
  return <button className={className} onClick={promptInstall}><Icon name="down" size={16} />Install Treblr</button>;
}
export function InstallCard() {
  const s = usePWA();
  const [ios, setIos] = useState(false);
  useEffect(() => { setIos(/iphone|ipad|ipod/i.test(navigator.userAgent || '')); }, []);
  return (
    <div className="card tight install-card">
      <div className="row gap6"><Icon name="phone" size={18} color="#C6FF3D" /><b>Play offline</b></div>
      <div className="tiny muted mt8">
        {s.installed ? 'Treblr is installed. It runs fully offline; your saves stay on this device.'
          : s.installEvent ? 'Install Treblr as an app: its own icon, full screen, and it works with no connection.'
            : ios ? 'On iPhone/iPad: tap Share, then “Add to Home Screen”.'
              : 'Open the browser menu and choose “Install app” or “Add to Home screen”. After the first load Treblr works offline.'}
      </div>
      {s.installEvent && !s.installed && <button className="btn primary block mt12" onClick={promptInstall}><Icon name="down" size={16} />Install Treblr</button>}
    </div>
  );
}
export function UpdateToast() {
  const s = usePWA();
  if (!s.updateReady) return null;
  return (
    <div className="update-toast" role="status">
      <span className="grow">A new version of Treblr is ready.</span>
      <button className="btn sm primary" onClick={applyUpdate}>Update</button>
    </div>
  );
}
