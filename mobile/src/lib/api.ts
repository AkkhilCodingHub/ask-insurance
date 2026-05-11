import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// ── Config ────────────────────────────────────────────────────────────────────
function resolveBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:4000`;
  }
  return 'http://localhost:4000';
}

const BASE_URL = resolveBaseUrl();
if (__DEV__) console.log('[API] base URL →', BASE_URL);

// ── Token storage ─────────────────────────────────────────────────────────────

const TOKEN_KEY         = 'auth_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const PREFS_KEY         = 'user_prefs';

export async function getToken(): Promise<string | null> {
  try { return await SecureStore.getItemAsync(TOKEN_KEY); } catch { return null; }
}
export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}
export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  try { return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY); } catch { return null; }
}
export async function setRefreshToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
}
export async function clearRefreshToken(): Promise<void> {
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

/** Clears both tokens — use on logout or session expiry */
export async function clearAllTokens(): Promise<void> {
  await Promise.all([clearToken(), clearRefreshToken()]);
}

// ── User preferences ──────────────────────────────────────────────────────────

export interface UserPrefs {
  notifPolicy:    boolean;
  notifClaims:    boolean;
  notifOffers:    boolean;
  notifReminders: boolean;
  darkMode:       boolean;
  language:       string;
}

export const DEFAULT_PREFS: UserPrefs = {
  notifPolicy:    true,
  notifClaims:    true,
  notifOffers:    false,
  notifReminders: true,
  darkMode:       false,
  language:       'en',
};

export async function getPrefs(): Promise<UserPrefs> {
  try {
    const raw = await SecureStore.getItemAsync(PREFS_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export async function setPrefs(update: Partial<UserPrefs>): Promise<void> {
  const current = await getPrefs();
  const next = { ...current, ...update };
  await SecureStore.setItemAsync(PREFS_KEY, JSON.stringify(next));
}

// ── Session-expired callback (set by auth context to avoid circular import) ───

type LogoutCallback = () => void;
let onSessionExpiredCallback: LogoutCallback | null = null;

export function registerSessionExpiredCallback(cb: LogoutCallback | null): void {
  onSessionExpiredCallback = cb;
}

// ── Refresh token logic (raw fetch — NOT through request() to avoid loops) ───

let isRefreshing = false;
let pendingQueue: Array<(newToken: string | null) => void> = [];

async function attemptTokenRefresh(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      await clearAllTokens();
      return null;
    }
    const data = await res.json() as { token: string; refreshToken: string };
    await setToken(data.token);
    await setRefreshToken(data.refreshToken);
    if (__DEV__) console.log('[API] token refreshed silently');
    return data.token;
  } catch {
    await clearAllTokens();
    return null;
  }
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  auth = false,
  _skipRefresh = false   // prevents re-entrant refresh loops
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {})
  };

  if (auth) {
    const token = await getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const method = options.method ?? 'GET';
  const url    = `${BASE_URL}${path}`;
  const t0     = Date.now();

  if (__DEV__) {
    const logHeaders = { ...headers };
    if (logHeaders['Authorization']) {
      logHeaders['Authorization'] = logHeaders['Authorization'].slice(0, 20) + '…';
    }
    const body = options.body
      ? (() => { try { return JSON.parse(options.body as string); } catch { return options.body; } })()
      : undefined;
    console.group(`▶ ${method} ${url}`);
    console.log('Headers :', logHeaders);
    if (body !== undefined) console.log('Body    :', body);
    console.groupEnd();
  }

  let res: Response;
  try {
    res = await fetch(url, { ...options, headers });
  } catch (networkErr) {
    if (__DEV__) {
      console.group(`✖ NETWORK ERROR  ${method} ${url}`);
      console.error('Error   :', networkErr);
      console.groupEnd();
    }
    throw networkErr;
  }

  const elapsed = Date.now() - t0;
  let json: unknown;
  try { json = await res.json(); } catch { json = null; }

  if (__DEV__) {
    const resHeaders: Record<string, string> = {};
    res.headers.forEach((v, k) => { resHeaders[k] = v; });
    const icon = res.ok ? '◀' : '✖';
    console.group(`${icon} ${res.status} ${method} ${url}  (+${elapsed}ms)`);
    if (!res.ok) console.warn('⚠ Request failed');
    console.log('Status  :', res.status, res.statusText);
    console.log('Headers :', resHeaders);
    console.log('Body    :', json);
    console.groupEnd();
  }

  // ── Auto-refresh on 401 ───────────────────────────────────────────────────
  if (res.status === 401 && auth && !_skipRefresh) {
    if (isRefreshing) {
      // Queue this request — it will be retried once the in-flight refresh resolves
      return new Promise<T>((resolve, reject) => {
        pendingQueue.push((newToken) => {
          if (!newToken) {
            reject(new ApiError('Session expired', 401));
            return;
          }
          // Retry with fresh token already in header, skip another refresh attempt
          const retryHeaders = { ...headers, Authorization: `Bearer ${newToken}` };
          request<T>(path, { ...options, headers: retryHeaders }, false, true)
            .then(resolve)
            .catch(reject);
        });
      });
    }

    isRefreshing = true;
    const newToken = await attemptTokenRefresh();
    isRefreshing = false;

    // Flush all queued requests
    const queue = pendingQueue;
    pendingQueue = [];
    queue.forEach(cb => cb(newToken));

    if (!newToken) {
      onSessionExpiredCallback?.();
      throw new ApiError('Session expired — please sign in again', 401);
    }

    // Retry the original request once with new token
    return request<T>(path, options, auth, true);
  }
  // ─────────────────────────────────────────────────────────────────────────

  if (!res.ok) {
    const errBody = json as Record<string, unknown> | null;
    throw new ApiError((errBody?.error as string) ?? 'Request failed', res.status);
  }

  return json as T;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ApiUser {
  id:              string;
  phone:           string;
  name:            string | null;
  email:           string | null;
  dateOfBirth:     string | null;
  gender:          string | null;
  address:         string | null;
  city:            string | null;
  state:           string | null;
  pincode:         string | null;
  kycStatus:       string;          // pending | verified | rejected
  aadhaarVerified: boolean;
  kycVerifiedAt:   string | null;
}

export interface ApiInsurer {
  id:          string;
  name:        string;
  shortName:   string;
  brandColor:  string;
  claimsRatio: number;
  rating:      number;
  logo:        string;
  tagline?:    string;
}

export interface ApiPlan {
  id:          string;
  name:        string;
  slug:        string;
  type:        string;
  description: string;
  features:    string;       // JSON string — parse with JSON.parse
  minAge:      number | null;
  maxAge:      number | null;
  minCover:    number;
  maxCover:    number;
  basePremium: number;
  isFeatured:  boolean;
  insurer:     ApiInsurer;
}

export interface ApiPolicy {
  id:            string;
  policyNumber:  string;
  type:          string;
  provider:      string;
  sumInsured:    number;
  premium:       number;
  status:        string;
  startDate:     string;
  endDate:       string;
  paymentStatus: string;
  documentUrl:   string | null;
  notes:         string | null;
}

export interface ApiClaim {
  id:            string;
  claimNumber:   string;
  type:          string;
  amount:        number;
  status:        string;
  description:   string;
  incidentDate:  string;
  submittedDate: string;
  policy?: {
    id:           string;
    policyNumber: string;
    type:         string;
    provider:     string;
  };
}

export interface ApiPayment {
  id:          string;
  amount:      number;
  currency:    string;
  status:      string;  // pending, success, failed, refunded
  provider:    string | null;
  providerRef: string | null;
  createdAt:   string;
  policy: {
    id:           string;
    policyNumber: string;
    type:         string;
    provider:     string;
  };
}

export interface QuoteOffer {
  id:           string;
  planId:       string;
  planName:     string;
  insurer:      string;
  insurerShort: string;
  netPremium:   number;
  gst:          number;
  premium:      number; // total = net + gst
  sumInsured:   number;
  rating:       number;
  claimsRatio:  string;
  features:     string[];
  recommended:  boolean;
}

export interface ApiQuote {
  id:        string;
  type:      string;
  quotes:    QuoteOffer[];
  expiresAt: string;
}

export interface DashboardData {
  user:            { id: string; name: string | null; phone: string; email: string | null };
  activePolicies:  number;
  recentClaims:    ApiClaim[];
  policies:        ApiPolicy[];
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export const authApi = {
  sendOTP: (phone: string) =>
    request<{ success: boolean; isNewUser: boolean }>('/api/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone })
    }),

  verifyOTP: (phone: string, otp: string) =>
    request<{ success: boolean; token: string; refreshToken: string; user: ApiUser; isNewUser: boolean }>(
      '/api/auth/verify-otp',
      { method: 'POST', body: JSON.stringify({ phone, otp }) }
    ),

  verifyFirebase: (idToken: string) =>
    request<{ success: boolean; token: string; refreshToken: string; user: ApiUser; isNewUser: boolean }>(
      '/api/auth/verify-firebase',
      { method: 'POST', body: JSON.stringify({ idToken }) }
    ),

  refresh: (refreshToken: string) =>
    request<{ token: string; refreshToken: string }>('/api/auth/refresh', {
      method: 'POST', body: JSON.stringify({ refreshToken })
    }),

  me: () =>
    request<{ user: ApiUser }>('/api/auth/me', {}, true)
};

// ── Users ─────────────────────────────────────────────────────────────────────

export const usersApi = {
  updateProfile: (data: {
    name?:        string;
    email?:       string;
    dateOfBirth?: string;
    gender?:      string;
    address?:     string;
    city?:        string;
    state?:       string;
    pincode?:     string;
  }) =>
    request<{ user: ApiUser }>('/api/users/profile', {
      method: 'PUT',
      body:   JSON.stringify(data)
    }, true),

  dashboard: () =>
    request<DashboardData>('/api/users/dashboard', {}, true)
};

// ── Plans ─────────────────────────────────────────────────────────────────────

export const plansApi = {
  list: (params?: { type?: string; search?: string; featured?: boolean; page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.type)     qs.set('type',     params.type);
    if (params?.search)   qs.set('search',   params.search);
    if (params?.featured) qs.set('featured', 'true');
    if (params?.page)     qs.set('page',     String(params.page));
    if (params?.limit)    qs.set('limit',    String(params.limit));
    const query = qs.toString();
    return request<{ plans: ApiPlan[]; total: number; page: number; limit: number; hasMore: boolean }>(
      `/api/plans${query ? `?${query}` : ''}`
    );
  },
  get: (id: string) =>
    request<{ plan: ApiPlan }>(`/api/plans/${id}`)
};

// ── Policies ──────────────────────────────────────────────────────────────────

export const policiesApi = {
  list: () =>
    request<{ policies: ApiPolicy[] }>('/api/policies', {}, true),
  get: (id: string) =>
    request<{ policy: ApiPolicy }>(`/api/policies/${id}`, {}, true),
  renew: (id: string) =>
    request<{ policy: ApiPolicy }>(`/api/policies/${id}/renew`, {
      method: 'PUT', body: JSON.stringify({})
    }, true)
};

// ── Claims ────────────────────────────────────────────────────────────────────

export const claimsApi = {
  list: () =>
    request<{ claims: ApiClaim[] }>('/api/claims', {}, true),
  create: (data: {
    policyId:     string;
    type:         string;
    amount:       number;
    description:  string;
    incidentDate: string;
  }) =>
    request<{ claim: ApiClaim }>('/api/claims', {
      method: 'POST',
      body:   JSON.stringify(data)
    }, true)
};

// ── Quotes ────────────────────────────────────────────────────────────────────

export const quotesApi = {
  create: (type: string, details: Record<string, unknown>, planId?: string) =>
    request<{ quote: ApiQuote }>('/api/quotes', {
      method: 'POST',
      body:   JSON.stringify({ type, details, planId })
    }, true),
  list: () =>
    request<{ quotes: ApiQuote[] }>('/api/quotes', {}, true),
  approve: (quoteId: string) =>
    request<{ policy: ApiPolicy }>(`/api/quotes/${quoteId}/approve`, {
      method: 'POST',
    }, true),
};

export interface ApiApplication {
  id:           string;
  policyNumber: string;
  status:       string;
  paymentStatus:string;
  plan:         string;
  insurer:      string;
  sumInsured:   number;
  netPremium:   number;
  gst:          number;
  totalPremium: number;
  message:      string;
}

// ── Payments ──────────────────────────────────────────────────────────────────

export const paymentsApi = {
  list: () => request<{ payments: ApiPayment[] }>('/api/payments', {}, true),
  createRazorpayLink: (policyId?: string, quoteId?: string) =>
    request<{ paymentUrl: string; paymentLinkId: string; amount: number }>(
      '/api/payments/razorpay/create-link',
      { method: 'POST', body: JSON.stringify({ policyId, quoteId }) },
      true
    ),
  savePushToken: (token: string) =>
    request<void>('/api/users/push-token', { method: 'PUT', body: JSON.stringify({ token }) }, true),
};

// ── Chat ──────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id:             string;
  content:        string;
  senderType:     'user' | 'admin';
  senderId:       string;
  readAt:         string | null;
  createdAt:      string;
  conversationId: string;
}

/** User summary included on admin/agent conversation payloads */
export type ConversationUser = {
  id:    string;
  name:  string | null;
  phone: string | null;
  email?: string | null;
};

export interface Conversation {
  id:        string;
  subject:   string | null;
  /** API may return additional string statuses over time; agent UI filters locally */
  status:    string;
  createdAt: string;
  updatedAt: string;
  userId:    string;
  adminId:   string | null;
  admin:     { id: string; name: string } | null;
  /** Populated for customer chat; list endpoints may return only the latest message */
  user?:     ConversationUser | null;
  messages:  ChatMessage[];
  _count?:   { messages: number };
}

export const chatApi = {
  getConversations: () =>
    request<{ conversations: Conversation[] }>('/api/chat/conversations', {}, true),

  getConversation: (id: string) =>
    request<{ conversation: Conversation }>(`/api/chat/conversations/${id}`, {}, true),

  getOrCreate: (subject?: string) =>
    request<{ conversation: Conversation }>('/api/chat/conversations', {
      method: 'POST',
      body:   JSON.stringify({ subject: subject ?? 'Support' })
    }, true),

  getMessages: (conversationId: string, after?: string) => {
    const qs = after ? `?after=${encodeURIComponent(after)}` : '';
    return request<{ messages: ChatMessage[] }>(
      `/api/chat/conversations/${conversationId}/messages${qs}`,
      {},
      true
    );
  },

  sendMessage: (conversationId: string, content: string) =>
    request<{ message: ChatMessage }>(`/api/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      body:   JSON.stringify({ content })
    }, true)
};

