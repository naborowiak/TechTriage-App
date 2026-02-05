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

export interface VideoCredits {
  included: number;    // From subscription plan
  purchased: number;   // Bought via credit packs
  used: number;        // Used this period
  remaining: number;   // Available to use
}

export interface SubscriptionState {
  tier: SubscriptionTier;
  status: string;
  billingInterval: 'monthly' | 'annual' | null;
  usage: SubscriptionUsage;
  limits: SubscriptionLimits;
  videoCredits: VideoCredits;
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
  limits: { chatSessions: 5, photoAnalyses: 2, liveSessions: 0 },  // Free tier limits
  videoCredits: { included: 0, purchased: 0, used: 0, remaining: 0 },
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

        // Server sends -1 to represent Infinity (unlimited) since JSON doesn't support Infinity
        const parseLimit = (limit: number): number => (limit === -1 ? Infinity : limit);

        const limits = data.limits || { chatSessions: 5, photoAnalyses: 2, liveSessions: 0 };

        setState({
          tier: data.tier || 'free',
          status: data.status || 'active',
          billingInterval: data.billingInterval || null,
          usage: data.usage || { chatSessions: 0, photoAnalyses: 0, liveSessions: 0 },
          limits: {
            chatSessions: parseLimit(limits.chatSessions),
            photoAnalyses: parseLimit(limits.photoAnalyses),
            liveSessions: limits.liveSessions,
          },
          videoCredits: data.videoCredits || { included: 0, purchased: 0, used: 0, remaining: 0 },
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
      const res = await fetch('/api/stripe/prices', { credentials: 'include' });
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

  // Handle upgraded=true query param (after successful checkout)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('upgraded') === 'true') {
      // Remove the param from URL to prevent re-triggering
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);

      // Refetch subscription status after a brief delay to allow webhook processing
      const timer = setTimeout(() => {
        fetchStatus();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [fetchStatus]);

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
