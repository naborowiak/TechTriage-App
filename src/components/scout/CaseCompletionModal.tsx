import { useState, useEffect } from 'react';
import { X, Download, Mail, CheckCircle, Loader2 } from 'lucide-react';

interface CaseCompletionModalProps {
  caseId: string;
  caseTitle?: string | null;
  onClose: () => void;
  userEmail?: string;
}

export function CaseCompletionModal({ caseId, caseTitle, onClose, userEmail }: CaseCompletionModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Prevent body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    setDownloadError(null);

    try {
      const res = await fetch(`/api/cases/${caseId}/report`, {
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to generate report');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TotalAssist_Case_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setDownloadError('Unable to download report. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleEmailReport = async () => {
    setIsSendingEmail(true);
    setEmailError(null);

    try {
      const res = await fetch(`/api/cases/${caseId}/report/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to send report');
      }

      setEmailSent(true);
    } catch {
      setEmailError('Unable to send email. Please try downloading instead.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="completion-title">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white dark:bg-[#151922] rounded-2xl shadow-2xl border border-light-300 dark:border-white/10 overflow-hidden">
        {/* Gradient accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-[#6366F1] to-[#06B6D4]" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-emerald-500/20 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <div>
              <h2 id="completion-title" className="text-xl font-bold text-gray-900 dark:text-white">
                Case Resolved
              </h2>
              <p className="text-gray-500 dark:text-white/60 text-sm">
                {caseTitle || 'Your support session is complete'}
              </p>
            </div>
          </div>

          <p className="text-gray-600 dark:text-white/70 text-sm mb-6">
            Great news — your issue has been resolved! You can download a full report of this session or have it emailed to you for your records.
          </p>

          {/* Action buttons */}
          <div className="space-y-3">
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#06B6D4] text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              aria-label="Download PDF report"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Report...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Download PDF Report
                </>
              )}
            </button>

            {userEmail && !emailSent ? (
              <button
                onClick={handleEmailReport}
                disabled={isSendingEmail}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-light-200 dark:bg-white/5 border border-light-300 dark:border-white/10 text-gray-900 dark:text-white font-semibold hover:bg-light-300 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
                aria-label="Email report"
              >
                {isSendingEmail ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5" />
                    Email Report to {userEmail}
                  </>
                )}
              </button>
            ) : emailSent ? (
              <div className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle className="w-5 h-5" />
                Email Sent!
              </div>
            ) : null}
          </div>

          {/* Error messages */}
          {downloadError && (
            <p className="mt-3 text-sm text-red-500 text-center" role="alert">{downloadError}</p>
          )}
          {emailError && (
            <p className="mt-3 text-sm text-red-500 text-center" role="alert">{emailError}</p>
          )}

          {/* Close / skip */}
          <button
            onClick={onClose}
            className="w-full mt-4 py-3 text-gray-500 dark:text-white/60 hover:text-gray-700 dark:hover:text-white transition-colors font-medium text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
