import React, { useState, useRef } from 'react';
import { 
  Menu, X, ArrowRight, Shield, 
  Cpu, Home, Star, Sparkles, Video,
  Tv, Wifi, Phone,
  Zap, Wrench, Lock, CheckCircle2, Moon, Sun
} from 'lucide-react';
import { ChatWidget, ChatWidgetHandle } from './components/ChatWidget';
import { Logo } from './components/Logo';
import { PageView } from './types';
import { HowItWorks } from './components/HowItWorks';
import { Pricing } from './components/Pricing';
import { SignUp } from './components/SignUp';
import { Login } from './components/Login';
import { useTheme } from './context/ThemeContext';

const Button: React.FC<{ 
  children: React.ReactNode; 
  variant?: 'orange' | 'outline' | 'outlineNavy' | 'dark'; 
  className?: string; 
  onClick?: () => void 
}> = ({ children, variant = 'orange', className = '', onClick }) => {
  const variants = {
    orange: "bg-[#F97316] hover:bg-[#EA580C] text-white shadow-lg shadow-orange-500/20",
    outline: "bg-transparent border-2 border-white text-white hover:bg-white/10",
    outlineNavy: "bg-transparent border-2 border-[#1F2937] text-[#1F2937] hover:bg-[#1F2937] hover:text-white",
    dark: "bg-[#1F2937] text-white hover:bg-[#374151]"
  };

  return (
    <button 
      onClick={onClick} 
      className={`px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Header: React.FC<{ 
  onNavigate: (view: PageView) => void; 
  currentView: PageView 
}> = ({ onNavigate, currentView }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();
  const isHomePage = currentView === PageView.HOME;
  
  const handleNav = (view: PageView) => {
    onNavigate(view);
    setMobileMenuOpen(false);
    window.scrollTo(0, 0);
  };

  const textColor = isHomePage ? 'text-white' : (isDark ? 'text-white' : 'text-[#1F2937]');
  const hoverColor = 'hover:text-[#F97316]';
  const dividerColor = isHomePage ? 'bg-white/30' : (isDark ? 'bg-white/30' : 'bg-gray-300');

  return (
    <header className={`fixed top-0 left-0 w-full z-50 h-20 transition-colors ${isHomePage ? 'bg-[#1F2937]' : (isDark ? 'bg-[#1F2937] shadow-md' : 'bg-white shadow-md')}`}>
      <div className="container mx-auto px-6 h-full flex items-center justify-between">
        <button onClick={() => handleNav(PageView.HOME)} className="focus:outline-none">
          <Logo variant={isHomePage || isDark ? 'light' : 'dark'} />
        </button>
        
        <nav className="hidden lg:flex items-center gap-8">
          <button 
            onClick={() => handleNav(PageView.HOME)} 
            className={`${currentView === PageView.HOME ? 'text-[#F97316]' : `${textColor} ${hoverColor}`} transition-colors font-bold text-base`}
          >
            Product
          </button>
          <button 
            onClick={() => handleNav(PageView.HOW_IT_WORKS)} 
            className={`${currentView === PageView.HOW_IT_WORKS ? 'text-[#F97316]' : `${textColor} ${hoverColor}`} transition-colors font-bold text-base`}
          >
            How It Works
          </button>
          <button 
            onClick={() => handleNav(PageView.PRICING)}
            className={`${currentView === PageView.PRICING ? 'text-[#F97316]' : `${textColor} ${hoverColor}`} transition-colors font-bold text-base`}
          >
            Pricing
          </button>
          <button className={`${textColor} ${hoverColor} transition-colors font-bold text-base`}>Resources</button>
        </nav>

        <div className="hidden lg:flex items-center gap-6">
          <div className={`flex items-center gap-2 ${textColor} font-bold`}>
            <Phone className="w-5 h-5" />
            <span>1-800-TECH-FIX</span>
          </div>
          <div className={`h-6 w-px ${dividerColor}`}></div>
          <button 
            onClick={toggleTheme} 
            className={`${textColor} ${hoverColor} transition-colors p-2 rounded-full hover:bg-white/10`}
            aria-label="Toggle dark mode"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button onClick={() => handleNav(PageView.LOGIN)} className={`${textColor} ${hoverColor} transition-colors font-bold`}>Log In</button>
          <Button variant="orange" onClick={() => handleNav(PageView.SIGNUP)} className="py-3 px-6 text-base">Get Started</Button>
        </div>

        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className={`lg:hidden ${textColor} p-2`}>
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className={`lg:hidden absolute top-20 left-0 w-full ${isDark ? 'bg-[#1F2937] border-gray-700' : 'bg-white border-gray-200'} border-b p-6 flex flex-col gap-6 shadow-xl`}>
          <button onClick={() => handleNav(PageView.HOME)} className={`${isDark ? 'text-white' : 'text-[#1F2937]'} font-bold text-lg text-left`}>Product</button>
          <button onClick={() => handleNav(PageView.HOW_IT_WORKS)} className={`${isDark ? 'text-white' : 'text-[#1F2937]'} font-bold text-lg text-left`}>How It Works</button>
          <button onClick={() => handleNav(PageView.PRICING)} className={`${isDark ? 'text-white' : 'text-[#1F2937]'} font-bold text-lg text-left`}>Pricing</button>
          <button className={`${isDark ? 'text-white' : 'text-[#1F2937]'} font-bold text-lg text-left`}>Resources</button>
          <hr className={isDark ? 'border-gray-700' : 'border-gray-200'} />
          <div className={`flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#1F2937]'} font-bold`}>
            <Phone className="w-5 h-5" />
            <span>1-800-TECH-FIX</span>
          </div>
          <button 
            onClick={toggleTheme}
            className={`flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#1F2937]'} font-bold text-lg text-left`}
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button onClick={() => handleNav(PageView.LOGIN)} className={`${isDark ? 'text-white' : 'text-[#1F2937]'} font-bold text-lg text-left`}>Log In</button>
          <Button variant="orange" onClick={() => handleNav(PageView.SIGNUP)} className="w-full">Get Started</Button>
        </div>
      )}
    </header>
  );
};

