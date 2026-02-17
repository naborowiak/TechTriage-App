import React, { useState } from 'react';
import { Search, MessageSquare, Camera, Video, CreditCard, Shield, HelpCircle, ArrowRight, Mic, Plus, Minus } from 'lucide-react';
import { PageView } from '../types';
import { AnimatedElement } from '../hooks/useAnimations';

interface FAQProps {
  onNavigate: (view: PageView) => void;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  faqs: FAQItem[];
}

export const FAQ: React.FC<FAQProps> = ({ onNavigate }) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  const categories: FAQCategory[] = [
    {
      id: 'getting-started',
      name: 'Getting Started',
      icon: HelpCircle,
      color: '#6366F1',
      faqs: [
        {
          question: 'How do I sign up for TotalAssist?',
          answer: 'Signing up is free and takes less than a minute. Click "Sign Up Free" in the navigation, enter your email, and you\'re ready to go. No credit card required for the free Chat plan.',
        },
        {
          question: 'What devices and browsers are supported?',
          answer: 'TotalAssist works on any modern web browser including Chrome, Safari, Firefox, and Edge. Whether you\'re on a computer, tablet, or phone, you can access our support from any device with an internet connection.',
        },
        {
          question: 'Do I need to download an app?',
          answer: 'No download required! TotalAssist works directly in your web browser — on your phone, tablet, or computer. No app needed.',
        },
        {
          question: 'Is my information secure?',
          answer: 'Absolutely. We use bank-level encryption to protect your data. We never share your personal information with third parties, and you can delete your account and data at any time.',
        },
        {
          question: 'Why not just use ChatGPT or Google Gemini?',
          answer: 'General AI chatbots are great for general questions, but they can\'t see your devices, guide you step-by-step with interactive assist pills, or produce a professional diagnostic report you can hand to a technician. TotalAssist is purpose-built for home tech support — it understands routers, smart home devices, and error codes out of the box, and it remembers your devices and past issues across sessions.',
        },
      ],
    },
    {
      id: 'products',
      name: 'TotalAssist Products',
      icon: MessageSquare,
      color: '#1F2937',
      faqs: [
        {
          question: 'What is Chat Support?',
          answer: 'Chat Support is our text-based troubleshooting service. Describe your tech problem in plain English, and get instant troubleshooting guidance. It\'s available 24/7 and included in all plans.',
        },
        {
          question: 'What is Photo Analysis?',
          answer: 'Photo Analysis lets you upload a photo of an error message, blinking light, or device issue. The image is analyzed instantly and specific troubleshooting steps are provided based on what it sees.',
        },
        {
          question: 'What is Live Video Support?',
          answer: 'Live Video Support lets you connect with a support specialist through real-time video. Click "Show Me on Camera" from your Dashboard, grant camera and microphone access, and get step-by-step guidance while our specialist sees exactly what you see. Available on Home and Pro plans.',
        },
        {
          question: 'What types of tech issues do you support?',
          answer: 'We specialize in consumer technology: Wi-Fi and networking, computers and laptops, smart home devices (Alexa, Google Home, Ring, Nest), TVs and streaming, printers, smart thermostats, and general tech troubleshooting.',
        },
      ],
    },
    {
      id: 'snap',
      name: 'Photo Diagnosis',
      icon: Camera,
      color: '#3B82F6',
      faqs: [
        {
          question: 'How does photo diagnosis work?',
          answer: 'Simply take a photo of the issue—an error message, a blinking router light, a confusing screen—and upload it through Photo Analysis. The image is analyzed and identifies the problem, often providing a solution within seconds.',
        },
        {
          question: 'What kinds of photos should I take?',
          answer: 'The clearer the photo, the better the diagnosis. Good examples include: error messages on screens, indicator lights on devices, model numbers on labels, or anything visual that shows the problem.',
        },
        {
          question: 'Is photo diagnosis accurate?',
          answer: 'Our AI has been trained on millions of tech issues and is highly accurate for common problems. For unusual cases, it will recommend trying voice or video mode for a more hands-on walkthrough.',
        },
      ],
    },
    {
      id: 'scout-signal',
      name: 'Voice Support',
      icon: Mic,
      color: '#06B6D4',
      faqs: [
        {
          question: 'What is Voice Support?',
          answer: 'Voice Support is our voice-powered support feature. Instead of typing, just talk to your agent like you would a real technician. Describe your issue out loud, and your agent listens and responds with spoken guidance. Perfect for hands-free troubleshooting.',
        },
        {
          question: 'How do I use Voice Support?',
          answer: 'Press the microphone button to start speaking. Describe your tech problem naturally — no special commands needed. Your agent will respond with helpful guidance. You can have a back-and-forth conversation just like talking to a real person.',
        },
        {
          question: 'Which plans include Voice Support?',
          answer: 'Voice Support is available on TotalAssist Home ($9.99/mo) and TotalAssist Pro ($19.99/mo) plans. Free users can upgrade anytime to unlock voice support.',
        },
        {
          question: 'Can Voice Support understand accents?',
          answer: 'Yes! Voice Support is built on advanced speech recognition that handles a wide variety of accents and speaking styles. If there is trouble understanding, you can always switch to text chat.',
        },
      ],
    },
    {
      id: 'live-video',
      name: 'Live Video Support',
      icon: Video,
      color: '#8B5CF6',
      faqs: [
        {
          question: 'How does Live Video Support work?',
          answer: 'From your Dashboard, click the "Show Me on Camera" tile. Your browser will ask for camera and microphone permission — tap Allow. You\'ll be connected to a live session where you can point your camera at the device with the issue and get real-time guidance. No downloads required.',
        },
        {
          question: 'What should I show during a live video session?',
          answer: 'Point your camera at the device showing the problem—blinking lights, error screens, unusual behavior. Our team can see what you see and guide you through troubleshooting in real-time.',
        },
        {
          question: 'Do I need to download anything for video sessions?',
          answer: 'No downloads required! Live Video Support works directly in your web browser using your device\'s camera. Just click to start a session.',
        },
        {
          question: 'How long can a live video session last?',
          answer: 'Sessions can last as long as needed to resolve your issue. Most problems are solved within 10-15 minutes with real-time support.',
        },
      ],
    },
    {
      id: 'billing',
      name: 'Plans & Billing',
      icon: CreditCard,
      color: '#10B981',
      faqs: [
        {
          question: 'What\'s included in TotalAssist Free?',
          answer: 'TotalAssist Free includes 5 chat messages and 1 photo analysis per month. It\'s a great way to experience TotalAssist. Voice support and additional features require TotalAssist Home or Pro.',
        },
        {
          question: 'What\'s the difference between Home and Pro plans?',
          answer: 'TotalAssist Home ($9.99/mo) includes unlimited chat, photo analysis, and voice support, plus 1 video diagnostic per week. TotalAssist Pro ($19.99/mo) adds 15 video diagnostics per month, multi-home support (up to 5 properties), family member accounts, professional escalation reports, and priority response times. Ideal for landlords, Airbnb hosts, or families managing multiple homes.',
        },
        {
          question: 'Can I change my plan later?',
          answer: 'Yes! You can upgrade or downgrade your plan at any time from your account settings. Changes take effect at the start of your next billing cycle.',
        },
        {
          question: 'What is your cancellation policy?',
          answer: 'You can cancel your membership at any time from your account settings. There are no cancellation fees or long-term contracts. Cancellations take effect at the end of your current billing period.',
        },
        {
          question: 'Do you offer refunds?',
          answer: 'Yes, we offer a 30-day money-back guarantee on all paid plans. If you\'re not satisfied, contact us within 30 days for a full refund.',
        },
      ],
    },
    {
      id: 'support',
      name: 'Getting Help',
      icon: Shield,
      color: '#EF4444',
      faqs: [
        {
          question: 'What if I need onsite help?',
          answer: 'If your issue can\'t be resolved remotely, your support agent will provide a detailed diagnostic report you can share with a local technician — so they can hit the ground running without re-diagnosing the problem.',
        },
        {
          question: 'How fast is your response time?',
          answer: 'Chat, voice, and photo support responses are instant — typically under 30 seconds. Video diagnostic sessions connect immediately when you have available credits.',
        },
        {
          question: 'What hours is support available?',
          answer: 'All support modes — chat, photo analysis, voice, and video — are available 24/7, including weekends and holidays.',
        },
        {
          question: 'Can you help with business or commercial tech issues?',
          answer: 'TotalAssist is designed for home and personal tech support. For business IT needs, we recommend consulting with a professional IT service provider.',
        },
      ],
    },
  ];

  const toggleFaq = (categoryId: string, faqIndex: number) => {
    const key = `${categoryId}-${faqIndex}`;
    setOpenFaq(openFaq === key ? null : key);
  };

  return (
    <section className="min-h-screen pt-[72px] transition-colors" style={{ backgroundImage: 'url(/gradient-poly.jpeg)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
      {/* Hero Section */}
      <div className="section-light py-20 relative overflow-hidden border-b border-surface-border dark:border-midnight-700">
        <div className="container mx-auto px-6 max-w-4xl relative">
          <div className="text-center mb-12">
            {/* FAQ Badge */}
            <AnimatedElement animation="fadeInDown">
              <div className="inline-flex items-center gap-2 bg-white dark:bg-midnight-800 px-4 py-2 rounded-full mb-6 border border-surface-border dark:border-midnight-700">
                <HelpCircle className="w-4 h-4 text-electric-indigo" />
                <span className="text-gradient-electric font-semibold text-sm">FAQ</span>
              </div>
            </AnimatedElement>
            <AnimatedElement animation="fadeInUp" delay={0.1}>
              <h1 className="text-4xl lg:text-6xl font-bold text-text-primary dark:text-white mb-4">
                Frequently Asked Questions
              </h1>
            </AnimatedElement>
            <AnimatedElement animation="fadeInUp" delay={0.2}>
              <p className="text-text-secondary text-lg max-w-2xl mx-auto">
                Find quick answers to common questions about TotalAssist.
              </p>
            </AnimatedElement>
          </div>

          {/* Browse by Category Banner */}
          <AnimatedElement animation="fadeInUp" delay={0.3}>
            <div className="relative max-w-2xl mx-auto">
              <div className="card-clean rounded-2xl p-6 text-center">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(6,182,212,0.10) 100%)' }}>
                    <Search className="w-5 h-5 text-electric-indigo" />
                  </div>
                  <h3 className="text-xl font-bold text-text-primary dark:text-white">Browse by Category</h3>
                </div>
                <p className="text-text-secondary text-sm">
                  Use the topic filters below to find answers quickly.
                </p>
              </div>
            </div>
          </AnimatedElement>
        </div>
      </div>

      {/* Category Pills */}
      <div className="bg-white dark:bg-midnight-900 border-b border-surface-border dark:border-midnight-700 sticky top-[72px] z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                activeCategory === null
                  ? 'text-white shadow-lg shadow-electric-indigo/25'
                  : 'bg-surface-100 dark:bg-midnight-800 text-text-secondary hover:bg-surface-200 dark:hover:bg-midnight-700 hover:text-text-primary dark:hover:text-white'
              }`}
              style={activeCategory === null ? { background: 'linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)' } : undefined}
            >
              All Topics
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                  activeCategory === category.id
                    ? 'text-white shadow-lg shadow-electric-indigo/25'
                    : 'bg-surface-100 dark:bg-midnight-800 text-text-secondary hover:bg-surface-200 dark:hover:bg-midnight-700 hover:text-text-primary dark:hover:text-white'
                }`}
                style={activeCategory === category.id ? { background: 'linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)' } : undefined}
              >
                <category.icon className="w-4 h-4" />
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Content */}
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="space-y-8">
          {categories
            .filter(category => activeCategory === null || category.id === activeCategory)
            .map((category, categoryIndex) => (
                <AnimatedElement key={category.id} animation="fadeInUp" delay={0.1 * categoryIndex}>
                  <div className="card-clean rounded-2xl overflow-hidden">
                    {/* Category Header */}
                    <div className="px-8 py-6 border-b border-surface-border dark:border-midnight-700 flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(6,182,212,0.10) 100%)' }}
                      >
                        <category.icon className="w-6 h-6 text-electric-indigo" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-text-primary dark:text-white">{category.name}</h2>
                        <p className="text-text-muted text-sm">{category.faqs.length} questions</p>
                      </div>
                    </div>

                  {/* FAQ Items */}
                  <div className="p-4 space-y-3">
                    {category.faqs.map((faq, index) => {
                      const isOpen = openFaq === `${category.id}-${index}`;
                      return (
                        <div
                          key={index}
                          className={`rounded-xl border transition-all duration-300 overflow-hidden ${
                            isOpen
                              ? 'border-electric-indigo/30 bg-electric-indigo/[0.03]'
                              : 'border-surface-border dark:border-midnight-700 bg-surface-50 dark:bg-midnight-800 hover:border-surface-200 dark:hover:border-midnight-600'
                          }`}
                        >
                          <button
                            onClick={() => toggleFaq(category.id, index)}
                            className="w-full p-5 flex items-center justify-between text-left"
                          >
                            <span className="font-semibold pr-4 text-text-primary dark:text-white">
                              {faq.question}
                            </span>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                              isOpen
                                ? 'text-white'
                                : 'bg-surface-100 dark:bg-midnight-700 text-text-secondary'
                            }`}
                              style={isOpen ? { background: 'linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)' } : undefined}
                            >
                              {isOpen ? (
                                <Minus className="w-5 h-5" />
                              ) : (
                                <Plus className="w-5 h-5" />
                              )}
                            </div>
                          </button>
                          <div
                            className={`overflow-hidden transition-all duration-300 ${
                              isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                            }`}
                          >
                            <div className="px-5 pb-5 text-text-secondary leading-relaxed">
                              {faq.answer}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                </AnimatedElement>
            ))}
        </div>
      </div>

      {/* Still Need Help CTA */}
      <div
        className="relative py-16 overflow-hidden"
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
        <div className="container mx-auto px-6 max-w-3xl text-center relative z-10">
          <AnimatedElement animation="fadeInUp">
            <h2 className="text-3xl font-bold text-white mb-4">
              Still have questions?
            </h2>
          </AnimatedElement>
          <AnimatedElement animation="fadeInUp" delay={0.15}>
            <p className="text-white/90 mb-8 max-w-xl mx-auto">
              Our team is here to help. Start a chat session and get answers in real-time.
            </p>
          </AnimatedElement>
          <AnimatedElement animation="fadeInUp" delay={0.3}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => onNavigate(PageView.SIGNUP)}
                className="bg-white text-electric-indigo hover:bg-surface-50 font-bold px-10 py-4 rounded-xl transition-all shadow-clean-md hover:shadow-clean-lg hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                Get Started Free <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => onNavigate(PageView.PRICING)}
                className="border-2 border-white/40 text-white font-bold px-10 py-4 rounded-xl hover:bg-white/10 transition-colors"
              >
                View Plans
              </button>
            </div>
          </AnimatedElement>
        </div>
      </div>
    </section>
  );
};
