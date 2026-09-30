import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export const PWAInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('nalu_pwa_dismissed');
    if (dismissed && Date.now() - Number(dismissed) < 7 * 24 * 60 * 60 * 1000) {
      return;
    }

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    if (isStandalone) return;

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (isIosDevice && !isStandalone) {
      const timer = setTimeout(() => setShowBanner(true), 6000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setShowBanner(false);
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
      {/* Pill compacta */}
      <div className="pwa-pill">
        <img src="./Logo_nalu-sinfondo.png" alt="Nalú" className="pwa-pill-logo" />
        <span className="pwa-pill-text">Instalar app</span>
        <button type="button" onClick={handleInstallClick} className="pwa-pill-btn">
          <Download size={13} /> Instalar
        </button>
        <button type="button" onClick={handleDismiss} className="pwa-pill-close" aria-label="Cerrar">
          <X size={13} />
        </button>
      </div>

      {/* Modal iOS */}
      {showIOSPrompt && (
        <div className="modal-backdrop" onClick={() => setShowIOSPrompt(false)} style={{ zIndex: 1200 }}>
          <div className="modal-container pwa-ios-modal" onClick={e => e.stopPropagation()}>
            <div className="pwa-ios-header">
              <img src="./Logo_nalu-sinfondo.png" alt="Nalú Poke" className="pwa-ios-logo" />
              <h3>Instalar en tu iPhone o iPad</h3>
            </div>
            <p className="pwa-ios-desc">Para agregar Nalú Poke a tu pantalla de inicio:</p>
            <ol className="pwa-ios-steps">
              <li>Toca el botón <strong>Compartir</strong> (ícono con flecha) en Safari.</li>
              <li>Selecciona <strong>"Agregar a Inicio"</strong>.</li>
              <li>Toca <strong>"Agregar"</strong>.</li>
            </ol>
            <button type="button" className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }} onClick={() => setShowIOSPrompt(false)}>
              ¡Entendido!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
