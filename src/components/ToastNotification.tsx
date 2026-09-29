import React, { useEffect } from 'react';
import { ShoppingBag, ArrowRight, X } from 'lucide-react';

export interface ToastData {
  id: string;
  title: string;
  subtitle: string;
  image?: string;
  price?: number;
}

interface ToastNotificationProps {
  toast: ToastData | null;
  onClose: () => void;
  onOpenCart: () => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  toast,
  onClose,
  onOpenCart,
}) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <div className="toast-notification-wrapper" role="status" aria-live="polite">
      <div className="toast-notification-card">
        {toast.image ? (
          <img src={toast.image} alt={toast.title} className="toast-img" />
        ) : (
          <div className="toast-icon-box">
            <ShoppingBag size={20} />
          </div>
        )}

        <div className="toast-content">
          <div className="toast-header-row">
            <h4 className="toast-title">{toast.title}</h4>
            {toast.price !== undefined && (
              <span className="toast-price">${toast.price}</span>
            )}
          </div>
          <p className="toast-subtitle">{toast.subtitle}</p>
        </div>

        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenCart();
          }}
          className="toast-action-btn"
          title="Ver Carrito"
        >
          <span>Ver</span>
          <ArrowRight size={14} />
        </button>

        <button
          type="button"
          onClick={onClose}
          className="toast-close-btn"
          aria-label="Cerrar notificación"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
