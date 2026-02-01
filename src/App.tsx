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
  Lock,
  CheckCircle2,
  Moon,
  Sun,
  LogOut,
  User,
  Smartphone,
  Monitor,
  Printer,
  Thermometer,
  MessageSquare,
  Camera,
  Zap,
  Clock,
  PhoneOff,
  Bot,
  Wrench,
} from "lucide-react";
import { ChatWidget, ChatWidgetHandle } from "./components/ChatWidget";
import { Logo } from "./components/Logo";
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
import { useTheme } from "./context/ThemeContext";
import { useAuth } from "./hooks/useAuth";
import { LiveSupport } from "./components/LiveSupport";

const Button: React.FC<{
  children: React.ReactNode;
  variant?: "orange" | "outline" | "outlineNavy" | "dark";
  className?: string;
  onClick?: () => void;
}> = ({ children, variant = "orange", className = "", onClick }) => {
  const variants = {
    orange:
      "bg-[#F97316] hover:bg-[#EA580C] text-white shadow-lg shadow-orange-500/20",
    outline:
      "bg-transparent border-2 border-white text-white hover:bg-white/10",
    outlineNavy:
      "bg-transparent border-2 border-[#1F2937] text-[#1F2937] hover:bg-[#1F2937] hover:text-white",
    dark: "bg-[#1F2937] text-white hover:bg-[#374151]",
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
  const { isDark, toggleTheme } = useTheme();
  const { user, isAuthenticated, isLoading, logout } = useAuth(); // Removed 'login' from here since we use direct link
  const isHomePage = currentView === PageView.HOME;

  const handleNav = (view: PageView) => {
    onNavigate(view);
    setMobileMenuOpen(false);
    window.scrollTo(0, 0);
  };

  const handleGoogleLogin = () => {
    window.location.href = "/auth/google";
  };

  const textColor = isHomePage
    ? "text-white"
    : isDark
      ? "text-white"
      : "text-[#1F2937]";
  const textColorMuted = isHomePage
    ? "text-white/80"
    : isDark
      ? "text-white/80"
      : "text-[#1F2937]/80";
  const hoverColor = "hover:text-[#F97316]";

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 h-[72px] transition-colors ${isHomePage ? "bg-[#1F2937]" : isDark ? "bg-[#1F2937] shadow-md" : "bg-white shadow-md"}`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 h-full flex items-center justify-between">
        {/* LEFT: Logo */}
        <button
          onClick={() => handleNav(PageView.HOME)}
          className="focus:outline-none shrink-0"
        >
          <Logo variant={isHomePage || isDark ? "light" : "dark"} />
        </button>

        {/* CENTER: Primary Navigation */}
        <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
          <button
            onClick={() => handleNav(PageView.HOW_IT_WORKS)}
            className={`whitespace-nowrap ${currentView === PageView.HOW_IT_WORKS ? "text-[#F97316]" : `${textColor} ${hoverColor}`} transition-colors font-semibold text-[15px]`}
          >
            How It Works
          </button>
          <button
            onClick={() => handleNav(PageView.PRICING)}
            className={`whitespace-nowrap ${currentView === PageView.PRICING ? "text-[#F97316]" : `${textColor} ${hoverColor}`} transition-colors font-semibold text-[15px]`}
          >
            Pricing
          </button>
          <button
            onClick={() => handleNav(PageView.FAQ)}
            className={`whitespace-nowrap ${currentView === PageView.FAQ ? "text-[#F97316]" : `${textColor} ${hoverColor}`} transition-colors font-semibold text-[15px]`}
          >
            FAQs
          </button>
        </nav>

        {/* RIGHT: Utility items */}
        <div className="hidden lg:flex items-center gap-5 shrink-0">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className={`${textColorMuted} ${hoverColor} transition-colors p-1.5 rounded-full hover:bg-white/10`}
            aria-label="Toggle dark mode"
          >
            {isDark ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

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
                    className="w-7 h-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#F97316] flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <span
                  className={`${textColorMuted} text-sm font-medium hidden xl:inline`}
                >
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
                className="bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold px-6 py-2.5 rounded-full text-sm transition-colors whitespace-nowrap"
              >
                Sign Up Free
              </button>
            </>
          )}
        </div>

        {/* Mobile: Hamburger + CTA */}
        <div className="flex lg:hidden items-center gap-3">
          <button
            onClick={() => onNavigate(PageView.SIGNUP)}
            className="bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold px-4 py-2 rounded-full text-sm transition-colors"
          >
            Sign Up Free
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
        <div
          className={`lg:hidden absolute top-[72px] left-0 w-full ${isDark || isHomePage ? "bg-[#1F2937] border-gray-700" : "bg-white border-gray-200"} border-b p-6 flex flex-col gap-5 shadow-xl`}
        >
          <button
            onClick={() => handleNav(PageView.HOW_IT_WORKS)}
            className={`${isDark || isHomePage ? "text-white" : "text-[#1F2937]"} font-semibold text-base text-left`}
          >
            How It Works
          </button>
          <button
            onClick={() => handleNav(PageView.PRICING)}
            className={`${isDark || isHomePage ? "text-white" : "text-[#1F2937]"} font-semibold text-base text-left`}
          >
            Pricing
          </button>
          <button
            onClick={() => handleNav(PageView.FAQ)}
            className={`${isDark || isHomePage ? "text-white" : "text-[#1F2937]"} font-semibold text-base text-left`}
          >
            FAQs
          </button>

          <hr
            className={
              isDark || isHomePage ? "border-gray-700" : "border-gray-200"
            }
          />

          <button
            onClick={toggleTheme}
            className={`flex items-center gap-2 ${isDark || isHomePage ? "text-white/80" : "text-[#1F2937]/80"} font-medium text-left`}
          >
            {isDark ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
            {isDark ? "Light Mode" : "Dark Mode"}
          </button>

          {isAuthenticated && user ? (
            <>
              <div
                className={`flex items-center gap-2 ${isDark || isHomePage ? "text-white" : "text-[#1F2937]"} font-medium`}
              >
                {user.profileImageUrl ? (
                  <img
                    src={user.profileImageUrl}
                    alt={user.firstName || "User"}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#F97316] flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
                <span>{user.firstName || user.email || "User"}</span>
              </div>
              <button
                onClick={logout}
                className={`${isDark || isHomePage ? "text-white/80" : "text-[#1F2937]/80"} font-medium text-left flex items-center gap-2`}
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={handleGoogleLogin}
              className={`${isDark || isHomePage ? "text-white/80" : "text-[#1F2937]/80"} font-medium text-left`}
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
  <section className="relative pt-[72px] min-h-screen overflow-hidden">
    {/* Background hero image */}
    <div
      className="absolute inset-0 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url(/hero-image-large.jpg)" }}
    >
      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#1F2937]/90 via-[#1F2937]/90 to-transparent"></div>
    </div>

    <div className="container mx-auto px-6 lg:px-12 relative z-10">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center min-h-[calc(100vh-72px)]">
        {/* Left side - Content */}
        <div className="pt-8 lg:pt-0">
          <div className="inline-flex items-center gap-2 bg-[#F97316]/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-[#F97316]/30">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-white font-semibold text-sm">
              AI support available 24/7
            </span>
          </div>
          <h1 className="text-4xl lg:text-5xl xl:text-6xl font-black text-white tracking-tight leading-[1.1] mb-6">
            Fix your tech issue
            <br />
            <span className="text-[#F97316]">in minutes, not hours.</span>
          </h1>
          <p className="text-white/80 text-xl lg:text-2xl font-medium leading-relaxed mb-10 max-w-lg">
            Wi-Fi down? Smart TV acting up? Describe your problem, snap a photo, or start a video walkthrough—our AI guides you to a fix instantly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <Button
              variant="orange"
              onClick={onFreeTrial}
              className="shadow-xl shadow-orange-500/30 text-lg px-10"
            >
              Get Started Free
            </Button>
            <Button
              variant="outline"
              onClick={onPricing}
              className="text-lg px-10"
            >
              View Pricing
            </Button>
          </div>
          <div className="flex items-center gap-6 text-sm text-white/70">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#F97316]" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#F97316]" />
              <span>Cancel anytime</span>
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
  const { isDark } = useTheme();
  const steps = [
    {
      step: "01",
      title: "Tell us what's happening",
      desc: "\"My Wi-Fi keeps dropping\" or \"There's a weird error code\"—just describe it like you would to a friend. Our AI speaks human.",
      icon: <MessageSquare className="w-7 h-7" />,
    },
    {
      step: "02",
      title: "Show us (if it helps)",
      desc: "Snap a photo of that blinking light, share your screen, or start a video walkthrough. Our AI analyzes it instantly.",
      icon: <Camera className="w-7 h-7" />,
    },
    {
      step: "03",
      title: "Actually get it fixed",
      desc: "No more Googling for 2 hours. Our AI guides you step-by-step until it's working—most issues resolved in minutes.",
      icon: <CheckCircle2 className="w-7 h-7" />,
    },
  ];

  return (
    <section
      className={`py-24 noise-texture noise-texture-subtle ${isDark ? "bg-[#0D1117]" : "bg-[#F9FAFB]"}`}
    >
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center mb-16">
          <span className="inline-block text-[#F97316] font-bold text-sm uppercase tracking-wider mb-4">
            How It Works
          </span>
          <h2
            className={`text-4xl lg:text-5xl font-black mb-6 ${isDark ? "text-white" : "text-[#1F2937]"}`}
          >
            Help that actually helps
          </h2>
          <p
            className={`text-xl max-w-2xl mx-auto ${isDark ? "text-gray-400" : "text-[#4B5563]"}`}
          >
            No hold music. No "have you tried turning it off and on again." Just clear answers and real solutions.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((s, i) => (
            <div key={i} className="relative">
              {/* Connector line */}
              {i < 2 && (
                <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-[#F97316] to-transparent"></div>
              )}
              <div
                className={`relative rounded-2xl p-8 ${isDark ? "bg-[#1F2937]" : "bg-[#F9FAFB]"}`}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#F97316] to-[#EA580C] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
                    {s.icon}
                  </div>
                  <span
                    className={`text-5xl font-black ${isDark ? "text-white/10" : "text-[#1F2937]/10"}`}
                  >
                    {s.step}
                  </span>
                </div>
                <h3
                  className={`text-xl font-black mb-3 ${isDark ? "text-white" : "text-[#1F2937]"}`}
                >
                  {s.title}
                </h3>
                <p
                  className={`leading-relaxed ${isDark ? "text-gray-400" : "text-[#4B5563]"}`}
                >
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
  const { isDark } = useTheme();
  const problems = [
    {
      icon: <Wifi className="w-8 h-8" />,
      label: "Wi-Fi & Networking",
      desc: "Slow speeds, dead zones, connection drops",
    },
    {
      icon: <Tv className="w-8 h-8" />,
      label: "TV & Streaming",
      desc: "Setup, apps, soundbars, remotes",
    },
    {
      icon: <Monitor className="w-8 h-8" />,
      label: "Computers & Laptops",
      desc: "Performance, updates, software issues",
    },
    {
      icon: <Home className="w-8 h-8" />,
      label: "Smart Home Devices",
      desc: "Alexa, Google Home, Ring, Nest",
    },
    {
      icon: <Smartphone className="w-8 h-8" />,
      label: "Phones & Tablets",
      desc: "Setup, syncing, app troubleshooting",
    },
    {
      icon: <Lock className="w-8 h-8" />,
      label: "Accounts & Security",
      desc: "Password recovery, 2FA, privacy",
    },
    {
      icon: <Printer className="w-8 h-8" />,
      label: "Printers & Peripherals",
      desc: "Setup, connectivity, drivers",
    },
    {
      icon: <Thermometer className="w-8 h-8" />,
      label: "Smart Thermostats",
      desc: "Ecobee, Nest, Honeywell setup",
    },
  ];

  return (
    <section
      className={`py-24 noise-texture ${isDark ? "bg-[#111827]" : "bg-white"}`}
    >
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center mb-16">
          <span className="inline-block text-[#F97316] font-bold text-sm uppercase tracking-wider mb-4">
            What We Support
          </span>
          <h2
            className={`text-4xl lg:text-5xl font-black mb-6 ${isDark ? "text-white" : "text-[#1F2937]"}`}
          >
            Technology support for your home
          </h2>
          <p
            className={`text-xl max-w-2xl mx-auto ${isDark ? "text-gray-400" : "text-[#4B5563]"}`}
          >
            From Wi-Fi troubles to smart home setup—we help with the tech that keeps your home running.
          </p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {problems.map((item, i) => (
            <div
              key={i}
              className={`group p-6 rounded-2xl transition-all duration-300 cursor-pointer hover:-translate-y-1 ${
                isDark
                  ? "bg-[#1F2937] hover:bg-[#374151]"
                  : "bg-[#F9FAFB] hover:bg-white hover:shadow-xl"
              }`}
            >
              <div
                className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                  isDark
                    ? "bg-[#374151] text-white group-hover:bg-[#F97316]"
                    : "bg-white text-[#1F2937] group-hover:bg-[#F97316] group-hover:text-white shadow-sm"
                }`}
              >
                {item.icon}
              </div>
              <h3
                className={`font-bold text-lg mb-2 ${isDark ? "text-white" : "text-[#1F2937]"}`}
              >
                {item.label}
              </h3>
              <p
                className={`text-sm ${isDark ? "text-gray-400" : "text-[#6B7280]"}`}
              >
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const WhyTechTriage: React.FC = () => {
  const traditionalPains = [
    { icon: <Phone className="w-5 h-5" />, text: "Press 1 for billing, 2 for..." },
    { icon: <Clock className="w-5 h-5" />, text: "Your wait time is 47 minutes" },
    { icon: <PhoneOff className="w-5 h-5" />, text: "Call disconnected. Start over." },
  ];

  const techTriageSolutions = [
    { icon: <MessageSquare className="w-5 h-5" />, label: "Chat", desc: "AI troubleshooting" },
    { icon: <Camera className="w-5 h-5" />, label: "Snap", desc: "Photo diagnosis" },
    { icon: <Video className="w-5 h-5" />, label: "Video", desc: "AI walkthrough" },
    { icon: <Wrench className="w-5 h-5" />, label: "Onsite", desc: "If needed" },
  ];

  const benefits = [
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Instant AI Answers",
      desc: "No hold music. No phone trees. Just describe your issue and get clear, step-by-step guidance in seconds.",
    },
    {
      icon: <Camera className="w-8 h-8" />,
      title: "Show, Don't Explain",
      desc: "Snap a photo of that blinking light or error code. Our AI analyzes it instantly—no confusing descriptions needed.",
    },
    {
      icon: <CheckCircle2 className="w-8 h-8" />,
      title: "Remote-First Fixes",
      desc: "Most issues are resolved without anyone stepping foot in your home. Onsite visits only if absolutely necessary.",
    },
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-[#1F2937] to-[#111827] text-white overflow-hidden noise-texture noise-texture-strong">
      <div className="container mx-auto px-6 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block text-[#F97316] font-bold text-sm uppercase tracking-wider mb-4">
            Why TechTriage
          </span>
          <h2 className="text-4xl lg:text-5xl font-black mb-6 leading-tight">
            Tech support that actually works
          </h2>
          <p className="text-white/70 text-xl max-w-2xl mx-auto">
            We built TechTriage because everyone deserves help that's instant, clear, and doesn't waste your time.
          </p>
        </div>

        {/* Comparison Section */}
        <div className="grid lg:grid-cols-2 gap-8 mb-20">
          {/* Traditional Support - Left */}
          <div className="relative">
            <div className="absolute inset-0 bg-red-500/5 rounded-3xl"></div>
            <div className="relative bg-white/5 backdrop-blur border border-white/10 rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                  <PhoneOff className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-white/60">Traditional Support</h3>
              </div>
              <div className="space-y-4">
                {traditionalPains.map((pain, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                    <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center text-red-400">
                      {pain.icon}
                    </div>
                    <span className="text-white/50 font-medium">{pain.text}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="flex items-center gap-2 text-white/40 text-sm">
                  <Clock className="w-4 h-4" />
                  <span>Average wait: 20-45 minutes</span>
                </div>
              </div>
            </div>
          </div>

          {/* TechTriage - Right */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#F97316]/10 to-orange-500/5 rounded-3xl"></div>
            <div className="relative bg-white/5 backdrop-blur border border-[#F97316]/30 rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-[#F97316] to-[#EA580C] rounded-xl flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">TechTriage</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {techTriageSolutions.map((solution, i) => (
                  <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-[#F97316]/50 transition-colors">
                    <div className="w-10 h-10 bg-[#F97316]/20 rounded-lg flex items-center justify-center text-[#F97316] mb-3">
                      {solution.icon}
                    </div>
                    <div className="font-bold text-white mb-1">{solution.label}</div>
                    <div className="text-white/50 text-sm">{solution.desc}</div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="flex items-center gap-2 text-[#F97316] text-sm font-medium">
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
              className="group p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-[#F97316]/50 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-[#F97316] to-[#EA580C] rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform">
                {benefit.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{benefit.title}</h3>
              <p className="text-white/60 leading-relaxed">{benefit.desc}</p>
            </div>
          ))}
        </div>

        {/* Bottom Stats - Softer metrics */}
        <div className="mt-16 pt-12 border-t border-white/10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-black text-[#F97316] mb-2">Instant</div>
              <div className="text-white/50 text-sm">AI response time</div>
            </div>
            <div>
              <div className="text-3xl font-black text-[#F97316] mb-2">Minutes</div>
              <div className="text-white/50 text-sm">Typical resolution</div>
            </div>
            <div>
              <div className="text-3xl font-black text-[#F97316] mb-2">Most</div>
              <div className="text-white/50 text-sm">Issues fixed remotely</div>
            </div>
            <div>
              <div className="text-3xl font-black text-[#F97316] mb-2">24/7</div>
              <div className="text-white/50 text-sm">AI availability</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const TestimonialSection: React.FC = () => {
  const { isDark } = useTheme();
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
        "I spent 3 hours trying to connect my new smart TV. TechTriage's AI walked me through it in 10 minutes with a video guide. So easy to follow!",
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
    <section
      className={`py-24 noise-texture noise-texture-subtle ${isDark ? "bg-[#0D1117]" : "bg-[#F3F4F6]"}`}
    >
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center mb-12">
          <h2
            className={`text-4xl font-black mb-4 ${isDark ? "text-white" : "text-[#1F2937]"}`}
          >
            People Like You
          </h2>
          <p
            className={`text-lg ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            Who finally stopped fighting with their tech
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className={`p-8 rounded-2xl shadow-xl border-t-4 border-[#F97316] ${isDark ? "bg-[#1F2937]" : "bg-white"}`}
            >
              <div className="flex mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star
                    key={j}
                    className="w-5 h-5 fill-[#F97316] text-[#F97316]"
                  />
                ))}
              </div>
              <p
                className={`mb-6 leading-relaxed italic ${isDark ? "text-gray-300" : "text-gray-700"}`}
              >
                "{t.quote}"
              </p>
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-full overflow-hidden ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
                >
                  <img
                    src={t.image}
                    alt={t.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div
                    className={`font-bold ${isDark ? "text-white" : "text-[#1F2937]"}`}
                  >
                    {t.name}
                  </div>
                  <div
                    className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
                  >
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
  const { isDark } = useTheme();
  const [openFaq, setOpenFaq] = React.useState<number | null>(null);
  const faqs = [
    {
      q: "How quickly can I get support?",
      a: "Instantly! Our AI responds immediately—no waiting, no hold music. Chat, Snap (photo analysis), and Video walkthrough sessions all start right away, 24/7.",
    },
    {
      q: "Is this AI or human support?",
      a: "TechTriage is AI-first. All Chat, Snap, and Video sessions are powered by AI that guides you through troubleshooting step-by-step. If remote troubleshooting can't resolve your issue, onsite visits can be scheduled where technicians are available.",
    },
    {
      q: "What types of issues do you support?",
      a: "We specialize in consumer technology: Wi-Fi and networking, computers, smart home devices, TVs and streaming, printers, smart thermostats, and general tech troubleshooting. If it connects to your home network or has a screen, we can likely help.",
    },
    {
      q: "Do I need to download an app?",
      a: "TechTriage works directly in your web browser—no download required. Our mobile app is coming soon, making it even easier to get help on the go.",
    },
    {
      q: "What if my issue can't be resolved remotely?",
      a: "Most issues are fixed remotely through our AI-guided troubleshooting. If not, we can schedule an onsite visit—but only if technicians are available in your service area.",
    },
  ];

  return (
    <section
      className={`py-20 noise-texture noise-texture-subtle ${isDark ? "bg-[#111827]" : "bg-white"}`}
    >
      <div className="container mx-auto px-6 max-w-3xl">
        <div className="text-center mb-12">
          <h2
            className={`text-4xl font-black mb-4 ${isDark ? "text-white" : "text-[#1F2937]"}`}
          >
            Frequently asked questions
          </h2>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className={`border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full py-4 flex items-center justify-between text-left"
              >
                <span
                  className={`font-bold text-lg ${isDark ? "text-white" : "text-[#1F2937]"}`}
                >
                  {faq.q}
                </span>
                <ArrowRight
                  className={`w-5 h-5 text-[#F97316] transition-transform ${openFaq === i ? "rotate-90" : ""}`}
                />
              </button>
              {openFaq === i && (
                <div
                  className={`pb-4 leading-relaxed ${isDark ? "text-gray-400" : "text-gray-600"}`}
                >
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
    <section className="py-24 bg-gradient-to-br from-[#F97316] to-[#EA580C] relative overflow-hidden noise-texture">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10 z-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
      </div>
      <div className="container mx-auto px-6 max-w-4xl text-center relative z-10">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
          Life's too short for tech headaches
        </h2>
        <p className="text-white/90 font-medium max-w-2xl mx-auto mb-10 text-xl lg:text-2xl">
          No more searching for answers at midnight. No more feeling stuck with your own devices. Just instant AI-powered help, whenever you need it.
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
            className="flex-1 px-6 py-4 rounded-full text-[#1F2937] text-lg font-medium focus:outline-none focus:ring-4 focus:ring-white/30 shadow-xl"
            required
          />
          <button
            type="submit"
            className="bg-[#1F2937] hover:bg-[#111827] text-white font-bold px-10 py-4 rounded-full text-lg transition-all whitespace-nowrap shadow-xl hover:shadow-2xl"
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
            <span>AI available 24/7</span>
          </div>
        </div>
      </div>
    </section>
  );
};

const Footer: React.FC<{ onNavigate: (view: PageView) => void }> = ({ onNavigate }) => {
  const handleNav = (view: PageView) => { onNavigate(view); window.scrollTo(0, 0); };

  return (
    <footer className="bg-[#1F2937] text-white pt-20 pb-10 border-t border-white/10">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <button onClick={() => handleNav(PageView.HOME)} className="mb-6 block">
              <Logo variant="light" />
            </button>
            <p className="text-white/60 text-sm leading-relaxed mb-6">
              Instant AI technical support for your home. We fix Wi-Fi, smart devices, and appliances in minutes.
            </p>
          </div>

          {/* Product Column */}
          <div>
            <h4 className="font-bold mb-6">Product</h4>
            <ul className="space-y-4 text-sm text-white/60">
              <li><button onClick={() => handleNav(PageView.HOW_IT_WORKS)} className="hover:text-[#F97316] transition-colors">How It Works</button></li>
              <li><button onClick={() => handleNav(PageView.PRICING)} className="hover:text-[#F97316] transition-colors">Pricing & Plans</button></li>
              <li><button onClick={() => handleNav(PageView.FAQ)} className="hover:text-[#F97316] transition-colors">Common Questions</button></li>
            </ul>
          </div>

          {/* Support Column */}
          <div>
            <h4 className="font-bold mb-6">Support</h4>
            <ul className="space-y-4 text-sm text-white/60">
              <li><button onClick={() => handleNav(PageView.LOGIN)} className="hover:text-[#F97316] transition-colors">Member Login</button></li>
              <li><button onClick={() => handleNav(PageView.SIGNUP)} className="hover:text-[#F97316] transition-colors">Start Free Trial</button></li>
              <li><span className="text-white/40 cursor-default">Help Center (Coming Soon)</span></li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h4 className="font-bold mb-6">Legal</h4>
            <ul className="space-y-4 text-sm text-white/60">
              <li><button onClick={() => handleNav(PageView.PRIVACY)} className="hover:text-[#F97316] transition-colors">Privacy Policy</button></li>
              <li><button onClick={() => handleNav(PageView.TERMS)} className="hover:text-[#F97316] transition-colors">Terms of Service</button></li>
              <li><button onClick={() => handleNav(PageView.CANCELLATION)} className="hover:text-[#F97316] transition-colors">Cancellation Policy</button></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/40">
          <div>© 2026 TechTriage Inc. All rights reserved.</div>
          <div className="flex gap-6">
            <button onClick={() => handleNav(PageView.CANCELLATION)} className="hover:text-white transition-colors">Cancellation Policy</button>
            <button onClick={() => handleNav(PageView.PRIVACY)} className="hover:text-white transition-colors">Privacy</button>
          </div>
        </div>
      </div>
    </footer>
  );
};

// URL path to PageView mapping
const pathToView: Record<string, PageView> = {
  '/': PageView.HOME,
  '/how-it-works': PageView.HOW_IT_WORKS,
  '/pricing': PageView.PRICING,
  '/faq': PageView.FAQ,
  '/signup': PageView.SIGNUP,
  '/login': PageView.LOGIN,
  '/dashboard': PageView.DASHBOARD,
  '/privacy': PageView.PRIVACY,
  '/terms': PageView.TERMS,
  '/cancellation': PageView.CANCELLATION,
};

const viewToPath: Record<PageView, string> = {
  [PageView.HOME]: '/',
  [PageView.HOW_IT_WORKS]: '/how-it-works',
  [PageView.PRICING]: '/pricing',
  [PageView.FAQ]: '/faq',
  [PageView.SIGNUP]: '/signup',
  [PageView.LOGIN]: '/login',
  [PageView.HISTORY]: '/history',
  [PageView.SAFETY]: '/safety',
  [PageView.DASHBOARD]: '/dashboard',
  [PageView.PRIVACY]: '/privacy',
  [PageView.TERMS]: '/terms',
  [PageView.CANCELLATION]: '/cancellation',
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
    const stored = localStorage.getItem('techtriage_user');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to get stored user:', e);
  }
  return null;
};

type DashboardView = 'main' | 'history' | 'settings' | 'billing';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<PageView>(getInitialView);
  const [capturedEmail, setCapturedEmail] = useState("");
  const [dashboardUser, setDashboardUser] = useState<DashboardUser | null>(getStoredUser);
  const [showLiveSupport, setShowLiveSupport] = useState(false);
  const [dashboardView, setDashboardView] = useState<DashboardView>('main');
  const chatRef = useRef<ChatWidgetHandle>(null);

  // Get auth state from session (for OAuth users)
  const { user: sessionUser, isAuthenticated, isLoading: authLoading, refetch: refetchAuth } = useAuth();

  // Check if user should see dashboard on initial load
  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser && window.location.pathname === '/dashboard') {
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
        firstName: sessionUser.firstName || sessionUser.username || 'User',
        lastName: sessionUser.lastName || undefined,
        email: sessionUser.email || '',
      };

      // If on dashboard, sync the user (ensures id is present)
      if (currentPath === '/dashboard') {
        setSessionChecked(true);
        setDashboardUser(syncedUser);
        localStorage.setItem('techtriage_user', JSON.stringify(syncedUser));
        setCurrentView(PageView.DASHBOARD);
      }

      // If on signup and authenticated, check if they've completed onboarding
      if (currentPath === '/signup' && sessionUser.id) {
        setSessionChecked(true);
        // Fetch full user profile to check onboarding status
        fetch(`/api/auth/user/${sessionUser.id}`)
          .then(res => res.json())
          .then(data => {
            // If user has completed onboarding (has homeType or techComfort), go to dashboard
            if (data.homeType || data.techComfort) {
              setDashboardUser(syncedUser);
              localStorage.setItem('techtriage_user', JSON.stringify(syncedUser));
              navigate(PageView.DASHBOARD);
            }
            // Otherwise, let them continue with onboarding in SignUp component
          })
          .catch(err => {
            console.error('Error checking user profile:', err);
          });
      }
    }
  }, [authLoading, isAuthenticated, sessionUser, sessionChecked]);

  // Additional sync: If dashboardUser exists but lacks id, and we have session, sync the id
  useEffect(() => {
    if (!authLoading && isAuthenticated && sessionUser?.id && dashboardUser && !dashboardUser.id) {
      const updatedUser = { ...dashboardUser, id: sessionUser.id };
      setDashboardUser(updatedUser);
      localStorage.setItem('techtriage_user', JSON.stringify(updatedUser));
    }
  }, [authLoading, isAuthenticated, sessionUser, dashboardUser]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const view = pathToView[path] || PageView.HOME;
      setCurrentView(view);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Custom navigate function that updates URL (memoized to prevent child re-renders)
  const navigate = useCallback((view: PageView) => {
    const path = viewToPath[view] || '/';
    if (window.location.pathname !== path) {
      window.history.pushState({ view }, '', path);
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

  const handleNavigateToSignup = useCallback((email?: string | React.MouseEvent) => {
    // Filter out MouseEvent objects (when called from onClick without args)
    if (email && typeof email === "string") {
      setCapturedEmail(email);
    }
    navigate(PageView.SIGNUP);
  }, [navigate]);

  const handleNavigateToPricing = useCallback(() => {
    navigate(PageView.PRICING);
  }, [navigate]);

  // Handle signup completion - store user and go to dashboard (memoized for Login/SignUp)
  const handleSignupComplete = useCallback((user: DashboardUser) => {
    setDashboardUser(user);
    localStorage.setItem('techtriage_user', JSON.stringify(user));
    // Refetch auth state to sync session with global auth context
    // This ensures ChatWidget and Header recognize the user as authenticated
    refetchAuth();
    navigate(PageView.DASHBOARD);
  }, [navigate, refetchAuth]);

  // Dashboard handlers (memoized to prevent unnecessary re-renders)
  const handleDashboardChat = useCallback(() => {
    chatRef.current?.open();
  }, []);

  const handleDashboardUploadImage = useCallback(() => {
    // Open chat with image upload intent
    chatRef.current?.open("I'd like to upload a photo of my issue for analysis.");
  }, []);

  const handleDashboardStartVideo = useCallback(() => {
    setShowLiveSupport(true);
  }, []);

  const handleDashboardLogout = useCallback(() => {
    setDashboardUser(null);
    setDashboardView('main');
    localStorage.removeItem('techtriage_user');
    localStorage.removeItem('techtriage_trial');
    // Also clear OAuth session by redirecting to logout endpoint
    window.location.href = '/api/auth/logout';
  }, []);

  const handleOpenHistory = useCallback(() => {
    setDashboardView('history');
  }, []);

  const handleOpenSettings = useCallback(() => {
    setDashboardView('settings');
  }, []);

  const handleOpenBilling = useCallback(() => {
    setDashboardView('billing');
  }, []);

  const handleBackToDashboard = useCallback(() => {
    setDashboardView('main');
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
        userName={dashboardUser ? `${dashboardUser.firstName} ${dashboardUser.lastName || ''}`.trim() : undefined}
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
      case PageView.LOGIN:
        return <Login onNavigate={navigate} onLogin={handleSignupComplete} />;
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
          if (dashboardView === 'history') {
            dashboardContent = (
              <SessionHistory
                userEmail={dashboardUser.email}
                userName={`${dashboardUser.firstName} ${dashboardUser.lastName || ''}`.trim()}
                embedded
              />
            );
          } else if (dashboardView === 'settings') {
            dashboardContent = (
              <Settings
                user={dashboardUser}
                onUpdateUser={handleUpdateUser}
                embedded
              />
            );
          } else if (dashboardView === 'billing' && dashboardUser.id) {
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
            <WhyTechTriage />
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
      <div className="min-h-screen bg-[#F9FAFB] font-['Inter',sans-serif] text-[#1F2937]">
        {renderContent()}
        <ChatWidget ref={chatRef} />
      </div>
    );
  }

  // SignUp and Login pages have their own standalone layout, don't show header/footer
  if (currentView === PageView.SIGNUP || currentView === PageView.LOGIN) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] font-['Inter',sans-serif] text-[#1F2937]">
        {renderContent()}
        <ChatWidget ref={chatRef} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-['Inter',sans-serif] text-[#1F2937]">
      <Header onNavigate={navigate} currentView={currentView} />
      <main>{renderContent()}</main>
      <Footer onNavigate={navigate} />
      <ChatWidget ref={chatRef} />
    </div>
  );
};

export default App;
