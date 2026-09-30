import React, { useState, useMemo } from 'react';
import { Plus, Sparkles, Eye } from 'lucide-react';
import { ProductoElaborado, ProductoReventa, GrupoOpciones } from '../types/food';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { DishDetailModal } from './DishDetailModal';

interface MenuSectionProps {
  platos: ProductoElaborado[];
  reventa?: ProductoReventa[];
  grupos?: GrupoOpciones[];
  loading?: boolean;
  onSelectPlatoParaPersonalizar: (plato: ProductoElaborado) => void;
  onQuickAddToCart: (plato: ProductoElaborado) => void;
  onQuickAddReventa?: (item: ProductoReventa) => void;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  'todos': '✨',
  'Pokes': '🥗',
  'Ensaladas': '🥬',
  'Bebidas': '🥤',
  'Postres': '🍨',
  'Acompañamientos': '🍟',
};

// Tarjeta individual de Plato con scroll reveal independiente y 3D tilt
const DishCardItem: React.FC<{
  plato: ProductoElaborado;
  idx: number;
  onSelectPlatoParaPersonalizar: (plato: ProductoElaborado) => void;
  onQuickAddToCart: (plato: ProductoElaborado) => void;
  onOpenPreview: (plato: ProductoElaborado) => void;
}> = ({ plato, idx, onSelectPlatoParaPersonalizar, onQuickAddToCart, onOpenPreview }) => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  const isCustom = plato.es_personalizable;

  return (
    <div
      ref={ref}
      className={`dish-card scroll-reveal-dish ${isVisible ? 'revealed' : ''}`}
      style={{
        transitionDelay: isVisible ? `${(idx % 4) * 85}ms` : '0ms',
      }}
    >
      {/* Contenedor de Imagen Clickable para ver Detalle */}
      <div
        className="dish-image-wrapper"
        onClick={() => onOpenPreview(plato)}
        role="button"
        tabIndex={0}
        title={`Click para ver detalles de ${plato.nombre}`}
      >
        <img
          src={plato.imagen_url || '/hero_bandejas_nalu.jpg'}
          alt={plato.nombre}
          className="dish-image"
          loading="lazy"
        />
        {isCustom ? (
          <span className="dish-custom-badge">
            <Sparkles size={12} style={{ display: 'inline', marginRight: 4 }} />
            Personalizable
          </span>
        ) : (
          <span className="dish-custom-badge dish-badge-chef">
            ⭐ Nalú
          </span>
        )}
        
        {/* Overlay en hover con botón "Ver detalle" */}
        <div className="dish-image-hover-overlay">
          <span className="dish-preview-hint-pill">
            <Eye size={14} />
            <span>Ver detalles</span>
          </span>
        </div>
      </div>

      <div className="dish-body">
        <div className="dish-title-row">
          <h3
            className="dish-title"
            onClick={() => onOpenPreview(plato)}
            style={{ cursor: 'pointer' }}
          >
            {plato.nombre}
          </h3>
        </div>

        {/* Descripción con tipografía aumentada y nítida */}
        <p className="dish-description">
          {plato.descripcion || 'Elaborado artesanalmente con ingredientes seleccionados y aderezos especiales de Tacuarembó.'}
        </p>

        <div className="dish-footer-row">
          <span className="dish-price">
            ${Number(plato.precio_venta).toLocaleString()}
          </span>
          {isCustom ? (
            <button
              onClick={() => onSelectPlatoParaPersonalizar(plato)}
              className="dish-add-btn dish-add-btn-custom"
              title="Armar bowl a medida"
            >
              <Sparkles size={15} />
              <span>Armar Bowl</span>
            </button>
          ) : (
            <button
              onClick={() => onQuickAddToCart(plato)}
              className="dish-add-btn"
              title="Agregar directo al pedido"
            >
              <Plus size={16} />
              <span>Agregar</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Tarjeta individual de Bebida Reventa
const ReventaCardItem: React.FC<{
  item: ProductoReventa;
  idx: number;
  onQuickAddReventa?: (item: ProductoReventa) => void;
  onOpenPreview: (item: ProductoReventa) => void;
}> = ({ item, idx, onQuickAddReventa, onOpenPreview }) => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  return (
    <div
      ref={ref}
      className={`dish-card scroll-reveal-dish ${isVisible ? 'revealed' : ''}`}
      style={{
        transitionDelay: isVisible ? `${(idx % 4) * 85}ms` : '0ms',
      }}
    >
      <div
        className="dish-image-wrapper"
        onClick={() => onOpenPreview(item)}
        role="button"
        tabIndex={0}
        title={`Click para ver detalles de ${item.nombre}`}
      >
        <img
          src={item.imagen_url || '/hero_bandejas_nalu.jpg'}
          alt={item.nombre}
          className="dish-image"
          loading="lazy"
        />
        <span className="dish-custom-badge" style={{ background: 'var(--sea-blue)', color: 'white', borderColor: 'transparent' }}>
          🥤 Bebida
        </span>
        <div className="dish-image-hover-overlay">
          <span className="dish-preview-hint-pill">
            <Eye size={14} />
            <span>Ver detalles</span>
          </span>
        </div>
      </div>

      <div className="dish-body">
        <div className="dish-title-row">
          <h3
            className="dish-title"
            onClick={() => onOpenPreview(item)}
            style={{ cursor: 'pointer' }}
          >
            {item.nombre}
          </h3>
        </div>
        <p className="dish-description">
          Bebida fría para acompañar tu bowl. Perfecta para refrescarte.
        </p>
        <div className="dish-footer-row">
          <span className="dish-price">
            ${Number(item.precio_venta).toLocaleString()}
          </span>
          <button
            onClick={() => onQuickAddReventa && onQuickAddReventa(item)}
            className="dish-add-btn"
            title="Agregar bebida al pedido"
            style={{ background: 'linear-gradient(135deg, var(--sea-blue), #0369a1)' }}
          >
            <Plus size={16} />
            <span>Agregar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const MenuSection: React.FC<MenuSectionProps> = ({
  platos,
  reventa = [],
  grupos = [],
  loading = false,
  onSelectPlatoParaPersonalizar,
  onQuickAddToCart,
  onQuickAddReventa,
}) => {
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('todos');
  const { ref: sectionRef, isVisible } = useScrollAnimation({ threshold: 0.05 });

  // Estado para la ventana modal emergente de vista previa de plato
  const [previewItem, setPreviewItem] = useState<
    { tipo: 'elaborado'; data: ProductoElaborado } | { tipo: 'reventa'; data: ProductoReventa } | null
  >(null);

  // Extraer categorías únicas (platos + añadir Bebidas si hay reventa o bebidas)
  const categorias = useMemo(() => {
    const list = Array.from(new Set(platos.map(p => p.categoria || 'Pokes')));
    if (reventa.length > 0 && !list.includes('Bebidas')) {
      list.push('Bebidas');
    }
    return ['todos', ...list];
  }, [platos, reventa]);

  // Filtrar platos elaborados:
  // REQUERIMIENTO 2.1: En "todos" NO se muestran las bebidas.
  const platosFiltrados = useMemo(() => {
    if (categoriaSeleccionada === 'todos') {
      return platos.filter(p => (p.categoria || '').toLowerCase() !== 'bebidas');
    }
    if (categoriaSeleccionada === 'Bebidas') {
      return platos.filter(p => (p.categoria || '').toLowerCase() === 'bebidas');
    }
    return platos.filter(p => p.categoria === categoriaSeleccionada);
  }, [platos, categoriaSeleccionada]);

  // Filtrar bebidas de reventa:
  // REQUERIMIENTO 2.1: Las bebidas se ven ÚNICAMENTE al ir a la pestaña "Bebidas"
  const reventaFiltrada = useMemo(() => {
    if (categoriaSeleccionada === 'Bebidas') return reventa;
    return [];
  }, [reventa, categoriaSeleccionada]);

  const showReventa = reventaFiltrada.length > 0;
  const showPlatos = platosFiltrados.length > 0;

  return (
    <section id="menu" className="menu-section" ref={sectionRef}>
      <div className="page-container">
        <div className={`section-header scroll-reveal ${isVisible ? 'revealed' : ''}`}>
          <span className="badge-tag gold section-tag">
            <Sparkles size={14} /> NUESTRA CARTA
          </span>
          <h2>Explora el Menú de Nalú</h2>
          <p>
            Platos pensados para energizar tu día: combina tus bases y proteínas favoritas o elige nuestras creaciones de autor.
          </p>
        </div>

        {/* Barra de Filtro de Categorías con Scroll Sticky */}
        <div className="menu-sticky-categories">
          <div className="categories-scroll">
            {categorias.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoriaSeleccionada(cat)}
                className={`category-tab-btn ${categoriaSeleccionada === cat ? 'active' : ''}`}
              >
                <span>{CATEGORY_EMOJIS[cat] || '🍽️'}</span>
                {cat === 'todos' ? 'Todos los Platos' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grilla de Platos con animaciones 3D de entrada progresiva al escrolear */}
        <div className="dishes-grid" key={categoriaSeleccionada}>
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton-card">
                <div className="skeleton-img skeleton-box" />
                <div className="skeleton-body">
                  <div className="skeleton-title skeleton-box" />
                  <div className="skeleton-desc skeleton-box" />
                  <div className="skeleton-desc-short skeleton-box" />
                  <div className="skeleton-footer">
                    <div className="skeleton-price skeleton-box" />
                    <div className="skeleton-btn skeleton-box" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <>
              {/* Platos elaborados */}
              {showPlatos && platosFiltrados.map((plato, idx) => (
                <DishCardItem
                  key={plato.producto_elaborado_id}
                  plato={plato}
                  idx={idx}
                  onSelectPlatoParaPersonalizar={onSelectPlatoParaPersonalizar}
                  onQuickAddToCart={onQuickAddToCart}
                  onOpenPreview={(p) => setPreviewItem({ tipo: 'elaborado', data: p })}
                />
              ))}

              {/* Bebidas (solo visibles al filtrar por Bebidas) */}
              {showReventa && reventaFiltrada.map((r, idx) => (
                <ReventaCardItem
                  key={`rev_${r.producto_reventa_id}`}
                  item={r}
                  idx={idx}
                  onQuickAddReventa={onQuickAddReventa}
                  onOpenPreview={(rev) => setPreviewItem({ tipo: 'reventa', data: rev })}
                />
              ))}

              {/* Mensaje de estado si una categoría no tiene ítems */}
              {!showPlatos && !showReventa && (
                <div className="empty-category-message">
                  <p>No hay platos disponibles en esta categoría en este momento.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal emergente rápido de detalles de plato al cliquear la imagen */}
      {previewItem && (
        <DishDetailModal
          item={previewItem}
          grupos={grupos}
          onClose={() => setPreviewItem(null)}
          onCustomize={onSelectPlatoParaPersonalizar}
          onQuickAdd={onQuickAddToCart}
          onQuickAddReventa={onQuickAddReventa}
        />
      )}
    </section>
  );
};
