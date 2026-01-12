'use client';

import Script from 'next/script';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export default function Analytics() {
  if (!GA_MEASUREMENT_ID) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            page_title: document.title,
            page_location: window.location.href,
          });
        `}
      </Script>
    </>
  );
}

// Helper para trackear eventos personalizados
export function trackEvent(action: string, category: string, label?: string, value?: number) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
}

// Eventos predefinidos para ItsDev
export const AnalyticsEvents = {
  // Contacto
  formSubmit: () => trackEvent('form_submit', 'contact', 'contact_form'),
  whatsappClick: () => trackEvent('click', 'contact', 'whatsapp_button'),
  emailClick: () => trackEvent('click', 'contact', 'email_link'),
  phoneClick: () => trackEvent('click', 'contact', 'phone_link'),
  
  // Navegación
  navClick: (section: string) => trackEvent('click', 'navigation', section),
  ctaClick: (button: string) => trackEvent('click', 'cta', button),
  
  // Servicios
  serviceView: (service: string) => trackEvent('view', 'services', service),
};

// Declarar gtag en window
declare global {
  interface Window {
    gtag: (command: string, ...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}
