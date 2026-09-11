"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface AuthUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
  dob?: string;
  gender?: "male" | "female" | "other" | string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  customerCode?: string;
  kycStatus?: string;
  panNumber?: string;
  aadhaarNumber?: string;
  drivingLicenseNumber?: string;
  rcNumber?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  pendingPhone: string | null;
  directLogin(identifier: string): Promise<AuthUser>;
  registerSendOTP(data: { phone: string; name: string; email: string; dob?: string; gender?: string }): Promise<void>;
  registerVerifyOTP(data: { phone: string; otp: string; name: string; email: string; dob?: string; gender?: string }): Promise<AuthUser>;
  sendOTP(phone: string): Promise<void>;
  verifyOTP(otp: string): Promise<{ isNewUser: boolean }>;
  completeProfile(name: string, dob: string): Promise<void>;
  loginWithEmailAndPhone(payload: { email: string; phone: string; name?: string }): Promise<AuthUser>;
  refreshUser(): Promise<void>;
  logout(): void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Module-level set of phones that have completed registration
const registeredPhones = new Set<string>();

const STORAGE_KEY = "ask_user";

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

const getApiBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "http://localhost:4000";

function serializeSession(u: { id?: string; name?: string; phone?: string; email?: string; customerCode?: string; kycStatus?: string }, token?: string): string {
  const session: Record<string, string | undefined> = {
    id: u.id,
    name: u.name,
    phone: u.phone,
    email: u.email,
    customerCode: u.customerCode,
    kycStatus: u.kycStatus,
  };
  if (token) {
    session.token = token;
  }
  return JSON.stringify(session);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);

  // Load persisted user on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: AuthUser = JSON.parse(raw);
        setUser(parsed);
        // Also mark their phone as registered
        if (parsed.phone) {
          registeredPhones.add(parsed.phone);
        }
      }
    } catch {
      // ignore parse errors
    } finally {
      setLoading(false);
    }
  }, []);

  async function directLogin(identifier: string): Promise<AuthUser> {
    const res = await fetch(`${getApiBaseUrl()}/api/auth/direct-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ identifier }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || "Login failed");
    }

    const authUser: AuthUser = {
      id: data.user.id,
      name: data.user.name || "Customer",
      phone: data.user.phone,
      email: data.user.email,
      customerCode: data.user.customerCode,
      kycStatus: data.user.kycStatus,
      dob: data.user.dateOfBirth,
      gender: data.user.gender,
      address: data.user.address,
      city: data.user.city,
      state: data.user.state,
      pincode: data.user.pincode,
    };

    localStorage.setItem(STORAGE_KEY, serializeSession({
      id: data.user.id,
      name: data.user.name || "Customer",
      phone: data.user.phone,
      email: data.user.email,
      customerCode: data.user.customerCode,
      kycStatus: data.user.kycStatus,
    }, data.token));
    registeredPhones.add(data.user.phone);
    setUser(authUser);
    return authUser;
  }

  async function registerSendOTP(payload: { phone: string; name: string; email: string; dob?: string; gender?: string }): Promise<void> {
    const res = await fetch(`${getApiBaseUrl()}/api/auth/register-send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || "Failed to send registration OTP");
    }
    setPendingPhone(payload.phone);
  }

  async function registerVerifyOTP(payload: { phone: string; otp: string; name: string; email: string; dob?: string; gender?: string }): Promise<AuthUser> {
    const res = await fetch(`${getApiBaseUrl()}/api/auth/register-verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        ...payload,
        dateOfBirth: payload.dob,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || "Failed to verify registration code");
    }

    const authUser: AuthUser = {
      id: data.user.id,
      name: data.user.name || payload.name,
      phone: data.user.phone,
      email: data.user.email,
      customerCode: data.user.customerCode,
      kycStatus: data.user.kycStatus,
      dob: data.user.dateOfBirth,
      gender: data.user.gender,
    };

    localStorage.setItem(STORAGE_KEY, serializeSession({
      id: data.user.id,
      name: data.user.name || payload.name,
      phone: data.user.phone,
      email: data.user.email,
      customerCode: data.user.customerCode,
      kycStatus: data.user.kycStatus,
    }, data.token));
    registeredPhones.add(data.user.phone);
    setUser(authUser);
    setPendingPhone(null);
    return authUser;
  }

  async function sendOTP(phone: string): Promise<void> {
    await delay(800);
    setPendingPhone(phone);
  }

  async function verifyOTP(otp: string): Promise<{ isNewUser: boolean }> {
    await delay(1000);
    // Any 6-digit code works
    if (!otp || otp.length !== 6) {
      throw new Error("Invalid OTP");
    }
    const phone = pendingPhone ?? "";
    const isNewUser = !registeredPhones.has(phone);
    if (!isNewUser) {
      // Returning user — restore saved profile or default
      let existing: AuthUser | null = null;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) existing = JSON.parse(raw);
      } catch {}
      const restoredUser: AuthUser = {
        id: existing?.id || `user_${phone}`,
        name: existing?.name || "",
        phone,
        dob: existing?.dob || "",
      };
      setUser(restoredUser);
      localStorage.setItem(STORAGE_KEY, serializeSession({
        id: restoredUser.id,
        name: restoredUser.name,
        phone: restoredUser.phone,
      }));
    }
    return { isNewUser };
  }

  async function completeProfile(name: string, dob: string): Promise<void> {
    await delay(600);
    const phone = pendingPhone ?? "";
    const newUser: AuthUser = {
      id: `user_${phone}`,
      name,
      phone,
      dob,
    };
    registeredPhones.add(phone);
    setUser(newUser);
    localStorage.setItem(STORAGE_KEY, serializeSession({
      id: newUser.id,
      name: newUser.name,
      phone: newUser.phone,
    }));
  }

  async function loginWithEmailAndPhone(payload: { email: string; phone: string; name?: string }): Promise<AuthUser> {
    const res = await fetch(
      (process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "https://ask-insurance.onrender.com/api") + "/auth/web-login",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || data.message || "Login failed");
    }

    const authUser: AuthUser = {
      id: data.user.id,
      name: data.user.name || payload.name || "Customer",
      phone: data.user.phone,
      email: data.user.email,
      customerCode: data.user.customerCode,
      kycStatus: data.user.kycStatus,
    };

    // Store token and user
    localStorage.setItem(STORAGE_KEY, serializeSession({
      id: data.user.id,
      name: data.user.name || payload.name || "Customer",
      phone: data.user.phone,
      email: data.user.email,
      customerCode: data.user.customerCode,
      kycStatus: data.user.kycStatus,
    }, data.token));
    registeredPhones.add(data.user.phone);
    setUser(authUser);
    return authUser;
  }

  async function refreshUser(): Promise<void> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: AuthUser = JSON.parse(raw);
        setUser(parsed);
      }
    } catch {}
  }

  function logout() {
    setUser(null);
    setPendingPhone(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        pendingPhone,
        directLogin,
        registerSendOTP,
        registerVerifyOTP,
        sendOTP,
        verifyOTP,
        completeProfile,
        loginWithEmailAndPhone,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
