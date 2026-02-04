import React, { useState } from 'react';
import { CreditCard, Calendar, ArrowUpRight, Check, AlertTriangle, Loader2, Zap, MessageSquare, Camera, Video, RefreshCw } from 'lucide-react';
import { useSubscription, SubscriptionTier } from '../hooks/useSubscription';

interface BillingManagementProps {
  userId: string;
  onViewPlans?: () => void;
}

const tierNames: Record<SubscriptionTier, string> = {
  free: 'Chat (Free)',
  home: 'Home',
  pro: 'Pro',
};

const tierColors: Record<SubscriptionTier, string> = {
  free: 'bg-gray-100 text-gray-700',
  home: 'bg-orange-100 text-orange-700',
  pro: 'bg-purple-100 text-purple-700',
};

export const BillingManagement: React.FC<BillingManagementProps> = ({ userId, onViewPlans }) => {
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const {
    tier,
    status,
    billingInterval,
    usage,
    limits,
    currentPeriodEnd,
    cancelAtPeriodEnd,
    trialEnd,
    isInTrial,
    isLoading,
    openPortal,
    cancelSubscription,
    reactivateSubscription,
    getDaysUntilRenewal,
    canUseFeature,
    getRemainingUses,
    refetch,
  } = useSubscription(userId);

  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const handleCancelSubscription = async () => {
    setIsCanceling(true);
    try {
      await cancelSubscription();
      setShowCancelConfirm(false);
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      alert('Failed to cancel subscription. Please try again.');
    } finally {
      setIsCanceling(false);
    }
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
        <Loader2 className="w-8 h-8 animate-spin text-[#F97316]" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-bold text-[#1F2937] mb-6">Billing & Subscription</h2>

      {/* Current Plan Card */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${tierColors[tier]}`}>
                {tierNames[tier]}
              </span>
              {isInTrial && (
                <span className="px-3 py-1 rounded-full text-sm font-bold bg-blue-100 text-blue-700">
                  Trial
                </span>
              )}
              {cancelAtPeriodEnd && (
                <span className="px-3 py-1 rounded-full text-sm font-bold bg-red-100 text-red-700">
                  Canceling
                </span>
              )}
              {status === 'past_due' && (
                <span className="px-3 py-1 rounded-full text-sm font-bold bg-yellow-100 text-yellow-700">
                  Past Due
                </span>
              )}
              <button
                onClick={handleRefreshStatus}
                disabled={isRefreshing}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh subscription status"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <p className="text-gray-600">
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
              className="flex items-center gap-2 px-4 py-2 bg-[#1F2937] text-white rounded-lg hover:bg-[#374151] transition-colors disabled:opacity-50"
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
          <div className="grid sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-500">
                  {cancelAtPeriodEnd ? 'Access Until' : isInTrial ? 'Trial Ends' : 'Next Billing'}
                </div>
                <div className="font-semibold text-[#1F2937]">
                  {formatDate(isInTrial ? trialEnd : currentPeriodEnd)}
                  {daysUntilRenewal !== null && (
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      ({daysUntilRenewal} days)
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-500">Status</div>
                <div className="font-semibold text-[#1F2937]">
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
          <div className="mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="text-sm text-gray-500 hover:text-red-600 transition-colors"
            >
              Cancel subscription
            </button>
          </div>
        )}

        {cancelAtPeriodEnd && (
          <div className="mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-yellow-800 font-medium">Your subscription is set to cancel</p>
                <p className="text-yellow-700 text-sm mt-1">
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
      <div className="bg-white rounded-2xl p-6 border border-gray-200 mb-6">
        <h3 className="text-lg font-bold text-[#1F2937] mb-4">Current Usage</h3>
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

          {/* Video Diagnostics */}
          <UsageCard
            icon={<Video className="w-5 h-5" />}
            title="Video Diagnostics"
            used={usage.liveSessions}
            limit={limits.liveSessions}
            canUse={canUseFeature('live')}
            remaining={getRemainingUses('live')}
            notAvailable={limits.liveSessions === 0}
          />
        </div>

        {currentPeriodEnd && (
          <p className="text-sm text-gray-500 mt-4">
            Usage resets on {formatDate(currentPeriodEnd)}
          </p>
        )}
      </div>

      {/* Upgrade Prompt for Free Users */}
      {tier === 'free' && (
        <div className="bg-gradient-to-r from-[#F97316] to-[#EA580C] rounded-2xl p-6 text-white">
          <h3 className="text-xl font-bold mb-2">Upgrade to Unlock More</h3>
          <p className="text-white/80 mb-4">
            Get unlimited chat, photo diagnosis, and live video support with the Home or Pro plan.
          </p>
          <button
            onClick={onViewPlans}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#F97316] rounded-lg font-bold hover:bg-gray-100 transition-colors"
          >
            View Plans
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1F2937]">Cancel Subscription?</h3>
                <p className="text-sm text-gray-500">This action can be undone before the period ends</p>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              Your subscription will remain active until {formatDate(currentPeriodEnd)}. After that, you'll be downgraded to the free plan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl font-semibold text-[#1F2937] hover:bg-gray-50 transition-colors"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={isCanceling}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isCanceling && <Loader2 className="w-4 h-4 animate-spin" />}
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
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
    <div className={`p-4 rounded-xl border ${notAvailable ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`${notAvailable ? 'text-gray-400' : 'text-[#1F2937]'}`}>{icon}</div>
        <span className={`font-medium ${notAvailable ? 'text-gray-400' : 'text-[#1F2937]'}`}>{title}</span>
      </div>

      {notAvailable ? (
        <div className="text-sm text-gray-400">Not available on your plan</div>
      ) : isUnlimited ? (
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-green-500" />
          <span className="text-green-600 font-medium">Unlimited</span>
        </div>
      ) : (
        <>
          <div className="flex items-baseline gap-1 mb-2">
            <span className={`text-2xl font-bold ${isAtLimit ? 'text-red-600' : 'text-[#1F2937]'}`}>
              {used}
            </span>
            <span className="text-gray-500">/ {limit}</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isAtLimit ? 'bg-red-500' : percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {remaining === 'unlimited' ? 'Unlimited remaining' : `${remaining} remaining`}
          </div>
        </>
      )}
    </div>
  );
};

export default BillingManagement;
