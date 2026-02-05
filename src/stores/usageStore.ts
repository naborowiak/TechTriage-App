// Usage Store - Tracks user session limits and gates for the Friction Ladder
// Using React Context pattern for state management

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export type UserTier = 'guest' | 'free' | 'home' | 'pro';

// Feature usage tracking (for chat/photo limits on lower tiers)
export interface FeatureUsage {
  used: number;
  limit: number;
}

export interface UsageLimits {
  chat: FeatureUsage;
  photo: FeatureUsage;
  signal: FeatureUsage;
  voice: FeatureUsage;
}

// Video credits are handled separately with different reset logic
export interface VideoCredits {
  subscriptionCredits: number;      // Credits from subscription (resets weekly/monthly)
  purchasedCredits: number;         // One-time purchased credits (never reset)
  subscriptionLimit: number;        // Max subscription credits per period
  resetType: 'weekly' | 'monthly';  // How often subscription credits reset
  lastResetDate: string;            // ISO date string of last reset
}

interface UsageState {
  tier: UserTier;
  userId: string | null;
  usage: UsageLimits;
  videoCredits: VideoCredits;
  sessionId: string;
  lastMonthlyResetDate: string;     // For monthly chat/photo resets
}

interface UsageContextValue extends UsageState {
  setTier: (tier: UserTier, userId?: string) => void;
  incrementUsage: (feature: keyof UsageLimits) => boolean;
  canUse: (feature: keyof UsageLimits) => boolean;
  getRemainingCredits: (feature: keyof UsageLimits) => number;
  resetUsage: () => void;
  isFeatureLocked: (feature: keyof UsageLimits) => boolean;
  shouldShowSignupGate: () => boolean;
  shouldShowUpgradeGate: (feature: keyof UsageLimits) => boolean;
  // Video credit specific methods
  useVideoCredit: () => boolean;
  canUseVideoCredit: () => boolean;
  getVideoCreditsRemaining: () => number;
  getTotalVideoCredits: () => number;
  addPurchasedCredits: (count: number) => void;
  getVideoResetInfo: () => { resetType: 'weekly' | 'monthly'; daysUntilReset: number; nextResetDate: Date };
  shouldShowRefillModal: () => boolean;
}

// Tier Definitions:
// -----------------------------------------------
// Tier 0: Guest (Anonymous) - Lead Capture
//   - 1 message, hard block on #2 -> Force Signup
//
// Tier 1: TotalAssist Free (Signed In) - The "Taste Test"
//   - Chat: 5 messages/month
//   - Photos: 1 photo/month
//   - Voice & Video: LOCKED
//
// Tier 2: TotalAssist Home ($9.99/mo) - The "Daily Driver"
//   - Chat/Photos/Voice: UNLIMITED
//   - Video Diagnostic: 1 Credit/Week (resets every 7 days)
//   - Model: Flash for Chat/Voice, Pro for Video
//
// Tier 3: TotalAssist Pro ($19.99/mo) - The "Power User"
//   - Chat/Photos/Voice: UNLIMITED
//   - Video Diagnostic: 15 Credits/Month
//   - Model: Pro for ALL interactions

const UNLIMITED = 999999;

const TIER_LIMITS: Record<UserTier, UsageLimits> = {
  guest: {
    chat: { used: 0, limit: 1 },
    photo: { used: 0, limit: 0 },
    signal: { used: 0, limit: 0 },
    voice: { used: 0, limit: 0 },
  },
  free: {
    chat: { used: 0, limit: 5 },
    photo: { used: 0, limit: 1 },
    signal: { used: 0, limit: 0 },
    voice: { used: 0, limit: 0 },
  },
  home: {
    chat: { used: 0, limit: UNLIMITED },
    photo: { used: 0, limit: UNLIMITED },
    signal: { used: 0, limit: UNLIMITED },
    voice: { used: 0, limit: UNLIMITED },
  },
  pro: {
    chat: { used: 0, limit: UNLIMITED },
    photo: { used: 0, limit: UNLIMITED },
    signal: { used: 0, limit: UNLIMITED },
    voice: { used: 0, limit: UNLIMITED },
  },
};

