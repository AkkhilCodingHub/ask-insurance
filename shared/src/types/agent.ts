export type LeadStatus =
  | "new"
  | "contacted"
  | "quoted"
  | "negotiating"
  | "closed_won"
  | "closed_lost";

export type FileCategory =
  | "kyc"
  | "policy_draft"
  | "claim_evidence"
  | "signed_agreement"
  | "other";

export type AllowedFileType = "pdf" | "jpg" | "png" | "docx";

export interface Lead {
  id: string;
  agentId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  insuranceType: string;
  status: LeadStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentFile {
  id: string;
  agentId: string;
  clientId?: string;
  name: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  category: FileCategory;
  tags: string[];
  expiryDate?: string;
  uploadedAt: string;
}

export interface Commission {
  id: string;
  agentId: string;
  policyId: string;
  amount: number;
  rate: number;
  status: "pending" | "paid";
  paidAt?: string;
  createdAt: string;
}

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const DEFAULT_STORAGE_QUOTA_BYTES = 2 * 1024 * 1024 * 1024; // 2GB
export const ALLOWED_FILE_TYPES: AllowedFileType[] = ["pdf", "jpg", "png", "docx"];
export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
