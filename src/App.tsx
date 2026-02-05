import React, { useState, useRef, useEffect, useCallback } from "react";
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
} from "lucide-react";
import { ChatWidget, ChatWidgetHandle } from "./components/ChatWidget";
import { ProfileDropdown } from "./components/ProfileDropdown";
import { Logo, ScoutSignalIcon } from "./components/Logo";
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
import { useSyncUsageWithAuth, useUsage } from "./stores/usageStore";
import { useSubscription } from "./hooks/useSubscription";
import { useTheme } from "./context/ThemeContext";

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

// Hook to detect when an element is in viewport
const useInView = (options?: IntersectionObserverInit) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setIsInView(true);
          setHasAnimated(true);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px', ...options }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [hasAnimated, options]);

  return { ref, isInView };
};

// Hook for parallax scroll effect
const useParallax = (speed: number = 0.5) => {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const scrolled = window.innerHeight - rect.top;
      if (scrolled > 0 && rect.bottom > 0) {
        setOffset(scrolled * speed);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial call
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return { ref, offset };
};

// Animated wrapper component with various animation types
const AnimatedElement: React.FC<{
  children: React.ReactNode;
  animation?: 'fadeIn' | 'fadeInUp' | 'fadeInDown' | 'fadeInLeft' | 'fadeInRight' | 'scaleIn' | 'none';
  delay?: number;
  duration?: number;
  className?: string;
}> = ({
  children,
  animation = 'fadeInUp',
  delay = 0,
  duration = 0.6,
  className = '',
}) => {
  const { ref, isInView } = useInView();

  const baseStyles: React.CSSProperties = {
    transition: `opacity ${duration}s ease-out, transform ${duration}s ease-out`,
    transitionDelay: `${delay}s`,
  };

  const animations: Record<string, { hidden: React.CSSProperties; visible: React.CSSProperties }> = {
    fadeIn: {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
    },
    fadeInUp: {
      hidden: { opacity: 0, transform: 'translateY(30px)' },
      visible: { opacity: 1, transform: 'translateY(0)' },
    },
    fadeInDown: {
      hidden: { opacity: 0, transform: 'translateY(-30px)' },
      visible: { opacity: 1, transform: 'translateY(0)' },
    },
    fadeInLeft: {
      hidden: { opacity: 0, transform: 'translateX(-30px)' },
      visible: { opacity: 1, transform: 'translateX(0)' },
    },
    fadeInRight: {
      hidden: { opacity: 0, transform: 'translateX(30px)' },
      visible: { opacity: 1, transform: 'translateX(0)' },
    },
    scaleIn: {
      hidden: { opacity: 0, transform: 'scale(0.9)' },
      visible: { opacity: 1, transform: 'scale(1)' },
    },
    none: {
      hidden: {},
      visible: {},
    },
  };

  const currentAnimation = animations[animation] || animations.fadeInUp;
  const animationStyles = isInView ? currentAnimation.visible : currentAnimation.hidden;

  return (
    <div
      ref={ref}
      className={className}
      style={{ ...baseStyles, ...animationStyles }}
    >
      {children}
    </div>
  );
};

// ============================================
// End Animation Hooks & Components
// ============================================

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
      "bg-transparent border-2 border-electric-indigo text-electric-indigo hover:bg-electric-indigo/10",
    outlineElectric:
      "bg-transparent border-2 border-electric-indigo text-electric-indigo hover:bg-electric-indigo/10",
    dark: "bg-light-200 text-text-primary hover:bg-light-300 border border-light-300",
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

// Credit Counter Component - shows usage for logged-in users
const CreditCounter: React.FC<{
  onNavigate: (view: PageView) => void;
}> = ({ onNavigate }) => {
  const { tier, usage, getVideoCreditsRemaining } = useUsage();

  // Don't show for pro users (they have unlimited everything)
  if (tier === 'pro') return null;

  // Determine what to show based on tier
  const isUnlimited = tier === 'home';
  const chatRemaining = isUnlimited ? null : Math.max(0, usage.chat.limit - usage.chat.used);
  const photoRemaining = isUnlimited ? null : Math.max(0, usage.photo.limit - usage.photo.used);
  const videoCredits = tier === 'home' ? getVideoCreditsRemaining() : null;

  return (
    <button
      onClick={() => onNavigate(PageView.PRICING)}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-light-100 dark:bg-midnight-800 border border-light-300 dark:border-midnight-700 hover:border-electric-indigo/50 transition-colors group"
      title="View usage & upgrade"
    >
      <Zap className="w-3.5 h-3.5 text-electric-cyan" />
      <div className="flex items-center gap-3 text-xs font-medium">
        {chatRemaining !== null && (
          <span className="text-text-secondary group-hover:text-text-primary dark:group-hover:text-white transition-colors">
            <span className="text-text-primary dark:text-white">{chatRemaining}</span> chats
          </span>
        )}
        {photoRemaining !== null && (
          <span className="text-text-secondary group-hover:text-text-primary dark:group-hover:text-white transition-colors">
            <span className="text-text-primary dark:text-white">{photoRemaining}</span> photos
          </span>
        )}
        {videoCredits !== null && (
          <span className="text-text-secondary group-hover:text-text-primary dark:group-hover:text-white transition-colors">
            <span className="text-text-primary dark:text-white">{videoCredits}</span> video
          </span>
        )}
        {!isUnlimited && (
          <span className="text-electric-indigo text-[10px] font-bold uppercase">Upgrade</span>
        )}
      </div>
    </button>
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
    <header className="fixed top-0 left-0 w-full z-50 h-[72px] bg-white/95 dark:bg-midnight-900/95 backdrop-blur-md border-b border-light-300 dark:border-midnight-700 shadow-sm transition-colors">
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
            className="p-2 rounded-lg hover:bg-light-200 dark:hover:bg-midnight-800 transition-colors text-text-secondary hover:text-text-primary dark:hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-electric-indigo/60 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-midnight-900"
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
              {/* Credit Counter for logged-in users */}
              <CreditCounter onNavigate={onNavigate} />
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
                className={`${textColorMuted} ${hoverColor} transition-colors text-sm font-medium whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-electric-indigo/60 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-midnight-900 rounded px-2 py-1`}
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

        {/* Mobile: CTA + Hamburger */}
        <div className="flex lg:hidden items-center gap-3">
          <button
            onClick={() => onNavigate(PageView.SIGNUP)}
            className="btn-gradient-electric text-white font-semibold px-4 py-2 rounded-full text-sm transition-all whitespace-nowrap"
          >
            Get Started
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
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-scout-purple to-electric-indigo flex items-center justify-center">
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

// Hero Hexagon Pattern - creates visual distinction in the gradient area
const HeroHexagonPattern: React.FC<{ offset: number }> = ({ offset }) => {
  // Generate hexagon positions - concentrated on the left/gradient side and bottom edge
  const hexagons = React.useMemo(() => {
    const items: Array<{
      x: number;
      y: number;
      size: number;
      opacity: number;
      color: string;
      parallaxFactor: number;
    }> = [];

    const colors = ['#6366F1', '#A855F7', '#06B6D4', '#818CF8', '#C084FC'];

    // Left side hexagons (gradient area) - more concentrated
    for (let i = 0; i < 12; i++) {
      items.push({
        x: Math.random() * 45, // Left 45% of screen
        y: Math.random() * 100,
        size: 30 + Math.random() * 50,
        opacity: 0.03 + Math.random() * 0.06,
        color: colors[Math.floor(Math.random() * colors.length)],
        parallaxFactor: 0.2 + Math.random() * 0.4,
      });
    }

    // Bottom edge hexagons - creates the "split" visual
    for (let i = 0; i < 8; i++) {
      items.push({
        x: Math.random() * 100,
        y: 75 + Math.random() * 25, // Bottom 25%
        size: 40 + Math.random() * 60,
        opacity: 0.04 + Math.random() * 0.08,
        color: colors[Math.floor(Math.random() * colors.length)],
        parallaxFactor: 0.1 + Math.random() * 0.3,
      });
    }

    // Scattered accent hexagons
    for (let i = 0; i < 6; i++) {
      items.push({
        x: 30 + Math.random() * 40, // Middle area
        y: Math.random() * 80,
        size: 20 + Math.random() * 35,
        opacity: 0.02 + Math.random() * 0.04,
        color: colors[Math.floor(Math.random() * colors.length)],
        parallaxFactor: 0.3 + Math.random() * 0.5,
      });
    }

    return items;
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
      {hexagons.map((hex, i) => (
        <div
          key={i}
          className="absolute transition-transform duration-100"
          style={{
            left: `${hex.x}%`,
            top: `${hex.y}%`,
            transform: `translate(-50%, -50%) translateY(${offset * hex.parallaxFactor}px)`,
          }}
        >
          <Hexagon
            size={hex.size}
            style={{
              color: hex.color,
              opacity: hex.opacity,
              filter: 'blur(1px)',
            }}
          />
        </div>
      ))}

      {/* Bottom edge gradient line with hexagon accent */}
      <div className="absolute bottom-0 left-0 right-0 h-32">
        {/* Gradient fade to next section */}
        <div className="absolute inset-0 bg-gradient-to-t from-light-100 dark:from-midnight-950 via-light-100/50 dark:via-midnight-950/50 to-transparent"></div>

        {/* Hexagon accent line */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 opacity-30">
          <div className="w-24 h-px bg-gradient-to-r from-transparent to-electric-indigo/50"></div>
          <Hexagon size={16} style={{ color: '#6366F1', opacity: 0.6 }} />
          <div className="w-16 h-px bg-electric-indigo/40"></div>
          <Hexagon size={12} style={{ color: '#A855F7', opacity: 0.5 }} />
          <div className="w-24 h-px bg-gradient-to-l from-transparent to-scout-purple/50"></div>
        </div>
      </div>
    </div>
  );
};

const Hero: React.FC<{ onFreeTrial: () => void; onPricing: () => void }> = ({
  onFreeTrial,
  onPricing,
}) => {
  const { ref: parallaxRef, offset } = useParallax(0.3);

  return (
    <section ref={parallaxRef} className="relative min-h-screen overflow-hidden -mt-[72px] pt-[72px]">
      {/* Background hero image - different images for mobile vs desktop */}
      {/* Mobile/Tablet: vertical mobile-hero.png, Desktop: horizontal homepage-hero.jpg */}

      {/* Mobile hero image (below lg) */}
      <div
        className="absolute inset-0 bg-cover bg-no-repeat bg-[center_bottom] lg:hidden"
        style={{
          backgroundImage: "url(/mobile-hero.png)",
        }}
      ></div>

      {/* Desktop hero image (lg and up) */}
      <div
        className="absolute inset-0 bg-cover bg-no-repeat bg-[center_right_-50px] xl:bg-[center_right] hidden lg:block"
        style={{
          backgroundImage: "url(/homepage-hero.jpg)",
        }}
      ></div>

      {/* ===== GRADIENT OVERLAYS (separate from background images) ===== */}

      {/* ===== LIGHT MODE - MOBILE (top to bottom, layered) ===== */}
      {/* Layer 1: Primary top-to-bottom gradient - extended coverage */}
      <div className="absolute inset-0 lg:hidden dark:hidden" style={{
        background: `linear-gradient(180deg,
          rgba(255,255,255,0.99) 0%,
          rgba(255,255,255,0.98) 25%,
          rgba(250,250,255,0.95) 45%,
          rgba(243,244,255,0.85) 60%,
          rgba(238,242,255,0.6) 75%,
          rgba(238,242,255,0.3) 85%,
          transparent 95%)`
      }}></div>
      {/* Layer 2: Diagonal gradient for natural edge */}
      <div className="absolute inset-0 lg:hidden dark:hidden" style={{
        background: `linear-gradient(160deg,
          rgba(255,255,255,0.95) 0%,
          rgba(248,247,255,0.9) 35%,
          rgba(243,244,255,0.6) 55%,
          rgba(168,85,247,0.08) 70%,
          transparent 85%)`
      }}></div>

      {/* ===== LIGHT MODE - DESKTOP (left to right, layered like Jobber) ===== */}
      {/* Layer 1: Primary left-to-right gradient */}
      <div className="absolute inset-0 hidden lg:block dark:hidden" style={{
        background: `linear-gradient(90deg,
          rgba(255,255,255,0.98) 0%,
          rgba(252,252,255,0.96) 20%,
          rgba(248,248,255,0.85) 35%,
          rgba(243,244,255,0.6) 48%,
          rgba(238,242,255,0.3) 58%,
          transparent 70%)`
      }}></div>
      {/* Layer 2: Diagonal gradient (top-left to bottom-right) for organic curve */}
      <div className="absolute inset-0 hidden lg:block dark:hidden" style={{
        background: `linear-gradient(135deg,
          rgba(255,255,255,0.9) 0%,
          rgba(250,249,255,0.7) 25%,
          rgba(243,244,255,0.4) 40%,
          rgba(168,85,247,0.06) 55%,
          transparent 70%)`
      }}></div>
      {/* Layer 3: Subtle bottom-left corner reinforcement */}
      <div className="absolute inset-0 hidden lg:block dark:hidden" style={{
        background: `linear-gradient(45deg,
          rgba(255,255,255,0.85) 0%,
          rgba(248,248,255,0.5) 25%,
          transparent 50%)`
      }}></div>

      {/* ===== DARK MODE - MOBILE (top to bottom, layered) ===== */}
      {/* Layer 1: Primary top-to-bottom gradient with brand tint - extended coverage */}
      <div className="absolute inset-0 lg:dark:hidden hidden dark:block" style={{
        background: `linear-gradient(180deg,
          rgba(11,14,30,0.99) 0%,
          rgba(11,14,30,0.98) 20%,
          rgba(18,16,42,0.96) 40%,
          rgba(30,24,58,0.88) 55%,
          rgba(45,35,75,0.7) 70%,
          rgba(99,102,241,0.25) 85%,
          transparent 98%)`
      }}></div>
      {/* Layer 2: Diagonal gradient for natural edge */}
      <div className="absolute inset-0 lg:dark:hidden hidden dark:block" style={{
        background: `linear-gradient(160deg,
          rgba(15,12,35,0.95) 0%,
          rgba(25,20,50,0.85) 30%,
          rgba(35,28,65,0.7) 50%,
          rgba(168,85,247,0.15) 70%,
          transparent 88%)`
      }}></div>

      {/* ===== DARK MODE - DESKTOP (left to right, layered like Jobber) ===== */}
      {/* Layer 1: Primary left-to-right gradient with deep purple undertones */}
      <div className="absolute inset-0 hidden lg:dark:block" style={{
        background: `linear-gradient(90deg,
          rgba(11,14,30,0.98) 0%,
          rgba(15,14,38,0.97) 15%,
          rgba(22,20,50,0.92) 28%,
          rgba(35,28,68,0.8) 40%,
          rgba(55,45,90,0.55) 52%,
          rgba(99,102,241,0.25) 62%,
          transparent 75%)`
      }}></div>
      {/* Layer 2: Diagonal gradient (top-left to bottom-right) for organic curve */}
      <div className="absolute inset-0 hidden lg:dark:block" style={{
        background: `linear-gradient(135deg,
          rgba(12,10,32,0.92) 0%,
          rgba(25,20,55,0.75) 20%,
          rgba(45,35,80,0.5) 38%,
          rgba(168,85,247,0.15) 52%,
          rgba(99,102,241,0.08) 65%,
          transparent 78%)`
      }}></div>
      {/* Layer 3: Bottom-left corner reinforcement for depth */}
      <div className="absolute inset-0 hidden lg:dark:block" style={{
        background: `linear-gradient(45deg,
          rgba(11,14,28,0.9) 0%,
          rgba(20,18,45,0.6) 20%,
          rgba(35,30,60,0.3) 35%,
          transparent 55%)`
      }}></div>

      {/* Hexagon pattern for visual distinction */}
      <HeroHexagonPattern offset={offset} />

      {/* Gradient orbs for visual interest - with parallax */}
      <div
        className="absolute top-1/4 right-1/4 w-96 h-96 bg-electric-indigo/10 rounded-full blur-3xl transition-transform duration-100 z-[2]"
        style={{ transform: `translateY(${offset * 0.8}px)` }}
      ></div>
      <div
        className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-scout-purple/8 rounded-full blur-3xl transition-transform duration-100 z-[2]"
        style={{ transform: `translateY(${offset * 0.4}px)` }}
      ></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-8 items-center min-h-[calc(100vh-72px)]">
          {/* Left side - Content */}
          <div className="pt-16 sm:pt-12 md:pt-8 lg:pt-0 pb-8 sm:pb-0 max-w-lg sm:max-w-xl lg:max-w-none">
            <AnimatedElement animation="fadeInDown" delay={0.1}>
              <div className="inline-flex items-center gap-2 bg-white/80 dark:bg-electric-indigo/20 backdrop-blur-md px-3 sm:px-4 py-2 rounded-full mb-4 sm:mb-6 border border-electric-indigo/40 shadow-sm">
                <ScoutSignalIcon size={18} animate={true} />
                <span className="text-electric-indigo font-semibold text-xs sm:text-sm">
                  Scout AI available 24/7
                </span>
              </div>
            </AnimatedElement>
            <AnimatedElement animation="fadeInUp" delay={0.2}>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-black tracking-tight leading-[1.1] mb-4 sm:mb-6">
                <span
                  className="text-text-primary dark:text-white"
                  style={{
                    textShadow: '0 1px 2px rgba(0,0,0,0.1), 0 2px 8px rgba(255,255,255,0.5)',
                  }}
                >
                  <span className="dark:[text-shadow:0_2px_12px_rgba(0,0,0,0.8),0_1px_2px_rgba(0,0,0,0.5)]">
                    Fix your tech in minutes
                  </span>
                </span>
                <br />
                <span
                  className="text-gradient-electric"
                  style={{
                    filter: 'drop-shadow(0 2px 4px rgba(99,102,241,0.4))',
                  }}
                >
                  — with Scout AI.
                </span>
              </h1>
            </AnimatedElement>
            <AnimatedElement animation="fadeInUp" delay={0.4}>
              <p
                className="text-base sm:text-lg md:text-xl lg:text-xl font-medium leading-relaxed mb-6 sm:mb-8 md:mb-10 max-w-md sm:max-w-lg lg:max-w-xl text-gray-700 dark:text-gray-200"
                style={{
                  textShadow: '0 1px 2px rgba(255,255,255,0.8)',
                }}
              >
                <span className="dark:[text-shadow:0_1px_8px_rgba(0,0,0,0.6),0_1px_2px_rgba(0,0,0,0.4)]">
                  TotalAssist leverages the power of Scout AI to provide a 24/7 lifeline for your home. No hold music, no complex menus—just an intelligent assistant that walks you through every fix.
                </span>
              </p>
            </AnimatedElement>
            <AnimatedElement animation="fadeInUp" delay={0.6}>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8">
                <Button
                  variant="electric"
                  onClick={onFreeTrial}
                  className="text-base sm:text-lg px-6 sm:px-10 py-3 sm:py-4 shadow-lg"
                >
                  Get Started
                </Button>
                <Button
                  variant="dark"
                  onClick={onPricing}
                  className="text-base sm:text-lg px-6 sm:px-10 py-3 sm:py-4 bg-white/90 dark:bg-midnight-800/90 backdrop-blur-sm border-2 border-gray-300 dark:border-midnight-600 text-text-primary dark:text-white hover:bg-white dark:hover:bg-midnight-700 shadow-md"
                >
                  Explore Pricing
                </Button>
              </div>
            </AnimatedElement>
            <AnimatedElement animation="fadeIn" delay={0.8}>
              <div
                className="inline-flex flex-col xs:flex-row items-start xs:items-center gap-3 sm:gap-6 text-xs sm:text-sm px-4 py-3 rounded-xl bg-white/70 dark:bg-midnight-900/70 backdrop-blur-sm border border-gray-200 dark:border-midnight-700 shadow-sm"
              >
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200 font-medium">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-electric-cyan flex-shrink-0" />
                  <span>No credit card needed</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200 font-medium">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-electric-cyan flex-shrink-0" />
                  <span>24/7 instant answers</span>
                </div>
              </div>
            </AnimatedElement>
          </div>

          {/* Right side - empty to let the background image show */}
          <div className="hidden lg:block"></div>
        </div>
      </div>
    </section>
  );
};

// Hexagon SVG component
const Hexagon: React.FC<{
  className?: string;
  size?: number;
  style?: React.CSSProperties;
}> = ({ className = "", size = 40, style }) => (
  <svg
    width={size}
    height={size * 1.1547}
    viewBox="0 0 100 115.47"
    className={className}
    style={style}
  >
    <polygon
      points="50,0 100,28.87 100,86.6 50,115.47 0,86.6 0,28.87"
      fill="currentColor"
    />
  </svg>
);

// Hexagon Pattern Divider with staggered opacity
const HexagonDivider: React.FC<{
  variant?: 'sparse' | 'medium' | 'dense';
  colorScheme?: 'indigo' | 'purple' | 'cyan' | 'mixed';
}> = ({ variant = 'medium', colorScheme = 'mixed' }) => {
  const getHexagons = () => {
    const hexagons: Array<{
      x: number;
      y: number;
      size: number;
      opacity: number;
      color: string;
      delay: number;
    }> = [];

    const colors = {
      indigo: ['#6366F1', '#818CF8', '#4F46E5'],
      purple: ['#A855F7', '#C084FC', '#9333EA'],
      cyan: ['#06B6D4', '#22D3EE', '#0891B2'],
      mixed: ['#6366F1', '#A855F7', '#06B6D4', '#818CF8', '#C084FC'],
    };

    const selectedColors = colors[colorScheme];
    const count = variant === 'sparse' ? 8 : variant === 'medium' ? 14 : 20;

    for (let i = 0; i < count; i++) {
      hexagons.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 20 + Math.random() * 40,
        opacity: 0.03 + Math.random() * 0.08,
        color: selectedColors[Math.floor(Math.random() * selectedColors.length)],
        delay: Math.random() * 2,
      });
    }

    return hexagons;
  };

  const hexagons = React.useMemo(() => getHexagons(), [variant, colorScheme]);

  return (
    <div className="relative h-24 overflow-hidden bg-light-100 dark:bg-midnight-950">
      {/* Hexagon pattern */}
      <div className="absolute inset-0">
        {hexagons.map((hex, i) => (
          <div
            key={i}
            className="absolute transition-opacity duration-1000"
            style={{
              left: `${hex.x}%`,
              top: `${hex.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <Hexagon
              size={hex.size}
              style={{
                color: hex.color,
                opacity: hex.opacity * 1.5,
                filter: 'blur(1px)',
              }}
            />
          </div>
        ))}
      </div>

      {/* Center accent line */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-px bg-gradient-to-r from-transparent via-electric-indigo/40 to-transparent z-20"></div>
    </div>
  );
};

// Section Divider Component for visual separation
const SectionDivider: React.FC<{ variant?: 'gradient' | 'line' | 'wave' | 'hexagon' }> = ({ variant = 'gradient' }) => {
  if (variant === 'hexagon') {
    return <HexagonDivider variant="medium" colorScheme="mixed" />;
  }

  if (variant === 'wave') {
    return (
      <div className="relative h-24 overflow-hidden bg-transparent dark:bg-transparent">
        <svg className="absolute bottom-0 w-full h-24" viewBox="0 0 1440 96" preserveAspectRatio="none">
          <path
            fill="currentColor"
            className="text-light-200"
            d="M0,64 C480,96 960,32 1440,64 L1440,96 L0,96 Z"
          />
        </svg>
      </div>
    );
  }

  if (variant === 'line') {
    return (
      <div className="relative py-6 bg-light-100 dark:bg-midnight-950">
        <div className="max-w-6xl mx-auto px-6">
          <div className="h-px bg-gradient-to-r from-transparent via-electric-indigo/30 to-transparent"></div>
        </div>
      </div>
    );
  }

  // Default gradient divider
  return (
    <div className="h-12 bg-gradient-to-b from-transparent to-light-100 dark:to-midnight-950"></div>
  );
};

const HowItWorksSimple: React.FC = () => {
  const steps = [
    {
      step: "1.",
      title: "Tell Us",
      desc: '"My Wi-Fi keeps dropping" or "There\'s a weird error code"—just describe it like you would to a friend. Scout AI understands and guides you through it.',
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
          <h2 className="text-4xl lg:text-5xl font-black mb-6 text-text-primary dark:text-white">
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
                  <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-electric-indigo to-transparent"></div>
                )}
                <div className="relative rounded-2xl p-8 bg-white dark:bg-midnight-900 border border-light-300 dark:border-midnight-700 hover:border-electric-indigo/50 transition-all duration-300 hover:-translate-y-1 shadow-sm">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-scout-purple to-electric-indigo rounded-2xl flex items-center justify-center text-white shadow-lg shadow-scout-purple/30">
                      {s.icon}
                    </div>
                    <span className="text-5xl font-black text-gradient-electric">
                      {s.step}
                    </span>
                  </div>
                  <h3 className="text-xl font-black mb-3 text-text-primary dark:text-white">
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
    <section className="py-24 bg-white dark:bg-midnight-950 border-t border-light-300 dark:border-midnight-700 transition-colors">
      <div className="container mx-auto px-6 max-w-6xl">
        <AnimatedElement animation="fadeInUp" className="text-center mb-16">
          <span className="inline-block text-electric-indigo font-bold text-sm uppercase tracking-wider mb-4">
            What We Help With
          </span>
          <h2 className="text-4xl lg:text-5xl font-black mb-6 text-text-primary dark:text-white">
            Technology support for your home
          </h2>
          <p className="text-xl max-w-2xl mx-auto text-text-secondary">
            From Wi-Fi troubles to smart home setup—TotalAssist helps with the tech that
            keeps your home running.
          </p>
        </AnimatedElement>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {problems.map((item, i) => (
            <AnimatedElement key={i} animation="scaleIn" delay={0.1 + i * 0.08}>
              <div className="group p-5 rounded-2xl transition-all duration-300 cursor-pointer hover:-translate-y-1 bg-light-100 dark:bg-midnight-900 border border-light-300 dark:border-midnight-700 hover:border-electric-indigo/50 hover:shadow-lg h-full">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all bg-white dark:bg-midnight-800 text-electric-indigo group-hover:bg-gradient-to-br group-hover:from-electric-indigo group-hover:to-electric-cyan group-hover:text-white border border-light-300 dark:border-midnight-600">
                  {item.icon}
                </div>
                <h3 className="font-bold text-base mb-1 text-text-primary dark:text-white">
                  {item.label}
                </h3>
                <p className="text-sm text-text-muted">
                  {item.desc}
                </p>
              </div>
            </AnimatedElement>
          ))}
        </div>
      </div>
    </section>
  );
};

const WhyTotalAssist: React.FC = () => {
  const comparisonBenefits = [
    { benefit: "Instant answers", scoutAI: true, phoneSupport: false },
    { benefit: "Snap a photo for diagnosis", scoutAI: true, phoneSupport: false },
    { benefit: "No hold music", scoutAI: true, phoneSupport: false },
    { benefit: "24/7 availability", scoutAI: true, phoneSupport: false },
    { benefit: "Explain your issue once", scoutAI: true, phoneSupport: false },
    { benefit: "Under 30-second average response", scoutAI: true, phoneSupport: false },
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

  const { ref: parallaxRef, offset } = useParallax(0.2);

  return (
    <section ref={parallaxRef} className="py-24 bg-light-100 dark:bg-midnight-950 overflow-hidden relative border-t border-light-300 dark:border-midnight-700 transition-colors">
      {/* Decorative background elements with parallax */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-0 left-1/4 w-96 h-96 bg-electric-indigo/10 rounded-full blur-3xl transition-transform duration-100"
          style={{ transform: `translateY(${offset * 0.5}px)` }}
        ></div>
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-scout-purple/10 rounded-full blur-3xl transition-transform duration-100"
          style={{ transform: `translateY(${-offset * 0.3}px)` }}
        ></div>
      </div>

      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        {/* Header */}
        <AnimatedElement animation="fadeInUp" className="text-center mb-16">
          <span className="inline-block text-electric-indigo font-bold text-sm uppercase tracking-wider mb-4">
            Comparison
          </span>
          <h2 className="text-4xl lg:text-5xl font-black mb-6 leading-tight text-text-primary dark:text-white">
            Tech support that actually works
          </h2>
          <p className="text-text-secondary text-xl max-w-2xl mx-auto">
            We built Scout AI because everyone deserves help that's instant,
            clear, and doesn't waste your time.
          </p>
        </AnimatedElement>

        {/* Comparison Table Section */}
        <AnimatedElement animation="fadeInUp" delay={0.2} className="mb-20">
          {/* Table Header */}
          <div className="text-center mb-8">
            <h3 className="text-3xl lg:text-4xl font-black text-text-primary dark:text-white mb-3">
              Skip the wait. Get answers instantly.
            </h3>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              Scout AI diagnoses tech and home issues in seconds — no calls, no waiting, no transfers.
            </p>
          </div>

          {/* Comparison Table */}
          <div className="relative overflow-hidden rounded-2xl border border-light-300 dark:border-midnight-700 bg-white dark:bg-midnight-900 shadow-lg">
            {/* Table Header Row */}
            <div className="grid grid-cols-3 bg-light-100 dark:bg-midnight-800 border-b border-light-300 dark:border-midnight-700">
              <div className="p-4 lg:p-6 font-bold text-text-secondary text-sm lg:text-base">
                Benefit
              </div>
              <div className="p-4 lg:p-6 flex items-center justify-center gap-2 lg:gap-3 border-x border-light-300 dark:border-midnight-700 bg-gradient-to-b from-electric-indigo/10 to-transparent">
                <img
                  src="/scout_logo.png"
                  alt="Scout AI"
                  className="w-6 h-6 lg:w-8 lg:h-8 object-contain"
                />
                <span className="font-bold text-text-primary dark:text-white text-sm lg:text-base">Scout AI</span>
              </div>
              <div className="p-4 lg:p-6 flex items-center justify-center">
                <span className="font-bold text-text-secondary text-sm lg:text-base">Phone Support</span>
              </div>
            </div>

            {/* Table Body Rows */}
            {comparisonBenefits.map((item, i) => (
              <div
                key={i}
                className={`grid grid-cols-3 ${i !== comparisonBenefits.length - 1 ? 'border-b border-light-300 dark:border-midnight-700' : ''} hover:bg-light-100 dark:hover:bg-midnight-800 transition-colors`}
              >
                <div className="p-4 lg:p-5 flex items-center text-text-primary dark:text-white font-medium text-sm lg:text-base">
                  {item.benefit}
                </div>
                <div className="p-4 lg:p-5 flex items-center justify-center border-x border-light-300 dark:border-midnight-700 bg-gradient-to-b from-electric-indigo/5 to-transparent">
                  <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-electric-cyan/20 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 lg:w-5 lg:h-5 text-electric-cyan" />
                  </div>
                </div>
                <div className="p-4 lg:p-5 flex items-center justify-center">
                  <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                    <X className="w-4 h-4 lg:w-5 lg:h-5 text-red-500" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AnimatedElement>

        {/* Benefit Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {benefits.map((benefit, i) => (
            <AnimatedElement key={i} animation="fadeInUp" delay={0.3 + i * 0.15}>
              <div className="group p-8 rounded-2xl bg-white dark:bg-midnight-900 border border-light-300 dark:border-midnight-700 hover:border-electric-indigo/50 transition-all duration-300 hover:-translate-y-1 h-full shadow-sm">
                <div className="w-16 h-16 bg-gradient-to-br from-scout-purple to-electric-indigo rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-scout-purple/20 group-hover:scale-110 transition-transform">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-bold text-text-primary dark:text-white mb-3">
                  {benefit.title}
                </h3>
                <p className="text-text-secondary leading-relaxed">{benefit.desc}</p>
              </div>
            </AnimatedElement>
          ))}
        </div>

      </div>
    </section>
  );
};

const UseCasesSection: React.FC = () => {
  const useCases = [
    {
      scenario: "Wi-Fi keeps dropping",
      solution: "Describe the issue or snap a photo of your router's lights. Scout identifies the problem and walks you through the fix.",
      icon: <Wifi className="w-7 h-7" />,
    },
    {
      scenario: "Smart TV won't connect",
      solution: "Upload a photo of the error screen. Scout reads it, diagnoses the issue, and provides step-by-step setup instructions.",
      icon: <Tv className="w-7 h-7" />,
    },
    {
      scenario: "Mysterious error code",
      solution: "Just show Scout the error. Whether it's a blinking light pattern or cryptic message, Scout decodes it and tells you what to do.",
      icon: <AlertTriangle className="w-7 h-7" />,
    },
  ];

  return (
    <section className="py-24 bg-white dark:bg-midnight-950 border-t border-light-300 dark:border-midnight-700 relative transition-colors">
      <div className="container mx-auto px-6 max-w-6xl">
        <AnimatedElement animation="fadeInUp" className="text-center mb-16">
          <span className="inline-block text-electric-indigo font-bold text-sm uppercase tracking-wider mb-4">
            Real Problems, Real Solutions
          </span>
          <h2 className="text-4xl font-black mb-4 text-text-primary dark:text-white">
            When tech breaks, Scout helps
          </h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            No matter the issue, Scout AI is ready to diagnose and guide you to a fix.
          </p>
        </AnimatedElement>
        <div className="grid md:grid-cols-3 gap-8">
          {useCases.map((useCase, i) => (
            <AnimatedElement key={i} animation="fadeInUp" delay={0.15 + i * 0.15}>
              <div className="group p-8 rounded-2xl bg-light-100 dark:bg-midnight-900 border border-light-300 dark:border-midnight-700 hover:border-electric-indigo/50 transition-all duration-300 hover:-translate-y-1 h-full shadow-sm">
                <div className="w-14 h-14 bg-gradient-to-br from-scout-purple to-electric-indigo rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-scout-purple/20 group-hover:scale-110 transition-transform">
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
      q: "What is Scout AI?",
      a: "Scout is our AI-powered assistant that provides instant tech support via chat, photo analysis, and live voice guidance. Scout responds immediately—no waiting.",
    },
    {
      q: "What devices and issues can Scout help with?",
      a: "Scout helps with Wi-Fi connectivity, smart home devices (Alexa, Google, Ring, Nest), TVs, laptops, printers, phones, and more. If it's tech in your home, Scout can diagnose and guide you to a fix.",
    },
    {
      q: "How does the photo diagnosis feature work?",
      a: "Simply snap a photo of an error screen, blinking lights, or any visual issue. Scout AI analyzes the image instantly and provides step-by-step troubleshooting guidance tailored to what it sees.",
    },
    {
      q: "Is Scout available 24/7?",
      a: "Yes! Scout AI is available 24/7, 365 days a year. No seasonal limitations, no business hours—get help whenever you need it, day or night.",
    },
    {
      q: "What are the pricing options?",
      a: "We offer flexible plans: Basic (free with limited features), Pro ($20/mo for unlimited access), and Premium ($199/year with priority support). All paid plans include unlimited Scout Chat, Snapshot analysis, and more.",
    },
  ];

  return (
    <section className="py-24 bg-light-100 dark:bg-midnight-950 border-t border-light-300 dark:border-midnight-700 relative transition-colors">
      <div className="container mx-auto px-6 max-w-3xl">
        {/* Header */}
        <AnimatedElement animation="fadeInUp" className="text-center mb-12">
          {/* FAQ Badge */}
          <div className="inline-flex items-center gap-2 bg-white dark:bg-midnight-800 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-scout-purple/30 shadow-sm">
            <HelpCircle className="w-4 h-4 text-scout-purple" />
            <span className="text-scout-purple font-semibold text-sm">FAQ</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-black mb-4 text-text-primary dark:text-white italic">
            Frequently Asked Questions
          </h2>
          <p className="text-text-secondary text-lg max-w-xl mx-auto">
            Find quick answers to common questions about Scout AI and TotalAssist.
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
                    ? 'border-scout-purple/50 bg-gradient-to-br from-scout-purple/10 to-electric-indigo/5'
                    : 'border-light-300 dark:border-midnight-700 bg-white dark:bg-midnight-900 hover:border-light-400 dark:hover:border-midnight-600'
                }`}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full p-5 flex items-center justify-between text-left"
                >
                  <span className={`font-semibold text-lg ${openFaq === i ? 'text-text-primary dark:text-white' : 'text-text-primary dark:text-white'}`}>
                    {faq.q}
                  </span>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                    openFaq === i
                      ? 'bg-scout-purple/20 text-scout-purple'
                      : 'bg-light-200 dark:bg-midnight-700 text-text-secondary'
                  }`}>
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
  const { ref: parallaxRef, offset } = useParallax(0.2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      onSignup(email);
    }
  };

  return (
    <section ref={parallaxRef} className="py-24 bg-gradient-to-br from-scout-purple to-electric-indigo relative overflow-hidden noise-texture">
      {/* Background decoration with parallax */}
      <div className="absolute inset-0 opacity-20 z-0">
        <div
          className="absolute top-0 left-0 w-96 h-96 bg-electric-cyan rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 transition-transform duration-100"
          style={{ transform: `translate(-50%, -50%) translateY(${offset * 0.5}px)` }}
        ></div>
        <div
          className="absolute bottom-0 right-0 w-96 h-96 bg-scout-glow rounded-full blur-3xl translate-x-1/2 translate-y-1/2 transition-transform duration-100"
          style={{ transform: `translate(50%, 50%) translateY(${-offset * 0.3}px)` }}
        ></div>
      </div>
      <div className="container mx-auto px-6 max-w-4xl text-center relative z-10">
        <AnimatedElement animation="fadeInUp">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
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
              className="flex-1 px-6 py-4 rounded-full text-midnight-950 text-lg font-medium focus:outline-none focus:ring-4 focus:ring-white/30 shadow-xl bg-white"
              required
            />
            <button
              type="submit"
              className="bg-midnight-950 hover:bg-midnight-900 text-white font-bold px-10 py-4 rounded-full text-lg transition-all whitespace-nowrap shadow-xl hover:shadow-2xl hover:scale-105"
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
              <span>Scout AI available 24/7</span>
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
          <div className="col-span-2 md:col-span-1">
            <button
              onClick={() => handleNav(PageView.HOME)}
              className="mb-6 block"
            >
              <Logo variant="light" />
            </button>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Your 24/7 technical safety net. TotalAssist uses the intelligence of Scout AI to diagnose and fix your home's Wi-Fi, gadgets, and appliances instantly. Expert support is now just a heartbeat away.
            </p>
          </div>

          {/* Product Column */}
          <div>
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
          </div>

          {/* Support Column */}
          <div>
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
                <span className="text-gray-500 cursor-default">
                  Help Center (Coming Soon)
                </span>
              </li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
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

  // Handle navigation to dashboard sub-views from header dropdown
  const handleDashboardSubNavigation = useCallback((subView: DashboardView) => {
    setDashboardView(subView);
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
              <BillingManagement userId={dashboardUser.id} />
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
        // If auth is still loading, show loading state (don't redirect yet)
        if (authLoading) {
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
        
        case PageView.HOME:
        default:
          return (
            <>
              <Hero
                onFreeTrial={handleFreeTrial}
                onPricing={handleNavigateToPricing}
              />
              <HowItWorksSimple />
              <SectionDivider variant="hexagon" />
              <WhatWeHelpWith />
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
      <PageTransition pageKey={currentView}>
        {content}
      </PageTransition>
    );
  };

  // Dashboard has its own layout, don't show header/footer
  // Also show this layout when on dashboard route but still loading (no dashboardUser yet)
  if (currentView === PageView.DASHBOARD) {
    return (
      <div className="min-h-screen bg-light-50 dark:bg-midnight-950 font-['Inter',sans-serif] text-text-primary dark:text-white transition-colors duration-300">
        {renderContent()}
        {dashboardUser && <ChatWidget ref={chatRef} />}
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
        <ChatWidget ref={chatRef} />
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
      <ChatWidget ref={chatRef} />
    </div>
  );
};

export default App;
