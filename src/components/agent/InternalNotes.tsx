import React, { useState } from 'react';
import { Pencil, Trash2, Loader2, Send, X, Check } from 'lucide-react';
import { useAgentApi } from '../../hooks/useAgentApi';
import type { AgentNote } from '../../types';

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

interface Props {
  caseId: string;
  currentUserId: string;
  notes: AgentNote[];
  onRefresh: () => void;
}

export const InternalNotes: React.FC<Props> = ({ caseId, currentUserId, notes, onRefresh }) => {
  const api = useAgentApi();
  const [newContent, setNewContent] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!newContent.trim()) return;
    setIsAdding(true);
    setError(null);
    try {
      await api.addNote(caseId, newContent.trim());
      setNewContent('');
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to add note');
    } finally {
      setIsAdding(false);
    }
  };

  const handleEdit = async (noteId: string) => {
    if (!editContent.trim()) return;
    setIsSaving(true);
    setError(null);
    try {
      await api.editNote(caseId, noteId, editContent.trim());
      setEditingId(null);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to edit note');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (noteId: string) => {
    setDeletingId(noteId);
    setError(null);
    try {
      await api.deleteNote(caseId, noteId);
      setConfirmDeleteId(null);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to delete note');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Add note form */}
      <div className="flex gap-2">
        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="Add an internal note..."
          maxLength={10000}
          rows={2}
          className="flex-1 px-3 py-2 text-sm border border-light-200 dark:border-midnight-700 rounded-lg bg-white dark:bg-midnight-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:border-indigo-500 focus:outline-none resize-none"
          aria-label="New internal note"
        />
        <button
          onClick={handleAdd}
          disabled={isAdding || !newContent.trim()}
          className="self-end px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
          aria-label="Submit note"
        >
          {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Add
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-500" role="alert">{error}</p>
      )}

      {/* Notes list */}
      {notes.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
          No internal notes yet. Add one above.
        </p>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => {
            const isOwn = note.author.id === currentUserId;
            const isEditing = editingId === note.id;
            const isDeleting = deletingId === note.id;
            const isConfirmingDelete = confirmDeleteId === note.id;

            return (
              <div
                key={note.id}
                className="p-3 rounded-lg border border-light-200 dark:border-midnight-700 bg-light-50 dark:bg-midnight-800/50"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {note.author.firstName || ''} {note.author.lastName || ''}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {formatRelativeTime(note.createdAt)}
                    </span>
                  </div>

                  {isOwn && !isEditing && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setEditingId(note.id); setEditContent(note.content); }}
                        className="p-1 rounded hover:bg-light-200 dark:hover:bg-midnight-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        aria-label="Edit note"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {isConfirmingDelete ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(note.id)}
                            disabled={isDeleting}
                            className="p-1 rounded bg-red-500/10 text-red-500 hover:bg-red-500/20"
                            aria-label="Confirm delete"
                          >
                            {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="p-1 rounded hover:bg-light-200 dark:hover:bg-midnight-700 text-gray-400"
                            aria-label="Cancel delete"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(note.id)}
                          className="p-1 rounded hover:bg-red-500/10 text-gray-400 hover:text-red-500"
                          aria-label="Delete note"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div className="flex gap-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={2}
                      maxLength={10000}
                      className="flex-1 px-2 py-1.5 text-sm border border-indigo-300 dark:border-indigo-600 rounded bg-white dark:bg-midnight-800 text-gray-800 dark:text-gray-200 focus:outline-none resize-none"
                      aria-label="Edit note content"
                    />
                    <div className="flex flex-col gap-1 self-end">
                      <button
                        onClick={() => handleEdit(note.id)}
                        disabled={isSaving || !editContent.trim()}
                        className="px-2 py-1 rounded bg-indigo-600 text-white text-xs hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-2 py-1 rounded border border-light-200 dark:border-midnight-700 text-xs text-gray-600 dark:text-gray-400 hover:bg-light-100 dark:hover:bg-midnight-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{note.content}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
