import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Camera,
  ScanLine,
  Mic,
  Clock,
  User,
  ChevronRight,
  Sparkles,
  Shield,
  History,
  Settings,
  LogOut,
  Menu,
  AlertTriangle,
  CreditCard,
  FolderOpen,
  Lock,
  Zap,
  Sun,
  Moon,
  Bot,
  Package,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { Logo } from "./Logo";
import { getTrialStatus } from "../services/trialService";
import { useSubscription } from "../hooks/useSubscription";
import { useUsage, UsageLimits, VideoCredits, VIDEO_CREDIT_CONFIG } from "../stores/usageStore";
import { UpgradeModal } from "./UpgradeModal";

interface DashboardProps {
  user: {
    id?: string;
    firstName: string;
    lastName?: string;
    email: string;
  };
  onStartChat: () => void;
  onUploadImage: () => void;
  onStartVideo: (caseId?: string) => void;
  onStartSignal?: () => void; // Voice mode handler
  onOpenScout?: () => void; // Scout AI nav handler
  onLogout: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  onOpenBilling?: () => void;
  onOpenInventory?: () => void;
  onBackToDashboard?: () => void;
  activeView?: "main" | "history" | "settings" | "billing" | "scout" | "inventory";
  children?: React.ReactNode;
  onUpdateUser?: (user: {
    firstName: string;
    lastName?: string;
    email: string;
  }) => void;
}

interface TrialInfo {
  isActive: boolean;
  remainingHours?: number;
  remainingMinutes?: number;
}

interface Case {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  aiSummary?: string;
}

// Usage Meter Component for Sidebar
interface UsageMeterProps {
  tier: string;
  usage: UsageLimits;
  videoCredits: VideoCredits;
  videoResetInfo: { resetType: 'weekly' | 'monthly'; daysUntilReset: number };
}

