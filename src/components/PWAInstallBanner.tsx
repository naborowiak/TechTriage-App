import { Download, X } from 'lucide-react';
import type { UsePWAInstallReturn } from '../hooks/usePWAInstall';

export function PWAInstallBanner({
  canInstall,
  isInstalled,
  promptInstall,
  dismissPrompt,
  isDismissed,
}: UsePWAInstallReturn) {
  if (!canInstall || isDismissed || isInstalled) return null;

  return (
    <div
      className="fixed top-4 left-4 right-4 z-[50] pt-safe animate-fade-in-up sm:left-auto sm:right-6 sm:max-w-sm"
      role="complementary"
      aria-label="Install app"
    >
      <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-[#6366F1] to-[#06B6D4] p-3 shadow-lg shadow-indigo-500/20">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
          <Download className="h-5 w-5 text-white" />
        </div>
        <p className="flex-1 text-sm font-medium text-white leading-tight">
          Add to Home Screen for the best experience
        </p>
        <button
          onClick={promptInstall}
          className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-semibold text-indigo-600 hover:bg-white/90 transition-colors min-h-[44px]"
        >
          Install
        </button>
        <button
          onClick={dismissPrompt}
          className="shrink-0 flex h-[44px] w-[44px] items-center justify-center rounded-full hover:bg-white/20 transition-colors"
          aria-label="Dismiss install prompt"
        >
          <X className="h-4 w-4 text-white" />
        </button>
      </div>
    </div>
  );
}
