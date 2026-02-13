import React, { useState } from 'react';
import { Check, ArrowRight, ArrowLeft, MessageSquare, Camera, Mic, Video, Shield, Clock, Home, Users, Zap, Loader2, Lock, Plus, Minus, HelpCircle, FileText, Sparkles } from 'lucide-react';
import { PageView } from '../types';
import { useSubscription, SubscriptionTier } from '../hooks/useSubscription';
import { useAuth } from '../hooks/useAuth';
import { ScoutSignalIcon } from './Logo';
import { AnimatedElement } from '../hooks/useAnimations';

interface PricingProps {
  onStart: () => void;
  onNavigate: (view: PageView) => void;
}

export const Pricing: React.FC<PricingProps> = ({ onNavigate }) => {
  const [isAnnual, setIsAnnual] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState<string | null>(null);

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
      tagline: 'Try It Out',
      monthlyPrice: 0,
      annualPrice: 0,
      isFree: true,
      description: 'See how easy tech support can be. No credit card required.',
      icon: MessageSquare,
      features: [
        '5 support messages per month',
        '1 photo analysis per month',
        'Guided fix steps (Assist Pills)',
        'Case history saved to your account',
      ],
      lockedFeatures: [] as string[],
      cta: 'Sign Up Free',
      ctaStyle: 'outlined',
    },
    {
      name: 'TotalAssist Home',
      tagline: 'Unlimited Support',
      monthlyPrice: 9.99,
      annualPrice: 7.99,
      description: 'Unlimited support for your home. Chat and send photos anytime — your tech support is always on.',
      icon: Home,
      features: [
        'Unlimited support messages',
        'Unlimited photo analysis',
        'Voice support — talk through issues',
        'Video diagnostic — 1 credit/week',
        'Guided fix steps (Assist Pills)',
        'PDF diagnostic reports',
        'Full case history and search',
        'Email case summaries',
      ],
      cta: 'Get Started',
      ctaStyle: 'primary',
      highlight: true,
    },
    {
      name: 'TotalAssist Pro',
      tagline: 'For Families & Landlords',
      monthlyPrice: 19.99,
      annualPrice: 15.99,
      description: 'Everything in Home, plus multi-property support. Ideal for families, landlords, and Airbnb hosts.',
      icon: Users,
      features: [
        'Everything in Home, plus:',
        'Multi-home support (up to 5)',
        'Family member accounts',
        'Video diagnostics — 15 credits/month',
        'Professional escalation reports (PDF)',
        'Priority response times',
      ],
      cta: 'Get Started',
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
      a: 'Both plans include unlimited chat, photo analysis, and voice support. Pro adds 15 video credits per month (vs. 1/week on Home), multi-home support (up to 5 properties), family member accounts, professional escalation reports, and priority response times. It\'s ideal for landlords, Airbnb hosts, or families managing multiple homes.',
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
  ];

  return (
    <section className="min-h-screen pt-[72px] bg-light-50 dark:bg-midnight-950 transition-colors">
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
            <div className="inline-flex items-center gap-2 bg-electric-indigo/8 px-4 py-2 rounded-full text-electric-indigo text-sm mb-6 border border-electric-indigo/20">
              <ScoutSignalIcon size={18} animate={true} />
              <span className="font-semibold">Support available 24/7</span>
            </div>
          </AnimatedElement>
          <AnimatedElement animation="fadeInUp" delay={0.1}>
            <h1 className="text-4xl lg:text-5xl font-bold text-text-primary dark:text-white mb-6 leading-tight">
              Fix Your Tech Issues<br />
              <span className="text-electric-indigo">In Minutes, Not Hours</span>
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
                <div className="card-clean rounded-lg p-6 text-center cursor-default">
                  <div className="w-12 h-12 rounded-lg bg-electric-indigo/8 flex items-center justify-center mx-auto mb-4">
                    <product.icon className="w-6 h-6 text-electric-indigo" />
                  </div>
                  <h3 className="text-base font-bold text-text-primary dark:text-white mb-1">{product.name}</h3>
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-full mb-2 inline-block bg-electric-indigo/8 text-electric-indigo">
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
      <div className="section-light py-20">
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
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {plans.map((plan, i) => (
              <AnimatedElement key={i} animation="fadeInUp" delay={0.2 + i * 0.15}>
                <div
                  className={`card-clean rounded-lg p-8 relative overflow-hidden transition-all h-full flex flex-col hover:-translate-y-1 ${
                    user && currentTier === planToTier[plan.name]
                      ? 'border-2 border-electric-cyan shadow-clean-md'
                      : plan.highlight
                      ? 'border-2 border-electric-indigo shadow-clean-md'
                      : ''
                  }`}
                >
                <div className={`flex flex-col flex-1 ${
                  (user && currentTier === planToTier[plan.name]) || plan.highlight ? 'pt-4' : ''
                }`}>
                {user && currentTier === planToTier[plan.name] && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-electric-cyan text-white text-xs font-bold px-4 py-2 rounded-full shadow-clean whitespace-nowrap">
                    YOUR PLAN
                  </div>
                )}
                {plan.highlight && !(user && currentTier === planToTier[plan.name]) && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-electric-indigo text-white text-xs font-bold px-4 py-2 rounded-full shadow-clean whitespace-nowrap">
                    MOST POPULAR
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    plan.highlight ? 'bg-electric-indigo/8' : 'bg-light-200 dark:bg-midnight-700'
                  }`}>
                    <plan.icon className="w-6 h-6 text-electric-indigo" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-text-primary dark:text-white">{plan.name}</h3>
                    <div className="text-sm text-text-secondary">{plan.tagline}</div>
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
                        <span className={`text-xl text-text-muted line-through transition-all duration-500 ease-out inline-block overflow-hidden whitespace-nowrap ${
                          isAnnual ? 'max-w-20 opacity-100' : 'max-w-0 opacity-0'
                        }`}>
                          ${plan.monthlyPrice}
                        </span>
                        {/* Animated counting price via CSS @property */}
                        <span
                          className="price-animated text-4xl font-bold text-text-primary dark:text-white"
                          style={{
                            '--price-dollars': isAnnual ? Math.floor(plan.annualPrice) : Math.floor(plan.monthlyPrice),
                            '--price-cents': Math.round(((isAnnual ? plan.annualPrice : plan.monthlyPrice) % 1) * 100),
                          } as React.CSSProperties}
                        />
                        <span className="text-text-secondary">/mo</span>
                      </div>
                      {/* Animated billing text */}
                      <div className="relative overflow-hidden h-5">
                        <div className={`transition-transform duration-500 ease-out delay-75 ${isAnnual ? '-translate-y-1/2' : 'translate-y-0'}`}>
                          <div className="h-5 text-sm text-text-secondary">
                            Billed monthly
                          </div>
                          <div className="h-5 text-sm text-text-secondary">
                            Billed annually (${(plan.annualPrice * 12).toFixed(2)}/yr)
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <p className="text-text-secondary mb-6 text-[15px] leading-relaxed">
                  {plan.description}
                </p>

                <button
                  onClick={() => handlePlanSelect(plan.name)}
                  disabled={isButtonDisabled(plan.name)}
                  className={`w-full py-3 rounded-lg font-semibold text-base transition-all mb-6 flex items-center justify-center gap-2 ${
                    isButtonDisabled(plan.name) && user && currentTier === planToTier[plan.name]
                      ? 'bg-light-200 dark:bg-midnight-700 text-text-muted cursor-not-allowed'
                      : isButtonDisabled(plan.name)
                      ? 'opacity-50 cursor-wait'
                      : plan.ctaStyle === 'primary'
                      ? 'bg-electric-indigo hover:bg-indigo-600 text-white font-semibold px-6'
                      : plan.ctaStyle === 'outlined'
                      ? 'border-2 border-electric-indigo bg-electric-indigo/10 text-electric-indigo hover:bg-electric-indigo hover:text-white'
                      : 'bg-surface-100 dark:bg-midnight-700 hover:bg-surface-200 dark:hover:bg-midnight-600 text-text-primary'
                  }`}
                >
                  {isCheckingOut === plan.name && <Loader2 className="w-5 h-5 animate-spin" />}
                  {getButtonText(plan.name, plan.cta)}
                </button>

                <ul className="space-y-3 flex-1">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-3 text-[15px]">
                      <Check className={`w-5 h-5 shrink-0 mt-0.5 ${
                        plan.highlight ? 'text-electric-cyan' : 'text-electric-indigo'
                      }`} />
                      <span className="text-text-secondary">{feature}</span>
                    </li>
                  ))}
                  {'lockedFeatures' in plan && plan.lockedFeatures && (plan.lockedFeatures as string[]).map((feature, j) => (
                    <li key={`locked-${j}`} className="flex items-start gap-3 text-sm">
                      <Lock className="w-5 h-5 shrink-0 mt-0.5 text-electric-indigo/60" />
                      <span className="text-text-muted">{feature}</span>
                    </li>
                  ))}
                </ul>
                </div>
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
                <h3 className="text-2xl font-bold text-text-primary dark:text-white mb-2">
                  Feature Comparison
                </h3>
                <p className="text-text-secondary">
                  See exactly what you get with each plan
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]" role="table" aria-label="Feature comparison by plan">
                  <thead>
                    <tr className="border-b border-light-300 dark:border-midnight-700">
                      <th scope="col" className="text-left py-4 px-4 text-text-secondary font-medium">Feature</th>
                      <th scope="col" className="py-4 px-4 text-center">
                        <div className="text-text-primary dark:text-white font-bold">Free</div>
                        <div className="text-xs text-text-muted">$0/mo</div>
                      </th>
                      <th className="py-4 px-4 text-center">
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
                    {/* Chat Support */}
                    <tr className="border-b border-light-200 dark:border-midnight-800">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-electric-indigo/8 flex items-center justify-center">
                            <MessageSquare className="w-4 h-4 text-electric-indigo" />
                          </div>
                          <div>
                            <div className="font-medium text-text-primary dark:text-white">Chat Support</div>
                            <div className="text-xs text-text-muted">Text-based troubleshooting</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-sm text-text-secondary">5/month</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-sm font-semibold text-electric-cyan">Unlimited</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-sm font-semibold text-electric-cyan">Unlimited</span>
                      </td>
                    </tr>
                    {/* Photo Analysis */}
                    <tr className="border-b border-light-200 dark:border-midnight-800">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-electric-indigo/8 flex items-center justify-center">
                            <Camera className="w-4 h-4 text-electric-indigo" />
                          </div>
                          <div>
                            <div className="font-medium text-text-primary dark:text-white">Photo Analysis</div>
                            <div className="text-xs text-text-muted">Send photos for diagnosis</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-sm text-text-secondary">1/month</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-sm font-semibold text-electric-cyan">Unlimited</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-sm font-semibold text-electric-cyan">Unlimited</span>
                      </td>
                    </tr>
                    {/* Voice Support */}
                    <tr className="border-b border-light-200 dark:border-midnight-800">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-electric-indigo/8 flex items-center justify-center">
                            <Mic className="w-4 h-4 text-electric-indigo" />
                          </div>
                          <div>
                            <div className="font-medium text-text-primary dark:text-white">Voice Support</div>
                            <div className="text-xs text-text-muted">Talk through issues hands-free</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Lock className="w-4 h-4 text-text-muted mx-auto" />
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-sm font-semibold text-electric-cyan">Unlimited</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-sm font-semibold text-electric-cyan">Unlimited</span>
                      </td>
                    </tr>
                    {/* Video Diagnostic */}
                    <tr className="border-b border-light-200 dark:border-midnight-800">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-electric-indigo/8 flex items-center justify-center">
                            <Video className="w-4 h-4 text-electric-indigo" />
                          </div>
                          <div>
                            <div className="font-medium text-text-primary dark:text-white">Video Diagnostic</div>
                            <div className="text-xs text-text-muted">Live camera diagnosis</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Lock className="w-4 h-4 text-text-muted mx-auto" />
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-sm font-semibold text-electric-indigo">1/week</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-sm font-semibold text-electric-indigo">15/month</span>
                      </td>
                    </tr>
                    {/* Case History */}
                    <tr className="border-b border-light-200 dark:border-midnight-800">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-electric-indigo/8 flex items-center justify-center">
                            <Clock className="w-4 h-4 text-electric-indigo" />
                          </div>
                          <div>
                            <div className="font-medium text-text-primary dark:text-white">Case History</div>
                            <div className="text-xs text-text-muted">Saved conversations</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-sm text-text-secondary">Last 5</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-sm font-semibold text-electric-cyan">Full history</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-sm font-semibold text-electric-cyan">Full history</span>
                      </td>
                    </tr>
                    {/* Assist Pills */}
                    <tr className="border-b border-light-200 dark:border-midnight-800">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-electric-indigo/8 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-electric-indigo" />
                          </div>
                          <div>
                            <div className="font-medium text-text-primary dark:text-white">Assist Pills</div>
                            <div className="text-xs text-text-muted">Guided step-by-step fixes</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Check className="w-5 h-5 text-electric-cyan mx-auto" />
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Check className="w-5 h-5 text-electric-cyan mx-auto" />
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Check className="w-5 h-5 text-electric-cyan mx-auto" />
                      </td>
                    </tr>
                    {/* PDF Reports */}
                    <tr className="border-b border-light-200 dark:border-midnight-800">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-electric-indigo/8 flex items-center justify-center">
                            <FileText className="w-4 h-4 text-electric-indigo" />
                          </div>
                          <div>
                            <div className="font-medium text-text-primary dark:text-white">PDF Reports</div>
                            <div className="text-xs text-text-muted">Diagnostic case reports</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Check className="w-5 h-5 text-electric-cyan mx-auto" />
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Check className="w-5 h-5 text-electric-cyan mx-auto" />
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Check className="w-5 h-5 text-electric-cyan mx-auto" />
                      </td>
                    </tr>
                    {/* Multi-home */}
                    <tr>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-electric-indigo/8 flex items-center justify-center">
                            <Home className="w-4 h-4 text-electric-indigo" />
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
                      <td className="py-4 px-4 text-center">
                        <span className="text-sm text-text-secondary">1</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-sm font-semibold text-electric-indigo">Up to 5</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </AnimatedElement>

        </div>
      </div>

      {/* Value Proposition */}
      <div className="section-white py-16 border-y border-light-300 dark:border-midnight-700">
        <div className="container mx-auto px-6 max-w-3xl">
          <AnimatedElement animation="scaleIn">
            <div className="card-clean rounded-lg p-10 text-center">
              <h3 className="text-2xl font-bold text-text-primary dark:text-white mb-4">
                Why wait on hold when you don't have to?
              </h3>
              <p className="text-lg text-text-secondary mb-6 leading-relaxed max-w-xl mx-auto">
                Our support team is available <span className="text-electric-indigo font-bold">24/7</span> —
                weekends, holidays, 3am. Describe your issue or snap a photo
                and get expert guidance instantly.
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <span className="px-4 py-2 bg-electric-indigo/8 text-electric-indigo rounded-full font-medium">No appointments</span>
                <span className="px-4 py-2 bg-electric-indigo/8 text-electric-indigo rounded-full font-medium">No waiting</span>
                <span className="px-4 py-2 bg-electric-indigo/8 text-electric-indigo rounded-full font-medium">No runaround</span>
              </div>
            </div>
          </AnimatedElement>
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
                <span className="text-electric-indigo font-semibold text-sm">FAQ</span>
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
                  className={`rounded-lg border transition-all duration-300 overflow-hidden ${
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
                        ? 'bg-electric-indigo/10 text-electric-indigo'
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

      {/* Final CTA */}
      <div className="bg-electric-indigo py-20">
        <div className="container mx-auto px-6 max-w-3xl text-center">
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
