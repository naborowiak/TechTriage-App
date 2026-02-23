import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RotateCcw, Search, Loader2, Archive, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAgentApi } from '../../hooks/useAgentApi';
import type { CaseArchiveListItem } from '../../types';

function fullName(obj: { firstName: string | null; lastName: string | null } | null): string {
  if (!obj) return '';
  return `${obj.firstName || ''} ${obj.lastName || ''}`.trim() || '--';
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function formatTimeRemaining(purgeAfter: string): string {
  const diff = new Date(purgeAfter).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days > 0) return `${days}d left`;
  const hrs = Math.floor(diff / (1000 * 60 * 60));
  if (hrs > 0) return `${hrs}h left`;
  const mins = Math.floor(diff / (1000 * 60));
  return `${mins}m left`;
}

interface Props {
  onBack?: () => void;
}

export const DeletedCases: React.FC<Props> = ({ onBack: _onBack }) => {
  const api = useAgentApi();

  const [archives, setArchives] = useState<CaseArchiveListItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const fetchIdRef = useRef(0);

  const fetchArchives = useCallback(async (page: number, searchTerm: string) => {
    const id = ++fetchIdRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { page, limit: 25 };
      if (searchTerm) params.search = searchTerm;
      const data = await api.fetchDeletedCases(params);
      if (id === fetchIdRef.current) {
        setArchives(data.archives);
        setPagination(data.pagination);
      }
    } catch (err: any) {
      if (id === fetchIdRef.current) {
        setError(err.message || 'Failed to load deleted cases');
      }
    } finally {
      if (id === fetchIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchArchives(1, search);
    }, 300);
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [search, fetchArchives]);

  const handleRestore = async (archiveId: string, title: string) => {
    setRestoringId(archiveId);
    try {
      await api.restoreCase(archiveId);
      setArchives(prev => prev.filter(a => a.id !== archiveId));
      setPagination(prev => ({ ...prev, total: prev.total - 1 }));
      setSuccessMsg(`"${title}" restored successfully`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(`Restore failed: ${err.message}`);
      setTimeout(() => setError(null), 4000);
    } finally {
      setRestoringId(null);
    }
  };

  const handlePageChange = (page: number) => {
    fetchArchives(page, search);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1A2025] flex items-center gap-3">
        <Archive className="w-5 h-5 text-[#4F5664] dark:text-gray-400" />
        <h2 className="text-sm font-semibold text-[#37444A] dark:text-white">
          Deleted Cases
          {!isLoading && (
            <span className="ml-2 text-xs font-normal text-[#4F5664] dark:text-gray-500">
              ({pagination.total})
            </span>
          )}
        </h2>
      </div>

      {/* Search */}
      <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1A2025]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4F5664] dark:text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search deleted cases..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-[#F5F6F7] dark:bg-[#10171A] text-[#37444A] dark:text-white placeholder-[#4F5664] dark:placeholder-gray-500 focus:border-[#4F52BD] focus:outline-none"
            aria-label="Search deleted cases"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4F5664] dark:text-gray-500 hover:text-[#37444A] dark:hover:text-gray-300"
              aria-label="Clear search"
            >
              x
            </button>
          )}
        </div>
      </div>

      {/* Status messages */}
      {successMsg && (
        <div className="mx-4 mt-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm" role="status" aria-live="polite">
          {successMsg}
        </div>
      )}
      {error && (
        <div className="mx-4 mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm flex items-center justify-between" role="alert">
          <span>{error}</span>
          <button onClick={() => fetchArchives(pagination.page, search)} className="text-xs font-medium underline">Retry</button>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#F5F6F7] dark:bg-[#10171A] border-b border-gray-200 dark:border-gray-800">
              <th scope="col" className="px-4 py-3 text-left font-medium text-[#4F5664] dark:text-gray-500 text-xs uppercase tracking-wider">Case #</th>
              <th scope="col" className="px-4 py-3 text-left font-medium text-[#4F5664] dark:text-gray-500 text-xs uppercase tracking-wider">Title</th>
              <th scope="col" className="px-4 py-3 text-left font-medium text-[#4F5664] dark:text-gray-500 text-xs uppercase tracking-wider">Deleted By</th>
              <th scope="col" className="px-4 py-3 text-left font-medium text-[#4F5664] dark:text-gray-500 text-xs uppercase tracking-wider">Deleted At</th>
              <th scope="col" className="px-4 py-3 text-left font-medium text-[#4F5664] dark:text-gray-500 text-xs uppercase tracking-wider">Expires In</th>
              <th scope="col" className="px-4 py-3 text-right font-medium text-[#4F5664] dark:text-gray-500 text-xs uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-[#1A2025]">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" style={{ width: `${40 + Math.random() * 60}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : archives.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center text-[#4F5664] dark:text-gray-400">
                  <Archive className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="font-medium">No deleted cases</p>
                  {search && <p className="text-xs mt-1 opacity-60">Try adjusting your search</p>}
                </td>
              </tr>
            ) : (
              archives.map((archive) => {
                const isRestoring = restoringId === archive.id;
                const timeRemaining = formatTimeRemaining(archive.purgeAfter);
                const isExpiringSoon = new Date(archive.purgeAfter).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000;

                return (
                  <tr key={archive.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors h-11">
                    <td className="px-4 py-2 font-mono text-xs">
                      <span className="text-[#4F5664] dark:text-gray-400">
                        {archive.caseNumber ? `CS${String(archive.caseNumber).padStart(7, '0')}` : '--'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-[#37444A] dark:text-gray-200 max-w-[300px] truncate font-medium">
                      {archive.title}
                    </td>
                    <td className="px-4 py-2 text-[#4F5664] dark:text-gray-400 text-xs truncate max-w-[150px]">
                      {fullName(archive.deletedBy)}
                    </td>
                    <td className="px-4 py-2 text-[#4F5664] dark:text-gray-500 text-xs whitespace-nowrap">
                      {formatDate(archive.deletedAt)}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded ${
                        timeRemaining === 'Expired'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : isExpiringSoon
                            ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        {timeRemaining}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => handleRestore(archive.id, archive.title)}
                        disabled={isRestoring || timeRemaining === 'Expired'}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        aria-label={`Restore case ${archive.title}`}
                      >
                        {isRestoring ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RotateCcw className="w-3.5 h-3.5" />
                        )}
                        Restore
                      </button>
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
            {((pagination.page - 1) * pagination.limit) + 1}--{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
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
  );
};
