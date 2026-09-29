import React from 'react';
import { Sparkles } from 'lucide-react';

export const FreshIngredientsShowcase: React.FC = () => {
  const trays = [
    {
      image: '/tray_bases.jpg',
      step: 'Paso 1 • Bases',
      limit: 'Hasta 2 opciones',
      title: 'Bases Nutritivas',
      subtitle: 'La base perfecta para tu bowl: ingredientes limpios, equilibrados y llenos de energía.',
      items: ['Arroz', 'Arroz integral', 'Fideo integral', 'Quinoa', 'Lechuga']
    },
    {
      image: '/tray_proteinas.jpg',
      step: 'Paso 2 • Proteínas',
      limit: 'Hasta 3 opciones',
      title: 'Proteínas Seleccionadas',
      subtitle: 'Carnes tiernas y pescados frescos preparados a diario en nuestra cocina de Tacuarembó.',
      items: ['Carne vacuna', 'Pollo', 'Cerdo barbacoa', 'Atún', 'Camarones', 'Huevo']
    },
    {
      image: '/tray_vegetales.jpg',
      step: 'Pasos 3 y 4 • Verduras & Toppings',
      limit: 'Hasta 3 opciones',
      title: 'Verduras & Frutas Tropicales',
      subtitle: 'Color, crocancia y nutrientes esenciales cortados en el momento para conservar su frescura.',
      items: ['Palta', 'Mango', 'Ananá', 'Tomate', 'Pepino', 'Choclo', 'Remolacha']
    },
    {
      image: '/tray_salsas_chips.jpg',
      step: 'Pasos 5 y 6 • Salsas & Crunch',
      limit: 'De 1 a 3 salsas y chips',
      title: 'Salsas Artesanales & Chips',
      subtitle: 'El toque maestro que amalgama cada bocado con aderezos caseros y textura crujiente.',
      items: ['Teriyaki', 'Alioli', 'Mostaza y miel', 'Cebolla crispy', 'Chip Boniato', 'Sésamo']
    }
  ];

  return (
    <section id="bandejas" className="ingredients-showcase-section">
      <div className="page-container">
        <div className="section-header">
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
            <div key={idx} className="tray-card" style={{ padding: '0', overflow: 'hidden', textAlign: 'left', alignItems: 'stretch' }}>
              {/* Fotografía Real de la Bandeja */}
              <div style={{ position: 'relative', width: '100%', height: '190px', overflow: 'hidden', background: 'var(--bg-sand)' }}>
                <img
                  src={tray.image}
                  alt={tray.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                  className="tray-photo"
                />
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  background: 'rgba(255, 255, 255, 0.94)',
                  backdropFilter: 'blur(6px)',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: 'var(--text-main)',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  {tray.step}
                </div>
              </div>

              {/* Contenido de la Bandeja */}
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <h3 style={{ fontSize: '1.12rem', fontWeight: 800 }}>{tray.title}</h3>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '8px' }}>
                  {tray.limit}
                </span>

                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '14px', flex: 1 }}>
                  {tray.subtitle}
                </p>

                {/* Chips de los insumos exactos */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {tray.items.map((item, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: 'var(--bg-page)',
                        border: '1px solid var(--border-light)',
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-full)',
                        color: 'var(--text-body)'
                      }}
                    >
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
