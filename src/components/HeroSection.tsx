import React, { useState, useEffect } from 'react';
import { Sparkles, Utensils, Clock, ArrowRight, Bike, Store, Star, Zap } from 'lucide-react';
import { MarcaInfo, TenantInfo } from '../types/food';

interface HeroSectionProps {
  marca: MarcaInfo;
  tenant: TenantInfo;
  onOpenCustomizer: () => void;
  onExploreMenu: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  marca,
  tenant,
  onOpenCustomizer,
  onExploreMenu,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [bowlCount, setBowlCount] = useState(0);

  // Animación de entrada al montar
  useEffect(() => {
    requestAnimationFrame(() => setIsLoaded(true));
  }, []);

  // Contador animado de bowls "vendidos"
  useEffect(() => {
    const target = 2847;
    const duration = 2200;
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setBowlCount(Math.floor(eased * target));
      if (progress >= 1) clearInterval(timer);
    }, 30);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="inicio" className="hero-section">
      {/* Decoración de fondo animada */}
      <div className="hero-bg-decoration">
        <div className="hero-blob hero-blob-1" />
        <div className="hero-blob hero-blob-2" />
        <div className="hero-blob hero-blob-3" />
      </div>

      <div className="page-container">
        <div className="hero-grid">
          {/* Columna de Texto y Llamados a la Acción */}
          <div className={`hero-content ${isLoaded ? 'hero-animate-in' : ''}`}>
            <div className="hero-badges-row">
              <span className="badge-tag badge-pulse">
                <Zap size={13} /> 100% SALUDABLE &amp; HIGH-PROTEIN
              </span>
            </div>

            <h1 className="hero-title">
              Un Sabor Diferente <br />
              <span className="highlight">
                Ahora en Tacuarembó.
                <svg className="highlight-underline" viewBox="0 0 300 12" preserveAspectRatio="none">
                  <path d="M2 8C50 2 120 2 150 6C180 10 250 3 298 7" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
                </svg>
              </span>
            </h1>

            <p className="hero-subtitle">
              Comer sano y rico nunca fue tan fácil. Diseñá tu bowl ideal con cortes premium —carne vacuna, pollo teriyaki, atún fresco o camarones— bases nutritivas y aderezos brutales: <strong>máxima nutrición, bajas calorías, una explosión de sabor</strong> que cuida tu cuerpo y tu energía.
            </p>

            <div className="hero-cta-group">
              <button onClick={onOpenCustomizer} className="btn-primary btn-glow" style={{ padding: '16px 32px', fontSize: '1.05rem' }}>
                <Sparkles size={20} />
                <span>Arma tu Poke a Medida</span>
                <ArrowRight size={18} />
              </button>

              <button onClick={onExploreMenu} className="btn-secondary" style={{ padding: '16px 28px', fontSize: '1rem' }}>
                <Utensils size={18} />
                <span>Explorar la Carta</span>
              </button>
            </div>

            {/* Fila de Canales Habilitados según food.marcas */}
            <div className="hero-features-row">
              {marca.permite_delivery && (
                <div className="hero-feature-item">
                  <div className="hero-feature-icon">
                    <Bike size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800 }}>Delivery en Tacuarembó</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Envío ágil directo a tu puerta</div>
                  </div>
                </div>
              )}

              {marca.permite_takeaway && (
                <div className="hero-feature-item">
                  <div className="hero-feature-icon" style={{ background: 'var(--secondary-light)', color: 'var(--secondary)' }}>
                    <Store size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800 }}>Retiro en Mostrador</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Take Away en Jorge Batlle Ibáñez</div>
                  </div>
                </div>
              )}
            </div>

            {/* Social Proof - Estadística animada */}
            <div className="hero-social-proof">
              <div className="hero-stat">
                <div className="hero-stat-avatars">
                  <div className="hero-avatar">🧑‍🍳</div>
                  <div className="hero-avatar">👩</div>
                  <div className="hero-avatar">👨</div>
                </div>
                <div>
                  <span className="hero-stat-number">+{bowlCount.toLocaleString()}</span>
                  <span className="hero-stat-label">bowls servidos</span>
                </div>
              </div>
              <div className="hero-rating">
                <div style={{ display: 'flex', gap: '2px' }}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} size={14} fill="#F59E0B" color="#F59E0B" />
                  ))}
                </div>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-body)' }}>4.9 en Google</span>
              </div>
            </div>
          </div>

          {/* Columna Visual: Foto de Presentación y Bowl de Nalú Poke */}
          <div className={`hero-visual-wrapper ${isLoaded ? 'hero-visual-animate' : ''}`}>
            <div className="hero-visual-card">
              <img
                src="./hero_bandejas_nalu.jpg"
                alt="Presentación de ingredientes frescos y Poke Bowl Nalú"
                className="hero-image-main"
              />
              <div className="hero-floating-pill">
                <div className="hero-floating-info">
                  <h4>Poke 3 Proteínas ($340)</h4>
                  <p>Carne vacuna, Pollo, Atún, Palta, Edamame y Mango</p>
                </div>
                <button
                  onClick={onOpenCustomizer}
                  className="btn-primary"
                  style={{ padding: '8px 14px', fontSize: '0.82rem' }}
                >
                  Personalizar
                </button>
              </div>

              {/* Badge flotante superior derecho */}
              <div className="hero-freshness-badge">
                <span className="hero-freshness-pulse" />
                <span>🥬 Ingredientes del Día</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
