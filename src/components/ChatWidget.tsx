import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { MessageSquare, X, Send, Image as ImageIcon, ScanLine, Maximize2, Download, Camera, Library, MoreHorizontal, LifeBuoy, User, ArrowRight, Lock, Zap } from 'lucide-react';
import { ChatMessage, UserRole } from '../types';
import { sendMessageToGemini, sendMessageAsLiveAgent } from '../services/geminiService';
import { LiveSupport } from './LiveSupport';
import { useAuth } from '../hooks/useAuth';
import { useUsage, UsageLimits } from '../stores/usageStore';
import { UpgradeModal, SignupGateModal } from './UpgradeModal';
import { RateLimitModal } from './RateLimitModal';

// Simple markdown renderer for chat messages
const renderMarkdown = (text: string): React.ReactNode => {
  // Split by lines to handle lists
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, lineIndex) => {
    // Process inline formatting (bold)
    const processInline = (str: string): React.ReactNode[] => {
      const parts: React.ReactNode[] = [];
      let remaining = str;
      let keyIndex = 0;

      while (remaining.length > 0) {
        // Match **bold**
        const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
        if (boldMatch && boldMatch.index !== undefined) {
          // Add text before bold
          if (boldMatch.index > 0) {
            parts.push(remaining.slice(0, boldMatch.index));
          }
          // Add bold text
          parts.push(<strong key={`b-${lineIndex}-${keyIndex++}`} className="font-semibold">{boldMatch[1]}</strong>);
          remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
        } else {
          parts.push(remaining);
          break;
        }
      }
      return parts;
    };

    // Check for numbered list (1. 2. etc)
    const numberedMatch = line.match(/^(\d+)\.\s+(.*)$/);
    // Check for bullet point (• or - or *)
    const bulletMatch = line.match(/^[•\-\*]\s+(.*)$/);

    if (numberedMatch) {
      elements.push(
        <div key={lineIndex} className="flex gap-2 ml-1">
          <span className="text-electric-indigo font-semibold">{numberedMatch[1]}.</span>
          <span>{processInline(numberedMatch[2])}</span>
        </div>
      );
    } else if (bulletMatch) {
      elements.push(
        <div key={lineIndex} className="flex gap-2 ml-1">
          <span className="text-electric-indigo">•</span>
          <span>{processInline(bulletMatch[1])}</span>
        </div>
      );
    } else if (line.trim() === '') {
      elements.push(<div key={lineIndex} className="h-2" />);
    } else {
      elements.push(<div key={lineIndex}>{processInline(line)}</div>);
    }
  });

  return <>{elements}</>;
};

export interface ChatWidgetHandle {
  open: (initialMessage?: string) => void;
  openAsLiveAgent: () => void;
}

// Canned responses for non-logged in users (sales/conversion focused)
const CANNED_RESPONSES: Record<string, { text: string; followUp?: string[] }> = {
  pricing: {
    text: "Great question! We have three plans:\n\n• **TotalAssist Free** - 5 chat messages + 1 photo/month\n• **TotalAssist Home ($9.99/mo)** - Unlimited chat, photos, voice + 1 Live Video session/week\n• **TotalAssist Pro ($19.99/mo)** - Everything unlimited + 15 Live Video sessions/month + premium support\n\nWould you like to see the full pricing details?",
    followUp: ["View pricing", "Sign up free", "What's included?"]
  },
  help: {
    text: "I can help point you in the right direction! Our service helps with:\n\n• Wi-Fi & networking issues\n• Smart home setup\n• TV & streaming problems\n• Computer troubleshooting\n• And much more!\n\nSign up for free to start a support session.",
    followUp: ["Sign up free", "How it works", "View pricing"]
  },
  howItWorks: {
    text: "Here's how TotalAssist works:\n\n1. **Describe** your problem in chat\n2. **Snap** a photo if it helps\n3. **Get** expert solutions instantly\n\nFor complex issues, you can also start a Live Video session for real-time guidance.",
    followUp: ["Sign up free", "View pricing", "What can you help with?"]
  },
  default: {
    text: "Thanks for your interest in TotalAssist! To get personalized support for your tech issues, you'll need to create a free account.\n\nIt only takes a minute, and you'll get 5 free chat messages to try it out!",
    followUp: ["Sign up free", "View pricing", "How it works"]
  }
};

