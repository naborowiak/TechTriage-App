import React from "react";
import { Home, Plus, Clock, Settings } from "lucide-react";
import type { DashboardTab } from "../../types";

interface MobileBottomDockProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
}

const tabs: { id: DashboardTab; label: string; icon: React.ComponentType<{ className?: string }>; isCenter?: boolean }[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "new", label: "New Case", icon: Plus, isCenter: true },
  { id: "history", label: "History", icon: Clock },
  { id: "settings", label: "Settings", icon: Settings },
];

export const MobileBottomDock: React.FC<MobileBottomDockProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-midnight-900 border-t border-light-300 dark:border-midnight-700 pb-safe"
      role="tablist"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around px-2 pt-1.5 pb-1.5">
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
                className="flex flex-col items-center justify-center min-w-[56px] min-h-[48px] -mt-3"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-electric-indigo to-scout-purple flex items-center justify-center shadow-lg shadow-electric-indigo/30">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-[10px] font-medium text-electric-indigo mt-0.5">{tab.label}</span>
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
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] transition-colors ${
                isActive
                  ? "text-electric-indigo"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium mt-0.5">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
