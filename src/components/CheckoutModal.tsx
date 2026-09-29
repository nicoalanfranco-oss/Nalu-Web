import React, { useState } from 'react';
import { X, CheckCircle, Bike, Store, ArrowRight, ShieldCheck, Send } from 'lucide-react';
import { CartItem, OrderCustomerInfo } from '../types/food';
import { sendOrderToFood } from '../services/api';

interface CheckoutModalProps {
  isOpen: boolean;
  items: CartItem[];
  onClose: () => void;
  onOrderSuccess: (orderNumber: number) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  items,
  onClose,
  onOrderSuccess,
}) => {
  if (!isOpen) return null;

  const [tipoEntrega, setTipoEntrega] = useState<'delivery' | 'takeaway'>('delivery');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [apartamento, setApartamento] = useState('');
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'transferencia' | 'pos_tarjeta'>('efectivo');
  const [pagaCon, setPagaCon] = useState('');
  const [notas, setNotas] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const subtotal = items.reduce((acc, it) => acc + it.precio_unitario * it.cantidad, 0);
  const costoEnvio = tipoEntrega === 'delivery' ? 50 : 0;
  const total = subtotal + costoEnvio;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setErrorMsg('Por favor ingresa tu nombre');
      return;
    }
    if (!telefono.trim()) {
      setErrorMsg('Por favor ingresa tu número de teléfono / WhatsApp');
      return;
    }
    if (tipoEntrega === 'delivery' && !direccion.trim()) {
      setErrorMsg('Por favor ingresa tu dirección de entrega');
      return;
    }

    setEnviando(true);
    setErrorMsg('');

    try {
      // Estructura adaptada al POS de Food (tenant_id: 1, marca_id: 1)
      const payload = {
        tenant_id: 1,
        marca_id: 1,
        tipo_pedido: tipoEntrega === 'delivery' ? 'delivery' : 'mostrador',
        canal: tipoEntrega === 'delivery' ? 'delivery' : 'take_away',
        nombre_cliente_rapido: nombre.trim(),
        comensales: 1,
        datos_delivery: {
          telefono: telefono.trim(),
          direccion: direccion.trim(),
          apartamento: apartamento.trim(),
          costo_envio: costoEnvio,
          metodo_pago: metodoPago,
          paga_con: pagaCon.trim(),
        },
        notas: notas.trim(),
        items: items.map(it => ({
          tipo_item: it.tipo,
          producto_elaborado_id: it.tipo === 'elaborado' ? it.producto_id : null,
          producto_reventa_id: it.tipo === 'reventa' ? it.producto_id : null,
          nombre_producto: it.nombre,
          cantidad: it.cantidad,
          precio_unitario: it.precio_unitario,
          subtotal: it.precio_unitario * it.cantidad,
          notas_cocina: it.notas || null,
          modificadores: it.modificadores.map(m => ({
            opcion_id: m.opcion_id,
            nombre: m.nombre,
            precio_extra: m.precio_extra,
            costo_extra: 0,
          })),
        })),
      };

      const res = await sendOrderToFood(payload);

      if (res.success) {
        onOrderSuccess(res.numero_orden || 101);
      } else {
        setErrorMsg('No se pudo registrar el pedido en el sistema. Intenta de nuevo.');
      }
    } catch (err: any) {
      setErrorMsg('Error de conexión al enviar el pedido.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Confirmar Pedido</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Completa tus datos para enviarlo directo a cocina
            </p>
          </div>
          <button onClick={onClose} className="modal-close-btn" style={{ position: 'static' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {errorMsg && (
            <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', fontWeight: 600 }}>
              {errorMsg}
            </div>
          )}

          {/* Tipo de entrega */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <button
              type="button"
              onClick={() => setTipoEntrega('delivery')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                border: '1.5px solid',
                borderColor: tipoEntrega === 'delivery' ? 'var(--primary)' : 'var(--border-light)',
                background: tipoEntrega === 'delivery' ? 'var(--primary-light)' : 'var(--bg-card)',
                color: tipoEntrega === 'delivery' ? 'var(--primary)' : 'var(--text-main)',
                fontWeight: 700,
                fontSize: '0.9rem',
              }}
            >
              <Bike size={18} />
              <span>Delivery ($50)</span>
            </button>

            <button
              type="button"
              onClick={() => setTipoEntrega('takeaway')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                border: '1.5px solid',
                borderColor: tipoEntrega === 'takeaway' ? 'var(--primary)' : 'var(--border-light)',
                background: tipoEntrega === 'takeaway' ? 'var(--primary-light)' : 'var(--bg-card)',
                color: tipoEntrega === 'takeaway' ? 'var(--primary)' : 'var(--text-main)',
                fontWeight: 700,
                fontSize: '0.9rem',
              }}
            >
              <Store size={18} />
              <span>Retiro en Local</span>
            </button>
          </div>

          {/* Datos de contacto */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px', display: 'block' }}>
                Tu Nombre y Apellido *
              </label>
              <input
                type="text"
                required
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Ej: Nicolás Franco"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1.5px solid var(--border-light)',
                  outline: 'none',
                  fontSize: '0.9rem',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px', display: 'block' }}>
                Teléfono / WhatsApp *
              </label>
              <input
                type="tel"
                required
                value={telefono}
                onChange={e => setTelefono(e.target.value)}
                placeholder="Ej: 099 123 456"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1.5px solid var(--border-light)',
                  outline: 'none',
                  fontSize: '0.9rem',
                }}
              />
            </div>

            {tipoEntrega === 'delivery' && (
              <>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px', display: 'block' }}>
                    Dirección de Envío *
                  </label>
                  <input
                    type="text"
                    required
                    value={direccion}
                    onChange={e => setDireccion(e.target.value)}
                    placeholder="Calle, número de puerta e intersección"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: '1.5px solid var(--border-light)',
                      outline: 'none',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px', display: 'block' }}>
                    Apartamento / Timbre / Referencia
                  </label>
                  <input
                    type="text"
                    value={apartamento}
                    onChange={e => setApartamento(e.target.value)}
                    placeholder="Ej: Apto 402, reja blanca"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: '1.5px solid var(--border-light)',
                      outline: 'none',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>
              </>
            )}

            {/* Método de Pago */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', display: 'block' }}>
                Método de Pago
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {[
                  { id: 'efectivo', label: 'Efectivo' },
                  { id: 'pos_tarjeta', label: 'POS Tarjeta' },
                  { id: 'transferencia', label: 'Transferencia' },
                ].map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setMetodoPago(p.id as any)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1.5px solid',
                      borderColor: metodoPago === p.id ? 'var(--primary)' : 'var(--border-light)',
                      background: metodoPago === p.id ? 'var(--primary-light)' : 'var(--bg-card)',
                      color: metodoPago === p.id ? 'var(--primary)' : 'var(--text-body)',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {metodoPago === 'efectivo' && (
              <div>
                <input
                  type="text"
                  value={pagaCon}
                  onChange={e => setPagaCon(e.target.value)}
                  placeholder="¿Con cuánto abonas? (para llevarte cambio)"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1.5px solid var(--border-light)',
                    fontSize: '0.82rem',
                  }}
                />
              </div>
            )}
          </div>

          {/* Resumen Final */}
          <div style={{ background: 'var(--bg-page)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Subtotal:</span>
              <span>${subtotal.toLocaleString()}</span>
            </div>
            {tipoEntrega === 'delivery' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Envío a domicilio:</span>
                <span>${costoEnvio.toLocaleString()}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: 900, marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-light)' }}>
              <span>Total a Pagar:</span>
              <span style={{ color: 'var(--primary)' }}>${total.toLocaleString()}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={enviando}
            className="btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
          >
            {enviando ? (
              <span>Enviando comanda a cocina...</span>
            ) : (
              <>
                <Send size={18} />
                <span>Confirmar y Enviar Pedido</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
