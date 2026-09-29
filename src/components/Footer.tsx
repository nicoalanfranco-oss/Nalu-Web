import React from 'react';
import { Phone, MapPin, Clock, Bike, Store, Heart, ExternalLink } from 'lucide-react';
import { TenantInfo, MarcaInfo } from '../types/food';

interface FooterProps {
  marca: MarcaInfo;
  tenant: TenantInfo;
}

export const Footer: React.FC<FooterProps> = ({ marca, tenant }) => {
  return (
    <footer className="site-footer">
      {/* Cinta decorativa superior con gradiente */}
      <div className="footer-ribbon" />

      <div className="page-container">
        {/* CTA Banner antes del footer */}
        <div className="footer-cta-banner">
          <div className="footer-cta-text">
            <h3>¿Listo para armar tu Poke Bowl?</h3>
            <p>Pedí ahora y recibilo fresco en tu puerta o retirá en nuestro local de Tacuarembó</p>
          </div>
          <a
            href="#menu"
            className="btn-primary"
            style={{ padding: '14px 28px', fontSize: '0.95rem', flexShrink: 0 }}
          >
            <span>Ver la Carta</span>
            <ExternalLink size={16} />
          </a>
        </div>

        <div className="footer-grid">
          {/* Logo y Eslogan en Tacuarembó */}
          <div className="footer-brand-col">
            <img
              src="/Logo_nalu-sinfondo.png"
              alt="Nalú Poke Bowls"
              className="footer-logo"
            />
            <p className="footer-brand-desc">
              Pokes bowls hawaianos frescos, saludables y preparados al instante en Tacuarembó. Carne vacuna, pollo, cerdo barbacoa, atún y camarones con las mejores materias primas.
            </p>
            <div className="footer-channels">
              {marca.permite_delivery && (
                <span className="footer-channel-pill">
                  <Bike size={13} color="var(--primary)" /> Delivery
                </span>
              )}
              {marca.permite_takeaway && (
                <span className="footer-channel-pill">
                  <Store size={13} color="var(--secondary)" /> Take Away
                </span>
              )}
            </div>
          </div>

          {/* Horarios de Atención desde food.marcas */}
          <div className="footer-col">
            <h4 className="footer-col-title">
              <Clock size={18} color="var(--primary)" /> Días y Horarios
            </h4>
            <div className="footer-schedule-card">
              <div className="footer-schedule-days">{marca.dias_atencion}</div>
              <div className="footer-schedule-hours">{marca.horario_atencion}</div>
            </div>
          </div>

          {/* Contacto y Ubicación en Tacuarembó */}
          <div className="footer-col">
            <h4 className="footer-col-title">
              <MapPin size={18} color="var(--secondary)" /> Ubicación & Contacto
            </h4>
            <p className="footer-address">
              {tenant.direccion}<br />
              Tacuarembó, Uruguay
            </p>
            <a href={`tel:${tenant.telefono}`} className="footer-phone-link">
              <Phone size={15} color="var(--primary)" /> {tenant.telefono}
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="footer-bottom">
          <div className="footer-copyright">
            © {new Date().getFullYear()} {marca.nombre} • Tacuarembó, Uruguay
          </div>
          <div className="footer-powered">
            <span>Hecho con</span>
            <Heart size={13} color="var(--primary)" fill="var(--primary)" />
            <span>en Tacuarembó • Conectado a Cocina y POS Food</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
