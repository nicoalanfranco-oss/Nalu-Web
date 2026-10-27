import React, { useState, useEffect } from 'react';
import { ShoppingCart, MapPin, Download, Clock, X, Share2, PlusSquare } from 'lucide-react';
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
  const [showInstall, setShowInstall] = useState(true);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isChromeIOS, setIsChromeIOS] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone) {
      setShowInstall(false);
      return;
    }

    const ua = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream;
    setIsIOS(ios);
    setIsChromeIOS(ios && /crios/.test(ua));
    setShowInstall(true);

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
    if (deferredPrompt) {
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
    } else {
      // En iOS o navegadores sin prompt automático, abrimos el modal interactivo sin alert
      setShowIOSModal(true);
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

      {/* Modal Guiado para instalación en iPhone / iPad (sin alert) */}
      {showIOSModal && (
        <div className="modal-backdrop" onClick={() => setShowIOSModal(false)} style={{ zIndex: 9999 }}>
          <div
            className="modal-container"
            style={{ maxWidth: '380px', padding: '24px', textAlign: 'center', position: 'relative' }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowIOSModal(false)}
              style={{
                position: 'absolute',
                top: '14px',
                right: '14px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)'
              }}
              aria-label="Cerrar"
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <img
                src="./Logo_nalu-sinfondo.png"
                alt="Nalú Poke"
                style={{ width: '64px', height: '64px', objectFit: 'contain' }}
              />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                Instalar App en tu {isIOS ? 'iPhone' : 'Dispositivo'}
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                Guardá el acceso directo en tu pantalla de inicio para entrar directo y pedir más rápido:
              </p>

              <div
                style={{
                  width: '100%',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '14px',
                  padding: '14px',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  fontSize: '0.85rem',
                  marginTop: '4px'
                }}
              >
                {isChromeIOS ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ background: 'var(--primary-light)', color: 'var(--primary)', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>1</span>
                      <span>Tocá los <strong>tres puntos (...)</strong> abajo a la derecha de Chrome 👇</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ background: 'var(--primary-light)', color: 'var(--primary)', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>2</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <PlusSquare size={16} color="var(--primary)" />
                        <span>Elegí <strong>"Agregar a la pantalla de inicio"</strong></span>
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ background: 'var(--primary-light)', color: 'var(--primary)', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>3</span>
                      <span>Tocá <strong>"Agregar"</strong> arriba a la derecha. ¡Listo!</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ background: 'var(--primary-light)', color: 'var(--primary)', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>1</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Share2 size={16} color="var(--primary)" />
                        <span>Tocá el botón <strong>Compartir</strong> en la barra inferior 👇</span>
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ background: 'var(--primary-light)', color: 'var(--primary)', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>2</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <PlusSquare size={16} color="var(--primary)" />
                        <span>Deslizá y elegí <strong>"Agregar a inicio"</strong></span>
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ background: 'var(--primary-light)', color: 'var(--primary)', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>3</span>
                      <span>Tocá <strong>"Agregar"</strong> arriba a la derecha. ¡Listo!</span>
                    </div>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'var(--primary)',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  marginTop: '4px'
                }}
              >
                ¡Entendido!
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
