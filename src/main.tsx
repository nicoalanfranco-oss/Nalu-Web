import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { checkAppVersionAndPurge } from './utils/versionCheck';

// Verificación inmediata de versión al iniciar
checkAppVersionAndPurge().catch(() => {});

// Registrar Service Worker para PWA con detección activa de nuevas versiones
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // Chequeo forzado inmediato al registrar
        registration.update().catch(() => {});

        // Chequeo cuando la app vuelve al primer plano (desbloqueo del móvil o cambio de app)
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            registration.update().catch(() => {});
            checkAppVersionAndPurge().catch(() => {});
          }
        });

        // Chequeo periódico cada 60 segundos en segundo plano
        setInterval(() => {
          registration.update().catch(() => {});
          checkAppVersionAndPurge().catch(() => {});
        }, 60 * 1000);

        // Detectar si hay un nuevo Service Worker instalado
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

    // Recargar la página automáticamente cuando el nuevo Service Worker toma el control
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  });
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
