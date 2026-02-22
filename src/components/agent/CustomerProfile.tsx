import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Mail, Phone, Home, Users, Wifi, Monitor, Loader2, RefreshCw } from 'lucide-react';
import { useAgentApi } from '../../hooks/useAgentApi';
import type { AgentCustomerProfile } from '../../types';

const statusHighlight: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  resolved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  escalated: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  pending: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface Props {
  userId: string;
  onBack: () => void;
  onSelectCase: (caseId: string) => void;
}

export const CustomerProfile: React.FC<Props> = ({ userId, onBack, onSelectCase }) => {
  const api = useAgentApi();
  const [data, setData] = useState<AgentCustomerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const profile = await api.fetchCustomer(userId);
      setData(profile);
    } catch (err: any) {
      setError(err.message || 'Failed to load customer profile');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[#4F52BD]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-[#4F5664] dark:text-gray-400 hover:text-[#37444A] dark:hover:text-gray-200">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm" role="alert">
          {error}
          <button onClick={fetchProfile} className="ml-3 underline text-xs font-medium">Retry</button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { customer, subscription, devices, caseStats, recentCases } = data;
  const fullName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Unknown';

  return (
    <div className="h-full flex flex-col">
      {/* Record header */}
      <div className="px-6 py-4 bg-white dark:bg-[#1A2025] border-b border-gray-200 dark:border-gray-800 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-[#4F5664] dark:text-gray-400" aria-label="Back to queue">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3">
              {customer.profileImageUrl ? (
                <img src={customer.profileImageUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#4F52BD]/15 flex items-center justify-center text-[#4F52BD] dark:text-indigo-400 font-semibold text-sm">
                  {(customer.firstName?.[0] || customer.email?.[0] || '?').toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-lg font-semibold text-[#37444A] dark:text-white">{fullName}</h1>
                <p className="text-xs text-[#4F5664] dark:text-gray-500">Member since {formatDate(customer.createdAt)}</p>
              </div>
            </div>
          </div>
          <button onClick={fetchProfile} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-[#4F5664] dark:text-gray-400" aria-label="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Contact pills row */}
        <div className="flex flex-wrap gap-2 mt-3 ml-9">
          {customer.email && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded bg-gray-100 text-[#37444A] dark:bg-gray-800 dark:text-gray-300">
              <Mail className="w-3 h-3" />{customer.email}
            </span>
          )}
          {customer.phone && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded bg-gray-100 text-[#37444A] dark:bg-gray-800 dark:text-gray-300">
              <Phone className="w-3 h-3" />{customer.phone}
            </span>
          )}
        </div>
      </div>

      {/* Content + Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main column */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Profile details — 2-column form fields */}
          <div>
            <h3 className="text-[10px] font-semibold text-[#4F5664] dark:text-gray-500 uppercase tracking-wider mb-3">Profile Details</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
              {customer.homeType && (
                <div>
                  <dt className="text-xs font-medium text-[#4F5664] dark:text-gray-500 mb-0.5">Home Type</dt>
                  <dd className="text-sm text-[#37444A] dark:text-gray-300 flex items-center gap-1"><Home className="w-3.5 h-3.5" />{customer.homeType}</dd>
                </div>
              )}
              {customer.techComfort && (
                <div>
                  <dt className="text-xs font-medium text-[#4F5664] dark:text-gray-500 mb-0.5">Tech Comfort</dt>
                  <dd className="text-sm text-[#37444A] dark:text-gray-300">{customer.techComfort}</dd>
                </div>
              )}
              {customer.householdSize && (
                <div>
                  <dt className="text-xs font-medium text-[#4F5664] dark:text-gray-500 mb-0.5">Household</dt>
                  <dd className="text-sm text-[#37444A] dark:text-gray-300 flex items-center gap-1"><Users className="w-3.5 h-3.5" />{customer.householdSize}</dd>
                </div>
              )}
            </div>
            {customer.primaryIssues && customer.primaryIssues.length > 0 && (
              <div className="mt-3">
                <dt className="text-xs font-medium text-[#4F5664] dark:text-gray-500 mb-1.5">Primary Issues</dt>
                <div className="flex flex-wrap gap-1.5">
                  {customer.primaryIssues.map((issue, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded bg-[#4F52BD]/10 text-[#4F52BD] dark:text-indigo-400">{issue}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Case stats */}
          <div>
            <h3 className="text-[10px] font-semibold text-[#4F5664] dark:text-gray-500 uppercase tracking-wider mb-3">Case Statistics</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label: 'Total', value: caseStats.total, bg: 'bg-gray-50 dark:bg-gray-800/30', text: 'text-[#37444A] dark:text-gray-200' },
                { label: 'Open', value: caseStats.open, bg: 'bg-blue-50 dark:bg-blue-900/10', text: 'text-blue-700 dark:text-blue-400' },
                { label: 'Resolved', value: caseStats.resolved, bg: 'bg-green-50 dark:bg-green-900/10', text: 'text-green-700 dark:text-green-400' },
                { label: 'Escalated', value: caseStats.escalated, bg: 'bg-orange-50 dark:bg-orange-900/10', text: 'text-orange-700 dark:text-orange-400' },
                { label: 'Pending', value: caseStats.pending, bg: 'bg-gray-50 dark:bg-gray-800/30', text: 'text-[#4F5664] dark:text-gray-400' },
              ].map((stat) => (
                <div key={stat.label} className={`rounded-lg p-3 ${stat.bg} text-center`}>
                  <p className={`text-2xl font-bold ${stat.text}`}>{stat.value}</p>
                  <p className="text-[10px] font-medium text-[#4F5664] dark:text-gray-500 uppercase tracking-wider mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent cases — ServiceNow table */}
          <div>
            <h3 className="text-[10px] font-semibold text-[#4F5664] dark:text-gray-500 uppercase tracking-wider mb-3">Recent Cases</h3>
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
              {recentCases.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-[#4F5664] dark:text-gray-400">No cases found</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#F5F6F7] dark:bg-[#10171A] border-b border-gray-200 dark:border-gray-800">
                      <th scope="col" className="px-4 py-2.5 text-left text-[10px] font-semibold text-[#4F5664] dark:text-gray-500 uppercase tracking-wider">Case #</th>
                      <th scope="col" className="px-4 py-2.5 text-left text-[10px] font-semibold text-[#4F5664] dark:text-gray-500 uppercase tracking-wider">Title</th>
                      <th scope="col" className="px-4 py-2.5 text-left text-[10px] font-semibold text-[#4F5664] dark:text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-4 py-2.5 text-left text-[10px] font-semibold text-[#4F5664] dark:text-gray-500 uppercase tracking-wider">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {recentCases.map((c) => (
                      <tr
                        key={c.id}
                        onClick={() => onSelectCase(c.id)}
                        className="h-11 hover:bg-gray-50 dark:hover:bg-gray-800/30 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-2.5">
                          <span className="text-[#2469FF] dark:text-blue-400 font-mono text-xs font-medium">
                            {c.caseNumber ? `CS${String(c.caseNumber).padStart(7, '0')}` : '#—'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-medium text-[#37444A] dark:text-gray-200 truncate max-w-[200px]">{c.title}</td>
                        <td className="px-4 py-2.5">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded ${statusHighlight[c.status] || 'bg-gray-100 text-gray-600'}`}>
                            {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-[#4F5664] dark:text-gray-500 text-xs whitespace-nowrap">{formatDate(c.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Right sidebar — contextual panel */}
        <aside className="w-80 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1A2025] overflow-auto shrink-0 hidden lg:block">
          <div className="p-4 space-y-4">
            {/* Subscription */}
            <div>
              <h3 className="text-[10px] font-semibold text-[#4F5664] dark:text-gray-500 uppercase tracking-wider mb-2">Subscription</h3>
              {subscription ? (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      subscription.tier === 'pro' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                      : subscription.tier === 'home' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {subscription.tier.toUpperCase()}
                    </span>
                    <span className={`text-xs capitalize ${subscription.status === 'active' ? 'text-green-600 dark:text-green-400' : 'text-[#4F5664] dark:text-gray-400'}`}>
                      {subscription.status}
                    </span>
                  </div>
                  {subscription.billingInterval && (
                    <div className="flex justify-between">
                      <span className="text-xs text-[#4F5664] dark:text-gray-500">Billing</span>
                      <span className="text-xs text-[#37444A] dark:text-gray-300 capitalize">{subscription.billingInterval}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-xs text-[#4F5664] dark:text-gray-500">Video Credits</span>
                    <span className="text-xs text-[#37444A] dark:text-gray-300">{subscription.videoCredits}</span>
                  </div>
                  {subscription.currentPeriodEnd && (
                    <div className="flex justify-between">
                      <span className="text-xs text-[#4F5664] dark:text-gray-500">Renews</span>
                      <span className="text-xs text-[#37444A] dark:text-gray-300">{formatDate(subscription.currentPeriodEnd)}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-[#4F5664] dark:text-gray-400">No subscription</p>
              )}
            </div>

            {/* Devices */}
            <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
              <h3 className="text-[10px] font-semibold text-[#4F5664] dark:text-gray-500 uppercase tracking-wider mb-2">
                Devices ({devices.length})
              </h3>
              {devices.length === 0 ? (
                <p className="text-xs text-[#4F5664] dark:text-gray-400">No devices registered</p>
              ) : (
                <div className="space-y-2.5">
                  {devices.map((d) => (
                    <div key={d.id} className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#F5F6F7] dark:bg-gray-800 flex items-center justify-center shrink-0">
                        {d.type === 'router' || d.type === 'modem' ? <Wifi className="w-3.5 h-3.5 text-[#4F5664] dark:text-gray-400" /> : <Monitor className="w-3.5 h-3.5 text-[#4F5664] dark:text-gray-400" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[#37444A] dark:text-gray-300 truncate">{d.name}</p>
                        <p className="text-[10px] text-[#4F5664] dark:text-gray-500">
                          {[d.brand, d.model, d.location].filter(Boolean).join(' · ') || d.type}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
