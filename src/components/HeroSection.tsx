import React from 'react';
import { Sparkles, Utensils, MapPin, Clock, ArrowRight, Bike, Store } from 'lucide-react';
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
  return (
    <section id="inicio" className="hero-section">
      <div className="page-container">
        <div className="hero-grid">
          {/* Columna de Texto y Llamados a la Acción */}
          <div className="hero-content">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <span className="badge-tag">
                <MapPin size={13} /> TACUAREMBÓ • AV. JORGE BATLLE IBÁÑEZ
              </span>
              <span className="badge-tag green">
                <Clock size={13} /> {marca.dias_atencion}: {marca.horario_atencion}
              </span>
            </div>

            <h1 className="hero-title">
              El Auténtico Sabor Hawaiano <br />
              <span className="highlight">Ahora en Tacuarembó.</span>
            </h1>

            <p className="hero-subtitle">
              Descubre en <strong>{tenant.direccion}</strong> la experiencia de armar tu Poke Bowl a medida. Disfruta tierna carne vacuna seleccionada, pollo teriyaki, atún fresco marinado, cerdo barbacoa o camarones premium combinados con vegetales de la huerta y aderezos de autor.
            </p>

            <div className="hero-cta-group">
              <button onClick={onOpenCustomizer} className="btn-primary" style={{ padding: '14px 28px', fontSize: '1rem' }}>
                <Sparkles size={18} />
                <span>Arma tu Poke a Medida</span>
                <ArrowRight size={18} />
              </button>

              <button onClick={onExploreMenu} className="btn-secondary" style={{ padding: '14px 24px', fontSize: '1rem' }}>
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
          </div>

          {/* Columna Visual: Foto de Presentación y Bowl de Nalú Poke */}
          <div className="hero-visual-wrapper">
            <div className="hero-visual-card">
              <img
                src="/hero_bandejas_nalu.jpg"
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
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
