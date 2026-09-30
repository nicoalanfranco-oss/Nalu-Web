import React, { useState, useEffect } from 'react';
import {
  X, CheckCircle, Bike, Store, ArrowRight, ShieldCheck, Send,
  MapPin, Navigation, ExternalLink, CreditCard, Banknote, Smartphone,
  Search, Loader2, Check, UserCheck, AlertCircle, Sparkles
} from 'lucide-react';
import { CartItem, MarcaInfo } from '../types/food';
import { sendOrderToFood } from '../services/api';

const GOOGLE_CLIENT_ID = '713780303554-41bctfqdhvu5nc81sctj1qci2mvekviu.apps.googleusercontent.com';

interface CheckoutModalProps {
  isOpen: boolean;
  items: CartItem[];
  onClose: () => void;
  onOrderSuccess: (orderNumber: number, whatsappUrl: string) => void;
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
  const [fechaNacimiento, setFechaNacimiento] = useState(savedCustomer?.fecha_nacimiento || '');
  const [cargandoGooglePeople, setCargandoGooglePeople] = useState(false);
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

  // Estado de sesión Google
  const [googleUser, setGoogleUser] = useState<GoogleUserData | null>(() => {
    try {
      const g = localStorage.getItem('nalu_google_user');
      return g ? JSON.parse(g) : null;
    } catch {
      return null;
    }
  });

