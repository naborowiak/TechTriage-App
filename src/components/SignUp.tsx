import React, { useState, useEffect, memo } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Wifi,
  Tv,
  Cpu,
  Home,
  Thermometer,
  Lock,
  ChevronDown,
  AlertCircle,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { Logo } from "./Logo";
import { PageView } from "../types";
import { checkTrialEligibility, startTrial } from "../services/trialService";
import { useAuth } from "../hooks/useAuth";

interface SignUpProps {
  onStart: () => void;
  initialEmail?: string;
  onSpeakToExpert?: () => void;
  onComplete?: (user: {
    id?: string;
    firstName: string;
    lastName?: string;
    email: string;
  }) => void;
  onNavigate?: (view: PageView) => void;
}

type OnboardingStep = "credentials" | "profile" | "home" | "needs" | "complete";

interface FormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  homeType: string;
  homeSize: string;
  techComfort: string;
  householdSize: string;
  primaryIssues: string[];
  howHeard: string;
}

const ProgressBar: React.FC<{ step: number; totalSteps: number }> = ({
  step,
  totalSteps,
}) => {
  const progress = (step / totalSteps) * 100;
  return (
    <div className="w-full mb-6">
      <div className="flex justify-between text-xs text-text-muted mb-2 font-medium uppercase tracking-wider">
        <span>
          Step {step} of {totalSteps}
        </span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="h-1.5 bg-light-300 dark:bg-midnight-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-electric-indigo to-electric-cyan transition-all duration-500 ease-out rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

// --- Static Data ---
const homeTypes = [
  "Single Family Home",
  "Townhouse",
  "Condo/Apartment",
  "Multi-Family Home",
  "Other",
];

const techComfortLevels = [
  {
    value: "beginner",
    label: "Beginner",
    desc: "I need step-by-step guidance",
  },
  {
    value: "intermediate",
    label: "Intermediate",
    desc: "I can follow along with some help",
  },
  { value: "advanced", label: "Advanced", desc: "I just need quick answers" },
];

const householdSizes = ["Just me", "2 people", "3-4 people", "5+ people"];

const issueTypes = [
  { value: "wifi", label: "Wi-Fi & Internet", icon: Wifi },
  { value: "tv", label: "TV & Streaming", icon: Tv },
  { value: "computer", label: "Computers & Devices", icon: Cpu },
  { value: "smarthome", label: "Smart Home", icon: Home },
  { value: "hvac", label: "HVAC & Thermostats", icon: Thermometer },
  { value: "security", label: "Accounts & Security", icon: Lock },
];

const howHeardOptions = [
  "Google Search",
  "Social Media",
  "Friend or Family",
  "Online Ad",
  "News Article",
  "Podcast",
  "Other",
];

const benefits = [
  {
    title: "AI-powered diagnostics",
    desc: "Get instant answers from our smart troubleshooting system",
  },
  {
    title: "Photo & video analysis",
    desc: "Just show us the problem — no technical explanations needed",
  },
  {
    title: "Live expert support",
    desc: "Connect with real specialists when you need hands-on help",
  },
  {
    title: "24/7 availability",
    desc: "Get support whenever you need it, day or night",
  },
];

// Layout wrapper component - defined outside SignUp to prevent re-renders
interface OnboardingLayoutProps {
  children: React.ReactNode;
  step?: number;
  totalSteps: number;
  title: React.ReactNode;
  subtitle?: string;
  showProgressBar: boolean;
  onLogoClick: () => void;
}

const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({
  children,
  step,
  totalSteps,
  title,
  subtitle,
  showProgressBar,
  onLogoClick,
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
  <div className="min-h-screen bg-light-100 dark:bg-midnight-950 relative flex flex-col items-center transition-colors">
    {/* Background orbs */}
    <div className="absolute top-0 right-1/4 w-96 h-96 bg-electric-indigo/10 rounded-full blur-3xl"></div>
    <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-scout-purple/10 rounded-full blur-3xl"></div>

    {/* Header / Logo */}
    <div className="w-full pt-8 pb-6 flex justify-center z-10 relative">
      <button
        onClick={onLogoClick}
        className="focus:outline-none hover:opacity-80 transition-opacity"
      >
        <Logo variant="dark" className="dark:hidden" />
        <Logo variant="light" className="hidden dark:flex" />
      </button>

      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="absolute right-6 top-8 p-2 rounded-lg hover:bg-light-200 dark:hover:bg-midnight-800 transition-colors text-text-secondary hover:text-text-primary dark:hover:text-white"
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? (
          <Moon className="w-5 h-5" />
        ) : (
          <Sun className="w-5 h-5" />
        )}
      </button>
    </div>

    {/* Main Card */}
    <div className="w-full max-w-[520px] px-4 pb-12 z-10">
      <div className="bg-white dark:bg-midnight-800 rounded-2xl shadow-xl border border-light-300 dark:border-midnight-700 overflow-hidden">
        {/* Progress Bar */}
        {step && showProgressBar && (
          <div className="px-8 pt-8">
            <ProgressBar step={step} totalSteps={totalSteps} />
          </div>
        )}

        <div className="p-8 sm:p-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-black text-text-primary dark:text-white leading-tight mb-3">
              {title}
            </h1>
            {subtitle && (
              <p className="text-text-secondary text-lg leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>

          {children}
        </div>
      </div>

      {/* Footer Links */}
      <div className="mt-8 text-center space-y-4">
        <p className="text-sm text-text-muted">
          &copy; {new Date().getFullYear()} Smart Tek Labs. All rights reserved.
        </p>
        <div className="flex justify-center gap-6 text-sm text-text-secondary font-medium">
          <a href="/terms" className="hover:text-electric-indigo transition-colors">
            Terms of Service
          </a>
          <a href="/privacy" className="hover:text-electric-indigo transition-colors">
            Privacy Policy
          </a>
        </div>
      </div>
    </div>
  </div>
  );
};

export const SignUp = memo<SignUpProps>(function SignUp({
  onStart,
  initialEmail = "",
  // onSpeakToExpert, // Removed to fix TS6133 error
  onComplete,
  onNavigate,
}) {
  // Check auth state - user might be OAuth authenticated
  const { user: oauthUser, isAuthenticated, isLoading: authLoading } = useAuth();

  const [currentStep, setCurrentStep] = useState<OnboardingStep>("credentials");
  const [showPassword, setShowPassword] = useState(false);
  const [trialError, setTrialError] = useState<string | null>(null);
  const [isCheckingTrial, setIsCheckingTrial] = useState(false);
  const [isOAuthUser, setIsOAuthUser] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: initialEmail,
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    homeType: "",
    homeSize: "",
    techComfort: "",
    householdSize: "",
    primaryIssues: [],
    howHeard: "",
  });

  // Handle OAuth users - set up form and step when auth is confirmed (runs only once)
  const [oauthInitialized, setOauthInitialized] = useState(false);

  useEffect(() => {
    // Only initialize once when auth loads and user is authenticated
    if (!authLoading && isAuthenticated && oauthUser && !oauthInitialized) {
      setOauthInitialized(true);
      setIsOAuthUser(true);
      // Skip to profile step since they already have credentials via OAuth
      setCurrentStep("profile");
      // Pre-fill form data from OAuth user
      setFormData(prev => ({
        ...prev,
        email: oauthUser.email || prev.email,
        firstName: oauthUser.firstName || prev.firstName,
        lastName: oauthUser.lastName || prev.lastName,
      }));
      // Start trial for OAuth users
      if (oauthUser.email) {
        startTrial(oauthUser.email).catch(err => {
          console.error("Trial start error for OAuth user:", err);
        });
      }
    }
  }, [authLoading, isAuthenticated, oauthUser, oauthInitialized]);

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-100 dark:bg-midnight-950 transition-colors">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-electric-indigo border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  const handleLogoClick = () => {
    if (onNavigate) {
      onNavigate(PageView.HOME);
    } else {
      window.location.href = "/";
    }
  };

  // Calculate step number - OAuth users skip credentials step
  const getStepNumber = (step: OnboardingStep): number => {
    const oauthSteps: OnboardingStep[] = ["profile", "home", "needs", "complete"];
    const regularSteps: OnboardingStep[] = ["credentials", "profile", "home", "needs", "complete"];
    const steps = isOAuthUser ? oauthSteps : regularSteps;
    return steps.indexOf(step) + 1;
  };

  const totalSteps = isOAuthUser ? 4 : 5;

  const updateFormData = (field: keyof FormData, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleIssue = (issue: string) => {
    setFormData((prev) => ({
      ...prev,
      primaryIssues: prev.primaryIssues.includes(issue)
        ? prev.primaryIssues.filter((i) => i !== issue)
        : [...prev.primaryIssues, issue],
    }));
  };

  const nextStep = async () => {
    const steps: OnboardingStep[] = [
      "credentials",
      "profile",
      "home",
      "needs",
      "complete",
    ];
    const currentIndex = steps.indexOf(currentStep);

    if (currentStep === "credentials") {
      setIsCheckingTrial(true);
      setTrialError(null);

      try {
        const eligibility = await checkTrialEligibility(formData.email);

        if (!eligibility.eligible) {
          setTrialError(
            eligibility.message || "You have already used your free trial.",
          );
          setIsCheckingTrial(false);
          return;
        }

        const trialResult = await startTrial(formData.email);
        if (!trialResult.success) {
          setTrialError(trialResult.error || "Unable to start trial.");
          setIsCheckingTrial(false);
          return;
        }
      } catch (error) {
        console.error("Trial check error:", error);
      }

      setIsCheckingTrial(false);
    }

    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const handleComplete = async () => {
    console.log("Onboarding complete:", formData);
    console.log("[SIGNUP] Password in formData:", !!formData.password, "Length:", formData.password?.length);

    try {
      let userId: string | undefined;

      if (isOAuthUser && oauthUser?.id) {
        // OAuth user - update their profile with onboarding data
        const response = await fetch(`/api/auth/user/${oauthUser.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            homeType: formData.homeType,
            techComfort: formData.techComfort,
            householdSize: formData.householdSize,
            primaryIssues: formData.primaryIssues,
            howHeard: formData.howHeard,
          }),
        });

        const data = await response.json();
        userId = oauthUser.id;
        console.log("OAuth user profile updated:", data);
      } else {
        // Regular user - register new account
        console.log("[SIGNUP] Sending registration request with email:", formData.email);
        console.log("[SIGNUP] Password being sent:", !!formData.password, "Length:", formData.password?.length);

        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include", // Required to establish session cookie
          body: JSON.stringify({ ...formData }),
        });

        const data = await response.json();
        console.log("[SIGNUP] Registration response:", data);
        console.log("[SIGNUP] Response success:", data.success);
        console.log("[SIGNUP] Response user:", data.user);
        console.log("[SIGNUP] Response user.id:", data.user?.id);

        // Check for registration errors
        if (!response.ok || !data.success) {
          console.error("[SIGNUP] Registration failed:", data.error);
          setTrialError(data.error || "Registration failed. Please try again.");
          setCurrentStep("credentials");
          return;
        }

        userId = data.user?.id;

        if (!userId) {
          console.error("[SIGNUP] WARNING: No user ID returned from registration!");
        }
      }

      localStorage.setItem(
        "totalassist_settings",
        JSON.stringify({
          phone: formData.phone || "",
          emailNotifications: true,
          sessionGuideEmails: true,
        }),
      );

      if (onComplete) {
        onComplete({
          id: userId,
          firstName: formData.firstName,
          lastName: formData.lastName || undefined,
          email: formData.email,
        });
      } else {
        onStart();
      }
    } catch (error) {
      console.error("Registration/update error:", error);
      if (onComplete) {
        onComplete({
          id: isOAuthUser ? oauthUser?.id : undefined,
          firstName: formData.firstName,
          lastName: formData.lastName || undefined,
          email: formData.email,
        });
      } else {
        onStart();
      }
    }
  };

  // --- Step Content ---

  // Step 5 (or Step 4 for OAuth): Complete
  if (currentStep === "complete") {
    return (
      <OnboardingLayout
        step={getStepNumber("complete")}
        totalSteps={totalSteps}
        showProgressBar={isOAuthUser || getStepNumber("complete") > 1}
        onLogoClick={handleLogoClick}
        title={<span className="italic">One last thing...</span>}
        subtitle="How did you hear about TotalAssist? This helps us reach more people who need help."
      >
        <div className="space-y-6">
          <div className="relative">
            <label className="block text-text-primary dark:text-white font-bold text-sm uppercase tracking-wide mb-2">
              How did you find us?
            </label>
            <div className="relative">
              <select
                value={formData.howHeard}
                onChange={(e) => updateFormData("howHeard", e.target.value)}
                className="w-full px-4 py-4 bg-light-100 dark:bg-midnight-900 border border-light-300 dark:border-midnight-600 text-text-primary dark:text-white rounded-xl text-base focus:bg-white dark:focus:bg-midnight-800 focus:border-electric-indigo focus:ring-4 focus:ring-electric-indigo/10 focus:outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="">Select an option</option>
                {howHeardOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted pointer-events-none" />
            </div>
          </div>

          <button
            onClick={handleComplete}
            className="w-full btn-gradient-electric text-white font-bold text-lg py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-electric-indigo/30 hover:shadow-electric-indigo/40 hover:-translate-y-0.5"
          >
            Get Started <ArrowRight className="w-5 h-5" />
          </button>

          <button
            onClick={handleComplete}
            className="w-full text-text-muted hover:text-text-primary dark:hover:text-white text-sm font-medium py-2 transition-colors"
          >
            Skip this step
          </button>
        </div>

        {/* Benefits reminder */}
        <div className="mt-8 pt-8 border-t border-light-300 dark:border-midnight-700 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {benefits.slice(0, 2).map((benefit, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-electric-indigo shrink-0 mt-0.5" />
              <span className="text-text-secondary">{benefit.title}</span>
            </div>
          ))}
        </div>
      </OnboardingLayout>
    );
  }

  // Step 1: Credentials
  if (currentStep === "credentials") {
    return (
      <OnboardingLayout
        step={1}
        totalSteps={totalSteps}
        showProgressBar={isOAuthUser || 1 > 1}
        onLogoClick={handleLogoClick}
        title={
          <>
            Tech help made <span className="text-electric-indigo italic">simple</span>
          </>
        }
        subtitle="Get started with TotalAssist. No credit card required."
      >
        <div className="space-y-5">
          <div>
            <label className="block text-text-primary dark:text-white font-bold text-sm uppercase tracking-wide mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => updateFormData("email", e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-4 bg-light-100 dark:bg-midnight-900 border border-light-300 dark:border-midnight-600 text-text-primary dark:text-white rounded-xl text-base focus:bg-white dark:focus:bg-midnight-800 focus:border-electric-indigo focus:ring-4 focus:ring-electric-indigo/10 focus:outline-none transition-all placeholder:text-text-muted"
            />
          </div>

          <div>
            <label className="block text-text-primary dark:text-white font-bold text-sm uppercase tracking-wide mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => updateFormData("password", e.target.value)}
                placeholder="Create a password"
                className="w-full px-4 py-4 bg-light-100 dark:bg-midnight-900 border border-light-300 dark:border-midnight-600 text-text-primary dark:text-white rounded-xl text-base focus:bg-white dark:focus:bg-midnight-800 focus:border-electric-indigo focus:ring-4 focus:ring-electric-indigo/10 focus:outline-none transition-all pr-12 placeholder:text-text-muted"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary dark:hover:text-white"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {trialError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 font-medium text-sm">{trialError}</p>
                <p className="text-red-400/80 text-xs mt-1">
                  Please use a different email or contact support.
                </p>
              </div>
            </div>
          )}

          {/* Gmail suggestion */}
          {formData.email.toLowerCase().endsWith('@gmail.com') && !trialError && (
            <div className="bg-electric-indigo/10 border border-electric-indigo/30 rounded-xl p-4">
              <p className="text-electric-cyan text-sm mb-2">
                <strong>Tip:</strong> Using a Gmail account? You can sign up faster with Google.
              </p>
              <button
                type="button"
                onClick={() => (window.location.href = "/auth/google")}
                className="text-electric-indigo font-medium text-sm hover:underline"
              >
                Sign up with Google instead →
              </button>
            </div>
          )}

          <button
            onClick={nextStep}
            disabled={
              !formData.email || formData.password.length < 8 || isCheckingTrial
            }
            className="w-full btn-gradient-electric disabled:bg-midnight-700 disabled:text-text-muted disabled:cursor-not-allowed text-white font-bold text-lg py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-electric-indigo/30 hover:shadow-electric-indigo/40 hover:-translate-y-0.5 mt-2"
          >
            {isCheckingTrial ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Checking...
              </>
            ) : (
              "Sign Up Free"
            )}
          </button>

          <div className="flex items-center gap-4 py-2">
            <div className="flex-1 h-px bg-light-300 dark:bg-midnight-700"></div>
            <span className="text-text-muted text-sm font-medium">OR</span>
            <div className="flex-1 h-px bg-light-300 dark:bg-midnight-700"></div>
          </div>

          <button
            onClick={() => (window.location.href = "/auth/google")}
            className="w-full flex items-center justify-center gap-3 px-4 py-4 border-2 border-light-300 dark:border-midnight-600 bg-light-100 dark:bg-midnight-900 rounded-xl hover:bg-light-200 dark:hover:bg-midnight-700 hover:border-light-400 dark:hover:border-midnight-500 transition-all group"
          >
            <svg
              className="w-5 h-5 group-hover:scale-110 transition-transform"
              viewBox="0 0 24 24"
            >
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="font-bold text-text-secondary group-hover:text-text-primary dark:group-hover:text-white">
              Sign up with Google
            </span>
          </button>

          <p className="text-sm text-text-muted text-center pt-2">
            Already have an account?{" "}
            <button
              onClick={() =>
                onNavigate
                  ? onNavigate(PageView.LOGIN)
                  : (window.location.href = "/login")
              }
              className="text-electric-indigo hover:underline font-bold"
            >
              Log in
            </button>
          </p>
        </div>
      </OnboardingLayout>
    );
  }

  // Step 2 (or Step 1 for OAuth): Profile
  if (currentStep === "profile") {
    return (
      <OnboardingLayout
        step={getStepNumber("profile")}
        totalSteps={totalSteps}
        showProgressBar={isOAuthUser || getStepNumber("profile") > 1}
        onLogoClick={handleLogoClick}
        title={isOAuthUser ? `Welcome, ${formData.firstName || 'there'}!` : "Welcome aboard!"}
        subtitle="Let's set up your account so we can personalize your experience."
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-text-primary dark:text-white font-bold text-sm uppercase tracking-wide mb-2">
                First name*
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => updateFormData("firstName", e.target.value)}
                placeholder="First name"
                className="w-full px-4 py-4 bg-light-100 dark:bg-midnight-900 border border-light-300 dark:border-midnight-600 text-text-primary dark:text-white rounded-xl text-base focus:bg-white dark:focus:bg-midnight-800 focus:border-electric-indigo focus:ring-4 focus:ring-electric-indigo/10 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-text-primary dark:text-white font-bold text-sm uppercase tracking-wide mb-2">
                Last name*
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => updateFormData("lastName", e.target.value)}
                placeholder="Last name"
                className="w-full px-4 py-4 bg-light-100 dark:bg-midnight-900 border border-light-300 dark:border-midnight-600 text-text-primary dark:text-white rounded-xl text-base focus:bg-white dark:focus:bg-midnight-800 focus:border-electric-indigo focus:ring-4 focus:ring-electric-indigo/10 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-text-primary dark:text-white font-bold text-sm uppercase tracking-wide mb-2">
              Phone number{" "}
              <span className="text-text-muted font-normal lowercase">
                (optional)
              </span>
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => updateFormData("phone", e.target.value)}
              placeholder="(555) 123-4567"
              className="w-full px-4 py-4 bg-light-100 dark:bg-midnight-900 border border-light-300 dark:border-midnight-600 text-text-primary dark:text-white rounded-xl text-base focus:bg-white dark:focus:bg-midnight-800 focus:border-electric-indigo focus:ring-4 focus:ring-electric-indigo/10 focus:outline-none transition-all"
            />
          </div>

          <div className="pt-2 space-y-3">
            <button
              onClick={nextStep}
              disabled={!formData.firstName || !formData.lastName}
              className="w-full btn-gradient-electric disabled:bg-midnight-700 disabled:text-text-muted disabled:cursor-not-allowed text-white font-bold text-lg py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-electric-indigo/30 hover:shadow-electric-indigo/40 hover:-translate-y-0.5"
            >
              Continue <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </OnboardingLayout>
    );
  }

  // Step 3 (or Step 2 for OAuth): Home Info
  if (currentStep === "home") {
    return (
      <OnboardingLayout
        step={getStepNumber("home")}
        totalSteps={totalSteps}
        showProgressBar={isOAuthUser || getStepNumber("home") > 1}
        onLogoClick={handleLogoClick}
        title="Tell us about your home"
        subtitle="This helps us give you better recommendations."
      >
        <div className="space-y-6">
          <div>
            <label className="block text-text-primary dark:text-white font-bold text-sm uppercase tracking-wide mb-2">
              Home type
            </label>
            <div className="relative">
              <select
                value={formData.homeType}
                onChange={(e) => updateFormData("homeType", e.target.value)}
                className="w-full px-4 py-4 bg-light-100 dark:bg-midnight-900 border border-light-300 dark:border-midnight-600 text-text-primary dark:text-white rounded-xl text-base focus:bg-white dark:focus:bg-midnight-800 focus:border-electric-indigo focus:ring-4 focus:ring-electric-indigo/10 focus:outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="">Select your home type</option>
                {homeTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-text-primary dark:text-white font-bold text-sm uppercase tracking-wide mb-3">
              How comfortable are you with technology?
            </label>
            <div className="space-y-3">
              {techComfortLevels.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => updateFormData("techComfort", level.value)}
                  className={`w-full px-5 py-4 border-2 rounded-xl text-left transition-all flex items-center justify-between group ${
                    formData.techComfort === level.value
                      ? "border-electric-indigo bg-electric-indigo/10 ring-2 ring-electric-indigo/20"
                      : "border-light-300 dark:border-midnight-600 bg-light-100 dark:bg-midnight-900 hover:border-light-400 dark:hover:border-midnight-500 hover:bg-light-200 dark:hover:bg-midnight-800"
                  }`}
                >
                  <div>
                    <div
                      className={`font-bold ${formData.techComfort === level.value ? "text-electric-indigo" : "text-text-primary dark:text-white"}`}
                    >
                      {level.label}
                    </div>
                    <div className="text-sm text-text-secondary mt-0.5">
                      {level.desc}
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      formData.techComfort === level.value
                        ? "border-electric-indigo bg-electric-indigo"
                        : "border-light-400 dark:border-midnight-500"
                    }`}
                  >
                    {formData.techComfort === level.value && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 space-y-3">
            <button
              onClick={nextStep}
              disabled={!formData.homeType || !formData.techComfort}
              className="w-full btn-gradient-electric disabled:bg-midnight-700 disabled:text-text-muted disabled:cursor-not-allowed text-white font-bold text-lg py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-electric-indigo/30 hover:shadow-electric-indigo/40 hover:-translate-y-0.5"
            >
              Continue <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </OnboardingLayout>
    );
  }

  // Step 4 (or Step 3 for OAuth): Needs
  if (currentStep === "needs") {
    return (
      <OnboardingLayout
        step={getStepNumber("needs")}
        totalSteps={totalSteps}
        showProgressBar={isOAuthUser || getStepNumber("needs") > 1}
        onLogoClick={handleLogoClick}
        title="What brings you here?"
        subtitle="Select the types of tech you typically need help with."
      >
        <div className="space-y-8">
          <div>
            <label className="block text-text-primary dark:text-white font-bold text-sm uppercase tracking-wide mb-3">
              Household size
            </label>
            <div className="flex flex-wrap gap-3">
              {householdSizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => updateFormData("householdSize", size)}
                  className={`px-5 py-2.5 border-2 rounded-full text-sm font-bold transition-all ${
                    formData.householdSize === size
                      ? "border-electric-indigo bg-electric-indigo text-white shadow-md shadow-electric-indigo/20"
                      : "border-light-300 dark:border-midnight-600 text-text-secondary hover:border-light-400 dark:hover:border-midnight-500 hover:bg-light-200 dark:hover:bg-midnight-800"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-text-primary dark:text-white font-bold text-sm uppercase tracking-wide mb-3">
              Areas of focus{" "}
              <span className="text-text-muted font-normal normal-case ml-1">
                (select all that apply)
              </span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {issueTypes.map((issue) => {
                const Icon = issue.icon;
                const isSelected = formData.primaryIssues.includes(issue.value);
                return (
                  <button
                    key={issue.value}
                    type="button"
                    onClick={() => toggleIssue(issue.value)}
                    className={`p-4 border-2 rounded-xl text-left transition-all ${
                      isSelected
                        ? "border-electric-indigo bg-electric-indigo/10 shadow-inner"
                        : "border-light-300 dark:border-midnight-600 bg-light-100 dark:bg-midnight-900 hover:border-light-400 dark:hover:border-midnight-500 hover:bg-light-200 dark:hover:bg-midnight-800"
                    }`}
                  >
                    <Icon
                      className={`w-6 h-6 mb-3 ${isSelected ? "text-electric-indigo" : "text-text-muted"}`}
                    />
                    <div
                      className={`text-sm font-bold ${isSelected ? "text-electric-indigo" : "text-text-secondary"}`}
                    >
                      {issue.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 space-y-3">
            <button
              onClick={nextStep}
              disabled={!formData.householdSize || formData.primaryIssues.length === 0}
              className="w-full btn-gradient-electric disabled:bg-midnight-700 disabled:text-text-muted disabled:cursor-not-allowed text-white font-bold text-lg py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-electric-indigo/30 hover:shadow-electric-indigo/40 hover:-translate-y-0.5"
            >
              Continue <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </OnboardingLayout>
    );
  }

  return null;
});
