import React from 'react';
import { MarcaInfo, TenantInfo } from '../types/food';

interface FooterProps {
  marca?: MarcaInfo;
  tenant?: TenantInfo;
}

export const Footer: React.FC<FooterProps> = () => {
  return (
    <footer className="site-footer site-footer--simple">
      <div className="page-container">
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
