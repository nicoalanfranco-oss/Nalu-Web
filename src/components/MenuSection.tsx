import React, { useState, useMemo } from 'react';
import { Plus, Sparkles, ShoppingBag } from 'lucide-react';
import { ProductoElaborado, CartItem } from '../types/food';

interface MenuSectionProps {
  platos: ProductoElaborado[];
  onSelectPlatoParaPersonalizar: (plato: ProductoElaborado) => void;
  onQuickAddToCart: (plato: ProductoElaborado) => void;
}

export const MenuSection: React.FC<MenuSectionProps> = ({
  platos,
  onSelectPlatoParaPersonalizar,
  onQuickAddToCart,
}) => {
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('todos');

  // Extraer categorías únicas
  const categorias = useMemo(() => {
    const list = Array.from(new Set(platos.map(p => p.categoria || 'Pokes')));
    return ['todos', ...list];
  }, [platos]);

  // Filtrar platos
  const platosFiltrados = useMemo(() => {
    if (categoriaSeleccionada === 'todos') return platos;
    return platos.filter(p => p.categoria === categoriaSeleccionada);
  }, [platos, categoriaSeleccionada]);

  return (
    <section id="menu" className="menu-section">
      <div className="page-container">
        <div className="section-header">
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
                {cat === 'todos' ? '✨ Todos los Platos' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grilla de Platos */}
        <div className="dishes-grid">
          {platosFiltrados.map(plato => {
            const isCustom = plato.es_personalizable;

            return (
              <div key={plato.producto_elaborado_id} className="dish-card">
                <div className="dish-image-wrapper">
                  <img
                    src={plato.imagen_url || '/hero_bandejas_nalu.jpg'}
                    alt={plato.nombre}
                    className="dish-image"
                  />
                  {isCustom && (
                    <span className="dish-custom-badge">
                      <Sparkles size={12} style={{ display: 'inline', marginRight: 4 }} />
                      Personalizable
                    </span>
                  )}
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
                        className="dish-add-btn"
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
        </div>
      </div>
    </section>
  );
};
