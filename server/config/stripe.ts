// Stripe configuration for TechTriage subscription plans

// Price IDs from Stripe Dashboard
export const STRIPE_PRICES = {
  home: {
    monthly: 'price_1SvwfjHcv0NiVMuKGDVU6oKu',  // $25/month
    annual: 'price_1SvwfjHcv0NiVMuKV0AMJZxC',   // $228/year ($19/mo)
  },
  pro: {
    monthly: 'price_1SvwhfHcv0NiVMuKXauBRlcX',  // $59/month
    annual: 'price_1Svwi6Hcv0NiVMuKFgbK5GSK',   // $588/year ($49/mo)
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
    photoAnalyses: 2,  // Trial taste: 2 photo analyses
    liveSessions: 1,   // Trial taste: 1 live session
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
