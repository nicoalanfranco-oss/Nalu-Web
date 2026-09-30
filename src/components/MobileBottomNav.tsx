import React from 'react';
import { Home, Utensils, ShoppingCart } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface MobileBottomNavProps {
  activeTab: 'inicio' | 'menu';
  cartCount: number;
  onNavigate: (tab: 'inicio' | 'menu') => void;
  onOpenCustomizer?: () => void;
  onOpenCart: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  cartCount,
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

      {/* Mi Pedido con Carrito de supermercado y Contador siempre visible */}
      <button
        type="button"
        onClick={() => {
          triggerHaptic('light');
          onOpenCart();
        }}
        className="mobile-nav-item mobile-nav-cart-item"
        aria-label="Ver mi pedido"
      >
        <div className="mobile-nav-cart-icon-wrap">
          <ShoppingCart size={22} />
          {cartCount > 0 && (
            <span className="mobile-nav-badge">{cartCount}</span>
          )}
        </div>
        <span>Mi Pedido</span>
      </button>
    </nav>
  );
};
