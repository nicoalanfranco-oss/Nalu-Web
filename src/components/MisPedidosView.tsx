import React, { useState, useEffect } from 'react';
import {
  ChefHat, Bike, CheckCircle2, Package, Clock, Plus,
  Paperclip, Loader2, AlertCircle, ShoppingBag, ChevronDown, ChevronUp,
  FileText, ArrowRight, Utensils
} from 'lucide-react';
import { PedidoActivo, EstadoPedido } from './OrderStatusBanner';
import { fetchPedidoDetalle, PedidoDetalle, uploadComprobanteTransferencia } from '../services/api';
import { triggerHaptic } from '../utils/haptics';

interface MisPedidosViewProps {
  pedidos: PedidoActivo[];
  email: string | null;
  onArmarNuevoPedido: () => void;
  onRefreshPedidos?: () => void;
}

const ESTADOS_CONFIG: Record<
  EstadoPedido,
  { label: string; sublabel: string; icon: React.ReactNode; color: string; step: number }
> = {
  abierto: {
    label: 'Pedido recibido',
    sublabel: 'Estamos procesando tu orden y asignando cocina',
    icon: <Package size={18} />,
    color: '#0284C7',
    step: 0,
  },
  en_cocina: {
    label: 'En cocina 🔥',
    sublabel: 'Tus pokes están siendo preparados con ingredientes frescos',
    icon: <ChefHat size={18} />,
    color: '#D97706',
    step: 1,
  },
  listo: {
    label: '¡Listo! 🎉',
    sublabel: 'Tu pedido está preparado y empacado con cuidado',
    icon: <CheckCircle2 size={18} />,
    color: '#16A34A',
    step: 2,
  },
  en_camino: {
    label: 'En camino 🛵',
    sublabel: 'El cadete va hacia tu dirección con tu pedido',
    icon: <Bike size={18} />,
    color: '#7C3AED',
    step: 3,
  },
};

const STEPS = ['Recibido', 'En cocina', 'Listo', 'En viaje'];

