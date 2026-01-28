import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Servicios from '@/components/Servicios';
import Metodologia from '@/components/Metodologia';
import Experiencia from '@/components/Experiencia';
import Clientes from '@/components/Clientes';
import PorQueItsDev from '@/components/PorQueItsDev';
import Contacto from '@/components/Contacto';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';
import CalendlyBadgeWidget from '@/components/CalendlyBadgeWidget';

export default function Home() {
  const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL || 'https://calendly.com/itsdev-cl/30min';

  return (
    <>
      <Header />
      <main>
        <Hero />
        <Servicios />
        <Metodologia />
        <Experiencia />
        <Clientes />
        <PorQueItsDev />
        <Contacto />
      </main>
      <Footer />
      <WhatsAppButton />
      {calendlyUrl && (
        <CalendlyBadgeWidget
          url={calendlyUrl}
          text="Programe una reunión conmigo"
          color="#0069ff"
          textColor="#ffffff"
          branding
        />
      )}
    </>
  );
}
