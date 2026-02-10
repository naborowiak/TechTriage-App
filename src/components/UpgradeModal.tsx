import React, { useState, useRef } from 'react';
import { X, Zap, MessageSquare, Mic, Sparkles, Check, Camera, Video, Clock, ShoppingCart, ArrowRight } from 'lucide-react';
import { VIDEO_CREDIT_PRICES } from '../stores/usageStore';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: 'chat' | 'photo' | 'videoDiagnostic' | 'signal' | 'voice';
  currentTier?: 'guest' | 'free' | 'home' | 'pro';
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, feature, currentTier = 'free' }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(modalRef, { onClose, active: isOpen });
  if (!isOpen) return null;

  const handleUpgrade = () => {
    // Navigate to pricing page
    window.location.href = '/pricing';
  };

  const getFeatureMessage = () => {
    switch (feature) {
      case 'chat':
        return "You've used all your free messages this month.";
      case 'photo':
        return "You've used your free photo analysis.";
      case 'videoDiagnostic':
        return "Video Diagnostic requires TotalAssist Home or Pro.";
      case 'signal':
        return "Voice support requires TotalAssist Home or Pro.";
      case 'voice':
        return "Voice Mode requires TotalAssist Home or Pro for 15-minute AI-guided diagnostics.";
      default:
        return "Upgrade to unlock more TotalAssist features.";
    }
  };

  const getRecommendedPlan = () => {
    // Recommend Home for free users, Pro for home users
    if (currentTier === 'home') {
      return { name: 'TotalAssist Pro', price: '$19.99', videoCredits: '15/month' };
    }
    return { name: 'TotalAssist Home', price: '$9.99', videoCredits: '1/week' };
  };

  const plan = getRecommendedPlan();

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
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-electric-indigo via-electric-cyan to-scout-purple" />

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
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-scout-purple to-electric-indigo flex items-center justify-center shadow-glow-scout">
            <Sparkles className="w-8 h-8 text-white" />
          </div>

          {/* Heading */}
          <h2 className="text-2xl font-black text-white text-center mb-2">
            Unlock the Full TotalAssist Experience
          </h2>

          {/* Feature-specific message */}
          <p className="text-electric-cyan text-center font-medium mb-4">
            {getFeatureMessage()}
          </p>

          {/* Description */}
          <p className="text-text-secondary text-center mb-8">
            Get unlimited chat, photo analysis, voice support, and video diagnostics with {plan.name}.
          </p>

          {/* Feature list */}
          <div className="space-y-3 mb-8">
            <div className="flex items-center gap-3 text-text-secondary">
              <div className="w-8 h-8 rounded-lg bg-electric-indigo/20 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-electric-indigo" />
              </div>
              <span className="text-sm">Unlimited Chat Support</span>
              <Check className="w-4 h-4 text-electric-cyan ml-auto" />
            </div>
            <div className="flex items-center gap-3 text-text-secondary">
              <div className="w-8 h-8 rounded-lg bg-electric-indigo/20 flex items-center justify-center">
                <Camera className="w-4 h-4 text-electric-indigo" />
              </div>
              <span className="text-sm">Unlimited Photo Analysis</span>
              <Check className="w-4 h-4 text-electric-cyan ml-auto" />
            </div>
            <div className="flex items-center gap-3 text-text-secondary">
              <div className="w-8 h-8 rounded-lg bg-electric-indigo/20 flex items-center justify-center">
                <Mic className="w-4 h-4 text-electric-indigo" />
              </div>
              <span className="text-sm">Voice Support</span>
              <Check className="w-4 h-4 text-electric-cyan ml-auto" />
            </div>
            <div className="flex items-center gap-3 text-text-secondary">
              <div className="w-8 h-8 rounded-lg bg-electric-indigo/20 flex items-center justify-center">
                <Video className="w-4 h-4 text-electric-indigo" />
              </div>
              <span className="text-sm">Video Diagnostic ({plan.videoCredits})</span>
              <Check className="w-4 h-4 text-electric-cyan ml-auto" />
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleUpgrade}
              className="w-full py-4 rounded-full font-bold text-white btn-gradient-electric shadow-lg shadow-electric-indigo/30 hover:shadow-electric-indigo/50 hover:brightness-110 transition-all flex items-center justify-center gap-2"
            >
              <Zap className="w-5 h-5" />
              Get {plan.name} — {plan.price}/mo
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-full font-medium text-text-secondary hover:text-white hover:bg-midnight-800 transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>

        {/* Bottom gradient glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-scout-purple/20 blur-3xl pointer-events-none" />
      </div>
    </div>
  );
};

// Signup Gate Modal - for guests
interface SignupGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignup: () => void;
}

export const SignupGateModal: React.FC<SignupGateModalProps> = ({ isOpen, onClose, onSignup }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(modalRef, { onClose, active: isOpen });
  if (!isOpen) return null;

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
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-electric-indigo to-electric-cyan" />

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
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-electric-indigo to-electric-cyan flex items-center justify-center">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>

          {/* Heading */}
          <h2 className="text-2xl font-black text-white text-center mb-4">
            Save Your Session
          </h2>

          {/* Description */}
          <p className="text-text-secondary text-center mb-8 leading-relaxed">
            Create a free account to continue chatting with our support team and save your troubleshooting history. No credit card required.
          </p>

          {/* Benefits */}
          <div className="bg-midnight-800/50 rounded-2xl p-4 mb-8 border border-midnight-700">
            <div className="text-sm text-text-secondary space-y-2">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-electric-cyan" />
                <span>5 free chat messages per month</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-electric-cyan" />
                <span>1 free photo analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-electric-cyan" />
                <span>Save your troubleshooting history</span>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <button
              onClick={onSignup}
              className="w-full py-4 rounded-full font-bold text-white btn-gradient-electric shadow-lg shadow-electric-indigo/30 hover:shadow-electric-indigo/50 hover:brightness-110 transition-all"
            >
              Sign Up Free
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-full font-medium text-text-secondary hover:text-white hover:bg-midnight-800 transition-colors"
            >
              Continue as Guest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Refill Credits Modal - for Home/Pro users who ran out of video credits
