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
  Zap,
  Plus,
  Minus,
  HelpCircle,
  Sun,
  Moon,
  ArrowRight,
  Check,
  Phone,
} from "lucide-react";
import { ChatWidget, ChatWidgetHandle } from "./components/ChatWidget";
import { ProfileDropdown } from "./components/ProfileDropdown";
import { Logo } from "./components/Logo";
import { PageView } from "./types";
import { useAuth } from "./hooks/useAuth";
import { LiveSupport } from "./components/LiveSupport";
import { useSyncUsageWithAuth } from "./stores/usageStore";
import { useSubscription } from "./hooks/useSubscription";
import { useTheme } from "./context/ThemeContext";
import type { SettingsTab } from "./components/SettingsModal";
import { useScrollReveal, useScrolled } from "./hooks/useAnimations";
import { CookieConsentBanner } from "./components/CookieConsentBanner";
import { ServicesSection } from "./components/ServicesSection";
import { HowItWorksLifecycle } from "./components/HowItWorksLifecycle";
import { InvestorCredibility } from "./components/InvestorCredibility";
import { usePWAInstall } from "./hooks/usePWAInstall";
import { PWAInstallBanner } from "./components/PWAInstallBanner";
import { LoadingScreen } from "./components/LoadingScreen";

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
const PageLoadingFallback = () => <LoadingScreen />;

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
  const isScrolled = useScrolled(6);

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

  // Nav items with per-item glow colors (matching dock treatment)
  const NAV_ITEMS = [
    { view: PageView.HOW_IT_WORKS, label: 'How It Works', color: '#06B6D4' },
    { view: PageView.PRICING, label: 'Pricing', color: '#6366F1' },
    { view: PageView.FAQ, label: 'FAQs', color: '#A855F7' },
  ];
  const navRef = useRef<HTMLElement>(null);
  const navBtnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);

  // Measure active nav button for sliding glow indicator
  useEffect(() => {
    const activeIdx = NAV_ITEMS.findIndex(item => item.view === currentView);
    if (activeIdx === -1 || !navRef.current) {
      setIndicator(null);
      return;
    }
    const btn = navBtnRefs.current[activeIdx];
    if (!btn || !navRef.current) return;
    const navRect = navRef.current.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    setIndicator({
      left: btnRect.left - navRect.left,
      width: btnRect.width,
    });
  }, [currentView]);

  const activeNavItem = NAV_ITEMS.find(item => item.view === currentView);
  const activeNavColor = activeNavItem?.color ?? '#6366F1';

  return (
    <div className={`header-outer${isScrolled ? ' scrolled' : ''}`}>
      <header className="header-inner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        {/* LEFT: Logo (theme-aware) */}
        <button
          onClick={() => handleNav(PageView.HOME)}
          className="focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 dark:focus-visible:ring-white/40 rounded shrink-0"
          aria-label="Go to home"
        >
          <Logo variant="dark" className="dark:hidden" />
          <Logo variant="light" className="hidden dark:flex" />
        </button>

        {/* CENTER: Primary Navigation with sliding glow indicator (desktop) */}
        <nav ref={navRef} className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2 h-full">
          {NAV_ITEMS.map((item, i) => {
            const isActive = currentView === item.view;
            return (
              <button
                key={item.view}
                ref={(el) => { navBtnRefs.current[i] = el; }}
                onClick={() => handleNav(item.view)}
                aria-current={isActive ? "page" : undefined}
                className={[
                  "nav-hover-item relative whitespace-nowrap transition-colors duration-200 font-semibold text-[15px]",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 dark:focus-visible:ring-white/40 rounded-lg px-3 py-1.5 h-full flex items-center",
                  isActive ? "" : "text-gray-500 dark:text-white/60",
                ].join(" ")}
                style={{
                  '--nav-item-color': item.color,
                  ...(isActive ? {
                    color: item.color,
                    ...(theme === 'dark' ? { filter: `drop-shadow(0 0 8px ${item.color}80)` } : {}),
                  } : {}),
                } as React.CSSProperties}
              >
                {item.label}
              </button>
            );
          })}
          {/* Sliding glow indicator bar */}
          {indicator && (
            <div
              className="header-glow-indicator"
              style={{
                left: indicator.left,
                width: indicator.width,
                backgroundColor: activeNavColor,
                boxShadow: theme === 'dark'
                  ? `0 0 12px ${activeNavColor}, 0 0 24px ${activeNavColor}80`
                  : `0 0 6px ${activeNavColor}60`,
              }}
              aria-hidden="true"
            />
          )}
        </nav>

        {/* RIGHT: Utility items (desktop) */}
        <div className="hidden lg:flex items-center gap-4 shrink-0">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-gray-500 hover:text-gray-700 dark:text-white/60 dark:hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 dark:focus-visible:ring-white/40"
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
            <div className="text-gray-400 dark:text-white/40 text-sm">...</div>
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
                className="text-gray-500 hover:text-gray-900 dark:text-white/60 dark:hover:text-white transition-colors text-sm font-medium whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 dark:focus-visible:ring-white/40 rounded-lg px-4 py-2.5"
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
            className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 dark:focus-visible:ring-white/40"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-700 dark:text-white" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700 dark:text-white" />
            )}
          </button>
        </div>
        </div>
      </header>

      {/* Mobile Menu Overlay + Panel */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" style={{ top: 74 }}>
          {/* Backdrop overlay */}
          <div
            className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${
              menuAnimating ? 'opacity-0' : 'opacity-100'
            }`}
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Menu panel — theme-aware to match header */}
          <div
            ref={mobileMenuRef}
            className={`absolute top-0 left-0 right-0 bg-white dark:bg-[#191919] border-b border-gray-200 dark:border-white/10 shadow-xl transform transition-all duration-200 ease-out ${
              menuAnimating
                ? 'opacity-0 -translate-y-2'
                : 'opacity-100 translate-y-0'
            }`}
          >
            <div className="px-6 py-5 flex flex-col gap-1">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.view}
                  onClick={() => handleNav(item.view)}
                  className="min-h-[48px] flex items-center font-semibold text-base text-gray-700 hover:text-gray-900 dark:text-white/80 dark:hover:text-white active:text-gray-900 dark:active:text-white transition-colors text-left px-2 -mx-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
                >
                  {item.label}
                </button>
              ))}

              <div className="h-px bg-gray-200 dark:bg-white/10 my-3" />

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="min-h-[48px] flex items-center gap-3 text-gray-500 hover:text-gray-700 dark:text-white/60 dark:hover:text-white transition-colors px-2 -mx-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
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

              <div className="h-px bg-gray-200 dark:bg-white/10 my-3" />

              {/* Auth section */}
              {isAuthenticated && user ? (
                <>
                  <div className="min-h-[48px] flex items-center gap-3 text-gray-900 dark:text-white font-medium px-2 -mx-2">
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
                    className="min-h-[48px] flex items-center gap-3 text-gray-500 hover:text-gray-700 dark:text-white/60 dark:hover:text-white font-medium transition-colors px-2 -mx-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    <LogOut className="w-5 h-5" />
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleNav(PageView.LOGIN)}
                  className="min-h-[48px] flex items-center font-semibold text-base text-gray-700 hover:text-gray-900 dark:text-white/80 dark:hover:text-white transition-colors px-2 -mx-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
                >
                  Log In
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
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
  onSecondaryAction?: () => void;
}> = ({
  onFreeTrial,
  onSecondaryAction,
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
    <div className="agentic-hero-banner relative bg-xenon-900 dark overflow-hidden pt-[64px]">
      <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none">
        <source src="/project-3.mp4" type="video/mp4" />
      </video>

      {/* Content container — matches Algolia's exact structure */}
      <div className="relative mx-auto max-w-[1512px] overflow-hidden z-10">
        <div className="mx-auto relative z-20 flex flex-col lg:flex-row">

          {/* Left column — matches Algolia: 47.7% width, left padding */}
          <div className="relative z-10 w-full lg:w-[47.7%] flex flex-col justify-center lg:pl-[85px] px-6 sm:px-10 lg:px-0 py-8 sm:py-12 lg:py-20">
            <div className="max-w-[520px] lg:max-w-none mx-auto lg:mx-0">
              <h1
                className="arcade-up-1 font-bold font-sora text-white mb-0 text-balance text-center lg:text-left text-[30px] sm:text-[44px] lg:text-[56px] xl:text-[64px] 2xl:text-[72px]"
                style={{ lineHeight: '110%', letterSpacing: '-2px' }}
              >
                Get help with<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6366F1] to-[#06B6D4]">
                  {displayText}
                </span>
                <span className="hero-cursor" aria-hidden="true" />
              </h1>

              <div className="arcade-up-2 mt-4 lg:mt-8">
                <p className="font-sora text-center lg:text-left text-sm sm:text-lg lg:text-xl xl:text-[22px] font-normal leading-relaxed text-white/85 my-0 mx-auto lg:mx-0">
                  24/7 AI-powered tech support<br /> for your home.
                </p>
              </div>

              {/* CTAs */}
              <div className="arcade-up-3 flex justify-center gap-3 sm:gap-4 mt-6 sm:mt-10 lg:mt-12 lg:justify-start">
                <button
                  onClick={onFreeTrial}
                  className="flex items-center cursor-pointer font-sora justify-center text-white px-6 sm:px-8 lg:px-10 h-11 sm:h-13 lg:h-[58px] rounded-full blue-gradient text-sm sm:text-base lg:text-lg"
                >
                  <span className="font-semibold font-sora whitespace-nowrap">
                    Get Help
                  </span>
                </button>
                {onSecondaryAction && (
                  <button
                    onClick={onSecondaryAction}
                    className="flex items-center justify-center cursor-pointer font-sora text-white px-6 sm:px-8 lg:px-10 h-11 sm:h-13 lg:h-[58px] rounded-full bg-white/10 hover:bg-white/20 border border-white/20 transition-colors text-sm sm:text-base lg:text-lg"
                  >
                    <span className="font-semibold font-sora whitespace-nowrap">
                      See how it works
                    </span>
                  </button>
                )}
              </div>

              {/* Trust chips — natural flow below CTAs */}
              <div className="arcade-up-3 flex flex-wrap justify-center lg:justify-start gap-x-4 sm:gap-x-5 gap-y-2 mt-5 sm:mt-8 lg:mt-10">
                <span className="flex items-center gap-1.5 text-sm text-white/60">
                  <CheckCircle2 className="w-4 h-4" /> No credit card needed
                </span>
                <span className="flex items-center gap-1.5 text-sm text-white/60">
                  <CheckCircle2 className="w-4 h-4" /> Cancel anytime
                </span>
                <span className="flex items-center gap-1.5 text-sm text-white/60">
                  <CheckCircle2 className="w-4 h-4" /> 24/7 instant answers
                </span>
              </div>
            </div>
          </div>

          {/* Right column — verbatim Algolia structure */}
          <div
            className={`arcade-up-4 w-full lg:w-[53.3%] flex justify-center lg:justify-end mt-8 lg:mt-0${paused ? ' agentic-hero-paused' : ''}`}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <div className="relative w-full max-w-[820px] lg:h-[680px]">
              {/* Invisible spacer — sets height on mobile, hidden on desktop where lg:h-[680px] takes over */}
              <img
                src={HERO_SLIDES[0].top}
                className="invisible w-full h-auto lg:hidden"
                alt=""
                aria-hidden="true"
                loading="eager"
              />
              {/* Slides — each has blur layer + product image */}
              {HERO_SLIDES.map((slide, i) => (
                <div
                  key={slide.id}
                  className={`agentic-hero-slide absolute inset-0 transition-opacity${active === i ? ' opacity-100' : ' opacity-0 pointer-events-none'}`}
                  style={{ transition: 'opacity 1.5s ease-out' }}
                >
                  <img
                    alt=""
                    src="/color-blur.png"
                    className="agentic-hero-blur absolute inset-0 w-full h-full object-cover pointer-events-none"
                    style={{ opacity: 0.9 }}
                    loading="eager"
                  />
                  <img
                    src={slide.top}
                    className="absolute bottom-0 left-0 lg:left-auto lg:right-0 w-full h-auto lg:w-auto lg:h-full lg:max-w-none"
                    alt={slide.alt}
                    loading={i === 0 ? 'eager' : 'lazy'}
                  />
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
    <section className="scroll-bg-section relative py-24 overflow-hidden">
      {/* Background image — swaps for dark theme */}
      <div className="scroll-bg-image absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${bgImage})` }} aria-hidden="true" />

      <div className="relative container mx-auto px-6 max-w-6xl z-10">
        <div className="reveal text-center mb-16">
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
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 reveal-stagger">
          {problems.map((item, i) => (
            <div key={i} className="reveal">
              <div
                className="group relative bg-white dark:bg-midnight-800 border border-light-200 dark:border-midnight-600 rounded-2xl overflow-hidden cursor-pointer h-full flex flex-col shadow-layered hover-lift"
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
                    Learn more <ArrowRight className="w-3.5 h-3.5 arcade-arrow" />
                  </span>
                </div>
                {/* Bottom gradient accent — visible on hover */}
                <div className="h-[3px] w-full bg-gradient-to-r from-[#6366F1] via-[#8B5CF6] to-[#06B6D4] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const WhyTotalAssist: React.FC = () => {
  const frustrationRows = [
    {
      bad: '"Please hold for the next available agent..."',
      good: 'Instant answers in under 30 seconds, 24/7.',
    },
    {
      bad: '"Can you repeat that? I\'m transferring you."',
      good: 'One Case. One history. No re-explaining.',
    },
    {
      bad: '"I\'m from Microsoft, I need your bank info."',
      good: 'Verified, secure, and scam-proof support.',
    },
    {
      bad: '"I\'ll need to come by between 8 AM and 4 PM."',
      good: 'Visual diagnostics right from your phone.',
    },
  ];

  return (
    <section className="py-24 bg-white dark:bg-midnight-900 overflow-x-clip relative border-t border-light-300 dark:border-midnight-700 transition-colors">
      <div className="container mx-auto px-6 max-w-5xl relative z-10">
        {/* Header */}
        <div className="reveal text-center mb-14">
          <span className="inline-block text-gradient-electric font-bold text-sm uppercase tracking-wider mb-4">
            Why TotalAssist
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-5 leading-tight text-text-primary dark:text-white">
            The technical lifeline your home actually needs.
          </h2>
          <p className="text-text-secondary text-lg sm:text-xl max-w-2xl mx-auto">
            Stop waiting on hold. Stop explaining yourself twice. Stop worrying about scammers.
          </p>
        </div>

        {/* Frustration Grid */}
        <div className="reveal-stagger mb-16">
          {/* Column headers — desktop only */}
          <div className="hidden md:grid grid-cols-2 gap-6 mb-4 px-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-text-muted uppercase tracking-wider">
              <Phone className="w-4 h-4" />
              The &ldquo;Other Guys&rdquo;
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-electric-indigo uppercase tracking-wider">
              <Check className="w-4 h-4" />
              TotalAssist
            </div>
          </div>

          {/* Rows — paired cards */}
          <div className="space-y-4">
            {frustrationRows.map((row, i) => (
              <div key={i} className="reveal grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
                {/* "Other Guys" card */}
                <div className="frustration-card-bad frustration-quote relative p-5 pl-10 md:pl-12">
                  <p className="text-sm sm:text-[15px] italic text-text-muted leading-relaxed">
                    {row.bad}
                  </p>
                </div>
                {/* TotalAssist card */}
                <div className="frustration-card-good p-5 flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-electric-indigo/15 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-electric-indigo" />
                  </div>
                  <p className="text-sm sm:text-[15px] font-medium text-text-primary dark:text-white leading-relaxed">
                    {row.good}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer line */}
        <div className="reveal text-center text-sm text-text-muted max-w-3xl mx-auto">
          Compared to typical remote support plans at $9.99&ndash;$34.99/mo plus setup and long hold times,
          TotalAssist gives you instant, visual diagnostics and saved repair records at home-friendly pricing.
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
      a: "We offer three plans: Free (5 messages and 1 photo analysis — great for trying us out), Home ($9.99/mo for unlimited chat, photos, voice support, and a weekly video diagnostic), and Pro ($19.99/mo — everything in Home plus 15 video credits/month, multi-home support for up to 5 properties, and family member accounts). All plans include guided Assist Pills, PDF diagnostic reports, and smart gear recommendations.",
    },
    {
      q: "Why use TotalAssist instead of Gemini or ChatGPT?",
      a: "General AI chatbots can answer questions, but they can't see your devices through photo or video, guide you with interactive Assist Pills, track your case history, or generate a PDF diagnostic report. TotalAssist is purpose-built for home tech support.",
    },
    {
      q: "Do I have to type everything?",
      a: "Not at all. You can talk through your issue with Voice Support, snap a photo, start a live video session, or tap guided Assist Pills. Typing is just one of four ways to get help.",
    },
  ];

  return (
    <section className="py-24 bg-light-100 dark:bg-midnight-950 border-t border-light-300 dark:border-midnight-700 relative transition-colors">
      <div className="container mx-auto px-6 max-w-3xl">
        {/* Header */}
        <div className="reveal text-center mb-12">
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
        </div>

        {/* FAQ Items */}
        <div className="reveal">
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
        <div className="reveal">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Life's too short for tech headaches.
          </h2>
        </div>
        <div className="reveal" style={{ transitionDelay: '150ms' }}>
          <p className="text-white/90 font-medium max-w-2xl mx-auto mb-10 text-xl lg:text-2xl">
            No more searching for answers at midnight. No more feeling stuck with
            your own devices. Just instant AI-powered help, whenever you need it.
          </p>
        </div>
        <div className="reveal hover-scale" style={{ transitionDelay: '300ms' }}>
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
        </div>
        <div className="reveal" style={{ transitionDelay: '450ms' }}>
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
    <footer className="bg-midnight-950 text-white pt-20 pb-10">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16 reveal-stagger">
          {/* Brand Column */}
          <div className="reveal col-span-2 md:col-span-1">
            <button
              onClick={() => handleNav(PageView.HOME)}
              className="mb-6 block"
            >
              <Logo variant="light" />
            </button>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Your 24/7 technical safety net. TotalAssist diagnoses and fixes your home's Wi-Fi, gadgets, and appliances instantly. Expert support is now just a heartbeat away.
            </p>
          </div>

          {/* Product Column */}
          <div className="reveal">
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
          </div>

          {/* Support Column */}
          <div className="reveal">
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
          </div>

          {/* Legal Column */}
          <div className="reveal">
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
          </div>
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
  const { tier: subscriptionTier, isLoading: subscriptionLoading, isPostCheckout, startPostCheckoutSync, videoCredits: serverVideoCredits } = useSubscription(effectiveUserId);

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

  // Activate Arcade-style scroll-reveal animations on .reveal elements
  useScrollReveal();

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

  const handleScrollToLifecycle = useCallback(() => {
    document.getElementById('how-it-works-lifecycle')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

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
    // Poll for the pricing-plans anchor until the lazy-loaded component mounts
    let attempts = 0;
    const poll = setInterval(() => {
      const el = document.getElementById('pricing-plans');
      if (el) {
        clearInterval(poll);
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (++attempts >= 20) {
        clearInterval(poll);
      }
    }, 50);
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
          return <Pricing onStart={handleStart} onNavigate={navigate} onCheckoutSuccess={() => startPostCheckoutSync(subscriptionTier)} />;
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
        // After Stripe checkout, poll until subscription tier updates before showing dashboard
        if (dashboardUser && isPostCheckout) {
          return <LoadingScreen message="Activating your subscription..." />;
        }
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
          return <LoadingScreen message="Loading your dashboard..." />;
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
                onSecondaryAction={handleScrollToLifecycle}
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
              <HowItWorksLifecycle />
              <ServicesSection onNavigate={navigate} />
              <WhatWeHelpWith onNavigate={navigate} />
              <SectionDivider variant="line" />
              <WhyTotalAssist />
              <SectionDivider variant="line" />
              <FAQSection />
              <InvestorCredibility />
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
