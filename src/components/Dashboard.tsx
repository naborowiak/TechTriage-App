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
  Paperclip,
  ChevronUp,
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
  activeView?: "main" | "history" | "settings" | "billing" | "scout" | "inventory";
  children?: React.ReactNode;
  onUpdateUser?: (user: {
    firstName: string;
    lastName?: string;
    email: string;
  }) => void;
}

interface Case {
  id: string;
  title: string;
  status: string;
  createdAt: string;
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
    const date = new Date(c.createdAt);
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
  const [upgradeFeature] = useState<'chat' | 'photo' | 'signal' | 'videoDiagnostic'>('chat');
  const inputRef = useRef<HTMLInputElement>(null);
  const { theme, toggleTheme } = useTheme();

  // Usage store
  const { tier } = useUsage();

  // Subscription
  useSubscription(user.id);

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    onLogout();
  };

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
            setCases(data.slice(0, 50));
          }
        })
        .catch((err) => console.error("Failed to load cases:", err));
    }
  }, [user?.id]);

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
    <div className={`${isScoutView ? 'h-screen overflow-hidden' : 'h-screen overflow-hidden'} bg-light-50 dark:bg-midnight-950 transition-colors flex`}>
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
                    onOpenHistory();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-light-100 dark:hover:bg-midnight-800 transition-colors group"
                >
                  <div className="text-sm text-text-primary dark:text-white truncate font-medium group-hover:text-electric-indigo transition-colors">
                    {c.title}
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Sidebar bottom: User info + nav icons */}
        <div className="shrink-0 border-t border-light-300 dark:border-midnight-700 p-3 space-y-2">
          {/* Upgrade button for non-pro */}
          {tier !== "pro" && (
            <button
              onClick={() => setUpgradeModalOpen(true)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-scout-purple/10 to-electric-indigo/10 text-electric-indigo hover:from-scout-purple/20 hover:to-electric-indigo/20 transition-colors"
            >
              <Zap className="w-4 h-4" />
              Upgrade to {tier === "home" ? "Pro" : "Home"}
            </button>
          )}

          {/* User row */}
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="w-7 h-7 bg-gradient-to-br from-scout-purple to-electric-indigo rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0">
              {user.firstName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-text-primary dark:text-white truncate">
                {user.firstName} {user.lastName || ""}
              </div>
              <div className="text-[10px] text-text-muted">{getTierLabel()} plan</div>
            </div>
          </div>

          {/* Icon row */}
          <div className="flex items-center gap-1 px-1">
            <button
              onClick={() => { setSidebarMobileOpen(false); onOpenSettings(); }}
              className={`p-2 rounded-lg transition-colors ${activeView === 'settings' ? 'bg-electric-indigo/20 text-electric-indigo' : 'text-text-muted hover:text-text-primary dark:hover:text-white hover:bg-light-100 dark:hover:bg-midnight-800'}`}
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            {onOpenBilling && (
              <button
                onClick={() => { setSidebarMobileOpen(false); onOpenBilling(); }}
                className={`p-2 rounded-lg transition-colors ${activeView === 'billing' ? 'bg-electric-indigo/20 text-electric-indigo' : 'text-text-muted hover:text-text-primary dark:hover:text-white hover:bg-light-100 dark:hover:bg-midnight-800'}`}
                title="Billing"
              >
                <CreditCard className="w-4 h-4" />
              </button>
            )}
            {onOpenInventory && (
              <button
                onClick={() => { setSidebarMobileOpen(false); onOpenInventory(); }}
                className={`p-2 rounded-lg transition-colors ${activeView === 'inventory' ? 'bg-electric-indigo/20 text-electric-indigo' : 'text-text-muted hover:text-text-primary dark:hover:text-white hover:bg-light-100 dark:hover:bg-midnight-800'}`}
                title="Home Inventory"
              >
                <Package className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="p-2 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors ml-auto"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
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
            <span className="text-sm font-semibold text-text-primary dark:text-white">Scout AI</span>
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
          /* Empty state: "Ready when you are." */
          <div className="flex-1 flex flex-col items-center justify-center px-4">
            <div className="w-full max-w-2xl mx-auto text-center">
              {/* Heading */}
              <h1 className="text-3xl sm:text-4xl font-bold text-text-primary dark:text-white mb-8">
                Ready when you are.
              </h1>

              {/* Input bar */}
              <div className="relative w-full bg-light-100 dark:bg-midnight-800 border border-light-300 dark:border-midnight-700 rounded-2xl px-4 py-3 flex items-center gap-2 shadow-sm focus-within:border-electric-indigo/50 focus-within:ring-2 focus-within:ring-electric-indigo/20 transition-all">
                <button
                  className="p-1.5 text-text-muted hover:text-text-primary dark:hover:text-white transition-colors rounded-lg hover:bg-light-200 dark:hover:bg-midnight-700"
                  title="Attach file"
                  onClick={() => {
                    // For now, just open scout in photo mode
                    if (onOpenScout) onOpenScout();
                  }}
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Ask anything"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendFromEmpty()}
                  className="flex-1 bg-transparent outline-none text-sm text-text-primary dark:text-white placeholder:text-text-muted"
                />
                <button
                  onClick={handleSendFromEmpty}
                  disabled={!chatInput.trim()}
                  className="p-2 rounded-full bg-midnight-900 dark:bg-white text-white dark:text-midnight-900 disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-all"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
              </div>

              {/* Disclaimer */}
              <p className="text-xs text-text-muted mt-3">
                Scout can make mistakes. Check important info.
              </p>
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
