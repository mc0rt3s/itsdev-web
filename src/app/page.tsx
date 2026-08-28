import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Servicios from '@/components/Servicios';
import Metodologia from '@/components/Metodologia';
import Experiencia from '@/components/Experiencia';
import PorQueItsDev from '@/components/PorQueItsDev';
import Contacto from '@/components/Contacto';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Servicios />
        <Metodologia />
        <Experiencia />
        <PorQueItsDev />
        <Contacto />
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
