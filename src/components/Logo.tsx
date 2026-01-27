import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'standard' | 'light' | 'dark';
}

const TriageNodeIcon: React.FC<{ className?: string; isLight?: boolean }> = ({ className = "", isLight = false }) => (
  <svg 
    viewBox="0 0 40 40" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="20" cy="20" r="6" fill="#F97316" />
    <circle cx="8" cy="12" r="4" fill={isLight ? "#ffffff" : "#1F2937"} />
    <circle cx="32" cy="12" r="4" fill={isLight ? "#ffffff" : "#1F2937"} />
    <circle cx="8" cy="32" r="4" fill={isLight ? "#ffffff" : "#1F2937"} />
    <circle cx="32" cy="32" r="4" fill={isLight ? "#ffffff" : "#1F2937"} />
    <line x1="14" y1="17" x2="11" y2="14" stroke="#F97316" strokeWidth="2" strokeLinecap="round" />
    <line x1="26" y1="17" x2="29" y2="14" stroke="#F97316" strokeWidth="2" strokeLinecap="round" />
    <line x1="14" y1="23" x2="11" y2="29" stroke="#F97316" strokeWidth="2" strokeLinecap="round" />
    <line x1="26" y1="23" x2="29" y2="29" stroke="#F97316" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const Logo: React.FC<LogoProps> = ({ 
  className = "", 
  variant = 'standard'
}) => {
  const isLight = variant === 'light';
  
  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      <TriageNodeIcon className="w-10 h-10" isLight={isLight} />
      <div className="flex flex-col justify-center">
        <span className="text-xl font-semibold tracking-tight leading-none">
          <span className={isLight ? 'text-white' : 'text-[#1F2937]'}>Tech</span>
          <span className="text-[#F97316]">Triage</span>
        </span>
      </div>
    </div>
  );
};
