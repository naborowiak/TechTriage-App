// Client-side Stripe price IDs — single source of truth for frontend code.
// Server-side equivalents live in server/config/stripe.ts.
// If you update prices, update BOTH files.

export const STRIPE_CREDIT_PRICES = {
  videoDiagnostic: {
    single: 'price_1SxBftPeLuLIM8GmX9sxeASx',  // $3 — 1 video diagnostic session
    pack: 'price_1SzOhPPeLuLIM8GmXLqoj7yt',     // $12 — 5 video diagnostic sessions (save $3)
  },
} as const;
