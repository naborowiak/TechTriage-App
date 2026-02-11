import React from 'react';
import { ArrowLeft, Download, AlertTriangle, CheckCircle2, Clock, User, Wrench, DollarSign, Camera, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import { EscalationReportData } from '../types';

interface EscalationReportProps {
  caseId: string;
  report: EscalationReportData;
  caseTitle?: string;
  escalatedAt?: string | null;
  photos?: string[]; // Base64 or URLs of photos
  onBack?: () => void;
}

const getUrgencyConfig = (level: string) => {
  switch (level.toLowerCase()) {
    case 'high':
    case 'urgent':
      return { label: 'High', color: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400', dotColor: 'bg-red-500' };
    case 'medium':
      return { label: 'Medium', color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400', dotColor: 'bg-amber-500' };
    case 'low':
      return { label: 'Low', color: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400', dotColor: 'bg-green-500' };
    default:
      return { label: level, color: 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400', dotColor: 'bg-gray-500' };
  }
};

export const EscalationReport: React.FC<EscalationReportProps> = ({
  caseId,
  report,
  caseTitle,
  escalatedAt,
  photos,
  onBack,
}) => {
  const urgency = getUrgencyConfig(report.urgencyLevel);
  const formattedDate = escalatedAt
    ? new Date(escalatedAt).toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : new Date().toLocaleString();

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    const bottomMargin = 30;
    let y = 0;

    // Brand colors matching PDF-export.png reference
    const C = {
      headerStart: [99, 102, 241] as [number, number, number],
      headerEnd: [67, 56, 202] as [number, number, number],
      sectionBg: [243, 244, 246] as [number, number, number],
      sectionText: [55, 65, 81] as [number, number, number],
      label: [107, 114, 128] as [number, number, number],
      value: [17, 24, 39] as [number, number, number],
      bodyText: [55, 65, 81] as [number, number, number],
      accent: [99, 102, 241] as [number, number, number],
      footerBg: [249, 250, 251] as [number, number, number],
      footerText: [156, 163, 175] as [number, number, number],
      border: [229, 231, 235] as [number, number, number],
      statusRed: [239, 68, 68] as [number, number, number],
      statusRedBg: [254, 226, 226] as [number, number, number],
      statusYellow: [234, 179, 8] as [number, number, number],
      statusYellowBg: [254, 249, 195] as [number, number, number],
      statusGreen: [34, 197, 94] as [number, number, number],
      statusGreenBg: [220, 252, 231] as [number, number, number],
    };

    const checkPage = (space: number = 30) => {
      if (y > pageHeight - bottomMargin - space) {
        doc.addPage();
        y = 20;
      }
    };

    const tableRow = (label: string, value: string) => {
      checkPage(12);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...C.label);
      doc.text(label, margin + 5, y);
      doc.setTextColor(...C.value);
      const lines = doc.splitTextToSize(value, contentWidth - 60);
      doc.text(lines, margin + 50, y);
      y += (lines.length * 4.5) + 2;
    };

    const sectionHeader = (title: string) => {
      checkPage(25);
      doc.setFillColor(...C.sectionBg);
      doc.roundedRect(margin, y, contentWidth, 10, 1, 1, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.sectionText);
      doc.text(title, margin + 5, y + 7);
      y += 16;
    };

    // ── GRADIENT HEADER ──
    const headerHeight = 55;
    const steps = 40;
    const stripH = headerHeight / steps;
    for (let i = 0; i < steps; i++) {
      const ratio = i / steps;
      const r = Math.round(C.headerStart[0] + (C.headerEnd[0] - C.headerStart[0]) * ratio);
      const g = Math.round(C.headerStart[1] + (C.headerEnd[1] - C.headerStart[1]) * ratio);
      const b = Math.round(C.headerStart[2] + (C.headerEnd[2] - C.headerStart[2]) * ratio);
      doc.setFillColor(r, g, b);
      doc.rect(0, i * stripH, pageWidth, stripH + 0.5, 'F');
    }

    // Logo icon
    doc.setFillColor(255, 255, 255);
    doc.circle(25, 20, 7, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(C.headerStart[0], C.headerStart[1], C.headerStart[2]);
    doc.text('TA', 22.2, 22.2);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('TotalAssist', 36, 21.5);

    doc.setFontSize(22);
    doc.text('Escalation Report', 20, 40);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 210, 255);
    doc.text('Fast, friendly tech support', 20, 47);

    y = 65;

    // ── REPORT SUMMARY ──
    sectionHeader('Report Summary');

    if (caseTitle) {
      tableRow('Case:', caseTitle);
    }
    tableRow('Case ID:', caseId.substring(0, 8).toUpperCase());
    tableRow('Date:', formattedDate);
    tableRow('Urgency Level:', urgency.label);
    tableRow('Specialist:', report.recommendedSpecialist);
    if (report.estimatedCostRange) {
      tableRow('Est. Cost:', report.estimatedCostRange);
    }
    if (report.photosIncluded > 0) {
      tableRow('Photos:', `${report.photosIncluded} photo(s) shared`);
    }
    y += 5;

    // ── RESOLUTION SUMMARY ──
    sectionHeader('Resolution Summary');
    tableRow('Issue Detected:', report.problemDescription.length > 150
      ? report.problemDescription.substring(0, 150) + '...'
      : report.problemDescription);
    tableRow('Action Taken:', report.scoutAnalysis.length > 150
      ? report.scoutAnalysis.substring(0, 150) + '...'
      : report.scoutAnalysis);

    // Status badge
    const urgencyLower = report.urgencyLevel.toLowerCase();
    let statusLabel = 'Pending Review';
    let statusColor = C.statusYellow;
    let statusBg = C.statusYellowBg;
    let statusIcon = '~';
    if (urgencyLower === 'high' || urgencyLower === 'urgent') {
      statusLabel = 'Urgent - Escalated';
      statusColor = C.statusRed;
      statusBg = C.statusRedBg;
      statusIcon = '!';
    } else if (urgencyLower === 'low') {
      statusLabel = 'Low Priority';
      statusColor = C.statusGreen;
      statusBg = C.statusGreenBg;
      statusIcon = '\u2713';
    }

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.label);
    doc.text('Status:', margin + 5, y);

    const badgeX = margin + 50;
    const badgeW = doc.getTextWidth(statusLabel) + 16;
    doc.setFillColor(...statusBg);
    doc.roundedRect(badgeX, y - 4.5, badgeW, 7, 2, 2, 'F');
    doc.setFillColor(...statusColor);
    doc.circle(badgeX + 5, y - 1, 2.5, 'F');
    doc.setFontSize(6);
    doc.setTextColor(255, 255, 255);
    doc.text(statusIcon, badgeX + 3.5, y + 0.5);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...statusColor);
    doc.text(statusLabel, badgeX + 10, y);
    y += 12;

    // ── DETAILS & RECOMMENDATIONS ──
    sectionHeader('Details & Recommendations');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    // Problem description as bullet
    checkPage(15);
    doc.setFillColor(...C.accent);
    doc.circle(margin + 7, y - 1, 1.2, 'F');
    doc.setTextColor(...C.bodyText);
    const problemLines = doc.splitTextToSize(report.problemDescription, contentWidth - 15);
    for (let i = 0; i < problemLines.length; i++) {
      doc.text(problemLines[i], margin + 12, y + (i * 4.5));
    }
    y += problemLines.length * 4.5 + 3;

    // Scout analysis as bullet
    checkPage(15);
    doc.setFillColor(...C.accent);
    doc.circle(margin + 7, y - 1, 1.2, 'F');
    const analysisLines = doc.splitTextToSize(report.scoutAnalysis, contentWidth - 15);
    for (let i = 0; i < analysisLines.length; i++) {
      doc.text(analysisLines[i], margin + 12, y + (i * 4.5));
    }
    y += analysisLines.length * 4.5 + 3;

    // Steps tried
    if (report.stepsTried.length > 0) {
      y += 3;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.sectionText);
      doc.text('Steps Already Tried:', margin + 5, y);
      y += 6;
      doc.setFont('helvetica', 'normal');

      report.stepsTried.forEach((step) => {
        checkPage(12);
        doc.setFillColor(...C.accent);
        doc.circle(margin + 7, y - 1, 1.2, 'F');
        doc.setTextColor(...C.bodyText);
        const lines = doc.splitTextToSize(step, contentWidth - 15);
        for (let i = 0; i < lines.length; i++) {
          doc.text(lines[i], margin + 12, y + (i * 4.5));
        }
        y += lines.length * 4.5 + 2;
      });
    }

    // ── FOOTER on every page ──
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      const footerY = pageHeight - 18;
      doc.setFillColor(...C.footerBg);
      doc.rect(0, footerY, pageWidth, 18, 'F');
      doc.setDrawColor(...C.border);
      doc.setLineWidth(0.3);
      doc.line(0, footerY, pageWidth, footerY);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.footerText);
      doc.text('TotalAssist', 20, footerY + 11);

      doc.setFont('helvetica', 'normal');
      const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      doc.text(today, pageWidth / 2, footerY + 11, { align: 'center' });
      doc.text(`Page ${p} of ${totalPages}`, pageWidth - 20, footerY + 11, { align: 'right' });
    }

    doc.save(`escalation-report-${caseId.slice(0, 8)}.pdf`);
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-lg text-text-muted hover:bg-gray-100 dark:hover:bg-midnight-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-text-primary dark:text-white">Escalation Report</h1>
            <p className="text-sm text-text-muted">Case #{caseId.slice(0, 8)}</p>
          </div>
        </div>
        <button
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-electric-indigo to-electric-cyan text-white font-semibold text-sm shadow-lg hover:opacity-90 transition-opacity"
        >
          <Download className="w-4 h-4" />
          Download PDF
        </button>
      </div>

      {/* Report Card */}
      <div className="bg-white dark:bg-midnight-800 rounded-2xl border border-gray-100 dark:border-midnight-700 overflow-hidden">
        {/* Report Header */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-midnight-700 bg-gray-50 dark:bg-midnight-900/50">
          <div className="flex items-start justify-between">
            <div>
              {caseTitle && (
                <h2 className="text-lg font-bold text-text-primary dark:text-white mb-1">{caseTitle}</h2>
              )}
              <div className="flex items-center gap-4 text-sm text-text-muted">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {formattedDate}
                </span>
                <span className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  Case #{caseId.slice(0, 8)}
                </span>
              </div>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${urgency.color}`}>
              <span className={`w-2 h-2 rounded-full ${urgency.dotColor}`} />
              {urgency.label} Urgency
            </span>
          </div>
        </div>

        {/* Problem Description */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-midnight-700">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-text-primary dark:text-white">Problem Description</h3>
          </div>
          <p className="text-sm text-text-secondary dark:text-gray-300 leading-relaxed">
            {report.problemDescription}
          </p>
        </div>

        {/* Steps Tried */}
        {report.stepsTried.length > 0 && (
          <div className="px-6 py-5 border-b border-gray-100 dark:border-midnight-700">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-5 h-5 text-electric-indigo" />
              <h3 className="text-base font-bold text-text-primary dark:text-white">Steps Already Tried</h3>
            </div>
            <ol className="space-y-2">
              {report.stepsTried.map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-text-secondary dark:text-gray-300">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-electric-indigo/10 dark:bg-electric-indigo/20 text-electric-indigo text-xs font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Support Analysis */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-midnight-700">
          <div className="flex items-center gap-2 mb-3">
            <Wrench className="w-5 h-5 text-electric-cyan" />
            <h3 className="text-base font-bold text-text-primary dark:text-white">Support Analysis</h3>
          </div>
          <p className="text-sm text-text-secondary dark:text-gray-300 leading-relaxed">
            {report.scoutAnalysis}
          </p>
        </div>

        {/* Recommended Specialist & Cost */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-midnight-700">
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <User className="w-5 h-5 text-scout-purple" />
                <h3 className="text-base font-bold text-text-primary dark:text-white">Recommended Specialist</h3>
              </div>
              <p className="text-sm text-text-secondary dark:text-gray-300">{report.recommendedSpecialist}</p>
            </div>
            {report.estimatedCostRange && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-base font-bold text-text-primary dark:text-white">Estimated Cost</h3>
                </div>
                <p className="text-sm text-text-secondary dark:text-gray-300">{report.estimatedCostRange}</p>
              </div>
            )}
          </div>
        </div>

        {/* Photos */}
        {photos && photos.length > 0 && (
          <div className="px-6 py-5 border-b border-gray-100 dark:border-midnight-700">
            <div className="flex items-center gap-2 mb-3">
              <Camera className="w-5 h-5 text-electric-cyan" />
              <h3 className="text-base font-bold text-text-primary dark:text-white">
                Photos ({photos.length})
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos.map((photo, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-midnight-700">
                  <img src={photo} alt={`Case photo ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {report.photosIncluded > 0 && (!photos || photos.length === 0) && (
          <div className="px-6 py-4 border-b border-gray-100 dark:border-midnight-700">
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <Camera className="w-4 h-4" />
              <span>{report.photosIncluded} photo(s) were shared during this session</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-midnight-900/50 text-xs text-text-muted text-center">
          Generated by TotalAssist
        </div>
      </div>
    </div>
  );
};
