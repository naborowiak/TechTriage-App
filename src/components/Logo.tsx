import React, { useState } from 'react';
import { LifeBuoy } from 'lucide-react';

interface LogoProps {
  className?: string;
  variant?: 'standard' | 'light' | 'dark';
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
          src="/tech-triage-logo.png" 
          alt="TechTriage Logo" 
          className="w-10 h-10 object-contain"
          onError={() => setImgError(true)}
        />
      ) : (
        <LifeBuoy className={`w-10 h-10 ${isLight ? 'text-white' : 'text-[#F97316]'}`} />
      )}
      <div className="flex flex-col justify-center">
        <span className="text-xl font-semibold tracking-tight leading-none">
          <span className={isLight ? 'text-white' : 'text-[#1F2937]'}>Tech</span>
          <span className="text-[#F97316]">Triage</span>
        </span>
      </div>
    </div>
  );
};
