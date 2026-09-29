import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

export const FreshIngredientsShowcase: React.FC = () => {
  const { ref: sectionRef, isVisible } = useScrollAnimation({ threshold: 0.1 });

  const trays = [
    {
      image: '/tray_bases.jpg',
      step: 'Paso 1 • Bases',
      limit: 'Hasta 2 opciones',
      title: 'Bases Nutritivas',
      subtitle: 'La base perfecta para tu bowl: ingredientes limpios, equilibrados y llenos de energía.',
      items: ['Arroz', 'Arroz integral', 'Fideo integral', 'Quinoa', 'Lechuga'],
      accent: 'var(--secondary)',
      accentBg: 'var(--secondary-light)',
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
    },
    {
      image: '/tray_vegetales.jpg',
      step: 'Pasos 3 y 4 • Verduras & Toppings',
      limit: 'Hasta 3 opciones',
      title: 'Verduras & Frutas Tropicales',
      subtitle: 'Color, crocancia y nutrientes esenciales cortados en el momento para conservar su frescura.',
      items: ['Palta', 'Mango', 'Ananá', 'Tomate', 'Pepino', 'Choclo', 'Remolacha'],
      accent: '#16A34A',
      accentBg: 'rgba(22, 163, 74, 0.08)',
    },
    {
      image: '/tray_salsas_chips.jpg',
      step: 'Pasos 5 y 6 • Salsas & Crunch',
      limit: 'De 1 a 3 salsas y chips',
      title: 'Salsas Artesanales & Chips',
      subtitle: 'El toque maestro que amalgama cada bocado con aderezos caseros y textura crujiente.',
      items: ['Teriyaki', 'Alioli', 'Mostaza y miel', 'Cebolla crispy', 'Chip Boniato', 'Sésamo'],
      accent: 'var(--accent-gold)',
      accentBg: 'var(--accent-gold-light)',
    }
  ];

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

        <div className="trays-grid">
          {trays.map((tray, idx) => (
            <div
              key={idx}
              className={`tray-card scroll-reveal ${isVisible ? 'revealed' : ''}`}
              style={{
                padding: '0',
                overflow: 'hidden',
                textAlign: 'left',
                alignItems: 'stretch',
                transitionDelay: isVisible ? `${idx * 120}ms` : '0ms',
              }}
            >
              {/* Fotografía Real de la Bandeja con overlay sutil */}
              <div className="tray-image-wrapper">
                <img
                  src={tray.image}
                  alt={tray.title}
                  className="tray-photo"
                  loading="lazy"
                />
                <div className="tray-image-overlay" />
                <div className="tray-step-badge" style={{ borderColor: tray.accent }}>
                  <span className="tray-step-dot" style={{ background: tray.accent }} />
                  {tray.step}
                </div>
              </div>

              {/* Contenido de la Bandeja */}
              <div className="tray-card-body">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <h3 style={{ fontSize: '1.12rem', fontWeight: 800 }}>{tray.title}</h3>
                </div>
                <span className="tray-limit-badge" style={{ color: tray.accent, background: tray.accentBg }}>
                  {tray.limit}
                </span>

                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '14px', flex: 1 }}>
                  {tray.subtitle}
                </p>

                {/* Chips de los insumos exactos */}
                <div className="tray-chips-row">
                  {tray.items.map((item, i) => (
                    <span key={i} className="tray-ingredient-chip">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
