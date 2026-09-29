import React from 'react';
import { ShoppingBag, Sparkles, PhoneCall } from 'lucide-react';

interface NavbarProps {
  cartCount: number;
  cartTotal: number;
  onOpenCart: () => void;
  onOpenCustomizer: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  cartTotal,
  onOpenCart,
  onOpenCustomizer,
}) => {
  return (
    <header className="navbar-wrapper">
      <div className="page-container">
        <nav className="navbar">
          {/* Logo Oficial de Nalú */}
          <a href="#" className="navbar-brand">
            <img
              src="/Logo_nalu-sinfondo.png"
              alt="Nalú Poke Bowls"
              className="navbar-logo"
            />
          </a>

          {/* Links de Navegación Desktop */}
          <ul className="navbar-links" style={{ display: 'none' }}>
            <li><a href="#inicio" className="navbar-link active">Inicio</a></li>
            <li><a href="#bandejas" className="navbar-link">Ingredientes</a></li>
            <li><a href="#menu" className="navbar-link">La Carta</a></li>
            <li><a href="#cultura" className="navbar-link">Nuestra Filosofía</a></li>
          </ul>

          {/* Acciones y Carrito */}
          <div className="navbar-actions">
            <button
              onClick={onOpenCustomizer}
              className="btn-primary"
              style={{ padding: '8px 18px', fontSize: '0.85rem' }}
              title="Arma tu Poke personalizado"
            >
              <Sparkles size={16} />
              <span>Armar Poke</span>
            </button>

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
