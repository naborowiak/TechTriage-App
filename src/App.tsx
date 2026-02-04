import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Menu,
  X,
  ArrowRight,
  Home,
  Star,
  Video,
  Tv,
  Wifi,
  Phone,
  CheckCircle2,
  LogOut,
  User,
  Smartphone,
  Monitor,
  Printer,
  MessageSquare,
  Camera,
  Zap,
  Clock,
  PhoneOff,
  Radar,
} from "lucide-react";
import { ChatWidget, ChatWidgetHandle } from "./components/ChatWidget";
import { Logo, ScoutLogo, ScoutSignalIcon } from "./components/Logo";
import { PageView } from "./types";
import { HowItWorks } from "./components/HowItWorks";
import { Pricing } from "./components/Pricing";
import { FAQ } from "./components/FAQ";
import { SignUp } from "./components/SignUp";
import { Login } from "./components/Login";
import { Dashboard } from "./components/Dashboard";
import { SessionHistory } from "./components/SessionHistory";
import { Settings } from "./components/Settings";
import { BillingManagement } from "./components/BillingManagement";
import { PrivacyPolicy } from "./components/PrivacyPolicy";
import { TermsOfService } from "./components/TermsOfService";
import { CancellationPolicy } from "./components/CancellationPolicy";
import { useAuth } from "./hooks/useAuth";
import { LiveSupport } from "./components/LiveSupport";
import { VerifyEmail } from "./components/VerifyEmail";
import { ForgotPassword } from "./components/ForgotPassword";
import { ResetPassword } from "./components/ResetPassword";
import { useSyncUsageWithAuth } from "./stores/usageStore";
import { useSubscription } from "./hooks/useSubscription";

const Button: React.FC<{
  children: React.ReactNode;
  variant?: "electric" | "outline" | "outlineElectric" | "dark" | "scout";
  className?: string;
  onClick?: () => void;
}> = ({ children, variant = "electric", className = "", onClick }) => {
  const variants = {
    electric:
      "btn-gradient-electric text-white shadow-lg shadow-electric-indigo/30 hover:shadow-electric-indigo/50 hover:brightness-110",
    outline:
      "bg-transparent border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50",
    outlineElectric:
      "bg-transparent border-2 border-electric-indigo text-electric-indigo hover:bg-electric-indigo/10",
    dark: "bg-midnight-800 text-white hover:bg-midnight-700 border border-midnight-700",
    scout:
      "bg-gradient-to-r from-scout-purple to-electric-indigo text-white shadow-lg shadow-scout-purple/30 hover:shadow-scout-purple/50 hover:brightness-110",
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
  currentView: PageView;
}> = ({ onNavigate, currentView }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  const handleNav = (view: PageView) => {
    onNavigate(view);
    setMobileMenuOpen(false);
    window.scrollTo(0, 0);
  };

  const handleGoogleLogin = () => {
    window.location.href = "/auth/google";
  };

  // Always dark theme for header
  const textColor = "text-white";
  const textColorMuted = "text-text-secondary";
  const hoverColor = "hover:text-electric-indigo";

  return (
    <header className="fixed top-0 left-0 w-full z-50 h-[72px] bg-midnight-950/95 backdrop-blur-md border-b border-midnight-700/50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 h-full flex items-center justify-between">
        {/* LEFT: Logo */}
        <button
          onClick={() => handleNav(PageView.HOME)}
          className="focus:outline-none shrink-0"
        >
          <Logo variant="light" />
        </button>

        {/* CENTER: Primary Navigation */}
        <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
          <button
            onClick={() => handleNav(PageView.HOW_IT_WORKS)}
            className={`whitespace-nowrap ${currentView === PageView.HOW_IT_WORKS ? "text-electric-indigo" : `${textColor} ${hoverColor}`} transition-colors font-semibold text-[15px]`}
          >
            How It Works
          </button>
          <button
            onClick={() => handleNav(PageView.PRICING)}
            className={`whitespace-nowrap ${currentView === PageView.PRICING ? "text-electric-indigo" : `${textColor} ${hoverColor}`} transition-colors font-semibold text-[15px]`}
          >
            Pricing
          </button>
          <button
            onClick={() => handleNav(PageView.FAQ)}
            className={`whitespace-nowrap ${currentView === PageView.FAQ ? "text-electric-indigo" : `${textColor} ${hoverColor}`} transition-colors font-semibold text-[15px]`}
          >
            FAQs
          </button>
        </nav>

        {/* RIGHT: Utility items */}
        <div className="hidden lg:flex items-center gap-5 shrink-0">
          {/* Auth section */}
          {isLoading ? (
            <div className={`${textColorMuted} text-sm`}>...</div>
          ) : isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {user.profileImageUrl ? (
                  <img
                    src={user.profileImageUrl}
                    alt={user.firstName || "User"}
                    className="w-7 h-7 rounded-full object-cover ring-2 ring-electric-indigo/50"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-scout-purple to-electric-indigo flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <span className={`${textColorMuted} text-sm font-medium hidden xl:inline`}>
                  {user.firstName || "User"}
                </span>
              </div>
              <button
                onClick={logout}
                className={`${textColorMuted} ${hoverColor} transition-colors text-sm font-medium flex items-center gap-1`}
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden xl:inline">Logout</span>
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => onNavigate(PageView.LOGIN)}
                className={`${textColorMuted} ${hoverColor} transition-colors text-sm font-medium whitespace-nowrap`}
              >
                Log In
              </button>
              <button
                onClick={() => onNavigate(PageView.SIGNUP)}
                className="btn-gradient-electric text-white font-semibold px-6 py-2.5 rounded-full text-sm transition-all whitespace-nowrap hover:shadow-glow-electric hover:brightness-110"
              >
                Get Started
              </button>
            </>
          )}
        </div>

        {/* Mobile: Hamburger + CTA */}
        <div className="flex lg:hidden items-center gap-3">
          <button
            onClick={() => onNavigate(PageView.SIGNUP)}
            className="btn-gradient-electric text-white font-semibold px-4 py-2 rounded-full text-sm transition-all"
          >
            Get Started
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`${textColor} p-2`}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-[72px] left-0 w-full bg-midnight-900 border-b border-midnight-700 p-6 flex flex-col gap-5 shadow-xl">
          <button
            onClick={() => handleNav(PageView.HOW_IT_WORKS)}
            className="text-white font-semibold text-base text-left hover:text-electric-indigo transition-colors"
          >
            How It Works
          </button>
          <button
            onClick={() => handleNav(PageView.PRICING)}
            className="text-white font-semibold text-base text-left hover:text-electric-indigo transition-colors"
          >
            Pricing
          </button>
          <button
            onClick={() => handleNav(PageView.FAQ)}
            className="text-white font-semibold text-base text-left hover:text-electric-indigo transition-colors"
          >
            FAQs
          </button>

          <hr className="border-midnight-700" />

          {isAuthenticated && user ? (
            <>
              <div className="flex items-center gap-2 text-white font-medium">
                {user.profileImageUrl ? (
                  <img
                    src={user.profileImageUrl}
                    alt={user.firstName || "User"}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-electric-indigo/50"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-scout-purple to-electric-indigo flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
                <span>{user.firstName || user.email || "User"}</span>
              </div>
              <button
                onClick={logout}
                className="text-text-secondary hover:text-electric-indigo font-medium text-left flex items-center gap-2 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={handleGoogleLogin}
              className="text-text-secondary hover:text-electric-indigo font-medium text-left transition-colors"
            >
              Log In
            </button>
          )}
        </div>
      )}
    </header>
  );
};

