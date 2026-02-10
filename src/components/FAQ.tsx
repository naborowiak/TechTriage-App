import React, { useState } from 'react';
import { Search, MessageSquare, Camera, Video, CreditCard, Shield, HelpCircle, ArrowRight, Mic, Plus, Minus } from 'lucide-react';
import { PageView } from '../types';
import { AnimatedElement, useParallax } from '../hooks/useAnimations';

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
  const { ref: heroParallaxRef, offset: heroOffset } = useParallax(0.3);
  const { ref: ctaParallaxRef, offset: ctaOffset } = useParallax(0.2);

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
          answer: 'No download required! TotalAssist works directly in your web browser. Our mobile app is coming soon for an even more convenient experience.',
        },
        {
          question: 'Is my information secure?',
          answer: 'Absolutely. We use bank-level encryption to protect your data. We never share your personal information with third parties, and you can delete your account and data at any time.',
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
          question: 'What is Text Support?',
          answer: 'Text Support is our chat-based troubleshooting service. Describe your tech problem in plain English, and get instant troubleshooting guidance. It\'s available 24/7 and included in all plans.',
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
          answer: 'Our AI has been trained on millions of tech issues and is highly accurate for common problems. For unusual cases, it will recommend connecting with a live specialist for personalized help.',
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
          answer: 'TotalAssist Home ($9.99/mo) includes unlimited Chat, Snapshot, and Signal (voice), plus 1 Live Video session per week. TotalAssist Pro ($19.99/mo) includes everything in Home plus 15 Live Video sessions per month, premium AI for all features, multi-home support for up to 5 properties, and a $100 annual onsite service credit.',
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
          answer: 'If your issue can\'t be resolved remotely, we can connect you with a vetted local technician. Home plan members get 15% off, and Pro members receive a $100 annual service credit.',
        },
        {
          question: 'How fast is your response time?',
          answer: 'Text support responses are instant--typically under 30 seconds. For Live video sessions, wait times depend on your plan tier, with Pro members getting the fastest priority access.',
        },
        {
          question: 'What hours is support available?',
          answer: 'Text support and Photo Analysis are available 24/7. Live video support with human specialists is available 7am-10pm in your local time zone, 7 days a week.',
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
    <section className="min-h-screen pt-[72px] bg-light-50 dark:bg-midnight-950 transition-colors">
      {/* Hero Section */}
      <div ref={heroParallaxRef} className="bg-light-100 dark:bg-midnight-900 py-20 relative overflow-hidden border-b border-light-300 dark:border-midnight-700">
        <div
          className="absolute top-0 right-0 w-96 h-96 bg-scout-purple/10 rounded-full blur-3xl transition-transform duration-100"
          style={{ transform: `translateY(${heroOffset * 0.5}px)` }}
        />
        <div
          className="absolute bottom-0 left-0 w-64 h-64 bg-electric-indigo/10 rounded-full blur-3xl transition-transform duration-100"
          style={{ transform: `translateY(${-heroOffset * 0.3}px)` }}
        />
        <div className="container mx-auto px-6 max-w-4xl relative">
          <div className="text-center mb-12">
            {/* FAQ Badge */}
            <AnimatedElement animation="fadeInDown">
              <div className="inline-flex items-center gap-2 bg-white dark:bg-midnight-800 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-scout-purple/30 shadow-sm">
                <HelpCircle className="w-4 h-4 text-scout-purple" />
                <span className="text-scout-purple font-semibold text-sm">FAQ</span>
              </div>
            </AnimatedElement>
            <AnimatedElement animation="fadeInUp" delay={0.1}>
              <h1 className="text-4xl lg:text-6xl font-black text-text-primary dark:text-white mb-4 italic">
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
              <div className="bg-white dark:bg-midnight-800 backdrop-blur-sm border border-scout-purple/30 rounded-2xl p-6 text-center shadow-sm">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-scout-purple to-electric-indigo flex items-center justify-center">
                    <Search className="w-5 h-5 text-white" />
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
      <div className="bg-white dark:bg-midnight-900 border-b border-light-300 dark:border-midnight-700 sticky top-[72px] z-40 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                activeCategory === null
                  ? 'bg-electric-indigo text-white'
                  : 'bg-light-200 dark:bg-midnight-800 text-text-secondary hover:bg-light-300 dark:hover:bg-midnight-700 hover:text-text-primary dark:hover:text-white'
              }`}
            >
              All Topics
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                  activeCategory === category.id
                    ? 'bg-electric-indigo text-white'
                    : 'bg-light-200 dark:bg-midnight-800 text-text-secondary hover:bg-light-300 dark:hover:bg-midnight-700 hover:text-text-primary dark:hover:text-white'
                }`}
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
                  <div className="bg-white dark:bg-midnight-900 rounded-3xl shadow-sm border border-light-300 dark:border-midnight-700 overflow-hidden">
                    {/* Category Header */}
                    <div className="px-8 py-6 border-b border-light-300 dark:border-midnight-700 flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${category.color}15` }}
                      >
                        <category.icon className="w-6 h-6" style={{ color: category.color }} />
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
                              ? 'border-scout-purple/50 bg-gradient-to-br from-scout-purple/10 to-electric-indigo/5'
                              : 'border-light-300 dark:border-midnight-700 bg-light-100 dark:bg-midnight-800 hover:border-light-400 dark:hover:border-midnight-600'
                          }`}
                        >
                          <button
                            onClick={() => toggleFaq(category.id, index)}
                            className="w-full p-5 flex items-center justify-between text-left"
                          >
                            <span className={`font-semibold pr-4 text-text-primary dark:text-white`}>
                              {faq.question}
                            </span>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                              isOpen
                                ? 'bg-scout-purple/20 text-scout-purple'
                                : 'bg-light-200 dark:bg-midnight-700 text-text-secondary'
                            }`}>
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
      <div ref={ctaParallaxRef} className="bg-gradient-to-br from-scout-purple to-electric-indigo py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
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
            <h2 className="text-3xl font-black text-white mb-4">
              Still have questions?
            </h2>
          </AnimatedElement>
          <AnimatedElement animation="fadeInUp" delay={0.15}>
            <p className="text-white/80 mb-8 max-w-xl mx-auto">
              Our team is here to help. Start a chat session and get answers in real-time.
            </p>
          </AnimatedElement>
          <AnimatedElement animation="fadeInUp" delay={0.3}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => onNavigate(PageView.SIGNUP)}
                className="bg-midnight-950 hover:bg-midnight-900 text-white font-bold px-10 py-4 rounded-full transition-all shadow-xl hover:shadow-2xl hover:scale-105 flex items-center justify-center gap-2"
              >
                Get Started Free <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => onNavigate(PageView.PRICING)}
                className="border-2 border-white/80 text-white font-bold px-10 py-4 rounded-full hover:bg-white/10 transition-colors"
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
