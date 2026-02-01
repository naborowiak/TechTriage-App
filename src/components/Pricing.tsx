import React, { useState } from 'react';
import { Check, ArrowRight, ChevronDown, MessageSquare, Camera, Video, Shield, Clock, Home, Users, Zap, Loader2 } from 'lucide-react';
import { PageView } from '../types';
import { useSubscription, SubscriptionTier } from '../hooks/useSubscription';
import { useAuth } from '../hooks/useAuth';

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
    'Chat': 'free',
    'Home': 'home',
    'Pro': 'pro',
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
  const isButtonDisabled = (planName: string) => {
    const tier = planToTier[planName];
    return (user && currentTier === tier) || isCheckingOut !== null || authLoading || subLoading;
  };

  const plans = [
    {
      name: 'Chat',
      tagline: 'Get Started Free',
      monthlyPrice: 0,
      annualPrice: 0,
      isFree: true,
      description: 'AI-powered answers for quick tech questions. Perfect for getting started.',
      icon: MessageSquare,
      features: [
        '5 AI chat sessions per month',
        'Access to knowledge base',
        'Basic troubleshooting guides',
        'Email support',
      ],
      limitations: [
        'No photo diagnosis',
        'No live video support',
      ],
      cta: 'Sign Up Free',
      ctaStyle: 'outlined',
    },
    {
      name: 'Home',
      tagline: 'Most Popular',
      monthlyPrice: 25,
      annualPrice: 19,
      description: 'Complete coverage for your home. Chat, snap a photo, or go live with an expert.',
      icon: Home,
      features: [
        'Unlimited TechTriage Chat',
        'TechTriage Snap photo diagnosis',
        '2 TechTriage Live video sessions/mo',
        'Priority support queue',
        '15% off onsite service visits',
        'Appliance & device tracking',
      ],
      cta: 'Get Started',
      ctaStyle: 'primary',
      highlight: true,
    },
    {
      name: 'Pro',
      tagline: 'For Families & Landlords',
      monthlyPrice: 59,
      annualPrice: 49,
      description: 'Unlimited everything. Ideal for families, landlords, and Airbnb hosts.',
      icon: Users,
      features: [
        'Everything in Home, plus:',
        'Unlimited TechTriage Live video',
        'Fastest priority response',
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
      name: 'TechTriage Chat',
      icon: MessageSquare,
      description: 'AI-powered text support for instant answers to your tech questions.',
      color: '#1F2937',
    },
    {
      name: 'TechTriage Snap',
      icon: Camera,
      description: 'Upload a photo and get an AI diagnosis of what\'s wrong—no waiting.',
      color: '#F97316',
    },
    {
      name: 'TechTriage Live',
      icon: Video,
      description: 'Real-time video with AI assistance and human specialists when you need them.',
      color: '#EA580C',
    },
  ];

  const faqs = [
    {
      q: 'What is TechTriage Snap?',
      a: 'TechTriage Snap is our photo diagnosis feature. Upload a photo of an error message, blinking light, or device issue, and our AI analyzes it instantly to provide troubleshooting guidance.',
    },
    {
      q: 'How does TechTriage Live work?',
      a: 'TechTriage Live connects you with a real-time video session. Our AI assists immediately, and a human specialist can join when needed to guide you through more complex issues step-by-step.',
    },
    {
      q: 'What is your cancellation policy?',
      a: 'You can cancel your membership at any time from your account settings. There are no cancellation fees or long-term contracts. Cancellations take effect at the end of your current billing period.',
    },
    {
      q: 'What does the Pro plan\'s multi-home support include?',
      a: 'Pro members can manage up to 5 different properties under one account—ideal for landlords, vacation rental hosts, or families with multiple homes. Each property maintains its own device inventory and service history.',
    },
    {
      q: 'What types of issues do you support?',
      a: 'We specialize in consumer technology: Wi-Fi and networking, computers and laptops, smart home devices (Alexa, Google Home, Ring, Nest), TVs and streaming, printers, smart thermostats, and general tech troubleshooting.',
    },
    {
      q: 'Do you offer a mobile app?',
      a: 'TechTriage currently works directly in your web browser with no download required. Our mobile app is coming soon for an even more convenient experience—stay tuned for updates.',
    },
  ];

  return (
    <section className="min-h-screen pt-[72px]">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-[#1F2937] to-[#374151] py-20 text-center">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full text-white/80 text-sm mb-6">
            <Shield className="w-4 h-4 text-[#F97316]" />
            Trusted by 10,000+ homeowners
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-white mb-6 leading-tight">
            Expert Tech Support,<br />
            <span className="text-[#F97316]">Without the House Call</span>
          </h1>
          <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">
            Get instant help with Wi-Fi, smart home, appliances, and more.
            AI-powered diagnostics plus real human experts when you need them.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-white/60 text-sm">
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#F97316]" />
              Average response: 30 seconds
            </span>
            <span className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#F97316]" />
              90% of issues solved remotely
            </span>
            <span className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#F97316]" />
              Cancel anytime
            </span>
          </div>
        </div>
      </div>

      {/* Products Overview */}
      <div className="bg-white py-16 border-b border-gray-100">
        <div className="container mx-auto px-6 max-w-5xl">
          <h2 className="text-2xl font-bold text-[#1F2937] text-center mb-4">
            Three Ways to Get Help
          </h2>
          <p className="text-[#374151] text-center mb-12 max-w-2xl mx-auto">
            Choose how you want to connect based on your issue
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {products.map((product, i) => (
              <div key={i} className="text-center">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: `${product.color}15` }}
                >
                  <product.icon className="w-8 h-8" style={{ color: product.color }} />
                </div>
                <h3 className="text-lg font-bold text-[#1F2937] mb-2">{product.name}</h3>
                <p className="text-[#374151] text-sm">{product.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="bg-[#F9FAFB] py-20">
        <div className="container mx-auto px-6 max-w-6xl">
          <h2 className="text-3xl font-black text-[#1F2937] text-center mb-4">
            Simple, Honest Pricing
          </h2>
          <p className="text-[#374151] text-center mb-8 max-w-xl mx-auto">
            No hidden fees. No long contracts. Just peace of mind for your home.
          </p>

          {/* Billing Toggle - Jobber Style */}
          <div className="flex justify-center items-center gap-4 mb-12">
            <span
              className={`font-semibold cursor-pointer transition-colors ${!isAnnual ? 'text-[#1F2937]' : 'text-gray-400'}`}
              onClick={() => setIsAnnual(false)}
            >
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`w-14 h-8 rounded-full p-1 transition-colors ${isAnnual ? 'bg-[#F97316]' : 'bg-gray-300'}`}
              aria-label="Toggle annual billing"
            >
              <div className={`w-6 h-6 bg-white rounded-full shadow transition-transform ${isAnnual ? 'translate-x-6' : ''}`} />
            </button>
            <span
              className={`font-semibold cursor-pointer transition-colors ${isAnnual ? 'text-[#1F2937]' : 'text-gray-400'}`}
              onClick={() => setIsAnnual(true)}
            >
              Annual
              <span className={`ml-2 text-xs font-bold px-2 py-1 rounded-full transition-all ${
                isAnnual
                  ? 'text-white bg-[#F97316]'
                  : 'text-gray-400 bg-gray-200'
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
                className={`bg-white rounded-3xl p-8 relative transition-all ${
                  user && currentTier === planToTier[plan.name]
                    ? 'ring-2 ring-green-500 shadow-2xl scale-[1.02] md:scale-105'
                    : plan.highlight
                    ? 'ring-2 ring-[#F97316] shadow-2xl scale-[1.02] md:scale-105'
                    : 'shadow-lg hover:shadow-xl'
                }`}
              >
                {user && currentTier === planToTier[plan.name] && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg">
                    YOUR PLAN
                  </div>
                )}
                {plan.highlight && !(user && currentTier === planToTier[plan.name]) && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#F97316] text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg">
                    MOST POPULAR
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    plan.highlight ? 'bg-[#F97316]/10' : 'bg-[#1F2937]/5'
                  }`}>
                    <plan.icon className={`w-6 h-6 ${plan.highlight ? 'text-[#F97316]' : 'text-[#1F2937]'}`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-[#1F2937]">{plan.name}</h3>
                    <div className="text-sm text-[#374151]">{plan.tagline}</div>
                  </div>
                </div>

                <div className="mb-4">
                  {plan.isFree ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-[#1F2937]">Free</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-2">
                        {isAnnual && (
                          <span className="text-xl text-gray-400 line-through">
                            ${plan.monthlyPrice}
                          </span>
                        )}
                        <span className="text-4xl font-black text-[#1F2937]">
                          ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                        </span>
                        <span className="text-[#374151]">/mo</span>
                      </div>
                      <div className="text-sm text-[#374151]">
                        {isAnnual
                          ? `Billed annually ($${plan.annualPrice * 12}/yr)`
                          : 'Billed monthly'
                        }
                      </div>
                    </>
                  )}
                </div>

                <p className="text-[#374151] mb-6 text-sm leading-relaxed">
                  {plan.description}
                </p>

                <button
                  onClick={() => handlePlanSelect(plan.name)}
                  disabled={isButtonDisabled(plan.name)}
                  className={`w-full py-4 rounded-full font-bold text-base transition-all mb-6 flex items-center justify-center gap-2 ${
                    isButtonDisabled(plan.name) && user && currentTier === planToTier[plan.name]
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : isButtonDisabled(plan.name)
                      ? 'opacity-50 cursor-wait'
                      : plan.ctaStyle === 'primary'
                      ? 'bg-[#F97316] hover:bg-[#EA580C] text-white shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30'
                      : plan.ctaStyle === 'outlined'
                      ? 'border-2 border-[#1F2937] text-[#1F2937] hover:bg-[#1F2937] hover:text-white'
                      : 'bg-[#1F2937] hover:bg-[#374151] text-white'
                  }`}
                >
                  {isCheckingOut === plan.name && <Loader2 className="w-5 h-5 animate-spin" />}
                  {getButtonText(plan.name, plan.cta)}
                </button>

                <ul className="space-y-3">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-3 text-sm">
                      <Check className={`w-5 h-5 shrink-0 mt-0.5 ${
                        plan.highlight ? 'text-[#F97316]' : 'text-green-500'
                      }`} />
                      <span className="text-[#374151]">{feature}</span>
                    </li>
                  ))}
                  {plan.limitations?.map((limitation, j) => (
                    <li key={`limit-${j}`} className="flex items-start gap-3 text-sm text-gray-400">
                      <span className="w-5 h-5 shrink-0 mt-0.5 text-center">—</span>
                      <span>{limitation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-8 mt-12 text-sm text-[#374151]">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#F97316]" />
              No credit card for free plan
            </span>
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#F97316]" />
              Cancel anytime
            </span>
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#F97316]" />
              30-day money-back guarantee
            </span>
          </div>
        </div>
      </div>

      {/* Testimonial */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-6 max-w-3xl">
          <div className="bg-gradient-to-br from-[#1F2937] to-[#374151] rounded-3xl p-10 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#F97316]/10 rounded-full blur-3xl" />
            <div className="relative">
              <div className="text-6xl text-[#F97316]/30 font-serif mb-4">"</div>
              <p className="text-xl text-white font-medium mb-6 leading-relaxed">
                My router went down at 10pm on a Sunday. TechTriage had me back online in
                <span className="text-[#F97316]"> 8 minutes</span>. No waiting until Monday,
                no $150 service call. This is what tech support should be.
              </p>
              <div className="flex items-center justify-center gap-4">
                <div className="w-12 h-12 bg-[#F97316] rounded-full flex items-center justify-center text-white font-bold">
                  SM
                </div>
                <div className="text-left">
                  <div className="font-bold text-white">Sarah M.</div>
                  <div className="text-white/60 text-sm">Home Plan Member, Austin TX</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-[#F9FAFB] py-16">
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="text-3xl font-black text-[#1F2937] text-center mb-4">
            Questions? We've Got Answers
          </h2>
          <p className="text-[#374151] text-center mb-12">
            Everything you need to know about TechTriage membership
          </p>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-bold text-[#1F2937] pr-4">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-[#374151] shrink-0 transition-transform ${
                    openFaq === i ? 'rotate-180' : ''
                  }`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-[#374151] leading-relaxed border-t border-gray-100 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-[#1F2937] py-20">
        <div className="container mx-auto px-6 max-w-3xl text-center">
          <h2 className="text-3xl font-black text-white mb-4">
            Ready for Stress-Free Tech Support?
          </h2>
          <p className="text-white/70 mb-8 max-w-xl mx-auto">
            Join thousands of homeowners who've ditched the hold music and expensive service calls. It's free to get started.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => onNavigate(PageView.SIGNUP)}
              className="bg-[#F97316] hover:bg-[#EA580C] text-white font-bold px-10 py-4 rounded-full transition-all shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 flex items-center justify-center gap-2"
            >
              Get Started Free <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="border-2 border-white/30 text-white font-bold px-10 py-4 rounded-full hover:bg-white/10 transition-colors"
            >
              Compare Plans
            </button>
          </div>
          <p className="text-white/50 text-sm mt-6">
            Powered by Smart Tek Labs
          </p>
        </div>
      </div>
    </section>
  );
};
