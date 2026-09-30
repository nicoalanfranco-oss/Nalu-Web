import React, { useState, useMemo } from 'react';
import {
  X, Plus, Minus, Trash2, Sparkles,
  ArrowRight, ChevronRight
} from 'lucide-react';
import { ProductoElaborado, ProductoReventa, CartItem } from '../types/food';
import { triggerHaptic } from '../utils/haptics';

interface NaluPOSViewProps {
  isOpen: boolean;
  platos: ProductoElaborado[];
  reventa: ProductoReventa[];
  cart: CartItem[];
  onClose: () => void;
  onUpdateQty: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onQuickAdd: (plato: ProductoElaborado) => void;
  onQuickAddReventa: (r: ProductoReventa) => void;
  onSelectPlatoParaPersonalizar: (plato: ProductoElaborado) => void;
  onOpenCheckout: () => void;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  'todos': '✨',
  'Pokes': '🥗',
  'Ensaladas': '🥬',
  'Bebidas': '🥤',
  'Postres': '🍨',
  'Acompañamientos': '🍟',
};

export const NaluPOSView: React.FC<NaluPOSViewProps> = ({
  isOpen,
  platos,
  reventa,
  cart,
  onClose,
  onUpdateQty,
  onRemoveItem,
  onQuickAdd,
  onQuickAddReventa,
  onSelectPlatoParaPersonalizar,
  onOpenCheckout,
}) => {
  const [categoria, setCategoria] = useState('todos');
  const [mobileTab, setMobileTab] = useState<'menu' | 'pedido'>('menu');

  const categorias = useMemo(() => {
    const list = Array.from(new Set(platos.map(p => p.categoria || 'Pokes')));
    if (reventa.length > 0 && !list.includes('Bebidas')) list.push('Bebidas');
    return ['todos', ...list];
  }, [platos, reventa]);

  const platosFiltrados = useMemo(() => {
    if (categoria === 'todos') return platos;
    if (categoria === 'Bebidas') return [];
    return platos.filter(p => p.categoria === categoria);
  }, [platos, categoria]);

  const reventaFiltrada = useMemo(() => {
    return (categoria === 'todos' || categoria === 'Bebidas') ? reventa : [];
  }, [reventa, categoria]);

  const cartTotal = useMemo(() =>
    cart.reduce((a, i) => a + i.precio_unitario * i.cantidad, 0),
    [cart]
  );
  const cartCount = useMemo(() =>
    cart.reduce((a, i) => a + i.cantidad, 0),
    [cart]
  );

  if (!isOpen) return null;

  return (
    <div className="pos-backdrop" onClick={onClose}>
      <div className="pos-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="pos-header">
          <div className="pos-header-brand">
            <img src="./Logo_nalu-sinfondo.png" alt="Nalú" className="pos-header-logo" />
            <div>
              <span className="pos-header-title">Nuevo Pedido</span>
              <span className="pos-header-subtitle">Nalú Poke Bowls · Tacuarembó</span>
            </div>
          </div>
          <button onClick={onClose} className="pos-close-btn" aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        {/* Mobile tab switcher */}
        <div className="pos-mobile-tabs">
          <button
            className={`pos-mobile-tab ${mobileTab === 'menu' ? 'active' : ''}`}
            onClick={() => setMobileTab('menu')}
          >
            🥗 Menú
          </button>
          <button
            className={`pos-mobile-tab ${mobileTab === 'pedido' ? 'active' : ''}`}
            onClick={() => setMobileTab('pedido')}
          >
            <span>🛒 Pedido{cartCount > 0 ? ` (${cartCount})` : ''}</span>
          </button>
        </div>

        {/* Body: menu + cart side by side */}
        <div className="pos-body">

          {/* ─── Menu Panel ─────────────────────────────────── */}
          <div className={`pos-menu-wrapper ${mobileTab !== 'menu' ? 'pos-hidden-mobile' : ''}`}>
            <div className="pos-menu-panel">
              {/* Category tabs */}
              <div className="pos-categories-bar">
                {categorias.map(cat => (
                  <button
                    key={cat}
                    className={`pos-cat-btn ${categoria === cat ? 'active' : ''}`}
                    onClick={() => setCategoria(cat)}
                  >
                    <span>{CATEGORY_EMOJIS[cat] || '🍽️'}</span>
                    <span>{cat === 'todos' ? 'Todos' : cat}</span>
                  </button>
                ))}
              </div>

              {/* Product grid */}
              <div className="pos-products-grid">
                {/* Platos elaborados */}
                {platosFiltrados.map(plato => (
                  <div
                    key={plato.producto_elaborado_id}
                    className={`pos-product-card pos-product-card--clickable ${plato.es_personalizable ? 'pos-product-card--armar' : ''}`}
                    onClick={() => {
                      triggerHaptic('light');
                      if (plato.es_personalizable) {
                        onSelectPlatoParaPersonalizar(plato);
                      } else {
                        onQuickAdd(plato);
                      }
                    }}
                    title={plato.es_personalizable ? 'Personalizar bowl' : 'Agregar al pedido'}
                  >
                    <div className="pos-product-img-wrapper">
                      <img
                        src={plato.imagen_url || './hero_bandejas_nalu.jpg'}
                        alt={plato.nombre}
                        className="pos-product-img"
                        loading="lazy"
                      />
                      <span className="pos-product-cat-badge">
                        {CATEGORY_EMOJIS[plato.categoria] || '🍽️'} {plato.categoria}
                      </span>
                      {plato.es_personalizable && (
                        <span className="pos-product-armar-badge">
                          <Sparkles size={10} /> Personalizar
                        </span>
                      )}
                    </div>
                    <div className="pos-product-body">
                      <h4 className="pos-product-name">{plato.nombre}</h4>
                      <div className="pos-product-footer">
                        <span className="pos-product-price">
                          ${Number(plato.precio_venta).toLocaleString()}
                        </span>
                        <span className={plato.es_personalizable ? 'pos-tap-hint pos-tap-hint--armar' : 'pos-tap-hint'}>
                          {plato.es_personalizable ? <><Sparkles size={11} /> Armar</> : <><Plus size={11} /> Agregar</>}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Bebidas de reventa */}
                {reventaFiltrada.map(r => (
                  <div
                    key={`rev_${r.producto_reventa_id}`}
                    className="pos-product-card pos-product-card--clickable"
                    onClick={() => {
                      triggerHaptic('light');
                      onQuickAddReventa(r);
                    }}
                    title="Agregar bebida"
                  >
                    <div className="pos-product-img-wrapper">
                      <img
                        src={r.imagen_url || './hero_bandejas_nalu.jpg'}
                        alt={r.nombre}
                        className="pos-product-img"
                        loading="lazy"
                      />
                      <span className="pos-product-cat-badge bebida">
                        🥤 Bebidas
                      </span>
                    </div>
                    <div className="pos-product-body">
                      <h4 className="pos-product-name">{r.nombre}</h4>
                      <div className="pos-product-footer">
                        <span className="pos-product-price">
                          ${Number(r.precio_venta).toLocaleString()}
                        </span>
                        <span className="pos-tap-hint">
                          <Plus size={11} /> Agregar
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ─── Cart Panel ─────────────────────────────────── */}
          <div className={`pos-cart-wrapper ${mobileTab !== 'pedido' ? 'pos-hidden-mobile' : ''}`}>
            <div className="pos-cart-panel">
              <div className="pos-cart-header">
                <img src="./Logo_nalu-sinfondo.png" alt="Nalú" className="pos-cart-header-logo" />
                <span>Tu Pedido</span>
                {cartCount > 0 && (
                  <span className="pos-cart-badge">{cartCount}</span>
                )}
              </div>

              <div className="pos-cart-items">
                {cart.length === 0 ? (
                  <div className="pos-cart-empty">
                    <span style={{ fontSize: '2.2rem' }}>🥗</span>
                    <p>Tu pedido está vacío</p>
                    <span>Agregá platos desde el menú</span>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="pos-cart-item">
                      {item.imagen_url && (
                        <img
                          src={item.imagen_url}
                          alt={item.nombre}
                          className="pos-cart-item-img"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      )}
                      <div className="pos-cart-item-info">
                        <p className="pos-cart-item-name">{item.nombre}</p>
                        {item.modificadores && item.modificadores.length > 0 && (
                          <p className="pos-cart-item-mods">
                            {item.modificadores.slice(0, 2).map(m => m.nombre).join(', ')}
                            {item.modificadores.length > 2 && ` +${item.modificadores.length - 2}`}
                          </p>
                        )}
                        <p className="pos-cart-item-price">
                          ${(item.precio_unitario * item.cantidad).toLocaleString()}
                        </p>
                      </div>
                      <div className="pos-cart-item-controls">
                        <button
                          className="pos-qty-btn"
                          onClick={() => { triggerHaptic('light'); onUpdateQty(item.id, -1); }}
                          aria-label="Quitar"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="pos-qty-num">{item.cantidad}</span>
                        <button
                          className="pos-qty-btn"
                          onClick={() => { triggerHaptic('light'); onUpdateQty(item.id, 1); }}
                          aria-label="Agregar"
                        >
                          <Plus size={12} />
                        </button>
                        <button
                          className="pos-remove-btn"
                          onClick={() => { triggerHaptic('medium'); onRemoveItem(item.id); }}
                          aria-label="Eliminar"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              {cart.length > 0 && (
                <div className="pos-cart-footer">
                  <div className="pos-cart-total-row">
                    <span>Total</span>
                    <strong>${cartTotal.toLocaleString()}</strong>
                  </div>
                  <button
                    className="pos-checkout-btn"
                    onClick={() => { triggerHaptic('success'); onOpenCheckout(); }}
                  >
                    <span>Confirmar Pedido</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Mobile bottom bar when on menu tab and cart has items */}
        {mobileTab === 'menu' && cartCount > 0 && (
          <div className="pos-mobile-cart-bar" onClick={() => setMobileTab('pedido')}>
            <span>{cartCount} {cartCount === 1 ? 'item' : 'items'} · ${cartTotal.toLocaleString()}</span>
            <span className="pos-mobile-cart-bar-action">
              Ver pedido <ChevronRight size={16} />
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
