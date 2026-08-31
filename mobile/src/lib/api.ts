import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// ── Config ────────────────────────────────────────────────────────────────────
function resolveBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && envUrl.startsWith('http')) {
    return envUrl.endsWith('/api') ? envUrl.slice(0, -4) : envUrl;
  }
  return 'https://ask-insurance.onrender.com';
}

const getBaseUrl = () => resolveBaseUrl();
if (__DEV__) console.log('[API] base URL →', getBaseUrl());

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
    const res = await fetch(`${getBaseUrl()}/api/auth/refresh`, {
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
  const url    = `${getBaseUrl()}${path}`;
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
  customerCode?:   string | null;
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
  panNumber?:      string | null;
  kycDocType?:     string | null;
  kycDocUrl?:      string | null;
  kycVerifiedAt:   string | null;
  kycSubmittedAt?: string | null;
  kycRejectionReason?: string | null;
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
    sumInsured?:  number;
    premium?:     number;
    startDate?:   string;
    endDate?:     string;
    status?:      string;
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

// ── HTTP Shorthands ───────────────────────────────────────────────────────────

const post = <T>(path: string, body?: unknown, auth = false) =>
  request<T>(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined }, auth);

const put = <T>(path: string, body?: unknown, auth = false) =>
  request<T>(path, { method: 'PUT', body: body !== undefined ? JSON.stringify(body) : undefined }, auth);

const patch = <T>(path: string, body?: unknown, auth = false) =>
  request<T>(path, { method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined }, auth);

const del = <T>(path: string, auth = false) =>
  request<T>(path, { method: 'DELETE' }, auth);

// ── Auth ──────────────────────────────────────────────────────────────────────

export const authApi = {
  sendOTP: (phone: string) =>
    post<{ success: boolean; isNewUser: boolean; otp?: string; customerCode?: string }>('/api/auth/send-otp', { phone }),

  verifyOTP: (phone: string, otp: string) =>
    post<{ success: boolean; token: string; refreshToken: string; user: ApiUser; isNewUser: boolean }>(
      '/api/auth/verify-otp', { phone, otp }
    ),

  verifyFirebase: (idToken: string) =>
    post<{ success: boolean; token: string; refreshToken: string; user: ApiUser; isNewUser: boolean }>(
      '/api/auth/verify-firebase', { idToken }
    ),

  refresh: (refreshToken: string) =>
    post<{ token: string; refreshToken: string }>('/api/auth/refresh', { refreshToken }),

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
  }) => put<{ user: ApiUser }>('/api/users/profile', data, true),

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
  list: () => request<{ policies: ApiPolicy[] }>('/api/policies', {}, true),
  get:  (id: string) => request<{ policy: ApiPolicy }>(`/api/policies/${id}`, {}, true),
  create: (data: {
    type: string;
    provider: string;
    sumInsured: number;
    premium: number;
    durationDays?: number;
    registrationNumber?: string;
    nomineeName?: string;
    nomineeRelation?: string;
    panNumber?: string;
    aadhaarNumber?: string;
  }) => post<{ policy: ApiPolicy }>('/api/policies', data, true),
  renew:(id: string) => put<{ policy: ApiPolicy }>(`/api/policies/${id}/renew`, {}, true),
  fetchLiveProviderQuotes: (payload: {
    registrationNumber?: string;
    registrationYear?: number | string;
    registrationDate?: string;
    make?: string;
    model?: string;
    variant?: string;
    exShowroomPrice?: number;
    ncbPercent?: number;
    hasPreviousClaim?: boolean;
    selectedAddons?: string[];
    customIDV?: number;
    vehicleType?: string;
    cubicCapacity?: number | string;
  }) => post<{
    registrationNumber?: string;
    vehicleSummary: { make: string; model: string; variant: string; vehicleType: string; registrationYear?: string };
    idvDetails: {
      vehicleAgeMonths: number;
      vehicleAgeYears: number;
      depreciationPercent: number;
      standardIDV: number;
      minPermittedIDV: number;
      maxPermittedIDV: number;
      selectedIDV: number;
      isMutualAgreementRequired: boolean;
      depreciationLabel: string;
      ageBracketLabel: string;
    };
    ncbWarningAlert?: { warning: boolean; code: string; title: string; message: string } | null;
    quotes: Array<{
      id: string;
      insurerId: string;
      insurerName: string;
      shortName: string;
      logo: string;
      brandColor: string;
      claimsRatio: number;
      rating: number;
      planName: string;
      tagline: string;
      breakdown: {
        idv: number;
        baseODPremium: number;
        ncbDiscountPercent: number;
        ncbDiscountAmount: number;
        netODPremium: number;
        tpPremium: number;
        addonsCost: number;
        netPremium: number;
        gstAmount: number;
        totalPremium: number;
      };
      addonsIncluded: string[];
      features: string[];
      isRecommended?: boolean;
    }>;
  }>('/api/policies/live-quotes', payload, false),
};

