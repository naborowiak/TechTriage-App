import React, { useState } from 'react';
import { LifeBuoy } from 'lucide-react';

interface LogoProps {
  className?: string;
  variant?: 'standard' | 'light';
}

export const Logo: React.FC<LogoProps> = ({ 
  className = "", 
  variant = 'standard'
}) => {
  const isLight = variant === 'light';
  const [imgError, setImgError] = useState(false);
  
  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      {!imgError ? (
        <img 
          src="/Tech_Triage.png" 
          alt="TechTriage Logo" 
          className="w-8 h-8 object-contain"
          onError={() => setImgError(true)}
        />
      ) : (
        <LifeBuoy className={`w-8 h-8 ${isLight ? 'text-white' : 'text-cta-500'}`} />
      )}
      <div className="flex flex-col justify-center">
        <span className={`text-xl font-bold tracking-tight leading-none ${isLight ? 'text-white' : 'text-brand-900'}`}>
          Tech<span className={isLight ? 'text-white' : 'text-cta-500'}>Triage</span>
        </span>
      </div>
    </div>
  );
};
