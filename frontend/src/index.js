import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';

const SMARTLAB_VERSION = '2026.06.11-6';
window.SMARTLAB_VERSION = SMARTLAB_VERSION;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <HashRouter>
        <App />
      </HashRouter>
    </AuthProvider>
  </React.StrictMode>
);

async function clearSmartlabCaches() {
  if (!('caches' in window)) return;
  const names = await caches.keys();
  await Promise.all(names.filter((name) => name.startsWith('smartlab')).map((name) => caches.delete(name)));
}

function getCurrentMainScript() {
  const script = Array.from(document.scripts).find((item) => item.src.includes('/static/js/main.') && item.src.endsWith('.js'));
  return script ? new URL(script.src).pathname : '';
}

async function checkPublishedVersion() {
  if (document.visibilityState === 'hidden') return;

  const baseUrl = process.env.PUBLIC_URL || '';
  const response = await fetch(`${baseUrl}/index.html?smartlab_version_check=${Date.now()}`, {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache' }
  });

  if (!response.ok) return;
  const html = await response.text();
  const match = html.match(/src="([^"]*\/static\/js\/main\.[^"]+\.js)"/);
  const publishedMainScript = match ? new URL(match[1], window.location.origin).pathname : '';
  const currentMainScript = getCurrentMainScript();

  if (publishedMainScript && currentMainScript && publishedMainScript !== currentMainScript) {
    sessionStorage.setItem('smartlab_auto_reloaded_to', publishedMainScript);
    await clearSmartlabCaches();
    window.location.reload();
  }
}

if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register(`${process.env.PUBLIC_URL}/sw.js?v=${SMARTLAB_VERSION}`, {
        updateViaCache: 'none'
      });

      const activateWorker = (worker) => {
        if (!worker) return;
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            worker.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      };

      activateWorker(registration.installing);
      registration.addEventListener('updatefound', () => activateWorker(registration.installing));

      let reloading = false;
      navigator.serviceWorker.addEventListener('controllerchange', async () => {
        if (reloading) return;
        reloading = true;
        await clearSmartlabCaches();
        window.location.reload();
      });

      registration.update();
      checkPublishedVersion().catch(() => {});

      window.setInterval(() => {
        registration.update();
        checkPublishedVersion().catch(() => {});
      }, 60000);

      window.addEventListener('focus', () => checkPublishedVersion().catch(() => {}));
      window.addEventListener('online', () => checkPublishedVersion().catch(() => {}));
      document.addEventListener('visibilitychange', () => checkPublishedVersion().catch(() => {}));
    } catch (error) {
      console.warn('TESTLAB update check failed', error);
    }
  });
}
