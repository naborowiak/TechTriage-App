import jsPDF from 'jspdf';
import { VoiceDiagnosticReport } from '../hooks/useVoiceSession';

// TotalAssist Logo as base64 (simplified version for PDF)
// This creates a clean text-based logo since jsPDF doesn't support complex images easily
const BRAND_COLORS = {
  primary: [168, 85, 247] as [number, number, number],      // Scout Purple #A855F7
  secondary: [99, 102, 241] as [number, number, number],    // Electric Indigo #6366F1
  accent: [6, 182, 212] as [number, number, number],        // Electric Cyan #06B6D4
  dark: [15, 23, 42] as [number, number, number],           // Midnight #0f172a
  darkLight: [30, 41, 59] as [number, number, number],      // Midnight Light #1e293b
  text: [51, 65, 85] as [number, number, number],           // Slate #334155
  textLight: [100, 116, 139] as [number, number, number],   // Slate Light #64748b
  white: [255, 255, 255] as [number, number, number],
  lightBg: [248, 250, 252] as [number, number, number],     // Light background
  success: [34, 197, 94] as [number, number, number],       // Green
  warning: [234, 179, 8] as [number, number, number],       // Yellow
  error: [239, 68, 68] as [number, number, number],         // Red
};

export const generateVoiceReportPDF = (
  report: VoiceDiagnosticReport,
  userName?: string
): string => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPosition = margin;

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  const addNewPageIfNeeded = (requiredSpace: number = 30) => {
    if (yPosition > pageHeight - requiredSpace) {
      doc.addPage();
      yPosition = margin + 10;
      return true;
    }
    return false;
  };

  const drawLine = (y: number, color: [number, number, number] = [229, 231, 235]) => {
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
  };

  const addWrappedText = (
    text: string,
    fontSize: number,
    fontStyle: 'normal' | 'bold' | 'italic' = 'normal',
    color: [number, number, number] = BRAND_COLORS.text,
    lineHeight: number = 1.4
  ) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', fontStyle);
    doc.setTextColor(color[0], color[1], color[2]);
    const lines = doc.splitTextToSize(text, contentWidth);
    const lineSpacing = fontSize * 0.35 * lineHeight;

    for (const line of lines) {
      addNewPageIfNeeded(15);
      doc.text(line, margin, yPosition);
      yPosition += lineSpacing;
    }
    yPosition += 2;
  };

  const addSectionHeader = (title: string) => {
    yPosition += 8;
    addNewPageIfNeeded(25);

    // Section title with accent bar
    doc.setFillColor(BRAND_COLORS.primary[0], BRAND_COLORS.primary[1], BRAND_COLORS.primary[2]);
    doc.rect(margin, yPosition - 4, 3, 12, 'F');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(BRAND_COLORS.dark[0], BRAND_COLORS.dark[1], BRAND_COLORS.dark[2]);
    doc.text(title.toUpperCase(), margin + 8, yPosition + 4);

    yPosition += 14;
  };

  const addKeyValue = (key: string, value: string) => {
    addNewPageIfNeeded(12);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(BRAND_COLORS.textLight[0], BRAND_COLORS.textLight[1], BRAND_COLORS.textLight[2]);
    doc.text(key, margin, yPosition);

    doc.setTextColor(BRAND_COLORS.text[0], BRAND_COLORS.text[1], BRAND_COLORS.text[2]);
    doc.text(value, margin + 45, yPosition);
    yPosition += 6;
  };

  // ============================================
  // HEADER - Tesla-style clean design
  // ============================================

  // Dark header background
  doc.setFillColor(BRAND_COLORS.dark[0], BRAND_COLORS.dark[1], BRAND_COLORS.dark[2]);
  doc.rect(0, 0, pageWidth, 52, 'F');

  // Gradient accent line
  doc.setFillColor(BRAND_COLORS.primary[0], BRAND_COLORS.primary[1], BRAND_COLORS.primary[2]);
  doc.rect(0, 52, pageWidth, 2, 'F');

  // Logo area - TotalAssist branding
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('TOTALASSIST', margin, 24);

  // Tagline
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(BRAND_COLORS.accent[0], BRAND_COLORS.accent[1], BRAND_COLORS.accent[2]);
  doc.text('POWERED BY SCOUT AI', margin, 32);

  // Report type on the right
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('DIAGNOSTIC REPORT', pageWidth - margin - 45, 24);

  // Report ID
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(BRAND_COLORS.textLight[0], BRAND_COLORS.textLight[1], BRAND_COLORS.textLight[2]);
  doc.text(`ID: ${report.id.slice(0, 16).toUpperCase()}`, pageWidth - margin - 45, 32);

  // Date on the right
  const reportDate = new Date(report.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  doc.text(reportDate, pageWidth - margin - 45, 40);

  yPosition = 68;

  // ============================================
  // OUTCOME BADGE - Prominent display
  // ============================================

  const outcomeConfig: Record<string, { label: string; color: [number, number, number]; icon: string }> = {
    resolved: { label: 'ISSUE RESOLVED', color: BRAND_COLORS.success, icon: '✓' },
    partial: { label: 'IN PROGRESS', color: BRAND_COLORS.warning, icon: '◐' },
    escalate: { label: 'PROFESSIONAL SERVICE RECOMMENDED', color: BRAND_COLORS.error, icon: '!' },
  };

  const outcome = outcomeConfig[report.summary.outcome] || outcomeConfig.partial;

  // Outcome badge background
  doc.setFillColor(outcome.color[0], outcome.color[1], outcome.color[2]);
  doc.roundedRect(margin, yPosition - 5, contentWidth, 18, 2, 2, 'F');

  // Outcome text
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(`${outcome.icon}  ${outcome.label}`, margin + 8, yPosition + 5);

  yPosition += 25;

  // ============================================
  // SESSION OVERVIEW
  // ============================================

  addSectionHeader('Session Overview');

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const sessionDate = new Date(report.createdAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const sessionTime = new Date(report.createdAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Two-column layout for session info
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  // Left column
  addKeyValue('Date', sessionDate);
  addKeyValue('Time', sessionTime);
  if (userName) {
    addKeyValue('Customer', userName);
  }

  // Duration and stats
  addKeyValue('Duration', formatDuration(report.duration));
  addKeyValue('Photos', report.photos.length.toString());
  addKeyValue('Exchanges', report.transcript.length.toString());

  // ============================================
  // ISSUE SUMMARY
  // ============================================

  addSectionHeader('Issue Summary');
  addWrappedText(report.summary.issue || 'Technical issue diagnosed during session.', 10, 'normal', BRAND_COLORS.text);

  // ============================================
  // DIAGNOSIS
  // ============================================

  addSectionHeader('Analysis & Diagnosis');
  addWrappedText(report.summary.diagnosis || 'Diagnostic session completed.', 10, 'normal', BRAND_COLORS.text);

  // ============================================
  // TROUBLESHOOTING STEPS
  // ============================================

  if (report.summary.steps.length > 0) {
    addSectionHeader('Actions Taken');

    report.summary.steps.forEach((step, index) => {
      addNewPageIfNeeded(15);

      // Step number circle
      doc.setFillColor(BRAND_COLORS.secondary[0], BRAND_COLORS.secondary[1], BRAND_COLORS.secondary[2]);
      doc.circle(margin + 4, yPosition - 1, 3, 'F');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(`${index + 1}`, margin + 2.5, yPosition + 1);

      // Step text
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(BRAND_COLORS.text[0], BRAND_COLORS.text[1], BRAND_COLORS.text[2]);

      const stepLines = doc.splitTextToSize(step, contentWidth - 15);
      stepLines.forEach((line: string, lineIndex: number) => {
        doc.text(line, margin + 12, yPosition + (lineIndex * 4));
      });

      yPosition += Math.max(stepLines.length * 4 + 4, 8);
    });
  }

  // ============================================
  // PHOTO ANALYSIS
  // ============================================

  if (report.photos.length > 0) {
    addSectionHeader('Photo Analysis');

    report.photos.forEach((photo, index) => {
      addNewPageIfNeeded(35);

      // Photo card background
      doc.setFillColor(BRAND_COLORS.lightBg[0], BRAND_COLORS.lightBg[1], BRAND_COLORS.lightBg[2]);
      doc.roundedRect(margin, yPosition - 3, contentWidth, 28, 2, 2, 'F');

      // Photo indicator
      doc.setFillColor(BRAND_COLORS.accent[0], BRAND_COLORS.accent[1], BRAND_COLORS.accent[2]);
      doc.rect(margin, yPosition - 3, 3, 28, 'F');

      // Photo label
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(BRAND_COLORS.dark[0], BRAND_COLORS.dark[1], BRAND_COLORS.dark[2]);
      doc.text(`PHOTO ${index + 1}`, margin + 8, yPosition + 3);

      // Timestamp
      const photoTime = new Date(photo.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(BRAND_COLORS.textLight[0], BRAND_COLORS.textLight[1], BRAND_COLORS.textLight[2]);
      doc.text(`Captured at ${photoTime}`, margin + 8, yPosition + 9);

      // Analysis
      if (photo.aiAnalysis) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(BRAND_COLORS.text[0], BRAND_COLORS.text[1], BRAND_COLORS.text[2]);
        const analysisLines = doc.splitTextToSize(photo.aiAnalysis, contentWidth - 20);
        const displayLines = analysisLines.slice(0, 3); // Max 3 lines per photo
        displayLines.forEach((line: string, lineIdx: number) => {
          doc.text(line, margin + 8, yPosition + 15 + (lineIdx * 4));
        });
      }

      yPosition += 35;
    });
  }

  // ============================================
  // RECOMMENDATIONS
  // ============================================

  if (report.summary.recommendations.length > 0) {
    addSectionHeader('Recommendations');

    report.summary.recommendations.forEach((rec) => {
      addNewPageIfNeeded(12);

      // Bullet point
      doc.setFillColor(BRAND_COLORS.primary[0], BRAND_COLORS.primary[1], BRAND_COLORS.primary[2]);
      doc.circle(margin + 2, yPosition - 1, 1.5, 'F');

      // Recommendation text
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(BRAND_COLORS.text[0], BRAND_COLORS.text[1], BRAND_COLORS.text[2]);

      const recLines = doc.splitTextToSize(rec, contentWidth - 12);
      recLines.forEach((line: string, lineIndex: number) => {
        doc.text(line, margin + 8, yPosition + (lineIndex * 4));
      });

      yPosition += recLines.length * 4 + 4;
    });
  }

  // ============================================
  // CONVERSATION TRANSCRIPT
  // ============================================

  addSectionHeader('Session Transcript');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(BRAND_COLORS.textLight[0], BRAND_COLORS.textLight[1], BRAND_COLORS.textLight[2]);
  doc.text('Complete conversation log from diagnostic session', margin, yPosition);
  yPosition += 8;

  report.transcript.forEach((entry) => {
    addNewPageIfNeeded(20);

    const time = new Date(entry.timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const isUser = entry.role === 'user';
    const speaker = isUser ? 'CUSTOMER' : 'SCOUT AI';
    const speakerColor = isUser ? BRAND_COLORS.dark : BRAND_COLORS.primary;

    // Speaker label with timestamp
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(speakerColor[0], speakerColor[1], speakerColor[2]);
    doc.text(`${speaker}`, margin, yPosition);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(BRAND_COLORS.textLight[0], BRAND_COLORS.textLight[1], BRAND_COLORS.textLight[2]);
    doc.text(`  ${time}`, margin + 22, yPosition);
    yPosition += 4;

    // Message text
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(BRAND_COLORS.text[0], BRAND_COLORS.text[1], BRAND_COLORS.text[2]);

    const textLines = doc.splitTextToSize(entry.text, contentWidth - 5);
    textLines.forEach((line: string) => {
      addNewPageIfNeeded(10);
      doc.text(line, margin + 5, yPosition);
      yPosition += 3.5;
    });

    yPosition += 4;
  });

  // ============================================
  // FOOTER
  // ============================================

  yPosition += 10;
  addNewPageIfNeeded(40);

  drawLine(yPosition, BRAND_COLORS.textLight);
  yPosition += 12;

  // Footer content
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(BRAND_COLORS.textLight[0], BRAND_COLORS.textLight[1], BRAND_COLORS.textLight[2]);

  doc.text('This diagnostic report was automatically generated by TotalAssist powered by Scout AI.', margin, yPosition);
  yPosition += 4;
  doc.text('For additional support or to schedule a service appointment, visit totalassist.tech', margin, yPosition);
  yPosition += 8;

  // Generation timestamp
  doc.setFontSize(6);
  doc.text(`Report generated: ${new Date().toISOString()}`, margin, yPosition);

  // Branding on footer right
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(BRAND_COLORS.primary[0], BRAND_COLORS.primary[1], BRAND_COLORS.primary[2]);
  doc.text('TOTALASSIST', pageWidth - margin - 25, yPosition);

  // Return as base64
  return doc.output('datauristring').split(',')[1];
};

// Helper to save report to localStorage for history
export const saveVoiceReportToHistory = (report: VoiceDiagnosticReport) => {
  const sessionData = {
    id: report.id,
    title: report.summary.issue.length > 50
      ? `${report.summary.issue.substring(0, 50)}...`
      : report.summary.issue,
    date: report.createdAt,
    type: 'voice' as const,
    summary: report.summary.diagnosis,
    transcript: report.transcript.map((entry) => ({
      role: entry.role,
      text: entry.text,
      timestamp: entry.timestamp,
    })),
    photoCount: report.photos.length,
    duration: report.duration,
  };

  const existing = JSON.parse(
    localStorage.getItem('tech_triage_sessions') || '[]'
  );
  localStorage.setItem(
    'tech_triage_sessions',
    JSON.stringify([sessionData, ...existing])
  );

  window.dispatchEvent(new Event('session_saved'));

  return sessionData;
};