const Hero: React.FC<{ onFreeTrial: () => void; onPricing: () => void }> = ({
  onFreeTrial,
  onPricing,
}) => (
  <section className="relative pt-[72px] min-h-screen overflow-hidden bg-midnight-950">
    {/* Background hero image */}
    <div
      className="absolute inset-0 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url(/hero-image-large.jpg)" }}
    >
      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-midnight-950/95 via-midnight-950/90 to-midnight-950/70"></div>
    </div>

    {/* Gradient orbs for visual interest */}
    <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-electric-indigo/20 rounded-full blur-3xl"></div>
    <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-scout-purple/15 rounded-full blur-3xl"></div>

    <div className="container mx-auto px-6 lg:px-12 relative z-10">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center min-h-[calc(100vh-72px)]">
        {/* Left side - Content */}
        <div className="pt-8 lg:pt-0">
          <div className="inline-flex items-center gap-2 bg-electric-indigo/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-electric-indigo/30">
            <ScoutSignalIcon size={18} animate={true} />
            <span className="text-white font-semibold text-sm">
              Scout AI available 24/7
            </span>
          </div>
          <h1 className="text-4xl lg:text-5xl xl:text-6xl font-black text-white tracking-tight leading-[1.1] mb-6">
            Fix your tech in minutes
            <br />
            <span className="text-gradient-electric">— with Scout AI.</span>
          </h1>
          <p className="text-text-secondary text-xl lg:text-2xl font-medium leading-relaxed mb-10 max-w-lg">
            TotalAssist's instant guidance via chat, snapshot, and live signal. No hold music, no phone trees.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <Button
              variant="electric"
              onClick={onFreeTrial}
              className="text-lg px-10"
            >
              Get Started
            </Button>
            <Button
              variant="outline"
              onClick={onPricing}
              className="text-lg px-10"
            >
              Explore Pricing
            </Button>
          </div>
          <div className="flex items-center gap-6 text-sm text-text-secondary">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-electric-cyan" />
              <span>No credit card needed</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-electric-cyan" />
              <span>24/7 instant answers</span>
            </div>
          </div>
        </div>

        {/* Right side - empty to let the background image show */}
        <div className="hidden lg:block"></div>
      </div>
    </div>
  </section>
);

