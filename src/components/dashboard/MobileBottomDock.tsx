import React from "react";
import { MessageSquare, Clock, Smartphone, Settings } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import type { DashboardTab } from "../../types";

interface MobileBottomDockProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
}

const tabs: {
  id: DashboardTab;
  label: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
}[] = [
  { id: "chat", label: "Chat", icon: MessageSquare, color: "#6366F1" },
  { id: "history", label: "History", icon: Clock, color: "#06B6D4" },
  { id: "devices", label: "Devices", icon: Smartphone, color: "#A855F7" },
  { id: "settings", label: "Settings", icon: Settings, color: "#C084FC" },
];

// Inactive icon/label color per theme
const INACTIVE_LIGHT = "rgba(100, 116, 139, 0.7)"; // slate-500 @ 70%
const INACTIVE_DARK = "rgba(255, 255, 255, 0.6)";

export const MobileBottomDock: React.FC<MobileBottomDockProps> = ({
  activeTab,
  onTabChange,
}) => {
  const activeIndex = tabs.findIndex((t) => t.id === activeTab);
  const activeColor = tabs[activeIndex]?.color ?? tabs[0].color;
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const inactiveColor = isDark ? INACTIVE_DARK : INACTIVE_LIGHT;

  return (
    <nav
      className="lg:hidden shrink-0 z-40 dock-glow pb-safe"
      role="tablist"
      aria-label="Main navigation"
    >
      {/* Sliding light beam — decorative */}
      <div
        className="dock-glow-light"
        style={{ transform: `translateX(${activeIndex * 100}%)` }}
        aria-hidden="true"
      >
        <div
          className="dock-glow-bar"
          style={{
            backgroundColor: activeColor,
            boxShadow: isDark
              ? `0 0 12px ${activeColor}, 0 0 24px ${activeColor}80`
              : `0 0 8px ${activeColor}90, 0 0 16px ${activeColor}50`,
          }}
        />
        <div
          className="dock-glow-beam"
          style={{
            background: `linear-gradient(to bottom, ${activeColor}${isDark ? "50" : "30"} 0%, ${activeColor}00 100%)`,
          }}
        />
      </div>

      {/* Tab buttons */}
      <div className="grid grid-cols-4 px-2 pt-3 pb-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
              onClick={() => onTabChange(tab.id)}
              className={[
                "flex flex-col items-center justify-center min-h-[48px] dock-icon-glow",
                `focus-visible:outline-none focus-visible:ring-2 ${isDark ? "focus-visible:ring-white/60" : "focus-visible:ring-indigo-500/40"} focus-visible:rounded-md`,
              ].join(" ")}
            >
              <Icon
                className="w-5 h-5"
                style={
                  isActive
                    ? {
                        color: tab.color,
                        filter: isDark
                          ? `drop-shadow(0 0 6px ${tab.color}) drop-shadow(0 0 12px ${tab.color}80)`
                          : `drop-shadow(0 0 4px ${tab.color}80)`,
                      }
                    : { color: inactiveColor }
                }
              />
              <span
                className="text-[11px] font-medium mt-1"
                style={
                  isActive
                    ? { color: tab.color, fontWeight: 600 }
                    : { color: inactiveColor }
                }
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
