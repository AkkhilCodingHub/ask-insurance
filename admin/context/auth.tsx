"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { adminApi } from "@/lib/api";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "superadmin" | "admin" | "claims_manager" | "support";
  avatar: string;
}

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
    try {
      const response = await adminApi.login(email, password);
      if (response.token) {
        const user: AdminUser = {
          id: response.admin.id,
          name: response.admin.name,
          email: response.admin.email,
          role: response.admin.role as AdminUser['role'],
          avatar: response.admin.name.substring(0, 2).toUpperCase()
        };
        setAdmin(user);
        localStorage.setItem("ask_admin", JSON.stringify(user));
        return { ok: true };
      }
      return { ok: false, error: "Login failed" };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid email or password";
      return { ok: false, error: message };
    }
  }

  function logout() {
    setAdmin(null);
    localStorage.removeItem("ask_admin");
    localStorage.removeItem("adminToken");
  }

  return <Ctx.Provider value={{ admin, loading, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
