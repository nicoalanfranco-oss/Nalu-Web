import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
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
import { fetchNaluCatalogo, TENANT_INFO, MARCA_INFO, REAL_PLATOS, REAL_REVENTA, REAL_GRUPOS } from './services/api';
import { useStructuredData } from './hooks/useStructuredData';
import { CheckCircle2, Sparkles, Bell, ArrowRight, WifiOff } from 'lucide-react';

const InstagramIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

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
  const [orderWhatsAppUrl, setOrderWhatsAppUrl] = useState<string>('');

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
  const handleOrderSuccess = (orderNumber: number, whatsappUrl?: string) => {
    setOrderSuccessNumber(orderNumber);
    if (whatsappUrl) setOrderWhatsAppUrl(whatsappUrl);
    setCart([]);
    setIsCheckoutOpen(false);
    setIsCartOpen(false);
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
        onOpenCart={() => setIsCartOpen(true)}
        onOpenCustomizer={handleOpenGeneralCustomizer}
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
          onNavigate={tab => {
            setMobileTab(tab);
            if (tab === 'inicio') {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              handleExploreMenu();
            }
          }}
          onOpenCustomizer={handleOpenGeneralCustomizer}
          onOpenCart={() => setIsCartOpen(true)}
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
              maxWidth: '460px',
              padding: '32px 24px 26px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: '#FAF8F5',
              borderRadius: '28px',
              border: '1.5px solid rgba(120, 140, 80, 0.18)',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.22)',
              position: 'relative',
              overflow: 'hidden',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* 1) Encabezado: Logo de Nalú destacado */}
            <div style={{ marginBottom: '14px', display: 'flex', justifyContent: 'center' }}>
              <img
                src="./Logo_nalu-sinfondo.png"
                alt="Nalú Poke"
                style={{
                  height: '52px',
                  width: 'auto',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 3px 8px rgba(0, 0, 0, 0.08))',
                }}
              />
            </div>

            {/* Tick de confirmación verde */}
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(31, 157, 85, 0.12)',
                color: '#1F9D55',
                border: '2px solid rgba(31, 157, 85, 0.28)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '14px',
                boxShadow: '0 6px 18px rgba(31, 157, 85, 0.15)',
              }}
            >
              <CheckCircle2 size={36} strokeWidth={2.4} />
            </div>

            {/* 3) Badge aumentado: Tu orden ya fue recibida en la cocina */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(31, 157, 85, 0.12)',
                color: '#15803d',
                padding: '8px 18px',
                borderRadius: '999px',
                fontSize: '0.98rem',
                fontWeight: 700,
                letterSpacing: '0.01em',
                marginBottom: '14px',
                border: '1px solid rgba(31, 157, 85, 0.22)',
              }}
            >
              <Sparkles size={16} />
              <span>Tu orden ya fue recibida en la cocina</span>
            </div>

            {/* 4) Mensaje simplificado y mayor tamaño */}
            <p
              style={{
                color: '#2D3748',
                fontSize: '1.05rem',
                lineHeight: 1.55,
                fontWeight: 600,
                margin: '0 0 18px',
                maxWidth: '380px',
              }}
            >
              Nuestro equipo ya está preparando tu pedido con ingredientes frescos y la máxima dedicación.
            </p>

            {/* 6) Aviso de seguimiento del trayecto en la web */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: 'rgba(255, 90, 54, 0.07)',
                border: '1px solid rgba(255, 90, 54, 0.2)',
                borderRadius: '16px',
                padding: '12px 16px',
                marginBottom: '20px',
                textAlign: 'left',
                width: '100%',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: '#FF5A36',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Bell size={18} />
              </div>
              <span style={{ fontSize: '0.92rem', color: '#334155', fontWeight: 600, lineHeight: 1.4 }}>
                Podés seguir el trayecto de tu pedido en la web: te informamos cada paso.
              </span>
            </div>

            {/* Acciones: Instagram y Volver al Menú */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
              {/* 5) Botón Instagram en lugar de WhatsApp */}
              <a
                href="https://www.instagram.com/nalupoke.uy?stkn=ejVqMjd1dzhqZTVr&utm_source=qr"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '14px 18px',
                  borderRadius: '16px',
                  background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  textDecoration: 'none',
                  boxShadow: '0 8px 24px rgba(220, 39, 67, 0.28)',
                  transition: 'all 0.2s ease',
                }}
              >
                <InstagramIcon size={20} />
                <span>Cualquier consulta envianos un mensaje</span>
              </a>

              <button
                onClick={() => setOrderSuccessNumber(null)}
                className="btn-secondary"
                style={{
                  width: '100%',
                  padding: '13px 20px',
                  borderRadius: '16px',
                  fontWeight: 700,
                  background: '#FFFFFF',
                  border: '1.5px solid rgba(19, 25, 29, 0.12)',
                  color: '#13191D',
                  cursor: 'pointer',
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
