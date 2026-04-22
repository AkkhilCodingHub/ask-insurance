import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ── Insurer Types ──────────────────────────────────────────────────────────
export interface Insurer {
  id: string;
  name: string;
  slug: string;
  shortName: string;
  logo: string;
  brandColor: string;
  tagline?: string;
  founded?: number;
  headquarters?: string;
  website?: string;
  claimsRatio: number;
  rating: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { plans: number; policies: number };
}

// ── Plan Types ─────────────────────────────────────────────────────────────
export interface Plan {
  id: string;
  name: string;
  slug: string;
  insurerId: string;
  type: 'life' | 'health' | 'motor' | 'travel' | 'home' | 'business';
  description: string;
  features: string[];
  minAge?: number;
  maxAge?: number;
  minCover: number;
  maxCover: number;
  basePremium: number;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  insurer?: { id: string; name: string; shortName: string };
  _count?: { policies: number };
}

// ── User Types ─────────────────────────────────────────────────────────────
export interface AdminUser {
  id: string;
  phone: string;
  name: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
  _count?: { policies: number; claims: number; payments: number };
}

// ── Policy Types ───────────────────────────────────────────────────────────
export interface AdminPolicy {
  id: string;
  policyNumber: string;
  userId: string;
  insurerId?: string;
  planId?: string;
  type: string;
  provider: string;
  status: 'pending' | 'active' | 'expired' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed';
  startDate: string;
  endDate: string;
  sumInsured: number;
  premium: number;
  documentUrl?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; name: string; phone: string };
  insurer?: { id: string; name: string };
  plan?: { id: string; name: string };
  _count?: { claims: number };
}

// ── Claim Types ────────────────────────────────────────────────────────────
export interface AdminClaim {
  id: string;
  policyId: string;
  userId?: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid' | 'settled';
  amount: number;
  incidentDate: string;
  description?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  approvedDate?: string;
  user?: { id: string; name: string; phone: string };
  policy?: { id: string; policyNumber: string; type: string; provider: string };
}

// ── Stats Types ────────────────────────────────────────────────────────────
export interface DashboardStats {
  totalUsers: number;
  totalPolicies: number;
  totalClaims: number;
  pendingClaims: number;
  activePolicies: number;
  newUsersLastMonth: number;
  totalInsurers: number;
  totalPlans: number;
  totalPremium: number;
  totalClaimsAmount: number;
  approvedClaimsLastMonth: number;
  renewalsPending: number;
  timestamp: string;
}

// ── Insurers Response ──────────────────────────────────────────────────
export interface InsurersResponse {
  insurers: Insurer[];
  total: number;
  page: number;
  limit: number;
}

// ── Plans Response ──────────────────────────────────────────────────────
export interface PlansResponse {
  plans: Plan[];
  total: number;
  page: number;
  limit: number;
}

// ── Policies Response ───────────────────────────────────────────────────
export interface PoliciesResponse {
  policies: AdminPolicy[];
  total: number;
  page: number;
  limit: number;
}

// ── Claims Response ─────────────────────────────────────────────────────
export interface ClaimsResponse {
  claims: AdminClaim[];
  total: number;
  page: number;
  limit: number;
}

// ── Quote Types ────────────────────────────────────────────────────────────
export interface AdminQuoteResponse {
  insurer:      string;
  planName:     string;
  netPremium:   number;
  gst:          number;
  totalPremium: number;
  notes?:       string;
}

export interface AdminQuote {
  id:             string;
  userId:         string;
  type:           string;
  details:        string; // JSON string
  status:         'pending' | 'responded' | 'approved' | 'converted' | 'expired';
  adminResponse:  AdminQuoteResponse | null;
  adminResponseAt:string | null;
  approvedAt:     string | null;
  createdAt:      string;
  updatedAt:      string;
  user?:          { id: string; name: string; phone: string; email: string };
}

export interface QuotesResponse {
  quotes: AdminQuote[];
  total: number;
  page: number;
  limit: number;
}

// ── Chat Types ─────────────────────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  conversationId: string;
  content: string;
  senderType: 'user' | 'admin';
  senderId: string;
  readAt: string | null;
  createdAt: string;
}

export interface Conversation {
  id: string;
  subject: string | null;
  status: 'open' | 'closed';
  createdAt: string;
  updatedAt: string;
  userId: string;
  adminId: string | null;
  user: { id: string; name: string | null; phone: string; email: string | null };
  admin: { id: string; name: string } | null;
  messages: ChatMessage[];
  _count?: { messages: number };
}

export interface ConversationsResponse {
  conversations: Conversation[];
  total: number;
  page: number;
  limit: number;
}

