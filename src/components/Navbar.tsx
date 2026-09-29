import React from 'react';
import { ShoppingBag, Sparkles, MapPin } from 'lucide-react';
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
  onOpenCustomizer,
}) => {
  return (
    <header className="navbar-wrapper">
      <div className="page-container">
        <nav className="navbar">
          {/* Logo Oficial de Nalú */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <a href="#" className="navbar-brand">
              <img
                src="/Logo_nalu-sinfondo.png"
                alt="Nalú Poke Bowls"
                className="navbar-logo"
              />
            </a>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.74rem',
              fontWeight: 700,
              background: 'var(--secondary-light)',
              color: 'var(--secondary)',
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid rgba(120, 140, 80, 0.25)'
            }}>
              <MapPin size={12} /> Tacuarembó
            </span>
          </div>

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
