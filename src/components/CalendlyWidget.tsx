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
    const checkCalendly = () => {
      const cal = typeof window !== 'undefined' ? (window as unknown as { Calendly?: { initInlineWidget: (opts: { url: string; parentElement: HTMLElement | null }) => void } }).Calendly : undefined;
      if (cal) {
        const widgetElement = document.getElementById('calendly-widget');
        if (widgetElement && !isLoaded) {
          cal.initInlineWidget({
            url: url,
            parentElement: widgetElement,
          });
          setIsLoaded(true);
        }
      } else {
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
          setTimeout(() => {
            const cal = window.Calendly as undefined | {
              initInlineWidget: (opts: { url: string; parentElement: HTMLElement | null }) => void;
            };
            if (cal) {
              const widgetElement = document.getElementById('calendly-widget');
              if (widgetElement) {
                cal.initInlineWidget({
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
