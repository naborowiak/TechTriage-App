import React, { useEffect, useState } from "react";
import { PageView } from "../types";

interface VerifyEmailProps {
  onNavigate: (view: PageView) => void;
  onVerificationComplete: (user: any) => void;
}

export const VerifyEmail: React.FC<VerifyEmailProps> = ({
  onNavigate,
  onVerificationComplete,
}) => {
  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    "verifying",
  );
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    const verify = async () => {
      // 1. Get token from URL manually since we aren't using react-router hooks
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");

      if (!token) {
        setStatus("error");
        setMessage("No verification token found.");
        return;
      }

      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (data.success) {
          setStatus("success");
          setMessage("Email verified successfully! Logging you in...");

          // FIX: Call the parent completion handler so the variable is used
          if (data.user) {
            onVerificationComplete(data.user);
          }

          // Redirect to Login after 2 seconds
          setTimeout(() => onNavigate(PageView.LOGIN), 2000);
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
  }, [onNavigate, onVerificationComplete]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 pt-20">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md text-center">
        {status === "verifying" && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <h2 className="mt-4 text-xl font-bold text-gray-900">
              Verifying Email
            </h2>
            <p className="text-gray-500">{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="mt-4 text-xl font-bold text-gray-900">Verified!</h2>
            <p className="text-green-600">{message}</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="mt-4 text-xl font-bold text-gray-900">
              Verification Failed
            </h2>
            <p className="text-red-600">{message}</p>
            <button
              onClick={() => onNavigate(PageView.LOGIN)}
              className="mt-6 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#F97316] hover:bg-[#EA580C]"
            >
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
};
