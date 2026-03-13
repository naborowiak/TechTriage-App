import { useEffect, useRef, useState, useCallback } from 'react';
import { Monitor, MonitorOff, Bot, Camera, Pencil, Circle, ArrowUpRight, Trash2 } from 'lucide-react';
import type { AnnotationStroke, AnnotationPoint } from '../../types';

interface ScreenShareViewerProps {
  caseId: string;
}

interface AIGuidance {
  text?: string;
  action?: { type: string; [key: string]: unknown };
  timestamp: number;
}

type AnnotationTool = 'freehand' | 'circle' | 'arrow' | null;

const COLORS = ['#EF4444', '#EAB308', '#22C55E', '#3B82F6'];

export function ScreenShareViewer({ caseId }: ScreenShareViewerProps) {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'waiting' | 'active' | 'ended' | 'error'>('connecting');
  const [frameCount, setFrameCount] = useState(0);
  const [aiGuidanceLog, setAiGuidanceLog] = useState<AIGuidance[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const imgRef = useRef<HTMLImageElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const guidanceEndRef = useRef<HTMLDivElement>(null);

  // Annotation state
  const [activeTool, setActiveTool] = useState<AnnotationTool>(null);
  const [annotationColor, setAnnotationColor] = useState(COLORS[0]);
  const [strokes, setStrokes] = useState<AnnotationStroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<AnnotationStroke | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawingRef = useRef(false);
  const strokeIdRef = useRef(0);

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

  // Send annotations to user via WebSocket
  const sendAnnotations = useCallback((updatedStrokes: AnnotationStroke[]) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'annotation', annotations: updatedStrokes }));
    }
  }, []);

  // Coordinate normalization
  const getNormalizedPoint = useCallback((e: React.PointerEvent): AnnotationPoint | null => {
    const container = containerRef.current;
    if (!container) return null;
    const rect = container.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
    };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!activeTool) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const pt = getNormalizedPoint(e);
    if (!pt) return;
    isDrawingRef.current = true;
    const id = `s${++strokeIdRef.current}`;
    setCurrentStroke({ id, tool: activeTool, points: [pt], color: annotationColor });
  }, [activeTool, annotationColor, getNormalizedPoint]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDrawingRef.current || !currentStroke) return;
    e.preventDefault();
    const pt = getNormalizedPoint(e);
    if (!pt) return;
    setCurrentStroke((prev) => {
      if (!prev) return null;
      if (prev.tool === 'freehand') {
        return { ...prev, points: [...prev.points, pt] };
      }
      // For circle and arrow, update the second point
      return { ...prev, points: [prev.points[0], pt] };
    });
  }, [currentStroke, getNormalizedPoint]);

  const handlePointerUp = useCallback(() => {
    if (!isDrawingRef.current || !currentStroke) return;
    isDrawingRef.current = false;
    if (currentStroke.points.length >= 2) {
      const updatedStrokes = [...strokes, currentStroke];
      setStrokes(updatedStrokes);
      sendAnnotations(updatedStrokes);
    }
    setCurrentStroke(null);
  }, [currentStroke, strokes, sendAnnotations]);

  const handleClearAnnotations = useCallback(() => {
    setStrokes([]);
    setCurrentStroke(null);
    sendAnnotations([]);
  }, [sendAnnotations]);

  // Render a single stroke as SVG
  const renderStroke = (stroke: AnnotationStroke) => {
    if (stroke.tool === 'circle' && stroke.points.length >= 2) {
      const cx = (stroke.points[0].x + stroke.points[1].x) / 2;
      const cy = (stroke.points[0].y + stroke.points[1].y) / 2;
      const rx = Math.abs(stroke.points[1].x - stroke.points[0].x) / 2;
      const ry = Math.abs(stroke.points[1].y - stroke.points[0].y) / 2;
      return (
        <ellipse
          key={stroke.id}
          cx={cx}
          cy={cy}
          rx={rx}
          ry={ry}
          fill="none"
          stroke={stroke.color}
          strokeWidth="0.004"
        />
      );
    }
    if (stroke.tool === 'arrow' && stroke.points.length >= 2) {
      const p0 = stroke.points[0];
      const p1 = stroke.points[stroke.points.length - 1];
      return (
        <g key={stroke.id}>
          <line
            x1={p0.x}
            y1={p0.y}
            x2={p1.x}
            y2={p1.y}
            stroke={stroke.color}
            strokeWidth="0.004"
            />
          <circle cx={p1.x} cy={p1.y} r="0.008" fill={stroke.color} />
        </g>
      );
    }
    if (stroke.tool === 'freehand' && stroke.points.length >= 2) {
      const d = stroke.points
        .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`)
        .join(' ');
      return (
        <path
          key={stroke.id}
          d={d}
          fill="none"
          stroke={stroke.color}
          strokeWidth="0.004"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    }
    return null;
  };

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
        <div className="flex items-center gap-2">
          {/* Annotation toolbar */}
          {connectionStatus === 'active' && (
            <>
              <div className="flex items-center gap-1 border-r border-gray-200 dark:border-white/10 pr-2 mr-1">
                <button
                  onClick={() => setActiveTool(activeTool === 'freehand' ? null : 'freehand')}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                    activeTool === 'freehand'
                      ? 'bg-indigo-500 text-white'
                      : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/70 hover:bg-gray-200 dark:hover:bg-white/15'
                  }`}
                  aria-label="Freehand draw"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setActiveTool(activeTool === 'circle' ? null : 'circle')}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                    activeTool === 'circle'
                      ? 'bg-indigo-500 text-white'
                      : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/70 hover:bg-gray-200 dark:hover:bg-white/15'
                  }`}
                  aria-label="Draw circle"
                >
                  <Circle className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setActiveTool(activeTool === 'arrow' ? null : 'arrow')}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                    activeTool === 'arrow'
                      ? 'bg-indigo-500 text-white'
                      : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/70 hover:bg-gray-200 dark:hover:bg-white/15'
                  }`}
                  aria-label="Draw arrow"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
              {/* Color swatches */}
              <div className="flex items-center gap-1 border-r border-gray-200 dark:border-white/10 pr-2 mr-1">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setAnnotationColor(c)}
                    className={`w-5 h-5 rounded-full transition-all ${
                      annotationColor === c ? 'ring-2 ring-offset-1 ring-white/60 scale-110' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                    aria-label={`Color ${c}`}
                  />
                ))}
              </div>
              {/* Clear + Screenshot */}
              {strokes.length > 0 && (
                <button
                  onClick={handleClearAnnotations}
                  className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-red-500 bg-red-50 dark:bg-red-500/10 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                  aria-label="Clear annotations"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear
                </button>
              )}
              <button
                onClick={handleScreenshot}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-white/70 bg-gray-100 dark:bg-white/10 rounded-lg hover:bg-gray-200 dark:hover:bg-white/15 transition-colors"
                aria-label="Save screenshot"
              >
                <Camera className="w-3.5 h-3.5" />
                Screenshot
              </button>
            </>
          )}
        </div>
      </div>

      {/* Screen view */}
      <div className="relative bg-black aspect-video">
        {connectionStatus === 'active' ? (
          <div
            ref={containerRef}
            className={`relative w-full h-full ${activeTool ? 'cursor-crosshair' : ''}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{ touchAction: activeTool ? 'none' : 'auto' }}
          >
            <img
              ref={imgRef}
              alt="User's shared screen"
              className="w-full h-full object-contain pointer-events-none"
            />
            {/* SVG annotation overlay */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 1 1"
              preserveAspectRatio="none"
            >
              {strokes.map(renderStroke)}
              {currentStroke && renderStroke(currentStroke)}
            </svg>
          </div>
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
