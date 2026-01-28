'use client';

import { useState } from 'react';
import Script from 'next/script';
import { AnalyticsEvents } from './Analytics';

interface CalendlyFloatingButtonProps {
  url: string;
}

export default function CalendlyFloatingButton({ url }: CalendlyFloatingButtonProps) {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  const handleClick = () => {
    AnalyticsEvents.calendlyClick?.();
    if (window.Calendly) {
      window.Calendly.initPopupWidget({
        url: url,
      });
    }
  };

  return (
    <>
      <Script
        src="https://assets.calendly.com/assets/external/widget.js"
        strategy="lazyOnload"
        onLoad={() => setIsScriptLoaded(true)}
      />
      <button
        onClick={handleClick}
        disabled={!isScriptLoaded}
        className="fixed bottom-24 right-6 z-50 flex items-center justify-center w-14 h-14 bg-[#0069ff] hover:bg-[#0052cc] text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 group"
        aria-label="Agendar reunión con Calendly"
        title="Agendar reunión"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        
        {/* Tooltip */}
        <span className="absolute right-16 bg-slate-900 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Agendar reunión
        </span>
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
