import React, { useState, useRef } from 'react';
import { X, Gift, Loader2, AlertTriangle, Check, MessageSquare, Camera, Video, History } from 'lucide-react';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface ChurnPreventionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAcceptOffer: () => Promise<void>;
  onConfirmCancel: () => Promise<void>;
  tier: 'home' | 'pro';
  periodEndDate: Date | null;
}

export const ChurnPreventionModal: React.FC<ChurnPreventionModalProps> = ({
  isOpen,
  onClose,
  onAcceptOffer,
  onConfirmCancel,
  tier,
  periodEndDate,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(modalRef, { onClose, active: isOpen });
  const [isAccepting, setIsAccepting] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [offerAccepted, setOfferAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAcceptOffer = async () => {
    setIsAccepting(true);
    setError(null);
    try {
      await onAcceptOffer();
      setOfferAccepted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply discount');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleConfirmCancel = async () => {
    setIsCanceling(true);
    setError(null);
    try {
      await onConfirmCancel();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription');
    } finally {
      setIsCanceling(false);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const tierName = tier === 'pro' ? 'TotalAssist Pro' : 'TotalAssist Home';

  // Success state after accepting offer
  if (offerAccepted) {
    return (
      <div ref={modalRef} className="fixed inset-0 z-[9999] flex items-center justify-center">
        <div
          className="absolute inset-0 bg-midnight-950/90 backdrop-blur-sm"
          onClick={onClose}
        />
        <div className="relative w-full max-w-md mx-4 bg-midnight-900 rounded-3xl border border-midnight-700 shadow-2xl overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-electric-cyan to-green-500" />

          <div className="p-8 pt-10 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-green-500 to-electric-cyan flex items-center justify-center">
              <Check className="w-8 h-8 text-white" />
            </div>

            <h2 className="text-2xl font-black text-white mb-4">
              Discount Applied!
            </h2>

            <p className="text-text-secondary mb-6">
              You now have <span className="text-electric-cyan font-bold">20% off</span> for the next 3 billing cycles. Thank you for staying with {tierName}!
            </p>

            <button
              onClick={onClose}
              className="w-full py-4 rounded-full font-bold text-white btn-gradient-electric shadow-lg transition-all"
            >
              Continue Using TotalAssist
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={modalRef} className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-midnight-950/90 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-midnight-900 rounded-3xl border border-midnight-700 shadow-2xl overflow-hidden">
        {/* Gradient accent top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-scout-purple via-electric-cyan to-scout-glow" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-secondary hover:text-white transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-8 pt-10">
          {/* Icon */}
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-scout-purple to-scout-glow flex items-center justify-center shadow-glow-scout">
            <Gift className="w-8 h-8 text-white" />
          </div>

          {/* Heading */}
          <h2 className="text-2xl font-black text-white text-center mb-2">
            Wait! We'd Hate to See You Go
          </h2>

          {/* Offer message */}
          <p className="text-electric-cyan text-center font-medium mb-4">
            Stay and get 20% off your next 3 months
          </p>

          {/* Description */}
          <p className="text-text-secondary text-center mb-6">
            As a valued {tierName} member, we want to offer you a special discount to continue enjoying unlimited AI-powered tech support.
          </p>

          {/* Offer details card */}
          <div className="bg-midnight-800/50 rounded-2xl p-5 mb-6 border border-scout-purple/30">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-scout-purple/20 flex items-center justify-center shrink-0">
                <span className="text-2xl font-black text-scout-purple">20%</span>
              </div>
              <div>
                <div className="text-white font-bold text-lg">Special Offer</div>
                <div className="text-sm text-text-secondary">
                  Save 20% on your next 3 billing cycles
                </div>
              </div>
            </div>
          </div>

          {/* What you'll keep - Feature Bar */}
          <div className="mb-6">
            <p className="text-xs text-text-muted uppercase tracking-wider text-center mb-4">
              What you'll keep
            </p>
            <div className="grid grid-cols-4 gap-2">
              {/* Chat */}
              <div className="flex flex-col items-center p-3 rounded-xl bg-midnight-800/60 border border-midnight-700">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-electric-indigo to-electric-cyan flex items-center justify-center mb-2">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs text-center text-text-secondary font-medium leading-tight">
                  Unlimited Chat
                </span>
              </div>

              {/* Photo */}
              <div className="flex flex-col items-center p-3 rounded-xl bg-midnight-800/60 border border-midnight-700">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-scout-purple to-electric-indigo flex items-center justify-center mb-2">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs text-center text-text-secondary font-medium leading-tight">
                  Photo Analysis
                </span>
              </div>

              {/* Video */}
              <div className="flex flex-col items-center p-3 rounded-xl bg-midnight-800/60 border border-midnight-700">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-electric-cyan to-scout-glow flex items-center justify-center mb-2">
                  <Video className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs text-center text-text-secondary font-medium leading-tight">
                  {tier === 'pro' ? '5' : '2'} Video/mo
                </span>
              </div>

              {/* History */}
              <div className="flex flex-col items-center p-3 rounded-xl bg-midnight-800/60 border border-midnight-700">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-scout-glow to-scout-purple flex items-center justify-center mb-2">
                  <History className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs text-center text-text-secondary font-medium leading-tight">
                  Session History
                </span>
              </div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-400 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* CTA Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleAcceptOffer}
              disabled={isAccepting || isCanceling}
              className="w-full py-4 rounded-full font-bold text-white btn-gradient-electric shadow-lg shadow-electric-indigo/30 hover:shadow-electric-indigo/50 hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isAccepting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Applying Discount...
                </>
              ) : (
                <>
                  <Gift className="w-5 h-5" />
                  Accept 20% Off Offer
                </>
              )}
            </button>

            <button
              onClick={handleConfirmCancel}
              disabled={isAccepting || isCanceling}
              className="w-full py-3 rounded-full font-medium text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isCanceling ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Canceling...
                </>
              ) : (
                'No Thanks, Cancel Anyway'
              )}
            </button>
          </div>

          {periodEndDate && (
            <p className="text-xs text-text-muted text-center mt-4">
              If you cancel, you'll have access until {formatDate(periodEndDate)}
            </p>
          )}
        </div>

        {/* Bottom gradient glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-scout-purple/20 blur-3xl pointer-events-none" />
      </div>
    </div>
  );
};

export default ChurnPreventionModal;
