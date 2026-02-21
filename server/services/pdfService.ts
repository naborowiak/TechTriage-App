import { jsPDF } from "jspdf";
import { readFileSync } from "fs";
import { resolve } from "path";

// Pre-load logo as base64 for PDF embedding
let logoBase64: string | null = null;
try {
  const logoPath = resolve(__dirname, "../../public/total_assist-new-white.png");
  const logoBuffer = readFileSync(logoPath);
  logoBase64 = "data:image/png;base64," + logoBuffer.toString("base64");
} catch {
  // Fallback to text wordmark if logo file not found
}

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

export interface CasePDFData {
  caseId: string;
  title: string;
  status: string;
  sessionMode: string | null;
  aiSummary: string | null;
  escalationReport: {
    problemDescription: string;
    stepsTried: string[];
    scoutAnalysis: string;
    recommendedSpecialist: string;
    urgencyLevel: string;
    photosIncluded: number;
    estimatedCostRange: string;
  } | null;
  messages: Array<{ role: string; text: string; timestamp: number }>;
  createdAt: string;
  userName?: string;
  userEmail?: string;
  userTimezone?: string;
}

// ============================================
// Shared PDF Drawing Helpers
// ============================================

function drawGradientHeader(doc: jsPDF, pageWidth: number, reportTitle: string) {
  const headerHeight = 55;

  // Simulate gradient with horizontal stripes
  const steps = 40;
  const stripHeight = headerHeight / steps;
  for (let i = 0; i < steps; i++) {
    const ratio = i / steps;
    const r = Math.round(PDF_COLORS.headerStart[0] + (PDF_COLORS.headerEnd[0] - PDF_COLORS.headerStart[0]) * ratio);
    const g = Math.round(PDF_COLORS.headerStart[1] + (PDF_COLORS.headerEnd[1] - PDF_COLORS.headerStart[1]) * ratio);
    const b = Math.round(PDF_COLORS.headerStart[2] + (PDF_COLORS.headerEnd[2] - PDF_COLORS.headerStart[2]) * ratio);
    doc.setFillColor(r, g, b);
    doc.rect(0, i * stripHeight, pageWidth, stripHeight + 0.5, "F");
  }

  // TotalAssist logo
  const logoX = 20;
  const logoY = 12;
  if (logoBase64) {
    doc.addImage(logoBase64, "PNG", logoX, logoY, 36, 12);
  } else {
    // Fallback text wordmark
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("TotalAssist", logoX, logoY + 9.5);
  }

  // Report title
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(reportTitle, logoX, 40);

  // Subtitle
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 210, 255);
  doc.text("Fast, friendly tech support", logoX, 47);
}

function drawFooter(doc: jsPDF, pageWidth: number, pageHeight: number, pageNum: number, totalPages: number) {
  const footerHeight = 18;
  const footerY = pageHeight - footerHeight;

  // Footer background
  doc.setFillColor(...PDF_COLORS.footerBg);
  doc.rect(0, footerY, pageWidth, footerHeight, "F");

  // Top border line
  doc.setDrawColor(...PDF_COLORS.tableBorder);
  doc.setLineWidth(0.3);
  doc.line(0, footerY, pageWidth, footerY);

  // Left: TotalAssist branding
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...PDF_COLORS.footerText);
  doc.text("TotalAssist", 20, footerY + 11);

  // Center: date
  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.setFont("helvetica", "normal");
  doc.text(dateStr, pageWidth / 2, footerY + 11, { align: "center" });

  // Right: page number
  doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - 20, footerY + 11, { align: "right" });
}

function drawSectionHeader(doc: jsPDF, title: string, y: number, pageWidth: number, margin: number): number {
  const contentWidth = pageWidth - margin * 2;

  doc.setFillColor(...PDF_COLORS.sectionHeaderBg);
  doc.roundedRect(margin, y, contentWidth, 10, 1, 1, "F");

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...PDF_COLORS.sectionHeaderText);
  doc.text(title, margin + 5, y + 7);

  return y + 16;
}

function drawTableRow(
  doc: jsPDF,
  label: string,
  value: string,
  y: number,
  margin: number,
  labelWidth: number = 50
): number {
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...PDF_COLORS.label);
  doc.text(label, margin + 5, y);

  doc.setTextColor(...PDF_COLORS.value);
  doc.setFont("helvetica", "normal");

  const maxValueWidth = doc.internal.pageSize.getWidth() - margin * 2 - labelWidth - 10;
  const lines = doc.splitTextToSize(value, maxValueWidth);
  doc.text(lines, margin + labelWidth, y);

  return y + (lines.length * 4.5) + 2;
}

// ============================================
// Main PDF Generator - Case/Diagnostic Report
// ============================================

