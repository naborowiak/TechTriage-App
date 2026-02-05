import React, { useState } from "react";
import { ArrowLeft, Mail, CheckCircle2, AlertCircle, Loader2, Sun, Moon } from "lucide-react";
import { Logo } from "./Logo";
import { PageView } from "../types";
import { useTheme } from "../context/ThemeContext";

interface ForgotPasswordProps {
  onNavigate: (view: PageView) => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-light-100 dark:bg-midnight-950 relative flex flex-col items-center transition-colors">
      {/* Background orbs */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-electric-indigo/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-scout-purple/10 rounded-full blur-3xl"></div>

      {/* Header / Logo */}
      <div className="w-full pt-8 pb-6 flex justify-center z-10 relative">
        <button
          onClick={() => onNavigate(PageView.HOME)}
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
      <div className="w-full max-w-[480px] px-4 pb-12 z-10">
        <div className="bg-white dark:bg-midnight-800 rounded-2xl shadow-xl border border-light-300 dark:border-midnight-700 overflow-hidden">
          <div className="p-8 sm:p-10">
            {/* Back button */}
            <button
              onClick={() => onNavigate(PageView.LOGIN)}
              className="flex items-center gap-2 text-text-secondary hover:text-text-primary dark:hover:text-white mb-6 transition-colors text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Login
            </button>

            {success ? (
              // Success State
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <h1 className="text-2xl font-bold text-text-primary dark:text-white mb-3">Check Your Email</h1>
                <p className="text-text-secondary mb-6">
                  If an account exists for <span className="text-text-primary dark:text-white font-medium">{email}</span>,
                  you'll receive a password reset link shortly.
                </p>
                <p className="text-text-muted text-sm mb-8">
                  The link will expire in 1 hour. Don't forget to check your spam folder.
                </p>
                <button
                  onClick={() => onNavigate(PageView.LOGIN)}
                  className="w-full btn-gradient-electric text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-electric-indigo/30 hover:-translate-y-0.5"
                >
                  Return to Login
                </button>
              </div>
            ) : (
              // Form State
              <>
                <div className="text-center mb-8">
                  <div className="w-14 h-14 bg-electric-indigo/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-7 h-7 text-electric-indigo" />
                  </div>
                  <h1 className="text-2xl font-bold text-text-primary dark:text-white mb-2">Forgot Password?</h1>
                  <p className="text-text-secondary">
                    Enter your email and we'll send you a link to reset your password.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-red-600 dark:text-red-400 font-medium text-sm">{error}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-text-primary dark:text-white font-bold text-sm uppercase tracking-wide mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-4 py-4 bg-light-100 dark:bg-midnight-900 border border-light-300 dark:border-midnight-600 rounded-xl text-base text-text-primary dark:text-white focus:border-electric-indigo focus:ring-4 focus:ring-electric-indigo/20 focus:outline-none transition-all placeholder:text-text-muted"
                      required
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !email}
                    className="w-full btn-gradient-electric disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold text-lg py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-electric-indigo/30 hover:-translate-y-0.5"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Reset Link"
                    )}
                  </button>
                </form>

                <p className="text-sm text-text-muted text-center mt-6">
                  Remember your password?{" "}
                  <button
                    onClick={() => onNavigate(PageView.LOGIN)}
                    className="text-electric-indigo hover:text-electric-cyan hover:underline font-bold"
                  >
                    Log in
                  </button>
                </p>
              </>
            )}
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-8 text-center space-y-4">
          <p className="text-sm text-text-muted">
            &copy; {new Date().getFullYear()} Smart Tek Labs. All rights reserved.
          </p>
          <div className="flex justify-center gap-6 text-sm text-text-secondary font-medium">
            <button
              onClick={() => onNavigate(PageView.TERMS)}
              className="hover:text-electric-indigo transition-colors"
            >
              Terms of Service
            </button>
            <button
              onClick={() => onNavigate(PageView.PRIVACY)}
              className="hover:text-electric-indigo transition-colors"
            >
              Privacy Policy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
