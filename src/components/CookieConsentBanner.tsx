import React, { useState, useEffect, useCallback } from "react";
import { ChevronDown, ChevronUp, Shield } from "lucide-react";

const CONSENT_KEY = "totalassist_cookie_consent";
const CONSENT_VERSION = 1;

interface ConsentState {
  version: number;
  functional: boolean;
  performance: boolean;
  targeting: boolean;
  timestamp: number;
}

const categories = [
  {
    id: "necessary" as const,
    label: "Strictly Necessary",
    description: "Essential for the website to function properly. These cannot be disabled.",
    alwaysOn: true,
  },
  {
    id: "functional" as const,
    label: "Functional Cookies",
    description: "Enable personalized features like remembering your preferences, language settings, and login state.",
    alwaysOn: false,
  },
  {
    id: "performance" as const,
    label: "Performance Cookies",
    description: "Help us understand how visitors interact with the site so we can measure and improve the experience.",
    alwaysOn: false,
  },
  {
    id: "targeting" as const,
    label: "Targeting Cookies",
    description: "Used to deliver relevant ads and track campaign performance across websites.",
    alwaysOn: false,
  },
];

export const CookieConsentBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [functional, setFunctional] = useState(true);
  const [performance, setPerformance] = useState(true);
  const [targeting, setTargeting] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONSENT_KEY);
      if (stored) {
        const consent: ConsentState = JSON.parse(stored);
        if (consent.version === CONSENT_VERSION) {
          return; // consent already given for current version
        }
      }
    } catch {
      // ignore parse errors
    }
    // Small delay so banner doesn't flash on initial paint
    const timer = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const saveConsent = useCallback((func: boolean, perf: boolean, tgt: boolean) => {
    const consent: ConsentState = {
      version: CONSENT_VERSION,
      functional: func,
      performance: perf,
      targeting: tgt,
      timestamp: Date.now(),
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
    // Play dismiss animation before hiding
    setDismissing(true);
    setTimeout(() => setVisible(false), 250);
  }, []);

  const handleAcceptAll = () => saveConsent(true, true, true);
  const handleRejectAll = () => saveConsent(false, false, false);
  const handleSavePreferences = () => saveConsent(functional, performance, targeting);

  if (!visible) return null;

  const toggleMap: Record<string, { value: boolean; setter: (v: boolean) => void }> = {
    functional: { value: functional, setter: setFunctional },
    performance: { value: performance, setter: setPerformance },
    targeting: { value: targeting, setter: setTargeting },
  };

  return (
    <div
      className={`fixed bottom-4 left-4 z-[9999] max-w-[420px] w-[calc(100%-2rem)] sm:w-auto ${
        dismissing ? "animate-slide-out-bottom" : "animate-slide-in-bottom"
      }`}
    >
      <div className="bg-white dark:bg-midnight-800 rounded-2xl shadow-2xl border border-light-300 dark:border-midnight-700 overflow-hidden">
        {/* Header */}
        <div className="p-5 pb-3">
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="w-8 h-8 rounded-lg bg-electric-indigo/10 dark:bg-electric-indigo/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-electric-indigo" />
            </div>
            <h3 className="text-base font-bold text-text-primary dark:text-white">
              Cookie Preferences
            </h3>
          </div>
          <p className="text-[13px] text-text-secondary dark:text-gray-400 leading-relaxed">
            We use cookies on our website to ensure a good user experience and for other purposes, including analytics, site functionality, and targeting cookies, which may also be used in our marketing efforts. Click "Accept All Cookies" to agree, or manage your preferences below.
          </p>
        </div>

        {/* Expandable Settings */}
        <div className="px-5">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-sm font-semibold text-electric-indigo hover:text-electric-indigo/80 transition-colors mb-3"
          >
            Manage Consent Preferences
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {expanded && (
            <div className="space-y-2.5 mb-4 animate-fade-in-up">
              {categories.map((cat) => {
                const toggle = cat.alwaysOn ? null : toggleMap[cat.id];
                const isOn = cat.alwaysOn ? true : toggle?.value ?? false;

                return (
                  <div
                    key={cat.id}
                    className="flex items-start justify-between gap-3 p-3 rounded-xl bg-light-100 dark:bg-midnight-700/50"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-text-primary dark:text-white">
                          {cat.label}
                        </p>
                        {cat.alwaysOn && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-electric-cyan bg-electric-cyan/10 px-1.5 py-0.5 rounded">
                            Always Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-muted dark:text-gray-500 mt-0.5 leading-relaxed">
                        {cat.description}
                      </p>
                    </div>
                    <button
                      onClick={() => toggle && toggle.setter(!toggle.value)}
                      disabled={cat.alwaysOn}
                      className={`relative flex-shrink-0 w-10 h-6 rounded-full transition-colors duration-200 ${
                        isOn
                          ? "bg-electric-indigo"
                          : "bg-light-400 dark:bg-midnight-600"
                      } ${cat.alwaysOn ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                      aria-label={`Toggle ${cat.label}`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                          isOn ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-5 pt-2 flex gap-2">
          {expanded ? (
            <>
              <button
                onClick={handleRejectAll}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border border-light-300 dark:border-midnight-600 text-text-secondary dark:text-gray-400 hover:bg-light-100 dark:hover:bg-midnight-700 transition-colors"
              >
                Reject All
              </button>
              <button
                onClick={handleSavePreferences}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold btn-gradient-electric text-white shadow-lg shadow-electric-indigo/30 hover:shadow-electric-indigo/50 hover:brightness-110 transition-all"
              >
                Confirm My Choices
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleRejectAll}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border border-light-300 dark:border-midnight-600 text-text-secondary dark:text-gray-400 hover:bg-light-100 dark:hover:bg-midnight-700 transition-colors"
              >
                Reject All
              </button>
              <button
                onClick={handleAcceptAll}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold btn-gradient-electric text-white shadow-lg shadow-electric-indigo/30 hover:shadow-electric-indigo/50 hover:brightness-110 transition-all"
              >
                Accept All Cookies
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
