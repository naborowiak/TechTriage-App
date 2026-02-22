import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, ChevronLeft, ChevronRight, RefreshCw, ArrowUpDown, Inbox, AlertTriangle, Clock, CheckCircle2, User, ArrowUpCircle } from 'lucide-react';
import { useAgentApi } from '../../hooks/useAgentApi';
import type { AgentCaseListItem, AgentCaseListResponse } from '../../types';

// ServiceNow Polaris-inspired highlighted value colors
const statusHighlight: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  resolved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  escalated: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  pending: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

const priorityHighlight: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fullName(obj: { firstName: string | null; lastName: string | null } | null): string {
  if (!obj) return '';
  return `${obj.firstName || ''} ${obj.lastName || ''}`.trim() || '—';
}

interface FilterCategory {
  id: string;
  label: string;
  icon: React.ElementType;
  filter: Record<string, string>;
}

interface Props {
  onSelectCase: (caseId: string) => void;
  onSelectCustomer: (userId: string) => void;
  currentUserId: string;
  initialCategory?: string;
  initialSearch?: string;
}

export const CaseQueue: React.FC<Props> = ({ onSelectCase, onSelectCustomer, currentUserId, initialCategory, initialSearch }) => {
  const api = useAgentApi();

  const [cases, setCases] = useState<AgentCaseListItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeCategory, setActiveCategory] = useState(initialCategory || 'all');
  const [search, setSearch] = useState(initialSearch || '');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const committedSearch = useRef(search);
  const fetchIdRef = useRef(0); // prevent stale results

  // Apply initialCategory/initialSearch when they change from parent
  useEffect(() => {
    if (initialCategory !== undefined) {
      setActiveCategory(initialCategory);
    }
  }, [initialCategory]);

  useEffect(() => {
    if (initialSearch !== undefined) {
      setSearch(initialSearch);
      committedSearch.current = initialSearch;
    }
  }, [initialSearch]);

  // Filter categories (ServiceNow-style predefined list categories)
  const categories: FilterCategory[] = [
    { id: 'all', label: 'All Cases', icon: Inbox, filter: {} },
    { id: 'my', label: 'My Cases', icon: User, filter: { assignedAgentId: currentUserId } },
    { id: 'escalated', label: 'Escalated', icon: ArrowUpCircle, filter: { status: 'escalated' } },
    { id: 'open', label: 'Open', icon: Clock, filter: { status: 'open' } },
    { id: 'unassigned', label: 'Unassigned', icon: Inbox, filter: { assignedAgentId: 'unassigned' } },
    { id: 'critical', label: 'Critical / High', icon: AlertTriangle, filter: { priority: 'critical' } },
    { id: 'resolved', label: 'Resolved', icon: CheckCircle2, filter: { status: 'resolved' } },
  ];

  // Core fetch function — reads current state directly via refs/args
  const fetchCases = useCallback(async (page: number, category: string, searchTerm: string) => {
    const id = ++fetchIdRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const cat = categories.find(c => c.id === category);
      const params: Record<string, unknown> = {
        page,
        limit: 25,
        sortBy,
        sortOrder,
        ...cat?.filter,
      };
      if (searchTerm) params.search = searchTerm;

      const data: AgentCaseListResponse = await api.fetchCases(params);
      // Only apply if this is still the latest request
      if (id === fetchIdRef.current) {
        setCases(data.cases);
        setPagination(data.pagination);
      }
    } catch (err: any) {
      if (id === fetchIdRef.current) {
        setError(err.message || 'Failed to load cases');
      }
    } finally {
      if (id === fetchIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [sortBy, sortOrder]);

  // Debounced search — when user types in the search box
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      committedSearch.current = search;
      fetchCases(1, activeCategory, search);
    }, 300);
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [search, activeCategory, fetchCases]);

  // Re-fetch on category or sort changes (immediate, no debounce)
  useEffect(() => {
    committedSearch.current = search;
    fetchCases(1, activeCategory, search);
  }, [activeCategory, sortBy, sortOrder]);

  const toggleSort = (col: string) => {
    if (sortBy === col) setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortOrder('desc'); }
  };

  const handlePageChange = (page: number) => {
    fetchCases(page, activeCategory, committedSearch.current);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Search bar */}
      <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1A2025] flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4F5664] dark:text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by case #, title, customer name, email..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-[#F5F6F7] dark:bg-[#10171A] text-[#37444A] dark:text-white placeholder-[#4F5664] dark:placeholder-gray-500 focus:border-[#4F52BD] focus:outline-none"
            aria-label="Search cases"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4F5664] dark:text-gray-500 hover:text-[#37444A] dark:hover:text-gray-300"
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
        <button
          onClick={() => fetchCases(pagination.page, activeCategory, committedSearch.current)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-[#4F5664] dark:text-gray-400"
          aria-label="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Content: sidebar + table */}
      <div className="flex flex-1 overflow-hidden">
        {/* Filter sidebar — ServiceNow list categories */}
        <aside className="w-52 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1A2025] py-2 overflow-y-auto shrink-0 hidden md:block">
          <div className="px-3 py-2">
            <h3 className="text-[10px] font-semibold text-[#4F5664] dark:text-gray-500 uppercase tracking-wider">Categories</h3>
          </div>
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-[#4F52BD]/10 text-[#4F52BD] dark:text-indigo-400 border-l-[3px] border-[#4F52BD]'
                    : 'text-[#4F5664] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 border-l-[3px] border-transparent'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate font-medium">{cat.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Mobile filter: select dropdown */}
        <div className="md:hidden px-4 py-2 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1A2025]">
          <select
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-[#F5F6F7] dark:bg-[#10171A] text-[#37444A] dark:text-white"
            aria-label="Filter category"
          >
            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
          </select>
        </div>

        {/* Data table */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Error */}
          {error && (
            <div className="mx-4 mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm flex items-center justify-between" role="alert">
              <span>{error}</span>
              <button onClick={() => fetchCases(pagination.page, activeCategory, committedSearch.current)} className="text-xs font-medium underline">Retry</button>
            </div>
          )}

          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#F5F6F7] dark:bg-[#10171A] border-b border-gray-200 dark:border-gray-800">
                  <th scope="col" className="px-4 py-3 text-left font-medium text-[#4F5664] dark:text-gray-500 text-xs uppercase tracking-wider">Number</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium text-[#4F5664] dark:text-gray-500 text-xs uppercase tracking-wider">Description</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium text-[#4F5664] dark:text-gray-500 text-xs uppercase tracking-wider">Customer</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium text-[#4F5664] dark:text-gray-500 text-xs uppercase tracking-wider">State</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium text-[#4F5664] dark:text-gray-500 text-xs uppercase tracking-wider">Priority</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium text-[#4F5664] dark:text-gray-500 text-xs uppercase tracking-wider">Assigned to</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium text-[#4F5664] dark:text-gray-500 text-xs uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort('updatedAt')}>
                    <span className="inline-flex items-center gap-1">Updated <ArrowUpDown className="w-3 h-3" /></span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#1A2025]">
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" style={{ width: `${40 + Math.random() * 60}%` }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : cases.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center text-[#4F5664] dark:text-gray-400">
                      <Inbox className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="font-medium">
                        {search || activeCategory !== 'all'
                          ? 'No cases match your filters'
                          : 'No cases found'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  cases.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => onSelectCase(c.id)}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 cursor-pointer transition-colors h-11"
                    >
                      <td className="px-4 py-2 font-mono text-xs">
                        <span className="text-[#2469FF] dark:text-blue-400 font-medium">{c.caseNumber ? `CS${String(c.caseNumber).padStart(7, '0')}` : '—'}</span>
                      </td>
                      <td className="px-4 py-2 text-[#37444A] dark:text-gray-200 max-w-[300px] truncate font-medium">
                        {c.title}
                      </td>
                      <td className="px-4 py-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); onSelectCustomer(c.customer.id); }}
                          className="text-[#2469FF] dark:text-blue-400 hover:underline text-left truncate max-w-[150px] block font-medium"
                        >
                          {fullName(c.customer)}
                        </button>
                      </td>
                      <td className="px-4 py-2">
                        <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded ${statusHighlight[c.status] || 'bg-gray-100 text-gray-600'}`}>
                          {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded ${priorityHighlight[c.priority || 'medium'] || ''}`}>
                          {(c.priority || 'medium').charAt(0).toUpperCase() + (c.priority || 'medium').slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-[#4F5664] dark:text-gray-400 text-xs truncate max-w-[130px]">
                        {c.assignedAgent ? fullName(c.assignedAgent) : <span className="italic opacity-50">Unassigned</span>}
                      </td>
                      <td className="px-4 py-2 text-[#4F5664] dark:text-gray-500 text-xs whitespace-nowrap">
                        {formatDate(c.updatedAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1A2025] flex items-center justify-between text-sm text-[#4F5664] dark:text-gray-400 shrink-0">
              <span className="text-xs">
                {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs">Page {pagination.page} of {pagination.totalPages}</span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
