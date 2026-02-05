import React, { useState } from 'react';
import {
  X,
  Download,
  Mail,
  Clock,
  Camera,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  Loader2,
  LifeBuoy,
} from 'lucide-react';
import { VoiceDiagnosticReport } from '../../hooks/useVoiceSession';
import { generateVoiceReportPDF } from '../../services/voiceReportService';

interface VoiceReportModalProps {
  report: VoiceDiagnosticReport;
  onClose: () => void;
  userEmail?: string;
  userName?: string;
}

const BotAvatar = ({ className }: { className?: string }) => {
  const [error, setError] = useState(false);
  if (error) return <LifeBuoy className={className} />;
  return (
    <img
      src="/scout_logo.png"
      className={`${className} object-contain`}
      alt="Scout"
      onError={() => setError(true)}
    />
  );
};

export const VoiceReportModal: React.FC<VoiceReportModalProps> = ({
  report,
  onClose,
  userEmail,
  userName,
}) => {
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'resolved':
        return 'text-green-500 bg-green-500/10';
      case 'partial':
        return 'text-yellow-500 bg-yellow-500/10';
      case 'escalate':
        return 'text-red-500 bg-red-500/10';
      default:
        return 'text-text-secondary bg-light-100';
    }
  };

  const getOutcomeLabel = (outcome: string) => {
    switch (outcome) {
      case 'resolved':
        return 'Issue Resolved';
      case 'partial':
        return 'Partially Resolved';
      case 'escalate':
        return 'Needs Expert';
      default:
        return 'Completed';
    }
  };

  const handleDownloadPDF = () => {
    const pdfBase64 = generateVoiceReportPDF(report, userName);

    const byteCharacters = atob(pdfBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Scout_Voice_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSendEmail = async () => {
    if (!userEmail) {
      setEmailError('No email address available');
      return;
    }

    setIsSendingEmail(true);
    setEmailError(null);

    try {
      const pdfBase64 = generateVoiceReportPDF(report, userName);

      const response = await fetch('/api/send-session-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          userName: userName || 'Valued Customer',
          summary: report.summary.diagnosis,
          pdfBase64: pdfBase64,
          sessionDate: new Date().toISOString(),
          sessionType: 'voice',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      setEmailSent(true);
    } catch (error) {
      console.error('Error sending email:', error);
      setEmailError('Failed to send email. Please try downloading instead.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-midnight-950/90 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-midnight-900 rounded-2xl shadow-2xl">
        {/* Gradient accent top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-scout-purple via-electric-indigo to-electric-cyan" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-text-secondary hover:text-text-primary dark:hover:text-white transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-scout-purple to-electric-indigo rounded-xl flex items-center justify-center shadow-lg shadow-scout-purple/20">
              <BotAvatar className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary dark:text-white">
                Voice Diagnostic Report
              </h2>
              <p className="text-text-secondary text-sm">
                Session completed {new Date(report.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-light-100 dark:bg-midnight-800 rounded-xl p-4">
              <div className="flex items-center gap-2 text-text-secondary mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-medium">Duration</span>
              </div>
              <p className="text-lg font-bold text-text-primary dark:text-white">
                {formatDuration(report.duration)}
              </p>
            </div>
            <div className="bg-light-100 dark:bg-midnight-800 rounded-xl p-4">
              <div className="flex items-center gap-2 text-text-secondary mb-1">
                <Camera className="w-4 h-4" />
                <span className="text-xs font-medium">Photos</span>
              </div>
              <p className="text-lg font-bold text-text-primary dark:text-white">
                {report.photos.length}
              </p>
            </div>
            <div className="bg-light-100 dark:bg-midnight-800 rounded-xl p-4">
              <div className="flex items-center gap-2 text-text-secondary mb-1">
                <MessageSquare className="w-4 h-4" />
                <span className="text-xs font-medium">Exchanges</span>
              </div>
              <p className="text-lg font-bold text-text-primary dark:text-white">
                {report.transcript.length}
              </p>
            </div>
          </div>

          {/* Outcome badge */}
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium mb-6 ${getOutcomeColor(report.summary.outcome)}`}>
            {report.summary.outcome === 'resolved' ? (
              <CheckCircle className="w-4 h-4" />
            ) : report.summary.outcome === 'escalate' ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            {getOutcomeLabel(report.summary.outcome)}
          </div>

          {/* Issue Summary */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-2">
              Issue Summary
            </h3>
            <p className="text-text-primary dark:text-white">
              {report.summary.issue || 'Technical issue diagnosed'}
            </p>
          </div>

          {/* Diagnosis */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-2">
              Diagnosis
            </h3>
            <p className="text-text-primary dark:text-white">
              {report.summary.diagnosis}
            </p>
          </div>

          {/* Photo Gallery */}
          {report.photos.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-3">
                Photo Analysis
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {report.photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="bg-light-100 dark:bg-midnight-800 rounded-xl overflow-hidden"
                  >
                    <img
                      src={photo.base64}
                      alt="Captured"
                      className="w-full h-24 object-cover"
                    />
                    <div className="p-2">
                      <p className="text-xs text-text-secondary line-clamp-2">
                        {photo.aiAnalysis || photo.aiPrompt}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Troubleshooting Steps */}
          {report.summary.steps.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-3">
                Troubleshooting Steps
              </h3>
              <div className="space-y-2">
                {report.summary.steps.map((step, index) => (
                  <div
                    key={index}
                    className="flex gap-3 bg-light-100 dark:bg-midnight-800 rounded-lg p-3"
                  >
                    <span className="w-6 h-6 bg-electric-indigo text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                      {index + 1}
                    </span>
                    <p className="text-sm text-text-primary dark:text-white">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {report.summary.recommendations.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-3">
                Recommendations
              </h3>
              <ul className="space-y-2">
                {report.summary.recommendations.map((rec, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm text-text-primary dark:text-white"
                  >
                    <span className="text-electric-cyan">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid sm:grid-cols-2 gap-3">
            <button
              onClick={handleDownloadPDF}
              className="btn-gradient-electric text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download PDF
            </button>

            {userEmail && !emailSent ? (
              <button
                onClick={handleSendEmail}
                disabled={isSendingEmail}
                className="bg-light-100 dark:bg-midnight-800 text-text-primary dark:text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-light-200 dark:hover:bg-midnight-700 transition-colors disabled:opacity-50"
              >
                {isSendingEmail ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5" />
                    Email Report
                  </>
                )}
              </button>
            ) : emailSent ? (
              <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Email Sent!
              </div>
            ) : null}
          </div>

          {emailError && (
            <p className="mt-3 text-sm text-red-500 text-center">{emailError}</p>
          )}

          {/* Close button at bottom */}
          <button
            onClick={onClose}
            className="w-full mt-4 py-3 text-text-secondary hover:text-text-primary dark:hover:text-white transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoiceReportModal;
