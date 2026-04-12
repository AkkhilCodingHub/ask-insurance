import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface AuthUser {
  id: string;
  name: string;
  phone: string;
  dob?: string;
  email?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  pendingPhone: string | null;
  sendOTP: (phone: string) => Promise<void>;
  verifyOTP: (otp: string) => Promise<{ isNewUser: boolean }>;
  completeProfile: (name: string, dob: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Mock "registered" phones — in prod this comes from your backend
const REGISTERED_PHONES = new Set<string>();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]               = useState<AuthUser | null>(null);
  const [loading, setLoading]         = useState(true);
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  /** Step 1 — send OTP to phone (mock: always succeeds) */
  const sendOTP = async (phone: string) => {
    await new Promise(r => setTimeout(r, 800));
    setPendingPhone(phone);
  };

  /** Step 2 — verify OTP (mock: any 6-digit code works) */
  const verifyOTP = async (otp: string): Promise<{ isNewUser: boolean }> => {
    await new Promise(r => setTimeout(r, 1000));
    if (otp.length !== 6) throw new Error('Invalid OTP');
    const phone = pendingPhone!;
    const isNewUser = !REGISTERED_PHONES.has(phone);
    if (!isNewUser) {
      // Returning user — log them in directly
      setUser({ id: phone, name: 'Hardil Singh', phone, dob: '15/08/1992' });
      setPendingPhone(null);
    }
    return { isNewUser };
  };

  /** Step 3 (new users only) — save name + DOB */
  const completeProfile = async (name: string, dob: string) => {
    await new Promise(r => setTimeout(r, 600));
    const phone = pendingPhone!;
    REGISTERED_PHONES.add(phone);
    setUser({ id: phone, name, phone, dob });
    setPendingPhone(null);
  };

  const logout = () => {
    setUser(null);
    setPendingPhone(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, pendingPhone, sendOTP, verifyOTP, completeProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