// ── Claims ────────────────────────────────────────────────────────────────────

export const claimsApi = {
  list:   () => request<{ claims: ApiClaim[] }>('/api/claims', {}, true),
  create: (data: { policyId: string; type: string; amount: number; description: string; incidentDate: string }) =>
    post<{ claim: ApiClaim }>('/api/claims', data, true),
};

// ── Quotes ────────────────────────────────────────────────────────────────────

export const quotesApi = {
  create:  (type: string, details: Record<string, unknown>, planId?: string) =>
    post<{ quote: ApiQuote }>('/api/quotes', { type, details, planId }, true),
  list:    () => request<{ quotes: ApiQuote[] }>('/api/quotes', {}, true),
  approve: (quoteId: string) => post<{ policy: ApiPolicy }>(`/api/quotes/${quoteId}/approve`, undefined, true),
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
    post<{ paymentUrl: string; paymentLinkId: string; amount: number }>(
      '/api/payments/razorpay/create-link', { policyId, quoteId }, true
    ),
  verifyTestPayment: (quoteId?: string, policyId?: string) =>
    post<{ success: boolean; message: string }>('/api/payments/verify-test-payment', { quoteId, policyId }, true),
  savePushToken: (token: string) => put<void>('/api/users/push-token', { token }, true),
  linkAgent: (agentCode: string) =>
    post<{ success: boolean; agent: { id: string; name: string; agentCode: string }; message: string }>(
      '/api/users/link-agent', { agentCode }, true
    ),
};


// ── Chat ──────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id:             string;
  content:        string;
  senderType:     'user' | 'admin';
  senderId:       string;
  readAt?:        string | null;
  createdAt:      string;
  conversationId: string;
  isInternal?:    boolean;
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
  getConversations:   () => request<{ conversations: Conversation[] }>('/api/chat/conversations', {}, true),
  getConversation:    (id: string) => request<{ conversation: Conversation }>(`/api/chat/conversations/${id}`, {}, true),
  getOrCreate:        (subject?: unknown) => post<{ conversation: Conversation }>('/api/chat/conversations', { subject: typeof subject === 'string' ? subject : 'Support' }, true),
  createConversation: (subject?: unknown, firstMsg?: unknown) => post<{ conversation: Conversation }>('/api/chat/conversations', { subject: typeof subject === 'string' ? subject : 'Support', firstMsg: typeof firstMsg === 'string' ? firstMsg : undefined }, true),
  getMessages:        (conversationId: string, after?: string) =>
    request<{ messages: ChatMessage[] }>(`/api/chat/conversations/${conversationId}/messages${after ? `?after=${encodeURIComponent(after)}` : ''}`, {}, true),
  sendMessage:        (conversationId: string, content: string) =>
    post<{ message: ChatMessage }>(`/api/chat/conversations/${conversationId}/messages`, { content }, true),
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

// ── Helpers ───────────────────────────────────────────────────────────────────

