import React from 'react';
import { Sparkles, Utensils, Award, Clock, ArrowRight } from 'lucide-react';

interface HeroSectionProps {
  onOpenCustomizer: () => void;
  onExploreMenu: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenCustomizer,
  onExploreMenu,
}) => {
  return (
    <section id="inicio" className="hero-section">
      <div className="page-container">
        <div className="hero-grid">
          {/* Columna de Texto y Llamados a la Acción */}
          <div className="hero-content">
            <span className="badge-tag">
              <Sparkles size={14} /> POKES DE AUTOR & PERSONALIZADOS
            </span>

            <h1 className="hero-title">
              Sabor Hawaiano, <br />
              <span className="highlight">Frescura Absoluta.</span>
            </h1>

            <p className="hero-subtitle">
              Disfruta la verdadera energía de un auténtico Poke Bowl: cortes frescos de salmón y atún, palta cremosa, bases saludables y toppings crocantes preparados al instante con aderezos de autor.
            </p>

            <div className="hero-cta-group">
              <button onClick={onOpenCustomizer} className="btn-primary" style={{ padding: '14px 28px', fontSize: '1rem' }}>
                <Sparkles size={18} />
                <span>Arma tu Poke Ahora</span>
                <ArrowRight size={18} />
              </button>

              <button onClick={onExploreMenu} className="btn-secondary" style={{ padding: '14px 24px', fontSize: '1rem' }}>
                <Utensils size={18} />
                <span>Explorar Menú</span>
              </button>
            </div>

            {/* Fila de beneficios destacados */}
            <div className="hero-features-row">
              <div className="hero-feature-item">
                <div className="hero-feature-icon">
                  <Award size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 800 }}>Materia Prima Premium</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Pescados e insumos frescos</div>
                </div>
              </div>

              <div className="hero-feature-item">
                <div className="hero-feature-icon" style={{ background: 'var(--secondary-light)', color: 'var(--secondary)' }}>
                  <Clock size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 800 }}>Listo en Minutos</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Take-away o Delivery ágil</div>
                </div>
              </div>
            </div>
          </div>

          {/* Columna Visual: Foto de Presentación en Bandejas y Bowl */}
          <div className="hero-visual-wrapper">
            <div className="hero-visual-card">
              <img
                src="/hero_bandejas_nalu.jpg"
                alt="Presentación de ingredientes frescos y Poke Bowl Nalú"
                className="hero-image-main"
              />
              <div className="hero-floating-pill">
                <div className="hero-floating-info">
                  <h4>Poke 3 Proteínas</h4>
                  <p>Salmón fresco, Atún, Palta, Edamame y Mango</p>
                </div>
                <button
                  onClick={onOpenCustomizer}
                  className="btn-primary"
                  style={{ padding: '8px 14px', fontSize: '0.82rem' }}
                >
                  Personalizar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
