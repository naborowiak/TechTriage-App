import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, Sparkles, UserPlus, Hash } from 'lucide-react';
import { EscalationBreadcrumb } from './EscalationBreadcrumb';
import { ModeDock, ScoutMode } from './ModeDock';
import { VoiceOverlay } from './VoiceOverlay';
import { PhotoCaptureModal } from './PhotoCaptureModal';
import { VideoSessionModal } from './VideoSessionModal';
import { useUsage } from '../../stores/usageStore';
import { sendMessageToGemini, generateCaseSummary, generateEscalationReport, generateCaseName, generateVoiceSummary } from '../../services/geminiService';
import { useVoiceSession, VoiceDiagnosticReport } from '../../hooks/useVoiceSession';
import { VoiceReportModal } from '../voice/VoiceReportModal';
import { saveVoiceReportToHistory } from '../../services/voiceReportService';
import { useWebSpeech } from '../../hooks/useWebSpeech';
import { useGeminiVoice } from '../../hooks/useGeminiVoice';
import { ChatMessage, UserRole, DeviceRecord, EscalationReportData } from '../../types';
import { useAuth } from '../../hooks/useAuth';

interface ScoutChatScreenProps {
  embedded?: boolean;
  initialCaseId?: string;
  initialMode?: ScoutMode;
  initialMessage?: string;
  onInitialMessageSent?: () => void;
  onEscalation?: (report: EscalationReportData, caseId: string) => void;
}

