import jsPDF from 'jspdf';
import { VoiceDiagnosticReport } from '../hooks/useVoiceSession';

export const generateVoiceReportPDF = (
  report: VoiceDiagnosticReport,
  userName?: string
): string => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPosition = margin;

  // Helper function to add text with word wrap
  const addWrappedText = (
    text: string,
    fontSize: number,
    isBold: boolean = false,
    color: [number, number, number] = [31, 41, 55]
  ) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setTextColor(color[0], color[1], color[2]);
    const lines = doc.splitTextToSize(text, contentWidth);

    for (const line of lines) {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(line, margin, yPosition);
      yPosition += fontSize * 0.5;
    }
    yPosition += 3;
  };

  const addSectionHeader = (title: string) => {
    yPosition += 5;
    if (yPosition > 260) {
      doc.addPage();
      yPosition = margin;
    }
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(99, 102, 241); // electric-indigo
    doc.text(title.toUpperCase(), margin, yPosition);
    yPosition += 8;
    doc.setTextColor(31, 41, 55);
  };

  // Header
  doc.setFillColor(31, 41, 55); // brand-900
  doc.rect(0, 0, pageWidth, 45, 'F');

  // Scout branding
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('TotalAssist', margin, 22);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Voice Diagnostic Report', margin, 32);

  // Report ID
  doc.setFontSize(8);
  doc.text(`Report ID: ${report.id.slice(0, 20)}`, pageWidth - margin - 50, 32);

  yPosition = 60;

  // Session Info Section
  addSectionHeader('Session Information');

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} minutes ${secs} seconds`;
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

  addWrappedText(`Date: ${sessionDate} at ${sessionTime}`, 10);
  if (userName) {
    addWrappedText(`Prepared for: ${userName}`, 10);
  }
  addWrappedText(`Duration: ${formatDuration(report.duration)}`, 10);
  addWrappedText(`Photos Analyzed: ${report.photos.length}`, 10);
  addWrappedText(`Total Exchanges: ${report.transcript.length}`, 10);

  // Issue Summary Section
  addSectionHeader('Issue Summary');
  addWrappedText(report.summary.issue || 'Technical issue diagnosed', 11);

  // Diagnosis Section
  addSectionHeader('Diagnosis');
  addWrappedText(report.summary.diagnosis || 'Session completed', 11);

  // Outcome
  const outcomeLabels: Record<string, string> = {
    resolved: '✓ Issue Resolved',
    partial: '◐ Partially Resolved',
    escalate: '↗ Needs Expert Attention',
  };
  addWrappedText(`Outcome: ${outcomeLabels[report.summary.outcome] || 'Completed'}`, 11, true);

  // Photo Analysis Section (if photos exist)
  if (report.photos.length > 0) {
    addSectionHeader('Photo Analysis');

    report.photos.forEach((photo, index) => {
      if (yPosition > 200) {
        doc.addPage();
        yPosition = margin;
      }

      // Photo number
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(31, 41, 55);
      doc.text(`Photo ${index + 1}`, margin, yPosition);
      yPosition += 5;

      // Photo timestamp
      const photoTime = new Date(photo.timestamp).toLocaleTimeString();
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);
      doc.text(`Captured at ${photoTime}`, margin, yPosition);
      yPosition += 6;

      // AI Prompt
      if (photo.aiPrompt) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(99, 102, 241);
        doc.text(`Scout requested: "${photo.aiPrompt}"`, margin, yPosition);
        yPosition += 5;
      }

      // AI Analysis
      if (photo.aiAnalysis) {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(31, 41, 55);
        const analysisLines = doc.splitTextToSize(`Analysis: ${photo.aiAnalysis}`, contentWidth);
        for (const line of analysisLines) {
          if (yPosition > 270) {
            doc.addPage();
            yPosition = margin;
          }
          doc.text(line, margin, yPosition);
          yPosition += 4.5;
        }
      }

      yPosition += 5;
    });
  }

  // Troubleshooting Steps Section
  if (report.summary.steps.length > 0) {
    addSectionHeader('Troubleshooting Steps');

    report.summary.steps.forEach((step, index) => {
      if (yPosition > 260) {
        doc.addPage();
        yPosition = margin;
      }

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(99, 102, 241);
      doc.text(`${index + 1}.`, margin, yPosition);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(31, 41, 55);
      const stepLines = doc.splitTextToSize(step, contentWidth - 10);
      stepLines.forEach((line: string, lineIndex: number) => {
        doc.text(line, margin + 8, yPosition + (lineIndex * 5));
      });
      yPosition += stepLines.length * 5 + 3;
    });
  }

  // Recommendations Section
  if (report.summary.recommendations.length > 0) {
    addSectionHeader('Recommendations');

    report.summary.recommendations.forEach((rec) => {
      if (yPosition > 265) {
        doc.addPage();
        yPosition = margin;
      }

      doc.setFontSize(10);
      doc.setTextColor(34, 211, 238); // electric-cyan
      doc.text('•', margin, yPosition);

      doc.setTextColor(31, 41, 55);
      const recLines = doc.splitTextToSize(rec, contentWidth - 8);
      recLines.forEach((line: string, lineIndex: number) => {
        doc.text(line, margin + 6, yPosition + (lineIndex * 5));
      });
      yPosition += recLines.length * 5 + 2;
    });
  }

  // Full Transcript Section
  addSectionHeader('Full Conversation Transcript');

  report.transcript.forEach((entry) => {
    if (yPosition > 255) {
      doc.addPage();
      yPosition = margin;
    }

    const time = new Date(entry.timestamp).toLocaleTimeString();
    const speaker = entry.role === 'user' ? 'You' : 'Scout AI';

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    if (entry.role === 'user') {
      doc.setTextColor(31, 41, 55);
    } else {
      doc.setTextColor(139, 92, 246);
    }
    doc.text(`[${time}] ${speaker}:`, margin, yPosition);
    yPosition += 4;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(31, 41, 55);
    const textLines = doc.splitTextToSize(entry.text, contentWidth);
    textLines.forEach((line: string) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(line, margin, yPosition);
      yPosition += 4;
    });

    yPosition += 3;
  });

  // Footer
  yPosition += 10;
  if (yPosition > 270) {
    doc.addPage();
    yPosition = margin;
  }

  doc.setDrawColor(229, 231, 235);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;

  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text(
    'This report was automatically generated by TotalAssist Voice Diagnostic.',
    margin,
    yPosition
  );
  yPosition += 4;
  doc.text(
    'For additional support, visit totalassist.com or start a new session.',
    margin,
    yPosition
  );
  yPosition += 4;
  doc.text(`Generated: ${new Date().toISOString()}`, margin, yPosition);

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