const Hero: React.FC<{ onSignup: (email?: string) => void; onHowItWorks: () => void }> = ({ onSignup, onHowItWorks }) => (
  <section 
    className="relative pt-28 pb-16 lg:pt-32 lg:pb-24 min-h-[600px] lg:min-h-[700px] overflow-hidden bg-cover bg-center bg-no-repeat"
    style={{ backgroundImage: 'url(/hero-bg.jpg)' }}
  >
    <div className="absolute inset-0 bg-gradient-to-r from-[#1F2937]/95 via-[#1F2937]/80 to-transparent"></div>
    <div className="container mx-auto px-6 relative z-10">
      <div className="max-w-xl">
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full mb-6">
          <span className="text-[#F97316] font-bold text-sm">INSTANT ACCESS</span>
          <span className="text-white/60 font-bold text-sm">TO REAL HELP</span>
        </div>
        <h1 className="text-4xl lg:text-6xl font-black text-white tracking-tight leading-[1.1] mb-6">
          Show us the problem. We'll handle the rest.
        </h1>
        <p className="text-white/80 text-xl font-medium leading-relaxed mb-10 max-w-lg">
          TechTriage connects you to AI + real specialists to troubleshoot safely and remotely. Send a photo for instant triage, jump on live video, or schedule an onsite visit when needed.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button variant="orange" onClick={onSignup}>
            Start a Triage Chat
          </Button>
          <Button variant="outline" onClick={onHowItWorks}>
            See How It Works
          </Button>
        </div>
      </div>
    </div>
  </section>
);

