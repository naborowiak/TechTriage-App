import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Settings,
  LogOut,
  AlertTriangle,
  CreditCard,
  Zap,
  Sun,
  Moon,
  Package,
  PanelLeft,
  Plus,
  ChevronUp,
  Camera,
  Mic,
  Video,
  HelpCircle,
  BarChart3,
  MessageSquare,
  Lock,
  ArrowRight,
  Clock,
  X,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useSubscription } from "../hooks/useSubscription";
import { useUsage } from "../stores/usageStore";
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
  onOpenScoutWithMode?: (mode: 'photo' | 'voice' | 'video') => void;
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

// Group cases by date buckets
const groupCasesByDate = (cases: Case[]) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const lastWeek = new Date(today.getTime() - 7 * 86400000);
  const lastMonth = new Date(today.getTime() - 30 * 86400000);

  const groups: { label: string; cases: Case[] }[] = [
    { label: "Today", cases: [] },
    { label: "Yesterday", cases: [] },
    { label: "Previous 7 days", cases: [] },
    { label: "Previous 30 days", cases: [] },
    { label: "Older", cases: [] },
  ];

  cases.forEach((c) => {
    const date = new Date(c.updatedAt || c.createdAt);
    if (date >= today) groups[0].cases.push(c);
    else if (date >= yesterday) groups[1].cases.push(c);
    else if (date >= lastWeek) groups[2].cases.push(c);
    else if (date >= lastMonth) groups[3].cases.push(c);
    else groups[4].cases.push(c);
  });

  return groups.filter((g) => g.cases.length > 0);
};

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
  onOpenAnalytics,
  activeView = "main",
  children,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [cases, setCases] = useState<Case[]>([]);
  const [caseSearch, setCaseSearch] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<'chat' | 'photo' | 'signal' | 'videoDiagnostic'>('chat');
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null);
  const [welcomeDismissed, setWelcomeDismissed] = useState(
    () => localStorage.getItem('ta_welcome_dismissed') === 'true'
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useTheme();

  // Usage store
  const { tier } = useUsage();

  // Subscription
  const { videoCredits, startCheckout } = useSubscription(user.id);

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    onLogout();
  };

  // Fetch Cases (re-fetch when view changes so sidebar stays fresh after chatting)
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

  // Listen for real-time case creation from ScoutChatScreen
  useEffect(() => {
    const handler = (e: Event) => {
      const newCase = (e as CustomEvent).detail;
      if (newCase?.id) {
        setCases(prev => {
          // Avoid duplicates
          if (prev.some(c => c.id === newCase.id)) return prev;
          return [newCase, ...prev];
        });
      }
    };
    window.addEventListener('case-created', handler);
    return () => window.removeEventListener('case-created', handler);
  }, []);

  // Click-outside detection for popup menus
  useEffect(() => {
    if (!showUserMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (showUserMenu && userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  // Handle sending initial message from empty state
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

  // Filter cases for sidebar
  const filteredCases = caseSearch
    ? cases.filter(
        (c) =>
          c.title.toLowerCase().includes(caseSearch.toLowerCase()) ||
          (c.aiSummary || "").toLowerCase().includes(caseSearch.toLowerCase())
      )
    : cases;

  const groupedCases = groupCasesByDate(filteredCases);

  // Tier badge
  const getTierLabel = () => {
    if (tier === "pro") return "Pro";
    if (tier === "home") return "Home";
    return "Free";
  };

  const isScoutView = activeView === "scout";

  return (
    <div
      className={`${isScoutView ? 'h-screen overflow-hidden' : 'h-screen overflow-hidden'} bg-light-50 dark:bg-midnight-950 transition-colors flex`}
      onTouchStart={(e) => {
        touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }}
      onTouchEnd={(e) => {
        if (!touchStartRef.current) return;
        const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
        const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;
        // Only trigger if horizontal swipe is dominant
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 80) {
          if (deltaX > 0 && touchStartRef.current.x < 30 && !sidebarMobileOpen) {
            setSidebarMobileOpen(true);
          } else if (deltaX < 0 && sidebarMobileOpen) {
            setSidebarMobileOpen(false);
          }
        }
        touchStartRef.current = null;
      }}
    >
      {/* Mobile sidebar overlay */}
      {sidebarMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:relative top-0 left-0 h-full bg-white dark:bg-midnight-900 border-r border-light-300 dark:border-midnight-700 z-50 flex flex-col transition-all duration-300 ${
          sidebarMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${sidebarOpen ? "w-[260px]" : "w-0 lg:w-0 overflow-hidden border-r-0"}`}
      >
        {/* Sidebar top: New Chat + Search */}
        <div className="p-3 space-y-2 shrink-0">
          <button
            onClick={() => {
              setSidebarMobileOpen(false);
              if (activeView !== "main" && onBackToDashboard) {
                onBackToDashboard();
              }
            }}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-text-primary dark:text-white hover:bg-light-100 dark:hover:bg-midnight-800 transition-colors text-sm font-medium border border-light-300 dark:border-midnight-700"
          >
            <Plus className="w-4 h-4" />
            New chat
          </button>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
            <input
              type="text"
              placeholder="Search chats..."
              value={caseSearch}
              onChange={(e) => setCaseSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-light-300 dark:border-midnight-700 rounded-lg bg-light-50 dark:bg-midnight-800 text-text-primary dark:text-white placeholder:text-text-muted text-xs focus:border-electric-indigo focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Sidebar middle: Case history */}
        <div className="flex-1 overflow-y-auto px-2 py-1">
          {groupedCases.length === 0 && (
            <div className="px-3 py-8 text-center text-text-muted text-xs">
              {caseSearch ? `No results for "${caseSearch}"` : "No conversations yet"}
            </div>
          )}
          {groupedCases.map((group) => (
            <div key={group.label} className="mb-2">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-text-muted uppercase tracking-wide">
                {group.label}
              </div>
              {group.cases.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setSidebarMobileOpen(false);
                    if (onOpenCase) {
                      onOpenCase(c.id);
                    } else {
                      onOpenHistory();
                    }
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-light-100 dark:hover:bg-midnight-800 transition-colors group"
                >
                  <div className="text-sm text-text-primary dark:text-white truncate font-medium group-hover:text-electric-indigo transition-colors">
                    {c.caseNumber ? <span className="text-text-muted font-normal mr-1">#{c.caseNumber}</span> : null}
                    {c.title}
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Analytics button */}
        {onOpenAnalytics && (
          <div className="px-2 pb-1 shrink-0">
            <button
              onClick={() => { setSidebarMobileOpen(false); onOpenAnalytics(); }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeView === 'analytics'
                  ? 'bg-electric-indigo/10 text-electric-indigo'
                  : 'text-text-muted hover:text-text-primary dark:hover:text-white hover:bg-light-100 dark:hover:bg-midnight-800'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </button>
          </div>
        )}

        {/* Sidebar bottom: Clickable user row with popup menu */}
        <div className="shrink-0 border-t border-light-300 dark:border-midnight-700 p-3" ref={userMenuRef}>
          <div className="relative">
            {/* User popup menu */}
            {showUserMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-midnight-800 border border-light-300 dark:border-midnight-700 rounded-xl shadow-xl z-50 animate-fade-in-up overflow-hidden">
                {/* User info header */}
                <div className="px-4 py-3 border-b border-light-200 dark:border-midnight-700">
                  <div className="text-sm font-semibold text-text-primary dark:text-white truncate">
                    {user.firstName} {user.lastName || ""}
                  </div>
                  <div className="text-xs text-text-muted truncate">{user.email}</div>
                </div>

                <div className="py-1">
                  {tier !== "pro" && (
                    <button
                      onClick={() => { setShowUserMenu(false); setUpgradeModalOpen(true); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary dark:text-white hover:bg-light-100 dark:hover:bg-midnight-700 transition-colors"
                    >
                      <Zap className="w-4 h-4 text-electric-indigo" />
                      Upgrade plan
                    </button>
                  )}
                  <button
                    onClick={() => { setShowUserMenu(false); setSidebarMobileOpen(false); onOpenSettings(); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary dark:text-white hover:bg-light-100 dark:hover:bg-midnight-700 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-text-muted" />
                    Settings
                  </button>
                  {onOpenBilling && (
                    <button
                      onClick={() => { setShowUserMenu(false); setSidebarMobileOpen(false); onOpenBilling(); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary dark:text-white hover:bg-light-100 dark:hover:bg-midnight-700 transition-colors"
                    >
                      <CreditCard className="w-4 h-4 text-text-muted" />
                      Billing
                    </button>
                  )}
                  {onOpenInventory && (
                    <button
                      onClick={() => { setShowUserMenu(false); setSidebarMobileOpen(false); onOpenInventory(); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary dark:text-white hover:bg-light-100 dark:hover:bg-midnight-700 transition-colors"
                    >
                      <Package className="w-4 h-4 text-text-muted" />
                      Home Inventory
                    </button>
                  )}
                </div>

                <div className="border-t border-light-200 dark:border-midnight-700 py-1">
                  <a
                    href="mailto:support@totalassist.app"
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary dark:text-white hover:bg-light-100 dark:hover:bg-midnight-700 transition-colors"
                  >
                    <HelpCircle className="w-4 h-4 text-text-muted" />
                    Help
                  </a>
                  <button
                    onClick={() => { setShowUserMenu(false); setShowLogoutConfirm(true); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Log out
                  </button>
                </div>
              </div>
            )}

            {/* Clickable user row */}
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-light-100 dark:hover:bg-midnight-800 transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-scout-purple to-electric-indigo rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0">
                {user.firstName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-sm font-medium text-text-primary dark:text-white truncate">
                  {user.firstName} {user.lastName || ""}
                </div>
                <div className="text-[10px] text-text-muted">{getTierLabel()} plan</div>
              </div>
            </button>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Top header bar */}
        <header className="bg-white dark:bg-midnight-900 border-b border-light-300 dark:border-midnight-700 px-4 py-3 flex items-center justify-between shrink-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                // On mobile, toggle mobile sidebar; on desktop, toggle collapse
                if (window.innerWidth < 1024) {
                  setSidebarMobileOpen(!sidebarMobileOpen);
                } else {
                  setSidebarOpen(!sidebarOpen);
                }
              }}
              className="p-2 hover:bg-light-100 dark:hover:bg-midnight-800 rounded-lg text-text-secondary hover:text-text-primary dark:hover:text-white transition-colors"
            >
              <PanelLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-semibold text-text-primary dark:text-white">TotalAssist</span>
          </div>

          <div className="flex items-center gap-2">
            {tier !== "pro" && (
              <button
                onClick={() => setUpgradeModalOpen(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-scout-purple to-electric-indigo text-white hover:opacity-90 transition-opacity"
              >
                <Zap className="w-3 h-3" />
                Get {tier === "home" ? "Pro" : "Pro"}
              </button>
            )}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-light-100 dark:hover:bg-midnight-800 transition-colors text-text-secondary hover:text-text-primary dark:hover:text-white"
              title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            <div className="w-8 h-8 bg-gradient-to-br from-scout-purple to-electric-indigo rounded-full flex items-center justify-center text-white font-bold text-xs">
              {user.firstName.charAt(0)}
            </div>
          </div>
        </header>

        {/* Content area */}
        {children ? (
          <div className={isScoutView ? "flex-1 overflow-hidden" : "flex-1 overflow-y-auto p-6 lg:p-8"}>
            {children}
          </div>
        ) : (
          /* Control Center */
          <div className="flex-1 overflow-y-auto">
            <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">

              {/* Section 1: Emergency Bar */}
              <button
                onClick={() => {
                  if (onOpenScout) onOpenScout();
                  else if (onNewChat) onNewChat("I need help with a tech issue");
                }}
                className="w-full bg-electric-indigo hover:bg-[#4F46E5] active:scale-[0.99] rounded-2xl px-6 py-5 flex items-center justify-between transition-all shadow-lg min-h-[72px]"
                aria-label="Start a new help session now"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-lg sm:text-xl font-bold text-white">Need help right now?</h2>
                    <p className="text-white/80 text-sm sm:text-base">Start a new case and get instant support.</p>
                  </div>
                </div>
                <ArrowRight className="w-6 h-6 text-white shrink-0 hidden sm:block" />
              </button>

              {/* Welcome Banner (new users with 0 cases) */}
              {cases.length === 0 && !welcomeDismissed && (
                <div className="relative bg-gradient-to-br from-scout-purple/5 to-electric-indigo/5 dark:from-scout-purple/10 dark:to-electric-indigo/10 rounded-2xl border border-scout-purple/30 p-6 sm:p-8">
                  <button
                    onClick={() => {
                      setWelcomeDismissed(true);
                      localStorage.setItem('ta_welcome_dismissed', 'true');
                    }}
                    className="absolute top-4 right-4 w-8 h-8 rounded-lg hover:bg-light-200 dark:hover:bg-midnight-700 flex items-center justify-center text-text-muted hover:text-text-primary dark:hover:text-white transition-colors"
                    aria-label="Dismiss welcome message"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-scout-purple to-electric-indigo rounded-2xl flex items-center justify-center shrink-0">
                      <Zap className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-text-primary dark:text-white mb-2">
                        Welcome to TotalAssist, {user.firstName}!
                      </h2>
                      <p className="text-text-secondary text-base">
                        Get instant help with your tech issues — no waiting, no phone trees, just solutions.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3 p-4 bg-white dark:bg-midnight-800 rounded-xl border border-light-300 dark:border-midnight-700">
                      <div className="w-8 h-8 bg-electric-indigo/10 dark:bg-electric-indigo/20 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                        <MessageSquare className="w-4 h-4 text-electric-indigo" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-text-primary dark:text-white text-sm mb-1">Type a Question</h3>
                        <p className="text-text-muted text-xs leading-relaxed">Describe your problem in plain English and get instant troubleshooting help.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-white dark:bg-midnight-800 rounded-xl border border-light-300 dark:border-midnight-700">
                      <div className="w-8 h-8 bg-electric-indigo/10 dark:bg-electric-indigo/20 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                        <Camera className="w-4 h-4 text-electric-indigo" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-text-primary dark:text-white text-sm mb-1">Show the Problem</h3>
                        <p className="text-text-muted text-xs leading-relaxed">Snap a photo of an error message or blinking light for visual diagnosis.</p>
                      </div>
                    </div>
                    {(tier === 'home' || tier === 'pro') && (
                      <>
                        <div className="flex items-start gap-3 p-4 bg-white dark:bg-midnight-800 rounded-xl border border-light-300 dark:border-midnight-700">
                          <div className="w-8 h-8 bg-electric-indigo/10 dark:bg-electric-indigo/20 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                            <Mic className="w-4 h-4 text-electric-indigo" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-text-primary dark:text-white text-sm mb-1">Talk to Support</h3>
                            <p className="text-text-muted text-xs leading-relaxed">Prefer speaking? Use voice mode for hands-free troubleshooting.</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-4 bg-white dark:bg-midnight-800 rounded-xl border border-light-300 dark:border-midnight-700">
                          <div className="w-8 h-8 bg-electric-indigo/10 dark:bg-electric-indigo/20 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                            <Video className="w-4 h-4 text-electric-indigo" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-text-primary dark:text-white text-sm mb-1">Show Me on Camera</h3>
                            <p className="text-text-muted text-xs leading-relaxed">For complex issues, point your camera at the device for live guidance.</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="mt-6 flex justify-center">
                    <button
                      onClick={() => {
                        setWelcomeDismissed(true);
                        localStorage.setItem('ta_welcome_dismissed', 'true');
                      }}
                      className="px-6 py-2.5 rounded-xl bg-light-200 dark:bg-midnight-700 text-text-primary dark:text-white font-semibold hover:bg-light-300 dark:hover:bg-midnight-600 transition-colors text-sm min-h-[44px]"
                    >
                      Got it, thanks!
                    </button>
                  </div>
                </div>
              )}

              {/* Section 2: Triage Grid */}
              <div>
                <h2 className="text-xl font-bold text-text-primary dark:text-white mb-4">How can we help?</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    {
                      id: 'text' as const,
                      icon: MessageSquare,
                      label: 'Type a Question',
                      description: 'Chat with our support agent',
                      lockedForTiers: [] as string[],
                      action: () => { if (onOpenScout) onOpenScout(); },
                      feature: 'chat' as const,
                    },
                    {
                      id: 'photo' as const,
                      icon: Camera,
                      label: 'Show the Problem',
                      description: 'Take or upload a photo for analysis',
                      lockedForTiers: [] as string[],
                      action: () => { if (onOpenScoutWithMode) onOpenScoutWithMode('photo'); else if (onOpenScout) onOpenScout(); },
                      feature: 'photo' as const,
                    },
                    {
                      id: 'voice' as const,
                      icon: Mic,
                      label: 'Talk to Support',
                      description: 'Hands-free help, like a phone call',
                      lockedForTiers: ['guest', 'free'],
                      action: () => { if (onOpenScoutWithMode) onOpenScoutWithMode('voice'); else if (onOpenScout) onOpenScout(); },
                      feature: 'signal' as const,
                    },
                    {
                      id: 'video' as const,
                      icon: Video,
                      label: 'Show Me on Camera',
                      description: 'Point your camera at the issue',
                      lockedForTiers: ['guest', 'free'],
                      action: () => { if (onOpenScoutWithMode) onOpenScoutWithMode('video'); else if (onOpenScout) onOpenScout(); },
                      feature: 'videoDiagnostic' as const,
                    },
                  ].map((tile) => {
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
                          relative flex flex-col items-center justify-center text-center
                          rounded-2xl border p-6 min-h-[180px]
                          transition-all duration-200
                          ${isLocked
                            ? 'bg-light-100 dark:bg-midnight-800/50 border-light-300 dark:border-midnight-700 opacity-70 cursor-not-allowed'
                            : 'bg-white dark:bg-midnight-800 border-light-300 dark:border-midnight-700 hover:border-electric-indigo hover:shadow-lg active:scale-[0.98]'
                          }
                        `}
                        aria-label={`${tile.label}${isLocked ? ' — requires upgrade' : ''}`}
                      >
                        {isLocked && (
                          <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-midnight-900/80 dark:bg-midnight-700 flex items-center justify-center" aria-hidden="true">
                            <Lock className="w-4 h-4 text-white/70" />
                          </div>
                        )}
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
                          isLocked
                            ? 'bg-light-300 dark:bg-midnight-700'
                            : 'bg-electric-indigo/10 dark:bg-electric-indigo/20'
                        }`}>
                          <Icon className={`w-7 h-7 ${isLocked ? 'text-text-muted' : 'text-electric-indigo'}`} />
                        </div>
                        <span className={`text-lg font-bold leading-tight ${isLocked ? 'text-text-muted' : 'text-text-primary dark:text-white'}`}>
                          {tile.label}
                        </span>
                        <span className="text-sm text-text-secondary dark:text-text-muted mt-1.5">
                          {isLocked ? 'Requires Home or Pro plan' : tile.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Video Credit CTA (home/pro users with low credits) */}
              {(tier === 'home' || tier === 'pro') && videoCredits.remaining <= 1 && (
                <div className="bg-gradient-to-br from-scout-purple/10 to-electric-indigo/10 dark:from-scout-purple/20 dark:to-electric-indigo/20 rounded-2xl border border-scout-purple/30 p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-scout-purple to-electric-indigo rounded-xl flex items-center justify-center shrink-0">
                        <Video className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-text-primary dark:text-white mb-1">
                          {videoCredits.remaining === 0 ? 'Out of Video Credits' : 'Low on Video Credits'}
                        </h3>
                        <p className="text-text-secondary text-sm">
                          {videoCredits.remaining === 0
                            ? "You've used all your live video sessions. Purchase more to continue getting real-time help."
                            : 'You have 1 video credit remaining. Top up now so you\'re ready when you need help.'}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                      <button
                        onClick={async () => {
                          setIsPurchasing('single');
                          try {
                            await startCheckout('price_1SxBftPeLuLIM8GmX9sxeASx');
                          } catch {
                            alert('Failed to start checkout. Please try again.');
                          } finally {
                            setIsPurchasing(null);
                          }
                        }}
                        disabled={isPurchasing !== null}
                        className="px-5 py-3 rounded-xl bg-white dark:bg-midnight-800 border border-light-300 dark:border-midnight-700 text-text-primary dark:text-white font-semibold hover:bg-light-100 dark:hover:bg-midnight-700 transition-colors text-sm whitespace-nowrap min-h-[44px] disabled:opacity-50"
                        aria-label="Purchase 1 video credit for $5"
                      >
                        {isPurchasing === 'single' ? 'Loading...' : '1 Credit — $5'}
                      </button>
                      <button
                        onClick={async () => {
                          setIsPurchasing('pack');
                          try {
                            await startCheckout('price_1SxBgLPeLuLIM8GmkJ27pvdX');
                          } catch {
                            alert('Failed to start checkout. Please try again.');
                          } finally {
                            setIsPurchasing(null);
                          }
                        }}
                        disabled={isPurchasing !== null}
                        className="px-5 py-3 rounded-xl bg-gradient-to-r from-scout-purple to-electric-indigo text-white font-semibold hover:opacity-90 transition-opacity text-sm whitespace-nowrap flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-50"
                        aria-label="Purchase 3 video credits for $12, save $3"
                      >
                        {isPurchasing === 'pack' ? 'Loading...' : (
                          <>
                            <span>3 Credits — $12</span>
                            <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">Save $3</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Section 3: Quick-Start Chips */}
              <div>
                <h3 className="text-base font-semibold text-text-secondary dark:text-text-muted mb-3">Common issues</h3>
                <div className="flex flex-wrap gap-3">
                  {[
                    "Wi-Fi not working",
                    "Printer won't print",
                    "Smart device setup",
                    "Error on my screen",
                    "Slow internet",
                    "TV won't connect",
                  ].map((chip) => (
                    <button
                      key={chip}
                      onClick={() => onNewChat?.(chip)}
                      className="px-5 py-3 rounded-full bg-light-200 dark:bg-midnight-800 border border-light-300 dark:border-midnight-700 text-text-primary dark:text-white text-sm sm:text-base font-medium hover:bg-light-300 dark:hover:bg-midnight-700 hover:border-electric-indigo/50 active:scale-[0.97] transition-all min-h-[44px]"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 4: Text Input */}
              <div className="relative w-full bg-light-100 dark:bg-midnight-800 border border-light-300 dark:border-midnight-700 rounded-2xl px-4 py-3 flex items-center gap-2 shadow-sm focus-within:border-electric-indigo/50 focus-within:ring-2 focus-within:ring-electric-indigo/20 transition-all">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Or type your question here..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendFromEmpty()}
                  className="flex-1 bg-transparent outline-none text-base text-text-primary dark:text-white placeholder:text-text-muted min-h-[44px]"
                />
                <button
                  onClick={handleSendFromEmpty}
                  disabled={!chatInput.trim()}
                  className="p-3 rounded-full bg-midnight-900 dark:bg-white text-white dark:text-midnight-900 disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Send message"
                >
                  <ChevronUp className="w-5 h-5" />
                </button>
              </div>

              {/* Section 5: Recent Cases */}
              {cases.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-text-primary dark:text-white">Your Recent Help Sessions</h2>
                    {cases.length > 6 && (
                      <button
                        onClick={onOpenHistory}
                        className="text-electric-indigo text-sm font-semibold hover:underline min-h-[44px] flex items-center"
                      >
                        View all
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cases.slice(0, 6).map((c) => {
                      const statusConfig: Record<string, { label: string; className: string }> = {
                        open: { label: 'Open', className: 'bg-electric-cyan/20 text-electric-cyan' },
                        resolved: { label: 'Fixed', className: 'bg-emerald-500/20 text-emerald-500 dark:text-emerald-400' },
                        escalated: { label: 'Escalated', className: 'bg-orange-500/20 text-orange-500 dark:text-orange-400' },
                      };
                      const status = statusConfig[c.status] || statusConfig.open;
                      const dateStr = new Date(c.updatedAt || c.createdAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      });

                      return (
                        <div
                          key={c.id}
                          className="bg-white dark:bg-midnight-800 rounded-2xl border border-light-300 dark:border-midnight-700 p-5 flex flex-col gap-3 hover:border-electric-indigo/40 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-base font-bold text-text-primary dark:text-white line-clamp-2 leading-snug">
                              {c.caseNumber ? `#${c.caseNumber} ` : ''}{c.title}
                            </h3>
                            <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${status.className}`}>
                              {status.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-text-muted">
                            <Clock className="w-4 h-4" />
                            <span>{dateStr}</span>
                          </div>
                          <div className="flex gap-2 mt-auto pt-2">
                            <button
                              onClick={() => onOpenCase?.(c.id)}
                              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-light-100 dark:bg-midnight-700 text-text-primary dark:text-white hover:bg-light-200 dark:hover:bg-midnight-600 transition-colors min-h-[44px]"
                            >
                              View Report
                            </button>
                            {c.status === 'open' && (
                              <button
                                onClick={() => onOpenCase?.(c.id)}
                                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-electric-indigo text-white hover:bg-[#4F46E5] transition-colors min-h-[44px]"
                              >
                                Continue
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </div>

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
