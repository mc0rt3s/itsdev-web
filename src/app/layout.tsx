import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Analytics, { GTMNoScript } from "@/components/Analytics";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://itsdev.cl'),
  title: {
    default: "ItsDev | Desarrollo de Software & Soluciones TI en Chile",
    template: "%s | ItsDev"
  },
  description: "Partner tecnológico en Chile especializado en desarrollo de software a medida, infraestructura TI, automatización y soporte técnico. Soluciones robustas, seguras y escalables para empresas. +10 años de experiencia.",
  keywords: [
    "desarrollo software Chile",
    "desarrollo web Santiago",
    "empresa desarrollo software",
    "consultora TI Chile",
    "infraestructura TI",
    "soporte técnico empresas",
    "automatización procesos",
    "aplicaciones a medida",
    "sistemas empresariales",
    "transformación digital Chile",
    "ItsDev",
    "desarrollo aplicaciones",
    "mantenimiento sistemas",
    "servicios TI"
  ],
  authors: [{ name: "ItsDev", url: "https://itsdev.cl" }],
  creator: "ItsDev",
  publisher: "ItsDev",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "es_CL",
    url: "https://itsdev.cl",
    siteName: "ItsDev",
    title: "ItsDev | Desarrollo de Software & Soluciones TI en Chile",
    description: "Partner tecnológico especializado en desarrollo de software a medida, infraestructura TI, automatización y soporte. +10 años de experiencia transformando empresas.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ItsDev - Soluciones Tecnológicas que Funcionan",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ItsDev | Desarrollo de Software & Soluciones TI",
    description: "Partner tecnológico en Chile. Desarrollo de software, infraestructura TI y automatización para empresas.",
    images: ["/og-image.png"],
    creator: "@itsdev_cl",
  },
  alternates: {
    canonical: "https://itsdev.cl",
  },
  category: "technology",
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
  },
  other: {
    "geo.region": "CL",
    "geo.placename": "Santiago, Chile",
  },
};

// JSON-LD Structured Data
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://itsdev.cl/#organization",
      name: "ItsDev",
      url: "https://itsdev.cl",
      logo: {
        "@type": "ImageObject",
        url: "https://itsdev.cl/logo.svg",
        width: 200,
        height: 60,
      },
      description: "Partner tecnológico especializado en desarrollo de software, infraestructura TI, automatización y soporte técnico en Chile.",
      address: {
        "@type": "PostalAddress",
        addressCountry: "CL",
        addressRegion: "Región Metropolitana",
        addressLocality: "Santiago",
      },
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+56-9-9095-8220",
        contactType: "sales",
        email: "contacto@itsdev.cl",
        availableLanguage: ["Spanish", "English"],
        areaServed: "CL",
      },
      sameAs: [
        "https://www.linkedin.com/company/itsdev-cl",
        "https://github.com/itsdev-cl"
      ],
      foundingDate: "2014",
      slogan: "Soluciones Tecnológicas que Funcionan",
    },
    {
      "@type": "WebSite",
      "@id": "https://itsdev.cl/#website",
      url: "https://itsdev.cl",
      name: "ItsDev",
      publisher: {
        "@id": "https://itsdev.cl/#organization"
      },
      inLanguage: "es-CL",
    },
    {
      "@type": "LocalBusiness",
      "@id": "https://itsdev.cl/#localbusiness",
      name: "ItsDev",
      image: "https://itsdev.cl/logo.svg",
      url: "https://itsdev.cl",
      telephone: "+56-9-9095-8220",
      email: "contacto@itsdev.cl",
      address: {
        "@type": "PostalAddress",
        addressCountry: "CL",
        addressRegion: "Región Metropolitana",
        addressLocality: "Santiago",
      },
      priceRange: "$$",
      openingHours: "Mo-Fr 09:00-18:00",
      areaServed: {
        "@type": "Country",
        name: "Chile"
      },
      serviceType: [
        "Desarrollo de Software",
        "Consultoría TI",
        "Infraestructura TI",
        "Soporte Técnico",
        "Automatización de Procesos"
      ],
    },
    {
      "@type": "Service",
      "@id": "https://itsdev.cl/#service-desarrollo",
      name: "Desarrollo de Software a Medida",
      provider: {
        "@id": "https://itsdev.cl/#organization"
      },
      description: "Aplicaciones web, móviles y sistemas empresariales desarrollados a medida para tu negocio.",
      areaServed: "CL",
    },
    {
      "@type": "Service",
      "@id": "https://itsdev.cl/#service-infraestructura",
      name: "Infraestructura TI",
      provider: {
        "@id": "https://itsdev.cl/#organization"
      },
      description: "Diseño, implementación y gestión de infraestructura tecnológica empresarial.",
      areaServed: "CL",
    },
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#7AA228" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GTMNoScript />
        <Analytics />
        {children}
      </body>
    </html>
  );
}
