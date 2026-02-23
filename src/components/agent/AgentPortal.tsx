import React, { useState, useCallback, useEffect } from 'react';
import {
  LayoutGrid, Users, Shield, ArrowLeft, Sun, Moon, Search, Bell, Home,
  ChevronLeft, ChevronRight, Loader2, RefreshCw, Clock, AlertTriangle, CheckCircle2, Inbox
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { useAgentApi } from '../../hooks/useAgentApi';
import { Logo } from '../Logo';
import { LoadingScreen } from '../LoadingScreen';
import { CaseQueue } from './CaseQueue';
import { CaseDetail } from './CaseDetail';
import { CustomerProfile } from './CustomerProfile';
import { AdminRoleManager } from './AdminRoleManager';
import { PageView } from '../../types';

type AgentView = 'home' | 'queue' | 'case-detail' | 'customer' | 'admin';

interface Props {
  onNavigate: (view: PageView) => void;
}

const sidebarItems: { id: AgentView; icon: React.ElementType; label: string; adminOnly?: boolean }[] = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'queue', icon: LayoutGrid, label: 'Cases' },
  { id: 'customer', icon: Users, label: 'Customers' },
  { id: 'admin', icon: Shield, label: 'Admin', adminOnly: true },
];

// ─── Home Dashboard Widget ───────────────────────────────────
interface HomeStats {
  totalOpen: number;
  myAssigned: number;
  escalated: number;
  resolvedToday: number;
  recentCases: any[];
}

