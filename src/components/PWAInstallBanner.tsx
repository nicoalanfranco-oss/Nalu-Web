import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

export const PWAInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);

  useEffect(() => {
    // Check if dismissed before
    const dismissed = localStorage.getItem('nalu_pwa_dismissed');
    if (dismissed && Date.now() - Number(dismissed) < 7 * 24 * 60 * 60 * 1000) {
      return;
    }

    // Check if running in standalone mode (already installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    if (isStandalone) return;

    // Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If iOS and not dismissed, show prompt after a gentle delay
    if (isIosDevice && !isStandalone) {
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 5000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSPrompt(true);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowIOSPrompt(false);
    localStorage.setItem('nalu_pwa_dismissed', Date.now().toString());
  };

  if (!showBanner) return null;

  return (
    <>
      <div className="pwa-install-banner">
        <div className="pwa-install-content">
          <div className="pwa-install-icon">
            <Smartphone size={22} />
          </div>
          <div className="pwa-install-text">
            <strong>Instala la App de Nalú Poke</strong>
            <span>Acceso rápido a tu menú favorito y pedidos en 1 click</span>
          </div>
        </div>
        <div className="pwa-install-actions">
          <button
            type="button"
            onClick={handleInstallClick}
            className="pwa-btn-install"
          >
            <Download size={15} />
            <span>Instalar</span>
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="pwa-btn-close"
            aria-label="Cerrar banner de instalación"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {showIOSPrompt && (
        <div className="modal-backdrop" onClick={() => setShowIOSPrompt(false)} style={{ zIndex: 1200 }}>
          <div className="modal-container pwa-ios-modal" onClick={e => e.stopPropagation()}>
            <div className="pwa-ios-header">
              <img src="/Logo_nalu-sinfondo.png" alt="Nalú Poke" className="pwa-ios-logo" />
              <h3>Instalar en tu iPhone o iPad</h3>
            </div>
            <p className="pwa-ios-desc">
              Para agregar Nalú Poke a tu pantalla de inicio como una App:
            </p>
            <ol className="pwa-ios-steps">
              <li>Toca el botón <strong>Compartir</strong> (ícono de cuadro con flecha hacia arriba) en la barra inferior de Safari.</li>
              <li>Baja y selecciona <strong>"Agregar a Inicio"</strong> (+).</li>
              <li>Toca <strong>"Agregar"</strong> arriba a la derecha.</li>
            </ol>
            <button
              type="button"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '16px' }}
              onClick={() => setShowIOSPrompt(false)}
            >
              ¡Entendido!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
