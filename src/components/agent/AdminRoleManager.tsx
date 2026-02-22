import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { useAgentApi } from '../../hooks/useAgentApi';
import type { AgentRosterItem } from '../../types';

const roleHighlight: Record<string, string> = {
  admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  agent: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  customer: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const roleOptions = ['customer', 'agent', 'admin'] as const;

interface Props {
  currentUserId: string;
}

export const AdminRoleManager: React.FC<Props> = ({ currentUserId }) => {
  const api = useAgentApi();
  const [agents, setAgents] = useState<AgentRosterItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [changingId, setChangingId] = useState<string | null>(null);
  const [confirmChange, setConfirmChange] = useState<{ userId: string; newRole: string } | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchAgents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.fetchAgents();
      setAgents(data.agents);
    } catch (err: any) {
      setError(err.message || 'Failed to load agents');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchAgents(); }, [fetchAgents]);

  // Auto-dismiss feedback
  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 5000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  const handleRoleChange = async () => {
    if (!confirmChange) return;
    setChangingId(confirmChange.userId);
    try {
      await api.changeUserRole(confirmChange.userId, confirmChange.newRole);
      setFeedback({ type: 'success', message: `Role updated to ${confirmChange.newRole}` });
      setConfirmChange(null);
      fetchAgents();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to change role' });
    } finally {
      setChangingId(null);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Record header */}
      <div className="px-6 py-4 bg-white dark:bg-[#1A2025] border-b border-gray-200 dark:border-gray-800 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#4F52BD]/15 flex items-center justify-center">
              <Shield className="w-4 h-4 text-[#4F52BD] dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[#37444A] dark:text-white">User Role Management</h1>
              <p className="text-xs text-[#4F5664] dark:text-gray-500">Manage user roles. Changes take effect within 2 minutes.</p>
            </div>
          </div>
          <button onClick={fetchAgents} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-[#4F5664] dark:text-gray-400" aria-label="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* Feedback */}
        {feedback && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm ${feedback.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}
            role="alert"
          >
            {feedback.message}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 text-sm" role="alert">
            {error}
            <button onClick={fetchAgents} className="ml-3 underline text-xs font-medium">Retry</button>
          </div>
        )}

        {/* Confirm dialog */}
        {confirmChange && (
          <div className="mb-4 p-4 rounded-lg border-l-4 border-amber-400 bg-amber-50/50 dark:bg-amber-900/10" role="alertdialog" aria-label="Confirm role change">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-[#37444A] dark:text-gray-200">
                  Change role to <span className="font-bold">{confirmChange.newRole}</span>?
                </p>
                <p className="text-xs text-[#4F5664] dark:text-gray-400 mt-1">
                  This will change what this user can access in the system.
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleRoleChange}
                    disabled={!!changingId}
                    className="px-3 py-1.5 rounded-lg bg-[#4F52BD] text-white text-sm font-medium hover:bg-[#4345a0] disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {changingId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    Confirm
                  </button>
                  <button
                    onClick={() => setConfirmChange(null)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-[#4F5664] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Table — ServiceNow pattern */}
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F5F6F7] dark:bg-[#10171A] border-b border-gray-200 dark:border-gray-800">
                  <th scope="col" className="px-4 py-2.5 text-left text-[10px] font-semibold text-[#4F5664] dark:text-gray-500 uppercase tracking-wider">User</th>
                  <th scope="col" className="px-4 py-2.5 text-left text-[10px] font-semibold text-[#4F5664] dark:text-gray-500 uppercase tracking-wider">Email</th>
                  <th scope="col" className="px-4 py-2.5 text-left text-[10px] font-semibold text-[#4F5664] dark:text-gray-500 uppercase tracking-wider">Current Role</th>
                  <th scope="col" className="px-4 py-2.5 text-left text-[10px] font-semibold text-[#4F5664] dark:text-gray-500 uppercase tracking-wider">Change Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 4 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" style={{ width: `${50 + Math.random() * 40}%` }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : agents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-[#4F5664] dark:text-gray-400">
                      No users found
                    </td>
                  </tr>
                ) : (
                  agents.map((agent) => {
                    const isSelf = agent.id === currentUserId;
                    const name = `${agent.firstName || ''} ${agent.lastName || ''}`.trim() || '—';
                    return (
                      <tr key={agent.id} className={`h-11 transition-colors ${isSelf ? 'bg-[#4F52BD]/5' : 'hover:bg-gray-50 dark:hover:bg-gray-800/30'}`}>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#4F52BD]/15 flex items-center justify-center text-[10px] font-semibold text-[#4F52BD] dark:text-indigo-400">
                              {(agent.firstName?.[0] || agent.email?.[0] || '?').toUpperCase()}
                            </div>
                            <span className="font-medium text-[#37444A] dark:text-gray-200">{name}</span>
                            {isSelf && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#4F52BD]/10 text-[#4F52BD] dark:text-indigo-400 font-medium">You</span>}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-[#4F5664] dark:text-gray-400">{agent.email}</td>
                        <td className="px-4 py-2.5">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded ${roleHighlight[agent.role] || 'bg-gray-100 text-gray-600'}`}>
                            {agent.role.charAt(0).toUpperCase() + agent.role.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          {isSelf ? (
                            <span className="text-xs text-[#4F5664] dark:text-gray-500 italic">Cannot change own role</span>
                          ) : (
                            <select
                              value={agent.role}
                              onChange={(e) => {
                                if (e.target.value !== agent.role) {
                                  setConfirmChange({ userId: agent.id, newRole: e.target.value });
                                }
                              }}
                              disabled={!!changingId}
                              className="px-2 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-[#F5F6F7] dark:bg-[#10171A] text-[#37444A] dark:text-gray-300 focus:border-[#4F52BD] focus:outline-none disabled:opacity-50"
                              aria-label={`Change role for ${name}`}
                            >
                              {roleOptions.map((r) => (
                                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                              ))}
                            </select>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
