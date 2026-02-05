import { useState, useCallback, useRef, useEffect } from 'react';

export interface VoicePhoto {
  id: string;
  timestamp: number;
  base64: string;
  aiPrompt: string;
  aiAnalysis: string;
}

export interface VoiceTranscriptEntry {
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  photoRef?: string;
}

export interface VoiceDiagnosticReport {
  id: string;
  createdAt: number;
  duration: number;
  photos: VoicePhoto[];
  transcript: VoiceTranscriptEntry[];
  summary: {
    issue: string;
    diagnosis: string;
    steps: string[];
    outcome: 'resolved' | 'partial' | 'escalate';
    recommendations: string[];
  };
}

export interface VoiceSessionState {
  isActive: boolean;
  startTime: number | null;
  timeRemaining: number;
  photos: VoicePhoto[];
  transcript: VoiceTranscriptEntry[];
  photoRequestPending: boolean;
  currentPhotoPrompt: string | null;
}

interface UseVoiceSessionReturn {
  session: VoiceSessionState;
  startSession: () => void;
  endSession: () => VoiceDiagnosticReport | null;
  addTranscriptEntry: (role: 'user' | 'assistant', text: string, photoRef?: string) => void;
  addPhoto: (base64: string, aiPrompt: string, aiAnalysis: string) => string;
  setPhotoRequest: (prompt: string | null) => void;
  formatTimeRemaining: () => string;
  isWarningTime: boolean;
}

const SESSION_DURATION = 15 * 60; // 15 minutes in seconds

export function useVoiceSession(): UseVoiceSessionReturn {
  const [session, setSession] = useState<VoiceSessionState>({
    isActive: false,
    startTime: null,
    timeRemaining: SESSION_DURATION,
    photos: [],
    transcript: [],
    photoRequestPending: false,
    currentPhotoPrompt: null,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionDataRef = useRef<VoiceSessionState>(session);

  // Keep ref in sync with state
  useEffect(() => {
    sessionDataRef.current = session;
  }, [session]);

  // Timer effect
  useEffect(() => {
    if (session.isActive && session.startTime) {
      timerRef.current = setInterval(() => {
        setSession(prev => {
          const elapsed = Math.floor((Date.now() - (prev.startTime || 0)) / 1000);
          const remaining = Math.max(0, SESSION_DURATION - elapsed);

          if (remaining === 0) {
            // Session auto-ended
            return { ...prev, isActive: false, timeRemaining: 0 };
          }

          return { ...prev, timeRemaining: remaining };
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [session.isActive, session.startTime]);

  const startSession = useCallback(() => {
    setSession({
      isActive: true,
      startTime: Date.now(),
      timeRemaining: SESSION_DURATION,
      photos: [],
      transcript: [],
      photoRequestPending: false,
      currentPhotoPrompt: null,
    });
  }, []);

  const endSession = useCallback((): VoiceDiagnosticReport | null => {
    const currentSession = sessionDataRef.current;

    if (!currentSession.isActive || !currentSession.startTime) {
      return null;
    }

    const duration = Math.floor((Date.now() - currentSession.startTime) / 1000);

    // Generate summary from transcript (this would ideally be AI-generated)
    const userMessages = currentSession.transcript.filter(t => t.role === 'user');
    const assistantMessages = currentSession.transcript.filter(t => t.role === 'assistant');

    const report: VoiceDiagnosticReport = {
      id: `voice_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      createdAt: Date.now(),
      duration,
      photos: currentSession.photos,
      transcript: currentSession.transcript,
      summary: {
        issue: userMessages[0]?.text?.substring(0, 200) || 'Technical issue diagnosed',
        diagnosis: assistantMessages[assistantMessages.length - 1]?.text?.substring(0, 300) || 'Session completed',
        steps: assistantMessages
          .filter(m => m.text.length > 30)
          .slice(0, 5)
          .map(m => m.text.substring(0, 150)),
        outcome: 'partial',
        recommendations: ['Continue monitoring the issue', 'Contact support if problem persists'],
      },
    };

    // Reset session
    setSession({
      isActive: false,
      startTime: null,
      timeRemaining: SESSION_DURATION,
      photos: [],
      transcript: [],
      photoRequestPending: false,
      currentPhotoPrompt: null,
    });

    return report;
  }, []);

  const addTranscriptEntry = useCallback((role: 'user' | 'assistant', text: string, photoRef?: string) => {
    setSession(prev => ({
      ...prev,
      transcript: [
        ...prev.transcript,
        {
          role,
          text,
          timestamp: Date.now(),
          photoRef,
        },
      ],
    }));
  }, []);

  const addPhoto = useCallback((base64: string, aiPrompt: string, aiAnalysis: string): string => {
    const photoId = `photo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    setSession(prev => ({
      ...prev,
      photos: [
        ...prev.photos,
        {
          id: photoId,
          timestamp: Date.now(),
          base64,
          aiPrompt,
          aiAnalysis,
        },
      ],
      photoRequestPending: false,
      currentPhotoPrompt: null,
    }));

    return photoId;
  }, []);

  const setPhotoRequest = useCallback((prompt: string | null) => {
    setSession(prev => ({
      ...prev,
      photoRequestPending: prompt !== null,
      currentPhotoPrompt: prompt,
    }));
  }, []);

  const formatTimeRemaining = useCallback((): string => {
    const minutes = Math.floor(session.timeRemaining / 60);
    const seconds = session.timeRemaining % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [session.timeRemaining]);

  const isWarningTime = session.timeRemaining <= 60 && session.timeRemaining > 0;

  return {
    session,
    startSession,
    endSession,
    addTranscriptEntry,
    addPhoto,
    setPhotoRequest,
    formatTimeRemaining,
    isWarningTime,
  };
}
