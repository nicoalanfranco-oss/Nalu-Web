import React from 'react';
import { Home, Utensils, Sparkles, ShoppingBag } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface MobileBottomNavProps {
  activeTab: 'inicio' | 'menu';
  cartCount: number;
  onNavigate: (tab: 'inicio' | 'menu') => void;
  onOpenCustomizer: () => void;
  onOpenCart: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  cartCount,
  onNavigate,
  onOpenCustomizer,
  onOpenCart,
}) => {
  return (
    <nav className="mobile-bottom-nav">
      <button
        type="button"
        onClick={() => {
          triggerHaptic('light');
          onNavigate('inicio');
        }}
        className={`mobile-nav-item ${activeTab === 'inicio' ? 'active' : ''}`}
      >
        <Home size={20} />
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
        <Utensils size={20} />
        <span>La Carta</span>
      </button>

      {/* Botón Central Destacado: Armar Poke */}
      <button
        type="button"
        onClick={() => {
          triggerHaptic('medium');
          onOpenCustomizer();
        }}
        className="mobile-nav-item"
        style={{ color: 'var(--primary)' }}
      >
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: 'var(--radius-full)',
          background: 'linear-gradient(135deg, var(--primary) 0%, #FF3D17 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(255, 90, 54, 0.4)',
          marginBottom: '2px',
        }}>
          <Sparkles size={18} />
        </div>
        <span style={{ fontWeight: 800 }}>Armar</span>
      </button>

      {/* Carrito con Contador */}
      <button
        type="button"
        onClick={() => {
          triggerHaptic('light');
          onOpenCart();
        }}
        className="mobile-nav-item"
      >
        <div style={{ position: 'relative' }}>
          <ShoppingBag size={20} />
          {cartCount > 0 && (
            <span className="mobile-nav-badge">{cartCount}</span>
          )}
        </div>
        <span>Mi Pedido</span>
      </button>
    </nav>
  );
};