const AgentHomeDashboard: React.FC<{
  currentUserId: string;
  userName: string;
  onSelectCase: (id: string) => void;
  onNavigateQueue: (category?: string) => void;
}> = ({ currentUserId, userName, onSelectCase, onNavigateQueue }) => {
  const api = useAgentApi();
  const [stats, setStats] = useState<HomeStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [allOpen, myCases, escalated, recent] = await Promise.all([
        api.fetchCases({ status: 'open', page: 1, limit: 1 }),
        api.fetchCases({ assignedAgentId: currentUserId, status: 'open', page: 1, limit: 1 }),
        api.fetchCases({ status: 'escalated', page: 1, limit: 1 }),
        api.fetchCases({ page: 1, limit: 5, sortBy: 'updatedAt', sortOrder: 'desc' }),
      ]);
      setStats({
        totalOpen: allOpen.pagination.total,
        myAssigned: myCases.pagination.total,
        escalated: escalated.pagination.total,
        resolvedToday: 0,
        recentCases: recent.cases,
      });
    } catch {
      setStats({ totalOpen: 0, myAssigned: 0, escalated: 0, resolvedToday: 0, recentCases: [] });
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => { load(); }, [load]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[#4F52BD]" />
      </div>
    );
  }

  const s = stats!;
  const statCards = [
    { label: 'Open Cases', value: s.totalOpen, icon: Inbox, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/15', onClick: () => onNavigateQueue('open') },
    { label: 'My Assigned', value: s.myAssigned, icon: Clock, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/15', onClick: () => onNavigateQueue('my') },
    { label: 'Escalated', value: s.escalated, icon: AlertTriangle, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/15', onClick: () => onNavigateQueue('escalated') },
    { label: 'Resolved', value: s.resolvedToday, icon: CheckCircle2, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/15', onClick: () => onNavigateQueue('resolved') },
  ];

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

  return (
    <div className="h-full overflow-auto">
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-bold text-[#37444A] dark:text-white">
            Welcome back, {userName}
          </h1>
          <p className="text-sm text-[#4F5664] dark:text-gray-400 mt-1">Here's an overview of your workspace</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.label}
                onClick={card.onClick}
                className={`${card.bg} rounded-lg p-4 text-left hover:shadow-sm transition-shadow group`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-5 h-5 ${card.color}`} />
                  <RefreshCw className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
                <p className="text-xs font-medium text-[#4F5664] dark:text-gray-500 mt-1">{card.label}</p>
              </button>
            );
          })}
        </div>

        {/* Recent activity */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[10px] font-semibold text-[#4F5664] dark:text-gray-500 uppercase tracking-wider">Recent Cases</h2>
            <button onClick={() => onNavigateQueue()} className="text-xs text-[#2469FF] dark:text-blue-400 hover:underline font-medium">
              View all
            </button>
          </div>
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
            {s.recentCases.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-[#4F5664] dark:text-gray-400">No cases yet</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F5F6F7] dark:bg-[#10171A] border-b border-gray-200 dark:border-gray-800">
                    <th scope="col" className="px-4 py-2.5 text-left text-[10px] font-semibold text-[#4F5664] dark:text-gray-500 uppercase tracking-wider">Number</th>
                    <th scope="col" className="px-4 py-2.5 text-left text-[10px] font-semibold text-[#4F5664] dark:text-gray-500 uppercase tracking-wider">Description</th>
                    <th scope="col" className="px-4 py-2.5 text-left text-[10px] font-semibold text-[#4F5664] dark:text-gray-500 uppercase tracking-wider">State</th>
                    <th scope="col" className="px-4 py-2.5 text-left text-[10px] font-semibold text-[#4F5664] dark:text-gray-500 uppercase tracking-wider">Priority</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-[#1A2025] divide-y divide-gray-100 dark:divide-gray-800">
                  {s.recentCases.map((c: any) => (
                    <tr
                      key={c.id}
                      onClick={() => onSelectCase(c.id)}
                      className="h-11 hover:bg-gray-50 dark:hover:bg-gray-800/30 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-2">
                        <span className="text-[#2469FF] dark:text-blue-400 font-mono text-xs font-medium">
                          {c.caseNumber ? `CS${String(c.caseNumber).padStart(7, '0')}` : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-[#37444A] dark:text-gray-200 truncate max-w-[300px] font-medium">{c.title}</td>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Portal ─────────────────────────────────────────────
export const AgentPortal: React.FC<Props> = ({ onNavigate }) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [agentView, setAgentView] = useState<AgentView>('home');
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [initialQueueCategory, setInitialQueueCategory] = useState<string | undefined>();
  const [initialQueueSearch, setInitialQueueSearch] = useState<string | undefined>();

  if (isLoading) {
    return <LoadingScreen message="Loading Agent Portal..." />;
  }

  const isAgent = user?.role === 'agent' || user?.role === 'admin';
  if (!isAuthenticated || !isAgent) {
    return (
      <div className="min-h-screen bg-[#F5F6F7] dark:bg-[#10171A] flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
            <Shield className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-[#37444A] dark:text-white mb-2">Access Denied</h1>
          <p className="text-sm text-[#4F5664] dark:text-gray-400 mb-6">
            You don't have permission to access the Agent Portal. Contact an administrator if you believe this is an error.
          </p>
          <button
            onClick={() => onNavigate(PageView.HOME)}
            className="px-4 py-2 rounded-lg bg-[#4F52BD] text-white text-sm font-medium hover:bg-[#4345a0]"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  const isAdmin = user?.role === 'admin';

  const handleSelectCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    setAgentView('case-detail');
  };

  const handleSelectCustomer = (userId: string) => {
    setSelectedCustomerId(userId);
    setAgentView('customer');
  };

  const handleBackToQueue = () => {
    setAgentView('queue');
  };

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (globalSearch.trim()) {
      setInitialQueueSearch(globalSearch.trim());
      setInitialQueueCategory(undefined);
      setAgentView('queue');
    }
  };

  const handleNavigateQueue = (category?: string) => {
    setInitialQueueCategory(category);
    setInitialQueueSearch(undefined);
    setAgentView('queue');
  };

  // Determine active sidebar item
  const activeSidebarId: AgentView = agentView === 'case-detail' ? 'queue' : agentView;

  const visibleSidebar = sidebarItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <div className="h-screen flex flex-col bg-[#F5F6F7] dark:bg-[#10171A] font-['Inter',sans-serif]">
      {/* Layer 1: Chrome Header */}
      <header className="h-12 bg-[#302F4B] flex items-center px-4 gap-4 shrink-0 z-50">
        {/* Logo + brand */}
        <div className="flex items-center gap-3 shrink-0">
          <Logo variant="light" />
          <div className="h-5 w-px bg-white/20" aria-hidden="true" />
          <span className="text-sm font-semibold text-white/90 hidden sm:block">Agent Workspace</span>
        </div>

        {/* Center: Search */}
        <form onSubmit={handleGlobalSearch} className="flex-1 max-w-xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Search cases, customers..."
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/10 focus:border-white/30 rounded-lg text-white placeholder-white/40 focus:outline-none transition-colors"
              aria-label="Global search"
            />
          </div>
        </form>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white/90 transition-colors" aria-label="Notifications">
            <Bell className="w-4 h-4" />
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white/90 transition-colors"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onNavigate(PageView.DASHBOARD)}
            className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white/90 transition-colors"
            aria-label="Back to App"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="ml-1 pl-2 border-l border-white/15 flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#4F52BD] flex items-center justify-center text-white text-xs font-semibold">
              {(user?.firstName?.[0] || user?.email?.[0] || '?').toUpperCase()}
            </div>
            <span className="text-sm text-white/80 hidden md:block">
              {user?.firstName || user?.email || 'Agent'}
            </span>
          </div>
        </div>
      </header>

      {/* Layer 2 + 3: Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Collapsible Sidebar */}
        <nav
          className={`${sidebarExpanded ? 'w-48' : 'w-14'} bg-[#1E1E2E] flex flex-col py-3 shrink-0 transition-all duration-200`}
          aria-label="Workspace navigation"
        >
          <div className={`flex flex-col ${sidebarExpanded ? '' : 'items-center'} gap-1 flex-1`}>
            {visibleSidebar.map((item) => {
              const isActive = activeSidebarId === item.id || (item.id === 'queue' && agentView === 'case-detail');
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    if (item.id === 'home') {
                      setAgentView('home');
                    } else if (item.id === 'queue') {
                      setInitialQueueCategory(undefined);
                      setInitialQueueSearch(undefined);
                      setAgentView('queue');
                    } else {
                      setAgentView(item.id);
                    }
                  }}
                  className={`relative flex items-center gap-3 ${sidebarExpanded ? 'px-4' : 'justify-center'} h-10 ${sidebarExpanded ? '' : 'w-10 mx-auto'} rounded-lg transition-colors group ${
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-white/40 hover:text-white/80 hover:bg-white/5'
                  }`}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {/* Active indicator bar */}
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-[3px] bg-[#4F52BD] rounded-r" aria-hidden="true" />
                  )}
                  <Icon className="w-5 h-5 shrink-0" />
                  {/* Label (when expanded) */}
                  {sidebarExpanded && (
                    <span className="text-sm font-medium truncate">{item.label}</span>
                  )}
                  {/* Tooltip (when collapsed) */}
                  {!sidebarExpanded && (
                    <span className="absolute left-14 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg transition-opacity">
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Expand/collapse toggle at bottom */}
          <div className={`${sidebarExpanded ? 'px-2' : 'flex justify-center'} mt-2`}>
            <button
              onClick={() => setSidebarExpanded(prev => !prev)}
              className="w-10 h-10 flex items-center justify-center rounded-lg text-white/40 hover:text-white/80 hover:bg-white/5 transition-colors"
              aria-label={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {sidebarExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </nav>

        {/* Content area */}
        <main className="flex-1 overflow-auto">
          {agentView === 'home' && (
            <AgentHomeDashboard
              currentUserId={user!.id}
              userName={user?.firstName || user?.email || 'Agent'}
              onSelectCase={handleSelectCase}
              onNavigateQueue={handleNavigateQueue}
            />
          )}
          {agentView === 'queue' && (
            <CaseQueue
              onSelectCase={handleSelectCase}
              onSelectCustomer={handleSelectCustomer}
              currentUserId={user!.id}
              initialCategory={initialQueueCategory}
              initialSearch={initialQueueSearch}
              isAdmin={isAdmin}
            />
          )}
          {agentView === 'case-detail' && selectedCaseId && (
            <CaseDetail
              caseId={selectedCaseId}
              currentUserId={user!.id}
              currentUserRole={user?.role || 'customer'}
              onBack={handleBackToQueue}
              onSelectCustomer={handleSelectCustomer}
              onSelectCase={handleSelectCase}
            />
          )}
          {agentView === 'customer' && (
            selectedCustomerId ? (
              <CustomerProfile
                userId={selectedCustomerId}
                onBack={handleBackToQueue}
                onSelectCase={handleSelectCase}
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center max-w-sm">
                  <Users className="w-12 h-12 mx-auto mb-3 text-[#4F5664]/30 dark:text-gray-600" />
                  <h2 className="text-lg font-semibold text-[#37444A] dark:text-white mb-2">Customer Profiles</h2>
                  <p className="text-sm text-[#4F5664] dark:text-gray-400">
                    Select a customer from a case to view their full profile, subscription details, and device information.
                  </p>
                  <button
                    onClick={() => setAgentView('queue')}
                    className="mt-4 px-4 py-2 rounded-lg bg-[#4F52BD] text-white text-sm font-medium hover:bg-[#4345a0]"
                  >
                    Go to Cases
                  </button>
                </div>
              </div>
            )
          )}
          {agentView === 'admin' && isAdmin && (
            <AdminRoleManager currentUserId={user!.id} />
          )}
        </main>
      </div>
    </div>
  );
};
