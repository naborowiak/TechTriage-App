import React, { useState, useRef, useEffect, useCallback, lazy, Suspense } from "react";
import {
  Menu,
  X,
  Home,
  Tv,
  Wifi,
  CheckCircle2,
  LogOut,
  User,
  Smartphone,
  Monitor,
  Printer,
  MessageSquare,
  Camera,
  Zap,
  AlertTriangle,
  Plus,
  Minus,
  HelpCircle,
  Sun,
  Moon,
  Video,
  Sparkles,
  FileText,
  ArrowRight,
  ChevronDown,
  Check,
} from "lucide-react";
import { ChatWidget, ChatWidgetHandle } from "./components/ChatWidget";
import { ProfileDropdown } from "./components/ProfileDropdown";
import { Logo } from "./components/Logo";
import { PageView } from "./types";
import { useAuth } from "./hooks/useAuth";
import { LiveSupport } from "./components/LiveSupport";
import { useSyncUsageWithAuth, useUsage } from "./stores/usageStore";
import { useSubscription } from "./hooks/useSubscription";
import { useTheme } from "./context/ThemeContext";
import type { SettingsTab } from "./components/SettingsModal";
import { AnimatedElement } from "./hooks/useAnimations";
import { CookieConsentBanner } from "./components/CookieConsentBanner";
import { ServicesSection } from "./components/ServicesSection";
import { usePWAInstall } from "./hooks/usePWAInstall";
import { PWAInstallBanner } from "./components/PWAInstallBanner";

// Lazy-loaded page components (code splitting)
const HowItWorks = lazy(() => import("./components/HowItWorks").then(m => ({ default: m.HowItWorks })));
const Pricing = lazy(() => import("./components/Pricing").then(m => ({ default: m.Pricing })));
const FAQ = lazy(() => import("./components/FAQ").then(m => ({ default: m.FAQ })));
const SignUp = lazy(() => import("./components/SignUp").then(m => ({ default: m.SignUp })));
const Login = lazy(() => import("./components/Login").then(m => ({ default: m.Login })));
const Dashboard = lazy(() => import("./components/Dashboard").then(m => ({ default: m.Dashboard })));
const SessionHistory = lazy(() => import("./components/SessionHistory").then(m => ({ default: m.SessionHistory })));
const PrivacyPolicy = lazy(() => import("./components/PrivacyPolicy").then(m => ({ default: m.PrivacyPolicy })));
const TermsOfService = lazy(() => import("./components/TermsOfService").then(m => ({ default: m.TermsOfService })));
const CancellationPolicy = lazy(() => import("./components/CancellationPolicy").then(m => ({ default: m.CancellationPolicy })));
const VerifyEmail = lazy(() => import("./components/VerifyEmail").then(m => ({ default: m.VerifyEmail })));
const ForgotPassword = lazy(() => import("./components/ForgotPassword").then(m => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import("./components/ResetPassword").then(m => ({ default: m.ResetPassword })));
const ScoutChatScreen = lazy(() => import("./components/scout/ScoutChatScreen").then(m => ({ default: m.ScoutChatScreen })));
const SettingsModal = lazy(() => import("./components/SettingsModal").then(m => ({ default: m.SettingsModal })));
const CaseAnalytics = lazy(() => import("./components/CaseAnalytics").then(m => ({ default: m.CaseAnalytics })));
const SpecialistResponse = lazy(() => import("./components/SpecialistResponse").then(m => ({ default: m.SpecialistResponse })));
const ServicePage = lazy(() => import("./components/ServicePage").then(m => ({ default: m.ServicePage })));

// Page loading fallback for lazy-loaded routes
const PageLoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-light-100 dark:bg-midnight-950 transition-colors">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-electric-indigo border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-text-secondary font-medium">Loading...</p>
    </div>
  </div>
);

// ============================================
// Animation Hooks & Components
// ============================================

