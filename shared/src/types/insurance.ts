export type InsuranceCategory =
  | "life"
  | "health"
  | "motor"
  | "home"
  | "travel"
  | "business";

export type PolicyStatus =
  | "active"
  | "expired"
  | "pending"
  | "cancelled"
  | "claimed";

export type ClaimStatus =
  | "filed"
  | "under_review"
  | "approved"
  | "rejected"
  | "settled";

export interface Insurer {
  id: string;
  name: string;
  logoUrl?: string;
  rating: number;
  claimRatio: number;
  color: string;
  tag?: string;
  active: boolean;
}

export interface Plan {
  id: string;
  insurerId: string;
  insurer?: Insurer;
  name: string;
  category: InsuranceCategory;
  premiumFrom: number;
  coverAmount: number;
  features: string[];
  addOns: string[];
  active: boolean;
}

export interface Quote {
  id: string;
  planId: string;
  plan?: Plan;
  customerId: string;
  agentId?: string;
  age: number;
  coverAmount: number;
  premium: number;
  validUntil: string;
  createdAt: string;
}

export interface Policy {
  id: string;
  quoteId: string;
  planId: string;
  plan?: Plan;
  customerId: string;
  agentId?: string;
  policyNumber: string;
  status: PolicyStatus;
  startDate: string;
  endDate: string;
  premium: number;
  coverAmount: number;
  documents: PolicyDocument[];
  createdAt: string;
}

export interface PolicyDocument {
  id: string;
  policyId: string;
  name: string;
  url: string;
  type: string;
  uploadedAt: string;
}

export interface Claim {
  id: string;
  policyId: string;
  policy?: Policy;
  customerId: string;
  agentId?: string;
  claimNumber: string;
  status: ClaimStatus;
  amount: number;
  description: string;
  evidence: string[];
  filedAt: string;
  updatedAt: string;
}
