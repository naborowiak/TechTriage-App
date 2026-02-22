import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, Loader2, Send,
  UserCheck, Pencil, Trash2, Check, X
} from 'lucide-react';
import { useAgentApi } from '../../hooks/useAgentApi';
import type { AgentRosterItem } from '../../types';

const statusOptions = ['open', 'resolved', 'escalated', 'pending'];
const priorityOptions = ['low', 'medium', 'high', 'critical'];

// ServiceNow highlighted value styles
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

type Tab = 'details' | 'activity' | 'related';
type ComposeMode = 'reply' | 'note';

function fullName(obj: { firstName: string | null; lastName: string | null } | null): string {
  if (!obj) return '—';
  return `${obj.firstName || ''} ${obj.lastName || ''}`.trim() || '—';
}

function formatDate(d: string): string {
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

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

// Map activity actions to readable labels
function activityLabel(action: string, details: any): string {
  switch (action) {
    case 'status_changed': return `changed status from ${details?.from || '?'} to ${details?.to || '?'}`;
    case 'priority_changed': return `changed priority from ${details?.from || '?'} to ${details?.to || '?'}`;
    case 'assigned': return `assigned case to ${details?.assignedToName || 'an agent'}`;
    case 'unassigned': return 'unassigned case';
    case 'note_added': return 'added a work note';
    case 'note_deleted': return 'deleted a work note';
    case 'created': return 'created the case';
    case 'escalated': return 'escalated the case';
    case 'resolved': return 'resolved the case';
    default: return `performed ${action}`;
  }
}

interface Props {
  caseId: string;
  currentUserId: string;
  onBack: () => void;
  onSelectCustomer: (userId: string) => void;
  onSelectCase: (caseId: string) => void;
}

export const CaseDetail: React.FC<Props> = ({ caseId, currentUserId, onBack, onSelectCustomer, onSelectCase }) => {
  const api = useAgentApi();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('details');
  const [agents, setAgents] = useState<AgentRosterItem[]>([]);
  const [isMutating, setIsMutating] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Compose area state
  const [composeMode, setComposeMode] = useState<ComposeMode>('reply');
  const [composeText, setComposeText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Note editing state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeletingNote, setIsDeletingNote] = useState(false);

  const loadCase = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.fetchCaseDetail(caseId);
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Failed to load case');
    } finally {
      setIsLoading(false);
    }
  }, [caseId]);

  useEffect(() => { loadCase(); }, [loadCase]);
  useEffect(() => { api.fetchAgents().then(r => setAgents(r.agents)).catch(() => {}); }, []);

  const handleUpdateCase = async (field: string, value: string) => {
    setIsMutating(true);
    try {
      await api.updateCase(caseId, { [field]: value });
      showStatus(`${field} updated`);
      loadCase();
    } catch (err: any) {
      showStatus(`Error: ${err.message}`, true);
    } finally {
      setIsMutating(false);
    }
  };

  const handleAssign = async (agentId: string) => {
    setIsMutating(true);
    try {
      if (agentId === 'unassign') await api.unassignCase(caseId);
      else await api.assignCase(caseId, agentId);
      showStatus('Assignment updated');
      loadCase();
    } catch (err: any) {
      showStatus(`Error: ${err.message}`, true);
    } finally {
      setIsMutating(false);
    }
  };

  const handleComposeSend = async () => {
    if (!composeText.trim() || isSending) return;
    setIsSending(true);
    try {
      if (composeMode === 'reply') {
        await api.sendReply(caseId, composeText.trim());
      } else {
        await api.addNote(caseId, composeText.trim());
      }
      setComposeText('');
      loadCase();
    } catch (err: any) {
      showStatus(`Failed: ${err.message}`, true);
    } finally {
      setIsSending(false);
    }
  };

  const handleEditNote = async (noteId: string) => {
    if (!editContent.trim()) return;
    setIsSavingNote(true);
    try {
      await api.editNote(caseId, noteId, editContent.trim());
      setEditingNoteId(null);
      loadCase();
    } catch (err: any) {
      showStatus(`Edit failed: ${err.message}`, true);
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    setIsDeletingNote(true);
    try {
      await api.deleteNote(caseId, noteId);
      setConfirmDeleteId(null);
      loadCase();
    } catch (err: any) {
      showStatus(`Delete failed: ${err.message}`, true);
    } finally {
      setIsDeletingNote(false);
    }
  };

  const showStatus = (msg: string, isError = false) => {
    setStatusMsg(isError ? `Error: ${msg}` : msg);
    setTimeout(() => setStatusMsg(null), 4000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[#4F52BD]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500 mb-3">{error || 'Case not found'}</p>
        <button onClick={onBack} className="text-sm text-[#2469FF] hover:underline">Back to queue</button>
      </div>
    );
  }

  const { case: caseRecord, customer, subscription, devices, assignedAgent, messages, notes, activity, relatedCases } = data;

  // Build unified activity stream (messages + notes + activity, sorted by timestamp)
  const buildActivityStream = () => {
    const items: Array<{ type: string; timestamp: number; data: any }> = [];

    // Messages (customer + agent + AI)
    if (messages) {
      messages.forEach((msg: any) => {
        items.push({
          type: msg.role === 'agent' ? 'agent_reply' : msg.role === 'user' ? 'customer_msg' : 'ai_msg',
          timestamp: msg.timestamp || 0,
          data: msg,
        });
      });
    }

    // Internal notes
    if (notes) {
      notes.forEach((note: any) => {
        items.push({
          type: 'work_note',
          timestamp: new Date(note.createdAt).getTime(),
          data: note,
        });
      });
    }

    // System activity events
    if (activity) {
      activity.forEach((evt: any) => {
        items.push({
          type: 'system_event',
          timestamp: new Date(evt.createdAt).getTime(),
          data: evt,
        });
      });
    }

    return items.sort((a, b) => b.timestamp - a.timestamp);
  };

  const stream = buildActivityStream();

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'details', label: 'Details' },
    { id: 'activity', label: 'Activity', count: stream.length },
    { id: 'related', label: 'Related', count: relatedCases?.length },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Record Header — ServiceNow pattern */}
      <div className="px-6 py-4 bg-white dark:bg-[#1A2025] border-b border-gray-200 dark:border-gray-800 shrink-0">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-[#4F5664] dark:text-gray-400" aria-label="Back to queue">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-lg font-semibold text-[#37444A] dark:text-white truncate">
            <span className="text-[#2469FF] dark:text-blue-400 font-mono text-sm mr-2">
              {caseRecord.caseNumber ? `CS${String(caseRecord.caseNumber).padStart(7, '0')}` : '#—'}
            </span>
            {caseRecord.title}
          </h1>
        </div>
        {/* Highlighted values row */}
        <div className="flex flex-wrap gap-2 ml-9">
          <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded ${statusHighlight[caseRecord.status] || ''}`}>
            {caseRecord.status.charAt(0).toUpperCase() + caseRecord.status.slice(1)}
          </span>
          <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded ${priorityHighlight[caseRecord.priority || 'medium'] || ''}`}>
            {(caseRecord.priority || 'medium').charAt(0).toUpperCase() + (caseRecord.priority || 'medium').slice(1)}
          </span>
          {caseRecord.sessionMode && (
            <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
              {caseRecord.sessionMode}
            </span>
          )}
          <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            {assignedAgent ? fullName(assignedAgent) : 'Unassigned'}
          </span>
        </div>
      </div>

      {/* Status toast */}
      {statusMsg && (
        <div className={`mx-6 mt-2 text-xs px-3 py-2 rounded-lg ${statusMsg.startsWith('Error') ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'}`} role="status" aria-live="polite">
          {statusMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1A2025] px-6 shrink-0" role="tablist">
        {tabs.map(t => (
          <button
            key={t.id}
            role="tab"
            aria-selected={activeTab === t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === t.id
                ? 'border-[#4F52BD] text-[#4F52BD] dark:text-indigo-400'
                : 'border-transparent text-[#4F5664] dark:text-gray-400 hover:text-[#37444A] dark:hover:text-gray-300'
            }`}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className="ml-1.5 text-[10px] bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded-full">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Body: Content + Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main content */}
        <div className="flex-1 overflow-auto p-6" role="tabpanel">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* 2-column form fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                <FormField label="Category" value={caseRecord.sessionMode || '—'} />
                <FormField label="Mode" value={caseRecord.sessionMode || '—'} />
                <FormField label="Created" value={formatDate(caseRecord.createdAt)} />
                <FormField label="Updated" value={formatDate(caseRecord.updatedAt)} />
                {caseRecord.photosCount > 0 && <FormField label="Photos" value={String(caseRecord.photosCount)} />}
              </div>

              {caseRecord.aiSummary && (
                <div>
                  <h4 className="text-xs font-semibold text-[#4F5664] dark:text-gray-500 uppercase tracking-wider mb-1.5">AI Summary</h4>
                  <p className="text-sm text-[#37444A] dark:text-gray-300 whitespace-pre-wrap leading-relaxed bg-gray-50 dark:bg-gray-800/30 p-3 rounded-lg">{caseRecord.aiSummary}</p>
                </div>
              )}

              {caseRecord.diagnosticSteps && caseRecord.diagnosticSteps.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-[#4F5664] dark:text-gray-500 uppercase tracking-wider mb-1.5">Diagnostic Steps</h4>
                  <ol className="space-y-1.5 text-sm text-[#37444A] dark:text-gray-300">
                    {caseRecord.diagnosticSteps.map((s: any, i: number) => (
                      <li key={i}><span className="font-medium">{i + 1}.</span> {s.step} {s.result && <span className="text-[#4F5664] dark:text-gray-500">— {s.result}</span>}</li>
                    ))}
                  </ol>
                </div>
              )}

              {caseRecord.escalationReport && (
                <div>
                  <h4 className="text-xs font-semibold text-[#4F5664] dark:text-gray-500 uppercase tracking-wider mb-1.5">Escalation Report</h4>
                  <div className="text-sm text-[#37444A] dark:text-gray-300 space-y-1 bg-orange-50/50 dark:bg-orange-900/10 p-3 rounded-lg border-l-4 border-orange-400">
                    <p><span className="font-medium">Problem:</span> {caseRecord.escalationReport.problemDescription}</p>
                    <p><span className="font-medium">Specialist:</span> {caseRecord.escalationReport.recommendedSpecialist}</p>
                    <p><span className="font-medium">Urgency:</span> {caseRecord.escalationReport.urgencyLevel}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-4">
              {/* Compose area — ServiceNow segmented control */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1A2025] p-4">
                <div className="flex gap-1 mb-3">
                  <button
                    onClick={() => setComposeMode('reply')}
                    className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                      composeMode === 'reply'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'text-[#4F5664] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    Reply to Customer
                  </button>
                  <button
                    onClick={() => setComposeMode('note')}
                    className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                      composeMode === 'note'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        : 'text-[#4F5664] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    Work Note
                  </button>
                </div>
                <textarea
                  value={composeText}
                  onChange={(e) => setComposeText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleComposeSend(); } }}
                  placeholder={composeMode === 'reply' ? 'Type a reply to the customer...' : 'Add an internal work note...'}
                  rows={3}
                  maxLength={10000}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-[#F5F6F7] dark:bg-[#10171A] text-[#37444A] dark:text-white placeholder-[#4F5664] dark:placeholder-gray-500 focus:border-[#4F52BD] focus:outline-none resize-none"
                  aria-label={composeMode === 'reply' ? 'Reply to customer' : 'Add work note'}
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={handleComposeSend}
                    disabled={isSending || !composeText.trim()}
                    className={`px-4 py-1.5 rounded-lg text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 ${
                      composeMode === 'reply'
                        ? 'bg-[#4F52BD] hover:bg-[#4345a0]'
                        : 'bg-amber-600 hover:bg-amber-700'
                    }`}
                  >
                    {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    {composeMode === 'reply' ? 'Post Reply' : 'Post Note'}
                  </button>
                </div>
              </div>

              {/* Unified activity stream */}
              <div className="space-y-0 divide-y divide-gray-100 dark:divide-gray-800">
                {stream.length === 0 ? (
                  <p className="text-sm text-[#4F5664] dark:text-gray-400 py-8 text-center">No activity yet</p>
                ) : (
                  stream.map((item, i) => {
                    if (item.type === 'customer_msg') {
                      return (
                        <div key={`msg-${i}`} className="p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-[10px] font-semibold text-blue-700 dark:text-blue-400">
                              {(customer?.firstName?.[0] || 'C').toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-[#37444A] dark:text-gray-200">
                              {customer ? fullName(customer) : 'Customer'}
                            </span>
                            <span className="text-xs text-[#4F5664] dark:text-gray-500 ml-auto">
                              {item.data.timestamp ? new Date(item.data.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : ''}
                            </span>
                          </div>
                          <p className="text-sm text-[#37444A] dark:text-gray-300 ml-8 whitespace-pre-wrap">{item.data.text}</p>
                        </div>
                      );
                    }

                    if (item.type === 'ai_msg') {
                      return (
                        <div key={`ai-${i}`} className="p-4 bg-gray-50/50 dark:bg-gray-800/20">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-[10px] font-semibold text-indigo-700 dark:text-indigo-400">AI</div>
                            <span className="text-sm font-medium text-[#37444A] dark:text-gray-200">Scout AI</span>
                            <span className="text-xs text-[#4F5664] dark:text-gray-500 ml-auto">
                              {item.data.timestamp ? new Date(item.data.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : ''}
                            </span>
                          </div>
                          <p className="text-sm text-[#37444A] dark:text-gray-300 ml-8 whitespace-pre-wrap">{item.data.text}</p>
                        </div>
                      );
                    }

                    if (item.type === 'agent_reply') {
                      return (
                        <div key={`agent-${i}`} className="p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-[10px] font-semibold text-green-700 dark:text-green-400">
                              {(item.data.agentName?.[0] || 'A').toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-[#37444A] dark:text-gray-200">{item.data.agentName || 'Agent'}</span>
                            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">Reply</span>
                            <span className="text-xs text-[#4F5664] dark:text-gray-500 ml-auto">
                              {item.data.timestamp ? new Date(item.data.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : ''}
                            </span>
                          </div>
                          <p className="text-sm text-[#37444A] dark:text-gray-300 ml-8 whitespace-pre-wrap">{item.data.text}</p>
                        </div>
                      );
                    }

                    if (item.type === 'work_note') {
                      const note = item.data;
                      const isOwn = note.author.id === currentUserId;
                      const isEditing = editingNoteId === note.id;
                      const isConfirmingDelete = confirmDeleteId === note.id;

                      return (
                        <div key={`note-${note.id}`} className="p-4 border-l-4 border-amber-400 bg-amber-50/50 dark:bg-amber-900/10">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                              {(note.author.firstName?.[0] || 'A').toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-[#37444A] dark:text-gray-200">
                              {note.author.firstName || ''} {note.author.lastName || ''}
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full">Work Note</span>
                            <span className="text-xs text-[#4F5664] dark:text-gray-500 ml-auto">{formatRelativeTime(note.createdAt)}</span>
                            {/* Edit/delete for own notes */}
                            {isOwn && !isEditing && (
                              <div className="flex items-center gap-0.5 ml-1">
                                <button onClick={() => { setEditingNoteId(note.id); setEditContent(note.content); }} className="p-1 rounded hover:bg-amber-200/50 dark:hover:bg-amber-800/30 text-amber-600 dark:text-amber-400" aria-label="Edit note">
                                  <Pencil className="w-3 h-3" />
                                </button>
                                {isConfirmingDelete ? (
                                  <>
                                    <button onClick={() => handleDeleteNote(note.id)} disabled={isDeletingNote} className="p-1 rounded bg-red-100 dark:bg-red-900/30 text-red-600" aria-label="Confirm delete">
                                      {isDeletingNote ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                    </button>
                                    <button onClick={() => setConfirmDeleteId(null)} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400" aria-label="Cancel delete">
                                      <X className="w-3 h-3" />
                                    </button>
                                  </>
                                ) : (
                                  <button onClick={() => setConfirmDeleteId(note.id)} className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500" aria-label="Delete note">
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                          {isEditing ? (
                            <div className="ml-8 flex gap-2 mt-1">
                              <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={2} maxLength={10000}
                                className="flex-1 px-2 py-1.5 text-sm border border-amber-300 dark:border-amber-700 rounded bg-white dark:bg-[#1A2025] text-[#37444A] dark:text-gray-200 focus:outline-none resize-none" />
                              <div className="flex flex-col gap-1 self-end">
                                <button onClick={() => handleEditNote(note.id)} disabled={isSavingNote || !editContent.trim()}
                                  className="px-2 py-1 rounded bg-amber-600 text-white text-xs hover:bg-amber-700 disabled:opacity-50">
                                  {isSavingNote ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                                </button>
                                <button onClick={() => setEditingNoteId(null)}
                                  className="px-2 py-1 rounded border border-gray-200 dark:border-gray-700 text-xs text-[#4F5664] dark:text-gray-400">
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-[#37444A] dark:text-gray-300 ml-8 whitespace-pre-wrap">{note.content}</p>
                          )}
                        </div>
                      );
                    }

                    if (item.type === 'system_event') {
                      const evt = item.data;
                      return (
                        <div key={`evt-${evt.id}`} className="px-4 py-2 flex items-center gap-2 text-xs text-[#4F5664] dark:text-gray-500">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0" />
                          <span>
                            <span className="font-medium text-[#37444A] dark:text-gray-400">{fullName(evt.actor)}</span>{' '}
                            {activityLabel(evt.action, evt.details)}
                          </span>
                          <span className="ml-auto shrink-0">{formatRelativeTime(evt.createdAt)}</span>
                        </div>
                      );
                    }

                    return null;
                  })
                )}
              </div>
            </div>
          )}

          {activeTab === 'related' && (
            <div className="space-y-2">
              {(!relatedCases || relatedCases.length === 0) ? (
                <p className="text-sm text-[#4F5664] dark:text-gray-400 py-8 text-center">No related cases</p>
              ) : (
                relatedCases.map((rc: any) => (
                  <button
                    key={rc.id}
                    onClick={() => onSelectCase(rc.id)}
                    className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/30 border border-gray-200 dark:border-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#37444A] dark:text-gray-200 truncate">
                        <span className="text-[#2469FF] dark:text-blue-400 font-mono text-xs mr-1.5">
                          {rc.caseNumber ? `CS${String(rc.caseNumber).padStart(7, '0')}` : '#—'}
                        </span>
                        {rc.title}
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${statusHighlight[rc.status] || ''} shrink-0 ml-2`}>
                        {rc.status.charAt(0).toUpperCase() + rc.status.slice(1)}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Right sidebar — contextual panel */}
        <aside className="w-80 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1A2025] overflow-auto shrink-0 hidden lg:block">
          <div className="p-4 space-y-4">
            {/* Customer */}
            {customer && (
              <div>
                <h3 className="text-[10px] font-semibold text-[#4F5664] dark:text-gray-500 uppercase tracking-wider mb-2">Customer</h3>
                <button onClick={() => onSelectCustomer(customer.id)} className="text-[#2469FF] dark:text-blue-400 hover:underline font-medium text-sm">
                  {fullName(customer)}
                </button>
                <div className="mt-1.5 space-y-1 text-xs text-[#4F5664] dark:text-gray-400">
                  {customer.email && <p>{customer.email}</p>}
                  {customer.phone && <p>{customer.phone}</p>}
                  {customer.homeType && <p>Home: {customer.homeType}</p>}
                  {customer.techComfort && <p>Tech: {customer.techComfort}</p>}
                </div>
              </div>
            )}

            {/* Subscription */}
            {subscription && (
              <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
                <h3 className="text-[10px] font-semibold text-[#4F5664] dark:text-gray-500 uppercase tracking-wider mb-2">Subscription</h3>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    subscription.tier === 'pro' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                    : subscription.tier === 'home' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {subscription.tier.toUpperCase()}
                  </span>
                  <span className="text-xs text-[#4F5664] dark:text-gray-400">{subscription.status}</span>
                </div>
                {subscription.videoCredits > 0 && (
                  <p className="text-xs text-[#4F5664] dark:text-gray-400 mt-1">{subscription.videoCredits} video credit{subscription.videoCredits !== 1 ? 's' : ''}</p>
                )}
              </div>
            )}

            {/* Devices */}
            {devices && devices.length > 0 && (
              <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
                <h3 className="text-[10px] font-semibold text-[#4F5664] dark:text-gray-500 uppercase tracking-wider mb-2">Devices ({devices.length})</h3>
                <div className="space-y-2">
                  {devices.slice(0, 5).map((d: any) => (
                    <div key={d.id} className="text-xs">
                      <p className="font-medium text-[#37444A] dark:text-gray-300">{d.name}</p>
                      <p className="text-[#4F5664] dark:text-gray-500">{[d.brand, d.model, d.location].filter(Boolean).join(' · ')}</p>
                    </div>
                  ))}
                  {devices.length > 5 && <p className="text-xs text-[#4F5664] dark:text-gray-500">+{devices.length - 5} more</p>}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Sticky Action Bar — ServiceNow pattern */}
      <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1A2025] flex items-center gap-2 shrink-0">
        <select
          value={caseRecord.status}
          onChange={(e) => handleUpdateCase('status', e.target.value)}
          disabled={isMutating}
          className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-[#F5F6F7] dark:bg-[#10171A] text-[#37444A] dark:text-white focus:border-[#4F52BD] focus:outline-none disabled:opacity-50"
          aria-label="Status"
        >
          {statusOptions.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>

        <select
          value={caseRecord.priority || 'medium'}
          onChange={(e) => handleUpdateCase('priority', e.target.value)}
          disabled={isMutating}
          className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-[#F5F6F7] dark:bg-[#10171A] text-[#37444A] dark:text-white focus:border-[#4F52BD] focus:outline-none disabled:opacity-50"
          aria-label="Priority"
        >
          {priorityOptions.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
        </select>

        <button
          onClick={() => handleAssign(currentUserId)}
          disabled={isMutating || assignedAgent?.id === currentUserId}
          className="px-4 py-2 rounded-lg bg-[#4F52BD] text-white text-sm font-medium hover:bg-[#4345a0] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <UserCheck className="w-4 h-4 inline mr-1.5" />
          Assign to Me
        </button>

        <button
          onClick={() => handleUpdateCase('status', 'resolved')}
          disabled={isMutating || caseRecord.status === 'resolved'}
          className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-[#37444A] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Resolve
        </button>

        {/* Overflow */}
        <div className="ml-auto flex items-center gap-2">
          <select
            value={assignedAgent?.id || 'unassign'}
            onChange={(e) => handleAssign(e.target.value)}
            disabled={isMutating}
            className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-[#F5F6F7] dark:bg-[#10171A] text-[#37444A] dark:text-white focus:border-[#4F52BD] focus:outline-none disabled:opacity-50"
            aria-label="Assign to"
          >
            <option value="unassign">Unassigned</option>
            {agents.map(a => <option key={a.id} value={a.id}>{fullName(a)}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
};

// Simple form field component (ServiceNow 2-col layout)
const FormField: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <dt className="text-xs font-medium text-[#4F5664] dark:text-gray-500 mb-0.5">{label}</dt>
    <dd className="text-sm text-[#37444A] dark:text-gray-300">{value}</dd>
  </div>
);
