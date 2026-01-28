'use client';

import Script from 'next/script';

const GTM_ID = 'GTM-5CLF8TL5';

export default function Analytics() {
  return (
    <>
      {/* Google Tag Manager */}
      <Script
        id="gtm-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${GTM_ID}');
          `,
        }}
      />
    </>
  );
}

// Componente para el noscript (va en el body)
export function GTMNoScript() {
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
      />
    </noscript>
  );
}

// Helper para enviar eventos al dataLayer
export function trackEvent(eventName: string, eventParams?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: eventName,
      ...eventParams,
    });
  }
}

// Eventos predefinidos para ItsDev
export const AnalyticsEvents = {
  // Contacto
  formSubmit: () => trackEvent('form_submit', { 
    form_name: 'contact_form',
    form_location: 'contact_section' 
  }),
  whatsappClick: () => trackEvent('whatsapp_click', { 
    click_location: 'floating_button' 
  }),
  emailClick: () => trackEvent('email_click', { 
    click_location: 'contact_section' 
  }),
  phoneClick: () => trackEvent('phone_click', { 
    click_location: 'contact_section' 
  }),
  calendlyClick: () => trackEvent('calendly_click', { 
    click_location: 'floating_button' 
  }),
  
  // Navegación
  navClick: (section: string) => trackEvent('navigation_click', { 
    section_name: section 
  }),
  ctaClick: (button: string) => trackEvent('cta_click', { 
    button_name: button 
  }),
  
  // Servicios
  serviceView: (service: string) => trackEvent('service_view', { 
    service_name: service 
  }),

  // Scroll
  scrollToSection: (section: string) => trackEvent('scroll_to_section', {
    section_name: section
  }),
};

// Declarar dataLayer en window
declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}
