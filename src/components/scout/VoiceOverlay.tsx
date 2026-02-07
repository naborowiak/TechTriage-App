import { useRef, useEffect } from 'react';
import { X, Mic, MicOff, Camera, Phone, Volume2, AlertCircle, Loader2, Bot, User } from 'lucide-react';
import type { VoiceSessionState } from '../../hooks/useVoiceSession';
import type { GeminiVoiceStatus } from '../../hooks/useGeminiVoice';

interface TranscriptEntry {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

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
  // Optional analyser nodes for real audio visualization
  outputAnalyser?: AnalyserNode | null;
  inputAnalyser?: AnalyserNode | null;
  // Optional Gemini voice status (overrides isListening/isSpeaking when provided)
  geminiStatus?: GeminiVoiceStatus;
  // Connection error message
  connectionError?: string | null;
  // Live transcript history
  transcriptHistory?: TranscriptEntry[];
  // User's display name for transcript
  userName?: string;
}

export function VoiceOverlay({
  session,
  timeDisplay,
  isWarning,
  isListening: isListeningProp,
  isSpeaking: isSpeakingProp,
  transcript,
  interimTranscript,
  onEndSession,
  onCapturePhoto,
  photoRequestPending,
  currentPhotoPrompt,
  outputAnalyser,
  inputAnalyser,
  geminiStatus,
  connectionError,
  transcriptHistory,
  userName,
}: VoiceOverlayProps) {
  // When geminiStatus is provided, derive listening/speaking from it
  const isListening = geminiStatus ? geminiStatus === 'listening' : isListeningProp;
  const isSpeaking = geminiStatus ? geminiStatus === 'speaking' : isSpeakingProp;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll transcript to bottom
  useEffect(() => {
    if (transcriptHistory && transcriptHistory.length > 0) {
      transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcriptHistory?.length]);

  // Waveform visualization — uses real analyser data when available, falls back to random
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bars = 32;
    const barWidth = canvas.width / bars - 2;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Choose the active analyser based on state
      const activeAnalyser = isSpeaking ? outputAnalyser : inputAnalyser;
      let dataArray: Uint8Array<ArrayBuffer> | null = null;

      if (activeAnalyser) {
        const bufferLength = activeAnalyser.frequencyBinCount;
        const arr = new Uint8Array(bufferLength);
        activeAnalyser.getByteFrequencyData(arr);
        dataArray = arr as Uint8Array<ArrayBuffer>;
      }

      for (let i = 0; i < bars; i++) {
        let amplitude: number;
        if (dataArray && dataArray.length > 0) {
          // Map bar index to analyser data
          const dataIndex = Math.floor((i / bars) * dataArray.length);
          amplitude = dataArray[dataIndex] / 255;
          // Add minimum floor when active
          if (isListening || isSpeaking) {
            amplitude = Math.max(amplitude, 0.05);
          }
        } else {
          // Fallback to random when no analyser available
          amplitude = isListening || isSpeaking
            ? Math.random() * 0.7 + 0.3
            : 0.1;
        }
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
  }, [isListening, isSpeaking, outputAnalyser, inputAnalyser]);

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-b from-[#0B0E14] to-[#151922] flex items-center justify-center overflow-hidden">
      <div className="flex flex-col w-full h-full max-w-2xl">
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
        {/* Connection error state */}
        {connectionError ? (
          <>
            <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
              <AlertCircle className="w-10 h-10 text-red-400" />
            </div>
            <div className="text-center mb-6">
              <h2 className="text-white text-xl font-semibold mb-2">Connection Failed</h2>
              <p className="text-white/60 text-sm max-w-sm">{connectionError}</p>
            </div>
            <button
              onClick={onEndSession}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-semibold text-sm transition-colors"
            >
              Go Back
            </button>
          </>
        ) : geminiStatus === 'connecting' ? (
          <>
            <div className="relative mb-8">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#A855F7] to-[#6366F1] flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.4)]">
                <Loader2 className="w-16 h-16 text-white animate-spin" />
              </div>
            </div>
            <div className="text-center mb-6">
              <h2 className="text-white text-xl font-semibold mb-2">Connecting...</h2>
              <p className="text-white/60 text-sm">Setting up your voice session</p>
            </div>
          </>
        ) : (
          <>
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
        {transcriptHistory && transcriptHistory.length > 0 ? (
          <div className="w-full max-w-sm bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3 mb-6 max-h-48 overflow-y-auto">
            <div className="space-y-3">
              {transcriptHistory.map((entry, i) => (
                <div key={i} className={`flex flex-col ${entry.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-1.5 mb-1 opacity-60">
                    {entry.role === 'model' ? (
                      <Bot className="w-3 h-3 text-[#A855F7]" />
                    ) : (
                      <User className="w-3 h-3 text-[#06B6D4]" />
                    )}
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-white/70">
                      {entry.role === 'model' ? 'Scout' : (userName || 'You')}
                    </span>
                  </div>
                  <div className={`max-w-[90%] px-3 py-2 rounded-xl text-sm ${
                    entry.role === 'user'
                      ? 'bg-gradient-to-r from-[#6366F1]/30 to-[#06B6D4]/30 text-white border border-[#6366F1]/20 rounded-tr-sm'
                      : 'bg-white/5 text-white/90 border border-white/10 rounded-tl-sm'
                  }`}>
                    {entry.text}
                  </div>
                </div>
              ))}
              <div ref={transcriptEndRef} />
            </div>
          </div>
        ) : (transcript || interimTranscript) ? (
          <div className="w-full max-w-sm bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3 mb-6">
            <p className="text-white/90 text-sm">
              {transcript || interimTranscript}
              {interimTranscript && !transcript && (
                <span className="animate-pulse">|</span>
              )}
            </p>
          </div>
        ) : null}

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
          </>
        )}
      </div>

      {/* Bottom controls — hidden during error/connecting */}
      {!connectionError && geminiStatus !== 'connecting' && (
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
      )}
      </div>
    </div>
  );
}
