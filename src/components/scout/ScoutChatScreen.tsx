import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, Sparkles } from 'lucide-react';
import { ModeDock, ScoutMode } from './ModeDock';
import { VoiceOverlay } from './VoiceOverlay';
import { PhotoCaptureModal } from './PhotoCaptureModal';
import { VideoSessionModal } from './VideoSessionModal';
import { useUsage } from '../../stores/usageStore';
import { sendMessageToGemini, sendVoiceMessage } from '../../services/geminiService';
import { useVoiceSession } from '../../hooks/useVoiceSession';
import { useWebSpeech } from '../../hooks/useWebSpeech';
import { ChatMessage, UserRole } from '../../types';

export function ScoutChatScreen() {
  const { tier, canUse, incrementUsage } = useUsage();

  const [activeMode, setActiveMode] = useState<ScoutMode>('chat');
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

  // Modal states
  const [showVoiceOverlay, setShowVoiceOverlay] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [lockedFeature, setLockedFeature] = useState<ScoutMode | null>(null);

  // Voice session hooks
  const voiceSession = useVoiceSession();
  const webSpeech = useWebSpeech();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Process voice transcripts when user finishes speaking
  useEffect(() => {
    if (!voiceSession.session.isActive || !webSpeech.transcript) return;

    const processVoiceInput = async () => {
      const userText = webSpeech.transcript;
      voiceSession.addTranscriptEntry('user', userText);

      try {
        const response = await sendVoiceMessage(
          voiceSession.session.transcript,
          userText
        );

        voiceSession.addTranscriptEntry('assistant', response.text);

        if (response.photoRequest && response.photoPrompt) {
          voiceSession.setPhotoRequest(response.photoPrompt);
        }

        await webSpeech.speak(response.text);
        webSpeech.startListening();
      } catch (error) {
        console.error('Voice processing error:', error);
        const errorMsg = "I had trouble understanding that. Could you repeat it?";
        voiceSession.addTranscriptEntry('assistant', errorMsg);
        await webSpeech.speak(errorMsg);
        webSpeech.startListening();
      }
    };

    processVoiceInput();
  }, [webSpeech.transcript, voiceSession.session.isActive]);

  const generateId = () => `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

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

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await sendMessageToGemini(
        messages,
        text.trim(),
        imageBase64
      );

      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: UserRole.MODEL,
        text: response.text,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      incrementUsage('chat');
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: generateId(),
        role: UserRole.MODEL,
        text: "I'm sorry, I encountered an error. Please try again.",
        timestamp: Date.now(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, canUse, incrementUsage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleModeSelect = (mode: ScoutMode) => {
    setActiveMode(mode);

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
    if (!webSpeech.isSupported) {
      alert('Voice mode requires Chrome, Safari, or Edge browser');
      return;
    }

    voiceSession.startSession();
    setShowVoiceOverlay(true);

    const greeting = "Hi! I'm Scout, ready to help with your tech issue. Just describe what's happening and I'll guide you through it.";
    voiceSession.addTranscriptEntry('assistant', greeting);

    webSpeech.speak(greeting).then(() => {
      webSpeech.startListening();
    });
  }, [webSpeech, voiceSession]);

  const endVoiceMode = useCallback(() => {
    webSpeech.cancel();
    webSpeech.stopListening();
    voiceSession.endSession();
    setShowVoiceOverlay(false);
    setActiveMode('chat');
  }, [webSpeech, voiceSession]);

  const handlePhotoCaptured = useCallback((imageBase64: string) => {
    setShowPhotoModal(false);

    // If in voice mode, handle photo for voice session
    if (showVoiceOverlay && voiceSession.session.photoRequestPending) {
      // Add photo to voice session
      voiceSession.addPhoto(imageBase64, voiceSession.session.currentPhotoPrompt || 'Photo captured', '');
      return;
    }

    // Otherwise, add to chat
    const photoMessage = "I've attached a photo for you to analyze.";
    sendMessage(photoMessage, imageBase64);
    setActiveMode('chat');
  }, [showVoiceOverlay, voiceSession, sendMessage]);

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

  return (
    <div className="flex flex-col h-screen bg-[#0B0E14]">
      {/* Header */}
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
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#A855F7]" />
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
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

      {/* Input Area */}
      <div className="px-4 pb-4 bg-[#0B0E14]">
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

      {/* Voice Overlay */}
      {showVoiceOverlay && (
        <VoiceOverlay
          session={voiceSession.session}
          timeDisplay={voiceSession.formatTimeRemaining()}
          isWarning={voiceSession.isWarningTime}
          isListening={webSpeech.isListening}
          isSpeaking={webSpeech.isSpeaking}
          transcript={webSpeech.transcript}
          interimTranscript={webSpeech.interimTranscript}
          onEndSession={endVoiceMode}
          onCapturePhoto={() => setShowPhotoModal(true)}
          photoRequestPending={voiceSession.session.photoRequestPending}
          currentPhotoPrompt={voiceSession.session.currentPhotoPrompt}
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
          onClose={() => {
            setShowVideoModal(false);
            setActiveMode('chat');
          }}
        />
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
                  // Navigate to pricing page
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
    </div>
  );
}
