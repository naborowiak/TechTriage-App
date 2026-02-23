import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowRight,
  Download,
  Mail,
  Loader2,
  FileText,
} from "lucide-react";
import { LoadingScreen } from "../LoadingScreen";
import { formatCaseDisplayId } from "../../types";

interface Case {
  id: string;
  caseNumber?: number | null;
  modeSequence?: number | null;
  title: string;
  status: string;
  sessionMode?: string | null;
  deviceId?: string | null;
  createdAt: string;
  updatedAt?: string;
  aiSummary?: string;
}

interface SessionHistoryViewProps {
  onOpenCase: (caseId: string) => void;
  userId?: string;
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
    label: string;
    dotColor: string;
    bgColor: string;
    textColor: string;
  }
> = {
  open: {
    icon: <Clock className="w-3 h-3" />,
    label: "Open",
    dotColor: "text-blue-400",
    bgColor: "bg-blue-400/15",
    textColor: "text-blue-600 dark:text-blue-400",
  },
  pending: {
    icon: <Clock className="w-3 h-3" />,
    label: "Pending",
    dotColor: "text-amber-400",
    bgColor: "bg-amber-400/15",
    textColor: "text-amber-600 dark:text-amber-400",
  },
  resolved: {
    icon: <CheckCircle className="w-3 h-3" />,
    label: "Closed",
    dotColor: "text-emerald-500",
    bgColor: "bg-emerald-500/15",
    textColor: "text-emerald-600 dark:text-emerald-500",
  },
  escalated: {
    icon: <AlertTriangle className="w-3 h-3" />,
    label: "Escalated",
    dotColor: "text-orange-400",
    bgColor: "bg-orange-400/15",
    textColor: "text-orange-600 dark:text-orange-400",
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
      a.download = `TotalAssist_Report_${new Date().toISOString().split("T")[0]}.pdf`;
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
    <div className="flex items-center gap-1 shrink-0">
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDownload();
        }}
        disabled={downloading}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-text-secondary dark:text-white/60 hover:text-text-primary dark:hover:text-white hover:bg-light-200/80 dark:hover:bg-midnight-600/50 transition-all disabled:opacity-50"
        aria-label="Download PDF report"
      >
        {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleEmail();
        }}
        disabled={emailing || emailSent}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-text-secondary dark:text-white/60 hover:text-text-primary dark:hover:text-white hover:bg-light-200/80 dark:hover:bg-midnight-600/50 transition-all disabled:opacity-50"
        aria-label={emailSent ? "Email sent" : "Email PDF report"}
      >
        {emailSent ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : emailing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

export const SessionHistoryView: React.FC<SessionHistoryViewProps> = ({
  onOpenCase,
  userId,
  userEmail,
}) => {
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Refetch on every mount (component unmounts/remounts on tab switch)
  const [fetchKey, setFetchKey] = useState(0);
  useEffect(() => {
    if (!userId) return;
    setIsLoading(true);
    fetch("/api/cases", { credentials: "include" })
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Failed");
      })
      .then((data) => {
        if (Array.isArray(data)) setCases(data);
      })
      .catch((err) => console.error("Failed to load cases:", err))
      .finally(() => setIsLoading(false));
  }, [userId, fetchKey]);

  // Listen for case updates (resolved, created) and refetch
  useEffect(() => {
    const handler = () => setFetchKey((k) => k + 1);
    window.addEventListener("case-resolved", handler);
    window.addEventListener("case-created", handler);
    return () => {
      window.removeEventListener("case-resolved", handler);
      window.removeEventListener("case-created", handler);
    };
  }, []);

  const currentCases = cases.filter((c) => c.status === "open" || c.status === "pending");
  const historyCases = cases.filter((c) => c.status !== "open" && c.status !== "pending");

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <LoadingScreen size="sm" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        <h1 className="text-2xl font-bold text-text-primary dark:text-white">
          Session History
        </h1>

        {/* Current Cases */}
        {currentCases.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-text-secondary dark:text-white/60 uppercase tracking-wider mb-3">
              Current Cases
            </h2>
            <div className="card-clean rounded-2xl divide-y divide-light-200/80 dark:divide-white/[0.04] overflow-hidden">
              {currentCases.map((c) => {
                const status = statusConfig[c.status] || statusConfig.open;
                const displayId = formatCaseDisplayId(c.sessionMode, c.modeSequence);
                return (
                  <button
                    key={c.id}
                    onClick={() => onOpenCase(c.id)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-light-100/60 dark:hover:bg-white/[0.03] transition-all text-left min-h-[52px] group overflow-hidden"
                  >
                    <span
                      className={`shrink-0 w-7 h-7 rounded-lg ${status.bgColor} ${status.dotColor} flex items-center justify-center`}
                      aria-hidden="true"
                    >
                      {status.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-text-secondary dark:text-white/50">
                          {displayId}
                        </span>
                        <span className={`text-xs font-semibold ${status.textColor}`}>
                          {status.label}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-text-primary dark:text-white truncate block group-hover:text-electric-indigo transition-colors">
                        {c.title}
                      </span>
                    </div>
                    <span className="text-xs text-text-secondary dark:text-white/60 shrink-0 tabular-nums">
                      {relativeTime(c.updatedAt || c.createdAt)}
                    </span>
                    <ArrowRight className="w-4 h-4 text-text-secondary/40 shrink-0 opacity-0 group-hover:opacity-100 transition-all" />
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* History */}
        <section>
          <h2 className="text-sm font-semibold text-text-secondary dark:text-white/60 uppercase tracking-wider mb-3">
            History
          </h2>
          {historyCases.length === 0 ? (
            <div className="card-clean rounded-2xl p-8 text-center">
              <FileText className="w-10 h-10 text-text-muted mx-auto mb-3" />
              <p className="text-sm text-text-secondary dark:text-white/60">
                No resolved cases yet. Your completed support sessions will appear here.
              </p>
            </div>
          ) : (
            <div className="card-clean rounded-2xl divide-y divide-light-200/80 dark:divide-white/[0.04] overflow-hidden">
              {historyCases.map((c) => {
                const status = statusConfig[c.status] || statusConfig.resolved;
                const displayId = formatCaseDisplayId(c.sessionMode, c.modeSequence);
                return (
                  <button
                    key={c.id}
                    onClick={() => onOpenCase(c.id)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-light-100/60 dark:hover:bg-white/[0.03] transition-all text-left min-h-[52px] group overflow-hidden"
                  >
                    <span
                      className={`shrink-0 w-7 h-7 rounded-lg ${status.bgColor} ${status.dotColor} flex items-center justify-center`}
                      aria-hidden="true"
                    >
                      {status.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-text-secondary dark:text-white/50">
                          {displayId}
                        </span>
                        <span className={`text-xs font-semibold ${status.textColor}`}>
                          {status.label}
                        </span>
                      </div>
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
                    <ArrowRight className="w-4 h-4 text-text-secondary/40 shrink-0 opacity-0 group-hover:opacity-100 transition-all" />
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {cases.length === 0 && (
          <div className="card-clean rounded-2xl p-8 text-center">
            <FileText className="w-10 h-10 text-text-muted mx-auto mb-3" />
            <p className="text-sm text-text-secondary dark:text-white/60">
              No support cases yet. Start a chat to get help with your tech issues.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
