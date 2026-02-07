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
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let y = 20;

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Escalation Report', margin, y);
    y += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`Case ID: ${caseId}`, margin, y);
    y += 5;
    doc.text(`Date: ${formattedDate}`, margin, y);
    if (caseTitle) {
      y += 5;
      doc.text(`Case: ${caseTitle}`, margin, y);
    }
    y += 10;

    // Urgency badge
    doc.setTextColor(0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Urgency: ${urgency.label.toUpperCase()}`, margin, y);
    y += 10;

    // Divider
    doc.setDrawColor(200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // Problem Description
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Problem Description', margin, y);
    y += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const problemLines = doc.splitTextToSize(report.problemDescription, contentWidth);
    doc.text(problemLines, margin, y);
    y += problemLines.length * 5 + 8;

    // Steps Tried
    if (report.stepsTried.length > 0) {
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('Steps Already Tried', margin, y);
      y += 7;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      report.stepsTried.forEach((step, i) => {
        const stepLines = doc.splitTextToSize(`${i + 1}. ${step}`, contentWidth - 5);
        if (y + stepLines.length * 5 > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(stepLines, margin + 5, y);
        y += stepLines.length * 5 + 2;
      });
      y += 6;
    }

    // Scout's Analysis
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    if (y > 250) { doc.addPage(); y = 20; }
    doc.text("Scout's Analysis", margin, y);
    y += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const analysisLines = doc.splitTextToSize(report.scoutAnalysis, contentWidth);
    doc.text(analysisLines, margin, y);
    y += analysisLines.length * 5 + 8;

    // Recommended Specialist
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Recommended Specialist', margin, y);
    y += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(report.recommendedSpecialist, margin, y);
    y += 8;

    // Estimated Cost
    if (report.estimatedCostRange) {
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('Estimated Cost Range', margin, y);
      y += 7;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(report.estimatedCostRange, margin, y);
      y += 8;
    }

    // Photos note
    if (report.photosIncluded > 0) {
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`${report.photosIncluded} photo(s) were shared during this session.`, margin, y);
    }

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 15;
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('Generated by TotalAssist Scout AI', margin, footerY);
    doc.text(`Case ${caseId}`, pageWidth - margin - 30, footerY);

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

        {/* Scout's Analysis */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-midnight-700">
          <div className="flex items-center gap-2 mb-3">
            <Wrench className="w-5 h-5 text-electric-cyan" />
            <h3 className="text-base font-bold text-text-primary dark:text-white">Scout's Analysis</h3>
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
          Generated by TotalAssist Scout AI
        </div>
      </div>
    </div>
  );
};
