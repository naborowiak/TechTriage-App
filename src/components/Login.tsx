import React, { useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Logo } from "./Logo";
import { PageView } from "../types";

interface LoginProps {
  onNavigate: (view: PageView) => void;
  onLogin: (user: any) => void;
}

export const Login: React.FC<LoginProps> = ({ onNavigate, onLogin }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New state for verification handling
  const [needsVerification, setNeedsVerification] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleLogoClick = () => {
    onNavigate(PageView.HOME);
  };

  const handleGoogleLogin = () => {
    window.location.href = "/auth/google";
  };

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Reset errors when user types
    setError(null);
    setNeedsVerification(false);
    setResendSuccess(false);
  };

  const handleResendVerification = async () => {
    if (!formData.email) return;

    setIsResending(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResendSuccess(true);
        setNeedsVerification(false); // Hide the button
      } else {
        setError(data.error || "Failed to resend verification email.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setNeedsVerification(false);
    setResendSuccess(false);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        onLogin(data.user);
      } else {
        setError(data.error || "Login failed");

        // Detect if the error relates to verification
        if (data.error && data.error.toLowerCase().includes("verify")) {
          setNeedsVerification(true);
        }
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-midnight-950 relative flex flex-col items-center noise-texture">
      {/* Background orbs */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-electric-indigo/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-scout-purple/10 rounded-full blur-3xl"></div>

      {/* Header / Logo */}
      <div className="w-full pt-8 pb-6 flex justify-center z-10">
        <button
          onClick={handleLogoClick}
          className="focus:outline-none hover:opacity-80 transition-opacity"
        >
          <Logo variant="light" />
        </button>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-[480px] px-4 pb-12 z-10">
        <div className="bg-midnight-800 rounded-2xl shadow-xl border border-midnight-700 overflow-hidden">
          <div className="p-8 sm:p-10">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-black text-white leading-tight mb-3">
                Welcome back
              </h1>
              <p className="text-text-secondary text-lg">
                Log in to access your dashboard
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Error Display */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-red-400 font-medium text-sm">{error}</p>
                  </div>

                  {/* Resend Verification Button */}
                  {needsVerification && (
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={isResending}
                      className="ml-8 text-sm font-semibold text-red-400 hover:text-red-300 underline text-left flex items-center gap-2"
                    >
                      {isResending ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />{" "}
                          Sending...
                        </>
                      ) : (
                        <>Resend verification email</>
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Success Message for Resend */}
              {resendSuccess && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-green-400 font-medium text-sm">
                      Email Sent!
                    </p>
                    <p className="text-green-400/80 text-xs mt-1">
                      Please check your inbox and spam folder.
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-white font-bold text-sm uppercase tracking-wide mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData("email", e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-4 bg-midnight-900 border border-midnight-600 rounded-xl text-base text-white focus:bg-midnight-900 focus:border-electric-indigo focus:ring-4 focus:ring-electric-indigo/20 focus:outline-none transition-all placeholder:text-text-muted"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-white font-bold text-sm uppercase tracking-wide">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => onNavigate(PageView.FORGOT_PASSWORD)}
                    className="text-sm text-electric-indigo hover:text-electric-cyan font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => updateFormData("password", e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-4 bg-midnight-900 border border-midnight-600 rounded-xl text-base text-white focus:bg-midnight-900 focus:border-electric-indigo focus:ring-4 focus:ring-electric-indigo/20 focus:outline-none transition-all pr-12 placeholder:text-text-muted"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-white"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-gradient-electric disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold text-lg py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-electric-indigo/30 hover:-translate-y-0.5"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Logging in...
                  </>
                ) : (
                  <>
                    Log In <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <div className="flex items-center gap-4 py-2">
                <div className="flex-1 h-px bg-midnight-700"></div>
                <span className="text-text-muted text-sm font-medium">OR</span>
                <div className="flex-1 h-px bg-midnight-700"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 px-4 py-4 border-2 border-midnight-600 bg-midnight-900 rounded-xl hover:bg-midnight-700 hover:border-midnight-500 transition-all group"
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
                <span className="font-bold text-text-secondary group-hover:text-white">
                  Log in with Google
                </span>
              </button>

              <p className="text-sm text-text-muted text-center pt-2">
                Don't have an account?{" "}
                <button
                  onClick={() => onNavigate(PageView.SIGNUP)}
                  className="text-electric-indigo hover:text-electric-cyan hover:underline font-bold"
                >
                  Sign up free
                </button>
              </p>
            </form>
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
