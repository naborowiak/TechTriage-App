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
  ArrowRight,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useUsage, UNLIMITED } from "../stores/usageStore";
import { UpgradeModal } from "./UpgradeModal";
import { SystemStatusBadge } from "./dashboard/SystemStatusBadge";
import { MobileBottomDock } from "./dashboard/MobileBottomDock";
import { CurrentCaseCard } from "./dashboard/CurrentCaseCard";
import { HistoryList } from "./dashboard/HistoryList";
import { DashboardSidebar } from "./dashboard/DashboardSidebar";
import { SessionHistoryView } from "./dashboard/SessionHistoryView";
import { DevicesView } from "./dashboard/DevicesView";
import { useCaseProgress } from "../hooks/useCaseProgress";
import type { DashboardTab } from "../types";

interface DashboardProps {
  user: {
    id?: string;
    firstName: string;
    lastName?: string;
    email: string;
    profileImageUrl?: string | null;
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
  onNavigateToPricing?: () => void;
  activeView?: "main" | "history" | "scout" | "analytics" | "devices";
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
  sessionMode?: string | null;
  modeSequence?: number | null;
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
  onNavigateToPricing,
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
  const { tier, usage } = useUsage();

  // Sidebar tab state — maps from activeView or standalone
  const [sidebarTab, setSidebarTab] = useState<DashboardTab>("chat");

  // Sync sidebarTab from activeView when it changes
  useEffect(() => {
    if (activeView === "history") setSidebarTab("history");
    else if (activeView === "scout") { /* don't reset — let sidebar keep its state */ }
    else if (activeView === "main") setSidebarTab("chat");
  }, [activeView]);

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

  // Handle sidebar tab changes
  const handleSidebarTabChange = (tab: DashboardTab) => {
    setSidebarTab(tab);
    if (tab === "chat") {
      if (onBackToDashboard) onBackToDashboard();
    } else if (tab === "history") {
      onOpenHistory();
    } else if (tab === "devices") {
      // Show inline
    } else if (tab === "settings") {
      onOpenSettings();
    }
  };

  // Handle dock tab changes (mobile)
  const handleDockTabChange = (tab: DashboardTab) => {
    setSidebarTab(tab);
    if (tab === "chat") {
      if (onBackToDashboard) onBackToDashboard();
    } else if (tab === "history") {
      onOpenHistory();
    } else if (tab === "devices") {
      // Show inline
    } else if (tab === "settings") {
      onOpenSettings();
    }
  };

  // Triage tiles config — clean cards
  const triageTiles = [
    {
      id: "text" as const,
      icon: MessageSquare,
      label: "Type a Question",
      description: "Get text-based support",
      lockedForTiers: [] as string[],
      action: () => {
        if (onOpenScout) onOpenScout();
      },
      feature: "chat" as const,
      iconColor: "text-[#06B6D4]",
      backgroundImage: "/type_question.jpg",
    },
    {
      id: "photo" as const,
      icon: Camera,
      label: "Snap a Photo",
      description: "Send a picture of the issue",
      lockedForTiers: [] as string[],
      action: () => {
        if (onOpenScoutWithMode) onOpenScoutWithMode("photo");
        else if (onOpenScout) onOpenScout();
      },
      feature: "photo" as const,
      iconColor: "text-electric-indigo",
      backgroundImage: "/show_problem.jpg",
    },
    {
      id: "voice" as const,
      icon: Mic,
      label: "Talk to Support",
      description: "Call a TotalAssist expert",
      lockedForTiers: ["guest", "free"],
      action: () => {
        if (onOpenScoutWithMode) onOpenScoutWithMode("voice");
        else if (onOpenScout) onOpenScout();
      },
      feature: "signal" as const,
      iconColor: "text-[#8B5CF6]",
      backgroundImage: "/talk_support.jpeg",
    },
    {
      id: "video" as const,
      icon: Video,
      label: "Live Video Support",
      description: "Real-time video session with an expert",
      lockedForTiers: ["guest", "free"],
      action: () => {
        if (onOpenScoutWithMode) onOpenScoutWithMode("video");
        else if (onOpenScout) onOpenScout();
      },
      feature: "videoDiagnostic" as const,
      iconColor: "text-scout-purple",
      backgroundImage: "/video_support.png",
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

  // Determine what the main content area shows
  const showSidebarContent = !children && !isScoutView;
  const showChatHome = showSidebarContent && sidebarTab === "chat" && activeView === "main";
  const showHistory = showSidebarContent && sidebarTab === "history";
  const showDevices = showSidebarContent && sidebarTab === "devices";

  return (
    <div className="h-screen-safe overflow-hidden bg-light-50 dark:bg-midnight-950 transition-colors flex relative">
      {/* Desktop Sidebar */}
      <DashboardSidebar
        activeTab={isScoutView ? "chat" : sidebarTab}
        onTabChange={handleSidebarTabChange}
        onLogout={() => setShowLogoutConfirm(true)}
        showUpgrade={tier !== "home" && tier !== "pro"}
        onUpgrade={() => setUpgradeModalOpen(true)}
        user={user}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Slim Header */}
        <header className="relative bg-white/80 dark:bg-midnight-900/80 backdrop-blur-md border-b border-surface-border dark:border-midnight-700 px-4 py-3 flex items-center justify-between shrink-0 z-30">
          {/* Left: Logo (mobile only) + Status */}
          <div className="flex items-center gap-3">
            <div className="lg:hidden flex items-center gap-2">
              <img src="/total_assist-new.png" alt="TotalAssist" className="w-7 h-7 object-contain" />
              <span className="text-sm font-bold text-text-primary dark:text-white tracking-tight">
                Total<span className="text-electric-indigo">Assist</span>
              </span>
            </div>
            <SystemStatusBadge />
          </div>

          {/* Right: Upgrade + Theme + Avatar */}
          <div className="flex items-center gap-2">
            {tier !== "home" && tier !== "pro" && (
              <button
                onClick={() => setUpgradeModalOpen(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold btn-gradient-electric text-white"
              >
                <Zap className="w-3 h-3" />
                Upgrade to Home
              </button>
            )}
            {/* Credit pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-light-100 dark:bg-midnight-800 border border-surface-border dark:border-midnight-700 text-xs font-medium text-text-secondary dark:text-white/70" aria-label="Credits remaining">
              <MessageSquare className="w-3 h-3" />
              {usage.chat.limit >= UNLIMITED ? (
                <span className="text-green-600 dark:text-green-400 font-semibold">Unlimited</span>
              ) : (
                <span>{Math.max(0, usage.chat.limit - usage.chat.used)}/{usage.chat.limit} chats</span>
              )}
            </div>
            <button
              onClick={toggleTheme}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-light-100 dark:hover:bg-midnight-800 transition-colors text-text-secondary hover:text-text-primary dark:hover:text-white"
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              {theme === "light" ? (
                <Moon className="w-[18px] h-[18px]" />
              ) : (
                <Sun className="w-[18px] h-[18px]" />
              )}
            </button>

            {/* Avatar with dropdown */}
            <div ref={userMenuRef} className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:ring-2 hover:ring-electric-indigo/30 transition-all overflow-hidden"
                aria-label="User menu"
              >
                {user.profileImageUrl ? (
                  <img src={user.profileImageUrl} alt={user.firstName} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 bg-electric-indigo rounded-full flex items-center justify-center text-white font-bold text-xs">
                    {user.firstName.charAt(0)}
                  </div>
                )}
              </button>

              {showUserMenu && (
                <div className="absolute top-full right-0 mt-2 w-56 card-clean rounded-lg shadow-clean-lg z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-light-200 dark:border-midnight-700">
                    <div className="text-sm font-semibold text-text-primary dark:text-white truncate">
                      {user.firstName} {user.lastName || ""}
                    </div>
                    <div className="text-xs text-text-secondary dark:text-white/60 truncate">
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
        ) : showHistory ? (
          <SessionHistoryView
            onOpenCase={(id) => onOpenCase?.(id)}
            userId={user.id}
            userEmail={user.email}
          />
        ) : showDevices ? (
          <DevicesView
            onOpenCase={(id) => onOpenCase?.(id)}
            userId={user.id}
          />
        ) : showChatHome ? (
          <div className="flex-1 overflow-y-auto pb-4 lg:pb-8 relative">
            <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-5 space-y-6">
              {/* Heading */}
              <h1 className="text-xl sm:text-2xl md:text-4xl font-bold tracking-tight text-text-primary dark:text-white">
                How can we assist you today?
              </h1>

              {/* Triage Tiles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
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
                      className={[
                        "card-clean relative flex flex-col justify-end text-left",
                        "rounded-lg overflow-hidden cursor-pointer",
                        "p-4 md:p-6",
                        "min-h-[72px] md:min-h-0 md:aspect-[16/10] md:max-h-[260px]",
                        "transition-all duration-200",
                        isLocked
                          ? "opacity-75 cursor-pointer"
                          : "hover:-translate-y-[1px] active:scale-[0.98]",
                      ].join(" ")}
                      aria-label={`${tile.label}${isLocked ? " — requires upgrade" : ""}`}
                    >
                      {/* Photo background — desktop only */}
                      <div
                        className="hidden md:block absolute inset-0 rounded-lg overflow-hidden pointer-events-none"
                        aria-hidden="true"
                      >
                        <div
                          className="absolute inset-0 bg-cover bg-center"
                          style={{ backgroundImage: `url(${tile.backgroundImage})` }}
                        />
                      </div>
                      <div
                        className="hidden md:block absolute inset-0 rounded-lg bg-gradient-to-b from-black/10 via-black/40 to-black/70 pointer-events-none"
                        aria-hidden="true"
                      />

                      {/* Lock badge pill (locked tiles) */}
                      {isLocked && (
                        <div
                          className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-surface-100 dark:bg-midnight-700 border border-surface-border dark:border-midnight-700 px-2.5 py-1"
                          aria-hidden="true"
                        >
                          <Lock className="w-3 h-3 text-text-secondary dark:text-white/80" />
                          <span className="text-xs font-semibold text-text-secondary dark:text-white/80">
                            Home+
                          </span>
                        </div>
                      )}

                      {/* Content */}
                      <div className="relative z-10 flex items-center gap-3 w-full">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-electric-indigo/[0.08] rounded-lg flex items-center justify-center shrink-0">
                          <Icon className={`w-5 h-5 md:w-6 md:h-6 ${tile.iconColor}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm md:text-lg font-bold leading-tight truncate text-text-primary dark:text-white md:text-white">
                            {tile.label}
                          </h3>
                          <p className="text-sm md:text-sm mt-0.5 md:mt-1 line-clamp-2 text-text-secondary dark:text-white/70 md:text-white/70">
                            {isLocked ? "Requires Home or Pro plan" : tile.description}
                          </p>
                        </div>
                      </div>

                      {/* Upgrade CTA (locked tiles) */}
                      {isLocked && (
                        <div className="relative z-10 mt-2 flex items-center gap-1 text-sm font-semibold text-electric-indigo dark:text-white/80">
                          Upgrade to unlock
                          <ArrowRight className="w-3 h-3" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Common Issues */}
              <div>
                <h3 className="text-sm font-semibold text-text-secondary dark:text-white/80 mb-2.5">
                  Common Issues
                </h3>
                {/* Desktop: show all chips */}
                <div className="hidden sm:flex flex-wrap gap-2">
                  {commonIssues.map((chip) => (
                    <button
                      key={chip}
                      onClick={() => onNewChat?.(chip)}
                      className="px-4 py-2 rounded-full bg-white dark:bg-midnight-800 border border-surface-border dark:border-midnight-700 text-text-primary dark:text-white text-sm font-medium hover:border-electric-indigo/30 hover:shadow-sm active:scale-[0.97] transition-all min-h-[44px]"
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
                          className="px-4 py-2 rounded-full bg-white dark:bg-midnight-800 border border-surface-border dark:border-midnight-700 text-text-primary dark:text-white text-sm font-medium active:scale-[0.97] transition-all min-h-[44px]"
                        >
                          {chip}
                        </button>
                      ),
                    )}
                    {!showChips && (
                      <button
                        onClick={() => setShowChips(true)}
                        className="px-4 py-2 rounded-full border border-electric-indigo/25 text-electric-indigo dark:text-electric-cyan text-sm font-medium hover:bg-electric-indigo/10 hover:border-electric-indigo/40 transition-all min-h-[44px]"
                      >
                        Show more
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Text Input */}
              <div className="relative w-full bg-white dark:bg-midnight-800 border border-surface-border dark:border-midnight-700 rounded-lg px-4 py-3 flex items-center gap-2 shadow-sm focus-within:border-electric-indigo focus-within:ring-2 focus-within:ring-electric-indigo/10 transition-all">
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
                  className="p-3 rounded-lg btn-gradient-electric text-white disabled:opacity-30 disabled:cursor-not-allowed min-w-[44px] min-h-[44px] flex items-center justify-center"
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
                onViewAll={() => onOpenHistory()}
                userEmail={user?.email}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 lg:p-8">
            {/* Fallback for other activeViews with children (analytics, etc.) */}
          </div>
        )}

        {/* Mobile Bottom Dock */}
        {!isScoutView && (
          <MobileBottomDock
            activeTab={isScoutView ? "chat" : sidebarTab}
            onTabChange={handleDockTabChange}
          />
        )}
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        feature={upgradeFeature}
        currentTier={tier as "guest" | "free" | "home" | "pro"}
        onNavigateToPricing={onNavigateToPricing}
      />

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-light-100/90 dark:bg-midnight-950/90 z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-midnight-800 rounded-lg p-6 max-w-md w-full shadow-2xl border border-surface-border dark:border-midnight-700">
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
