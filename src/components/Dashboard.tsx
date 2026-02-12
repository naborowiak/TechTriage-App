import React, { useState, useEffect, useRef } from "react";
import {
  Settings,
  LogOut,
  AlertTriangle,
  CreditCard,
  Zap,
  Sun,
  Moon,
  Package,
  ChevronUp,
  Camera,
  Mic,
  Video,
  HelpCircle,
  MessageSquare,
  Lock,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useUsage } from "../stores/usageStore";
import { UpgradeModal } from "./UpgradeModal";
import { SystemStatusBadge } from "./dashboard/SystemStatusBadge";
import { MobileBottomDock } from "./dashboard/MobileBottomDock";
import { CurrentCaseCard } from "./dashboard/CurrentCaseCard";
import { HistoryList } from "./dashboard/HistoryList";
import { useCaseProgress } from "../hooks/useCaseProgress";
import type { DashboardTab } from "../types";

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
  onStartSignal?: () => void;
  onOpenScout?: () => void;
  onLogout: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  onOpenBilling?: () => void;
  onOpenInventory?: () => void;
  onBackToDashboard?: () => void;
  onNewChat?: (message: string) => void;
  onOpenCase?: (caseId: string) => void;
  onOpenScoutWithMode?: (mode: "photo" | "voice" | "video") => void;
  onOpenAnalytics?: () => void;
  activeView?: "main" | "history" | "scout" | "analytics";
  children?: React.ReactNode;
  onUpdateUser?: (user: {
    firstName: string;
    lastName?: string;
    email: string;
  }) => void;
}

