import React, { useState, useEffect } from 'react';
import { CreditCard, Calendar, ArrowUpRight, Check, AlertTriangle, Loader2, Zap, MessageSquare, Camera, Video, RefreshCw, Star, Home, Building } from 'lucide-react';
import { useSubscription, SubscriptionTier, VideoCredits } from '../hooks/useSubscription';
import { ChurnPreventionModal } from './ChurnPreventionModal';

interface BillingManagementProps {
  userId: string;
}

const tierNames: Record<SubscriptionTier, string> = {
  free: 'Chat (Free)',
  home: 'Home',
  pro: 'Pro',
};

const tierColors: Record<SubscriptionTier, string> = {
  free: 'bg-gray-100 dark:bg-midnight-700 text-gray-700 dark:text-gray-300',
  home: 'bg-electric-indigo/20 text-electric-indigo',
  pro: 'bg-scout-purple/20 text-scout-purple',
};

export const BillingManagement: React.FC<BillingManagementProps> = ({ userId }) => {
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showChurnOffer, setShowChurnOffer] = useState(false);
  const [isBuyingCredits, setIsBuyingCredits] = useState<'single' | 'pack' | null>(null);

  const {
    tier,
    status,
    billingInterval,
    usage,
    limits,
    videoCredits,
    currentPeriodEnd,
    cancelAtPeriodEnd,
    trialEnd,
    isInTrial,
    isLoading,
    openPortal,
    startCheckout,
    cancelSubscription,
    reactivateSubscription,
    getDaysUntilRenewal,
    canUseFeature,
    getRemainingUses,
    refetch,
    prices,
  } = useSubscription(userId);

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-refresh subscription status when landing on Billing page
  useEffect(() => {
    refetch();
  }, [refetch]);

  const handleRefreshStatus = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleManageBilling = async () => {
    setIsPortalLoading(true);
    try {
      await openPortal();
    } catch (error) {
      console.error('Failed to open billing portal:', error);
      alert('Failed to open billing portal. Please try again.');
    } finally {
      setIsPortalLoading(false);
    }
  };

  // Called when user clicks "Cancel" in initial confirmation - show churn offer
  const handleShowChurnOffer = () => {
    setShowCancelConfirm(false);
    setShowChurnOffer(true);
  };

  // Called when user accepts the retention discount
  const handleAcceptRetentionOffer = async () => {
    const response = await fetch('/api/subscription/apply-retention-discount', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ userId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to apply discount');
    }

    // Refresh subscription status
    await refetch();
  };

  // Called when user confirms cancellation (after declining churn offer)
  const handleConfirmCancel = async () => {
    await cancelSubscription();
    setShowChurnOffer(false);
  };

  const handleReactivate = async () => {
    setIsReactivating(true);
    try {
      await reactivateSubscription();
    } catch (error) {
      console.error('Failed to reactivate subscription:', error);
      alert('Failed to reactivate subscription. Please try again.');
    } finally {
      setIsReactivating(false);
    }
  };

  // Credit pack price IDs
  const creditPrices = {
    single: 'price_1SxBftPeLuLIM8GmX9sxeASx',  // $5 - 1 credit
    pack: 'price_1SxBgLPeLuLIM8GmkJ27pvdX',    // $12 - 3 credits
  };

  const handleBuyCredits = async (packType: 'single' | 'pack') => {
    setIsBuyingCredits(packType);
    try {
      await startCheckout(creditPrices[packType]);
    } catch (error) {
      console.error('Failed to start credit purchase:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setIsBuyingCredits(null);
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

  const daysUntilRenewal = getDaysUntilRenewal();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-electric-indigo" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-bold text-text-primary dark:text-white mb-6">Billing & Subscription</h2>

      {/* Current Plan Card */}
      <div className="bg-white dark:bg-midnight-800 rounded-2xl p-6 border border-gray-200 dark:border-midnight-700 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${tierColors[tier]}`}>
                {tierNames[tier]}
              </span>
              {isInTrial && (
                <span className="px-3 py-1 rounded-full text-sm font-bold bg-electric-cyan/20 text-electric-cyan">
                  Trial
                </span>
              )}
              {cancelAtPeriodEnd && (
                <span className="px-3 py-1 rounded-full text-sm font-bold bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400">
                  Canceling
                </span>
              )}
              {status === 'past_due' && (
                <span className="px-3 py-1 rounded-full text-sm font-bold bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400">
                  Past Due
                </span>
              )}
              <button
                onClick={handleRefreshStatus}
                disabled={isRefreshing}
                className="p-1.5 text-gray-400 dark:text-midnight-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-midnight-700 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh subscription status"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <p className="text-text-secondary">
              {tier === 'free'
                ? 'Basic AI chat support'
                : billingInterval === 'annual'
                ? `Billed annually`
                : `Billed monthly`}
            </p>
          </div>

          {tier !== 'free' && (
            <button
              onClick={handleManageBilling}
              disabled={isPortalLoading}
              className="flex items-center gap-2 px-4 py-2 bg-midnight-900 dark:bg-midnight-700 text-white rounded-lg hover:bg-midnight-800 dark:hover:bg-midnight-600 transition-colors disabled:opacity-50"
            >
              {isPortalLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4" />
              )}
              Manage Billing
              <ArrowUpRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Billing Info */}
        {tier !== 'free' && (
          <div className="grid sm:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-midnight-900 rounded-xl">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-400 dark:text-midnight-400" />
              <div>
                <div className="text-sm text-text-muted">
                  {cancelAtPeriodEnd ? 'Access Until' : isInTrial ? 'Trial Ends' : 'Next Billing'}
                </div>
                <div className="font-semibold text-text-primary dark:text-white">
                  {formatDate(isInTrial ? trialEnd : currentPeriodEnd)}
                  {daysUntilRenewal !== null && (
                    <span className="text-sm font-normal text-text-muted ml-2">
                      ({daysUntilRenewal} days)
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-gray-400 dark:text-midnight-400" />
              <div>
                <div className="text-sm text-text-muted">Status</div>
                <div className="font-semibold text-text-primary dark:text-white">
                  {status === 'active' && !cancelAtPeriodEnd && 'Active'}
                  {status === 'trialing' && 'Trial Active'}
                  {status === 'past_due' && 'Payment Required'}
                  {cancelAtPeriodEnd && 'Canceling at period end'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cancel/Reactivate Section */}
        {tier !== 'free' && !cancelAtPeriodEnd && status !== 'canceled' && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-midnight-700">
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="text-sm text-text-muted hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              Cancel subscription
            </button>
          </div>
        )}

        {cancelAtPeriodEnd && (
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-500/10 rounded-xl border border-yellow-200 dark:border-yellow-500/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-yellow-800 dark:text-yellow-300 font-medium">Your subscription is set to cancel</p>
                <p className="text-yellow-700 dark:text-yellow-400 text-sm mt-1">
                  You'll lose access to premium features on {formatDate(currentPeriodEnd)}.
                </p>
                <button
                  onClick={handleReactivate}
                  disabled={isReactivating}
                  className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  {isReactivating && <Loader2 className="w-4 h-4 animate-spin" />}
                  Keep My Subscription
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Usage Section */}
      <div className="bg-white dark:bg-midnight-800 rounded-2xl p-6 border border-gray-200 dark:border-midnight-700 mb-6">
        <h3 className="text-lg font-bold text-text-primary dark:text-white mb-4">Current Usage</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          {/* Chat Sessions */}
          <UsageCard
            icon={<MessageSquare className="w-5 h-5" />}
            title="Chat Sessions"
            used={usage.chatSessions}
            limit={limits.chatSessions}
            canUse={canUseFeature('chat')}
            remaining={getRemainingUses('chat')}
          />

          {/* Photo Analyses */}
          <UsageCard
            icon={<Camera className="w-5 h-5" />}
            title="Photo Analyses"
            used={usage.photoAnalyses}
            limit={limits.photoAnalyses}
            canUse={canUseFeature('photo')}
            remaining={getRemainingUses('photo')}
            notAvailable={limits.photoAnalyses === 0}
          />

          {/* Video Diagnostics - Enhanced with credit breakdown */}
          <VideoCreditsCard
            icon={<Video className="w-5 h-5" />}
            videoCredits={videoCredits}
            canUse={canUseFeature('live')}
          />
        </div>

        {currentPeriodEnd && (
          <p className="text-sm text-text-muted mt-4">
            Included sessions reset on {formatDate(currentPeriodEnd)}. Purchased credits never expire.
          </p>
        )}
      </div>

      {/* Buy More Credits Section */}
      <div className="bg-white dark:bg-midnight-800 rounded-2xl p-6 border border-gray-200 dark:border-midnight-700 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-text-primary dark:text-white">Video Diagnostic Credits</h3>
            <p className="text-sm text-text-muted">Purchase additional video sessions anytime</p>
          </div>
          {videoCredits.purchased > 0 && (
            <div className="text-right">
              <div className="text-sm text-text-muted">Purchased credits</div>
              <div className="text-xl font-bold text-scout-purple">{videoCredits.purchased}</div>
            </div>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {/* Single Credit */}
          <div className="p-4 rounded-xl border border-gray-200 dark:border-midnight-600 hover:border-scout-purple/50 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-text-primary dark:text-white">1 Credit</span>
              <span className="text-lg font-bold text-text-primary dark:text-white">$5</span>
            </div>
            <p className="text-xs text-text-muted mb-3">One video diagnostic session</p>
            <button
              onClick={() => handleBuyCredits('single')}
              disabled={isBuyingCredits !== null}
              className="w-full py-2 rounded-lg text-sm font-semibold border-2 border-scout-purple text-scout-purple hover:bg-scout-purple hover:text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isBuyingCredits === 'single' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Buy Now'
              )}
            </button>
          </div>

          {/* 3-Pack */}
          <div className="p-4 rounded-xl border-2 border-scout-purple relative bg-scout-purple/5">
            <div className="absolute -top-2 right-3 bg-scout-purple text-white text-xs font-bold px-2 py-0.5 rounded-full">
              SAVE $3
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-text-primary dark:text-white">3 Credits</span>
              <div className="text-right">
                <span className="text-lg font-bold text-text-primary dark:text-white">$12</span>
                <span className="text-xs text-text-muted ml-1 line-through">$15</span>
              </div>
            </div>
            <p className="text-xs text-text-muted mb-3">Three video diagnostic sessions</p>
            <button
              onClick={() => handleBuyCredits('pack')}
              disabled={isBuyingCredits !== null}
              className="w-full py-2 rounded-lg text-sm font-semibold bg-scout-purple text-white hover:bg-scout-purple/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isBuyingCredits === 'pack' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Buy 3-Pack'
              )}
            </button>
          </div>
        </div>

        <p className="text-xs text-text-muted mt-4 text-center">
          Credits never expire and can be used anytime for live video support.
        </p>
      </div>

      {/* Upgrade Plans for Free Users */}
      {tier === 'free' && (
        <UpgradePlansSection startCheckout={startCheckout} prices={prices} />
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-midnight-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-primary dark:text-white">Cancel Subscription?</h3>
                <p className="text-sm text-text-muted">This action can be undone before the period ends</p>
              </div>
            </div>
            <p className="text-text-secondary mb-6">
              Your subscription will remain active until {formatDate(currentPeriodEnd)}. After that, you'll be downgraded to the free plan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 px-4 py-3 border-2 border-gray-200 dark:border-midnight-600 rounded-xl font-semibold text-text-primary dark:text-white hover:bg-gray-50 dark:hover:bg-midnight-700 transition-colors"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleShowChurnOffer}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                Continue to Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Churn Prevention Modal */}
      <ChurnPreventionModal
        isOpen={showChurnOffer}
        onClose={() => setShowChurnOffer(false)}
        onAcceptOffer={handleAcceptRetentionOffer}
        onConfirmCancel={handleConfirmCancel}
        tier={tier === 'pro' ? 'pro' : 'home'}
        periodEndDate={currentPeriodEnd}
      />
    </div>
  );
};

// Usage Card Component
const UsageCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  used: number;
  limit: number;
  canUse: boolean;
  remaining: number | 'unlimited';
  notAvailable?: boolean;
}> = ({ icon, title, used, limit, canUse, remaining, notAvailable }) => {
  const isUnlimited = !isFinite(limit);
  const percentage = isUnlimited ? 0 : Math.min((used / limit) * 100, 100);
  const isAtLimit = !canUse && !notAvailable;

  return (
    <div className={`p-4 rounded-xl border ${notAvailable ? 'bg-gray-50 dark:bg-midnight-900 border-gray-200 dark:border-midnight-700' : 'bg-white dark:bg-midnight-800 border-gray-200 dark:border-midnight-700'}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`${notAvailable ? 'text-gray-400 dark:text-midnight-500' : 'text-text-primary dark:text-white'}`}>{icon}</div>
        <span className={`font-medium ${notAvailable ? 'text-gray-400 dark:text-midnight-500' : 'text-text-primary dark:text-white'}`}>{title}</span>
      </div>

      {notAvailable ? (
        <div className="text-sm text-gray-400 dark:text-midnight-500">Not available on your plan</div>
      ) : isUnlimited ? (
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-green-500" />
          <span className="text-green-600 dark:text-green-400 font-medium">Unlimited</span>
        </div>
      ) : (
        <>
          <div className="flex items-baseline gap-1 mb-2">
            <span className={`text-2xl font-bold ${isAtLimit ? 'text-red-600 dark:text-red-400' : 'text-text-primary dark:text-white'}`}>
              {used}
            </span>
            <span className="text-text-muted">/ {limit}</span>
          </div>
          <div className="w-full h-2 bg-gray-100 dark:bg-midnight-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isAtLimit ? 'bg-red-500' : percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="text-xs text-text-muted mt-1">
            {remaining === 'unlimited' ? 'Unlimited remaining' : `${remaining} remaining`}
          </div>
        </>
      )}
    </div>
  );
};

// Video Credits Card Component - shows breakdown of included vs purchased credits
const VideoCreditsCard: React.FC<{
  icon: React.ReactNode;
  videoCredits: VideoCredits;
  canUse: boolean;
}> = ({ icon, videoCredits, canUse }) => {
  const { included, purchased, used, remaining } = videoCredits;
  const total = included + purchased;
  const hasNoCredits = total === 0 && purchased === 0;
  const percentage = total > 0 ? Math.min((used / total) * 100, 100) : 0;
  const isAtLimit = !canUse && !hasNoCredits;

  return (
    <div className="p-4 rounded-xl border bg-white dark:bg-midnight-800 border-gray-200 dark:border-midnight-700">
      <div className="flex items-center gap-2 mb-3">
        <div className="text-text-primary dark:text-white">{icon}</div>
        <span className="font-medium text-text-primary dark:text-white">Video Diagnostics</span>
      </div>

      {hasNoCredits ? (
        <div className="text-sm text-text-muted">
          <p>No sessions available</p>
          <p className="text-xs mt-1">Purchase credits to use video diagnostics</p>
        </div>
      ) : (
        <>
          {/* Main usage display */}
          <div className="flex items-baseline gap-1 mb-2">
            <span className={`text-2xl font-bold ${isAtLimit ? 'text-red-600 dark:text-red-400' : 'text-text-primary dark:text-white'}`}>
              {remaining}
            </span>
            <span className="text-text-muted">remaining</span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-gray-100 dark:bg-midnight-700 rounded-full overflow-hidden mb-3">
            <div
              className={`h-full rounded-full transition-all ${
                isAtLimit ? 'bg-red-500' : percentage > 80 ? 'bg-yellow-500' : 'bg-scout-purple'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Credit breakdown */}
          <div className="space-y-1 text-xs">
            {included > 0 && (
              <div className="flex justify-between text-text-muted">
                <span>Included (plan)</span>
                <span>{included}</span>
              </div>
            )}
            {purchased > 0 && (
              <div className="flex justify-between text-scout-purple">
                <span>Purchased credits</span>
                <span>+{purchased}</span>
              </div>
            )}
            <div className="flex justify-between text-text-muted pt-1 border-t border-gray-100 dark:border-midnight-700">
              <span>Used this period</span>
              <span>-{used}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Upgrade Plans Section for Free Users
const UpgradePlansSection: React.FC<{
  startCheckout: (priceId: string) => Promise<void>;
  prices: { home: { monthly: string; annual: string }; pro: { monthly: string; annual: string } } | null;
}> = ({ startCheckout, prices }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [isCheckingOut, setIsCheckingOut] = useState<string | null>(null);

  const handleUpgrade = async (planPriceId: string) => {
    setIsCheckingOut(planPriceId);
    try {
      await startCheckout(planPriceId);
    } catch (error) {
      console.error('Checkout failed:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setIsCheckingOut(null);
    }
  };

  const plans = [
    {
      id: 'home',
      name: 'Home',
      icon: <Home className="w-6 h-6" />,
      monthlyPrice: 25,
      annualPrice: 228,
      monthlyPriceId: prices?.home?.monthly,
      annualPriceId: prices?.home?.annual,
      description: 'Perfect for homeowners',
      features: [
        'Unlimited AI chat sessions',
        'Unlimited photo analysis',
        '2 video sessions/month',
        'Session history',
      ],
      color: 'purple', // scout-purple theme
    },
    {
      id: 'pro',
      name: 'Pro',
      icon: <Building className="w-6 h-6" />,
      monthlyPrice: 59,
      annualPrice: 588,
      monthlyPriceId: prices?.pro?.monthly,
      annualPriceId: prices?.pro?.annual,
      description: 'Best for families & landlords',
      features: [
        'Everything in Home',
        '5 video sessions/month',
        'Multi-home support (up to 5)',
        'Priority support',
      ],
      color: 'cyan', // electric-cyan premium theme
    },
  ];

  return (
    <div className="bg-white dark:bg-midnight-800 rounded-2xl p-6 border border-gray-200 dark:border-midnight-700">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-text-primary dark:text-white mb-2">
          Upgrade Your Plan
        </h3>
        <p className="text-text-secondary dark:text-gray-400">
          Get unlimited access and more features with a paid plan
        </p>
      </div>

      {/* Billing Toggle - Mobile Friendly */}
      <div className="flex flex-col items-center gap-3 mb-6">
        <div className="inline-flex items-center bg-gray-100 dark:bg-midnight-700 rounded-full p-1">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 text-sm font-semibold rounded-full transition-all ${
              billingCycle === 'monthly'
                ? 'bg-white dark:bg-midnight-600 text-text-primary dark:text-white shadow-sm'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-4 py-2 text-sm font-semibold rounded-full transition-all ${
              billingCycle === 'annual'
                ? 'bg-white dark:bg-midnight-600 text-text-primary dark:text-white shadow-sm'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            Annual
          </button>
        </div>
        {billingCycle === 'annual' && (
          <span className="px-3 py-1 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 text-xs font-bold rounded-full">
            Save 24% with annual billing
          </span>
        )}
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {plans.map((plan) => {
          const price = billingCycle === 'monthly' ? plan.monthlyPrice : Math.round(plan.annualPrice / 12);
          const priceId = billingCycle === 'monthly' ? plan.monthlyPriceId : plan.annualPriceId;
          const isLoading = isCheckingOut === priceId;
          const isPurple = plan.color === 'purple';
          const isCyan = plan.color === 'cyan';

          return (
            <div
              key={plan.id}
              className={`relative p-5 rounded-xl border-2 transition-all ${
                isPurple
                  ? 'border-scout-purple bg-scout-purple/5'
                  : 'border-electric-cyan bg-electric-cyan/5'
              }`}
            >
              {/* Plan Badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className={`inline-flex items-center gap-1 px-3 py-1 text-white text-xs font-bold rounded-full ${
                  isPurple ? 'bg-scout-purple' : 'bg-gradient-to-r from-electric-cyan to-electric-indigo'
                }`}>
                  <Star className="w-3 h-3" /> {isPurple ? 'MOST POPULAR' : 'PREMIUM'}
                </span>
              </div>

              <div className="flex items-center gap-3 mb-3 mt-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isPurple
                    ? 'bg-scout-purple/20 text-scout-purple'
                    : 'bg-electric-cyan/20 text-electric-cyan'
                }`}>
                  {plan.icon}
                </div>
                <div>
                  <h4 className="font-bold text-text-primary dark:text-white">{plan.name}</h4>
                  <p className="text-xs text-text-muted">{plan.description}</p>
                </div>
              </div>

              <div className="mb-4">
                <span className={`text-3xl font-bold ${isCyan ? 'text-electric-cyan' : 'text-text-primary dark:text-white'}`}>
                  ${price}
                </span>
                <span className="text-text-muted">/mo</span>
                {billingCycle === 'annual' && (
                  <span className="block text-xs text-text-muted">
                    Billed ${plan.annualPrice}/year
                  </span>
                )}
              </div>

              <ul className="space-y-2 mb-4">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className={`w-4 h-4 shrink-0 mt-0.5 ${isCyan ? 'text-electric-cyan' : 'text-green-500'}`} />
                    <span className="text-text-secondary dark:text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => priceId && handleUpgrade(priceId)}
                disabled={!priceId || isCheckingOut !== null}
                className={`w-full py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg ${
                  isPurple
                    ? 'bg-gradient-to-r from-scout-purple to-electric-indigo text-white hover:brightness-110 hover:shadow-scout-purple/40'
                    : 'bg-gradient-to-r from-electric-cyan to-electric-indigo text-white hover:brightness-110 hover:shadow-electric-cyan/40'
                } disabled:opacity-50 disabled:shadow-none`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Upgrade to {plan.name}
                    <ArrowUpRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-text-muted text-center mt-4">
        Cancel anytime. All plans include access to TotalAssist support.
      </p>
    </div>
  );
};

export default BillingManagement;
