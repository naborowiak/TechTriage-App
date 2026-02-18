import { useState, useEffect, useCallback } from 'react';
import type { CheckoutProduct } from '../components/CheckoutModal';
import { isCreditPackPurchase } from '../config/stripe';

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

export interface CheckoutState {
  isOpen: boolean;
  clientSecret: string;
  type: 'payment' | 'setup';
  product: CheckoutProduct | null;
  loading: boolean;
  error: string | null;
  pendingPlanChange: { priceId: string } | null;
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
  const [isPostCheckout, setIsPostCheckout] = useState(false);
  const [checkoutState, setCheckoutState] = useState<CheckoutState>({
    isOpen: false,
    clientSecret: '',
    type: 'payment',
    product: null,
    loading: false,
    error: null,
    pendingPlanChange: null,
  });

  // Fetch subscription status. Pass forceSync=true after checkout to sync from Stripe.
  const fetchStatus = useCallback(async (forceSync = false) => {
    if (!userId) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      const syncParam = forceSync ? '?sync=true' : '';
      const res = await fetch(`/api/subscription/status/${userId}${syncParam}`, {
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

  // Poll with forceSync=true until tier changes from current tier or max attempts reached.
  // Used after both redirect checkout (upgraded=true param) and embedded modal checkout.
  const startPostCheckoutSync = useCallback((previousTier?: string) => {
    setIsPostCheckout(true);
    const baseTier = previousTier || state.tier;

    let attempts = 0;
    const maxAttempts = 8;
    const pollInterval = 2000;

    const poll = setInterval(async () => {
      attempts++;
      await fetchStatus(true);

      setState((prev) => {
        if (prev.tier !== baseTier || attempts >= maxAttempts) {
          clearInterval(poll);
          setIsPostCheckout(false);
        }
        return prev;
      });
    }, pollInterval);
  }, [fetchStatus, state.tier]);

  // Handle upgraded=true query param (after successful redirect checkout)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('upgraded') !== 'true') return;

    window.history.replaceState({}, '', window.location.pathname);
    startPostCheckoutSync();
  }, [startPostCheckoutSync]);

  // Open embedded checkout modal (Stripe Elements)
  // Falls back to legacy redirect checkout if Elements endpoints aren't available
  const openCheckout = async (priceId: string, product: CheckoutProduct) => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    setCheckoutState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const isCredit = isCreditPackPurchase(priceId);
      const endpoint = isCredit
        ? '/api/stripe/create-payment-intent'
        : '/api/stripe/create-subscription-intent';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ priceId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        // If the Elements endpoint isn't available, fall back to legacy redirect
        if (res.status === 404) {
          console.warn('[Checkout] Elements endpoint not available, falling back to redirect');
          setCheckoutState((prev) => ({ ...prev, loading: false }));
          await startCheckout(priceId);
          return;
        }
        throw new Error(data.error || 'Failed to create checkout session');
      }

      const data = await res.json();

      // For plan changes with no payment needed (e.g. downgrade with proration credit)
      if (!data.clientSecret) {
        await fetchStatus(true);
        setCheckoutState((prev) => ({ ...prev, loading: false }));
        return 'plan_changed' as const;
      }

      setCheckoutState({
        isOpen: true,
        clientSecret: data.clientSecret,
        type: data.type || 'payment',
        product,
        loading: false,
        error: null,
        pendingPlanChange: data.pendingPlanChange ? { priceId } : null,
      });
    } catch (err) {
      setCheckoutState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Checkout failed',
      }));
      throw err;
    }
  };

  // Close checkout modal and refresh subscription status
  const closeCheckout = () => {
    setCheckoutState({
      isOpen: false,
      clientSecret: '',
      type: 'payment',
      product: null,
      loading: false,
      error: null,
      pendingPlanChange: null,
    });
    // Force sync from Stripe after checkout to pick up plan changes immediately
    fetchStatus(true);
  };

  // Legacy redirect checkout (fallback)
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
    isPostCheckout,
    checkoutState,

    // Actions
    refetch: () => fetchStatus(true),
    startCheckout,
    openCheckout,
    closeCheckout,
    startPostCheckoutSync,
    openPortal,
    cancelSubscription,
    reactivateSubscription,

    // Helpers
    canUseFeature,
    getRemainingUses,
    getDaysUntilRenewal,
  };
}