interface Case {
  id: string;
  caseNumber?: number | null;
  title: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  aiSummary?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  onStartChat: _onStartChat,
  onOpenScout,
  onLogout,
  onOpenHistory,
  onOpenSettings,
  onOpenBilling,
  onOpenInventory,
  onBackToDashboard,
  onNewChat,
  onOpenCase,
  onOpenScoutWithMode,
  activeView = "main",
  children,
}) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [cases, setCases] = useState<Case[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<
    "chat" | "photo" | "signal" | "videoDiagnostic"
  >("chat");
  const [showChips, setShowChips] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useTheme();
  const { tier } = useUsage();

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    onLogout();
  };

  // Fetch cases
  useEffect(() => {
    if (user?.id) {
      fetch("/api/cases", { credentials: "include" })
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error("Failed to fetch");
        })
        .then((data) => {
          if (Array.isArray(data)) {
            setCases(data.slice(0, 50));
          }
        })
        .catch((err) => console.error("Failed to load cases:", err));
    }
  }, [user?.id, activeView]);

  // Listen for real-time case creation
  useEffect(() => {
    const handler = (e: Event) => {
      const newCase = (e as CustomEvent).detail;
      if (newCase?.id) {
        setCases((prev) => {
          if (prev.some((c) => c.id === newCase.id)) return prev;
          return [newCase, ...prev];
        });
      }
    };
    window.addEventListener("case-created", handler);
    return () => window.removeEventListener("case-created", handler);
  }, []);

  // Click-outside for user menu
  useEffect(() => {
    if (!showUserMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showUserMenu]);

  // Handle text input submission
  const handleSendFromEmpty = () => {
    const text = chatInput.trim();
    if (!text) return;
    if (onNewChat) {
      onNewChat(text);
    } else if (onOpenScout) {
      onOpenScout();
    }
    setChatInput("");
  };

  // Derive current case and history
  const currentOpenCase = cases.find((c) => c.status === "open") || null;
  const { steps: caseProgressSteps, isLoading: progressLoading } =
    useCaseProgress(currentOpenCase?.id || null);

  const isScoutView = activeView === "scout";

  // Map activeView to dock tab
  const activeDockTab: DashboardTab =
    activeView === "history"
      ? "history"
      : activeView === "scout"
        ? "new"
        : "home";

  const handleDockTabChange = (tab: DashboardTab) => {
    if (tab === "home") {
      if (onBackToDashboard) onBackToDashboard();
    } else if (tab === "new") {
      if (onOpenScout) onOpenScout();
    } else if (tab === "history") {
      onOpenHistory();
    } else if (tab === "settings") {
      onOpenSettings();
    }
  };

  // Triage tiles config
  const triageTiles = [
    {
      id: "text" as const,
      icon: MessageSquare,
      label: "Type a Question",
      description: "Chat with our support agent",
      lockedForTiers: [] as string[],
      action: () => {
        if (onOpenScout) onOpenScout();
      },
      feature: "chat" as const,
      lightBg: "bg-gradient-to-br from-sky-50 to-cyan-50",
      darkBg: "from-[#0f1a24] via-[#132030] to-[#0d1820]",
      iconColor: "text-[#06B6D4]",
      iconBg: "bg-[#06B6D4]/15 dark:bg-[#06B6D4]/20",
      glowColor: "rgba(6,182,212,0.15)",
      accentGradient: "from-[#06B6D4]/20 to-transparent",
    },
    {
      id: "photo" as const,
      icon: Camera,
      label: "Show the Problem",
      description: "Take or upload a photo for analysis",
      lockedForTiers: [] as string[],
      action: () => {
        if (onOpenScoutWithMode) onOpenScoutWithMode("photo");
        else if (onOpenScout) onOpenScout();
      },
      feature: "photo" as const,
      lightBg: "bg-gradient-to-br from-indigo-50 to-violet-50",
      darkBg: "from-[#131024] via-[#1a1530] to-[#0f0d1e]",
      iconColor: "text-electric-indigo",
      iconBg: "bg-electric-indigo/15 dark:bg-electric-indigo/20",
      glowColor: "rgba(99,102,241,0.15)",
      accentGradient: "from-electric-indigo/20 to-transparent",
    },
    {
      id: "voice" as const,
      icon: Mic,
      label: "Talk to Support",
      description: "Hands-free help, like a phone call",
      lockedForTiers: ["guest", "free"],
      action: () => {
        if (onOpenScoutWithMode) onOpenScoutWithMode("voice");
        else if (onOpenScout) onOpenScout();
      },
      feature: "signal" as const,
      lightBg: "bg-gradient-to-br from-violet-50 to-purple-50",
      darkBg: "from-[#150f28] via-[#1d1535] to-[#110d20]",
      iconColor: "text-[#8B5CF6]",
      iconBg: "bg-[#8B5CF6]/15 dark:bg-[#8B5CF6]/20",
      glowColor: "rgba(139,92,246,0.15)",
      accentGradient: "from-[#8B5CF6]/20 to-transparent",
    },
    {
      id: "video" as const,
      icon: Video,
      label: "Show Me on Camera",
      description: "Point your camera at the issue",
      lockedForTiers: ["guest", "free"],
      action: () => {
        if (onOpenScoutWithMode) onOpenScoutWithMode("video");
        else if (onOpenScout) onOpenScout();
      },
      feature: "videoDiagnostic" as const,
      lightBg: "bg-gradient-to-br from-fuchsia-50 to-pink-50",
      darkBg: "from-[#1a0f28] via-[#221535] to-[#150d22]",
      iconColor: "text-scout-purple",
      iconBg: "bg-scout-purple/15 dark:bg-scout-purple/20",
      glowColor: "rgba(168,85,247,0.15)",
      accentGradient: "from-scout-purple/20 to-transparent",
    },
  ];

  const commonIssues = [
    "Wi-Fi not working",
    "Printer won't print",
    "Slow internet",
    "Smart device setup",
    "Error on my screen",
    "TV won't connect",
  ];

  return (
    <div className="h-screen-safe overflow-hidden bg-light-50 dark:bg-midnight-950 transition-colors flex flex-col">
      {/* Header */}
      <header className="bg-white/80 dark:bg-midnight-900/80 backdrop-blur-xl border-b border-light-300/60 dark:border-white/[0.06] px-4 py-3 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 bg-gradient-to-br from-electric-indigo to-scout-purple rounded-lg flex items-center justify-center shadow-md shadow-electric-indigo/20">
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/20 to-transparent" />
            <span className="relative text-white font-bold text-xs">TA</span>
          </div>
          <span className="text-sm font-bold text-text-primary dark:text-white tracking-tight">
            TotalAssist
          </span>
        </div>

        <div className="flex items-center gap-2">
          {tier !== "pro" && (
            <button
              onClick={() => setUpgradeModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-scout-purple to-electric-indigo text-white hover:opacity-90 transition-opacity"
            >
              <Zap className="w-3 h-3" />
              Upgrade
            </button>
          )}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-light-100 dark:hover:bg-midnight-800 transition-colors text-text-secondary hover:text-text-primary dark:hover:text-white"
            title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4" />
            )}
          </button>

          {/* Avatar with dropdown */}
          <div ref={userMenuRef} className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-8 h-8 bg-gradient-to-br from-scout-purple to-electric-indigo rounded-full flex items-center justify-center text-white font-bold text-xs hover:ring-2 hover:ring-electric-indigo/30 transition-all"
              aria-label="User menu"
            >
              {user.firstName.charAt(0)}
            </button>

            {showUserMenu && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-midnight-800 border border-light-300 dark:border-midnight-700 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-light-200 dark:border-midnight-700">
                  <div className="text-sm font-semibold text-text-primary dark:text-white truncate">
                    {user.firstName} {user.lastName || ""}
                  </div>
                  <div className="text-xs text-text-muted truncate">
                    {user.email}
                  </div>
                </div>
                <div className="py-1">
                  {tier !== "pro" && (
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        setUpgradeModalOpen(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary dark:text-white hover:bg-light-100 dark:hover:bg-midnight-700 transition-colors"
                    >
                      <Zap className="w-4 h-4 text-electric-indigo" />
                      Upgrade plan
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenSettings();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary dark:text-white hover:bg-light-100 dark:hover:bg-midnight-700 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-text-muted" />
                    Settings
                  </button>
                  {onOpenBilling && (
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenBilling();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary dark:text-white hover:bg-light-100 dark:hover:bg-midnight-700 transition-colors"
                    >
                      <CreditCard className="w-4 h-4 text-text-muted" />
                      Billing
                    </button>
                  )}
                  {onOpenInventory && (
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenInventory();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary dark:text-white hover:bg-light-100 dark:hover:bg-midnight-700 transition-colors"
                    >
                      <Package className="w-4 h-4 text-text-muted" />
                      Home Inventory
                    </button>
                  )}
                </div>
                <div className="border-t border-light-200 dark:border-midnight-700 py-1">
                  <a
                    href="mailto:support@totalassist.tech"
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary dark:text-white hover:bg-light-100 dark:hover:bg-midnight-700 transition-colors"
                  >
                    <HelpCircle className="w-4 h-4 text-text-muted" />
                    Help
                  </a>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      setShowLogoutConfirm(true);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Log out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Content area */}
      {children ? (
        <div
          className={
            isScoutView
              ? "flex-1 overflow-hidden"
              : "flex-1 overflow-y-auto p-6 lg:p-8"
          }
        >
          {children}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto dashboard-mesh-bg pb-20 lg:pb-8 relative">
          {/* Ambient decorative orbs */}
          <div className="gradient-orb w-64 h-64 -top-20 -left-20" style={{ background: "radial-gradient(circle, rgba(99,102,241,0.3), transparent 70%)" }} />
          <div className="gradient-orb w-48 h-48 top-40 -right-16" style={{ background: "radial-gradient(circle, rgba(6,182,212,0.2), transparent 70%)" }} />
          <div className="gradient-orb w-56 h-56 bottom-20 left-1/3" style={{ background: "radial-gradient(circle, rgba(168,85,247,0.15), transparent 70%)" }} />

          <div className="relative w-full max-w-4xl mx-auto px-4 sm:px-6 py-5 space-y-6">
            {/* System Status */}
            <SystemStatusBadge />

            {/* Triage Tiles */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {triageTiles.map((tile) => {
                const Icon = tile.icon;
                const isLocked = tile.lockedForTiers.includes(tier);

                return (
                  <button
                    key={tile.id}
                    onClick={() => {
                      if (isLocked) {
                        setUpgradeFeature(tile.feature);
                        setUpgradeModalOpen(true);
                      } else {
                        tile.action();
                      }
                    }}
                    className={`
                      tile-card flex flex-col items-start text-left
                      rounded-2xl p-4 sm:p-5 min-h-[120px] sm:min-h-[140px]
                      transition-all duration-200
                      ${
                        isLocked
                          ? "bg-light-200/80 dark:bg-midnight-800/50 opacity-60 cursor-not-allowed"
                          : `${tile.lightBg} dark:bg-gradient-to-br dark:${tile.darkBg} hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg`
                      }
                      border border-light-300/40 dark:border-white/[0.06]
                    `}
                    style={!isLocked ? { "--tile-glow": tile.glowColor } as React.CSSProperties : undefined}
                    aria-label={`${tile.label}${isLocked ? " — requires upgrade" : ""}`}
                  >
                    {/* Decorative gradient wave at top */}
                    {!isLocked && (
                      <div className={`absolute top-0 left-0 right-0 h-16 bg-gradient-to-b ${tile.accentGradient} rounded-t-2xl pointer-events-none`} />
                    )}
                    {isLocked && (
                      <div
                        className="absolute top-3 right-3 w-6 h-6 rounded-full bg-midnight-900/60 dark:bg-midnight-700/80 flex items-center justify-center backdrop-blur-sm"
                        aria-hidden="true"
                      >
                        <Lock className="w-3 h-3 text-white/60" />
                      </div>
                    )}
                    <div
                      className={`icon-glow w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                        isLocked
                          ? "bg-light-300 dark:bg-midnight-700"
                          : tile.iconBg
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${isLocked ? "text-text-muted" : tile.iconColor}`}
                      />
                    </div>
                    <span
                      className={`text-sm sm:text-base font-bold leading-tight ${
                        isLocked
                          ? "text-text-muted"
                          : "text-text-primary dark:text-white"
                      }`}
                    >
                      {tile.label}
                    </span>
                    <span className="text-xs text-text-muted mt-1 line-clamp-2">
                      {isLocked
                        ? "Requires Home or Pro plan"
                        : tile.description}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Common Issues */}
            <div>
              <h3 className="text-sm font-semibold text-text-secondary dark:text-text-muted mb-2.5">
                Common Issues
              </h3>
              {/* Desktop: show all chips */}
              <div className="hidden sm:flex flex-wrap gap-2">
                {commonIssues.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => onNewChat?.(chip)}
                    className="px-4 py-2 rounded-full bg-white/70 dark:bg-midnight-800/70 border border-light-300/60 dark:border-white/[0.06] text-text-primary dark:text-white text-sm font-medium hover:bg-white dark:hover:bg-midnight-700 hover:border-electric-indigo/30 hover:shadow-sm active:scale-[0.97] transition-all min-h-[36px] backdrop-blur-sm"
                  >
                    {chip}
                  </button>
                ))}
              </div>
              {/* Mobile: show first 3 + "Show more" */}
              <div className="sm:hidden">
                <div className="flex flex-wrap gap-2">
                  {(showChips ? commonIssues : commonIssues.slice(0, 3)).map(
                    (chip) => (
                      <button
                        key={chip}
                        onClick={() => onNewChat?.(chip)}
                        className="px-4 py-2 rounded-full bg-white/70 dark:bg-midnight-800/70 border border-light-300/60 dark:border-white/[0.06] text-text-primary dark:text-white text-sm font-medium hover:bg-white dark:hover:bg-midnight-700 active:scale-[0.97] transition-all min-h-[36px] backdrop-blur-sm"
                      >
                        {chip}
                      </button>
                    ),
                  )}
                  {!showChips && (
                    <button
                      onClick={() => setShowChips(true)}
                      className="px-4 py-2 rounded-full border border-electric-indigo/25 text-electric-indigo text-sm font-medium hover:bg-electric-indigo/10 hover:border-electric-indigo/40 transition-all min-h-[36px]"
                    >
                      Show more
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Text Input */}
            <div className="relative w-full glass-card rounded-2xl px-4 py-3 flex items-center gap-2 shadow-sm focus-within:border-electric-indigo/40 focus-within:ring-2 focus-within:ring-electric-indigo/15 transition-all">
              <input
                ref={inputRef}
                type="text"
                placeholder="Or type your question here..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && handleSendFromEmpty()
                }
                className="flex-1 bg-transparent outline-none text-base text-text-primary dark:text-white placeholder:text-text-muted min-h-[44px]"
              />
              <button
                onClick={handleSendFromEmpty}
                disabled={!chatInput.trim()}
                className="p-3 rounded-full bg-gradient-to-br from-electric-indigo to-scout-purple text-white disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-electric-indigo/25 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Send message"
              >
                <ChevronUp className="w-5 h-5" />
              </button>
            </div>

            {/* Current Case */}
            {currentOpenCase && (
              <CurrentCaseCard
                caseRecord={currentOpenCase}
                steps={caseProgressSteps}
                onOpenCase={(id) => onOpenCase?.(id)}
                isLoading={progressLoading}
              />
            )}

            {/* History */}
            <HistoryList
              cases={cases}
              onOpenCase={(id) => onOpenCase?.(id)}
              onViewAll={onOpenHistory}
              userEmail={user?.email}
            />
          </div>
        </div>
      )}

      {/* Mobile Bottom Dock */}
      {!isScoutView && (
        <MobileBottomDock
          activeTab={activeDockTab}
          onTabChange={handleDockTabChange}
        />
      )}

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        feature={upgradeFeature}
        currentTier={tier as "guest" | "free" | "home" | "pro"}
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
                <h3 className="text-lg font-bold text-text-primary dark:text-white">
                  Sign Out?
                </h3>
                <p className="text-sm text-text-secondary">
                  Are you sure you want to sign out?
                </p>
              </div>
            </div>
            <p className="text-text-secondary mb-6">
              Your session history and settings will be saved for when you
              return.
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
