import React, { useState, useMemo, useCallback } from 'react';
import {
  X, Plus, Minus, Trash2, Sparkles,
  ArrowRight, ChevronRight, ShoppingBag, Clock
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

/* ─── DESKTOP: Mobile tab state kept for backward compat only ─── */
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
  // Desktop tab selector kept for desktop view; not used on mobile
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

  // All products flat list for mobile upsell scroller (no category filter)
  const allProductsForScroller = useMemo(() => {
    const platosSugg = platos.slice(0, 8);
    const reventaSugg = reventa.slice(0, 4);
    return { platosSugg, reventaSugg };
  }, [platos, reventa]);

  const handleQuickAdd = useCallback((plato: ProductoElaborado) => {
    triggerHaptic('light');
    if (plato.es_personalizable) {
      onSelectPlatoParaPersonalizar(plato);
    } else {
      onQuickAdd(plato);
    }
  }, [onQuickAdd, onSelectPlatoParaPersonalizar]);

  if (!isOpen) return null;

  return (
    <div className="pos-backdrop" onClick={onClose}>
      <div className="pos-modal" onClick={e => e.stopPropagation()}>

        {/* ═══════════════════════════════════════════════════
            DESKTOP LAYOUT (≥769px): unchanged POS experience
            ═══════════════════════════════════════════════════ */}

        {/* Header — shared on both */}
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

        {/* Mobile tab switcher — DESKTOP ONLY (hidden on mobile) */}
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

        {/* ── Desktop Body: menu + cart side by side ── */}
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
                    onClick={() => handleQuickAdd(plato)}
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
                    onClick={() => { triggerHaptic('light'); onQuickAddReventa(r); }}
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

          {/* ─── Cart Panel (DESKTOP) ──────────────────────── */}
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

              {/* Desktop Footer */}
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

        {/* Desktop bottom cart bar (menu tab + items in cart) */}
        {mobileTab === 'menu' && cartCount > 0 && (
          <div className="pos-mobile-cart-bar" onClick={() => setMobileTab('pedido')}>
            <span>{cartCount} {cartCount === 1 ? 'item' : 'items'} · ${cartTotal.toLocaleString()}</span>
            <span className="pos-mobile-cart-bar-action">
              Ver pedido <ChevronRight size={16} />
            </span>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            MOBILE CART VIEW (≤768px)
            Full-screen, single-view cart with upsell scroller
            ═══════════════════════════════════════════════════ */}
        <div className="mobile-cart-fullview">
          {/* Mobile Header */}
          <div className="mcart-header">
            <div className="mcart-header-brand">
              <div>
                <span className="mcart-brand-name">NALÚ</span>
                <span className="mcart-brand-sub">Nalú Poke Bowls · Tacuarembó</span>
              </div>
            </div>
            <div className="mcart-header-right">
              <div className="mcart-status-badge">
                <span className="mcart-status-dot" />
                Abierto ahora
              </div>
              <button onClick={onClose} className="mcart-close-btn" aria-label="Cerrar">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Mobile subheader: "Tu Pedido" + count */}
          <div className="mcart-subheader">
            <div className="mcart-title-row">
              <h1 className="mcart-title">Tu Pedido</h1>
              {cartCount > 0 && (
                <span className="mcart-count-badge">{cartCount}</span>
              )}
            </div>
            <div className="mcart-delivery-row">
              <span className="mcart-delivery-icon"><Clock size={14} /></span>
              <span className="mcart-delivery-text">Entrega en Tacuarembó · 30–45 min</span>
            </div>
          </div>

          {/* Mobile scrollable content */}
          <div className="mcart-scroll-body">

            {/* ── Cart Items List ── */}
            {cart.length === 0 ? (
              <div className="mcart-empty-state">
                <ShoppingBag size={40} strokeWidth={1.5} />
                <p className="mcart-empty-title">Tu pedido está vacío</p>
                <span className="mcart-empty-sub">Elegí tus platos favoritos de abajo ↓</span>
              </div>
            ) : (
              <div className="mcart-items-section">
                <div className="mcart-section-header">
                  <span className="mcart-section-label">PRODUCTOS AÑADIDOS</span>
                  <button
                    className="mcart-clear-btn"
                    onClick={() => { triggerHaptic('medium'); cart.forEach(i => onRemoveItem(i.id)); }}
                  >
                    Vaciar
                  </button>
                </div>

                <div className="mcart-items-list">
                  {cart.map(item => (
                    <div key={item.id} className="mcart-item-card">
                      <div className="mcart-item-inner">
                        {/* Thumbnail */}
                        {item.imagen_url ? (
                          <img
                            src={item.imagen_url}
                            alt={item.nombre}
                            className="mcart-item-thumb"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <div className="mcart-item-thumb mcart-item-thumb--placeholder">🥗</div>
                        )}

                        {/* Info */}
                        <div className="mcart-item-info">
                          {item.modificadores && item.modificadores.length > 0 ? (
                            <span className="mcart-item-badge mcart-item-badge--custom">✨ Personalizado</span>
                          ) : (
                            <span className="mcart-item-badge">{item.categoria === 'Bebidas' ? '🥤 Bebida' : '🥗 ' + (item.categoria || 'Plato')}</span>
                          )}
                          <h3 className="mcart-item-name">{item.nombre}</h3>
                          {item.modificadores && item.modificadores.length > 0 && (
                            <p className="mcart-item-mods">
                              {item.modificadores.slice(0, 3).map(m => m.nombre).join(', ')}
                              {item.modificadores.length > 3 && ` +${item.modificadores.length - 3} más`}
                            </p>
                          )}
                          <div className="mcart-item-footer">
                            <span className="mcart-item-price">
                              ${(item.precio_unitario * item.cantidad).toLocaleString()}
                            </span>
                            <div className="mcart-item-actions">
                              {/* Qty controls */}
                              <div className="mcart-qty-row">
                                <button
                                  className="mcart-qty-btn"
                                  onClick={() => { triggerHaptic('light'); onUpdateQty(item.id, -1); }}
                                  aria-label="Quitar uno"
                                >–</button>
                                <span className="mcart-qty-num">{item.cantidad}</span>
                                <button
                                  className="mcart-qty-btn"
                                  onClick={() => { triggerHaptic('light'); onUpdateQty(item.id, 1); }}
                                  aria-label="Agregar uno"
                                >+</button>
                              </div>
                              {/* Remove */}
                              <button
                                className="mcart-remove-btn"
                                onClick={() => { triggerHaptic('medium'); onRemoveItem(item.id); }}
                                aria-label="Eliminar producto"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Upsell Horizontal Scroller ── */}
            <div className="mcart-upsell-section">
              <div className="mcart-upsell-header">
                <span className="mcart-upsell-title">¿Querés agregar algo más?</span>
                <span className="mcart-upsell-sub">Deslizá →</span>
              </div>

              <div className="mcart-upsell-scroller">
                {/* Platos */}
                {allProductsForScroller.platosSugg.map(plato => (
                  <button
                    key={`upsell_${plato.producto_elaborado_id}`}
                    className={`mcart-upsell-card ${plato.es_personalizable ? 'mcart-upsell-card--armar' : ''}`}
                    onClick={() => handleQuickAdd(plato)}
                  >
                    <div className="mcart-upsell-img-wrap">
                      <img
                        src={plato.imagen_url || './hero_bandejas_nalu.jpg'}
                        alt={plato.nombre}
                        className="mcart-upsell-img"
                        loading="lazy"
                      />
                      {plato.es_personalizable && (
                        <span className="mcart-upsell-spark"><Sparkles size={9} /></span>
                      )}
                    </div>
                    <div className="mcart-upsell-body">
                      <span className="mcart-upsell-cat">
                        {plato.es_personalizable ? '✨ Personalizable' : (CATEGORY_EMOJIS[plato.categoria] || '🍽️') + ' ' + (plato.categoria || 'Plato')}
                      </span>
                      <p className="mcart-upsell-name">{plato.nombre}</p>
                      <p className="mcart-upsell-price">${Number(plato.precio_venta).toLocaleString()}</p>
                    </div>
                    <div className="mcart-upsell-add-row">
                      <span className="mcart-upsell-add-btn">
                        {plato.es_personalizable ? '✦ Armar' : '+ Agregar'}
                      </span>
                    </div>
                  </button>
                ))}

                {/* Bebidas */}
                {allProductsForScroller.reventaSugg.map(r => (
                  <button
                    key={`upsell_rev_${r.producto_reventa_id}`}
                    className="mcart-upsell-card"
                    onClick={() => { triggerHaptic('light'); onQuickAddReventa(r); }}
                  >
                    <div className="mcart-upsell-img-wrap">
                      <img
                        src={r.imagen_url || './hero_bandejas_nalu.jpg'}
                        alt={r.nombre}
                        className="mcart-upsell-img"
                        loading="lazy"
                      />
                    </div>
                    <div className="mcart-upsell-body">
                      <span className="mcart-upsell-cat mcart-upsell-cat--drink">🥤 Bebidas</span>
                      <p className="mcart-upsell-name">{r.nombre}</p>
                      <p className="mcart-upsell-price">${Number(r.precio_venta).toLocaleString()}</p>
                    </div>
                    <div className="mcart-upsell-add-row">
                      <span className="mcart-upsell-add-btn mcart-upsell-add-btn--drink">+ Agregar</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Order summary ── */}
            {cart.length > 0 && (
              <div className="mcart-summary-card">
                <h3 className="mcart-summary-title">Resumen</h3>
                <div className="mcart-summary-row">
                  <span>Subtotal ({cartCount} {cartCount === 1 ? 'ítem' : 'ítems'})</span>
                  <span>${cartTotal.toLocaleString()}</span>
                </div>
                <div className="mcart-summary-row mcart-summary-row--note">
                  <span>Envío</span>
                  <span>Se calcula al confirmar</span>
                </div>
                <div className="mcart-summary-divider" />
                <div className="mcart-summary-row mcart-summary-total">
                  <span>Total estimado</span>
                  <strong>${cartTotal.toLocaleString()}</strong>
                </div>
              </div>
            )}

            <p className="mcart-note">Podrás agregar notas o instrucciones especiales en el siguiente paso.</p>

            {/* Extra padding so content clears the sticky footer */}
            <div style={{ height: cart.length > 0 ? 110 : 24 }} />
          </div>

          {/* ── Sticky Checkout Footer ── */}
          {cart.length > 0 && (
            <div className="mcart-sticky-footer">
              <div className="mcart-footer-total-row">
                <span className="mcart-footer-total-label">Total</span>
                <span className="mcart-footer-total-amount">${cartTotal.toLocaleString()}</span>
              </div>
              <button
                className="mcart-checkout-btn"
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
  );
};
