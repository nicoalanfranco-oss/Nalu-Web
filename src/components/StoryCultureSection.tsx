import React, { useState, useEffect } from 'react';
import { Heart, Sun, Waves, Sparkles, Leaf, UtensilsCrossed } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

export const StoryCultureSection: React.FC = () => {
  const { ref: sectionRef, isVisible } = useScrollAnimation({ threshold: 0.1 });

  // Rotación sutil de fotos inspirada en Get Poke Bowl & Poke House
  const photos = [
    {
      url: '/tray_proteinas.jpg',
      caption: 'Proteínas frescas preparadas a diario en nuestra cocina de Tacuarembó'
    },
    {
      url: '/hero_bandejas_nalu.jpg',
      caption: 'Bandejas preparadas diariamente con cortes seleccionados y vegetales de la huerta'
    },
    {
      url: '/tray_vegetales.jpg',
      caption: 'Verduras y frutas tropicales cortadas en el momento para cada bowl'
    },
    {
      url: '/tray_salsas_chips.jpg',
      caption: 'Aderezos artesanales fusionando sabores asiáticos y notas tropicales'
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % photos.length);
        setIsTransitioning(false);
      }, 400);
    }, 4500);
    return () => clearInterval(timer);
  }, [photos.length]);

  const valores = [
    {
      icon: <Sun size={24} color="#F59E0B" />,
      title: 'Energía Limpia',
      desc: 'Sin procesados pesados. Solo carbohidratos complejos, proteínas limpias y grasas buenas.',
    },
    {
      icon: <Heart size={24} color="var(--primary)" />,
      title: 'Amor por el Detalle',
      desc: 'Cada bowl se arma a mano cuidando la estética, el equilibrio de texturas y el crunch.',
    },
    {
      icon: <Leaf size={24} color="var(--secondary)" />,
      title: 'Frescura Garantizada',
      desc: 'Ingredientes que llegan frescos a nuestra cocina cada mañana y son preparados al instante.',
    },
    {
      icon: <UtensilsCrossed size={24} color="var(--sea-blue)" />,
      title: 'Fusión de Culturas',
      desc: 'La tradición hawaiana del poke con un toque rioplatense que solo encontrás en Tacuarembó.',
    },
  ];

  return (
    <section id="cultura" className="story-section" ref={sectionRef}>
      <div className="page-container">
        <div className={`story-layout scroll-reveal ${isVisible ? 'revealed' : ''}`}>
          
          {/* Columna de Texto Cultura & Filosofía Nalú */}
          <div className="story-text-col">
            <span className="badge-tag green">
              <Waves size={14} /> FILOSOFÍA NALÚ
            </span>

            <h2 className="story-heading">
              Comida Real que te Hace <br />
              <span style={{ color: 'var(--secondary)' }}>Sentir Bien.</span>
            </h2>

            <p className="story-description">
              Nacimos con la convicción de que alimentarse de forma saludable debe ser un momento placentero, colorido y lleno de sabor. En Nalú combinamos la tradición hawaiana del poke con una mirada moderna de nutrición equilibrada.
            </p>

            <div className="story-values-grid">
              {valores.map((val, idx) => (
                <div
                  key={idx}
                  className={`story-value-card scroll-reveal ${isVisible ? 'revealed' : ''}`}
                  style={{ transitionDelay: isVisible ? `${200 + idx * 100}ms` : '0ms' }}
                >
                  <div className="story-value-icon">{val.icon}</div>
                  <h4>{val.title}</h4>
                  <p>{val.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Columna Visual con Slider Sutil de Fotos */}
          <div className={`story-visual-col scroll-reveal ${isVisible ? 'revealed' : ''}`} style={{ transitionDelay: '150ms' }}>
            <div className="story-photo-frame">
              <img
                src={photos[currentIndex].url}
                alt="Cultura Nalú Poke"
                className={`story-photo-img ${isTransitioning ? 'fading' : ''}`}
              />
              <div className="story-photo-caption">
                <Sparkles size={16} color="var(--primary)" />
                <span>{photos[currentIndex].caption}</span>
              </div>

              {/* Dots de navegación */}
              <div className="story-photo-dots">
                {photos.map((_, i) => (
                  <button
                    key={i}
                    className={`story-dot ${currentIndex === i ? 'active' : ''}`}
                    onClick={() => {
                      setIsTransitioning(true);
                      setTimeout(() => {
                        setCurrentIndex(i);
                        setIsTransitioning(false);
                      }, 300);
                    }}
                    aria-label={`Foto ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