// ── File Storage Types ─────────────────────────────────────────────────────
export interface AdminFile {
  id:        string;
  name:      string;
  key:       string;
  url:       string;
  size:      number; // bytes
  mimeType:  string;
  createdAt: string;
  adminId:   string;
}

export interface FilesResponse {
  files:         AdminFile[];
  total:         number;
  page:          number;
  limit:         number;
  storageUsed:   number; // bytes
  storageQuota:  number; // bytes
}

export interface StorageResponse {
  used:  number; // bytes
  quota: number; // bytes
}

// ── Agent Types ────────────────────────────────────────────────────────────
export interface AgentRecord {
  id:           string;
  name:         string;
  email:        string;
  role:         'admin' | 'superadmin';
  isActive:     boolean;
  createdAt:    string;
  storageUsed?: number;
}

// ── Analytics Types ────────────────────────────────────────────────────────
export interface AnalyticsData {
  byType: { type: string; policies: number; premium: number }[];
  monthly: {
    label: string;
    policies: number;
    premium: number;
    claims: number;
    claimsAmount: number;
  }[];
  topPlans: { id: string; name: string; type: string; _count: { policies: number } }[];
  topInsurers: { insurerId: string | null; name: string; shortName: string; premium: number; policies: number }[];
}

// ── Users Response ─────────────────────────────────────────────────────
export interface UsersResponse {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
}

