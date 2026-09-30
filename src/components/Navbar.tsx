import React, { useState, useEffect } from 'react';
import { ShoppingBag, MapPin, Download, X } from 'lucide-react';
import { TenantInfo, MarcaInfo } from '../types/food';

interface NavbarProps {
  marca: MarcaInfo;
  tenant: TenantInfo;
  cartCount: number;
  cartTotal: number;
  onOpenCart: () => void;
  onOpenCustomizer: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  marca,
  tenant,
  cartCount,
  cartTotal,
  onOpenCart,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('nalu_pwa_dismissed');
    if (dismissed && Date.now() - Number(dismissed) < 7 * 24 * 60 * 60 * 1000) return;

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setShowInstall(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismissInstall = () => {
    setShowInstall(false);
    localStorage.setItem('nalu_pwa_dismissed', Date.now().toString());
  };

  return (
    <header className="navbar-wrapper">
      <div className="page-container">
        <nav className="navbar">
          {/* Logo + Location badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <a href="#" className="navbar-brand">
              <img
                src="./Logo_nalu-sinfondo.png"
                alt="Nalú Poke Bowls"
                className="navbar-logo"
              />
            </a>
            <span className="navbar-location-badge">
              <MapPin size={11} /> Tacuarembó
            </span>
          </div>

          {/* Right side: PWA install pill (inline) + Cart */}
          <div className="navbar-actions">
            {showInstall && (
              <div className="navbar-pwa-pill">
                <img src="./Logo_nalu-sinfondo.png" alt="" className="navbar-pwa-logo" />
                <span className="navbar-pwa-text">Instalar app</span>
                <button
                  type="button"
                  onClick={handleInstall}
                  className="navbar-pwa-install-btn"
                  title="Instalar Nalú Poke"
                >
                  <Download size={12} />
                </button>
                <button
                  type="button"
                  onClick={handleDismissInstall}
                  className="navbar-pwa-close-btn"
                  aria-label="Cerrar"
                >
                  <X size={11} />
                </button>
              </div>
            )}

            <button
              onClick={onOpenCart}
              className="cart-button-header"
              aria-label="Ver carrito"
            >
              <ShoppingBag size={20} color="var(--primary)" />
              <span className="cart-badge-count">{cartCount}</span>
              {cartTotal > 0 && (
                <span style={{ fontSize: '0.88rem', fontWeight: 800 }}>
                  ${cartTotal.toLocaleString()}
                </span>
              )}
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
};
