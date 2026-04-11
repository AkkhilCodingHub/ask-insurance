export type UserRole = "customer" | "agent" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Agent extends User {
  role: "agent";
  licenseNumber: string;
  verified: boolean;
  storageUsedBytes: number;
  storageQuotaBytes: number;
  commissionRate: number;
}

export interface Admin extends User {
  role: "admin";
}
