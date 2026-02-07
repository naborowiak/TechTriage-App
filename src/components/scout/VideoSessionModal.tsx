import { useEffect, useRef, useState, useCallback } from 'react';
import { X, Mic, MicOff, Phone, MessageSquare, ChevronRight, Bot, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface TranscriptEntry {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

interface VideoSessionModalProps {
  onClose: () => void;
  caseId?: string;
}

export function VideoSessionModal({ onClose, caseId }: VideoSessionModalProps) {
  const { user } = useAuth();

  const [isMuted, setIsMuted] = useState(false);
  const [status, setStatus] = useState<'connecting' | 'listening' | 'speaking'>('connecting');
  const [transcriptHistory, setTranscriptHistory] = useState<TranscriptEntry[]>([]);
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);
  const [isSessionEnded, setIsSessionEnded] = useState(false);
  const [summary, setSummary] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const isMutedRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  const outputAnalyserRef = useRef<AnalyserNode | null>(null);
  const inputAnalyserRef = useRef<AnalyserNode | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const TARGET_SAMPLE_RATE = 16000;

  const stopAllHardware = useCallback(() => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
      inputAudioContextRef.current.close();
    }
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }
  }, []);

  const handleEndSession = useCallback(() => {
    stopAllHardware();
    onClose();
  }, [stopAllHardware, onClose]);

  const toggleMute = useCallback(() => {
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    isMutedRef.current = newMuteState;
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !newMuteState;
      });
    }
  }, [isMuted]);

  // Auto-scroll transcript
  useEffect(() => {
    if (isTranscriptOpen) {
      transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcriptHistory, isTranscriptOpen]);

  // Debounce ref for status transitions
  const lastSpeakingTimeRef = useRef<number>(0);
  const statusTransitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusRef = useRef(status);
  statusRef.current = status;

  // Track whether the component is still mounted for animation frame safety
  const mountedRef = useRef(true);

  // Waveform drawing (ref-based to avoid stale closures)
  const drawWaveformRef = useRef<(() => void) | undefined>(undefined);
  useEffect(() => {
    drawWaveformRef.current = () => {
      if (!mountedRef.current || !waveformCanvasRef.current) return;
      const canvas = waveformCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const audioCtx = audioContextRef.current;
      const currentlySpeaking = audioCtx && audioCtx.state !== 'closed' && audioCtx.currentTime < nextStartTimeRef.current + 0.15;

      const analyser = currentlySpeaking ? outputAnalyserRef.current : inputAnalyserRef.current;

      if (!analyser || (isMutedRef.current && !currentlySpeaking)) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (mountedRef.current) {
          animationFrameRef.current = requestAnimationFrame(() => drawWaveformRef.current?.());
        }
        return;
      }

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
        if (currentlySpeaking) {
          gradient.addColorStop(0, '#A855F7');
          gradient.addColorStop(1, '#6366F1');
        } else {
          gradient.addColorStop(0, '#06B6D4');
          gradient.addColorStop(1, '#6366F1');
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
        x += barWidth + 1;
      }
      if (mountedRef.current) {
        animationFrameRef.current = requestAnimationFrame(() => drawWaveformRef.current?.());
      }
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    let scriptProcessor: ScriptProcessorNode | null = null;
    let videoIntervalId: ReturnType<typeof setInterval> | null = null;

    const downsampleBuffer = (buffer: Float32Array, inputSampleRate: number, outputSampleRate: number): Float32Array => {
      if (inputSampleRate === outputSampleRate) return buffer;
      const ratio = inputSampleRate / outputSampleRate;
      const newLength = Math.round(buffer.length / ratio);
      const result = new Float32Array(newLength);
      for (let i = 0; i < newLength; i++) {
        const srcIndex = i * ratio;
        const srcIndexFloor = Math.floor(srcIndex);
        const srcIndexCeil = Math.min(srcIndexFloor + 1, buffer.length - 1);
        const lerp = srcIndex - srcIndexFloor;
        result[i] = buffer[srcIndexFloor] * (1 - lerp) + buffer[srcIndexCeil] * lerp;
      }
      return result;
    };

    const floatTo16BitPCM = (float32Array: Float32Array): ArrayBuffer => {
      const buffer = new ArrayBuffer(float32Array.length * 2);
      const view = new DataView(buffer);
      for (let i = 0; i < float32Array.length; i++) {
        const s = Math.max(-1, Math.min(1, float32Array[i]));
        view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      }
      return buffer;
    };

    const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    };

    const playAudio = (base64Audio: string) => {
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') return;
      try {
        const binaryString = atob(base64Audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const pcmData = new Int16Array(bytes.buffer);
        const float32Data = new Float32Array(pcmData.length);
        for (let i = 0; i < pcmData.length; i++) {
          float32Data[i] = pcmData[i] / 32768;
        }
        const audioBuffer = audioContextRef.current.createBuffer(1, float32Data.length, 24000);
        audioBuffer.getChannelData(0).set(float32Data);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        if (outputAnalyserRef.current) {
          source.connect(outputAnalyserRef.current);
          outputAnalyserRef.current.connect(audioContextRef.current.destination);
        } else {
          source.connect(audioContextRef.current.destination);
        }
        const startTime = Math.max(audioContextRef.current.currentTime, nextStartTimeRef.current);
        source.start(startTime);
        nextStartTimeRef.current = startTime + audioBuffer.duration;
      } catch (err) {
        console.error('Error playing audio:', err);
      }
    };

    const captureAndSendFrame = () => {
      if (!canvasRef.current || !videoRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = 640;
      canvas.height = 480;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
      const base64 = dataUrl.split(',')[1];
      wsRef.current.send(JSON.stringify({ type: 'image', data: base64 }));
    };

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        if (!mounted) return;

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        const inputAudioContext = new AudioContext();
        inputAudioContextRef.current = inputAudioContext;
        const nativeSampleRate = inputAudioContext.sampleRate;

        const outputAudioContext = new AudioContext();
        audioContextRef.current = outputAudioContext;

        const inputAnalyser = inputAudioContext.createAnalyser();
        inputAnalyser.fftSize = 256;
        inputAnalyserRef.current = inputAnalyser;

        const outputAnalyser = outputAudioContext.createAnalyser();
        outputAnalyser.fftSize = 256;
        outputAnalyserRef.current = outputAnalyser;

        const source = inputAudioContext.createMediaStreamSource(stream);
        source.connect(inputAnalyser);

        scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
        inputAnalyser.connect(scriptProcessor);
        scriptProcessor.connect(inputAudioContext.destination);

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const baseWsUrl = `${protocol}//${window.location.host}/live`;
        const params = new URLSearchParams();
        if (user?.id) params.append('userId', user.id);
        const wsUrl = `${baseWsUrl}?${params.toString()}`;

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('WebSocket connected');
          setStatus('listening');
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);

            if (message.type === 'ready') {
              setStatus('listening');
              videoIntervalId = setInterval(captureAndSendFrame, 2000);
            } else if (message.type === 'audio') {
              // Set speaking immediately, track timing for debounce
              if (statusTransitionTimerRef.current) {
                clearTimeout(statusTransitionTimerRef.current);
                statusTransitionTimerRef.current = null;
              }
              setStatus('speaking');
              lastSpeakingTimeRef.current = Date.now();
              playAudio(message.data);
            } else if (message.type === 'aiTranscript') {
              setTranscriptHistory((prev) => [
                ...prev,
                { role: 'model', text: message.data, timestamp: Date.now() },
              ]);
            } else if (message.type === 'userTranscript') {
              setTranscriptHistory((prev) => [
                ...prev,
                { role: 'user', text: message.data, timestamp: Date.now() },
              ]);
            } else if (message.type === 'turnComplete') {
              // Debounce transition to listening to prevent flicker
              const timeSinceSpeaking = Date.now() - lastSpeakingTimeRef.current;
              const delay = Math.max(0, 300 - timeSinceSpeaking);
              if (statusTransitionTimerRef.current) {
                clearTimeout(statusTransitionTimerRef.current);
              }
              statusTransitionTimerRef.current = setTimeout(() => {
                setStatus('listening');
                statusTransitionTimerRef.current = null;
              }, delay);
            } else if (message.type === 'endSession') {
              const finalSummary = message.summary || 'Session completed';
              setSummary(finalSummary);
              setIsSessionEnded(true);
              stopAllHardware();

              // Save transcript to case if we have a caseId
              if (caseId) {
                const transcriptText = transcriptHistory
                  .map(t => `${t.role === 'user' ? 'User' : 'Scout'}: ${t.text}`)
                  .join('\n');
                fetch(`/api/cases/${caseId}/recordings`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({
                    sessionType: 'live_video',
                    transcript: transcriptText,
                  }),
                }).catch(() => {});
                // Update case status
                fetch(`/api/cases/${caseId}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({
                    status: 'resolved',
                    aiSummary: finalSummary,
                  }),
                }).catch(() => {});
              }
            }
          } catch (err) {
            console.error('Error parsing WebSocket message:', err);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };

        scriptProcessor.onaudioprocess = (e) => {
          if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
          if (isMutedRef.current) return;

          const inputData = e.inputBuffer.getChannelData(0);
          const downsampled = downsampleBuffer(inputData, nativeSampleRate, TARGET_SAMPLE_RATE);
          const pcmBuffer = floatTo16BitPCM(downsampled);
          const base64 = arrayBufferToBase64(pcmBuffer);
          wsRef.current.send(JSON.stringify({ type: 'audio', data: base64 }));
        };

        animationFrameRef.current = requestAnimationFrame(() => drawWaveformRef.current?.());
      } catch (e) {
        console.error('Error starting video session:', e);
      }
    };

    start();

    return () => {
      mounted = false;
      mountedRef.current = false;
      if (videoIntervalId) clearInterval(videoIntervalId);
      if (scriptProcessor) {
        scriptProcessor.disconnect();
        scriptProcessor.onaudioprocess = null;
      }
      if (statusTransitionTimerRef.current) {
        clearTimeout(statusTransitionTimerRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      nextStartTimeRef.current = 0;
      stopAllHardware();
    };
  }, [user?.id, stopAllHardware]);

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0B0E14] flex flex-col overflow-hidden">
      {/* Video background */}
      <div className="relative flex-1 overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ${
            isSessionEnded ? 'opacity-20 blur-3xl scale-110' : 'opacity-100'
          }`}
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#A855F7] to-[#6366F1] flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.4)]">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-semibold">Scout Video</h1>
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${status === 'connecting' ? 'bg-yellow-400' : 'bg-emerald-400'} animate-pulse`} />
                <span className="text-white/60 text-xs capitalize">{status}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setIsTranscriptOpen(!isTranscriptOpen)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isTranscriptOpen
                  ? 'bg-gradient-to-r from-[#6366F1] to-[#06B6D4]'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              <MessageSquare className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={handleEndSession}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Transcript sidebar */}
        <div
          className={`absolute top-0 bottom-0 right-0 w-full md:w-96 bg-[#0B0E14]/95 backdrop-blur-xl z-30 transition-transform duration-500 ease-out border-l border-white/10 flex flex-col ${
            isTranscriptOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="p-4 border-b border-white/10 flex justify-between items-center">
            <h3 className="text-white font-semibold">Transcript</h3>
            <button
              onClick={() => setIsTranscriptOpen(false)}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {transcriptHistory.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                  <MessageSquare className="w-6 h-6 text-white/40" />
                </div>
                <p className="text-white/40 text-sm">Waiting for conversation...</p>
              </div>
            )}
            {transcriptHistory.map((entry, i) => (
              <div
                key={i}
                className={`flex flex-col ${entry.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-2 mb-1 opacity-60">
                  {entry.role === 'model' ? (
                    <Bot className="w-3 h-3 text-[#A855F7]" />
                  ) : (
                    <User className="w-3 h-3 text-white" />
                  )}
                  <span className="text-xs text-white/70">
                    {entry.role === 'model' ? 'Scout' : (user?.firstName || user?.username || 'You')}
                  </span>
                </div>
                <div
                  className={`max-w-[90%] px-4 py-2.5 rounded-2xl text-sm ${
                    entry.role === 'user'
                      ? 'bg-gradient-to-r from-[#6366F1] to-[#06B6D4] text-white rounded-tr-sm'
                      : 'bg-white/5 border border-white/10 text-white/90 rounded-tl-sm'
                  }`}
                >
                  {entry.text}
                </div>
              </div>
            ))}
            <div ref={transcriptEndRef} />
          </div>
        </div>

        {/* Waveform + status overlay */}
        {!isSessionEnded && (
          <div className="absolute bottom-32 left-0 right-0 flex justify-center px-4 z-10">
            <div className={`bg-white/5 backdrop-blur-xl px-6 py-4 rounded-2xl border border-white/10 flex items-center gap-6 transition-all ${
              isTranscriptOpen ? 'md:mr-96' : ''
            }`}>
              <canvas
                ref={waveformCanvasRef}
                width={200}
                height={40}
                className="h-10"
              />
              <div className="text-right">
                <div className="text-xs text-white/60 uppercase tracking-wider mb-0.5">Status</div>
                <div className="text-white font-semibold capitalize">{status}</div>
              </div>
            </div>
          </div>
        )}

        {/* Session ended summary */}
        {isSessionEnded && (
          <div className="absolute inset-0 flex items-center justify-center p-6 z-40">
            <div className="bg-[#151922] rounded-3xl p-8 max-w-md w-full border border-white/10">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                <Bot className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-white text-2xl font-bold text-center mb-2">Session Complete</h3>
              <p className="text-white/70 text-center mb-6">{summary}</p>
              <button
                onClick={onClose}
                className="w-full py-3 rounded-full bg-gradient-to-r from-[#6366F1] to-[#06B6D4] text-white font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      {!isSessionEnded && (
        <div className="h-24 bg-[#0B0E14] flex items-center justify-center gap-6 px-6 border-t border-white/10">
          <button
            onClick={toggleMute}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              isMuted
                ? 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            {isMuted ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
          </button>

          <button
            onClick={handleEndSession}
            className="px-8 py-4 bg-red-500 rounded-full text-white font-semibold flex items-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:bg-red-600 transition-colors"
          >
            <Phone className="w-5 h-5 transform rotate-[135deg]" />
            End Session
          </button>
        </div>
      )}
    </div>
  );
}
