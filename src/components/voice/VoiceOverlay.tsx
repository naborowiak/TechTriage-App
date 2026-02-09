import React, { useRef, useEffect, useState } from 'react';
import { X, Camera, Mic, MicOff, StopCircle, Image as ImageIcon, LifeBuoy, VolumeX, Volume2 } from 'lucide-react';
import { VoiceSessionState, VoicePhoto } from '../../hooks/useVoiceSession';

interface VoiceOverlayProps {
  session: VoiceSessionState;
  timeDisplay: string;
  isWarning: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  onEndSession: () => void;
  onCapturePhoto: () => void;
  onToggleMute?: () => void;
  isMuted?: boolean;
  photoRequestPending: boolean;
  currentPhotoPrompt: string | null;
}

const BotAvatar = ({ className }: { className?: string }) => {
  const [error, setError] = useState(false);
  if (error) return <LifeBuoy className={className} />;
  return (
    <img
      src="/scout_logo.png"
      className={`${className} object-contain`}
      alt="Scout"
      onError={() => setError(true)}
    />
  );
};

export const VoiceOverlay: React.FC<VoiceOverlayProps> = ({
  session,
  timeDisplay,
  isWarning,
  isListening,
  isSpeaking,
  onEndSession,
  onCapturePhoto,
  onToggleMute,
  isMuted = false,
  photoRequestPending,
  currentPhotoPrompt,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  // TotalAssist brand colors for waveform
  const BRAND_COLORS = {
    speaking: {
      start: '#A855F7',  // scout-purple
      end: '#6366F1',    // electric-indigo
    },
    listening: {
      start: '#06B6D4',  // electric-cyan
      end: '#A855F7',    // scout-purple
    },
    idle: {
      start: '#475569',
      end: '#334155',
    },
  };

  // Enhanced waveform visualization with brand colors
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      const barCount = 40;
      const gap = 3;
      const barWidth = (width - (barCount - 1) * gap) / barCount;

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < barCount; i++) {
        // Generate wave-like heights based on state
        const time = Date.now() / 1000;
        const waveOffset = Math.sin(time * 3 + i * 0.3) * 0.15;

        const baseHeight = isMuted ? 0.05 : isSpeaking ? 0.55 : isListening ? 0.35 : 0.1;
        const variation = (isSpeaking || isListening) && !isMuted ? Math.random() * 0.4 + waveOffset : 0.02;
        const barHeight = Math.max(4, (baseHeight + variation) * height);

        const x = i * (barWidth + gap);
        const y = (height - barHeight) / 2;

        // Color based on state with brand colors
        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);

        if (isMuted) {
          gradient.addColorStop(0, '#64748B');
          gradient.addColorStop(1, '#475569');
        } else if (isSpeaking) {
          gradient.addColorStop(0, BRAND_COLORS.speaking.start);
          gradient.addColorStop(0.5, BRAND_COLORS.speaking.end);
          gradient.addColorStop(1, BRAND_COLORS.speaking.start);
        } else if (isListening) {
          gradient.addColorStop(0, BRAND_COLORS.listening.start);
          gradient.addColorStop(0.5, BRAND_COLORS.listening.end);
          gradient.addColorStop(1, BRAND_COLORS.listening.start);
        } else {
          gradient.addColorStop(0, BRAND_COLORS.idle.start);
          gradient.addColorStop(1, BRAND_COLORS.idle.end);
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 3);
        ctx.fill();

        // Add glow effect when active
        if ((isSpeaking || isListening) && !isMuted) {
          ctx.shadowColor = isSpeaking ? BRAND_COLORS.speaking.start : BRAND_COLORS.listening.start;
          ctx.shadowBlur = 8;
        } else {
          ctx.shadowBlur = 0;
        }
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isListening, isSpeaking, isMuted]);

  return (
    <div className="fixed inset-0 z-[70] bg-midnight-950/95 backdrop-blur-md flex flex-col items-center justify-center">
      {/* Close button */}
      <button
        onClick={onEndSession}
        className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Header with avatar */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-scout-purple to-electric-indigo rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-scout-purple/30">
          <BotAvatar className="w-12 h-12" />
        </div>
        <h2 className="text-white font-bold text-lg">Voice Support</h2>
        <p className="text-text-secondary text-sm">
          {isSpeaking ? 'Your agent is speaking...' : isListening ? 'Listening...' : 'Ready'}
        </p>
      </div>

      {/* Timer */}
      <div className={`text-6xl font-bold mb-8 font-mono transition-colors ${
        isWarning ? 'text-yellow-400 animate-pulse' : 'text-white'
      }`}>
        {timeDisplay}
      </div>

      {/* Waveform visualization */}
      <div className="w-64 h-16 mb-8">
        <canvas
          ref={canvasRef}
          width={256}
          height={64}
          className="w-full h-full"
        />
      </div>

      {/* Photo request banner */}
      {photoRequestPending && currentPhotoPrompt && (
        <div className="max-w-md mx-4 mb-8 bg-electric-indigo/20 border border-electric-indigo rounded-xl p-4 animate-fade-in-up">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-electric-indigo/30 rounded-lg flex items-center justify-center shrink-0">
              <Camera className="w-5 h-5 text-electric-indigo" />
            </div>
            <div className="flex-1">
              <p className="text-white font-medium text-sm mb-2">
                {currentPhotoPrompt}
              </p>
              <button
                onClick={onCapturePhoto}
                className="btn-gradient-electric text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                Take Photo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo strip */}
      {session.photos.length > 0 && (
        <div className="max-w-md w-full px-4 mb-8">
          <div className="flex items-center gap-2 mb-2">
            <ImageIcon className="w-4 h-4 text-text-secondary" />
            <span className="text-text-secondary text-xs font-medium">
              {session.photos.length} photo{session.photos.length !== 1 ? 's' : ''} captured
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {session.photos.map((photo: VoicePhoto) => (
              <div
                key={photo.id}
                className="w-16 h-16 rounded-lg overflow-hidden border border-midnight-700 shrink-0"
              >
                <img
                  src={photo.base64}
                  alt="Captured"
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-4">
        {/* Manual photo capture */}
        <button
          onClick={onCapturePhoto}
          className="p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          title="Capture photo"
        >
          <Camera className="w-6 h-6" />
        </button>

        {/* Mute button */}
        {onToggleMute && (
          <button
            onClick={onToggleMute}
            className={`p-4 rounded-full transition-colors ${
              isMuted
                ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/30'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
          </button>
        )}

        {/* Mic status indicator */}
        <div className={`p-6 rounded-full transition-all ${
          isMuted
            ? 'bg-yellow-500/20 text-yellow-400'
            : isListening
              ? 'bg-gradient-to-br from-electric-cyan to-scout-purple text-white shadow-lg shadow-electric-cyan/40 animate-pulse'
              : 'bg-white/10 text-white'
        }`}>
          {isMuted ? (
            <MicOff className="w-8 h-8" />
          ) : isListening ? (
            <Mic className="w-8 h-8" />
          ) : (
            <MicOff className="w-8 h-8" />
          )}
        </div>

        {/* End session */}
        <button
          onClick={onEndSession}
          className="p-4 bg-red-600 hover:bg-red-700 rounded-full text-white transition-colors shadow-lg shadow-red-900/30"
          title="End session"
        >
          <StopCircle className="w-6 h-6" />
        </button>
      </div>

      {/* Status text */}
      <div className="mt-6 text-text-muted text-xs text-center">
        <p>Speak naturally. Your agent will guide you through the diagnostic.</p>
        {session.transcript.length > 0 && (
          <p className="mt-1">
            {session.transcript.length} exchange{session.transcript.length !== 1 ? 's' : ''} in this session
          </p>
        )}
      </div>
    </div>
  );
};

export default VoiceOverlay;
