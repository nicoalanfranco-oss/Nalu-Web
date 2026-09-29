import React from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { CartItem } from '../types/food';
import { triggerHaptic } from '../utils/haptics';

interface CartDrawerProps {
  isOpen: boolean;
  items: CartItem[];
  onClose: () => void;
  onUpdateQty: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onOpenCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  items,
  onClose,
  onUpdateQty,
  onRemoveItem,
  onOpenCheckout,
}) => {
  if (!isOpen) return null;

  const total = items.reduce((acc, it) => acc + it.precio_unitario * it.cantidad, 0);

  return (
    <div className="cart-drawer-backdrop" onClick={onClose}>
      <div className="cart-drawer-content" onClick={e => e.stopPropagation()}>
        <div className="modal-drag-indicator" />
        {/* Cabecera del Carrito */}
        <div className="cart-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShoppingBag size={22} color="var(--primary)" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Tu Pedido Nalú</h3>
          </div>
          <button onClick={onClose} className="modal-close-btn" style={{ position: 'static' }}>
            <X size={18} />
          </button>
        </div>

        {/* Lista de Items */}
        <div className="cart-items-list">
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🥗</div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                Tu carrito está vacío
              </h4>
              <p style={{ fontSize: '0.85rem' }}>
                Descubre nuestros pokes de autor o arma tu bowl a medida para comenzar.
              </p>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="cart-item-card">
                <div className="cart-item-top">
                  <div>
                    <h4 className="cart-item-name">{item.nombre}</h4>
                    {item.notas && (
                      <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '2px' }}>
                        Nota: {item.notas}
                      </p>
                    )}
                  </div>
                  <span className="cart-item-price">
                    ${(item.precio_unitario * item.cantidad).toLocaleString()}
                  </span>
                </div>

                {/* Modificadores / Ingredientes seleccionados */}
                {item.modificadores && item.modificadores.length > 0 && (
                  <div className="cart-item-modifiers">
                    {item.modificadores.map((m, idx) => (
                      <div key={idx}>
                        • {m.nombre} {m.precio_extra > 0 ? `(+$${m.precio_extra})` : ''}
                      </div>
                    ))}
                  </div>
                )}

                {/* Control de cantidad y eliminar */}
                <div className="cart-item-bottom">
                  <div className="qty-counter">
                    <button
                      onClick={() => {
                        triggerHaptic('light');
                        onUpdateQty(item.id, -1);
                      }}
                      className="qty-btn"
                      aria-label="Disminuir cantidad"
                    >
                      <Minus size={14} />
                    </button>
                    <span style={{ fontSize: '0.88rem', fontWeight: 800 }}>{item.cantidad}</span>
                    <button
                      onClick={() => {
                        triggerHaptic('light');
                        onUpdateQty(item.id, 1);
                      }}
                      className="qty-btn"
                      aria-label="Aumentar cantidad"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      triggerHaptic('medium');
                      onRemoveItem(item.id);
                    }}
                    style={{ color: 'var(--text-subtle)', padding: '6px' }}
                    title="Eliminar producto"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer con Subtotal y Checkout */}
        {items.length > 0 && (
          <div className="cart-drawer-footer">
            <div className="cart-subtotal-row">
              <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Subtotal:</span>
              <span>${total.toLocaleString()}</span>
            </div>

            <button
              onClick={() => {
                triggerHaptic('success');
                onOpenCheckout();
              }}
              className="btn-primary"
              style={{ width: '100%', padding: '14px' }}
            >
              <span>Continuar al Checkout</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
