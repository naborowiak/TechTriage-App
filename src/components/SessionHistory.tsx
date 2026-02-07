import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Clock, Download, Trash2, MessageSquare, Video, Camera, Search, FileText, Mic, AlertTriangle, RefreshCw } from 'lucide-react';
import jsPDF from 'jspdf';
import { CaseRecord } from '../types';

interface SessionHistoryProps {
  onBack?: () => void;
  userEmail?: string;
  userName?: string;
  embedded?: boolean;
  onReopenCase?: (caseId: string) => void;
}

type StatusFilter = 'all' | 'open' | 'resolved' | 'escalated';

export const SessionHistory: React.FC<SessionHistoryProps> = ({ onBack, userEmail: _userEmail, userName, embedded = false, onReopenCase }) => {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [selectedCase, setSelectedCase] = useState<CaseRecord | null>(null);
  const [caseMessages, setCaseMessages] = useState<Array<{ role: string; text: string; image?: string; timestamp: number }>>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch cases from API
  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/cases', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setCases(data);
        }
      }
    } catch (e) {
      console.error('Failed to fetch cases:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch messages when a case is selected
  useEffect(() => {
    if (selectedCase) {
      fetch(`/api/cases/${selectedCase.id}/messages`, { credentials: 'include' })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          setCaseMessages(data?.messages || []);
        })
        .catch(() => setCaseMessages([]));
    }
  }, [selectedCase?.id]);

  const filteredCases = cases.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.aiSummary || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const deleteCase = async (caseId: string) => {
    try {
      const res = await fetch(`/api/cases/${caseId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setCases(prev => prev.filter(c => c.id !== caseId));
        if (selectedCase?.id === caseId) {
          setSelectedCase(null);
          setCaseMessages([]);
        }
      }
    } catch (e) {
      console.error('Failed to delete case:', e);
    }
  };

  const reopenCase = async (caseId: string) => {
    try {
      await fetch(`/api/cases/${caseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'open' }),
      });
      setCases(prev => prev.map(c => c.id === caseId ? { ...c, status: 'open' } : c));
      if (onReopenCase) {
        onReopenCase(caseId);
      }
    } catch (e) {
      console.error('Failed to reopen case:', e);
    }
  };

  const getModeIcon = (mode?: string | null) => {
    switch (mode) {
      case 'video': return <Video className="w-5 h-5" />;
      case 'photo': return <Camera className="w-5 h-5" />;
      case 'voice': return <Mic className="w-5 h-5" />;
      default: return <MessageSquare className="w-5 h-5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-electric-cyan/20 text-electric-cyan">Open</span>;
      case 'resolved':
        return <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">Resolved</span>;
      case 'escalated':
        return <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400">Escalated</span>;
      default:
        return <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-400">{status}</span>;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  // Parse AI summary into structured format
  const parseSummary = (summary: string | null | undefined) => {
    if (!summary) return null;
    const parts: Record<string, string> = {};
    const lines = summary.split('\n');
    for (const line of lines) {
      const match = line.match(/^(Problem|Analysis|Fix|Next Steps|Issue|Diagnosis):\s*(.+)/i);
      if (match) {
        parts[match[1].toLowerCase()] = match[2];
      }
    }
    return Object.keys(parts).length > 0 ? parts : null;
  };

  // Generate PDF for a case
  const downloadCaseGuide = (caseData: CaseRecord) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let yPosition = margin;

    const addWrappedText = (text: string, fontSize: number, isBold: boolean = false) => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      const lines = doc.splitTextToSize(text, contentWidth);
      for (const line of lines) {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(line, margin, yPosition);
        yPosition += fontSize * 0.5;
      }
      yPosition += 5;
    };

    // Header
    doc.setFillColor(31, 41, 55);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Scout', margin, 25);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Case Report - ${caseData.id.substring(0, 8)}`, margin, 33);

    yPosition = 55;
    doc.setTextColor(31, 41, 55);

    // Title
    addWrappedText(caseData.title, 16, true);
    yPosition += 5;

    // Metadata
    doc.setTextColor(107, 114, 128);
    addWrappedText(`Date: ${formatDate(caseData.createdAt)} at ${formatTime(caseData.createdAt)}`, 10);
    addWrappedText(`Status: ${caseData.status} | Mode: ${caseData.sessionMode || 'chat'}`, 10);
    if (userName) addWrappedText(`Prepared for: ${userName}`, 10);
    yPosition += 10;

    // Summary
    if (caseData.aiSummary) {
      doc.setTextColor(249, 115, 22);
      addWrappedText('CASE SUMMARY', 12, true);
      doc.setTextColor(31, 41, 55);
      addWrappedText(caseData.aiSummary, 11);
      yPosition += 10;
    }

    // Escalation Report
    if (caseData.escalationReport) {
      const report = caseData.escalationReport;
      doc.setTextColor(249, 115, 22);
      addWrappedText('ESCALATION REPORT', 12, true);
      doc.setTextColor(31, 41, 55);
      addWrappedText(`Problem: ${report.problemDescription}`, 11);
      addWrappedText(`Specialist Needed: ${report.recommendedSpecialist}`, 11);
      addWrappedText(`Urgency: ${report.urgencyLevel}`, 11);
      addWrappedText(`Estimated Cost: ${report.estimatedCostRange}`, 11);
      if (report.stepsTried.length > 0) {
        addWrappedText('Steps Tried:', 11, true);
        report.stepsTried.forEach((step, i) => {
          addWrappedText(`${i + 1}. ${step}`, 10);
        });
      }
      yPosition += 10;
    }

    // Transcript
    if (caseMessages.length > 0) {
      doc.setTextColor(249, 115, 22);
      addWrappedText('CONVERSATION TRANSCRIPT', 12, true);
      doc.setTextColor(31, 41, 55);
      for (const entry of caseMessages) {
        const time = new Date(entry.timestamp).toLocaleTimeString();
        const speaker = entry.role === 'user' ? 'You' : 'Scout AI';
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(`[${time}] ${speaker}:`, margin, yPosition);
        yPosition += 5;
        doc.setFont('helvetica', 'normal');
        addWrappedText(entry.text, 9);
        yPosition += 3;
      }
    }

    // Footer
    yPosition += 10;
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(8);
    doc.text('This report was generated by Scout AI.', margin, yPosition);

    doc.save(`Scout_Case_${caseData.id.substring(0, 8)}_${new Date(caseData.createdAt).toISOString().split('T')[0]}.pdf`);
  };

  const content = (
    <>
      {/* Search and Filters */}
      <div className="mb-6 space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-midnight-400" />
          <input
            type="text"
            placeholder="Search cases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-midnight-600 rounded-xl bg-white dark:bg-midnight-800 text-text-primary dark:text-white placeholder:text-text-muted focus:border-electric-indigo focus:outline-none transition-colors"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'open', 'resolved', 'escalated'] as StatusFilter[]).map(filter => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === filter
                  ? 'bg-electric-indigo text-white'
                  : 'bg-gray-100 dark:bg-midnight-700 text-text-secondary hover:bg-gray-200 dark:hover:bg-midnight-600'
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Cases List */}
        <div className="lg:col-span-1 space-y-3">
          {isLoading ? (
            <div className="bg-white dark:bg-midnight-800 rounded-2xl p-8 text-center border border-gray-100 dark:border-midnight-700">
              <div className="w-8 h-8 border-3 border-electric-indigo border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-text-muted text-sm">Loading cases...</p>
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="bg-white dark:bg-midnight-800 rounded-2xl p-8 text-center border border-gray-100 dark:border-midnight-700">
              <MessageSquare className="w-12 h-12 text-gray-300 dark:text-midnight-600 mx-auto mb-4" />
              <h3 className="font-bold text-text-primary dark:text-white mb-2">No Cases Yet</h3>
              <p className="text-text-muted text-sm">
                Your support cases will appear here after you start a session with Scout.
              </p>
            </div>
          ) : (
            filteredCases.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCase(c)}
                className={`w-full text-left bg-white dark:bg-midnight-800 rounded-xl p-4 border-2 transition-all hover:shadow-md ${
                  selectedCase?.id === c.id
                    ? 'border-electric-indigo shadow-md'
                    : 'border-gray-100 dark:border-midnight-700 hover:border-gray-200 dark:hover:border-midnight-600'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    selectedCase?.id === c.id
                      ? 'bg-electric-indigo text-white'
                      : 'bg-gray-100 dark:bg-midnight-700 text-gray-500 dark:text-gray-400'
                  }`}>
                    {getModeIcon(c.sessionMode)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-text-primary dark:text-white truncate">{c.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-text-muted mt-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(c.createdAt)}</span>
                    </div>
                    <div className="mt-1.5">
                      {getStatusBadge(c.status || 'open')}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Case Detail */}
        <div className="lg:col-span-2">
          {selectedCase ? (
            <div className="bg-white dark:bg-midnight-800 rounded-2xl border border-gray-100 dark:border-midnight-700 overflow-hidden">
              {/* Case Header */}
              <div className="p-6 border-b border-gray-100 dark:border-midnight-700">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-text-primary dark:text-white mb-2">{selectedCase.title}</h2>
                    <div className="flex items-center gap-4 text-sm text-text-muted">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(selectedCase.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatTime(selectedCase.createdAt)}
                      </span>
                      {getStatusBadge(selectedCase.status || 'open')}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(selectedCase.status === 'resolved' || selectedCase.status === 'escalated') && onReopenCase && (
                      <button
                        onClick={() => reopenCase(selectedCase.id)}
                        className="p-2 bg-electric-cyan/10 text-electric-cyan rounded-lg hover:bg-electric-cyan/20 transition-colors"
                        title="Reopen Case"
                      >
                        <RefreshCw className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => downloadCaseGuide(selectedCase)}
                      className="p-2 bg-electric-indigo text-white rounded-lg hover:bg-electric-indigo/90 transition-colors"
                      title="Download PDF Report"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => deleteCase(selectedCase.id)}
                      className="p-2 bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                      title="Delete Case"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* AI Summary */}
              {selectedCase.aiSummary && (
                <div className="p-6 border-b border-gray-100 dark:border-midnight-700 bg-gray-50 dark:bg-midnight-900">
                  <div className="flex items-center gap-2 text-xs font-bold text-text-muted uppercase tracking-wider mb-3">
                    <FileText className="w-4 h-4" />
                    Case Summary
                  </div>
                  {(() => {
                    const structured = parseSummary(selectedCase.aiSummary);
                    if (structured) {
                      return (
                        <div className="space-y-3">
                          {Object.entries(structured).map(([key, value]) => (
                            <div key={key}>
                              <span className="text-xs font-semibold text-electric-indigo uppercase">{key}</span>
                              <p className="text-text-primary dark:text-white text-sm leading-relaxed">{value}</p>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return <p className="text-text-primary dark:text-white leading-relaxed">{selectedCase.aiSummary}</p>;
                  })()}
                </div>
              )}

              {/* Escalation Report */}
              {selectedCase.escalationReport && (
                <div className="p-6 border-b border-gray-100 dark:border-midnight-700 bg-orange-50 dark:bg-orange-500/5">
                  <div className="flex items-center gap-2 text-xs font-bold text-orange-500 uppercase tracking-wider mb-3">
                    <AlertTriangle className="w-4 h-4" />
                    Escalation Report
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="text-xs font-semibold text-text-muted">Problem</span>
                      <p className="text-text-primary dark:text-white text-sm">{selectedCase.escalationReport.problemDescription}</p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-text-muted">Recommended Specialist</span>
                      <p className="text-text-primary dark:text-white text-sm font-medium">{selectedCase.escalationReport.recommendedSpecialist}</p>
                    </div>
                    <div className="flex gap-4">
                      <div>
                        <span className="text-xs font-semibold text-text-muted">Urgency</span>
                        <p className={`text-sm font-medium ${
                          selectedCase.escalationReport.urgencyLevel === 'emergency' ? 'text-red-500' :
                          selectedCase.escalationReport.urgencyLevel === 'high' ? 'text-orange-500' :
                          'text-yellow-500'
                        }`}>{selectedCase.escalationReport.urgencyLevel}</p>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-text-muted">Est. Cost</span>
                        <p className="text-text-primary dark:text-white text-sm">{selectedCase.escalationReport.estimatedCostRange}</p>
                      </div>
                    </div>
                    {selectedCase.escalationReport.stepsTried.length > 0 && (
                      <div>
                        <span className="text-xs font-semibold text-text-muted">Steps Already Tried</span>
                        <ol className="list-decimal list-inside text-sm text-text-primary dark:text-white mt-1">
                          {selectedCase.escalationReport.stepsTried.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ol>
                      </div>
                    )}
                    <div>
                      <span className="text-xs font-semibold text-text-muted">Scout's Analysis</span>
                      <p className="text-text-primary dark:text-white text-sm">{selectedCase.escalationReport.scoutAnalysis}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Transcript */}
              <div className="p-6">
                <div className="flex items-center gap-2 text-xs font-bold text-text-muted uppercase tracking-wider mb-4">
                  <MessageSquare className="w-4 h-4" />
                  Conversation Transcript
                </div>
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  {caseMessages.length > 0 ? (
                    caseMessages.map((entry, i) => (
                      <div key={i} className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-4 rounded-2xl ${
                          entry.role === 'user'
                            ? 'bg-gradient-to-r from-electric-indigo to-scout-purple text-white rounded-tr-none'
                            : 'bg-gray-100 dark:bg-midnight-700 text-text-primary dark:text-white rounded-tl-none'
                        }`}>
                          <div className="text-xs opacity-70 mb-1">
                            {entry.role === 'user' ? 'You' : 'Scout AI'} • {new Date(entry.timestamp).toLocaleTimeString()}
                          </div>
                          {entry.image && (
                            <img src={entry.image} alt="Attached" className="rounded-lg mb-2 max-h-32 w-auto" />
                          )}
                          <p className="text-sm leading-relaxed">{entry.text}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-text-muted text-center py-8">No transcript available</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-midnight-800 rounded-2xl border border-gray-100 dark:border-midnight-700 p-12 text-center">
              <FileText className="w-16 h-16 text-gray-200 dark:text-midnight-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-text-primary dark:text-white mb-2">Select a Case</h3>
              <p className="text-text-muted">
                Choose a case from the list to view details, download reports, or reopen.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );

  if (embedded) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary dark:text-white">Case History</h1>
          <p className="text-sm text-text-muted">Review your past support cases and diagnostic reports</p>
        </div>
        {content}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-100 dark:bg-midnight-950 transition-colors">
      <header className="bg-white dark:bg-midnight-900 border-b border-gray-200 dark:border-midnight-700 px-6 py-4 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 dark:hover:bg-midnight-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-text-primary dark:text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-text-primary dark:text-white">Case History</h1>
            <p className="text-sm text-text-muted">Review your past support cases</p>
          </div>
        </div>
      </header>
      <div className="max-w-6xl mx-auto p-6 lg:p-8">
        {content}
      </div>
    </div>
  );
};
