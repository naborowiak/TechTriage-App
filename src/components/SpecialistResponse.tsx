import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock, Send, FileText, MessageSquare, Loader2 } from 'lucide-react';

interface CaseDetails {
  id: string;
  title: string;
  status: string;
  sessionMode: string | null;
  escalatedAt: string | null;
  escalationReport: {
    problemDescription: string;
    stepsTried: string[];
    scoutAnalysis: string;
    recommendedSpecialist: string;
    urgencyLevel: string;
    photosIncluded: number;
    estimatedCostRange: string;
  } | null;
  specialistNotes: string | null;
  specialistRespondedAt: string | null;
  createdAt: string;
}

interface Message {
  role: string;
  text: string;
  image?: string;
  timestamp: number;
}

interface SpecialistResponseProps {
  token: string;
}

export const SpecialistResponse: React.FC<SpecialistResponseProps> = ({ token }) => {
  const [caseData, setCaseData] = useState<CaseDetails | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userName, setUserName] = useState('User');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchCase = async () => {
      try {
        const res = await fetch(`/api/specialist/${token}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to load case');
        }
        const data = await res.json();
        setCaseData(data.case);
        setMessages(data.messages || []);
        setUserName(data.userName);
        if (data.case.specialistNotes) {
          setSubmitted(true);
          setNotes(data.case.specialistNotes);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load case');
      } finally {
        setLoading(false);
      }
    };
    fetchCase();
  }, [token]);

  const handleSubmit = async () => {
    if (!notes.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/specialist/${token}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notes.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit');
      }
      setSubmitted(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Link Invalid</h1>
          <p className="text-gray-500">{error || 'This specialist link is invalid or has expired.'}</p>
        </div>
      </div>
    );
  }

  const report = caseData.escalationReport;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">TotalAssist Specialist Review</h1>
            <p className="text-sm text-gray-500">Case #{caseData.id.slice(0, 8)}</p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Case Summary Card */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
            <h2 className="font-bold text-gray-900 text-lg">{caseData.title}</h2>
            <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {new Date(caseData.createdAt).toLocaleDateString()}
              </span>
              <span>Customer: {userName}</span>
              {caseData.sessionMode && (
                <span className="capitalize">Mode: {caseData.sessionMode}</span>
              )}
            </div>
          </div>

          {report && (
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Problem Description</h3>
                <p className="text-gray-800">{report.problemDescription}</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Steps Already Tried</h3>
                <ul className="space-y-1">
                  {report.stepsTried.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-700">
                      <span className="text-indigo-500 mt-0.5">-</span>
                      {step}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Support Team Analysis</h3>
                <p className="text-gray-800">{report.scoutAnalysis}</p>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-xs font-medium text-gray-500">Recommended Specialist</div>
                  <div className="font-semibold text-gray-900 mt-1">{report.recommendedSpecialist}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-xs font-medium text-gray-500">Urgency</div>
                  <div className={`font-semibold mt-1 ${
                    report.urgencyLevel === 'high' ? 'text-red-600' :
                    report.urgencyLevel === 'medium' ? 'text-amber-600' : 'text-green-600'
                  }`}>
                    {report.urgencyLevel.charAt(0).toUpperCase() + report.urgencyLevel.slice(1)}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-xs font-medium text-gray-500">Est. Cost Range</div>
                  <div className="font-semibold text-gray-900 mt-1">{report.estimatedCostRange}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chat History */}
        {messages.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Chat History ({messages.length} messages)
              </h3>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {msg.text}
                    {msg.image && (
                      <div className="mt-2">
                        <img src={msg.image} alt="Attached" className="rounded-lg max-w-full max-h-48" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Response Form */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">
              {submitted ? 'Your Response' : 'Submit Your Response'}
            </h3>
          </div>
          <div className="p-6">
            {submitted ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Response submitted successfully</span>
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-gray-800 whitespace-pre-wrap">
                  {notes}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  Please review the case details and chat history above, then provide your professional assessment and recommended next steps.
                </p>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter your diagnosis, recommendations, and any next steps for the customer..."
                  className="w-full h-40 px-4 py-3 border-2 border-gray-200 rounded-xl resize-none focus:border-indigo-500 focus:outline-none text-gray-800 placeholder:text-gray-400"
                />
                <button
                  onClick={handleSubmit}
                  disabled={!notes.trim() || submitting}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {submitting ? 'Submitting...' : 'Submit Response'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-12 py-6 px-6 text-center text-sm text-gray-400">
        Powered by TotalAssist &middot; Smart Tek Labs
      </footer>
    </div>
  );
};
