import { useState, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';

interface TranscriptEntry {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export type GeminiVoiceStatus = 'idle' | 'connecting' | 'listening' | 'speaking';

export interface UseGeminiVoiceReturn {
  status: GeminiVoiceStatus;
  isConnected: boolean;
  connectionError: string | null;
  transcriptHistory: TranscriptEntry[];
  connect: () => void;
  disconnect: () => void;
  toggleMute: () => void;
  isMuted: boolean;
  outputAnalyser: AnalyserNode | null;
  inputAnalyser: AnalyserNode | null;
}

const TARGET_SAMPLE_RATE = 16000;

export function useGeminiVoice(): UseGeminiVoiceReturn {
  const { user } = useAuth();
  const [status, setStatus] = useState<GeminiVoiceStatus>('idle');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [transcriptHistory, setTranscriptHistory] = useState<TranscriptEntry[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [outputAnalyser, setOutputAnalyser] = useState<AnalyserNode | null>(null);
  const [inputAnalyser, setInputAnalyser] = useState<AnalyserNode | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const isMutedRef = useRef(false);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const outputAnalyserRef = useRef<AnalyserNode | null>(null);
  const inputAnalyserRef = useRef<AnalyserNode | null>(null);
  const lastSpeakingTimeRef = useRef<number>(0);
  const statusTransitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const newTurnRef = useRef<boolean>(true); // Track turn boundaries for transcript accumulation

  const stopAllHardware = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current.onaudioprocess = null;
      scriptProcessorRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }
    wsRef.current = null;
    if (statusTransitionTimerRef.current) {
      clearTimeout(statusTransitionTimerRef.current);
      statusTransitionTimerRef.current = null;
    }
    setOutputAnalyser(null);
    setInputAnalyser(null);
    outputAnalyserRef.current = null;
    inputAnalyserRef.current = null;
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current) return;

    setStatus('connecting');
    setConnectionError(null);
    setTranscriptHistory([]);
    setIsMuted(false);
    isMutedRef.current = false;

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

    const startSession = async () => {
      try {
        // Get mic stream (audio only, no video)
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        // Set up audio contexts
        const inputAudioContext = new AudioContext();
        inputAudioContextRef.current = inputAudioContext;
        const nativeSampleRate = inputAudioContext.sampleRate;

        const outputAudioContext = new AudioContext();
        audioContextRef.current = outputAudioContext;

        // Set up analyser nodes
        const inAnalyser = inputAudioContext.createAnalyser();
        inAnalyser.fftSize = 256;
        inputAnalyserRef.current = inAnalyser;
        setInputAnalyser(inAnalyser);

        const outAnalyser = outputAudioContext.createAnalyser();
        outAnalyser.fftSize = 256;
        outputAnalyserRef.current = outAnalyser;
        setOutputAnalyser(outAnalyser);

        // Connect mic to analyser
        const source = inputAudioContext.createMediaStreamSource(stream);
        source.connect(inAnalyser);

        const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
        inAnalyser.connect(scriptProcessor);
        scriptProcessor.connect(inputAudioContext.destination);
        scriptProcessorRef.current = scriptProcessor;

        // Connect WebSocket with voice mode
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const baseWsUrl = `${protocol}//${window.location.host}/live`;
        const params = new URLSearchParams();
        if (user?.id) params.append('userId', user.id);
        params.append('mode', 'voice');
        const wsUrl = `${baseWsUrl}?${params.toString()}`;

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('Voice WebSocket connected');
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);

            if (message.type === 'ready') {
              setStatus('listening');
              setIsConnected(true);
            } else if (message.type === 'audio') {
              if (statusTransitionTimerRef.current) {
                clearTimeout(statusTransitionTimerRef.current);
                statusTransitionTimerRef.current = null;
              }
              setStatus('speaking');
              lastSpeakingTimeRef.current = Date.now();
              playAudio(message.data);
            } else if (message.type === 'aiTranscript') {
              // Accumulate fragments into the current model turn
              const startNew = newTurnRef.current;
              newTurnRef.current = false;
              setTranscriptHistory((prev) => {
                const last = prev[prev.length - 1];
                if (!startNew && last && last.role === 'model') {
                  // Append to existing model entry within the same turn
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    ...last,
                    text: last.text + message.data,
                  };
                  return updated;
                }
                return [...prev, { role: 'model', text: message.data, timestamp: Date.now() }];
              });
            } else if (message.type === 'userTranscript') {
              // User transcripts are complete — always a new entry
              newTurnRef.current = true; // Next AI response starts a new entry
              setTranscriptHistory((prev) => [
                ...prev,
                { role: 'user', text: message.data, timestamp: Date.now() },
              ]);
            } else if (message.type === 'turnComplete') {
              newTurnRef.current = true; // Mark turn boundary
              const timeSinceSpeaking = Date.now() - lastSpeakingTimeRef.current;
              const delay = Math.max(0, 300 - timeSinceSpeaking);
              if (statusTransitionTimerRef.current) {
                clearTimeout(statusTransitionTimerRef.current);
              }
              statusTransitionTimerRef.current = setTimeout(() => {
                setStatus('listening');
                statusTransitionTimerRef.current = null;
              }, delay);
            } else if (message.type === 'error') {
              console.error('Voice session error:', message.message);
              setConnectionError(message.message || 'Voice session encountered an error.');
              setStatus('idle');
              setIsConnected(false);
              stopAllHardware();
            }
          } catch (err) {
            console.error('Error parsing voice WebSocket message:', err);
          }
        };

        ws.onerror = (error) => {
          console.error('Voice WebSocket error:', error);
          setConnectionError('Failed to connect to voice service. Please check your connection and try again.');
          setStatus('idle');
          setIsConnected(false);
          stopAllHardware();
        };

        ws.onclose = (event) => {
          console.log('Voice WebSocket closed', event.code, event.reason);
          setIsConnected(false);
          if (statusTransitionTimerRef.current) {
            clearTimeout(statusTransitionTimerRef.current);
            statusTransitionTimerRef.current = null;
          }
          // If we were still connecting when WS closed, show an error
          setStatus((prev) => {
            if (prev === 'connecting') {
              setConnectionError('Voice session disconnected unexpectedly. Please try again.');
              return 'idle';
            }
            return prev;
          });
        };

        // Send audio data
        scriptProcessor.onaudioprocess = (e) => {
          if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
          if (isMutedRef.current) return;

          const inputData = e.inputBuffer.getChannelData(0);
          const downsampled = downsampleBuffer(inputData, nativeSampleRate, TARGET_SAMPLE_RATE);
          const pcmBuffer = floatTo16BitPCM(downsampled);
          const base64 = arrayBufferToBase64(pcmBuffer);
          wsRef.current.send(JSON.stringify({ type: 'audio', data: base64 }));
        };
      } catch (e: unknown) {
        console.error('Error starting voice session:', e);
        const errMsg = e instanceof DOMException && e.name === 'NotAllowedError'
          ? 'Microphone access is required for voice mode. Please allow access in your browser settings.'
          : e instanceof DOMException && e.name === 'NotFoundError'
            ? 'No microphone found. Please connect a microphone and try again.'
            : 'Failed to start voice session. Please check your microphone permissions.';
        setConnectionError(errMsg);
        setStatus('idle');
        stopAllHardware();
      }
    };

    startSession();
  }, [user?.id, stopAllHardware]);

  const disconnect = useCallback(() => {
    stopAllHardware();
    setStatus('idle');
    setIsConnected(false);
    setConnectionError(null);
    setTranscriptHistory([]);
    nextStartTimeRef.current = 0;
  }, [stopAllHardware]);

  const toggleMute = useCallback(() => {
    const newMuteState = !isMutedRef.current;
    setIsMuted(newMuteState);
    isMutedRef.current = newMuteState;
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !newMuteState;
      });
    }
  }, []);

  return {
    status,
    isConnected,
    connectionError,
    transcriptHistory,
    connect,
    disconnect,
    toggleMute,
    isMuted,
    outputAnalyser,
    inputAnalyser,
  };
}
