import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { checkAppVersionAndPurge, cleanVersionQueryParam, isAppReloading } from './utils/versionCheck';

// Limpiar ?_app_v=... de la URL si venimos de una recarga forzada sin caché
cleanVersionQueryParam();

// Verificación inmediata de versión al iniciar
checkAppVersionAndPurge(true).catch(() => {});

// Registrar Service Worker para PWA con actualización sin caché HTTP
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const hadController = Boolean(navigator.serviceWorker.controller);

    navigator.serviceWorker
      .register('/sw.js', { updateViaCache: 'none' })
      .then((registration) => {
        registration.update().catch(() => {});

        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            registration.update().catch(() => {});
          }
        });

        setInterval(() => {
          if (document.visibilityState === 'visible') {
            registration.update().catch(() => {});
          }
        }, 60 * 1000);

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          }
        });
      })
      .catch((err) => {
        console.warn('SW registration failed:', err);
      });

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController || refreshing || isAppReloading()) return;
      refreshing = true;
      checkAppVersionAndPurge(true).then((didReload) => {
        if (!didReload) {
          window.location.reload();
        }
      });
    });
  });
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