const UsageMeter: React.FC<UsageMeterProps> = ({ tier, usage, videoCredits, videoResetInfo }) => {
  const chatRemaining = Math.max(0, usage.chat.limit - usage.chat.used);
  const chatTotal = usage.chat.limit;
  const photoRemaining = Math.max(0, usage.photo.limit - usage.photo.used);
  const totalVideoCredits = videoCredits.subscriptionCredits + videoCredits.purchasedCredits;
  const isUnlimited = chatTotal >= 999999;
  const isPaidTier = tier === 'home' || tier === 'pro';

  const getTierBadge = () => {
    if (tier === 'pro') return { label: 'PRO', color: 'bg-scout-purple/20 text-scout-purple' };
    if (tier === 'home') return { label: 'HOME', color: 'bg-electric-cyan/20 text-electric-cyan' };
    return { label: 'FREE', color: 'bg-midnight-700 text-text-secondary' };
  };

  const badge = getTierBadge();

  return (
    <div className="p-4 bg-light-100 dark:bg-midnight-800/50 rounded-xl border border-light-300 dark:border-midnight-700 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-electric-cyan" />
        <span className="text-sm font-semibold text-text-primary dark:text-white">Scout Credits</span>
        <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${badge.color}`}>
          {badge.label}
        </span>
      </div>

      {/* Chat usage */}
      {isUnlimited ? (
        <div className="text-sm text-text-secondary mb-3">
          <span className="text-electric-cyan font-medium">Unlimited</span> messages
        </div>
      ) : (
        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-text-secondary">Chat</span>
            <span className="text-text-primary dark:text-white font-medium">{chatRemaining}/{chatTotal}</span>
          </div>
          <div className="h-1.5 bg-light-300 dark:bg-midnight-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                chatRemaining === 0
                  ? 'bg-red-500'
                  : chatRemaining <= 2
                    ? 'bg-yellow-500'
                    : 'bg-gradient-to-r from-electric-indigo to-electric-cyan'
              }`}
              style={{ width: `${(chatRemaining / chatTotal) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Photo usage - only show for free tier */}
      {!isPaidTier && (
        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-text-secondary">Snapshot</span>
            <span className={`font-medium ${photoRemaining === 0 ? 'text-red-400' : 'text-text-primary dark:text-white'}`}>
              {photoRemaining === 0 ? 'Used' : `${photoRemaining}/1`}
            </span>
          </div>
        </div>
      )}

      {/* Video Diagnostic usage - only show for paid tiers */}
      {isPaidTier && (
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-text-secondary">Video Diagnostic</span>
            <span className={`font-medium ${totalVideoCredits === 0 ? 'text-red-400' : 'text-text-primary dark:text-white'}`}>
              {tier === 'home'
                ? (totalVideoCredits > 0 ? '1 Credit' : 'Used')
                : `${totalVideoCredits}/${videoCredits.subscriptionLimit}`
              }
            </span>
          </div>
          {tier === 'pro' && (
            <div className="h-1.5 bg-light-300 dark:bg-midnight-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-scout-purple to-scout-glow transition-all"
                style={{ width: `${Math.min(100, (totalVideoCredits / videoCredits.subscriptionLimit) * 100)}%` }}
              />
            </div>
          )}
          {totalVideoCredits === 0 && (
            <div className="text-xs text-text-muted mt-1">
              Resets in {videoResetInfo.daysUntilReset} day{videoResetInfo.daysUntilReset !== 1 ? 's' : ''}
            </div>
          )}
          {videoCredits.purchasedCredits > 0 && (
            <div className="text-xs text-scout-glow mt-1">
              +{videoCredits.purchasedCredits} purchased credit{videoCredits.purchasedCredits !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Action Card with Locked State
const ActionCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonText: string;
  onClick: () => void;
  highlight?: boolean;
  badge?: string | number;
  disabled?: boolean;
  locked?: boolean;
  onLockedClick?: () => void;
}> = ({
  icon,
  title,
  description,
  buttonText,
  onClick,
  highlight,
  badge,
  disabled,
  locked,
  onLockedClick,
}) => {
  const handleClick = () => {
    if (locked && onLockedClick) {
      onLockedClick();
    } else if (!disabled) {
      onClick();
    }
  };

  return (
    <div
      className={`relative rounded-2xl p-6 border transition-all ${
        locked
          ? "bg-light-100 dark:bg-midnight-800/70 border-light-300 dark:border-midnight-700 opacity-80"
          : disabled
            ? "bg-light-100 dark:bg-midnight-800 border-light-300 dark:border-midnight-700 opacity-60 cursor-not-allowed"
            : highlight
              ? "bg-white dark:bg-midnight-800 border-electric-indigo shadow-glow-electric hover:shadow-lg hover:-translate-y-1"
              : "bg-white dark:bg-midnight-800 border-light-300 dark:border-midnight-700 hover:border-light-400 dark:hover:border-midnight-600 hover:shadow-lg hover:-translate-y-1"
      }`}
    >
      {/* Pro Badge for locked features */}
      {locked && (
        <div className="absolute -top-2 -right-2 px-3 py-1 rounded-full bg-scout-purple text-white text-xs font-bold shadow-lg flex items-center gap-1">
          <Lock className="w-3 h-3" />
          PRO
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-14 h-14 rounded-xl flex items-center justify-center ${
            locked
              ? "bg-light-200 dark:bg-midnight-700 text-text-muted"
              : highlight
                ? "bg-gradient-to-br from-scout-purple to-electric-indigo text-white"
                : "bg-light-200 dark:bg-midnight-700 text-electric-indigo"
          }`}
        >
          {icon}
        </div>
        {badge !== undefined && !locked && (
          <span
            className={`text-xs font-bold px-2 py-1 rounded-full ${
              badge === 0 || badge === "Used"
                ? "bg-red-500/20 text-red-400"
                : badge === "unlimited" || badge === "Unlimited"
                  ? "bg-electric-cyan/20 text-electric-cyan"
                  : "bg-electric-indigo/20 text-electric-indigo"
            }`}
          >
            {badge === "unlimited"
              ? "Unlimited"
              : typeof badge === "number"
                ? `${badge} left`
                : badge}
          </span>
        )}
      </div>
      <h3 className="text-xl font-bold text-text-primary dark:text-white mb-2">{title}</h3>
      <p className="text-text-secondary mb-4 leading-relaxed text-sm">{description}</p>
      <button
        onClick={handleClick}
        className={`w-full py-3 px-4 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all ${
          locked
            ? "bg-scout-purple/20 text-scout-purple hover:bg-scout-purple/30 border border-scout-purple/30"
            : disabled
              ? "bg-light-200 dark:bg-midnight-700 text-text-muted cursor-not-allowed"
              : highlight
                ? "btn-gradient-electric text-white shadow-lg shadow-electric-indigo/20"
                : "bg-light-200 dark:bg-midnight-700 hover:bg-light-300 dark:hover:bg-midnight-600 text-text-primary dark:text-white border border-light-300 dark:border-midnight-600"
        }`}
      >
        {locked ? (
          <>
            <Lock className="w-4 h-4" />
            Unlock with Pro
          </>
        ) : (
          <>
            {buttonText}
            <ChevronRight className="w-4 h-4" />
          </>
        )}
      </button>
    </div>
  );
};

