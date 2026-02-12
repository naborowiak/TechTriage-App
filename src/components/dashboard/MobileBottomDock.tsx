import React from "react";
import { Home, Plus, Clock, Settings } from "lucide-react";
import type { DashboardTab } from "../../types";

interface MobileBottomDockProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
}

const tabs: {
  id: DashboardTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isCenter?: boolean;
}[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "new", label: "New Case", icon: Plus, isCenter: true },
  { id: "history", label: "History", icon: Clock },
  { id: "settings", label: "Settings", icon: Settings },
];

export const MobileBottomDock: React.FC<MobileBottomDockProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 dock-glass border-t border-light-300/60 dark:border-white/[0.06] pb-safe"
      role="tablist"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around px-2 pt-2 pb-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          if (tab.isCenter) {
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                aria-label={tab.label}
                aria-current={isActive ? "page" : undefined}
                onClick={() => onTabChange(tab.id)}
                className="flex flex-col items-center justify-center min-w-[56px] min-h-[48px] -mt-4"
              >
                <div className="relative w-13 h-13 rounded-full bg-gradient-to-br from-electric-indigo via-scout-purple to-electric-cyan flex items-center justify-center shadow-[0_4px_20px_rgba(99,102,241,0.4)]">
                  {/* Inner glow ring */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent" />
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-electric-indigo to-scout-purple flex items-center justify-center">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-electric-indigo mt-1">
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] transition-all duration-200 ${
                isActive
                  ? "text-electric-indigo"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              <div className="relative">
                {isActive && (
                  <span className="absolute -inset-1.5 rounded-lg bg-electric-indigo/10 dark:bg-electric-indigo/15" />
                )}
                <Icon className="relative w-5 h-5" />
              </div>
              <span
                className={`text-[10px] font-medium mt-1 ${isActive ? "font-semibold" : ""}`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
