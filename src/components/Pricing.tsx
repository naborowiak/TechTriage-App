import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ArrowRight, ArrowLeft, MessageSquare, Camera, Mic, Video, Shield, Clock, Home, Users, Zap, Loader2, Lock, Plus, Minus, HelpCircle, FileText, Sparkles, X } from 'lucide-react';
import { PageView } from '../types';
import { useSubscription, SubscriptionTier } from '../hooks/useSubscription';
import { useAuth } from '../hooks/useAuth';
import { ScoutSignalIcon } from './Logo';
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
  const [openFaq, setOpenFaq] = useState<number | null>(null);
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
      tagline: 'Try it out on a quick issue.',
      bestFor: 'Trying TotalAssist with a few simple questions',
      monthlyPrice: 0,
      annualPrice: 0,
      isFree: true,
      description: 'See how easy home tech support can be — no credit card required.',
      icon: MessageSquare,
      features: [
        '5 support messages per month',
        '1 photo analysis per month',
        'Guided fix steps with Assist Pills (tap instead of typing)',
        '1 saved Case with a PDF diagnostic report',
        'Basic gear recommendations when replacement makes more sense',
      ],
      lockedFeatures: [] as string[],
      cta: 'Get started free',
      ctaStyle: 'outlined',
    },
    {
      name: 'TotalAssist Home',
      tagline: 'Unlimited support for your home.',
      bestFor: 'Homeowners and families who rely on Wi-Fi, TVs, and printers every day',
      monthlyPrice: 9.99,
      annualPrice: 7.99,
      description: 'Chat, send photos, or start a guided session whenever something breaks. Your home has a dedicated tech support line.',
      icon: Home,
      features: [
        'Unlimited support messages',
        'Unlimited photo analysis (Wi-Fi, TVs, printers, smart devices, and more)',
        'Voice support — talk through issues hands-free',
        'Video diagnostics — 1 credit per week for short live sessions',
        'Guided fix steps with Assist Pills',
        'PDF diagnostic reports for every Case',
        'Full Case history and search',
        'Email case summaries',
        'TotalAssist Recommendations when it\'s time to replace gear',
      ],
      cta: 'Choose Home',
      ctaStyle: 'primary',
    },
    {
      name: 'TotalAssist Pro',
      tagline: 'For families, landlords, and multi-property setups.',
      bestFor: 'Families, landlords, and small hosts (Airbnb, duplexes) with more than one home or unit',
      monthlyPrice: 19.99,
      annualPrice: 15.99,
      description: 'Everything in Home, plus multi-home support and more video diagnostics.',
      icon: Users,
      features: [
        'Everything in TotalAssist Home, plus:',
        'Multi-home support (up to 5 properties)',
        'Family member accounts under one subscription',
        'Video diagnostics — up to 15 credits per month',
        'Full Case history, search, and PDF reports across all homes',
        'Professional escalation reports (PDF) for technicians or property managers',
        'Priority response times for new diagnostics',
        'Enhanced gear recommendations tuned per property size and usage',
      ],
      cta: 'Upgrade to Pro',
      ctaStyle: 'secondary',
    },
  ];

  const products = [
    {
      name: 'Chat Support',
      icon: MessageSquare,
      description: 'Text with a real support specialist who walks you through any tech issue, step by step.',
      availability: 'All Plans',
    },
    {
      name: 'Photo Analysis',
      icon: Camera,
      description: 'Send a photo of an error message, blinking light, or broken device — get a diagnosis in seconds.',
      availability: 'All Plans',
    },
    {
      name: 'Voice Support',
      icon: Mic,
      description: 'Talk through your issue hands-free, just like a phone call. Your agent guides you step by step in real time.',
      availability: 'Home & Pro',
    },
    {
      name: 'Video Diagnostic',
      icon: Video,
      description: 'Point your camera at the problem and get a live, real-time diagnosis from your support agent.',
      availability: 'Home & Pro (Credits)',
    },
  ];

  const faqs = [
    {
      q: 'How does photo analysis work?',
      a: 'Send a photo of an error message, blinking light, or device issue during your chat. Our support team analyzes it instantly and walks you through what\'s wrong and how to fix it.',
    },
    {
      q: 'What is your cancellation policy?',
      a: 'You can cancel your membership at any time from your account settings. There are no cancellation fees or long-term contracts. Cancellations take effect at the end of your current billing period.',
    },
    {
      q: 'How does voice support work?',
      a: 'Tap the microphone button and start talking — it\'s like a phone call with your support agent. They\'ll listen to your issue, ask follow-up questions, and guide you through the fix. You can even send photos mid-call if needed. Available on Home and Pro plans.',
    },
    {
      q: 'How do video credits work?',
      a: 'Video diagnostics let you point your camera at the problem for a live diagnosis. Home members get 1 video credit per week (resets every 7 days) and Pro members get 15 credits per month. Each video session uses 1 credit.',
    },
    {
      q: 'What\'s the difference between Home and Pro?',
      a: 'Both plans include unlimited chat, photo analysis, voice support, Assist Pills, and PDF diagnostic reports. Pro adds 15 video credits per month (vs. 1/week on Home), multi-home support (up to 5 properties), family member accounts under one subscription, professional escalation reports you can hand to a technician or property manager, priority response times, and enhanced gear recommendations tuned per property. It\'s ideal for landlords, Airbnb hosts, or families managing multiple homes.',
    },
    {
      q: 'What types of issues do you support?',
      a: 'We specialize in consumer technology: Wi-Fi and networking, computers and laptops, smart home devices (Alexa, Google Home, Ring, Nest), TVs and streaming, printers, smart thermostats, and general tech troubleshooting.',
    },
    {
      q: 'Is there a real person on the other end?',
      a: 'Our support team is available 24/7, including weekends and holidays. You\'ll never be put on hold or transferred to a call center. Just describe your issue and get help immediately.',
    },
    {
      q: 'Do you offer a mobile app?',
      a: 'TotalAssist works directly in your web browser with no download required — just visit the site on your phone, tablet, or computer. No app needed.',
    },
    {
      q: 'Why not just use ChatGPT or Google Gemini?',
      a: 'General-purpose AI chatbots can answer tech questions, but they can\'t see your devices through photo or video, walk you through fixes with interactive step-by-step assist pills, or generate a professional diagnostic report. TotalAssist is built specifically for home tech support — it understands your devices, remembers your history, and gives you a clear path to resolution.',
    },
    {
      q: 'What are TotalAssist Recommendations?',
      a: 'When we see the same device causing repeat problems, we may suggest replacement options — like a mesh Wi-Fi kit for larger homes or a more reliable printer. We may earn a small commission if you buy through our links, but we only recommend gear we believe will actually reduce future issues. This is included in all plans.',
    },
  ];

  return (
    <section className="min-h-screen pt-[64px] bg-light-50 dark:bg-midnight-950 transition-colors overflow-x-clip">
      {/* Hero Section */}
      <div className="section-light py-20 text-center border-b border-light-300 dark:border-midnight-700">
        <div className="container mx-auto px-6 max-w-4xl">
          {/* Back to Dashboard link for logged-in users */}
          {user && (
            <button
              onClick={() => onNavigate(PageView.DASHBOARD)}
              className="inline-flex items-center gap-2 text-text-secondary hover:text-electric-indigo text-sm font-medium mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
          )}
          <AnimatedElement animation="fadeInDown">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm mb-6 shadow-lg shadow-electric-indigo/20" style={{ background: 'linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)' }}>
              <ScoutSignalIcon size={18} animate={true} />
              <span className="font-semibold">Support available 24/7</span>
            </div>
          </AnimatedElement>
          <AnimatedElement animation="fadeInUp" delay={0.1}>
            <h1 className="text-4xl lg:text-5xl font-bold text-text-primary dark:text-white mb-6 leading-tight">
              Fix Your Tech Issues<br />
              <span className="text-gradient-electric">In Minutes, Not Hours</span>
            </h1>
          </AnimatedElement>
          <AnimatedElement animation="fadeInUp" delay={0.2}>
            <p className="text-text-secondary text-lg mb-8 max-w-2xl mx-auto">
              Wi-Fi down? Smart TV acting up? Describe your problem or snap a photo — our team will walk you through the fix, step by step.
            </p>
          </AnimatedElement>
          <AnimatedElement animation="fadeIn" delay={0.4}>
            <div className="flex flex-wrap justify-center gap-6 text-text-secondary text-sm">
              <span className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-electric-indigo" />
                AI-powered diagnostics
              </span>
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-electric-indigo" />
                No appointments needed
              </span>
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-electric-indigo" />
                Cancel anytime
              </span>
            </div>
          </AnimatedElement>
        </div>
      </div>

      {/* Products Overview */}
      <div className="section-white py-16 border-b border-light-300 dark:border-midnight-700">
        <div className="container mx-auto px-6 max-w-6xl">
          <AnimatedElement animation="fadeInUp">
            <h2 className="text-2xl font-bold text-text-primary dark:text-white text-center mb-4">
              Four Ways to Get Help
            </h2>
            <p className="text-text-secondary text-center mb-12 max-w-2xl mx-auto">
              Choose how you want to connect based on your issue
            </p>
          </AnimatedElement>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {products.map((product, i) => (
              <AnimatedElement key={i} animation="scaleIn" delay={0.1 + i * 0.1}>
                <div className="card-clean rounded-2xl p-6 text-center cursor-default">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(6,182,212,0.10) 100%)' }}>
                    <product.icon className="w-6 h-6 text-electric-indigo" />
                  </div>
                  <h3 className="text-base font-bold text-text-primary dark:text-white mb-1">{product.name}</h3>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full mb-2 inline-block ${
                      product.availability === 'All Plans'
                        ? 'text-white'
                        : 'bg-surface-100 dark:bg-midnight-700 text-text-secondary dark:text-light-400'
                    }`}
                    style={product.availability === 'All Plans' ? { background: 'linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)' } : undefined}
                  >
                    {product.availability}
                  </span>
                  <p className="text-text-secondary text-xs leading-relaxed">{product.description}</p>
                </div>
              </AnimatedElement>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div id="pricing-plans" className="section-light py-20">
        <div className="container mx-auto px-6 max-w-6xl">
          <AnimatedElement animation="fadeInUp">
            <h2 className="text-3xl font-bold text-text-primary dark:text-white text-center mb-4">
              Simple, Honest Pricing
            </h2>
            <p className="text-text-secondary text-center mb-8 max-w-xl mx-auto">
              No hidden fees. No long contracts. Just peace of mind for your home.
            </p>
          </AnimatedElement>

          {/* Billing Toggle */}
          <AnimatedElement animation="fadeIn" delay={0.2}>
            <div className="flex justify-center items-center gap-4 mb-12">
              <span
                className={`font-semibold cursor-pointer transition-colors ${!isAnnual ? 'text-text-primary dark:text-white' : 'text-text-muted'}`}
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
                className={`font-semibold cursor-pointer transition-colors ${isAnnual ? 'text-text-primary dark:text-white' : 'text-text-muted'}`}
                onClick={() => setIsAnnual(true)}
              >
                Annual
                <span className={`ml-2 text-xs font-bold px-2 py-1 rounded-full transition-all ${
                  isAnnual
                    ? 'text-white bg-electric-indigo'
                    : 'text-text-muted bg-light-300'
                }`}>
                  Save up to 25%
                </span>
              </span>
            </div>
          </AnimatedElement>

          {/* Pricing Grid */}
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-start">
            {plans.map((plan, i) => {
              const isCurrentPlan = !!(user && currentTier === planToTier[plan.name]);
              const isHighlighted = highlightedTier !== null && planToTier[plan.name] === highlightedTier;

              return (
              <AnimatedElement key={i} animation="fadeInUp" delay={0.2 + i * 0.15}>
                <div
                  className={`rounded-2xl p-8 relative transition-all h-full flex flex-col hover:-translate-y-1.5 ${
                    isCurrentPlan
                      ? 'card-clean border-2 border-electric-cyan shadow-clean-md hover:shadow-lg'
                      : isHighlighted
                      ? 'md:scale-[1.03] md:-my-2'
                      : 'card-clean hover:shadow-lg'
                  }`}
                  style={isHighlighted ? {
                    background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 30%, #06B6D4 100%)',
                    boxShadow: '0 8px 32px rgba(99, 102, 241, 0.30), 0 4px 16px rgba(6, 182, 212, 0.20)',
                  } : undefined}
                >
                  {/* Texture overlays for highlighted card — clipped to card radius */}
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

                  {/* Badges — positioned outside overflow clip so they aren't cut off */}
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
                  isCurrentPlan || isHighlighted ? 'pt-4' : ''
                }`}>

                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: isHighlighted
                      ? 'rgba(255,255,255,0.15)'
                      : 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(6,182,212,0.10) 100%)'
                    }}
                  >
                    <plan.icon className={`w-6 h-6 ${isHighlighted ? 'text-white' : 'text-electric-indigo'}`} />
                  </div>
                  <div>
                    <h3 className={`text-xl font-bold ${isHighlighted ? 'text-white' : 'text-text-primary dark:text-white'}`}>{plan.name}</h3>
                    <div className={`text-sm ${isHighlighted ? 'text-white/70 font-medium' : 'text-text-secondary'}`}>{plan.tagline}</div>
                  </div>
                </div>

                <div className="mb-4">
                  {plan.isFree ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-text-primary dark:text-white">Free</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-2">
                        {/* Strikethrough original price — slides in when annual */}
                        <span className={`text-xl line-through transition-all duration-500 ease-out inline-block overflow-hidden whitespace-nowrap ${
                          isAnnual ? 'max-w-20 opacity-100' : 'max-w-0 opacity-0'
                        } ${isHighlighted ? 'text-white/40' : 'text-text-muted'}`}>
                          ${plan.monthlyPrice}
                        </span>
                        {/* Animated counting price via CSS @property */}
                        <span
                          className={`price-animated text-4xl font-bold ${isHighlighted ? 'text-white' : 'text-text-primary dark:text-white'}`}
                          style={{
                            '--price-dollars': isAnnual ? Math.floor(plan.annualPrice) : Math.floor(plan.monthlyPrice),
                            '--price-cents': Math.round(((isAnnual ? plan.annualPrice : plan.monthlyPrice) % 1) * 100),
                          } as React.CSSProperties}
                        />
                        <span className={isHighlighted ? 'text-white/70' : 'text-text-secondary'}>/mo</span>
                      </div>
                      {/* Animated billing text */}
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

                <p className={`mb-4 text-[15px] leading-relaxed ${isHighlighted ? 'text-white/80' : 'text-text-secondary'}`}>
                  {plan.description}
                </p>

                {/* Best for pill */}
                <div className="mb-6">
                  <span className={`inline-block text-xs font-medium px-3 py-1 rounded-full ${
                    isHighlighted
                      ? 'text-white/80 bg-white/15'
                      : 'text-electric-indigo dark:text-electric-cyan bg-electric-indigo/10 dark:bg-electric-cyan/15'
                  }`}>
                    Best for: {plan.bestFor}
                  </span>
                </div>

                <ul className="space-y-3 flex-1 mb-6">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-3 text-[15px]">
                      <Check className={`w-5 h-5 shrink-0 mt-0.5 ${
                        isHighlighted ? 'text-white' : 'text-electric-indigo'
                      }`} />
                      <span className={isHighlighted ? 'text-white/85' : 'text-text-secondary'}>{feature}</span>
                    </li>
                  ))}
                  {'lockedFeatures' in plan && plan.lockedFeatures && (plan.lockedFeatures as string[]).map((feature, j) => (
                    <li key={`locked-${j}`} className="flex items-start gap-3 text-sm">
                      <Lock className={`w-5 h-5 shrink-0 mt-0.5 ${isHighlighted ? 'text-white/40' : 'text-electric-indigo/60'}`} />
                      <span className={isHighlighted ? 'text-white/50' : 'text-text-muted'}>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePlanSelect(plan.name)}
                  disabled={isButtonDisabled(plan.name)}
                  className={`w-full py-3 rounded-lg font-semibold text-base transition-all mt-auto flex items-center justify-center gap-2 ${
                    isButtonDisabled(plan.name) && isCurrentPlan
                      ? 'bg-light-200 dark:bg-midnight-700 text-text-muted cursor-not-allowed'
                      : isButtonDisabled(plan.name)
                      ? 'opacity-50 cursor-wait'
                      : isHighlighted
                      ? 'bg-white text-electric-indigo font-bold hover:bg-white/90 shadow-lg'
                      : plan.ctaStyle === 'outlined'
                      ? 'border-2 border-electric-indigo bg-electric-indigo/10 text-electric-indigo dark:text-white hover:bg-electric-indigo hover:text-white'
                      : plan.ctaStyle === 'secondary'
                      ? 'bg-surface-100 dark:bg-midnight-700 hover:bg-surface-200 dark:hover:bg-midnight-600 text-text-primary dark:text-white'
                      : 'btn-gradient-electric text-white font-semibold px-6'
                  }`}
                >
                  {isCheckingOut === plan.name && <Loader2 className="w-5 h-5 animate-spin" />}
                  {getButtonText(plan.name, plan.cta)}
                </button>
                </div>
              </div>
              </AnimatedElement>
              );
            })}
          </div>

          {/* Trust Badges */}
          <AnimatedElement animation="fadeIn" delay={0.6}>
            <div className="flex flex-wrap justify-center gap-8 mt-12 text-sm text-text-secondary">
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
          </AnimatedElement>

          {/* Feature Comparison Matrix — hidden on mobile */}
          <AnimatedElement animation="fadeInUp" delay={0.65} className="hidden md:block">
            <div className="mt-16 pt-12 border-t border-light-300 dark:border-midnight-700">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-text-primary dark:text-white mb-2">
                  Feature Comparison
                </h3>
                <p className="text-text-secondary">
                  See exactly what you get with each plan
                </p>
              </div>

              <div role="table" aria-label="Feature comparison by plan">
                {/* Sticky Column Headers — sticks below fixed nav (64px) */}
                <div
                  role="row"
                  className="sticky top-[64px] z-10 grid grid-cols-[1fr_60px_60px_60px] sm:grid-cols-[1fr_100px_100px_100px] lg:grid-cols-[1fr_140px_140px_140px] border-b border-light-300 dark:border-midnight-700 bg-white dark:bg-midnight-900 rounded-t-xl shadow-[0_1px_3px_0_rgba(0,0,0,0.05)]"
                >
                  <div role="columnheader" className="py-4 px-3 sm:px-4 text-text-secondary font-medium text-sm">Feature</div>
                  <div role="columnheader" className="py-4 px-2 sm:px-4 text-center">
                    <div className="text-text-primary dark:text-white font-bold text-sm">Free</div>
                    <div className="text-xs text-text-muted">$0/mo</div>
                  </div>
                  <div role="columnheader" className="py-4 px-2 sm:px-4 text-center border-x border-light-200 dark:border-midnight-700 bg-electric-indigo/[0.04] dark:bg-electric-indigo/[0.08] relative">
                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-electric-indigo rounded-b-sm" />
                    <div className="text-electric-indigo font-bold text-sm">Home</div>
                    <div className="text-xs text-text-muted">${isAnnual ? '7.99' : '9.99'}/mo</div>
                  </div>
                  <div role="columnheader" className="py-4 px-2 sm:px-4 text-center">
                    <div className="text-text-primary dark:text-white font-bold text-sm">Pro</div>
                    <div className="text-xs text-text-muted">${isAnnual ? '15.99' : '19.99'}/mo</div>
                  </div>
                </div>

                {/* Feature rows */}
                {[
                  { icon: <MessageSquare className="w-4 h-4 text-electric-indigo" />, name: 'Chat Support', sub: 'Text-based troubleshooting', free: '5/month', home: 'Unlimited', pro: 'Unlimited' },
                  { icon: <Camera className="w-4 h-4 text-electric-indigo" />, name: 'Photo Analysis', sub: 'Send photos for diagnosis', free: '1/month', home: 'Unlimited', pro: 'Unlimited' },
                  { icon: <Mic className="w-4 h-4 text-electric-indigo" />, name: 'Voice Support', sub: 'Talk through issues hands-free', free: 'locked', home: 'Unlimited', pro: 'Unlimited' },
                  { icon: <Video className="w-4 h-4 text-electric-indigo" />, name: 'Video Diagnostic', sub: 'Live camera diagnosis', free: 'locked', home: '1/week', pro: '15/month' },
                  { icon: <Clock className="w-4 h-4 text-electric-indigo" />, name: 'Case History', sub: 'Saved conversations', free: '1 Case', home: 'Full history', pro: 'Full history' },
                  { icon: <Sparkles className="w-4 h-4 text-electric-indigo" />, name: 'Assist Pills', sub: 'Guided step-by-step fixes', free: 'check', home: 'check', pro: 'check' },
                  { icon: <FileText className="w-4 h-4 text-electric-indigo" />, name: 'PDF Reports', sub: 'Diagnostic case reports', free: 'check', home: 'check', pro: 'check' },
                  { icon: <Home className="w-4 h-4 text-electric-indigo" />, name: 'Multi-Home', sub: 'Properties supported', free: '1', home: '1', pro: 'Up to 5', isLast: true },
                ].map((row, i) => {
                  const renderCell = (value: string) => {
                    if (value === 'check') return <Check className="w-5 h-5 text-electric-cyan mx-auto" />;
                    if (value === 'locked') return <Lock className="w-4 h-4 text-text-muted mx-auto" />;
                    if (value === 'Unlimited' || value === 'Full history') return <span className="text-xs sm:text-sm font-semibold text-electric-cyan">{value}</span>;
                    if (value.includes('/week') || value.includes('/month') || value === 'Up to 5') return <span className="text-xs sm:text-sm font-semibold text-electric-indigo">{value}</span>;
                    return <span className="text-xs sm:text-sm text-text-secondary">{value}</span>;
                  };
                  return (
                    <div
                      key={i}
                      role="row"
                      className={`grid grid-cols-[1fr_60px_60px_60px] sm:grid-cols-[1fr_100px_100px_100px] lg:grid-cols-[1fr_140px_140px_140px] ${
                        !(row as any).isLast ? 'border-b border-light-200 dark:border-midnight-800' : ''
                      } hover:bg-light-50 dark:hover:bg-midnight-800/40 transition-colors`}
                    >
                      <div role="cell" className="py-3.5 sm:py-4 px-3 sm:px-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-electric-indigo/8 flex items-center justify-center shrink-0">
                            {row.icon}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-text-primary dark:text-white text-sm truncate">{row.name}</div>
                            <div className="text-xs text-text-muted truncate">{row.sub}</div>
                          </div>
                        </div>
                      </div>
                      <div role="cell" className="py-3.5 sm:py-4 px-2 sm:px-4 flex items-center justify-center">
                        {renderCell(row.free)}
                      </div>
                      <div role="cell" className="py-3.5 sm:py-4 px-2 sm:px-4 flex items-center justify-center border-x border-light-200 dark:border-midnight-700/60 bg-electric-indigo/[0.02] dark:bg-electric-indigo/[0.04]">
                        {renderCell(row.home)}
                      </div>
                      <div role="cell" className="py-3.5 sm:py-4 px-2 sm:px-4 flex items-center justify-center">
                        {renderCell(row.pro)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </AnimatedElement>

          {/* Smart Upgrade Suggestions */}
          <AnimatedElement animation="fadeInUp" delay={0.7}>
            <div className="mt-16 pt-12 border-t border-light-300 dark:border-midnight-700">
              <div className="max-w-2xl mx-auto text-center">
                <div className="inline-flex items-center gap-2 bg-white dark:bg-midnight-800 px-4 py-2 rounded-full mb-6 border border-surface-border dark:border-midnight-700 shadow-sm">
                  <Sparkles className="w-4 h-4 text-electric-indigo" />
                  <span className="text-gradient-electric font-semibold text-sm">Smart Recommendations</span>
                </div>
                <h3 className="text-2xl font-bold text-text-primary dark:text-white mb-4">
                  Smart upgrade suggestions, not random ads
                </h3>
                <p className="text-text-secondary text-[15px] leading-relaxed">
                  When we see the same device causing repeat problems, TotalAssist can suggest
                  replacement options — like a mesh Wi-Fi kit for larger homes or a more reliable
                  printer. We may earn a small commission if you buy through our links, but we only
                  recommend gear we believe will actually reduce future issues.
                </p>
              </div>
            </div>
          </AnimatedElement>

        </div>
      </div>

      {/* Value Proposition — Video Background */}
      <div className="relative overflow-hidden">
        {/* Video background */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          aria-hidden="true"
        >
          <source src="/hero-bg.mp4" type="video/mp4" />
        </video>
        {/* Brand gradient overlay */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.55) 0%, rgba(139,92,246,0.45) 40%, rgba(6,182,212,0.50) 100%)' }}
          aria-hidden="true"
        />
        {/* Subtle darken for text contrast */}
        <div className="absolute inset-0 bg-midnight-950/30" aria-hidden="true" />

        <div className="relative z-10 py-20 lg:py-24">
          <div className="container mx-auto px-6 max-w-3xl">
            <AnimatedElement animation="scaleIn">
              <div className="text-center">
                <h3 className="text-3xl lg:text-4xl font-bold text-white mb-5">
                  Why wait on hold when you don't have to?
                </h3>
                <p className="text-lg text-white/80 mb-8 leading-relaxed max-w-xl mx-auto">
                  Our support team is available <span className="text-[#06B6D4] font-bold">24/7</span> —
                  weekends, holidays, 3am. Describe your issue or snap a photo
                  and get expert guidance instantly.
                </p>
                <div className="flex flex-wrap justify-center gap-3 text-sm">
                  <span className="px-5 py-2.5 bg-white/10 backdrop-blur-sm text-white border border-white/15 rounded-full font-medium">No appointments</span>
                  <span className="px-5 py-2.5 bg-white/10 backdrop-blur-sm text-white border border-white/15 rounded-full font-medium">No waiting</span>
                  <span className="px-5 py-2.5 bg-white/10 backdrop-blur-sm text-white border border-white/15 rounded-full font-medium">No runaround</span>
                </div>
              </div>
            </AnimatedElement>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="section-light py-16 border-t border-light-300 dark:border-midnight-700">
        <div className="container mx-auto px-6 max-w-3xl">
          <AnimatedElement animation="fadeInUp">
            {/* FAQ Badge */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-white dark:bg-midnight-800 px-4 py-2 rounded-full mb-6 border border-electric-indigo/20 shadow-clean-sm">
                <HelpCircle className="w-4 h-4 text-electric-indigo" />
                <span className="text-gradient-electric font-semibold text-sm">FAQ</span>
              </div>
              <h2 className="text-3xl font-bold text-text-primary dark:text-white mb-4">
                Questions? We've Got Answers
              </h2>
              <p className="text-text-secondary">
                Everything you need to know about TotalAssist membership
              </p>
            </div>
          </AnimatedElement>
          <AnimatedElement animation="fadeInUp" delay={0.2}>
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  className={`rounded-xl border transition-all duration-300 overflow-hidden ${
                    openFaq === i
                      ? 'border-electric-indigo/30 bg-electric-indigo/[0.03]'
                      : 'border-light-300 dark:border-midnight-700 bg-white dark:bg-midnight-800 hover:border-light-400 dark:hover:border-midnight-600'
                  }`}
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full p-5 flex items-center justify-between text-left"
                    aria-expanded={openFaq === i}
                    aria-controls={`faq-answer-${i}`}
                  >
                    <span className="font-semibold text-lg text-text-primary dark:text-white">
                      {faq.q}
                    </span>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      openFaq === i
                        ? 'text-white'
                        : 'bg-light-200 dark:bg-midnight-700 text-text-secondary'
                    }`}
                      style={openFaq === i ? { background: 'linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)' } : undefined}
                    >
                      {openFaq === i ? (
                        <Minus className="w-5 h-5" />
                      ) : (
                        <Plus className="w-5 h-5" />
                      )}
                    </div>
                  </button>
                  <div
                    id={`faq-answer-${i}`}
                    role="region"
                    aria-hidden={openFaq !== i}
                    className={`overflow-hidden transition-all duration-300 ${
                      openFaq === i ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="px-5 pb-5 leading-relaxed text-[15px] text-text-secondary">
                      {faq.a}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </AnimatedElement>
        </div>
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

      {/* Final CTA */}
      <div
        className="relative py-20 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 40%, #06B6D4 100%)' }}
      >
        {/* Radial glow texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
          style={{
            background: 'radial-gradient(ellipse 60% 50% at 20% 50%, rgba(255,255,255,0.12) 0%, transparent 70%), radial-gradient(ellipse 50% 60% at 80% 30%, rgba(6,182,212,0.18) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 50% 80%, rgba(99,102,241,0.15) 0%, transparent 60%)',
          }}
        />
        {/* Subtle dot grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          aria-hidden="true"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="relative container mx-auto px-6 max-w-3xl text-center">
          <AnimatedElement animation="fadeInUp">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready for Stress-Free Tech Support?
            </h2>
          </AnimatedElement>
          <AnimatedElement animation="fadeInUp" delay={0.15}>
            <p className="text-white/90 mb-8 max-w-xl mx-auto">
              Ditch the hold music and expensive service calls. It's free to get started.
            </p>
          </AnimatedElement>
          <AnimatedElement animation="fadeInUp" delay={0.3}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => onNavigate(PageView.SIGNUP)}
                className="bg-white text-electric-indigo font-semibold px-8 py-3.5 rounded-lg transition-all shadow-clean hover:shadow-clean-md flex items-center justify-center gap-2"
              >
                Get Started <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="border-2 border-white/40 text-white font-semibold px-8 py-3.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                Compare Plans
              </button>
            </div>
          </AnimatedElement>
        </div>
      </div>
    </section>
  );
};
