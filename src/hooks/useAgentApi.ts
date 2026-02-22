import type {
  AgentCaseListResponse,
  AgentNote,
  AgentActivityEntry,
  AgentRosterItem,
  AgentCustomerProfile,
} from '../types';

async function fetchWithAuth(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return res.json();
}

function buildQuery(params: Record<string, unknown>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
  }
  const str = qs.toString();
  return str ? `?${str}` : '';
}

export function useAgentApi() {
  return {
    // Case queue
    fetchCases: (params: Record<string, unknown>): Promise<AgentCaseListResponse> =>
      fetchWithAuth(`/api/agent/cases${buildQuery(params)}`),

    // Case detail (returns full case object with all related data)
    fetchCaseDetail: (id: string): Promise<any> =>
      fetchWithAuth(`/api/agent/cases/${encodeURIComponent(id)}`),

    // Update case
    updateCase: (id: string, body: { status?: string; priority?: string }) =>
      fetchWithAuth(`/api/agent/cases/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),

    // Assign
    assignCase: (caseId: string, agentId: string) =>
      fetchWithAuth(`/api/agent/cases/${encodeURIComponent(caseId)}/assign`, {
        method: 'POST',
        body: JSON.stringify({ agentId }),
      }),

    unassignCase: (caseId: string) =>
      fetchWithAuth(`/api/agent/cases/${encodeURIComponent(caseId)}/assign`, {
        method: 'DELETE',
      }),

    // Notes
    fetchNotes: (caseId: string): Promise<{ notes: AgentNote[] }> =>
      fetchWithAuth(`/api/agent/cases/${encodeURIComponent(caseId)}/notes`),

    addNote: (caseId: string, content: string): Promise<{ note: AgentNote }> =>
      fetchWithAuth(`/api/agent/cases/${encodeURIComponent(caseId)}/notes`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      }),

    editNote: (caseId: string, noteId: string, content: string): Promise<{ note: AgentNote }> =>
      fetchWithAuth(`/api/agent/cases/${encodeURIComponent(caseId)}/notes/${encodeURIComponent(noteId)}`, {
        method: 'PATCH',
        body: JSON.stringify({ content }),
      }),

    deleteNote: (caseId: string, noteId: string): Promise<{ success: boolean }> =>
      fetchWithAuth(`/api/agent/cases/${encodeURIComponent(caseId)}/notes/${encodeURIComponent(noteId)}`, {
        method: 'DELETE',
      }),

    // Reply to customer
    sendReply: (caseId: string, content: string): Promise<{ success: boolean; message: any }> =>
      fetchWithAuth(`/api/agent/cases/${encodeURIComponent(caseId)}/reply`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      }),

    // Activity
    fetchActivity: (caseId: string): Promise<{ activity: AgentActivityEntry[] }> =>
      fetchWithAuth(`/api/agent/cases/${encodeURIComponent(caseId)}/activity`),

    // Customer
    fetchCustomer: (userId: string): Promise<AgentCustomerProfile> =>
      fetchWithAuth(`/api/agent/customers/${encodeURIComponent(userId)}`),

    fetchCustomerCases: (userId: string, params: Record<string, unknown>): Promise<AgentCaseListResponse> =>
      fetchWithAuth(`/api/agent/customers/${encodeURIComponent(userId)}/cases${buildQuery(params)}`),

    // Agents
    fetchAgents: (): Promise<{ agents: AgentRosterItem[] }> =>
      fetchWithAuth('/api/agent/agents'),

    // Admin
    changeUserRole: (userId: string, role: string): Promise<{ success: boolean; user: { id: string; email: string; role: string } }> =>
      fetchWithAuth(`/api/agent/users/${encodeURIComponent(userId)}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role }),
      }),
  };
}
