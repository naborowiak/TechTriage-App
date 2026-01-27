import React, { useState } from 'react';
import { Check, ArrowRight, ChevronDown } from 'lucide-react';
import { PageView } from '../types';

interface PricingProps {
  onStart: () => void;
  onNavigate: (view: PageView) => void;
}

export const Pricing: React.FC<PricingProps> = ({ onStart, onNavigate }) => {
  const [isAnnual, setIsAnnual] = useState(true);

  const plans = [
    {
      name: 'Grow',
      tagline: 'For individuals',
      monthlyPrice: 49,
      annualPrice: 39,
      description: 'Take first steps to get started with TechTriage for your home.',
      features: [
        'AI-powered diagnostics',
        'Unlimited chat support',
        'Photo analysis',
        'Basic maintenance reminders',
        'Email support'
      ],
      cta: 'Start Free Trial'
    },
    {
      name: 'Connect',
      tagline: 'Most Popular',
      monthlyPrice: 99,
      annualPrice: 75,
      description: 'Automate more of your home care and keep customers coming back.',
      features: [
        'Everything in Grow, plus:',
        'Live video support',
        'Priority response times',
        'Warranty tracking',
        'Appliance health reports',
        'Phone support'
      ],
      cta: 'Start Free Trial',
      highlight: true
    },
    {
      name: 'Core',
      tagline: 'Best Value',
      monthlyPrice: 149,
      annualPrice: 119,
      description: 'Organize your home to grow your expertise.',
      features: [
        'Everything in Connect, plus:',
        'Unlimited video sessions',
        'Predictive maintenance AI',
        'Multi-property support',
        'Custom integrations',
        'Dedicated account manager'
      ],
      cta: 'Start Free Trial'
    }
  ];

  const faqs = [
    { q: 'What are the savings on annual promotions?', a: 'Annual billing saves you up to 25% compared to monthly billing.' },
    { q: 'Are there any commitments or contracts?', a: 'No long-term contracts. Cancel anytime with no penalties.' },
    { q: 'How does the free trial work?', a: 'Get full access to all features for 14 days. No credit card required to start.' },
    { q: 'How do I know which plan is best for my business?', a: 'Start with Grow for basic needs, upgrade to Connect for video support, or Core for multi-property management.' },
    { q: 'Can I change plans?', a: 'Yes, upgrade or downgrade your plan at any time from your account settings.' }
  ];

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <section className="min-h-screen pt-20">
      <div className="bg-[#1F2937] py-16 text-center">
        <h1 className="text-4xl lg:text-5xl font-black text-white mb-4">
          Try TechTriage <span className="text-[#F97316]">for free</span> now. Pick a plan later.
        </h1>
        <p className="text-white/70 text-lg mb-8">
          Put TechTriage to work for you. No credit card required.
        </p>
        <div className="flex items-center justify-center gap-4 mb-8">
          <input
            type="email"
            placeholder="Email address"
            className="px-6 py-3 rounded-l-full w-72 text-[#1F2937] focus:outline-none"
          />
          <button 
            onClick={() => onNavigate(PageView.SIGNUP)}
            className="bg-[#F97316] hover:bg-[#EA580C] text-white font-bold px-8 py-3 rounded-r-full transition-colors flex items-center gap-2"
          >
            Try For 14 Days - It's Free!
          </button>
        </div>

        <div className="flex justify-center gap-4 mt-8">
          <button className="px-6 py-2 rounded-full bg-white/10 text-white font-medium">
            For Individuals
          </button>
          <button className="px-6 py-2 rounded-full text-white/60 font-medium hover:bg-white/5 transition-colors">
            For Teams
          </button>
        </div>
      </div>

      <div className="bg-[#F9FAFB] py-16">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="flex justify-center items-center gap-4 mb-12">
            <span className={`font-bold ${!isAnnual ? 'text-[#1F2937]' : 'text-gray-400'}`}>Monthly</span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`w-14 h-8 rounded-full p-1 transition-colors ${isAnnual ? 'bg-[#1F2937]' : 'bg-gray-300'}`}
            >
              <div className={`w-6 h-6 bg-white rounded-full transition-transform ${isAnnual ? 'translate-x-6' : ''}`}></div>
            </button>
            <span className={`font-bold ${isAnnual ? 'text-[#1F2937]' : 'text-gray-400'}`}>
              Annual <span className="text-[#F97316] text-sm ml-1">Save up to 25%</span>
            </span>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-[#1F2937]">Need help finding the right plan?</h3>
              <p className="text-gray-600">Take this quick quiz to find the perfect fit.</p>
            </div>
            <button className="mx-auto flex items-center gap-2 text-[#1F2937] font-bold border-2 border-[#1F2937] px-6 py-3 rounded-full hover:bg-[#1F2937] hover:text-white transition-colors">
              Find your plan <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan, i) => (
              <div 
                key={i} 
                className={`bg-white rounded-2xl p-8 ${plan.highlight ? 'ring-2 ring-[#1F2937] shadow-2xl relative' : 'shadow-lg'}`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#1F2937] text-white text-xs font-bold px-4 py-1 rounded-full">
                    MOST POPULAR
                  </div>
                )}
                <div className="text-sm font-bold text-gray-500 uppercase mb-2">{plan.tagline}</div>
                <h3 className="text-2xl font-black text-[#1F2937] mb-4">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-black text-[#1F2937]">
                    ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                  </span>
                  <span className="text-gray-500">/mo</span>
                  {isAnnual && (
                    <div className="text-sm text-gray-400">Billed annually</div>
                  )}
                </div>
                <p className="text-gray-600 mb-6">{plan.description}</p>
                <button
                  onClick={() => onNavigate(PageView.SIGNUP)}
                  className={`w-full py-3 rounded-full font-bold text-lg transition-colors mb-6 ${
                    plan.highlight 
                      ? 'bg-[#F97316] hover:bg-[#EA580C] text-white' 
                      : 'bg-[#1F2937] hover:bg-[#374151] text-white'
                  }`}
                >
                  {plan.cta}
                </button>
                <div className="text-sm font-bold text-[#1F2937] mb-4">All {plan.name} features:</div>
                <ul className="space-y-3">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-2 text-gray-600">
                      <Check className="w-5 h-5 text-[#F97316] shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <button className="text-[#1F2937] font-bold flex items-center gap-2 mx-auto hover:text-[#F97316] transition-colors">
              Compare all TechTriage features <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white py-16">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="bg-[#F9FAFB] rounded-2xl p-8 mb-16 border-l-4 border-[#F97316]">
            <p className="text-xl font-bold text-[#1F2937] mb-4">
              "I have time for my family again"
            </p>
            <p className="text-gray-600 mb-6">
              Before TechTriage, I was doing all these admin-focused tasks after hours when I could have been spending time with my family.
            </p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
              <div>
                <div className="font-bold text-[#1F2937]">Oliver Dingmann</div>
                <div className="text-gray-500 text-sm">Dingmann Landscaping</div>
              </div>
            </div>
          </div>

          <h2 className="text-3xl font-black text-[#1F2937] text-center mb-12">FAQ</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="border-b border-gray-200">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full py-4 flex items-center justify-between text-left"
                >
                  <span className="font-bold text-[#1F2937]">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="pb-4 text-gray-600">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#1F2937] py-16">
        <div className="container mx-auto px-6 max-w-4xl">
          <h2 className="text-3xl font-black text-white text-center mb-8">
            Start using TechTriage free
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-xl mx-auto">
            <input
              type="email"
              placeholder="Email Address"
              className="flex-1 w-full sm:w-auto px-6 py-4 rounded-l-full rounded-r-full sm:rounded-r-none text-[#1F2937] focus:outline-none"
            />
            <button 
              onClick={() => onNavigate(PageView.SIGNUP)}
              className="w-full sm:w-auto bg-[#F97316] hover:bg-[#EA580C] text-white font-bold px-8 py-4 rounded-l-full rounded-r-full sm:rounded-l-none transition-colors"
            >
              Try TechTriage - It's Free!
            </button>
          </div>
          <div className="flex justify-center gap-8 mt-8 text-white/60 text-sm">
            <span className="flex items-center gap-2"><Check className="w-4 h-4 text-[#F97316]" /> Full control</span>
            <span className="flex items-center gap-2"><Check className="w-4 h-4 text-[#F97316]" /> Full support</span>
            <span className="flex items-center gap-2"><Check className="w-4 h-4 text-[#F97316]" /> No credit card required</span>
          </div>
        </div>
      </div>
    </section>
  );
};
