import React from "react";
import { CheckCircle, Clock, Circle, ArrowRight, Loader2 } from "lucide-react";
import type { CaseProgressStep } from "../../types";

interface Case {
  id: string;
  caseNumber?: number | null;
  title: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

interface CurrentCaseCardProps {
  caseRecord: Case | null;
  steps: CaseProgressStep[];
  onOpenCase: (caseId: string) => void;
  isLoading: boolean;
}

const statusIcons: Record<CaseProgressStep["status"], React.ReactNode> = {
  completed: <CheckCircle className="w-4 h-4 text-emerald-500" />,
  suggested: <Circle className="w-4 h-4 text-orange-400" />,
  "in-progress": <Clock className="w-4 h-4 text-blue-400 animate-pulse" />,
};

const statusLabels: Record<CaseProgressStep["status"], string> = {
  completed: "Completed",
  suggested: "Suggested",
  "in-progress": "In Progress",
};

const statusTextColors: Record<CaseProgressStep["status"], string> = {
  completed: "text-emerald-500",
  suggested: "text-orange-400",
  "in-progress": "text-blue-400",
};

export const CurrentCaseCard: React.FC<CurrentCaseCardProps> = ({
  caseRecord,
  steps,
  onOpenCase,
  isLoading,
}) => {
  if (!caseRecord) return null;

  const dateStr = new Date(caseRecord.updatedAt || caseRecord.createdAt).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", year: "numeric" }
  );

  return (
    <div>
      <h2 className="text-lg font-bold text-text-primary dark:text-white mb-3">Current Case</h2>
      <div className="bg-white/60 dark:bg-midnight-800/60 backdrop-blur-sm rounded-2xl border border-light-300 dark:border-midnight-700 p-4 sm:p-5">
        {/* Case header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-text-primary dark:text-white">
              {caseRecord.caseNumber ? `#${caseRecord.caseNumber}` : "Case"}
            </span>
            <span className="text-sm text-text-muted">{dateStr}</span>
          </div>
          <button
            onClick={() => onOpenCase(caseRecord.id)}
            className="flex items-center gap-1 text-sm font-semibold text-electric-indigo hover:text-electric-indigo/80 transition-colors min-h-[44px]"
            aria-label={`Open case details for case ${caseRecord.caseNumber || ""}`}
          >
            Open Case Details
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Progress steps */}
        {isLoading ? (
          <div className="flex items-center gap-2 py-4 justify-center text-text-muted">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading progress...</span>
          </div>
        ) : steps.length > 0 ? (
          <div role="list" aria-label="Case progress steps" className="space-y-3">
            {steps.map((step, idx) => (
              <div
                key={idx}
                role="listitem"
                className="flex items-center gap-3"
                aria-label={`${step.label} — ${statusLabels[step.status]}`}
              >
                <span aria-hidden="true">{statusIcons[step.status]}</span>
                <span className="text-sm font-medium text-text-primary dark:text-white flex-1">
                  {step.label}
                </span>
                <span className={`text-xs font-medium ${statusTextColors[step.status]}`}>
                  {statusLabels[step.status]}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <button
            onClick={() => onOpenCase(caseRecord.id)}
            className="w-full text-center py-3 text-sm text-text-muted hover:text-electric-indigo transition-colors"
          >
            Case in progress — tap to continue
          </button>
        )}
      </div>
    </div>
  );
};
