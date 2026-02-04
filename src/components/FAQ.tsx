import React, { useState } from 'react';
import { ChevronDown, Search, MessageSquare, Camera, Video, CreditCard, Shield, HelpCircle, ArrowRight, Mic } from 'lucide-react';
import { PageView } from '../types';

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
  const [searchQuery, setSearchQuery] = useState('');
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
          question: 'What is Scout Chat?',
          answer: 'Scout Chat is our AI-powered text support. Describe your tech problem in plain English, and get instant troubleshooting guidance. It\'s available 24/7 and included in all plans.',
        },
        {
          question: 'What is Scout Snap?',
          answer: 'Scout Snap lets you upload a photo of an error message, blinking light, or device issue. Our AI analyzes the image instantly and provides specific troubleshooting steps based on what it sees.',
        },
        {
          question: 'What is Video Diagnostic?',
          answer: 'Video Diagnostic lets you upload a video of your tech issue. Scout AI analyzes it and generates a detailed diagnostic report with step-by-step repair instructions, confidence ratings, and a parts list if needed.',
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
          answer: 'Simply take a photo of the issue—an error message, a blinking router light, a confusing screen—and upload it through Scout Snap. Our AI analyzes the image and identifies the problem, often providing a solution within seconds.',
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
      name: 'Scout Signal (Voice)',
      icon: Mic,
      color: '#06B6D4',
      faqs: [
        {
          question: 'What is Scout Signal?',
          answer: 'Scout Signal is our voice-powered support feature. Instead of typing, just talk to Scout like you would a real technician. Describe your issue out loud, and Scout listens and responds with spoken guidance. Perfect for hands-free troubleshooting.',
        },
        {
          question: 'How do I use Scout Signal?',
          answer: 'Press the microphone button to start speaking. Describe your tech problem naturally—no special commands needed. Scout will process your voice and respond with helpful guidance. You can have a back-and-forth conversation just like talking to a support agent.',
        },
        {
          question: 'Which plans include Scout Signal?',
          answer: 'Scout Signal (voice mode) is available on Scout Home ($9.99/mo) and Scout Pro ($19.99/mo) plans. Free users can upgrade anytime to unlock voice support.',
        },
        {
          question: 'Can Scout Signal understand accents?',
          answer: 'Yes! Scout Signal is built on advanced speech recognition that handles a wide variety of accents and speaking styles. If Scout has trouble understanding, you can always switch to text chat.',
        },
      ],
    },
    {
      id: 'video-diagnostic',
      name: 'Video Diagnostic',
      icon: Video,
      color: '#8B5CF6',
      faqs: [
        {
          question: 'How does Video Diagnostic work?',
          answer: 'Upload or record a short video of your tech issue. Scout AI analyzes the footage and generates a comprehensive diagnostic report including observations, root cause assessment, step-by-step repair instructions, and a parts list if needed.',
        },
        {
          question: 'What kind of videos should I upload?',
          answer: 'Record the device showing the problem—blinking lights, error screens, unusual behavior. Aim for 15-60 seconds of clear footage. You don\'t need to show your face, just the tech issue.',
        },
        {
          question: 'How long does analysis take?',
          answer: 'Most video diagnostics are completed within 1-2 minutes. You\'ll see a progress indicator while Scout analyzes your footage.',
        },
        {
          question: 'Can I save and share diagnostic reports?',
          answer: 'Yes! Every diagnostic report can be downloaded as a PDF or shared via link. Great for keeping records or showing a technician if you need onsite help.',
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
          question: 'What\'s included in Scout Free?',
          answer: 'Scout Free includes 5 chat messages and 1 photo analysis per month. It\'s a great way to experience Scout AI. Voice (Scout Signal) and Video Diagnostic require Scout Home or Pro.',
        },
        {
          question: 'What\'s the difference between Home and Pro plans?',
          answer: 'Scout Home ($9.99/mo) includes unlimited Chat, Snapshot, and Signal (voice), plus 1 Video Diagnostic per week. Scout Pro ($19.99/mo) includes everything in Home plus 15 Video Diagnostics per month, premium AI for all features, multi-home support for up to 5 properties, and a $100 annual onsite service credit.',
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
          answer: 'Scout Chat responses are instant—typically under 30 seconds. For Live video sessions, wait times depend on your plan tier, with Pro members getting the fastest priority access.',
        },
        {
          question: 'What hours is support available?',
          answer: 'Scout Chat and Scout Snap are available 24/7. Live video support with human specialists is available 7am-10pm in your local time zone, 7 days a week.',
        },
        {
          question: 'Can you help with business or commercial tech issues?',
          answer: 'TotalAssist is designed for home and personal tech support. For business IT needs, we recommend consulting with a professional IT service provider.',
        },
      ],
    },
  ];

  // Filter FAQs based on search query
  const filteredCategories = categories.map(category => ({
    ...category,
    faqs: category.faqs.filter(
      faq =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(category => category.faqs.length > 0);

  const toggleFaq = (categoryId: string, faqIndex: number) => {
    const key = `${categoryId}-${faqIndex}`;
    setOpenFaq(openFaq === key ? null : key);
  };

  return (
    <section className="min-h-screen pt-[72px] bg-midnight-950">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-midnight-900 via-midnight-950 to-midnight-900 py-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-scout-purple/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-electric-indigo/10 rounded-full blur-3xl" />
        <div className="container mx-auto px-6 max-w-4xl relative">
          <div className="text-center mb-10">
            <h1 className="text-4xl lg:text-5xl font-black text-white mb-4">
              How can we help?
            </h1>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              Find answers to common questions about TotalAssist
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for answers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-4 rounded-2xl bg-midnight-800 shadow-xl text-white placeholder-text-muted border border-midnight-700 focus:outline-none focus:ring-4 focus:ring-electric-indigo/30 text-lg"
            />
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="bg-midnight-900 border-b border-midnight-700 sticky top-[72px] z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                activeCategory === null
                  ? 'bg-electric-indigo text-white'
                  : 'bg-midnight-800 text-text-secondary hover:bg-midnight-700 hover:text-white'
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
                    : 'bg-midnight-800 text-text-secondary hover:bg-midnight-700 hover:text-white'
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
        {searchQuery && filteredCategories.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-midnight-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-8 h-8 text-text-muted" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No results found</h3>
            <p className="text-text-secondary mb-6">
              We couldn't find any FAQs matching "{searchQuery}"
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="text-electric-indigo font-semibold hover:underline"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {(searchQuery ? filteredCategories : categories)
              .filter(category => activeCategory === null || category.id === activeCategory)
              .map((category) => (
                <div key={category.id} className="bg-midnight-800 rounded-3xl shadow-sm border border-midnight-700 overflow-hidden">
                  {/* Category Header */}
                  <div className="px-8 py-6 border-b border-midnight-700 flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <category.icon className="w-6 h-6" style={{ color: category.color }} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">{category.name}</h2>
                      <p className="text-text-muted text-sm">{category.faqs.length} questions</p>
                    </div>
                  </div>

                  {/* FAQ Items */}
                  <div className="divide-y divide-midnight-700">
                    {category.faqs.map((faq, index) => {
                      const isOpen = openFaq === `${category.id}-${index}`;
                      return (
                        <div key={index} className="group">
                          <button
                            onClick={() => toggleFaq(category.id, index)}
                            className="w-full px-8 py-5 flex items-center justify-between text-left hover:bg-midnight-700/50 transition-colors"
                          >
                            <span className="font-semibold text-white pr-4 group-hover:text-electric-indigo transition-colors">
                              {faq.question}
                            </span>
                            <ChevronDown
                              className={`w-5 h-5 text-text-muted shrink-0 transition-transform duration-200 ${
                                isOpen ? 'rotate-180 text-electric-indigo' : ''
                              }`}
                            />
                          </button>
                          <div
                            className={`overflow-hidden transition-all duration-200 ${
                              isOpen ? 'max-h-96' : 'max-h-0'
                            }`}
                          >
                            <div className="px-8 pb-6 text-text-secondary leading-relaxed">
                              {faq.answer}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Still Need Help CTA */}
      <div className="bg-gradient-to-br from-scout-purple to-electric-indigo py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-electric-cyan rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-scout-glow rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
        </div>
        <div className="container mx-auto px-6 max-w-3xl text-center relative z-10">
          <h2 className="text-3xl font-black text-white mb-4">
            Still have questions?
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            Our team is here to help. Start a chat session and get answers in real-time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => onNavigate(PageView.SIGNUP)}
              className="bg-midnight-950 hover:bg-midnight-900 text-white font-bold px-10 py-4 rounded-full transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-2"
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
        </div>
      </div>
    </section>
  );
};
