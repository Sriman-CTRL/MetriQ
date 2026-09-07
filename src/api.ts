/**
 * METRIQ Frontend API Client
 * Connects React UI to the full-stack Express + MongoDB backend.
 */

const API_BASE = '/api';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// Token management
const TOKEN_KEY = 'metriq-jwt-token';
export const getStoredToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setStoredToken = (token: string | null) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
};

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json();
    return data as ApiResponse<T>;
  } catch (err: any) {
    console.error(`API Error [${endpoint}]:`, err);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: err.message || 'Failed to communicate with the server.',
      },
    };
  }
}

// Demo account credentials mapping
export const DEMO_CREDENTIALS: Record<string, { email: string; pass: string }> = {
  admin: { email: 'admin@metriq.demo', pass: 'Password123!' },
  office: { email: 'office@metriq.demo', pass: 'Password123!' },
  field: { email: 'lmo@metriq.demo', pass: 'Password123!' },
  inspection: { email: 'inspection@metriq.demo', pass: 'Password123!' },
  owner: { email: 'owner@metriq.demo', pass: 'Password123!' },
};

export const api = {
  auth: {
    login: async (email: string, password = 'Password123!') => {
      const res = await apiFetch<{ token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (res.success && res.data?.token) {
        setStoredToken(res.data.token);
      }
      return res;
    },
    demoLogin: async (role: string) => {
      const creds = DEMO_CREDENTIALS[role] || DEMO_CREDENTIALS['owner'];
      return api.auth.login(creds.email, creds.pass);
    },
    me: async () => apiFetch<{ user: any }>('/auth/me'),
    logout: async () => {
      await apiFetch('/auth/logout', { method: 'POST' });
      setStoredToken(null);
    },
  },

  instruments: {
    list: async (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiFetch<{ instruments: any[]; total: number }>(`/instruments${qs}`);
    },
    get: async (id: string) => apiFetch<{ instrument: any }>(`/instruments/${id}`),
    create: async (data: any) =>
      apiFetch<{ instrument: any }>('/instruments', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: async (id: string, data: any) =>
      apiFetch<{ instrument: any }>(`/instruments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  applications: {
    list: async (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiFetch<{ applications: any[]; total: number }>(`/applications${qs}`);
    },
    get: async (id: string) => apiFetch<{ application: any }>(`/applications/${id}`),
    create: async (data: any) =>
      apiFetch<{ application: any }>('/applications', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    scrutinize: async (id: string, remarks?: string) =>
      apiFetch<{ application: any }>(`/applications/${id}/scrutinize`, {
        method: 'POST',
        body: JSON.stringify({ remarks }),
      }),
    approve: async (id: string, remarks?: string) =>
      apiFetch<{ application: any }>(`/applications/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ remarks }),
      }),
    return: async (id: string, remarks: string) =>
      apiFetch<{ application: any }>(`/applications/${id}/return`, {
        method: 'POST',
        body: JSON.stringify({ remarks }),
      }),
    reject: async (id: string, remarks: string) =>
      apiFetch<{ application: any }>(`/applications/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ remarks }),
      }),
    assign: async (id: string, officerId: string, assignmentType = 'LMO', priority = 'Normal', notes?: string) =>
      apiFetch<{ application: any; assignedOfficer: string }>(`/applications/${id}/assign`, {
        method: 'POST',
        body: JSON.stringify({ officerId, assignmentType, priority, notes }),
      }),
    schedule: async (id: string, date: string, time: string, officerName?: string) =>
      apiFetch<{ application: any; hasConflict: boolean; conflictMessage?: string }>(`/applications/${id}/schedule`, {
        method: 'POST',
        body: JSON.stringify({ date, time, officerName }),
      }),
  },

  verifications: {
    list: async () => apiFetch<{ verifications: any[] }>('/verifications'),
    get: async (id: string) => apiFetch<{ verification: any }>(`/verifications/${id}`),
    saveDraft: async (data: any) =>
      apiFetch<{ verification: any }>('/verifications', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    complete: async (id: string, data: any) =>
      apiFetch<{
        certificate: any;
        verification: any;
        instrument: any;
        application: any;
        verificationHash: string;
      }>(`/verifications/${id}/complete`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    tamperCheck: async (data: {
      instrumentId?: string;
      serialNumber?: string;
      manufacturer?: string;
      model?: string;
    }) =>
      apiFetch<{
        isTampered: boolean;
        instrumentId: string;
        registeredInstrument: any;
        mismatches: Array<{ field: string; registered: string; observed: string }>;
        message: string;
      }>('/verifications/tamper-check', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  certificates: {
    list: async () => apiFetch<{ certificates: any[]; total: number }>('/certificates'),
    get: async (id: string) => apiFetch<{ certificate: any }>(`/certificates/${id}`),
    verifyPublic: async (certificateNumber: string) =>
      apiFetch<any>(`/public/certificates/verify/${encodeURIComponent(certificateNumber)}`),
  },

  audit: {
    list: async (params?: Record<string, string | number>) => {
      const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
      return apiFetch<{ logs: any[]; total: number }>(`/audit-logs${qs}`);
    },
  },

  config: {
    get: async (state?: string) => {
      const qs = state ? `?state=${encodeURIComponent(state)}` : '';
      return apiFetch<{ config?: any; configs?: any[] }>(`/config${qs}`);
    },
    update: async (state: string, data: any) =>
      apiFetch<{ config: any }>(`/config/${encodeURIComponent(state)}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  sync: {
    batch: async (operations: any[]) =>
      apiFetch<{ processedCount: number; results: any[] }>('/sync', {
        method: 'POST',
        body: JSON.stringify({ operations }),
      }),
  },

  evidence: {
    upload: async (formData: FormData) => {
      const token = getStoredToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/evidence/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });
      return (await res.json()) as ApiResponse<{ document: any }>;
    },
  },

  notifications: {
    list: async () => apiFetch<{ notifications: any[]; unreadCount: number }>('/notifications'),
    markRead: async (id: string) => apiFetch<{ notification: any }>(`/notifications/${id}/read`, { method: 'PATCH' }),
    markAllRead: async () => apiFetch<{ message: string }>('/notifications/mark-all-read', { method: 'POST' }),
  },

  system: {
    getDiagnostics: async () => apiFetch<any>('/public/diagnostics'),
    resetDemoData: async () => apiFetch<any>('/public/reset-demo', { method: 'POST' }),
  },

  grievances: {
    submit: async (data: {
      instrumentId?: string;
      certificateNumber?: string;
      merchantName?: string;
      location?: string;
      violationType: string;
      description: string;
      reporterName?: string;
      reporterPhone?: string;
    }) =>
      apiFetch<{ grievanceId: string; status: string; message: string }>('/public/grievances', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    list: async (params?: { status?: string; violationType?: string; search?: string }) => {
      const query = new URLSearchParams();
      if (params?.status) query.set('status', params.status);
      if (params?.violationType) query.set('violationType', params.violationType);
      if (params?.search) query.set('search', params.search);
      return apiFetch<any[]>(`/grievances?${query.toString()}`);
    },
    getStats: async () => apiFetch<any>('/grievances/stats'),
    getById: async (id: string) => apiFetch<any>(`/grievances/${id}`),
    updateStatus: async (
      id: string,
      data: {
        status: string;
        officerRemarks?: string;
        assignedOfficerName?: string;
        penaltyAmount?: number;
        statutorySection?: string;
      }
    ) =>
      apiFetch<any>(`/grievances/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },

  seals: {
    list: async (params?: { status?: string; allocatedTo?: string; search?: string; batchNumber?: string }) => {
      const query = new URLSearchParams();
      if (params?.status) query.set('status', params.status);
      if (params?.allocatedTo) query.set('allocatedTo', params.allocatedTo);
      if (params?.search) query.set('search', params.search);
      if (params?.batchNumber) query.set('batchNumber', params.batchNumber);
      return apiFetch<any[]>(`/seals?${query.toString()}`);
    },
    getStats: async () => apiFetch<any>('/seals/stats'),
    batchGenerate: async (data: {
      prefix?: string;
      startNumber: number | string;
      count: number;
      sealType?: string;
      allocatedToId?: string;
    }) =>
      apiFetch<any>('/seals/batch-generate', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    affix: async (data: {
      sealNumber: string;
      instrumentId: string;
      certificateNumber?: string;
      merchantName?: string;
      location?: string;
      officerName?: string;
    }) =>
      apiFetch<any>('/seals/affix', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    reportTamper: async (data: { sealNumber: string; reason: string; inspectorName?: string }) =>
      apiFetch<any>('/seals/report-tamper', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  licensing: {
    getStats: async () => apiFetch<any>('/licensing/stats'),
    listLicenses: async (params?: { type?: string; status?: string; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.type) q.set('type', params.type);
      if (params?.status) q.set('status', params.status);
      if (params?.search) q.set('search', params.search);
      return apiFetch<any[]>(`/licensing/licenses?${q.toString()}`);
    },
    createLicense: async (data: any) =>
      apiFetch<any>('/licensing/licenses', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateLicenseStatus: async (id: string, data: { status: string; remarks?: string }) =>
      apiFetch<any>(`/licensing/licenses/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    listTac: async (params?: { search?: string; instrumentClass?: string }) => {
      const q = new URLSearchParams();
      if (params?.search) q.set('search', params.search);
      if (params?.instrumentClass) q.set('instrumentClass', params.instrumentClass);
      return apiFetch<any[]>(`/licensing/tac?${q.toString()}`);
    },
    createTac: async (data: any) =>
      apiFetch<any>('/licensing/tac', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    listStandards: async () => apiFetch<any[]>('/licensing/standards'),
    calibrateStandard: async (id: string, data: any) =>
      apiFetch<any>(`/licensing/standards/${id}/calibrate`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  treasury: {
    getStats: async () => apiFetch<any>('/treasury/stats'),
    listChallans: async (params?: { status?: string; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.status) q.set('status', params.status);
      if (params?.search) q.set('search', params.search);
      return apiFetch<any[]>(`/treasury/challans?${q.toString()}`);
    },
    generateChallan: async (data: any) =>
      apiFetch<any>('/treasury/generate-challan', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    payChallan: async (data: { challanNumber: string; paymentMethod?: string }) =>
      apiFetch<any>('/treasury/pay-challan', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  dispatch: {
    getStats: async () => apiFetch<any>('/dispatch/stats'),
    listLogs: async (params?: { channel?: string; trigger?: string; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.channel) q.set('channel', params.channel);
      if (params?.trigger) q.set('trigger', params.trigger);
      if (params?.search) q.set('search', params.search);
      return apiFetch<any[]>(`/dispatch/logs?${q.toString()}`);
    },
    sendNotification: async (data: any) =>
      apiFetch<any>('/dispatch/send', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    simulateExpirySweep: async () =>
      apiFetch<any>('/dispatch/simulate-expiry-sweep', {
        method: 'POST',
      }),
  },

  lmpc: {
    getStats: async () => apiFetch<any>('/lmpc/stats'),
    listRegistrations: async (params?: { applicantType?: string; status?: string; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.applicantType) q.set('applicantType', params.applicantType);
      if (params?.status) q.set('status', params.status);
      if (params?.search) q.set('search', params.search);
      return apiFetch<any[]>(`/lmpc/registrations?${q.toString()}`);
    },
    createRegistration: async (data: any) =>
      apiFetch<any>('/lmpc/registrations', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    listSamples: async (params?: { commodityType?: string; result?: string; district?: string; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.commodityType) q.set('commodityType', params.commodityType);
      if (params?.result) q.set('result', params.result);
      if (params?.district) q.set('district', params.district);
      if (params?.search) q.set('search', params.search);
      return apiFetch<any[]>(`/lmpc/samples?${q.toString()}`);
    },
    createSample: async (data: any) =>
      apiFetch<any>('/lmpc/samples', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    takeSampleAction: async (id: string, data: any) =>
      apiFetch<any>(`/lmpc/samples/${id}/action`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  raids: {
    getStats: async () => apiFetch<any>('/raids/stats'),
    listRaids: async (params?: { premiseType?: string; status?: string; district?: string; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.premiseType) q.set('premiseType', params.premiseType);
      if (params?.status) q.set('status', params.status);
      if (params?.district) q.set('district', params.district);
      if (params?.search) q.set('search', params.search);
      return apiFetch<any[]>(`/raids?${q.toString()}`);
    },
    createRaid: async (data: any) =>
      apiFetch<any>('/raids', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    listPanchnamas: async (params?: { compoundingStatus?: string; district?: string; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.compoundingStatus) q.set('compoundingStatus', params.compoundingStatus);
      if (params?.district) q.set('district', params.district);
      if (params?.search) q.set('search', params.search);
      return apiFetch<any[]>(`/raids/panchnamas?${q.toString()}`);
    },
    createPanchnama: async (data: any) =>
      apiFetch<any>('/raids/panchnamas', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    compoundPanchnama: async (id: string, data: any) =>
      apiFetch<any>(`/raids/panchnamas/${id}/compound`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  telemetry: {
    getStats: async () => apiFetch<any>('/telemetry/stats'),
    listWeighbridges: async (params?: { category?: string; status?: string; district?: string; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.category) q.set('category', params.category);
      if (params?.status) q.set('status', params.status);
      if (params?.district) q.set('district', params.district);
      if (params?.search) q.set('search', params.search);
      return apiFetch<any[]>(`/telemetry/weighbridges?${q.toString()}`);
    },
    getWeighbridge: async (id: string) => apiFetch<any>(`/telemetry/weighbridges/${id}`),
    getTransactions: async (id: string) => apiFetch<any[]>(`/telemetry/weighbridges/${id}/transactions`),
    logTransaction: async (id: string, data: any) =>
      apiFetch<any>(`/telemetry/weighbridges/${id}/transactions`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    toggleLock: async (id: string, data: { lock: boolean; reason?: string }) =>
      apiFetch<any>(`/telemetry/weighbridges/${id}/lock`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    adjustZero: async (id: string, data: { offsetKg: number }) =>
      apiFetch<any>(`/telemetry/weighbridges/${id}/zero-adjust`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  analytics: {
    getOverview: async (timeRange?: string) => {
      const q = timeRange ? `?timeRange=${encodeURIComponent(timeRange)}` : '';
      return apiFetch<any>(`/analytics/overview${q}`);
    },
  },
};
