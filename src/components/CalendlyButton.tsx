'use client';

import { useState, useEffect } from 'react';
import Script from 'next/script';

interface CalendlyButtonProps {
  url: string;
  text?: string;
  className?: string;
}

export default function CalendlyButton({ 
  url, 
  text = 'Agendar reunión',
  className = ''
}: CalendlyButtonProps) {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  useEffect(() => {
    // Verificar si Calendly ya está cargado
    const checkCalendly = () => {
      if (window.Calendly) {
        setIsScriptLoaded(true);
      } else {
        setTimeout(checkCalendly, 100);
      }
    };
    checkCalendly();
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!url || url === 'https://calendly.com/tu-usuario/30min') {
      console.error('URL de Calendly no configurada correctamente');
      alert('Por favor, configura la URL de Calendly en las variables de entorno.');
      return;
    }
    
    if (window.Calendly) {
      try {
        window.Calendly.initPopupWidget({
          url: url,
        });
      } catch (error) {
        console.error('Error al abrir Calendly:', error);
        // Fallback: abrir en nueva pestaña
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } else {
      // Si el script no está cargado, intentar cargarlo manualmente
      const existingScript = document.querySelector('script[src*="calendly.com"]');
      if (existingScript) {
        // El script ya existe, esperar a que se cargue
        const checkInterval = setInterval(() => {
          if (window.Calendly) {
            clearInterval(checkInterval);
            try {
              window.Calendly.initPopupWidget({
                url: url,
              });
            } catch (error) {
              console.error('Error al abrir Calendly:', error);
              window.open(url, '_blank', 'noopener,noreferrer');
            }
          }
        }, 100);
        
        // Timeout después de 5 segundos
        setTimeout(() => {
          clearInterval(checkInterval);
          if (!window.Calendly) {
            window.open(url, '_blank', 'noopener,noreferrer');
          }
        }, 5000);
      } else {
        // Cargar el script
        const script = document.createElement('script');
        script.src = 'https://assets.calendly.com/assets/external/widget.js';
        script.async = true;
        script.onload = () => {
          if (window.Calendly) {
            try {
              window.Calendly.initPopupWidget({
                url: url,
              });
            } catch (error) {
              console.error('Error al abrir Calendly:', error);
              window.open(url, '_blank', 'noopener,noreferrer');
            }
          }
        };
        script.onerror = () => {
          console.error('Error al cargar el script de Calendly');
          window.open(url, '_blank', 'noopener,noreferrer');
        };
        document.body.appendChild(script);
      }
    }
  };

  return (
    <>
      <Script
        src="https://assets.calendly.com/assets/external/widget.js"
        strategy="lazyOnload"
        onLoad={() => setIsScriptLoaded(true)}
        onError={() => {
          console.error('Error al cargar el script de Calendly');
        }}
      />
      <button
        onClick={handleClick}
        className={className}
        type="button"
      >
        {text}
      </button>
    </>
  );
}

// Extender Window interface para TypeScript
declare global {
  interface Window {
    Calendly?: {
      initPopupWidget: (options: { url: string }) => void;
    };
  }
}
