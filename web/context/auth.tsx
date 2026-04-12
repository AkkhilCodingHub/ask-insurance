"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface AuthUser {
  id: string;
  name: string;
  phone: string;
  dob?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  pendingPhone: string | null;
  sendOTP(phone: string): Promise<void>;
  verifyOTP(otp: string): Promise<{ isNewUser: boolean }>;
  completeProfile(name: string, dob: string): Promise<void>;
  logout(): void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Module-level set of phones that have completed registration
const registeredPhones = new Set<string>();

const STORAGE_KEY = "ask_user";

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
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
      const restoredUser: AuthUser = {
        id: `user_${phone}`,
        name: "Hardil Singh",
        phone,
        dob: "15/08/1992",
      };
      setUser(restoredUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(restoredUser));
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
  }

  function logout() {
    setUser(null);
    setPendingPhone(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, pendingPhone, sendOTP, verifyOTP, completeProfile, logout }}
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
