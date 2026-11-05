import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChefHat, Bike, CheckCircle2, Package, X, Paperclip, Loader2, Clock, ChevronRight } from 'lucide-react';
import { FOOD_BACKEND_URL, uploadComprobanteTransferencia } from '../services/api';

// ─── Tipos ────────────────────────────────────────────────────────────────────

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type EstadoPedido = 'esperando_confirmacion' | 'en_cocina' | 'listo' | 'en_camino' | 'abierto';

export interface PedidoActivo {
  pedido_id: number;
  numero_orden: number;
  tipo_pedido: 'delivery' | 'takeaway' | 'salon';
  estado: EstadoPedido;
  created_at: string;
  enviado_cocina_at: string | null;
  listo_cocina_at: string | null;
  metodo_pago?: string;
  pagado?: boolean;
  comprobante_url?: string | null;
  estado_pago?: string;
}

// ─── Configuración de estados ─────────────────────────────────────────────────

const ESTADOS_CONFIG: Record<
  EstadoPedido,
  { label: string; shortLabel: string; sublabel: string; icon: React.ReactNode; colorClass: string; step: number }
> = {
  esperando_confirmacion: {
    label: 'Esperando confirmación de cocina...',
    shortLabel: 'Procesando ⏳',
    sublabel: 'Tu orden fue enviada. Esperando ingreso a cocina…',
    icon: <Clock size={18} className="osb-spin" />,
    colorClass: 'osb-estado-esperando',
    step: 0,
  },
  abierto: {
    label: 'Pedido recibido',
    shortLabel: 'Recibido 📦',
    sublabel: 'Estamos preparando tu orden…',
    icon: <Package size={18} />,
    colorClass: 'osb-estado-abierto',
    step: 0,
  },
  en_cocina: {
    label: 'En cocina 🔥',
    shortLabel: 'Cocina 🔥',
    sublabel: 'Nuestro equipo está preparando tu pedido',
    icon: <ChefHat size={18} />,
    colorClass: 'osb-estado-cocina',
    step: 1,
  },
  listo: {
    label: '¡Tu pedido está listo! 🎉',
    shortLabel: 'Listo 🎉',
    sublabel: 'Ya terminamos de preparar tu orden. ¡Saliendo para vos!',
    icon: <CheckCircle2 size={18} />,
    colorClass: 'osb-estado-listo',
    step: 2,
  },
  en_camino: {
    label: '¡Tu pedido está en camino! 🛵',
    shortLabel: 'En camino 🛵',
    sublabel: 'Ya salió para tu dirección. ¡Llegamos pronto!',
    icon: <Bike size={18} />,
    colorClass: 'osb-estado-camino',
    step: 3,
  },
};

const POLL_INTERVAL_MS = 20_000; // 20 segundos

// ─── Helpers de Caché Local Inteligente ───────────────────────────────────────
function getRecentCachedOrders(): PedidoActivo[] {
  try {
    const raw = localStorage.getItem('nalu_recent_orders');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const list: PedidoActivo[] = Array.isArray(parsed) ? parsed : [parsed];
    const now = Date.now();
    const threeHours = 3 * 60 * 60 * 1000;
    return list.filter(item => {
      if (!item || !item.numero_orden) return false;
      const createdAt = item.created_at ? new Date(item.created_at).getTime() : now;
      return now - createdAt < threeHours && (item.estado as string) !== 'entregado' && (item.estado as string) !== 'cancelado';
    });
  } catch {
    return [];
  }
}

// ─── Componente principal ─────────────────────────────────────────────────────

interface OrderStatusBannerProps {
  onOpenMisPedidos?: () => void;
  onPedidosChange?: (pedidos: PedidoActivo[]) => void;
}

