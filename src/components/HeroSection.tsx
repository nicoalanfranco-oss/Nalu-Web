import React, { useState, useEffect } from 'react';
import { MarcaInfo, TenantInfo } from '../types/food';

interface HeroSectionProps {
  marca?: MarcaInfo;
  tenant?: TenantInfo;
  onOpenCustomizer?: () => void;
  onExploreMenu?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  // Animación de entrada al montar
  useEffect(() => {
    requestAnimationFrame(() => setIsLoaded(true));
  }, []);

  return (
    <section id="inicio" className="hero-section hero-section--photo-only">
      {/* Fondo Ola Dinámica — 9 strips horizontales con scroll escalonado */}
      <div className="hero-logo-wave-bg" aria-hidden="true">
        {Array.from({ length: 9 }, (_, i) => (
          <div
            key={i}
            className="hero-wave-strip"
            style={{
              top: `${(i / 9) * 110 - 6}%`,
              height: `${100 / 9 + 4}%`,
              '--i': i,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Decoración de fondo animada (blobs de color) */}
      <div className="hero-bg-decoration">
        <div className="hero-blob hero-blob-1" />
        <div className="hero-blob hero-blob-2" />
        <div className="hero-blob hero-blob-3" />
      </div>

      <div className="page-container">
        <div className="hero-photo-wrapper">
          <div className={`hero-visual-card ${isLoaded ? 'hero-visual-animate' : ''}`}>
            <img
              src="./hero_bandejas_nalu.jpg"
              alt="Presentación Nalú Poke"
              className="hero-image-main hero-image-main--cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
