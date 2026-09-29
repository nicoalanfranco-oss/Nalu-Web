import React from 'react';
import { Phone, MapPin, Clock, Bike, Store } from 'lucide-react';
import { TenantInfo, MarcaInfo } from '../types/food';

interface FooterProps {
  marca: MarcaInfo;
  tenant: TenantInfo;
}

export const Footer: React.FC<FooterProps> = ({ marca, tenant }) => {
  return (
    <footer style={{ background: '#13191D', color: '#CBD5E1', padding: '60px 0 40px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="page-container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '40px', marginBottom: '40px' }}>
          {/* Logo y Eslogan en Tacuarembó */}
          <div>
            <img
              src="/Logo_nalu-sinfondo.png"
              alt="Nalú Poke Bowls"
              style={{ height: '46px', marginBottom: '16px', filter: 'brightness(0) invert(1)' }}
            />
            <p style={{ fontSize: '0.88rem', color: '#94A3B8', lineHeight: 1.6 }}>
              Pokes bowls hawaianos frescos, saludables y preparados al instante en Tacuarembó. Carne vacuna, pollo, cerdo barbacoa, atún y camarones con las mejores materias primas.
            </p>
          </div>

          {/* Horarios de Atención desde food.marcas */}
          <div>
            <h4 style={{ color: 'white', fontSize: '1rem', fontWeight: 800, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="var(--primary)" /> Días y Horarios
            </h4>
            <p style={{ fontSize: '0.85rem', color: '#94A3B8', lineHeight: 1.6 }}>
              <strong>{marca.dias_atencion}</strong><br />
              {marca.horario_atencion}
            </p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
              <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.08)', padding: '4px 10px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Bike size={13} color="var(--primary)" /> Delivery
              </span>
              <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.08)', padding: '4px 10px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Store size={13} color="var(--secondary)" /> Take Away
              </span>
            </div>
          </div>

          {/* Contacto y Ubicación en Tacuarembó */}
          <div>
            <h4 style={{ color: 'white', fontSize: '1rem', fontWeight: 800, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={18} color="var(--secondary)" /> Ubicación & Contacto
            </h4>
            <p style={{ fontSize: '0.85rem', color: '#94A3B8', lineHeight: 1.6, marginBottom: '8px' }}>
              {tenant.direccion}<br />
              Tacuarembó, Uruguay
            </p>
            <p style={{ fontSize: '0.85rem', color: '#94A3B8', lineHeight: 1.6, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Phone size={15} color="var(--primary)" /> {tenant.telefono}
            </p>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', fontSize: '0.78rem', color: '#64748B' }}>
          <div>© {new Date().getFullYear()} {marca.nombre} • {tenant.nombre} • Tacuarembó</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            Conectado a Cocina y POS Food
          </div>
        </div>
      </div>
    </footer>
  );
};
