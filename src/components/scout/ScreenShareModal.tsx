import { useEffect, useRef, useState, useCallback } from 'react';
import { X, Monitor, MonitorOff, MessageSquare, Bot, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import type { GuidedAction } from '../../types';
import { ChoicePills, StepCard, ConfirmButtons } from './GuidedActions';

interface TranscriptEntry {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

interface ScreenShareModalProps {
  onClose: () => void;
  caseId?: string;
  onCaseCreated?: (caseId: string) => void;
}

export function ScreenShareModal({ onClose, caseId, onCaseCreated }: ScreenShareModalProps) {
  const { user } = useAuth();
  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(modalRef, { onClose });

  const [status, setStatus] = useState<'connecting' | 'sharing' | 'speaking'>('connecting');
  const [transcriptHistory, setTranscriptHistory] = useState<TranscriptEntry[]>([]);
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);
  const [isSessionEnded, setIsSessionEnded] = useState(false);
  const [summary, setSummary] = useState('');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [guidedAction, setGuidedAction] = useState<GuidedAction | null>(null);

  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const transcriptHistoryRef = useRef<TranscriptEntry[]>([]);

  const stopAllHardware = useCallback(() => {
    if (screenStreamRef.current) screenStreamRef.current.getTracks().forEach((t) => t.stop());
    if (micStreamRef.current) micStreamRef.current.getTracks().forEach((t) => t.stop());
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }
  }, []);

  // Lazily create a case for this screen share session
  const resolvedCaseIdRef = useRef<string | null>(caseId || null);
  const ensureScreenShareCase = useCallback(async (): Promise<string | null> => {
    if (resolvedCaseIdRef.current) return resolvedCaseIdRef.current;
    try {
      const title = `${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - Screen Share Session`;
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title, sessionMode: 'screenshare' }),
      });
      if (!res.ok) return null;
      const newCase = await res.json();
      resolvedCaseIdRef.current = newCase.id;
      onCaseCreated?.(newCase.id);
      return newCase.id;
    } catch {
      return null;
    }
  }, [onCaseCreated]);

  const saveAndResolveCase = useCallback(async (finalSummary: string) => {
    const activeCaseId = await ensureScreenShareCase();
    if (!activeCaseId) return;

    const currentTranscript = transcriptHistoryRef.current;
    if (currentTranscript.length > 0) {
      const msgData = currentTranscript.map(t => ({
        role: t.role === 'user' ? 'user' : 'model',
        text: t.text,
        timestamp: t.timestamp,
      }));
      fetch(`/api/cases/${activeCaseId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ messages: msgData }),
      }).catch(() => {});
    }

    const transcriptText = currentTranscript
      .map(t => `${t.role === 'user' ? 'User' : 'Support'}: ${t.text}`)
      .join('\n');
    if (transcriptText) {
      fetch(`/api/cases/${activeCaseId}/recordings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          sessionType: 'live_screenshare',
          transcript: transcriptText,
        }),
      }).catch(() => {});
    }

    fetch(`/api/cases/${activeCaseId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        status: 'resolved',
        aiSummary: finalSummary,
      }),
    }).catch(() => {});
  }, [ensureScreenShareCase]);

  const handleEndSession = useCallback(() => {
    stopAllHardware();
    const currentTranscript = transcriptHistoryRef.current;
    if (currentTranscript.length > 0 && !isSessionEnded) {
      saveAndResolveCase('Screen share support session completed.').finally(() => onClose());
    } else {
      onClose();
    }
  }, [stopAllHardware, onClose, saveAndResolveCase, isSessionEnded]);

  const sendText = useCallback((text: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'text', data: text }));
      setGuidedAction(null);
    }
  }, []);

  // Auto-scroll transcript
  useEffect(() => {
    if (isTranscriptOpen) {
      transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcriptHistory, isTranscriptOpen]);

  // Track speaking state for UI
  const lastSpeakingTimeRef = useRef<number>(0);
  const statusTransitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let mounted = true;
    let frameIntervalId: ReturnType<typeof setInterval> | null = null;

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
        source.connect(audioContextRef.current.destination);
        const startTime = Math.max(audioContextRef.current.currentTime, nextStartTimeRef.current);
        source.start(startTime);
        nextStartTimeRef.current = startTime + audioBuffer.duration;
      } catch (err) {
        console.error('Error playing audio:', err);
      }
    };

    const captureAndSendFrame = () => {
      if (!canvasRef.current || !screenVideoRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
      const canvas = canvasRef.current;
      const video = screenVideoRef.current;
      if (!video.videoWidth || !video.videoHeight) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      // Scale down to max 1280px wide while keeping aspect ratio
      const scale = Math.min(1, 1280 / video.videoWidth);
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
      const base64 = dataUrl.split(',')[1];
      wsRef.current.send(JSON.stringify({ type: 'image', data: base64 }));
    };

    const start = async () => {
      try {
        // Request screen share
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
        if (!mounted) { screenStream.getTracks().forEach(t => t.stop()); return; }

        screenStreamRef.current = screenStream;
        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = screenStream;
        }

        // Handle user stopping screen share via browser UI
        screenStream.getVideoTracks()[0].onended = () => {
          if (mounted) {
            handleEndSession();
          }
        };

        // Set up audio output context for AI voice responses
        const outputAudioContext = new AudioContext();
        audioContextRef.current = outputAudioContext;

        // Connect WebSocket
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/live?mode=screenshare`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setStatus('sharing');
          if (resolvedCaseIdRef.current) {
            ws.send(JSON.stringify({ type: 'setCaseId', caseId: resolvedCaseIdRef.current }));
          }
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);

            if (message.type === 'ready') {
              setStatus('sharing');
              // Capture frames every 1.5 seconds for screen content
              frameIntervalId = setInterval(captureAndSendFrame, 1500);
            } else if (message.type === 'audio') {
              if (statusTransitionTimerRef.current) {
                clearTimeout(statusTransitionTimerRef.current);
                statusTransitionTimerRef.current = null;
              }
              setStatus('speaking');
              lastSpeakingTimeRef.current = Date.now();
              playAudio(message.data);
            } else if (message.type === 'aiTranscript') {
              setTranscriptHistory((prev) => {
                const next = [...prev, { role: 'model' as const, text: message.data, timestamp: Date.now() }];
                transcriptHistoryRef.current = next;
                return next;
              });
            } else if (message.type === 'userTranscript') {
              setTranscriptHistory((prev) => {
                const next = [...prev, { role: 'user' as const, text: message.data, timestamp: Date.now() }];
                transcriptHistoryRef.current = next;
                return next;
              });
            } else if (message.type === 'turnComplete') {
              const timeSinceSpeaking = Date.now() - lastSpeakingTimeRef.current;
              const delay = Math.max(0, 300 - timeSinceSpeaking);
              if (statusTransitionTimerRef.current) clearTimeout(statusTransitionTimerRef.current);
              statusTransitionTimerRef.current = setTimeout(() => {
                setStatus('sharing');
                statusTransitionTimerRef.current = null;
              }, delay);
            } else if (message.type === 'error') {
              setConnectionError(message.message || 'An error occurred during the screen share session.');
              stopAllHardware();
            } else if (message.type === 'guidedAction') {
              setGuidedAction(message.action);
            } else if (message.type === 'endSession') {
              const finalSummary = message.summary || 'Session completed';
              setSummary(finalSummary);
              setIsSessionEnded(true);
              stopAllHardware();
              saveAndResolveCase(finalSummary);
            }
          } catch (err) {
            console.error('Error parsing WebSocket message:', err);
          }
        };

        ws.onerror = () => {
          setConnectionError('Connection lost. Please check your internet connection and try again.');
        };

        ws.onclose = (event) => {
          if (!mounted) return;
          if (!isSessionEnded && event.code !== 1000 && event.code !== 1005) {
            setConnectionError('Connection to support was lost. Please try again.');
          }
        };
      } catch (e: any) {
        console.error('Error starting screen share:', e);
        if (e?.name === 'NotAllowedError' || e?.name === 'PermissionDeniedError') {
          setConnectionError('Screen sharing permission was denied. Please try again and select a screen to share.');
        } else if (e?.name === 'AbortError') {
          // User cancelled the screen share picker
          onClose();
        } else if (e?.name === 'NotSupportedError') {
          setConnectionError('Screen sharing is not supported in this browser. Please try Chrome, Firefox, or Edge.');
        } else {
          setConnectionError('Could not start screen sharing. Please try again.');
        }
      }
    };

    start();

    return () => {
      mounted = false;
      if (frameIntervalId) clearInterval(frameIntervalId);
      if (statusTransitionTimerRef.current) clearTimeout(statusTransitionTimerRef.current);
      nextStartTimeRef.current = 0;
      stopAllHardware();
    };
  }, [user?.id, stopAllHardware]);

  // Handle guided action responses
  const handleGuidedAction = useCallback((action: GuidedAction) => {
    if (action.type === 'presentChoices' && action.selectedChoice) {
      sendText(action.selectedChoice);
      setTranscriptHistory((prev) => {
        const next = [...prev, { role: 'user' as const, text: action.selectedChoice!, timestamp: Date.now() }];
        transcriptHistoryRef.current = next;
        return next;
      });
    } else if (action.type === 'confirmResult' && action.selectedAnswer) {
      sendText(action.selectedAnswer === 'yes' ? (action.yesLabel || 'Yes') : (action.noLabel || 'No'));
      setTranscriptHistory((prev) => {
        const next = [...prev, { role: 'user' as const, text: action.selectedAnswer === 'yes' ? (action.yesLabel || 'Yes') : (action.noLabel || 'No'), timestamp: Date.now() }];
        transcriptHistoryRef.current = next;
        return next;
      });
    }
  }, [sendText]);

  return (
    <div ref={modalRef} className="fixed inset-0 z-[9999] bg-[#0B0E14] flex flex-col overflow-hidden pt-safe">
      {/* Screen share preview */}
      <div className="relative flex-1 overflow-hidden">
        <video
          ref={screenVideoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-contain bg-black transition-all duration-1000 ${
            isSessionEnded ? 'opacity-20 blur-3xl scale-110' : 'opacity-100'
          }`}
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Sharing indicator bar */}
        {status !== 'connecting' && !isSessionEnded && !connectionError && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-400 animate-pulse z-30" />
        )}

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-4 pt-safe flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)]">
              <Monitor className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-semibold">Screen Share</h1>
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${
                  status === 'connecting' ? 'bg-yellow-400' :
                  status === 'speaking' ? 'bg-purple-400' :
                  'bg-emerald-400'
                } animate-pulse`} />
                <span className="text-white/60 text-xs">
                  {status === 'connecting' ? 'Connecting...' :
                   status === 'speaking' ? 'AI Speaking' :
                   'Sharing your screen'}
                </span>
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
              aria-label="Toggle transcript"
            >
              <MessageSquare className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={handleEndSession}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              aria-label="End screen share"
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
              aria-label="Close transcript"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {transcriptHistory.length === 0 ? (
              <p className="text-white/40 text-sm text-center py-8">Conversation will appear here...</p>
            ) : (
              transcriptHistory.map((entry, i) => (
                <div key={i} className={`flex gap-2 ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {entry.role === 'model' && (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#A855F7] to-[#6366F1] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    entry.role === 'user'
                      ? 'bg-[#6366F1] text-white'
                      : 'bg-white/10 text-white/90'
                  }`}>
                    {entry.text}
                  </div>
                  {entry.role === 'user' && (
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={transcriptEndRef} />
          </div>
        </div>

        {/* Connecting overlay */}
        {status === 'connecting' && !connectionError && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 flex items-center justify-center mb-4 animate-pulse">
                <Monitor className="w-8 h-8 text-white" />
              </div>
              <p className="text-white font-medium">Starting screen share...</p>
              <p className="text-white/50 text-sm mt-1">Select the screen you'd like to share</p>
            </div>
          </div>
        )}

        {/* Error overlay */}
        {connectionError && (
          <div className="absolute inset-0 flex items-center justify-center z-10 p-6">
            <div className="text-center max-w-sm">
              <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                <MonitorOff className="w-8 h-8 text-red-400" />
              </div>
              <p className="text-white font-medium mb-2">Screen Share Error</p>
              <p className="text-white/60 text-sm mb-6" role="alert">{connectionError}</p>
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors min-h-[44px]"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Session ended overlay */}
        {isSessionEnded && (
          <div className="absolute inset-0 flex items-center justify-center z-10 p-6">
            <div className="text-center max-w-sm">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                <Monitor className="w-8 h-8 text-emerald-400" />
              </div>
              <p className="text-white font-medium text-lg mb-2">Session Complete</p>
              {summary && <p className="text-white/60 text-sm mb-6">{summary}</p>}
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-medium hover:opacity-90 transition-opacity min-h-[44px]"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      {!isSessionEnded && !connectionError && (
        <div className="p-4 pb-safe-4 flex items-center justify-center gap-4 bg-gradient-to-t from-black/80 to-transparent">
          {/* Guided action display */}
          {guidedAction && (
            <div className="absolute bottom-20 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-20">
              {guidedAction.type === 'presentChoices' && (
                <ChoicePills
                  action={guidedAction}
                  messageId="live"
                  onSelect={(_msgId, updatedAction, _text) => {
                    setGuidedAction(updatedAction);
                    handleGuidedAction(updatedAction);
                  }}
                  disabled={false}
                  variant="compact"
                />
              )}
              {guidedAction.type === 'showStep' && (
                <StepCard
                  action={guidedAction}
                  variant="compact"
                />
              )}
              {guidedAction.type === 'confirmResult' && (
                <ConfirmButtons
                  action={guidedAction}
                  messageId="live"
                  onSelect={(_msgId, updatedAction, _text) => {
                    setGuidedAction(updatedAction);
                    handleGuidedAction(updatedAction);
                  }}
                  disabled={false}
                  variant="compact"
                />
              )}
            </div>
          )}

          {/* Stop sharing button */}
          <button
            onClick={handleEndSession}
            className="px-6 py-3 rounded-full bg-red-500/80 hover:bg-red-500 text-white font-medium transition-colors flex items-center gap-2 min-h-[44px]"
            aria-label="Stop sharing"
          >
            <MonitorOff className="w-4 h-4" />
            Stop Sharing
          </button>
        </div>
      )}
    </div>
  );
}
