const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('aicte_auth_token');
}

export function getCurrentUser(): any | null {
  const userStr = localStorage.getItem('aicte_user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function setAuthSession(token: string, user: any) {
  localStorage.setItem('aicte_auth_token', token);
  localStorage.setItem('aicte_user', JSON.stringify(user));
}

export function clearAuthSession() {
  localStorage.removeItem('aicte_auth_token');
  localStorage.removeItem('aicte_user');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}: Request failed`);
  }

  return data as T;
}

export const api = {
  auth: {
    login: (username: string, password?: string) =>
      request<{ token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password: password || 'password123' })
      }),
    demoSwitch: (role?: string, username?: string) =>
      request<{ token: string; user: any }>('/auth/demo-switch', {
        method: 'POST',
        body: JSON.stringify({ role, username })
      }),
    getDemoAccounts: () =>
      request<{ accounts: any[] }>('/auth/demo-accounts')
  },

  applications: {
    list: (params?: Record<string, any>) => {
      const qs = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') qs.append(k, String(v));
        });
      }
      return request<{ applications: any[]; count: number }>(`/applications?${qs.toString()}`);
    },
    get: (id: string) =>
      request<any>(`/applications/${id}`),
    create: (data: any) =>
      request<{ application: any }>('/applications', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    update: (id: string, data: any) =>
      request<{ application: any }>(`/applications/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    submit: (id: string) =>
      request<{ message: string; application: any }>(`/applications/${id}/submit`, {
        method: 'POST'
      }),
    runScrutiny: (id: string) =>
      request<{ result: any }>(`/applications/${id}/run-scrutiny`, {
        method: 'POST'
      })
  },

  documents: {
    upload: (formData: FormData) =>
      request<{ message: string; document: any; extractedFields: any[] }>('/documents/upload', {
        method: 'POST',
        body: formData
      }),
    verify: (id: string, data: { status: string; notes?: string; rejectionReason?: string }) =>
      request<{ document: any }>(`/documents/${id}/verify`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    reExtract: (id: string) =>
      request<{ document: any; extractedFields: any[] }>(`/documents/${id}/extract`, {
        method: 'POST'
      })
  },

  compliance: {
    getRules: () =>
      request<{ rules: any[] }>('/compliance/rules'),
    updateRule: (id: string, data: any) =>
      request<{ rule: any }>(`/compliance/rules/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    getFindings: (appId: string) =>
      request<{ findings: any[] }>(`/compliance/findings/${appId}`),
    overrideFinding: (id: string, disposition: string, justification: string) =>
      request<{ message: string; finding: any }>(`/compliance/findings/${id}/override`, {
        method: 'POST',
        body: JSON.stringify({ disposition, justification })
      })
  },

  workflow: {
    transition: (applicationId: string, targetStage: string, actionName?: string, comments?: string) =>
      request<{ message: string; application: any }>('/workflow/transition', {
        method: 'POST',
        body: JSON.stringify({ applicationId, targetStage, actionName, comments })
      }),
    assign: (applicationId: string, officerId: string) =>
      request<{ message: string; application: any }>('/workflow/assign', {
        method: 'POST',
        body: JSON.stringify({ applicationId, officerId })
      }),
    addComment: (applicationId: string, category: string, comment: string) =>
      request<{ comment: any }>('/workflow/comments', {
        method: 'POST',
        body: JSON.stringify({ applicationId, category, comment })
      }),
    createClarification: (data: { applicationId: string; requestQuery: string; requestedFields?: string[]; deadlineDays?: number }) =>
      request<{ clarification: any }>('/workflow/clarification', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    respondClarification: (id: string, remarks: string, responseDocumentId?: string) =>
      request<{ message: string; clarification: any }>(`/workflow/clarification/${id}/respond`, {
        method: 'POST',
        body: JSON.stringify({ remarks, responseDocumentId })
      }),
    recordDecision: (applicationId: string, decision: 'APPROVED' | 'REJECTED', remarks: string) =>
      request<{ message: string; application: any }>('/workflow/decision', {
        method: 'POST',
        body: JSON.stringify({ applicationId, decision, remarks })
      })
  },

  analytics: {
    getOverview: () =>
      request<any>('/analytics/overview')
  },

  audit: {
    getLogs: (params?: Record<string, any>) => {
      const qs = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v) qs.append(k, String(v));
        });
      }
      return request<{ totalBlocks: number; auditLogs: any[] }>(`/audit?${qs.toString()}`);
    },
    verifyChain: () =>
      request<{ isValid: boolean; checkedBlocks: number; genesisHash?: string; latestBlockHash?: string; message: string }>('/audit/verify', {
        method: 'POST'
      }),
    getConfigurations: () =>
      request<{ configurations: any[] }>('/audit/configurations'),
    updateConfiguration: (key: string, value: string) =>
      request<{ configuration: any }>(`/audit/configurations/${key}`, {
        method: 'PUT',
        body: JSON.stringify({ value })
      })
  },

  notifications: {
    list: () =>
      request<{ notifications: any[]; unreadCount: number }>('/notifications'),
    markRead: (id: string) =>
      request<{ success: boolean }>(`/notifications/${id}/read`, {
        method: 'PUT'
      }),
    markAllRead: () =>
      request<{ success: boolean }>('/notifications/read-all', {
        method: 'POST'
      })
  }
};