// ── Agent (admin) token storage ───────────────────────────────────────────────

const AGENT_TOKEN_KEY = 'agent_auth_token';

export async function getAgentToken(): Promise<string | null> {
  try { return await SecureStore.getItemAsync(AGENT_TOKEN_KEY); } catch { return null; }
}
export async function setAgentToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(AGENT_TOKEN_KEY, token);
}
export async function clearAgentToken(): Promise<void> {
  await SecureStore.deleteItemAsync(AGENT_TOKEN_KEY);
}

// ── Agent request wrapper (uses agent JWT → /api/admin/* routes) ──────────────

async function agentRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getAgentToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  let json: unknown;
  try { json = await res.json(); } catch { json = null; }
  if (!res.ok) {
    const body = json as Record<string, unknown> | null;
    throw new ApiError((body?.error as string) ?? 'Request failed', res.status);
  }
  return json as T;
}

// ── Agent types ───────────────────────────────────────────────────────────────

export interface AgentAdmin {
  id:    string;
  name:  string;
  email: string;
  role:  string;
}

export interface AgentQuote {
  id:              string;
  type:            string;
  status:          string;
  details:         string | Record<string, unknown>;
  adminResponse:   { insurer: string; planName: string; netPremium: number; gst: number; totalPremium: number; notes?: string } | null;
  adminResponseAt: string | null;
  approvedAt:      string | null;
  createdAt:       string;
  user:            { id: string; name: string | null; phone: string; email: string | null };
}