export const MisPedidosView: React.FC<MisPedidosViewProps> = ({
  pedidos,
  email,
  onArmarNuevoPedido,
}) => {
  const [detallesMap, setDetallesMap] = useState<Record<number, PedidoDetalle>>({});
  const [loadingMap, setLoadingMap] = useState<Record<number, boolean>>({});
  const [expandedId, setExpandedId] = useState<number | null>(pedidos[0]?.pedido_id || null);
  const [uploadingId, setUploadingId] = useState<number | null>(null);

  // Cargar detalles de cada pedido activo
  useEffect(() => {
    if (!email || pedidos.length === 0) return;

    pedidos.forEach(async (p) => {
      if (detallesMap[p.pedido_id] || loadingMap[p.pedido_id]) return;

      setLoadingMap(prev => ({ ...prev, [p.pedido_id]: true }));
      try {
        const detalle = await fetchPedidoDetalle(p.pedido_id, email);
        if (detalle) {
          setDetallesMap(prev => ({ ...prev, [p.pedido_id]: detalle }));
        }
      } catch (err) {
        console.warn('Error cargando detalle de pedido:', err);
      } finally {
        setLoadingMap(prev => ({ ...prev, [p.pedido_id]: false }));
      }
    });
  }, [pedidos, email]);

  // Si cambia la lista de pedidos y no hay ninguno expandido, expandir el primero
  useEffect(() => {
    if (pedidos.length > 0 && (!expandedId || !pedidos.some(p => p.pedido_id === expandedId))) {
      setExpandedId(pedidos[0].pedido_id);
    }
  }, [pedidos, expandedId]);

  const handleUploadComprobante = async (pedidoId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingId(pedidoId);
      triggerHaptic('medium');
      const res = await uploadComprobanteTransferencia(pedidoId, file);
      if (res.success && res.comprobante_url) {
        setDetallesMap(prev => {
          const current = prev[pedidoId];
          if (!current) return prev;
          return {
            ...prev,
            [pedidoId]: { ...current, comprobante_url: res.comprobante_url },
          };
        });
      }
    } catch (err) {
      console.warn('Error subiendo comprobante:', err);
    } finally {
      setUploadingId(null);
    }
  };

  // Estado vacío si no hay pedidos activos
  if (pedidos.length === 0) {
    return (
      <div className="mis-pedidos-empty">
        <div className="mis-pedidos-empty-icon">
          <Clock size={48} strokeWidth={1.5} color="#788C50" />
        </div>
        <h3 className="mis-pedidos-empty-title">No tienes pedidos en curso</h3>
        <p className="mis-pedidos-empty-sub">
          Cuando hagas un pedido vas a poder seguir su preparación en tiempo real y consultar exactamente qué pediste desde acá.
        </p>
        <button
          className="mis-pedidos-cta-btn"
          onClick={() => {
            triggerHaptic('light');
            onArmarNuevoPedido();
          }}
        >
          <Utensils size={16} />
          <span>Explorar la carta y pedir</span>
        </button>
      </div>
    );
  }

  return (
    <div className="mis-pedidos-container">
      {/* Banner explicativo de Nuevo Pedido vs Pedido en curso */}
      <div className="mis-pedidos-notice">
        <div className="mis-pedidos-notice-icon">
          <AlertCircle size={18} color="#D97706" />
        </div>
        <div className="mis-pedidos-notice-body">
          <strong>Tu pedido ya fue enviado a la cocina</strong>
          <span>
            Ya está marchando. Si querés agregar más productos, hacé clic en <em>"Armar nuevo pedido"</em> para enviar una nueva orden.
          </span>
        </div>
        <button
          className="mis-pedidos-notice-action"
          onClick={() => {
            triggerHaptic('light');
            onArmarNuevoPedido();
          }}
        >
          <Plus size={14} />
          <span>Nuevo Pedido</span>
        </button>
      </div>

      {/* Lista de pedidos activos */}
      <div className="mis-pedidos-list">
        {pedidos.map((pedido) => {
          const cfg = ESTADOS_CONFIG[pedido.estado] || ESTADOS_CONFIG.abierto;
          const detalle = detallesMap[pedido.pedido_id];
          const isLoadingDetalle = loadingMap[pedido.pedido_id];
          const isExpanded = expandedId === pedido.pedido_id;

          const createdDate = new Date(pedido.created_at);
          const horaStr = createdDate.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' });

          return (
            <div
              key={pedido.pedido_id}
              className={`mis-pedidos-card ${isExpanded ? 'expanded' : ''}`}
            >
              {/* Header de la tarjeta */}
              <div
                className="mis-pedidos-card-header"
                onClick={() => {
                  triggerHaptic('light');
                  setExpandedId(isExpanded ? null : pedido.pedido_id);
                }}
              >
                <div className="mis-pedidos-card-header-left">
                  <div className="mis-pedidos-badge-orden">
                    #{pedido.numero_orden}
                  </div>
                  <div>
                    <div className="mis-pedidos-card-title-row">
                      <span className="mis-pedidos-card-title">
                        {pedido.tipo_pedido === 'delivery' ? '🛵 Delivery' : '🛍️ Retiro en local'}
                      </span>
                      <span className="mis-pedidos-card-hora">· {horaStr} hs</span>
                    </div>
                    <div className="mis-pedidos-card-estado-text" style={{ color: cfg.color }}>
                      {cfg.icon}
                      <span>{cfg.label}</span>
                    </div>
                  </div>
                </div>

                <div className="mis-pedidos-card-header-right">
                  {detalle && (
                    <span className="mis-pedidos-card-total">
                      ${detalle.total.toLocaleString()} UYU
                    </span>
                  )}
                  <button className="mis-pedidos-expand-btn" aria-label="Expandir">
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>
              </div>

              {/* Stepper de progreso visual */}
              <div className="mis-pedidos-stepper">
                <div className="mis-pedidos-stepper-track">
                  <div
                    className="mis-pedidos-stepper-fill"
                    style={{
                      width: `${(cfg.step / (STEPS.length - 1)) * 100}%`,
                    }}
                  />
                </div>
                <div className="mis-pedidos-steps-labels">
                  {STEPS.map((st, idx) => (
                    <div
                      key={st}
                      className={`mis-pedidos-step-node ${idx <= cfg.step ? 'done' : ''} ${idx === cfg.step ? 'active' : ''}`}
                    >
                      <div className="mis-pedidos-step-dot" />
                      <span>{st}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contenido expandible: Lista de ítems y detalle completo */}
              {isExpanded && (
                <div className="mis-pedidos-card-body">
                  {isLoadingDetalle ? (
                    <div className="mis-pedidos-loading">
                      <Loader2 size={24} className="spin" color="#788C50" />
                      <span>Cargando detalle de productos...</span>
                    </div>
                  ) : detalle ? (
                    <>
                      {/* Subtítulo de items */}
                      <div className="mis-pedidos-items-header">
                        <FileText size={14} />
                        <span>QUÉ PEDISTE EN ESTA ORDEN</span>
                      </div>

                      {/* Lista de productos */}
                      <div className="mis-pedidos-items-list">
                        {detalle.items.map((item, idx) => (
                          <div key={idx} className="mis-pedidos-item-row">
                            <div className="mis-pedidos-item-qty">
                              {item.cantidad}x
                            </div>
                            <div className="mis-pedidos-item-info">
                              <span className="mis-pedidos-item-name">{item.nombre_producto}</span>
                              {item.modificadores && item.modificadores.length > 0 && (
                                <span className="mis-pedidos-item-mods">
                                  {item.modificadores.map(m => m.nombre).join(', ')}
                                </span>
                              )}
                              {item.notas_cocina && (
                                <span className="mis-pedidos-item-nota">
                                  Nota: {item.notas_cocina}
                                </span>
                              )}
                            </div>
                            <div className="mis-pedidos-item-subtotal">
                              ${item.subtotal.toLocaleString()} UYU
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Desglose de totales */}
                      <div className="mis-pedidos-totals-box">
                        <div className="mis-pedidos-total-row">
                          <span>Subtotal</span>
                          <span>${detalle.subtotal.toLocaleString()} UYU</span>
                        </div>
                        {detalle.costo_envio > 0 && (
                          <div className="mis-pedidos-total-row">
                            <span>Envío</span>
                            <span>+${detalle.costo_envio.toLocaleString()} UYU</span>
                          </div>
                        )}
                        <div className="mis-pedidos-total-row total-highlight">
                          <span>Total</span>
                          <span>${detalle.total.toLocaleString()} UYU</span>
                        </div>
                        <div className="mis-pedidos-pago-row">
                          <span>Método de pago:</span>
                          <strong>{detalle.metodo_pago.toUpperCase()}</strong>
                        </div>
                      </div>

                      {/* Adjuntar comprobante si es transferencia */}
                      {detalle.metodo_pago === 'transferencia' && (
                        <div className="mis-pedidos-transfer-box">
                          {detalle.comprobante_url || pedido.comprobante_url ? (
                            <div className="mis-pedidos-comprobante-ok">
                              <CheckCircle2 size={16} color="#16A34A" />
                              <span>Comprobante adjuntado con éxito</span>
                              <a
                                href={detalle.comprobante_url || pedido.comprobante_url || '#'}
                                target="_blank"
                                rel="noreferrer"
                                className="mis-pedidos-view-link"
                              >
                                Ver archivo
                              </a>
                            </div>
                          ) : (
                            <div className="mis-pedidos-comprobante-pending">
                              <Paperclip size={16} color="#D97706" />
                              <div className="mis-pedidos-comprobante-text">
                                <strong>Adjuntar comprobante de pago</strong>
                                <span>Subí captura o foto del comprobante de transferencia</span>
                              </div>
                              <label className="mis-pedidos-upload-btn">
                                {uploadingId === pedido.pedido_id ? (
                                  <Loader2 size={14} className="spin" />
                                ) : (
                                  <>
                                    <Paperclip size={14} />
                                    <span>Subir</span>
                                  </>
                                )}
                                <input
                                  type="file"
                                  accept="image/*,application/pdf"
                                  hidden
                                  disabled={uploadingId === pedido.pedido_id}
                                  onChange={(e) => handleUploadComprobante(pedido.pedido_id, e)}
                                />
                              </label>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="mis-pedidos-error">
                      <span>No se pudo obtener el detalle de productos.</span>
                    </div>
                  )}

                  {/* Botón de acción para armar nuevo pedido */}
                  <div className="mis-pedidos-card-actions">
                    <button
                      className="mis-pedidos-add-btn"
                      onClick={() => {
                        triggerHaptic('light');
                        onArmarNuevoPedido();
                      }}
                    >
                      <Plus size={16} />
                      <span>¿Querés agregar algo más? Armá un nuevo pedido</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
