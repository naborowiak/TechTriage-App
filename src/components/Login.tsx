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
    <div
      className="min-h-screen relative flex flex-col items-center"
      style={{
        backgroundColor: "#F9FAFB",
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E")`,
      }}
    >
      {/* Header / Logo */}
      <div className="w-full pt-8 pb-6 flex justify-center z-10">
        <button
          onClick={handleLogoClick}
          className="focus:outline-none hover:opacity-80 transition-opacity"
        >
          <Logo variant="dark" />
        </button>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-[480px] px-4 pb-12 z-10">
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
          <div className="p-8 sm:p-10">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-black text-[#1F2937] leading-tight mb-3">
                Welcome back
              </h1>
              <p className="text-gray-500 text-lg">
                Log in to access your dashboard
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-red-700 font-medium text-sm">{error}</p>
                  </div>

                  {/* Resend Verification Button */}
                  {needsVerification && (
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={isResending}
                      className="ml-8 text-sm font-semibold text-red-600 hover:text-red-800 underline text-left flex items-center gap-2"
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
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-green-700 font-medium text-sm">
                      Email Sent!
                    </p>
                    <p className="text-green-600 text-xs mt-1">
                      Please check your inbox and spam folder.
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[#1F2937] font-bold text-sm uppercase tracking-wide mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData("email", e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-base focus:bg-white focus:border-[#F97316] focus:ring-4 focus:ring-orange-500/10 focus:outline-none transition-all placeholder:text-gray-400"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[#1F2937] font-bold text-sm uppercase tracking-wide">
                    Password
                  </label>
                  <a
                    href="#"
                    className="text-sm text-[#F97316] hover:text-[#EA580C] font-medium"
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => updateFormData("password", e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-base focus:bg-white focus:border-[#F97316] focus:ring-4 focus:ring-orange-500/10 focus:outline-none transition-all pr-12 placeholder:text-gray-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                className="w-full bg-[#1F2937] hover:bg-[#374151] disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold text-lg py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-gray-900/20 hover:-translate-y-0.5"
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
                <div className="flex-1 h-px bg-gray-100"></div>
                <span className="text-gray-400 text-sm font-medium">OR</span>
                <div className="flex-1 h-px bg-gray-100"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 px-4 py-4 border-2 border-gray-100 bg-white rounded-xl hover:bg-gray-50 hover:border-gray-200 transition-all group"
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
                <span className="font-bold text-gray-600 group-hover:text-gray-800">
                  Log in with Google
                </span>
              </button>

              <p className="text-sm text-gray-400 text-center pt-2">
                Don't have an account?{" "}
                <button
                  onClick={() => onNavigate(PageView.SIGNUP)}
                  className="text-[#F97316] hover:underline font-bold"
                >
                  Sign up free
                </button>
              </p>
            </form>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-8 text-center space-y-4">
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} TechTriage. All rights reserved.
          </p>
          <div className="flex justify-center gap-6 text-sm text-gray-500 font-medium">
            <a href="#" className="hover:text-[#F97316] transition-colors">
              Terms of Service
            </a>
            <a href="#" className="hover:text-[#F97316] transition-colors">
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