export interface AgentPolicy {
  id:            string;
  policyNumber:  string;
  type:          string;
  status:        string;
  paymentStatus: string;
  provider:      string;
  premium:       number;
  sumInsured:    number;
  startDate:     string;
  endDate:       string;
  documentUrl:   string | null;
  notes:         string | null;
  createdAt:     string;
  user:          { id: string; name: string | null; phone: string };
  _count:        { claims: number };
}

export interface AgentClaim {
  id:            string;
  claimNumber:   string;
  policyId:      string;
  type:          string;
  amount:        number;
  status:        string;
  description?:  string | null;
  notes?:         string | null;
  incidentDate:  string;
  createdAt:     string;
  updatedAt:     string;
  user?:         { id: string; name: string | null; phone: string };
  policy?:       { id: string; policyNumber: string; type: string; provider: string };
}

// ── Agent API ─────────────────────────────────────────────────────────────────

export const agentApi = {
  login: (email: string, password: string) =>
    agentRequest<{ token: string; admin: AgentAdmin }>('/api/admin/auth/login', {
      method: 'POST',
      body:   JSON.stringify({ email, password }),
    }),

  getQuotes: (status?: string, page = 1) => {
    const qs = new URLSearchParams({ page: String(page), limit: '50' });
    if (status) qs.set('status', status);
    return agentRequest<{ quotes: AgentQuote[]; total: number }>(`/api/admin/quotes?${qs}`);
  },

  respondToQuote: (quoteId: string, data: {
    insurer: string; planName: string; netPremium: number;
    gst: number; totalPremium: number; notes?: string;
  }) =>
    agentRequest<{ quote: AgentQuote }>(`/api/admin/quotes/${quoteId}/respond`, {
      method: 'POST',
      body:   JSON.stringify(data),
    }),

  updateQuoteStatus: (quoteId: string, status: 'pending' | 'responded' | 'approved' | 'expired') =>
    agentRequest<{ quote: AgentQuote }>(`/api/admin/quotes/${quoteId}/status`, {
      method: 'PATCH',
      body:   JSON.stringify({ status }),
    }),

  generateQuotePaymentLink: (quoteId: string) =>
    agentRequest<{ paymentUrl: string; paymentLinkId: string; amount: number }>(`/api/admin/quotes/${quoteId}/payment-link`, {
      method: 'POST',
    }),

  getPolicies: (status?: string, page = 1) => {
    const qs = new URLSearchParams({ page: String(page), limit: '50' });
    if (status) qs.set('status', status);
    return agentRequest<{ policies: AgentPolicy[]; total: number }>(`/api/admin/policies?${qs}`);
  },

  getClaims: (status?: string, page = 1) => {
    const qs = new URLSearchParams({ page: String(page), limit: '100' });
    if (status) qs.set('status', status);
    return agentRequest<{ claims: AgentClaim[]; total: number }>(`/api/admin/claims?${qs}`);
  },

  updateClaimStatus: (id: string, status: 'pending' | 'approved' | 'rejected' | 'paid' | 'settled', notes?: string) =>
    agentRequest<{ claim: AgentClaim }>(`/api/admin/claims/${id}/status`, {
      method:  'PUT',
      body:    JSON.stringify({ status, ...(notes != null && notes !== '' ? { notes } : {}) }),
    }),

  updatePolicyStatus: (policyId: string, status: string) =>
    agentRequest<{ policy: AgentPolicy }>(`/api/admin/policies/${policyId}`, {
      method: 'PUT',
      body:   JSON.stringify({ status }),
    }),

  confirmPayment: (policyId: string, utrNumber: string) =>
    agentRequest<{ policy: AgentPolicy }>(`/api/admin/policies/${policyId}/confirm-payment`, {
      method: 'POST',
      body:   JSON.stringify({ utrNumber }),
    }),

  uploadPolicyDocument: async (policyId: string, data: {
    file: { uri: string; name: string; type: string };
    policyNumber: string;
    issueDate:    string;
    expiryDate:   string;
    notes?:       string;
  }) => {
    const token = await getAgentToken();
    const form = new FormData();
    form.append('document', { uri: data.file.uri, name: data.file.name, type: data.file.type } as any);
    form.append('policyNumber', data.policyNumber);
    form.append('issueDate',    data.issueDate);
    form.append('expiryDate',   data.expiryDate);
    if (data.notes) form.append('notes', data.notes);
    const res = await fetch(`${BASE_URL}/api/admin/policies/${policyId}/upload-document`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${token ?? ''}` },
      body:    form,
    });
    const json = await res.json();
    if (!res.ok) throw new ApiError((json as any)?.error ?? 'Upload failed', res.status);
    return json as { policy: AgentPolicy };
  },

  // ── Chat ──────────────────────────────────────────────────────────────────
  getConversations: (status?: string, page = 1) => {
    const qs = new URLSearchParams({ page: String(page), limit: '50' });
    if (status) qs.set('status', status);
    return agentRequest<{ conversations: Conversation[]; total: number }>(`/api/admin/chat/conversations?${qs}`);
  },

  getConversation: (id: string) =>
    agentRequest<{ conversation: Conversation }>(`/api/admin/chat/conversations/${id}`),

  getMessages: (conversationId: string, after?: string) => {
    const qs = new URLSearchParams({ limit: '100' });
    if (after) qs.set('after', after);
    return agentRequest<{ messages: ChatMessage[] }>(`/api/admin/chat/conversations/${conversationId}/messages?${qs}`);
  },

  sendMessage: (conversationId: string, content: string) =>
    agentRequest<{ message: ChatMessage }>(`/api/admin/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      body:   JSON.stringify({ content }),
    }),

  setConversationStatus: (id: string, status: 'open' | 'closed' | 'resolved') =>
    agentRequest<{ conversation: Conversation }>(`/api/admin/chat/conversations/${id}/status`, {
      method: 'PUT',
      body:   JSON.stringify({ status }),
    }),

  getChatUnread: () =>
    agentRequest<{ unread: number }>('/api/admin/chat/unread').then(r => r.unread),
};

