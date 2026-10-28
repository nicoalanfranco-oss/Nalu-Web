import React, { useState, useEffect, useRef } from 'react';
import {
  X, CheckCircle, Bike, Store, ArrowRight, ShieldCheck, Send,
  MapPin, Navigation, ExternalLink, CreditCard, Banknote, Smartphone,
  Search, Loader2, Check, UserCheck, AlertCircle, Sparkles, Clock
} from 'lucide-react';
import { CartItem, MarcaInfo } from '../types/food';
import { sendOrderToFood, searchAddress, AddressSuggestion } from '../services/api';

const GOOGLE_CLIENT_ID = '713780303554-41bctfqdhvu5nc81sctj1qci2mvekviu.apps.googleusercontent.com';

interface CheckoutModalProps {
  isOpen: boolean;
  items: CartItem[];
  onClose: () => void;
  onOrderSuccess: (orderNumber: number, whatsappUrl: string, metodoPago?: 'efectivo' | 'tarjeta' | 'transferencia', pedidoId?: number) => void;
  marca?: MarcaInfo;
}

interface GoogleUserData {
  email: string;
  name: string;
  picture?: string;
  phone?: string;
  birthday?: string;
  address?: string;
}

function decodeGoogleJwt(token: string): GoogleUserData | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(jsonPayload);
    return {
      email: parsed.email || '',
      name: parsed.name || '',
      picture: parsed.picture || '',
    };
  } catch {
    return null;
  }
}

