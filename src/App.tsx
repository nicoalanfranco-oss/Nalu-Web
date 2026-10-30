import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { OrderStatusBanner, PedidoActivo } from './components/OrderStatusBanner';
import { HeroSection } from './components/HeroSection';
import { MenuSection } from './components/MenuSection';
import { PokeCustomizerModal } from './components/PokeCustomizerModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { NaluPOSView } from './components/NaluPOSView';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Footer } from './components/Footer';
import { ToastNotification, ToastData } from './components/ToastNotification';
import { ProductoElaborado, ProductoReventa, GrupoOpciones, CartItem, TenantInfo, MarcaInfo } from './types/food';
import { fetchNaluCatalogo, uploadComprobanteTransferencia, TENANT_INFO, MARCA_INFO, REAL_PLATOS, REAL_REVENTA, REAL_GRUPOS } from './services/api';
import { useStructuredData } from './hooks/useStructuredData';
import { CheckCircle2, Sparkles, Bell, ArrowRight, WifiOff, Paperclip, Clock } from 'lucide-react';
import { InstagramIcon, WhatsAppIcon } from './components/SocialIcons';

const BANCOS_TRANSFERENCIA = [
  {
    nombre: 'BROU',
    logo: './banks/brou.png',
    url: 'https://ebanking.brou.com.uy/frontend/loginStep1',
  },
  {
    nombre: 'Itaú',
    logo: './banks/itau.png',
    url: 'https://www.itau.com.uy/inst/',
  },
  {
    nombre: 'Santander',
    logo: './banks/santander.png',
    url: 'https://www.santander.com.uy/',
  },
  {
    nombre: 'BBVA',
    logo: './banks/bbva.png',
    url: 'https://bbvanet.bbva.com.uy/NetApp/Home/Index',
  },
  {
    nombre: 'Scotiabank',
    logo: './banks/scotiabank.png',
    url: 'https://www1.scotiabank.com.uy/scotiaenlinea/?_gl=1*18fzaop*_gcl_au*MTY5NTgxMzEwMi4xNzkwOTYwMjMy*_ga*MTA2ODkxODY1MC4xNzkwOTYwMjMy*_ga_1M8W9J9C2H*czE3OTA5NjAyMzIkbzEkZzAkdDE3OTA5NjAyMzIkajYwJGwwJGgw',
  },
  {
    nombre: 'Prex',
    logo: './banks/prex.svg',
    url: 'https://www.prexcard.com/login',
  },
];

