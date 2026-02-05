import { useRef, useEffect } from 'react';
import { X, Mic, MicOff, Camera, Phone, Volume2 } from 'lucide-react';
import type { VoiceSessionState } from '../../hooks/useVoiceSession';

interface VoiceOverlayProps {
  session: VoiceSessionState;
  timeDisplay: string;
  isWarning: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  interimTranscript: string;
  onEndSession: () => void;
  onCapturePhoto: () => void;
  photoRequestPending: boolean;
  currentPhotoPrompt: string | null;
}

export function VoiceOverlay({
  session,
  timeDisplay,
  isWarning,
  isListening,
  isSpeaking,
  transcript,
  interimTranscript,
  onEndSession,
  onCapturePhoto,
  photoRequestPending,
  currentPhotoPrompt,
}: VoiceOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

  // Waveform visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bars = 32;
    const barWidth = canvas.width / bars - 2;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < bars; i++) {
        const amplitude = isListening || isSpeaking
          ? Math.random() * 0.7 + 0.3
          : 0.1;
        const height = amplitude * canvas.height * 0.8;

        // Gradient for bars
        const gradient = ctx.createLinearGradient(0, canvas.height - height, 0, canvas.height);
        if (isSpeaking) {
          gradient.addColorStop(0, '#A855F7');
          gradient.addColorStop(1, '#6366F1');
        } else if (isListening) {
          gradient.addColorStop(0, '#06B6D4');
          gradient.addColorStop(1, '#6366F1');
        } else {
          gradient.addColorStop(0, 'rgba(255,255,255,0.3)');
          gradient.addColorStop(1, 'rgba(255,255,255,0.1)');
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(
          i * (barWidth + 2),
          canvas.height - height,
          barWidth,
          height
        );
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isListening, isSpeaking]);

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-b from-[#0B0E14] to-[#151922] flex flex-col">
      {/* Header with timer */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={onEndSession}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        <div className={`px-4 py-2 rounded-full ${isWarning ? 'bg-yellow-500/20 animate-pulse' : 'bg-white/10'}`}>
          <span className={`font-mono text-lg ${isWarning ? 'text-yellow-400' : 'text-white'}`}>
            {timeDisplay}
          </span>
        </div>

        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Scout avatar with glow */}
        <div className="relative mb-8">
          <div className={`
            w-32 h-32 rounded-full bg-gradient-to-br from-[#A855F7] to-[#6366F1]
            flex items-center justify-center
            ${isSpeaking ? 'shadow-[0_0_60px_rgba(168,85,247,0.6)]' : 'shadow-[0_0_30px_rgba(168,85,247,0.4)]'}
            transition-shadow duration-300
          `}>
            <Volume2 className={`w-16 h-16 text-white ${isSpeaking ? 'animate-pulse' : ''}`} />
          </div>

          {/* Status indicator ring */}
          {isListening && (
            <div className="absolute inset-0 rounded-full border-4 border-[#06B6D4] animate-ping opacity-40" />
          )}
        </div>

        {/* Status text */}
        <div className="text-center mb-6">
          <h2 className="text-white text-xl font-semibold mb-2">
            {isSpeaking ? 'Scout is speaking...' : isListening ? 'Listening...' : 'Voice Session'}
          </h2>
          <p className="text-white/60 text-sm">
            {isSpeaking
              ? 'Wait for Scout to finish'
              : isListening
                ? 'Speak clearly into your microphone'
                : 'Tap the mic to start speaking'
            }
          </p>
        </div>

        {/* Live transcript display */}
        {(transcript || interimTranscript) && (
          <div className="w-full max-w-sm bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3 mb-6">
            <p className="text-white/90 text-sm">
              {transcript || interimTranscript}
              {interimTranscript && !transcript && (
                <span className="animate-pulse">|</span>
              )}
            </p>
          </div>
        )}

        {/* Photo request banner */}
        {photoRequestPending && currentPhotoPrompt && (
          <div className="w-full max-w-sm bg-[#6366F1]/20 border border-[#6366F1]/50 rounded-2xl px-4 py-3 mb-6">
            <div className="flex items-center gap-3">
              <Camera className="w-5 h-5 text-[#6366F1]" />
              <div className="flex-1">
                <p className="text-white text-sm font-medium">Photo Requested</p>
                <p className="text-white/70 text-xs">{currentPhotoPrompt}</p>
              </div>
              <button
                onClick={onCapturePhoto}
                className="px-3 py-1.5 rounded-full bg-[#6366F1] text-white text-sm font-medium hover:bg-[#5558E3] transition-colors"
              >
                Capture
              </button>
            </div>
          </div>
        )}

        {/* Photo strip */}
        {session.photos.length > 0 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {session.photos.map((photo) => (
              <div
                key={photo.id}
                className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-white/20"
              >
                <img
                  src={photo.base64}
                  alt="Captured"
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {/* Waveform visualization */}
        <canvas
          ref={canvasRef}
          width={300}
          height={80}
          className="mb-8"
        />
      </div>

      {/* Bottom controls */}
      <div className="px-6 pb-8">
        <div className="flex items-center justify-center gap-6">
          {/* Camera button */}
          <button
            onClick={onCapturePhoto}
            className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <Camera className="w-6 h-6 text-white" />
          </button>

          {/* Mic status indicator */}
          <div className={`
            w-20 h-20 rounded-full flex items-center justify-center
            ${isListening
              ? 'bg-gradient-to-r from-[#06B6D4] to-[#6366F1] shadow-[0_0_30px_rgba(6,182,212,0.5)]'
              : 'bg-white/10'
            }
          `}>
            {isListening ? (
              <Mic className="w-8 h-8 text-white" />
            ) : (
              <MicOff className="w-8 h-8 text-white/60" />
            )}
          </div>

          {/* End session button */}
          <button
            onClick={onEndSession}
            className="w-14 h-14 rounded-full bg-red-500/80 flex items-center justify-center hover:bg-red-500 transition-colors"
          >
            <Phone className="w-6 h-6 text-white transform rotate-[135deg]" />
          </button>
        </div>
      </div>
    </div>
  );
}
