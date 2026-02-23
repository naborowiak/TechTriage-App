import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, ChevronLeft, ChevronRight, RefreshCw, ArrowUpDown, Inbox, AlertTriangle, Clock, CheckCircle2, User, ArrowUpCircle, Trash2, Loader2, X } from 'lucide-react';
import { useAgentApi } from '../../hooks/useAgentApi';
import { DeletedCases } from './DeletedCases';
import type { AgentCaseListItem, AgentCaseListResponse, AgentRosterItem } from '../../types';

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

const STATUS_OPTIONS = ['open', 'resolved', 'escalated', 'pending'] as const;
const PRIORITY_OPTIONS = ['critical', 'high', 'medium', 'low'] as const;

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
  return `${obj.firstName || ''} ${obj.lastName || ''}`.trim() || '\u2014';
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
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
  isAdmin?: boolean;
}

export const CaseQueue: React.FC<Props> = ({ onSelectCase, onSelectCustomer, currentUserId, initialCategory, initialSearch, isAdmin }) => {
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

  // ── Inline editing state ──────────────────────────────────
  const [editingCell, setEditingCell] = useState<{ caseId: string; field: 'status' | 'priority' | 'assignedAgent' } | null>(null);
  const [isCellSaving, setIsCellSaving] = useState(false);
  const [cellError, setCellError] = useState<{ caseId: string; field: string; message: string } | null>(null);
  const [agents, setAgents] = useState<AgentRosterItem[]>([]);

  // ── Selection state (admin-only) ──────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const confirmCancelRef = useRef<HTMLButtonElement>(null);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);

  // Fetch agent roster for assignment dropdown
  useEffect(() => {
    api.fetchAgents().then(r => setAgents(r.agents)).catch(() => {});
  }, []);

  // Clear selection when page/filter/search changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [activeCategory, search, sortBy, sortOrder, pagination.page]);

  // Auto-dismiss cell error after 3s
  useEffect(() => {
    if (cellError) {
      const t = setTimeout(() => setCellError(null), 3000);
      return () => clearTimeout(t);
    }
  }, [cellError]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const duration = toastMessage.type === 'error' ? 6000 : 4000;
      const t = setTimeout(() => setToastMessage(null), duration);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

  // Focus trap for confirmation dialog
  useEffect(() => {
    if (showBulkDeleteConfirm && confirmCancelRef.current) {
      confirmCancelRef.current.focus();
    }
  }, [showBulkDeleteConfirm]);

  // Escape key to close confirmation dialog
  useEffect(() => {
    if (!showBulkDeleteConfirm) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isBulkDeleting) {
        setShowBulkDeleteConfirm(false);
        deleteButtonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [showBulkDeleteConfirm, isBulkDeleting]);

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
    ...(isAdmin ? [{ id: 'deleted', label: 'Deleted', icon: Trash2, filter: {} } as FilterCategory] : []),
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

  // ── Inline edit handlers ──────────────────────────────────

  const handleInlineEdit = async (caseId: string, field: 'status' | 'priority' | 'assignedAgent', value: string) => {
    setIsCellSaving(true);
    setCellError(null);

    // Capture current state for rollback
    const originalCase = cases.find(c => c.id === caseId);
    if (!originalCase) { setIsCellSaving(false); return; }

    // Optimistic update
    setCases(prev => prev.map(c => {
      if (c.id !== caseId) return c;
      if (field === 'status') return { ...c, status: value };
      if (field === 'priority') return { ...c, priority: value };
      if (field === 'assignedAgent') {
        if (value === '__unassign__') return { ...c, assignedAgent: null };
        const agent = agents.find(a => a.id === value);
        return { ...c, assignedAgent: agent ? { id: agent.id, firstName: agent.firstName, lastName: agent.lastName } : null };
      }
      return c;
    }));

    setEditingCell(null);

    try {
      if (field === 'status' || field === 'priority') {
        await api.updateCase(caseId, { [field]: value });
      } else if (field === 'assignedAgent') {
        if (value === '__unassign__') {
          await api.unassignCase(caseId);
        } else {
          await api.assignCase(caseId, value);
        }
      }
    } catch (err: any) {
      // Revert optimistic update
      setCases(prev => prev.map(c => c.id === caseId ? originalCase : c));
      setCellError({ caseId, field, message: err.message || 'Update failed' });
    } finally {
      setIsCellSaving(false);
    }
  };

  // ── Selection handlers (admin-only) ───────────────────────

  const handleToggleSelect = (caseId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(caseId)) next.delete(caseId);
      else next.add(caseId);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (cases.length > 0 && cases.every(c => selectedIds.has(c.id))) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(cases.map(c => c.id)));
    }
  };

  const handleClearSelection = () => setSelectedIds(new Set());

  const executeBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      const result = await api.bulkDeleteCases([...selectedIds]);
      // Remove successfully deleted cases from local state
      const deletedIds = new Set(result.results.filter(r => r.success).map(r => r.caseId));
      setCases(prev => prev.filter(c => !deletedIds.has(c.id)));
      setPagination(prev => ({ ...prev, total: prev.total - result.deleted }));
      setSelectedIds(new Set());
      setShowBulkDeleteConfirm(false);

      if (result.failed > 0) {
        setToastMessage({ text: `${result.deleted} deleted, ${result.failed} failed`, type: 'error' });
      } else {
        setToastMessage({ text: `${result.deleted} case${result.deleted > 1 ? 's' : ''} deleted`, type: 'success' });
      }
    } catch (err: any) {
      setToastMessage({ text: err.message || 'Bulk delete failed', type: 'error' });
      setShowBulkDeleteConfirm(false);
    } finally {
      setIsBulkDeleting(false);
      deleteButtonRef.current?.focus();
    }
  };

  const colCount = isAdmin ? 8 : 7;

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
              &times;
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

        {/* Data table or Deleted Cases view */}
        {activeCategory === 'deleted' ? (
          <DeletedCases />
        ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Bulk action bar (admin-only, when items selected) */}
          {isAdmin && selectedIds.size > 0 && (
            <div className="px-5 py-2.5 bg-[#4F52BD]/5 dark:bg-[#4F52BD]/10 border-b border-[#4F52BD]/20 flex items-center gap-3 shrink-0">
              <span className="text-sm font-medium text-[#4F52BD] dark:text-indigo-400">
                {selectedIds.size} case{selectedIds.size > 1 ? 's' : ''} selected
              </span>
              <button
                ref={deleteButtonRef}
                onClick={() => setShowBulkDeleteConfirm(true)}
                disabled={isBulkDeleting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label={`Delete ${selectedIds.size} selected cases`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Selected
              </button>
              <button
                onClick={handleClearSelection}
                className="text-xs text-[#4F5664] dark:text-gray-400 hover:underline"
              >
                Clear selection
              </button>
              {isBulkDeleting && <Loader2 className="w-4 h-4 animate-spin text-[#4F52BD]" />}
            </div>
          )}

          {/* Toast message */}
          {toastMessage && (
            <div
              className={`mx-4 mt-3 p-3 rounded-lg text-sm flex items-center justify-between ${
                toastMessage.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
              }`}
              role="status"
              aria-live="polite"
            >
              <span>{toastMessage.text}</span>
              <button onClick={() => setToastMessage(null)} className="ml-2 p-0.5 hover:opacity-70" aria-label="Dismiss">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

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
                  {/* Checkbox column (admin-only) */}
                  {isAdmin && (
                    <th scope="col" className="w-10 px-2 py-3">
                      <input
                        type="checkbox"
                        checked={cases.length > 0 && cases.every(c => selectedIds.has(c.id))}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-[#4F52BD] focus:ring-[#4F52BD] cursor-pointer"
                        aria-label="Select all cases on this page"
                      />
                    </th>
                  )}
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
                      {Array.from({ length: colCount }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" style={{ width: `${40 + Math.random() * 60}%` }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : cases.length === 0 ? (
                  <tr>
                    <td colSpan={colCount} className="px-4 py-16 text-center text-[#4F5664] dark:text-gray-400">
                      <Inbox className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="font-medium">
                        {search || activeCategory !== 'all'
                          ? 'No cases match your filters'
                          : 'No cases found'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  cases.map((c) => {
                    const isSelected = selectedIds.has(c.id);
                    const hasCellError = cellError?.caseId === c.id;

                    return (
                      <tr
                        key={c.id}
                        onClick={() => onSelectCase(c.id)}
                        className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 cursor-pointer transition-colors h-11 ${
                          isSelected ? 'bg-[#4F52BD]/5 dark:bg-[#4F52BD]/10' : ''
                        }`}
                      >
                        {/* Checkbox (admin-only) */}
                        {isAdmin && (
                          <td className="w-10 px-2 py-2" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelect(c.id)}
                              className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-[#4F52BD] focus:ring-[#4F52BD] cursor-pointer"
                              aria-label={`Select case ${c.caseNumber ? 'CS' + String(c.caseNumber).padStart(7, '0') : c.title}`}
                            />
                          </td>
                        )}

                        {/* Case number */}
                        <td className="px-4 py-2 font-mono text-xs">
                          <span className="text-[#2469FF] dark:text-blue-400 font-medium">{c.caseNumber ? `CS${String(c.caseNumber).padStart(7, '0')}` : '\u2014'}</span>
                        </td>

                        {/* Title */}
                        <td className="px-4 py-2 text-[#37444A] dark:text-gray-200 max-w-[300px] truncate font-medium">
                          {c.title}
                        </td>

                        {/* Customer */}
                        <td className="px-4 py-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); onSelectCustomer(c.customer.id); }}
                            className="text-[#2469FF] dark:text-blue-400 hover:underline text-left truncate max-w-[150px] block font-medium"
                          >
                            {fullName(c.customer)}
                          </button>
                        </td>

                        {/* Status — inline editable */}
                        <td
                          className="px-4 py-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isCellSaving) setEditingCell({ caseId: c.id, field: 'status' });
                          }}
                        >
                          {editingCell?.caseId === c.id && editingCell.field === 'status' ? (
                            <select
                              autoFocus
                              value={c.status}
                              onChange={(e) => handleInlineEdit(c.id, 'status', e.target.value)}
                              onBlur={() => setEditingCell(null)}
                              onKeyDown={(e) => { if (e.key === 'Escape') setEditingCell(null); }}
                              disabled={isCellSaving}
                              className="text-xs px-2 py-1 border border-[#4F52BD] rounded bg-white dark:bg-[#10171A] text-[#37444A] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#4F52BD]"
                              aria-label="Edit status"
                            >
                              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{capitalize(s)}</option>)}
                            </select>
                          ) : (
                            <button
                              tabIndex={0}
                              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setEditingCell({ caseId: c.id, field: 'status' }); } }}
                              className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded cursor-pointer hover:ring-2 hover:ring-[#4F52BD]/30 transition-shadow ${
                                hasCellError && cellError.field === 'status'
                                  ? 'ring-2 ring-red-400 animate-pulse'
                                  : ''
                              } ${statusHighlight[c.status] || 'bg-gray-100 text-gray-600'}`}
                              aria-label={`Status: ${capitalize(c.status)}. Click to edit.`}
                            >
                              {capitalize(c.status)}
                            </button>
                          )}
                        </td>

                        {/* Priority — inline editable */}
                        <td
                          className="px-4 py-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isCellSaving) setEditingCell({ caseId: c.id, field: 'priority' });
                          }}
                        >
                          {editingCell?.caseId === c.id && editingCell.field === 'priority' ? (
                            <select
                              autoFocus
                              value={c.priority || 'medium'}
                              onChange={(e) => handleInlineEdit(c.id, 'priority', e.target.value)}
                              onBlur={() => setEditingCell(null)}
                              onKeyDown={(e) => { if (e.key === 'Escape') setEditingCell(null); }}
                              disabled={isCellSaving}
                              className="text-xs px-2 py-1 border border-[#4F52BD] rounded bg-white dark:bg-[#10171A] text-[#37444A] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#4F52BD]"
                              aria-label="Edit priority"
                            >
                              {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{capitalize(p)}</option>)}
                            </select>
                          ) : (
                            <button
                              tabIndex={0}
                              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setEditingCell({ caseId: c.id, field: 'priority' }); } }}
                              className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded cursor-pointer hover:ring-2 hover:ring-[#4F52BD]/30 transition-shadow ${
                                hasCellError && cellError.field === 'priority'
                                  ? 'ring-2 ring-red-400 animate-pulse'
                                  : ''
                              } ${priorityHighlight[c.priority || 'medium'] || ''}`}
                              aria-label={`Priority: ${capitalize(c.priority || 'medium')}. Click to edit.`}
                            >
                              {capitalize(c.priority || 'medium')}
                            </button>
                          )}
                        </td>

                        {/* Assigned agent — inline editable */}
                        <td
                          className="px-4 py-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isCellSaving) setEditingCell({ caseId: c.id, field: 'assignedAgent' });
                          }}
                        >
                          {editingCell?.caseId === c.id && editingCell.field === 'assignedAgent' ? (
                            <select
                              autoFocus
                              value={c.assignedAgent?.id || '__unassign__'}
                              onChange={(e) => handleInlineEdit(c.id, 'assignedAgent', e.target.value)}
                              onBlur={() => setEditingCell(null)}
                              onKeyDown={(e) => { if (e.key === 'Escape') setEditingCell(null); }}
                              disabled={isCellSaving}
                              className="text-xs px-2 py-1 border border-[#4F52BD] rounded bg-white dark:bg-[#10171A] text-[#37444A] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#4F52BD] max-w-[150px]"
                              aria-label="Edit assigned agent"
                            >
                              <option value="__unassign__">Unassigned</option>
                              {agents.map(a => <option key={a.id} value={a.id}>{fullName(a)}</option>)}
                            </select>
                          ) : (
                            <button
                              tabIndex={0}
                              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setEditingCell({ caseId: c.id, field: 'assignedAgent' }); } }}
                              className={`text-xs truncate max-w-[130px] block cursor-pointer hover:ring-2 hover:ring-[#4F52BD]/30 rounded px-1 py-0.5 transition-shadow ${
                                hasCellError && cellError.field === 'assignedAgent'
                                  ? 'ring-2 ring-red-400 animate-pulse'
                                  : ''
                              } ${c.assignedAgent ? 'text-[#4F5664] dark:text-gray-400' : 'text-[#4F5664]/50 dark:text-gray-500 italic'}`}
                              aria-label={`Assigned to: ${c.assignedAgent ? fullName(c.assignedAgent) : 'Unassigned'}. Click to edit.`}
                            >
                              {c.assignedAgent ? fullName(c.assignedAgent) : 'Unassigned'}
                            </button>
                          )}
                        </td>

                        {/* Updated */}
                        <td className="px-4 py-2 text-[#4F5664] dark:text-gray-500 text-xs whitespace-nowrap">
                          {formatDate(c.updatedAt)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1A2025] flex items-center justify-between text-sm text-[#4F5664] dark:text-gray-400 shrink-0">
              <span className="text-xs">
                {((pagination.page - 1) * pagination.limit) + 1}&ndash;{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
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
        )}
      </div>

      {/* Bulk delete confirmation dialog (admin-only) */}
      {showBulkDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-label="Confirm bulk delete"
          onClick={(e) => { if (e.target === e.currentTarget && !isBulkDeleting) setShowBulkDeleteConfirm(false); }}
        >
          <div className="bg-white dark:bg-[#1A2025] rounded-xl shadow-xl p-6 max-w-sm mx-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-[#37444A] dark:text-white">
                Delete {selectedIds.size} case{selectedIds.size > 1 ? 's' : ''}?
              </h3>
            </div>
            <p className="text-sm text-[#4F5664] dark:text-gray-400 mb-5">
              Deleted cases can be recovered within 7 days from the Deleted category. After that, they are permanently removed.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                ref={confirmCancelRef}
                onClick={() => setShowBulkDeleteConfirm(false)}
                disabled={isBulkDeleting}
                className="px-4 py-2 rounded-lg text-sm font-medium text-[#4F5664] dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeBulkDelete}
                disabled={isBulkDeleting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isBulkDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