async function agentRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getAgentToken();
  const headers = {
    ...(options.headers as Record<string, string> ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  return request<T>(path, { ...options, headers }, false);
}

async function uploadForm<T>(path: string, form: FormData, token: string | null): Promise<T> {
  const res = await fetch(`${getBaseUrl()}${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  let json: unknown;
  try { json = await res.json(); } catch { json = null; }
  if (!res.ok) {
    throw new ApiError(((json as any)?.error as string) ?? 'Upload failed', res.status);
  }
  return json as T;
}

// ── Agent types ───────────────────────────────────────────────────────────────

export interface AgentAdmin {
  id:    string;
  name:  string;
  email: string;
  role:  string;
  agentCode?:          string | null;
  pospCode?:           string | null;
  phone?:              string | null;
  isVerified?:         boolean;
  kycStatus?:          string;
  kycDocType?:         string | null;
  kycDocUrl?:          string | null;
  kycRejectionReason?: string | null;
  kycSubmittedAt?:     string | null;
  kycVerifiedAt?:      string | null;
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
  stage?:          string;
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

  getProfile: () =>
    agentRequest<{ admin: AgentAdmin }>('/api/admin/me').then(r => r.admin),

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
    return uploadForm<{ policy: AgentPolicy }>(`/api/admin/policies/${policyId}/upload-document`, form, token);
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

  updateQuoteStage: (quoteId: string, stage: 'new' | 'quotation_sent' | 'in_discussion' | 'closed' | 'lost') =>
    agentRequest<{ quote: AgentQuote }>(`/api/admin/quotes/${quoteId}/stage`, {
      method: 'PATCH',
      body:   JSON.stringify({ stage }),
    }),

  getCustomers: () =>
    agentRequest<{ customers: any[] }>('/api/admin/customers').then(r => r.customers),

  addCustomer: (data: { name: string; phone: string; email?: string | null }) =>
    agentRequest<{ customer: any }>('/api/admin/customers', {
      method: 'POST',
      body:   JSON.stringify(data),
    }),

  uploadKycDocument: async (
    docType: string,
    fileUri: string,
    mimeType: string,
    fileName: string,
  ): Promise<{ success: boolean; kycStatus: string; docUrl: string }> => {
    const token = await getAgentToken();
    const form  = new FormData();
    form.append('docType', docType);
    form.append('document', { uri: fileUri, type: mimeType, name: fileName } as any);
    return uploadForm<{ success: boolean; kycStatus: string; docUrl: string }>('/api/admin/agents/kyc/upload', form, token);
  },

  // ── Renewals ──────────────────────────────────────────────────────────────
  getRenewals: () =>
    agentRequest<{ renewals: any[] }>('/api/admin/renewals').then(r => r.renewals),

  updateRenewalStatus: (id: string, status: 'pending' | 'contacted' | 'closed' | 'lost', notes?: string) =>
    agentRequest<{ renewal: any }>(`/api/admin/renewals/${id}`, {
      method: 'PATCH',
      body:   JSON.stringify({ status, ...(notes ? { notes } : {}) }),
    }),
};

export const pospApi = agentApi;

// ── KYC ───────────────────────────────────────────────────────────────────────

export const kycApi = {
  initiate: () =>
    request<{ url: string; state: string; codeVerifier: string }>('/api/kyc/initiate', {}, true),

  callback: (
    codeOrObj: string | { code: string; state: string; codeVerifier: string },
    state?: string,
    codeVerifier?: string,
  ) => {
    const payload = typeof codeOrObj === 'object'
      ? codeOrObj
      : { code: codeOrObj, state: state!, codeVerifier: codeVerifier! };
    return request<{ success: boolean; kycStatus: string; aadhaarVerified: boolean; documentsCount: number }>(
      '/api/kyc/callback',
      { method: 'POST', body: JSON.stringify(payload) },
      true,
    );
  },

  status: () =>
    request<{
      kycStatus: string; aadhaarVerified: boolean; kycVerifiedAt: string | null; hasPan: boolean;
      kycDocType: string | null; kycDocUrl: string | null;
      kycRejectionReason: string | null; kycSubmittedAt: string | null;
    }>('/api/kyc/status', {}, true),

  getDigiLockerDetails: () =>
    request<{
      isDigiLockerLinked: boolean;
      kycStatus: string;
      name: string;
      dob: string | null;
      gender: string;
      address: string;
      city: string;
      state: string;
      pincode: string;
      panNumber: string | null;
      aadhaarNumber: string | null;
      drivingLicenseNumber: string | null;
      rcNumber: string | null;
      panDoc: { name: string; uri: string; source: string } | null;
      aadhaarDoc: { name: string; uri: string; source: string } | null;
      drivingLicenseDoc: { name: string; uri: string; source: string } | null;
      rcDoc: { name: string; uri: string; source: string } | null;
    }>('/api/kyc/digilocker-details', {}, true),

  verifyInstant: (data: {
    name: string;
    panNumber: string;
    aadhaarNumber: string;
    dob?: string;
    gender?: string;
    address?: string;
    pincode?: string;
  }) => post<{ success: boolean; kycStatus: string; user: any }>('/api/kyc/verify-instant', data, true),

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
    return uploadForm<{ success: boolean; kycStatus: string; docUrl: string }>('/api/kyc/upload', form, token);
  },
};

// ── Documents ─────────────────────────────────────────────────────────────────

export const documentsApi = {
  getDocuments: () =>
    request<{
      digilockerLinked: boolean;
      kycStatus: string;
      digilockerVerifiedAt: string | null;
      digilockerDocuments: any[];
      uploadedDocuments: any[];
    }>('/api/documents', {}, true),

  uploadDocument: async (fileUri: string, fileName: string, mimeType: string, title?: string, docType?: string) => {
    const token = await getToken();
    const form = new FormData();
    form.append('file', { uri: fileUri, type: mimeType, name: fileName } as any);
    if (title) form.append('title', title);
    if (docType) form.append('docType', docType);
    return uploadForm<any>('/api/documents/upload', form, token);
  },

  deleteDocument: (id: string) =>
    request<{ success: boolean }>(`/api/documents/${id}`, { method: 'DELETE' }, true),

  ocrVerify: async (formData: FormData) => {
    const token = await getToken();
    return uploadForm<{ success: boolean; verified: boolean; confidenceScore: number; extractedFields: any; fileUrl: string }>('/api/documents/ocr', formData, token);
  },
};

// ── Vehicles (Registration Number Lookup & Multi-Insurance Management) ────────

export interface VehicleData {
  id?: string;
  registrationNumber: string;
  vehicleType: 'car' | 'two_wheeler' | 'commercial';
  make?: string;
  model?: string;
  variant?: string;
  registrationYear?: number;
  fuelType?: string;
  engineNumber?: string;
  chassisNumber?: string;
  ncbPercentage?: number;
}

export type ApiVehicle = VehicleData;

export const vehiclesApi = {
  list: () =>
    request<{ vehicles: VehicleData[] }>('/api/vehicles', {}, true),

  getVehicles: () =>
    request<{ vehicles: VehicleData[] }>('/api/vehicles', {}, true),

  lookupByRegNumber: (registrationNumber: string) =>
    request<{
      registrationNumber: string;
      vehicleFound: boolean;
      vehicle: VehicleData | null;
      policiesCount: number;
      policies: any[];
      quotesCount: number;
      quotes: any[];
    }>(`/api/vehicles/lookup/${encodeURIComponent(registrationNumber)}`, {}, false),

  getPoliciesByVehicle: (registrationNumber: string) =>
    request<{
      registrationNumber: string;
      count: number;
      policies: any[];
    }>(`/api/policies/vehicle/${encodeURIComponent(registrationNumber)}`, {}, true),

  saveVehicle: (data: VehicleData) =>
    request<{ vehicle: VehicleData }>('/api/vehicles', {
      method: 'POST',
      body: JSON.stringify(data)
    }, true),

  fetchRcDetails: (registrationNumber: string) =>
    vehiclesApi.fetchVehicleRcDetails(registrationNumber),

  fetchVehicleRcDetails: (registrationNumber: string) =>
    request<{
      success: boolean;
      registrationNumber: string;
      rcDetails: {
        registrationNumber: string;
        ownerName: string;
        make: string;
        model: string;
        variant: string;
        vehicleType: 'car' | 'two_wheeler' | 'commercial';
        registrationYear: number;
        registrationDate: string;
        fuelType: 'petrol' | 'diesel' | 'cng' | 'electric' | 'hybrid';
        engineNumber: string;
        chassisNumber: string;
        rtoCode: string;
        rtoName: string;
        state: string;
        insuranceCompany?: string;
        insuranceExpiry?: string;
        insurancePolicyNumber?: string;
        fitnessUpto?: string;
        puccUpto?: string;
        cubicCapacity?: string;
        seatingCapacity?: number;
        color?: string;
        source: string;
      };
      savedVehicle?: VehicleData;
    }>(`/api/vehicles/rc-fetch/${encodeURIComponent(registrationNumber)}`),
};

export interface EndorsementData {
  id: string;
  endorsementNumber: string;
  type: string;
  category: string;
  requestedChanges: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  adminNotes?: string | null;
  revisedDocumentUrl?: string | null;
  createdAt: string;
  policyId: string;
  policy?: {
    policyNumber: string;
    provider: string;
    type: string;
  };
}

export const endorsementsApi = {
  submit: (data: { policyId: string; category: string; requestedChanges: string; type?: string }) =>
    request<{ endorsement: EndorsementData }>('/api/endorsements', {
      method: 'POST',
      body: JSON.stringify(data)
    }, true),

  list: () =>
    request<{ endorsements: EndorsementData[] }>('/api/endorsements', {}, true),

  getByPolicy: (policyId: string) =>
    request<{ endorsements: EndorsementData[] }>(`/api/endorsements/policy/${policyId}`, {}, true),
};

// ── POSP Examination & Registration ──────────────────────────────────────────

export const pospExamApi = {
  getSyllabus: () =>
    request<{
      title: string;
      institution: string;
      passingScore: string;
      examDuration: string;
      pdfUrl: string;
      sections: Array<{ title: string; chapters: string[] }>;
    }>('/api/posp/syllabus'),

  checkEligibility: (phone?: string, email?: string) => {
    const qs = new URLSearchParams();
    if (phone) qs.set('phone', phone);
    if (email) qs.set('email', email);
    return request<{
      eligible: boolean;
      reason?: string;
      status?: string;
      attemptsToday?: number;
      attemptsLeft?: number;
      nextEligibleAt?: string;
      remainingSeconds?: number;
    }>(`/api/posp/exam/check-eligibility?${qs.toString()}`);
  },

  startExam: (data: { name: string; phone: string; email: string }) =>
    request<{
      attemptId: string;
      candidateName: string;
      durationMinutes: number;
      totalQuestions: number;
      passingScore: number;
      questions: Array<{ id: number; chapter: string; question: string; options: [string, string, string, string] }>;
    }>('/api/posp/exam/start', { method: 'POST', body: JSON.stringify(data) }),

  submitExam: (data: {
    attemptId: string;
    userAnswers: Record<string, number>;
    terminatedEarly?: boolean;
    terminationReason?: string;
  }) =>
    request<{
      attemptId: string;
      candidateName: string;
      candidatePhone: string;
      candidateEmail: string;
      score: number;
      totalQuestions: number;
      correctAnswers: number;
      wrongAnswers: number;
      passed: boolean;
      passingScoreRequired: number;
      terminatedEarly: boolean;
      terminationReason?: string;
      completedAt: string;
      questionsReview: Array<{
        id: number;
        chapter: string;
        question: string;
        options: string[];
        selectedAnswer: number | null;
        correctAnswer: number;
        isCorrect: boolean;
        explanation: string;
      }>;
    }>('/api/posp/exam/submit', { method: 'POST', body: JSON.stringify(data) }),

  applyPosp: (data: {
    name: string;
    email: string;
    phone: string;
    examAttemptId: string;
    aadhaarNumber: string;
    aadhaarDocUrl: string;
    panNumber: string;
    panDocUrl: string;
  }) =>
    request<{
      success: boolean;
      applicationNumber: string;
      status: string;
      message: string;
      assignedAgentCode?: string;
    }>('/api/posp/apply', { method: 'POST', body: JSON.stringify(data) }),

  getApplicationStatus: (phone?: string, email?: string) => {
    const qs = new URLSearchParams();
    if (phone) qs.set('phone', phone);
    if (email) qs.set('email', email);
    return request<{
      hasApplication: boolean;
      application?: {
        id: string;
        applicationNumber: string;
        name: string;
        email: string;
        phone: string;
        examScore: number;
        status: string;
        assignedAgentCode?: string;
        rejectionReason?: string;
        createdAt: string;
      };
    }>(`/api/posp/application/status?${qs.toString()}`);
  },
};

export const systemApi = {
  getStatus: () =>
    request<{
      service: string;
      status: string;
      maintenance: {
        maintenanceMode: boolean;
        maintenanceMessage: string;
        updatedAt: string;
        updatedBy?: string;
      };
      timestamp: string;
    }>('/api/system/status'),
};

