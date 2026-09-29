import React from 'react';
import { Sparkles } from 'lucide-react';

export const FreshIngredientsShowcase: React.FC = () => {
  const trays = [
    {
      emoji: '🍚',
      title: 'Bases Nutritivas',
      subtitle: 'Arroz sushi sazonado, Quinoa andina, Arroz integral, Fideos y Mix verde de lechuga fresca.'
    },
    {
      emoji: '🐟',
      title: 'Proteínas Seleccionadas',
      subtitle: 'Salmón fresco en cubos, Atún rojo marinado, Pollo glaseado teriyaki y Camarones salteados.'
    },
    {
      emoji: '🥑',
      title: 'Verduras & Frutas',
      subtitle: 'Palta hass en su punto, Edamame crocante, Mango tropical jugoso, Tomates cherry y Alga wakame.'
    },
    {
      emoji: '✨',
      title: 'Salsas & Toppings',
      subtitle: 'Spicy Mayo casera, Teriyaki dulce, Ponzu al sésamo tostado, Cebolla crispy y Chips de plátano.'
    }
  ];

  return (
    <section id="bandejas" className="ingredients-showcase-section">
      <div className="page-container">
        <div className="section-header">
          <span className="badge-tag green section-tag">
            <Sparkles size={14} /> FRESCO DE VERDAD
          </span>
          <h2>Bandejas Llenas de Color y Nutrición</h2>
          <p>
            Cada uno de nuestros bowls se prepara a la vista con ingredientes de máxima frescura, cortados en el día para garantizar sabor, textura y vitalidad.
          </p>
        </div>

        <div className="trays-grid">
          {trays.map((tray, idx) => (
            <div key={idx} className="tray-card">
              <div className="tray-icon-box">{tray.emoji}</div>
              <h3>{tray.title}</h3>
              <p>{tray.subtitle}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
