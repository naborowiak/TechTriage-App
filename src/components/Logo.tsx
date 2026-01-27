import React from 'react';

interface LogoProps {
  variant?: 'light' | 'dark';
}

export const Logo: React.FC<LogoProps> = ({ variant = 'dark' }) => {
  const textColor = variant === 'light' ? 'text-white' : 'text-brand-900';
  
  return (
    <div className={`flex items-center gap-2 ${textColor}`}>
      <div className="w-8 h-8 bg-cta-500 rounded-lg flex items-center justify-center">
        <span className="text-white font-bold text-sm">TT</span>
      </div>
      <span className="font-bold text-xl tracking-tight">TechTriage</span>
    </div>
  );
};