// Generate a unique session ID
const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

// Get or create a persistent user identifier
const getUserIdentifier = (): string => {
  let userId = localStorage.getItem('scout_user_id');
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem('scout_user_id', userId);
  }
  return userId;
};

// Agent names for "live agent" mode
const AGENT_NAMES = [
  { first: 'Sarah', last: 'Mitchell' },
  { first: 'Marcus', last: 'Chen' },
  { first: 'Emily', last: 'Rodriguez' },
  { first: 'James', last: 'Thompson' },
  { first: 'Olivia', last: 'Patel' },
  { first: 'Daniel', last: 'Kim' },
];

const getRandomAgent = () => {
  return AGENT_NAMES[Math.floor(Math.random() * AGENT_NAMES.length)];
};

const BotAvatar = ({ className }: { className: string }) => {
  const [error, setError] = useState(false);
  if (error) return <LifeBuoy className={className} />;
  return <img src="/scout_logo.png" className={`${className} object-contain`} alt="Bot" onError={() => setError(true)} />;
};

const AgentAvatar = ({ className, name }: { className: string; name: string }) => {
  return (
    <div className={`${className} bg-gradient-to-br from-scout-purple to-electric-indigo rounded-full flex items-center justify-center text-white font-bold text-xs`}>
      {name.charAt(0)}
    </div>
  );
};

// Logging function for audit
const logInteraction = async (data: {
  sessionId: string;
  userId: string;
  agentName: string | null;
  agentMode: 'bot' | 'live_agent';
  action: string;
  messageRole: string;
  messageText: string;
  timestamp: number;
}) => {
  try {
    console.log('[AUDIT LOG]', JSON.stringify(data, null, 2));
    const logs = JSON.parse(localStorage.getItem('scout_audit_logs') || '[]');
    logs.push(data);
    if (logs.length > 100) logs.shift();
    localStorage.setItem('scout_audit_logs', JSON.stringify(logs));
  } catch (e) {
    console.error('Failed to log interaction:', e);
  }
};

interface ChatWidgetProps {
  onNavigate?: (view: string) => void;
}