const SupportTiers: React.FC<{ onSignup: (email?: string) => void }> = ({ onSignup }) => {
  const { isDark } = useTheme();
  const tiers = [
    {
      name: "TechTriage",
      subtitle: "Text Support",
      icon: <Phone className="w-8 h-8" />,
      features: ["Text/chat support", "Human escalation", "Fast answers + step-by-step fixes"],
      color: "bg-blue-500"
    },
    {
      name: "TechTriage AI",
      subtitle: "Photo Upload",
      icon: <Cpu className="w-8 h-8" />,
      features: ["Upload photos/screenshots", "AI identifies the issue", "Guided troubleshooting + smart routing"],
      color: "bg-[#F97316]",
      highlight: true
    },
    {
      name: "TechTriage Live",
      subtitle: "Video Support",
      icon: <Video className="w-8 h-8" />,
      features: ["Real-time video help", "AI + expert guidance", "Session transcript + summary"],
      color: "bg-purple-600"
    }
  ];

  return (
    <section className={`py-20 ${isDark ? 'bg-[#111827]' : 'bg-white'}`}>
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center mb-16">
          <h2 className={`text-4xl lg:text-5xl font-black mb-4 ${isDark ? 'text-white' : 'text-[#1F2937]'}`}>
            Choose your support level
          </h2>
          <p className={`text-xl max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            From quick text answers to live video troubleshooting—we've got you covered.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {tiers.map((tier, i) => (
            <div key={i} className={`rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2 border-2 ${isDark ? 'bg-[#1F2937]' : 'bg-white'} ${tier.highlight ? 'border-[#F97316]' : (isDark ? 'border-gray-700' : 'border-gray-100')}`}>
              {tier.highlight && (
                <div className="text-center -mt-12 mb-4">
                  <span className="bg-[#F97316] text-white text-xs font-bold px-4 py-1 rounded-full uppercase">Most Popular</span>
                </div>
              )}
              <div className={`${tier.color} w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-6`}>
                {tier.icon}
              </div>
              <h3 className={`text-2xl font-black mb-1 ${isDark ? 'text-white' : 'text-[#1F2937]'}`}>{tier.name}</h3>
              <p className="text-[#F97316] font-bold mb-6">{tier.subtitle}</p>
              <ul className="space-y-3 mb-6">
                {tier.features.map((f, j) => (
                  <li key={j} className={`flex items-start gap-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    <CheckCircle2 className="w-5 h-5 text-[#F97316] shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="text-center mt-12">
          <Button variant="orange" onClick={onSignup} className="text-lg px-10">
            Start with Text Support
          </Button>
        </div>
      </div>
    </section>
  );
};

const HowItWorksSimple: React.FC = () => {
  const { isDark } = useTheme();
  const steps = [
    {
      step: "1",
      title: "Tell us what's wrong",
      desc: "Start a text or chat conversation. Describe the issue in your own words.",
      icon: <Phone className="w-8 h-8" />
    },
    {
      step: "2",
      title: "Show us",
      desc: "Upload a photo, share a screenshot, or jump on live video so we can see exactly what you're dealing with.",
      icon: <Cpu className="w-8 h-8" />
    },
    {
      step: "3",
      title: "Get it fixed",
      desc: "We'll guide you through the solution remotely—or schedule an onsite visit if needed.",
      icon: <CheckCircle2 className="w-8 h-8" />
    }
  ];

  return (
    <section className={`py-20 ${isDark ? 'bg-[#0D1117]' : 'bg-[#F3F4F6]'}`}>
      <div className="container mx-auto px-6 max-w-5xl">
        <div className="text-center mb-16">
          <h2 className={`text-4xl lg:text-5xl font-black mb-4 ${isDark ? 'text-white' : 'text-[#1F2937]'}`}>How it works</h2>
          <p className={`text-xl ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Three simple steps to solving your problem</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((s, i) => (
            <div key={i} className="text-center">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white mx-auto mb-6 shadow-lg ${isDark ? 'bg-[#F97316]' : 'bg-[#1F2937]'}`}>
                {s.icon}
              </div>
              <div className="text-[#F97316] font-black text-lg mb-2">Step {s.step}</div>
              <h3 className={`text-2xl font-bold mb-3 ${isDark ? 'text-white' : 'text-[#1F2937]'}`}>{s.title}</h3>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const WhatWeHelpWith: React.FC = () => {
  const { isDark } = useTheme();
  const problems = [
    { icon: <Wifi className="w-6 h-6" />, label: "Wi-Fi & internet issues" },
    { icon: <Tv className="w-6 h-6" />, label: "TVs / streaming / soundbars" },
    { icon: <Cpu className="w-6 h-6" />, label: "Computers running slow" },
    { icon: <Home className="w-6 h-6" />, label: "Printers, devices, smart home" },
    { icon: <Lock className="w-6 h-6" />, label: "Apps/accounts/password recovery" },
    { icon: <Sparkles className="w-6 h-6" />, label: '"It was working yesterday..." mysteries' },
    { icon: <Wrench className="w-6 h-6" />, label: "Appliance troubleshooting" },
    { icon: <Zap className="w-6 h-6" />, label: "HVAC & thermostat help" },
  ];

  return (
    <section className={`py-20 ${isDark ? 'bg-[#111827]' : 'bg-white'}`}>
      <div className="container mx-auto px-6 max-w-5xl">
        <div className="text-center mb-12">
          <h2 className={`text-4xl lg:text-5xl font-black mb-4 ${isDark ? 'text-white' : 'text-[#1F2937]'}`}>
            What we can help with
          </h2>
          <p className={`text-xl ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Everyday problems. Real solutions.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {problems.map((item, i) => (
            <div key={i} className={`p-6 rounded-xl flex flex-col items-center gap-4 hover:shadow-xl transition-all cursor-pointer hover:border-[#F97316] group text-center border ${isDark ? 'bg-[#1F2937] border-gray-700' : 'bg-[#F9FAFB] border-gray-200'}`}>
              <div className={`group-hover:text-[#F97316] transition-colors ${isDark ? 'text-white' : 'text-[#1F2937]'}`}>{item.icon}</div>
              <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#1F2937]'}`}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const TrustSection: React.FC = () => (
  <section className="py-20 bg-[#1F2937] text-white">
    <div className="container mx-auto px-6 max-w-5xl">
      <div className="text-center mb-12">
        <h2 className="text-4xl lg:text-5xl font-black mb-6">
          Real specialists. Real answers.
        </h2>
        <p className="text-white/70 text-xl max-w-2xl mx-auto">
          No stress. No runaround. Just honest help when you need it.
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="bg-white/10 backdrop-blur p-8 rounded-2xl text-center">
          <div className="w-16 h-16 bg-[#F97316] rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h4 className="font-bold text-white mb-3 text-xl">Safe, remote-first</h4>
          <p className="text-white/70">
            Troubleshoot from the comfort of your home. No strangers in your house unless you need them.
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur p-8 rounded-2xl text-center">
          <div className="w-16 h-16 bg-[#F97316] rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h4 className="font-bold text-white mb-3 text-xl">You control what you share</h4>
          <p className="text-white/70">
            Your photos, videos, and conversations are private. We never share your data without permission.
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur p-8 rounded-2xl text-center">
          <div className="w-16 h-16 bg-[#F97316] rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <h4 className="font-bold text-white mb-3 text-xl">Trusted locally</h4>
          <p className="text-white/70">
            Trusted by customers across St. Louis and beyond. Real people helping real neighbors.
          </p>
        </div>
      </div>
    </div>
  </section>
);

const TestimonialSection: React.FC = () => {
  const { isDark } = useTheme();
  const testimonials = [
    {
      quote: "TechTriage has taken a lot of stress off my shoulders. I can troubleshoot from my cell phone. I'm not tied to my office.",
      name: "Kelly Shelton",
      role: "Homeowner, St. Louis MO",
      image: "/images/testimonial-1.jpg"
    },
    {
      quote: "The AI diagnosed my HVAC issue in seconds. Saved me $400 on an unnecessary service call!",
      name: "Marcus Johnson",
      role: "Property Manager, Austin TX",
      image: "/images/testimonial-2.jpg"
    },
    {
      quote: "Finally, a tech support that speaks my language. The video calls with real experts are a game-changer.",
      name: "Sarah Chen",
      role: "First-time Homeowner, Seattle WA",
      image: "/images/testimonial-3.jpg"
    }
  ];

  return (
    <section className={`py-24 ${isDark ? 'bg-[#0D1117]' : 'bg-[#F3F4F6]'}`}>
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center mb-12">
          <h2 className={`text-4xl font-black mb-4 ${isDark ? 'text-white' : 'text-[#1F2937]'}`}>What Our Customers Say</h2>
          <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Real stories from real homeowners</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div key={i} className={`p-8 rounded-2xl shadow-xl border-t-4 border-[#F97316] ${isDark ? 'bg-[#1F2937]' : 'bg-white'}`}>
              <div className="flex mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="w-5 h-5 fill-[#F97316] text-[#F97316]" />
                ))}
              </div>
              <p className={`mb-6 leading-relaxed italic ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>"{t.quote}"</p>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <img src={t.image} alt={t.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className={`font-bold ${isDark ? 'text-white' : 'text-[#1F2937]'}`}>{t.name}</div>
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const FAQSection: React.FC = () => {
  const { isDark } = useTheme();
  const [openFaq, setOpenFaq] = React.useState<number | null>(null);
  const faqs = [
    { q: "How fast can I get help?", a: "Most text support sessions connect within minutes. AI photo analysis is instant. Live video sessions typically start within 15 minutes." },
    { q: "What if you can't fix it remotely?", a: "If remote troubleshooting can't solve the issue, we'll help schedule an onsite technician visit at a time that works for you." },
    { q: "Is my information private?", a: "Absolutely. You control what you share. Photos, videos, and conversations are never shared without your explicit permission." },
    { q: "Do I need to download an app?", a: "Nope! TechTriage works right in your browser. Just text us, upload a photo, or start a video call—no downloads required." },
    { q: "What areas do you serve?", a: "We provide remote support nationwide. Onsite visits are currently available in the St. Louis metro area, with more regions coming soon." }
  ];

  return (
    <section className={`py-20 ${isDark ? 'bg-[#111827]' : 'bg-white'}`}>
      <div className="container mx-auto px-6 max-w-3xl">
        <div className="text-center mb-12">
          <h2 className={`text-4xl font-black mb-4 ${isDark ? 'text-white' : 'text-[#1F2937]'}`}>Frequently asked questions</h2>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full py-4 flex items-center justify-between text-left"
              >
                <span className={`font-bold text-lg ${isDark ? 'text-white' : 'text-[#1F2937]'}`}>{faq.q}</span>
                <ArrowRight className={`w-5 h-5 text-[#F97316] transition-transform ${openFaq === i ? 'rotate-90' : ''}`} />
              </button>
              {openFaq === i && (
                <div className={`pb-4 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const CTASection: React.FC<{ onSignup: (email?: string) => void }> = ({ onSignup }) => {
  const [email, setEmail] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      onSignup(email);
    }
  };

  return (
    <section className="py-24 bg-[#1F2937]">
      <div className="container mx-auto px-6 max-w-4xl text-center">
        <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
          Stop stressing. Start fixing.
        </h2>
        <p className="text-white/80 font-medium max-w-2xl mx-auto mb-10 text-xl">
          Whether it's a blinking router or a beeping thermostat, we're here to help. Text us now and get answers in minutes.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 justify-center max-w-xl mx-auto mb-4">
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 px-6 py-4 rounded-full text-[#1F2937] text-lg font-medium focus:outline-none focus:ring-2 focus:ring-[#F97316]"
            required
          />
          <button
            type="submit"
            className="bg-[#F97316] hover:bg-[#EA580C] text-white font-bold px-8 py-4 rounded-full text-lg transition-colors whitespace-nowrap"
          >
            Start Free Trial
          </button>
        </form>
        <p className="text-white/50 text-sm">No credit card required.</p>
      </div>
    </section>
  );
};


const Footer: React.FC<{ onNavigate: (view: PageView) => void }> = ({ onNavigate }) => {
  const links = {
    "What We Fix": ["Wi-Fi Issues", "TV & Streaming", "Computers", "Smart Home", "Appliances", "HVAC"],
    "Support Levels": ["Text Support", "AI Photo Triage", "Live Video Help", "Onsite Visits"],
    "Resources": ["Pricing", "DIY Guides", "Safety Center", "Blog", "Podcast", "Support"],
    "Company": ["Our Story", "Our Team", "Press", "Careers", "Contact", "Privacy"]
  };

  return (
    <footer className="bg-[#1F2937] pt-20 pb-10">
      <div className="container mx-auto px-6">
        <div className="mb-12">
          <button onClick={() => { onNavigate(PageView.HOME); window.scrollTo(0,0); }}>
            <Logo variant="light" />
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
          {Object.entries(links).map(([cat, items]) => (
            <div key={cat}>
              <h4 className="font-bold text-white mb-6 text-base">{cat}</h4>
              <ul className="space-y-3">
                {items.map(item => (
                  <li key={item}>
                    {item === "Instant Triage" ? (
                      <button onClick={() => { onNavigate(PageView.HOW_IT_WORKS); window.scrollTo(0,0); }} className="text-white/60 hover:text-[#F97316] text-base font-medium transition-colors">
                        {item}
                      </button>
                    ) : (
                      <a href="#" className="text-white/60 hover:text-[#F97316] text-base font-medium transition-colors">{item}</a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-white/40 text-sm font-medium">© 2026 TechTriage Inc. All rights reserved.</div>
          <div className="flex gap-6 text-white/40 text-sm font-medium">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Accessibility</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<PageView>(PageView.HOME);
  const [capturedEmail, setCapturedEmail] = useState('');
  const chatRef = useRef<ChatWidgetHandle>(null);

  const handleStart = () => {
    chatRef.current?.open("I'd like to start a free trial.");
  };

  const handleNavigateToSignup = (email?: string) => {
    if (email) setCapturedEmail(email);
    setCurrentView(PageView.SIGNUP);
    window.scrollTo(0, 0);
  };

  const handleNavigateToHowItWorks = () => {
    setCurrentView(PageView.HOW_IT_WORKS);
    window.scrollTo(0, 0);
  };

  const renderContent = () => {
    switch (currentView) {
      case PageView.HOW_IT_WORKS:
        return <HowItWorks onStart={handleStart} />;
      case PageView.PRICING:
        return <Pricing onStart={handleStart} onNavigate={setCurrentView} />;
      case PageView.SIGNUP:
        return <SignUp onStart={handleStart} initialEmail={capturedEmail} />;
      case PageView.LOGIN:
        return <Login onNavigate={setCurrentView} />;
      case PageView.HOME:
      default:
        return (
          <>
            <Hero onSignup={handleNavigateToSignup} onHowItWorks={handleNavigateToHowItWorks} />
            <SupportTiers onSignup={handleNavigateToSignup} />
            <HowItWorksSimple />
            <WhatWeHelpWith />
            <TrustSection />
            <TestimonialSection />
            <FAQSection />
            <CTASection onSignup={handleNavigateToSignup} />
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-white font-['Inter',sans-serif] text-[#1F2937]">
      <Header onNavigate={setCurrentView} currentView={currentView} />
      <main>
        {renderContent()}
      </main>
      <Footer onNavigate={setCurrentView} />
      <ChatWidget ref={chatRef} />
    </div>
  );
};

export default App;
