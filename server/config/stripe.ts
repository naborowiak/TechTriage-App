// Stripe configuration for TotalAssist subscription plans + credit packs

// ============================================
// SUBSCRIPTION PRICE IDs (Recurring Revenue)
// ============================================
export const STRIPE_PRICES = {
  home: {
    monthly: 'price_1SxBdZPeLuLIM8GmEUA9WuJH',  // $25/month
    annual: 'price_1SxBKmPeLuLIM8Gmv3EbHR44',   // $228/year ($19/mo)
  },
  pro: {
    monthly: 'price_1SxBdvPeLuLIM8GmXo3KCqT2',  // $59/month
    annual: 'price_1SxBefPeLuLIM8GmlwmfnA2C',   // $588/year ($49/mo)
  },
} as const;

// ============================================
// CREDIT PACK PRICE IDs (One-time Purchases)
// ============================================
// For users who want premium features without subscribing,
// or subscribers who need more than their included allowance
export const STRIPE_CREDIT_PRICES = {
  videoDiagnostic: {
    single: 'price_1SxBftPeLuLIM8GmX9sxeASx',  // $5 - 1 video diagnostic session
    pack: 'price_1SxBgLPeLuLIM8GmkJ27pvdX',    // $12 - 3 video diagnostic sessions (save $3)
  },
} as const;

// Credit pack quantities
export const CREDIT_PACK_QUANTITIES = {
  videoDiagnostic: {
    single: 1,
    pack: 3,
  },
} as const;

// Map subscription price IDs back to tiers
export function getTierFromPriceId(priceId: string): 'home' | 'pro' | null {
  if (priceId === STRIPE_PRICES.home.monthly || priceId === STRIPE_PRICES.home.annual) {
    return 'home';
  }
  if (priceId === STRIPE_PRICES.pro.monthly || priceId === STRIPE_PRICES.pro.annual) {
    return 'pro';
  }
  return null;
}

// Map price IDs to billing interval
export function getBillingIntervalFromPriceId(priceId: string): 'monthly' | 'annual' | null {
  if (priceId === STRIPE_PRICES.home.monthly || priceId === STRIPE_PRICES.pro.monthly) {
    return 'monthly';
  }
  if (priceId === STRIPE_PRICES.home.annual || priceId === STRIPE_PRICES.pro.annual) {
    return 'annual';
  }
  return null;
}

// Check if a price ID is a credit pack purchase
export function isCreditPackPurchase(priceId: string): boolean {
  return Object.values(STRIPE_CREDIT_PRICES.videoDiagnostic).includes(priceId);
}

// Get credit quantity from price ID
export function getCreditsFromPriceId(priceId: string): { type: 'videoDiagnostic'; quantity: number } | null {
  if (priceId === STRIPE_CREDIT_PRICES.videoDiagnostic.single) {
    return { type: 'videoDiagnostic', quantity: CREDIT_PACK_QUANTITIES.videoDiagnostic.single };
  }
  if (priceId === STRIPE_CREDIT_PRICES.videoDiagnostic.pack) {
    return { type: 'videoDiagnostic', quantity: CREDIT_PACK_QUANTITIES.videoDiagnostic.pack };
  }
  return null;
}

// Plan feature limits
// Note: liveSessions = INCLUDED per billing period. Users can always buy more credits.
export const PLAN_LIMITS = {
  free: {
    chatSessions: 5,              // 5 AI chat sessions/month
    photoAnalyses: 1,             // 1 photo analysis/month
    includedVideoSessions: 0,     // Locked — requires Home+
    multiHome: false,
    maxHomes: 1,
  },
  home: {
    chatSessions: Infinity,       // Unlimited AI chat
    photoAnalyses: Infinity,      // Unlimited photo analysis
    includedVideoSessions: 4,     // ~1/week (client handles weekly reset, 4/month budget)
    multiHome: false,
    maxHomes: 1,
  },
  pro: {
    chatSessions: Infinity,       // Unlimited AI chat
    photoAnalyses: Infinity,      // Unlimited photo analysis
    includedVideoSessions: 15,    // 15 video sessions/month
    multiHome: true,
    maxHomes: 5,
  },
} as const;

export type PlanTier = keyof typeof PLAN_LIMITS;
export type PlanLimits = typeof PLAN_LIMITS[PlanTier];

// Plan display information
export const PLAN_INFO = {
  free: {
    name: 'Free',
    monthlyPrice: 0,
    annualPrice: 0,
    description: 'Try TotalAssist with limited access',
    highlights: ['5 chat sessions/month', '1 photo analysis/month', 'Purchase video credits as needed'],
  },
  home: {
    name: 'Home',
    monthlyPrice: 25,
    annualPrice: 228, // $19/mo billed annually
    description: 'Perfect for homeowners',
    highlights: ['Unlimited chat support', 'Unlimited photo analysis', '1 video session/week included', 'Buy extra video credits anytime'],
  },
  pro: {
    name: 'Pro',
    monthlyPrice: 59,
    annualPrice: 588, // $49/mo billed annually
    description: 'Best for families & landlords',
    highlights: ['Everything in Home', '15 video sessions/month included', 'Multi-home support (up to 5)', 'Priority support'],
  },
} as const;

// Credit pack display information
export const CREDIT_PACK_INFO = {
  videoDiagnostic: {
    single: {
      name: 'Video Diagnostic',
      price: 5,
      credits: 1,
      description: 'One live video diagnostic session with expert assistance',
    },
    pack: {
      name: 'Video Diagnostic 3-Pack',
      price: 12,
      credits: 3,
      savings: 3,  // Save $3 vs buying individually
      description: 'Three live video diagnostic sessions (save $3)',
    },
  },
} as const;

// Trial duration in days
export const TRIAL_DURATION_DAYS = 7;

// Webhook events we handle
export const WEBHOOK_EVENTS = [
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
] as const;