export function ScoutChatScreen({ embedded = false, initialCaseId, initialMode, initialMessage, onInitialMessageSent, onEscalation }: ScoutChatScreenProps) {
  const { tier, canUse, incrementUsage } = useUsage();
  const { user, isAuthenticated } = useAuth();

  const [activeMode, setActiveMode] = useState<ScoutMode>(initialMode || 'chat');
  const [visitedModes, setVisitedModes] = useState<Set<string>>(new Set([initialMode || 'chat']));
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: UserRole.MODEL,
      text: "Hi! I'm Scout, your AI tech support assistant. I can help you troubleshoot Wi-Fi issues, smart devices, appliances, and more. What's going on?",
      timestamp: Date.now(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Case tracking
  const [caseId, setCaseId] = useState<string | null>(initialCaseId || null);
  const [caseTitle, setCaseTitle] = useState<string | null>(null);
  const [hasCreatedCase, setHasCreatedCase] = useState(!!initialCaseId);
  const ensureCasePromiseRef = useRef<Promise<string | null> | null>(null);

  // Device context
  const [devices, setDevices] = useState<DeviceRecord[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<DeviceRecord | null>(null);
  const [showDevicePicker, setShowDevicePicker] = useState(false);
  const [hasPickedDevice, setHasPickedDevice] = useState(false);

  // Modal states
  const [showVoiceOverlay, setShowVoiceOverlay] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showEscalateConfirm, setShowEscalateConfirm] = useState(false);
  const [isEscalating, setIsEscalating] = useState(false);
  const [lockedFeature, setLockedFeature] = useState<ScoutMode | null>(null);
  const [voiceReport, setVoiceReport] = useState<VoiceDiagnosticReport | null>(null);
  const [showVoiceReport, setShowVoiceReport] = useState(false);

  // Voice session hooks
  const voiceSession = useVoiceSession();
  const webSpeech = useWebSpeech();
  const geminiVoice = useGeminiVoice();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch user devices on mount
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetch('/api/devices', { credentials: 'include' })
        .then(res => res.ok ? res.json() : [])
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setDevices(data);
            if (!initialCaseId) {
              setShowDevicePicker(true);
            }
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated, user?.id, initialCaseId]);

  // Load existing case messages if reopening
  useEffect(() => {
    if (initialCaseId && isAuthenticated) {
      fetch(`/api/cases/${initialCaseId}/messages`, { credentials: 'include' })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.messages?.length > 0) {
            const loaded = data.messages.map((m: { role: string; text: string; image?: string; timestamp: number }, i: number) => ({
              id: `loaded_${i}`,
              role: m.role === 'user' ? UserRole.USER : UserRole.MODEL,
              text: m.text,
              image: m.image,
              timestamp: m.timestamp,
            }));
            setMessages(prev => [...prev, ...loaded]);
          }
        })
        .catch(() => {});
    }
  }, [initialCaseId, isAuthenticated]);

  // Auto-trigger initial mode (voice, photo, video) on mount
  useEffect(() => {
    if (!initialMode || initialMode === 'chat') return;
    // Small delay to let the component fully mount
    const timer = setTimeout(() => {
      handleModeSelect(initialMode);
    }, 500);
    return () => clearTimeout(timer);
  }, []); // Only run on mount

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Sync Gemini voice transcript history into voiceSession for display
  useEffect(() => {
    if (!showVoiceOverlay || geminiVoice.transcriptHistory.length === 0) return;

    const latest = geminiVoice.transcriptHistory[geminiVoice.transcriptHistory.length - 1];
    if (latest) {
      voiceSession.addTranscriptEntry(
        latest.role === 'model' ? 'assistant' : 'user',
        latest.text
      );
    }
  }, [geminiVoice.transcriptHistory.length, showVoiceOverlay]);

  // Keep refs to latest state for unmount/beforeunload save
  const latestMessagesRef = useRef(messages);
  const latestCaseIdRef = useRef(caseId);
  useEffect(() => { latestMessagesRef.current = messages; }, [messages]);
  useEffect(() => { latestCaseIdRef.current = caseId; }, [caseId]);

  // Save messages on unmount or page close (uses refs to avoid stale closures)
  useEffect(() => {
    const flushSave = () => {
      const currentCaseId = latestCaseIdRef.current;
      const currentMessages = latestMessagesRef.current;
      if (currentCaseId && isAuthenticated && currentMessages.length > 1) {
        const msgData = currentMessages.filter(m => m.id !== 'welcome').map(m => ({
          role: m.role === UserRole.USER ? 'user' : 'model',
          text: m.text,
          image: m.image,
          timestamp: m.timestamp,
        }));
        navigator.sendBeacon(
          `/api/cases/${currentCaseId}/messages`,
          new Blob([JSON.stringify({ messages: msgData })], { type: 'application/json' })
        );
      }
    };
    window.addEventListener('beforeunload', flushSave);
    return () => {
      window.removeEventListener('beforeunload', flushSave);
      flushSave();
    };
  }, [isAuthenticated]); // Stable deps - refs handle the rest

  const generateId = () => `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  // Auto-create case on first user message (with lock to prevent duplicates)
  const ensureCase = useCallback(async (firstMessage: string, mode: ScoutMode): Promise<string | null> => {
    if (hasCreatedCase && caseId) return caseId;
    if (!isAuthenticated) return null;

    // If a case creation is already in flight, reuse that promise
    if (ensureCasePromiseRef.current) return ensureCasePromiseRef.current;

    const promise = (async () => {
      try {
        // Generate AI case name, fallback to first 80 chars
        let aiName = '';
        try {
          aiName = await generateCaseName(firstMessage);
        } catch { /* ignore */ }

        const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const title = aiName
          ? `${dateStr} - ${aiName}`
          : `${dateStr} - ${firstMessage.substring(0, 80) || 'Support Session'}`;

        const res = await fetch('/api/cases', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            title,
            sessionMode: mode,
            deviceId: selectedDevice?.id || null,
          }),
        });
        if (res.ok) {
          const newCase = await res.json();
          setCaseId(newCase.id);
          setCaseTitle(title);
          setHasCreatedCase(true);
          return newCase.id;
        }
      } catch (e) {
        console.error('Failed to create case:', e);
      } finally {
        ensureCasePromiseRef.current = null;
      }
      return null;
    })();

    ensureCasePromiseRef.current = promise;
    return promise;
  }, [hasCreatedCase, caseId, isAuthenticated, selectedDevice]);

  // Save messages to API (immediate, no debounce)
  const saveMessages = useCallback((currentCaseId: string, msgs: ChatMessage[]) => {
    const msgData = msgs.filter(m => m.id !== 'welcome').map(m => ({
      role: m.role === UserRole.USER ? 'user' : 'model',
      text: m.text,
      image: m.image,
      timestamp: m.timestamp,
    }));
    fetch(`/api/cases/${currentCaseId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ messages: msgData }),
    }).catch(err => console.error('[Scout] Failed to save messages:', err));
  }, []);

  // Build device context string for Gemini
  const getDeviceContext = useCallback((): string | undefined => {
    if (!selectedDevice) return undefined;
    const parts = [`User is asking about their ${selectedDevice.brand || ''} ${selectedDevice.model || ''} ${selectedDevice.type}`.trim()];
    if (selectedDevice.location) parts.push(`located in ${selectedDevice.location}`);
    if (selectedDevice.notes) parts.push(`Notes: ${selectedDevice.notes}`);
    return parts.join(', ');
  }, [selectedDevice]);

  const sendMessage = useCallback(async (text: string, imageBase64?: string) => {
    if (!text.trim() && !imageBase64) return;

    // Check usage limits
    if (!canUse('chat')) {
      setShowUpgradeModal(true);
      setLockedFeature('chat');
      return;
    }

    const userMessage: ChatMessage = {
      id: generateId(),
      role: UserRole.USER,
      text: text.trim(),
      timestamp: Date.now(),
      image: imageBase64,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    // Auto-create case on first user message
    const currentCaseId = await ensureCase(text.trim(), activeMode);

    // If photo was attached, increment photosCount
    if (imageBase64 && currentCaseId) {
      fetch(`/api/cases/${currentCaseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ photosCount: (messages.filter(m => m.image).length + 1) }),
      }).catch(() => {});
    }

    try {
      const response = await sendMessageToGemini(
        messages,
        text.trim(),
        imageBase64,
        getDeviceContext()
      );

      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: UserRole.MODEL,
        text: response.text,
        timestamp: Date.now(),
      };

      const updatedMessages = [...newMessages, assistantMessage];
      setMessages(updatedMessages);
      incrementUsage('chat');

      // Debounce save messages to API
      if (currentCaseId) {
        saveMessages(currentCaseId, updatedMessages);
      }

      // Handle endSession function call
      if (response.functionCall?.name === 'endSession') {
        await handleSessionEnd(currentCaseId, updatedMessages, response.functionCall.args?.summary as string);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: generateId(),
        role: UserRole.MODEL,
        text: "I'm sorry, I encountered an error. Please try again.",
        timestamp: Date.now(),
        isError: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, canUse, incrementUsage, ensureCase, activeMode, getDeviceContext, saveMessages]);

  // Auto-send initial message from Dashboard empty-state input
  const initialMessageSentRef = useRef(false);
  useEffect(() => {
    if (initialMessage && !initialMessageSentRef.current) {
      initialMessageSentRef.current = true;
      // Small delay to let the component fully mount
      const timer = setTimeout(() => {
        sendMessage(initialMessage);
        onInitialMessageSent?.();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [initialMessage, sendMessage, onInitialMessageSent]);

  // Handle session end - save summary and mark resolved
  const handleSessionEnd = useCallback(async (currentCaseId: string | null, msgs: ChatMessage[], endSummary?: string) => {
    if (!currentCaseId || !isAuthenticated) return;

    try {
      // Save final messages
      const msgData = msgs.filter(m => m.id !== 'welcome').map(m => ({
        role: m.role === UserRole.USER ? 'user' : 'model',
        text: m.text,
        image: m.image,
        timestamp: m.timestamp,
      }));
      await fetch(`/api/cases/${currentCaseId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ messages: msgData }),
      });

      // Generate AI summary
      let summaryText = endSummary || '';
      try {
        const summary = await generateCaseSummary(msgData);
        summaryText = `Problem: ${summary.problem}\nAnalysis: ${summary.analysis}\nFix: ${summary.recommendedFix}\nNext Steps: ${summary.nextSteps.join(', ')}`;
      } catch {
        // Use endSession summary if generation fails
      }

      // Update case status to resolved
      await fetch(`/api/cases/${currentCaseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          status: 'resolved',
          aiSummary: summaryText,
        }),
      });
    } catch (e) {
      console.error('Failed to finalize case:', e);
    }
  }, [isAuthenticated]);

  // Escalation handler
  const handleEscalate = useCallback(async () => {
    setIsEscalating(true);
    setShowEscalateConfirm(false);

    const currentCaseId = caseId || await ensureCase('Escalation requested', activeMode);
    if (!currentCaseId) {
      setIsEscalating(false);
      return;
    }

    try {
      const msgData = messages.filter(m => m.id !== 'welcome').map(m => ({
        role: m.role === UserRole.USER ? 'user' : 'model',
        text: m.text,
        timestamp: m.timestamp,
      }));

      const report = await generateEscalationReport(
        msgData,
        getDeviceContext(),
      );

      // Update case with escalation data
      await fetch(`/api/cases/${currentCaseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          status: 'escalated',
          escalatedAt: new Date().toISOString(),
          escalationReport: report,
        }),
      });

      // Save recording for escalation
      await fetch(`/api/cases/${currentCaseId}/recordings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          sessionType: 'escalation_report',
          transcript: JSON.stringify(report),
        }),
      });

      // Add escalation message to chat
      const escalationMessage: ChatMessage = {
        id: generateId(),
        role: UserRole.MODEL,
        text: `This case has been escalated to a **${report.recommendedSpecialist}**.\n\n**Problem:** ${report.problemDescription}\n\n**Urgency:** ${report.urgencyLevel}\n**Estimated Cost:** ${report.estimatedCostRange}\n\nA detailed report has been generated for the technician.`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, escalationMessage]);

      if (onEscalation) {
        onEscalation(report, currentCaseId);
      }
    } catch (e) {
      console.error('Escalation failed:', e);
      const errorMessage: ChatMessage = {
        id: generateId(),
        role: UserRole.MODEL,
        text: "Sorry, the escalation failed. Please try again or contact support directly.",
        timestamp: Date.now(),
        isError: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsEscalating(false);
    }
  }, [caseId, ensureCase, activeMode, messages, getDeviceContext, onEscalation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleModeSelect = (mode: ScoutMode) => {
    setActiveMode(mode);
    setVisitedModes(prev => new Set(prev).add(mode));

    switch (mode) {
      case 'voice':
        startVoiceMode();
        break;
      case 'photo':
        setShowPhotoModal(true);
        break;
      case 'video':
        setShowVideoModal(true);
        break;
      default:
        // Chat mode - focus input
        inputRef.current?.focus();
    }
  };

  const handleLockedModeClick = (mode: ScoutMode) => {
    setLockedFeature(mode);
    setShowUpgradeModal(true);
  };

  const startVoiceMode = useCallback(() => {
    voiceSession.startSession();
    setShowVoiceOverlay(true);
    geminiVoice.connect();
  }, [voiceSession, geminiVoice]);

  const endVoiceMode = useCallback(async () => {
    // Always hide overlay first — if cleanup throws, the user must not get stuck
    setShowVoiceOverlay(false);
    setActiveMode('chat');

    let report: ReturnType<typeof voiceSession.endSession> | undefined;
    try {
      geminiVoice.disconnect();
    } catch (e) {
      console.error('Error disconnecting voice:', e);
    }
    try {
      webSpeech.cancel();
    } catch (e) {
      console.error('Error cancelling speech:', e);
    }
    try {
      report = voiceSession.endSession();
    } catch (e) {
      console.error('Error ending voice session:', e);
    }

    // Save voice recording to case
    const currentCaseId = caseId || await ensureCase('Voice diagnostic session', 'voice');
    if (currentCaseId && report) {
      const typedReport = report as VoiceDiagnosticReport;
      const transcriptText = typedReport.transcript
        ?.map((t: { role: string; text: string }) => `${t.role}: ${t.text}`)
        .join('\n') || '';

      // Save recording
      fetch(`/api/cases/${currentCaseId}/recordings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          sessionType: 'live_audio',
          transcript: transcriptText,
          durationSeconds: typedReport.duration
            ? Math.round(typedReport.duration / 1000)
            : null,
        }),
      }).catch(() => {});

      // Save voice transcript as case messages so they appear in history
      if (typedReport.transcript && typedReport.transcript.length > 0) {
        const msgData = typedReport.transcript.map((t: { role: string; text: string; timestamp?: number }) => ({
          role: t.role === 'user' ? 'user' : 'model',
          text: t.text,
          timestamp: t.timestamp || Date.now(),
        }));
        fetch(`/api/cases/${currentCaseId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ messages: msgData }),
        }).catch(() => {});
      }

      // Generate AI voice summary and show VoiceReportModal
      try {
        const summary = await generateVoiceSummary(
          typedReport.transcript || [],
          typedReport.photos?.length || 0
        );
        typedReport.summary = summary;
      } catch (e) {
        console.error('Failed to generate voice summary:', e);
      }

      // Save report to history and show modal
      saveVoiceReportToHistory(typedReport);
      setVoiceReport(typedReport);
      setShowVoiceReport(true);

      // Update case with AI summary
      const summary = typedReport.summary;
      if (summary) {
        fetch(`/api/cases/${currentCaseId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            aiSummary: `Issue: ${summary.issue || 'N/A'}\nDiagnosis: ${summary.diagnosis || 'N/A'}`,
          }),
        }).catch(() => {});
      }
    }
  }, [geminiVoice, webSpeech, voiceSession, caseId, ensureCase]);

  const handlePhotoCaptured = useCallback((imageBase64: string) => {
    setShowPhotoModal(false);

    // If in voice mode, handle photo for voice session
    if (showVoiceOverlay && voiceSession.session.photoRequestPending) {
      voiceSession.addPhoto(imageBase64, voiceSession.session.currentPhotoPrompt || 'Photo captured', '');
      return;
    }

    // Otherwise, add to chat
    const photoMessage = "I've attached a photo for you to analyze.";
    sendMessage(photoMessage, imageBase64);
    setActiveMode('chat');
  }, [showVoiceOverlay, voiceSession, sendMessage]);

  const handleDeviceSelect = useCallback((device: DeviceRecord | null) => {
    setSelectedDevice(device);
    setShowDevicePicker(false);
    setHasPickedDevice(true);
  }, []);

  const renderMarkdown = (text: string): React.ReactNode => {
    const lines = text.split('\n');

    return lines.map((line, index) => {
      // Bold text
      const boldProcessed = line.replace(
        /\*\*(.*?)\*\*/g,
        '<strong class="font-semibold">$1</strong>'
      );

      // Numbered lists
      const numberedMatch = line.match(/^(\d+)\.\s(.+)$/);
      if (numberedMatch) {
        return (
          <div key={index} className="flex gap-2 my-1">
            <span className="text-[#6366F1] font-medium">{numberedMatch[1]}.</span>
            <span dangerouslySetInnerHTML={{ __html: boldProcessed.replace(/^\d+\.\s/, '') }} />
          </div>
        );
      }

      // Bullet points
      const bulletMatch = line.match(/^[•\-]\s(.+)$/);
      if (bulletMatch) {
        return (
          <div key={index} className="flex gap-2 my-1">
            <span className="text-[#06B6D4]">•</span>
            <span dangerouslySetInnerHTML={{ __html: boldProcessed.replace(/^[•\-]\s/, '') }} />
          </div>
        );
      }

      // Empty lines
      if (!line.trim()) {
        return <div key={index} className="h-2" />;
      }

      return (
        <p key={index} dangerouslySetInnerHTML={{ __html: boldProcessed }} />
      );
    });
  };

  // Derive the last transcript text for VoiceOverlay display
  const lastTranscriptText = geminiVoice.transcriptHistory.length > 0
    ? geminiVoice.transcriptHistory[geminiVoice.transcriptHistory.length - 1].text
    : '';

  const hasActiveSession = messages.length > 1;

  return (
    <div className={`flex flex-col ${embedded ? 'h-full' : 'h-screen'} bg-[#0B0E14]`}>
      {/* Header - only shown in standalone mode */}
      {!embedded && (
        <div>
          <header className="flex items-center justify-between px-4 py-3 bg-[#151922] border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#A855F7] to-[#6366F1] flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-white font-semibold text-lg">Scout AI</h1>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-white/60 text-xs">Online</span>
                  {caseId && (
                    <span className="text-white/40 text-xs ml-2 flex items-center gap-1">
                      <Hash className="w-3 h-3" />
                      {caseTitle || caseId.substring(0, 8)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Escalate Button */}
              {hasActiveSession && isAuthenticated && (
                <button
                  onClick={() => setShowEscalateConfirm(true)}
                  disabled={isEscalating}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/20 border border-orange-500/30 text-orange-400 hover:bg-orange-500/30 transition-colors text-xs font-medium"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  {isEscalating ? 'Escalating...' : 'Escalate'}
                </button>
              )}
              <Sparkles className="w-5 h-5 text-[#A855F7]" />
            </div>
          </header>
          {hasActiveSession && (
            <div className="px-4 bg-[#151922]/50 border-b border-white/5">
              <EscalationBreadcrumb
                activeMode={activeMode}
                visitedModes={visitedModes}
                isEscalated={isEscalating || messages.some(m => m.text.includes('escalation report has been generated'))}
                messageCount={messages.filter(m => m.role === UserRole.USER).length}
                onSuggestEscalation={() => setShowEscalateConfirm(true)}
              />
            </div>
          )}
        </div>
      )}

      {/* Embedded header with case ID, breadcrumb, and escalation */}
      {embedded && (caseId || hasActiveSession) && (
        <div className="px-4 py-2 bg-[#151922]/50 border-b border-white/5">
          {hasActiveSession && (
            <EscalationBreadcrumb
              activeMode={activeMode}
              visitedModes={visitedModes}
              isEscalated={isEscalating || messages.some(m => m.text.includes('escalation report has been generated'))}
              messageCount={messages.filter(m => m.role === UserRole.USER).length}
              onSuggestEscalation={() => setShowEscalateConfirm(true)}
            />
          )}
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-2">
              {caseId && (
                <span className="text-white/40 text-xs flex items-center gap-1 bg-white/5 px-2 py-1 rounded">
                  <Hash className="w-3 h-3" />
                  {caseTitle || `Case ${caseId.substring(0, 8)}`}
                </span>
              )}
              {selectedDevice && (
                <span className="text-cyan-400/70 text-xs bg-cyan-400/10 px-2 py-1 rounded">
                  {selectedDevice.name}
                </span>
              )}
            </div>
            {hasActiveSession && isAuthenticated && (
              <button
                onClick={() => setShowEscalateConfirm(true)}
                disabled={isEscalating}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/20 border border-orange-500/30 text-orange-400 hover:bg-orange-500/30 transition-colors text-xs font-medium"
              >
                <UserPlus className="w-3.5 h-3.5" />
                {isEscalating ? 'Escalating...' : 'Escalate to Human'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Device Picker */}
      {showDevicePicker && !hasPickedDevice && devices.length > 0 && (
        <div className="px-4 py-3 bg-[#151922]/80 border-b border-white/5">
          <div className="max-w-3xl mx-auto">
            <p className="text-white/60 text-xs mb-2">What device needs help?</p>
            <div className="flex flex-wrap gap-2">
              {devices.map(device => (
                <button
                  key={device.id}
                  onClick={() => handleDeviceSelect(device)}
                  className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/80 text-xs hover:bg-white/10 hover:border-[#06B6D4]/30 transition-colors"
                >
                  {device.name}
                  {device.brand && <span className="text-white/40 ml-1">({device.brand})</span>}
                </button>
              ))}
              <button
                onClick={() => handleDeviceSelect(null)}
                className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 text-xs hover:bg-white/10 transition-colors"
              >
                Something new
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div className="max-w-3xl mx-auto space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === UserRole.USER ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`
                max-w-[85%] rounded-2xl px-4 py-3
                ${message.role === UserRole.USER
                  ? 'bg-gradient-to-r from-[#6366F1] to-[#06B6D4] text-white'
                  : 'bg-white/5 backdrop-blur-md border border-white/10 text-white/90'
                }
              `}
            >
              {message.image && (
                <img
                  src={message.image}
                  alt="Attached"
                  className="rounded-lg mb-2 max-h-48 w-auto"
                />
              )}
              <div className="text-sm leading-relaxed">
                {renderMarkdown(message.text)}
              </div>
              <div className={`text-xs mt-2 ${message.role === UserRole.USER ? 'text-white/60' : 'text-white/40'}`}>
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#A855F7] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-[#6366F1] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-[#06B6D4] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-white/60 text-sm">Scout is typing...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="px-4 pb-4 bg-[#0B0E14]">
        <div className="max-w-3xl mx-auto">
        {/* Mode Dock */}
        <ModeDock
          activeMode={activeMode}
          onModeSelect={handleModeSelect}
          userTier={tier}
          onLockedModeClick={handleLockedModeClick}
        />

        {/* Text Input */}
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask Scout anything..."
              className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-full px-5 py-3 text-white placeholder-white/40 focus:outline-none focus:border-[#6366F1]/50 focus:ring-1 focus:ring-[#6366F1]/30 transition-all"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className={`
              w-12 h-12 rounded-full flex items-center justify-center transition-all
              ${inputValue.trim() && !isLoading
                ? 'bg-gradient-to-r from-[#6366F1] to-[#06B6D4] shadow-[0_0_15px_rgba(99,102,241,0.4)] hover:shadow-[0_0_20px_rgba(99,102,241,0.6)]'
                : 'bg-white/10 cursor-not-allowed'
              }
            `}
          >
            <Send className={`w-5 h-5 ${inputValue.trim() && !isLoading ? 'text-white' : 'text-white/40'}`} />
          </button>
        </form>
        </div>
      </div>

      {/* Voice Overlay */}
      {showVoiceOverlay && (
        <VoiceOverlay
          session={voiceSession.session}
          timeDisplay={voiceSession.formatTimeRemaining()}
          isWarning={voiceSession.isWarningTime}
          isListening={geminiVoice.status === 'listening'}
          isSpeaking={geminiVoice.status === 'speaking'}
          transcript={lastTranscriptText}
          interimTranscript=""
          onEndSession={endVoiceMode}
          onCapturePhoto={() => setShowPhotoModal(true)}
          photoRequestPending={voiceSession.session.photoRequestPending}
          currentPhotoPrompt={voiceSession.session.currentPhotoPrompt}
          outputAnalyser={geminiVoice.outputAnalyser}
          inputAnalyser={geminiVoice.inputAnalyser}
          geminiStatus={geminiVoice.status}
          connectionError={geminiVoice.connectionError}
          transcriptHistory={geminiVoice.transcriptHistory}
          userName={user?.firstName || user?.username || undefined}
        />
      )}

      {/* Photo Capture Modal */}
      {showPhotoModal && (
        <PhotoCaptureModal
          onClose={() => {
            setShowPhotoModal(false);
            if (!showVoiceOverlay) setActiveMode('chat');
          }}
          onPhotoCaptured={handlePhotoCaptured}
        />
      )}

      {/* Video Session Modal */}
      {showVideoModal && (
        <VideoSessionModal
          onClose={async () => {
            setShowVideoModal(false);
            setActiveMode('chat');
          }}
          caseId={caseId || undefined}
        />
      )}

      {/* Escalation Confirmation Modal */}
      {showEscalateConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-[#151922] rounded-2xl p-6 mx-4 max-w-sm w-full border border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-orange-400" />
              </div>
              <h3 className="text-white text-xl font-semibold">Escalate to Human</h3>
            </div>
            <p className="text-white/70 mb-2 text-sm">
              This will generate a detailed diagnostic report and mark this case for human review.
            </p>
            <p className="text-white/50 mb-4 text-xs">
              The report will include your conversation, any photos shared, and Scout's analysis to help a professional pick up where we left off.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEscalateConfirm(false)}
                className="flex-1 px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEscalate}
                className="flex-1 px-4 py-2 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors"
              >
                Generate Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-[#151922] rounded-2xl p-6 mx-4 max-w-sm w-full border border-white/10">
            <h3 className="text-white text-xl font-semibold mb-2">Upgrade Required</h3>
            <p className="text-white/70 mb-4">
              {lockedFeature === 'voice' && "Voice mode requires a Home or Pro subscription."}
              {lockedFeature === 'photo' && "Photo analysis requires a Free account or higher."}
              {lockedFeature === 'video' && "Video sessions require a Home or Pro subscription."}
              {lockedFeature === 'chat' && "You've reached your chat limit. Upgrade for unlimited messages."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                Maybe Later
              </button>
              <button
                onClick={() => {
                  setShowUpgradeModal(false);
                  window.location.href = '/pricing';
                }}
                className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-[#6366F1] to-[#06B6D4] text-white font-medium hover:opacity-90 transition-opacity"
              >
                Upgrade
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Voice Report Modal */}
      {showVoiceReport && voiceReport && (
        <VoiceReportModal
          report={voiceReport}
          onClose={() => {
            setShowVoiceReport(false);
            setVoiceReport(null);
          }}
          userEmail={user?.email || undefined}
          userName={user?.firstName || user?.username || undefined}
        />
      )}
    </div>
  );
}