export const OrderStatusBanner: React.FC<OrderStatusBannerProps> = ({ onOpenMisPedidos, onPedidosChange }) => {
  // Inicialización instantánea desde la memoria caché del navegador (0ms de retraso)
  const initialCache = getRecentCachedOrders();
  const [pedidos, setPedidos] = useState<PedidoActivo[]>(initialCache);
  const [selectedPedidoId, setSelectedPedidoId] = useState<number | null>(() => initialCache[0]?.pedido_id || null);
  const [, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(() => initialCache.length > 0);
  const [animatingOut, setAnimatingOut] = useState(false);
  const [uploadingComprobante, setUploadingComprobante] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevCountRef = useRef<number>(initialCache.length);

  // Notificar al componente padre de los pedidos en caché inicial
  useEffect(() => {
    if (initialCache.length > 0) {
      onPedidosChange?.(initialCache);
    }
  }, []); // eslint-disable-line

  // Obtener email del usuario logueado con Google o de datos de perfil
  const getEmail = useCallback((): string | null => {
    try {
      const g = localStorage.getItem('nalu_google_user');
      if (g) {
        const parsed = JSON.parse(g);
        if (parsed?.email) return parsed.email;
      }
      const p = localStorage.getItem('nalu_customer_profile');
      if (p) {
        const parsed = JSON.parse(p);
        if (parsed?.email) return parsed.email;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  // Obtener teléfono del usuario para consultar pedidos sin login de Google
  const getTelefono = useCallback((): string | null => {
    try {
      const p = localStorage.getItem('nalu_customer_profile');
      if (p) {
        const parsed = JSON.parse(p);
        if (parsed?.telefono) return parsed.telefono;
      }
      const raw = localStorage.getItem('nalu_recent_orders');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed[0]?.telefono) return parsed[0].telefono;
        if (parsed?.telefono) return parsed.telefono;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  // Obtener primer nombre del usuario
  const getFirstName = useCallback((): string | null => {
    try {
      const g = localStorage.getItem('nalu_google_user');
      if (g) {
        const parsed = JSON.parse(g);
        const fullName: string = parsed?.name || parsed?.given_name || '';
        if (fullName) return fullName.split(' ')[0] || null;
      }
      const p = localStorage.getItem('nalu_customer_profile');
      if (p) {
        const parsed = JSON.parse(p);
        if (parsed?.nombre) return parsed.nombre.split(' ')[0] || null;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const fetchEstado = useCallback(async () => {
    const email = getEmail();
    const tel = getTelefono();

    // Si no tenemos ni email ni teléfono pero hay caché local activa, mantenemos visible la caché
    if (!email && !tel) {
      const cached = getRecentCachedOrders();
      if (cached.length > 0) {
        setPedidos(cached);
        setVisible(true);
        onPedidosChange?.(cached);
      }
      return;
    }

    try {
      const params = new URLSearchParams({ tenant_id: '1' });
      if (email) params.set('email', email);
      if (tel) params.set('telefono', tel);

      const url = `${FOOD_BACKEND_URL}/api/public/pedido-estado?${params.toString()}`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) return;

      const data = await res.json();
      const lista: PedidoActivo[] = data.pedidos || (data.pedido ? [data.pedido] : []);

      if (lista.length === 0) {
        // Si el backend no devolvió pedidos pero en memoria local hay un pedido de menos de 10 minutos, lo preservamos
        const cached = getRecentCachedOrders();
        const reciente = cached.filter(c => Date.now() - new Date(c.created_at).getTime() < 10 * 60 * 1000);
        if (reciente.length > 0) {
          setPedidos(reciente);
          setVisible(true);
          onPedidosChange?.(reciente);
          return;
        }

        // No hay pedidos activos → ocultar con animación suave
        if (pedidos.length > 0) {
          setAnimatingOut(true);
          setTimeout(() => {
            setPedidos([]);
            setSelectedPedidoId(null);
            setVisible(false);
            setAnimatingOut(false);
            onPedidosChange?.([]);
            try { localStorage.removeItem('nalu_recent_orders'); } catch {}
          }, 500);
        }
        return;
      }

      // Guardar lista sincronizada en la memoria caché inteligente
      try {
        localStorage.setItem('nalu_recent_orders', JSON.stringify(lista));
      } catch {}

      onPedidosChange?.(lista);

      // Si entró un nuevo pedido, des-descartar y seleccionar el más reciente
      if (lista.length !== prevCountRef.current) {
        prevCountRef.current = lista.length;
        setDismissed(false);
        setAnimatingOut(false);
      }

      setPedidos(lista);
      setSelectedPedidoId(prev => {
        if (prev && lista.some(p => p.pedido_id === prev)) {
          return prev;
        }
        return lista[0].pedido_id;
      });
      setVisible(true);
    } catch (err) {
      // Silencioso
    } finally {
      setLoading(false);
    }
  }, [getEmail, getTelefono, onPedidosChange, pedidos.length]);

  // Polling continuo con el backend
  useEffect(() => {
    fetchEstado();

    intervalRef.current = setInterval(fetchEstado, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []); // eslint-disable-line

  // Sincronización instantánea ante nuevos pedidos emitidos en la misma pestaña
  useEffect(() => {
    const handler = (e: any) => {
      const detail = e?.detail;
      const cached = getRecentCachedOrders();
      if (detail && detail.numero_orden) {
        const itemNuevo: PedidoActivo = {
          pedido_id: detail.pedido_id || detail.numero_orden,
          numero_orden: detail.numero_orden,
          tipo_pedido: detail.tipo_pedido || 'delivery',
          estado: detail.estado || 'esperando_confirmacion',
          created_at: detail.created_at || new Date().toISOString(),
          enviado_cocina_at: detail.enviado_cocina_at || null,
          listo_cocina_at: null,
          metodo_pago: detail.metodo_pago,
        };

        const listSinDupl = cached.filter(p => p.numero_orden !== itemNuevo.numero_orden);
        const updated = [itemNuevo, ...listSinDupl];
        try { localStorage.setItem('nalu_recent_orders', JSON.stringify(updated)); } catch {}
        setPedidos(updated);
        setSelectedPedidoId(itemNuevo.pedido_id);
        setVisible(true);
        setDismissed(false);
        onPedidosChange?.(updated);
      } else if (cached.length > 0) {
        setPedidos(cached);
        setVisible(true);
        setDismissed(false);
        onPedidosChange?.(cached);
      }
      fetchEstado();
    };

    window.addEventListener('nalu:order_status_updated', handler);
    window.addEventListener('nalu:order_synced', handler);
    return () => {
      window.removeEventListener('nalu:order_status_updated', handler);
      window.removeEventListener('nalu:order_synced', handler);
    };
  }, [fetchEstado, onPedidosChange]);

  // Escuchar cambios en localStorage (el usuario se loguea en otra pestaña)
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === 'nalu_google_user' || e.key === 'nalu_recent_orders') {
        fetchEstado();
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [fetchEstado]);

  // Escuchar evento de login en la misma pestaña
  useEffect(() => {
    const handler = () => {
      fetchEstado();
    };
    window.addEventListener('nalu:google-login', handler);
    return () => window.removeEventListener('nalu:google-login', handler);
  }, [fetchEstado]);

  const handleDismiss = () => {
    setAnimatingOut(true);
    setTimeout(() => {
      setDismissed(true);
      setAnimatingOut(false);
    }, 400);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentPedido) return;

    setUploadingComprobante(true);
    const res = await uploadComprobanteTransferencia(currentPedido.pedido_id, file);
    setUploadingComprobante(false);

    if (res.success && res.comprobante_url) {
      setPedidos(prev =>
        prev.map(p =>
          p.pedido_id === currentPedido.pedido_id
            ? { ...p, comprobante_url: res.comprobante_url }
            : p
        )
      );
    }
  };

  // Mostrar si hay pedidos, no fue descartado y es visible (sin importar si tiene Google login)
  if (pedidos.length === 0 || dismissed || !visible) {
    return null;
  }

  // Pedido actualmente enfocado
  const currentPedido = pedidos.find(p => p.pedido_id === selectedPedidoId) || pedidos[0];
  const config = ESTADOS_CONFIG[currentPedido.estado] ?? ESTADOS_CONFIG.en_cocina;
  const totalSteps = currentPedido.tipo_pedido === 'delivery' ? 3 : 2;
  const currentStep = Math.min(config.step, totalSteps);

  // Detect if the order is scheduled for a future kitchen entry (store was closed)
  const enviadoCocinaDate = currentPedido.enviado_cocina_at ? new Date(currentPedido.enviado_cocina_at) : null;
  const isProgramado = enviadoCocinaDate && enviadoCocinaDate.getTime() > Date.now() + 60_000;

  const formatFechaHora = (d: Date): string => {
    const hoy = new Date();
    const esHoy = d.toDateString() === hoy.toDateString();
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);
    const esManana = d.toDateString() === manana.toDateString();
    const hora = d.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit', hour12: false });
    if (esHoy) return `hoy a las ${hora} hs`;
    if (esManana) return `mañana a las ${hora} hs`;
    const dia = d.toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'short' });
    return `${dia} a las ${hora} hs`;
  };

  const sublabelFinal = isProgramado && enviadoCocinaDate
    ? `🕐 Programado para entrar a cocina ${formatFechaHora(enviadoCocinaDate)}`
    : config.sublabel;

  const stepLabels =
    currentPedido.tipo_pedido === 'delivery'
      ? [isProgramado ? '⏰ Programado' : 'Recibido', 'En cocina', 'Listo', 'En camino']
      : [isProgramado ? '⏰ Programado' : 'Recibido', 'En cocina', 'Listo'];

  return (
    <div
      className={`osb-wrapper ${config.colorClass} ${animatingOut ? 'osb-slide-out' : 'osb-slide-in'}`}
      role="status"
      aria-live="polite"
    >
      {/* Selector de pedidos si hay 2 o más */}
      {pedidos.length > 1 && (
        <div className="osb-multi-header">
          <span className="osb-multi-title">Tus pedidos en curso ({pedidos.length}):</span>
          <div className="osb-multi-chips">
            {pedidos.map(p => {
              const pCfg = ESTADOS_CONFIG[p.estado] ?? ESTADOS_CONFIG.en_cocina;
              const isSelected = p.pedido_id === currentPedido.pedido_id;
              return (
                <button
                  key={p.pedido_id}
                  type="button"
                  onClick={() => setSelectedPedidoId(p.pedido_id)}
                  className={`osb-chip ${isSelected ? 'osb-chip-active' : ''} ${pCfg.colorClass}`}
                >
                  <span className="osb-chip-order">#{p.numero_orden}</span>
                  <span className="osb-chip-status">{pCfg.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="osb-inner" onClick={(e) => { if (onOpenMisPedidos && !(e.target as HTMLElement).closest('button, a, input')) { onOpenMisPedidos(); } }} style={onOpenMisPedidos ? { cursor: 'pointer' } : undefined}>
        {/* Ícono + textos */}
        <div className="osb-left">
          <div className="osb-icon-pulse">
            {config.icon}
          </div>
          <div className="osb-texts">
            <div className="osb-header-meta">
              <span className="osb-orden">#{currentPedido.numero_orden}{getFirstName() ? ` · ${getFirstName()}` : ''}</span>
              <span className="osb-tipo-badge">
                {currentPedido.tipo_pedido === 'delivery' ? 'Delivery 🛵' : 'Take Away 🛍️'}
              </span>
              {currentPedido.metodo_pago === 'transferencia' && (
                <div className="osb-comprobante-wrapper">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*,.pdf"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                  {uploadingComprobante ? (
                    <span className="osb-comprobante-loading">
                      <Loader2 size={12} className="osb-spin" /> Subiendo...
                    </span>
                  ) : currentPedido.comprobante_url ? (
                    <div className="osb-comprobante-ok">
                      <a
                        href={currentPedido.comprobante_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="osb-comprobante-link"
                        title="Ver comprobante adjuntado"
                      >
                        <Paperclip size={12} />
                        <span>Comprobante ✓</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="osb-comprobante-change"
                        title="Cambiar archivo"
                      >
                        Cambiar
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="osb-comprobante-btn"
                      title="Adjuntar comprobante de transferencia (foto o PDF)"
                    >
                      <Paperclip size={12} />
                      <span>Adjuntar comprobante</span>
                    </button>
                  )}
                </div>
              )}
            </div>
            <span className="osb-label">{isProgramado ? 'Pedido programado ⏰' : config.label}</span>
            <span className="osb-sublabel">{sublabelFinal}</span>
            {isProgramado && enviadoCocinaDate && (
              <span className="osb-programado-badge">
                <Clock size={11} />
                Entra a cocina {formatFechaHora(enviadoCocinaDate)}
              </span>
            )}
          </div>
        </div>

        {/* Barra de progreso por pasos */}
        <div className="osb-progress-container">
          <div className="osb-steps">
            {stepLabels.map((label, idx) => (
              <div key={idx} className={`osb-step ${idx <= currentStep ? 'osb-step-done' : ''} ${idx === currentStep ? 'osb-step-active' : ''}`}>
                <div className="osb-step-dot">
                  {idx < currentStep && <CheckCircle2 size={10} />}
                  {idx === currentStep && <div className="osb-step-pulse" />}
                </div>
                <span className="osb-step-label">{label}</span>
              </div>
            ))}
          </div>
          <div className="osb-progress-bar-track">
            <div
              className="osb-progress-bar-fill"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {onOpenMisPedidos && (
          <div className="osb-ver-detalle" onClick={onOpenMisPedidos}>
            <span>Ver detalle</span>
            <ChevronRight size={14} />
          </div>
        )}

        {/* Botón cerrar */}
        <button
          className="osb-close"
          onClick={handleDismiss}
          aria-label="Cerrar seguimiento de pedido"
          title="Cerrar (el pedido sigue en curso)"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};
