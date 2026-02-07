import React, { useEffect, useState } from "react";
import { PageView } from "../types";
import { OTPInput } from "./OTPInput";
import { Logo } from "./Logo";
import { AlertCircle, Mail } from "lucide-react";

interface VerifyEmailProps {
  onNavigate: (view: PageView) => void;
  onVerificationComplete: (user: any) => void;
}

export const VerifyEmail: React.FC<VerifyEmailProps> = ({
  onNavigate,
  onVerificationComplete,
}) => {
  const params = new URLSearchParams(window.location.search);
  const tokenFromUrl = params.get("token");

  // If URL has ?token=, use the legacy auto-verify flow
  if (tokenFromUrl) {
    return (
      <LegacyTokenVerify
        token={tokenFromUrl}
        onNavigate={onNavigate}
        onVerificationComplete={onVerificationComplete}
      />
    );
  }

  // Otherwise, show OTP input form
  return (
    <OTPVerifyForm
      onNavigate={onNavigate}
      onVerificationComplete={onVerificationComplete}
    />
  );
};

// Legacy flow: auto-verify with token from URL (for already-sent link emails)
const LegacyTokenVerify: React.FC<{
  token: string;
  onNavigate: (view: PageView) => void;
  onVerificationComplete: (user: any) => void;
}> = ({ token, onNavigate, onVerificationComplete }) => {
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    const verify = async () => {
      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (data.success) {
          setStatus("success");
          if (data.sessionCreated && data.user) {
            setMessage("Email verified! Redirecting to your dashboard...");
            onVerificationComplete(data.user);
          } else {
            setMessage("Email verified! Please log in to continue.");
            setTimeout(() => onNavigate(PageView.LOGIN), 2000);
          }
        } else {
          setStatus("error");
          setMessage(data.error || "Verification failed.");
        }
      } catch (err) {
        setStatus("error");
        setMessage("An error occurred. Please try again.");
      }
    };

    verify();
  }, [token, onNavigate, onVerificationComplete]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-light-100 dark:bg-midnight-950 px-4">
      <div className="max-w-md w-full space-y-6 bg-white dark:bg-midnight-800 p-8 rounded-2xl shadow-lg border border-light-300 dark:border-midnight-700 text-center">
        {status === "verifying" && (
          <>
            <div className="w-12 h-12 border-4 border-electric-indigo border-t-transparent rounded-full animate-spin mx-auto"></div>
            <h2 className="text-xl font-bold text-text-primary dark:text-white">
              Verifying Email
            </h2>
            <p className="text-text-secondary dark:text-gray-400">{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-text-primary dark:text-white">Verified!</h2>
            <p className="text-green-600">{message}</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-text-primary dark:text-white">
              Verification Failed
            </h2>
            <p className="text-red-600 dark:text-red-400">{message}</p>
            <button
              onClick={() => onNavigate(PageView.LOGIN)}
              className="mt-4 w-full py-3 px-4 rounded-xl font-semibold text-white btn-gradient-electric shadow-lg shadow-electric-indigo/30 hover:shadow-electric-indigo/50 hover:brightness-110 transition-all"
            >
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// OTP flow: user navigates to /verify-email directly (no token in URL)
const OTPVerifyForm: React.FC<{
  onNavigate: (view: PageView) => void;
  onVerificationComplete: (user: any) => void;
}> = ({ onNavigate, onVerificationComplete }) => {
  const [email, setEmail] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verificationSuccess, setVerificationSuccess] = useState(false);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleSendCode = async () => {
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    if (resendCooldown > 0) return;

    setIsSending(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setCodeSent(true);
        setResendCooldown(60);
      } else {
        setError(data.error || "Failed to send verification code.");
      }
    } catch (err) {
      setError("Failed to send code. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyOTP = async (code: string) => {
    setIsVerifying(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (data.success && data.user) {
        setIsVerifying(false);
        setVerificationSuccess(true);
        setTimeout(() => onVerificationComplete(data.user), 1500);
      } else {
        setError(data.error || "Invalid verification code.");
        setIsVerifying(false);
      }
    } catch (err) {
      setError("Verification failed. Please try again.");
      setIsVerifying(false);
    }
  };

  // Success state
  if (verificationSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-100 dark:bg-midnight-950 px-4">
        <div className="max-w-md w-full bg-white dark:bg-midnight-800 rounded-2xl shadow-lg border border-light-300 dark:border-midnight-700 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4 animate-success-pulse">
            <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-text-primary dark:text-white mb-2">Email verified!</h2>
          <p className="text-text-secondary dark:text-gray-400 text-sm mb-4">
            Redirecting you to your dashboard...
          </p>
          <div className="w-6 h-6 border-2 border-electric-indigo border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-light-100 dark:bg-midnight-950 px-4">
      <div className="max-w-md w-full bg-white dark:bg-midnight-800 rounded-2xl shadow-lg border border-light-300 dark:border-midnight-700 overflow-hidden">
        {/* Header */}
        <div className="p-8 pb-6 text-center">
          <div className="mb-6 cursor-pointer" onClick={() => onNavigate(PageView.HOME)}>
            <Logo />
          </div>
          <div className="w-14 h-14 rounded-full bg-electric-indigo/10 dark:bg-electric-indigo/20 flex items-center justify-center mx-auto mb-4">
            <Mail className="w-7 h-7 text-electric-indigo" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary dark:text-white mb-2">
            {codeSent ? "Enter verification code" : "Verify your email"}
          </h1>
          <p className="text-text-secondary dark:text-gray-400 text-sm">
            {codeSent
              ? `We sent a 6-digit code to ${email}`
              : "Enter your email to receive a verification code."}
          </p>
        </div>

        {/* Content */}
        <div className="px-8 pb-8 space-y-5">
          {!codeSent ? (
            <>
              <div>
                <label className="block text-sm font-semibold text-text-primary dark:text-white mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
                  onKeyDown={(e) => e.key === "Enter" && handleSendCode()}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl border-2 border-light-300 dark:border-midnight-600 bg-white dark:bg-midnight-700 text-text-primary dark:text-white placeholder-text-muted focus:outline-none focus:border-electric-indigo focus:ring-4 focus:ring-electric-indigo/20 transition-all"
                />
              </div>
              <button
                onClick={handleSendCode}
                disabled={isSending}
                className="w-full py-3 px-4 rounded-xl font-semibold text-white btn-gradient-electric shadow-lg shadow-electric-indigo/30 hover:shadow-electric-indigo/50 hover:brightness-110 transition-all disabled:opacity-50"
              >
                {isSending ? "Sending..." : "Send verification code"}
              </button>
            </>
          ) : (
            <>
              <OTPInput
                onComplete={handleVerifyOTP}
                onInput={() => setError(null)}
                disabled={isVerifying}
                error={!!error}
              />

              {isVerifying && (
                <div className="flex items-center justify-center gap-2 text-text-secondary">
                  <div className="w-4 h-4 border-2 border-electric-indigo border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm">Verifying...</span>
                </div>
              )}

              <div className="text-center">
                <p className="text-sm text-text-muted dark:text-gray-500 mb-1">
                  Didn't receive the code?
                </p>
                <button
                  onClick={handleSendCode}
                  disabled={isSending || resendCooldown > 0}
                  className="text-sm font-semibold text-electric-indigo hover:text-electric-indigo/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSending
                    ? "Sending..."
                    : resendCooldown > 0
                    ? `Resend code in ${resendCooldown}s`
                    : "Resend code"}
                </button>
              </div>

              <p className="text-center text-xs text-text-muted dark:text-gray-600">
                Code expires in 30 minutes
              </p>
            </>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="text-center pt-2">
            <button
              onClick={() => onNavigate(PageView.LOGIN)}
              className="text-sm text-text-secondary dark:text-gray-400 hover:text-text-primary dark:hover:text-white transition-colors"
            >
              Back to login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
