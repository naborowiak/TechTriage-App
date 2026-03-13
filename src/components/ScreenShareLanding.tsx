import { useEffect, useRef, useState, useCallback } from 'react';
import { Monitor, MonitorOff, Shield, AlertTriangle, Bot, User, MessageSquare, X } from 'lucide-react';
import { Logo } from './Logo';
import { useScreenShareSupport } from '../hooks/useScreenShareSupport';
import type { GuidedAction } from '../types';
import { ChoicePills, StepCard, ConfirmButtons } from './scout/GuidedActions';

interface TranscriptEntry {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

interface ScreenShareLandingProps {
  token: string;
}

export function ScreenShareLanding({ token }: ScreenShareLandingProps) {
  const { isSupported, reason, isIOS } = useScreenShareSupport();
  const [tokenState, setTokenState] = useState<'loading' | 'valid' | 'invalid' | 'expired'>('loading');
  const [caseTitle, setCaseTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSharing, setIsSharing] = useState(false);
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
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const transcriptHistoryRef = useRef<TranscriptEntry[]>([]);
  const lastSpeakingTimeRef = useRef<number>(0);
  const statusTransitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setTokenState('invalid');
      setErrorMessage('No screen share link provided.');
      return;
    }

    fetch(`/api/screen-share/${token}/validate`)
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setCaseTitle(data.caseTitle || 'Support Case');
          setTokenState('valid');
        } else if (res.status === 410) {
          const data = await res.json();
          setTokenState('expired');
          setErrorMessage(data.error || 'This screen share link has expired.');
        } else {
          setTokenState('invalid');
          setErrorMessage('This screen share link is not valid.');
        }
      })
      .catch(() => {
        setTokenState('invalid');
        setErrorMessage('Could not verify the screen share link. Please check your connection.');
      });
  }, [token]);

  const stopAllHardware = useCallback(() => {
    if (screenStreamRef.current) screenStreamRef.current.getTracks().forEach((t) => t.stop());
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }
  }, []);

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

  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      screenStreamRef.current = screenStream;
      setIsSharing(true);
      setStatus('connecting');

      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = screenStream;
      }

      // Handle user stopping via browser UI
      screenStream.getVideoTracks()[0].onended = () => {
        stopAllHardware();
        setIsSharing(false);
        setIsSessionEnded(true);
      };

      // Audio context for AI voice
      const outputAudioContext = new AudioContext();
      audioContextRef.current = outputAudioContext;

      // Connect with token-based auth
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live?mode=screenshare&token=${encodeURIComponent(token)}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

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

      let frameIntervalId: ReturnType<typeof setInterval> | null = null;

      const captureAndSendFrame = () => {
        if (!canvasRef.current || !screenVideoRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        const canvas = canvasRef.current;
        const video = screenVideoRef.current;
        if (!video.videoWidth || !video.videoHeight) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const scale = Math.min(1, 1280 / video.videoWidth);
        canvas.width = Math.round(video.videoWidth * scale);
        canvas.height = Math.round(video.videoHeight * scale);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        const base64 = dataUrl.split(',')[1];
        wsRef.current.send(JSON.stringify({ type: 'image', data: base64 }));
      };

      ws.onopen = () => {
        setStatus('sharing');
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.type === 'ready') {
            setStatus('sharing');
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
            setConnectionError(message.message || 'An error occurred.');
            stopAllHardware();
          } else if (message.type === 'guidedAction') {
            setGuidedAction(message.action);
          } else if (message.type === 'endSession') {
            setSummary(message.summary || 'Session completed');
            setIsSessionEnded(true);
            if (frameIntervalId) clearInterval(frameIntervalId);
            stopAllHardware();
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = () => {
        setConnectionError('Connection lost. Please check your internet connection.');
      };

      ws.onclose = (event) => {
        if (frameIntervalId) clearInterval(frameIntervalId);
        if (!isSessionEnded && event.code !== 1000 && event.code !== 1005) {
          if (event.code === 4403) {
            setConnectionError('This screen share link is no longer valid.');
          } else {
            setConnectionError('Connection was lost. Please try again.');
          }
        }
      };
    } catch (e: any) {
      if (e?.name === 'NotAllowedError' || e?.name === 'PermissionDeniedError') {
        setConnectionError('Screen sharing permission was denied. Please try again.');
      } else if (e?.name === 'AbortError') {
        // User cancelled — do nothing
      } else {
        setConnectionError('Could not start screen sharing. Please try again.');
      }
    }
  };

  const handleStopSharing = () => {
    stopAllHardware();
    setIsSharing(false);
    setIsSessionEnded(true);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllHardware();
      if (statusTransitionTimerRef.current) clearTimeout(statusTransitionTimerRef.current);
    };
  }, [stopAllHardware]);

  // ---- Pre-sharing landing page ----
  if (!isSharing) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0B0E14] to-[#111827] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <Logo variant="light" />
          </div>

          {tokenState === 'loading' && (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-white/10 flex items-center justify-center animate-pulse">
                <Monitor className="w-8 h-8 text-white/40" />
              </div>
              <p className="text-white/60">Verifying your link...</p>
            </div>
          )}

          {tokenState === 'invalid' && (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <p className="text-white font-medium text-lg">Invalid Link</p>
              <p className="text-white/60 text-sm">{errorMessage}</p>
            </div>
          )}

          {tokenState === 'expired' && (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-yellow-500/20 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-yellow-400" />
              </div>
              <p className="text-white font-medium text-lg">Link Expired</p>
              <p className="text-white/60 text-sm">{errorMessage}</p>
              <p className="text-white/40 text-xs mt-2">Please ask your support agent to send a new link.</p>
            </div>
          )}

          {tokenState === 'valid' && !isSupported && (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-yellow-500/20 flex items-center justify-center">
                <MonitorOff className="w-8 h-8 text-yellow-400" />
              </div>
              <p className="text-white font-medium text-lg">Screen Sharing Not Available</p>
              <p className="text-white/60 text-sm">{reason}</p>
              {isIOS && (
                <p className="text-white/40 text-xs mt-2">
                  You can still get help by using camera-based video support in the TotalAssist app.
                </p>
              )}
            </div>
          )}

          {tokenState === 'valid' && isSupported && (
            <div className="space-y-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 flex items-center justify-center">
                <Monitor className="w-10 h-10 text-emerald-400" />
              </div>

              <div>
                <p className="text-white font-medium text-lg mb-1">Share Your Screen</p>
                <p className="text-white/50 text-sm">for: {caseTitle}</p>
              </div>

              <p className="text-white/60 text-sm leading-relaxed">
                Your support agent has requested to see your screen to help troubleshoot your issue.
              </p>

              <button
                onClick={startScreenShare}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold text-lg hover:opacity-90 transition-opacity min-h-[56px]"
              >
                Share Your Screen
              </button>

              <div className="space-y-3 text-left">
                <div className="flex items-start gap-3 text-white/50 text-xs">
                  <Shield className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-400" />
                  <span>We can only see what's on your screen. We cannot control your device.</span>
                </div>
                <div className="flex items-start gap-3 text-white/50 text-xs">
                  <Shield className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-400" />
                  <span>You can stop sharing at any time by tapping "Stop Sharing".</span>
                </div>
                <div className="flex items-start gap-3 text-white/50 text-xs">
                  <Shield className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-400" />
                  <span>No screenshots are saved to our servers.</span>
                </div>
              </div>

              {connectionError && (
                <p className="text-red-400 text-sm" role="alert">{connectionError}</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---- Active screen sharing view ----
  return (
    <div className="fixed inset-0 z-[9999] bg-[#0B0E14] flex flex-col overflow-hidden">
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

        {/* Sharing indicator */}
        {!isSessionEnded && !connectionError && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-400 animate-pulse z-30" />
        )}

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 flex items-center justify-center">
              <Monitor className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-semibold text-sm">Screen Share</h1>
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${
                  status === 'connecting' ? 'bg-yellow-400' :
                  status === 'speaking' ? 'bg-purple-400' :
                  'bg-emerald-400'
                } animate-pulse`} />
                <span className="text-white/60 text-xs">
                  {status === 'connecting' ? 'Connecting...' :
                   status === 'speaking' ? 'AI Speaking' :
                   'Sharing'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsTranscriptOpen(!isTranscriptOpen)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              isTranscriptOpen ? 'bg-gradient-to-r from-[#6366F1] to-[#06B6D4]' : 'bg-white/10 hover:bg-white/20'
            }`}
            aria-label="Toggle transcript"
          >
            <MessageSquare className="w-5 h-5 text-white" />
          </button>
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
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"
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
                    entry.role === 'user' ? 'bg-[#6366F1] text-white' : 'bg-white/10 text-white/90'
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

        {/* Error overlay */}
        {connectionError && (
          <div className="absolute inset-0 flex items-center justify-center z-10 p-6">
            <div className="text-center max-w-sm">
              <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                <MonitorOff className="w-8 h-8 text-red-400" />
              </div>
              <p className="text-white font-medium mb-2">Connection Error</p>
              <p className="text-white/60 text-sm" role="alert">{connectionError}</p>
            </div>
          </div>
        )}

        {/* Session ended */}
        {isSessionEnded && (
          <div className="absolute inset-0 flex items-center justify-center z-10 p-6">
            <div className="text-center max-w-sm">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                <Monitor className="w-8 h-8 text-emerald-400" />
              </div>
              <p className="text-white font-medium text-lg mb-2">Session Complete</p>
              {summary && <p className="text-white/60 text-sm mb-4">{summary}</p>}
              <p className="text-white/40 text-xs">You can close this tab now.</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      {!isSessionEnded && !connectionError && (
        <div className="p-4 flex flex-col items-center gap-3 bg-gradient-to-t from-black/80 to-transparent">
          {/* Guided actions */}
          {guidedAction && (
            <div className="w-full max-w-sm">
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

          <button
            onClick={handleStopSharing}
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
