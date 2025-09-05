// Usando la imagen directamente desde uploads
const logoImage = '/lovable-uploads/4508c844-ebdc-4c78-9e98-83582dbbe52c.png';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Logo = ({ className = '', size = 'md' }: LogoProps) => {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-16'
  };

  return (
    <img 
      src={logoImage} 
      alt="CajaCrypto Logo" 
      className={`${sizeClasses[size]} ${className}`}
    />
  );
};