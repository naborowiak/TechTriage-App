import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, BarChart3, TrendingUp, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

interface CaseData {
  id: string;
  title: string;
  status: string;
  sessionMode: string | null;
  createdAt: string;
  updatedAt: string;
  escalatedAt: string | null;
  deviceId: string | null;
}

interface CaseAnalyticsProps {
  embedded?: boolean;
  onBack?: () => void;
}

const COLORS = ['#6366F1', '#A855F7', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];

export const CaseAnalytics: React.FC<CaseAnalyticsProps> = ({ embedded = false, onBack }) => {
  const [cases, setCases] = useState<CaseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const res = await fetch('/api/cases', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch cases');
        const data = await res.json();
        setCases(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchCases();
  }, []);

  const metrics = useMemo(() => {
    const now = new Date();
    const thisMonth = cases.filter(c => {
      const d = new Date(c.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const lastMonth = cases.filter(c => {
      const d = new Date(c.createdAt);
      const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
    });

    const resolved = cases.filter(c => c.status === 'resolved').length;
    const escalated = cases.filter(c => c.status === 'escalated').length;
    const resolutionRate = cases.length > 0 ? Math.round((resolved / cases.length) * 100) : 0;
    const escalationRate = cases.length > 0 ? Math.round((escalated / cases.length) * 100) : 0;

    const monthChange = lastMonth.length > 0
      ? Math.round(((thisMonth.length - lastMonth.length) / lastMonth.length) * 100)
      : thisMonth.length > 0 ? 100 : 0;

    return {
      total: cases.length,
      thisMonth: thisMonth.length,
      monthChange,
      resolutionRate,
      escalationRate,
      resolved,
      escalated,
    };
  }, [cases]);

  // Cases over time (last 6 months)
  const timelineData = useMemo(() => {
    const months: { name: string; cases: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = d.toLocaleDateString('en-US', { month: 'short' });
      const count = cases.filter(c => {
        const cd = new Date(c.createdAt);
        return cd.getMonth() === d.getMonth() && cd.getFullYear() === d.getFullYear();
      }).length;
      months.push({ name: monthName, cases: count });
    }
    return months;
  }, [cases]);

  // Cases by status
  const statusData = useMemo(() => {
    const statusMap: Record<string, number> = {};
    cases.forEach(c => {
      const s = c.status || 'open';
      statusMap[s] = (statusMap[s] || 0) + 1;
    });
    return Object.entries(statusMap).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  }, [cases]);

  // Cases by session mode
  const modeData = useMemo(() => {
    const modeMap: Record<string, number> = {};
    cases.forEach(c => {
      const m = c.sessionMode || 'chat';
      modeMap[m] = (modeMap[m] || 0) + 1;
    });
    return Object.entries(modeMap).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  }, [cases]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-electric-indigo" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        <AlertTriangle className="w-5 h-5 mr-2" />
        {error}
      </div>
    );
  }

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        {onBack && (
          <button onClick={onBack} className="p-2 hover:bg-light-100 dark:hover:bg-midnight-800 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-text-primary dark:text-white" />
          </button>
        )}
        <div>
          <h1 className="text-xl font-bold text-text-primary dark:text-white">Case Analytics</h1>
          <p className="text-sm text-text-muted">Overview of your support cases</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Cases"
          value={metrics.total}
          icon={<BarChart3 className="w-5 h-5" />}
          color="indigo"
        />
        <StatCard
          label="This Month"
          value={metrics.thisMonth}
          change={metrics.monthChange}
          icon={<TrendingUp className="w-5 h-5" />}
          color="cyan"
        />
        <StatCard
          label="Resolution Rate"
          value={`${metrics.resolutionRate}%`}
          icon={<CheckCircle className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          label="Escalation Rate"
          value={`${metrics.escalationRate}%`}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="amber"
        />
      </div>

      {/* Charts */}
      {cases.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cases Over Time */}
          <div className="bg-white dark:bg-midnight-800 rounded-2xl border border-light-300 dark:border-midnight-700 p-5">
            <h3 className="font-semibold text-text-primary dark:text-white mb-4">Cases Over Time</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-light-300 dark:text-midnight-700" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-bg, #fff)',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    fontSize: '13px',
                  }}
                />
                <Line type="monotone" dataKey="cases" stroke="#6366F1" strokeWidth={2} dot={{ fill: '#6366F1', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Cases by Status */}
          <div className="bg-white dark:bg-midnight-800 rounded-2xl border border-light-300 dark:border-midnight-700 p-5">
            <h3 className="font-semibold text-text-primary dark:text-white mb-4">Cases by Status</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-light-300 dark:text-midnight-700" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-bg, #fff)',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    fontSize: '13px',
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {statusData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Cases by Mode */}
          <div className="bg-white dark:bg-midnight-800 rounded-2xl border border-light-300 dark:border-midnight-700 p-5">
            <h3 className="font-semibold text-text-primary dark:text-white mb-4">Session Modes</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={modeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                  label={(props: any) => `${props.name || ''} ${((props.percent || 0) * 100).toFixed(0)}%`}
                >
                  {modeData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Summary Stats */}
          <div className="bg-white dark:bg-midnight-800 rounded-2xl border border-light-300 dark:border-midnight-700 p-5">
            <h3 className="font-semibold text-text-primary dark:text-white mb-4">Quick Summary</h3>
            <div className="space-y-3">
              <SummaryRow label="Resolved Cases" value={metrics.resolved} total={metrics.total} color="#10B981" />
              <SummaryRow label="Open Cases" value={cases.filter(c => c.status === 'open').length} total={metrics.total} color="#6366F1" />
              <SummaryRow label="Escalated Cases" value={metrics.escalated} total={metrics.total} color="#EF4444" />
              <SummaryRow label="Pending Cases" value={cases.filter(c => c.status === 'pending').length} total={metrics.total} color="#F59E0B" />
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-midnight-800 rounded-2xl border border-light-300 dark:border-midnight-700 p-12 text-center">
          <BarChart3 className="w-12 h-12 text-text-muted mx-auto mb-3" />
          <h3 className="font-semibold text-text-primary dark:text-white mb-1">No cases yet</h3>
          <p className="text-sm text-text-muted">Start a support session to see your analytics here.</p>
        </div>
      )}

      {/* Recent Cases Table */}
      {cases.length > 0 && (
        <div className="bg-white dark:bg-midnight-800 rounded-2xl border border-light-300 dark:border-midnight-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-light-200 dark:border-midnight-700">
            <h3 className="font-semibold text-text-primary dark:text-white">Recent Cases</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-light-200 dark:border-midnight-700">
                  <th className="text-left px-5 py-3 text-text-muted font-medium">Title</th>
                  <th className="text-left px-5 py-3 text-text-muted font-medium">Status</th>
                  <th className="text-left px-5 py-3 text-text-muted font-medium hidden sm:table-cell">Mode</th>
                  <th className="text-left px-5 py-3 text-text-muted font-medium hidden md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {cases.slice(0, 10).map((c) => (
                  <tr key={c.id} className="border-b border-light-100 dark:border-midnight-700/50 last:border-0">
                    <td className="px-5 py-3 text-text-primary dark:text-white font-medium truncate max-w-[200px]">
                      {c.title}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-5 py-3 text-text-muted capitalize hidden sm:table-cell">
                      {c.sessionMode || 'chat'}
                    </td>
                    <td className="px-5 py-3 text-text-muted hidden md:table-cell">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  if (embedded) {
    return <div className="max-w-5xl mx-auto">{content}</div>;
  }

  return (
    <div className="min-h-screen bg-light-100 dark:bg-midnight-950 p-6">
      <div className="max-w-5xl mx-auto">{content}</div>
    </div>
  );
};

// Sub-components

function StatCard({ label, value, change, icon, color }: {
  label: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: 'indigo' | 'cyan' | 'green' | 'amber';
}) {
  const colorMap = {
    indigo: 'bg-electric-indigo/10 text-electric-indigo',
    cyan: 'bg-cyan-500/10 text-cyan-500',
    green: 'bg-green-500/10 text-green-500',
    amber: 'bg-amber-500/10 text-amber-500',
  };

  return (
    <div className="bg-white dark:bg-midnight-800 rounded-2xl border border-light-300 dark:border-midnight-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
          {icon}
        </div>
        {change !== undefined && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            change >= 0 ? 'bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400'
          }`}>
            {change >= 0 ? '+' : ''}{change}%
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-text-primary dark:text-white">{value}</div>
      <div className="text-xs text-text-muted mt-1">{label}</div>
    </div>
  );
}

function SummaryRow({ label, value, total, color }: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-text-primary dark:text-white">{label}</span>
        <span className="text-sm font-medium text-text-primary dark:text-white">{value}</span>
      </div>
      <div className="h-2 bg-light-200 dark:bg-midnight-700 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    open: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
    resolved: 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400',
    escalated: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  };

  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[status] || styles.open}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
