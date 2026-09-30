import React, { useState, useEffect } from 'react';
import { Sparkles,
  X, CheckCircle, Bike, Store, ArrowRight, ShieldCheck, Send,
  MapPin, Navigation, ExternalLink, CreditCard, Banknote, Smartphone,
  Search, Loader2, Check, UserCheck, AlertCircle
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

  // Estado de sesiÃ³n Google
  const [googleUser, setGoogleUser] = useState<GoogleUserData | null>(() => {
    try {
      const g = localStorage.getItem('nalu_google_user');
      return g ? JSON.parse(g) : null;
    } catch {
      return null;
    }
  });

  // Estado bÃºsqueda de direcciÃ³n Google Maps
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const [buscandoGps, setBuscandoGps] = useState(false);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);

  // Solicitar datos ampliados (telÃ©fono, cumpleaÃ±os, direcciÃ³n) mediante Google People API
  const solicitarDatosCompletosGoogle = () => {
    try {
      const g = (window as any).google;
      if (!g?.accounts?.oauth2) {
        setErrorMsg('Servicio de Google OAuth no disponible en el navegador');
        return;
      }

      setCargandoGooglePeople(true);
      const client = g.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/user.phonenumbers.read https://www.googleapis.com/auth/user.birthday.read https://www.googleapis.com/auth/user.addresses.read',
        callback: async (tokenResponse: any) => {
          if (tokenResponse?.error) {
            console.warn('Error OAuth Google:', tokenResponse);
            setCargandoGooglePeople(false);
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
                const telGoogle = data.phoneNumbers?.[0]?.value || telefono;

                // Formatear cumpleaÃ±os YYYY-MM-DD
                let bdayGoogle = fechaNacimiento;
                if (data.birthdays?.[0]?.date) {
                  const b = data.birthdays[0].date;
                  if (b.month && b.day) {
                    const y = b.year ? String(b.year).padStart(4, '0') : '2000';
                    const m = String(b.month).padStart(2, '0');
                    const d = String(b.day).padStart(2, '0');
                    bdayGoogle = `${y}-${m}-${d}`;
                  }
                }

                // DirecciÃ³n de casa o principal
                const dirGoogle = data.addresses?.[0]?.formattedValue || direccion;

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
              }
            } catch (err) {
              console.warn('Error al consultar People API:', err);
            } finally {
              setCargandoGooglePeople(false);
            }
          }
        },
      });

      client.requestAccessToken();
    } catch (err) {
      console.warn('Error al iniciar Token Client:', err);
      setCargandoGooglePeople(false);
    }
  };

  // Inicializar Google One Tap â€” aparece automÃ¡ticamente si hay sesiÃ³n activa
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
            auto_select: true,       // selecciona automÃ¡ticamente si hay 1 sola cuenta
            cancel_on_tap_outside: false,
          });
          // One Tap silencioso â€” muestra el popup del browser si el usuario estÃ¡ logueado en Google
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

  // Si ya habÃ­a googleUser guardado y email vacÃ­o, rellenar
  useEffect(() => {
    if (googleUser) {
      if (!email && googleUser.email) setEmail(googleUser.email);
      if (!nombre && googleUser.name) setNombre(googleUser.name);
    }
  }, [googleUser]);

  // Si el componente no estÃ¡ abierto, no renderizar nada (pero todos los hooks ya corrieron)
  if (!isOpen) return null;

  const subtotal = items.reduce((acc, it) => acc + it.precio_unitario * it.cantidad, 0);
  const costoEnvio = tipoEntrega === 'delivery' ? 50 : 0;
  const total = subtotal + costoEnvio;

  // BÃºsqueda inteligente de direcciones con Nominatim / Coordenadas / Links de Google Maps
  const handleSearchAddress = async (text: string) => {
    setDireccion(text);

    // Detectar link de Google Maps o coordenadas directas
    const coordsRegex = /(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/;
    const match = text.match(coordsRegex);
    if (match) {
      const lat = parseFloat(match[1]);
      const lon = parseFloat(match[2]);
      setLatitud(lat);
      setLongitud(lon);
      setGoogleMapsUrl(`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`);
      setShowAddressDropdown(false);
      return;
    }

    if (text.includes('maps.app.goo.gl') || text.includes('goo.gl/maps') || text.includes('google.com/maps')) {
      setGoogleMapsUrl(text.trim());
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
      // 1. Intentar endpoint geocode del backend si estÃ¡ disponible
      let results: any[] = [];
      try {
        const res = await fetch(`/api/admin/geocode?q=${encodeURIComponent(text.trim())}`);
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) results = list;
        }
      } catch {}

      // 2. Fallback con Nominatim enfocado en TacuarembÃ³, Uruguay
      if (results.length === 0) {
        const qQuery = text.toLowerCase().includes('tacuaremb') ? text : `${text}, TacuarembÃ³`;
        const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=uy&q=${encodeURIComponent(qQuery)}&limit=4`;
        const nomRes = await fetch(nomUrl, { headers: { 'User-Agent': 'NaluPokeWeb/1.0' } });
        if (nomRes.ok) {
          const raw = await nomRes.json();
          results = raw.map((item: any) => {
            const addr = item.address || {};
            const road = addr.road || addr.pedestrian || addr.street || '';
            const houseNumber = addr.house_number || '';
            const dir = [road, houseNumber].filter(Boolean).join(' ') || item.display_name.split(',')[0];
            const lat = parseFloat(item.lat);
            const lon = parseFloat(item.lon);
            return {
              direccion: dir,
              display_name: item.display_name,
              latitud: lat,
              longitud: lon,
              google_maps_url: `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`,
            };
          });
        }
      }

      setAddressSuggestions(results);
      setShowAddressDropdown(results.length > 0);
    } catch (err) {
      console.warn('Error buscando sugerencias de direcciÃ³n:', err);
    } finally {
      setSearchingAddress(false);
    }
  };

  const selectSuggestion = (s: any) => {
    setDireccion(s.direccion || s.display_name.split(',')[0]);
    setGoogleMapsUrl(s.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${s.latitud},${s.longitud}`);
    if (s.latitud) setLatitud(s.latitud);
    if (s.longitud) setLongitud(s.longitud);
    setShowAddressDropdown(false);
  };

  // Obtener ubicaciÃ³n GPS con 1 clic
  const handleGetGPS = () => {
    if (!navigator.geolocation) {
      setErrorMsg('GeolocalizaciÃ³n no soportada en este navegador');
      return;
    }
    setBuscandoGps(true);
    setErrorMsg('');
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const gmaps = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
        setLatitud(lat);
        setLongitud(lon);
        setGoogleMapsUrl(gmaps);

        try {
          const revRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
          if (revRes.ok) {
            const item = await revRes.json();
            const addr = item.address || {};
            const road = addr.road || addr.pedestrian || addr.street || '';
            const houseNumber = addr.house_number || '';
            const dir = [road, houseNumber].filter(Boolean).join(' ') || item.display_name.split(',')[0];
            setDireccion(dir || `UbicaciÃ³n GPS (${lat.toFixed(4)}, ${lon.toFixed(4)})`);
          } else {
            setDireccion(`UbicaciÃ³n GPS (${lat.toFixed(4)}, ${lon.toFixed(4)})`);
          }
        } catch {
          setDireccion(`UbicaciÃ³n GPS (${lat.toFixed(4)}, ${lon.toFixed(4)})`);
        }
        setBuscandoGps(false);
      },
      err => {
        setBuscandoGps(false);
        setErrorMsg('No pudimos acceder a tu ubicaciÃ³n. Ingresa la calle manualmente.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setErrorMsg('Por favor ingresa tu nombre');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Por favor ingresa un email vÃ¡lido');
      return;
    }
    if (!telefono.trim()) {
      setErrorMsg('Por favor ingresa tu nÃºmero de telÃ©fono / WhatsApp');
      return;
    }
    if (tipoEntrega === 'delivery' && !direccion.trim()) {
      setErrorMsg('Por favor ingresa tu direcciÃ³n de entrega');
      return;
    }

    setEnviando(true);
    setErrorMsg('');

    // Guardar datos del cliente para futuros pedidos
    try {
      localStorage.setItem(
        'nalu_customer_profile',
        JSON.stringify({
          nombre: nombre.trim(),
          email: email.trim(),
          telefono: telefono.trim(),
          direccion: direccion.trim(),
          apartamento: apartamento.trim(),
          google_maps_url: googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion.trim() + ', TacuarembÃ³')}`,
          latitud,
          longitud,
        })
      );
    } catch {}

    const resolvedGmapsUrl =
      googleMapsUrl ||
      (direccion.trim() ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion.trim() + ', TacuarembÃ³')}` : '');

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
          telefono: telefono.trim(),
          email: email.trim(),
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
          mods = '\n' + it.modificadores.map(m => `   â€¢ ${m.nombre}${m.precio_extra > 0 ? ` (+$${m.precio_extra})` : ''}`).join('\n');
        }
        const notasItem = it.notas ? `\n   ðŸ“ Nota: ${it.notas}` : '';
        return `*${it.cantidad}x ${it.nombre}* ($${it.precio_unitario * it.cantidad})${mods}${notasItem}`;
      }).join('\n\n');

      const canalTxt = tipoEntrega === 'delivery' ? `ðŸ›µ Delivery ($${costoEnvio})` : 'ðŸª Retiro en Mostrador (Take Away)';
      const dirTxt = tipoEntrega === 'delivery'
        ? `\nðŸ“ *DirecciÃ³n:* ${direccion.trim()}${apartamento.trim() ? ` (${apartamento.trim()})` : ''}${resolvedGmapsUrl ? `\nðŸ—ºï¸ *UbicaciÃ³n Maps:* ${resolvedGmapsUrl}` : ''}`
        : '';

      const pagoTxt =
        metodoPago === 'efectivo'
          ? `Efectivo${pagaCon.trim() ? ` (Paga con $${pagaCon.trim()})` : ''}`
          : metodoPago === 'tarjeta'
          ? 'POS Tarjeta (DÃ©bito/CrÃ©dito)'
          : 'Transferencia Bancaria';

      const textoWhatsApp = `*Â¡Hola NalÃº Poke Bowls TacuarembÃ³!* ðŸ¥—ðŸŒŠ
Acabo de realizar el *Pedido #${numOrden}* desde la web oficial:

ðŸ‘¤ *Cliente:* ${nombre.trim()}
ðŸ“§ *Email:* ${email.trim()}
ðŸ“± *TelÃ©fono:* ${telefono.trim()}
ðŸ›µ *Entrega:* ${canalTxt}${dirTxt}
ðŸ’³ *MÃ©todo de Pago:* ${pagoTxt}

*Detalle del Pedido:*
${lineasItems}

*TOTAL A PAGAR: $${total} UYU*
${notas.trim() ? `\nðŸ’¬ *Comentarios:* ${notas.trim()}` : ''}`;

      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(textoWhatsApp)}`;

      if (res.success) {
        onOrderSuccess(numOrden, whatsappUrl);
      } else {
        setErrorMsg('No se pudo registrar el pedido en el sistema. Intenta de nuevo.');
      }
    } catch (err: any) {
      setErrorMsg('Error de conexiÃ³n al enviar el pedido.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" style={{ maxWidth: '540px' }} onClick={e => e.stopPropagation()}>
        
        {/* Cabecera del Checkout */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Confirmar Pedido</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
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

          {/* â”€â”€ 1. Datos pre-cargados desde Google (One Tap silencioso) â”€â”€ */}
          {googleUser && (
            <div style={{ background: 'var(--bg-sand)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {googleUser.picture ? (
                <img
                  src={googleUser.picture}
                  alt=""
                  style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid var(--primary)', flexShrink: 0 }}
                />
              ) : (
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>G</div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)' }}>{googleUser.name}</span>
                  <span style={{ fontSize: '0.65rem', background: '#DCFCE7', color: '#166534', padding: '2px 6px', borderRadius: 'var(--radius-full)', fontWeight: 700 }}>Google âœ“</span>
                </div>
                <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  Datos pre-cargados Â· {googleUser.email}
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setGoogleUser(null); localStorage.removeItem('nalu_google_user'); }}
                style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: '4px', flexShrink: 0 }}
              >
                Ã—
              </button>
            </div>
          )}

          {/* â”€â”€ 2. Tipo de Entrega â”€â”€ */}
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

          {/* â”€â”€ 3. Datos del Cliente â”€â”€ */}
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
                name="name" autoComplete="name" placeholder="Ej: NicolÃ¡s Franco"
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
                name="email" autoComplete="email" placeholder="ejemplo@gmail.com"
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
                TelÃ©fono / WhatsApp *
              </label>
              <input
                type="tel"
                required
                value={telefono}
                onChange={e => setTelefono(e.target.value)}
                name="tel" autoComplete="tel" placeholder="Ej: 099 123 456"
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

            {/* â”€â”€ 4. DirecciÃ³n Tipo Google Maps (Solo Delivery) â”€â”€ */}
            {tipoEntrega === 'delivery' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                      DirecciÃ³n en TacuarembÃ³ / Google Maps *
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
                      <span>{buscandoGps ? 'Obteniendo GPS...' : 'ðŸ“ Mi UbicaciÃ³n'}</span>
                    </button>
                  </div>

                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      required
                      value={direccion}
                      onChange={e => handleSearchAddress(e.target.value)}
                      placeholder="Calle y nÃºmero, o pegÃ¡ enlace de Google Maps..."
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

                    {/* Desplegable de sugerencias de direcciÃ³n */}
                    {showAddressDropdown && addressSuggestions.length > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          zIndex: 100,
                          background: 'white',
                          borderRadius: 'var(--radius-md)',
                          boxShadow: 'var(--shadow-lg)',
                          border: '1px solid var(--border-light)',
                          marginTop: '4px',
                          maxHeight: '180px',
                          overflowY: 'auto',
                        }}
                      >
                        {addressSuggestions.map((s, idx) => (
                          <div
                            key={idx}
                            onClick={() => selectSuggestion(s)}
                            style={{
                              padding: '10px 14px',
                              borderBottom: '1px solid var(--border-light)',
                              cursor: 'pointer',
                              fontSize: '0.82rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-sand)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                          >
                            <MapPin size={14} color="var(--primary)" style={{ flexShrink: 0 }} />
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{s.direccion || s.display_name.split(',')[0]}</div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {s.display_name}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Indicador de Google Maps vinculado */}
                  {googleMapsUrl && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.75rem', background: '#DCFCE7', color: '#166534', padding: '6px 10px', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                        <Check size={14} /> UbicaciÃ³n Google Maps verificada
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
                    placeholder="Ej: Apto 204, portÃ³n negro, timbre 2"
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

            {/* â”€â”€ 5. MÃ©todo de Pago (Efectivo, Tarjeta, Transferencia) â”€â”€ */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '8px', display: 'block' }}>
                MÃ©todo de Pago *
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
                    placeholder="Â¿Con cuÃ¡nto abonÃ¡s? (para llevarte cambio)"
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
                  ðŸ’³ Llevamos el POS inalÃ¡mbrico a tu puerta (DÃ©bito, CrÃ©dito, Master, Visa).
                </div>
              )}

              {metodoPago === 'transferencia' && (
                <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-sand)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                  ðŸ“² Te enviaremos los datos de cuenta (BROU / Prex / Santander) al WhatsApp para transferir.
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

          {/* â”€â”€ 6. Resumen de Totales â”€â”€ */}
          <div style={{ background: 'var(--bg-page)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Subtotal ({items.length} items):</span>
              <span style={{ fontWeight: 700 }}>${subtotal.toLocaleString()}</span>
            </div>
            {tipoEntrega === 'delivery' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Costo de EnvÃ­o:</span>
                <span style={{ fontWeight: 700 }}>${costoEnvio.toLocaleString()}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 900, marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-light)' }}>
              <span>Total a Pagar:</span>
              <span style={{ color: 'var(--primary)' }}>${total.toLocaleString()} UYU</span>
            </div>
          </div>

          {/* â”€â”€ 7. BotÃ³n de ConfirmaciÃ³n â”€â”€ */}
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