export function generateCaseGuidePDF(data: CasePDFData): string {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  const bottomMargin = 30; // Space reserved for footer
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
  // HEADER (gradient bar)
  // ============================================
  drawGradientHeader(doc, pageWidth, "Diagnostic Report");
  yPosition = 65;

  // ============================================
  // REPORT SUMMARY - Table-style key-value pairs
  // ============================================
  yPosition = drawSectionHeader(doc, "Report Summary", yPosition, pageWidth, margin);

  // Draw thin border around summary section
  const summaryStartY = yPosition - 2;

  if (data.userName) {
    yPosition = drawTableRow(doc, "Client Name:", data.userName, yPosition, margin);
  }

  if (data.userEmail) {
    yPosition = drawTableRow(doc, "E-mail:", data.userEmail, yPosition, margin);
  }

  const tzOpts = data.userTimezone ? { timeZone: data.userTimezone } : {};
  const dateStr = new Date(data.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...tzOpts,
  });
  yPosition = drawTableRow(doc, "Date:", dateStr, yPosition, margin);

  yPosition = drawTableRow(doc, "Session ID:", data.caseId.substring(0, 8).toUpperCase(), yPosition, margin);

  if (data.sessionMode) {
    yPosition = drawTableRow(doc, "Session Mode:", data.sessionMode.charAt(0).toUpperCase() + data.sessionMode.slice(1), yPosition, margin);
  }

  // Timestamps from first/last message
  if (data.messages.length > 0) {
    const firstMsg = data.messages[0];
    const lastMsg = data.messages[data.messages.length - 1];

    const startTime = new Date(firstMsg.timestamp).toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      ...tzOpts,
    });
    const endTime = new Date(lastMsg.timestamp).toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      ...tzOpts,
    });

    yPosition = drawTableRow(doc, "Diagnostics Started:", startTime, yPosition, margin);
    yPosition = drawTableRow(doc, "Diagnostics Completed:", endTime, yPosition, margin);
  }

  // Light bottom border for summary section
  doc.setDrawColor(...PDF_COLORS.tableBorder);
  doc.setLineWidth(0.3);
  doc.line(margin, summaryStartY - 3, margin + contentWidth, summaryStartY - 3);
  yPosition += 5;

  // ============================================
  // RESOLUTION SUMMARY
  // ============================================
  addNewPageIfNeeded(50);
  yPosition = drawSectionHeader(doc, "Resolution Summary", yPosition, pageWidth, margin);

  // Issue Detected
  const issueText = data.title || data.aiSummary?.split(".")[0] || "Technical issue diagnosed";
  yPosition = drawTableRow(doc, "Issue Detected:", issueText, yPosition, margin);

  // Action Taken
  const actionText = data.aiSummary || "Diagnostic session completed.";
  yPosition = drawTableRow(doc, "Action Taken:", actionText, yPosition, margin, 50);

  // Status badge
  const status = (data.status || "resolved").toLowerCase();
  let statusLabel = "Resolved";
  let statusColor = PDF_COLORS.statusGreen;
  let statusBg = PDF_COLORS.statusGreenBg;

  if (status === "escalated" || status === "escalate") {
    statusLabel = "Escalated";
    statusColor = PDF_COLORS.statusRed;
    statusBg = PDF_COLORS.statusRedBg;
  } else if (status === "in_progress" || status === "partial" || status === "active") {
    statusLabel = "In Progress";
    statusColor = PDF_COLORS.statusYellow;
    statusBg = PDF_COLORS.statusYellowBg;
  }

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...PDF_COLORS.label);
  doc.text("Status:", margin + 5, yPosition);

  // Draw status badge
  const badgeX = margin + 50;
  const badgeW = doc.getTextWidth(statusLabel) + 16;
  doc.setFillColor(...statusBg);
  doc.roundedRect(badgeX, yPosition - 4.5, badgeW, 7, 2, 2, "F");

  // Checkmark/icon circle
  doc.setFillColor(...statusColor);
  doc.circle(badgeX + 5, yPosition - 1, 2.5, "F");
  doc.setFontSize(6);
  doc.setTextColor(255, 255, 255);
  const statusIcon = status === "escalated" || status === "escalate" ? "!" : status === "in_progress" || status === "partial" || status === "active" ? "~" : "\u2713";
  doc.text(statusIcon, badgeX + 3.5, yPosition + 0.5);

  // Status text
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...statusColor);
  doc.text(statusLabel, badgeX + 10, yPosition);

  yPosition += 12;

  // ============================================
  // DETAILS & RECOMMENDATIONS
  // ============================================
  if (data.aiSummary || data.escalationReport) {
    addNewPageIfNeeded(40);
    yPosition = drawSectionHeader(doc, "Details & Recommendations", yPosition, pageWidth, margin);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...PDF_COLORS.bodyText);

    // Full AI summary as bullets
    if (data.aiSummary) {
      const sentences = data.aiSummary
        .split(/(?<=[.!?])\s+/)
        .filter((s) => s.trim().length > 5);

      for (const sentence of sentences) {
        addNewPageIfNeeded(15);
        // Bullet point
        doc.setFillColor(...PDF_COLORS.accent);
        doc.circle(margin + 7, yPosition - 1, 1.2, "F");

        const lines = doc.splitTextToSize(sentence.trim(), contentWidth - 15);
        doc.setTextColor(...PDF_COLORS.bodyText);
        for (let i = 0; i < lines.length; i++) {
          doc.text(lines[i], margin + 12, yPosition + (i * 4.5));
        }
        yPosition += lines.length * 4.5 + 3;
      }
    }

    // Escalation details if present
    if (data.escalationReport) {
      const report = data.escalationReport;
      yPosition += 3;

      addNewPageIfNeeded(15);
      doc.setFillColor(...PDF_COLORS.accent);
      doc.circle(margin + 7, yPosition - 1, 1.2, "F");
      doc.setTextColor(...PDF_COLORS.bodyText);
      doc.text(`Recommended Specialist: ${report.recommendedSpecialist}`, margin + 12, yPosition);
      yPosition += 7;

      addNewPageIfNeeded(15);
      doc.setFillColor(...PDF_COLORS.accent);
      doc.circle(margin + 7, yPosition - 1, 1.2, "F");
      doc.text(`Urgency Level: ${report.urgencyLevel}`, margin + 12, yPosition);
      yPosition += 7;

      if (report.estimatedCostRange) {
        addNewPageIfNeeded(15);
        doc.setFillColor(...PDF_COLORS.accent);
        doc.circle(margin + 7, yPosition - 1, 1.2, "F");
        doc.text(`Estimated Cost: ${report.estimatedCostRange}`, margin + 12, yPosition);
        yPosition += 7;
      }

      if (report.stepsTried.length > 0) {
        yPosition += 3;
        addNewPageIfNeeded(15);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...PDF_COLORS.sectionHeaderText);
        doc.text("Steps Already Tried:", margin + 5, yPosition);
        yPosition += 6;
        doc.setFont("helvetica", "normal");

        for (const step of report.stepsTried) {
          addNewPageIfNeeded(12);
          doc.setFillColor(...PDF_COLORS.accent);
          doc.circle(margin + 7, yPosition - 1, 1.2, "F");
          doc.setTextColor(...PDF_COLORS.bodyText);
          const stepLines = doc.splitTextToSize(step, contentWidth - 15);
          for (let i = 0; i < stepLines.length; i++) {
            doc.text(stepLines[i], margin + 12, yPosition + (i * 4.5));
          }
          yPosition += stepLines.length * 4.5 + 2;
        }
      }

      // Scout's analysis
      if (report.scoutAnalysis) {
        yPosition += 3;
        addNewPageIfNeeded(15);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...PDF_COLORS.sectionHeaderText);
        doc.text("Scout's Analysis:", margin + 5, yPosition);
        yPosition += 6;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...PDF_COLORS.bodyText);
        const analysisLines = doc.splitTextToSize(report.scoutAnalysis, contentWidth - 10);
        for (const line of analysisLines) {
          addNewPageIfNeeded(10);
          doc.text(line, margin + 5, yPosition);
          yPosition += 4.5;
        }
      }
    }

    yPosition += 8;
  }

  // ============================================
  // CONVERSATION TRANSCRIPT
  // ============================================
  if (data.messages.length > 0) {
    addNewPageIfNeeded(30);
    yPosition = drawSectionHeader(doc, "Conversation Transcript", yPosition, pageWidth, margin);

    for (const msg of data.messages) {
      addNewPageIfNeeded(20);

      const speaker = msg.role === "user" ? "You" : "Scout AI";
      const time = new Date(msg.timestamp).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        ...tzOpts,
      });

      // Speaker label
      const speakerColor = msg.role === "user" ? PDF_COLORS.value : PDF_COLORS.accent;
      doc.setTextColor(...speakerColor);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(`${speaker}`, margin + 5, yPosition);

      // Timestamp
      doc.setTextColor(...PDF_COLORS.label);
      doc.setFont("helvetica", "normal");
      doc.text(`  ${time}`, margin + 5 + doc.getTextWidth(`${speaker}`), yPosition);
      yPosition += 5;

      // Message text
      doc.setTextColor(...PDF_COLORS.bodyText);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      const msgLines = doc.splitTextToSize(msg.text, contentWidth - 12);
      for (const line of msgLines) {
        addNewPageIfNeeded(10);
        doc.text(line, margin + 8, yPosition);
        yPosition += 4;
      }
      yPosition += 4;
    }
  }

  // ============================================
  // FOOTER on every page
  // ============================================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(doc, pageWidth, pageHeight, i, totalPages);
  }

  // Return base64 string (no data URI prefix)
  return doc.output("datauristring").split(",")[1];
}
