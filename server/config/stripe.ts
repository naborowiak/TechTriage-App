// Stripe configuration for TechTriage subscription plans

// Price IDs from Stripe Dashboard (set via environment variables)
export const STRIPE_PRICES = {
  home: {
    monthly: process.env.STRIPE_PRICE_HOME_MONTHLY || '',
    annual: process.env.STRIPE_PRICE_HOME_ANNUAL || '',
  },
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || '',
    annual: process.env.STRIPE_PRICE_PRO_ANNUAL || '',
  },
} as const;

// Map price IDs back to tiers
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

// Plan feature limits
export const PLAN_LIMITS = {
  free: {
    chatSessions: 5,
    photoAnalyses: 0,
    liveSessions: 0,
    multiHome: false,
    maxHomes: 1,
  },
  home: {
    chatSessions: Infinity,
    photoAnalyses: Infinity,
    liveSessions: 2,
    multiHome: false,
    maxHomes: 1,
  },
  pro: {
    chatSessions: Infinity,
    photoAnalyses: Infinity,
    liveSessions: Infinity,
    multiHome: true,
    maxHomes: 5,
  },
} as const;

export type PlanTier = keyof typeof PLAN_LIMITS;
export type PlanLimits = typeof PLAN_LIMITS[PlanTier];

// Plan display information
export const PLAN_INFO = {
  free: {
    name: 'Chat',
    monthlyPrice: 0,
    annualPrice: 0,
    description: 'Basic AI chat support',
  },
  home: {
    name: 'Home',
    monthlyPrice: 25,
    annualPrice: 228, // $19/mo
    description: 'Full access for homeowners',
  },
  pro: {
    name: 'Pro',
    monthlyPrice: 59,
    annualPrice: 588, // $49/mo
    description: 'Unlimited access for families',
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