export const App: React.FC = () => {
  const [tenant, setTenant] = useState<TenantInfo>(TENANT_INFO);
  const [marca, setMarca] = useState<MarcaInfo>(MARCA_INFO);
  const [platos, setPlatos] = useState<ProductoElaborado[]>(REAL_PLATOS);
  const [reventa, setReventa] = useState<ProductoReventa[]>(REAL_REVENTA);
  const [grupos, setGrupos] = useState<GrupoOpciones[]>(REAL_GRUPOS);
  const [loading, setLoading] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Notificación flotante Toast
  const [toast, setToast] = useState<ToastData | null>(null);

  // Estados de modales y drawers
  const [isCustomizerOpen, setIsCustomizerOpen] = useState<boolean>(false);
  const [platoPersonalizando, setPlatoPersonalizando] = useState<ProductoElaborado | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [orderSuccessNumber, setOrderSuccessNumber] = useState<number | null>(null);
  const [orderSuccessPedidoId, setOrderSuccessPedidoId] = useState<number | null>(null);
  const [comprobanteUrlSuccess, setComprobanteUrlSuccess] = useState<string | null>(null);
  const [uploadingComprobanteSuccess, setUploadingComprobanteSuccess] = useState<boolean>(false);
  const [orderWhatsAppUrl, setOrderWhatsAppUrl] = useState<string>('');
  const [orderPaymentMethod, setOrderPaymentMethod] = useState<'efectivo' | 'tarjeta' | 'transferencia' | null>(null);
  const [copiedPrex, setCopiedPrex] = useState<boolean>(false);

  // Estado del Carrito
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('nalu_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Pestaña activa móvil
  const [mobileTab, setMobileTab] = useState<'inicio' | 'menu'>('inicio');
  const [activeOrders, setActiveOrders] = useState<PedidoActivo[]>([]);
  const [posInitialTab, setPosInitialTab] = useState<'carrito' | 'pedidos'>('carrito');

  const getCustomerEmail = (): string | null => {
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
  };

  // Listener para estado de conexión
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Guardar carrito en LocalStorage
  useEffect(() => {
    localStorage.setItem('nalu_cart', JSON.stringify(cart));
  }, [cart]);

  // Cargar catálogo inicial desde Food Backend (Tenant 1, Marca 1)
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await fetchNaluCatalogo();
      setPlatos(data.elaborados);
      setReventa(data.reventa || []);
      setGrupos(data.gruposOpciones);
      if (data.tenant) setTenant(data.tenant);
      if (data.marca) setMarca(data.marca);
      setLoading(false);
    };
    load();
  }, []);

  // JSON-LD Schema.org dinámico — se actualiza con los datos de la BD
  useStructuredData({ tenant, marca, platos, reventa });

  // Totales de carrito
  const cartCount = cart.reduce((acc, it) => acc + it.cantidad, 0);
  const cartTotal = cart.reduce((acc, it) => acc + it.precio_unitario * it.cantidad, 0);

  // Abrir modal de personalización con el plato por defecto (Poke 3 Proteínas o el primero personalizable)
  const handleOpenGeneralCustomizer = () => {
    const bowlPersonalizable =
      platos.find(p => p.es_personalizable && p.nombre.includes('3 PROTEINAS')) ||
      platos.find(p => p.es_personalizable) ||
      platos[0];

    if (bowlPersonalizable) {
      setPlatoPersonalizando(bowlPersonalizable);
      setIsCustomizerOpen(true);
    }
  };

  // Abrir personalización para un plato específico
  const handleSelectPlatoParaPersonalizar = (plato: ProductoElaborado) => {
    setPlatoPersonalizando(plato);
    setIsCustomizerOpen(true);
  };

  // Agregar al carrito producto ya armado o de agregado directo
  const handleAddToCart = (item: CartItem, openDrawer: boolean = false) => {
    setCart(prev => {
      const existingIdx = prev.findIndex(
        i =>
          i.producto_id === item.producto_id &&
          i.precio_unitario === item.precio_unitario &&
          JSON.stringify(i.modificadores) === JSON.stringify(item.modificadores) &&
          i.notas === item.notas
      );

      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx].cantidad += item.cantidad;
        return copy;
      }
      return [...prev, item];
    });

    setToast({
      id: `${item.id}_${Date.now()}`,
      title: item.nombre,
      subtitle: item.modificadores && item.modificadores.length > 0
        ? `${item.modificadores.length} opciones personalizadas`
        : '¡Agregado con éxito al pedido!',
      image: item.imagen_url || undefined,
      price: item.precio_unitario * item.cantidad,
    });

    if (openDrawer) {
      setIsCartOpen(true);
    }
  };

  // Quick add para platos sin personalización obligatoria
  const handleQuickAddToCart = (plato: ProductoElaborado) => {
    const cartItem: CartItem = {
      id: `${plato.producto_elaborado_id}_${Date.now()}`,
      producto_id: plato.producto_elaborado_id,
      tipo: 'elaborado',
      nombre: plato.nombre,
      categoria: plato.categoria,
      precio_base: Number(plato.precio_venta),
      precio_unitario: Number(plato.precio_venta),
      cantidad: 1,
      imagen_url: plato.imagen_url || './hero_bandejas_nalu.jpg',
      modificadores: [],
    };
    handleAddToCart(cartItem, false);
  };

  // Quick add para productos de reventa (bebidas)
  const handleQuickAddReventa = (r: ProductoReventa) => {
    const cartItem: CartItem = {
      id: `rev_${r.producto_reventa_id}_${Date.now()}`,
      producto_id: r.producto_reventa_id,
      tipo: 'reventa',
      nombre: r.nombre,
      categoria: r.categoria || 'Bebidas',
      precio_base: Number(r.precio_venta),
      precio_unitario: Number(r.precio_venta),
      cantidad: 1,
      imagen_url: r.imagen_url || './hero_bandejas_nalu.jpg',
      modificadores: [],
    };
    handleAddToCart(cartItem, false);
  };

  // Actualizar cantidad en carrito
  const handleUpdateQty = (id: string, delta: number) => {
    setCart(prev =>
      prev
        .map(i => {
          if (i.id === id) {
            const nuevaCant = i.cantidad + delta;
            return nuevaCant > 0 ? { ...i, cantidad: nuevaCant } : null;
          }
          return i;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  // Eliminar item de carrito
  const handleRemoveItem = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  // Pedido completado con éxito
  const handleOrderSuccess = (orderNumber: number, whatsappUrl?: string, paymentMethod?: 'efectivo' | 'tarjeta' | 'transferencia', pedidoId?: number) => {
    setOrderSuccessNumber(orderNumber);
    setOrderSuccessPedidoId(pedidoId || null);
    setComprobanteUrlSuccess(null);
    setOrderPaymentMethod(paymentMethod || null);
    if (whatsappUrl) setOrderWhatsAppUrl(whatsappUrl);
    setCart([]);
    setIsCheckoutOpen(false);
    setIsCartOpen(false);

    // Auto-copiar nro de cuenta si es transferencia
    if (paymentMethod === 'transferencia') {
      const cuentaNum = marca.numero_cuenta || '1472492';
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(cuentaNum).then(() => {
          setCopiedPrex(true);
        }).catch(() => {});
      } else {
        setCopiedPrex(true);
      }
    } else {
      setCopiedPrex(false);
    }
  };

  // Listener para sincronización silenciosa en segundo plano
  useEffect(() => {
    const handleOrderSynced = (e: any) => {
      const { pedido_id, numero_orden } = e.detail || {};
      if (pedido_id) setOrderSuccessPedidoId(pedido_id);
      if (numero_orden) setOrderSuccessNumber(numero_orden);
    };
    window.addEventListener('nalu:order_synced', handleOrderSynced);
    return () => window.removeEventListener('nalu:order_synced', handleOrderSynced);
  }, []);

  // Copiar cuenta al portapapeles manual
  const handleCopyPrex = () => {
    const cuentaNum = marca.numero_cuenta || '1472492';
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(cuentaNum);
      setCopiedPrex(true);
    }
  };

  // Scroll a la sección del menú
  const handleExploreMenu = () => {
    const el = document.getElementById('menu');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileTab('menu');
  };

  return (
    <div className="app-layout">
      {/* Alerta de modo offline */}
      {!isOnline && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: '#D97706',
          color: 'white',
          textAlign: 'center',
          padding: '6px 12px',
          fontSize: '0.78rem',
          fontWeight: 700,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px'
        }}>
          <WifiOff size={14} />
          <span>Modo offline activado — Puedes continuar navegando y armando tu pedido.</span>
        </div>
      )}

      {/* Banner de instalación PWA: ahora integrado dentro de Navbar */}

      {/* Barra de Navegación Principal */}
      <Navbar
        marca={marca}
        tenant={tenant}
        cartCount={cartCount}
        cartTotal={cartTotal}
        onOpenCart={() => {
          setPosInitialTab('carrito');
          setIsCartOpen(true);
        }}
        onOpenCustomizer={handleOpenGeneralCustomizer}
      />

      {/* Banner de seguimiento de pedido en tiempo real */}
      <OrderStatusBanner
        onOpenMisPedidos={() => {
          setPosInitialTab('pedidos');
          setIsCartOpen(true);
        }}
        onPedidosChange={setActiveOrders}
      />

      {/* Contenido Principal */}
      <main>
        <HeroSection />

        <MenuSection
          platos={platos}
          reventa={reventa}
          grupos={grupos}
          loading={loading}
          onSelectPlatoParaPersonalizar={handleSelectPlatoParaPersonalizar}
          onQuickAddToCart={handleQuickAddToCart}
          onQuickAddReventa={handleQuickAddReventa}
        />
      </main>

      {/* Pie de Página */}
      <Footer marca={marca} tenant={tenant} />

      {/* Barra de Navegación Inferior Móvil (oculta si hay un modal abierto para no bloquear botones de acción) */}
      {!isCustomizerOpen && !isCartOpen && !isCheckoutOpen && !orderSuccessNumber && (
        <MobileBottomNav
          activeTab={mobileTab}
          cartCount={cartCount}
          activeOrdersCount={activeOrders.length}
          onNavigate={tab => {
            setMobileTab(tab);
            if (tab === 'inicio') {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              handleExploreMenu();
            }
          }}
          onOpenCustomizer={handleOpenGeneralCustomizer}
          onOpenCart={(tab) => {
            setPosInitialTab(tab || 'carrito');
            setIsCartOpen(true);
          }}
        />
      )}

      {/* Notificación Flotante Toast al agregar items */}
      <ToastNotification
        toast={toast}
        onClose={() => setToast(null)}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Modal de Personalización "Arma tu Poke" con Fotos de Ingredientes */}
      {isCustomizerOpen && (
        <PokeCustomizerModal
          plato={platoPersonalizando}
          grupos={grupos}
          onClose={() => setIsCustomizerOpen(false)}
          onAddToCart={item => handleAddToCart(item, true)}
        />
      )}

      {/* Vista POS completa (reemplaza CartDrawer) */}
      {isCartOpen && (
        <NaluPOSView
          isOpen={isCartOpen}
          platos={platos}
          reventa={reventa}
          cart={cart}
          marca={marca}
          activeOrders={activeOrders}
          initialTab={posInitialTab}
          customerEmail={getCustomerEmail()}
          onClose={() => setIsCartOpen(false)}
          onUpdateQty={handleUpdateQty}
          onRemoveItem={handleRemoveItem}
          onQuickAdd={handleQuickAddToCart}
          onQuickAddReventa={handleQuickAddReventa}
          onSelectPlatoParaPersonalizar={(plato) => {
            setIsCartOpen(false);
            handleSelectPlatoParaPersonalizar(plato);
          }}
          onOpenCheckout={() => {
            setIsCartOpen(false);
            setIsCheckoutOpen(true);
          }}
        />
      )}

      {/* Modal de Checkout / Envío a Cocina */}
      {isCheckoutOpen && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          items={cart}
          marca={marca}
          onClose={() => setIsCheckoutOpen(false)}
          onOrderSuccess={handleOrderSuccess}
        />
      )}

      {/* Pantalla Modal de Pedido Confirmado */}
      {orderSuccessNumber && (
        <div className="modal-backdrop" onClick={() => setOrderSuccessNumber(null)}>
          <div
            className="modal-container"
            style={{
              maxWidth: '450px',
              width: '92%',
              padding: '18px 18px 16px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: '#FAF8F5',
              borderRadius: '24px',
              border: '1.5px solid rgba(120, 140, 80, 0.18)',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.25)',
              position: 'relative',
              overflowY: 'auto',
              overflowX: 'hidden',
              maxHeight: '92vh',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* 1 y 2) Fila de Cabecera: Logo Nalú grande a la izquierda, Tick + Badge a la derecha */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                width: '100%',
                marginBottom: '8px',
                paddingBottom: '8px',
                borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
              }}
            >
              {/* Logo Nalú contra la izquierda */}
              <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                <img
                  src="./Logo_nalu-sinfondo.png"
                  alt="Nalú Poke"
                  style={{
                    height: '68px',
                    width: 'auto',
                    maxWidth: '125px',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 3px 8px rgba(0, 0, 0, 0.08))',
                  }}
                />
              </div>

              {/* Tick de confirmación arriba y Badge abajo en la misma fila */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  flex: 1,
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'rgba(31, 157, 85, 0.12)',
                    color: '#1F9D55',
                    border: '1.5px solid rgba(31, 157, 85, 0.28)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 3px 10px rgba(31, 157, 85, 0.15)',
                  }}
                >
                  <CheckCircle2 size={20} strokeWidth={2.5} />
                </div>

                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: marca?.estado_atencion && !marca.estado_atencion.abierto_ahora ? 'rgba(245, 158, 11, 0.12)' : 'rgba(31, 157, 85, 0.12)',
                    color: marca?.estado_atencion && !marca.estado_atencion.abierto_ahora ? '#b45309' : '#15803d',
                    padding: '4px 10px',
                    borderRadius: '999px',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    border: `1px solid ${marca?.estado_atencion && !marca.estado_atencion.abierto_ahora ? 'rgba(245, 158, 11, 0.25)' : 'rgba(31, 157, 85, 0.22)'}`,
                    lineHeight: 1.2,
                    textAlign: 'center',
                  }}
                >
                  <Sparkles size={12} />
                  <span>
                    {marca?.estado_atencion && !marca.estado_atencion.abierto_ahora
                      ? 'Pedido anticipado confirmado'
                      : 'Tu orden ya fue recibida en la cocina'}
                  </span>
                </div>
              </div>
            </div>

            {/* Mensaje de preparación o aviso de programado */}
            <p
              style={{
                color: '#2D3748',
                fontSize: '0.88rem',
                lineHeight: 1.35,
                fontWeight: 600,
                margin: '0 0 8px',
                maxWidth: '100%',
              }}
            >
              {marca?.estado_atencion && !marca.estado_atencion.abierto_ahora
                ? 'El local está cerrado en este momento. Tu pedido quedó agendado y comenzará su preparación en el horario de apertura.'
                : 'Nuestro equipo está preparando tu comida'}
            </p>

            {/* Banner de horario si está cerrado */}
            {marca?.estado_atencion && !marca.estado_atencion.abierto_ahora && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.28)',
                  borderRadius: '12px',
                  padding: '10px 12px',
                  marginBottom: '10px',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: '#F59E0B',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Clock size={15} />
                </div>
                <div style={{ fontSize: '0.82rem', color: '#B45309', lineHeight: 1.35 }}>
                  <strong style={{ display: 'block', color: '#92400E' }}>Entrada a cocina programada:</strong>
                  <span>
                    {marca.estado_atencion.proxima_apertura_fecha_hora ? (
                      (() => {
                        const d = new Date(marca.estado_atencion.proxima_apertura_fecha_hora);
                        const dia = d.toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'numeric' });
                        const hora = d.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' });
                        return `${dia.charAt(0).toUpperCase() + dia.slice(1)} a las ${hora} hs`;
                      })()
                    ) : (
                      marca.estado_atencion.proxima_apertura || 'Próxima apertura del local'
                    )}
                  </span>
                </div>
              </div>
            )}

            {/* Aviso de seguimiento del trayecto en la web */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 90, 54, 0.07)',
                border: '1px solid rgba(255, 90, 54, 0.18)',
                borderRadius: '12px',
                padding: '6px 10px',
                marginBottom: '10px',
                textAlign: 'left',
                width: '100%',
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: '#FF5A36',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Bell size={13} />
              </div>
              <span style={{ fontSize: '0.78rem', color: '#334155', fontWeight: 600, lineHeight: 1.3 }}>
                Podés seguir el trayecto de tu pedido en la web: te informamos cada paso.
              </span>
            </div>

            {/* Si el usuario eligió Transferencia Bancaria */}
            {orderPaymentMethod === 'transferencia' && (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                {/* 3, 4, 5) Tarjeta de Cuenta Prex con cuenta arriba y mensaje en renglones */}
                <div
                  onClick={handleCopyPrex}
                  style={{
                    background: '#FFFFFF',
                    border: '1.5px solid rgba(95, 37, 159, 0.25)',
                    borderRadius: '16px',
                    padding: '10px 14px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(95, 37, 159, 0.08)',
                    textAlign: 'left',
                    width: '100%',
                  }}
                  title="Toca para volver a copiar el número de cuenta"
                >
                  {/* Fila superior: CUENTA PREX en línea con el número */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#5F259F', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Cuenta {marca.banco_nombre || 'Prex'}:
                    </span>
                    <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#13191D', letterSpacing: '1px' }}>
                      {marca.numero_cuenta || '1472492'}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.84rem', color: '#475569', fontWeight: 700, marginBottom: '6px' }}>
                    Titular: Cinthia Bottero
                  </div>

                  {/* Mensaje en varios renglones a lo largo del cuadro */}
                  <div
                    style={{
                      background: 'rgba(31, 157, 85, 0.1)',
                      border: '1px solid rgba(31, 157, 85, 0.25)',
                      borderRadius: '10px',
                      padding: '6px 10px',
                      color: '#166534',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      lineHeight: 1.35,
                    }}
                  >
                    <div>✓ Número de cuenta copiado al portapapeles.</div>
                    <div style={{ color: '#2b5329', fontWeight: 600 }}>Pegá el número en el formulario de tu banco para realizar la transferencia.</div>
                  </div>
                </div>

                {/* Accesos directos a Bancos */}
                <div>
                  <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#64748B', textAlign: 'left', marginBottom: '5px', paddingLeft: '2px' }}>
                    Acceso directo a tu banco:
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '6px',
                      width: '100%',
                    }}
                  >
                    {BANCOS_TRANSFERENCIA.map((banco) => (
                      <a
                        key={banco.nombre}
                        href={banco.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '3px',
                          padding: '7px 4px',
                          background: '#FFFFFF',
                          borderRadius: '12px',
                          border: '1.5px solid rgba(0, 0, 0, 0.08)',
                          textDecoration: 'none',
                          color: '#13191D',
                          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
                          transition: 'transform 0.15s ease',
                        }}
                      >
                        <img
                          src={banco.logo}
                          alt={banco.nombre}
                          style={{
                            width: '30px',
                            height: '30px',
                            objectFit: 'contain',
                            borderRadius: '6px',
                          }}
                        />
                        <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>
                          {banco.nombre}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Adjuntar comprobante de pago */}
                <div style={{ marginTop: '4px', padding: '10px 12px', background: '#F8FAFC', borderRadius: '14px', border: '1.5px dashed #CBD5E1', textAlign: 'center' }}>
                  <input
                    id="input-comprobante-success"
                    type="file"
                    accept="image/*,.pdf"
                    style={{ display: 'none' }}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingComprobanteSuccess(true);
                      let targetId = orderSuccessPedidoId;
                      if (!targetId) {
                        for (let i = 0; i < 20; i++) {
                          await new Promise(r => setTimeout(r, 500));
                          if (orderSuccessPedidoId) {
                            targetId = orderSuccessPedidoId;
                            break;
                          }
                        }
                      }
                      if (!targetId) {
                        setUploadingComprobanteSuccess(false);
                        return;
                      }
                      const res = await uploadComprobanteTransferencia(targetId, file);
                      setUploadingComprobanteSuccess(false);
                      if (res.success && res.comprobante_url) {
                        setComprobanteUrlSuccess(res.comprobante_url);
                      }
                    }}
                  />
                  {comprobanteUrlSuccess ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#166534', fontWeight: 800, fontSize: '0.82rem' }}>
                      <span>✓ Comprobante enviado</span>
                      <a href={comprobanteUrlSuccess} target="_blank" rel="noopener noreferrer" style={{ color: '#5F259F', textDecoration: 'underline', fontSize: '0.76rem' }}>Ver ↗</a>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={uploadingComprobanteSuccess}
                      onClick={() => document.getElementById('input-comprobante-success')?.click()}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        width: '100%',
                        padding: '8px 12px',
                        background: '#5F259F',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: 800,
                        fontSize: '0.82rem',
                        cursor: uploadingComprobanteSuccess ? 'wait' : 'pointer',
                        boxShadow: '0 2px 8px rgba(95, 37, 159, 0.25)',
                      }}
                    >
                      <Paperclip size={14} />
                      <span>{uploadingComprobanteSuccess ? 'Subiendo comprobante...' : 'Adjuntar comprobante de pago'}</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Acciones: Contacto (WhatsApp & Instagram) y Volver al Menú */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginTop: '4px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', textAlign: 'center' }}>
                ¿Dudas con tu pedido? Escribinos:
              </div>

              {/* Botones de contacto: WhatsApp y Instagram */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '8px',
                  width: '100%',
                }}
              >
                {/* Botón WhatsApp */}
                <a
                  href={`https://wa.me/59899127786?text=${encodeURIComponent(
                    orderSuccessNumber
                      ? `¡Hola Nalú! Consulta sobre mi pedido #N${orderSuccessNumber}.`
                      : '¡Hola Nalú! Consulta sobre mi pedido.'
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '10px 12px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    textDecoration: 'none',
                    boxShadow: '0 4px 14px rgba(37, 211, 102, 0.28)',
                    transition: 'all 0.2s ease',
                  }}
                  title="Escribinos por WhatsApp al 099 127 786"
                >
                  <WhatsAppIcon size={20} />
                  <span>099 127 786</span>
                </a>

                {/* Botón Instagram estilizado que redirecciona directamente al chat con Nalú */}
                <a
                  href="https://ig.me/m/nalupoke.uy"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '10px 12px',
                    borderRadius: '14px',
                    background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    textDecoration: 'none',
                    boxShadow: '0 4px 14px rgba(220, 39, 67, 0.25)',
                    transition: 'all 0.2s ease',
                  }}
                  title="Chatear con Nalú en Instagram (@nalupoke.uy)"
                >
                  <InstagramIcon size={20} />
                  <span>Chat con Nalú</span>
                </a>
              </div>

              <button
                onClick={() => setOrderSuccessNumber(null)}
                className="btn-secondary"
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  borderRadius: '14px',
                  fontWeight: 700,
                  fontSize: '0.86rem',
                  background: '#FFFFFF',
                  border: '1.5px solid rgba(19, 25, 29, 0.12)',
                  color: '#13191D',
                  cursor: 'pointer',
                  marginTop: '2px',
                }}
              >
                Volver al Menú
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
