import Image from 'next/image';

interface LogoProps {
  className?: string;
  variant?: 'full' | 'text';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  inverted?: boolean;
}

export default function Logo({ 
  className = '', 
  variant = 'text',
  size = 'md',
  inverted = false 
}: LogoProps) {
  const imageSizes = {
    sm: { w: 120, h: 96 },
    md: { w: 180, h: 144 },
    lg: { w: 240, h: 192 },
    xl: { w: 320, h: 256 },
    hero: { w: 400, h: 320 },
  };

  const textSizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
    hero: 'text-5xl',
  };

  // Logo completo (imagen SVG)
  if (variant === 'full') {
    return (
      <div className={className}>
        <Image
          src="/logo.svg"
          alt="ItsDev - Soluciones Informáticas"
          width={imageSizes[size].w}
          height={imageSizes[size].h}
          priority
          className={inverted ? 'brightness-0 invert' : ''}
        />
      </div>
    );
  }

  // Solo texto - para Header
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className={`${textSizes[size]} font-bold tracking-tight`}>
        <span className={inverted ? 'text-white' : 'text-[#224859] dark:text-white'}>ITS</span>
        <span className="text-[#7AA228]">-Dev</span>
      </span>
    </div>
  );
}
