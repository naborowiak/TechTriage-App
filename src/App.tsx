import React, { useState, useRef, useEffect } from "react";
import {
  Menu,
  X,
  ArrowRight,
  Shield,
  Cpu,
  Home,
  Star,
  Sparkles,
  Video,
  Tv,
  Wifi,
  Phone,
  Zap,
  Wrench,
  Lock,
  CheckCircle2,
  Moon,
  Sun,
  LogOut,
  User,
} from "lucide-react";
import { ChatWidget, ChatWidgetHandle } from "./components/ChatWidget";
import { Logo } from "./components/Logo";
import { PageView } from "./types";
import { HowItWorks } from "./components/HowItWorks";
import { Pricing } from "./components/Pricing";
import { SignUp } from "./components/SignUp";
import { Login } from "./components/Login";
import { Dashboard } from "./components/Dashboard";
import { SessionHistory } from "./components/SessionHistory";
import { Settings } from "./components/Settings";
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
            onClick={() => handleNav(PageView.HOME)}
            className={`whitespace-nowrap ${currentView === PageView.HOME ? "text-[#F97316]" : `${textColor} ${hoverColor}`} transition-colors font-semibold text-[15px]`}
          >
            Product
          </button>
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
                Start Free Trial
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
            Start Free Trial
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
            onClick={() => handleNav(PageView.HOME)}
            className={`${isDark || isHomePage ? "text-white" : "text-[#1F2937]"} font-semibold text-base text-left`}
          >
            Product
          </button>
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
  <section className="relative pt-[72px] min-h-[700px] lg:min-h-[800px] overflow-hidden">
    {/* Background hero image */}
    <div
      className="absolute inset-0 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url(/hero-image-large.jpg)" }}
    >
      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#1F2937]/90 via-[#1F2937]/90 to-transparent"></div>
    </div>

    <div className="container mx-auto px-6 lg:px-12 relative z-10">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center min-h-[600px] lg:min-h-[700px]">
        {/* Left side - Content */}
        <div className="pt-8 lg:pt-0">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-white/20">
            <span className="text-[#F97316] font-bold text-sm">NEW</span>
            <span className="text-white font-medium text-sm">
              AI-Powered Live Video Support
            </span>
            <ArrowRight className="w-4 h-4 text-[#F97316]" />
          </div>
          <h1 className="text-4xl lg:text-5xl xl:text-6xl font-black text-white tracking-tight leading-[1.1] mb-6">
            Fix it faster—
            <br />
            <span className="text-[#F97316]">just show us.</span>
          </h1>
          <p className="text-white/80 text-xl lg:text-2xl font-medium leading-relaxed mb-10 max-w-lg">
            TechTriage connects you to AI + real specialists to troubleshoot
            safely and remotely. Photo, video, or text—we've got you covered.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <Button
              variant="orange"
              onClick={onFreeTrial}
              className="shadow-xl shadow-orange-500/30 text-lg px-10"
            >
              Start Free Trial
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
      title: "Tell us what's wrong",
      desc: "Start a chat and describe your issue in plain English. No tech jargon required.",
      icon: <Phone className="w-7 h-7" />,
    },
    {
      step: "02",
      title: "Show us the problem",
      desc: "Upload a photo, share your screen, or start a live video call so we can see exactly what you're dealing with.",
      icon: <Video className="w-7 h-7" />,
    },
    {
      step: "03",
      title: "Get it fixed",
      desc: "Follow our step-by-step guidance to resolve the issue—or we'll schedule an onsite visit if needed.",
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
            Three steps to peace of mind
          </h2>
          <p
            className={`text-xl max-w-2xl mx-auto ${isDark ? "text-gray-400" : "text-[#4B5563]"}`}
          >
            Getting help has never been easier. No appointments, no waiting
            rooms.
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
      label: "Wi-Fi & Internet",
      desc: "Connection issues, slow speeds, dead zones",
    },
    {
      icon: <Tv className="w-8 h-8" />,
      label: "TV & Streaming",
      desc: "Setup, apps, soundbars, remotes",
    },
    {
      icon: <Cpu className="w-8 h-8" />,
      label: "Computers",
      desc: "Slow performance, updates, viruses",
    },
    {
      icon: <Home className="w-8 h-8" />,
      label: "Smart Home",
      desc: "Devices, hubs, automation",
    },
    {
      icon: <Lock className="w-8 h-8" />,
      label: "Accounts & Passwords",
      desc: "Recovery, setup, security",
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      label: "Mystery Issues",
      desc: '"It was working yesterday..."',
    },
    {
      icon: <Wrench className="w-8 h-8" />,
      label: "Appliances",
      desc: "Error codes, troubleshooting",
    },
    {
      icon: <Zap className="w-8 h-8" />,
      label: "HVAC & Thermostats",
      desc: "Programming, connectivity",
    },
  ];

  return (
    <section
      className={`py-24 noise-texture ${isDark ? "bg-[#111827]" : "bg-white"}`}
    >
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center mb-16">
          <span className="inline-block text-[#F97316] font-bold text-sm uppercase tracking-wider mb-4">
            What We Fix
          </span>
          <h2
            className={`text-4xl lg:text-5xl font-black mb-6 ${isDark ? "text-white" : "text-[#1F2937]"}`}
          >
            Everyday tech problems, solved
          </h2>
          <p
            className={`text-xl max-w-2xl mx-auto ${isDark ? "text-gray-400" : "text-[#4B5563]"}`}
          >
            From blinking routers to beeping thermostats—we speak your language.
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

const TrustSection: React.FC = () => (
  <section className="py-24 bg-gradient-to-br from-[#1F2937] to-[#111827] text-white overflow-hidden noise-texture noise-texture-strong">
    <div className="container mx-auto px-6 max-w-6xl">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <span className="inline-block text-[#F97316] font-bold text-sm uppercase tracking-wider mb-4">
            Why TechTriage
          </span>
          <h2 className="text-4xl lg:text-5xl font-black mb-6 leading-tight">
            Real specialists.
            <br />
            Real answers.
          </h2>
          <p className="text-white/70 text-xl mb-8 leading-relaxed">
            No stress. No runaround. Just honest help from people who actually
            know what they're doing.
          </p>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#F97316] rounded-xl flex items-center justify-center shrink-0">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-white text-lg mb-1">
                  Safe & Remote-First
                </h4>
                <p className="text-white/60">
                  Troubleshoot from home. No strangers unless you need them.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#F97316] rounded-xl flex items-center justify-center shrink-0">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-white text-lg mb-1">
                  Your Privacy, Protected
                </h4>
                <p className="text-white/60">
                  You control what you share. We never sell your data.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#F97316] rounded-xl flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-white text-lg mb-1">
                  Trusted Nationwide
                </h4>
                <p className="text-white/60">
                  Real people helping real neighbors, coast to coast.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="relative hidden lg:block">
          <div className="absolute inset-0 bg-gradient-to-br from-[#F97316]/20 to-purple-500/20 rounded-3xl blur-3xl"></div>
          <div className="relative bg-white/5 backdrop-blur border border-white/10 rounded-3xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-[#F97316] to-[#EA580C] rounded-2xl flex items-center justify-center">
                <Star className="w-8 h-8 text-white fill-white" />
              </div>
              <div>
                <div className="text-white font-black text-3xl">4.9/5</div>
                <div className="text-white/60">Customer Rating</div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-white/60">Issue Resolution</span>
                <span className="text-white font-bold">94%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#F97316] rounded-full"
                  style={{ width: "94%" }}
                ></div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">Avg. Response Time</span>
                <span className="text-white font-bold">&lt; 3 min</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#F97316] rounded-full"
                  style={{ width: "88%" }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const TestimonialSection: React.FC = () => {
  const { isDark } = useTheme();
  const testimonials = [
    {
      quote:
        "TechTriage has taken a lot of stress off my shoulders. I can troubleshoot from my cell phone. I'm not tied to my office.",
      name: "Kelly Shelton",
      role: "Homeowner, St. Louis MO",
      image: "/images/testimonial-1.jpg",
    },
    {
      quote:
        "The AI diagnosed my HVAC issue in seconds. Saved me $400 on an unnecessary service call!",
      name: "Marcus Johnson",
      role: "Property Manager, Austin TX",
      image: "/images/testimonial-2.jpg",
    },
    {
      quote:
        "Finally, a tech support that speaks my language. The video calls with real experts are a game-changer.",
      name: "Sarah Chen",
      role: "First-time Homeowner, Seattle WA",
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
            What Our Customers Say
          </h2>
          <p
            className={`text-lg ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            Real stories from real homeowners
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
      q: "How fast can I get help?",
      a: "Most text support sessions connect within minutes. AI photo analysis is instant. Live video sessions typically start within 15 minutes.",
    },
    {
      q: "What if you can't fix it remotely?",
      a: "If remote troubleshooting can't solve the issue, we'll help schedule an onsite technician visit at a time that works for you.",
    },
    {
      q: "Is my information private?",
      a: "Absolutely. You control what you share. Photos, videos, and conversations are never shared without your explicit permission.",
    },
    {
      q: "Do I need to download an app?",
      a: "Nope! TechTriage works right in your browser. Just text us, upload a photo, or start a video call—no downloads required.",
    },
    {
      q: "What areas do you serve?",
      a: "We provide remote support nationwide. Onsite visits are currently available in the St. Louis metro area, with more regions coming soon.",
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
          Ready to fix it?
        </h2>
        <p className="text-white/90 font-medium max-w-2xl mx-auto mb-10 text-xl lg:text-2xl">
          Stop Googling. Stop stressing. Get real help in minutes.
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
            <span>24/7 support</span>
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

  // Map link names to navigation actions
  const getLinkAction = (item: string): (() => void) | null => {
    const navMap: Record<string, () => void> = {
      Pricing: () => handleNav(PageView.PRICING),
      "Text Support": () => handleNav(PageView.PRICING),
      "AI Photo Triage": () => handleNav(PageView.PRICING),
      "Live Video Help": () => handleNav(PageView.PRICING),
      "Onsite Visits": () => handleNav(PageView.PRICING),
      Support: () => handleNav(PageView.HOW_IT_WORKS),
    };
    return navMap[item] || null;
  };

  const links = {
    "What We Fix": [
      "Wi-Fi Issues",
      "TV & Streaming",
      "Computers",
      "Smart Home",
      "Appliances",
      "HVAC",
    ],
    "Support Levels": [
      "Text Support",
      "AI Photo Triage",
      "Live Video Help",
      "Onsite Visits",
    ],
    Resources: [
      "Pricing",
      "How It Works",
      "Safety Center",
      "Blog",
      "Podcast",
      "Support",
    ],
    Company: [
      "Our Story",
      "Our Team",
      "Press",
      "Careers",
      "Contact",
      "Privacy",
    ],
  };

  return (
    <footer className="bg-[#1F2937] pt-20 pb-10">
      <div className="container mx-auto px-6">
        <div className="mb-12">
          <button onClick={() => handleNav(PageView.HOME)}>
            <Logo variant="light" />
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
          {Object.entries(links).map(([cat, items]) => (
            <div key={cat}>
              <h4 className="font-bold text-white mb-6 text-base">{cat}</h4>
              <ul className="space-y-3">
                {items.map((item) => {
                  const action = getLinkAction(item);
                  // Special case for "How It Works"
                  if (item === "How It Works") {
                    return (
                      <li key={item}>
                        <button
                          onClick={() => handleNav(PageView.HOW_IT_WORKS)}
                          className="text-white/60 hover:text-[#F97316] text-base font-medium transition-colors"
                        >
                          {item}
                        </button>
                      </li>
                    );
                  }
                  return (
                    <li key={item}>
                      {action ? (
                        <button
                          onClick={action}
                          className="text-white/60 hover:text-[#F97316] text-base font-medium transition-colors"
                        >
                          {item}
                        </button>
                      ) : (
                        <span className="text-white/60 hover:text-[#F97316] text-base font-medium transition-colors cursor-pointer">
                          {item}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-white/40 text-sm font-medium">
            © 2026 TechTriage Inc. All rights reserved.
          </div>
          <div className="flex gap-6 text-white/40 text-sm font-medium">
            <span className="hover:text-white transition-colors cursor-pointer">
              Privacy Policy
            </span>
            <span className="hover:text-white transition-colors cursor-pointer">
              Terms of Service
            </span>
            <span className="hover:text-white transition-colors cursor-pointer">
              Accessibility
            </span>
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
  '/signup': PageView.SIGNUP,
  '/login': PageView.LOGIN,
  '/dashboard': PageView.DASHBOARD,
};

const viewToPath: Record<PageView, string> = {
  [PageView.HOME]: '/',
  [PageView.HOW_IT_WORKS]: '/how-it-works',
  [PageView.PRICING]: '/pricing',
  [PageView.SIGNUP]: '/signup',
  [PageView.LOGIN]: '/login',
  [PageView.HISTORY]: '/history',
  [PageView.SAFETY]: '/safety',
  [PageView.DASHBOARD]: '/dashboard',
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

type DashboardView = 'main' | 'history' | 'settings';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<PageView>(getInitialView);
  const [capturedEmail, setCapturedEmail] = useState("");
  const [dashboardUser, setDashboardUser] = useState<DashboardUser | null>(getStoredUser);
  const [showLiveSupport, setShowLiveSupport] = useState(false);
  const [dashboardView, setDashboardView] = useState<DashboardView>('main');
  const chatRef = useRef<ChatWidgetHandle>(null);

  // Check if user should see dashboard on initial load
  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser && window.location.pathname === '/dashboard') {
      setDashboardUser(storedUser);
      setCurrentView(PageView.DASHBOARD);
    }
  }, []);

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

  // Custom navigate function that updates URL
  const navigate = (view: PageView) => {
    const path = viewToPath[view] || '/';
    if (window.location.pathname !== path) {
      window.history.pushState({ view }, '', path);
    }
    setCurrentView(view);
    window.scrollTo(0, 0);
  };

  const handleStart = () => {
    chatRef.current?.open("I'd like to start a free trial.");
  };

  const handleSpeakToExpert = () => {
    chatRef.current?.openAsLiveAgent();
  };

  const handleFreeTrial = () => {
    navigate(PageView.SIGNUP);
  };

  const handleNavigateToSignup = (email?: string | React.MouseEvent) => {
    // Filter out MouseEvent objects (when called from onClick without args)
    if (email && typeof email === "string") {
      setCapturedEmail(email);
    }
    navigate(PageView.SIGNUP);
  };

  const handleNavigateToPricing = () => {
    navigate(PageView.PRICING);
  };

  // Handle signup completion - store user and go to dashboard
  const handleSignupComplete = (user: DashboardUser) => {
    setDashboardUser(user);
    localStorage.setItem('techtriage_user', JSON.stringify(user));
    navigate(PageView.DASHBOARD);
  };

  // Dashboard handlers
  const handleDashboardChat = () => {
    chatRef.current?.open();
  };

  const handleDashboardUploadImage = () => {
    // Open chat with image upload intent
    chatRef.current?.open("I'd like to upload a photo of my issue for analysis.");
  };

  const handleDashboardStartVideo = () => {
    setShowLiveSupport(true);
  };

  const handleDashboardLogout = () => {
    setDashboardUser(null);
    setDashboardView('main');
    localStorage.removeItem('techtriage_user');
    localStorage.removeItem('techtriage_trial');
    navigate(PageView.HOME);
  };

  const handleOpenHistory = () => {
    setDashboardView('history');
  };

  const handleOpenSettings = () => {
    setDashboardView('settings');
  };

  const handleBackToDashboard = () => {
    setDashboardView('main');
  };

  const handleUpdateUser = (updatedUser: DashboardUser) => {
    setDashboardUser(updatedUser);
  };

  // Show live support fullscreen if active
  if (showLiveSupport) {
    return (
      <LiveSupport
        onClose={() => setShowLiveSupport(false)}
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
      case PageView.SIGNUP:
        return (
          <SignUp
            onStart={handleStart}
            initialEmail={capturedEmail}
            onSpeakToExpert={handleSpeakToExpert}
            onComplete={handleSignupComplete}
          />
        );
      case PageView.LOGIN:
        return <Login onNavigate={navigate} onLogin={handleSignupComplete} />;
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
            <TrustSection />
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
