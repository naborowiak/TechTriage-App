import React, { useState, useRef } from 'react';
import { 
  Menu, X, ArrowRight, Shield, 
  Cpu, Home, Star, Play, Sparkles,
  Droplet, Tv, Wifi, Phone,
  Zap, Wrench, Lock, CheckCircle2
} from 'lucide-react';
import { ChatWidget, ChatWidgetHandle } from './components/ChatWidget';
import { Logo } from './components/Logo';
import { PageView } from './types';
import { HowItWorks } from './components/HowItWorks';
import { Pricing } from './components/Pricing';
import { SignUp } from './components/SignUp';

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

  const handleNav = (view: PageView) => {
    onNavigate(view);
    setMobileMenuOpen(false);
    window.scrollTo(0, 0);
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white shadow-md h-20">
      <div className="container mx-auto px-6 h-full flex items-center justify-between">
        <button onClick={() => handleNav(PageView.HOME)} className="focus:outline-none">
          <Logo variant="dark" />
        </button>
        
        <nav className="hidden lg:flex items-center gap-8">
          <button 
            onClick={() => handleNav(PageView.HOME)} 
            className={`${currentView === PageView.HOME ? 'text-[#F97316]' : 'text-[#1F2937] hover:text-[#F97316]'} transition-colors font-bold text-base`}
          >
            Product
          </button>
          <button 
            onClick={() => handleNav(PageView.HOW_IT_WORKS)} 
            className={`${currentView === PageView.HOW_IT_WORKS ? 'text-[#F97316]' : 'text-[#1F2937] hover:text-[#F97316]'} transition-colors font-bold text-base`}
          >
            How It Works
          </button>
          <button 
            onClick={() => handleNav(PageView.PRICING)}
            className={`${currentView === PageView.PRICING ? 'text-[#F97316]' : 'text-[#1F2937] hover:text-[#F97316]'} transition-colors font-bold text-base`}
          >
            Pricing
          </button>
          <button className="text-[#1F2937] hover:text-[#F97316] transition-colors font-bold text-base">Resources</button>
        </nav>

        <div className="hidden lg:flex items-center gap-6">
          <div className="flex items-center gap-2 text-[#1F2937] font-bold">
            <Phone className="w-5 h-5" />
            <span>1-800-TECH-FIX</span>
          </div>
          <div className="h-6 w-px bg-gray-300"></div>
          <button className="text-[#1F2937] hover:text-[#F97316] transition-colors font-bold">Log In</button>
          <Button variant="orange" onClick={() => handleNav(PageView.SIGNUP)} className="py-3 px-6 text-base">Get Started</Button>
        </div>

        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden text-[#1F2937] p-2">
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-20 left-0 w-full bg-white border-b border-gray-200 p-6 flex flex-col gap-6 shadow-xl">
          <button onClick={() => handleNav(PageView.HOME)} className="text-[#1F2937] font-bold text-lg text-left">Product</button>
          <button onClick={() => handleNav(PageView.HOW_IT_WORKS)} className="text-[#1F2937] font-bold text-lg text-left">How It Works</button>
          <button onClick={() => handleNav(PageView.PRICING)} className="text-[#1F2937] font-bold text-lg text-left">Pricing</button>
          <button className="text-[#1F2937] font-bold text-lg text-left">Resources</button>
          <hr className="border-gray-200" />
          <div className="flex items-center gap-2 text-[#1F2937] font-bold">
            <Phone className="w-5 h-5" />
            <span>1-800-TECH-FIX</span>
          </div>
          <button className="text-[#1F2937] font-bold text-lg text-left">Log In</button>
          <Button variant="orange" onClick={() => handleNav(PageView.SIGNUP)} className="w-full">Get Started</Button>
        </div>
      )}
    </header>
  );
};

