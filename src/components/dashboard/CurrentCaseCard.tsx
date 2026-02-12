import React from "react";
import {
  CheckCircle,
  Clock,
  Circle,
  ArrowRight,
  Loader2,
} from "lucide-react";
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
  completed: (
    <div className="w-6 h-6 rounded-full bg-emerald-500/15 flex items-center justify-center">
      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
    </div>
  ),
  suggested: (
    <div className="w-6 h-6 rounded-full bg-orange-400/15 flex items-center justify-center">
      <Circle className="w-3.5 h-3.5 text-orange-400" />
    </div>
  ),
  "in-progress": (
    <div className="w-6 h-6 rounded-full bg-blue-400/15 flex items-center justify-center">
      <Clock className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
    </div>
  ),
};

const statusLabels: Record<CaseProgressStep["status"], string> = {
  completed: "Completed",
  suggested: "Suggested",
  "in-progress": "In Progress",
};

const statusBadgeStyles: Record<CaseProgressStep["status"], string> = {
  completed:
    "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20",
  suggested:
    "bg-orange-400/10 text-orange-400 dark:text-orange-300 border-orange-400/20",
  "in-progress":
    "bg-blue-400/10 text-blue-400 dark:text-blue-300 border-blue-400/20",
};

export const CurrentCaseCard: React.FC<CurrentCaseCardProps> = ({
  caseRecord,
  steps,
  onOpenCase,
  isLoading,
}) => {
  if (!caseRecord) return null;

  const dateStr = new Date(
    caseRecord.updatedAt || caseRecord.createdAt,
  ).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div>
      <h2 className="text-lg font-bold text-text-primary dark:text-white mb-3">
        Current Case
      </h2>
      <div className="relative glass-card rounded-2xl p-4 sm:p-5 overflow-hidden">
        {/* Decorative gradient accent */}
        <div
          className="gradient-orb w-32 h-32 -top-10 -right-10"
          style={{ background: "linear-gradient(135deg, #6366F1, #06B6D4)" }}
        />

        {/* Case header */}
        <div className="relative flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-electric-indigo/10 dark:bg-electric-indigo/15 text-sm font-bold text-electric-indigo">
              {caseRecord.caseNumber ? `#${caseRecord.caseNumber}` : "Case"}
            </span>
            <span className="text-sm text-text-muted">{dateStr}</span>
          </div>
          <button
            onClick={() => onOpenCase(caseRecord.id)}
            className="flex items-center gap-1 text-sm font-semibold text-electric-indigo hover:text-electric-indigo/80 transition-colors min-h-[44px] group"
            aria-label={`Open case details for case ${caseRecord.caseNumber || ""}`}
          >
            <span className="hidden sm:inline">Open Case Details</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* Progress steps */}
        {isLoading ? (
          <div className="flex items-center gap-2 py-6 justify-center text-text-muted">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading progress...</span>
          </div>
        ) : steps.length > 0 ? (
          <div
            role="list"
            aria-label="Case progress steps"
            className="relative space-y-0"
          >
            {/* Vertical connector line */}
            <div className="absolute left-3 top-3 bottom-3 w-px bg-gradient-to-b from-emerald-500/30 via-blue-400/30 to-transparent" />

            {steps.map((step, idx) => (
              <div
                key={idx}
                role="listitem"
                className="relative flex items-center gap-3 py-2"
                aria-label={`${step.label} — ${statusLabels[step.status]}`}
              >
                <span className="relative z-10" aria-hidden="true">
                  {statusIcons[step.status]}
                </span>
                <span className="text-sm font-medium text-text-primary dark:text-white flex-1">
                  {step.label}
                </span>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusBadgeStyles[step.status]}`}
                >
                  {statusLabels[step.status]}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <button
            onClick={() => onOpenCase(caseRecord.id)}
            className="relative w-full text-center py-4 text-sm text-text-muted hover:text-electric-indigo transition-colors rounded-xl hover:bg-electric-indigo/5"
          >
            Case in progress — tap to continue
          </button>
        )}
      </div>
    </div>
  );
};
