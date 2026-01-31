import React, { useState } from 'react';
import { ChevronDown, Search, MessageSquare, Camera, Video, CreditCard, Shield, HelpCircle, ArrowRight } from 'lucide-react';
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
      color: '#F97316',
      faqs: [
        {
          question: 'How do I sign up for TechTriage?',
          answer: 'Signing up is free and takes less than a minute. Click "Sign Up Free" in the navigation, enter your email, and you\'re ready to go. No credit card required for the free Chat plan.',
        },
        {
          question: 'What devices and browsers are supported?',
          answer: 'TechTriage works on any modern web browser including Chrome, Safari, Firefox, and Edge. Whether you\'re on a computer, tablet, or phone, you can access our support from any device with an internet connection.',
        },
        {
          question: 'Do I need to download an app?',
          answer: 'No download required! TechTriage works directly in your web browser. Our mobile app is coming soon for an even more convenient experience.',
        },
        {
          question: 'Is my information secure?',
          answer: 'Absolutely. We use bank-level encryption to protect your data. We never share your personal information with third parties, and you can delete your account and data at any time.',
        },
      ],
    },
    {
      id: 'products',
      name: 'TechTriage Products',
      icon: MessageSquare,
      color: '#1F2937',
      faqs: [
        {
          question: 'What is TechTriage Chat?',
          answer: 'TechTriage Chat is our AI-powered text support. Describe your tech problem in plain English, and get instant troubleshooting guidance. It\'s available 24/7 and included in all plans.',
        },
        {
          question: 'What is TechTriage Snap?',
          answer: 'TechTriage Snap lets you upload a photo of an error message, blinking light, or device issue. Our AI analyzes the image instantly and provides specific troubleshooting steps based on what it sees.',
        },
        {
          question: 'What is TechTriage Live?',
          answer: 'TechTriage Live connects you to a real-time video session. Our AI assists immediately, and a human specialist can join when needed to walk you through complex issues step-by-step.',
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
          answer: 'Simply take a photo of the issue—an error message, a blinking router light, a confusing screen—and upload it through TechTriage Snap. Our AI analyzes the image and identifies the problem, often providing a solution within seconds.',
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
      id: 'live',
      name: 'Live Video Support',
      icon: Video,
      color: '#8B5CF6',
      faqs: [
        {
          question: 'How do I start a live video session?',
          answer: 'From your dashboard, click "Start Live Session." You\'ll be connected to our AI assistant first, and a human specialist will join if your issue requires hands-on guidance.',
        },
        {
          question: 'Do I need to show my face on video?',
          answer: 'Not at all! Most customers simply point their camera at the device they need help with. You can keep your camera focused on the tech issue the entire time.',
        },
        {
          question: 'What if I need to step away during a session?',
          answer: 'No problem. You can pause the session at any time. Your progress is saved, and you can resume when you\'re ready.',
        },
        {
          question: 'Are live sessions recorded?',
          answer: 'Sessions are not recorded by default. If recording would help document a solution for future reference, we\'ll always ask for your permission first.',
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
          question: 'What\'s included in the free Chat plan?',
          answer: 'The free Chat plan includes 5 AI chat sessions per month, access to our knowledge base, basic troubleshooting guides, and email support. It\'s a great way to try TechTriage.',
        },
        {
          question: 'What\'s the difference between Home and Pro plans?',
          answer: 'The Home plan ($19/mo annual) includes unlimited Chat, Snap photo diagnosis, and 2 Live video sessions per month. The Pro plan ($49/mo annual) adds unlimited Live sessions, multi-home support for up to 5 properties, and a $100 annual onsite service credit.',
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
          answer: 'AI chat responses are instant—typically under 30 seconds. For Live video sessions, wait times depend on your plan tier, with Pro members getting the fastest priority access.',
        },
        {
          question: 'What hours is support available?',
          answer: 'AI-powered Chat and Snap are available 24/7. Live video support with human specialists is available 7am-10pm in your local time zone, 7 days a week.',
        },
        {
          question: 'Can you help with business or commercial tech issues?',
          answer: 'TechTriage is designed for home and personal tech support. For business IT needs, we recommend consulting with a professional IT service provider.',
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
    <section className="min-h-screen pt-[72px] bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#1F2937] via-[#374151] to-[#1F2937] py-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#F97316]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#F97316]/5 rounded-full blur-3xl" />
        <div className="container mx-auto px-6 max-w-4xl relative">
          <div className="text-center mb-10">
            <h1 className="text-4xl lg:text-5xl font-black text-white mb-4">
              How can we help?
            </h1>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              Find answers to common questions about TechTriage
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
              className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white shadow-xl text-[#1F2937] placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-[#F97316]/20 text-lg"
            />
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="bg-white border-b border-gray-100 sticky top-[72px] z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                activeCategory === null
                  ? 'bg-[#1F2937] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                    ? 'bg-[#1F2937] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-[#1F2937] mb-2">No results found</h3>
            <p className="text-gray-500 mb-6">
              We couldn't find any FAQs matching "{searchQuery}"
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="text-[#F97316] font-semibold hover:underline"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {(searchQuery ? filteredCategories : categories)
              .filter(category => activeCategory === null || category.id === activeCategory)
              .map((category) => (
                <div key={category.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* Category Header */}
                  <div className="px-8 py-6 border-b border-gray-100 flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${category.color}15` }}
                    >
                      <category.icon className="w-6 h-6" style={{ color: category.color }} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-[#1F2937]">{category.name}</h2>
                      <p className="text-gray-500 text-sm">{category.faqs.length} questions</p>
                    </div>
                  </div>

                  {/* FAQ Items */}
                  <div className="divide-y divide-gray-100">
                    {category.faqs.map((faq, index) => {
                      const isOpen = openFaq === `${category.id}-${index}`;
                      return (
                        <div key={index} className="group">
                          <button
                            onClick={() => toggleFaq(category.id, index)}
                            className="w-full px-8 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                          >
                            <span className="font-semibold text-[#1F2937] pr-4 group-hover:text-[#F97316] transition-colors">
                              {faq.question}
                            </span>
                            <ChevronDown
                              className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-200 ${
                                isOpen ? 'rotate-180 text-[#F97316]' : ''
                              }`}
                            />
                          </button>
                          <div
                            className={`overflow-hidden transition-all duration-200 ${
                              isOpen ? 'max-h-96' : 'max-h-0'
                            }`}
                          >
                            <div className="px-8 pb-6 text-gray-600 leading-relaxed">
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
      <div className="bg-gradient-to-br from-[#F97316] to-[#EA580C] py-16">
        <div className="container mx-auto px-6 max-w-3xl text-center">
          <h2 className="text-3xl font-black text-white mb-4">
            Still have questions?
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            Our team is here to help. Start a chat session and get answers in real-time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => onNavigate(PageView.SIGNUP)}
              className="bg-white text-[#F97316] font-bold px-10 py-4 rounded-full transition-all hover:bg-gray-100 shadow-lg flex items-center justify-center gap-2"
            >
              Get Started Free <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => onNavigate(PageView.PRICING)}
              className="border-2 border-white text-white font-bold px-10 py-4 rounded-full hover:bg-white/10 transition-colors"
            >
              View Plans
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
