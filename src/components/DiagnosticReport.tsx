import React from 'react';
import {
  AlertTriangle,
  Eye,
  Search,
  ListChecks,
  Package,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Share2,
} from 'lucide-react';

export interface DiagnosticReportData {
  id: string;
  createdAt: number;
  videoFileName?: string;
  status: 'analyzing' | 'complete' | 'error';
  issuesDetected: boolean;
  sections: {
    status: {
      level: 'critical' | 'warning' | 'info' | 'ok';
      summary: string;
    };
    observation: {
      description: string;
      details: string[];
    };
    assessment: {
      rootCause: string;
      confidence: number; // 0-100
    };
    actionPlan: {
      steps: Array<{
        step: number;
        instruction: string;
        difficulty: 'easy' | 'medium' | 'hard';
      }>;
    };
    partsList: Array<{
      name: string;
      estimatedCost?: string;
      required: boolean;
    }>;
  };
}

interface DiagnosticReportProps {
  report: DiagnosticReportData;
  onDownload?: () => void;
  onShare?: () => void;
}

export const DiagnosticReport: React.FC<DiagnosticReportProps> = ({
  report,
  onDownload,
  onShare,
}) => {
  const getStatusColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'warning':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'info':
        return 'text-electric-cyan bg-electric-cyan/20 border-electric-cyan/30';
      case 'ok':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      default:
        return 'text-text-secondary bg-midnight-700 border-midnight-600';
    }
  };

  const getStatusIcon = (level: string) => {
    switch (level) {
      case 'critical':
        return <XCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'ok':
        return <CheckCircle2 className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'text-green-400 bg-green-500/20';
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'hard':
        return 'text-red-400 bg-red-500/20';
      default:
        return 'text-text-secondary bg-midnight-700';
    }
  };

  if (report.status === 'analyzing') {
    return <DiagnosticAnalyzing />;
  }

  if (report.status === 'error') {
    return (
      <div className="bg-midnight-800 rounded-2xl border border-red-500/30 p-6 text-center">
        <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-white mb-2">Analysis Failed</h3>
        <p className="text-text-secondary text-sm">
          Analysis failed. Please try again with a clearer recording.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-midnight-800 rounded-2xl border border-midnight-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-scout-purple/20 to-electric-indigo/20 p-6 border-b border-midnight-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-scout-purple to-electric-indigo flex items-center justify-center">
              <Search className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white">Diagnostic Report</h3>
              <p className="text-xs text-text-secondary">
                {new Date(report.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onDownload && (
              <button
                onClick={onDownload}
                className="p-2 rounded-lg bg-midnight-700 hover:bg-midnight-600 text-text-secondary hover:text-white transition-colors"
                title="Download Report"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
            {onShare && (
              <button
                onClick={onShare}
                className="p-2 rounded-lg bg-midnight-700 hover:bg-midnight-600 text-text-secondary hover:text-white transition-colors"
                title="Share Report"
              >
                <Share2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${getStatusColor(report.sections.status.level)}`}
        >
          {getStatusIcon(report.sections.status.level)}
          <span className="font-semibold text-sm">{report.sections.status.summary}</span>
        </div>
      </div>

      {/* Report Sections */}
      <div className="p-6 space-y-6">
        {/* Observation */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Eye className="w-5 h-5 text-electric-indigo" />
            <h4 className="font-bold text-white">Observation</h4>
          </div>
          <div className="bg-midnight-900/50 rounded-xl p-4 border border-midnight-700">
            <p className="text-text-secondary mb-3">
              {report.sections.observation.description}
            </p>
            {report.sections.observation.details.length > 0 && (
              <ul className="space-y-2">
                {report.sections.observation.details.map((detail, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                    <span className="text-electric-cyan mt-1">•</span>
                    {detail}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Assessment */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Search className="w-5 h-5 text-electric-cyan" />
            <h4 className="font-bold text-white">Assessment</h4>
          </div>
          <div className="bg-midnight-900/50 rounded-xl p-4 border border-midnight-700">
            <p className="text-white font-medium mb-2">Root Cause:</p>
            <p className="text-text-secondary mb-4">{report.sections.assessment.rootCause}</p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">Confidence:</span>
              <div className="flex-1 h-2 bg-midnight-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-electric-indigo to-electric-cyan rounded-full"
                  style={{ width: `${report.sections.assessment.confidence}%` }}
                />
              </div>
              <span className="text-xs text-electric-cyan font-medium">
                {report.sections.assessment.confidence}%
              </span>
            </div>
          </div>
        </section>

        {/* Action Plan */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <ListChecks className="w-5 h-5 text-scout-purple" />
            <h4 className="font-bold text-white">Action Plan</h4>
          </div>
          <div className="space-y-3">
            {report.sections.actionPlan.steps.map((step) => (
              <div
                key={step.step}
                className="bg-midnight-900/50 rounded-xl p-4 border border-midnight-700 flex items-start gap-4"
              >
                <div className="w-8 h-8 rounded-lg bg-electric-indigo/20 flex items-center justify-center text-electric-indigo font-bold text-sm shrink-0">
                  {step.step}
                </div>
                <div className="flex-1">
                  <p className="text-text-secondary">{step.instruction}</p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(step.difficulty)}`}
                >
                  {step.difficulty}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Parts List */}
        {report.sections.partsList.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-5 h-5 text-yellow-400" />
              <h4 className="font-bold text-white">Parts List</h4>
            </div>
            <div className="bg-midnight-900/50 rounded-xl border border-midnight-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-midnight-700">
                    <th className="text-left p-3 text-text-muted font-medium">Part</th>
                    <th className="text-left p-3 text-text-muted font-medium">Est. Cost</th>
                    <th className="text-left p-3 text-text-muted font-medium">Required</th>
                  </tr>
                </thead>
                <tbody>
                  {report.sections.partsList.map((part, i) => (
                    <tr key={i} className="border-b border-midnight-700 last:border-0">
                      <td className="p-3 text-text-secondary">{part.name}</td>
                      <td className="p-3 text-text-secondary">{part.estimatedCost || '—'}</td>
                      <td className="p-3">
                        {part.required ? (
                          <span className="text-yellow-400 text-xs font-medium">Required</span>
                        ) : (
                          <span className="text-text-muted text-xs">Optional</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

// Analyzing state component
export const DiagnosticAnalyzing: React.FC = () => {
  const [progress, setProgress] = React.useState(0);
  const [stage, setStage] = React.useState(0);

  const stages = [
    'Processing video...',
    'Analyzing visual elements...',
    'Identifying components...',
    'Detecting anomalies...',
    'Generating diagnosis...',
    'Compiling report...',
  ];

  React.useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + Math.random() * 3;
      });
    }, 200);

    const stageInterval = setInterval(() => {
      setStage((prev) => (prev < stages.length - 1 ? prev + 1 : prev));
    }, 2500);

    return () => {
      clearInterval(progressInterval);
      clearInterval(stageInterval);
    };
  }, []);

  return (
    <div className="bg-midnight-800 rounded-2xl border border-midnight-700 p-8 text-center">
      {/* Animated scanner icon */}
      <div className="relative w-20 h-20 mx-auto mb-6">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-scout-purple to-electric-indigo opacity-20 animate-pulse" />
        <div className="absolute inset-2 rounded-xl bg-midnight-900 flex items-center justify-center">
          <Search className="w-8 h-8 text-electric-indigo animate-pulse" />
        </div>
        {/* Scanning line */}
        <div className="absolute inset-2 rounded-xl overflow-hidden">
          <div
            className="w-full h-1 bg-gradient-to-r from-transparent via-electric-cyan to-transparent animate-bounce"
            style={{ animationDuration: '1.5s' }}
          />
        </div>
      </div>

      <h3 className="text-xl font-bold text-white mb-2">Analyzing...</h3>
      <p className="text-text-secondary text-sm mb-6">{stages[stage]}</p>

      {/* Progress bar */}
      <div className="max-w-xs mx-auto mb-4">
        <div className="h-2 bg-midnight-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-electric-indigo to-electric-cyan rounded-full transition-all duration-300"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>
      <p className="text-xs text-text-muted">{Math.round(progress)}% complete</p>
    </div>
  );
};
