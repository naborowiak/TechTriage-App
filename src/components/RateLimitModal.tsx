import React from 'react';
import { X, Sparkles } from 'lucide-react';

interface RateLimitModalProps {
  isOpen: boolean;
  onLogin: () => void;
  onSignup: () => void;
  onDismiss: () => void;
}

export const RateLimitModal: React.FC<RateLimitModalProps> = ({ isOpen, onLogin, onSignup, onDismiss }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-2xl">
      <div className="bg-white dark:bg-midnight-900 rounded-2xl shadow-2xl w-[90%] max-w-sm p-6 relative animate-fade-in-up">
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 p-1 text-text-muted hover:text-text-primary dark:hover:text-white transition-colors rounded-full hover:bg-light-100 dark:hover:bg-midnight-800"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br from-scout-purple/20 to-electric-indigo/20">
          <Sparkles className="w-6 h-6 text-electric-indigo" />
        </div>

        <h3 className="text-lg font-bold text-text-primary dark:text-white text-center mb-2">
          Thanks for trying Scout AI
        </h3>
        <p className="text-sm text-text-secondary text-center mb-6">
          Log in or sign up to get smarter responses, upload files and images, and more.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={onLogin}
            className="w-full py-2.5 rounded-full bg-midnight-900 dark:bg-white text-white dark:text-midnight-900 font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            Log in
          </button>
          <button
            onClick={onSignup}
            className="w-full py-2.5 rounded-full border-2 border-midnight-900 dark:border-white text-midnight-900 dark:text-white font-semibold text-sm hover:bg-light-100 dark:hover:bg-midnight-800 transition-colors"
          >
            Sign up for free
          </button>
        </div>

        <button
          onClick={onDismiss}
          className="w-full mt-3 text-xs text-text-muted hover:text-text-secondary transition-colors text-center py-1"
        >
          Stay logged out
        </button>
      </div>
    </div>
  );
};