const HowItWorksSimple: React.FC = () => {
  const steps = [
    {
      step: "1.",
      title: "Tell Us",
      desc: '"My Wi-Fi keeps dropping" or "There\'s a weird error code"—just describe it like you would to a friend. TotalAssist speaks human.',
      icon: <MessageSquare className="w-7 h-7" />,
    },
    {
      step: "2.",
      title: "Show what's happening",
      desc: "Snap a photo of that blinking light, share your screen, or start a video walkthrough. TotalAssist analyzes it instantly.",
      icon: <Camera className="w-7 h-7" />,
    },
    {
      step: "3.",
      title: "Get guided to a fix",
      desc: "No more Googling for 2 hours. TotalAssist guides you step-by-step until it's working—most issues resolved in minutes.",
      icon: <CheckCircle2 className="w-7 h-7" />,
    },
  ];

  return (
    <section className="py-24 bg-midnight-900 noise-texture noise-texture-subtle">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center mb-16">
          <span className="inline-block text-electric-indigo font-bold text-sm uppercase tracking-wider mb-4">
            How It Works
          </span>
          <h2 className="text-4xl lg:text-5xl font-black mb-6 text-white">
            Help that actually helps
          </h2>
          <p className="text-xl max-w-2xl mx-auto text-text-secondary">
            No hold music. No "have you tried turning it off and on again." Just
            clear answers and real solutions.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((s, i) => (
            <div key={i} className="relative">
              {/* Connector line */}
              {i < 2 && (
                <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-electric-indigo to-transparent"></div>
              )}
              <div className="relative rounded-2xl p-8 bg-midnight-800 border border-midnight-700 hover:border-electric-indigo/50 transition-colors">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-scout-purple to-electric-indigo rounded-2xl flex items-center justify-center text-white shadow-lg shadow-scout-purple/30">
                    {s.icon}
                  </div>
                  <span className="text-5xl font-black text-white/10">
                    {s.step}
                  </span>
                </div>
                <h3 className="text-xl font-black mb-3 text-white">
                  {s.title}
                </h3>
                <p className="leading-relaxed text-text-secondary">
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const WhatWeHelpWith: React.FC = () => {
  const problems = [
    {
      icon: <Wifi className="w-8 h-8" />,
      label: "Wi-Fi",
      desc: "Slow speeds, dead zones, drops",
    },
    {
      icon: <Tv className="w-8 h-8" />,
      label: "TV",
      desc: "Setup, apps, streaming",
    },
    {
      icon: <Monitor className="w-8 h-8" />,
      label: "Laptop",
      desc: "Performance, updates, software",
    },
    {
      icon: <Home className="w-8 h-8" />,
      label: "Smart Home",
      desc: "Alexa, Google, Ring, Nest",
    },
    {
      icon: <Smartphone className="w-8 h-8" />,
      label: "Phone",
      desc: "Setup, syncing, apps",
    },
    {
      icon: <Printer className="w-8 h-8" />,
      label: "Printers",
      desc: "Setup, connectivity, drivers",
    },
  ];

  return (
    <section className="py-24 bg-midnight-950 noise-texture">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center mb-16">
          <span className="inline-block text-electric-indigo font-bold text-sm uppercase tracking-wider mb-4">
            What We Help With
          </span>
          <h2 className="text-4xl lg:text-5xl font-black mb-6 text-white">
            Technology support for your home
          </h2>
          <p className="text-xl max-w-2xl mx-auto text-text-secondary">
            From Wi-Fi troubles to smart home setup—TotalAssist helps with the tech that
            keeps your home running.
          </p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {problems.map((item, i) => (
            <div
              key={i}
              className="group p-5 rounded-2xl transition-all duration-300 cursor-pointer hover:-translate-y-1 bg-midnight-800 border border-midnight-700 hover:border-electric-indigo/50 hover:shadow-glow-electric"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all bg-midnight-700 text-electric-indigo group-hover:bg-gradient-to-br group-hover:from-electric-indigo group-hover:to-electric-cyan group-hover:text-white">
                {item.icon}
              </div>
              <h3 className="font-bold text-base mb-1 text-white">
                {item.label}
              </h3>
              <p className="text-sm text-text-muted">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const WhyTotalAssist: React.FC = () => {
  const traditionalPains = [
    {
      icon: <Phone className="w-5 h-5" />,
      text: "Press 1 for billing, 2 for...",
    },
    {
      icon: <Clock className="w-5 h-5" />,
      text: "Your wait time is 47 minutes",
    },
    {
      icon: <PhoneOff className="w-5 h-5" />,
      text: "Call disconnected. Start over.",
    },
  ];

  const scoutModes = [
    {
      icon: <MessageSquare className="w-5 h-5" />,
      label: "Scout Chat",
      desc: "Quick questions — instant answers.",
    },
    {
      icon: <Camera className="w-5 h-5" />,
      label: "Scout Snapshot",
      desc: "Snap a photo of an error. Scout identifies the fix.",
    },
    {
      icon: <Radar className="w-5 h-5" />,
      label: "Scout Signal",
      desc: "Describe the issue out loud. Scout turns it into a plan.",
    },
    {
      icon: <Video className="w-5 h-5" />,
      label: "Video Diagnostic",
      desc: "Upload a video for an AI-powered diagnostic report.",
    },
  ];

  const benefits = [
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Instant Guidance",
      desc: "No hold music. No phone trees. Just describe your issue and get clear, step-by-step guidance in seconds.",
    },
    {
      icon: <Camera className="w-8 h-8" />,
      title: "Snapshot + Scout AI",
      desc: "Snap a photo of that blinking light or error code. Scout analyzes it instantly—no confusing descriptions needed.",
    },
    {
      icon: <CheckCircle2 className="w-8 h-8" />,
      title: "Remote-First Fixes",
      desc: "Most issues are resolved without anyone stepping foot in your home. Onsite visits only if absolutely necessary.",
    },
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-midnight-950 to-midnight-900 text-white overflow-hidden noise-texture noise-texture-strong">
      <div className="container mx-auto px-6 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block text-electric-indigo font-bold text-sm uppercase tracking-wider mb-4">
            Comparison
          </span>
          <h2 className="text-4xl lg:text-5xl font-black mb-6 leading-tight">
            Tech support that actually works
          </h2>
          <p className="text-text-secondary text-xl max-w-2xl mx-auto">
            We built Scout AI because everyone deserves help that's instant,
            clear, and doesn't waste your time.
          </p>
        </div>

        {/* Comparison Section */}
        <div className="grid lg:grid-cols-2 gap-8 mb-20">
          {/* Traditional Support - Left */}
          <div className="relative">
            <div className="absolute inset-0 bg-red-500/5 rounded-3xl"></div>
            <div className="relative bg-midnight-800/50 backdrop-blur border border-midnight-700 rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                  <PhoneOff className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-text-secondary">
                  Traditional Support
                </h3>
              </div>
              <div className="space-y-4">
                {traditionalPains.map((pain, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-4 bg-midnight-900/50 rounded-xl border border-midnight-700"
                  >
                    <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center text-red-400">
                      {pain.icon}
                    </div>
                    <span className="text-text-muted font-medium">
                      {pain.text}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-midnight-700">
                <div className="flex items-center gap-2 text-text-muted text-sm">
                  <Clock className="w-4 h-4" />
                  <span>Average wait: 20-45 minutes</span>
                </div>
              </div>
            </div>
          </div>

          {/* TotalAssist + Scout AI - Right */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-electric-indigo/10 to-scout-purple/5 rounded-3xl"></div>
            <div className="relative bg-midnight-800/50 backdrop-blur border border-electric-indigo/30 rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-midnight-900/50 rounded-xl flex items-center justify-center">
                  <ScoutLogo size={32} />
                </div>
                <h3 className="text-xl font-bold text-white">Scout AI</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {scoutModes.map((solution, i) => (
                  <div
                    key={i}
                    className="p-4 bg-midnight-900/50 rounded-xl border border-midnight-700 hover:border-electric-indigo/50 transition-colors"
                  >
                    <div className="w-10 h-10 bg-electric-indigo/20 rounded-lg flex items-center justify-center text-electric-indigo mb-3">
                      {solution.icon}
                    </div>
                    <div className="font-bold text-white mb-1">
                      {solution.label}
                    </div>
                    <div className="text-text-muted text-sm">{solution.desc}</div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-midnight-700">
                <div className="flex items-center gap-2 text-electric-cyan text-sm font-medium">
                  <Zap className="w-4 h-4" />
                  <span>Instant response • Most issues fixed remotely</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Benefit Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {benefits.map((benefit, i) => (
            <div
              key={i}
              className="group p-8 rounded-2xl bg-midnight-800/50 border border-midnight-700 hover:border-electric-indigo/50 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-scout-purple to-electric-indigo rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-scout-purple/20 group-hover:scale-110 transition-transform">
                {benefit.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                {benefit.title}
              </h3>
              <p className="text-text-secondary leading-relaxed">{benefit.desc}</p>
            </div>
          ))}
        </div>

        {/* Bottom Stats */}
        <div className="mt-16 pt-12 border-t border-midnight-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-black text-gradient-electric mb-2">
                50s
              </div>
              <div className="text-text-muted text-sm">Instant Response</div>
            </div>
            <div>
              <div className="text-3xl font-black text-gradient-electric mb-2">
                11 Min
              </div>
              <div className="text-text-muted text-sm">Minutes to Resolve</div>
            </div>
            <div>
              <div className="text-3xl font-black text-gradient-electric mb-2">
                90%
              </div>
              <div className="text-text-muted text-sm">Resolved Remotely</div>
            </div>
            <div>
              <div className="text-3xl font-black text-gradient-electric mb-2">
                24/7
              </div>
              <div className="text-text-muted text-sm">AI Availability</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const TestimonialSection: React.FC = () => {
  const testimonials = [
    {
      quote:
        "My internet was down at 10pm on a Sunday. Instead of waiting until Monday, I was back online in 15 minutes. This is what tech support should be.",
      name: "David R.",
      role: "Remote Worker, Denver CO",
      image: "/images/testimonial-1.jpg",
    },
    {
      quote:
        "I spent 3 hours trying to connect my new smart TV. TotalAssist walked me through it in 10 minutes with a video guide. So easy to follow!",
      name: "Michelle T.",
      role: "Busy Mom, Chicago IL",
      image: "/images/testimonial-2.jpg",
    },
    {
      quote:
        "I just snapped a photo of the error on my router and got the exact fix I needed. No hold music, no frustration. Finally, tech support that works.",
      name: "Robert K.",
      role: "Retiree, Phoenix AZ",
      image: "/images/testimonial-3.jpg",
    },
  ];

  return (
    <section className="py-24 bg-midnight-900 noise-texture noise-texture-subtle">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black mb-4 text-white">
            People Like You
          </h2>
          <p className="text-lg text-text-secondary">
            Who finally stopped fighting with their tech
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="p-8 rounded-2xl bg-midnight-800 border border-midnight-700 border-t-4 border-t-electric-indigo"
            >
              <div className="flex mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star
                    key={j}
                    className="w-5 h-5 fill-electric-cyan text-electric-cyan"
                  />
                ))}
              </div>
              <p className="mb-6 leading-relaxed italic text-text-secondary">
                "{t.quote}"
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-midnight-700">
                  <img
                    src={t.image}
                    alt={t.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="font-bold text-white">
                    {t.name}
                  </div>
                  <div className="text-sm text-text-muted">
                    {t.role}
                  </div>
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
  const [openFaq, setOpenFaq] = React.useState<number | null>(null);
  const faqs = [
    {
      q: "Questions? You've got 'em.",
      a: "We've got answers for all your questions about TotalAssist. Browse below or chat with TotalAssist for instant help.",
    },
    {
      q: "What is TotalAssist AI?",
      a: "Scout is our AI-powered assistant that provides instant tech support via chat, photo analysis, and live video guidance. Scout responds immediately—no waiting, no hold music.",
    },
    {
      q: "Who can use Scout?",
      a: "Scout is currently available to everyone! Sign up for free to try Scout Chat, or upgrade for Snapshot and Signal features.",
    },
    {
      q: "What is the seasonal answer?",
      a: "Scout AI is available 24/7, 365 days a year. No seasonal limitations—get help whenever you need it.",
    },
    {
      q: "What is the billing conversation?",
      a: "We offer flexible plans: Basic (free), Pro ($20/mo), and Premium ($199/year). All paid plans include unlimited Scout Chat, Snapshot analysis, and priority support.",
    },
  ];

  return (
    <section className="py-20 bg-midnight-950 noise-texture noise-texture-subtle">
      <div className="container mx-auto px-6 max-w-3xl">
        <div className="text-center mb-12">
          <span className="inline-block text-electric-indigo font-bold text-sm uppercase tracking-wider mb-4">
            FAQ
          </span>
          <h2 className="text-4xl font-black mb-4 text-white">
            Frequently asked questions
          </h2>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="border-b border-midnight-700"
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full py-4 flex items-center justify-between text-left"
              >
                <span className="font-bold text-lg text-white">
                  {faq.q}
                </span>
                <ArrowRight
                  className={`w-5 h-5 text-electric-indigo transition-transform ${openFaq === i ? "rotate-90" : ""}`}
                />
              </button>
              {openFaq === i && (
                <div className="pb-4 leading-relaxed text-text-secondary">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const CTASection: React.FC<{ onSignup: (email?: string) => void }> = ({
  onSignup,
}) => {
  const [email, setEmail] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      onSignup(email);
    }
  };

  return (
    <section className="py-24 bg-gradient-to-br from-scout-purple to-electric-indigo relative overflow-hidden noise-texture">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-20 z-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-electric-cyan rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-scout-glow rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
      </div>
      <div className="container mx-auto px-6 max-w-4xl text-center relative z-10">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
          Life's too short for tech headaches.
        </h2>
        <p className="text-white/90 font-medium max-w-2xl mx-auto mb-10 text-xl lg:text-2xl">
          No more searching for answers at midnight. No more feeling stuck with
          your own devices. Just instant AI-powered help, whenever you need it.
        </p>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-4 justify-center max-w-xl mx-auto mb-6"
        >
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 px-6 py-4 rounded-full text-midnight-950 text-lg font-medium focus:outline-none focus:ring-4 focus:ring-white/30 shadow-xl bg-white"
            required
          />
          <button
            type="submit"
            className="bg-midnight-950 hover:bg-midnight-900 text-white font-bold px-10 py-4 rounded-full text-lg transition-all whitespace-nowrap shadow-xl hover:shadow-2xl"
          >
            Get Started Free
          </button>
        </form>
        <div className="flex items-center justify-center gap-6 text-white/80 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <span>No credit card</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <span>Cancel anytime</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <span>Scout AI available 24/7</span>
          </div>
        </div>
      </div>
    </section>
  );
};

const Footer: React.FC<{ onNavigate: (view: PageView) => void }> = ({
  onNavigate,
}) => {
  const handleNav = (view: PageView) => {
    onNavigate(view);
    window.scrollTo(0, 0);
  };

  return (
    <footer className="bg-midnight-950 text-white pt-20 pb-10 border-t border-midnight-700">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <button
              onClick={() => handleNav(PageView.HOME)}
              className="mb-6 block"
            >
              <Logo variant="light" />
            </button>
            <p className="text-text-secondary text-sm leading-relaxed mb-6">
              Instant AI technical support for your home. TotalAssist fixes Wi-Fi, smart
              devices, and appliances in minutes.
            </p>
          </div>

          {/* Product Column */}
          <div>
            <h4 className="font-bold mb-6">Product</h4>
            <ul className="space-y-4 text-sm text-text-secondary">
              <li>
                <button
                  onClick={() => handleNav(PageView.HOW_IT_WORKS)}
                  className="hover:text-electric-indigo transition-colors"
                >
                  How It Works
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav(PageView.PRICING)}
                  className="hover:text-electric-indigo transition-colors"
                >
                  Pricing & Plans
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav(PageView.FAQ)}
                  className="hover:text-electric-indigo transition-colors"
                >
                  Common Questions
                </button>
              </li>
            </ul>
          </div>

          {/* Support Column */}
          <div>
            <h4 className="font-bold mb-6">Support</h4>
            <ul className="space-y-4 text-sm text-text-secondary">
              <li>
                <button
                  onClick={() => handleNav(PageView.LOGIN)}
                  className="hover:text-electric-indigo transition-colors"
                >
                  Member Login
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav(PageView.SIGNUP)}
                  className="hover:text-electric-indigo transition-colors"
                >
                  Start Free Trial
                </button>
              </li>
              <li>
                <span className="text-text-muted cursor-default">
                  Help Center (Coming Soon)
                </span>
              </li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h4 className="font-bold mb-6">Legal</h4>
            <ul className="space-y-4 text-sm text-text-secondary">
              <li>
                <button
                  onClick={() => handleNav(PageView.PRIVACY)}
                  className="hover:text-electric-indigo transition-colors"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav(PageView.TERMS)}
                  className="hover:text-electric-indigo transition-colors"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav(PageView.CANCELLATION)}
                  className="hover:text-electric-indigo transition-colors"
                >
                  Cancellation Policy
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-midnight-700 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-text-muted">
          <div>© 2026 Smart Tek Labs. All rights reserved.</div>
          <div className="flex gap-6">
            <button
              onClick={() => handleNav(PageView.CANCELLATION)}
              className="hover:text-white transition-colors"
            >
              Cancellation Policy
            </button>
            <button
              onClick={() => handleNav(PageView.PRIVACY)}
              className="hover:text-white transition-colors"
            >
              Privacy
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

// URL path to PageView mapping
const pathToView: Record<string, PageView> = {
  "/": PageView.HOME,
  "/how-it-works": PageView.HOW_IT_WORKS,
  "/pricing": PageView.PRICING,
  "/faq": PageView.FAQ,
  "/signup": PageView.SIGNUP,
  "/login": PageView.LOGIN,
  "/dashboard": PageView.DASHBOARD,
  "/privacy": PageView.PRIVACY,
  "/terms": PageView.TERMS,
  "/cancellation": PageView.CANCELLATION,
  '/verify-email': PageView.VERIFY_EMAIL,
  '/forgot-password': PageView.FORGOT_PASSWORD,
  '/reset-password': PageView.RESET_PASSWORD,
};

const viewToPath: Record<PageView, string> = {
  [PageView.HOME]: "/",
  [PageView.HOW_IT_WORKS]: "/how-it-works",
  [PageView.PRICING]: "/pricing",
  [PageView.FAQ]: "/faq",
  [PageView.SIGNUP]: "/signup",
  [PageView.LOGIN]: "/login",
  [PageView.HISTORY]: "/history",
  [PageView.SAFETY]: "/safety",
  [PageView.DASHBOARD]: "/dashboard",
  [PageView.PRIVACY]: "/privacy",
  [PageView.TERMS]: "/terms",
  [PageView.CANCELLATION]: "/cancellation",
  [PageView.VERIFY_EMAIL]: '/verify-email',
  [PageView.FORGOT_PASSWORD]: '/forgot-password',
  [PageView.RESET_PASSWORD]: '/reset-password',
};

// Get initial view from URL
const getInitialView = (): PageView => {
  const path = window.location.pathname;
  return pathToView[path] || PageView.HOME;
};

// Dashboard user interface
interface DashboardUser {
  id?: string;
  firstName: string;
  lastName?: string;
  email: string;
}

// Get stored dashboard user
const getStoredUser = (): DashboardUser | null => {
  try {
    const stored = localStorage.getItem("techtriage_user");
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to get stored user:", e);
  }
  return null;
};

type DashboardView = "main" | "history" | "settings" | "billing";

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<PageView>(getInitialView);
  const [capturedEmail, setCapturedEmail] = useState("");
  const [dashboardUser, setDashboardUser] = useState<DashboardUser | null>(
    getStoredUser,
  );
  const [showLiveSupport, setShowLiveSupport] = useState(false);
  const [dashboardView, setDashboardView] = useState<DashboardView>("main");
  const chatRef = useRef<ChatWidgetHandle>(null);

  // Get auth state from session (for OAuth users)
  const {
    user: sessionUser,
    isAuthenticated,
    isLoading: authLoading,
    refetch: refetchAuth,
  } = useAuth();

  // Get subscription tier for the authenticated user
  const { tier: subscriptionTier } = useSubscription(sessionUser?.id);

  // Sync usage store tier with auth/subscription state
  useSyncUsageWithAuth(isAuthenticated, sessionUser?.id, subscriptionTier);

  // Check if user should see dashboard on initial load
  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser && window.location.pathname === "/dashboard") {
      setDashboardUser(storedUser);
      setCurrentView(PageView.DASHBOARD);
    }
  }, []);

  // Track if we've already checked session user status to prevent repeated checks
  const [sessionChecked, setSessionChecked] = useState(false);

  // Sync session user to dashboardUser for ALL authenticated users (OAuth and email/password)
  // This ensures dashboardUser always has the id from the session
  useEffect(() => {
    if (!authLoading && isAuthenticated && sessionUser && !sessionChecked) {
      const currentPath = window.location.pathname;

      // Create dashboard user object from session
      const syncedUser: DashboardUser = {
        id: sessionUser.id,
        firstName: sessionUser.firstName || sessionUser.username || "User",
        lastName: sessionUser.lastName || undefined,
        email: sessionUser.email || "",
      };

      // If on dashboard, sync the user (ensures id is present)
      if (currentPath === "/dashboard") {
        setSessionChecked(true);
        setDashboardUser(syncedUser);
        localStorage.setItem("techtriage_user", JSON.stringify(syncedUser));
        setCurrentView(PageView.DASHBOARD);
      }

      // If on signup and authenticated, check if they've completed onboarding
      if (currentPath === "/signup" && sessionUser.id) {
        setSessionChecked(true);
        // Fetch full user profile to check onboarding status
        fetch(`/api/auth/user/${sessionUser.id}`)
          .then((res) => res.json())
          .then((data) => {
            // If user has completed onboarding (has homeType or techComfort), go to dashboard
            if (data.homeType || data.techComfort) {
              setDashboardUser(syncedUser);
              localStorage.setItem(
                "techtriage_user",
                JSON.stringify(syncedUser),
              );
              navigate(PageView.DASHBOARD);
            }
            // Otherwise, let them continue with onboarding in SignUp component
          })
          .catch((err) => {
            console.error("Error checking user profile:", err);
          });
      }
    }
  }, [authLoading, isAuthenticated, sessionUser, sessionChecked]);

  // Additional sync: If dashboardUser exists but lacks id, and we have session, sync the id
  useEffect(() => {
    if (
      !authLoading &&
      isAuthenticated &&
      sessionUser?.id &&
      dashboardUser &&
      !dashboardUser.id
    ) {
      const updatedUser = { ...dashboardUser, id: sessionUser.id };
      setDashboardUser(updatedUser);
      localStorage.setItem("techtriage_user", JSON.stringify(updatedUser));
    }
  }, [authLoading, isAuthenticated, sessionUser, dashboardUser]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const view = pathToView[path] || PageView.HOME;
      setCurrentView(view);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Custom navigate function that updates URL (memoized to prevent child re-renders)
  const navigate = useCallback((view: PageView) => {
    const path = viewToPath[view] || "/";
    if (window.location.pathname !== path) {
      window.history.pushState({ view }, "", path);
    }
    setCurrentView(view);
    window.scrollTo(0, 0);
  }, []);

  const handleStart = useCallback(() => {
    chatRef.current?.open("I'd like to start a free trial.");
  }, []);

  const handleSpeakToExpert = useCallback(() => {
    chatRef.current?.openAsLiveAgent();
  }, []);

  const handleFreeTrial = useCallback(() => {
    navigate(PageView.SIGNUP);
  }, [navigate]);

  const handleNavigateToSignup = useCallback(
    (email?: string | React.MouseEvent) => {
      // Filter out MouseEvent objects (when called from onClick without args)
      if (email && typeof email === "string") {
        setCapturedEmail(email);
      }
      navigate(PageView.SIGNUP);
    },
    [navigate],
  );

  const handleNavigateToPricing = useCallback(() => {
    navigate(PageView.PRICING);
  }, [navigate]);

  // Handle signup completion - store user and go to dashboard (memoized for Login/SignUp)
  const handleSignupComplete = useCallback(
    (user: DashboardUser) => {
      console.log("[APP] handleSignupComplete called with user:", user);
      console.log("[APP] User ID:", user.id);
      console.log("[APP] User email:", user.email);

      if (!user.id) {
        console.error(
          "[APP] WARNING: User has no ID! Billing and other features will not work.",
        );
      }

      setDashboardUser(user);
      localStorage.setItem("techtriage_user", JSON.stringify(user));
      // Refetch auth state to sync session with global auth context
      // This ensures ChatWidget and Header recognize the user as authenticated
      refetchAuth();
      navigate(PageView.DASHBOARD);
    },
    [navigate, refetchAuth],
  );

  // Dashboard handlers (memoized to prevent unnecessary re-renders)
  const handleDashboardChat = useCallback(() => {
    chatRef.current?.open();
  }, []);

  const handleDashboardUploadImage = useCallback(() => {
    // Open chat with image upload intent
    chatRef.current?.open(
      "I'd like to upload a photo of my issue for analysis.",
    );
  }, []);

  const handleDashboardStartVideo = useCallback(() => {
    setShowLiveSupport(true);
  }, []);

  const handleDashboardLogout = useCallback(() => {
    setDashboardUser(null);
    setDashboardView("main");
    localStorage.removeItem("techtriage_user");
    localStorage.removeItem("techtriage_trial");
    // Also clear OAuth session by redirecting to logout endpoint
    window.location.href = "/api/auth/logout";
  }, []);

  const handleOpenHistory = useCallback(() => {
    setDashboardView("history");
  }, []);

  const handleOpenSettings = useCallback(() => {
    setDashboardView("settings");
  }, []);

  const handleOpenBilling = useCallback(() => {
    setDashboardView("billing");
  }, []);

  const handleBackToDashboard = useCallback(() => {
    setDashboardView("main");
  }, []);

  const handleUpdateUser = useCallback((updatedUser: DashboardUser) => {
    setDashboardUser(updatedUser);
  }, []);

  const handleCloseLiveSupport = useCallback(() => {
    setShowLiveSupport(false);
  }, []);

  // Show live support fullscreen if active
  if (showLiveSupport) {
    return (
      <LiveSupport
        onClose={handleCloseLiveSupport}
        userId={dashboardUser?.id}
        userEmail={dashboardUser?.email}
        userName={
          dashboardUser
            ? `${dashboardUser.firstName} ${dashboardUser.lastName || ""}`.trim()
            : undefined
        }
      />
    );
  }

  const renderContent = () => {
    switch (currentView) {
      case PageView.HOW_IT_WORKS:
        return <HowItWorks onStart={handleStart} />;
      case PageView.PRICING:
        return <Pricing onStart={handleStart} onNavigate={navigate} />;
      case PageView.FAQ:
        return <FAQ onNavigate={navigate} />;
      case PageView.SIGNUP:
        return (
          <SignUp
            onStart={handleStart}
            initialEmail={capturedEmail}
            onSpeakToExpert={handleSpeakToExpert}
            onComplete={handleSignupComplete}
            onNavigate={navigate}
          />
        );
      case PageView.VERIFY_EMAIL:
        return (
          <VerifyEmail 
            onNavigate={navigate} 
            onVerificationComplete={handleSignupComplete} 
          />
        );
      case PageView.LOGIN:
        return <Login onNavigate={navigate} onLogin={handleSignupComplete} />;
      case PageView.FORGOT_PASSWORD:
        return <ForgotPassword onNavigate={navigate} />;
      case PageView.RESET_PASSWORD:
        return <ResetPassword onNavigate={navigate} />;
      case PageView.PRIVACY:
        return <PrivacyPolicy onBack={() => navigate(PageView.HOME)} />;
      case PageView.TERMS:
        return <TermsOfService onBack={() => navigate(PageView.HOME)} />;
      case PageView.CANCELLATION:
        return <CancellationPolicy onBack={() => navigate(PageView.HOME)} />;
      case PageView.DASHBOARD:
        if (dashboardUser) {
          // Determine what content to show inside dashboard
          let dashboardContent: React.ReactNode = null;
          if (dashboardView === "history") {
            dashboardContent = (
              <SessionHistory
                userEmail={dashboardUser.email}
                userName={`${dashboardUser.firstName} ${dashboardUser.lastName || ""}`.trim()}
                embedded
              />
            );
          } else if (dashboardView === "settings") {
            dashboardContent = (
              <Settings
                user={dashboardUser}
                onUpdateUser={handleUpdateUser}
                embedded
              />
            );
          } else if (dashboardView === "billing" && dashboardUser.id) {
            dashboardContent = (
              <BillingManagement
                userId={dashboardUser.id}
                onViewPlans={() => navigate(PageView.PRICING)}
              />
            );
          }

          return (
            <Dashboard
              user={dashboardUser}
              onStartChat={handleDashboardChat}
              onUploadImage={handleDashboardUploadImage}
              onStartVideo={handleDashboardStartVideo}
              onLogout={handleDashboardLogout}
              onOpenHistory={handleOpenHistory}
              onOpenSettings={handleOpenSettings}
              onOpenBilling={handleOpenBilling}
              onBackToDashboard={handleBackToDashboard}
              activeView={dashboardView}
              onUpdateUser={handleUpdateUser}
            >
              {dashboardContent}
            </Dashboard>
          );
        }
        // If no user, redirect to signup
        navigate(PageView.SIGNUP);
        return null;
        
      case PageView.HOME:
      default:
        return (
          <>
            <Hero
              onFreeTrial={handleFreeTrial}
              onPricing={handleNavigateToPricing}
            />
            <HowItWorksSimple />
            <WhatWeHelpWith />
            <WhyTotalAssist />
            <TestimonialSection />
            <FAQSection />
            <CTASection onSignup={handleNavigateToSignup} />
          </>
        );
    }
  };

  // Dashboard has its own layout, don't show header/footer
  if (currentView === PageView.DASHBOARD && dashboardUser) {
    return (
      <div className="min-h-screen bg-midnight-950 font-['Inter',sans-serif] text-white">
        {renderContent()}
        <ChatWidget ref={chatRef} />
      </div>
    );
  }

  // Auth pages have their own standalone layout, don't show header/footer
  const standaloneAuthPages = [
    PageView.SIGNUP,
    PageView.LOGIN,
    PageView.FORGOT_PASSWORD,
    PageView.RESET_PASSWORD,
    PageView.VERIFY_EMAIL,
  ];
  if (standaloneAuthPages.includes(currentView)) {
    return (
      <div className="min-h-screen bg-midnight-950 font-['Inter',sans-serif] text-white">
        {renderContent()}
        <ChatWidget ref={chatRef} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-midnight-950 font-['Inter',sans-serif] text-white">
      <Header onNavigate={navigate} currentView={currentView} />
      <main>{renderContent()}</main>
      <Footer onNavigate={navigate} />
      <ChatWidget ref={chatRef} />
    </div>
  );
};

export default App;
