import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';

const SMARTLAB_VERSION = '2026.06.07-1';
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

if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', async () => {
    const registration = await navigator.serviceWorker.register(`${process.env.PUBLIC_URL}/sw.js?v=${SMARTLAB_VERSION}`, {
      updateViaCache: 'none'
    });
    registration.update();
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      if (!worker) return;
      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          window.dispatchEvent(new CustomEvent('smartlab:update-ready', { detail: worker }));
        }
      });
    });
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  });
}
