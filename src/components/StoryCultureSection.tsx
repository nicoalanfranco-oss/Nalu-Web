import React, { useState, useEffect } from 'react';
import { Heart, Sun, Waves, Sparkles } from 'lucide-react';

export const StoryCultureSection: React.FC = () => {
  // Animación de rotación sutil de fotos inspirada en Get Poke Bowl & Poke House
  const photos = [
    {
      url: '/hero_bandejas_nalu.jpg',
      caption: 'Bandejas preparadas diariamente con pesca fresca y vegetales locales'
    },
    {
      url: '/hero_bandejas_nalu.jpg',
      caption: 'Aderezos artesanales fusionando sabores asiáticos y notas tropicales'
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % photos.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [photos.length]);

  return (
    <section id="cultura" style={{ padding: '70px 0', background: 'var(--bg-sand)', borderTop: '1px solid var(--border-light)' }}>
      <div className="page-container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '48px', alignItems: 'center' }}>
          
          {/* Columna de Texto Cultura & Filosofía Nalú */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <span className="badge-tag green">
              <Waves size={14} /> FILOSOFÍA NALÚ
            </span>

            <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', lineHeight: 1.15 }}>
              Comida Real que te Hace <br />
              <span style={{ color: 'var(--secondary)' }}>Sentir Bien.</span>
            </h2>

            <p style={{ color: 'var(--text-body)', fontSize: '1rem', lineHeight: 1.6 }}>
              Nacimos con la convicción de que alimentarse de forma saludable debe ser un momento placentero, colorido y lleno de sabor. En Nalú combinamos la tradición hawaiana del poke con una mirada moderna de nutrición equilibrada.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '8px' }}>
              <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <Sun size={24} color="#F59E0B" style={{ marginBottom: '8px' }} />
                <h4 style={{ fontSize: '0.98rem', fontWeight: 800 }}>Energía Limpia</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Sin procesados pesados. Solo carbohidratos complejos, proteínas limpias y grasas buenas.
                </p>
              </div>

              <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <Heart size={24} color="var(--primary)" style={{ marginBottom: '8px' }} />
                <h4 style={{ fontSize: '0.98rem', fontWeight: 800 }}>Amor por el Detalle</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Cada bowl se arma a mano cuidando la estética, el equilibrio de texturas y el crunch.
                </p>
              </div>
            </div>
          </div>

          {/* Columna Visual con Slider Sutil de Fotos */}
          <div style={{ position: 'relative' }}>
            <div style={{
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-lg)',
              border: '4px solid white',
              background: 'white',
              position: 'relative',
              height: '380px'
            }}>
              <img
                src={photos[currentIndex].url}
                alt="Cultura Nalú Poke"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'opacity 0.8s ease-in-out',
                }}
              />
              <div style={{
                position: 'absolute',
                bottom: '16px',
                left: '16px',
                right: '16px',
                background: 'rgba(255, 255, 255, 0.92)',
                backdropFilter: 'blur(8px)',
                padding: '12px 18px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: 'var(--text-main)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <Sparkles size={16} color="var(--primary)" />
                <span>{photos[currentIndex].caption}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
