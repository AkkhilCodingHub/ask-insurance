import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { isDevice } from 'expo-device';
import {
  authApi, usersApi, ApiUser,
  getToken, setToken, clearAllTokens,
  setRefreshToken, clearRefreshToken,
  registerSessionExpiredCallback,
  paymentsApi,
} from '@/lib/api';

// ── Push notifications ────────────────────────────────────────────────────────

// Step 1: request permission on app open (no auth needed).
export async function requestNotificationPermission(): Promise<boolean> {
  console.log('[push] requestNotificationPermission called');
  const Notifications = await import('expo-notifications');

  // Channel setup is Android-only and non-fatal — Expo Go may reject this call.
  if (Platform.OS === 'android') {
    try {
      console.log('[push] setting up Android notification channel');
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
      console.log('[push] Android channel set up successfully');
    } catch (e) {
      console.warn('[push] Android channel setup failed (non-fatal, continuing):', e);
    }
  }

  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    console.log('[push] existing permission status:', existing);

    if (existing === 'granted') {
      console.log('[push] permission already granted');
      return true;
    }

    console.log('[push] requesting permission from user...');
    const { status } = await Notifications.requestPermissionsAsync();
    console.log('[push] permission result:', status);
    return status === 'granted';
  } catch (e) {
    console.warn('[push] requestNotificationPermission error:', e);
    return false;
  }
}

// Step 2: get token and save it to the DB (requires auth token to be set).
async function savePushToken() {
  console.log('[push] savePushToken called');
  if (!isDevice) {
    console.warn('[push] skipping — push tokens only work on physical devices, not simulators');
    return;
  }

  try {
    const Notifications = await import('expo-notifications');

    const { status } = await Notifications.getPermissionsAsync();
    console.log('[push] permission status before token fetch:', status);
    if (status !== 'granted') {
      console.warn('[push] permission not granted, skipping token save');
      return;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
    console.log('[push] fetching Expo push token (projectId:', projectId, ')');

    const { data: token } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );

    console.log('[push] got token:', token);

    if (token) {
      await paymentsApi.savePushToken(token);
      console.log('[push] token saved to database successfully');
    } else {
      console.warn('[push] getExpoPushTokenAsync returned empty token');
    }
  } catch (e) {
    console.warn('[push] savePushToken error:', e);
  }
}

// ── AuthUser type (full profile) ──────────────────────────────────────────────

export interface AuthUser {
  id:       string;
  name:     string;
  phone:    string;
  email?:   string;
  dob?:     string;     // DD/MM/YYYY display format
  gender?:  string;
  address?: string;
  city?:    string;
  state?:   string;
  pincode?: string;
}

// ── Context interface ─────────────────────────────────────────────────────────

interface AuthContextValue {
  user:         AuthUser | null;
  loading:      boolean;
  pendingPhone: string | null;
  sendOTP:      (phone: string) => Promise<void>;
  verifyOTP:    (otp: string) => Promise<{ isNewUser: boolean }>;
  completeProfile: (name: string, dob: string) => Promise<void>;
  updateUser:   (u: AuthUser) => void;
  refreshUser:  () => Promise<void>;
  logout:       () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Mapper ────────────────────────────────────────────────────────────────────

export function mapApiUser(u: ApiUser): AuthUser {
  return {
    id:      u.id,
    name:    u.name ?? u.phone,
    phone:   u.phone,
    email:   u.email       ?? undefined,
    dob:     u.dateOfBirth
               ? new Date(u.dateOfBirth).toLocaleDateString('en-GB')  // DD/MM/YYYY
               : undefined,
    gender:  u.gender      ?? undefined,
    address: u.address     ?? undefined,
    city:    u.city        ?? undefined,
    state:   u.state       ?? undefined,
    pincode: u.pincode     ?? undefined,
  };
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]               = useState<AuthUser | null>(null);
  const [loading, setLoading]         = useState(true);
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);

  // ── Register session-expired callback so api.ts can signal logout ─────────
  useEffect(() => {
    registerSessionExpiredCallback(() => {
      setUser(null);
      setPendingPhone(null);
    });
    return () => registerSessionExpiredCallback(null);
  }, []);

  // ── Ask for notification permission on app open (no auth required) ────────
  useEffect(() => {
    console.log('[push] app opened — checking notification permission');
    requestNotificationPermission();
  }, []);

  // ── Save push token to DB whenever user becomes authenticated ─────────────
  useEffect(() => {
    if (user) {
      console.log('[push] user authenticated (id:', user.id, ') — saving push token');
      savePushToken();
    }
  }, [user]);

  // ── Restore session on app launch ─────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        if (token) {
          // api.ts auto-refreshes if the access token is expired (uses refresh token silently)
          const { user: apiUser } = await authApi.me();
          if (!cancelled) setUser(mapApiUser(apiUser));
        }
      } catch {
        // Both tokens expired/invalid — clear everything and show login
        await clearAllTokens();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Step 1: send OTP ──────────────────────────────────────────────────────
  const sendOTP = async (phone: string) => {
    await authApi.sendOTP(phone);
    setPendingPhone(phone);
  };

  // ── Step 2: verify OTP & store both tokens ────────────────────────────────
  const verifyOTP = async (otp: string): Promise<{ isNewUser: boolean }> => {
    const phone  = pendingPhone!;
    const result = await authApi.verifyOTP(phone, otp);

    await setToken(result.token);
    await setRefreshToken(result.refreshToken);

    if (!result.isNewUser && result.user.name) {
      setUser(mapApiUser(result.user));
      setPendingPhone(null);
    }

    return { isNewUser: result.isNewUser || !result.user.name };
  };

  // ── Step 3 (new users): save name + DOB ───────────────────────────────────
  const completeProfile = async (name: string, dob: string) => {
    const [dd, mm, yyyy] = dob.split('/');
    const iso = yyyy && mm && dd ? `${yyyy}-${mm}-${dd}` : undefined;

    const { user: apiUser } = await usersApi.updateProfile({
      name,
      ...(iso ? { dateOfBirth: iso } : {})
    });

    setUser(mapApiUser(apiUser));
    setPendingPhone(null);
  };

  // ── Update user locally (after profile edit) ──────────────────────────────
  const updateUser = (u: AuthUser) => setUser(u);

  // ── Re-fetch user from server (pull-to-refresh, etc.) ────────────────────
  const refreshUser = async () => {
    const { user: apiUser } = await authApi.me();
    setUser(mapApiUser(apiUser));
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = async () => {
    await clearAllTokens();
    setUser(null);
    setPendingPhone(null);
  };

  return (
    <AuthContext.Provider value={{
      user, loading, pendingPhone,
      sendOTP, verifyOTP, completeProfile,
      updateUser, refreshUser, logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
