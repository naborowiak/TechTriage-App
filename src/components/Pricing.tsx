import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ArrowRight, ArrowLeft, MessageSquare, Camera, Mic, Video, Clock, Home, Users, Loader2, Lock, FileText, Sparkles, X } from 'lucide-react';
import { PageView } from '../types';
import { useSubscription, SubscriptionTier } from '../hooks/useSubscription';
import { useAuth } from '../hooks/useAuth';
import { AnimatedElement } from '../hooks/useAnimations';
import { CheckoutModal } from './CheckoutModal';
import type { CheckoutProduct } from './CheckoutModal';

interface PricingProps {
  onStart: () => void;
  onNavigate: (view: PageView) => void;
  onCheckoutSuccess?: () => void;
}

export const Pricing: React.FC<PricingProps> = ({ onNavigate, onCheckoutSuccess }) => {
  const [isAnnual, setIsAnnual] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    planName: string;
    targetTier: string;
    priceId: string;
    product: CheckoutProduct | null;
    isUpgrade: boolean;
  } | null>(null);
  const { user, isLoading: authLoading } = useAuth();
  const { tier: currentTier, prices, openCheckout, closeCheckout, checkoutState, isLoading: subLoading } = useSubscription(user?.id);

  // Map plan names to tier identifiers
  const planToTier: Record<string, SubscriptionTier> = {
    'TotalAssist Free': 'free',
    'TotalAssist Home': 'home',
    'TotalAssist Pro': 'pro',
  };

  // Dynamically highlight the next tier up to encourage upgrades
  const highlightedTier: SubscriptionTier | null = (() => {
    if (!user || currentTier === 'free') return 'home';
    if (currentTier === 'home') return 'pro';
    return null; // Pro users: no highlight needed
  })();

  // Handle plan selection
  const handlePlanSelect = async (planName: string) => {
    const tier = planToTier[planName];

    // If it's the free plan, just navigate to signup
    if (tier === 'free') {
      onNavigate(PageView.SIGNUP);
      return;
    }

    // If user is not logged in, navigate to signup first
    if (!user) {
      onNavigate(PageView.SIGNUP);
      return;
    }

    // If user is already on this tier, do nothing
    if (currentTier === tier) {
      return;
    }

    // Start checkout for paid plans
    if (!prices) {
      console.error('Stripe prices not loaded');
      return;
    }

    const priceId = isAnnual
      ? prices[tier as 'home' | 'pro'].annual
      : prices[tier as 'home' | 'pro'].monthly;

    if (!priceId) {
      console.error('Price ID not configured for', tier, isAnnual ? 'annual' : 'monthly');
      alert('Payment is not configured yet. Please contact support.');
      return;
    }

    const plan = plans.find((p) => p.name === planName);
    const isUpgrade = currentTier !== 'free' && currentTier !== tier && (currentTier === 'home' && tier === 'pro');
    const product: CheckoutProduct = {
      name: planName,
      description: plan?.tagline || '',
      price: `$${isAnnual ? plan?.annualPrice : plan?.monthlyPrice}`,
      interval: '/mo',
      features: plan?.features?.slice(0, 5),
      isSubscription: true,
      ctaLabel: isUpgrade ? 'Confirm Upgrade' : undefined,
    };

    // If user is downgrading (paid → lower paid), show confirmation dialog
    if (currentTier !== 'free' && currentTier !== tier) {
      if (!isUpgrade) {
        // Downgrade: show confirmation dialog (no payment needed, credit applied)
        setConfirmDialog({
          open: true,
          planName,
          targetTier: tier,
          priceId,
          product,
          isUpgrade: false,
        });
        return;
      }
      // Upgrade: fall through to open the full checkout modal below
    }

    // New subscription (free → paid) or upgrade (home → pro): open checkout modal
    setIsCheckingOut(planName);
    try {
      await openCheckout(priceId, product);
    } catch (error) {
      console.error('Checkout error:', error);
      const msg = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to start checkout: ${msg}`);
    } finally {
      setIsCheckingOut(null);
    }
  };

  // Execute confirmed plan change (downgrades only — upgrades go through the checkout modal)
  const handleConfirmedPlanChange = async () => {
    if (!confirmDialog) return;
    const { planName, priceId } = confirmDialog;
    setConfirmDialog(null);
    setIsCheckingOut(planName);

    try {
      const res = await fetch('/api/stripe/apply-plan-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ priceId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to change plan');
      }

      if (onCheckoutSuccess) onCheckoutSuccess();
      onNavigate(PageView.DASHBOARD);
    } catch (error) {
      console.error('Plan change error:', error);
      const msg = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to change plan: ${msg}`);
    } finally {
      setIsCheckingOut(null);
    }
  };

  // Get button text based on current state
  const getButtonText = (planName: string, originalCta: string) => {
    const tier = planToTier[planName];

    if (isCheckingOut === planName) {
      return 'Redirecting...';
    }

    if (user && currentTier === tier) {
      return 'Current Plan';
    }

    // Logged-in user viewing the free plan (but on a paid tier)
    if (user && tier === 'free') {
      return 'Free Plan';
    }

    if (user && tier !== 'free') {
      // User is logged in and looking at a paid plan
      if (currentTier === 'free') {
        return 'Upgrade Now';
      }
      if (currentTier === 'home' && tier === 'pro') {
        return 'Upgrade to Pro';
      }
      if (currentTier === 'pro' && tier === 'home') {
        return 'Downgrade';
      }
    }

    return originalCta;
  };

  // Check if button should be disabled
  const isButtonDisabled = (planName: string): boolean => {
    const tier = planToTier[planName];
    // Free plan should never be disabled (always allow signup)
    if (tier === 'free') {
      return !!(user && currentTier === 'free'); // Only disable if already on free
    }
    return !!(user && currentTier === tier) || isCheckingOut !== null || authLoading || subLoading;
  };

  const plans = [
    {
      name: 'TotalAssist Free',
      tagline: 'See what TotalAssist can do.',
      monthlyPrice: 0,
      annualPrice: 0,
      isFree: true,
      icon: MessageSquare,
      features: [
        '5 chat messages / month',
        '1 photo analysis / month',
        'Guided fix steps',
        '1 saved case + PDF report',
        'Gear recommendations',
      ],
      cta: 'Get started free',
      ctaStyle: 'outlined',
    },
    {
      name: 'TotalAssist Home',
      tagline: 'Unlimited support for your home.',
      monthlyPrice: 9.99,
      annualPrice: 7.99,
      icon: Home,
      inherits: 'Everything in Free, plus:',
      features: [
        'Unlimited chat + photos',
        'Voice support',
        '1 video diagnostic / week',
        'Full case history + search',
        'Email case summaries',
      ],
      cta: 'Choose Home',
      ctaStyle: 'primary',
    },
    {
      name: 'TotalAssist Pro',
      tagline: 'Multi-home and family support.',
      monthlyPrice: 19.99,
      annualPrice: 15.99,
      icon: Users,
      inherits: 'Everything in Home, plus:',
      features: [
        'Up to 5 properties',
        'Family member accounts',
        '15 video diagnostics / month',
        'Pro escalation reports',
        'Priority response times',
      ],
      cta: 'Upgrade to Pro',
      ctaStyle: 'secondary',
    },
  ];

  return (
    <section className="min-h-screen pt-[64px] bg-light-50 dark:bg-midnight-950 transition-colors overflow-x-clip">
      {/* Pricing Cards */}
      <div id="pricing-plans" className="section-light py-16 sm:py-20">
        <div className="container mx-auto px-6 max-w-6xl">
          {/* Back to Dashboard link for logged-in users */}
          {user && (
            <div className="text-center mb-6">
              <button
                onClick={() => onNavigate(PageView.DASHBOARD)}
                className="inline-flex items-center gap-2 text-text-secondary hover:text-electric-indigo text-sm font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </button>
            </div>
          )}

          <AnimatedElement animation="fadeInUp">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary dark:text-white text-center mb-3 leading-tight">
              Simple, honest pricing
            </h1>
            <p className="text-text-secondary text-center mb-10 max-w-lg mx-auto">
              No hidden fees. No contracts. Cancel anytime.
            </p>
          </AnimatedElement>

          {/* Billing Toggle */}
          <AnimatedElement animation="fadeIn" delay={0.2}>
            <div className="flex justify-center items-center gap-4 mb-10 sm:mb-12">
              <span
                className={`font-semibold cursor-pointer transition-colors text-sm ${!isAnnual ? 'text-text-primary dark:text-white' : 'text-text-muted'}`}
                onClick={() => setIsAnnual(false)}
              >
                Monthly
              </span>
              <button
                onClick={() => setIsAnnual(!isAnnual)}
                className={`w-14 h-8 rounded-full p-1 transition-colors ${isAnnual ? 'bg-electric-indigo' : 'bg-light-400'}`}
                aria-label="Toggle annual billing"
              >
                <div className={`w-6 h-6 bg-white rounded-full shadow transition-transform ${isAnnual ? 'translate-x-6' : ''}`} />
              </button>
              <span
                className={`font-semibold cursor-pointer transition-colors text-sm ${isAnnual ? 'text-text-primary dark:text-white' : 'text-text-muted'}`}
                onClick={() => setIsAnnual(true)}
              >
                Annual
                <span className={`ml-2 text-xs font-bold px-2 py-1 rounded-full transition-all ${
                  isAnnual
                    ? 'text-white bg-electric-indigo'
                    : 'text-text-muted bg-light-300'
                }`}>
                  Save 20%
                </span>
              </span>
            </div>
          </AnimatedElement>

          {/* Pricing Grid */}
          <div className="grid md:grid-cols-3 gap-5 lg:gap-6 items-start">
            {plans.map((plan, i) => {
              const isCurrentPlan = !!(user && currentTier === planToTier[plan.name]);
              const isHighlighted = highlightedTier !== null && planToTier[plan.name] === highlightedTier;

              return (
              <AnimatedElement key={i} animation="fadeInUp" delay={0.1 + i * 0.1}>
                <div
                  className={`rounded-2xl p-6 sm:p-7 relative transition-all h-full flex flex-col hover:-translate-y-1 ${
                    isCurrentPlan
                      ? 'card-clean border-2 border-electric-cyan shadow-clean-md'
                      : isHighlighted
                      ? 'md:scale-[1.03] md:-my-2'
                      : 'card-clean hover:shadow-lg'
                  }`}
                  style={isHighlighted ? {
                    background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 30%, #06B6D4 100%)',
                    boxShadow: '0 8px 32px rgba(99, 102, 241, 0.30), 0 4px 16px rgba(6, 182, 212, 0.20)',
                  } : undefined}
                >
                  {/* Texture overlays for highlighted card */}
                  {isHighlighted && (
                    <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none" aria-hidden="true">
                      <div
                        className="absolute inset-0"
                        style={{
                          background: 'radial-gradient(ellipse 80% 50% at 20% 80%, rgba(255,255,255,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 60% at 80% 20%, rgba(6,182,212,0.15) 0%, transparent 60%)',
                        }}
                      />
                      <div
                        className="absolute inset-0 opacity-[0.03]"
                        style={{
                          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
                          backgroundSize: '20px 20px',
                        }}
                      />
                    </div>
                  )}

                  {/* Badges */}
                  {isCurrentPlan && (
                    <div className="absolute left-1/2 -translate-x-1/2 -top-4 z-10 bg-electric-cyan text-white text-xs font-bold px-5 py-2 rounded-full shadow-lg shadow-electric-cyan/30 whitespace-nowrap">
                      YOUR PLAN
                    </div>
                  )}
                  {isHighlighted && (
                    <div className="absolute left-1/2 -translate-x-1/2 -top-4 z-10 bg-white text-electric-indigo text-xs font-bold px-5 py-2 rounded-full shadow-lg shadow-electric-indigo/30 whitespace-nowrap">
                      {highlightedTier === 'pro' ? 'RECOMMENDED' : 'MOST POPULAR'}
                    </div>
                  )}

                <div className={`relative flex flex-col flex-1 ${
                  isCurrentPlan || isHighlighted ? 'pt-3' : ''
                }`}>

                {/* Plan name + tagline */}
                <h3 className={`text-lg font-bold mb-1 ${isHighlighted ? 'text-white' : 'text-text-primary dark:text-white'}`}>{plan.name}</h3>
                <div className={`text-sm mb-5 ${isHighlighted ? 'text-white/70' : 'text-text-secondary'}`}>{plan.tagline}</div>

                {/* Price */}
                <div className="mb-5">
                  {plan.isFree ? (
                    <div className="flex items-baseline gap-1">
                      <span className={`text-4xl font-bold ${isHighlighted ? 'text-white' : 'text-text-primary dark:text-white'}`}>$0</span>
                      <span className={isHighlighted ? 'text-white/70' : 'text-text-secondary'}>/mo</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-2">
                        <span className={`text-xl line-through transition-all duration-500 ease-out inline-block overflow-hidden whitespace-nowrap ${
                          isAnnual ? 'max-w-20 opacity-100' : 'max-w-0 opacity-0'
                        } ${isHighlighted ? 'text-white/40' : 'text-text-muted'}`}>
                          ${plan.monthlyPrice}
                        </span>
                        <span
                          className={`price-animated text-4xl font-bold ${isHighlighted ? 'text-white' : 'text-text-primary dark:text-white'}`}
                          style={{
                            '--price-dollars': isAnnual ? Math.floor(plan.annualPrice) : Math.floor(plan.monthlyPrice),
                            '--price-cents': Math.round(((isAnnual ? plan.annualPrice : plan.monthlyPrice) % 1) * 100),
                          } as React.CSSProperties}
                        />
                        <span className={isHighlighted ? 'text-white/70' : 'text-text-secondary'}>/mo</span>
                      </div>
                      <div className="relative overflow-hidden h-5">
                        <div className={`transition-transform duration-500 ease-out delay-75 ${isAnnual ? '-translate-y-1/2' : 'translate-y-0'}`}>
                          <div className={`h-5 text-sm ${isHighlighted ? 'text-white/60' : 'text-text-secondary'}`}>
                            Billed monthly
                          </div>
                          <div className={`h-5 text-sm ${isHighlighted ? 'text-white/60' : 'text-text-secondary'}`}>
                            Billed annually (${(plan.annualPrice * 12).toFixed(2)}/yr)
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* CTA — placed before features like Arcade */}
                <button
                  onClick={() => handlePlanSelect(plan.name)}
                  disabled={isButtonDisabled(plan.name)}
                  className={`w-full py-3 rounded-lg font-semibold text-[15px] transition-all flex items-center justify-center gap-2 mb-6 ${
                    isButtonDisabled(plan.name) && isCurrentPlan
                      ? 'bg-light-200 dark:bg-midnight-700 text-text-muted cursor-not-allowed'
                      : isButtonDisabled(plan.name)
                      ? 'opacity-50 cursor-wait'
                      : isHighlighted
                      ? 'bg-white text-electric-indigo font-bold hover:bg-white/90 shadow-lg'
                      : plan.ctaStyle === 'outlined'
                      ? 'border-2 border-light-300 dark:border-midnight-600 text-text-primary dark:text-white hover:border-electric-indigo hover:text-electric-indigo dark:hover:text-electric-indigo'
                      : plan.ctaStyle === 'secondary'
                      ? 'border-2 border-light-300 dark:border-midnight-600 text-text-primary dark:text-white hover:border-electric-indigo hover:text-electric-indigo dark:hover:text-electric-indigo'
                      : 'btn-gradient-electric text-white font-semibold'
                  }`}
                >
                  {isCheckingOut === plan.name && <Loader2 className="w-5 h-5 animate-spin" />}
                  {getButtonText(plan.name, plan.cta)}
                </button>

                {/* Divider */}
                <div className={`h-px mb-5 ${isHighlighted ? 'bg-white/20' : 'bg-light-200 dark:bg-midnight-700'}`} />

                {/* Inherits line */}
                {'inherits' in plan && (plan as any).inherits && (
                  <p className={`text-sm font-medium mb-4 ${isHighlighted ? 'text-white/80' : 'text-text-primary dark:text-white'}`}>
                    {(plan as any).inherits}
                  </p>
                )}

                {/* Features */}
                <ul className="space-y-3 flex-1">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-3 text-[14px]">
                      <Check className={`w-4 h-4 shrink-0 ${
                        isHighlighted ? 'text-white' : 'text-electric-indigo'
                      }`} />
                      <span className={isHighlighted ? 'text-white/85' : 'text-text-secondary'}>{feature}</span>
                    </li>
                  ))}
                </ul>
                </div>
              </div>
              </AnimatedElement>
              );
            })}
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-6 sm:gap-8 mt-10 text-sm text-text-secondary">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-electric-indigo" />
              No credit card for free plan
            </span>
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-electric-indigo" />
              Cancel anytime
            </span>
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-electric-indigo" />
              30-day money-back guarantee
            </span>
          </div>

          {/* Feature Comparison Matrix — desktop only */}
          <AnimatedElement animation="fadeInUp" delay={0.3} className="hidden md:block">
            <div className="mt-16 pt-12 border-t border-light-300 dark:border-midnight-700">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-text-primary dark:text-white mb-2">
                  Compare plans
                </h3>
                <p className="text-text-secondary text-sm">
                  See exactly what you get with each plan
                </p>
              </div>

              <div role="table" aria-label="Feature comparison by plan">
                {/* Sticky Column Headers */}
                <div
                  role="row"
                  className="sticky top-[64px] z-10 grid grid-cols-[1fr_100px_100px_100px] lg:grid-cols-[1fr_140px_140px_140px] border-b border-light-300 dark:border-midnight-700 bg-white dark:bg-midnight-900 rounded-t-xl shadow-[0_1px_3px_0_rgba(0,0,0,0.05)]"
                >
                  <div role="columnheader" className="py-4 px-4 text-text-secondary font-medium text-sm">Feature</div>
                  <div role="columnheader" className="py-4 px-4 text-center">
                    <div className="text-text-primary dark:text-white font-bold text-sm">Free</div>
                    <div className="text-xs text-text-muted">$0/mo</div>
                  </div>
                  <div role="columnheader" className="py-4 px-4 text-center border-x border-light-200 dark:border-midnight-700 bg-electric-indigo/[0.04] dark:bg-electric-indigo/[0.08] relative">
                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-electric-indigo rounded-b-sm" />
                    <div className="text-electric-indigo font-bold text-sm">Home</div>
                    <div className="text-xs text-text-muted">${isAnnual ? '7.99' : '9.99'}/mo</div>
                  </div>
                  <div role="columnheader" className="py-4 px-4 text-center">
                    <div className="text-text-primary dark:text-white font-bold text-sm">Pro</div>
                    <div className="text-xs text-text-muted">${isAnnual ? '15.99' : '19.99'}/mo</div>
                  </div>
                </div>

                {/* Feature rows */}
                {[
                  { icon: <MessageSquare className="w-4 h-4 text-electric-indigo" />, name: 'Chat Support', free: '5/month', home: 'Unlimited', pro: 'Unlimited' },
                  { icon: <Camera className="w-4 h-4 text-electric-indigo" />, name: 'Photo Analysis', free: '1/month', home: 'Unlimited', pro: 'Unlimited' },
                  { icon: <Mic className="w-4 h-4 text-electric-indigo" />, name: 'Voice Support', free: 'locked', home: 'Unlimited', pro: 'Unlimited' },
                  { icon: <Video className="w-4 h-4 text-electric-indigo" />, name: 'Video Diagnostic', free: 'locked', home: '1/week', pro: '15/month' },
                  { icon: <Sparkles className="w-4 h-4 text-electric-indigo" />, name: 'Guided Fix Steps', free: 'check', home: 'check', pro: 'check' },
                  { icon: <FileText className="w-4 h-4 text-electric-indigo" />, name: 'PDF Reports', free: 'check', home: 'check', pro: 'check' },
                  { icon: <Clock className="w-4 h-4 text-electric-indigo" />, name: 'Case History', free: '1 case', home: 'Unlimited', pro: 'Unlimited' },
                  { icon: <Home className="w-4 h-4 text-electric-indigo" />, name: 'Properties', free: '1', home: '1', pro: 'Up to 5' },
                  { icon: <Users className="w-4 h-4 text-electric-indigo" />, name: 'Family Accounts', free: 'locked', home: 'locked', pro: 'check', isLast: true },
                ].map((row, i) => {
                  const renderCell = (value: string) => {
                    if (value === 'check') return <Check className="w-5 h-5 text-electric-cyan mx-auto" />;
                    if (value === 'locked') return <Lock className="w-4 h-4 text-text-muted mx-auto" />;
                    if (value === 'Unlimited') return <span className="text-sm font-semibold text-electric-cyan">{value}</span>;
                    if (value.includes('/week') || value.includes('/month') || value === 'Up to 5') return <span className="text-sm font-semibold text-electric-indigo">{value}</span>;
                    return <span className="text-sm text-text-secondary">{value}</span>;
                  };
                  return (
                    <div
                      key={i}
                      role="row"
                      className={`grid grid-cols-[1fr_100px_100px_100px] lg:grid-cols-[1fr_140px_140px_140px] ${
                        !(row as any).isLast ? 'border-b border-light-200 dark:border-midnight-800' : ''
                      } hover:bg-light-50 dark:hover:bg-midnight-800/40 transition-colors`}
                    >
                      <div role="cell" className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-electric-indigo/8 flex items-center justify-center shrink-0">
                            {row.icon}
                          </div>
                          <span className="font-medium text-text-primary dark:text-white text-sm">{row.name}</span>
                        </div>
                      </div>
                      <div role="cell" className="py-3.5 px-4 flex items-center justify-center">
                        {renderCell(row.free)}
                      </div>
                      <div role="cell" className="py-3.5 px-4 flex items-center justify-center border-x border-light-200 dark:border-midnight-700/60 bg-electric-indigo/[0.02] dark:bg-electric-indigo/[0.04]">
                        {renderCell(row.home)}
                      </div>
                      <div role="cell" className="py-3.5 px-4 flex items-center justify-center">
                        {renderCell(row.pro)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </AnimatedElement>

        </div>
      </div>

      {/* Video CTA */}
      <div className="relative overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          aria-hidden="true"
        >
          <source src="/project-3.mp4" type="video/mp4" />
        </video>
        {/* Brand gradient overlay */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.65) 0%, rgba(99,102,241,0.55) 40%, rgba(6,182,212,0.60) 100%)' }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-midnight-950/35" aria-hidden="true" />

        <div className="relative z-10 py-20 sm:py-24">
          <div className="container mx-auto px-6 max-w-2xl text-center">
            <AnimatedElement animation="fadeInUp">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
                Your home's tech support team<br className="hidden sm:block" /> is ready when you are.
              </h2>
            </AnimatedElement>
            <AnimatedElement animation="fadeInUp" delay={0.15}>
              <p className="text-white/80 mb-8 max-w-md mx-auto">
                Start free. No credit card required.
              </p>
            </AnimatedElement>
            <AnimatedElement animation="fadeInUp" delay={0.3}>
              <button
                onClick={() => onNavigate(PageView.SIGNUP)}
                className="bg-white text-electric-indigo font-semibold px-8 py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 inline-flex items-center gap-2"
              >
                Get Started Free <ArrowRight className="w-4 h-4" />
              </button>
            </AnimatedElement>
          </div>
        </div>
      </div>

      {/* FAQ link */}
      <div className="py-6 text-center bg-light-50 dark:bg-midnight-950 border-t border-light-300 dark:border-midnight-700">
        <span className="text-text-secondary text-sm">
          Have questions?{' '}
          <button
            onClick={() => onNavigate(PageView.FAQ)}
            className="text-electric-indigo hover:text-electric-indigo/80 font-medium transition-colors inline-flex items-center gap-1"
          >
            Visit our FAQ <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </span>
      </div>

      {/* Plan Change Confirmation Dialog — portaled to body to avoid transform issues */}
      {confirmDialog?.open && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="absolute inset-0 bg-midnight-950/80 backdrop-blur-sm" onClick={() => setConfirmDialog(null)} />
          <div className="relative w-full max-w-md mx-4 bg-white dark:bg-midnight-900 rounded-2xl border border-light-300 dark:border-midnight-700 shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-electric-indigo via-electric-cyan to-scout-purple" />
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-text-primary dark:text-white">
                  {confirmDialog.isUpgrade ? 'Confirm Upgrade' : 'Confirm Downgrade'}
                </h3>
                <button onClick={() => setConfirmDialog(null)} className="p-1.5 text-text-secondary hover:text-text-primary dark:hover:text-white rounded-lg hover:bg-light-200 dark:hover:bg-midnight-700 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3 p-3 rounded-xl bg-light-100 dark:bg-midnight-800">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(6,182,212,0.10) 100%)' }}>
                    {confirmDialog.targetTier === 'pro' ? <Users className="w-5 h-5 text-electric-indigo" /> : <Home className="w-5 h-5 text-electric-indigo" />}
                  </div>
                  <div>
                    <div className="font-semibold text-text-primary dark:text-white">{confirmDialog.planName}</div>
                    <div className="text-sm text-text-secondary">{confirmDialog.product?.price}{confirmDialog.product?.interval}</div>
                  </div>
                </div>

                <p className="text-sm text-text-secondary leading-relaxed">
                  {confirmDialog.isUpgrade
                    ? 'The prorated difference will be charged to your card on file. Your new plan takes effect immediately.'
                    : 'You\'ll receive a prorated credit on your next invoice. Your plan changes immediately.'}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDialog(null)}
                  className="flex-1 py-2.5 rounded-xl font-medium border border-light-300 dark:border-midnight-600 text-text-primary dark:text-white hover:bg-light-100 dark:hover:bg-midnight-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmedPlanChange}
                  className="flex-1 py-2.5 rounded-xl font-bold text-white btn-gradient-electric shadow-lg shadow-electric-indigo/30 hover:shadow-electric-indigo/50 hover:brightness-110 transition-all"
                >
                  {confirmDialog.isUpgrade ? 'Upgrade Now' : 'Downgrade'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Checkout Modal */}
      {checkoutState.isOpen && checkoutState.product && (
        <CheckoutModal
          isOpen={checkoutState.isOpen}
          onClose={closeCheckout}
          clientSecret={checkoutState.clientSecret}
          type={checkoutState.type}
          product={checkoutState.product}
          onSuccess={() => {
            if (onCheckoutSuccess) onCheckoutSuccess();
            onNavigate(PageView.DASHBOARD);
          }}
          onPaymentConfirmed={checkoutState.pendingPlanChange ? async () => {
            const res = await fetch('/api/stripe/apply-plan-change', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ priceId: checkoutState.pendingPlanChange!.priceId }),
            });
            if (!res.ok) {
              const data = await res.json().catch(() => ({}));
              throw new Error(data.error || 'Failed to change plan');
            }
          } : undefined}
        />
      )}

    </section>
  );
};
