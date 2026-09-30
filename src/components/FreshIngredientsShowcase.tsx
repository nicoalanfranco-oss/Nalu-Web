import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

export const FreshIngredientsShowcase: React.FC = () => {
  const { ref: sectionRef, isVisible } = useScrollAnimation({ threshold: 0.1 });
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [isUserHovering, setIsUserHovering] = useState<boolean>(false);

  const trays = [
    {
      image: '/tray_bases.jpg',
      step: 'Paso 1 • Bases',
      limit: 'Hasta 2 opciones',
      title: 'Bases Nutritivas',
      subtitle: 'La base perfecta para tu bowl: ingredientes limpios, equilibrados y llenos de energía.',
      items: ['Arroz sushi', 'Arroz integral', 'Fideo integral', 'Quinoa', 'Mix de hojas'],
      accent: 'var(--secondary)',
      accentBg: 'var(--secondary-light)',
      auraColor: 'rgba(20, 184, 166, 0.45)',
    },
    {
      image: '/tray_proteinas.jpg',
      step: 'Paso 2 • Proteínas',
      limit: 'Hasta 3 opciones',
      title: 'Proteínas Seleccionadas',
      subtitle: 'Carnes tiernas y pescados frescos preparados a diario en nuestra cocina de Tacuarembó.',
      items: ['Carne vacuna', 'Pollo', 'Cerdo barbacoa', 'Atún', 'Camarones', 'Huevo'],
      accent: 'var(--primary)',
      accentBg: 'var(--primary-light)',
      auraColor: 'rgba(255, 90, 54, 0.45)',
    },
    {
      image: '/tray_vegetales.jpg',
      step: 'Pasos 3 y 4 • Verduras & Toppings',
      limit: 'Hasta 3 opciones',
      title: 'Verduras & Frutas Tropicales',
      subtitle: 'Color, crocancia y nutrientes esenciales cortados en el momento para conservar su frescura.',
      items: ['Palta hass', 'Mango fresco', 'Ananá', 'Tomate cherry', 'Pepino', 'Choclo', 'Remolacha'],
      accent: '#16A34A',
      accentBg: 'rgba(22, 163, 74, 0.1)',
      auraColor: 'rgba(22, 163, 74, 0.45)',
    },
    {
      image: '/tray_salsas_chips.jpg',
      step: 'Pasos 5 y 6 • Salsas & Crunch',
      limit: 'De 1 a 3 salsas y chips',
      title: 'Salsas Artesanales & Chips',
      subtitle: 'El toque maestro que amalgama cada bocado con aderezos caseros y textura crujiente.',
      items: ['Teriyaki dulce', 'Alioli suave', 'Mostaza y miel', 'Cebolla crispy', 'Chip boniato', 'Sésamo tostado'],
      accent: 'var(--accent-gold)',
      accentBg: 'var(--accent-gold-light)',
      auraColor: 'rgba(217, 119, 6, 0.45)',
    }
  ];

  // Rotación secuencial automática cada 2.8s cuando está visible y el usuario no tiene el mouse encima
  useEffect(() => {
    if (!isVisible || isUserHovering) return;
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % trays.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [isVisible, isUserHovering, trays.length]);

  return (
    <section id="bandejas" className="ingredients-showcase-section" ref={sectionRef}>
      <div className="page-container">
        <div className={`section-header scroll-reveal ${isVisible ? 'revealed' : ''}`}>
          <span className="badge-tag green section-tag">
            <Sparkles size={14} /> BANDEJAS FRESCAS A LA VISTA
          </span>
          <h2>Bandejas Llenas de Color, Sabor y Nutrición</h2>
          <p>
            En Nalú no usamos productos genéricos. Cada bowl se arma a tu medida con materias primas reales clasificadas según nuestras reglas de armado de cocina.
          </p>
        </div>

        <div
          className="trays-grid"
          onMouseEnter={() => setIsUserHovering(true)}
          onMouseLeave={() => setIsUserHovering(false)}
        >
          {trays.map((tray, idx) => {
            const isActive = activeIdx === idx;

            return (
              <div
                key={idx}
                className={`tray-card scroll-reveal ${isVisible ? 'revealed' : ''} ${isActive ? 'is-active-tray' : ''}`}
                onMouseEnter={() => {
                  setIsUserHovering(true);
                  setActiveIdx(idx);
                }}
                style={{
                  padding: '0',
                  overflow: 'hidden',
                  textAlign: 'left',
                  alignItems: 'stretch',
                  transitionDelay: isVisible ? `${idx * 120}ms` : '0ms',
                  ['--current-accent' as any]: tray.accent,
                  ['--current-aura' as any]: tray.auraColor,
                }}
              >
                {/* Fotografía Real de la Bandeja con overlay sutil y zoom secuencial */}
                <div className="tray-image-wrapper">
                  <img
                    src={tray.image}
                    alt={tray.title}
                    className={`tray-photo ${isActive ? 'is-zoomed' : ''}`}
                    loading="lazy"
                  />
                  <div className="tray-image-overlay" />
                  
                  {/* Badge de paso con borde dinámico del paso activo */}
                  <div
                    className="tray-step-badge"
                    style={{
                      borderColor: tray.accent,
                      boxShadow: isActive ? `0 0 12px ${tray.auraColor}` : undefined,
                    }}
                  >
                    <span className="tray-step-dot" style={{ background: tray.accent }} />
                    {tray.step}
                  </div>

                  {/* Indicador sutil de turno activo */}
                  {isActive && (
                    <div className="tray-active-pill" style={{ background: tray.accent }}>
                      ✦ Destacado
                    </div>
                  )}
                </div>

                {/* Contenido de la Bandeja */}
                <div className="tray-card-body">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: isActive ? tray.accent : undefined, transition: 'color 0.4s ease' }}>
                      {tray.title}
                    </h3>
                  </div>
                  <span className="tray-limit-badge" style={{ color: tray.accent, background: tray.accentBg }}>
                    {tray.limit}
                  </span>

                  <p style={{ fontSize: '0.86rem', color: 'var(--text-body)', lineHeight: 1.5, marginBottom: '14px', flex: 1 }}>
                    {tray.subtitle}
                  </p>

                  {/* Chips de los insumos exactos */}
                  <div className="tray-chips-row">
                    {tray.items.map((item, i) => (
                      <span
                        key={i}
                        className={`tray-ingredient-chip ${isActive ? 'chip-active' : ''}`}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Indicadores de rotación interactivos */}
        <div className="trays-dots-indicator" aria-label="Navegación de bandejas">
          {trays.map((tray, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setActiveIdx(idx);
                setIsUserHovering(true);
                setTimeout(() => setIsUserHovering(false), 4000);
              }}
              className={`tray-dot-btn ${activeIdx === idx ? 'active' : ''}`}
              title={`Ver ${tray.title}`}
              style={{
                ['--dot-accent' as any]: tray.accent,
              }}
            >
              <span className="dot-inner" />
              <span className="dot-label">{tray.step.split('•')[1] || tray.title}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
