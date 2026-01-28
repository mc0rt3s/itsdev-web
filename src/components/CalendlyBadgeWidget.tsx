'use client';

import { useEffect } from 'react';
import Script from 'next/script';

interface CalendlyBadgeWidgetProps {
  url: string;
  text?: string;
  color?: string;
  textColor?: string;
  branding?: boolean;
}

export default function CalendlyBadgeWidget({
  url,
  text = 'Programe una reunión conmigo',
  color = '#0069ff',
  textColor = '#ffffff',
  branding = true,
}: CalendlyBadgeWidgetProps) {
  useEffect(() => {
    // Añadir CSS oficial del widget de Calendly
    const linkId = 'calendly-widget-css';
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.href = 'https://assets.calendly.com/assets/external/widget.css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }, []);

  const initBadge = () => {
    if (typeof window !== 'undefined' && window.Calendly) {
      const cal = window.Calendly as {
        initPopupWidget: (opts: { url: string }) => void;
        initBadgeWidget: (opts: {
          url: string;
          text?: string;
          color?: string;
          textColor?: string;
          branding?: boolean;
        }) => void;
      };
      cal.initBadgeWidget({
        url,
        text,
        color,
        textColor,
        branding,
      });
    }
  };

  return (
    <>
      <Script
        src="https://assets.calendly.com/assets/external/widget.js"
        strategy="lazyOnload"
        onLoad={() => {
          // Calendly sugiere init en window.onload; si ya cargó, init ya
          if (document.readyState === 'complete') {
            initBadge();
          } else {
            window.addEventListener('load', initBadge);
          }
        }}
      />
    </>
  );
}