// ── KYC ───────────────────────────────────────────────────────────────────────

export const kycApi = {
  initiate: () =>
    request<{ url: string; state: string }>('/api/kyc/initiate', {}, true),

  callback: (code: string, state: string) =>
    request<{ success: boolean; kycStatus: string; aadhaarVerified: boolean; documentsCount: number }>(
      '/api/kyc/callback',
      { method: 'POST', body: JSON.stringify({ code, state }) },
      true,
    ),

  status: () =>
    request<{
      kycStatus: string; aadhaarVerified: boolean; kycVerifiedAt: string | null; hasPan: boolean;
      kycDocType: string | null; kycDocUrl: string | null;
      kycRejectionReason: string | null; kycSubmittedAt: string | null;
    }>('/api/kyc/status', {}, true),

  uploadDocument: async (
    docType: 'aadhaar' | 'driving_license' | 'passport',
    fileUri: string,
    mimeType: string,
    fileName: string,
  ): Promise<{ success: boolean; kycStatus: string; docUrl: string }> => {
    const token = await getToken();
    const form  = new FormData();
    form.append('docType', docType);
    form.append('document', { uri: fileUri, type: mimeType, name: fileName } as any);

    const url = `${BASE_URL}/api/kyc/upload`;
    const resp = await fetch(url, {
      method:  'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body:    form,
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error ?? 'Upload failed');
    return data;
  },
};