// Video credit limits by tier
const VIDEO_CREDIT_CONFIG: Record<UserTier, { limit: number; resetType: 'weekly' | 'monthly' }> = {
  guest: { limit: 0, resetType: 'monthly' },
  free: { limit: 0, resetType: 'monthly' },
  home: { limit: 1, resetType: 'weekly' },
  pro: { limit: 15, resetType: 'monthly' },
};

// Export for use in other components
export { TIER_LIMITS, VIDEO_CREDIT_CONFIG, UNLIMITED };

const STORAGE_KEY = 'scout-usage-store-v2';

const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

const getCurrentMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const getCurrentWeekStart = (): string => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Monday
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split('T')[0];
};

const getInitialVideoCredits = (tier: UserTier): VideoCredits => {
  const config = VIDEO_CREDIT_CONFIG[tier];
  return {
    subscriptionCredits: config.limit,
    purchasedCredits: 0,
    subscriptionLimit: config.limit,
    resetType: config.resetType,
    lastResetDate: config.resetType === 'weekly' ? getCurrentWeekStart() : getCurrentMonth(),
  };
};

const shouldResetVideoCredits = (videoCredits: VideoCredits): boolean => {
  if (videoCredits.resetType === 'weekly') {
    return videoCredits.lastResetDate !== getCurrentWeekStart();
  }
  return videoCredits.lastResetDate !== getCurrentMonth();
};

const getInitialState = (): UsageState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const currentMonth = getCurrentMonth();

      // Check if we need monthly reset for chat/photo
      const needsMonthlyReset = parsed.lastMonthlyResetDate !== currentMonth;

      // Check if we need video credit reset
      const videoCredits = parsed.videoCredits || getInitialVideoCredits(parsed.tier);
      const needsVideoReset = shouldResetVideoCredits(videoCredits);

      return {
        ...parsed,
        usage: needsMonthlyReset
          ? { ...TIER_LIMITS[parsed.tier as UserTier] }
          : parsed.usage,
        videoCredits: needsVideoReset
          ? {
              ...videoCredits,
              subscriptionCredits: VIDEO_CREDIT_CONFIG[parsed.tier as UserTier].limit,
              lastResetDate: videoCredits.resetType === 'weekly' ? getCurrentWeekStart() : currentMonth,
            }
          : videoCredits,
        lastMonthlyResetDate: currentMonth,
      };
    }
  } catch (e) {
    console.error('Failed to load usage state:', e);
  }

  return {
    tier: 'guest',
    userId: null,
    usage: { ...TIER_LIMITS.guest },
    videoCredits: getInitialVideoCredits('guest'),
    sessionId: generateSessionId(),
    lastMonthlyResetDate: getCurrentMonth(),
  };
};

const UsageContext = createContext<UsageContextValue | null>(null);

