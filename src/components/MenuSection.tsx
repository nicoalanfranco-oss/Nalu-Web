import React, { useState, useMemo } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { ProductoElaborado, ProductoReventa } from '../types/food';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

interface MenuSectionProps {
  platos: ProductoElaborado[];
  reventa?: ProductoReventa[];
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

export const MenuSection: React.FC<MenuSectionProps> = ({
  platos,
  reventa = [],
  loading = false,
  onSelectPlatoParaPersonalizar,
  onQuickAddToCart,
  onQuickAddReventa,
}) => {
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('todos');
  const { ref: sectionRef, isVisible } = useScrollAnimation({ threshold: 0.05 });

  // Extraer categorías únicas (platos + añadir Bebidas si hay reventa)
  const categorias = useMemo(() => {
    const list = Array.from(new Set(platos.map(p => p.categoria || 'Pokes')));
    if (reventa.length > 0 && !list.includes('Bebidas')) {
      list.push('Bebidas');
    }
    return ['todos', ...list];
  }, [platos, reventa]);

  // Filtrar platos elaborados
  const platosFiltrados = useMemo(() => {
    if (categoriaSeleccionada === 'todos') return platos;
    if (categoriaSeleccionada === 'Bebidas') return [];
    return platos.filter(p => p.categoria === categoriaSeleccionada);
  }, [platos, categoriaSeleccionada]);

  // Filtrar bebidas de reventa
  const reventaFiltrada = useMemo(() => {
    if (categoriaSeleccionada === 'todos' || categoriaSeleccionada === 'Bebidas') return reventa;
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

        {/* Grilla de Platos con animaciones o Skeletons */}
        <div className="dishes-grid">
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
              {showPlatos && platosFiltrados.map((plato, idx) => {
                const isCustom = plato.es_personalizable;
                return (
                  <div
                    key={plato.producto_elaborado_id}
                    className={`dish-card scroll-reveal ${isVisible ? 'revealed' : ''}`}
                    style={{ transitionDelay: isVisible ? `${Math.min(idx * 80, 400)}ms` : '0ms' }}
                  >
                    <div className="dish-image-wrapper">
                      <img
                        src={plato.imagen_url || './hero_bandejas_nalu.jpg'}
                        alt={plato.nombre}
                        className="dish-image"
                        loading="lazy"
                      />
                      {isCustom && (
                        <span className="dish-custom-badge">
                          <Sparkles size={12} style={{ display: 'inline', marginRight: 4 }} />
                          Personalizable
                        </span>
                      )}
                      <div className="dish-image-hover-overlay" />
                    </div>

                    <div className="dish-body">
                      <div className="dish-title-row">
                        <h3 className="dish-title">{plato.nombre}</h3>
                      </div>
                      <p className="dish-description">
                        {plato.descripcion || 'Elaborado artesanalmente con ingredientes seleccionados y aderezos especiales.'}
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
              })}

              {/* Bebidas de reventa */}
              {showReventa && reventaFiltrada.map((r, idx) => (
                <div
                  key={`rev_${r.producto_reventa_id}`}
                  className={`dish-card scroll-reveal ${isVisible ? 'revealed' : ''}`}
                  style={{ transitionDelay: isVisible ? `${Math.min((platosFiltrados.length + idx) * 80, 500)}ms` : '0ms' }}
                >
                  <div className="dish-image-wrapper">
                    <img
                      src={r.imagen_url || './hero_bandejas_nalu.jpg'}
                      alt={r.nombre}
                      className="dish-image"
                      loading="lazy"
                    />
                    <span className="dish-custom-badge" style={{ background: 'var(--sea-blue)', color: 'white', borderColor: 'transparent' }}>
                      🥤 Bebida
                    </span>
                    <div className="dish-image-hover-overlay" />
                  </div>

                  <div className="dish-body">
                    <div className="dish-title-row">
                      <h3 className="dish-title">{r.nombre}</h3>
                    </div>
                    <p className="dish-description">
                      Bebida fría para acompañar tu bowl. Perfecta para refrescarte.
                    </p>
                    <div className="dish-footer-row">
                      <span className="dish-price">
                        ${Number(r.precio_venta).toLocaleString()}
                      </span>
                      <button
                        onClick={() => onQuickAddReventa && onQuickAddReventa(r)}
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
              ))}
            </>
          )}
        </div>
      </div>
    </section>
  );
};
