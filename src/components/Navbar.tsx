import React, { useState, useEffect } from 'react';
import { ShoppingCart, MapPin, Download, Clock } from 'lucide-react';
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

    const installedHandler = () => {
      setShowInstall(false);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstall(false);
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.warn('Install error:', err);
    }
  };

  return (
    <header className="navbar-wrapper">
      <div className="page-container">
        <nav className="navbar">
          {/* Logo + Location badge + Horario */}
          <div className="navbar-left-group">
            <a href="#" className="navbar-brand">
              <img
                src="./Logo_nalu-sinfondo.png"
                alt="Nalú Poke Bowls"
                className="navbar-logo"
              />
            </a>
            <div className="navbar-badges-group">
              <span className="navbar-location-badge">
                <MapPin size={11} /> Tacuarembó
              </span>
              <span className={`navbar-schedule-badge ${marca.estado_atencion ? (marca.estado_atencion.abierto_ahora ? 'navbar-schedule-open' : 'navbar-schedule-closed') : ''}`}>
                {marca.estado_atencion ? (
                  <>
                    <span className={`navbar-status-indicator ${marca.estado_atencion.abierto_ahora ? 'indicator-open' : 'indicator-closed'}`} />
                    <span className={`navbar-status-pill ${marca.estado_atencion.abierto_ahora ? 'open' : 'closed'}`}>
                      {marca.estado_atencion.abierto_ahora ? 'Abierto' : 'Cerrado'}
                    </span>
                    <span className="schedule-days-text">· {marca.estado_atencion.mensaje_estado}</span>
                  </>
                ) : (
                  <>
                    <Clock size={11} />
                    <span className="schedule-days-text">{marca.dias_atencion}: </span>{marca.horario_atencion}
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Right side: PWA install button (compact: Son app + icon) + Cart with supermarket icon below */}
          <div className="navbar-actions">
            {showInstall && (
              <button
                type="button"
                onClick={handleInstall}
                className="navbar-pwa-pill"
                title="Instalar App Nalú"
                aria-label="Instalar app Nalú"
              >
                <span className="navbar-pwa-text">App</span>
                <span className="navbar-pwa-install-icon">
                  <Download size={12} />
                </span>
              </button>
            )}

            <button
              onClick={onOpenCart}
              className="cart-button-header"
              aria-label="Ver carrito"
            >
              <ShoppingCart size={18} color="var(--primary)" />
              <span className="cart-badge-count">{cartCount}</span>
              {cartTotal > 0 && (
                <span className="cart-total-text">
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
