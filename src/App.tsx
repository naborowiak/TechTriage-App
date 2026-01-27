import React, { useState, useRef } from 'react';
import { 
  Menu, X, ArrowRight, Shield, Video, 
  Cpu, Home, Star, Play, Sparkles,
  Search, Droplet, Tv, Wifi,
  User, Zap, Wrench, Lock
} from 'lucide-react';
import { ChatWidget, ChatWidgetHandle } from './components/ChatWidget';
import { Logo } from './components/Logo';
import { PageView } from './types';
import { HowItWorks } from './components/HowItWorks';

const Button: React.FC<{ 
  children: React.ReactNode; 
  variant?: 'orange' | 'outline' | 'dark' | 'white'; 
  className?: string; 
  onClick?: () => void 
}> = ({ children, variant = 'orange', className = '', onClick }) => {
  const variants = {
    orange: "bg-cta-500 hover:bg-cta-600 text-white border-2 border-transparent shadow-lg shadow-cta-500/20",
    outline: "bg-transparent border-2 border-white text-white hover:bg-white/10",
    dark: "bg-brand-900 text-white hover:bg-brand-800 border-2 border-transparent",
    white: "bg-white text-brand-900 hover:bg-gray-50 border-2 border-gray-200"
  };

  return (
    <button 
      onClick={onClick} 
      className={`px-8 py-3.5 rounded-md font-bold text-base transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Header: React.FC<{ 
  onStart: () => void; 
  onNavigate: (view: PageView) => void; 
  currentView: PageView 
}> = ({ onStart, onNavigate, currentView }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (view: PageView) => {
    onNavigate(view);
    setMobileMenuOpen(false);
    window.scrollTo(0, 0);
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-brand-900/95 backdrop-blur-md border-b border-white/10 h-20">
      <div className="container mx-auto px-6 h-full flex items-center justify-between">
        <button onClick={() => handleNav(PageView.HOME)} className="focus:outline-none">
          <Logo variant="light" />
        </button>
        
        <nav className="hidden lg:flex items-center gap-8 text-sm font-bold text-white/90">
          <button 
            onClick={() => handleNav(PageView.HOME)} 
            className={`${currentView === PageView.HOME ? 'text-cta-500' : 'hover:text-cta-500'} transition-colors uppercase tracking-wider text-[11px]`}
          >
            Product
          </button>
          <button 
            onClick={() => handleNav(PageView.HOW_IT_WORKS)} 
            className={`${currentView === PageView.HOW_IT_WORKS ? 'text-cta-500' : 'hover:text-cta-500'} transition-colors uppercase tracking-wider text-[11px]`}
          >
            How it works
          </button>
          <button className="hover:text-cta-500 transition-colors uppercase tracking-wider text-[11px]">Solutions</button>
          <button className="hover:text-cta-500 transition-colors uppercase tracking-wider text-[11px]">Resources</button>
          <div className="h-4 w-px bg-white/20 mx-2"></div>
          <button className="hover:text-cta-500 transition-colors uppercase tracking-wider text-[11px]">Log in</button>
          <Button variant="orange" onClick={onStart} className="py-2 px-5 text-sm rounded-full">Start Free Trial</Button>
        </nav>

        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden text-white p-2">
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-20 left-0 w-full bg-brand-900 border-b border-white/10 p-6 flex flex-col gap-6 shadow-2xl">
          <button onClick={() => handleNav(PageView.HOME)} className="text-white font-bold text-lg text-left">Product</button>
          <button onClick={() => handleNav(PageView.HOW_IT_WORKS)} className="text-white font-bold text-lg text-left">How it works</button>
          <button className="text-white font-bold text-lg text-left">Solutions</button>
          <button className="text-white font-bold text-lg text-left">Resources</button>
          <hr className="border-white/10" />
          <button className="text-white font-bold text-lg text-left">Log in</button>
          <Button variant="orange" onClick={() => { onStart(); setMobileMenuOpen(false); }} className="w-full">Start Free Trial</Button>
        </div>
      )}
    </header>
  );
};

const Hero: React.FC<{ onStart: () => void }> = ({ onStart }) => (
  <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 bg-brand-900 overflow-hidden">
    <div className="container mx-auto px-6 relative z-10">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div className="max-w-2xl">
          <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tight leading-[1.1] mb-8">
            Run your home <br/>with confidence.
          </h1>
          <p className="text-white/80 text-lg font-medium leading-relaxed mb-10 max-w-lg">
            Take back your weekend. TechTriage helps homeowners diagnose, fix, and manage home tech and systems—all from one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="orange" onClick={onStart}>Start Free Trial</Button>
            <Button variant="outline" onClick={onStart}>View Demo</Button>
          </div>
          <div className="mt-8 flex items-center gap-2 text-white/60 text-sm font-bold">
            <div className="flex text-cta-500">
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
            </div>
            <span>4.8/5 from 12,000+ reviews</span>
          </div>
        </div>
        
        <div className="relative mt-12 lg:mt-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-cta-500/10 blur-[120px] rounded-full pointer-events-none"></div>
          <div className="relative z-10 animate-float">
             <div className="relative mx-auto border-brand-800 bg-brand-800 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-2xl">
                <div className="w-[148px] h-[18px] bg-brand-800 top-0 rounded-b-[1rem] left-1/2 -translate-x-1/2 absolute"></div>
                <div className="rounded-[2rem] overflow-hidden w-[272px] h-[572px] bg-white relative flex flex-col">
                   <div className="bg-brand-900 h-32 p-6 pt-12 text-white shrink-0">
                      <div className="text-xs font-bold opacity-60 uppercase mb-1">Good Morning</div>
                      <div className="text-xl font-bold">Sarah Jenkins</div>
                   </div>
                   <div className="p-4 space-y-4 bg-gray-50 flex-1">
                      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden">
                         <div className="absolute left-0 top-0 bottom-0 w-1 bg-cta-500"></div>
                         <div className="flex justify-between items-start mb-2">
                            <span className="bg-cta-50 text-cta-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Urgent</span>
                            <span className="text-xs font-bold text-gray-400">10:42 AM</span>
                         </div>
                         <h4 className="font-bold text-brand-900">Furnace Diagnostic</h4>
                         <p className="text-xs text-gray-500">Strange noise reported</p>
                      </div>
                      
                      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                         <div className="flex justify-between items-start mb-2">
                            <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Maintenance</span>
                            <span className="text-xs font-bold text-gray-400">Upcoming</span>
                         </div>
                         <h4 className="font-bold text-brand-900">Filter Replacement</h4>
                         <p className="text-xs text-gray-500">HVAC System Check</p>
                      </div>

                      <div className="mt-8 flex justify-center">
                         <div className="w-16 h-16 bg-cta-500 rounded-full flex items-center justify-center shadow-lg shadow-cta-500/30 animate-pulse">
                            <Play className="w-6 h-6 fill-white text-white ml-1" />
                         </div>
                      </div>
                   </div>
                   <div className="h-16 bg-white border-t border-gray-100 flex items-center justify-around text-gray-400">
                      <Home className="w-5 h-5 text-brand-900" />
                      <Search className="w-5 h-5" />
                      <User className="w-5 h-5" />
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const ValueProp: React.FC = () => (
  <section className="py-24 bg-brand-50 bg-paper-texture">
    <div className="container mx-auto px-6 text-center max-w-4xl">
       <h2 className="text-4xl lg:text-5xl font-black text-brand-900 tracking-tight mb-8">
         The <span className="underline decoration-cta-500 decoration-8 underline-offset-4">all-in-one</span> solution for home service support
       </h2>
       <div className="flex flex-wrap justify-center gap-2 mb-12">
          {['Instant Fixes', 'Find Pros', 'Save Money', 'Track Health'].map((tag, i) => (
             <span key={i} className={`px-5 py-2 text-sm font-bold uppercase tracking-wide rounded-sm transition-transform hover:-translate-y-1 ${i === 0 ? 'bg-cta-500 text-white shadow-lg shadow-cta-500/20' : 'bg-white text-gray-600 border border-gray-200'}`}>
                {tag}
             </span>
          ))}
       </div>
    </div>
  </section>
);

const FeatureSection: React.FC = () => {
  const features = [
    { title: "Instant AI Triage", desc: "Don't wait on hold. Snap a photo of any issue and get an immediate diagnosis and safety assessment.", icon: <Zap className="w-6 h-6 text-cta-500" /> },
    { title: "Live Expert Video", desc: "Connect with a certified pro in seconds. They see what you see and guide you to a fix step-by-step.", icon: <Video className="w-6 h-6 text-cta-500" /> },
    { title: "Total Home Health", desc: "Track warranties, service history, and maintenance schedules for every appliance in your home.", icon: <Shield className="w-6 h-6 text-cta-500" /> }
  ];

  return (
    <section className="py-24 bg-brand-50 bg-paper-texture pt-0">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid md:grid-cols-3 gap-12">
          {features.map((f, i) => (
             <div key={i} className="group cursor-pointer bg-white p-8 rounded-xl border border-gray-100 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="mb-6 bg-cta-50 w-12 h-12 rounded-lg flex items-center justify-center group-hover:bg-cta-500 group-hover:text-white transition-colors">
                  {React.cloneElement(f.icon as React.ReactElement<{ className?: string }>, { className: "w-6 h-6 text-cta-500 group-hover:text-white transition-colors" })}
                </div>
                <h3 className="text-2xl font-bold text-brand-900 mb-4">{f.title}</h3>
                <p className="text-gray-500 leading-relaxed mb-6 font-medium">{f.desc}</p>
                <div className="flex items-center gap-2 text-brand-900 font-bold text-sm group-hover:text-cta-600 transition-colors">
                   Learn more <ArrowRight className="w-4 h-4" />
                </div>
             </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const StatsBand: React.FC<{ onStart: () => void }> = ({ onStart }) => (
  <section className="py-24 bg-brand-900 text-white text-center border-t border-white/5">
    <div className="container mx-auto px-6 max-w-5xl">
       <h2 className="text-3xl lg:text-4xl font-black mb-16">
          Join over <span className="underline decoration-cta-500 decoration-4 underline-offset-8">50,000</span> homeowners who trust TechTriage
       </h2>
       <div className="grid md:grid-cols-3 gap-12 mb-20">
          <div>
             <div className="inline-block bg-white/10 px-4 py-1 rounded-sm text-2xl font-black mb-4">150,000+</div>
             <p className="text-white/70 font-medium text-sm">Issues Resolved Remotely</p>
          </div>
          <div>
             <div className="inline-block bg-white/10 px-4 py-1 rounded-sm text-2xl font-black mb-4">$5M+</div>
             <p className="text-white/70 font-medium text-sm">Saved in Service Fees</p>
          </div>
          <div>
             <div className="inline-block bg-white/10 px-4 py-1 rounded-sm text-2xl font-black mb-4">4.8/5</div>
             <p className="text-white/70 font-medium text-sm">Average Customer Rating</p>
          </div>
       </div>
       <div className="max-w-xl mx-auto flex flex-col sm:flex-row gap-0">
          <input type="email" placeholder="Email Address" className="flex-1 px-6 py-4 text-brand-900 font-medium outline-none rounded-t-md sm:rounded-l-md sm:rounded-tr-none border-2 border-transparent focus:border-cta-500 transition-colors" />
          <button onClick={onStart} className="bg-cta-500 hover:bg-cta-600 text-white font-bold px-8 py-4 rounded-b-md sm:rounded-r-md sm:rounded-bl-none transition-colors shadow-lg shadow-cta-500/20">
             Start Free Trial
          </button>
       </div>
       <p className="mt-4 text-xs text-white/40 font-bold uppercase tracking-wide">Put TechTriage to work for you. No credit card required.</p>
    </div>
  </section>
);

const AISection: React.FC = () => (
   <section className="py-32 bg-white">
      <div className="container mx-auto px-6 max-w-7xl">
         <div className="text-center mb-20">
            <h2 className="text-4xl font-black text-brand-900 mb-6">
               <span className="underline decoration-brand-900 decoration-4 underline-offset-4">AI</span> built for the modern home
            </h2>
            <p className="max-w-2xl mx-auto text-gray-500 text-lg">We combine cutting-edge vision AI with real human expertise to solve problems faster than ever before.</p>
         </div>
         <div className="grid md:grid-cols-3 gap-12 text-center">
            <div className="p-6">
               <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Cpu className="w-8 h-8 text-blue-600" />
               </div>
               <h4 className="font-bold text-brand-900 mb-4 text-xl">Instant Identification</h4>
               <p className="text-sm text-gray-500 leading-relaxed mb-6">TechTriage AI recognizes thousands of appliance models, error codes, and parts instantly from a single photo.</p>
            </div>
            <div className="p-6">
               <div className="w-16 h-16 bg-cta-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-8 h-8 text-cta-500" />
               </div>
               <h4 className="font-bold text-brand-900 mb-4 text-xl">Safety Protocols</h4>
               <p className="text-sm text-gray-500 leading-relaxed mb-6">Our system automatically flags dangerous situations like exposed wiring or gas leaks before you proceed.</p>
            </div>
            <div className="p-6">
               <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-8 h-8 text-purple-600" />
               </div>
               <h4 className="font-bold text-brand-900 mb-4 text-xl">Predictive Maintenance</h4>
               <p className="text-sm text-gray-500 leading-relaxed mb-6">We learn your home's systems to predict failures before they happen, saving you thousands in emergency repairs.</p>
            </div>
         </div>
         <div className="text-center mt-12">
            <Button variant="dark" className="px-10 rounded-full">Explore AI Features</Button>
         </div>
      </div>
   </section>
);

const IndustriesGrid: React.FC = () => {
   const items = [
      { icon: <Wrench className="w-5 h-5"/>, label: "Plumbing" },
      { icon: <Zap className="w-5 h-5"/>, label: "Electrical" },
      { icon: <Cpu className="w-5 h-5"/>, label: "HVAC" },
      { icon: <Tv className="w-5 h-5"/>, label: "Appliances" },
      { icon: <Wifi className="w-5 h-5"/>, label: "Smart Home" },
      { icon: <Home className="w-5 h-5"/>, label: "Roofing" },
      { icon: <Droplet className="w-5 h-5"/>, label: "Irrigation" },
      { icon: <Lock className="w-5 h-5"/>, label: "Security" },
   ];

   return (
      <section className="py-24 bg-brand-50 bg-paper-texture border-t border-gray-200">
         <div className="container mx-auto px-6 max-w-5xl">
            <h2 className="text-4xl font-black text-center text-brand-900 mb-20">
               Supporting every <br/>major <span className="underline decoration-cta-500 decoration-8 underline-offset-4">home system</span>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {items.map((item, i) => (
                  <div key={i} className="bg-white border border-gray-200 p-6 rounded-lg flex flex-col items-center gap-3 hover:shadow-lg transition-all cursor-pointer hover:border-cta-500 group">
                     <div className="text-gray-400 group-hover:text-cta-500 transition-colors">{item.icon}</div>
                     <span className="text-sm font-bold text-brand-900">{item.label}</span>
                  </div>
               ))}
            </div>
            <div className="text-center mt-12 flex items-center justify-center gap-2 text-brand-900 font-bold text-sm">
               See all categories <ArrowRight className="w-4 h-4 text-cta-500" />
            </div>
         </div>
      </section>
   );
};

const CTASection: React.FC<{ onStart: () => void }> = ({ onStart }) => (
   <section className="bg-brand-900 relative py-32 overflow-hidden">
      <div className="container mx-auto px-6 max-w-4xl text-center relative z-10">
         <div className="bg-white p-8 md:p-12 rounded-lg text-left shadow-2xl mb-16 transform -rotate-1 mx-auto max-w-2xl border-l-8 border-cta-500">
            <h3 className="text-xl md:text-2xl font-bold text-brand-900 mb-4 leading-relaxed">
               "TechTriage saved me a $300 plumber visit on a Sunday. I fixed my disposal in 5 minutes with their video help. Unbelievable."
            </h3>
            <div className="text-sm flex items-center gap-3">
               <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
                 <img src="https://i.pravatar.cc/150?u=mitchell" alt="User" />
               </div>
               <div>
                 <div className="font-bold text-brand-900">Kelly Shelton</div>
                 <div className="text-gray-500">Homeowner, St. Louis MO</div>
               </div>
            </div>
         </div>
         
         <h2 className="text-3xl md:text-4xl font-black text-white mb-6">
            You've got this, and we've got your back.
         </h2>
         <p className="text-white/80 font-medium max-w-2xl mx-auto mb-12 text-lg">
            Your home is your most important asset. We're all in on providing the technology and support to make sure you win.
         </p>

         <div className="max-w-xl mx-auto flex flex-col sm:flex-row gap-0">
            <input type="email" placeholder="Email Address" className="flex-1 px-6 py-4 text-brand-900 font-medium outline-none rounded-t-md sm:rounded-l-md sm:rounded-tr-none" />
            <button onClick={onStart} className="bg-cta-500 hover:bg-cta-600 text-white font-bold px-8 py-4 rounded-b-md sm:rounded-r-md sm:rounded-bl-none transition-colors shadow-lg">
               Start Free Trial
            </button>
         </div>
         <p className="mt-4 text-xs text-white/40 font-bold uppercase tracking-wide">Put TechTriage to work for you. No credit card required.</p>
      </div>
   </section>
);

const Footer: React.FC<{ onNavigate: (view: PageView) => void }> = ({ onNavigate }) => {
   const links = {
      "Services": ["Plumbing", "Electrical", "HVAC", "Appliances", "Smart Home", "Security"],
      "Features": ["Instant Triage", "Video Support", "Maintenance Plans", "Home Health Report", "Warranty Tracker"],
      "Resources": ["Pricing", "DIY Guides", "Safety Center", "Blog", "Podcast", "Support"],
      "Company": ["Our Story", "Our Team", "Press", "Careers", "Contact", "Privacy"]
   };

   return (
      <footer className="bg-brand-900 pt-24 pb-12 border-t border-white/10">
         <div className="container mx-auto px-6">
             <div className="mb-16">
                <button onClick={() => { onNavigate(PageView.HOME); window.scrollTo(0,0); }}>
                  <Logo variant="light" />
                </button>
             </div>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-20">
                {Object.entries(links).map(([cat, items]) => (
                   <div key={cat}>
                      <h4 className="font-bold text-white mb-6 text-sm uppercase tracking-wider">{cat}</h4>
                      <ul className="space-y-3">
                         {items.map(item => (
                            <li key={item}>
                              {item === "Instant Triage" ? (
                                <button onClick={() => { onNavigate(PageView.HOW_IT_WORKS); window.scrollTo(0,0); }} className="text-white/60 hover:text-cta-500 text-sm font-medium transition-colors">
                                  {item}
                                </button>
                              ) : (
                                <a href="#" className="text-white/60 hover:text-cta-500 text-sm font-medium transition-colors">{item}</a>
                              )}
                            </li>
                         ))}
                      </ul>
                   </div>
                ))}
             </div>
             <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-white/40 text-xs font-bold">© 2026 TechTriage Inc. Privacy. Accessibility. Terms.</div>
                <div className="flex gap-4">
                    <div className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center hover:bg-cta-500 transition-colors cursor-pointer text-white/60 hover:text-white"><span className="font-bold">X</span></div>
                    <div className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center hover:bg-cta-500 transition-colors cursor-pointer text-white/60 hover:text-white"><span className="font-bold">In</span></div>
                    <div className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center hover:bg-cta-500 transition-colors cursor-pointer text-white/60 hover:text-white"><span className="font-bold">Fb</span></div>
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

  const renderContent = () => {
    switch (currentView) {
      case PageView.HOW_IT_WORKS:
        return <HowItWorks onStart={handleStart} />;
      case PageView.HOME:
      default:
        return (
          <>
            <Hero onStart={handleStart} />
            <ValueProp />
            <FeatureSection />
            <StatsBand onStart={handleStart} />
            <AISection />
            <IndustriesGrid />
            <CTASection onStart={handleStart} />
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-brand-900">
      <Header onStart={handleStart} onNavigate={setCurrentView} currentView={currentView} />
      
      <main>
        {renderContent()}
      </main>

      <Footer onNavigate={setCurrentView} />
      
      <ChatWidget ref={chatRef} />
    </div>
  );
};

export default App;
