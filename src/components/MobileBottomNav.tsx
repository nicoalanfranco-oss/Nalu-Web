import React from 'react';
import { Home, Utensils, ShoppingCart } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface MobileBottomNavProps {
  activeTab: 'inicio' | 'menu';
  cartCount: number;
  activeOrdersCount?: number;
  onNavigate: (tab: 'inicio' | 'menu') => void;
  onOpenCustomizer?: () => void;
  onOpenCart: (initialTab?: 'carrito' | 'pedidos') => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  cartCount,
  activeOrdersCount = 0,
  onNavigate,
  onOpenCart,
}) => {
  return (
    <nav className="mobile-bottom-nav" aria-label="Navegación principal móvil">
      <button
        type="button"
        onClick={() => {
          triggerHaptic('light');
          onNavigate('inicio');
        }}
        className={`mobile-nav-item ${activeTab === 'inicio' ? 'active' : ''}`}
      >
        <Home size={22} />
        <span>Inicio</span>
      </button>

      <button
        type="button"
        onClick={() => {
          triggerHaptic('light');
          onNavigate('menu');
        }}
        className={`mobile-nav-item ${activeTab === 'menu' ? 'active' : ''}`}
      >
        <Utensils size={22} />
        <span>La Carta</span>
      </button>

      {/* Mi Pedido con Carrito o Pedidos Activos */}
      <button
        type="button"
        onClick={() => {
          triggerHaptic('light');
          if (cartCount === 0 && activeOrdersCount > 0) {
            onOpenCart('pedidos');
          } else {
            onOpenCart('carrito');
          }
        }}
        className="mobile-nav-item mobile-nav-cart-item"
        aria-label="Ver mi pedido"
      >
        <div className="mobile-nav-cart-icon-wrap">
          <ShoppingCart size={22} />
          {cartCount > 0 ? (
            <span className="mobile-nav-badge">{cartCount}</span>
          ) : activeOrdersCount > 0 ? (
            <span className="mobile-nav-badge" style={{ background: '#16A34A', color: '#FFFFFF' }}>
              {activeOrdersCount}
            </span>
          ) : null}
        </div>
        <span>{cartCount === 0 && activeOrdersCount > 0 ? 'En cocina' : 'Mi Pedido'}</span>
      </button>
    </nav>
  );
};