const Hero: React.FC<{ onSignup: () => void; onPricing: () => void }> = ({ onSignup, onPricing }) => (
  <section className="relative pt-28 pb-16 lg:pt-32 lg:pb-24 bg-[#1F2937] overflow-hidden">
    <div className="container mx-auto px-6 relative z-10">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full mb-6">
            <span className="text-[#10B981] font-bold text-sm">SEE WHY 300K+ HOMEOWNERS</span>
            <span className="text-white/60 font-bold text-sm">TRUST TECHTRIAGE</span>
          </div>
          <h1 className="text-4xl lg:text-6xl font-black text-white tracking-tight leading-[1.1] mb-6">
            Run your home without the hassle.
          </h1>
          <p className="text-white/80 text-xl font-medium leading-relaxed mb-10 max-w-lg">
            The all-in-one support system for home maintenance and tech trouble. No truck roll required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="orange" onClick={onSignup}>
              Start Free Trial
            </Button>
            <Button variant="outline" onClick={onPricing}>
              View Pricing
            </Button>
          </div>
        </div>
        
        <div className="relative mt-8 lg:mt-0 flex justify-center lg:justify-end">
          <div className="relative z-10">
            <div className="relative mx-auto border-[#374151] bg-[#374151] border-[14px] rounded-[2.5rem] h-[500px] w-[260px] shadow-2xl">
              <div className="w-[120px] h-[18px] bg-[#374151] top-0 rounded-b-[1rem] left-1/2 -translate-x-1/2 absolute"></div>
              <div className="rounded-[2rem] overflow-hidden w-[232px] h-[472px] bg-white relative flex flex-col">
                <div className="bg-[#1F2937] h-28 p-5 pt-10 text-white shrink-0">
                  <div className="text-xs font-bold opacity-60 uppercase mb-1">Good Morning</div>
                  <div className="text-lg font-bold">Sarah Jenkins</div>
                </div>
                <div className="p-3 space-y-3 bg-[#F9FAFB] flex-1">
                  <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-lg relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#F97316]"></div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="bg-orange-50 text-[#F97316] px-2 py-0.5 rounded text-[10px] font-bold uppercase">Urgent</span>
                      <span className="text-xs font-bold text-gray-400">10:42 AM</span>
                    </div>
                    <h4 className="font-bold text-[#1F2937] text-sm">Furnace Diagnostic</h4>
                    <p className="text-xs text-gray-500">Strange noise reported</p>
                  </div>
                  
                  <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-lg">
                    <div className="flex justify-between items-start mb-2">
                      <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Maintenance</span>
                      <span className="text-xs font-bold text-gray-400">Upcoming</span>
                    </div>
                    <h4 className="font-bold text-[#1F2937] text-sm">Filter Replacement</h4>
                    <p className="text-xs text-gray-500">HVAC System Check</p>
                  </div>

                  <div className="mt-6 flex justify-center">
                    <div className="w-14 h-14 bg-[#F97316] rounded-full flex items-center justify-center shadow-lg shadow-orange-500/30">
                      <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const ValuePropBar: React.FC = () => (
  <section className="py-16 bg-white border-b border-gray-100">
    <div className="container mx-auto px-6 text-center max-w-5xl">
      <h2 className="text-3xl lg:text-4xl font-black text-[#1F2937] tracking-tight mb-8">
        The <span className="underline decoration-[#10B981] decoration-4 underline-offset-4">all-in-one</span> solution for home service pros
      </h2>
      <div className="flex flex-wrap justify-center gap-3 mb-12">
        {['Instant Fixes', 'DIY Guides', 'Live Experts', 'Track Everything'].map((tag, i) => (
          <span key={i} className={`px-6 py-3 text-base font-bold rounded-full transition-transform hover:-translate-y-1 cursor-pointer ${i === 0 ? 'bg-[#1F2937] text-white shadow-lg' : 'bg-[#F3F4F6] text-[#1F2937] hover:bg-[#E5E7EB]'}`}>
            {tag}
          </span>
        ))}
      </div>
    </div>
  </section>
);

const FeatureCards: React.FC = () => {
  const features = [
    { 
      title: "Stand out online", 
      desc: "Get found by local homeowners with your professional TechTriage listing. Showcase your expertise and build trust instantly.", 
      icon: <Star className="w-6 h-6" /> 
    },
    { 
      title: "Get instant answers", 
      desc: "Our AI identifies issues from a single photo. Get a diagnosis, parts list, and step-by-step fix in under 60 seconds.", 
      icon: <Zap className="w-6 h-6" /> 
    },
    { 
      title: "Attract and keep customers", 
      desc: "Build loyalty with maintenance reminders, warranty tracking, and proactive home health reports.", 
      icon: <Shield className="w-6 h-6" /> 
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <div key={i} className="group cursor-pointer bg-[#F9FAFB] p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2">
              <div className="mb-6 bg-[#1F2937] w-14 h-14 rounded-xl flex items-center justify-center text-white group-hover:bg-[#F97316] transition-colors">
                {f.icon}
              </div>
              <h3 className="text-2xl font-bold text-[#1F2937] mb-4">{f.title}</h3>
              <p className="text-gray-600 leading-relaxed text-lg mb-6">{f.desc}</p>
              <div className="flex items-center gap-2 text-[#1F2937] font-bold group-hover:text-[#F97316] transition-colors">
                Learn more <ArrowRight className="w-5 h-5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const StatsBand: React.FC<{ onSignup: () => void }> = ({ onSignup }) => (
  <section className="py-16 bg-[#1F2937] text-white">
    <div className="container mx-auto px-6 max-w-6xl">
      <div className="text-center mb-12">
        <h2 className="text-3xl lg:text-4xl font-black mb-4">
          Join over <span className="text-[#10B981]">300,000</span> home service pros who trust TechTriage
        </h2>
      </div>
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <div className="text-center">
          <div className="text-4xl font-black text-[#10B981] mb-2">2+ million</div>
          <p className="text-white/70 font-medium text-lg">Issues Resolved</p>
        </div>
        <div className="text-center">
          <div className="text-4xl font-black text-[#10B981] mb-2">300k+</div>
          <p className="text-white/70 font-medium text-lg">Happy Homeowners</p>
        </div>
        <div className="text-center">
          <div className="text-4xl font-black text-[#10B981] mb-2">4.8/5</div>
          <p className="text-white/70 font-medium text-lg">Average Rating</p>
        </div>
      </div>
      <div className="text-center">
        <Button variant="orange" onClick={onSignup} className="text-xl px-10 py-5">
          Start Free Trial
        </Button>
      </div>
    </div>
  </section>
);

const AISection: React.FC = () => (
  <section className="py-24 bg-[#F3F4F6]">
    <div className="container mx-auto px-6 max-w-6xl">
      <div className="text-center mb-16">
        <h2 className="text-4xl lg:text-5xl font-black text-[#1F2937] mb-6">
          AI built for blue collar businesses
        </h2>
        <p className="max-w-2xl mx-auto text-gray-600 text-xl">
          We combine cutting-edge vision AI with real human expertise to solve problems faster than ever before.
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-10">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Cpu className="w-8 h-8 text-blue-600" />
          </div>
          <h4 className="font-bold text-[#1F2937] mb-4 text-xl">Made for field pros</h4>
          <p className="text-gray-600 leading-relaxed text-lg">
            TechTriage AI recognizes thousands of appliance models, error codes, and parts instantly from a single photo.
          </p>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-[#F97316]" />
          </div>
          <h4 className="font-bold text-[#1F2937] mb-4 text-xl">Learns your style</h4>
          <p className="text-gray-600 leading-relaxed text-lg">
            Our system automatically adapts to your preferences, past fixes, and the specific systems in your home.
          </p>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8 text-purple-600" />
          </div>
          <h4 className="font-bold text-[#1F2937] mb-4 text-xl">Shows up when it matters</h4>
          <p className="text-gray-600 leading-relaxed text-lg">
            We predict failures before they happen, saving you thousands in emergency repairs with proactive alerts.
          </p>
        </div>
      </div>
      <div className="text-center mt-12">
        <Button variant="dark" className="px-10">Learn More</Button>
      </div>
    </div>
  </section>
);

const IndustriesGrid: React.FC = () => {
  const items = [
    { icon: <Wrench className="w-6 h-6"/>, label: "Plumbing" },
    { icon: <Zap className="w-6 h-6"/>, label: "Electrical" },
    { icon: <Cpu className="w-6 h-6"/>, label: "HVAC/Climate" },
    { icon: <Tv className="w-6 h-6"/>, label: "Appliances" },
    { icon: <Wifi className="w-6 h-6"/>, label: "Smart Home" },
    { icon: <Home className="w-6 h-6"/>, label: "Landscaping" },
    { icon: <Droplet className="w-6 h-6"/>, label: "Lawn Care" },
    { icon: <Lock className="w-6 h-6"/>, label: "Security" },
  ];

  return (
    <section className="py-24 bg-white border-t border-gray-100">
      <div className="container mx-auto px-6 max-w-5xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-black text-[#1F2937] mb-4">
            Proud partner to home services in over <span className="text-[#F97316]">50</span> industries
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {items.map((item, i) => (
            <div key={i} className="bg-[#F9FAFB] border border-gray-200 p-6 rounded-xl flex flex-col items-center gap-4 hover:shadow-xl transition-all cursor-pointer hover:border-[#F97316] group">
              <div className="text-[#1F2937] group-hover:text-[#F97316] transition-colors">{item.icon}</div>
              <span className="text-lg font-bold text-[#1F2937]">{item.label}</span>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <button className="flex items-center justify-center gap-2 mx-auto text-[#1F2937] font-bold text-lg hover:text-[#F97316] transition-colors">
            See all industries <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
};

const TestimonialSection: React.FC = () => (
  <section className="py-24 bg-[#F3F4F6]">
    <div className="container mx-auto px-6 max-w-4xl">
      <div className="bg-white p-10 md:p-14 rounded-2xl shadow-2xl border-l-8 border-[#10B981]">
        <p className="text-2xl md:text-3xl font-bold text-[#1F2937] mb-8 leading-relaxed">
          "TechTriage has taken a lot of stress off my shoulders. I can troubleshoot from my cell phone. I'm not tied to my office."
        </p>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gray-200 rounded-full overflow-hidden">
            <img src="https://i.pravatar.cc/150?u=homeowner" alt="User" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="font-bold text-[#1F2937] text-lg">Kelly Shelton</div>
            <div className="text-gray-500">Homeowner, St. Louis MO</div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const CTASection: React.FC<{ onSignup: () => void }> = ({ onSignup }) => (
  <section className="py-24 bg-[#1F2937]">
    <div className="container mx-auto px-6 max-w-4xl text-center">
      <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
        You've got this, and we've got your back.
      </h2>
      <p className="text-white/80 font-medium max-w-2xl mx-auto mb-12 text-xl">
        Your home is your most important asset. We're all in on providing the technology and support to make sure you win.
      </p>
      <Button variant="orange" onClick={onSignup} className="text-xl px-12 py-5">
        Start Free Trial
      </Button>
    </div>
  </section>
);

const SupportSection: React.FC = () => (
  <section className="py-24 bg-white border-t border-gray-100">
    <div className="container mx-auto px-6 max-w-6xl">
      <div className="text-center mb-16">
        <h2 className="text-4xl lg:text-5xl font-black text-[#1F2937] mb-4">
          Our business is supporting yours.
        </h2>
      </div>
      <div className="grid md:grid-cols-2 gap-12">
        <div>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Support</h3>
          <div className="space-y-6">
            <div>
              <h4 className="text-xl font-bold text-[#1F2937] flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
                Masters of Home Service
              </h4>
              <p className="text-gray-600 mt-2 ml-7 text-lg">
                Our support team has real experience running home service businesses. They get it.
              </p>
            </div>
            <div>
              <h4 className="text-xl font-bold text-[#1F2937] flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
                Free Tools
              </h4>
              <p className="text-gray-600 mt-2 ml-7 text-lg">
                Invoice templates, scheduling tools, and maintenance checklists—all free.
              </p>
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Education</h3>
          <div className="space-y-6">
            <div>
              <h4 className="text-xl font-bold text-[#1F2937] flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
                TechTriage Academy
              </h4>
              <p className="text-gray-600 mt-2 ml-7 text-lg">
                Free courses to help you get the most out of your home systems.
              </p>
            </div>
            <div>
              <h4 className="text-xl font-bold text-[#1F2937] flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
                TechTriage Summit
              </h4>
              <p className="text-gray-600 mt-2 ml-7 text-lg">
                Annual event bringing together the best minds in home technology.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const Footer: React.FC<{ onNavigate: (view: PageView) => void }> = ({ onNavigate }) => {
  const links = {
    "Industries We Serve": ["Plumbing", "Electrical", "HVAC", "Appliances", "Smart Home", "Security"],
    "Features": ["Instant Triage", "Video Support", "Maintenance Plans", "Home Health Report", "Warranty Tracker"],
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
  const chatRef = useRef<ChatWidgetHandle>(null);

  const handleStart = () => {
    chatRef.current?.open("I'd like to start a free trial.");
  };

  const handleNavigateToSignup = () => {
    setCurrentView(PageView.SIGNUP);
    window.scrollTo(0, 0);
  };

  const handleNavigateToPricing = () => {
    setCurrentView(PageView.PRICING);
    window.scrollTo(0, 0);
  };

  const renderContent = () => {
    switch (currentView) {
      case PageView.HOW_IT_WORKS:
        return <HowItWorks onStart={handleStart} />;
      case PageView.PRICING:
        return <Pricing onStart={handleStart} onNavigate={setCurrentView} />;
      case PageView.SIGNUP:
        return <SignUp onStart={handleStart} />;
      case PageView.HOME:
      default:
        return (
          <>
            <Hero onSignup={handleNavigateToSignup} onPricing={handleNavigateToPricing} />
            <ValuePropBar />
            <FeatureCards />
            <StatsBand onSignup={handleNavigateToSignup} />
            <AISection />
            <IndustriesGrid />
            <TestimonialSection />
            <CTASection onSignup={handleNavigateToSignup} />
            <SupportSection />
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-white font-['Poppins',sans-serif] text-[#1F2937]">
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
