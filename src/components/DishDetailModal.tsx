import React, { useEffect } from 'react';
import { X, Sparkles, Plus, Check, ShoppingBag } from 'lucide-react';
import { ProductoElaborado, ProductoReventa, GrupoOpciones } from '../types/food';

interface DishDetailModalProps {
  item: { tipo: 'elaborado'; data: ProductoElaborado } | { tipo: 'reventa'; data: ProductoReventa } | null;
  grupos?: GrupoOpciones[];
  onClose: () => void;
  onCustomize: (plato: ProductoElaborado) => void;
  onQuickAdd: (plato: ProductoElaborado) => void;
  onQuickAddReventa?: (item: ProductoReventa) => void;
}

export const DishDetailModal: React.FC<DishDetailModalProps> = ({
  item,
  grupos = [],
  onClose,
  onCustomize,
  onQuickAdd,
  onQuickAddReventa,
}) => {
  // Manejo de tecla ESC para cerrar rápido
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Bloquear scroll del fondo mientras el modal de detalle esté abierto
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  if (!item) return null;

  const isElaborado = item.tipo === 'elaborado';
  const plato = isElaborado ? (item.data as ProductoElaborado) : null;
  const reventa = !isElaborado ? (item.data as ProductoReventa) : null;

  const nombre = plato ? plato.nombre : reventa?.nombre || '';
  const descripcion = plato ? plato.descripcion : reventa?.descripcion;
  const precio = plato ? plato.precio_venta : reventa?.precio_venta || 0;
  const imagenUrl = (plato ? plato.imagen_url : reventa?.imagen_url) || '/hero_bandejas_nalu.jpg';
  const isCustomizable = plato?.es_personalizable ?? false;

  // Pasos estándar de Nalú si no vienen grupos específicos
  const defaultPasos = [
    { orden: 1, titulo: 'Base Nutritiva', desc: 'Arroz sushi, Quinoa, Fideo integral o Mix de hojas verdes' },
    { orden: 2, titulo: 'Proteínas Seleccionadas', desc: 'Pollo grill, Carne vacuna, Cerdo barbacoa, Atún o Camarones' },
    { orden: 3, titulo: 'Verduras & Frutas', desc: 'Palta hass, Mango fresco, Ananá, Tomate cherry, Choclo o Pepino' },
    { orden: 4, titulo: 'Salsas & Crunch', desc: 'Teriyaki artesanal, Alioli suave, Cebolla crispy o Sésamo tostado' },
  ];

  return (
    <div className="dish-modal-backdrop" onClick={onClose}>
      <div
        className="dish-modal-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dish-modal-title"
      >
        {/* Botón cerrar flotante rápido */}
        <button
          className="dish-modal-close-btn"
          onClick={onClose}
          aria-label="Cerrar vista de plato"
        >
          <X size={20} />
        </button>

        <div className="dish-modal-content-grid">
          {/* Lado Imagen */}
          <div className="dish-modal-media-col">
            <img
              src={imagenUrl}
              alt={nombre}
              className="dish-modal-image"
            />
            <div className="dish-modal-image-gradient" />
            
            {/* Sin badges sobre la imagen */}
          </div>

          {/* Lado Detalles */}
          <div className="dish-modal-info-col">
            <div className="dish-modal-header">
              <span className="dish-modal-cat-tag">
                {isElaborado ? (plato?.categoria || 'Plato Nalú') : 'Bebida'}
              </span>
              <h2 id="dish-modal-title" className="dish-modal-title">
                {nombre}
              </h2>
              <div className="dish-modal-price">
                ${Number(precio).toLocaleString()}
              </div>
            </div>

            <div className="dish-modal-body-scroll">
              {/* Descripción completa sin corte */}
              <div className="dish-modal-desc-box">
                <p className="dish-modal-description">
                  {descripcion || (isElaborado
                    ? 'Plato preparado artesanalmente en Tacuarembó con ingredientes frescos de nuestras bandejas a la vista.'
                    : 'Bebida fría y refrescante, ideal para acompañar tu menú Nalú.')}
                </p>
              </div>

              {/* Sección de Pasos o Insumos */}
              {isCustomizable ? (
                <div className="dish-modal-steps-section">
                  <h4 className="dish-modal-steps-heading">
                    <Sparkles size={16} /> Pasos para armar este Bowl
                  </h4>
                  <div className="dish-modal-steps-list">
                    {grupos && grupos.length > 0 ? (
                      grupos.map((grp, idx) => (
                        <div key={grp.grupo_id || idx} className="dish-step-item">
                          <div className="dish-step-badge-number">{idx + 1}</div>
                          <div className="dish-step-info">
                            <div className="dish-step-title">{grp.nombre}</div>
                            <div className="dish-step-hint">
                              {grp.max_opciones === 1
                                ? 'Elige 1 opción'
                                : `Hasta ${grp.max_opciones} opciones (${grp.min_opciones > 0 ? `mínimo ${grp.min_opciones}` : 'opcional'})`}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      defaultPasos.map((paso) => (
                        <div key={paso.orden} className="dish-step-item">
                          <div className="dish-step-badge-number">{paso.orden}</div>
                          <div className="dish-step-info">
                            <div className="dish-step-title">{paso.titulo}</div>
                            <div className="dish-step-hint">{paso.desc}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : isElaborado && plato?.insumos_receta && plato.insumos_receta.length > 0 ? (
                <div className="dish-modal-steps-section">
                  <h4 className="dish-modal-steps-heading">
                    🥗 Ingredientes Incluidos en la Receta
                  </h4>
                  <div className="dish-modal-chips-grid">
                    {plato.insumos_receta.map((ins, i) => (
                      <span key={i} className="dish-modal-ing-chip">
                        <Check size={12} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                        {ins.nombre}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="dish-modal-features-list">
                  <div className="dish-feature-row">
                    <span className="feature-icon">🌿</span>
                    <span>Ingredientes naturales preparados a diario en nuestra cocina</span>
                  </div>
                  <div className="dish-feature-row">
                    <span className="feature-icon">⚡</span>
                    <span>Listo para disfrutar en el salón o con envío rápido por delivery</span>
                  </div>
                </div>
              )}
            </div>

            {/* Acciones del Modal */}
            <div className="dish-modal-actions">
              {isCustomizable ? (
                <button
                  type="button"
                  className="btn btn-primary dish-modal-cta-btn"
                  onClick={() => {
                    onClose();
                    if (plato) onCustomize(plato);
                  }}
                >
                  <Sparkles size={18} />
                  <span>Personalizar y Armar Bowl</span>
                </button>
              ) : isElaborado ? (
                <button
                  type="button"
                  className="btn btn-primary dish-modal-cta-btn"
                  onClick={() => {
                    onClose();
                    if (plato) onQuickAdd(plato);
                  }}
                >
                  <ShoppingBag size={18} />
                  <span>Agregar al Pedido • ${Number(precio).toLocaleString()}</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary dish-modal-cta-btn"
                  onClick={() => {
                    onClose();
                    if (reventa && onQuickAddReventa) onQuickAddReventa(reventa);
                  }}
                  style={{ background: 'linear-gradient(135deg, var(--sea-blue), #0369a1)' }}
                >
                  <Plus size={18} />
                  <span>Agregar Bebida • ${Number(precio).toLocaleString()}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