  // Estado búsqueda de dirección Google Maps
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const [buscandoGps, setBuscandoGps] = useState(false);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);

  // Solicitar datos ampliados (teléfono, cumpleaños, dirección) mediante Google People API
  const solicitarDatosCompletosGoogle = () => {
    try {
      const g = (window as any).google;
      if (!g?.accounts?.oauth2) {
        setErrorMsg('Servicio de Google OAuth no disponible en el navegador');
        return;
      }

      setCargandoGooglePeople(true);
      setErrorMsg('');
      const client = g.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/user.phonenumbers.read https://www.googleapis.com/auth/user.birthday.read https://www.googleapis.com/auth/user.addresses.read',
        callback: async (tokenResponse: any) => {
          if (tokenResponse?.error) {
            console.warn('Error OAuth Google:', tokenResponse);
            setCargandoGooglePeople(false);
            if (tokenResponse.error !== 'access_denied') {
              setErrorMsg('No se pudo sincronizar con Google. Puedes completar los campos manualmente.');
            }
            return;
          }
          if (tokenResponse?.access_token) {
            try {
              const res = await fetch(
                'https://people.googleapis.com/v1/people/me?personFields=names,emailAddresses,phoneNumbers,birthdays,addresses,photos',
                {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                }
              );
              if (res.ok) {
                const data = await res.json();
                const nombreGoogle = data.names?.[0]?.displayName || nombre;
                const emailGoogle = data.emailAddresses?.[0]?.value || email;
                let telGoogle = telefono;
                if (data.phoneNumbers && data.phoneNumbers.length > 0) {
                  telGoogle = data.phoneNumbers[0].canonicalForm || data.phoneNumbers[0].value || telefono;
                }

                // Formatear cumpleaños YYYY-MM-DD
                let bdayGoogle = fechaNacimiento;
                if (data.birthdays && data.birthdays.length > 0) {
                  const bdayObj = data.birthdays.find((b: any) => b.date) || data.birthdays[0];
                  if (bdayObj?.date) {
                    const b = bdayObj.date;
                    if (b.month && b.day) {
                      const y = b.year ? String(b.year).padStart(4, '0') : '2000';
                      const m = String(b.month).padStart(2, '0');
                      const d = String(b.day).padStart(2, '0');
                      bdayGoogle = `${y}-${m}-${d}`;
                    }
                  }
                }

                // Dirección de casa o principal
                let dirGoogle = direccion;
                if (data.addresses && data.addresses.length > 0) {
                  dirGoogle = data.addresses[0].formattedValue || direccion;
                }

                if (nombreGoogle) setNombre(nombreGoogle);
                if (emailGoogle) setEmail(emailGoogle);
                if (telGoogle) setTelefono(telGoogle);
                if (bdayGoogle) setFechaNacimiento(bdayGoogle);
                if (dirGoogle) setDireccion(dirGoogle);

                const updatedUser: GoogleUserData = {
                  name: nombreGoogle,
                  email: emailGoogle,
                  picture: data.photos?.[0]?.url || googleUser?.picture,
                  phone: telGoogle,
                  birthday: bdayGoogle,
                  address: dirGoogle,
                };
                setGoogleUser(updatedUser);
                localStorage.setItem('nalu_google_user', JSON.stringify(updatedUser));

                try {
                  const currentProfile = JSON.parse(localStorage.getItem('nalu_customer_profile') || '{}');
                  localStorage.setItem('nalu_customer_profile', JSON.stringify({
                    ...currentProfile,
                    nombre: nombreGoogle,
                    email: emailGoogle,
                    telefono: telGoogle,
                    fecha_nacimiento: bdayGoogle,
                    direccion: dirGoogle || currentProfile.direccion,
                  }));
                } catch {}
              }
            } catch (err) {
              console.warn('Error al consultar People API:', err);
            } finally {
              setCargandoGooglePeople(false);
            }
          } else {
            setCargandoGooglePeople(false);
          }
        },
      });

      client.requestAccessToken({ prompt: '' });
    } catch (e) {
      console.warn('Error inicializando People OAuth:', e);
      setCargandoGooglePeople(false);
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
                  localStorage.setItem('nalu_google_user', JSON.stringify(decoded));
                }
              }
            },
            auto_select: true,
            cancel_on_tap_outside: false,
          });
          // One Tap silencioso
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

  // Si el componente no está abierto, no renderizar nada
  if (!isOpen) return null;

  const subtotal = items.reduce((acc, it) => acc + it.precio_unitario * it.cantidad, 0);
  const costoEnvio = tipoEntrega === 'delivery' ? 50 : 0;
  const total = subtotal + costoEnvio;

  // Búsqueda inteligente de direcciones con Nominatim / Coordenadas / Links de Google Maps
  const handleSearchAddress = async (text: string) => {
    setDireccion(text);

    // Detección 1: ¿Pegó un link o coordenadas de Google Maps?
    const mapsCoordRegex = /@(-?d+.d+),(-?d+.d+)/;
    const qCoordRegex = /q=(-?d+.d+),(-?d+.d+)/;
    const match = text.match(mapsCoordRegex) || text.match(qCoordRegex);

    if (match) {
      const lat = parseFloat(match[1]);
      const lon = parseFloat(match[2]);
      setLatitud(lat);
      setLongitud(lon);
      setGoogleMapsUrl(`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`);
      setShowAddressDropdown(false);
      return;
    }

    if (text.trim().length < 3) {
      setAddressSuggestions([]);
      setShowAddressDropdown(false);
      return;
    }

    setSearchingAddress(true);
    try {
      const qQuery = text.toLowerCase().includes('tacuaremb') ? text : `${text}, Tacuarembó`;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(qQuery)}&countrycodes=uy&limit=5&addressdetails=1`
      );
      if (res.ok) {
        const data = await res.json();
        setAddressSuggestions(data);
        setShowAddressDropdown(data.length > 0);
      }
    } catch (err) {
      console.warn('Error buscando sugerencias de dirección:', err);
    } finally {
      setSearchingAddress(false);
    }
  };

  const handleSelectSuggestion = (sug: any) => {
    const lat = parseFloat(sug.lat);
    const lon = parseFloat(sug.lon);
    setDireccion(sug.display_name.split(',')[0] + ', ' + (sug.address?.suburb || sug.address?.city || 'Tacuarembó'));
    setLatitud(lat);
    setLongitud(lon);
    setGoogleMapsUrl(`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`);
    setShowAddressDropdown(false);
  };

  // Obtener ubicación GPS con 1 clic
  const handleGetGPS = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocalización no soportada en este navegador');
      return;
    }
    setBuscandoGps(true);
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setLatitud(lat);
        setLongitud(lon);
        setGoogleMapsUrl(`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`);

        // Reverse geocoding para obtener la calle aproximada
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
          if (res.ok) {
            const data = await res.json();
            const road = data.address?.road || '';
            const houseNumber = data.address?.house_number || '';
            const dir = [road, houseNumber].filter(Boolean).join(' ');
            setDireccion(dir || `Ubicación GPS (${lat.toFixed(4)}, ${lon.toFixed(4)})`);
          } else {
            setDireccion(`Ubicación GPS (${lat.toFixed(4)}, ${lon.toFixed(4)})`);
          }
        } catch {
          setDireccion(`Ubicación GPS (${lat.toFixed(4)}, ${lon.toFixed(4)})`);
        }
        setBuscandoGps(false);
      },
      err => {
        console.warn('Error GPS:', err);
        setBuscandoGps(false);
        setErrorMsg('No pudimos acceder a tu ubicación. Ingresa la calle manualmente.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Enviar pedido a POS Food y luego abrir WhatsApp
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre.trim()) {
      setErrorMsg('Por favor ingresa tu nombre');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Por favor ingresa un email válido');
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

    // Guardar datos en el perfil local del cliente
    try {
      localStorage.setItem(
        'nalu_customer_profile',
        JSON.stringify({
          nombre: nombre.trim(),
          email: email.trim(),
          telefono: telefono.trim(),
          fecha_nacimiento: fechaNacimiento.trim(),
          direccion: direccion.trim(),
          apartamento: apartamento.trim(),
          google_maps_url: googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion.trim() + ', Tacuarembó')}`,
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
        nombre_cliente_rapido: nombre.trim(),
        email: email.trim(),
        fecha_nacimiento: fechaNacimiento.trim() || null,
        comensales: 1,
        datos_delivery: {
          nombre: nombre.trim(),
          telefono: telefono.trim(),
          email: email.trim(),
          fecha_nacimiento: fechaNacimiento.trim() || null,
          direccion: direccion.trim(),
          apartamento: apartamento.trim(),
          google_maps_url: resolvedGmapsUrl,
          latitud,
          longitud,
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

      const canalTxt = tipoEntrega === 'delivery' ? `🛵 Delivery ($${costoEnvio})` : '🏪 Retiro en Mostrador (Take Away)';
      const dirTxt = tipoEntrega === 'delivery'
        ? `\n📍 *Dirección:* ${direccion.trim()}${apartamento.trim() ? ` (${apartamento.trim()})` : ''}${resolvedGmapsUrl ? `\n🗺️ *Ubicación Maps:* ${resolvedGmapsUrl}` : ''}`
        : '';

      const pagoTxt =
        metodoPago === 'efectivo'
          ? `Efectivo${pagaCon.trim() ? ` (Paga con $${pagaCon.trim()})` : ''}`
          : metodoPago === 'tarjeta'
          ? 'POS Tarjeta (Débito/Crédito)'
          : 'Transferencia Bancaria';

      const cumpleTxt = fechaNacimiento.trim() ? `\n🎂 *Cumpleaños:* ${fechaNacimiento.trim()}` : '';

      const textoWhatsApp = `*¡Hola Nalú Poke Bowls Tacuarembó!* 🥗🌊
Acabo de realizar mi pedido desde la web oficial.

📋 *Pedido #N${numOrden}*
${canalTxt}${dirTxt}
👤 *Cliente:* ${nombre.trim()}
📱 *Teléfono:* ${telefono.trim()}
✉️ *Email:* ${email.trim()}${cumpleTxt}
💳 *Método de Pago:* ${pagoTxt}

🛍️ *Detalle del Pedido:*
${lineasItems}

💰 *TOTAL A PAGAR: $${total} UYU*${notas.trim() ? `\n\n💬 *Comentarios:* ${notas.trim()}` : ''}`;

      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(textoWhatsApp)}`;

      onOrderSuccess(numOrden, whatsappUrl);
    } catch (err: any) {
      console.error('Error enviando pedido:', err);
      setErrorMsg('Error de conexión al enviar el pedido. Intenta nuevamente o contactanos directamente.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
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

        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: 'calc(90vh - 80px)' }}>
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
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                  onClick={() => { setGoogleUser(null); localStorage.removeItem('nalu_google_user'); }}
                  style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: '4px', flexShrink: 0 }}
                  title="Desvincular cuenta de Google"
                >
                  ✕
                </button>
              </div>

              {/* Botón interactivo para autocompletar teléfono y cumpleaños con Google People API */}
              {(!telefono || !fechaNacimiento) && (
                <button
                  type="button"
                  onClick={solicitarDatosCompletosGoogle}
                  disabled={cargandoGooglePeople}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    background: 'white',
                    color: '#166534',
                    border: '1.5px solid #86EFAC',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: cargandoGooglePeople ? 'wait' : 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}
                >
                  {cargandoGooglePeople ? (
                    <>
                      <Loader2 size={13} className="spin" />
                      <span>Conectando con Google...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={13} color="#16a34a" />
                      <span>⚡ Autocompletar Teléfono y Cumpleaños con Google</span>
                    </>
                  )}
                </button>
              )}
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
                ¿Querés autocompletar tus datos más rápido?
              </div>
              <button
                type="button"
                onClick={solicitarDatosCompletosGoogle}
                disabled={cargandoGooglePeople}
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
                {cargandoGooglePeople ? <Loader2 size={12} className="spin" /> : <Sparkles size={12} color="#D97706" />}
                <span>Usar Google</span>
              </button>
            </div>
          )}

          {/* ── 2. Tipo de Entrega ── */}
          {(permiteDelivery || permiteTakeaway) && (
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
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <Bike size={18} />
                  <span>Delivery ($50)</span>
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
                required
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
                <span>Email de Contacto *</span>
                {googleUser && <span style={{ color: 'var(--secondary)', fontSize: '0.72rem', fontWeight: 600 }}>Desde tu cuenta de Google</span>}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                name="email"
                autoComplete="email"
                placeholder="ejemplo@gmail.com"
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
                name="tel"
                autoComplete="tel"
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

            {/* Fecha de Nacimiento (opcional para beneficio de cumpleaños) */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Fecha de Nacimiento (opcional) 🎂</span>
                {fechaNacimiento && (
                  <span style={{ color: '#166534', fontSize: '0.72rem', fontWeight: 600 }}>¡Te avisaremos tu beneficio!</span>
                )}
              </label>
              <input
                type="date"
                value={fechaNacimiento}
                onChange={e => setFechaNacimiento(e.target.value)}
                name="bday"
                autoComplete="bday"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1.5px solid var(--border-light)',
                  outline: 'none',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit',
                  color: 'var(--text-main)',
                  background: 'var(--bg-card)',
                }}
              />
            </div>

            {/* ── 4. Dirección Tipo Google Maps (Solo Delivery) ── */}
            {tipoEntrega === 'delivery' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                      Dirección en Tacuarembó / Google Maps *
                    </label>
                    <button
                      type="button"
                      onClick={handleGetGPS}
                      disabled={buscandoGps}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: 'var(--primary)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {buscandoGps ? <Loader2 size={12} className="spin" /> : <Navigation size={12} />}
                      <span>{buscandoGps ? 'Obteniendo GPS...' : '📍 Mi Ubicación'}</span>
                    </button>
                  </div>

                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      required
                      value={direccion}
                      onChange={e => handleSearchAddress(e.target.value)}
                      placeholder="Calle y número, o pegá enlace de Google Maps..."
                      name="street-address"
                      autoComplete="street-address"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        paddingRight: '36px',
                        borderRadius: 'var(--radius-md)',
                        border: '1.5px solid var(--border-light)',
                        outline: 'none',
                        fontSize: '0.9rem',
                      }}
                    />
                    <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                      {searchingAddress ? <Loader2 size={16} className="spin" /> : <MapPin size={16} />}
                    </div>

                    {/* Desplegable de sugerencias de dirección */}
                    {showAddressDropdown && addressSuggestions.length > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          zIndex: 20,
                          background: 'var(--bg-card)',
                          borderRadius: 'var(--radius-md)',
                          border: '1.5px solid var(--border-light)',
                          marginTop: '4px',
                          boxShadow: 'var(--shadow-lg)',
                          maxHeight: '180px',
                          overflowY: 'auto',
                        }}
                      >
                        {addressSuggestions.map((sug, i) => (
                          <div
                            key={i}
                            onClick={() => handleSelectSuggestion(sug)}
                            style={{
                              padding: '10px 14px',
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              borderBottom: i < addressSuggestions.length - 1 ? '1px solid var(--border-light)' : 'none',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              color: 'var(--text-main)',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-sand)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          >
                            <MapPin size={14} style={{ flexShrink: 0, color: 'var(--primary)' }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {sug.display_name}
                            </span>
                          </div>
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
                    Apartamento / Timbre / Referencia
                  </label>
                  <input
                    type="text"
                    value={apartamento}
                    onChange={e => setApartamento(e.target.value)}
                    placeholder="Ej: Apto 204, portón negro, timbre 2"
                    name="address-line2"
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {[
                  { id: 'efectivo', label: 'Efectivo', icon: <Banknote size={16} /> },
                  { id: 'tarjeta', label: 'Tarjeta (POS)', icon: <CreditCard size={16} /> },
                  { id: 'transferencia', label: 'Transferencia', icon: <Smartphone size={16} /> },
                ].map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setMetodoPago(p.id as any)}
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

              {metodoPago === 'transferencia' && (
                <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-sand)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                  📲 Te enviaremos los datos de cuenta (BROU / Prex / Santander) al WhatsApp para transferir.
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

          {/* ── 7. Botón de Confirmación ── */}
          <button
            type="submit"
            disabled={enviando}
            className="btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '1.02rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {enviando ? (
              <>
                <Loader2 size={18} className="spin" />
                <span>Enviando pedido a cocina...</span>
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
