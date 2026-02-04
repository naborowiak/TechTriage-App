import React, { useState } from 'react';

interface LogoProps {
  className?: string;
  variant?: 'standard' | 'light' | 'dark';
}

// ScoutLogo - "System Active" icon: circle with pulse/heartbeat line through center
export const ScoutLogo: React.FC<{ className?: string; size?: number }> = ({
  className = "",
  size = 36
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="scoutGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#A855F7" />
        <stop offset="100%" stopColor="#6366F1" />
      </linearGradient>
      <linearGradient id="pulseGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#6366F1" />
        <stop offset="100%" stopColor="#06B6D4" />
      </linearGradient>
    </defs>
    {/* Outer circle */}
    <circle cx="18" cy="18" r="16" stroke="url(#scoutGradient)" strokeWidth="2" fill="none" />
    {/* Inner glow circle */}
    <circle cx="18" cy="18" r="12" fill="url(#scoutGradient)" opacity="0.15" />
    {/* Heartbeat/pulse line */}
    <path
      d="M6 18 L12 18 L14 14 L16 22 L18 16 L20 20 L22 18 L30 18"
      stroke="url(#pulseGradient)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

// ScoutSignalIcon - Radar sweep/signal ping icon
export const ScoutSignalIcon: React.FC<{
  className?: string;
  size?: number;
  animate?: boolean;
}> = ({
  className = "",
  size = 24,
  animate = true
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="signalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#A855F7" />
        <stop offset="100%" stopColor="#06B6D4" />
      </linearGradient>
    </defs>
    {/* Outer circle */}
    <circle cx="12" cy="12" r="10" stroke="url(#signalGradient)" strokeWidth="1.5" fill="none" opacity="0.3" />
    {/* Middle ring */}
    <circle cx="12" cy="12" r="6" stroke="url(#signalGradient)" strokeWidth="1.5" fill="none" opacity="0.5" />
    {/* Center dot */}
    <circle cx="12" cy="12" r="2" fill="url(#signalGradient)" />
    {/* Radar sweep arc */}
    <path
      d="M12 2 A10 10 0 0 1 22 12"
      stroke="#A855F7"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
      className={animate ? "animate-radar-sweep origin-center" : ""}
    />
  </svg>
);

export const Logo: React.FC<LogoProps> = ({
  className = "",
  variant = 'standard'
}) => {
  const isLight = variant === 'light' || variant === 'standard';
  const [imgError, setImgError] = useState(false);

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {!imgError ? (
        <img
          src="/total_assist_logo.png"
          alt="TotalAssist Logo"
          className="w-9 h-9 object-contain"
          onError={() => setImgError(true)}
        />
      ) : (
        <ScoutLogo size={36} />
      )}
      <div className="flex flex-col justify-center">
        <span className="text-xl font-bold tracking-tight leading-none">
          <span className={isLight ? 'text-white' : 'text-midnight-950'}>Total</span>
          <span className="text-gradient-electric">Assist</span>
        </span>
      </div>
    </div>
  );
};
