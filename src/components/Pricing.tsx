import React, { useState } from 'react';
import { Check, ArrowRight, ArrowLeft, ChevronDown, MessageSquare, Camera, Video, Shield, Clock, Home, Users, Zap, Loader2, Radar, Lock } from 'lucide-react';
import { PageView } from '../types';
import { useSubscription, SubscriptionTier } from '../hooks/useSubscription';
import { useAuth } from '../hooks/useAuth';
import { ScoutSignalIcon } from './Logo';

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
    'Scout Free': 'free',
    'Scout Home': 'home',
    'Scout Pro': 'pro',
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
      name: 'Scout Free',
      tagline: 'The Taste Test',
      monthlyPrice: 0,
      annualPrice: 0,
      isFree: true,
      description: 'Try Scout AI and see how easy tech support can be. No credit card required.',
      icon: MessageSquare,
      features: [
        '5 Scout Chat messages per month',
        '1 Scout Snapshot photo analysis',
        'Access to knowledge base',
        'Basic troubleshooting guides',
      ],
      lockedFeatures: [
        'Scout Signal (Voice) — Upgrade to unlock',
        'Video Diagnostic — Upgrade to unlock',
      ],
      cta: 'Sign Up Free',
      ctaStyle: 'outlined',
    },
    {
      name: 'Scout Home',
      tagline: 'The Daily Driver',
      monthlyPrice: 9.99,
      annualPrice: 7.99,
      description: 'Complete coverage for your home. Chat, snap, talk, or go live with Scout AI.',
      icon: Home,
      features: [
        'Unlimited Scout Chat',
        'Unlimited Scout Snapshot',
        'Scout Signal (Voice Mode)',
        '1 Video Diagnostic per week',
        'Priority support queue',
        '15% off onsite service visits',
      ],
      cta: 'Get Started',
      ctaStyle: 'primary',
      highlight: true,
    },
    {
      name: 'Scout Pro',
      tagline: 'The Power User',
      monthlyPrice: 19.99,
      annualPrice: 15.99,
      description: 'Maximum coverage with premium AI. Ideal for families, landlords, and Airbnb hosts.',
      icon: Users,
      features: [
        'Everything in Home, plus:',
        '15 Video Diagnostics per month',
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
      name: 'Scout Signal',
      icon: Radar,
      description: 'Voice-powered support—just talk to Scout like you would a real technician.',
      availability: 'Home & Pro',
    },
    {
      name: 'Video Diagnostic',
      icon: Video,
      description: 'Upload a video and receive a detailed AI-powered diagnostic report with action steps.',
      availability: 'Home & Pro',
    },
  ];

  const faqs = [
    {
      q: 'What is Scout Snapshot?',
      a: 'Scout Snapshot is our photo diagnosis feature. Upload a photo of an error message, blinking light, or device issue, and Scout analyzes it instantly to provide troubleshooting guidance.',
    },
    {
      q: 'How does Video Diagnostic work?',
      a: 'Upload or record a video of your tech issue. Scout AI analyzes the footage and generates a comprehensive diagnostic report with observations, root cause assessment, step-by-step instructions, and parts list if needed.',
    },
    {
      q: 'How do Video Diagnostic credits work?',
      a: 'Scout Home members receive 1 Video Diagnostic credit per week (resets every 7 days). Scout Pro members receive 15 credits per month. Need more? You can purchase additional credits anytime—$5 for 1 credit or $12 for a 3-pack.',
    },
    {
      q: 'What is your cancellation policy?',
      a: 'You can cancel your membership at any time from your account settings. There are no cancellation fees or long-term contracts. Cancellations take effect at the end of your current billing period.',
    },
    {
      q: 'What\'s the difference between Home and Pro?',
      a: 'Both plans include unlimited Chat, Snapshot, and Signal (voice). The key differences: Home gets 1 Video Diagnostic per week with standard AI, while Pro gets 15 per month with our premium AI model for all features. Pro also includes multi-home support and family accounts.',
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
    <section className="min-h-screen pt-[72px] bg-midnight-950">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-midnight-900 to-midnight-950 py-20 text-center relative overflow-hidden">
        {/* Background orbs */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-electric-indigo/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-scout-purple/10 rounded-full blur-3xl"></div>

        <div className="container mx-auto px-6 max-w-4xl relative z-10">
          {/* Back to Dashboard link for logged-in users */}
          {user && (
            <button
              onClick={() => onNavigate(PageView.DASHBOARD)}
              className="inline-flex items-center gap-2 text-text-secondary hover:text-white text-sm font-medium mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
          )}
          <div className="inline-flex items-center gap-2 bg-electric-indigo/20 backdrop-blur px-4 py-2 rounded-full text-white/80 text-sm mb-6 border border-electric-indigo/30">
            <ScoutSignalIcon size={18} animate={true} />
            <span className="font-semibold">Scout AI available 24/7</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-white mb-6 leading-tight">
            Fix Your Tech Issues<br />
            <span className="text-gradient-electric">In Minutes, Not Hours</span>
          </h1>
          <p className="text-text-secondary text-lg mb-8 max-w-2xl mx-auto">
            Wi-Fi down? Smart TV acting up? Describe your problem, snap a photo, or start a video walkthrough—TotalAssist guides you to a fix instantly.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-text-secondary text-sm">
            <span className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-electric-cyan" />
              AI-powered diagnostics
            </span>
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-electric-cyan" />
              No appointments needed
            </span>
            <span className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-electric-cyan" />
              Cancel anytime
            </span>
          </div>
        </div>
      </div>

      {/* Products Overview */}
      <div className="bg-midnight-900 py-16 border-y border-midnight-700">
        <div className="container mx-auto px-6 max-w-6xl">
          <h2 className="text-2xl font-bold text-white text-center mb-4">
            Four Ways to Get Help
          </h2>
          <p className="text-text-secondary text-center mb-12 max-w-2xl mx-auto">
            Choose how you want to connect based on your issue
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {products.map((product, i) => (
              <div key={i} className="text-center group">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-gradient-to-br from-electric-indigo to-scout-purple border border-electric-indigo/30 group-hover:border-electric-cyan/50 transition-colors shadow-lg shadow-electric-indigo/20">
                  <product.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">{product.name}</h3>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full mb-2 inline-block ${
                  product.availability === 'All Plans'
                    ? 'bg-electric-cyan/20 text-electric-cyan'
                    : 'bg-scout-purple/20 text-scout-glow'
                }`}>
                  {product.availability}
                </span>
                <p className="text-text-secondary text-xs leading-relaxed">{product.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="bg-midnight-950 py-20 noise-texture">
        <div className="container mx-auto px-6 max-w-6xl">
          <h2 className="text-3xl font-black text-white text-center mb-4">
            Simple, Honest Pricing
          </h2>
          <p className="text-text-secondary text-center mb-8 max-w-xl mx-auto">
            No hidden fees. No long contracts. Just peace of mind for your home.
          </p>

          {/* Billing Toggle */}
          <div className="flex justify-center items-center gap-4 mb-12">
            <span
              className={`font-semibold cursor-pointer transition-colors ${!isAnnual ? 'text-white' : 'text-text-muted'}`}
              onClick={() => setIsAnnual(false)}
            >
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`w-14 h-8 rounded-full p-1 transition-colors ${isAnnual ? 'bg-gradient-to-r from-electric-indigo to-electric-cyan' : 'bg-midnight-700'}`}
              aria-label="Toggle annual billing"
            >
              <div className={`w-6 h-6 bg-white rounded-full shadow transition-transform ${isAnnual ? 'translate-x-6' : ''}`} />
            </button>
            <span
              className={`font-semibold cursor-pointer transition-colors ${isAnnual ? 'text-white' : 'text-text-muted'}`}
              onClick={() => setIsAnnual(true)}
            >
              Annual
              <span className={`ml-2 text-xs font-bold px-2 py-1 rounded-full transition-all ${
                isAnnual
                  ? 'text-white bg-gradient-to-r from-electric-indigo to-electric-cyan'
                  : 'text-text-muted bg-midnight-700'
              }`}>
                Save up to 25%
              </span>
            </span>
          </div>

          {/* Pricing Grid */}
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {plans.map((plan, i) => (
              <div
                key={i}
                className={`bg-midnight-800 rounded-3xl p-8 relative transition-all border ${
                  user && currentTier === planToTier[plan.name]
                    ? 'border-electric-cyan shadow-glow-cyan scale-[1.02] md:scale-105'
                    : plan.highlight
                    ? 'border-electric-indigo shadow-glow-electric scale-[1.02] md:scale-105'
                    : 'border-midnight-700 hover:border-midnight-600'
                }`}
              >
                {user && currentTier === planToTier[plan.name] && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-electric-cyan text-midnight-950 text-xs font-bold px-4 py-2 rounded-full shadow-lg">
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
                    plan.highlight ? 'bg-gradient-to-br from-scout-purple to-electric-indigo' : 'bg-midnight-700'
                  }`}>
                    <plan.icon className={`w-6 h-6 ${plan.highlight ? 'text-white' : 'text-electric-indigo'}`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">{plan.name}</h3>
                    <div className="text-sm text-text-secondary">{plan.tagline}</div>
                  </div>
                </div>

                <div className="mb-4">
                  {plan.isFree ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-white">Free</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-2">
                        {isAnnual && (
                          <span className="text-xl text-text-muted line-through">
                            ${plan.monthlyPrice}
                          </span>
                        )}
                        <span className="text-4xl font-black text-white">
                          ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                        </span>
                        <span className="text-text-secondary">/mo</span>
                      </div>
                      <div className="text-sm text-text-secondary">
                        {isAnnual
                          ? `Billed annually ($${plan.annualPrice * 12}/yr)`
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
                      ? 'bg-midnight-700 text-text-muted cursor-not-allowed'
                      : isButtonDisabled(plan.name)
                      ? 'opacity-50 cursor-wait'
                      : plan.ctaStyle === 'primary'
                      ? 'btn-gradient-electric text-white shadow-lg shadow-electric-indigo/25 hover:shadow-xl hover:shadow-electric-indigo/30'
                      : plan.ctaStyle === 'outlined'
                      ? 'border-2 border-electric-cyan bg-electric-cyan/10 text-white hover:bg-electric-cyan hover:text-midnight-950'
                      : 'bg-midnight-700 hover:bg-midnight-600 text-white border border-midnight-600'
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
                      <Lock className="w-5 h-5 shrink-0 mt-0.5 text-text-muted" />
                      <span className="text-text-muted">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-8 mt-12 text-sm text-text-secondary">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-electric-cyan" />
              No credit card for free plan
            </span>
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-electric-cyan" />
              Cancel anytime
            </span>
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-electric-cyan" />
              30-day money-back guarantee
            </span>
          </div>
        </div>
      </div>

      {/* Testimonial */}
      <div className="bg-midnight-900 py-16 border-y border-midnight-700">
        <div className="container mx-auto px-6 max-w-3xl">
          <div className="bg-gradient-to-br from-midnight-800 to-midnight-900 rounded-3xl p-10 text-center relative overflow-hidden border border-midnight-700">
            <div className="absolute top-0 right-0 w-32 h-32 bg-scout-purple/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-electric-indigo/10 rounded-full blur-3xl" />
            <div className="relative">
              <div className="text-6xl text-electric-indigo/30 font-serif mb-4">"</div>
              <p className="text-xl text-white font-medium mb-6 leading-relaxed">
                My router went down at 10pm on a Sunday. TotalAssist had me back online in
                <span className="text-gradient-electric"> 8 minutes</span>. No waiting until Monday,
                no $150 service call. This is what tech support should be.
              </p>
              <div className="flex items-center justify-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-scout-purple to-electric-indigo rounded-full flex items-center justify-center text-white font-bold">
                  SM
                </div>
                <div className="text-left">
                  <div className="font-bold text-white">Sarah M.</div>
                  <div className="text-text-secondary text-sm">Home Plan Member, Austin TX</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-midnight-950 py-16 noise-texture noise-texture-subtle">
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="text-3xl font-black text-white text-center mb-4">
            Questions? We've Got Answers
          </h2>
          <p className="text-text-secondary text-center mb-12">
            Everything you need to know about TotalAssist membership
          </p>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="bg-midnight-800 rounded-2xl overflow-hidden border border-midnight-700"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-midnight-700/50 transition-colors"
                >
                  <span className="font-bold text-white pr-4">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-text-secondary shrink-0 transition-transform ${
                    openFaq === i ? 'rotate-180' : ''
                  }`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-text-secondary leading-relaxed border-t border-midnight-700 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-gradient-to-br from-scout-purple to-electric-indigo py-20 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-20 z-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-electric-cyan rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-scout-glow rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
        </div>
        <div className="container mx-auto px-6 max-w-3xl text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Ready for Stress-Free Tech Support?
          </h2>
          <p className="text-white/90 mb-8 max-w-xl mx-auto">
            Join thousands of homeowners who've ditched the hold music and expensive service calls. It's free to get started.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => onNavigate(PageView.SIGNUP)}
              className="bg-midnight-950 hover:bg-midnight-900 text-white font-bold px-10 py-4 rounded-full transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-2"
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
        </div>
      </div>
    </section>
  );
};
