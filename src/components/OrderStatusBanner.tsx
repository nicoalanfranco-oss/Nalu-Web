import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChefHat, Bike, CheckCircle2, Package, X } from 'lucide-react';
import { FOOD_BACKEND_URL } from '../services/api';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type EstadoPedido = 'en_cocina' | 'listo' | 'en_camino' | 'abierto';

interface PedidoActivo {
  pedido_id: number;
  numero_orden: number;
  tipo_pedido: 'delivery' | 'takeaway' | 'salon';
  estado: EstadoPedido;
  created_at: string;
  listo_cocina_at: string | null;
}

// ─── Configuración de estados ─────────────────────────────────────────────────

const ESTADOS_CONFIG: Record<
  EstadoPedido,
  { label: string; shortLabel: string; sublabel: string; icon: React.ReactNode; colorClass: string; step: number }
> = {
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

const POLL_INTERVAL_MS = 30_000; // 30 segundos

// ─── Componente principal ─────────────────────────────────────────────────────

export const OrderStatusBanner: React.FC = () => {
  const [pedidos, setPedidos] = useState<PedidoActivo[]>([]);
  const [selectedPedidoId, setSelectedPedidoId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);
  const [animatingOut, setAnimatingOut] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevCountRef = useRef<number>(0);

  // Obtener email del usuario logueado con Google
  const getEmail = useCallback((): string | null => {
    try {
      const g = localStorage.getItem('nalu_google_user');
      if (!g) return null;
      const parsed = JSON.parse(g);
      return parsed?.email || null;
    } catch {
      return null;
    }
  }, []);

  const fetchEstado = useCallback(async () => {
    const email = getEmail();
    if (!email) return;

    try {
      const url = `${FOOD_BACKEND_URL}/api/public/pedido-estado?email=${encodeURIComponent(email)}&tenant_id=1`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) return;

      const data = await res.json();
      const lista: PedidoActivo[] = data.pedidos || (data.pedido ? [data.pedido] : []);

      if (lista.length === 0) {
        // No hay pedidos activos → ocultar con animación suave
        if (pedidos.length > 0) {
          setAnimatingOut(true);
          setTimeout(() => {
            setPedidos([]);
            setSelectedPedidoId(null);
            setVisible(false);
            setAnimatingOut(false);
          }, 500);
        }
        return;
      }

      // Si entró un nuevo pedido, des-descartar y seleccionar el más reciente
      if (lista.length !== prevCountRef.current) {
        prevCountRef.current = lista.length;
        setDismissed(false);
        setAnimatingOut(false);
      }

      setPedidos(lista);
      setSelectedPedidoId(prev => {
        // Mantener el seleccionado si aún existe en la lista, sino el primero
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
  }, [getEmail, pedidos.length]);

  // Polling
  useEffect(() => {
    const email = getEmail();
    if (!email) return;

    setLoading(true);
    fetchEstado();

    intervalRef.current = setInterval(fetchEstado, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []); // eslint-disable-line

  // Escuchar cambios en localStorage (el usuario se loguea en otra pestaña)
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === 'nalu_google_user') {
        if (e.newValue) {
          setLoading(true);
          fetchEstado();
          if (!intervalRef.current) {
            intervalRef.current = setInterval(fetchEstado, POLL_INTERVAL_MS);
          }
        } else {
          // Logout: ocultar banner
          setPedidos([]);
          setSelectedPedidoId(null);
          setVisible(false);
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [fetchEstado]);

  // Escuchar evento de login en la misma pestaña
  useEffect(() => {
    const handler = () => {
      setLoading(true);
      fetchEstado();
      if (!intervalRef.current) {
        intervalRef.current = setInterval(fetchEstado, POLL_INTERVAL_MS);
      }
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

  // No mostrar si: no hay email, no hay pedidos, fue descartado, no es visible
  if (!getEmail() || pedidos.length === 0 || dismissed || !visible) {
    return null;
  }

  // Pedido actualmente enfocado
  const currentPedido = pedidos.find(p => p.pedido_id === selectedPedidoId) || pedidos[0];
  const config = ESTADOS_CONFIG[currentPedido.estado] ?? ESTADOS_CONFIG.en_cocina;
  const totalSteps = currentPedido.tipo_pedido === 'delivery' ? 3 : 2;
  const currentStep = Math.min(config.step, totalSteps);

  const stepLabels =
    currentPedido.tipo_pedido === 'delivery'
      ? ['Recibido', 'En cocina', 'Listo', 'En camino']
      : ['Recibido', 'En cocina', 'Listo'];

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

      <div className="osb-inner">
        {/* Ícono + textos */}
        <div className="osb-left">
          <div className="osb-icon-pulse">
            {config.icon}
          </div>
          <div className="osb-texts">
            <div className="osb-header-meta">
              <span className="osb-orden">Pedido #{currentPedido.numero_orden}</span>
              <span className="osb-tipo-badge">
                {currentPedido.tipo_pedido === 'delivery' ? 'Delivery 🛵' : 'Take Away 🛍️'}
              </span>
            </div>
            <span className="osb-label">{config.label}</span>
            <span className="osb-sublabel">{config.sublabel}</span>
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
