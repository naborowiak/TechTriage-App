import { useRef, useEffect } from 'react';
import { X, Mic, MicOff, Camera, Phone, AlertCircle, Loader2 } from 'lucide-react';
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
  outputAnalyser?: AnalyserNode | null;
  inputAnalyser?: AnalyserNode | null;
  geminiStatus?: GeminiVoiceStatus;
  connectionError?: string | null;
  transcriptHistory?: TranscriptEntry[];
  userName?: string;
}

// Format a duration in seconds to mm:ss
function formatDuration(startTimestamp: number, endTimestamp: number): string {
  const seconds = Math.max(0, Math.round((endTimestamp - startTimestamp) / 1000));
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
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

  // Waveform visualization — compact strip version
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bars = 48;
    const gap = 2;
    const barWidth = (canvas.width - (bars - 1) * gap) / bars;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

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
          const dataIndex = Math.floor((i / bars) * dataArray.length);
          amplitude = dataArray[dataIndex] / 255;
          if (isListening || isSpeaking) {
            amplitude = Math.max(amplitude, 0.05);
          }
        } else {
          amplitude = isListening || isSpeaking
            ? Math.random() * 0.6 + 0.2
            : 0.08;
        }

        const height = Math.max(2, amplitude * canvas.height * 0.85);
        const x = i * (barWidth + gap);
        const y = (canvas.height - height) / 2;

        const gradient = ctx.createLinearGradient(0, y, 0, y + height);
        if (isSpeaking) {
          gradient.addColorStop(0, '#A855F7');
          gradient.addColorStop(1, '#6366F1');
        } else if (isListening) {
          gradient.addColorStop(0, '#06B6D4');
          gradient.addColorStop(1, '#6366F1');
        } else {
          gradient.addColorStop(0, 'rgba(255,255,255,0.2)');
          gradient.addColorStop(1, 'rgba(255,255,255,0.08)');
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, height, 1.5);
        ctx.fill();
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

  const hasTranscript = transcriptHistory && transcriptHistory.length > 0;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0B0E14] flex flex-col overflow-hidden">
      <div className="flex flex-col w-full h-full max-w-2xl mx-auto">

        {/* ─── Header Bar ─── */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
          <button
            onClick={onEndSession}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>

          <div className="flex items-center gap-2.5">
            <span className="text-white font-semibold text-sm">Scout Voice</span>
            {geminiStatus === 'listening' || geminiStatus === 'speaking' ? (
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <div className={`px-3 py-1 rounded-full text-xs font-mono ${
              isWarning ? 'bg-yellow-500/20 text-yellow-400 animate-pulse' : 'bg-white/10 text-white/70'
            }`}>
              {timeDisplay}
            </div>
            <button
              onClick={onCapturePhoto}
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <Camera className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* ─── Main Content Area ─── */}
        {connectionError ? (
          /* Connection Error State */
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
              <AlertCircle className="w-10 h-10 text-red-400" />
            </div>
            <h2 className="text-white text-xl font-semibold mb-2">Connection Failed</h2>
            <p className="text-white/60 text-sm max-w-sm text-center mb-6">{connectionError}</p>
            <button
              onClick={onEndSession}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-semibold text-sm transition-colors"
            >
              Go Back
            </button>
          </div>
        ) : geminiStatus === 'connecting' ? (
          /* Connecting State */
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#A855F7] to-[#6366F1] flex items-center justify-center shadow-[0_0_40px_rgba(168,85,247,0.4)] mb-6">
              <Loader2 className="w-12 h-12 text-white animate-spin" />
            </div>
            <h2 className="text-white text-lg font-semibold mb-1">Connecting...</h2>
            <p className="text-white/50 text-sm">Setting up your voice session</p>
          </div>
        ) : (
          /* Active Session — Transcript View */
          <div className="flex-1 overflow-y-auto scrollbar-hidden px-4 pt-4 pb-2">
            {/* Status indicator */}
            <div className="text-center mb-4">
              <span className="text-white/40 text-xs font-medium">
                {isSpeaking ? (
                  <span className="text-[#A855F7]">Scout is speaking<span className="animate-pulse">...</span></span>
                ) : isListening ? (
                  <span className="text-[#06B6D4]">Listening<span className="animate-pulse">...</span></span>
                ) : hasTranscript ? '' : (
                  'Start speaking — Scout is ready'
                )}
              </span>
            </div>

            {/* Transcript Messages */}
            {hasTranscript ? (
              <div className="space-y-5">
                {transcriptHistory!.map((entry, i) => {
                  // Calculate rough duration for user messages
                  const nextTimestamp = transcriptHistory![i + 1]?.timestamp || Date.now();
                  const duration = entry.role === 'user'
                    ? formatDuration(entry.timestamp, Math.min(nextTimestamp, entry.timestamp + 30000))
                    : null;

                  return entry.role === 'model' ? (
                    /* AI Message — left-aligned, plain text */
                    <div key={i} className="max-w-[85%]">
                      <p className="text-white/90 text-[15px] leading-relaxed">
                        {entry.text}
                      </p>
                    </div>
                  ) : (
                    /* User Speech — right-aligned, quoted bubble */
                    <div key={i} className="flex flex-col items-end">
                      <div className="max-w-[80%] bg-white/[0.08] border border-white/[0.06] rounded-2xl rounded-tr-md px-4 py-3">
                        <p className="text-white text-[15px] leading-relaxed">
                          &ldquo;{entry.text}&rdquo;
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5 mr-1">
                        <Mic className="w-3 h-3 text-white/30" />
                        <span className="text-white/30 text-[11px] font-mono">{duration}</span>
                      </div>
                    </div>
                  );
                })}

                {/* Interim transcript (what user is currently saying) */}
                {interimTranscript && (
                  <div className="flex flex-col items-end">
                    <div className="max-w-[80%] bg-white/[0.05] border border-white/[0.04] border-dashed rounded-2xl rounded-tr-md px-4 py-3">
                      <p className="text-white/60 text-[15px] leading-relaxed italic">
                        &ldquo;{interimTranscript}<span className="animate-pulse">|</span>&rdquo;
                      </p>
                    </div>
                  </div>
                )}

                {/* Photo request banner — inline in transcript */}
                {photoRequestPending && currentPhotoPrompt && (
                  <div className="bg-[#6366F1]/15 border border-[#6366F1]/30 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Camera className="w-5 h-5 text-[#6366F1] shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium">Photo Requested</p>
                        <p className="text-white/60 text-xs truncate">{currentPhotoPrompt}</p>
                      </div>
                      <button
                        onClick={onCapturePhoto}
                        className="px-3 py-1.5 rounded-full bg-[#6366F1] text-white text-xs font-semibold hover:bg-[#5558E3] transition-colors shrink-0"
                      >
                        Capture
                      </button>
                    </div>
                  </div>
                )}

                {/* Photo strip — inline in transcript */}
                {session.photos.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {session.photos.map((photo) => (
                      <div
                        key={photo.id}
                        className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-white/10"
                      >
                        <img src={photo.base64} alt="Captured" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                <div ref={transcriptEndRef} />
              </div>
            ) : (
              /* Empty state — before first message */
              <div className="flex flex-col items-center justify-center h-full opacity-60">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#A855F7]/20 to-[#6366F1]/20 flex items-center justify-center mb-4">
                  <Mic className="w-7 h-7 text-[#A855F7]" />
                </div>
                <p className="text-white/50 text-sm text-center">
                  {transcript || `Speak naturally${userName ? `, ${userName}` : ''} — Scout will respond`}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ─── Bottom: Waveform + Controls ─── */}
        {!connectionError && geminiStatus !== 'connecting' && (
          <div className="shrink-0 border-t border-white/10 bg-[#0B0E14]">
            {/* Compact waveform strip */}
            <div className="px-6 pt-3">
              <canvas
                ref={canvasRef}
                width={400}
                height={32}
                className="w-full h-8"
              />
            </div>

            {/* Controls row */}
            <div className="flex items-center justify-center gap-6 px-6 pt-2 pb-6">
              {/* Camera */}
              <button
                onClick={onCapturePhoto}
                className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors"
              >
                <Camera className="w-5 h-5 text-white" />
              </button>

              {/* Mic indicator — center, larger */}
              <div className={`
                w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300
                ${isListening
                  ? 'bg-gradient-to-r from-[#06B6D4] to-[#6366F1] shadow-[0_0_25px_rgba(6,182,212,0.5)]'
                  : 'bg-white/10'
                }
              `}>
                {isListening ? (
                  <Mic className="w-7 h-7 text-white" />
                ) : (
                  <MicOff className="w-7 h-7 text-white/50" />
                )}
              </div>

              {/* End call */}
              <button
                onClick={onEndSession}
                className="w-12 h-12 rounded-full bg-red-500/80 flex items-center justify-center hover:bg-red-500 transition-colors"
              >
                <Phone className="w-5 h-5 text-white transform rotate-[135deg]" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
