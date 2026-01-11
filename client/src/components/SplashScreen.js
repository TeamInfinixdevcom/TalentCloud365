import React, { useEffect, useState } from 'react';
import infinixLogo from './images/INFINIX LOGO.png';
import '../styles/SplashScreen.css';

export default function SplashScreen({ onFinish }) {
  useEffect(() => {
    // Mostrar splash screen durante 3 segundos
    const timer = setTimeout(() => {
      onFinish();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="splash-container">
      <div className="splash-content">
        <div className="splash-logo-wrapper">
          <img 
            src={infinixLogo} 
            alt="INFINIX Logo" 
            className="splash-logo"
          />
        </div>

        <h1 className="splash-title">Infinix Dev</h1>
        <p className="splash-subtitle">Soluciones Tecnológicas</p>

        <div className="splash-info-box">
          <p className="splash-info-label">
            <span className="splash-label-key">Desarrollado por:</span> 
            <span className="splash-label-value">Ruben Madrigal</span>
          </p>
          <p className="splash-info-label">
            <span className="splash-label-key">Licencia:</span> 
            <span className="splash-label-value">INFINIX-KMS-2025-001</span>
          </p>
          <p className="splash-copyright">
            © 2025 Infinix Dev. Todos los derechos reservados.
          </p>
        </div>

        <div className="splash-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );
}