// Helper inteligente para parsear cualquier formato de fecha libre (DD/MM/AAAA, DDMMYY, DDMMYYYY, DD/MM, D/M/YY, etc.)
export function parseFlexibleDate(val: string): { iso: string; display: string } {
  if (!val) return { iso: '', display: '' };
  const clean = val.trim();
  const digits = clean.replace(/\D/g, '');

  let d: number | null = null;
  let mo: number | null = null;
  let y: number | null = null;

  // 1. Formato ISO: YYYY-MM-DD o YYYY/MM/DD
  let m = clean.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (m) {
    y = parseInt(m[1], 10);
    mo = parseInt(m[2], 10);
    d = parseInt(m[3], 10);
  }

  // 2. Formato con separadores: DD/MM/AAAA o DD-MM-AAAA o DD/MM/YY
  if (!d) {
    m = clean.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
    if (m) {
      d = parseInt(m[1], 10);
      mo = parseInt(m[2], 10);
      let yr = parseInt(m[3], 10);
      if (yr < 100) {
        const cur = new Date().getFullYear() % 100;
        yr = yr > cur ? 1900 + yr : 2000 + yr;
      }
      y = yr;
    }
  }

  // 3. Formato solo números (sin separadores)
  if (!d) {
    if (digits.length === 8) {
      // DDMMYYYY (ej: 05111994)
      d = parseInt(digits.slice(0, 2), 10);
      mo = parseInt(digits.slice(2, 4), 10);
      y = parseInt(digits.slice(4, 8), 10);
    } else if (digits.length === 6) {
      // DDMMYY (ej: 051194 -> día 05, mes 11, año 1994)
      d = parseInt(digits.slice(0, 2), 10);
      mo = parseInt(digits.slice(2, 4), 10);
      let yr = parseInt(digits.slice(4, 6), 10);
      const cur = new Date().getFullYear() % 100;
      yr = yr > cur ? 1900 + yr : 2000 + yr;
      y = yr;
    } else if (digits.length === 4) {
      // DDMM (ej: 0511 -> día 05, mes 11)
      d = parseInt(digits.slice(0, 2), 10);
      mo = parseInt(digits.slice(2, 4), 10);
    }
  }

  // 4. Formato solo día y mes con separadores: DD/MM o D-M
  if (!d) {
    m = clean.match(/^(\d{1,2})[-/.](\d{1,2})$/);
    if (m) {
      d = parseInt(m[1], 10);
      mo = parseInt(m[2], 10);
    }
  }

  // Validación y normalización
  if (d && mo) {
    // Si usuario invirtió día y mes (ej: mes > 12 pero día <= 12)
    if (mo > 12 && d <= 12) {
      const tmp = d;
      d = mo;
      mo = tmp;
    }

    if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31) {
      const dStr = String(d).padStart(2, '0');
      const moStr = String(mo).padStart(2, '0');
      if (y) {
        return { iso: `${y}-${moStr}-${dStr}`, display: `${dStr}/${moStr}/${y}` };
      } else {
        return { iso: `2000-${moStr}-${dStr}`, display: `${dStr}/${moStr}` };
      }
    }
  }

  // Si no se puede reconocer como fecha válida, devolvemos iso vacío para que NUNCA rompa el backend
  return { iso: '', display: clean };
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  items,
  onClose,
  onOrderSuccess,
  marca,
}) => {
  // Cargar perfil guardado previamente en este dispositivo
  const savedCustomer = (() => {
    try {
      const s = localStorage.getItem('nalu_customer_profile');
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  })();

  const [tipoEntrega, setTipoEntrega] = useState<'delivery' | 'takeaway'>('delivery');
  const permiteDelivery = marca?.permite_delivery !== false;
  const permiteTakeaway = marca?.permite_takeaway !== false;

  useEffect(() => {
    if (!permiteDelivery && permiteTakeaway) {
      setTipoEntrega('takeaway');
    } else if (permiteDelivery && !permiteTakeaway) {
      setTipoEntrega('delivery');
    }
  }, [permiteDelivery, permiteTakeaway]);

  const [nombre, setNombre] = useState(savedCustomer?.nombre || '');
  const [email, setEmail] = useState(savedCustomer?.email || '');
  const [telefono, setTelefono] = useState(savedCustomer?.telefono || '');
  const [fechaNacimiento, setFechaNacimiento] = useState(() => {
    const raw = savedCustomer?.fecha_nacimiento || '';
    return parseFlexibleDate(raw).display || raw;
  });
  const [direccion, setDireccion] = useState(savedCustomer?.direccion || '');
  const [apartamento, setApartamento] = useState(savedCustomer?.apartamento || '');
  const [googleMapsUrl, setGoogleMapsUrl] = useState(savedCustomer?.google_maps_url || '');
  const [latitud, setLatitud] = useState<number | null>(savedCustomer?.latitud || null);
  const [longitud, setLongitud] = useState<number | null>(savedCustomer?.longitud || null);
  
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'tarjeta' | 'transferencia'>('efectivo');
  const [pagaCon, setPagaCon] = useState('');
  const [notas, setNotas] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Autocompletado de dirección tipo Google Maps
  const [sugerencias, setSugerencias] = useState<AddressSuggestion[]>([]);
  const [buscandoDireccion, setBuscandoDireccion] = useState(false);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const sugerenciasRef = useRef<HTMLDivElement | null>(null);

  // Validar método de pago permitido según la marca
  useEffect(() => {
    const allowed = [
      marca?.permite_efectivo !== false ? 'efectivo' : null,
      marca?.permite_tarjeta !== false ? 'tarjeta' : null,
      marca?.permite_transferencia !== false ? 'transferencia' : null,
    ].filter(Boolean) as Array<'efectivo' | 'tarjeta' | 'transferencia'>;

    if (allowed.length > 0 && !allowed.includes(metodoPago)) {
      setMetodoPago(allowed[0]);
    }
  }, [marca?.permite_efectivo, marca?.permite_tarjeta, marca?.permite_transferencia, metodoPago]);

  // Estado de sesión Google
  const [googleUser, setGoogleUser] = useState<GoogleUserData | null>(() => {
    try {
      const g = localStorage.getItem('nalu_google_user');
      return g ? JSON.parse(g) : null;
    } catch {
      return null;
    }
  });

  const [buscandoGps, setBuscandoGps] = useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  const scrollToTop = () => {
    formRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Solicitar inicio con Google One Tap
  const handleGoogleSignInPrompt = () => {
    try {
      const g = (window as any).google;
      if (g?.accounts?.id) {
        g.accounts.id.prompt();
      }
    } catch (e) {
      console.warn('Error al invocar Google One Tap:', e);
    }
  };

  // Inicializar Google One Tap — aparece automáticamente si hay sesión activa
  useEffect(() => {
    let timer: any;
    const checkGoogle = () => {
      const g = (window as any).google;
      if (g?.accounts?.id) {
        try {
          g.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: (res: any) => {
              if (res?.credential) {
                const decoded = decodeGoogleJwt(res.credential);
                if (decoded) {
                  setGoogleUser(decoded);
                  if (decoded.email) setEmail(decoded.email);
                  if (decoded.name) setNombre(decoded.name);
                  try {
                    localStorage.setItem('nalu_google_user', JSON.stringify(decoded));
                  } catch {}
                  window.dispatchEvent(new Event('nalu:google-login'));
                }
              }
            },
            auto_select: true,
            cancel_on_tap_outside: false,
          });
          g.accounts.id.prompt();
        } catch (e) {
          console.warn('Error inicializando Google One Tap:', e);
        }
      } else {
        timer = setTimeout(checkGoogle, 300);
      }
    };

    checkGoogle();
    return () => clearTimeout(timer);
  }, []);

  // Si ya había googleUser guardado y email vacío, rellenar
  useEffect(() => {
    if (googleUser) {
      if (!email && googleUser.email) setEmail(googleUser.email);
      if (!nombre && googleUser.name) setNombre(googleUser.name);
      if (!telefono && googleUser.phone) setTelefono(googleUser.phone);
      if (!fechaNacimiento && googleUser.birthday) setFechaNacimiento(googleUser.birthday);
      if (!direccion && googleUser.address) setDireccion(googleUser.address);
    }
  }, [googleUser]);

  if (!isOpen) return null;

  const subtotal = items.reduce((acc, it) => acc + it.precio_unitario * it.cantidad, 0);
  const costoEnvio = (tipoEntrega === 'delivery' && permiteDelivery) ? Number(marca?.costo_delivery || 0) : 0;
  const total = subtotal + costoEnvio;

  // Manejo directo de la dirección y autocompletado tipo Google Maps biased a Tacuarembó
  const handleAddressChange = (text: string) => {
    setDireccion(text);

    // Detección de link o coordenadas de Google Maps
    const mapsCoordRegex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const qCoordRegex = /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/;
    const directCoordRegex = /^(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)$/;

    const match = text.match(mapsCoordRegex) || text.match(qCoordRegex);
    if (match) {
      const lat = parseFloat(match[1]);
      const lon = parseFloat(match[2]);
      setLatitud(lat);
      setLongitud(lon);
      setGoogleMapsUrl(`https://www.google.com/maps?q=${lat},${lon}`);
      setSugerencias([]);
      setMostrarSugerencias(false);
      return;
    }

    const directMatch = text.trim().match(directCoordRegex);
    if (directMatch) {
      const lat = parseFloat(directMatch[1]);
      const lon = parseFloat(directMatch[2]);
      setLatitud(lat);
      setLongitud(lon);
      setGoogleMapsUrl(`https://www.google.com/maps?q=${lat},${lon}`);
      setSugerencias([]);
      setMostrarSugerencias(false);
      return;
    }

    if (text.includes('maps.google.') || text.includes('goo.gl') || text.includes('google.com/maps')) {
      setGoogleMapsUrl(text.trim());
      setSugerencias([]);
      setMostrarSugerencias(false);
      return;
    }

    // Buscar sugerencias con debounce (350ms)
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.trim().length >= 3) {
      setBuscandoDireccion(true);
      debounceRef.current = setTimeout(async () => {
        try {
          const results = await searchAddress(text.trim(), 1, 'Tacuarembó');
          setSugerencias(results);
          setMostrarSugerencias(results.length > 0);
        } catch {
          setSugerencias([]);
        } finally {
          setBuscandoDireccion(false);
        }
      }, 350);
    } else {
      setSugerencias([]);
      setMostrarSugerencias(false);
      setBuscandoDireccion(false);
    }
  };

  const handleSelectSuggestion = (s: AddressSuggestion) => {
    const trailingMatch = direccion.trim().match(/^(.*?)\s+(\d{1,5}(?:\s*(?:bis|a|b|c))?)$/i);
    const userDoorNumber = trailingMatch ? trailingMatch[2].trim() : '';

    let finalDir = s.direccion;
    if (userDoorNumber && !new RegExp(`\\b${userDoorNumber}$`, 'i').test(finalDir)) {
      finalDir = `${finalDir} ${userDoorNumber}`;
    }

    setDireccion(finalDir);
    setLatitud(s.latitud);
    setLongitud(s.longitud);
    setGoogleMapsUrl(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${finalDir}, ${s.ciudad || 'Tacuarembó'}, Uruguay`)}`);
    setSugerencias([]);
    setMostrarSugerencias(false);
  };

  // Enviar pedido a POS Food y luego abrir WhatsApp
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enviando) return; // Prevenir doble-tap en iOS

    // Limpiar espacios en campos clave (iOS Safari autocorrect puede agregar espacios)
    const nombreLimpio = nombre.trim();
    const emailLimpio = email.trim();
    const telefonoLimpio = telefono.trim();

    if (!nombreLimpio) {
      setErrorMsg('Por favor ingresa tu nombre y apellido.');
      scrollToTop();
      return;
    }
    const cleanTel = telefonoLimpio.replace(/\D/g, '');
    if (!cleanTel || cleanTel.length < 8) {
      setErrorMsg('Por favor ingresa un número de teléfono / WhatsApp válido (mínimo 8 dígitos).');
      scrollToTop();
      return;
    }
    if (emailLimpio && !emailLimpio.includes('@')) {
      setErrorMsg('Si ingresas un email, por favor verifica que sea válido.');
      scrollToTop();
      return;
    }
    if (tipoEntrega === 'delivery' && !direccion.trim()) {
      setErrorMsg('Por favor ingresa tu dirección de entrega en Tacuarembó.');
      scrollToTop();
      return;
    }

    // Deshabilitar botón inmediatamente después de validaciones
    setEnviando(true);
    setErrorMsg('');

    const parsedBday = parseFlexibleDate(fechaNacimiento);
    const cleanIsoBday = parsedBday.iso || null;

    // Guardar datos en el perfil local del cliente (protegido contra Safari Private Browsing)
    try {
      localStorage.setItem(
        'nalu_customer_profile',
        JSON.stringify({
          nombre: nombreLimpio,
          email: emailLimpio,
          telefono: telefonoLimpio,
          fecha_nacimiento: parsedBday.display || fechaNacimiento.trim(),
          direccion: direccion.trim(),
          apartamento: apartamento.trim(),
          google_maps_url: googleMapsUrl || (direccion.trim() ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion.trim() + ', Tacuarembó')}` : ''),
          latitud,
          longitud,
        })
      );
    } catch {}

    const resolvedGmapsUrl =
      googleMapsUrl ||
      (direccion.trim() ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion.trim() + ', Tacuarembó')}` : '');

    try {
      // Estructura completa adaptada al POS de Food (tenant_id: 1, marca_id: 1)
      const payload = {
        tenant_id: 1,
        marca_id: 1,
        tipo_pedido: tipoEntrega === 'delivery' ? 'delivery' : 'mostrador',
        canal: tipoEntrega === 'delivery' ? 'delivery' : 'take_away',
        nombre_cliente_rapido: nombreLimpio,
        email: emailLimpio || undefined,
        fecha_nacimiento: cleanIsoBday,
        comensales: 1,
        datos_delivery: {
          nombre: nombreLimpio,
          telefono: telefonoLimpio,
          email: emailLimpio || undefined,
          fecha_nacimiento: cleanIsoBday,
          direccion: direccion.trim(),
          apartamento: apartamento.trim(),
          google_maps_url: resolvedGmapsUrl || undefined,
          latitud: latitud || undefined,
          longitud: longitud || undefined,
          costo_envio: costoEnvio,
          metodo_pago: metodoPago,
          paga_con: pagaCon.trim(),
        },
        metodo_pago: metodoPago,
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

      // Si el pedido no se pudo registrar, mostrar error y NO vaciar el carrito
      if (!res.success) {
        setErrorMsg(res.error || 'No pudimos registrar tu pedido. Probá nuevamente o contactanos por WhatsApp.');
        scrollToTop();
        return;
      }

      // Generar mensaje estructurado de WhatsApp
      const numOrden = res.numero_orden || Math.floor(1000 + Math.random() * 9000);
      const lineasItems = items.map(it => {
        let mods = '';
        if (it.modificadores && it.modificadores.length > 0) {
          mods = '\n' + it.modificadores.map(m => `   • ${m.nombre}${m.precio_extra > 0 ? ` (+$${m.precio_extra})` : ''}`).join('\n');
        }
        const notasItem = it.notas ? `\n   📝 Nota: ${it.notas}` : '';
        return `*${it.cantidad}x ${it.nombre}* ($${it.precio_unitario * it.cantidad})${mods}${notasItem}`;
      }).join('\n\n');

      const canalTxt = tipoEntrega === 'delivery' 
        ? (costoEnvio > 0 ? `🛵 Delivery ($${costoEnvio})` : '🛵 Delivery (Sin costo)') 
        : '🏪 Retiro en Mostrador (Take Away)';
      const dirTxt = tipoEntrega === 'delivery'
        ? `\n📍 *Dirección:* ${direccion.trim()}${apartamento.trim() ? ` (${apartamento.trim()})` : ''}${resolvedGmapsUrl ? `\n🗺️ *Ubicación Maps:* ${resolvedGmapsUrl}` : ''}`
        : '';

      const pagoTxt =
        metodoPago === 'efectivo'
          ? `Efectivo${pagaCon.trim() ? ` (Paga con $${pagaCon.trim()})` : ''}`
          : metodoPago === 'tarjeta'
          ? 'POS Tarjeta (Débito/Crédito)'
          : 'Transferencia Bancaria';

      const parsedBday = parseFlexibleDate(fechaNacimiento);
      const cumpleTxt = (parsedBday.display || fechaNacimiento.trim()) ? `\n🎂 *Cumpleaños:* ${parsedBday.display || fechaNacimiento.trim()}` : '';
      const emailTxt = email.trim() ? `\n✉️ *Email:* ${email.trim()}` : '';

      const textoWhatsApp = `*¡Hola Nalú Poke Bowls Tacuarembó!* 🥗🌊
Acabo de realizar mi pedido desde la web oficial.

📋 *Pedido #N${numOrden}*
${canalTxt}${dirTxt}
👤 *Cliente:* ${nombre.trim()}
📱 *Teléfono:* ${telefono.trim()}${emailTxt}${cumpleTxt}
💳 *Método de Pago:* ${pagoTxt}

🛍️ *Detalle del Pedido:*
${lineasItems}

💰 *TOTAL A PAGAR: $${total} UYU*${notas.trim() ? `\n\n💬 *Comentarios:* ${notas.trim()}` : ''}`;

      const whatsappUrl = `https://api.whatsapp.com/send?phone=59899127786&text=${encodeURIComponent(textoWhatsApp)}`;

      onOrderSuccess(numOrden, whatsappUrl, metodoPago, res.pedido_id);
    } catch (err: any) {
      console.error('Error enviando pedido:', err);
      setErrorMsg('Error de conexión al enviar el pedido. Intenta nuevamente o contactanos directamente.');
      scrollToTop();
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div
        className="modal-container"
        style={{ maxWidth: '540px', padding: 0, overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Cabecera del modal */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-card)' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
              Confirmar Pedido
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Completa tus datos para enviarlo directo a cocina
            </p>
          </div>
          <button onClick={onClose} className="modal-close-btn" style={{ position: 'static' }} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <form
          ref={formRef}
          noValidate
          onSubmit={handleSubmit}
          style={{ overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: 'calc(90vh - 80px)' }}
        >
          {errorMsg && (
            <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ── 1. Datos pre-cargados desde Google ── */}
          {googleUser ? (
            <div style={{
              background: 'linear-gradient(135deg, rgba(220, 252, 231, 0.4), rgba(244, 241, 234, 0.8))',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #BBF7D0',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              {googleUser.picture ? (
                <img
                  src={googleUser.picture}
                  alt=""
                  style={{ width: '34px', height: '34px', borderRadius: '50%', border: '2px solid var(--primary)', flexShrink: 0 }}
                />
              ) : (
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>G</div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)' }}>{googleUser.name}</span>
                  <span style={{ fontSize: '0.65rem', background: '#DCFCE7', color: '#166534', padding: '2px 6px', borderRadius: 'var(--radius-full)', fontWeight: 700 }}>Google ✓</span>
                </div>
                <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {googleUser.email}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setGoogleUser(null);
                  try {
                    localStorage.removeItem('nalu_google_user');
                  } catch {}
                }}
                style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: '4px', flexShrink: 0 }}
                title="Desvincular cuenta de Google"
              >
                ✕
              </button>
            </div>
          ) : (
            <div style={{
              background: 'var(--bg-sand)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
            }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                ¿Querés autocompletar tu nombre y correo?
              </div>
              <button
                type="button"
                onClick={handleGoogleSignInPrompt}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  background: 'white',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <Sparkles size={12} color="#D97706" />
                <span>Conectar Google</span>
              </button>
            </div>
          )}

          {/* ── Alerta Estado de Atención / Horarios ── */}
          {marca?.estado_atencion && !marca.estado_atencion.abierto_ahora && (
            <div style={{
              background: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              fontSize: '0.82rem',
              color: '#991B1B',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              lineHeight: 1.4
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertCircle size={18} style={{ flexShrink: 0, color: '#DC2626' }} />
                <div>
                  <strong>🔴 Local cerrado en este momento</strong>
                  <span style={{ opacity: 0.7 }}> · {marca.estado_atencion.mensaje_estado}</span>
                </div>
              </div>
              <div style={{
                background: '#FFFBEB',
                border: '1px solid #FDE68A',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '0.78rem',
                color: '#92400E',
                lineHeight: 1.5
              }}>
                ⏰ Estamos tomando pedidos anticipados. Si confirmás tu pedido ahora, <strong>entrará a la cocina en la próxima apertura</strong>
                {marca.estado_atencion.proxima_apertura ? ` (${marca.estado_atencion.proxima_apertura})` : ''}.
                Tu orden quedará confirmada y lista para prepararse.
              </div>
            </div>
          )}

          {/* ── 2. Tipo de Entrega ── */}
          {(permiteDelivery || permiteTakeaway) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: (permiteDelivery && permiteTakeaway) ? '1fr 1fr' : '1fr',
                gap: '12px'
              }}>
                {permiteDelivery && (
                  <button
                    type="button"
                    onClick={() => setTipoEntrega('delivery')}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      padding: '10px',
                      borderRadius: 'var(--radius-md)',
                      border: '1.5px solid',
                      borderColor: tipoEntrega === 'delivery' ? 'var(--primary)' : 'var(--border-light)',
                      background: tipoEntrega === 'delivery' ? 'var(--primary-light)' : 'var(--bg-card)',
                      color: tipoEntrega === 'delivery' ? 'var(--primary)' : 'var(--text-main)',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Bike size={18} />
                      <span>Delivery{costoEnvio > 0 ? ` ($${costoEnvio})` : ''}</span>
                    </div>
                    {marca?.estado_atencion && !marca.estado_atencion.delivery_abierto_ahora && (
                      <span style={{ fontSize: '0.68rem', color: '#D97706', fontWeight: 600 }}>Fuera de horario</span>
                    )}
                  </button>
                )}

                {permiteTakeaway && (
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
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <Store size={18} />
                    <span>Retiro en Local</span>
                  </button>
                )}
              </div>

              {marca?.estado_atencion?.abierto_ahora && !marca.estado_atencion.delivery_abierto_ahora && tipoEntrega === 'delivery' && (
                <div style={{
                  background: '#FFFBEB',
                  border: '1px solid #FCD34D',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 12px',
                  fontSize: '0.78rem',
                  color: '#92400E',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertCircle size={15} style={{ flexShrink: 0, color: '#D97706' }} />
                  <span>
                    El reparto por <strong>Delivery</strong> está fuera de turno ahora. Si confirmás, tu pedido quedará registrado para despachar cuando comience el reparto o podés optar por <strong>Retiro en Local</strong>.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ── 3. Datos del Cliente ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Nombre y Apellido *</span>
                {googleUser && <span style={{ color: 'var(--secondary)', fontSize: '0.72rem', fontWeight: 600 }}>Autocompletado (editable)</span>}
              </label>
              <input
                type="text"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                name="name"
                autoComplete="name"
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
              <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Email (opcional, para avisos de estado)</span>
                {googleUser && <span style={{ color: 'var(--secondary)', fontSize: '0.72rem', fontWeight: 600 }}>Desde tu cuenta de Google</span>}
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onBlur={e => setEmail(e.target.value.trim())}
                name="email"
                autoComplete="email"
                inputMode="email"
                placeholder="ejemplo@gmail.com (Opcional)"
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

            {/* Teléfono y Fecha de Nacimiento juntos en el mismo renglón */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px', display: 'block' }}>
                  Teléfono / WhatsApp *
                </label>
                <input
                  type="tel"
                  value={telefono}
                  onChange={e => setTelefono(e.target.value)}
                  name="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="Ej: 099 123 456"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1.5px solid var(--border-light)',
                    outline: 'none',
                    fontSize: '0.88rem',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span title="Día/Mes/Año o con guiones">Cumpleaños 🎂</span>
                  {fechaNacimiento && (
                    <span style={{ color: '#166534', fontSize: '0.68rem', fontWeight: 700 }}>🎁 ¡Beneficio!</span>
                  )}
                </label>
                <input
                  type="text"
                  value={fechaNacimiento}
                  onChange={e => setFechaNacimiento(e.target.value)}
                  onBlur={e => {
                    const parsed = parseFlexibleDate(e.target.value);
                    if (parsed.display) {
                      setFechaNacimiento(parsed.display);
                    }
                  }}
                  name="bday"
                  autoComplete="bday"
                  placeholder="DD/MM/AAAA"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1.5px solid var(--border-light)',
                    outline: 'none',
                    fontSize: '0.88rem',
                    fontFamily: 'inherit',
                    color: 'var(--text-main)',
                    background: 'var(--bg-card)',
                  }}
                />
              </div>
            </div>

            {/* ── 4. Dirección Tipo Google Maps (Solo Delivery) ── */}
            {tipoEntrega === 'delivery' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', display: 'block' }}>
                    Dirección de Entrega en Tacuarembó *
                  </label>

                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={direccion}
                      onChange={e => handleAddressChange(e.target.value)}
                      onFocus={() => { if (sugerencias.length > 0) setMostrarSugerencias(true); }}
                      onBlur={() => { setTimeout(() => setMostrarSugerencias(false), 200); }}
                      placeholder="Calle y número de puerta (Ej: 18 de Julio 240)"
                      name="street-address"
                      autoComplete="off"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        paddingRight: buscandoDireccion ? '36px' : '14px',
                        borderRadius: 'var(--radius-md)',
                        border: '1.5px solid var(--border-light)',
                        outline: 'none',
                        fontSize: '0.9rem',
                      }}
                    />
                    {buscandoDireccion && (
                      <Loader2 size={15} className="spin" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    )}

                    {/* Dropdown de sugerencias tipo Google Maps */}
                    {mostrarSugerencias && sugerencias.length > 0 && (
                      <div
                        ref={sugerenciasRef}
                        style={{
                          position: 'absolute',
                          top: 'calc(100% + 4px)',
                          left: 0,
                          right: 0,
                          zIndex: 100,
                          background: '#ffffff',
                          border: '1.5px solid var(--border-light)',
                          borderRadius: 'var(--radius-md)',
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                          maxHeight: '220px',
                          overflowY: 'auto',
                        }}
                      >
                        {sugerencias.map((s, i) => (
                          <button
                            key={i}
                            type="button"
                            onMouseDown={(e) => { e.preventDefault(); handleSelectSuggestion(s); }}
                            style={{
                              width: '100%',
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '10px',
                              padding: '10px 14px',
                              background: 'transparent',
                              border: 'none',
                              borderBottom: i < sugerencias.length - 1 ? '1px solid var(--border-light)' : 'none',
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'background 0.15s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-sand)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          >
                            <MapPin size={16} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--primary)' }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {s.direccion}
                              </div>
                              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {[s.ciudad, s.departamento, s.pais].filter(Boolean).join(', ')}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {googleMapsUrl && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.75rem', background: '#DCFCE7', color: '#166534', padding: '6px 10px', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                        <Check size={14} /> Ubicación Google Maps verificada
                      </span>
                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#166534', fontWeight: 800, textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '3px' }}
                      >
                        <span>Ver en Maps</span>
                        <ExternalLink size={11} />
                      </a>
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px', display: 'block' }}>
                    Apartamento, esquina o referencia (Opcional)
                  </label>
                  <input
                    type="text"
                    value={apartamento}
                    onChange={e => setApartamento(e.target.value)}
                    placeholder="Ej: Apto 204, esquina Gral. Flores, portón negro..."
                    name="address-line2"
                    autoComplete="address-line2"
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
              </div>
            )}

            {/* ── 5. Método de Pago (Efectivo, Tarjeta, Transferencia) ── */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '8px', display: 'block' }}>
                Método de Pago *
              </label>
              {(() => {
                const paymentOptions = [
                  marca?.permite_efectivo !== false ? { id: 'efectivo', label: 'Efectivo', icon: <Banknote size={16} /> } : null,
                  marca?.permite_tarjeta !== false ? { id: 'tarjeta', label: 'Tarjeta (POS)', icon: <CreditCard size={16} /> } : null,
                  marca?.permite_transferencia !== false ? { id: 'transferencia', label: 'Transferencia', icon: <Smartphone size={16} /> } : null,
                ].filter(Boolean) as Array<{ id: 'efectivo' | 'tarjeta' | 'transferencia'; label: string; icon: React.ReactNode }>;

                const cols = Math.max(1, paymentOptions.length);

                return (
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '8px' }}>
                    {paymentOptions.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setMetodoPago(p.id)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '10px 6px',
                          borderRadius: 'var(--radius-md)',
                          border: '1.5px solid',
                          borderColor: metodoPago === p.id ? 'var(--primary)' : 'var(--border-light)',
                          background: metodoPago === p.id ? 'var(--primary-light)' : 'var(--bg-card)',
                          color: metodoPago === p.id ? 'var(--primary)' : 'var(--text-body)',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        {p.icon}
                        <span>{p.label}</span>
                      </button>
                    ))}
                  </div>
                );
              })()}

              {metodoPago === 'efectivo' && (
                <div style={{ marginTop: '10px' }}>
                  <input
                    type="text"
                    value={pagaCon}
                    onChange={e => setPagaCon(e.target.value)}
                    placeholder="¿Con cuánto abonás? (para llevarte cambio)"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: '1.5px solid var(--border-light)',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                </div>
              )}

              {metodoPago === 'tarjeta' && (
                <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-sand)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                  💳 Llevamos el POS inalámbrico a tu puerta (Débito, Crédito, Master, Visa).
                </div>
              )}


            </div>

            {/* Notas adicionales */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px', display: 'block' }}>
                Aclaraciones o Notas para la Cocina (opcional)
              </label>
              <textarea
                value={notas}
                onChange={e => setNotas(e.target.value)}
                placeholder="Ej: salsa aparte, sin cubiertos, timbre roto..."
                rows={2}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1.5px solid var(--border-light)',
                  outline: 'none',
                  fontSize: '0.85rem',
                  resize: 'none',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          </div>

          {/* ── 6. Resumen de Totales ── */}
          <div style={{ background: 'var(--bg-page)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Subtotal ({items.length} items):</span>
              <span style={{ fontWeight: 700 }}>${subtotal.toLocaleString()}</span>
            </div>
            {tipoEntrega === 'delivery' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Costo de Envío:</span>
                <span style={{ fontWeight: 700 }}>${costoEnvio.toLocaleString()}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 900, marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-light)' }}>
              <span>Total a Pagar:</span>
              <span style={{ color: 'var(--primary)' }}>${total.toLocaleString()} UYU</span>
            </div>
          </div>

          {/* Alerta de error visible justo arriba del botón para móviles / iPhone */}
          {errorMsg && (
            <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ── 7. Botón de Confirmación ── */}
          <button
            type="submit"
            disabled={enviando}
            className="btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '1.02rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', cursor: enviando ? 'not-allowed' : 'pointer' }}
          >
            {enviando ? (
              <>
                <Loader2 size={18} className="spin" />
                <span>{marca?.estado_atencion && !marca.estado_atencion.abierto_ahora ? 'Registrando pedido anticipado...' : 'Enviando pedido a cocina...'}</span>
              </>
            ) : marca?.estado_atencion && !marca.estado_atencion.abierto_ahora ? (
              <>
                <Clock size={18} />
                <span>Confirmar Pedido Anticipado</span>
              </>
            ) : (
              <>
                <Send size={18} />
                <span>Confirmar y Enviar a Cocina</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
