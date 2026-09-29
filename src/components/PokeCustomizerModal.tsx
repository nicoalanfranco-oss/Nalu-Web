import React, { useState, useMemo } from 'react';
import { X, Check, ArrowRight, ArrowLeft, Plus, Sparkles, AlertCircle } from 'lucide-react';
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

  // Filtrar grupos ordenados por paso_orden
  const gruposOrdenados = useMemo(() => {
    const directos = grupos.filter(g => g.producto_elaborado_id === plato.producto_elaborado_id);
    const baseGrupos = directos.length > 0 ? directos : grupos.filter(g => g.producto_elaborado_id === 16 || g.producto_elaborado_id === 10);
    const res = baseGrupos.length > 0 ? baseGrupos : grupos;
    return [...res].sort((a, b) => (a.paso_orden || 1) - (b.paso_orden || 1));
  }, [grupos, plato]);

  // Paso actual del Wizard (0 a N-1)
  const [pasoActivo, setPasoActivo] = useState<number>(0);

  // Opciones elegidas
  const [opcionesElegidas, setOpcionesElegidas] = useState<{ grupo_id: number; opcion: OpcionPersonalizacion }[]>([]);
  const [notasCocina, setNotasCocina] = useState<string>('');

  const grupoActual = gruposOrdenados[pasoActivo] || gruposOrdenados[0];

  // Alternar selección
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
        // Reemplazar si el máximo es 1
        setOpcionesElegidas(prev => [
          ...prev.filter(item => item.grupo_id !== grupo.grupo_id),
          { grupo_id: grupo.grupo_id, opcion: opc },
        ]);
      } else if (seleccionadasEnGrupo.length < maximo) {
        setOpcionesElegidas(prev => [...prev, { grupo_id: grupo.grupo_id, opcion: opc }]);
      }
    }
  };

  // Remover opción desde el visualizador en vivo
  const handleRemoveOpcion = (opcId: number) => {
    setOpcionesElegidas(prev => prev.filter(item => item.opcion.opcion_id !== opcId));
  };

  // Validación del paso actual
  const seleccionadasEnPaso = opcionesElegidas.filter(i => i.grupo_id === grupoActual?.grupo_id);
  const minRequerido = grupoActual?.min_opciones || 0;
  const pasoValido = seleccionadasEnPaso.length >= minRequerido;

  // Cálculo de precio
  const extrasTotal = useMemo(() => {
    return opcionesElegidas.reduce((acc, curr) => acc + (Number(curr.opcion.precio_extra) || 0), 0);
  }, [opcionesElegidas]);

  const precioFinalUnitario = Number(plato.precio_venta) + extrasTotal;

  // Confirmar y agregar al carrito
  const handleConfirmar = () => {
    const modificadores = opcionesElegidas.map(item => {
      const grupo = gruposOrdenados.find(g => g.grupo_id === item.grupo_id);
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

  const esUltimoPaso = pasoActivo === gruposOrdenados.length - 1;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        {/* Cabecera con Imagen de Presentación de Nalú Poke */}
        <div className="modal-header-hero" style={{ height: '140px' }}>
          <img
            src={plato.imagen_url || '/hero_bandejas_nalu.jpg'}
            alt={plato.nombre}
            className="modal-header-img"
          />
          <div className="modal-header-overlay">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900 }}>{plato.nombre}</h3>
            <p style={{ fontSize: '0.8rem', opacity: 0.9 }}>
              Paso a paso en Tacuarembó: arma tu bowl fresco y a tu medida
            </p>
          </div>
          <button onClick={onClose} className="modal-close-btn" aria-label="Cerrar modal">
            <X size={18} />
          </button>
        </div>

        {/* Stepper Horizontal Guiado (Paso 1 a 6) */}
        <div className="customizer-stepper-wrapper">
          <div className="customizer-stepper">
            {gruposOrdenados.map((grp, idx) => {
              const cant = opcionesElegidas.filter(i => i.grupo_id === grp.grupo_id).length;
              const isCompleted = cant >= (grp.min_opciones || 0) && cant > 0;
              const isActive = pasoActivo === idx;

              return (
                <button
                  key={grp.grupo_id}
                  type="button"
                  onClick={() => setPasoActivo(idx)}
                  className={`stepper-tab ${isActive ? 'active' : isCompleted ? 'completed' : ''}`}
                >
                  <span className="stepper-num" style={{
                    background: isActive ? 'rgba(255,255,255,0.25)' : isCompleted ? '#788c50' : 'var(--bg-sand)',
                    color: isCompleted && !isActive ? 'white' : 'inherit'
                  }}>
                    {isCompleted ? '✓' : idx + 1}
                  </span>
                  <span>{grp.nombre}</span>
                  {cant > 0 && <span style={{ fontSize: '0.7rem', opacity: 0.85 }}>({cant})</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Visualizador en Vivo del Bowl ("Tu Bowl Armándose") */}
        {opcionesElegidas.length > 0 && (
          <div className="live-bowl-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>
              <span>🥗 Bowl:</span>
            </div>
            <div className="live-bowl-chips">
              {opcionesElegidas.map(item => (
                <span key={item.opcion.opcion_id} className="live-bowl-chip">
                  {item.opcion.nombre}
                  {Number(item.opcion.precio_extra) > 0 && ` (+$${item.opcion.precio_extra})`}
                  <span
                    onClick={() => handleRemoveOpcion(item.opcion.opcion_id)}
                    className="live-bowl-chip-remove"
                    title="Eliminar"
                  >
                    ×
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Banner de ayuda del paso actual */}
        {grupoActual && (
          <div className="step-helper-banner">
            <div>
              <strong>Paso {pasoActivo + 1}: {grupoActual.nombre}</strong>
              <span style={{ marginLeft: '6px', opacity: 0.9 }}>
                ({grupoActual.min_opciones === 1 && grupoActual.max_opciones === 1
                  ? 'Elige 1 opción requerida'
                  : grupoActual.min_opciones > 0
                  ? `Elige entre ${grupoActual.min_opciones} y ${grupoActual.max_opciones} opciones`
                  : `Opcional: hasta ${grupoActual.max_opciones} opciones`})
              </span>
            </div>
            <span style={{ fontWeight: 800, color: pasoValido ? '#788c50' : '#D97706' }}>
              {seleccionadasEnPaso.length} / {grupoActual.max_opciones}
            </span>
          </div>
        )}

        {/* Contenido: Opciones del Paso Actual con Fotos Reales de la BD */}
        <div className="modal-scroll-body" style={{ flex: 1 }}>
          {grupoActual && (
            <div className="ingredients-selector-grid">
              {grupoActual.opciones.map(opc => {
                const isSelected = opcionesElegidas.some(
                  item => item.grupo_id === grupoActual.grupo_id && item.opcion.opcion_id === opc.opcion_id
                );

                return (
                  <button
                    key={opc.opcion_id}
                    type="button"
                    onClick={() => handleToggleOpcion(grupoActual, opc)}
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
                        <div className="ingredient-icon-placeholder" style={{ background: '#788c50', color: 'white', fontWeight: 800, fontSize: '0.75rem' }}>
                          {opc.nombre.substring(0, 2).toUpperCase()}
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
          )}

          {/* Notas para Cocina (visible en el último paso o al armar) */}
          {esUltimoPaso && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                ✏️ Notas para preparación en cocina de Tacuarembó (opcional)
              </label>
              <input
                type="text"
                value={notasCocina}
                onChange={e => setNotasCocina(e.target.value)}
                placeholder="Ej: salsa teriyaki aparte, carne bien cocida, sin sal..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1.5px solid var(--border-light)',
                  background: 'var(--bg-page)',
                  fontSize: '0.88rem',
                  outline: 'none',
                }}
              />
            </div>
          )}
        </div>

        {/* Footer del Wizard: Anterior, Precio y Siguiente/Agregar */}
        <div className="modal-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {pasoActivo > 0 && (
              <button
                type="button"
                onClick={() => setPasoActivo(prev => prev - 1)}
                className="btn-secondary"
                style={{ padding: '10px 16px', fontSize: '0.85rem' }}
              >
                <ArrowLeft size={16} />
                <span>Anterior</span>
              </button>
            )}
            <div className="modal-price-summary">
              <span className="modal-price-label">Total Bowl:</span>
              <span className="modal-price-value">${precioFinalUnitario.toLocaleString()}</span>
            </div>
          </div>

          <div>
            {!esUltimoPaso ? (
              <button
                type="button"
                onClick={() => setPasoActivo(prev => prev + 1)}
                disabled={!pasoValido}
                className="btn-primary"
                style={{
                  padding: '12px 20px',
                  fontSize: '0.9rem',
                  opacity: pasoValido ? 1 : 0.6,
                  cursor: pasoValido ? 'pointer' : 'not-allowed'
                }}
              >
                <span>Siguiente Paso</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirmar}
                disabled={!pasoValido}
                className="btn-primary"
                style={{
                  padding: '12px 22px',
                  fontSize: '0.92rem',
                  background: '#788c50',
                  boxShadow: '0 8px 24px rgba(120, 140, 80, 0.4)',
                  opacity: pasoValido ? 1 : 0.6,
                  cursor: pasoValido ? 'pointer' : 'not-allowed'
                }}
              >
                <Plus size={18} />
                <span>Agregar Bowl al Pedido</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
