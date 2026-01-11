import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ItsDev | Soluciones Tecnológicas que Funcionan",
  description: "Partner tecnológico especializado en desarrollo de software, infraestructura TI, automatización y soporte. Soluciones robustas, seguras y escalables para empresas.",
  keywords: ["desarrollo software", "infraestructura TI", "soporte técnico", "automatización", "consultoría tecnológica", "Chile"],
  authors: [{ name: "ItsDev" }],
  openGraph: {
    title: "ItsDev | Soluciones Tecnológicas que Funcionan",
    description: "Partner tecnológico especializado en desarrollo de software, infraestructura TI, automatización y soporte.",
    type: "website",
    locale: "es_CL",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
