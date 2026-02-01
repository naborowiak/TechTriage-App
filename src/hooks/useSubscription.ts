import { useState, useEffect, useCallback } from 'react';

export type SubscriptionTier = 'free' | 'home' | 'pro';

export interface SubscriptionUsage {
  chatSessions: number;
  photoAnalyses: number;
  liveSessions: number;
}

export interface SubscriptionLimits {
  chatSessions: number;
  photoAnalyses: number;
  liveSessions: number;
}

export interface SubscriptionState {
  tier: SubscriptionTier;
  status: string;
  billingInterval: 'monthly' | 'annual' | null;
  usage: SubscriptionUsage;
  limits: SubscriptionLimits;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  trialEnd: Date | null;
  isLoading: boolean;
  error: string | null;
}

export interface StripePrices {
  home: {
    monthly: string;
    annual: string;
  };
  pro: {
    monthly: string;
    annual: string;
  };
}

const defaultState: SubscriptionState = {
  tier: 'free',
  status: 'active',
  billingInterval: null,
  usage: { chatSessions: 0, photoAnalyses: 0, liveSessions: 0 },
  limits: { chatSessions: 5, photoAnalyses: 0, liveSessions: 0 },
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  trialEnd: null,
  isLoading: true,
  error: null,
};

export function useSubscription(userId: string | undefined) {
  const [state, setState] = useState<SubscriptionState>(defaultState);
  const [prices, setPrices] = useState<StripePrices | null>(null);

  // Fetch subscription status
  const fetchStatus = useCallback(async () => {
    if (!userId) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      const res = await fetch(`/api/subscription/status/${userId}`, {
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        setState({
          tier: data.tier || 'free',
          status: data.status || 'active',
          billingInterval: data.billingInterval || null,
          usage: data.usage || { chatSessions: 0, photoAnalyses: 0, liveSessions: 0 },
          limits: data.limits || { chatSessions: 5, photoAnalyses: 0, liveSessions: 0 },
          currentPeriodEnd: data.currentPeriodEnd
            ? new Date(data.currentPeriodEnd)
            : null,
          cancelAtPeriodEnd: data.cancelAtPeriodEnd || false,
          trialEnd: data.trialEnd ? new Date(data.trialEnd) : null,
          isLoading: false,
          error: null,
        });
      } else {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: 'Failed to load subscription',
        }));
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load subscription',
      }));
    }
  }, [userId]);

  // Fetch Stripe prices
  const fetchPrices = useCallback(async () => {
    try {
      const res = await fetch('/api/stripe/prices');
      if (res.ok) {
        const data = await res.json();
        setPrices(data.prices);
      }
    } catch (err) {
      console.error('Failed to fetch Stripe prices:', err);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchStatus();
    fetchPrices();
  }, [fetchStatus, fetchPrices]);

  // Start checkout flow
  const startCheckout = async (priceId: string) => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const res = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        userId,
        priceId,
        successUrl: `${window.location.origin}/dashboard?upgraded=true`,
        cancelUrl: `${window.location.origin}/pricing`,
      }),
    });

    if (!res.ok) {
      throw new Error('Failed to create checkout session');
    }

    const { url } = await res.json();
    window.location.href = url;
  };

  // Open customer portal
  const openPortal = async () => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const res = await fetch('/api/stripe/create-portal-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        userId,
        returnUrl: `${window.location.origin}/dashboard`,
      }),
    });

    if (!res.ok) {
      throw new Error('Failed to create portal session');
    }

    const { url } = await res.json();
    window.location.href = url;
  };

  // Cancel subscription
  const cancelSubscription = async () => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const res = await fetch('/api/subscription/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ userId }),
    });

    if (!res.ok) {
      throw new Error('Failed to cancel subscription');
    }

    await fetchStatus();
  };

  // Reactivate subscription
  const reactivateSubscription = async () => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const res = await fetch('/api/subscription/reactivate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ userId }),
    });

    if (!res.ok) {
      throw new Error('Failed to reactivate subscription');
    }

    await fetchStatus();
  };

  // Helper to check if user can use a feature
  const canUseFeature = (feature: 'chat' | 'photo' | 'live'): boolean => {
    if (state.status !== 'active' && state.status !== 'trialing') {
      return false;
    }

    const usageMap = {
      chat: state.usage.chatSessions,
      photo: state.usage.photoAnalyses,
      live: state.usage.liveSessions,
    };

    const limitMap = {
      chat: state.limits.chatSessions,
      photo: state.limits.photoAnalyses,
      live: state.limits.liveSessions,
    };

    const usage = usageMap[feature];
    const limit = limitMap[feature];

    if (limit === 0) return false;
    if (!isFinite(limit)) return true;
    return usage < limit;
  };

  // Helper to get remaining uses for a feature
  const getRemainingUses = (feature: 'chat' | 'photo' | 'live'): number | 'unlimited' => {
    const limitMap = {
      chat: state.limits.chatSessions,
      photo: state.limits.photoAnalyses,
      live: state.limits.liveSessions,
    };

    const usageMap = {
      chat: state.usage.chatSessions,
      photo: state.usage.photoAnalyses,
      live: state.usage.liveSessions,
    };

    const limit = limitMap[feature];
    const usage = usageMap[feature];

    if (!isFinite(limit)) return 'unlimited';
    return Math.max(0, limit - usage);
  };

  // Check if user is in trial
  const isInTrial = state.status === 'trialing' && state.trialEnd && state.trialEnd > new Date();

  // Get days until renewal or trial end
  const getDaysUntilRenewal = (): number | null => {
    const endDate = isInTrial ? state.trialEnd : state.currentPeriodEnd;
    if (!endDate) return null;

    const now = new Date();
    const diffMs = endDate.getTime() - now.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  return {
    // State
    ...state,
    prices,
    isInTrial,

    // Actions
    refetch: fetchStatus,
    startCheckout,
    openPortal,
    cancelSubscription,
    reactivateSubscription,

    // Helpers
    canUseFeature,
    getRemainingUses,
    getDaysUntilRenewal,
  };
}
