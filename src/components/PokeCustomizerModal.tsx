import React, { useState, useMemo, useEffect } from 'react';
import { X, Check, ArrowRight, ArrowLeft, Plus, Sparkles, AlertCircle, HelpCircle } from 'lucide-react';
import { ProductoElaborado, GrupoOpciones, OpcionPersonalizacion, CartItem } from '../types/food';
import { triggerHaptic } from '../utils/haptics';

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

  // Bloquear el scroll del fondo (body) mientras el modal esté abierto
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.classList.remove('modal-open');
    };
  }, []);

  const tieneBaseFija = Boolean(plato.insumos_receta && plato.insumos_receta.length > 0);

  // Filtrar grupos ordenados por paso_orden
  const gruposOrdenados = useMemo(() => {
    const directos = grupos.filter(g => g.producto_elaborado_id === plato.producto_elaborado_id);
    if (directos.length > 0) {
      return [...directos].sort((a, b) => (a.paso_orden || 1) - (b.paso_orden || 1));
    }
    const fallbackGrupos = grupos.filter(g => g.producto_elaborado_id === 16 || g.producto_elaborado_id === 10);
    const pool = fallbackGrupos.length > 0 ? fallbackGrupos : grupos;

    if (tieneBaseFija) {
      // Si el bowl ya tiene base/ingredientes fijos, sólo ofrecer pasos complementarios (Salsas, Toppings, etc.)
      const complementarios = pool.filter(g => {
        const nom = (g.nombre || '').toLowerCase();
        return !nom.includes('base') && !nom.includes('proteína') && !nom.includes('proteina');
      });
      if (complementarios.length > 0) {
        return [...complementarios].sort((a, b) => (a.paso_orden || 1) - (b.paso_orden || 1));
      }
    }

    return [...pool].sort((a, b) => (a.paso_orden || 1) - (b.paso_orden || 1));
  }, [grupos, plato, tieneBaseFija]);

  // Paso actual del Wizard (0 a N-1)
  const [pasoActivo, setPasoActivo] = useState<number>(0);

  // Opciones elegidas
  const [opcionesElegidas, setOpcionesElegidas] = useState<{ grupo_id: number; opcion: OpcionPersonalizacion }[]>([]);
  const [notasCocina, setNotasCocina] = useState<string>('');

  // Estado para el modal de decisión cuando se elige solo camarón en paso de proteínas
  const [camaronPromptModal, setCamaronPromptModal] = useState<{
    visible: boolean;
    grupo: GrupoOpciones;
    opcionCamaron: OpcionPersonalizacion;
  } | null>(null);

  // Flag para saber si el usuario ya tomó una decisión explícita sobre camarones
  const [decisionCamaronTomada, setDecisionCamaronTomada] = useState<boolean>(false);

  const grupoActual = gruposOrdenados[pasoActivo] || gruposOrdenados[0];

  // Helper para detectar si un grupo es de proteínas
  const esGrupoProteina = (g?: GrupoOpciones | null) => {
    if (!g) return false;
    const nom = (g.nombre || '').toLowerCase();
    return nom.includes('proteína') || nom.includes('proteina') || nom.includes('protein');
  };

  // Helper para detectar si una opción es camarón
  const esOpcionCamaron = (opc?: OpcionPersonalizacion | null) => {
    if (!opc) return false;
    const nom = (opc.nombre || '').toLowerCase();
    return nom.includes('camar') || nom.includes('shrimp') || opc.opcion_id === 25 || opc.opcion_id === 81;
  };

  // Alternar selección
  const handleToggleOpcion = (grupo: GrupoOpciones, opc: OpcionPersonalizacion) => {
    triggerHaptic('light');
    const yaSeleccionada = opcionesElegidas.some(
      item => item.grupo_id === grupo.grupo_id && item.opcion.opcion_id === opc.opcion_id
    );

    if (yaSeleccionada) {
      setDecisionCamaronTomada(false);
      setOpcionesElegidas(prev =>
        prev.filter(item => !(item.grupo_id === grupo.grupo_id && item.opcion.opcion_id === opc.opcion_id))
      );
    } else {
      setDecisionCamaronTomada(false);
      const seleccionadasEnGrupo = opcionesElegidas.filter(item => item.grupo_id === grupo.grupo_id);
      const maximo = grupo.max_opciones || 99;

      if (maximo === 1) {
        // Reemplazar si el máximo es 1
        setOpcionesElegidas(prev => [
          ...prev.filter(item => item.grupo_id !== grupo.grupo_id),
          { grupo_id: grupo.grupo_id, opcion: opc },
        ]);
      } else if (seleccionadasEnGrupo.length < maximo) {
        const nuevasSeleccionadas = [...seleccionadasEnGrupo, { grupo_id: grupo.grupo_id, opcion: opc }];
        setOpcionesElegidas(prev => [...prev, { grupo_id: grupo.grupo_id, opcion: opc }]);

        // Si es el grupo de proteínas y se acaba de seleccionar camarón quedando como única proteína elegida en un bowl de 2 o 3:
        if (esGrupoProteina(grupo) && esOpcionCamaron(opc) && nuevasSeleccionadas.length === 1 && maximo >= 2) {
          triggerHaptic('medium');
          setCamaronPromptModal({
            visible: true,
            grupo,
            opcionCamaron: opc,
          });
        }
      }
    }
  };

  // Remover opción desde el visualizador en vivo
  const handleRemoveOpcion = (opcId: number) => {
    triggerHaptic('light');
    setDecisionCamaronTomada(false);
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
  const handleConfirmar = (forzarSinPrompt = false) => {
    // Si en el paso de proteínas quedó únicamente 1 porción de camarón y no se le preguntó aún:
    const grupoProteina = gruposOrdenados.find(g => esGrupoProteina(g));
    if (grupoProteina && !decisionCamaronTomada && !forzarSinPrompt) {
      const seleccionadasEnPaso = opcionesElegidas.filter(i => i.grupo_id === grupoProteina.grupo_id);
      const soloTieneCamaron = seleccionadasEnPaso.length === 1 && esOpcionCamaron(seleccionadasEnPaso[0].opcion);
      const maxPermitido = grupoProteina.max_opciones || 2;
      if (soloTieneCamaron && maxPermitido >= 2 && !camaronPromptModal) {
        triggerHaptic('medium');
        setCamaronPromptModal({
          visible: true,
          grupo: grupoProteina,
          opcionCamaron: seleccionadasEnPaso[0].opcion,
        });
        return;
      }
    }

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

    triggerHaptic('success');
    onAddToCart(cartItem);
    onClose();
  };

  const esUltimoPaso = pasoActivo === gruposOrdenados.length - 1;

  // Acciones desde el diálogo de camarón:
  // 1. Doble camarón (+$180): agrega una 2da porción de camarón (con precio extra 90 cada una) y avanza
  const handleElegirDobleCamaron = () => {
    if (!camaronPromptModal) return;
    const { grupo, opcionCamaron } = camaronPromptModal;
    triggerHaptic('success');

    // Clonamos la opción de camarón con ID ficticio negativo para no colisionar en keys pero garantizar que viaje como 2da porción
    const segundaPorcion: OpcionPersonalizacion = {
      ...opcionCamaron,
      opcion_id: -Math.abs(opcionCamaron.opcion_id * 100 + 2),
      nombre: 'Camarones (2ª porción extra)',
      precio_extra: 90,
    };

    setOpcionesElegidas(prev => [
      ...prev.filter(i => i.grupo_id !== grupo.grupo_id),
      { grupo_id: grupo.grupo_id, opcion: { ...opcionCamaron, precio_extra: 90 } },
      { grupo_id: grupo.grupo_id, opcion: segundaPorcion },
    ]);

    setDecisionCamaronTomada(true);
    setCamaronPromptModal(null);

    // Continuar al siguiente paso
    if (!esUltimoPaso) {
      setPasoActivo(prev => prev + 1);
      const scrollEl = document.getElementById('customizer-scroll-body');
      if (scrollEl) scrollEl.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleConfirmar(true);
    }
  };

  // 2. Mantener solo 1 porción de camarón (+$90) y continuar
  const handleMantenerUnaPorcion = () => {
    setDecisionCamaronTomada(true);
    setCamaronPromptModal(null);
    triggerHaptic('light');
    if (!esUltimoPaso) {
      setPasoActivo(prev => prev + 1);
      const scrollEl = document.getElementById('customizer-scroll-body');
      if (scrollEl) scrollEl.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleConfirmar(true);
    }
  };

  // 3. Completar con otra proteína: cierra el prompt y deja al usuario en el selector
  const handleCompletarConOtraProteina = () => {
    setCamaronPromptModal(null);
    triggerHaptic('light');
  };
  const handleAvanzarPaso = () => {
    if (!pasoValido) return;

    // Chequeo especial para el paso de Proteínas si eligió únicamente camarón
    if (grupoActual && esGrupoProteina(grupoActual)) {
      const seleccionadasEnPaso = opcionesElegidas.filter(i => i.grupo_id === grupoActual.grupo_id);
      const soloTieneCamaron = seleccionadasEnPaso.length === 1 && esOpcionCamaron(seleccionadasEnPaso[0].opcion);
      const maxPermitido = grupoActual.max_opciones || 2;

      // Si sólo eligió 1 porción de camarón y el bowl permite 2 o 3 proteínas:
      if (soloTieneCamaron && maxPermitido >= 2) {
        triggerHaptic('medium');
        setCamaronPromptModal({
          visible: true,
          grupo: grupoActual,
          opcionCamaron: seleccionadasEnPaso[0].opcion,
        });
        return;
      }
    }

    triggerHaptic('light');
    if (!esUltimoPaso) {
      setPasoActivo(prev => prev + 1);
      const scrollEl = document.getElementById('customizer-scroll-body');
      if (scrollEl) scrollEl.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleConfirmar();
    }
  };

  const handleRetrocederPaso = () => {
    if (pasoActivo > 0) {
      triggerHaptic('light');
      setPasoActivo(prev => prev - 1);
      const scrollEl = document.getElementById('customizer-scroll-body');
      if (scrollEl) scrollEl.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        {/* Indicador de arrastre en móvil */}
        <div className="modal-drag-indicator" />

        {/* Cabecera con Imagen de Presentación de Nalú Poke */}
        <div className="modal-header-hero">
          <img
            src={plato.imagen_url || '/hero_bandejas_nalu.jpg'}
            alt={plato.nombre}
            className="modal-header-img"
          />
          <button onClick={onClose} className="modal-close-btn" aria-label="Cerrar modal">
            <X size={18} />
          </button>
        </div>

        {/* Título del plato por encima de los pasos, claro y sin tapar la foto */}
        <div className="modal-dish-title-bar">
          <h3 className="modal-dish-title">{plato.nombre}</h3>
        </div>

        {/* Sección: Ingredientes Base Incluidos si el plato tiene receta fija */}
        {tieneBaseFija && plato.insumos_receta && plato.insumos_receta.length > 0 && (
          <div className="customizer-base-section">
            <div className="customizer-base-header">
              <div className="customizer-base-title">
                <span className="customizer-base-badge">Receta base</span>
                <span>Ingredientes ya incluidos ({plato.insumos_receta.length}):</span>
              </div>
              <span className="customizer-base-hint">Vienen preparados de cocina</span>
            </div>
            <div className="customizer-base-chips-scroll">
              {plato.insumos_receta.map((ins, i) => (
                <div key={ins.insumo_id || i} className="customizer-base-chip" title={`${ins.nombre} (incluido en la base)`}>
                  {ins.imagen_url ? (
                    <img src={ins.imagen_url} alt={ins.nombre} className="customizer-base-chip-img" />
                  ) : (
                    <span className="customizer-base-chip-dot">✓</span>
                  )}
                  <span className="customizer-base-chip-name">{ins.nombre}</span>
                </div>
              ))}
            </div>
          </div>
        )}

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
                  onClick={() => {
                    // Si el usuario está en el paso de proteínas y eligió solo camarón antes de saltar a otro paso:
                    if (grupoActual && esGrupoProteina(grupoActual) && idx !== pasoActivo) {
                      const seleccionadasEnPaso = opcionesElegidas.filter(i => i.grupo_id === grupoActual.grupo_id);
                      const soloTieneCamaron = seleccionadasEnPaso.length === 1 && esOpcionCamaron(seleccionadasEnPaso[0].opcion);
                      const maxPermitido = grupoActual.max_opciones || 2;
                      if (soloTieneCamaron && maxPermitido >= 2 && !decisionCamaronTomada) {
                        triggerHaptic('medium');
                        setCamaronPromptModal({
                          visible: true,
                          grupo: grupoActual,
                          opcionCamaron: seleccionadasEnPaso[0].opcion,
                        });
                        return;
                      }
                    }

                    setPasoActivo(idx);
                    const scrollEl = document.getElementById('customizer-scroll-body');
                    if (scrollEl) scrollEl.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
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
        {(opcionesElegidas.length > 0 || tieneBaseFija) && (
          <div className="live-bowl-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>
              <span>🥗 Bowl:</span>
            </div>
            <div className="live-bowl-chips">
              {tieneBaseFija && (
                <span className="live-bowl-chip live-bowl-chip-base" title="Base predefinida incluida">
                  <span style={{ color: '#788c50' }}>✓</span> Base ({plato.insumos_receta?.length || 0})
                </span>
              )}
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
        <div className="modal-scroll-body" id="customizer-scroll-body">
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
                placeholder={
                  tieneBaseFija
                    ? "Ej: sin cebolla, salsa aparte, carne bien cocida..."
                    : "Ej: salsa teriyaki aparte, carne bien cocida, sin sal..."
                }
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

          {/* Botones de acción directos al final del formulario (Garantiza que siempre puedas avanzar al escrolear) */}
          <div className="customizer-bottom-form-actions">
            {!esUltimoPaso ? (
              <button
                type="button"
                onClick={handleAvanzarPaso}
                disabled={!pasoValido}
                className="btn-primary customizer-inline-next-btn"
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
                  <span style={{ fontSize: '0.96rem', fontWeight: 800 }}>
                    Siguiente: {gruposOrdenados[pasoActivo + 1]?.nombre || 'Continuar'}
                  </span>
                  <span style={{ fontSize: '0.74rem', opacity: 0.9 }}>
                    Paso {pasoActivo + 2} de {gruposOrdenados.length}
                  </span>
                </div>
                <ArrowRight size={20} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleConfirmar(false)}
                disabled={!pasoValido}
                className="btn-primary customizer-inline-confirm-btn"
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 900 }}>
                    ✓ Agregar Bowl al Pedido
                  </span>
                  <span style={{ fontSize: '0.78rem', opacity: 0.9 }}>
                    Total: ${precioFinalUnitario.toLocaleString()}
                  </span>
                </div>
                <Plus size={22} />
              </button>
            )}

            {!pasoValido && (
              <div className="customizer-step-warning">
                <AlertCircle size={15} />
                <span>
                  {grupoActual?.min_opciones === 1
                    ? `Elige 1 opción en "${grupoActual.nombre}" para continuar`
                    : `Elige al menos ${grupoActual?.min_opciones} opciones en "${grupoActual.nombre}" para avanzar`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer del Wizard: Anterior, Precio y Siguiente/Agregar */}
        <div className="modal-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {pasoActivo > 0 && (
              <button
                type="button"
                onClick={handleRetrocederPaso}
                className="btn-secondary"
                style={{ padding: '10px 14px', fontSize: '0.85rem' }}
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
                onClick={handleAvanzarPaso}
                disabled={!pasoValido}
                className="btn-primary"
                style={{
                  padding: '12px 20px',
                  fontSize: '0.9rem',
                  opacity: pasoValido ? 1 : 0.55,
                  cursor: pasoValido ? 'pointer' : 'not-allowed'
                }}
              >
                <span>Siguiente Paso</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleConfirmar(false)}
                disabled={!pasoValido}
                className="btn-primary"
                style={{
                  padding: '12px 22px',
                  fontSize: '0.92rem',
                  background: '#788c50',
                  boxShadow: '0 8px 24px rgba(120, 140, 80, 0.4)',
                  opacity: pasoValido ? 1 : 0.55,
                  cursor: pasoValido ? 'pointer' : 'not-allowed'
                }}
              >
                <Plus size={18} />
                <span>Agregar Bowl al Pedido</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Diálogo Elegante de Selección de Camarones */}
        {camaronPromptModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              animation: 'fadeIn 0.2s ease-out',
            }}
            onClick={() => setCamaronPromptModal(null)}
          >
            <div
              style={{
                background: 'var(--bg-card, #ffffff)',
                color: 'var(--text-main, #111827)',
                borderRadius: '24px',
                padding: '24px 20px',
                maxWidth: '440px',
                width: '100%',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                border: '1.5px solid rgba(120, 140, 80, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                animation: 'scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header con Ícono */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '16px',
                    background: 'rgba(120, 140, 80, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.6rem',
                    flexShrink: 0,
                  }}
                >
                  🍤
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 4px', fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-main, #1f2937)' }}>
                    Porción de Camarones
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-muted, #6b7280)', lineHeight: 1.4 }}>
                    Elegiste <strong>1 porción de Camarones</strong>. Tu bowl admite hasta{' '}
                    <strong>{camaronPromptModal.grupo.max_opciones || 2} proteínas</strong>.
                  </p>
                </div>
              </div>

              {/* Mensaje explicativo */}
              <div
                style={{
                  background: 'rgba(120, 140, 80, 0.08)',
                  borderRadius: '14px',
                  padding: '12px 14px',
                  fontSize: '0.85rem',
                  color: 'var(--text-main, #374151)',
                  lineHeight: 1.45,
                }}
              >
                💡 Podés completar tu bowl con otra proteína (Pollo, Carne, Cerdo o Huevo sin costo) o pedir <strong>doble porción de camarones</strong> por $180 extra ($90 c/u).
              </div>

              {/* Opciones interactivas */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* 1. Doble camarón */}
                <button
                  type="button"
                  onClick={handleElegirDobleCamaron}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    borderRadius: '16px',
                    background: '#788c50',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '0.92rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(120, 140, 80, 0.35)',
                    transition: 'transform 0.15s, opacity 0.15s',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🍤🍤</span>
                    <span>Quiero Doble Camarón</span>
                  </span>
                  <span
                    style={{
                      background: 'rgba(255,255,255,0.25)',
                      padding: '4px 10px',
                      borderRadius: '10px',
                      fontSize: '0.85rem',
                    }}
                  >
                    +$180
                  </span>
                </button>

                {/* 2. Completar con otra proteína */}
                <button
                  type="button"
                  onClick={handleCompletarConOtraProteina}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '16px',
                    background: 'var(--bg-page, #f3f4f6)',
                    color: 'var(--text-main, #1f2937)',
                    border: '1.5px solid var(--border-light, #e5e7eb)',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🍗</span>
                    <span>Completar con otra proteína</span>
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 800 }}>
                    Sin costo
                  </span>
                </button>

                {/* 3. Dejar solo 1 porción */}
                <button
                  type="button"
                  onClick={handleMantenerUnaPorcion}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: 'transparent',
                    color: 'var(--text-muted, #6b7280)',
                    border: 'none',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  Dejar solo 1 porción de camarón (+$90) y continuar &rarr;
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