// Page transition wrapper component
const PageTransition: React.FC<{ children: React.ReactNode; pageKey: string }> = ({ children, pageKey }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(false);
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, [pageKey]);

  return (
    <div
      className={`transition-all duration-300 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      {children}
    </div>
  );
};

// ============================================
// End Animation Hooks & Components (now imported from useAnimations.tsx)
// ============================================

// Usage Banner - slim bar above header for free-tier users
const UsageBanner: React.FC<{
  onNavigate: (view: PageView) => void;
}> = ({ onNavigate }) => {
  const { tier, usage, getVideoCreditsRemaining } = useUsage();
  const { isAuthenticated } = useAuth();

  // Only show for authenticated free/home users (not pro, not guests)
  if (!isAuthenticated || tier === 'pro' || tier === 'guest') return null;

  const isUnlimited = tier === 'home';
  const chatRemaining = isUnlimited ? null : Math.max(0, usage.chat.limit - usage.chat.used);
  const photoRemaining = isUnlimited ? null : Math.max(0, usage.photo.limit - usage.photo.used);
  const videoCredits = tier === 'home' ? getVideoCreditsRemaining() : null;

  return (
    <div className="w-full bg-light-50 dark:bg-midnight-900 border-b border-light-200 dark:border-midnight-800">
      <div className="container mx-auto px-4 sm:px-6 flex items-center justify-between h-8">
        <div className="flex items-center gap-4 text-[11px] font-medium text-text-secondary">
          <Zap className="w-3 h-3 text-electric-cyan flex-shrink-0" />
          {chatRemaining !== null && (
            <span>
              <span className="text-text-primary dark:text-white font-semibold">{chatRemaining}</span> chats
            </span>
          )}
          {photoRemaining !== null && (
            <span>
              <span className="text-text-primary dark:text-white font-semibold">{photoRemaining}</span> photos
            </span>
          )}
          {videoCredits !== null && (
            <span>
              <span className="text-text-primary dark:text-white font-semibold">{videoCredits}</span> video credits
            </span>
          )}
          {isUnlimited && (
            <span className="text-electric-cyan">Unlimited chat & photos</span>
          )}
        </div>
        {!isUnlimited && (
          <button
            onClick={() => onNavigate(PageView.PRICING)}
            className="text-[11px] font-bold text-electric-indigo hover:text-electric-indigo/80 transition-colors flex items-center gap-1"
          >
            Upgrade
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};

type HeaderDashboardView = 'main' | 'history' | 'settings' | 'billing';

const Header: React.FC<{
  onNavigate: (view: PageView) => void;
  currentView: PageView;
  onOpenChat?: () => void;
  onDashboardNavigate?: (view: HeaderDashboardView) => void;
}> = ({ onNavigate, currentView, onOpenChat, onDashboardNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [menuAnimating, setMenuAnimating] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleNav = (view: PageView) => {
    onNavigate(view);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Close on Escape key + lock body scroll while menu is open
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Close when clicking outside the menu panel
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const panel = mobileMenuRef.current;
      if (!panel) return;
      // Check if click is outside the panel (but not on the hamburger button)
      if (!panel.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };

    // Small delay to prevent immediate close on open
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 10);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileMenuOpen]);

  // Handle menu open/close with animation
  const toggleMenu = () => {
    if (mobileMenuOpen) {
      setMenuAnimating(true);
      setTimeout(() => {
        setMobileMenuOpen(false);
        setMenuAnimating(false);
      }, 200);
    } else {
      setMobileMenuOpen(true);
    }
  };

  // Theme-aware text colors
  const textColor = "text-text-primary dark:text-white";
  const textColorMuted = "text-text-secondary";
  const hoverColor = "hover:text-electric-indigo";

  return (
    <header className="fixed top-0 left-0 w-full z-50 h-[72px] bg-white dark:bg-midnight-900 border-b border-light-300 dark:border-midnight-700 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        {/* LEFT: Logo */}
        <button
          onClick={() => handleNav(PageView.HOME)}
          className="focus:outline-none focus-visible:ring-2 focus-visible:ring-electric-indigo/60 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-midnight-900 rounded shrink-0"
          aria-label="Go to home"
        >
          <Logo variant="dark" className="dark:hidden" />
          <Logo variant="light" className="hidden dark:flex" />
        </button>

        {/* CENTER: Primary Navigation (desktop only) */}
        <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
          <button
            onClick={() => handleNav(PageView.HOW_IT_WORKS)}
            aria-current={currentView === PageView.HOW_IT_WORKS ? "page" : undefined}
            className={`whitespace-nowrap ${currentView === PageView.HOW_IT_WORKS ? "text-electric-indigo" : `${textColor} ${hoverColor}`} transition-colors font-semibold text-[15px] focus:outline-none focus-visible:ring-2 focus-visible:ring-electric-indigo/60 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-midnight-900 rounded px-1 py-1`}
          >
            How It Works
          </button>
          <button
            onClick={() => handleNav(PageView.PRICING)}
            aria-current={currentView === PageView.PRICING ? "page" : undefined}
            className={`whitespace-nowrap ${currentView === PageView.PRICING ? "text-electric-indigo" : `${textColor} ${hoverColor}`} transition-colors font-semibold text-[15px] focus:outline-none focus-visible:ring-2 focus-visible:ring-electric-indigo/60 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-midnight-900 rounded px-1 py-1`}
          >
            Pricing
          </button>
          <button
            onClick={() => handleNav(PageView.FAQ)}
            aria-current={currentView === PageView.FAQ ? "page" : undefined}
            className={`whitespace-nowrap ${currentView === PageView.FAQ ? "text-electric-indigo" : `${textColor} ${hoverColor}`} transition-colors font-semibold text-[15px] focus:outline-none focus-visible:ring-2 focus-visible:ring-electric-indigo/60 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-midnight-900 rounded px-1 py-1`}
          >
            FAQs
          </button>
        </nav>

        {/* RIGHT: Utility items (desktop) */}
        <div className="hidden lg:flex items-center gap-4 shrink-0">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-light-200 dark:hover:bg-midnight-800 transition-colors text-text-secondary hover:text-text-primary dark:hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-electric-indigo/60 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-midnight-900"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </button>

          {/* Auth section */}
          {isLoading ? (
            <div className={`${textColorMuted} text-sm`}>...</div>
          ) : isAuthenticated && user ? (
            <>
              <button
                onClick={() => onNavigate(PageView.DASHBOARD)}
                className="btn-gradient-electric text-white font-semibold px-6 py-2.5 rounded-lg text-sm whitespace-nowrap"
              >
                Dashboard
              </button>
              <ProfileDropdown
                user={user}
                onDashboardNavigate={onDashboardNavigate}
                onOpenChat={onOpenChat}
                onLogout={logout}
              />
            </>
          ) : (
            <>
              <button
                onClick={() => onNavigate(PageView.LOGIN)}
                className={`${textColorMuted} ${hoverColor} transition-colors text-sm font-medium whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-electric-indigo/60 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-midnight-900 rounded-lg px-4 py-2.5`}
              >
                Log In
              </button>
              <button
                onClick={() => onNavigate(PageView.SIGNUP)}
                className="btn-gradient-electric text-white font-semibold px-6 py-2.5 rounded-lg text-sm whitespace-nowrap"
              >
                Get Started
              </button>
            </>
          )}
        </div>

        {/* Mobile: CTA + Hamburger */}
        <div className="flex lg:hidden items-center gap-3">
          <button
            onClick={() => onNavigate(isAuthenticated && user ? PageView.DASHBOARD : PageView.SIGNUP)}
            className="btn-gradient-electric text-white font-semibold px-4 py-2 rounded-lg text-sm whitespace-nowrap"
          >
            {isAuthenticated && user ? 'Dashboard' : 'Get Started'}
          </button>
          <button
            onClick={toggleMenu}
            className="p-2 rounded-lg hover:bg-light-200 dark:hover:bg-midnight-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-electric-indigo/60 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-midnight-900"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-text-primary dark:text-white" />
            ) : (
              <Menu className="w-6 h-6 text-text-primary dark:text-white" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay + Panel */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" style={{ top: 72 }}>
          {/* Backdrop overlay */}
          <div
            className={`absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-200 ${
              menuAnimating ? 'opacity-0' : 'opacity-100'
            }`}
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Menu panel with slide animation */}
          <div
            ref={mobileMenuRef}
            className={`absolute top-0 left-0 right-0 bg-white dark:bg-midnight-900 border-b border-light-300 dark:border-midnight-700 shadow-xl transform transition-all duration-200 ease-out ${
              menuAnimating
                ? 'opacity-0 -translate-y-2'
                : 'opacity-100 translate-y-0'
            }`}
          >
            <div className="px-6 py-5 flex flex-col gap-1">
              {/* Navigation items with 44px+ tap targets */}
              <button
                onClick={() => handleNav(PageView.HOW_IT_WORKS)}
                className="min-h-[48px] flex items-center font-semibold text-base text-text-primary dark:text-white hover:text-electric-indigo active:text-electric-indigo transition-colors text-left px-2 -mx-2 rounded-lg hover:bg-light-100 dark:hover:bg-midnight-800"
              >
                How It Works
              </button>
              <button
                onClick={() => handleNav(PageView.PRICING)}
                className="min-h-[48px] flex items-center font-semibold text-base text-text-primary dark:text-white hover:text-electric-indigo active:text-electric-indigo transition-colors text-left px-2 -mx-2 rounded-lg hover:bg-light-100 dark:hover:bg-midnight-800"
              >
                Pricing
              </button>
              <button
                onClick={() => handleNav(PageView.FAQ)}
                className="min-h-[48px] flex items-center font-semibold text-base text-text-primary dark:text-white hover:text-electric-indigo active:text-electric-indigo transition-colors text-left px-2 -mx-2 rounded-lg hover:bg-light-100 dark:hover:bg-midnight-800"
              >
                FAQs
              </button>

              <div className="h-px bg-light-300 dark:bg-midnight-700 my-3" />

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="min-h-[48px] flex items-center gap-3 text-text-secondary hover:text-electric-indigo active:text-electric-indigo transition-colors px-2 -mx-2 rounded-lg hover:bg-light-100 dark:hover:bg-midnight-800"
              >
                {theme === 'light' ? (
                  <>
                    <Moon className="w-5 h-5" />
                    <span className="font-medium">Dark Mode</span>
                  </>
                ) : (
                  <>
                    <Sun className="w-5 h-5" />
                    <span className="font-medium">Light Mode</span>
                  </>
                )}
              </button>

              <div className="h-px bg-light-300 dark:bg-midnight-700 my-3" />

              {/* Auth section */}
              {isAuthenticated && user ? (
                <>
                  <div className="min-h-[48px] flex items-center gap-3 text-text-primary dark:text-white font-medium px-2 -mx-2">
                    {user.profileImageUrl ? (
                      <img
                        src={user.profileImageUrl}
                        alt={user.firstName || "User"}
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-electric-indigo/50"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-electric-indigo flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <span>{user.firstName || user.email || "User"}</span>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="min-h-[48px] flex items-center gap-3 text-text-secondary hover:text-electric-indigo active:text-electric-indigo font-medium transition-colors px-2 -mx-2 rounded-lg hover:bg-light-100 dark:hover:bg-midnight-800"
                  >
                    <LogOut className="w-5 h-5" />
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleNav(PageView.LOGIN)}
                  className="min-h-[48px] flex items-center font-semibold text-base text-text-primary dark:text-white hover:text-electric-indigo active:text-electric-indigo transition-colors px-2 -mx-2 rounded-lg hover:bg-light-100 dark:hover:bg-midnight-800"
                >
                  Log In
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};


const HERO_SLIDES = [
  { id: 1, top: "/slide-1-new.png", alt: "Homeowner chatting with TotalAssist about a Wi-Fi issue" },
  { id: 2, top: "/slide-2-new.png", alt: "TotalAssist guiding a homeowner through a step-by-step modem fix" },
  { id: 3, top: "/slide-3-new.png", alt: "Homeowner celebrating a restored connection with a PDF report" },
];

const TYPEWRITER_WORDS = [
  'Wi-Fi',
  'Smart TVs',
  'Printers',
  'Thermostats',
  'Streaming',
  'Routers',
  'Smart Home',
  'Appliances',
];

const Hero: React.FC<{
  onFreeTrial: () => void;
  onPricing: () => void;
  onHeroAction?: (mode: 'voice' | 'photo' | 'video' | 'chat') => void;
}> = ({
  onFreeTrial,
}) => {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  // Typewriter effect
  const [displayText, setDisplayText] = useState('');
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = TYPEWRITER_WORDS[wordIndex];
    const typeSpeed = isDeleting ? 40 : 80;
    const pauseDelay = isDeleting ? 0 : 2000;

    if (!isDeleting && displayText === currentWord) {
      // Finished typing — pause then start deleting
      const timer = setTimeout(() => setIsDeleting(true), pauseDelay);
      return () => clearTimeout(timer);
    }

    if (isDeleting && displayText === '') {
      // Finished deleting — move to next word
      setIsDeleting(false);
      setWordIndex((prev) => (prev + 1) % TYPEWRITER_WORDS.length);
      return;
    }

    const timer = setTimeout(() => {
      setDisplayText(
        isDeleting
          ? currentWord.substring(0, displayText.length - 1)
          : currentWord.substring(0, displayText.length + 1)
      );
    }, typeSpeed);

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, wordIndex]);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [paused]);

  return (
    <div className="agentic-hero-banner relative bg-xenon-900 dark overflow-hidden -mt-[72px]">
      <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none">
        <source src="/hero-bg.mp4" type="video/mp4" />
      </video>
      {/* Brand gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.35) 0%, rgba(6,182,212,0.20) 50%, rgba(99,102,241,0.15) 100%)',
        }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 20% 50%, rgba(99,102,241,0.25) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 80% 40%, rgba(6,182,212,0.18) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-[1440px] overflow-x-clip overflow-y-visible z-10 pt-[120px] lg:pt-[160px] px-6 lg:px-16">
        <div className="mx-auto relative z-20 flex flex-col xl:flex-row xl:items-center">

          {/* Left column */}
          <div className="relative w-full xl:w-1/2 flex flex-col justify-center">
            <div className="max-w-[520px] xl:max-w-[640px] mx-auto xl:mx-0">
              <h1
                className="hero-animate-1 font-bold font-sora text-white mb-6 mt-10 text-center xl:text-left"
                style={{ letterSpacing: '-2.5px' }}
              >
                <span className="block text-[24px] sm:text-[30px] lg:text-[36px] xl:text-[44px] leading-tight text-white/80 mb-2 sm:mb-3">
                  Get help with
                </span>
                <span className="block text-[32px] sm:text-[42px] lg:text-[48px] xl:text-[58px] leading-none">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6366F1] to-[#06B6D4]">
                    {displayText}
                  </span>
                  <span className="hero-cursor" aria-hidden="true" />
                </span>
              </h1>
              <div className="hero-animate-2 mt-3 sm:mt-4 lg:mt-5 xl:max-w-[480px]">
                <p className="font-sora text-center xl:text-left text-sm sm:text-base lg:text-[17px] xl:text-[18px] font-normal leading-relaxed text-white/80 my-0 text-balance">
                  24/7 AI-powered tech support for your<br />
                  home — chat, snap a photo, or hop on<br />
                  a video call.
                </p>
              </div>
            </div>

            <div className="hero-animate-3 flex justify-center gap-4 mt-8 md:mt-9 lg:mt-11 xl:justify-start xl:mb-20">
              <div className="flex font-sora justify-center xl:justify-start">
                <button
                  onClick={onFreeTrial}
                  className="overflow-hidden flex flex-wrap items-center cursor-pointer font-sora w-full justify-center xl:justify-start text-white px-6 rounded-lg min-h-12 lg:min-h-14 blue-gradient"
                >
                  <span className="font-semibold mx-auto font-sora leading-[1.5] text-sm lg:text-base tracking-[0.28px] lg:tracking-[0.32px]">
                    Get Started Free
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Right column — carousel */}
          <div className="hero-animate-4 w-full xl:w-1/2 flex justify-center xl:justify-end mt-6 xl:mt-0">
            <div
              className={`relative w-full max-w-[700px] aspect-[4/3] xl:aspect-auto xl:h-[680px]${paused ? ' agentic-hero-paused' : ''}`}
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
            >

              {HERO_SLIDES.map((slide, i) => (
                <div
                  key={slide.id}
                  className="agentic-hero-slide absolute inset-0 transition-opacity pointer-events-none"
                  style={{ opacity: active === i ? 1 : 0, transition: 'opacity 1.5s ease-out' }}
                >
                  <img alt="" src="/color-blur.png" width={1351} height={690} className="agentic-hero-blur absolute inset-0 w-full h-full object-cover pointer-events-none" style={{ opacity: 0.9 }} loading="eager" />
                  <img src={slide.top} width={800} height={597} className="absolute bottom-0 left-0 xl:left-auto xl:right-0 w-full h-auto xl:w-auto xl:h-full xl:max-w-none" alt={slide.alt} loading={i === 0 ? 'eager' : 'lazy'} />
                </div>
              ))}

              {/* Dots */}
              <div className="agentic-hero-dots absolute flex gap-2">
                {HERO_SLIDES.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`agentic-hero-dot${active === i ? ' agentic-hero-dot--active' : ''}`}
                    aria-label={`Go to slide ${i + 1}`}
                    aria-current={active === i}
                    onClick={() => setActive(i)}
                  />
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// Section Divider Component for visual separation
const SectionDivider: React.FC<{ variant?: 'gradient' | 'line' | 'wave' | 'hexagon' }> = () => {
  return <div className="h-px bg-surface-border dark:bg-midnight-700" />;
};

const HowItWorksSimple: React.FC = () => {
  const steps = [
    {
      step: "1.",
      title: "Tell Us",
      desc: '"My Wi-Fi keeps dropping" or "There\'s a weird error code"—just describe it like you would to a friend. Our team understands and guides you through it.',
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
    <section className="py-24 bg-light-100 dark:bg-midnight-950 border-t border-light-300 dark:border-midnight-700 transition-colors">
      <div className="container mx-auto px-6 max-w-6xl">
        <AnimatedElement animation="fadeInUp" className="text-center mb-16">
          <span className="inline-block text-electric-indigo font-bold text-sm uppercase tracking-wider mb-4">
            How It Works
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-text-primary dark:text-white">
            Help that actually helps
          </h2>
          <p className="text-xl max-w-2xl mx-auto text-text-secondary">
            No hold music. No "have you tried turning it off and on again." Just
            clear answers and real solutions.
          </p>
        </AnimatedElement>
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((s, i) => (
            <AnimatedElement key={i} animation="fadeInUp" delay={0.2 + i * 0.15}>
              <div className="relative">
                {/* Connector line */}
                {i < 2 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-surface-border dark:bg-midnight-700"></div>
                )}
                <div className="relative card-clean rounded-2xl p-8 hover:-translate-y-1.5 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center text-electric-indigo" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(6,182,212,0.10) 100%)' }}>
                      {s.icon}
                    </div>
                    <span className="text-5xl font-bold text-gradient-electric">
                      {s.step}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-text-primary dark:text-white">
                    {s.title}
                  </h3>
                  <p className="leading-relaxed text-text-secondary">
                    {s.desc}
                  </p>
                </div>
              </div>
            </AnimatedElement>
          ))}
        </div>
      </div>
    </section>
  );
};

const WhatWeHelpWith: React.FC<{ onNavigate: (view: PageView) => void }> = ({ onNavigate }) => {
  const { theme } = useTheme();
  const bgImage = theme === 'dark' ? '/widescreen-shot-dark.jpg' : '/widescreen-shot.jpg';

  const problems = [
    {
      icon: <Wifi className="w-7 h-7" />,
      label: "Wi-Fi & Internet",
      desc: "Slow speeds, dead zones, router issues, and connection drops diagnosed and fixed.",
    },
    {
      icon: <Tv className="w-7 h-7" />,
      label: "TV & Streaming",
      desc: "Smart TV setup, app issues, streaming quality, and device pairing.",
    },
    {
      icon: <Monitor className="w-7 h-7" />,
      label: "Computers & Laptops",
      desc: "Performance, software updates, crashes, and hardware troubleshooting.",
    },
    {
      icon: <Home className="w-7 h-7" />,
      label: "Smart Home",
      desc: "Alexa, Google Home, Ring, Nest — setup, automations, and connectivity.",
    },
    {
      icon: <Smartphone className="w-7 h-7" />,
      label: "Phones & Tablets",
      desc: "Setup, syncing, app issues, battery, and performance optimization.",
    },
    {
      icon: <Printer className="w-7 h-7" />,
      label: "Printers & Peripherals",
      desc: "Wireless setup, driver issues, connectivity, and print quality.",
    },
  ];

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background image — swaps for dark theme */}
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${bgImage})` }} aria-hidden="true" />

      <div className="relative container mx-auto px-6 max-w-6xl z-10">
        <AnimatedElement animation="fadeInUp" className="text-center mb-16">
          <div className="inline-block bg-white/80 dark:bg-midnight-950/70 backdrop-blur-md rounded-2xl px-8 py-8 lg:px-12 lg:py-10 border border-light-200/50 dark:border-white/10">
            <span className="inline-block text-gradient-electric font-bold text-sm uppercase tracking-wider mb-4">
              What We Help With
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-text-primary dark:text-white">
              Technology support for your home
            </h2>
            <p className="text-xl max-w-2xl mx-auto text-text-secondary dark:text-white/80">
              From Wi-Fi troubles to smart home setup — TotalAssist helps with the tech that
              keeps your home running.
            </p>
          </div>
        </AnimatedElement>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
          {problems.map((item, i) => (
            <AnimatedElement key={i} animation="scaleIn" delay={0.1 + i * 0.08}>
              <div
                className="group relative bg-white dark:bg-midnight-800 border border-light-200 dark:border-midnight-600 rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer hover:-translate-y-1.5 hover:shadow-xl dark:hover:shadow-midnight-950/50 dark:hover:border-midnight-500 h-full flex flex-col"
                onClick={() => onNavigate(PageView.HOW_IT_WORKS)}
                role="button"
                tabIndex={0}
                aria-label={`Learn more about ${item.label} support`}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigate(PageView.HOW_IT_WORKS); } }}
              >
                {/* Card content */}
                <div className="p-5 lg:p-6 flex-1">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-electric-indigo dark:text-[#818CF8] transition-colors" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.10) 0%, rgba(6,182,212,0.08) 100%)' }}>
                    {item.icon}
                  </div>
                  <h3 className="font-bold text-base mb-2 text-text-primary dark:text-white">
                    {item.label}
                  </h3>
                  <p className="text-sm text-text-secondary dark:text-white/70 leading-relaxed mb-4">
                    {item.desc}
                  </p>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-electric-indigo dark:text-[#818CF8] group-hover:gap-2 transition-all">
                    Learn more <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
                {/* Bottom gradient accent — visible on hover */}
                <div className="h-[3px] w-full bg-gradient-to-r from-[#6366F1] via-[#8B5CF6] to-[#06B6D4] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </AnimatedElement>
          ))}
        </div>
      </div>
    </section>
  );
};

