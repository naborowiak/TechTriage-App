import jsPDF from "jspdf";

const BRAND_COLORS = {
  primary: [168, 85, 247] as [number, number, number],
  secondary: [99, 102, 241] as [number, number, number],
  accent: [6, 182, 212] as [number, number, number],
  dark: [15, 23, 42] as [number, number, number],
  text: [51, 65, 85] as [number, number, number],
  textLight: [100, 116, 139] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  lightBg: [248, 250, 252] as [number, number, number],
  success: [34, 197, 94] as [number, number, number],
  warning: [234, 179, 8] as [number, number, number],
  error: [239, 68, 68] as [number, number, number],
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
}

export function generateCaseGuidePDF(data: CasePDFData): string {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPosition = margin;

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

  const wrapText = (text: string, maxWidth: number, fontSize: number): string[] => {
    doc.setFontSize(fontSize);
    return doc.splitTextToSize(text, maxWidth);
  };

  // ============================================
  // HEADER
  // ============================================
  doc.setFillColor(BRAND_COLORS.dark[0], BRAND_COLORS.dark[1], BRAND_COLORS.dark[2]);
  doc.rect(0, 0, pageWidth, 45, "F");

  doc.setTextColor(...BRAND_COLORS.white);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("TOTALASSIST", margin, 18);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(BRAND_COLORS.accent[0], BRAND_COLORS.accent[1], BRAND_COLORS.accent[2]);
  doc.text("Scout AI Diagnostic Report", margin, 26);

  // Case metadata
  const dateStr = new Date(data.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.setTextColor(...BRAND_COLORS.white);
  doc.setFontSize(8);
  doc.text(`Case: ${data.caseId.substring(0, 8)}`, pageWidth - margin, 14, { align: "right" });
  doc.text(`Date: ${dateStr}`, pageWidth - margin, 20, { align: "right" });
  doc.text(`Status: ${(data.status || "resolved").toUpperCase()}`, pageWidth - margin, 26, { align: "right" });
  if (data.sessionMode) {
    doc.text(`Mode: ${data.sessionMode.toUpperCase()}`, pageWidth - margin, 32, { align: "right" });
  }

  yPosition = 55;

  // ============================================
  // CASE TITLE
  // ============================================
  doc.setTextColor(...BRAND_COLORS.dark);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  const titleLines = wrapText(data.title, contentWidth, 16);
  doc.text(titleLines, margin, yPosition);
  yPosition += titleLines.length * 7 + 5;

  if (data.userName) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...BRAND_COLORS.textLight);
    doc.text(`Prepared for: ${data.userName}`, margin, yPosition);
    yPosition += 8;
  }

  drawLine(yPosition, BRAND_COLORS.accent);
  yPosition += 10;

  // ============================================
  // AI SUMMARY
  // ============================================
  if (data.aiSummary) {
    doc.setFillColor(BRAND_COLORS.lightBg[0], BRAND_COLORS.lightBg[1], BRAND_COLORS.lightBg[2]);
    doc.roundedRect(margin, yPosition - 3, contentWidth, 10, 2, 2, "F");

    doc.setTextColor(...BRAND_COLORS.secondary);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Case Summary", margin + 4, yPosition + 4);
    yPosition += 14;

    doc.setTextColor(...BRAND_COLORS.text);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const summaryLines = wrapText(data.aiSummary, contentWidth - 4, 9);
    for (const line of summaryLines) {
      addNewPageIfNeeded(12);
      doc.text(line, margin + 2, yPosition);
      yPosition += 5;
    }
    yPosition += 8;
  }

  // ============================================
  // ESCALATION REPORT (if escalated)
  // ============================================
  if (data.escalationReport) {
    addNewPageIfNeeded(60);
    const report = data.escalationReport;

    doc.setFillColor(255, 247, 237); // orange-50
    doc.roundedRect(margin, yPosition - 3, contentWidth, 10, 2, 2, "F");

    doc.setTextColor(234, 88, 12); // orange-600
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Escalation Report", margin + 4, yPosition + 4);
    yPosition += 14;

    // Problem
    doc.setTextColor(...BRAND_COLORS.text);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Problem:", margin + 2, yPosition);
    yPosition += 5;
    doc.setFont("helvetica", "normal");
    const problemLines = wrapText(report.problemDescription, contentWidth - 6, 9);
    for (const line of problemLines) {
      addNewPageIfNeeded(12);
      doc.text(line, margin + 4, yPosition);
      yPosition += 5;
    }
    yPosition += 4;

    // Specialist & urgency
    addNewPageIfNeeded(20);
    doc.setFont("helvetica", "bold");
    doc.text(`Recommended Specialist: ${report.recommendedSpecialist}`, margin + 2, yPosition);
    yPosition += 6;
    doc.text(`Urgency: ${report.urgencyLevel.toUpperCase()}`, margin + 2, yPosition);
    yPosition += 6;
    doc.text(`Estimated Cost: ${report.estimatedCostRange}`, margin + 2, yPosition);
    yPosition += 8;

    // Steps tried
    if (report.stepsTried.length > 0) {
      addNewPageIfNeeded(20);
      doc.setFont("helvetica", "bold");
      doc.text("Steps Already Tried:", margin + 2, yPosition);
      yPosition += 6;
      doc.setFont("helvetica", "normal");
      for (const step of report.stepsTried) {
        addNewPageIfNeeded(12);
        const stepLines = wrapText(`• ${step}`, contentWidth - 8, 9);
        for (const line of stepLines) {
          doc.text(line, margin + 6, yPosition);
          yPosition += 5;
        }
      }
      yPosition += 4;
    }

    // Scout's analysis
    addNewPageIfNeeded(20);
    doc.setFont("helvetica", "bold");
    doc.text("Scout's Analysis:", margin + 2, yPosition);
    yPosition += 6;
    doc.setFont("helvetica", "normal");
    const analysisLines = wrapText(report.scoutAnalysis, contentWidth - 6, 9);
    for (const line of analysisLines) {
      addNewPageIfNeeded(12);
      doc.text(line, margin + 4, yPosition);
      yPosition += 5;
    }
    yPosition += 8;
  }

  // ============================================
  // CONVERSATION TRANSCRIPT
  // ============================================
  if (data.messages.length > 0) {
    addNewPageIfNeeded(30);

    doc.setFillColor(BRAND_COLORS.lightBg[0], BRAND_COLORS.lightBg[1], BRAND_COLORS.lightBg[2]);
    doc.roundedRect(margin, yPosition - 3, contentWidth, 10, 2, 2, "F");

    doc.setTextColor(...BRAND_COLORS.secondary);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Conversation Transcript", margin + 4, yPosition + 4);
    yPosition += 14;

    for (const msg of data.messages) {
      addNewPageIfNeeded(20);

      const speaker = msg.role === "user" ? "You" : "Scout AI";
      const time = new Date(msg.timestamp).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const speakerColor = msg.role === "user" ? BRAND_COLORS.secondary : BRAND_COLORS.primary;
      doc.setTextColor(speakerColor[0], speakerColor[1], speakerColor[2]);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(`${speaker}  ${time}`, margin + 2, yPosition);
      yPosition += 5;

      doc.setTextColor(...BRAND_COLORS.text);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      const msgLines = wrapText(msg.text, contentWidth - 6, 9);
      for (const line of msgLines) {
        addNewPageIfNeeded(12);
        doc.text(line, margin + 4, yPosition);
        yPosition += 5;
      }
      yPosition += 4;
    }
  }

  // ============================================
  // FOOTER
  // ============================================
  const footerY = pageHeight - 12;
  doc.setTextColor(...BRAND_COLORS.textLight);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Generated by TotalAssist Scout AI on ${new Date().toLocaleDateString()}`,
    pageWidth / 2,
    footerY,
    { align: "center" }
  );

  // Return base64 string (no data URI prefix)
  return doc.output("datauristring").split(",")[1];
}
