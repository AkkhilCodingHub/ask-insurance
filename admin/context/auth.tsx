"use client";

import { createContext, useContext, useEffect, useState } from "react";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "super_admin" | "admin" | "claims_manager" | "support";
  avatar: string;
}

const ADMIN_ACCOUNTS: Array<AdminUser & { password: string }> = [
  { id: "adm-001", name: "Hardil Singh", email: "admin@ask.in",          password: "Admin@123", role: "super_admin",    avatar: "HS" },
  { id: "adm-002", name: "Priya Sharma", email: "priya@ask.in",          password: "Admin@123", role: "claims_manager", avatar: "PS" },
  { id: "adm-003", name: "Rahul Verma",  email: "rahul@ask.in",          password: "Admin@123", role: "support",        avatar: "RV" },
];

interface AuthCtx {
  admin: AdminUser | null;
  loading: boolean;
  login(email: string, password: string): Promise<{ ok: boolean; error?: string }>;
  logout(): void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("ask_admin");
      if (stored) setAdmin(JSON.parse(stored));
    } catch {}
    setLoading(false);
  }, []);

  async function login(email: string, password: string) {
    await new Promise((r) => setTimeout(r, 800));
    const found = ADMIN_ACCOUNTS.find(
      (a) => a.email.toLowerCase() === email.toLowerCase() && a.password === password
    );
    if (!found) return { ok: false, error: "Invalid email or password." };
    const { password: _, ...user } = found;
    setAdmin(user);
    localStorage.setItem("ask_admin", JSON.stringify(user));
    return { ok: true };
  }

  function logout() {
    setAdmin(null);
    localStorage.removeItem("ask_admin");
  }

  return <Ctx.Provider value={{ admin, loading, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
