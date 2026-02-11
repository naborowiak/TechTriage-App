import jsPDF from 'jspdf';
import { VoiceDiagnosticReport } from '../hooks/useVoiceSession';

// ============================================
// Shared Brand Design Constants (matches PDF-export.png reference)
// ============================================
const PDF_COLORS = {
  headerStart: [99, 102, 241] as [number, number, number],   // #6366F1 Electric Indigo
  headerEnd: [67, 56, 202] as [number, number, number],      // #4338CA deeper indigo
  sectionHeaderBg: [243, 244, 246] as [number, number, number], // #F3F4F6
  sectionHeaderText: [55, 65, 81] as [number, number, number], // #374151
  label: [107, 114, 128] as [number, number, number],         // #6B7280
  value: [17, 24, 39] as [number, number, number],            // #111827
  white: [255, 255, 255] as [number, number, number],
  statusGreen: [34, 197, 94] as [number, number, number],     // #22C55E
  statusGreenBg: [220, 252, 231] as [number, number, number], // #DCFCE7
  statusYellow: [234, 179, 8] as [number, number, number],    // #EAB308
  statusYellowBg: [254, 249, 195] as [number, number, number],// #FEF9C3
  statusRed: [239, 68, 68] as [number, number, number],       // #EF4444
  statusRedBg: [254, 226, 226] as [number, number, number],   // #FEE2E2
  footerBg: [249, 250, 251] as [number, number, number],      // #F9FAFB
  footerText: [156, 163, 175] as [number, number, number],    // #9CA3AF
  accent: [99, 102, 241] as [number, number, number],         // #6366F1
  tableBorder: [229, 231, 235] as [number, number, number],   // #E5E7EB
  bodyText: [55, 65, 81] as [number, number, number],         // #374151
};

// ============================================
// Shared Drawing Helpers
// ============================================

function drawGradientHeader(doc: jsPDF, pageWidth: number, reportTitle: string) {
  const headerHeight = 55;
  const steps = 40;
  const stripHeight = headerHeight / steps;

  for (let i = 0; i < steps; i++) {
    const ratio = i / steps;
    const r = Math.round(PDF_COLORS.headerStart[0] + (PDF_COLORS.headerEnd[0] - PDF_COLORS.headerStart[0]) * ratio);
    const g = Math.round(PDF_COLORS.headerStart[1] + (PDF_COLORS.headerEnd[1] - PDF_COLORS.headerStart[1]) * ratio);
    const b = Math.round(PDF_COLORS.headerStart[2] + (PDF_COLORS.headerEnd[2] - PDF_COLORS.headerStart[2]) * ratio);
    doc.setFillColor(r, g, b);
    doc.rect(0, i * stripHeight, pageWidth, stripHeight + 0.5, 'F');
  }

  // Logo icon
  const logoX = 20;
  const logoY = 20;
  doc.setFillColor(255, 255, 255);
  doc.circle(logoX + 5, logoY, 7, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(PDF_COLORS.headerStart[0], PDF_COLORS.headerStart[1], PDF_COLORS.headerStart[2]);
  doc.text('TA', logoX + 2.2, logoY + 2.2);

  // TotalAssist wordmark
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('TotalAssist', logoX + 16, logoY + 1.5);

  // Report title
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(reportTitle, logoX, 40);

  // Subtitle
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 210, 255);
  doc.text('Fast, friendly tech support', logoX, 47);
}

function drawFooter(doc: jsPDF, pageWidth: number, pageHeight: number, pageNum: number, totalPages: number) {
  const footerHeight = 18;
  const footerY = pageHeight - footerHeight;

  doc.setFillColor(...PDF_COLORS.footerBg);
  doc.rect(0, footerY, pageWidth, footerHeight, 'F');

  doc.setDrawColor(...PDF_COLORS.tableBorder);
  doc.setLineWidth(0.3);
  doc.line(0, footerY, pageWidth, footerY);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.footerText);
  doc.text('TotalAssist', 20, footerY + 11);

  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.setFont('helvetica', 'normal');
  doc.text(dateStr, pageWidth / 2, footerY + 11, { align: 'center' });

  doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - 20, footerY + 11, { align: 'right' });
}

function drawSectionHeader(doc: jsPDF, title: string, y: number, pageWidth: number, margin: number): number {
  const contentWidth = pageWidth - margin * 2;

  doc.setFillColor(...PDF_COLORS.sectionHeaderBg);
  doc.roundedRect(margin, y, contentWidth, 10, 1, 1, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.sectionHeaderText);
  doc.text(title, margin + 5, y + 7);

  return y + 16;
}

