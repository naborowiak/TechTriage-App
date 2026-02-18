import { loadStripe, type Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Lazy-loaded Stripe.js singleton.
 * Fetches the publishable key from the server on first call,
 * then reuses the same promise on subsequent calls.
 */
export function getStripePromise(): Promise<Stripe | null> {
  if (!stripePromise) {
    stripePromise = fetch('/api/stripe/config', { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch Stripe config');
        return res.json();
      })
      .then(({ publishableKey }) => loadStripe(publishableKey))
      .catch((err) => {
        console.error('Failed to initialize Stripe:', err);
        stripePromise = null; // Allow retry on next call
        return null;
      });
  }
  return stripePromise;
}
