import { useEffect, useRef, useState, useCallback } from 'react';
import { Monitor, MonitorOff, Bot, Camera } from 'lucide-react';

interface ScreenShareViewerProps {
  caseId: string;
}

interface AIGuidance {
  text?: string;
  action?: { type: string; [key: string]: unknown };
  timestamp: number;
}

export function ScreenShareViewer({ caseId }: ScreenShareViewerProps) {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'waiting' | 'active' | 'ended' | 'error'>('connecting');
  const [frameCount, setFrameCount] = useState(0);
  const [aiGuidanceLog, setAiGuidanceLog] = useState<AIGuidance[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const imgRef = useRef<HTMLImageElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const guidanceEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll AI guidance log
  useEffect(() => {
    guidanceEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiGuidanceLog]);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/live?mode=agent-viewer&caseId=${encodeURIComponent(caseId)}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus('waiting');
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === 'ready') {
          setConnectionStatus('waiting');
        } else if (message.type === 'screenFrame') {
          setConnectionStatus('active');
          setFrameCount((prev) => prev + 1);
          if (imgRef.current) {
            imgRef.current.src = `data:image/jpeg;base64,${message.data}`;
          }
        } else if (message.type === 'screenShareStarted') {
          setConnectionStatus('active');
        } else if (message.type === 'screenShareEnded') {
          setConnectionStatus('ended');
        } else if (message.type === 'aiGuidance') {
          setAiGuidanceLog((prev) => [
            ...prev.slice(-49), // Keep last 50 entries
            {
              text: message.text,
              action: message.action,
              timestamp: Date.now(),
            },
          ]);
        } else if (message.type === 'error') {
          setConnectionStatus('error');
          setErrorMessage(message.message || 'Connection error');
        }
      } catch {
        // Ignore parse errors
      }
    };

    ws.onerror = () => {
      setConnectionStatus('error');
      setErrorMessage('Failed to connect to screen share viewer');
    };

    ws.onclose = (event) => {
      if (event.code === 4403) {
        setConnectionStatus('error');
        setErrorMessage('Agent access required');
      } else if (event.code === 4429) {
        setConnectionStatus('error');
        setErrorMessage('Maximum viewers reached for this case');
      } else if (connectionStatus !== 'ended') {
        setConnectionStatus('ended');
      }
    };

    return () => {
      ws.close();
    };
  }, [caseId]);

  const handleScreenshot = useCallback(() => {
    if (!imgRef.current || !imgRef.current.src) return;
    const link = document.createElement('a');
    link.download = `screenshare-${caseId}-${Date.now()}.jpg`;
    link.href = imgRef.current.src;
    link.click();
  }, [caseId]);

  return (
    <div className="border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden bg-white dark:bg-[#0B0E14]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-[#151922] border-b border-gray-200 dark:border-white/10">
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">Screen Share Viewer</span>
          <div className={`w-2 h-2 rounded-full ${
            connectionStatus === 'active' ? 'bg-emerald-400 animate-pulse' :
            connectionStatus === 'waiting' ? 'bg-yellow-400 animate-pulse' :
            connectionStatus === 'ended' ? 'bg-gray-400' :
            connectionStatus === 'error' ? 'bg-red-400' :
            'bg-yellow-400 animate-pulse'
          }`} />
          <span className="text-xs text-gray-500 dark:text-white/50">
            {connectionStatus === 'active' ? `Live (${frameCount} frames)` :
             connectionStatus === 'waiting' ? 'Waiting for user to share...' :
             connectionStatus === 'ended' ? 'Session ended' :
             connectionStatus === 'error' ? 'Error' :
             'Connecting...'}
          </span>
        </div>
        {connectionStatus === 'active' && (
          <button
            onClick={handleScreenshot}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-white/70 bg-gray-100 dark:bg-white/10 rounded-lg hover:bg-gray-200 dark:hover:bg-white/15 transition-colors"
            aria-label="Save screenshot"
          >
            <Camera className="w-3.5 h-3.5" />
            Screenshot
          </button>
        )}
      </div>

      {/* Screen view */}
      <div className="relative bg-black aspect-video">
        {connectionStatus === 'active' ? (
          <img
            ref={imgRef}
            alt="User's shared screen"
            className="w-full h-full object-contain"
          />
        ) : connectionStatus === 'waiting' ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50">
            <Monitor className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">Waiting for the user to share their screen...</p>
            <p className="text-xs mt-1 text-white/30">The user needs to click the screen share link</p>
          </div>
        ) : connectionStatus === 'ended' ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50">
            <MonitorOff className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">Screen share session has ended</p>
          </div>
        ) : connectionStatus === 'error' ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-red-400/70">
            <MonitorOff className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">{errorMessage}</p>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {/* Hidden img ref for when not yet active */}
        {connectionStatus !== 'active' && (
          <img ref={imgRef} alt="" className="hidden" />
        )}
      </div>

      {/* AI Guidance Log */}
      {aiGuidanceLog.length > 0 && (
        <div className="border-t border-gray-200 dark:border-white/10">
          <div className="px-4 py-2 bg-gray-50 dark:bg-[#151922] flex items-center gap-2">
            <Bot className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-xs font-medium text-gray-600 dark:text-white/60">AI Guidance</span>
          </div>
          <div className="max-h-48 overflow-y-auto p-3 space-y-2">
            {aiGuidanceLog.map((entry, i) => (
              <div key={i} className="flex gap-2">
                <div className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-3 h-3 text-white" />
                </div>
                <div className="text-xs text-gray-700 dark:text-white/70">
                  {entry.text && <p>{entry.text}</p>}
                  {entry.action && (
                    <p className="text-purple-500 dark:text-purple-400 mt-0.5">
                      [{entry.action.type}]
                      {entry.action.type === 'showStep' && ` Step ${(entry.action as any).stepNumber}: ${(entry.action as any).title}`}
                      {entry.action.type === 'presentChoices' && ` ${((entry.action as any).choices || []).join(', ')}`}
                    </p>
                  )}
                </div>
              </div>
            ))}
            <div ref={guidanceEndRef} />
          </div>
        </div>
      )}
    </div>
  );
}
