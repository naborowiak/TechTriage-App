// Client-side Stripe price IDs — single source of truth for frontend code.
// Server-side equivalents live in server/config/stripe.ts.
// If you update prices, update BOTH files.

export const STRIPE_CREDIT_PRICES = {
  videoDiagnostic: {
    single: 'price_1SxBftPeLuLIM8GmX9sxeASx',  // $5 — 1 video diagnostic session
    pack: 'price_1SxBgLPeLuLIM8GmkJ27pvdX',     // $12 — 3 video diagnostic sessions (save $3)
  },
} as const;
