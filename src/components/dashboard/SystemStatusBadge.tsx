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
    <div className="flex items-center gap-2" role="status" aria-live="polite">
      <span
        className={`w-2 h-2 rounded-full shrink-0 ${
          isOnline
            ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]"
            : "bg-yellow-500 animate-pulse"
        }`}
        aria-hidden="true"
      />
      <span className="text-sm text-text-muted font-medium">
        {isOnline ? "Support Available" : "Reconnecting..."}
      </span>
    </div>
  );
};
