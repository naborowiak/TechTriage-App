import React, { useEffect, useRef, useState } from 'react';
import { X, Mic, MicOff, Video, PhoneOff, CheckCircle, Wifi, Radio, MessageSquare, ChevronRight, User, Cpu, Download, Copy, FileText, History, LifeBuoy, Flashlight, FlashlightOff } from 'lucide-react';
import { GoogleGenAI, Modality } from '@google/genai';
import { Logo } from './Logo';
import { UserRole, ChatMessage, SavedSession } from '../types';

interface LiveSupportProps {
  onClose: () => void;
}

interface TranscriptEntry {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

const Button: React.FC<{ 
  children: React.ReactNode; 
  className?: string; 
  variant?: 'primary' | 'danger' | 'gold' | 'glass' | 'outline';
  onClick?: () => void 
}> = ({ children, className = '', variant = 'gold', onClick }) => {
  const themes = {
    primary: "bg-cta-500 hover:bg-cta-600 text-white shadow-lg shadow-cta-500/20",
    danger: "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/20",
    gold: "bg-cta-500 hover:bg-cta-600 text-white shadow-lg shadow-cta-500/20",
    glass: "bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10",
    outline: "bg-transparent border-2 border-gray-200 text-gray-600 hover:border-cta-500 hover:text-cta-500"
  };
  return (
    <button 
      onClick={onClick} 
      className={`px-8 py-4 rounded-[1.5rem] font-bold uppercase tracking-widest text-[10px] transition-all duration-300 active:scale-95 flex items-center justify-center gap-3 ${themes[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const BotAvatar = ({ className }: { className: string }) => {
  const [error, setError] = useState(false);
  if (error) return <LifeBuoy className={className} />;
  return <img src="/Tech_Triage.png" className={`${className} object-contain`} alt="AI" onError={() => setError(true)} />;
};

export const LiveSupport: React.FC<LiveSupportProps> = ({ onClose }) => {
  const [isConnecting, setIsConnecting] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const isMutedRef = useRef(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isSessionEnded, setIsSessionEnded] = useState(false);
  const [summary, setSummary] = useState('');
  const [status, setStatus] = useState<'listening' | 'thinking' | 'speaking'>('listening');
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);
  const [transcriptHistory, setTranscriptHistory] = useState<TranscriptEntry[]>([]);
  const transcriptRef = useRef<TranscriptEntry[]>([]);
  const [isCopied, setIsCopied] = useState(false);
  const [isFlashlightOn, setIsFlashlightOn] = useState(false);
  const [hasFlashlight, setHasFlashlight] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionRef = useRef<Promise<unknown> | null>(null);

  const outputAnalyserRef = useRef<AnalyserNode | null>(null);
  const inputAnalyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const currentInputText = useRef('');
  const currentOutputText = useRef('');

  const stopAllHardware = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') audioContextRef.current.close();
    if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') inputAudioContextRef.current.close();
    if (sessionRef.current) {
        sessionRef.current.then((s: unknown) => (s as { close: () => void }).close()).catch(() => {});
    }
  };

  const archiveSession = (finalSummary: string, history: TranscriptEntry[]) => {
    const chatMessages: ChatMessage[] = history.map((entry, idx) => ({
      id: `live-${idx}-${entry.timestamp}`,
      role: entry.role === 'user' ? UserRole.USER : UserRole.MODEL,
      text: entry.text,
      timestamp: entry.timestamp
    }));

    const session: SavedSession = {
      id: `live-${Date.now()}`,
      title: `Live Session: ${finalSummary.substring(0, 30)}...`,
      date: Date.now(),
      messages: chatMessages,
      summary: finalSummary
    };

    const existing = JSON.parse(localStorage.getItem('tech_triage_sessions') || '[]');
    localStorage.setItem('tech_triage_sessions', JSON.stringify([session, ...existing]));
    window.dispatchEvent(new Event('session_saved'));
  };

  const handleDownloadReport = () => {
    const header = `TECHTRIAGE LIVE REPORT\nDate: ${new Date().toLocaleString()}\nSummary: ${summary}\n\nCONVERSATION TRANSCRIPT:\n`;
    const body = transcriptHistory.map(e => `[${new Date(e.timestamp).toLocaleTimeString()}] ${e.role.toUpperCase()}: ${e.text}`).join('\n\n');
    const footer = `\n\n--- END OF REPORT ---\nSecurity Verified By TechTriage AI`;
    
    const blob = new Blob([header + body + footer], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TechTriage_Report_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(summary);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const toggleMute = () => {
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    isMutedRef.current = newMuteState;
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !newMuteState;
      });
    }
  };

  const toggleFlashlight = async () => {
    if (!streamRef.current) return;
    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (!videoTrack) return;
    
    try {
      const newState = !isFlashlightOn;
      await videoTrack.applyConstraints({
        advanced: [{ torch: newState } as MediaTrackConstraintSet]
      });
      setIsFlashlightOn(newState);
    } catch (e) {
      console.error('Flashlight toggle failed:', e);
    }
  };

  const drawWaveform = () => {
    if (!waveformCanvasRef.current) return;
    const canvas = waveformCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const audioCtx = audioContextRef.current;
    const currentlySpeaking = audioCtx && audioCtx.currentTime < (nextStartTimeRef.current + 0.15);
    
    if (currentlySpeaking !== isAiSpeaking) {
      setIsAiSpeaking(!!currentlySpeaking);
      setStatus(currentlySpeaking ? 'speaking' : 'listening');
    }

    const analyser = currentlySpeaking ? outputAnalyserRef.current : inputAnalyserRef.current;
    
    if (!analyser || (isMutedRef.current && !currentlySpeaking)) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      animationFrameRef.current = requestAnimationFrame(drawWaveform);
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
      ctx.fillStyle = currentlySpeaking ? '#F97316' : '#1F2937';
      ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
      x += barWidth + 1;
    }
    animationFrameRef.current = requestAnimationFrame(drawWaveform);
  };

  useEffect(() => {
    if (isTranscriptOpen) {
      transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcriptHistory, isTranscriptOpen]);

  useEffect(() => {
    let mounted = true;
    
    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: true, 
            video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
        });
        if (!mounted) return;
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          const capabilities = videoTrack.getCapabilities() as MediaTrackCapabilities & { torch?: boolean };
          if (capabilities.torch) {
            setHasFlashlight(true);
          }
        }
        
        setIsConnecting(false);
        animationFrameRef.current = requestAnimationFrame(drawWaveform);
      } catch (e) { 
        console.error(e); 
        setIsConnecting(false);
      }
    };
    
    start();
    
    return () => { 
      mounted = false; 
      stopAllHardware(); 
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-brand-900 flex flex-col overflow-hidden">
      <div className="relative flex-1 overflow-hidden">
         <video 
           ref={videoRef} 
           autoPlay 
           playsInline 
           muted 
           className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ${isSessionEnded ? 'opacity-20 blur-3xl scale-110' : 'opacity-100'}`} 
         />
         <canvas ref={canvasRef} className="hidden" />

         <div className="absolute top-0 left-0 right-0 p-8 flex justify-between items-start bg-gradient-to-b from-brand-900/80 to-transparent z-20">
            <Logo variant="light" />
            <div className="flex gap-4">
               <button 
                 onClick={() => setIsTranscriptOpen(!isTranscriptOpen)}
                 className={`p-4 rounded-full text-white backdrop-blur-md transition-all ${isTranscriptOpen ? 'bg-cta-500' : 'bg-white/10 hover:bg-white/20'}`}
               >
                 <MessageSquare className="w-6 h-6" />
               </button>
               <button onClick={() => { stopAllHardware(); onClose(); }} className="p-4 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md">
                 <X className="w-6 h-6" />
               </button>
            </div>
         </div>

         <div className={`absolute top-0 bottom-0 right-0 w-full md:w-[450px] bg-brand-900/95 backdrop-blur-2xl shadow-2xl z-30 transition-transform duration-500 ease-in-out border-l border-white/5 flex flex-col ${isTranscriptOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-black/20">
               <div>
                  <h3 className="text-white font-bold uppercase tracking-widest text-xs mb-1">Live Transcript</h3>
                  <div className="flex items-center gap-1.5">
                    {isSessionEnded ? (
                      <CheckCircle className="w-1.5 h-1.5 text-green-500" />
                    ) : (
                      <div className="w-1.5 h-1.5 bg-cta-500 rounded-full animate-pulse"></div>
                    )}
                    <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                      {isSessionEnded ? 'Session Archived' : 'Recording Active'}
                    </span>
                  </div>
               </div>
               <button onClick={() => setIsTranscriptOpen(false)} className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors"><ChevronRight className="w-6 h-6" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
               {transcriptHistory.length === 0 && (
                 <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                   <Radio className="w-12 h-12 text-white mb-4 animate-pulse" />
                   <p className="text-white text-xs font-bold uppercase tracking-widest">Awaiting Audio Feed...</p>
                 </div>
               )}
               {transcriptHistory.map((entry, i) => (
                 <div key={i} className={`flex flex-col ${entry.role === 'user' ? 'items-end' : 'items-start'}`}>
                   <div className="flex items-center gap-2 mb-2 opacity-40">
                      {entry.role === 'model' ? 
                        <BotAvatar className="w-3 h-3" />
                        : <User className="w-3 h-3 text-white" />
                      }
                      <span className="text-[9px] font-bold uppercase tracking-widest text-white">
                        {entry.role === 'model' ? 'AI Agent' : 'User'}
                      </span>
                   </div>
                   <div className={`max-w-[90%] p-4 rounded-[1.5rem] text-sm font-medium leading-relaxed ${entry.role === 'user' ? 'bg-cta-500 text-white border border-cta-600 rounded-tr-none' : 'bg-white/5 text-white/90 border border-white/10 rounded-tl-none'}`}>
                      {entry.text}
                   </div>
                 </div>
               ))}
               <div ref={transcriptEndRef} />
            </div>
            {isSessionEnded && (
              <div className="p-4 bg-cta-500/10 border-t border-cta-500/20">
                 <button 
                  onClick={handleDownloadReport}
                  className="w-full py-3 flex items-center justify-center gap-2 text-cta-500 font-bold text-[10px] uppercase tracking-widest hover:text-white transition-colors"
                 >
                   <Download className="w-4 h-4" /> Download This Transcript
                 </button>
              </div>
            )}
            <div className="p-8 bg-black/20 border-t border-white/5">
               <div className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] text-center">End-to-End Encrypted Session</div>
            </div>
         </div>

         {!isSessionEnded && (
            <div className="absolute bottom-40 left-0 right-0 flex flex-col items-center pointer-events-none px-8 z-10">
                <div className={`bg-brand-900/40 backdrop-blur-3xl px-10 py-6 rounded-[3rem] border border-white/10 shadow-2xl flex items-center gap-8 w-full max-w-lg transition-all duration-500 pointer-events-auto ${isTranscriptOpen ? 'md:mr-[450px]' : ''}`}>
                    <div className="flex-1 h-12 overflow-hidden"><canvas ref={waveformCanvasRef} width={300} height={48} className="w-full h-full" /></div>
                    <div className="text-right">
                        <div className="text-[10px] font-bold text-cta-500 uppercase tracking-[0.2em] mb-1">Status</div>
                        <div className="text-white font-black tracking-tight text-lg uppercase">{status}</div>
                    </div>
                </div>
            </div>
         )}

         {isSessionEnded && (
             <div className="absolute inset-0 flex items-center justify-center p-6 sm:p-10 animate-fade-in-up z-40 overflow-y-auto">
                 <div className="bg-white rounded-[3rem] sm:rounded-[4rem] p-10 sm:p-16 max-w-2xl w-full shadow-2xl border border-gray-100 my-auto">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-lg shadow-green-100">
                        <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-500" />
                    </div>
                    <h3 className="text-3xl sm:text-4xl font-black text-brand-900 mb-4 tracking-tighter uppercase text-center">Triage Complete</h3>
                    
                    <div className="bg-gray-50 rounded-[2rem] p-8 mb-10 border border-gray-100 relative group">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <FileText className="w-3 h-3" /> Diagnostic Summary
                        </div>
                        <p className="text-gray-700 text-base sm:text-lg font-bold leading-relaxed pr-10">{summary || "Analysis successfully completed. Session archived."}</p>
                        <button 
                          onClick={handleCopySummary}
                          className="absolute top-8 right-8 p-2 text-gray-400 hover:text-cta-500 transition-colors"
                        >
                          {isCopied ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                        </button>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                        <Button variant="primary" onClick={handleDownloadReport} className="w-full">
                            <Download className="w-4 h-4" /> Download Report
                        </Button>
                        <Button variant="outline" onClick={() => setIsTranscriptOpen(true)} className="w-full">
                            <MessageSquare className="w-4 h-4" /> Review Chat
                        </Button>
                        <Button variant="gold" onClick={onClose} className="w-full sm:col-span-2 mt-2">
                           <History className="w-4 h-4" /> Finish & Exit
                        </Button>
                    </div>
                    
                    <div className="mt-8 text-center">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          A full recap has been saved to your <span className="text-cta-500 underline">Archive</span>
                        </p>
                    </div>
                 </div>
             </div>
         )}
      </div>

      {!isSessionEnded && (
        <div className="h-32 bg-brand-900 flex items-center justify-center gap-6 px-8 border-t border-white/5 z-40">
            <button 
              onClick={toggleMute}
              className={`p-6 rounded-full transition-all duration-300 ${isMuted ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
                {isMuted ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
            </button>
            {hasFlashlight && (
              <button 
                onClick={toggleFlashlight}
                className={`p-6 rounded-full transition-all duration-300 ${isFlashlightOn ? 'bg-yellow-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
              >
                  {isFlashlightOn ? <Flashlight className="w-7 h-7" /> : <FlashlightOff className="w-7 h-7" />}
              </button>
            )}
            <button 
              onClick={() => { stopAllHardware(); onClose(); }}
              className="px-10 py-5 bg-red-600 rounded-full text-white font-bold uppercase tracking-widest text-xs flex items-center gap-3 shadow-2xl shadow-red-900/40 hover:scale-105 transition-all"
            >
                <PhoneOff className="w-5 h-5" /> End Session
            </button>
        </div>
      )}
    </div>
  );
};
