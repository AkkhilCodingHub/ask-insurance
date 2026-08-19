/**
 * ASK Insurance Web API Client
 * Connects directly to the ASK Insurance Backend API on Render / Localhost
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
  "https://ask-insurance.onrender.com/api";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ── Auth Token Helpers ────────────────────────────────────────────────────────
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const userRaw = localStorage.getItem("ask_user");
    if (userRaw) {
      const parsed = JSON.parse(userRaw);
      return parsed.token || parsed.id || null;
    }
  } catch {}
  return null;
}

async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.message || data.error || `HTTP Error ${res.status}`);
    }

    return data as T;
  } catch (err: any) {
    console.warn(`[API Client] ${endpoint} request failed:`, err.message);
    throw err;
  }
}

// ── API Modules ───────────────────────────────────────────────────────────────

export const api = {
  // ── Auth ──
  auth: {
    async sendOtp(phone: string) {
      return request("/auth/send-otp", {
        method: "POST",
        body: JSON.stringify({ phone }),
      });
    },
    async verifyOtp(phone: string, otp: string) {
      return request("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ phone, otp }),
      });
    },
    async completeProfile(data: { name: string; email?: string; dob?: string }) {
      return request("/auth/complete-profile", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
  },

  // ── Quotes ──
  quotes: {
    async generate(quoteInput: {
      type: string;
      regNumber?: string;
      vehicleModel?: string;
      idv?: number;
      ncb?: number;
      addons?: string[];
      members?: string[];
      sumInsured?: number;
    }) {
      return request("/quotes/generate", {
        method: "POST",
        body: JSON.stringify(quoteInput),
      });
    },
    async getMyQuotes() {
      return request("/quotes/my-quotes");
    },
    async saveQuote(quoteData: any) {
      return request("/quotes/save", {
        method: "POST",
        body: JSON.stringify(quoteData),
      });
    },
  },

  // ── Policies ──
  policies: {
    async getMyPolicies() {
      return request("/policies/my-policies");
    },
    async getById(id: string) {
      return request(`/policies/${id}`);
    },
    async buy(policyData: {
      insurer: string;
      planTitle: string;
      premium: number;
      proposer: any;
      nominee: any;
      paymentId?: string;
    }) {
      return request("/policies/buy", {
        method: "POST",
        body: JSON.stringify(policyData),
      });
    },
    async renew(policyNumber: string) {
      return request(`/policies/renew/${policyNumber}`, {
        method: "POST",
      });
    },
  },

  // ── Payments & Tax Receipts ──
  payments: {
    async getHistory() {
      return request("/payments/history");
    },
    async createOrder(amount: number, policyId?: string) {
      return request("/payments/create-order", {
        method: "POST",
        body: JSON.stringify({ amount, policyId }),
      });
    },
    async verify(paymentResult: any) {
      return request("/payments/verify", {
        method: "POST",
        body: JSON.stringify(paymentResult),
      });
    },
    async download80DCertificate(financialYear: string) {
      return request(`/payments/tax-80d/${financialYear}`);
    },
  },

  // ── Claims ──
  claims: {
    async getMyClaims() {
      return request("/claims");
    },
    async create(claimData: {
      policyNumber: string;
      claimType: string;
      incidentDate: string;
      description: string;
      estimatedAmount?: number;
      hospitalOrGarage?: string;
      location?: string;
    }) {
      return request("/claims", {
        method: "POST",
        body: JSON.stringify(claimData),
      });
    },
    async getStatus(claimId: string) {
      return request(`/claims/${claimId}`);
    },
  },

  // ── Central KYC (CKYC) ──
  kyc: {
    async getStatus() {
      return request("/kyc/status");
    },
    async verifyPan(panNumber: string) {
      return request("/kyc/verify-pan", {
        method: "POST",
        body: JSON.stringify({ panNumber }),
      });
    },
    async verifyAadhaar(aadhaarNumber: string, otp?: string) {
      return request("/kyc/verify-aadhaar", {
        method: "POST",
        body: JSON.stringify({ aadhaarNumber, otp }),
      });
    },
    async submitCkyc(details: any) {
      return request("/kyc/submit", {
        method: "POST",
        body: JSON.stringify(details),
      });
    },
  },

  // ── POSP Portal ──
  posp: {
    async register(data: any) {
      return request("/posp/register", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    async getExamQuestions() {
      return request("/posp/exam-questions");
    },
    async submitExam(answers: Record<string, number>) {
      return request("/posp/submit-exam", {
        method: "POST",
        body: JSON.stringify({ answers }),
      });
    },
    async getCertificate(certificateId?: string) {
      return request(`/posp/certificate${certificateId ? `/${certificateId}` : ""}`);
    },
  },

  // ── Network Garages & Hospitals ──
  locator: {
    async search(params: {
      type?: "garage" | "hospital" | "all";
      city?: string;
      insurer?: string;
      query?: string;
      lat?: number;
      lng?: number;
    }) {
      const queryParams = new URLSearchParams();
      if (params.type) queryParams.set("type", params.type);
      if (params.city) queryParams.set("city", params.city);
      if (params.insurer) queryParams.set("insurer", params.insurer);
      if (params.query) queryParams.set("query", params.query);
      return request(`/locator?${queryParams.toString()}`);
    },
  },

  // ── Document Locker ──
  documents: {
    async list() {
      return request("/documents");
    },
    async upload(doc: { name: string; category: string; base64Data?: string }) {
      return request("/documents/upload", {
        method: "POST",
        body: JSON.stringify(doc),
      });
    },
    async delete(id: string) {
      return request(`/documents/${id}`, {
        method: "DELETE",
      });
    },
  },

  // ── Vehicle RC Lookup ──
  vehicles: {
    async lookup(regNumber: string) {
      return request(`/vehicles/lookup/${encodeURIComponent(regNumber)}`);
    },
  },

  // ── AI Insurance Assistant ──
  chat: {
    async send(message: string, conversationHistory?: any[]) {
      return request("/chat", {
        method: "POST",
        body: JSON.stringify({ message, history: conversationHistory }),
      });
    },
  },

  // ── Health / Keep-alive ──
  health: {
    async check() {
      return request("/health");
    },
    async keepAlive() {
      return request("/cron/keep-alive");
    },
  },
};
