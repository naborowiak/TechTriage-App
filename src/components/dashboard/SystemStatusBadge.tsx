import React, { useState, useEffect } from "react";

export const SystemStatusBadge: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div
      className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-midnight-800 border border-surface-border dark:border-midnight-700"
      role="status"
      aria-live="polite"
    >
      <span className="relative flex items-center justify-center w-2.5 h-2.5">
        {isOnline && (
          <span className="absolute inset-0 rounded-full bg-emerald-400/40 status-dot-pulse" />
        )}
        <span
          className={`relative w-2 h-2 rounded-full shrink-0 ${
            isOnline
              ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
              : "bg-yellow-500 animate-pulse"
          }`}
          aria-hidden="true"
        />
      </span>
      <span className="text-sm text-text-muted font-medium tracking-tight">
        {isOnline ? "Support Available" : "Reconnecting..."}
      </span>
    </div>
  );
};
