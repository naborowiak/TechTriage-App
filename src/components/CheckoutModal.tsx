import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Shield, Loader2, CheckCircle2, AlertCircle, Tag, ChevronDown, ChevronUp } from 'lucide-react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import type { Stripe, StripeElementsOptions } from '@stripe/stripe-js';
import { getStripePromise } from '../lib/stripe';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useTheme } from '../context/ThemeContext';

export interface CheckoutProduct {
  name: string;
  description: string;
  price: string; // e.g. "$9.99"
  interval?: string; // e.g. "/mo" or one-time
  features?: string[];
  isSubscription: boolean;
  ctaLabel?: string; // Custom button label (e.g. "Confirm Upgrade")
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientSecret: string;
  type: 'payment' | 'setup';
  product: CheckoutProduct;
  onSuccess: () => void;
  onPaymentConfirmed?: () => Promise<void>;
}

// Inner form component (must be inside Elements provider)
const CheckoutForm: React.FC<{
  type: 'payment' | 'setup';
  product: CheckoutProduct;
  onSuccess: () => void;
  onClose: () => void;
  onPaymentConfirmed?: () => Promise<void>;
}> = ({ type, product, onSuccess, onClose, onPaymentConfirmed }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoStatus, setPromoStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [promoDiscount, setPromoDiscount] = useState('');

  const handlePromoValidate = async () => {
    if (!promoCode.trim()) return;
    setPromoStatus('validating');
    try {
      const res = await fetch('/api/promo-codes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code: promoCode.trim() }),
      });
      const data = await res.json();
      if (data.valid) {
        setPromoStatus('valid');
        setPromoDiscount(
          data.discountType === 'percent'
            ? `${data.discountValue}% off`
            : `$${data.discountValue} off`
        );
      } else {
        setPromoStatus('invalid');
      }
    } catch {
      setPromoStatus('invalid');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setStatus('processing');
    setErrorMessage('');

    try {
      const confirmFn = type === 'setup' ? stripe.confirmSetup : stripe.confirmPayment;
      const { error } = await confirmFn({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard?upgraded=true`,
        },
        redirect: 'if_required',
      });

      if (error) {
        setStatus('error');
        setErrorMessage(error.message || 'Payment failed. Please try again.');
      } else {
        // Payment/setup confirmed by Stripe. Apply any pending actions (e.g., plan change).
        if (onPaymentConfirmed) {
          try {
            await onPaymentConfirmed();
          } catch (err) {
            setStatus('error');
            setErrorMessage(err instanceof Error ? err.message : 'Failed to activate plan. Please contact support.');
            return;
          }
        }
        setStatus('success');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      }
    } catch (err) {
      setStatus('error');
      setErrorMessage('An unexpected error occurred. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4 animate-[scale-in_0.3s_ease-out]">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
        <h3 className="text-xl font-bold text-text-primary dark:text-white mb-2">
          {type === 'setup' ? 'You\'re All Set!' : 'Payment Successful!'}
        </h3>
        <p className="text-text-secondary">
          {type === 'setup'
            ? `Your ${product.name} plan is active. Enjoy TotalAssist!`
            : 'Thank you for your purchase. Enjoy TotalAssist!'}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-0 lg:gap-6">
      {/* Left column: Order Summary */}
      <div className="lg:w-[280px] shrink-0 p-6 lg:border-r border-b lg:border-b-0 border-light-300 dark:border-midnight-700">
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-4">Order Summary</h3>

        <div className="mb-4">
          <div className="text-lg font-bold text-text-primary dark:text-white">{product.name}</div>
          <div className="text-sm text-text-secondary">{product.description}</div>
        </div>

        <div className="flex items-baseline gap-1 mb-4">
          <span className="text-3xl font-bold text-text-primary dark:text-white">{product.price}</span>
          {product.interval && <span className="text-text-secondary">{product.interval}</span>}
        </div>

        {promoStatus === 'valid' && (
          <div className="mb-4 px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-medium">
              <Tag className="w-4 h-4" />
              {promoDiscount} applied
            </div>
          </div>
        )}

        {product.features && product.features.length > 0 && (
          <ul className="space-y-2 mb-6">
            {product.features.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                <CheckCircle2 className="w-4 h-4 text-electric-cyan shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center gap-2 text-xs text-text-muted pt-4 border-t border-light-200 dark:border-midnight-700">
          <Shield className="w-4 h-4" />
          <span>Secure checkout powered by Stripe</span>
        </div>
      </div>

      {/* Right column: Payment */}
      <div className="flex-1 p-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-4">Payment Details</h3>

        <div className="mb-5">
          <PaymentElement
            options={{
              layout: 'tabs',
            }}
          />
        </div>

        {/* Promo Code (subscriptions only) */}
        {product.isSubscription && (
          <div className="mb-5">
            <button
              type="button"
              onClick={() => setPromoOpen(!promoOpen)}
              className="flex items-center gap-1 text-sm text-text-secondary hover:text-electric-indigo transition-colors"
            >
              <Tag className="w-3.5 h-3.5" />
              Have a promo code?
              {promoOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {promoOpen && (
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => {
                    setPromoCode(e.target.value);
                    if (promoStatus !== 'idle') setPromoStatus('idle');
                  }}
                  placeholder="Enter code"
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-light-300 dark:border-midnight-600 bg-white dark:bg-midnight-800 text-text-primary dark:text-white placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-electric-indigo/50"
                />
                <button
                  type="button"
                  onClick={handlePromoValidate}
                  disabled={promoStatus === 'validating' || !promoCode.trim()}
                  className="px-3 py-2 text-sm font-medium bg-light-200 dark:bg-midnight-700 text-text-primary dark:text-white rounded-lg hover:bg-light-300 dark:hover:bg-midnight-600 transition-colors disabled:opacity-50"
                >
                  {promoStatus === 'validating' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                </button>
              </div>
            )}
            {promoStatus === 'invalid' && (
              <p className="mt-1 text-xs text-red-500">Invalid or expired promo code</p>
            )}
          </div>
        )}

        {/* Error message */}
        {status === 'error' && (
          <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2" role="alert">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={!stripe || !elements || status === 'processing'}
          className="w-full py-3.5 rounded-xl font-bold text-white btn-gradient-electric shadow-lg shadow-electric-indigo/30 hover:shadow-electric-indigo/50 hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {!stripe || !elements ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading payment form...
            </>
          ) : status === 'processing' ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : product.ctaLabel ? (
            product.ctaLabel
          ) : type === 'setup' ? (
            `Start Free Trial`
          ) : (
            `Pay ${product.price}${product.interval || ''}`
          )}
        </button>

        <p className="text-xs text-text-muted text-center mt-3">
          {product.isSubscription
            ? 'Cancel anytime. 30-day money-back guarantee.'
            : 'One-time purchase. Credits never expire.'}
        </p>
      </div>
    </form>
  );
};

// Main modal wrapper
export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  clientSecret,
  type,
  product,
  onSuccess,
  onPaymentConfirmed,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const { isDark } = useTheme();
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

  useFocusTrap(modalRef, { onClose, active: isOpen });

  useEffect(() => {
    if (isOpen && !stripePromise) {
      setStripePromise(getStripePromise());
    }
  }, [isOpen, stripePromise]);

  if (!isOpen || !clientSecret) return null;

  const appearance: StripeElementsOptions['appearance'] = {
    theme: isDark ? 'night' : 'stripe',
    variables: {
      colorPrimary: '#6366F1',
      colorBackground: isDark ? '#1E2330' : '#FFFFFF',
      colorText: isDark ? '#FFFFFF' : '#1E293B',
      colorDanger: '#EF4444',
      fontFamily: 'Inter, system-ui, sans-serif',
      borderRadius: '12px',
    },
    rules: {
      '.Input': {
        borderColor: isDark ? '#2A3142' : '#E2E8F0',
        backgroundColor: isDark ? '#0F1318' : '#F8FAFC',
      },
    },
  };

  const elementsOptions: StripeElementsOptions = {
    clientSecret,
    appearance,
  };

  return createPortal(
    <div ref={modalRef} className="fixed inset-0 z-[9999] flex items-center justify-center modal-backdrop-animate">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-midnight-950/90 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-3xl mx-4 bg-white dark:bg-midnight-900 rounded-2xl border border-light-300 dark:border-midnight-700 shadow-2xl overflow-hidden modal-panel-animate max-h-[90vh] overflow-y-auto">
        {/* Gradient accent top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-electric-indigo via-electric-cyan to-scout-purple" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-light-200 dark:border-midnight-700">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-electric-indigo" />
            <h2 className="text-lg font-bold text-text-primary dark:text-white">Secure Checkout</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-text-primary dark:hover:text-white hover:bg-light-200 dark:hover:bg-midnight-700 rounded-lg transition-colors"
            aria-label="Close checkout"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stripe Elements */}
        {stripePromise && (
          <Elements stripe={stripePromise} options={elementsOptions}>
            <CheckoutForm
              type={type}
              product={product}
              onSuccess={onSuccess}
              onClose={onClose}
              onPaymentConfirmed={onPaymentConfirmed}
            />
          </Elements>
        )}
      </div>
    </div>,
    document.body
  );
};
