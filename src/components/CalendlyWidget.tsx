'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

interface CalendlyWidgetProps {
  url: string;
  height?: string;
  className?: string;
}

export default function CalendlyWidget({ url, height = '700px', className = '' }: CalendlyWidgetProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Esperar a que el script de Calendly esté cargado
    const checkCalendly = () => {
      if (window.Calendly) {
        const widgetElement = document.getElementById('calendly-widget');
        if (widgetElement && !isLoaded) {
          window.Calendly.initInlineWidget({
            url: url,
            parentElement: widgetElement,
          });
          setIsLoaded(true);
        }
      } else {
        // Reintentar después de un breve delay
        setTimeout(checkCalendly, 100);
      }
    };

    checkCalendly();
  }, [url, isLoaded]);

  return (
    <>
      <Script
        src="https://assets.calendly.com/assets/external/widget.js"
        strategy="lazyOnload"
        onLoad={() => {
          // Forzar reinicialización cuando el script se carga
          setTimeout(() => {
            if (window.Calendly) {
              const widgetElement = document.getElementById('calendly-widget');
              if (widgetElement) {
                window.Calendly.initInlineWidget({
                  url: url,
                  parentElement: widgetElement,
                });
                setIsLoaded(true);
              }
            }
          }, 500);
        }}
      />
      <div className="w-full overflow-hidden bg-white">
        <div 
          id="calendly-widget" 
          className={`calendly-inline-widget ${className}`}
          style={{ 
            minWidth: '100%', 
            height,
            width: '100%'
          }}
        />
      </div>
      <style jsx global>{`
        .calendly-inline-widget {
          width: 100% !important;
          min-width: 100% !important;
          background: white !important;
        }
        .calendly-inline-widget iframe {
          width: 100% !important;
          height: 100% !important;
          border: none !important;
          background: white !important;
        }
        /* Asegurar que Calendly se vea bien */
        #calendly-widget {
          background: white !important;
        }
      `}</style>
    </>
  );
}

// Extender Window interface para TypeScript
declare global {
  interface Window {
    Calendly?: {
      initInlineWidget: (options: { url: string; parentElement: HTMLElement | null }) => void;
      initPopupWidget: (options: { url: string }) => void;
    };
  }
}