const WhyTotalAssist: React.FC = () => {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'response': true,
    'diagnostics': true,
    'support': true,
    'experience': true,
  });

  const toggleCategory = useCallback((key: string) => {
    setExpandedCategories(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const comparisonCategories = [
    {
      key: 'response',
      label: 'Response & Availability',
      features: [
        { benefit: 'Instant answers', ta: true, phone: false },
        { benefit: '24/7 availability', ta: true, phone: false },
        { benefit: 'Under 30-second average response', ta: true, phone: false },
        { benefit: 'No hold music or call queue', ta: true, phone: false },
      ],
    },
    {
      key: 'diagnostics',
      label: 'Diagnostics & Resolution',
      features: [
        { benefit: 'Photo-based diagnosis', ta: true, phone: false },
        { benefit: 'AI-powered troubleshooting', ta: true, phone: false },
        { benefit: 'Step-by-step guided fixes', ta: true, phone: false },
        { benefit: 'PDF diagnostic reports', ta: true, phone: false },
      ],
    },
    {
      key: 'support',
      label: 'Support Channels',
      features: [
        { benefit: 'Text chat', ta: true, phone: false },
        { benefit: 'Voice call support', ta: true, phone: true },
        { benefit: 'Live video support', ta: true, phone: false },
        { benefit: 'On-site scheduling', ta: true, phone: 'varies' as const },
      ],
    },
    {
      key: 'experience',
      label: 'Experience',
      features: [
        { benefit: 'Explain your issue once', ta: true, phone: false },
        { benefit: 'Interactive assist pills (tap, don\'t type)', ta: true, phone: false },
        { benefit: 'Device history & recall', ta: true, phone: false },
        { benefit: 'Full support case history', ta: true, phone: false },
      ],
    },
  ];

  const differentiators = [
    {
      icon: <Camera className="w-7 h-7" />,
      secondIcon: <Video className="w-5 h-5" />,
      title: "See It, Don't Explain It",
      desc: "Most AI chatbots make you describe your problem in words. TotalAssist lets you snap a photo or point your camera — we see what you see and diagnose it instantly.",
    },
    {
      icon: <Sparkles className="w-7 h-7" />,
      title: "Tap, Don't Type",
      desc: "No more typing long messages. TotalAssist guides you with interactive assist pills — just tap choices, confirm results, and follow step-by-step cards to a fix.",
    },
    {
      icon: <FileText className="w-7 h-7" />,
      title: "A Repair Record, Not Just a Chat",
      desc: "Every session produces a professional PDF diagnostic report — what went wrong, what was fixed, and what to watch for. Share it with a technician if you ever need onsite help.",
    },
  ];

  const renderIndicator = (value: boolean | 'varies') => {
    if (value === true) {
      return (
        <div className="w-6 h-6 rounded-full bg-[#6366F1]/15 flex items-center justify-center">
          <Check className="w-3.5 h-3.5 text-[#6366F1]" />
        </div>
      );
    }
    if (value === 'varies') {
      return <span className="text-xs font-medium text-text-muted">Varies</span>;
    }
    return (
      <div className="w-6 h-6 rounded-full bg-light-200 dark:bg-midnight-700 flex items-center justify-center">
        <Minus className="w-3.5 h-3.5 text-text-muted" />
      </div>
    );
  };

  return (
    <section className="py-24 bg-light-100 dark:bg-midnight-950 overflow-x-clip relative border-t border-light-300 dark:border-midnight-700 transition-colors">
      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        {/* Header */}
        <AnimatedElement animation="fadeInUp" className="text-center mb-12">
          <span className="inline-block text-gradient-electric font-bold text-sm uppercase tracking-wider mb-4">
            Why TotalAssist Is Different
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight text-text-primary dark:text-white">
            Not just another chatbot.
          </h2>
          <p className="text-text-secondary text-xl max-w-2xl mx-auto">
            TotalAssist goes beyond text — it sees your devices, guides you interactively, and documents every fix.
          </p>
        </AnimatedElement>

        {/* Differentiator Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {differentiators.map((item, i) => (
            <AnimatedElement key={i} animation="fadeInUp" delay={0.2 + i * 0.15}>
              <div className="group p-8 card-clean rounded-2xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center text-electric-indigo" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(6,182,212,0.10) 100%)' }}>
                    {item.icon}
                  </div>
                  {item.secondIcon && (
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-electric-indigo" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(6,182,212,0.10) 100%)' }}>
                      {item.secondIcon}
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-bold text-text-primary dark:text-white mb-3">
                  {item.title}
                </h3>
                <p className="text-text-secondary leading-relaxed">{item.desc}</p>
              </div>
            </AnimatedElement>
          ))}
        </div>

        {/* Algolia-Style Feature Comparison Table — hidden on mobile */}
        <AnimatedElement animation="fadeInUp" delay={0.5} className="hidden md:block">
          <div className="rounded-2xl border border-light-300 dark:border-midnight-700 bg-white dark:bg-midnight-900 shadow-sm">

            {/* Sticky Column Headers — sticks below fixed nav (72px) */}
            <div className="sticky top-[72px] z-10 grid grid-cols-[1fr_88px_88px] sm:grid-cols-[1fr_140px_140px] lg:grid-cols-[1fr_180px_180px] border-b border-light-300 dark:border-midnight-700 bg-white dark:bg-midnight-900 rounded-t-2xl shadow-[0_1px_3px_0_rgba(0,0,0,0.05)]">
              {/* Empty top-left */}
              <div className="p-4 lg:p-5" />
              {/* TotalAssist — Highlighted column header */}
              <div className="p-4 lg:p-5 flex flex-col items-center justify-center gap-1.5 bg-[#6366F1]/[0.06] dark:bg-[#6366F1]/[0.12] border-x border-light-300 dark:border-midnight-700 relative">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#6366F1] rounded-b-sm" />
                <img
                  src="/total_assist-new.png"
                  alt="TotalAssist"
                  className="w-7 h-7 lg:w-8 lg:h-8 object-contain"
                />
                <span className="font-bold text-text-primary dark:text-white text-xs lg:text-sm">TotalAssist</span>
              </div>
              {/* Phone Support column header */}
              <div className="p-4 lg:p-5 flex flex-col items-center justify-center gap-1.5">
                <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-light-200 dark:bg-midnight-700 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-text-muted" />
                </div>
                <span className="font-bold text-text-secondary text-xs lg:text-sm">Phone Support</span>
              </div>
            </div>

            {/* Category Sections */}
            {comparisonCategories.map((category) => {
              const isExpanded = expandedCategories[category.key];
              return (
                <div key={category.key}>
                  {/* Category Header — Collapsible */}
                  <button
                    onClick={() => toggleCategory(category.key)}
                    className="w-full grid grid-cols-[1fr_88px_88px] sm:grid-cols-[1fr_140px_140px] lg:grid-cols-[1fr_180px_180px] bg-light-50 dark:bg-midnight-800/60 border-b border-light-300 dark:border-midnight-700 hover:bg-light-100 dark:hover:bg-midnight-800 transition-colors cursor-pointer"
                    aria-expanded={isExpanded}
                    aria-controls={`comparison-${category.key}`}
                  >
                    <div className="p-3.5 lg:p-4 flex items-center gap-2.5">
                      <ChevronDown
                        className={`w-4 h-4 text-text-muted transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`}
                      />
                      <span className="font-semibold text-sm text-text-primary dark:text-white">
                        {category.label}
                      </span>
                    </div>
                    {/* Empty cells to maintain grid alignment */}
                    <div className="border-x border-light-300 dark:border-midnight-700 bg-[#6366F1]/[0.03] dark:bg-[#6366F1]/[0.06]" />
                    <div />
                  </button>

                  {/* Feature Rows — Collapsible */}
                  <div
                    id={`comparison-${category.key}`}
                    className="transition-all duration-300 overflow-hidden"
                    style={{
                      maxHeight: isExpanded ? `${category.features.length * 60}px` : '0',
                      opacity: isExpanded ? 1 : 0,
                    }}
                  >
                    {category.features.map((feature, fi) => (
                      <div
                        key={fi}
                        className={`grid grid-cols-[1fr_88px_88px] sm:grid-cols-[1fr_140px_140px] lg:grid-cols-[1fr_180px_180px] ${
                          fi !== category.features.length - 1 ? 'border-b border-light-200 dark:border-midnight-700/60' : 'border-b border-light-300 dark:border-midnight-700'
                        } hover:bg-light-50 dark:hover:bg-midnight-800/40 transition-colors`}
                      >
                        <div className="px-4 lg:px-5 py-3.5 flex items-center text-sm text-text-primary dark:text-white/80 pl-11 lg:pl-12">
                          {feature.benefit}
                        </div>
                        <div className="px-4 lg:px-5 py-3.5 flex items-center justify-center border-x border-light-200 dark:border-midnight-700/60 bg-[#6366F1]/[0.03] dark:bg-[#6366F1]/[0.06]">
                          {renderIndicator(feature.ta)}
                        </div>
                        <div className="px-4 lg:px-5 py-3.5 flex items-center justify-center">
                          {renderIndicator(feature.phone)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </AnimatedElement>

      </div>
    </section>
  );
};

const UseCasesSection: React.FC = () => {
  const useCases = [
    {
      scenario: "Wi-Fi keeps dropping",
      solution: "Describe the issue or snap a photo of your router's lights. We identify the problem and walk you through the fix.",
      icon: <Wifi className="w-7 h-7" />,
    },
    {
      scenario: "Smart TV won't connect",
      solution: "Upload a photo of the error screen. Our team reads it, diagnoses the issue, and provides step-by-step setup instructions.",
      icon: <Tv className="w-7 h-7" />,
    },
    {
      scenario: "Mysterious error code",
      solution: "Just show us the error. Whether it's a blinking light pattern or cryptic message, we decode it and tell you what to do.",
      icon: <AlertTriangle className="w-7 h-7" />,
    },
  ];

  return (
    <section className="py-24 bg-white dark:bg-midnight-950 border-t border-light-300 dark:border-midnight-700 relative transition-colors">
      <div className="container mx-auto px-6 max-w-6xl">
        <AnimatedElement animation="fadeInUp" className="text-center mb-16">
          <span className="inline-block text-gradient-electric font-bold text-sm uppercase tracking-wider mb-4">
            Real Problems, Real Solutions
          </span>
          <h2 className="text-4xl font-bold mb-4 text-text-primary dark:text-white">
            When tech breaks, we help
          </h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            No matter the issue, TotalAssist is ready to diagnose and guide you to a fix.
          </p>
        </AnimatedElement>
        <div className="grid md:grid-cols-3 gap-8">
          {useCases.map((useCase, i) => (
            <AnimatedElement key={i} animation="fadeInUp" delay={0.15 + i * 0.15}>
              <div className="group p-8 card-clean rounded-2xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg h-full">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-electric-indigo mb-6" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(6,182,212,0.10) 100%)' }}>
                  {useCase.icon}
                </div>
                <h3 className="text-xl font-bold text-text-primary dark:text-white mb-3">
                  "{useCase.scenario}"
                </h3>
                <p className="text-text-secondary leading-relaxed">
                  {useCase.solution}
                </p>
              </div>
            </AnimatedElement>
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
      q: "What is TotalAssist?",
      a: "TotalAssist is your dedicated support team that provides instant tech help via chat, photo analysis, and live voice guidance. We respond immediately—no waiting.",
    },
    {
      q: "What devices and issues can TotalAssist help with?",
      a: "TotalAssist helps with Wi-Fi connectivity, smart home devices (Alexa, Google, Ring, Nest), TVs, laptops, printers, phones, and more. If it's tech in your home, our support team can diagnose and guide you to a fix.",
    },
    {
      q: "How does the photo diagnosis feature work?",
      a: "Simply snap a photo of an error screen, blinking lights, or any visual issue. Our support team analyzes the image instantly and provides step-by-step troubleshooting guidance tailored to what they see.",
    },
    {
      q: "Is TotalAssist available 24/7?",
      a: "Yes! TotalAssist support is available 24/7, 365 days a year. No seasonal limitations, no business hours—get help whenever you need it, day or night.",
    },
    {
      q: "What are the pricing options?",
      a: "We offer three plans: Free (5 chats and 1 photo analysis per month), Home ($9.99/mo for unlimited chat, photo, voice, and weekly video diagnostics), and Pro ($19.99/mo — everything in Home plus 15 video credits/month and multi-home support). All plans include guided assist pills and PDF diagnostic reports.",
    },
  ];

  return (
    <section className="py-24 bg-light-100 dark:bg-midnight-950 border-t border-light-300 dark:border-midnight-700 relative transition-colors">
      <div className="container mx-auto px-6 max-w-3xl">
        {/* Header */}
        <AnimatedElement animation="fadeInUp" className="text-center mb-12">
          {/* FAQ Badge */}
          <div className="inline-flex items-center gap-2 bg-white dark:bg-midnight-800 px-4 py-2 rounded-full mb-6 border border-surface-border dark:border-midnight-700 shadow-sm">
            <HelpCircle className="w-4 h-4 text-electric-indigo" />
            <span className="text-gradient-electric font-semibold text-sm">FAQ</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold mb-4 text-text-primary dark:text-white">
            Frequently Asked Questions
          </h2>
          <p className="text-text-secondary text-lg max-w-xl mx-auto">
            Find quick answers to common questions about TotalAssist.
          </p>
        </AnimatedElement>

        {/* FAQ Items */}
        <AnimatedElement animation="fadeInUp" delay={0.2}>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className={`rounded-xl border transition-all duration-300 overflow-hidden ${
                  openFaq === i
                    ? 'border-electric-indigo/30 bg-electric-indigo/[0.03]'
                    : 'border-light-300 dark:border-midnight-700 bg-white dark:bg-midnight-900 hover:border-light-400 dark:hover:border-midnight-600'
                }`}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full p-5 flex items-center justify-between text-left"
                >
                  <span className="font-semibold text-lg text-text-primary dark:text-white">
                    {faq.q}
                  </span>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    openFaq === i
                      ? 'text-white'
                      : 'bg-light-200 dark:bg-midnight-700 text-text-secondary'
                  }`}
                    style={openFaq === i ? { background: 'linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)' } : undefined}
                  >
                    {openFaq === i ? (
                      <Minus className="w-5 h-5" />
                    ) : (
                      <Plus className="w-5 h-5" />
                    )}
                  </div>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openFaq === i ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-5 pb-5 leading-relaxed text-text-secondary">
                    {faq.a}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AnimatedElement>
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
    <section
      className="py-24 relative overflow-hidden"
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
      <div className="container mx-auto px-6 max-w-4xl text-center relative z-10">
        <AnimatedElement animation="fadeInUp">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Life's too short for tech headaches.
          </h2>
        </AnimatedElement>
        <AnimatedElement animation="fadeInUp" delay={0.15}>
          <p className="text-white/90 font-medium max-w-2xl mx-auto mb-10 text-xl lg:text-2xl">
            No more searching for answers at midnight. No more feeling stuck with
            your own devices. Just instant AI-powered help, whenever you need it.
          </p>
        </AnimatedElement>
        <AnimatedElement animation="fadeInUp" delay={0.3}>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-4 justify-center max-w-xl mx-auto mb-6"
          >
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-6 py-4 rounded-xl text-midnight-950 text-lg font-medium focus:outline-none focus:ring-4 focus:ring-white/30 shadow-xl bg-white"
              required
            />
            <button
              type="submit"
              className="bg-white text-electric-indigo font-bold px-10 py-4 rounded-xl text-lg transition-all whitespace-nowrap shadow-clean hover:shadow-clean-md hover:-translate-y-0.5"
            >
              Get Started Free
            </button>
          </form>
        </AnimatedElement>
        <AnimatedElement animation="fadeIn" delay={0.5}>
          <div className="flex items-center justify-center gap-6 text-white/80 text-sm flex-wrap">
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
              <span>Support available 24/7</span>
            </div>
          </div>
        </AnimatedElement>
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
    <footer className="bg-midnight-950 text-white pt-20 pb-10">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          {/* Brand Column */}
          <AnimatedElement animation="fadeInUp" className="col-span-2 md:col-span-1">
            <button
              onClick={() => handleNav(PageView.HOME)}
              className="mb-6 block"
            >
              <Logo variant="light" />
            </button>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Your 24/7 technical safety net. TotalAssist diagnoses and fixes your home's Wi-Fi, gadgets, and appliances instantly. Expert support is now just a heartbeat away.
            </p>
          </AnimatedElement>

          {/* Product Column */}
          <AnimatedElement animation="fadeInUp" delay={0.1}>
            <h4 className="font-bold mb-6 text-white">Product</h4>
            <ul className="space-y-4 text-sm text-gray-400">
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
            <h4 className="font-bold mb-4 mt-8 text-white">Services</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li>
                <button
                  onClick={() => handleNav(PageView.SERVICE_CHAT)}
                  className="hover:text-electric-indigo transition-colors"
                >
                  Chat Support
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav(PageView.SERVICE_PHOTO)}
                  className="hover:text-electric-indigo transition-colors"
                >
                  Photo Analysis
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav(PageView.SERVICE_VOICE)}
                  className="hover:text-electric-indigo transition-colors"
                >
                  Voice Support
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav(PageView.SERVICE_VIDEO)}
                  className="hover:text-electric-indigo transition-colors"
                >
                  Video Diagnostic
                </button>
              </li>
            </ul>
          </AnimatedElement>

          {/* Support Column */}
          <AnimatedElement animation="fadeInUp" delay={0.2}>
            <h4 className="font-bold mb-6 text-white">Support</h4>
            <ul className="space-y-4 text-sm text-gray-400">
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
                <button
                  onClick={() => handleNav(PageView.FAQ)}
                  className="hover:text-electric-indigo transition-colors"
                >
                  Help Center
                </button>
              </li>
            </ul>
          </AnimatedElement>

          {/* Legal Column */}
          <AnimatedElement animation="fadeInUp" delay={0.3}>
            <h4 className="font-bold mb-6 text-white">Legal</h4>
            <ul className="space-y-4 text-sm text-gray-400">
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
          </AnimatedElement>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-midnight-700 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
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
  '/scout': PageView.SCOUT,
  '/specialist': PageView.SPECIALIST,
  '/services/chat': PageView.SERVICE_CHAT,
  '/services/photo': PageView.SERVICE_PHOTO,
  '/services/voice': PageView.SERVICE_VOICE,
  '/services/video': PageView.SERVICE_VIDEO,
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
  [PageView.SCOUT]: '/scout',
  [PageView.SPECIALIST]: '/specialist',
  [PageView.NOT_FOUND]: '/404',
  [PageView.SERVICE_CHAT]: '/services/chat',
  [PageView.SERVICE_PHOTO]: '/services/photo',
  [PageView.SERVICE_VOICE]: '/services/voice',
  [PageView.SERVICE_VIDEO]: '/services/video',
};

// Get initial view from URL
const getInitialView = (): PageView => {
  const path = window.location.pathname;
  if (path.startsWith('/specialist/')) return PageView.SPECIALIST;
  if (path.startsWith('/services/')) return pathToView[path] || PageView.NOT_FOUND;
  return pathToView[path] || PageView.NOT_FOUND;
};

// Dashboard user interface
interface DashboardUser {
  id?: string;
  firstName: string;
  lastName?: string;
  email: string;
  profileImageUrl?: string | null;
}

// Get stored dashboard user
const getStoredUser = (): DashboardUser | null => {
  try {
    const stored = localStorage.getItem("totalassist_user");
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to get stored user:", e);
  }
  return null;
};

type DashboardView = "main" | "history" | "scout" | "analytics" | "devices";

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<PageView>(getInitialView);
  const [capturedEmail, setCapturedEmail] = useState("");
  const [dashboardUser, setDashboardUser] = useState<DashboardUser | null>(
    getStoredUser,
  );
  const [showLiveSupport, setShowLiveSupport] = useState(false);
  const [dashboardView, setDashboardView] = useState<DashboardView>("main");
  const chatRef = useRef<ChatWidgetHandle>(null);
  const pwaInstall = usePWAInstall();

  // Get auth state from session (for OAuth users)
  const {
    user: sessionUser,
    isAuthenticated,
    isLoading: authLoading,
    refetch: refetchAuth,
  } = useAuth();

  // Get subscription tier for the authenticated user
  // Use dashboardUser.id as fallback so subscription fetch starts immediately from localStorage
  const effectiveUserId = sessionUser?.id || dashboardUser?.id;
  const { tier: subscriptionTier, isLoading: subscriptionLoading, videoCredits: serverVideoCredits } = useSubscription(effectiveUserId);

  // Sync usage store tier with auth/subscription state
  // Treat dashboardUser as auth signal so we don't flash guest tier while auth is loading
  // Also syncs server-side video credits to fix stale localStorage for returning users
  useSyncUsageWithAuth(
    isAuthenticated || !!dashboardUser,
    effectiveUserId,
    subscriptionTier,
    subscriptionLoading,
    subscriptionLoading ? null : { remaining: serverVideoCredits.remaining, purchased: serverVideoCredits.purchased }
  );

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
        firstName: sessionUser.firstName || "User",
        lastName: sessionUser.lastName || undefined,
        email: sessionUser.email || "",
        profileImageUrl: sessionUser.profileImageUrl || null,
      };

      // If on dashboard, sync the user (ensures id is present)
      if (currentPath === "/dashboard") {
        setSessionChecked(true);
        setDashboardUser(syncedUser);
        localStorage.setItem("totalassist_user", JSON.stringify(syncedUser));
        setCurrentView(PageView.DASHBOARD);
      }

      // If on signup and authenticated, always redirect to dashboard — never show onboarding again
      if (currentPath === "/signup" && sessionUser.id) {
        setSessionChecked(true);
        setDashboardUser(syncedUser);
        localStorage.setItem("totalassist_user", JSON.stringify(syncedUser));
        navigate(PageView.DASHBOARD);
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
      localStorage.setItem("totalassist_user", JSON.stringify(updatedUser));
    }
  }, [authLoading, isAuthenticated, sessionUser, dashboardUser]);

  // Redirect to signup if on dashboard without authentication (after auth loading completes)
  useEffect(() => {
    if (!authLoading && currentView === PageView.DASHBOARD && !dashboardUser && !isAuthenticated) {
      // Auth finished loading, user is not authenticated, and we're on dashboard
      // Redirect to signup page
      const path = viewToPath[PageView.SIGNUP] || "/signup";
      if (window.location.pathname !== path) {
        window.history.pushState({ view: PageView.SIGNUP }, "", path);
      }
      setCurrentView(PageView.SIGNUP);
    }
  }, [authLoading, currentView, dashboardUser, isAuthenticated]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path.startsWith('/specialist/')) {
        setCurrentView(PageView.SPECIALIST);
        return;
      }
      const view = pathToView[path] || PageView.NOT_FOUND;
      setCurrentView(view);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Dynamic page title + canonical URL per route
  useEffect(() => {
    const PAGE_TITLES: Partial<Record<PageView, string>> = {
      [PageView.HOME]: 'TotalAssist | AI-Powered Home Tech Support',
      [PageView.HOW_IT_WORKS]: 'How It Works | TotalAssist',
      [PageView.PRICING]: 'Pricing Plans | TotalAssist',
      [PageView.FAQ]: 'FAQ | TotalAssist',
      [PageView.SIGNUP]: 'Sign Up | TotalAssist',
      [PageView.LOGIN]: 'Log In | TotalAssist',
      [PageView.DASHBOARD]: 'Dashboard | TotalAssist',
      [PageView.SCOUT]: 'Support Chat | TotalAssist',
      [PageView.PRIVACY]: 'Privacy Policy | TotalAssist',
      [PageView.TERMS]: 'Terms of Service | TotalAssist',
      [PageView.CANCELLATION]: 'Cancellation Policy | TotalAssist',
      [PageView.SERVICE_CHAT]: 'AI Chat Support | TotalAssist',
      [PageView.SERVICE_PHOTO]: 'Photo Diagnosis | TotalAssist',
      [PageView.SERVICE_VOICE]: 'Voice Support | TotalAssist',
      [PageView.SERVICE_VIDEO]: 'Live Video Support | TotalAssist',
      [PageView.NOT_FOUND]: 'Page Not Found | TotalAssist',
    };
    document.title = PAGE_TITLES[currentView] || 'TotalAssist | AI-Powered Home Tech Support';

    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      const path = viewToPath[currentView] || '/';
      canonical.setAttribute('href', `https://totalassist.tech${path === '/' ? '' : path}`);
    }
  }, [currentView]);

  // Custom navigate function that updates URL (memoized to prevent child re-renders)
  const navigate = useCallback((view: PageView) => {
    const path = viewToPath[view] || "/";
    if (window.location.pathname !== path) {
      window.history.pushState({ view }, "", path);
    }
    const applyNavigation = () => {
      setCurrentView(view);
      window.scrollTo(0, 0);
    };
    // Use View Transitions API where supported for smoother page changes
    if ((document as any).startViewTransition) {
      (document as any).startViewTransition(applyNavigation);
    } else {
      applyNavigation();
    }
  }, []);

  // Sync dashboardUser from session when authenticated (no auto-redirect from homepage)
  useEffect(() => {
    if (!authLoading && isAuthenticated && sessionUser && window.location.pathname === "/") {
      // Sync dashboardUser from session if not already set
      const syncedUser: DashboardUser = {
        id: sessionUser.id,
        firstName: sessionUser.firstName || "User",
        lastName: sessionUser.lastName || undefined,
        email: sessionUser.email || "",
        profileImageUrl: sessionUser.profileImageUrl || null,
      };
      setDashboardUser(syncedUser);
      localStorage.setItem("totalassist_user", JSON.stringify(syncedUser));
    }
  }, [authLoading, isAuthenticated, sessionUser]);

  const handleStart = useCallback(() => {
    chatRef.current?.open("I'd like to start a free trial.");
  }, []);

  const handleSpeakToExpert = useCallback(() => {
    chatRef.current?.openAsLiveAgent();
  }, []);

  const [heroPreviewMode, setHeroPreviewMode] = useState<'voice' | 'photo' | 'video' | 'chat' | null>(null);
  const [scoutInitialMode, setScoutInitialMode] = useState<'voice' | 'photo' | 'video' | 'chat' | undefined>(undefined);
  const [scoutInitialMessage, setScoutInitialMessage] = useState<string | undefined>(undefined);
  const [scoutInitialCaseId, setScoutInitialCaseId] = useState<string | undefined>(undefined);
  const [scoutSessionKey, setScoutSessionKey] = useState(0);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [settingsModalTab, setSettingsModalTab] = useState<SettingsTab>('general');

  // Lock body scroll when hero preview modal is open (prevents scrolling through marketing sections behind the overlay)
  useEffect(() => {
    if (heroPreviewMode) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [heroPreviewMode]);

  const handleFreeTrial = useCallback(() => {
    navigate(PageView.SIGNUP);
  }, [navigate]);

  const handleHeroAction = useCallback((mode: 'voice' | 'photo' | 'video' | 'chat') => {
    if (dashboardUser) {
      // Authenticated: go to Scout with pre-selected mode
      setScoutInitialMode(mode);
      setScoutSessionKey(prev => prev + 1);
      setDashboardView('scout');
      navigate(PageView.DASHBOARD);
    } else {
      // Unauthenticated: show free preview
      setHeroPreviewMode(mode);
    }
  }, [dashboardUser, navigate]);

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
    // Scroll to pricing plans section after navigation renders
    // Use setTimeout to wait for lazy-loaded Pricing component to mount
    setTimeout(() => {
      const el = document.getElementById('pricing-plans');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }, [navigate]);

  // Handle signup completion - store user and go to dashboard (memoized for Login/SignUp)
  const handleSignupComplete = useCallback(
    (user: DashboardUser) => {
      if (!user.id) {
        console.error(
          "[APP] WARNING: User has no ID! Billing and other features will not work.",
        );
      }

      setDashboardUser(user);
      localStorage.setItem("totalassist_user", JSON.stringify(user));
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
    localStorage.removeItem("totalassist_user");
    localStorage.removeItem("totalassist_trial");
    // Also clear OAuth session by redirecting to logout endpoint
    window.location.href = "/api/auth/logout";
  }, []);

  const handleOpenHistory = useCallback(() => {
    setDashboardView("history");
  }, []);

  const handleOpenSettings = useCallback(() => {
    setSettingsModalTab('general');
    setSettingsModalOpen(true);
  }, []);

  const handleOpenBilling = useCallback(() => {
    setSettingsModalTab('billing');
    setSettingsModalOpen(true);
  }, []);

  const handleBackToDashboard = useCallback(() => {
    setDashboardView("main");
    setScoutInitialMode(undefined);
    setScoutInitialMessage(undefined);
    setScoutInitialCaseId(undefined);
  }, []);

  const handleUpdateUser = useCallback((updatedUser: DashboardUser) => {
    setDashboardUser(updatedUser);
  }, []);

  const handleCloseLiveSupport = useCallback(() => {
    setShowLiveSupport(false);
  }, []);

  const handleOpenScout = useCallback(() => {
    setScoutInitialMessage(undefined);
    setScoutInitialCaseId(undefined);
    setScoutSessionKey(prev => prev + 1);
    setDashboardView("scout");
  }, []);

  const handleNewChat = useCallback((message: string) => {
    setScoutInitialMessage(message);
    setScoutInitialMode(undefined);
    setScoutInitialCaseId(undefined);
    setScoutSessionKey(prev => prev + 1);
    setDashboardView("scout");
  }, []);

  const handleOpenCase = useCallback((caseId: string) => {
    setScoutInitialCaseId(caseId);
    setScoutInitialMessage(undefined);
    setScoutInitialMode(undefined);
    setScoutSessionKey(prev => prev + 1);
    setDashboardView("scout");
  }, []);

  const handleStartSignal = useCallback(() => {
    setScoutInitialMode('voice');
    setScoutSessionKey(prev => prev + 1);
    setDashboardView('scout');
  }, []);

  const handleOpenInventory = useCallback(() => {
    setSettingsModalTab('inventory');
    setSettingsModalOpen(true);
  }, []);

  const handleCloseSettingsModal = useCallback(() => {
    setSettingsModalOpen(false);
  }, []);

  const handleOpenScoutWithMode = useCallback((mode: 'photo' | 'voice' | 'video') => {
    setScoutInitialMode(mode);
    setScoutInitialMessage(undefined);
    setScoutInitialCaseId(undefined);
    setScoutSessionKey(prev => prev + 1);
    setDashboardView('scout');
  }, []);

  const handleOpenAnalytics = useCallback(() => {
    setDashboardView('analytics');
  }, []);

  // Handle navigation to dashboard sub-views from header dropdown
  const handleDashboardSubNavigation = useCallback((subView: string) => {
    // Settings/billing/inventory now open as modal instead of content replacement
    if (subView === 'settings') { setSettingsModalTab('general'); setSettingsModalOpen(true); }
    else if (subView === 'billing') { setSettingsModalTab('billing'); setSettingsModalOpen(true); }
    else if (subView === 'inventory') { setSettingsModalTab('inventory'); setSettingsModalOpen(true); }
    else { setDashboardView(subView as DashboardView); }
    navigate(PageView.DASHBOARD);
  }, [navigate]);

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
    const content = (() => {
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
      case PageView.SPECIALIST: {
        const specialistToken = window.location.pathname.split('/specialist/')[1] || '';
        return <SpecialistResponse token={specialistToken} />;
      }
      case PageView.SCOUT:
        if (dashboardUser) {
          return (
            <>
              <Dashboard
                user={dashboardUser}
                onStartChat={handleDashboardChat}
                onUploadImage={handleDashboardUploadImage}
                onStartVideo={handleDashboardStartVideo}
                onStartSignal={handleStartSignal}
                onOpenScout={handleOpenScout}
                onNewChat={handleNewChat}
                onOpenCase={handleOpenCase}
                onOpenScoutWithMode={handleOpenScoutWithMode}
                onOpenAnalytics={handleOpenAnalytics}
                onLogout={handleDashboardLogout}
                onOpenHistory={handleOpenHistory}
                onOpenSettings={handleOpenSettings}
                onOpenBilling={handleOpenBilling}
                onOpenInventory={handleOpenInventory}
                onBackToDashboard={handleBackToDashboard}
                onNavigateToPricing={handleNavigateToPricing}
                activeView="scout"
                onUpdateUser={handleUpdateUser}
              >
                <ScoutChatScreen key={scoutSessionKey} embedded initialCaseId={scoutInitialCaseId} initialMode={scoutInitialMode} initialMessage={scoutInitialMessage} onInitialMessageSent={() => setScoutInitialMessage(undefined)} onBackToDashboard={handleBackToDashboard} />
              </Dashboard>
              <SettingsModal
                isOpen={settingsModalOpen}
                onClose={handleCloseSettingsModal}
                initialTab={settingsModalTab}
                user={dashboardUser}
                onUpdateUser={handleUpdateUser}
                onLogout={handleDashboardLogout}
              />
            </>
          );
        }
        return <ScoutChatScreen />;
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
          } else if (dashboardView === "analytics") {
            dashboardContent = (
              <CaseAnalytics embedded onBack={handleBackToDashboard} />
            );
          }

          // Settings modal overlay (shared across all dashboard sub-views)
          const settingsModalEl = (
            <SettingsModal
              isOpen={settingsModalOpen}
              onClose={handleCloseSettingsModal}
              initialTab={settingsModalTab}
              user={dashboardUser}
              onUpdateUser={handleUpdateUser}
              onLogout={handleDashboardLogout}
            />
          );

          // If user navigated to scout view within dashboard, render embedded scout
          if (dashboardView === "scout") {
            return (
              <>
                <Dashboard
                  user={dashboardUser}
                  onStartChat={handleDashboardChat}
                  onUploadImage={handleDashboardUploadImage}
                  onStartVideo={handleDashboardStartVideo}
                  onStartSignal={handleStartSignal}
                  onOpenScout={handleOpenScout}
                  onNewChat={handleNewChat}
                  onOpenCase={handleOpenCase}
                  onOpenScoutWithMode={handleOpenScoutWithMode}
                  onOpenAnalytics={handleOpenAnalytics}
                  onLogout={handleDashboardLogout}
                  onOpenHistory={handleOpenHistory}
                  onOpenSettings={handleOpenSettings}
                  onOpenBilling={handleOpenBilling}
                  onOpenInventory={handleOpenInventory}
                  onBackToDashboard={handleBackToDashboard}
                  onNavigateToPricing={handleNavigateToPricing}
                  activeView="scout"
                  onUpdateUser={handleUpdateUser}
                >
                  <ScoutChatScreen key={scoutSessionKey} embedded initialCaseId={scoutInitialCaseId} initialMode={scoutInitialMode} initialMessage={scoutInitialMessage} onInitialMessageSent={() => setScoutInitialMessage(undefined)} onBackToDashboard={handleBackToDashboard} />
                </Dashboard>
                {settingsModalEl}
              </>
            );
          }

          return (
            <>
              <Dashboard
                user={dashboardUser}
                onStartChat={handleDashboardChat}
                onUploadImage={handleDashboardUploadImage}
                onStartVideo={handleDashboardStartVideo}
                onStartSignal={handleStartSignal}
                onOpenScout={handleOpenScout}
                onNewChat={handleNewChat}
                onOpenCase={handleOpenCase}
                onOpenScoutWithMode={handleOpenScoutWithMode}
                onOpenAnalytics={handleOpenAnalytics}
                onLogout={handleDashboardLogout}
                onOpenHistory={handleOpenHistory}
                onOpenSettings={handleOpenSettings}
                onOpenBilling={handleOpenBilling}
                onOpenInventory={handleOpenInventory}
                onBackToDashboard={handleBackToDashboard}
                onNavigateToPricing={handleNavigateToPricing}
                activeView={dashboardView}
                onUpdateUser={handleUpdateUser}
              >
                {dashboardContent}
              </Dashboard>
              {settingsModalEl}
            </>
          );
        }
        // If auth is still loading OR user is authenticated but dashboardUser not synced yet,
        // show loading state (prevents white screen for OAuth users)
        if (authLoading || (isAuthenticated && !dashboardUser)) {
          return (
            <div className="min-h-screen flex items-center justify-center bg-light-100 dark:bg-midnight-950 transition-colors">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-electric-indigo border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-text-secondary font-medium">Loading your dashboard...</p>
              </div>
            </div>
          );
        }
        // Auth finished but no user - redirect will be handled by useEffect below
        return null;
        
        case PageView.SERVICE_CHAT:
          return <ServicePage serviceId="chat" onNavigate={navigate} />;
        case PageView.SERVICE_PHOTO:
          return <ServicePage serviceId="photo" onNavigate={navigate} />;
        case PageView.SERVICE_VOICE:
          return <ServicePage serviceId="voice" onNavigate={navigate} />;
        case PageView.SERVICE_VIDEO:
          return <ServicePage serviceId="video" onNavigate={navigate} />;
        case PageView.NOT_FOUND:
          return (
            <div className="min-h-screen-safe bg-light-50 dark:bg-midnight-950 flex flex-col items-center justify-center px-6 text-center">
              <h1 className="text-6xl font-bold text-text-primary dark:text-white mb-4">404</h1>
              <p className="text-lg text-text-secondary dark:text-gray-400 mb-8">
                The page you're looking for doesn't exist.
              </p>
              <button
                onClick={() => navigate(PageView.HOME)}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#06B6D4] text-white font-semibold hover:shadow-lg transition-all"
              >
                Go Home
              </button>
            </div>
          );
        case PageView.HOME:
        default:
          return (
            <>
              {/* Scroll progress bar — fills across top as user scrolls */}
              <div className="scroll-progress" />
              <Hero
                onFreeTrial={handleFreeTrial}
                onPricing={handleNavigateToPricing}
                onHeroAction={handleHeroAction}
              />
              {/* Free Preview Modal for unauthenticated users */}
              {heroPreviewMode && (
                <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex flex-col">
                  <div className="flex items-center justify-between px-4 py-3 bg-[#151922] border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#A855F7] to-[#6366F1] flex items-center justify-center">
                        <Zap className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-white font-medium text-sm">TotalAssist Preview</span>
                      <span className="text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded">Free preview</span>
                    </div>
                    <button
                      onClick={() => setHeroPreviewMode(null)}
                      className="text-white/60 hover:text-white p-1"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <ScoutChatScreen embedded initialMode={heroPreviewMode} />
                  </div>
                  {/* Signup CTA banner at bottom - non-blocking */}
                  <div className="bg-gradient-to-r from-[#6366F1]/90 to-[#06B6D4]/90 backdrop-blur-md px-4 py-3 border-t border-white/10">
                    <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
                      <p className="text-white/90 text-sm font-medium">Sign up free for unlimited sessions & case tracking</p>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => {
                            setHeroPreviewMode(null);
                            navigate(PageView.SIGNUP);
                          }}
                          className="px-4 py-2 rounded-lg bg-white text-[#6366F1] font-semibold text-sm hover:bg-white/90 transition-colors"
                        >
                          Sign Up
                        </button>
                        <button
                          onClick={() => {
                            setHeroPreviewMode(null);
                            navigate(PageView.LOGIN);
                          }}
                          className="px-4 py-2 rounded-lg bg-white/10 text-white font-medium text-sm hover:bg-white/20 transition-colors"
                        >
                          Log In
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <HowItWorksSimple />
              <SectionDivider variant="hexagon" />
              <ServicesSection onNavigate={navigate} />
              {/* CTA band between services and device grid */}
              <section className="relative overflow-hidden bg-gradient-to-r from-[#6366F1] to-[#06B6D4] py-14 lg:py-16">
                <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} aria-hidden="true" />
                <div className="relative container mx-auto px-6 max-w-4xl text-center">
                  <h2 className="text-2xl lg:text-3xl font-bold text-white mb-3">
                    No appointments. No hold music. Just answers.
                  </h2>
                  <p className="text-white/80 text-base lg:text-lg mb-8 max-w-xl mx-auto">
                    Get expert help with your home tech in minutes — your first 5 sessions are free.
                  </p>
                  <button
                    onClick={handleNavigateToSignup}
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-white text-[#6366F1] font-bold text-base hover:bg-white/90 active:scale-[0.97] transition-all shadow-lg shadow-black/10"
                  >
                    Start Free Trial
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </section>
              <WhatWeHelpWith onNavigate={navigate} />
              <SectionDivider variant="line" />
              <WhyTotalAssist />
              <SectionDivider variant="hexagon" />
              <UseCasesSection />
              <SectionDivider variant="line" />
              <FAQSection />
              <CTASection onSignup={handleNavigateToSignup} />
            </>
          );
      }
    })();

    return (
      <Suspense fallback={<PageLoadingFallback />}>
        <PageTransition pageKey={currentView}>
          {content}
        </PageTransition>
      </Suspense>
    );
  };

  // Dashboard has its own layout, don't show header/footer
  // Also show this layout when on dashboard route but still loading (no dashboardUser yet)
  if (currentView === PageView.DASHBOARD) {
    return (
      <div className={`${dashboardView === 'scout' ? 'h-screen-safe overflow-hidden' : 'min-h-screen'} bg-light-50 dark:bg-midnight-950 font-['Inter',sans-serif] text-text-primary dark:text-white transition-colors duration-300`}>
        {renderContent()}
        {/* ChatWidget removed from dashboard — chat IS the dashboard now */}
        <PWAInstallBanner {...pwaInstall} />
        <CookieConsentBanner />
      </div>
    );
  }

  // Scout AI has its own full-screen mobile-first layout
  if (currentView === PageView.SCOUT) {
    return (
      <div className="h-screen-safe overflow-hidden font-['Inter',sans-serif]">
        {renderContent()}
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
      <div className="min-h-screen bg-light-100 dark:bg-midnight-950 font-['Inter',sans-serif] text-text-primary dark:text-white transition-colors duration-300">
        {renderContent()}
        <ChatWidget ref={chatRef} onNavigate={(v) => navigate(v as PageView)} />
        <CookieConsentBanner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-50 dark:bg-midnight-950 font-['Inter',sans-serif] text-text-primary dark:text-white transition-colors duration-300">
      <UsageBanner onNavigate={navigate} />
      <Header
        onNavigate={navigate}
        currentView={currentView}
        onOpenChat={() => chatRef.current?.open()}
        onDashboardNavigate={handleDashboardSubNavigation}
      />
      <main>{renderContent()}</main>
      <Footer onNavigate={navigate} />
      <ChatWidget ref={chatRef} onNavigate={(v) => navigate(v as PageView)} />
      <PWAInstallBanner {...pwaInstall} />
      <CookieConsentBanner />
    </div>
  );
};

export default App;