export const UsageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<UsageState>(getInitialState);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save usage state:', e);
    }
  }, [state]);

  // Check for resets on interval (e.g., if user leaves tab open)
  useEffect(() => {
    const checkResets = () => {
      setState(prev => {
        const currentMonth = getCurrentMonth();
        const needsMonthlyReset = prev.lastMonthlyResetDate !== currentMonth;
        const needsVideoReset = shouldResetVideoCredits(prev.videoCredits);

        if (!needsMonthlyReset && !needsVideoReset) return prev;

        return {
          ...prev,
          usage: needsMonthlyReset ? { ...TIER_LIMITS[prev.tier] } : prev.usage,
          videoCredits: needsVideoReset
            ? {
                ...prev.videoCredits,
                subscriptionCredits: VIDEO_CREDIT_CONFIG[prev.tier].limit,
                lastResetDate: prev.videoCredits.resetType === 'weekly' ? getCurrentWeekStart() : currentMonth,
              }
            : prev.videoCredits,
          lastMonthlyResetDate: currentMonth,
        };
      });
    };

    const interval = setInterval(checkResets, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const setTier = useCallback((tier: UserTier, userId?: string) => {
    setState(prev => {
      const currentMonth = getCurrentMonth();
      const needsReset = prev.lastMonthlyResetDate !== currentMonth;
      const config = VIDEO_CREDIT_CONFIG[tier];

      return {
        ...prev,
        tier,
        userId: userId || null,
        usage: needsReset
          ? { ...TIER_LIMITS[tier] }
          : {
              chat: { used: prev.usage.chat.used, limit: TIER_LIMITS[tier].chat.limit },
              photo: { used: prev.usage.photo.used, limit: TIER_LIMITS[tier].photo.limit },
              signal: { used: prev.usage.signal.used, limit: TIER_LIMITS[tier].signal.limit },
              voice: { used: prev.usage.voice.used, limit: TIER_LIMITS[tier].voice.limit },
            },
        videoCredits: {
          subscriptionCredits: config.limit,
          purchasedCredits: prev.videoCredits.purchasedCredits, // Preserve purchased credits
          subscriptionLimit: config.limit,
          resetType: config.resetType,
          lastResetDate: config.resetType === 'weekly' ? getCurrentWeekStart() : currentMonth,
        },
        lastMonthlyResetDate: currentMonth,
      };
    });
  }, []);

  const incrementUsage = useCallback((feature: keyof UsageLimits): boolean => {
    let success = false;
    setState(prev => {
      const current = prev.usage[feature];
      if (current.used >= current.limit) {
        success = false;
        return prev;
      }
      success = true;
      return {
        ...prev,
        usage: {
          ...prev.usage,
          [feature]: { ...current, used: current.used + 1 },
        },
      };
    });
    return success;
  }, []);

  const canUse = useCallback((feature: keyof UsageLimits): boolean => {
    const current = state.usage[feature];
    return current.used < current.limit;
  }, [state.usage]);

  const getRemainingCredits = useCallback((feature: keyof UsageLimits): number => {
    const current = state.usage[feature];
    return Math.max(0, current.limit - current.used);
  }, [state.usage]);

  const resetUsage = useCallback(() => {
    setState(prev => ({
      ...prev,
      usage: { ...TIER_LIMITS[prev.tier] },
      videoCredits: getInitialVideoCredits(prev.tier),
      sessionId: generateSessionId(),
    }));
  }, []);

  const isFeatureLocked = useCallback((feature: keyof UsageLimits): boolean => {
    return TIER_LIMITS[state.tier][feature].limit === 0;
  }, [state.tier]);

  const shouldShowSignupGate = useCallback((): boolean => {
    if (state.tier !== 'guest') return false;
    return state.usage.chat.used >= state.usage.chat.limit;
  }, [state.tier, state.usage.chat]);

  const shouldShowUpgradeGate = useCallback((feature: keyof UsageLimits): boolean => {
    if (state.tier === 'pro') return false;
    if (TIER_LIMITS[state.tier][feature].limit === 0) return true;
    return state.usage[feature].used >= state.usage[feature].limit;
  }, [state.tier, state.usage]);

  // Video Credit Methods
  const getTotalVideoCredits = useCallback((): number => {
    return state.videoCredits.subscriptionCredits + state.videoCredits.purchasedCredits;
  }, [state.videoCredits]);

  const canUseVideoCredit = useCallback((): boolean => {
    // Check if video is locked for this tier
    if (VIDEO_CREDIT_CONFIG[state.tier].limit === 0 && state.videoCredits.purchasedCredits === 0) {
      return false;
    }
    return getTotalVideoCredits() > 0;
  }, [state.tier, state.videoCredits, getTotalVideoCredits]);

  const useVideoCredit = useCallback((): boolean => {
    if (!canUseVideoCredit()) return false;

    setState(prev => {
      // Use subscription credits first, then purchased
      if (prev.videoCredits.subscriptionCredits > 0) {
        return {
          ...prev,
          videoCredits: {
            ...prev.videoCredits,
            subscriptionCredits: prev.videoCredits.subscriptionCredits - 1,
          },
        };
      } else if (prev.videoCredits.purchasedCredits > 0) {
        return {
          ...prev,
          videoCredits: {
            ...prev.videoCredits,
            purchasedCredits: prev.videoCredits.purchasedCredits - 1,
          },
        };
      }
      return prev;
    });
    return true;
  }, [canUseVideoCredit]);

  const getVideoCreditsRemaining = useCallback((): number => {
    return getTotalVideoCredits();
  }, [getTotalVideoCredits]);

  const addPurchasedCredits = useCallback((count: number) => {
    setState(prev => ({
      ...prev,
      videoCredits: {
        ...prev.videoCredits,
        purchasedCredits: prev.videoCredits.purchasedCredits + count,
      },
    }));
  }, []);

  const getVideoResetInfo = useCallback(() => {
    const { resetType, lastResetDate } = state.videoCredits;
    const now = new Date();
    let nextResetDate: Date;

    if (resetType === 'weekly') {
      // Calculate next Monday
      const lastReset = new Date(lastResetDate);
      nextResetDate = new Date(lastReset);
      nextResetDate.setDate(lastReset.getDate() + 7);
    } else {
      // Calculate first of next month
      nextResetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }

    const diffTime = nextResetDate.getTime() - now.getTime();
    const daysUntilReset = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return { resetType, daysUntilReset: Math.max(0, daysUntilReset), nextResetDate };
  }, [state.videoCredits]);

  const shouldShowRefillModal = useCallback((): boolean => {
    // Only show for Home/Pro users who have exhausted credits
    if (state.tier !== 'home' && state.tier !== 'pro') return false;
    return getTotalVideoCredits() === 0;
  }, [state.tier, getTotalVideoCredits]);

  const value: UsageContextValue = {
    ...state,
    setTier,
    incrementUsage,
    canUse,
    getRemainingCredits,
    resetUsage,
    isFeatureLocked,
    shouldShowSignupGate,
    shouldShowUpgradeGate,
    useVideoCredit,
    canUseVideoCredit,
    getVideoCreditsRemaining,
    getTotalVideoCredits,
    addPurchasedCredits,
    getVideoResetInfo,
    shouldShowRefillModal,
  };

  return React.createElement(UsageContext.Provider, { value }, children);
};

export const useUsage = (): UsageContextValue => {
  const context = useContext(UsageContext);
  if (!context) {
    throw new Error('useUsage must be used within a UsageProvider');
  }
  return context;
};

// Helper to sync with auth state
export const useSyncUsageWithAuth = (isAuthenticated: boolean, userId?: string, subscriptionTier?: string) => {
  const { setTier, tier: currentTier, userId: currentUserId } = useUsage();

  useEffect(() => {
    if (!isAuthenticated) {
      if (currentTier !== 'guest') {
        setTier('guest');
      }
      return;
    }

    // Map subscription tier to usage tier
    let tier: UserTier = 'free';
    if (subscriptionTier === 'pro') {
      tier = 'pro';
    } else if (subscriptionTier === 'home') {
      tier = 'home';
    }

    if (currentTier !== tier || currentUserId !== userId) {
      setTier(tier, userId);
    }
  }, [isAuthenticated, userId, subscriptionTier, currentTier, currentUserId, setTier]);
};

// Helper function to check if a feature requires upgrade
export const getUpgradeReason = (tier: UserTier, feature: keyof UsageLimits | 'videoDiagnostic'): string | null => {
  if (feature === 'videoDiagnostic') {
    if (tier === 'guest' || tier === 'free') {
      return 'Video Diagnostic requires TotalAssist Home or Pro';
    }
    return null;
  }

  const limit = TIER_LIMITS[tier][feature].limit;
  if (limit === 0) {
    switch (feature) {
      case 'signal':
        return 'Scout Voice requires TotalAssist Home or Pro';
      case 'voice':
        return 'Voice Mode requires TotalAssist Home or Pro';
      case 'photo':
        return 'Scout Snapshot requires a free account';
      default:
        return 'This feature requires an upgrade';
    }
  }
  return null;
};

// Helper to get display text for remaining credits
export const getCreditsDisplay = (used: number, limit: number): string => {
  if (limit >= UNLIMITED) return 'Unlimited';
  const remaining = Math.max(0, limit - used);
  return `${remaining}/${limit}`;
};

// Pricing constants for ad-hoc purchases
export const VIDEO_CREDIT_PRICES = {
  single: { credits: 1, price: 5.00, label: '1 Credit for $5' },
  pack: { credits: 3, price: 12.00, label: '3 Credits for $12' },
};

// Tier display info
export const TIER_INFO: Record<UserTier, { name: string; price: string; tagline: string }> = {
  guest: { name: 'Guest', price: 'Free', tagline: 'Try Scout' },
  free: { name: 'TotalAssist Free', price: 'Free', tagline: 'The Taste Test' },
  home: { name: 'TotalAssist Home', price: '$9.99/mo', tagline: 'The Daily Driver' },
  pro: { name: 'TotalAssist Pro', price: '$19.99/mo', tagline: 'The Power User' },
};