export const ChatWidget = forwardRef<ChatWidgetHandle, ChatWidgetProps>(({ onNavigate }, ref) => {
  // Pick a random agent name for this widget session
  const botAgentNameRef = useRef(AGENT_NAMES[Math.floor(Math.random() * AGENT_NAMES.length)]);
  const [isOpen, setIsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isLiveVideoActive, setIsLiveVideoActive] = useState(false);
  const [isSessionEnded, setIsSessionEnded] = useState(false);
  const [, setSessionSummary] = useState('');
  const [input, setInput] = useState('');
  const [showImageMenu, setShowImageMenu] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  // Track scroll for showing chat bubble to guests
  const [hasScrolled, setHasScrolled] = useState(false);

  // Modal states for friction ladder
  const [showSignupGate, setShowSignupGate] = useState(false);
  const [showUpgradeGate, setShowUpgradeGate] = useState(false);
  const [gatedFeature, setGatedFeature] = useState<keyof UsageLimits | 'voice'>('chat');

  // Rate limit modal (ChatGPT-style) for guests
  const [showRateLimitModal, setShowRateLimitModal] = useState(false);
  const [rateLimitDismissed, setRateLimitDismissed] = useState(false);

  // Check if user is authenticated
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  // Usage store for friction ladder
  const {
    tier,
    incrementUsage,
    canUse,
    getRemainingCredits,
    shouldShowSignupGate,
    shouldShowUpgradeGate,
    isFeatureLocked,
  } = useUsage();

  // Live agent mode state
  const [isLiveAgentMode, setIsLiveAgentMode] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<{ first: string; last: string } | null>(null);
  const [isConnectingToAgent, setIsConnectingToAgent] = useState(false);

  // Session tracking
  const [sessionId] = useState(() => generateSessionId());
  const userId = getUserIdentifier();

  const [selectedImage, setSelectedImage] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  // Get initial welcome message based on auth state
  const getWelcomeMessage = (authenticated: boolean): ChatMessage => ({
    id: 'welcome',
    role: UserRole.MODEL,
    text: authenticated
      ? "Hi there! How can I help you today?"
      : `Hey! I'm ${botAgentNameRef.current.first}, your TotalAssist tech support assistant. What's going on with your tech?`,
    timestamp: Date.now()
  });

  // Load persisted messages on mount
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('scout_chat_messages');
        if (saved) {
          const parsed = JSON.parse(saved);
          const lastMsg = parsed[parsed.length - 1];
          if (lastMsg && Date.now() - lastMsg.timestamp < 24 * 60 * 60 * 1000) {
            return parsed;
          }
        }
      } catch (e) {
        console.error('Failed to load messages:', e);
      }
    }
    return [getWelcomeMessage(false)];
  });

  // Update welcome message when auth state changes
  useEffect(() => {
    if (!authLoading && messages.length === 1 && messages[0].id === 'welcome') {
      setMessages([getWelcomeMessage(isAuthenticated)]);
    }
  }, [authLoading, isAuthenticated]);

  // Persist messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('scout_chat_messages', JSON.stringify(messages));
    } catch (e) {
      console.error('Failed to save messages:', e);
    }
  }, [messages]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const optionsMenuRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Show chat bubble for guests after they scroll down the page
  useEffect(() => {
    // Only track scroll for guests (non-authenticated users)
    if (isAuthenticated || authLoading) {
      setHasScrolled(true); // Always show for authenticated users
      return;
    }

    const handleScroll = () => {
      // Show chat bubble after scrolling 300px (approximately past hero fold)
      if (window.scrollY > 300) {
        setHasScrolled(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Check initial scroll position (user might have refreshed mid-page)
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [isAuthenticated, authLoading]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowImageMenu(false);
      }
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target as Node)) {
        setShowOptionsMenu(false);
      }
    };
    if (showImageMenu || showOptionsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showImageMenu, showOptionsMenu]);

  // Agent connection status message
  const [agentStatusMessage, setAgentStatusMessage] = useState<string>('');
  // Typing indicator for live agent responses
  const [isAgentTyping, setIsAgentTyping] = useState(false);

  const startLiveAgentMode = () => {
    setIsConnectingToAgent(true);
    const agent = getRandomAgent();
    setCurrentAgent(agent);

    // Progressive status messages
    setAgentStatusMessage('Searching for available specialists...');

    const connectDelay = 5000 + Math.random() * 3000; // 5-8 seconds
    const statusUpdateDelay = 2000 + Math.random() * 1000; // Update after 2-3s

    setTimeout(() => {
      setAgentStatusMessage(`Connecting you with ${agent.first} ${agent.last}...`);
    }, statusUpdateDelay);

    setTimeout(() => {
      setIsConnectingToAgent(false);
      setAgentStatusMessage('');
      setIsLiveAgentMode(true);

      const connectMsg: ChatMessage = {
        id: `connect_${Date.now()}`,
        role: UserRole.MODEL,
        text: `Hey there! I'm ${agent.first}, a TotalAssist Support Specialist. I've reviewed your conversation so far — how can I help you today?`,
        timestamp: Date.now(),
        agentName: `${agent.first} ${agent.last}`
      };

      setMessages(prev => [...prev, connectMsg]);

      logInteraction({
        sessionId,
        userId,
        agentName: `${agent.first} ${agent.last}`,
        agentMode: 'live_agent',
        action: 'agent_connected',
        messageRole: 'system',
        messageText: `Agent ${agent.first} ${agent.last} connected`,
        timestamp: Date.now()
      });
    }, connectDelay);
  };

  useImperativeHandle(ref, () => ({
    open: (initialMessage?: string) => {
      setIsOpen(true);
      setIsSessionEnded(false);
      if (initialMessage && initialMessage.trim().length > 0) {
        setInput(initialMessage);
      }
    },
    openAsLiveAgent: () => {
      setIsOpen(true);
      setIsSessionEnded(false);
      startLiveAgentMode();
    }
  }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check if user can use photo feature
      if (isFeatureLocked('photo') || !canUse('photo')) {
        setGatedFeature('photo');
        if (tier === 'guest') {
          setShowRateLimitModal(true);
        } else {
          setShowUpgradeGate(true);
        }
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setShowImageMenu(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownloadTranscript = () => {
    const text = messages.map(m => `[${m.role}${m.agentName ? ` - ${m.agentName}` : ''}] ${m.text}`).join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TotalAssist-Transcript-${Date.now()}.txt`;
    a.click();
    setShowOptionsMenu(false);
  };

  const handleClearChat = () => {
    setMessages([getWelcomeMessage(isAuthenticated)]);
    setIsLiveAgentMode(false);
    setCurrentAgent(null);
    setShowOptionsMenu(false);
    localStorage.removeItem('scout_chat_messages');
  };

  // Handle quick action buttons - these are FREE and don't count toward usage
  const handleQuickAction = (action: string) => {
    // Add user's selection as a message
    const userMsg: ChatMessage = {
      id: `quick-user-${Date.now()}`,
      role: UserRole.USER,
      text: action,
      timestamp: Date.now()
    };

    // Get the appropriate canned response
    let response: { text: string; followUp?: string[] };
    if (action.toLowerCase().includes('pricing') || action.toLowerCase().includes('cost')) {
      response = CANNED_RESPONSES.pricing;
    } else if (action.toLowerCase().includes('how') || action.toLowerCase().includes('work')) {
      response = CANNED_RESPONSES.howItWorks;
    } else if (action.toLowerCase().includes('help') || action.toLowerCase().includes('what can')) {
      response = CANNED_RESPONSES.help;
    } else {
      response = CANNED_RESPONSES.default;
    }

    const botMsg: ChatMessage = {
      id: `quick-bot-${Date.now()}`,
      role: UserRole.MODEL,
      text: response.text,
      timestamp: Date.now(),
      cannedFollowUp: response.followUp
    };

    setMessages(prev => [...prev, userMsg, botMsg]);
  };

  // Handle navigation for canned response buttons
  const handleCannedAction = (action: string) => {
    if (action === 'Sign up free') {
      if (onNavigate) {
        onNavigate('signup');
      } else {
        window.location.href = '/signup';
      }
    } else if (action === 'View pricing') {
      if (onNavigate) {
        onNavigate('pricing');
      } else {
        window.location.href = '/pricing';
      }
    } else if (action === 'How it works' || action === "What's included?" || action === 'What can you help with?') {
      // Use the free quick action handler
      handleQuickAction(action);
    }
  };

  const handleSignupFromGate = () => {
    setShowSignupGate(false);
    if (onNavigate) {
      onNavigate('signup');
    } else {
      window.location.href = '/signup';
    }
  };

  const handleSend = async (messageOverride?: string) => {
    const textToSend = typeof messageOverride === 'string' ? messageOverride : input;
    if ((!textToSend.trim() && !selectedImage) || isLoading) return;

    // Check friction ladder gates BEFORE sending
    if (tier === 'guest' && shouldShowSignupGate()) {
      setGatedFeature('chat');
      setShowRateLimitModal(true);
      return;
    }

    if (tier === 'free' && shouldShowUpgradeGate('chat')) {
      setGatedFeature('chat');
      setShowUpgradeGate(true);
      return;
    }

    // Check if we can use chat (increment usage)
    if (!canUse('chat')) {
      setGatedFeature('chat');
      if (tier === 'guest') {
        setShowRateLimitModal(true);
      } else {
        setShowUpgradeGate(true);
      }
      return;
    }

    // Increment chat usage
    const canProceed = incrementUsage('chat');
    if (!canProceed) {
      setGatedFeature('chat');
      if (tier === 'guest') {
        setShowRateLimitModal(true);
      } else {
        setShowUpgradeGate(true);
      }
      return;
    }

    // If sending with image, also check/increment photo usage
    if (selectedImage) {
      if (!canUse('photo')) {
        setGatedFeature('photo');
        if (tier === 'guest') {
          setShowRateLimitModal(true);
        } else {
          setShowUpgradeGate(true);
        }
        return;
      }
      incrementUsage('photo');
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: UserRole.USER,
      text: textToSend,
      image: selectedImage,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    const tempImage = selectedImage;
    setSelectedImage(undefined);
    setIsLoading(true);

    // Log user message
    logInteraction({
      sessionId,
      userId,
      agentName: currentAgent ? `${currentAgent.first} ${currentAgent.last}` : null,
      agentMode: isLiveAgentMode ? 'live_agent' : 'bot',
      action: 'user_message',
      messageRole: 'user',
      messageText: textToSend,
      timestamp: Date.now()
    });

    try {
      const { text, functionCall } = isLiveAgentMode && currentAgent
        ? await sendMessageAsLiveAgent([...messages, userMsg], userMsg.text, currentAgent, tempImage)
        : await sendMessageToGemini([...messages, userMsg], userMsg.text, tempImage);

      // Add realistic typing delay for live agent responses
      if (isLiveAgentMode && currentAgent) {
        setIsAgentTyping(true);
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        setIsAgentTyping(false);
      }

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: UserRole.MODEL,
        text: text,
        timestamp: Date.now(),
        agentName: isLiveAgentMode && currentAgent ? `${currentAgent.first} ${currentAgent.last}` : undefined
      };
      setMessages(prev => [...prev, aiMsg]);

      logInteraction({
        sessionId,
        userId,
        agentName: currentAgent ? `${currentAgent.first} ${currentAgent.last}` : null,
        agentMode: isLiveAgentMode ? 'live_agent' : 'bot',
        action: 'ai_response',
        messageRole: 'model',
        messageText: text,
        timestamp: Date.now()
      });

      if (functionCall?.name === 'endSession') {
        setIsSessionEnded(true);
        setSessionSummary(functionCall.args.summary as string);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: UserRole.MODEL,
        text: "I'm having trouble connecting. Please try again.",
        isError: true,
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeakToExpert = () => {
    const connectingMsg: ChatMessage = {
      id: `connecting_${Date.now()}`,
      role: UserRole.MODEL,
      text: "Connecting you with a support specialist...",
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, connectingMsg]);
    startLiveAgentMode();
  };

  if (isLiveVideoActive) return <LiveSupport onClose={() => setIsLiveVideoActive(false)} userId={user?.id} userEmail={user?.email || undefined} userName={user?.firstName || user?.username || undefined} />;

  const displayName = isLiveAgentMode && currentAgent
    ? `${currentAgent.first} ${currentAgent.last}`
    : botAgentNameRef.current.first;

  const displaySubtitle = isLiveAgentMode
    ? 'Support Specialist'
    : 'Tech Support';

  // Calculate remaining credits for display
  const chatRemaining = getRemainingCredits('chat');
  const isAtLimit = chatRemaining === 0;

  return (
    <>
      <div
        className={`fixed z-[60] transition-all duration-300 flex flex-col font-sans ${
          isFullScreen ? 'inset-0 w-full h-full bg-light-50 dark:bg-midnight-950' :
          isOpen ? 'bottom-0 right-0 sm:bottom-6 sm:right-6 w-full sm:w-[400px] h-full sm:h-[680px]' :
          'bottom-6 right-6 w-auto h-auto pointer-events-none'
        }`}
      >
        {isOpen && (
          <div className={`flex flex-col bg-white dark:bg-midnight-900 overflow-hidden border-2 border-scout-purple/30 dark:border-scout-purple/40 transition-all duration-300 pointer-events-auto relative ${
            isFullScreen ? 'w-full h-full rounded-none shadow-none' : 'w-full h-full rounded-t-xl sm:rounded-2xl shadow-[0_0_60px_-10px_rgba(168,85,247,0.5),0_25px_50px_-12px_rgba(0,0,0,0.4)]'
          }`}>
            {/* Header */}
            <div className="bg-gradient-to-r from-midnight-900 via-midnight-800 to-midnight-900 p-4 border-b border-scout-purple/20 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                {isLiveAgentMode && currentAgent ? (
                  <AgentAvatar className="w-10 h-10" name={currentAgent.first} />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-scout-purple to-electric-indigo rounded-xl flex items-center justify-center overflow-hidden">
                    <BotAvatar className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-white text-sm">{displayName}</h3>
                  <div className="text-xs text-electric-cyan/80 flex items-center gap-1">
                    {isLiveAgentMode && <span className="w-2 h-2 bg-electric-cyan rounded-full animate-pulse"></span>}
                    {displaySubtitle}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 relative">
                <button onClick={() => setShowOptionsMenu(!showOptionsMenu)} className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>

                {showOptionsMenu && (
                  <div ref={optionsMenuRef} className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-midnight-800 rounded-xl shadow-xl border border-light-300 dark:border-midnight-700 py-2 z-50 animate-fade-in-up">
                    <button onClick={() => { setIsFullScreen(!isFullScreen); setShowOptionsMenu(false); }} className="w-full text-left px-4 py-3 hover:bg-light-100 dark:hover:bg-midnight-700 flex items-center gap-3 text-text-primary dark:text-white text-sm font-medium">
                      <Maximize2 className="w-4 h-4" /> {isFullScreen ? 'Minimize window' : 'Expand window'}
                    </button>
                    <button onClick={handleDownloadTranscript} className="w-full text-left px-4 py-3 hover:bg-light-100 dark:hover:bg-midnight-700 flex items-center gap-3 text-text-primary dark:text-white text-sm font-medium">
                      <Download className="w-4 h-4" /> Download transcript
                    </button>
                    <button onClick={handleClearChat} className="w-full text-left px-4 py-3 hover:bg-light-100 dark:hover:bg-midnight-700 flex items-center gap-3 text-red-500 dark:text-red-400 text-sm font-medium">
                      <X className="w-4 h-4" /> Clear chat history
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Purple accent line */}
            <div className="h-0.5 bg-gradient-to-r from-scout-purple via-electric-indigo to-electric-cyan"></div>

            {/* Usage indicator bar */}
            {tier !== 'pro' && (
              <div className="px-4 py-2 bg-light-50 dark:bg-midnight-800/50 border-b border-light-300 dark:border-midnight-700 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  <Zap className="w-3 h-3 text-electric-cyan" />
                  <span className="text-text-secondary">
                    {tier === 'guest' ? 'Guest' : 'Free'}: {chatRemaining} message{chatRemaining !== 1 ? 's' : ''} left
                  </span>
                </div>
                <button
                  onClick={() => setShowUpgradeGate(true)}
                  className="text-xs text-electric-indigo hover:text-electric-cyan transition-colors font-medium"
                >
                  Upgrade
                </button>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-light-50 dark:bg-midnight-950 space-y-4">
              <div className="text-xs text-center text-text-muted font-medium py-2">Today</div>

              {messages.map((msg) => (
                <div key={msg.id}>
                  <div className={`flex w-full ${msg.role === UserRole.USER ? 'justify-end' : 'justify-start items-end gap-2'}`}>
                    {msg.role === UserRole.MODEL && (
                      msg.agentName ? (
                        <AgentAvatar className="w-6 h-6 shrink-0 mb-1" name={msg.agentName.charAt(0)} />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-scout-purple to-electric-indigo flex items-center justify-center shrink-0 mb-1 overflow-hidden">
                          <BotAvatar className="w-4 h-4" />
                        </div>
                      )
                    )}
                    <div className={`max-w-[85%] rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-sm ${
                      msg.role === UserRole.USER
                        ? 'bg-gradient-to-r from-electric-indigo to-electric-cyan text-white rounded-tr-sm'
                        : 'bg-light-100 dark:bg-midnight-800 text-text-primary dark:text-white rounded-tl-sm border border-light-300 dark:border-midnight-700'
                    }`}>
                      {msg.image && <img src={msg.image} className="w-full h-auto rounded-lg mb-3 border border-light-300 dark:border-midnight-700" />}
                      <div className="leading-relaxed">{renderMarkdown(msg.text)}</div>
                      <div className={`text-[10px] mt-1 ${msg.role === UserRole.USER ? 'text-white/50' : 'text-text-muted'}`}>
                        {msg.role === UserRole.MODEL ? `${msg.agentName || botAgentNameRef.current.first} • ` : ''}
                        {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                  </div>
                  {/* Canned follow-up buttons */}
                  {msg.cannedFollowUp && msg.cannedFollowUp.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2 ml-8">
                      {msg.cannedFollowUp.map((action, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleCannedAction(action)}
                          className="bg-white dark:bg-midnight-800 border border-electric-indigo/50 text-text-primary dark:text-white hover:bg-electric-indigo/10 dark:hover:bg-electric-indigo/20 px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1"
                        >
                          {action}
                          {(action === 'Sign up free' || action === 'View pricing') && <ArrowRight className="w-3 h-3" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {isConnectingToAgent && (
                <div className="flex justify-start items-end gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-scout-purple to-electric-indigo flex items-center justify-center text-white shrink-0 mb-1">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="bg-light-100 dark:bg-midnight-800 rounded-2xl rounded-tl-sm px-5 py-3 border border-light-300 dark:border-midnight-700 shadow-sm">
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-electric-cyan rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-electric-cyan rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-electric-cyan rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                      <span>{agentStatusMessage || 'Finding an available specialist...'}</span>
                    </div>
                  </div>
                </div>
              )}

              {isAgentTyping && !isLoading && (
                <div className="flex justify-start items-end gap-2">
                  {currentAgent && <AgentAvatar className="w-6 h-6 shrink-0 mb-1" name={currentAgent.first} />}
                  <div className="bg-light-100 dark:bg-midnight-800 rounded-2xl rounded-tl-sm px-4 py-3 border border-light-300 dark:border-midnight-700 shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-text-secondary rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-text-secondary rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-1.5 h-1.5 bg-text-secondary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                      <span className="text-xs text-text-muted">{currentAgent?.first} is typing...</span>
                    </div>
                  </div>
                </div>
              )}

              {isLoading && !isConnectingToAgent && (
                <div className="flex justify-start items-end gap-2">
                  {isLiveAgentMode && currentAgent ? (
                    <AgentAvatar className="w-6 h-6 shrink-0 mb-1" name={currentAgent.first} />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-scout-purple to-electric-indigo flex items-center justify-center shrink-0 mb-1 overflow-hidden">
                      <BotAvatar className="w-4 h-4" />
                    </div>
                  )}
                  <div className="bg-light-100 dark:bg-midnight-800 rounded-2xl rounded-tl-sm px-4 py-3 border border-light-300 dark:border-midnight-700 shadow-sm">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-text-secondary rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-text-secondary rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-1.5 h-1.5 bg-text-secondary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              )}

              {messages.length < 3 && !isLoading && !isLiveAgentMode && !isConnectingToAgent && (
                <div className="flex flex-wrap gap-2 mt-4 ml-8">
                  <button onClick={handleSpeakToExpert} className="bg-white dark:bg-midnight-800 border border-electric-indigo/50 text-text-primary dark:text-white hover:bg-electric-indigo/10 dark:hover:bg-electric-indigo/20 px-4 py-2 rounded-full text-sm font-medium transition-colors">
                    Speak to an expert
                  </button>
                  <button onClick={() => handleQuickAction("What can you help with?")} className="bg-white dark:bg-midnight-800 border border-electric-indigo/50 text-text-primary dark:text-white hover:bg-electric-indigo/10 dark:hover:bg-electric-indigo/20 px-4 py-2 rounded-full text-sm font-medium transition-colors">
                    What can you help with?
                  </button>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Video Diagnostic button - only for pro users */}
            {!isSessionEnded && tier === 'pro' && (
              <div className="px-4 py-2 bg-white dark:bg-midnight-900 border-t border-light-300 dark:border-midnight-700">
                <button
                  onClick={() => setIsLiveVideoActive(true)}
                  className="w-full btn-gradient-electric text-white py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-bold shadow-sm transition-all"
                >
                  <ScanLine className="w-4 h-4" /> Start Video Diagnostic
                </button>
              </div>
            )}


            {/* Persistent banner for guests after dismissing rate limit modal */}
            {rateLimitDismissed && tier === 'guest' && !showRateLimitModal && (
              <div className="px-4 py-2.5 bg-light-50 dark:bg-midnight-800/50 border-t border-light-300 dark:border-midnight-700 flex items-center justify-between gap-3">
                <span className="text-xs text-text-secondary flex-1">Get smarter responses, upload files and images, and more.</span>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => onNavigate ? onNavigate('login') : (window.location.href = '/login')} className="text-xs font-semibold text-electric-indigo hover:text-electric-cyan transition-colors">Log in</button>
                  <button onClick={() => onNavigate ? onNavigate('signup') : (window.location.href = '/signup')} className="text-xs font-semibold bg-midnight-900 dark:bg-white text-white dark:text-midnight-900 px-3 py-1 rounded-full hover:opacity-90 transition-opacity">Sign up</button>
                </div>
              </div>
            )}

            {/* Input area */}
            <div className="p-4 bg-white dark:bg-midnight-900 border-t border-light-300 dark:border-midnight-700 relative">
              {selectedImage && (
                <div className="absolute bottom-full left-4 mb-2 flex gap-3 animate-fade-in-up">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-light-300 dark:border-midnight-700 group shadow-lg">
                    <img src={selectedImage} className="w-full h-full object-cover" />
                    <button
                      onClick={() => setSelectedImage(undefined)}
                      className="absolute top-1 right-1 bg-black/50 dark:bg-midnight-950/80 text-white p-0.5 rounded-full"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {showImageMenu && (
                <div ref={menuRef} className="absolute bottom-16 left-4 bg-white dark:bg-midnight-800 border border-light-300 dark:border-midnight-700 rounded-xl shadow-xl p-2 z-50 w-48 animate-fade-in-up">
                  <button onClick={() => cameraInputRef.current?.click()} className="w-full flex items-center gap-3 p-3 hover:bg-light-100 dark:hover:bg-midnight-700 rounded-lg transition-all text-text-primary dark:text-white text-sm font-medium">
                    <Camera className="w-4 h-4 text-text-secondary" /> Take Photo
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-3 p-3 hover:bg-light-100 dark:hover:bg-midnight-700 rounded-lg transition-all text-text-primary dark:text-white text-sm font-medium">
                    <Library className="w-4 h-4 text-text-secondary" /> Photo Library
                  </button>
                </div>
              )}

              {/* Disabled input state when at limit */}
              {isAtLimit && tier !== 'pro' ? (
                <div className="bg-light-100 dark:bg-midnight-800 rounded-xl p-4 text-center border border-light-300 dark:border-midnight-700">
                  <Lock className="w-6 h-6 text-text-muted mx-auto mb-2" />
                  <p className="text-sm text-text-secondary mb-3">
                    You've reached your limit. Upgrade to continue.
                  </p>
                  <button
                    onClick={() => setShowUpgradeGate(true)}
                    className="btn-gradient-electric text-white px-6 py-2 rounded-full text-sm font-bold"
                  >
                    Upgrade Now
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder={isLiveAgentMode ? `Message ${currentAgent?.first}...` : "Type a message..."}
                      className="w-full bg-light-100 dark:bg-midnight-800 border border-light-300 dark:border-midnight-700 rounded-full px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-electric-indigo/50 pr-10 text-text-primary dark:text-white placeholder:text-text-muted"
                    />
                    <button
                      onClick={() => setShowImageMenu(!showImageMenu)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary dark:hover:text-white transition-colors"
                    >
                      <ImageIcon className="w-5 h-5" />
                    </button>
                  </div>

                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                  <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileChange} />

                  <button
                    onClick={() => handleSend()}
                    disabled={(!input.trim() && !selectedImage) || isLoading}
                    className="p-3 btn-gradient-electric text-white rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Disclaimer */}
              <p className="text-[10px] text-text-muted text-center mt-2">Responses may not always be accurate. Check important info.</p>
            </div>

            {/* Rate Limit Modal overlay */}
            <RateLimitModal
              isOpen={showRateLimitModal}
              onLogin={() => {
                setShowRateLimitModal(false);
                if (onNavigate) onNavigate('login');
                else window.location.href = '/login';
              }}
              onSignup={() => {
                setShowRateLimitModal(false);
                if (onNavigate) onNavigate('signup');
                else window.location.href = '/signup';
              }}
              onDismiss={() => {
                setShowRateLimitModal(false);
                setRateLimitDismissed(true);
              }}
            />
          </div>
        )}

        {/* Chat bubble - shows immediately for authenticated users, after scroll for guests */}
        {!isOpen && hasScrolled && (
          <button
            aria-label="Open Chat"
            onClick={() => setIsOpen(true)}
            className="bg-gradient-to-r from-scout-purple to-electric-indigo text-white rounded-full shadow-[0_0_40px_-5px_rgba(168,85,247,0.6),0_10px_30px_-5px_rgba(0,0,0,0.3)] hover:shadow-[0_0_50px_-5px_rgba(168,85,247,0.8),0_15px_40px_-5px_rgba(0,0,0,0.4)] hover:scale-105 transition-all flex items-center gap-3 font-bold pointer-events-auto px-6 py-4 text-base animate-fade-in-up ring-2 ring-white/20"
          >
            <MessageSquare className="w-5 h-5" />
            Chat with an Agent
          </button>
        )}
      </div>

      {/* Signup Gate Modal */}
      <SignupGateModal
        isOpen={showSignupGate}
        onClose={() => setShowSignupGate(false)}
        onSignup={handleSignupFromGate}
      />

      {/* Upgrade Gate Modal */}
      <UpgradeModal
        isOpen={showUpgradeGate}
        onClose={() => setShowUpgradeGate(false)}
        feature={gatedFeature as 'chat' | 'photo' | 'videoDiagnostic' | 'signal' | 'voice'}
        currentTier={tier}
      />

    </>
  );
});
