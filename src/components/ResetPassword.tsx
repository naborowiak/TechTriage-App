import React, { useState, useEffect } from "react";
import { Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, Lock, XCircle } from "lucide-react";
import { Logo } from "./Logo";
import { PageView } from "../types";

interface ResetPasswordProps {
  onNavigate: (view: PageView) => void;
}

export const ResetPassword: React.FC<ResetPasswordProps> = ({ onNavigate }) => {
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [invalidToken, setInvalidToken] = useState(false);

  // Extract token from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setInvalidToken(true);
    }
  }, []);

  const passwordsMatch = password === confirmPassword;
  const passwordLongEnough = password.length >= 8;
  const canSubmit = passwordsMatch && passwordLongEnough && token;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
      } else {
        if (data.error?.includes("expired") || data.error?.includes("Invalid")) {
          setInvalidToken(true);
        } else {
          setError(data.error || "Something went wrong. Please try again.");
        }
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Invalid or expired token state
  if (invalidToken) {
    return (
      <div className="min-h-screen bg-midnight-950 relative flex flex-col items-center noise-texture">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-electric-indigo/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-scout-purple/10 rounded-full blur-3xl"></div>

        <div className="w-full pt-8 pb-6 flex justify-center z-10">
          <button
            onClick={() => onNavigate(PageView.HOME)}
            className="focus:outline-none hover:opacity-80 transition-opacity"
          >
            <Logo variant="light" />
          </button>
        </div>

        <div className="w-full max-w-[480px] px-4 pb-12 z-10">
          <div className="bg-midnight-800 rounded-2xl shadow-xl border border-midnight-700 overflow-hidden">
            <div className="p-8 sm:p-10 text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-3">Link Expired or Invalid</h1>
              <p className="text-text-secondary mb-6">
                This password reset link is no longer valid. Links expire after 1 hour for security.
              </p>
              <button
                onClick={() => onNavigate(PageView.FORGOT_PASSWORD)}
                className="w-full btn-gradient-electric text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-electric-indigo/30 hover:-translate-y-0.5 mb-4"
              >
                Request New Link
              </button>
              <button
                onClick={() => onNavigate(PageView.LOGIN)}
                className="text-text-secondary hover:text-white text-sm font-medium transition-colors"
              >
                Return to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-midnight-950 relative flex flex-col items-center noise-texture">
      {/* Background orbs */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-electric-indigo/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-scout-purple/10 rounded-full blur-3xl"></div>

      {/* Header / Logo */}
      <div className="w-full pt-8 pb-6 flex justify-center z-10">
        <button
          onClick={() => onNavigate(PageView.HOME)}
          className="focus:outline-none hover:opacity-80 transition-opacity"
        >
          <Logo variant="light" />
        </button>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-[480px] px-4 pb-12 z-10">
        <div className="bg-midnight-800 rounded-2xl shadow-xl border border-midnight-700 overflow-hidden">
          <div className="p-8 sm:p-10">
            {success ? (
              // Success State
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-8 h-8 text-green-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-3">Password Reset!</h1>
                <p className="text-text-secondary mb-8">
                  Your password has been successfully updated. You can now log in with your new password.
                </p>
                <button
                  onClick={() => onNavigate(PageView.LOGIN)}
                  className="w-full btn-gradient-electric text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-electric-indigo/30 hover:-translate-y-0.5"
                >
                  Log In Now
                </button>
              </div>
            ) : (
              // Form State
              <>
                <div className="text-center mb-8">
                  <div className="w-14 h-14 bg-electric-indigo/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-7 h-7 text-electric-indigo" />
                  </div>
                  <h1 className="text-2xl font-bold text-white mb-2">Create New Password</h1>
                  <p className="text-text-secondary">
                    Enter your new password below. Make sure it's at least 8 characters.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                      <p className="text-red-400 font-medium text-sm">{error}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-white font-bold text-sm uppercase tracking-wide mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full px-4 py-4 bg-midnight-900 border border-midnight-600 rounded-xl text-base text-white focus:bg-midnight-900 focus:border-electric-indigo focus:ring-4 focus:ring-electric-indigo/20 focus:outline-none transition-all pr-12 placeholder:text-text-muted"
                        required
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {password && !passwordLongEnough && (
                      <p className="text-red-400 text-xs mt-2">Password must be at least 8 characters</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-white font-bold text-sm uppercase tracking-wide mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="w-full px-4 py-4 bg-midnight-900 border border-midnight-600 rounded-xl text-base text-white focus:bg-midnight-900 focus:border-electric-indigo focus:ring-4 focus:ring-electric-indigo/20 focus:outline-none transition-all pr-12 placeholder:text-text-muted"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-white"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {confirmPassword && !passwordsMatch && (
                      <p className="text-red-400 text-xs mt-2">Passwords do not match</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !canSubmit}
                    className="w-full btn-gradient-electric disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold text-lg py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-electric-indigo/30 hover:-translate-y-0.5"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Resetting...
                      </>
                    ) : (
                      "Reset Password"
                    )}
                  </button>
                </form>
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