interface RefillCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: 'home' | 'pro';
  daysUntilReset: number;
  resetType: 'weekly' | 'monthly';
  onPurchase: (credits: number, price: number) => void;
  onUpgrade?: () => void;
}

export const RefillCreditsModal: React.FC<RefillCreditsModalProps> = ({
  isOpen,
  onClose,
  currentTier,
  daysUntilReset,
  resetType,
  onPurchase,
  onUpgrade,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(modalRef, { onClose, active: isOpen });
  const [selectedOption, setSelectedOption] = useState<'single' | 'pack' | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  if (!isOpen) return null;

  const handlePurchase = async () => {
    if (!selectedOption) return;

    setIsPurchasing(true);
    const option = VIDEO_CREDIT_PRICES[selectedOption];

    try {
      await onPurchase(option.credits, option.price);
      onClose();
    } catch (error) {
      console.error('Purchase failed:', error);
    } finally {
      setIsPurchasing(false);
    }
  };

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
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-scout-purple via-scout-glow to-electric-cyan" />

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
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-scout-purple to-scout-glow flex items-center justify-center">
            <Video className="w-8 h-8 text-white" />
          </div>

          {/* Heading */}
          <h2 className="text-2xl font-black text-white text-center mb-2">
            Need More Video Credits?
          </h2>

          {/* Message */}
          <p className="text-text-secondary text-center mb-6">
            You've used your Video Diagnostic credit{currentTier === 'pro' ? 's' : ''} for this {resetType === 'weekly' ? 'week' : 'month'}.
          </p>

          {/* Option 1: Wait for reset */}
          <div className="bg-midnight-800/50 rounded-xl p-4 mb-4 border border-midnight-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-electric-cyan/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-electric-cyan" />
              </div>
              <div>
                <div className="text-white font-medium">Wait for Reset</div>
                <div className="text-sm text-text-secondary">
                  Your credit{currentTier === 'pro' ? 's reset' : ' resets'} in {daysUntilReset} day{daysUntilReset !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </div>

          {/* Option 2: Upgrade (only for Home users) */}
          {currentTier === 'home' && onUpgrade && (
            <button
              onClick={onUpgrade}
              className="w-full bg-midnight-800/50 rounded-xl p-4 mb-4 border border-midnight-700 hover:border-scout-purple/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-scout-purple/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-scout-purple" />
                </div>
                <div className="flex-1">
                  <div className="text-white font-medium">Upgrade to TotalAssist Pro</div>
                  <div className="text-sm text-text-secondary">
                    Get 15 credits/month + multi-home support — $19.99/mo
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-text-muted" />
              </div>
            </button>
          )}

          {/* Option 3: Buy instant credits */}
          <div className="mb-6">
            <div className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">
              Or buy instant credits
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSelectedOption('single')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedOption === 'single'
                    ? 'border-electric-cyan bg-electric-cyan/10'
                    : 'border-midnight-700 hover:border-midnight-600'
                }`}
              >
                <div className="text-2xl font-black text-white mb-1">1</div>
                <div className="text-sm text-text-secondary">Credit</div>
                <div className="text-electric-cyan font-bold mt-2">${VIDEO_CREDIT_PRICES.single.price}</div>
              </button>
              <button
                onClick={() => setSelectedOption('pack')}
                className={`p-4 rounded-xl border-2 transition-all relative ${
                  selectedOption === 'pack'
                    ? 'border-electric-cyan bg-electric-cyan/10'
                    : 'border-midnight-700 hover:border-midnight-600'
                }`}
              >
                <div className="absolute -top-2 -right-2 bg-scout-glow text-midnight-950 text-xs font-bold px-2 py-0.5 rounded-full">
                  SAVE 20%
                </div>
                <div className="text-2xl font-black text-white mb-1">3</div>
                <div className="text-sm text-text-secondary">Credits</div>
                <div className="text-electric-cyan font-bold mt-2">${VIDEO_CREDIT_PRICES.pack.price}</div>
              </button>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <button
              onClick={handlePurchase}
              disabled={!selectedOption || isPurchasing}
              className={`w-full py-4 rounded-full font-bold text-white transition-all flex items-center justify-center gap-2 ${
                selectedOption
                  ? 'btn-gradient-electric shadow-lg shadow-electric-indigo/30 hover:shadow-electric-indigo/50 hover:brightness-110'
                  : 'bg-midnight-700 text-text-muted cursor-not-allowed'
              }`}
            >
              <ShoppingCart className="w-5 h-5" />
              {isPurchasing ? 'Processing...' : selectedOption ? `Buy ${selectedOption === 'single' ? '1 Credit' : '3 Credits'}` : 'Select an option'}
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-full font-medium text-text-secondary hover:text-white hover:bg-midnight-800 transition-colors"
            >
              I'll Wait
            </button>
          </div>
        </div>

        {/* Bottom gradient glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-scout-purple/20 blur-3xl pointer-events-none" />
      </div>
    </div>
  );
};
