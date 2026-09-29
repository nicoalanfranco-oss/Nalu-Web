import React, { useState, useMemo } from 'react';
import { X, Check, Sparkles, Plus, AlertCircle } from 'lucide-react';
import { ProductoElaborado, GrupoOpciones, OpcionPersonalizacion, CartItem } from '../types/food';

interface PokeCustomizerModalProps {
  plato: ProductoElaborado | null;
  grupos: GrupoOpciones[];
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
}

export const PokeCustomizerModal: React.FC<PokeCustomizerModalProps> = ({
  plato,
  grupos,
  onClose,
  onAddToCart,
}) => {
  if (!plato) return null;

  // Filtrar grupos pertenecientes a este plato o grupos generales de pokes
  const gruposAplicables = useMemo(() => {
    const directos = grupos.filter(g => g.producto_elaborado_id === plato.producto_elaborado_id);
    if (directos.length > 0) return directos;
    // Si no tiene grupos asignados directamente, usar los grupos de poke genéricos (e.g. Base, Proteína, Verduras, Salsas, Toppings)
    return grupos;
  }, [grupos, plato]);

  // Estado de opciones elegidas: array de { grupo_id, opcion }
  const [opcionesElegidas, setOpcionesElegidas] = useState<{ grupo_id: number; opcion: OpcionPersonalizacion }[]>([]);
  const [notasCocina, setNotasCocina] = useState<string>('');

  // Toggle de selección respetando max_opciones
  const handleToggleOpcion = (grupo: GrupoOpciones, opc: OpcionPersonalizacion) => {
    const yaSeleccionada = opcionesElegidas.some(
      item => item.grupo_id === grupo.grupo_id && item.opcion.opcion_id === opc.opcion_id
    );

    if (yaSeleccionada) {
      setOpcionesElegidas(prev =>
        prev.filter(item => !(item.grupo_id === grupo.grupo_id && item.opcion.opcion_id === opc.opcion_id))
      );
    } else {
      const seleccionadasEnGrupo = opcionesElegidas.filter(item => item.grupo_id === grupo.grupo_id);
      const maximo = grupo.max_opciones || 99;

      if (maximo === 1) {
        // Reemplazar la opción del grupo si el máximo es 1
        setOpcionesElegidas(prev => [
          ...prev.filter(item => item.grupo_id !== grupo.grupo_id),
          { grupo_id: grupo.grupo_id, opcion: opc },
        ]);
      } else if (seleccionadasEnGrupo.length < maximo) {
        setOpcionesElegidas(prev => [...prev, { grupo_id: grupo.grupo_id, opcion: opc }]);
      }
    }
  };

  // Cálculo de precio total con extras
  const extrasTotal = useMemo(() => {
    return opcionesElegidas.reduce((acc, curr) => acc + (Number(curr.opcion.precio_extra) || 0), 0);
  }, [opcionesElegidas]);

  const precioFinalUnitario = Number(plato.precio_venta) + extrasTotal;

  // Manejador de agregar al carrito
  const handleConfirmar = () => {
    const modificadores = opcionesElegidas.map(item => {
      const grupo = gruposAplicables.find(g => g.grupo_id === item.grupo_id);
      return {
        opcion_id: item.opcion.opcion_id,
        nombre: item.opcion.nombre,
        precio_extra: Number(item.opcion.precio_extra) || 0,
        grupo_nombre: grupo?.nombre,
      };
    });

    const cartItem: CartItem = {
      id: `${plato.producto_elaborado_id}_${Date.now()}`,
      producto_id: plato.producto_elaborado_id,
      tipo: 'elaborado',
      nombre: plato.nombre,
      categoria: plato.categoria,
      precio_base: Number(plato.precio_venta),
      precio_unitario: precioFinalUnitario,
      cantidad: 1,
      imagen_url: plato.imagen_url || '/hero_bandejas_nalu.jpg',
      modificadores,
      notas: notasCocina.trim() || undefined,
    };

    onAddToCart(cartItem);
    onClose();
  };

  // Helpers de iconografía por grupo
  const getIngredientIcon = (nombre: string) => {
    const n = nombre.toLowerCase();
    if (n.includes('arroz')) return '🍚';
    if (n.includes('quinoa')) return '🌾';
    if (n.includes('fideo')) return '🍜';
    if (n.includes('lechuga')) return '🥬';
    if (n.includes('salmón') || n.includes('atún') || n.includes('pescado')) return '🐟';
    if (n.includes('pollo')) return '🍗';
    if (n.includes('camarón') || n.includes('camarones')) return '🍤';
    if (n.includes('carne') || n.includes('cerdo')) return '🥩';
    if (n.includes('huevo')) return '🍳';
    if (n.includes('palta') || n.includes('aguacate')) return '🥑';
    if (n.includes('edamame') || n.includes('pepino')) return '🥒';
    if (n.includes('tomate')) return '🍅';
    if (n.includes('zanahoria')) return '🥕';
    if (n.includes('cebolla')) return '🧅';
    if (n.includes('soja') || n.includes('salsa') || n.includes('teriyaki') || n.includes('mayo')) return '🥣';
    if (n.includes('sésamo') || n.includes('crunch') || n.includes('chips')) return '✨';
    return '🥗';
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        {/* Cabecera con Imagen de Presentación (Fusión EatPokeBros + POS Food) */}
        <div className="modal-header-hero">
          <img
            src={plato.imagen_url || '/hero_bandejas_nalu.jpg'}
            alt={plato.nombre}
            className="modal-header-img"
          />
          <div className="modal-header-overlay">
            <h3 style={{ fontSize: '1.4rem', fontWeight: 900 }}>{plato.nombre}</h3>
            <p style={{ fontSize: '0.84rem', opacity: 0.9 }}>
              {plato.descripcion || 'Selecciona tus ingredientes favoritos para preparar tu bowl'}
            </p>
          </div>
          <button onClick={onClose} className="modal-close-btn" aria-label="Cerrar modal">
            <X size={20} />
          </button>
        </div>

        {/* Cuerpo con grupos de ingredientes con fotos del POS */}
        <div className="modal-scroll-body">
          {gruposAplicables.map(grupo => {
            const seleccionadas = opcionesElegidas.filter(i => i.grupo_id === grupo.grupo_id);
            const cantSel = seleccionadas.length;

            return (
              <div key={grupo.grupo_id} className="custom-group-card">
                <div className="custom-group-header">
                  <div className="custom-group-title">
                    <h4>{grupo.nombre}</h4>
                    {cantSel > 0 && (
                      <span className="badge-tag gold" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                        {cantSel} {grupo.max_opciones ? `/ ${grupo.max_opciones}` : ''}
                      </span>
                    )}
                  </div>
                  <span className="custom-group-limit">
                    {grupo.max_opciones === 1
                      ? 'Elegí 1 opción'
                      : grupo.max_opciones
                      ? `Hasta ${grupo.max_opciones} opciones`
                      : 'Libre'}
                  </span>
                </div>

                {/* Cuadrícula de opciones con miniaturas estilo Caja Registradora Food */}
                <div className="ingredients-selector-grid">
                  {grupo.opciones.map(opc => {
                    const isSelected = opcionesElegidas.some(
                      item => item.grupo_id === grupo.grupo_id && item.opcion.opcion_id === opc.opcion_id
                    );

                    return (
                      <button
                        key={opc.opcion_id}
                        type="button"
                        onClick={() => handleToggleOpcion(grupo, opc)}
                        className={`ingredient-option-btn ${isSelected ? 'selected' : ''}`}
                      >
                        <div className="ingredient-left">
                          {opc.imagen_url ? (
                            <img
                              src={opc.imagen_url}
                              alt={opc.nombre}
                              className="ingredient-thumb"
                            />
                          ) : (
                            <div className="ingredient-icon-placeholder">
                              {getIngredientIcon(opc.nombre)}
                            </div>
                          )}
                          <span className="ingredient-name" title={opc.nombre}>
                            {opc.nombre}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {Number(opc.precio_extra) > 0 && (
                            <span className="ingredient-extra">
                              +${Number(opc.precio_extra).toLocaleString()}
                            </span>
                          )}
                          <div className="ingredient-check">
                            {isSelected && <Check size={14} />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Notas para Cocina */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              ✏️ Notas especiales para preparación (opcional)
            </label>
            <input
              type="text"
              value={notasCocina}
              onChange={e => setNotasCocina(e.target.value)}
              placeholder="Ej: salsa aparte, sin cebolla, palta en láminas..."
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                border: '1.5px solid var(--border-light)',
                background: 'var(--bg-page)',
                fontSize: '0.88rem',
                color: 'var(--text-main)',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Footer con Total y Agregar */}
        <div className="modal-footer">
          <div className="modal-price-summary">
            <span className="modal-price-label">Total del plato con adicionales:</span>
            <span className="modal-price-value">${precioFinalUnitario.toLocaleString()}</span>
          </div>

          <button onClick={handleConfirmar} className="btn-primary" style={{ padding: '12px 24px' }}>
            <Plus size={18} />
            <span>Agregar al Pedido</span>
          </button>
        </div>
      </div>
    </div>
  );
};
