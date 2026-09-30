import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { FreshIngredientsShowcase } from './components/FreshIngredientsShowcase';
import { MenuSection } from './components/MenuSection';
import { StoryCultureSection } from './components/StoryCultureSection';
import { PokeCustomizerModal } from './components/PokeCustomizerModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { NaluPOSView } from './components/NaluPOSView';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Footer } from './components/Footer';
import { ToastNotification, ToastData } from './components/ToastNotification';
import { ProductoElaborado, ProductoReventa, GrupoOpciones, CartItem, TenantInfo, MarcaInfo } from './types/food';
import { fetchNaluCatalogo, TENANT_INFO, MARCA_INFO } from './services/api';
import { CheckCircle2, Sparkles, MessageCircle, ArrowRight, WifiOff } from 'lucide-react';

export const App: React.FC = () => {
  const [tenant, setTenant] = useState<TenantInfo>(TENANT_INFO);
  const [marca, setMarca] = useState<MarcaInfo>(MARCA_INFO);
  const [platos, setPlatos] = useState<ProductoElaborado[]>([]);
  const [reventa, setReventa] = useState<ProductoReventa[]>([]);
  const [grupos, setGrupos] = useState<GrupoOpciones[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
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
        <HeroSection
          marca={marca}
          tenant={tenant}
          onOpenCustomizer={handleOpenGeneralCustomizer}
          onExploreMenu={handleExploreMenu}
        />

        <FreshIngredientsShowcase grupos={grupos} />

        <MenuSection
          platos={platos}
          reventa={reventa}
          grupos={grupos}
          loading={loading}
          onSelectPlatoParaPersonalizar={handleSelectPlatoParaPersonalizar}
          onQuickAddToCart={handleQuickAddToCart}
          onQuickAddReventa={handleQuickAddReventa}
        />

        <StoryCultureSection />
      </main>

      {/* Pie de Página */}
      <Footer marca={marca} tenant={tenant} />

      {/* Barra de Navegación Inferior Móvil (Mobile First) */}
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
            style={{ maxWidth: '440px', padding: '36px 24px', textAlign: 'center', alignItems: 'center' }}
            onClick={e => e.stopPropagation()}
          >
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--secondary-light)',
                color: 'var(--secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <CheckCircle2 size={40} />
            </div>

            <span className="badge-tag green" style={{ marginBottom: '10px' }}>
              <Sparkles size={14} /> ¡ORDEN RECIBIDA EN COCINA!
            </span>

            <h3 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '6px' }}>
              Pedido #{orderSuccessNumber}
            </h3>

            <p style={{ color: 'var(--text-body)', fontSize: '0.92rem', lineHeight: 1.5, marginBottom: '24px' }}>
              Tu orden ha sido enviada exitosamente a la cocina de Nalú Poke. Nuestro equipo ya se encuentra preparando tus bowls con la máxima frescura.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
              <a
                href={orderWhatsAppUrl || `https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `¡Hola Nalú Poke! Acabo de realizar el Pedido #${orderSuccessNumber} desde la web.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="btn-primary"
                style={{ background: '#25D366', boxShadow: '0 8px 24px rgba(37, 211, 102, 0.3)', width: '100%' }}
              >
                <MessageCircle size={18} />
                <span>Enviar Pedido a WhatsApp</span>
              </a>

              <button
                onClick={() => setOrderSuccessNumber(null)}
                className="btn-secondary"
                style={{ width: '100%' }}
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
