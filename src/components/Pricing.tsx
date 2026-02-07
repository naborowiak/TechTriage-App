import React, { useState } from 'react';
import { Check, ArrowRight, ArrowLeft, MessageSquare, Camera, Video, Shield, Clock, Home, Users, Zap, Loader2, Mic, Lock, Plus, Minus, HelpCircle } from 'lucide-react';
import { PageView } from '../types';
import { useSubscription, SubscriptionTier } from '../hooks/useSubscription';
import { useAuth } from '../hooks/useAuth';
import { ScoutSignalIcon } from './Logo';
import { AnimatedElement, useParallax } from '../hooks/useAnimations';

interface PricingProps {
  onStart: () => void;
  onNavigate: (view: PageView) => void;
}

export const Pricing: React.FC<PricingProps> = ({ onNavigate }) => {
  const { ref: heroParallaxRef, offset: heroOffset } = useParallax(0.3);
  const { ref: ctaParallaxRef, offset: ctaOffset } = useParallax(0.2);
  const [isAnnual, setIsAnnual] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState<string | null>(null);
  const [isBuyingCredits, setIsBuyingCredits] = useState<'single' | 'pack' | null>(null);

  const { user, isLoading: authLoading } = useAuth();
  const { tier: currentTier, prices, startCheckout, isLoading: subLoading } = useSubscription(user?.id);

  // Map plan names to tier identifiers
  const planToTier: Record<string, SubscriptionTier> = {
    'TotalAssist Free': 'free',
    'TotalAssist Home': 'home',
    'TotalAssist Pro': 'pro',
  };

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

    setIsCheckingOut(planName);
    try {
      const priceId = isAnnual
        ? prices[tier as 'home' | 'pro'].annual
        : prices[tier as 'home' | 'pro'].monthly;

      if (!priceId) {
        console.error('Price ID not configured for', tier, isAnnual ? 'annual' : 'monthly');
        alert('Payment is not configured yet. Please contact support.');
        return;
      }

      await startCheckout(priceId);
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
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

  // Credit pack price IDs (from Stripe)
  const creditPrices = {
    single: 'price_1SxBftPeLuLIM8GmX9sxeASx',  // $5 - 1 credit
    pack: 'price_1SxBgLPeLuLIM8GmkJ27pvdX',    // $12 - 3 credits
  };

  // Handle credit pack purchase
  const handleCreditPurchase = async (packType: 'single' | 'pack') => {
    // If user is not logged in, navigate to signup first
    if (!user) {
      onNavigate(PageView.SIGNUP);
      return;
    }

    setIsBuyingCredits(packType);
    try {
      const priceId = creditPrices[packType];
      await startCheckout(priceId);
    } catch (error) {
      console.error('Credit purchase error:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setIsBuyingCredits(null);
    }
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
      tagline: 'The Taste Test',
      monthlyPrice: 0,
      annualPrice: 0,
      isFree: true,
      description: 'Try Scout AI and see how easy tech support can be. No credit card required.',
      icon: MessageSquare,
      features: [
        '3 Scout Chat messages to start',
        '1 Scout Snapshot photo analysis',
        'Access to knowledge base',
        'Basic troubleshooting guides',
      ],
      lockedFeatures: [
        'Scout Voice (Voice) — Upgrade to unlock',
        'Live Video Support — Upgrade to unlock',
      ],
      cta: 'Sign Up Free',
      ctaStyle: 'outlined',
    },
    {
      name: 'TotalAssist Home',
      tagline: 'The Daily Driver',
      monthlyPrice: 9.99,
      annualPrice: 7.99,
      description: 'Complete coverage for your home. Chat, snap, talk, or go live with Scout AI.',
      icon: Home,
      features: [
        'Unlimited Scout Chat',
        'Unlimited Scout Snapshot',
        'Scout Voice (Voice Mode)',
        '1 Live Video session per week',
        'Priority support queue',
        '15% off onsite service visits',
      ],
      cta: 'Get Started',
      ctaStyle: 'primary',
      highlight: true,
    },
    {
      name: 'TotalAssist Pro',
      tagline: 'The Power User',
      monthlyPrice: 19.99,
      annualPrice: 15.99,
      description: 'Maximum coverage with premium AI. Ideal for families, landlords, and Airbnb hosts.',
      icon: Users,
      features: [
        'Everything in Home, plus:',
        '15 Live Video sessions per month',
        'Premium AI model for all features',
        'Multi-home support (up to 5)',
        '$100 annual onsite service credit',
        'Family member accounts',
        'Dedicated support line',
      ],
      cta: 'Get Started',
      ctaStyle: 'secondary',
    },
  ];

  const products = [
    {
      name: 'Scout Chat',
      icon: MessageSquare,
      description: 'AI-powered text support for instant answers to your tech questions.',
      availability: 'All Plans',
    },
    {
      name: 'Scout Snapshot',
      icon: Camera,
      description: 'Upload a photo and get an AI diagnosis of what\'s wrong—no waiting.',
      availability: 'All Plans',
    },
    {
      name: 'Scout Voice',
      icon: Mic,
      description: 'Voice-powered support—just talk to Scout like you would a real technician.',
      availability: 'Home & Pro',
    },
    {
      name: 'Live Video Support',
      icon: Video,
      description: 'Start a live video session with Scout AI for real-time visual diagnosis and guidance.',
      availability: 'Home & Pro',
    },
  ];

  const faqs = [
    {
      q: 'What is Scout Snapshot?',
      a: 'Scout Snapshot is our photo diagnosis feature. Upload a photo of an error message, blinking light, or device issue, and Scout analyzes it instantly to provide troubleshooting guidance.',
    },
    {
      q: 'How does Live Video Support work?',
      a: 'Start a live video session directly from your browser. Scout AI watches in real-time as you show the issue, provides instant diagnosis, and guides you through the fix step-by-step while you work.',
    },
    {
      q: 'How do Live Video sessions work?',
      a: 'TotalAssist Home members receive 1 Live Video session per week (resets every 7 days). TotalAssist Pro members receive 15 sessions per month. Need more? You can purchase additional sessions anytime.',
    },
    {
      q: 'What is your cancellation policy?',
      a: 'You can cancel your membership at any time from your account settings. There are no cancellation fees or long-term contracts. Cancellations take effect at the end of your current billing period.',
    },
    {
      q: 'What\'s the difference between Home and Pro?',
      a: 'Both plans include unlimited Chat, Snapshot, and Signal (voice). The key differences: Home gets 1 Live Video session per week with standard AI, while Pro gets 15 per month with our premium AI model for all features. Pro also includes multi-home support and family accounts.',
    },
    {
      q: 'What types of issues do you support?',
      a: 'We specialize in consumer technology: Wi-Fi and networking, computers and laptops, smart home devices (Alexa, Google Home, Ring, Nest), TVs and streaming, printers, smart thermostats, and general tech troubleshooting.',
    },
    {
      q: 'Do you offer a mobile app?',
      a: 'TotalAssist currently works directly in your web browser with no download required. Our mobile app is coming soon for an even more convenient experience—stay tuned for updates.',
    },
  ];

  return (
    <section className="min-h-screen pt-[72px] bg-light-50 dark:bg-midnight-950 transition-colors">
      {/* Hero Section */}
      <div ref={heroParallaxRef} className="bg-light-100 dark:bg-midnight-900 py-20 text-center relative overflow-hidden border-b border-light-300 dark:border-midnight-700">
        {/* Background orbs with parallax */}
        <div
          className="absolute top-0 right-1/4 w-96 h-96 bg-electric-indigo/10 rounded-full blur-3xl transition-transform duration-100"
          style={{ transform: `translateY(${heroOffset * 0.5}px)` }}
        ></div>
        <div
          className="absolute bottom-0 left-1/4 w-64 h-64 bg-scout-purple/10 rounded-full blur-3xl transition-transform duration-100"
          style={{ transform: `translateY(${-heroOffset * 0.3}px)` }}
        ></div>

        <div className="container mx-auto px-6 max-w-4xl relative z-10">
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
            <div className="inline-flex items-center gap-2 bg-electric-indigo/10 backdrop-blur px-4 py-2 rounded-full text-electric-indigo text-sm mb-6 border border-electric-indigo/30">
              <ScoutSignalIcon size={18} animate={true} />
              <span className="font-semibold">Scout AI available 24/7</span>
            </div>
          </AnimatedElement>
          <AnimatedElement animation="fadeInUp" delay={0.1}>
            <h1 className="text-4xl lg:text-5xl font-black text-text-primary dark:text-white mb-6 leading-tight">
              Fix Your Tech Issues<br />
              <span className="text-gradient-electric">In Minutes, Not Hours</span>
            </h1>
          </AnimatedElement>
          <AnimatedElement animation="fadeInUp" delay={0.2}>
            <p className="text-text-secondary text-lg mb-8 max-w-2xl mx-auto">
              Wi-Fi down? Smart TV acting up? Describe your problem, snap a photo, or start a video walkthrough—TotalAssist guides you to a fix instantly.
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
      <div className="bg-white dark:bg-midnight-950 py-16 border-b border-light-300 dark:border-midnight-700">
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
                <div className="text-center group">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-gradient-to-br from-electric-indigo to-scout-purple border border-electric-indigo/30 group-hover:border-electric-cyan/50 group-hover:scale-110 transition-all shadow-lg shadow-electric-indigo/20">
                    <product.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-base font-bold text-text-primary dark:text-white mb-1">{product.name}</h3>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full mb-2 inline-block ${
                    product.availability === 'All Plans'
                      ? 'bg-electric-cyan/20 text-electric-cyan'
                      : 'bg-scout-purple/20 text-scout-purple'
                  }`}>
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
      <div className="bg-light-100 dark:bg-midnight-900 py-20">
        <div className="container mx-auto px-6 max-w-6xl">
          <AnimatedElement animation="fadeInUp">
            <h2 className="text-3xl font-black text-text-primary dark:text-white text-center mb-4">
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
                className={`w-14 h-8 rounded-full p-1 transition-colors ${isAnnual ? 'bg-gradient-to-r from-electric-indigo to-electric-cyan' : 'bg-light-400'}`}
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
                    ? 'text-white bg-gradient-to-r from-electric-indigo to-electric-cyan'
                    : 'text-text-muted bg-light-300'
                }`}>
                  Save up to 25%
                </span>
              </span>
            </div>
          </AnimatedElement>

          {/* Pricing Grid */}
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {plans.map((plan, i) => (
              <AnimatedElement key={i} animation="fadeInUp" delay={0.2 + i * 0.15}>
                <div
                  className={`bg-white dark:bg-midnight-800 rounded-3xl p-8 relative transition-all border h-full hover:-translate-y-1 shadow-sm ${
                    user && currentTier === planToTier[plan.name]
                      ? 'border-electric-cyan shadow-glow-cyan scale-[1.02] md:scale-105'
                      : plan.highlight
                      ? 'border-electric-indigo shadow-glow-electric scale-[1.02] md:scale-105'
                      : 'border-light-300 dark:border-midnight-700 hover:border-light-400 dark:hover:border-midnight-600'
                  }`}
                >
                {user && currentTier === planToTier[plan.name] && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-electric-cyan text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg">
                    YOUR PLAN
                  </div>
                )}
                {plan.highlight && !(user && currentTier === planToTier[plan.name]) && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-electric-indigo to-electric-cyan text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg">
                    MOST POPULAR
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    plan.highlight ? 'bg-gradient-to-br from-scout-purple to-electric-indigo' : 'bg-light-200 dark:bg-midnight-700'
                  }`}>
                    <plan.icon className={`w-6 h-6 ${plan.highlight ? 'text-white' : 'text-electric-indigo'}`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-text-primary dark:text-white">{plan.name}</h3>
                    <div className="text-sm text-text-secondary">{plan.tagline}</div>
                  </div>
                </div>

                <div className="mb-4">
                  {plan.isFree ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-text-primary dark:text-white">Free</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-2">
                        {isAnnual && (
                          <span className="text-xl text-text-muted line-through">
                            ${plan.monthlyPrice}
                          </span>
                        )}
                        <span className="text-4xl font-black text-text-primary dark:text-white">
                          ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                        </span>
                        <span className="text-text-secondary">/mo</span>
                      </div>
                      <div className="text-sm text-text-secondary">
                        {isAnnual
                          ? `Billed annually ($${(plan.annualPrice * 12).toFixed(2)}/yr)`
                          : 'Billed monthly'
                        }
                      </div>
                    </>
                  )}
                </div>

                <p className="text-text-secondary mb-6 text-sm leading-relaxed">
                  {plan.description}
                </p>

                <button
                  onClick={() => handlePlanSelect(plan.name)}
                  disabled={isButtonDisabled(plan.name)}
                  className={`w-full py-4 rounded-full font-bold text-base transition-all mb-6 flex items-center justify-center gap-2 ${
                    isButtonDisabled(plan.name) && user && currentTier === planToTier[plan.name]
                      ? 'bg-light-200 dark:bg-midnight-700 text-text-muted cursor-not-allowed'
                      : isButtonDisabled(plan.name)
                      ? 'opacity-50 cursor-wait'
                      : plan.ctaStyle === 'primary'
                      ? 'btn-gradient-electric text-white shadow-lg shadow-electric-indigo/25 hover:shadow-xl hover:shadow-electric-indigo/30'
                      : plan.ctaStyle === 'outlined'
                      ? 'border-2 border-electric-indigo bg-electric-indigo/10 text-electric-indigo hover:bg-electric-indigo hover:text-white'
                      : 'bg-light-200 hover:bg-light-300 text-text-primary border border-light-300'
                  }`}
                >
                  {isCheckingOut === plan.name && <Loader2 className="w-5 h-5 animate-spin" />}
                  {getButtonText(plan.name, plan.cta)}
                </button>

                <ul className="space-y-3">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-3 text-sm">
                      <Check className={`w-5 h-5 shrink-0 mt-0.5 ${
                        plan.highlight ? 'text-electric-cyan' : 'text-electric-indigo'
                      }`} />
                      <span className="text-text-secondary">{feature}</span>
                    </li>
                  ))}
                  {'lockedFeatures' in plan && plan.lockedFeatures && (plan.lockedFeatures as string[]).map((feature, j) => (
                    <li key={`locked-${j}`} className="flex items-start gap-3 text-sm">
                      <Lock className="w-5 h-5 shrink-0 mt-0.5 text-scout-purple/60" />
                      <span className="text-gradient-locked">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              </AnimatedElement>
            ))}
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

          {/* Feature Comparison Matrix */}
          <AnimatedElement animation="fadeInUp" delay={0.65}>
            <div className="mt-16 pt-12 border-t border-light-300 dark:border-midnight-700">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-black text-text-primary dark:text-white mb-2">
                  Feature Comparison
                </h3>
                <p className="text-text-secondary">
                  See exactly what you get with each plan
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b border-light-300 dark:border-midnight-700">
                      <th className="text-left py-4 px-4 text-text-secondary font-medium">Feature</th>
                      <th className="py-4 px-4 text-center">
                        <div className="text-text-primary dark:text-white font-bold">Free</div>
                        <div className="text-xs text-text-muted">$0/mo</div>
                      </th>
                      <th className="py-4 px-4 text-center bg-electric-indigo/5 rounded-t-xl">
                        <div className="text-electric-indigo font-bold">Home</div>
                        <div className="text-xs text-text-muted">${isAnnual ? '7.99' : '9.99'}/mo</div>
                      </th>
                      <th className="py-4 px-4 text-center">
                        <div className="text-text-primary dark:text-white font-bold">Pro</div>
                        <div className="text-xs text-text-muted">${isAnnual ? '15.99' : '19.99'}/mo</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Scout Chat */}
                    <tr className="border-b border-light-200 dark:border-midnight-800">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-electric-indigo/10 flex items-center justify-center">
                            <MessageSquare className="w-4 h-4 text-electric-indigo" />
                          </div>
                          <div>
                            <div className="font-medium text-text-primary dark:text-white">Scout Chat</div>
                            <div className="text-xs text-text-muted">AI text support</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-sm text-text-secondary">3 to start</span>
                      </td>
                      <td className="py-4 px-4 text-center bg-electric-indigo/5">
                        <span className="text-sm font-semibold text-electric-cyan">Unlimited</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-sm font-semibold text-electric-cyan">Unlimited</span>
                      </td>
                    </tr>
                    {/* Scout Snapshot */}
                    <tr className="border-b border-light-200 dark:border-midnight-800">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-electric-indigo/10 flex items-center justify-center">
                            <Camera className="w-4 h-4 text-electric-indigo" />
                          </div>
                          <div>
                            <div className="font-medium text-text-primary dark:text-white">Scout Snapshot</div>
                            <div className="text-xs text-text-muted">Photo diagnosis</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-sm text-text-secondary">1/month</span>
                      </td>
                      <td className="py-4 px-4 text-center bg-electric-indigo/5">
                        <span className="text-sm font-semibold text-electric-cyan">Unlimited</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-sm font-semibold text-electric-cyan">Unlimited</span>
                      </td>
                    </tr>
                    {/* Scout Voice */}
                    <tr className="border-b border-light-200 dark:border-midnight-800">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-scout-purple/10 flex items-center justify-center">
                            <Mic className="w-4 h-4 text-scout-purple" />
                          </div>
                          <div>
                            <div className="font-medium text-text-primary dark:text-white">Scout Voice</div>
                            <div className="text-xs text-text-muted">15-min voice diagnostics</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-1 text-text-muted">
                          <Lock className="w-3 h-3" />
                          <span className="text-xs">Locked</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center bg-electric-indigo/5">
                        <span className="text-sm font-semibold text-electric-cyan">Unlimited</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-sm font-semibold text-electric-cyan">Unlimited</span>
                      </td>
                    </tr>
                    {/* Live Video */}
                    <tr className="border-b border-light-200 dark:border-midnight-800">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-scout-purple/10 flex items-center justify-center">
                            <Video className="w-4 h-4 text-scout-purple" />
                          </div>
                          <div>
                            <div className="font-medium text-text-primary dark:text-white">Live Video</div>
                            <div className="text-xs text-text-muted">Real-time video support</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-1 text-text-muted">
                          <Lock className="w-3 h-3" />
                          <span className="text-xs">Locked</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center bg-electric-indigo/5">
                        <span className="text-sm text-text-secondary">1/week</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-sm font-semibold text-scout-purple">15/month</span>
                      </td>
                    </tr>
                    {/* AI Model */}
                    <tr className="border-b border-light-200 dark:border-midnight-800">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-electric-cyan/10 flex items-center justify-center">
                            <Zap className="w-4 h-4 text-electric-cyan" />
                          </div>
                          <div>
                            <div className="font-medium text-text-primary dark:text-white">AI Model</div>
                            <div className="text-xs text-text-muted">Intelligence level</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-sm text-text-secondary">Standard</span>
                      </td>
                      <td className="py-4 px-4 text-center bg-electric-indigo/5">
                        <span className="text-sm text-text-secondary">Standard</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-sm font-semibold text-gradient-electric">Premium</span>
                      </td>
                    </tr>
                    {/* Multi-home */}
                    <tr>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-electric-cyan/10 flex items-center justify-center">
                            <Home className="w-4 h-4 text-electric-cyan" />
                          </div>
                          <div>
                            <div className="font-medium text-text-primary dark:text-white">Multi-Home</div>
                            <div className="text-xs text-text-muted">Properties supported</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-sm text-text-secondary">1</span>
                      </td>
                      <td className="py-4 px-4 text-center bg-electric-indigo/5 rounded-b-xl">
                        <span className="text-sm text-text-secondary">1</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-sm font-semibold text-scout-purple">Up to 5</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </AnimatedElement>

          {/* Credit Packs Section */}
          <AnimatedElement animation="fadeInUp" delay={0.7}>
            <div className="mt-16 pt-12 border-t border-light-300 dark:border-midnight-700">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-scout-purple/10 px-4 py-2 rounded-full text-scout-purple text-sm mb-4 border border-scout-purple/30">
                  <Video className="w-4 h-4" />
                  <span className="font-semibold">Add-On</span>
                </div>
                <h3 className="text-2xl font-black text-text-primary dark:text-white mb-2">
                  Need More Video Sessions?
                </h3>
                <p className="text-text-secondary max-w-lg mx-auto">
                  Purchase video diagnostic credits anytime — no subscription required. Perfect for one-off issues or when you need extra sessions.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
                {/* Single Credit */}
                <div className="bg-white dark:bg-midnight-800 rounded-2xl p-6 border border-light-300 dark:border-midnight-700 hover:border-scout-purple/50 transition-all hover:-translate-y-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-scout-purple/10 flex items-center justify-center">
                      <Video className="w-6 h-6 text-scout-purple" />
                    </div>
                    <div>
                      <h4 className="font-bold text-text-primary dark:text-white">Video Diagnostic</h4>
                      <p className="text-sm text-text-muted">1 live session</p>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-3xl font-black text-text-primary dark:text-white">$5</span>
                    <span className="text-text-muted">per credit</span>
                  </div>
                  <button
                    onClick={() => handleCreditPurchase('single')}
                    disabled={isBuyingCredits !== null}
                    className="w-full py-3 rounded-xl font-semibold text-sm border-2 border-scout-purple text-scout-purple hover:bg-scout-purple hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isBuyingCredits === 'single' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Buy 1 Credit'
                    )}
                  </button>
                </div>

                {/* 3-Pack */}
                <div className="bg-white dark:bg-midnight-800 rounded-2xl p-6 border-2 border-scout-purple relative hover:-translate-y-1 transition-all shadow-lg shadow-scout-purple/10">
                  <div className="absolute -top-3 right-4 bg-gradient-to-r from-scout-purple to-electric-indigo text-white text-xs font-bold px-3 py-1 rounded-full">
                    SAVE $3
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-scout-purple to-electric-indigo flex items-center justify-center">
                      <Video className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-text-primary dark:text-white">Video Diagnostic 3-Pack</h4>
                      <p className="text-sm text-text-muted">3 live sessions</p>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-3xl font-black text-text-primary dark:text-white">$12</span>
                    <span className="text-text-muted line-through">$15</span>
                    <span className="text-sm text-scout-purple font-medium">($4/session)</span>
                  </div>
                  <button
                    onClick={() => handleCreditPurchase('pack')}
                    disabled={isBuyingCredits !== null}
                    className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-scout-purple to-electric-indigo text-white hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-scout-purple/25"
                  >
                    {isBuyingCredits === 'pack' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Buy 3-Pack'
                    )}
                  </button>
                </div>
              </div>

              <p className="text-center text-sm text-text-muted mt-6">
                Credits never expire. Use them whenever you need live video support.
              </p>
            </div>
          </AnimatedElement>

          {/* Referral Program Section */}
          <AnimatedElement animation="fadeInUp" delay={0.75}>
            <div className="mt-16 pt-12 border-t border-light-300 dark:border-midnight-700">
              <div className="bg-gradient-to-br from-scout-purple/10 to-electric-indigo/10 rounded-3xl p-8 md:p-10 border border-scout-purple/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-scout-purple/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-electric-cyan/10 rounded-full blur-3xl" />

                <div className="relative grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <div className="inline-flex items-center gap-2 bg-scout-purple/20 px-3 py-1 rounded-full text-scout-purple text-xs font-bold mb-4">
                      <Users className="w-3 h-3" />
                      REFERRAL PROGRAM
                    </div>
                    <h3 className="text-2xl md:text-3xl font-black text-text-primary dark:text-white mb-4">
                      Give a Month,<br />
                      <span className="text-gradient-electric">Get a Month</span>
                    </h3>
                    <p className="text-text-secondary mb-6">
                      Share TotalAssist with friends and family. When they subscribe to Home or Pro, you both get a free month added to your subscription.
                    </p>
                    <ul className="space-y-2 text-sm text-text-secondary mb-6">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-electric-cyan" />
                        No limit on referrals
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-electric-cyan" />
                        Credits applied automatically
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-electric-cyan" />
                        Track referrals in your dashboard
                      </li>
                    </ul>
                  </div>

                  <div className="bg-white dark:bg-midnight-800 rounded-2xl p-6 border border-light-300 dark:border-midnight-700 shadow-lg">
                    <div className="text-sm font-medium text-text-secondary mb-2">Your Referral Link</div>
                    <div className="flex gap-2 mb-4">
                      <input
                        type="text"
                        readOnly
                        value={user ? `totalassist.com/r/${user.id.slice(0, 8)}` : 'Sign in to get your link'}
                        className="flex-1 bg-light-100 dark:bg-midnight-900 border border-light-300 dark:border-midnight-700 rounded-lg px-4 py-3 text-sm text-text-primary dark:text-white"
                      />
                      <button
                        onClick={() => {
                          if (user) {
                            navigator.clipboard.writeText(`https://totalassist.com/r/${user.id.slice(0, 8)}`);
                          }
                        }}
                        className="px-4 py-3 bg-electric-indigo text-white rounded-lg font-medium text-sm hover:bg-electric-indigo/90 transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="text-xs text-text-muted">
                      {user ? (
                        <span>Share this link to start earning free months!</span>
                      ) : (
                        <span>
                          <button onClick={() => onNavigate(PageView.SIGNUP)} className="text-electric-indigo hover:underline">
                            Sign in
                          </button>
                          {' '}to get your personal referral link
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedElement>

          {/* Student & Special Discounts */}
          <AnimatedElement animation="fadeInUp" delay={0.8}>
            <div className="mt-12 grid sm:grid-cols-2 gap-6">
              {/* Student Discount */}
              <div className="bg-white dark:bg-midnight-800 rounded-2xl p-6 border border-light-300 dark:border-midnight-700 hover:border-electric-cyan/50 transition-all hover:-translate-y-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-electric-cyan/10 flex items-center justify-center">
                    <svg className="w-6 h-6 text-electric-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-text-primary dark:text-white">Student Discount</h4>
                    <div className="text-sm text-electric-cyan font-semibold">50% off Home & Pro</div>
                  </div>
                </div>
                <p className="text-sm text-text-secondary mb-4">
                  Verify your student status with SheerID and get half off any paid plan for your entire time in school.
                </p>
                <button className="w-full py-3 rounded-xl font-semibold text-sm border-2 border-electric-cyan text-electric-cyan hover:bg-electric-cyan hover:text-white transition-all">
                  Verify Student Status
                </button>
              </div>

              {/* Partner Promo */}
              <div className="bg-white dark:bg-midnight-800 rounded-2xl p-6 border border-light-300 dark:border-midnight-700 hover:border-scout-purple/50 transition-all hover:-translate-y-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-scout-purple/10 flex items-center justify-center">
                    <svg className="w-6 h-6 text-scout-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-text-primary dark:text-white">Have a Promo Code?</h4>
                    <div className="text-sm text-scout-purple font-semibold">Partner discounts available</div>
                  </div>
                </div>
                <p className="text-sm text-text-secondary mb-4">
                  Got a promo code from a partner, ISP, or organization? Enter it here to claim your special discount.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter promo code"
                    className="flex-1 bg-light-100 dark:bg-midnight-900 border border-light-300 dark:border-midnight-700 rounded-lg px-4 py-3 text-sm text-text-primary dark:text-white placeholder:text-text-muted"
                  />
                  <button className="px-4 py-3 bg-scout-purple text-white rounded-lg font-medium text-sm hover:bg-scout-purple/90 transition-colors">
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </AnimatedElement>
        </div>
      </div>

      {/* Value Proposition */}
      <div className="bg-white dark:bg-midnight-950 py-16 border-y border-light-300 dark:border-midnight-700">
        <div className="container mx-auto px-6 max-w-3xl">
          <AnimatedElement animation="scaleIn">
            <div className="bg-gradient-to-br from-light-100 to-white dark:from-midnight-800 dark:to-midnight-900 rounded-3xl p-10 text-center relative overflow-hidden border border-light-300 dark:border-midnight-700 shadow-lg">
              <div className="absolute top-0 right-0 w-32 h-32 bg-scout-purple/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-electric-indigo/10 rounded-full blur-3xl" />
              <div className="relative">
                <h3 className="text-2xl font-black text-text-primary dark:text-white mb-4">
                  Why wait on hold when you don't have to?
                </h3>
                <p className="text-lg text-text-secondary mb-6 leading-relaxed max-w-xl mx-auto">
                  Scout AI is available <span className="text-gradient-electric font-bold">24/7</span> —
                  weekends, holidays, 3am. Describe your issue, snap a photo, or start a video walkthrough
                  and get guidance instantly.
                </p>
                <div className="flex flex-wrap justify-center gap-4 text-sm">
                  <span className="px-4 py-2 bg-electric-indigo/10 text-electric-indigo rounded-full font-medium">No appointments</span>
                  <span className="px-4 py-2 bg-electric-indigo/10 text-electric-indigo rounded-full font-medium">No waiting</span>
                  <span className="px-4 py-2 bg-electric-indigo/10 text-electric-indigo rounded-full font-medium">No runaround</span>
                </div>
              </div>
            </div>
          </AnimatedElement>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-light-100 dark:bg-midnight-900 py-16 border-t border-light-300 dark:border-midnight-700">
        <div className="container mx-auto px-6 max-w-3xl">
          <AnimatedElement animation="fadeInUp">
            {/* FAQ Badge */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-white dark:bg-midnight-800 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-scout-purple/30 shadow-sm">
                <HelpCircle className="w-4 h-4 text-scout-purple" />
                <span className="text-scout-purple font-semibold text-sm">FAQ</span>
              </div>
              <h2 className="text-3xl font-black text-text-primary dark:text-white mb-4 italic">
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
                      ? 'border-scout-purple/50 bg-gradient-to-br from-scout-purple/10 to-electric-indigo/5'
                      : 'border-light-300 dark:border-midnight-700 bg-white dark:bg-midnight-800 hover:border-light-400 dark:hover:border-midnight-600'
                  }`}
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full p-5 flex items-center justify-between text-left"
                  >
                    <span className={`font-semibold text-lg text-text-primary dark:text-white`}>
                      {faq.q}
                    </span>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      openFaq === i
                        ? 'bg-scout-purple/20 text-scout-purple'
                        : 'bg-light-200 dark:bg-midnight-700 text-text-secondary'
                    }`}>
                      {openFaq === i ? (
                        <Minus className="w-5 h-5" />
                      ) : (
                        <Plus className="w-5 h-5" />
                      )}
                    </div>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      openFaq === i ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="px-5 pb-5 leading-relaxed text-text-secondary">
                      {faq.a}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </AnimatedElement>
        </div>
      </div>

      {/* Final CTA */}
      <div ref={ctaParallaxRef} className="bg-gradient-to-br from-scout-purple to-electric-indigo py-20 relative overflow-hidden">
        {/* Background decoration with parallax */}
        <div className="absolute inset-0 opacity-20 z-0">
          <div
            className="absolute top-0 left-0 w-96 h-96 bg-electric-cyan rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 transition-transform duration-100"
            style={{ transform: `translate(-50%, -50%) translateY(${ctaOffset * 0.5}px)` }}
          ></div>
          <div
            className="absolute bottom-0 right-0 w-96 h-96 bg-scout-glow rounded-full blur-3xl translate-x-1/2 translate-y-1/2 transition-transform duration-100"
            style={{ transform: `translate(50%, 50%) translateY(${-ctaOffset * 0.3}px)` }}
          ></div>
        </div>
        <div className="container mx-auto px-6 max-w-3xl text-center relative z-10">
          <AnimatedElement animation="fadeInUp">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
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
                className="bg-midnight-950 hover:bg-midnight-900 text-white font-bold px-10 py-4 rounded-full transition-all shadow-xl hover:shadow-2xl hover:scale-105 flex items-center justify-center gap-2"
              >
                Get Started <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="border-2 border-white/80 text-white font-bold px-10 py-4 rounded-full hover:bg-white/10 transition-colors"
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