function drawTableRow(doc: jsPDF, label: string, value: string, y: number, margin: number, labelWidth: number = 50): number {
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.label);
  doc.text(label, margin + 5, y);

  doc.setTextColor(...PDF_COLORS.value);
  doc.setFont('helvetica', 'normal');

  const maxValueWidth = doc.internal.pageSize.getWidth() - margin * 2 - labelWidth - 10;
  const lines = doc.splitTextToSize(value, maxValueWidth);
  doc.text(lines, margin + labelWidth, y);

  return y + (lines.length * 4.5) + 2;
}

// ============================================
// Main Voice Report PDF Generator
// ============================================

export const generateVoiceReportPDF = (
  report: VoiceDiagnosticReport,
  userName?: string
): string => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  const bottomMargin = 30;
  let yPosition = 0;

  const addNewPageIfNeeded = (requiredSpace: number = 30) => {
    if (yPosition > pageHeight - bottomMargin - requiredSpace) {
      doc.addPage();
      yPosition = 20;
      return true;
    }
    return false;
  };

  // ============================================
  // HEADER
  // ============================================
  drawGradientHeader(doc, pageWidth, 'Diagnostic Report');
  yPosition = 65;

  // ============================================
  // REPORT SUMMARY
  // ============================================
  yPosition = drawSectionHeader(doc, 'Report Summary', yPosition, pageWidth, margin);

  if (userName) {
    yPosition = drawTableRow(doc, 'Client Name:', userName, yPosition, margin);
  }

  const sessionDate = new Date(report.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  yPosition = drawTableRow(doc, 'Date:', sessionDate, yPosition, margin);

  yPosition = drawTableRow(doc, 'Session ID:', report.id.slice(0, 8).toUpperCase(), yPosition, margin);
  yPosition = drawTableRow(doc, 'Session Type:', 'Voice / Video', yPosition, margin);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };
  yPosition = drawTableRow(doc, 'Duration:', formatDuration(report.duration), yPosition, margin);
  yPosition = drawTableRow(doc, 'Photos Captured:', report.photos.length.toString(), yPosition, margin);
  yPosition = drawTableRow(doc, 'Exchanges:', report.transcript.length.toString(), yPosition, margin);

  // Start/end times
  if (report.transcript.length > 0) {
    const startTime = new Date(report.transcript[0].timestamp).toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
    const endTime = new Date(report.transcript[report.transcript.length - 1].timestamp).toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
    yPosition = drawTableRow(doc, 'Diagnostics Started:', startTime, yPosition, margin);
    yPosition = drawTableRow(doc, 'Diagnostics Completed:', endTime, yPosition, margin);
  }

  yPosition += 5;

  // ============================================
  // RESOLUTION SUMMARY
  // ============================================
  addNewPageIfNeeded(50);
  yPosition = drawSectionHeader(doc, 'Resolution Summary', yPosition, pageWidth, margin);

  yPosition = drawTableRow(doc, 'Issue Detected:', report.summary.issue || 'Technical issue diagnosed during session.', yPosition, margin);
  yPosition = drawTableRow(doc, 'Action Taken:', report.summary.diagnosis || 'Diagnostic session completed.', yPosition, margin);

  // Status badge
  const outcomeMap: Record<string, { label: string; color: [number, number, number]; bg: [number, number, number]; icon: string }> = {
    resolved: { label: 'Resolved', color: PDF_COLORS.statusGreen, bg: PDF_COLORS.statusGreenBg, icon: '\u2713' },
    partial: { label: 'In Progress', color: PDF_COLORS.statusYellow, bg: PDF_COLORS.statusYellowBg, icon: '~' },
    escalate: { label: 'Escalated', color: PDF_COLORS.statusRed, bg: PDF_COLORS.statusRedBg, icon: '!' },
  };
  const outcome = outcomeMap[report.summary.outcome] || outcomeMap.partial;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.label);
  doc.text('Status:', margin + 5, yPosition);

  const badgeX = margin + 50;
  const badgeW = doc.getTextWidth(outcome.label) + 16;
  doc.setFillColor(...outcome.bg);
  doc.roundedRect(badgeX, yPosition - 4.5, badgeW, 7, 2, 2, 'F');

  doc.setFillColor(...outcome.color);
  doc.circle(badgeX + 5, yPosition - 1, 2.5, 'F');
  doc.setFontSize(6);
  doc.setTextColor(255, 255, 255);
  doc.text(outcome.icon, badgeX + 3.5, yPosition + 0.5);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...outcome.color);
  doc.text(outcome.label, badgeX + 10, yPosition);

  yPosition += 12;

  // ============================================
  // DETAILS & RECOMMENDATIONS
  // ============================================
  addNewPageIfNeeded(40);
  yPosition = drawSectionHeader(doc, 'Details & Recommendations', yPosition, pageWidth, margin);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  // Steps taken as bullets
  if (report.summary.steps.length > 0) {
    for (const step of report.summary.steps) {
      addNewPageIfNeeded(15);
      doc.setFillColor(...PDF_COLORS.accent);
      doc.circle(margin + 7, yPosition - 1, 1.2, 'F');

      doc.setTextColor(...PDF_COLORS.bodyText);
      const lines = doc.splitTextToSize(step, contentWidth - 15);
      for (let i = 0; i < lines.length; i++) {
        doc.text(lines[i], margin + 12, yPosition + (i * 4.5));
      }
      yPosition += lines.length * 4.5 + 3;
    }
  }

  // Recommendations
  if (report.summary.recommendations.length > 0) {
    yPosition += 3;
    for (const rec of report.summary.recommendations) {
      addNewPageIfNeeded(15);
      doc.setFillColor(...PDF_COLORS.accent);
      doc.circle(margin + 7, yPosition - 1, 1.2, 'F');

      doc.setTextColor(...PDF_COLORS.bodyText);
      const lines = doc.splitTextToSize(rec, contentWidth - 15);
      for (let i = 0; i < lines.length; i++) {
        doc.text(lines[i], margin + 12, yPosition + (i * 4.5));
      }
      yPosition += lines.length * 4.5 + 3;
    }
  }

  yPosition += 5;

  // ============================================
  // PHOTO ANALYSIS
  // ============================================
  if (report.photos.length > 0) {
    addNewPageIfNeeded(30);
    yPosition = drawSectionHeader(doc, `Photo Analysis (${report.photos.length})`, yPosition, pageWidth, margin);

    for (let idx = 0; idx < report.photos.length; idx++) {
      const photo = report.photos[idx];
      addNewPageIfNeeded(25);

      // Photo card background
      doc.setFillColor(...PDF_COLORS.sectionHeaderBg);
      doc.roundedRect(margin, yPosition - 3, contentWidth, 22, 1, 1, 'F');

      // Left accent bar
      doc.setFillColor(...PDF_COLORS.accent);
      doc.rect(margin, yPosition - 3, 3, 22, 'F');

      // Photo label
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...PDF_COLORS.value);
      doc.text(`Photo ${idx + 1}`, margin + 8, yPosition + 3);

      // Timestamp
      const photoTime = new Date(photo.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...PDF_COLORS.label);
      doc.text(`Captured at ${photoTime}`, margin + 8, yPosition + 9);

      // Analysis
      if (photo.aiAnalysis) {
        doc.setFontSize(8);
        doc.setTextColor(...PDF_COLORS.bodyText);
        const analysisLines = doc.splitTextToSize(photo.aiAnalysis, contentWidth - 20);
        const displayLines = analysisLines.slice(0, 2);
        displayLines.forEach((line: string, lineIdx: number) => {
          doc.text(line, margin + 8, yPosition + 14 + (lineIdx * 3.5));
        });
      }

      yPosition += 28;
    }
    yPosition += 5;
  }

  // ============================================
  // CONVERSATION TRANSCRIPT
  // ============================================
  addNewPageIfNeeded(30);
  yPosition = drawSectionHeader(doc, 'Session Transcript', yPosition, pageWidth, margin);

  for (const entry of report.transcript) {
    addNewPageIfNeeded(20);

    const time = new Date(entry.timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const isUser = entry.role === 'user';
    const speaker = isUser ? 'You' : 'Scout AI';
    const speakerColor = isUser ? PDF_COLORS.value : PDF_COLORS.accent;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...speakerColor);
    doc.text(speaker, margin + 5, yPosition);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_COLORS.label);
    doc.text(`  ${time}`, margin + 5 + doc.getTextWidth(speaker), yPosition);
    yPosition += 5;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_COLORS.bodyText);
    const textLines = doc.splitTextToSize(entry.text, contentWidth - 12);
    for (const line of textLines) {
      addNewPageIfNeeded(10);
      doc.text(line, margin + 8, yPosition);
      yPosition += 3.5;
    }
    yPosition += 4;
  }

  // ============================================
  // FOOTER on every page
  // ============================================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(doc, pageWidth, pageHeight, i, totalPages);
  }

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
    localStorage.getItem('totalassist_sessions') || '[]'
  );
  localStorage.setItem(
    'totalassist_sessions',
    JSON.stringify([sessionData, ...existing])
  );

  window.dispatchEvent(new Event('session_saved'));

  return sessionData;
};
