import React from 'react';
import { MarcaInfo, TenantInfo } from '../types/food';
import { InstagramIcon, WhatsAppIcon } from './SocialIcons';

interface FooterProps {
  marca?: MarcaInfo;
  tenant?: TenantInfo;
}

export const Footer: React.FC<FooterProps> = () => {
  return (
    <footer className="site-footer site-footer--simple">
      <div className="page-container">
        {/* Contacto directo Nalú: WhatsApp y Instagram */}
        <div className="footer-contact-container">
          <span className="footer-contact-title">Atención & Contacto Directo</span>
          <div className="footer-contact-links">
            <a
              href="https://wa.me/59899127786"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-contact-btn footer-contact-btn--wa"
              title="Escribinos por WhatsApp al 099 127 786"
            >
              <WhatsAppIcon size={20} />
              <span>099 127 786</span>
            </a>

            <a
              href="https://ig.me/m/nalupoke.uy"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-contact-btn footer-contact-btn--ig"
              title="Chatear con Nalú en Instagram (@nalupoke.uy)"
            >
              <InstagramIcon size={20} />
              <span>@nalupoke.uy</span>
            </a>
          </div>
        </div>

        {/* Creado por Nico Labs */}
        <div className="footer-nicolabs-container">
          <a
            href="https://nicolabs.nico-family.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-nicolabs-link"
            title="Desarrollado y Creado por Nico Labs"
          >
            <span className="footer-nicolabs-created">Creado por</span>
            <img
              src="./logo_nicolabs.png"
              alt="Nico Labs"
              className="footer-nicolabs-logo"
            />
          </a>
        </div>
      </div>
    </footer>
  );
};
