import React, { useState } from "react";
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowRight,
  Download,
  Mail,
  Loader2,
} from "lucide-react";

interface Case {
  id: string;
  caseNumber?: number | null;
  title: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  aiSummary?: string;
}

interface HistoryListProps {
  cases: Case[];
  onOpenCase: (caseId: string) => void;
  onViewAll: () => void;
  userEmail?: string;
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return "yesterday";
  if (diffDay < 30) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

const statusConfig: Record<
  string,
  {
    icon: React.ReactNode;
    dotColor: string;
    bgColor: string;
  }
> = {
  open: {
    icon: <Clock className="w-3 h-3" />,
    dotColor: "text-blue-400",
    bgColor: "bg-blue-400/15",
  },
  resolved: {
    icon: <CheckCircle className="w-3 h-3" />,
    dotColor: "text-emerald-500",
    bgColor: "bg-emerald-500/15",
  },
  escalated: {
    icon: <AlertTriangle className="w-3 h-3" />,
    dotColor: "text-orange-400",
    bgColor: "bg-orange-400/15",
  },
};

function InlineReportActions({ caseId }: { caseId: string }) {
  const [downloading, setDownloading] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(
        `/api/cases/${caseId}/report?tz=${encodeURIComponent(tz)}`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error("Failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `TotalAssist_Case_Report_${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // silent
    } finally {
      setDownloading(false);
    }
  };

  const handleEmail = async () => {
    setEmailing(true);
    try {
      const res = await fetch(`/api/cases/${caseId}/report/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ tz }),
      });
      if (!res.ok) throw new Error("Failed");
      setEmailSent(true);
    } catch {
      // silent
    } finally {
      setEmailing(false);
    }
  };

  return (
    <div className="flex items-center gap-1 ml-auto shrink-0">
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDownload();
        }}
        disabled={downloading}
        className="w-9 h-9 flex items-center justify-center rounded-lg text-text-secondary dark:text-white/70 hover:text-text-primary dark:hover:text-white hover:bg-light-200/80 dark:hover:bg-midnight-600/50 transition-all disabled:opacity-50"
        aria-label="Download PDF report"
      >
        {downloading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleEmail();
        }}
        disabled={emailing || emailSent}
        className="w-9 h-9 flex items-center justify-center rounded-lg text-text-secondary dark:text-white/70 hover:text-text-primary dark:hover:text-white hover:bg-light-200/80 dark:hover:bg-midnight-600/50 transition-all disabled:opacity-50"
        aria-label={emailSent ? "Email sent" : "Email PDF report"}
      >
        {emailSent ? (
          <CheckCircle className="w-4 h-4 text-emerald-500" />
        ) : emailing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Mail className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}

export const HistoryList: React.FC<HistoryListProps> = ({
  cases,
  onOpenCase,
  onViewAll,
  userEmail,
}) => {
  const resolvedCases = cases.filter((c) => c.status !== "open");
  if (resolvedCases.length === 0) {
    return (
      <div>
        <h2 className="text-lg font-bold text-text-primary dark:text-white mb-3">
          History
        </h2>
        <div className="card-clean rounded-2xl p-6 text-center">
          <p className="text-sm text-text-secondary dark:text-white/70">
            No completed support requests yet. Your resolved cases will appear here.
          </p>
        </div>
      </div>
    );
  }

  const displayCases = resolvedCases.slice(0, 5);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-text-primary dark:text-white">
          History
        </h2>
        {resolvedCases.length > 5 && (
          <button
            onClick={onViewAll}
            className="text-sm font-semibold text-electric-indigo hover:text-electric-indigo/80 transition-colors min-h-[44px] flex items-center gap-1 group"
          >
            View all
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        )}
      </div>
      <div className="card-clean rounded-2xl divide-y divide-light-200/80 dark:divide-white/[0.04] overflow-hidden">
        {displayCases.map((c) => {
          const status = statusConfig[c.status] || statusConfig.open;
          return (
            <button
              key={c.id}
              onClick={() => onOpenCase(c.id)}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-light-100/60 dark:hover:bg-white/[0.03] transition-all text-left min-h-[52px] group"
            >
              {/* Status icon with colored background */}
              <span
                className={`shrink-0 w-7 h-7 rounded-lg ${status.bgColor} ${status.dotColor} flex items-center justify-center`}
                aria-hidden="true"
              >
                {status.icon}
              </span>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-text-primary dark:text-white truncate block group-hover:text-electric-indigo transition-colors">
                  {c.title}
                </span>
              </div>
              <span className="text-xs text-text-secondary dark:text-white/60 shrink-0 tabular-nums">
                {relativeTime(c.updatedAt || c.createdAt)}
              </span>
              {c.status === "resolved" && userEmail && (
                <InlineReportActions caseId={c.id} />
              )}
              <ArrowRight className="w-4 h-4 text-text-secondary/60 shrink-0 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5" />
            </button>
          );
        })}
      </div>
    </div>
  );
};
