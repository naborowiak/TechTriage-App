import React from "react";
import {
  MessageSquare,
  Clock,
  Smartphone,
  Settings,
  LogOut,
  Zap,
  Camera,
  Check,
} from "lucide-react";
import { useUsage, UNLIMITED } from "../../stores/usageStore";
import type { DashboardTab } from "../../types";

interface DashboardSidebarProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  onLogout: () => void;
  showUpgrade?: boolean;
  onUpgrade?: () => void;
  user: {
    firstName: string;
    lastName?: string;
    email: string;
  };
}

const navItems: {
  id: DashboardTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "history", label: "Session History", icon: Clock },
  { id: "devices", label: "Devices", icon: Smartphone },
  { id: "settings", label: "Settings", icon: Settings },
];

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  activeTab,
  onTabChange,
  onLogout,
  showUpgrade = false,
  onUpgrade,
  user,
}) => {
  return (
    <aside className="hidden lg:flex flex-col w-[260px] shrink-0 bg-white dark:bg-midnight-900 border-r border-light-200 dark:border-midnight-700 h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 shrink-0">
        <img
          src="/total_assist-new.png"
          alt="TotalAssist"
          className="w-8 h-8 object-contain"
        />
        <span className="text-base font-bold text-text-primary dark:text-white tracking-tight">
          Total<span className="text-electric-indigo">Assist</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1" aria-label="Dashboard navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={[
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 min-h-[44px] relative",
                isActive
                  ? "bg-electric-indigo/[0.08] dark:bg-electric-indigo/[0.12] text-electric-indigo"
                  : "text-text-secondary dark:text-white/60 hover:bg-light-100 dark:hover:bg-midnight-800 hover:text-text-primary dark:hover:text-white",
              ].join(" ")}
              aria-current={isActive ? "page" : undefined}
              aria-label={item.label}
            >
              {/* Active indicator bar */}
              {isActive && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-electric-indigo"
                  aria-hidden="true"
                />
              )}
              <Icon className="w-[18px] h-[18px] shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Credits summary */}
      <CreditsSummary />

      {/* Bottom section */}
      <div className="px-3 pb-4 space-y-3 shrink-0">
        {/* Upgrade CTA */}
        {showUpgrade && (
          <button
            onClick={onUpgrade}
            className="w-full relative overflow-hidden rounded-xl p-4 text-left group"
            aria-label="Upgrade to Home plan"
          >
            {/* Galaxy background */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: "url(/galaxy-bg.png)" }}
              aria-hidden="true"
            />
            <div
              className="absolute inset-0 bg-gradient-to-b from-electric-indigo/80 to-[#6366F1]/90"
              aria-hidden="true"
            />
            <div className="relative z-10">
              <div className="flex items-center gap-1.5 mb-1">
                <Zap className="w-3.5 h-3.5 text-electric-cyan" />
                <span className="text-xs font-bold text-white/90 uppercase tracking-wider">
                  Upgrade to Home
                </span>
              </div>
              <p className="text-[13px] text-white/70 mb-3 leading-snug">
                Unlock voice & video support
              </p>
              <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white/20 text-white text-xs font-bold group-hover:bg-white/30 transition-colors">
                Upgrade
              </span>
            </div>
          </button>
        )}

        {/* User profile */}
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-electric-indigo flex items-center justify-center text-white font-bold text-xs shrink-0">
            {user.firstName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-text-primary dark:text-white truncate">
              {user.firstName} {user.lastName || ""}
            </div>
            <button
              onClick={onLogout}
              className="text-xs text-text-secondary dark:text-white/50 hover:text-electric-indigo transition-colors flex items-center gap-1"
              aria-label="Sign out"
            >
              <LogOut className="w-3 h-3" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

const CreditsSummary: React.FC = () => {
  const { usage } = useUsage();
  const isUnlimited = usage.chat.limit >= UNLIMITED;

  return (
    <div className="px-3 py-3 mx-3 rounded-lg bg-light-50 dark:bg-midnight-800/50 border border-light-200 dark:border-midnight-700 shrink-0">
      <div className="text-xs font-semibold text-text-secondary dark:text-white/60 uppercase tracking-wider mb-2">
        Credits
      </div>
      {isUnlimited ? (
        <div className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400 font-semibold">
          <Check className="w-3.5 h-3.5" />
          Unlimited
        </div>
      ) : (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-text-secondary dark:text-white/60">
              <MessageSquare className="w-3.5 h-3.5" />
              Chats
            </span>
            <span className="font-semibold text-text-primary dark:text-white">
              {Math.max(0, usage.chat.limit - usage.chat.used)}/{usage.chat.limit}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-text-secondary dark:text-white/60">
              <Camera className="w-3.5 h-3.5" />
              Photos
            </span>
            <span className="font-semibold text-text-primary dark:text-white">
              {Math.max(0, usage.photo.limit - usage.photo.used)}/{usage.photo.limit}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
