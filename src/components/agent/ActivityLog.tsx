import React from 'react';
import { Clock, UserCheck, UserMinus, ArrowRightLeft, AlertTriangle, StickyNote, Trash2, Loader2 } from 'lucide-react';
import type { AgentActivityEntry } from '../../types';

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function actorName(actor: { firstName: string | null; lastName: string | null }): string {
  return `${actor.firstName || ''} ${actor.lastName || ''}`.trim() || 'System';
}

const actionConfig: Record<string, { icon: React.ReactNode; color: string; label: (d: any, action?: string) => string }> = {
  status_changed: {
    icon: <ArrowRightLeft className="w-3.5 h-3.5" />,
    color: 'text-amber-500 bg-amber-500/15',
    label: (d) => `changed status from ${d?.from || '?'} to ${d?.to || '?'}`,
  },
  priority_changed: {
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    color: 'text-orange-500 bg-orange-500/15',
    label: (d) => `changed priority from ${d?.from || '?'} to ${d?.to || '?'}`,
  },
  assigned: {
    icon: <UserCheck className="w-3.5 h-3.5" />,
    color: 'text-indigo-500 bg-indigo-500/15',
    label: (d) => `assigned case to ${d?.assignedToName || 'an agent'}`,
  },
  unassigned: {
    icon: <UserMinus className="w-3.5 h-3.5" />,
    color: 'text-gray-500 bg-gray-500/15',
    label: () => 'unassigned case',
  },
  note_added: {
    icon: <StickyNote className="w-3.5 h-3.5" />,
    color: 'text-cyan-500 bg-cyan-500/15',
    label: () => 'added an internal note',
  },
  note_deleted: {
    icon: <Trash2 className="w-3.5 h-3.5" />,
    color: 'text-red-400 bg-red-400/15',
    label: () => 'deleted an internal note',
  },
  created: {
    icon: <Clock className="w-3.5 h-3.5" />,
    color: 'text-emerald-500 bg-emerald-500/15',
    label: () => 'created the case',
  },
  escalated: {
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    color: 'text-red-500 bg-red-500/15',
    label: () => 'escalated the case',
  },
  resolved: {
    icon: <ArrowRightLeft className="w-3.5 h-3.5" />,
    color: 'text-emerald-500 bg-emerald-500/15',
    label: () => 'resolved the case',
  },
};

const defaultConfig = {
  icon: <Clock className="w-3.5 h-3.5" />,
  color: 'text-gray-400 bg-gray-400/15',
  label: (_d: any, action?: string) => `performed ${action || 'action'}`,
};

interface Props {
  activity: AgentActivityEntry[];
  isLoading?: boolean;
}

export const ActivityLog: React.FC<Props> = ({ activity, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  if (activity.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">
        No activity recorded
      </p>
    );
  }

  return (
    <div className="relative pl-6">
      {/* Vertical timeline line */}
      <div className="absolute left-[11px] top-2 bottom-2 w-px bg-light-200 dark:bg-midnight-700" aria-hidden="true" />

      <div className="space-y-4">
        {activity.map((entry) => {
          const cfg = actionConfig[entry.action] || defaultConfig;
          const labelText = cfg.label(entry.details, entry.action);

          return (
            <div key={entry.id} className="relative flex items-start gap-3">
              {/* Dot */}
              <div className={`absolute -left-6 w-[22px] h-[22px] rounded-full flex items-center justify-center ${cfg.color}`}>
                {cfg.icon}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-800 dark:text-gray-200">
                  <span className="font-medium">{actorName(entry.actor)}</span>{' '}
                  <span className="text-gray-600 dark:text-gray-400">{labelText}</span>
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {formatRelativeTime(entry.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