const QuickTip: React.FC<{ tip: string }> = ({ tip }) => (
  <div className="flex items-start gap-3 p-4 bg-electric-indigo/10 dark:bg-electric-indigo/10 rounded-xl border border-electric-indigo/20">
    <Sparkles className="w-5 h-5 text-electric-indigo shrink-0 mt-0.5" />
    <p className="text-sm text-text-secondary">{tip}</p>
  </div>
);

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  onStartChat,
  onUploadImage,
  onStartVideo,
  onStartSignal,
  onOpenScout,
  onLogout,
  onOpenHistory,
  onOpenSettings,
  onOpenBilling,
  onOpenInventory,
  onBackToDashboard,
  activeView = "main",
  children,
  onUpdateUser: _onUpdateUser,
}) => {
  const [trialInfo, setTrialInfo] = useState<TrialInfo>({ isActive: false });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [cases, setCases] = useState<Case[]>([]);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<'chat' | 'photo' | 'signal' | 'videoDiagnostic'>('chat');
  const { theme, toggleTheme } = useTheme();

  // Usage store
  const {
    tier,
    usage,
    videoCredits,
    getRemainingCredits,
    isFeatureLocked,
    canUseVideoCredit,
    getVideoResetInfo,
    shouldShowRefillModal,
  } = useUsage();

  // Get subscription status (for future integration)
  useSubscription(user.id);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    onLogout();
  };

  const handleLockedFeatureClick = (feature: 'chat' | 'photo' | 'signal' | 'videoDiagnostic') => {
    setUpgradeFeature(feature);
    setUpgradeModalOpen(true);
  };

  // Fetch trial status
  useEffect(() => {
    const fetchTrialStatus = async () => {
      const status = await getTrialStatus(user.email);
      setTrialInfo({
        isActive: status.isActive,
        remainingHours: status.remainingHours,
        remainingMinutes: status.remainingMinutes,
      });
    };

    fetchTrialStatus();
    const interval = setInterval(fetchTrialStatus, 60000);
    return () => clearInterval(interval);
  }, [user.email]);

  // Fetch Cases
  useEffect(() => {
    if (user?.id) {
      fetch("/api/cases", { credentials: "include" })
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error("Failed to fetch");
        })
        .then((data) => {
          if (Array.isArray(data)) {
            setCases(data);
          }
        })
        .catch((err) => console.error("Failed to load cases:", err));
    }
  }, [user?.id]);

  // Handler for Video Diagnostic
  const handleStartDiagnostic = async () => {
    // Check if video is locked for free/guest tiers
    const isVideoLocked = VIDEO_CREDIT_CONFIG[tier].limit === 0 && videoCredits.purchasedCredits === 0;

    if (isVideoLocked) {
      handleLockedFeatureClick('videoDiagnostic');
      return;
    }

    // Check if user has credits (for paid tiers)
    if (!canUseVideoCredit()) {
      // Show refill modal instead of upgrade modal
      if (shouldShowRefillModal()) {
        handleLockedFeatureClick('videoDiagnostic');
      }
      return;
    }

    try {
      const response = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: "Video Diagnostic - " + new Date().toLocaleDateString(),
        }),
      });

      if (response.ok) {
        const newCase = await response.json();
        onStartVideo(newCase.id);
      } else {
        onStartVideo();
      }
    } catch (e) {
      console.error("Error creating case:", e);
      onStartVideo();
    }
  };

  const tips = [
    "For the best results, make sure your photos are well-lit and show the entire device or error message.",
    "Scout can read error codes and model numbers - just show them clearly in your image!",
    "Video Diagnostics analyze your recordings to provide detailed technical reports.",
    "Not sure what's wrong? Just describe it - Scout understands everyday language.",
  ];

  const [currentTip] = useState(
    () => tips[Math.floor(Math.random() * tips.length)],
  );

  // Calculate remaining credits
  const chatRemaining = getRemainingCredits('chat');
  const photoRemaining = getRemainingCredits('photo');
  const isPaidTier = tier === 'home' || tier === 'pro';
  const isPhotoLocked = isFeatureLocked('photo') || photoRemaining === 0;
  const isSignalLocked = isFeatureLocked('signal');
  // Video diagnostic is locked for free/guest OR if no credits available
  const isVideoLocked = VIDEO_CREDIT_CONFIG[tier].limit === 0 && videoCredits.purchasedCredits === 0;
  const isDiagnosticLocked = isVideoLocked || !canUseVideoCredit();

  // Get video reset info for display
  const videoResetInfo = getVideoResetInfo();

  return (
    <div className={`${activeView === 'scout' ? 'h-screen overflow-hidden' : 'min-h-screen'} bg-light-50 dark:bg-midnight-950 transition-colors`}>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-midnight-900 border-r border-light-300 dark:border-midnight-700 z-50 transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-light-300 dark:border-midnight-700">
          <Logo variant="dark" className="dark:hidden" />
          <Logo variant="light" className="hidden dark:flex" />
        </div>

        {/* Usage Meter */}
        <div className="px-4 pt-4">
          <UsageMeter tier={tier} usage={usage} videoCredits={videoCredits} videoResetInfo={videoResetInfo} />
        </div>

        <nav className="p-4 space-y-1">
          <button
            onClick={() => {
              setSidebarOpen(false);
              if (activeView !== "main" && onBackToDashboard)
                onBackToDashboard();
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeView === "main"
                ? "bg-electric-indigo/20 text-electric-indigo font-medium"
                : "text-text-secondary hover:bg-light-100 dark:hover:bg-midnight-800 hover:text-text-primary dark:hover:text-white"
            }`}
          >
            <User className="w-5 h-5" />
            Dashboard
          </button>
          <button
            onClick={() => {
              setSidebarOpen(false);
              onStartChat();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-text-secondary hover:bg-light-100 dark:hover:bg-midnight-800 hover:text-text-primary dark:hover:text-white transition-colors"
          >
            <MessageSquare className="w-5 h-5" />
            Chat Support
          </button>
          {onOpenScout && (
            <button
              onClick={() => {
                setSidebarOpen(false);
                onOpenScout();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeView === "scout"
                  ? "bg-electric-indigo/20 text-electric-indigo font-medium"
                  : "text-text-secondary hover:bg-light-100 dark:hover:bg-midnight-800 hover:text-text-primary dark:hover:text-white"
              }`}
            >
              <Bot className="w-5 h-5" />
              Scout AI
            </button>
          )}
          <button
            onClick={() => {
              setSidebarOpen(false);
              onOpenHistory();
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeView === "history"
                ? "bg-electric-indigo/20 text-electric-indigo font-medium"
                : "text-text-secondary hover:bg-light-100 dark:hover:bg-midnight-800 hover:text-text-primary dark:hover:text-white"
            }`}
          >
            <History className="w-5 h-5" />
            Session History
          </button>
          {onOpenInventory && (
            <button
              onClick={() => {
                setSidebarOpen(false);
                onOpenInventory();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeView === "inventory"
                  ? "bg-electric-indigo/20 text-electric-indigo font-medium"
                  : "text-text-secondary hover:bg-light-100 dark:hover:bg-midnight-800 hover:text-text-primary dark:hover:text-white"
              }`}
            >
              <Package className="w-5 h-5" />
              Home Inventory
            </button>
          )}
          <button
            onClick={() => {
              setSidebarOpen(false);
              onOpenSettings();
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeView === "settings"
                ? "bg-electric-indigo/20 text-electric-indigo font-medium"
                : "text-text-secondary hover:bg-light-100 dark:hover:bg-midnight-800 hover:text-text-primary dark:hover:text-white"
            }`}
          >
            <Settings className="w-5 h-5" />
            Settings
          </button>
          {onOpenBilling && (
            <button
              onClick={() => {
                setSidebarOpen(false);
                onOpenBilling();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeView === "billing"
                  ? "bg-electric-indigo/20 text-electric-indigo font-medium"
                  : "text-text-secondary hover:bg-light-100 dark:hover:bg-midnight-800 hover:text-text-primary dark:hover:text-white"
              }`}
            >
              <CreditCard className="w-5 h-5" />
              Billing
            </button>
          )}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-light-300 dark:border-midnight-700">
          <button
            onClick={handleLogoutClick}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-text-secondary hover:bg-light-100 dark:hover:bg-midnight-800 hover:text-text-primary dark:hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className={`lg:ml-64 ${activeView === 'scout' ? 'h-screen flex flex-col' : ''}`}>
        {/* Top bar */}
        <header className="bg-white dark:bg-midnight-900 border-b border-light-300 dark:border-midnight-700 px-6 py-4 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-light-100 dark:hover:bg-midnight-800 rounded-lg text-text-primary dark:text-white"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="lg:hidden">
                <Logo variant="dark" className="dark:hidden" />
                <Logo variant="light" className="hidden dark:flex" />
              </div>
            </div>

            {/* Trial/Plan banner */}
            {trialInfo.isActive ? (
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-electric-indigo/20 rounded-full border border-electric-indigo/30">
                <Clock className="w-4 h-4 text-electric-cyan" />
                <span className="text-sm font-medium text-text-primary dark:text-white">
                  Trial: {trialInfo.remainingHours}h {trialInfo.remainingMinutes}m
                </span>
              </div>
            ) : tier === 'pro' ? (
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-scout-purple/20 rounded-full border border-scout-purple/30">
                <Zap className="w-4 h-4 text-scout-purple" />
                <span className="text-sm font-medium text-text-primary dark:text-white">Pro Plan</span>
              </div>
            ) : tier === 'home' ? (
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-electric-cyan/20 rounded-full border border-electric-cyan/30">
                <Zap className="w-4 h-4 text-electric-cyan" />
                <span className="text-sm font-medium text-text-primary dark:text-white">Home Plan</span>
              </div>
            ) : tier === 'free' ? (
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-light-100 dark:bg-midnight-800 rounded-full border border-light-300 dark:border-midnight-700">
                <span className="text-sm font-medium text-text-secondary">Free Plan</span>
              </div>
            ) : null}

            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-light-100 dark:hover:bg-midnight-800 transition-colors text-text-secondary hover:text-text-primary dark:hover:text-white"
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5" />
                )}
              </button>

              <div className="hidden sm:block text-right">
                <div className="text-sm font-medium text-text-primary dark:text-white">
                  {user.firstName} {user.lastName}
                </div>
                <div className="text-xs text-text-secondary">{user.email}</div>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-scout-purple to-electric-indigo rounded-full flex items-center justify-center text-white font-bold">
                {user.firstName.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* Main content area */}
        {children ? (
          <div className={activeView === 'scout' ? 'flex-1 overflow-hidden' : 'p-6 lg:p-8'}>{children}</div>
        ) : (
          <div className="p-6 lg:p-8 max-w-6xl mx-auto">
            {/* Welcome section */}
            <div className="mb-8">
              <h1 className="text-3xl lg:text-4xl font-black text-text-primary dark:text-white mb-2">
                Welcome, {user.firstName}!
              </h1>
              <p className="text-lg text-text-secondary">
                How can TotalAssist help you today? Choose an option below.
              </p>
            </div>

            {/* Scout AI Hero Banner */}
            {onOpenScout && activeView === "main" && (
              <div
                className="relative mb-8 group cursor-pointer"
                onClick={onOpenScout}
              >
                <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-scout-purple via-electric-indigo to-electric-cyan opacity-60 group-hover:opacity-100 blur-sm transition-opacity duration-500" />
                <div className="relative bg-white dark:bg-midnight-800 rounded-2xl p-6 sm:p-8 border border-light-300 dark:border-midnight-700 overflow-hidden">
                  {/* Background glow */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-scout-purple/10 to-transparent rounded-full -translate-y-1/3 translate-x-1/3 pointer-events-none" />

                  <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-scout-purple to-electric-indigo flex items-center justify-center shadow-lg shadow-scout-purple/25 flex-shrink-0">
                      <Bot className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl sm:text-2xl font-black text-text-primary dark:text-white mb-1">
                        Scout AI
                      </h2>
                      <p className="text-text-secondary text-sm sm:text-base">
                        Your AI-powered tech assistant — chat, voice, photo, or video
                      </p>
                    </div>
                    <button
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-scout-purple to-electric-indigo text-white font-semibold text-sm shadow-lg shadow-electric-indigo/25 hover:shadow-electric-indigo/40 hover:scale-[1.02] active:scale-[0.98] transition-all whitespace-nowrap"
                    >
                      Open Scout AI
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Main action cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <ActionCard
                icon={<MessageSquare className="w-7 h-7" />}
                title="Scout Chat"
                description="Describe your issue in plain English and get instant AI guidance."
                buttonText="Start Chatting"
                onClick={onStartChat}
                highlight
                badge={chatRemaining >= 999999 ? 'Unlimited' : chatRemaining}
                disabled={chatRemaining === 0}
              />
              <ActionCard
                icon={<Camera className="w-7 h-7" />}
                title="Scout Snapshot"
                description="Upload a photo of the problem for instant AI analysis."
                buttonText="Upload Image"
                onClick={onUploadImage}
                badge={isPaidTier ? 'Unlimited' : photoRemaining === 0 ? 'Used' : '1 Free'}
                disabled={isPhotoLocked && tier !== 'pro'}
                locked={isPhotoLocked && tier === 'free'}
                onLockedClick={() => handleLockedFeatureClick('photo')}
              />
              <ActionCard
                icon={<Mic className="w-7 h-7" />}
                title="Scout Voice"
                description="Describe your issue out loud. Scout turns it into a plan."
                buttonText="Start Voice"
                onClick={() => {
                  if (isSignalLocked) {
                    handleLockedFeatureClick('signal');
                  } else if (onStartSignal) {
                    onStartSignal();
                  }
                }}
                locked={isSignalLocked}
                onLockedClick={() => handleLockedFeatureClick('signal')}
                badge={!isSignalLocked ? 'Unlimited' : undefined}
              />
              <ActionCard
                icon={<ScanLine className="w-7 h-7" />}
                title="Live Video Support"
                description="Start a live video session with Scout for real-time diagnosis and guidance."
                buttonText={isDiagnosticLocked && !isVideoLocked ? "Buy Credit" : "Start Session"}
                onClick={handleStartDiagnostic}
                locked={isDiagnosticLocked}
                onLockedClick={() => handleLockedFeatureClick('videoDiagnostic')}
                badge={
                  isVideoLocked
                    ? undefined
                    : tier === 'home'
                      ? (canUseVideoCredit() ? '1 Credit' : `Resets in ${videoResetInfo.daysUntilReset}d`)
                      : `${videoCredits.subscriptionCredits + videoCredits.purchasedCredits}/15`
                }
              />
            </div>

            {/* Active/Recent Cases Section */}
            {cases.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-text-primary dark:text-white">Your Cases</h2>
                  <button
                    onClick={onOpenHistory}
                    className="text-sm text-electric-indigo font-medium hover:text-electric-cyan transition-colors"
                  >
                    View All
                  </button>
                </div>
                <div className="bg-white dark:bg-midnight-800 rounded-2xl border border-light-300 dark:border-midnight-700 overflow-hidden">
                  {cases.slice(0, 3).map((c) => (
                    <div
                      key={c.id}
                      className="p-4 border-b border-light-300 dark:border-midnight-700 last:border-0 hover:bg-light-100 dark:hover:bg-midnight-700/50 transition-colors flex items-center justify-between cursor-pointer"
                      onClick={onOpenHistory}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-electric-indigo/20 flex items-center justify-center text-electric-indigo">
                          <FolderOpen className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-text-primary dark:text-white">{c.title}</h4>
                          <div className="flex items-center gap-2 text-xs text-text-secondary">
                            <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                            <span>•</span>
                            <span className={`capitalize ${c.status === "open" ? "text-electric-cyan" : ""}`}>
                              {c.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-text-muted" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick tip */}
            <div className="mb-8">
              <h2 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-3">
                Quick Tip
              </h2>
              <QuickTip tip={currentTip} />
            </div>

            {/* How it works reminder */}
            <div className="bg-white dark:bg-midnight-800 rounded-2xl p-6 border border-light-300 dark:border-midnight-700">
              <h2 className="text-lg font-bold text-text-primary dark:text-white mb-4">How Scout Works</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-electric-indigo to-electric-cyan rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                    1
                  </div>
                  <div>
                    <div className="font-semibold text-text-primary dark:text-white">Describe or Show</div>
                    <div className="text-sm text-text-secondary">
                      Tell us what's wrong or upload a photo
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-electric-indigo to-electric-cyan rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                    2
                  </div>
                  <div>
                    <div className="font-semibold text-text-primary dark:text-white">Get Diagnosis</div>
                    <div className="text-sm text-text-secondary">
                      Scout AI analyzes and identifies the issue
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-electric-indigo to-electric-cyan rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                    3
                  </div>
                  <div>
                    <div className="font-semibold text-text-primary dark:text-white">Fix It</div>
                    <div className="text-sm text-text-secondary">
                      Follow step-by-step guidance to resolve
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Safety note */}
            <div className="mt-6 flex items-center gap-3 text-sm text-text-secondary">
              <Shield className="w-5 h-5 text-electric-cyan" />
              <span>
                Your data is encrypted and never shared. We prioritize your privacy and safety.
              </span>
            </div>
          </div>
        )}
      </main>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        feature={upgradeFeature}
        currentTier={tier as 'guest' | 'free' | 'home' | 'pro'}
      />

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-light-100/90 dark:bg-midnight-950/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-midnight-800 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-light-300 dark:border-midnight-700">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-primary dark:text-white">Sign Out?</h3>
                <p className="text-sm text-text-secondary">
                  Are you sure you want to sign out?
                </p>
              </div>
            </div>
            <p className="text-text-secondary mb-6">
              Your session history and settings will be saved for when you return.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-3 border border-light-300 dark:border-midnight-600 rounded-xl font-semibold text-text-primary dark:text-white hover:bg-light-100 dark:hover:bg-midnight-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 px-4 py-3 btn-gradient-electric text-white rounded-xl font-semibold transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
