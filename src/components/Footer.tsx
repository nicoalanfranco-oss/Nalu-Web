import React from 'react';
import { Phone, MapPin, Clock, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer style={{ background: '#13191D', color: '#CBD5E1', padding: '60px 0 40px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="page-container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '40px', marginBottom: '40px' }}>
          {/* Logo y Eslogan */}
          <div>
            <img
              src="/Logo_nalu-sinfondo.png"
              alt="Nalú Poke Bowls"
              style={{ height: '46px', marginBottom: '16px', filter: 'brightness(0) invert(1)' }}
            />
            <p style={{ fontSize: '0.88rem', color: '#94A3B8', lineHeight: 1.6 }}>
              Pokes hawaianos frescos, saludables y preparados al instante con los mejores ingredientes de plaza.
            </p>
          </div>

          {/* Horarios de Atención */}
          <div>
            <h4 style={{ color: 'white', fontSize: '1rem', fontWeight: 800, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="var(--primary)" /> Horarios
            </h4>
            <p style={{ fontSize: '0.85rem', color: '#94A3B8', lineHeight: 1.6 }}>
              Lunes a Sábados: 11:30 a 16:00 y 19:30 a 23:30 hs.<br />
              Domingos: 19:30 a 23:30 hs.
            </p>
          </div>

          {/* Contacto y Ubicación */}
          <div>
            <h4 style={{ color: 'white', fontSize: '1rem', fontWeight: 800, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={18} color="var(--secondary)" /> Contacto & Take Away
            </h4>
            <p style={{ fontSize: '0.85rem', color: '#94A3B8', lineHeight: 1.6, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Phone size={15} color="var(--primary)" /> Pedidos directos y WhatsApp
            </p>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', fontSize: '0.78rem', color: '#64748B' }}>
          <div>© {new Date().getFullYear()} Nalú Poke Bowls. Todos los derechos reservados.</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            Integrado con el Sistema de Cocina & Pedidos Food
          </div>
        </div>
      </div>
    </footer>
  );
};
