import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Clock, Download, Trash2, MessageSquare, Video, Camera, Search, FileText } from 'lucide-react';
import jsPDF from 'jspdf';

interface SessionHistoryProps {
  onBack: () => void;
  userEmail?: string;
  userName?: string;
}

interface SavedSession {
  id: string;
  title: string;
  date: number;
  type: 'chat' | 'video' | 'photo';
  summary: string;
  transcript: Array<{
    role: 'user' | 'model';
    text: string;
    timestamp: number;
  }>;
}

export const SessionHistory: React.FC<SessionHistoryProps> = ({ onBack, userEmail: _userEmail, userName }) => {
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<SavedSession | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Load sessions from localStorage
    const loadSessions = () => {
      try {
        const stored = localStorage.getItem('tech_triage_sessions');
        if (stored) {
          setSessions(JSON.parse(stored));
        }
      } catch (e) {
        console.error('Failed to load sessions:', e);
      }
    };

    loadSessions();

    // Listen for new sessions
    const handleSessionSaved = () => loadSessions();
    window.addEventListener('session_saved', handleSessionSaved);
    return () => window.removeEventListener('session_saved', handleSessionSaved);
  }, []);

  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const deleteSession = (sessionId: string) => {
    const updated = sessions.filter(s => s.id !== sessionId);
    setSessions(updated);
    localStorage.setItem('tech_triage_sessions', JSON.stringify(updated));
    if (selectedSession?.id === sessionId) {
      setSelectedSession(null);
    }
  };

  const getSessionIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-5 h-5" />;
      case 'photo': return <Camera className="w-5 h-5" />;
      default: return <MessageSquare className="w-5 h-5" />;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  // Generate PDF guide for a session
  const downloadSessionGuide = (session: SavedSession) => {
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
    doc.text('TechTriage', margin, 25);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Session Guide', margin, 33);

    yPosition = 55;
    doc.setTextColor(31, 41, 55);

    // Title
    addWrappedText(session.title, 16, true);
    yPosition += 5;

    // Date
    doc.setTextColor(107, 114, 128);
    addWrappedText(`Date: ${formatDate(session.date)} at ${formatTime(session.date)}`, 10);
    if (userName) {
      addWrappedText(`Prepared for: ${userName}`, 10);
    }
    yPosition += 10;

    // Summary
    doc.setTextColor(249, 115, 22);
    addWrappedText('SUMMARY', 12, true);
    doc.setTextColor(31, 41, 55);
    addWrappedText(session.summary, 11);
    yPosition += 10;

    // Transcript
    if (session.transcript && session.transcript.length > 0) {
      doc.setTextColor(249, 115, 22);
      addWrappedText('CONVERSATION TRANSCRIPT', 12, true);
      doc.setTextColor(31, 41, 55);

      for (const entry of session.transcript) {
        const time = new Date(entry.timestamp).toLocaleTimeString();
        const speaker = entry.role === 'user' ? 'You' : 'TechTriage AI';
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
    doc.text('This guide was generated by TechTriage.', margin, yPosition);

    // Save
    doc.save(`TechTriage_Guide_${new Date(session.date).toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#1F2937]" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#1F2937]">Session History</h1>
            <p className="text-sm text-gray-500">Review your past support sessions</p>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6 lg:p-8">
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search sessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#F97316] focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Sessions List */}
          <div className="lg:col-span-1 space-y-3">
            {filteredSessions.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-bold text-[#1F2937] mb-2">No Sessions Yet</h3>
                <p className="text-gray-500 text-sm">
                  Your support sessions will appear here after you complete them.
                </p>
              </div>
            ) : (
              filteredSessions.map(session => (
                <button
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  className={`w-full text-left bg-white rounded-xl p-4 border-2 transition-all hover:shadow-md ${
                    selectedSession?.id === session.id
                      ? 'border-[#F97316] shadow-md'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      selectedSession?.id === session.id
                        ? 'bg-[#F97316] text-white'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {getSessionIcon(session.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[#1F2937] truncate">{session.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(session.date)}</span>
                        <Clock className="w-3 h-3 ml-1" />
                        <span>{formatTime(session.date)}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Session Detail */}
          <div className="lg:col-span-2">
            {selectedSession ? (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {/* Session Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-[#1F2937] mb-2">{selectedSession.title}</h2>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(selectedSession.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatTime(selectedSession.date)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => downloadSessionGuide(selectedSession)}
                        className="p-2 bg-[#F97316] text-white rounded-lg hover:bg-[#EA580C] transition-colors"
                        title="Download PDF Guide"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => deleteSession(selectedSession.id)}
                        className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                        title="Delete Session"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="p-6 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    <FileText className="w-4 h-4" />
                    Summary
                  </div>
                  <p className="text-[#1F2937] leading-relaxed">{selectedSession.summary}</p>
                </div>

                {/* Transcript */}
                <div className="p-6">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                    <MessageSquare className="w-4 h-4" />
                    Conversation Transcript
                  </div>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto">
                    {selectedSession.transcript && selectedSession.transcript.length > 0 ? (
                      selectedSession.transcript.map((entry, i) => (
                        <div key={i} className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] p-4 rounded-2xl ${
                            entry.role === 'user'
                              ? 'bg-[#F97316] text-white rounded-tr-none'
                              : 'bg-gray-100 text-[#1F2937] rounded-tl-none'
                          }`}>
                            <div className="text-xs opacity-70 mb-1">
                              {entry.role === 'user' ? 'You' : 'TechTriage AI'} • {new Date(entry.timestamp).toLocaleTimeString()}
                            </div>
                            <p className="text-sm leading-relaxed">{entry.text}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">No transcript available</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <FileText className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-[#1F2937] mb-2">Select a Session</h3>
                <p className="text-gray-500">
                  Choose a session from the list to view details and download your guide.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