// ── API Client ─────────────────────────────────────────────────────────────
class AdminApiClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: `${API_BASE_URL}/admin`,
      timeout: 10000
    });

    // Add token to requests
    this.instance.interceptors.request.use((config) => {
      const token = localStorage.getItem('adminToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle errors
    this.instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('adminToken');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // ── Authentication ─────────────────────────────────────────────────────
  async login(email: string, password: string): Promise<{ token: string; admin: { id: string; name: string; email: string; role: string } }> {
    const { data } = await this.instance.post('/auth/login', { email, password });
    if (data.error) throw new Error(data.error);
    if (!data.token) throw new Error('No token received');
    localStorage.setItem('adminToken', data.token);
    return data;
  }

  // ── Dashboard ──────────────────────────────────────────────────────────
  async getStats(): Promise<DashboardStats> {
    const { data } = await this.instance.get('/stats');
    if (data.error) throw new Error(data.error);
    return data;
  }

  // ── Insurers ───────────────────────────────────────────────────────────
  async getInsurers(page = 1, limit = 20): Promise<InsurersResponse> {
    const { data } = await this.instance.get('/insurers', {
      params: { page, limit }
    });
    if (data.error) throw new Error(data.error);
    return data;
  }

  async getInsurer(id: string): Promise<Insurer> {
    const { data } = await this.instance.get(`/insurers/${id}`);
    if (data.error) throw new Error(data.error);
    return data.insurer;
  }

  async createInsurer(insurer: Omit<Insurer, 'id' | 'createdAt' | 'updatedAt' | '_count'>): Promise<Insurer> {
    const { data } = await this.instance.post('/insurers', insurer);
    if (data.error) throw new Error(data.error);
    return data.insurer;
  }

  async updateInsurer(id: string, updates: Partial<Omit<Insurer, 'id' | 'createdAt' | 'updatedAt' | '_count'>>): Promise<Insurer> {
    const { data } = await this.instance.put(`/insurers/${id}`, updates);
    if (data.error) throw new Error(data.error);
    return data.insurer;
  }

  async deleteInsurer(id: string): Promise<{ success: boolean }> {
    const { data } = await this.instance.delete(`/insurers/${id}`);
    if (data.error) throw new Error(data.error);
    return data;
  }

  // ── Plans ──────────────────────────────────────────────────────────────
  async getPlans(page = 1, limit = 20, insurerId?: string): Promise<PlansResponse> {
    const { data } = await this.instance.get('/plans', {
      params: { page, limit, ...(insurerId && { insurerId }) }
    });
    if (data.error) throw new Error(data.error);
    return data;
  }

  async createPlan(plan: Omit<Plan, 'id' | 'createdAt' | 'updatedAt' | 'insurer' | '_count'>): Promise<Plan> {
    const { data } = await this.instance.post('/plans', plan);
    if (data.error) throw new Error(data.error);
    return data.plan;
  }

  async updatePlan(id: string, updates: Partial<Omit<Plan, 'id' | 'createdAt' | 'updatedAt' | 'insurerId' | 'insurer' | '_count'>>): Promise<Plan> {
    const { data } = await this.instance.put(`/plans/${id}`, updates);
    if (data.error) throw new Error(data.error);
    return data.plan;
  }

  async deletePlan(id: string): Promise<{ success: boolean }> {
    const { data } = await this.instance.delete(`/plans/${id}`);
    if (data.error) throw new Error(data.error);
    return data;
  }

  // ── Users ──────────────────────────────────────────────────────────────
  async getUsers(page = 1, limit = 20): Promise<UsersResponse> {
    const { data } = await this.instance.get('/users', {
      params: { page, limit }
    });
    if (data.error) throw new Error(data.error);
    return data;
  }

  async getUser(id: string): Promise<AdminUser> {
    const { data } = await this.instance.get(`/users/${id}`);
    if (data.error) throw new Error(data.error);
    return data.user;
  }

  async searchUsers(query: string): Promise<AdminUser[]> {
    const { data } = await this.instance.get(`/users/search/${query}`);
    if (data.error) throw new Error(data.error);
    return data.users;
  }

  // ── Policies ───────────────────────────────────────────────────────────
  async getPolicies(page = 1, limit = 20): Promise<PoliciesResponse> {
    const { data } = await this.instance.get('/policies', {
      params: { page, limit }
    });
    if (data.error) throw new Error(data.error);
    return data;
  }

  async getPolicy(id: string): Promise<AdminPolicy> {
    const { data } = await this.instance.get(`/policies/${id}`);
    if (data.error) throw new Error(data.error);
    return data.policy;
  }

  async updatePolicy(id: string, updates: Partial<Omit<AdminPolicy, 'id' | 'policyNumber' | 'userId' | 'createdAt' | 'updatedAt' | 'user' | 'insurer' | 'plan'>>): Promise<AdminPolicy> {
    const { data } = await this.instance.put(`/policies/${id}`, updates);
    if (data.error) throw new Error(data.error);
    return data.policy;
  }

  async deletePolicy(id: string): Promise<{ success: boolean }> {
    const { data } = await this.instance.delete(`/policies/${id}`);
    if (data.error) throw new Error(data.error);
    return data;
  }

  // ── Claims ─────────────────────────────────────────────────────────────
  async getClaims(page = 1, limit = 20): Promise<ClaimsResponse> {
    const { data } = await this.instance.get('/claims', {
      params: { page, limit }
    });
    if (data.error) throw new Error(data.error);
    return data;
  }

  async updateClaimStatus(id: string, status: 'pending' | 'approved' | 'rejected' | 'paid' | 'settled'): Promise<AdminClaim> {
    const { data } = await this.instance.put(`/claims/${id}/status`, { status });
    if (data.error) throw new Error(data.error);
    return data.claim;
  }

  // ── Quotes ─────────────────────────────────────────────────────────────
  async getQuotes(page = 1, limit = 20): Promise<QuotesResponse> {
    const { data } = await this.instance.get('/quotes', {
      params: { page, limit }
    });
    if (data.error) throw new Error(data.error);
    return data;
  }

  async updateQuoteStatus(id: string, status: 'pending' | 'responded' | 'approved' | 'expired'): Promise<AdminQuote> {
    const { data } = await this.instance.patch(`/quotes/${id}/status`, { status });
    if (data.error) throw new Error(data.error);
    return data.quote;
  }

  async respondToQuote(id: string, response: AdminQuoteResponse): Promise<void> {
    const { data } = await this.instance.post(`/quotes/${id}/respond`, response);
    if (data.error) throw new Error(data.error);
  }

  async confirmPayment(policyId: string, payload: { documentUrl?: string; providerRef?: string; notes?: string }): Promise<void> {
    const { data } = await this.instance.post(`/policies/${policyId}/confirm-payment`, payload);
    if (data.error) throw new Error(data.error);
  }

  // ── File Storage ───────────────────────────────────────────────────────────
  async getStorage(): Promise<StorageResponse> {
    const { data } = await this.instance.get('/storage');
    if (data.error) throw new Error(data.error);
    return data;
  }

  async getFiles(page = 1, limit = 50): Promise<FilesResponse> {
    const { data } = await this.instance.get('/files', { params: { page, limit } });
    if (data.error) throw new Error(data.error);
    return data;
  }

  async uploadFile(file: File): Promise<AdminFile> {
    const form = new FormData();
    form.append('file', file);
    const { data } = await this.instance.post('/files/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    });
    if (data.error) throw new Error(data.error);
    return data.file;
  }

  async deleteFile(id: string): Promise<void> {
    const { data } = await this.instance.delete(`/files/${id}`);
    if (data.error) throw new Error(data.error);
  }

  async uploadPolicyDocument(
    policyId: string,
    payload: { file?: File; policyNumber?: string; issueDate?: string; expiryDate?: string },
  ): Promise<AdminPolicy> {
    const form = new FormData();
    if (payload.file)         form.append('file',         payload.file);
    if (payload.policyNumber) form.append('policyNumber', payload.policyNumber);
    if (payload.issueDate)    form.append('issueDate',    payload.issueDate);
    if (payload.expiryDate)   form.append('expiryDate',   payload.expiryDate);
    const { data } = await this.instance.post(`/policies/${policyId}/upload-document`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    });
    if (data.error) throw new Error(data.error);
    return data.policy;
  }

  async generatePaymentLink(policyId: string): Promise<{ paymentUrl: string; amount: number }> {
    const { data } = await this.instance.post(`/policies/${policyId}/generate-payment-link`);
    if (data.error) throw new Error(data.error);
    return data;
  }

  async generateQuotePaymentLink(quoteId: string): Promise<{ paymentUrl: string; paymentLinkId: string; amount: number }> {
    const { data } = await this.instance.post(`/quotes/${quoteId}/payment-link`);
    if (data.error) throw new Error(data.error);
    return data;
  }

  // ── Analytics ──────────────────────────────────────────────────────────
  async getAnalytics(): Promise<AnalyticsData> {
    const { data } = await this.instance.get('/analytics');
    if (data.error) throw new Error(data.error);
    return data;
  }

  // ── Chat ───────────────────────────────────────────────────────────────
  async getConversations(page = 1, limit = 30, status?: 'open' | 'closed'): Promise<ConversationsResponse> {
    const { data } = await this.instance.get('/chat/conversations', {
      params: { page, limit, ...(status ? { status } : {}) }
    });
    if (data.error) throw new Error(data.error);
    return data;
  }

  async getConversation(id: string): Promise<Conversation> {
    const { data } = await this.instance.get(`/chat/conversations/${id}`);
    if (data.error) throw new Error(data.error);
    return data.conversation;
  }

  async createConversation(userId: string, subject?: string): Promise<Conversation> {
    const { data } = await this.instance.post('/chat/conversations', { userId, subject });
    if (data.error) throw new Error(data.error);
    return data.conversation;
  }

  async sendMessage(conversationId: string, content: string): Promise<ChatMessage> {
    const { data } = await this.instance.post(`/chat/conversations/${conversationId}/messages`, { content });
    if (data.error) throw new Error(data.error);
    return data.message;
  }

  async pollMessages(conversationId: string, after?: string): Promise<ChatMessage[]> {
    const { data } = await this.instance.get(`/chat/conversations/${conversationId}/messages`, {
      params: after ? { after } : {}
    });
    if (data.error) throw new Error(data.error);
    return data.messages;
  }

  async setConversationStatus(id: string, status: 'open' | 'closed'): Promise<Conversation> {
    const { data } = await this.instance.put(`/chat/conversations/${id}/status`, { status });
    if (data.error) throw new Error(data.error);
    return data.conversation;
  }

  async getChatUnread(): Promise<number> {
    const { data } = await this.instance.get('/chat/unread');
    if (data.error) throw new Error(data.error);
    return data.unread;
  }

  // ── Agent management ────────────────────────────────────────────────────
  async getAgents(): Promise<AgentRecord[]> {
    const { data } = await this.instance.get('/agents');
    if (data.error) throw new Error(data.error);
    return data.agents;
  }

  async createAgent(payload: { name: string; email: string; password: string; role: 'admin' | 'superadmin' }): Promise<AgentRecord> {
    const { data } = await this.instance.post('/agents', payload);
    if (data.error) throw new Error(data.error);
    return data.agent;
  }

  async updateAgent(id: string, payload: Partial<{ name: string; role: 'admin' | 'superadmin'; isActive: boolean; password: string }>): Promise<AgentRecord> {
    const { data } = await this.instance.patch(`/agents/${id}`, payload);
    if (data.error) throw new Error(data.error);
    return data.agent;
  }

  async deleteAgent(id: string): Promise<void> {
    const { data } = await this.instance.delete(`/agents/${id}`);
    if (data.error) throw new Error(data.error);
  }

  // ── Profile ──────────────────────────────────────────────────────────────
  async updateProfile(payload: { name?: string; currentPassword?: string; newPassword?: string }): Promise<{ id: string; name: string; email: string; role: string }> {
    const { data } = await this.instance.put('/me', payload);
    if (data.error) throw new Error(data.error);
    return data.admin;
  }
}

export const adminApi = new AdminApiClient();
