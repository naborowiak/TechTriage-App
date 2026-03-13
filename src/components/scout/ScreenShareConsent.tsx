import { useRef } from 'react';
import { Monitor, Shield, Eye, X } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface ScreenShareConsentProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export function ScreenShareConsent({ onConfirm, onCancel }: ScreenShareConsentProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(modalRef, { onClose: onCancel });

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="screen-share-consent-title"
        className="relative w-full max-w-md bg-[#151922] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center">
            <Monitor className="w-7 h-7 text-emerald-400" />
          </div>
          <h2 id="screen-share-consent-title" className="text-lg font-semibold text-white">
            Share Your Screen
          </h2>
          <p className="mt-2 text-sm text-white/60 leading-relaxed">
            Your screen will be visible to our AI support assistant, which will use what it sees to guide you step-by-step.
          </p>
        </div>

        {/* Info cards */}
        <div className="px-6 space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
            <Eye className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
            <p className="text-xs text-white/50 leading-relaxed">
              If your case is escalated, a human support agent may also view your screen in real-time.
            </p>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <Shield className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-200/80 leading-relaxed">
              Before sharing, please close any apps or tabs showing passwords, banking, or personal messages.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pt-5 pb-6 space-y-3">
          <button
            onClick={onConfirm}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-emerald-500/20 transition-all active:scale-[0.98] min-h-[44px]"
          >
            I Understand, Share Screen
          </button>
          <button
            onClick={onCancel}
            autoFocus
            className="w-full py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-white/60 font-medium text-sm hover:bg-white/10 hover:text-white/80 transition-all min-h-[44px]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
