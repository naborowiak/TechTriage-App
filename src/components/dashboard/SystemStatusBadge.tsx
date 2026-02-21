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

  // Only show visually when offline — avoid always-on noise
  if (isOnline) {
    return (
      <div role="status" aria-live="polite" className="sr-only">
        Support Available
      </div>
    );
  }

  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/40"
      role="status"
      aria-live="assertive"
    >
      <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse shrink-0" aria-hidden="true" />
      <span className="text-sm text-yellow-700 dark:text-yellow-400 font-medium">
        Reconnecting...
      </span>
    </div>
  );
};
