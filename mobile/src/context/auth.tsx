import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { isDevice } from 'expo-device';
import {
  getAuth, signInWithPhoneNumber, onAuthStateChanged, signOut as firebaseSignOut,
} from '@react-native-firebase/auth';
import type { ConfirmationResult, User as FirebaseUser } from '@react-native-firebase/auth';
import {
  authApi, usersApi, ApiUser,
  getToken, setToken, clearAllTokens,
  setRefreshToken, clearRefreshToken,
  registerSessionExpiredCallback,
  paymentsApi,
} from '@/lib/api';

// ── Push notifications ────────────────────────────────────────────────────────

/** expo-notifications permission result shape varies slightly by SDK; normalize to status string */
function readNotificationPermissionStatus(result: unknown): 'granted' | 'denied' | 'undetermined' {
  if (result === 'granted' || result === 'denied' || result === 'undetermined') return result;
  if (typeof result === 'object' && result !== null && 'status' in result) {
    const s = (result as { status: string }).status;
    if (s === 'granted' || s === 'denied' || s === 'undetermined') return s;
  }
  return 'undetermined';
}

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
    const existing = readNotificationPermissionStatus(await Notifications.getPermissionsAsync());
    console.log('[push] existing permission status:', existing);

    if (existing === 'granted') {
      console.log('[push] permission already granted');
      return true;
    }

    console.log('[push] requesting permission from user...');
    const next = readNotificationPermissionStatus(await Notifications.requestPermissionsAsync());
    console.log('[push] permission result:', next);
    return next === 'granted';
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

    const status = readNotificationPermissionStatus(await Notifications.getPermissionsAsync());
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
  id:              string;
  name:            string;
  phone:           string;
  email?:          string;
  dob?:            string;     // DD/MM/YYYY display format
  gender?:         string;
  address?:        string;
  city?:           string;
  state?:          string;
  pincode?:        string;
  kycStatus:       string;     // pending | verified | rejected
  aadhaarVerified: boolean;
}

// ── Context interface ─────────────────────────────────────────────────────────

interface AuthContextValue {
  user:            AuthUser | null;
  loading:         boolean;
  pendingPhone:    string | null;
  autoVerified:    { isNewUser: boolean } | null;
  sendOTP:         (phone: string) => Promise<void>;
  verifyOTP:       (otp: string) => Promise<{ isNewUser: boolean }>;
  completeProfile: (name: string, dob: string) => Promise<void>;
  updateUser:      (u: AuthUser) => void;
  refreshUser:     () => Promise<void>;
  logout:          () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Mapper ────────────────────────────────────────────────────────────────────

export function mapApiUser(u: ApiUser): AuthUser {
  return {
    id:              u.id,
    name:            u.name ?? u.phone,
    phone:           u.phone,
    email:           u.email       ?? undefined,
    dob:             u.dateOfBirth
                       ? new Date(u.dateOfBirth).toLocaleDateString('en-GB')  // DD/MM/YYYY
                       : undefined,
    gender:          u.gender      ?? undefined,
    address:         u.address     ?? undefined,
    city:            u.city        ?? undefined,
    state:           u.state       ?? undefined,
    pincode:         u.pincode     ?? undefined,
    kycStatus:       u.kycStatus   ?? 'pending',
    aadhaarVerified: u.aadhaarVerified ?? false,
  };
}

// ── Provider ──────────────────────────────────────────────────────────────────

const firebaseAuth = getAuth();
// Bypass Play Integrity check in dev — Play Integrity only works for Play Store-signed builds
if (__DEV__) {
  firebaseAuth.settings.appVerificationDisabledForTesting = true;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]               = useState<AuthUser | null>(null);
  const [loading, setLoading]         = useState(true);
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);
  const [autoVerified, setAutoVerified] = useState<{ isNewUser: boolean } | null>(null);
  // Holds the Firebase confirmation result for manual OTP entry
  const confirmationRef = useRef<ConfirmationResult | null>(null);

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

  // ── Shared: exchange Firebase ID token for ASK JWT ───────────────────────
  const finishFirebaseLogin = async (firebaseUser: FirebaseUser): Promise<{ isNewUser: boolean }> => {
    const idToken = await firebaseUser.getIdToken();
    // Sign out from Firebase — we only need the ID token, ASK issues its own JWT
    await firebaseSignOut(firebaseAuth);

    const result = await authApi.verifyFirebase(idToken);
    await setToken(result.token);
    await setRefreshToken(result.refreshToken);

    if (!result.isNewUser && result.user.name) {
      setUser(mapApiUser(result.user));
    }
    setPendingPhone(null);
    confirmationRef.current = null;

    return { isNewUser: result.isNewUser || !result.user.name };
  };

  // ── Auto-verify listener (Android Play Integrity / silent SMS) ────────────
  // Only active while pendingPhone is set to avoid firing on unrelated auth changes.
  useEffect(() => {
    if (!pendingPhone) return;
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      if (!firebaseUser) return;
      try {
        const result = await finishFirebaseLogin(firebaseUser);
        setAutoVerified(result);
      } catch (e) {
        console.warn('[Firebase] auto-verify exchange failed:', e);
      }
    });
    return unsubscribe;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPhone]);

  // ── Step 1: send OTP via Firebase ─────────────────────────────────────────
  const sendOTP = async (phone: string) => {
    const formatted = phone.startsWith('+91') ? phone : `+91${phone}`;
    const confirmation = await signInWithPhoneNumber(firebaseAuth, formatted);
    confirmationRef.current = confirmation;
    setPendingPhone(phone);
    setAutoVerified(null);
  };

  // ── Step 2: verify OTP entered manually by the user ───────────────────────
  const verifyOTP = async (otp: string): Promise<{ isNewUser: boolean }> => {
    if (!confirmationRef.current) throw new Error('No pending verification — call sendOTP first');
    const credential = await confirmationRef.current.confirm(otp);
    if (!credential?.user) throw new Error('Verification failed');
    return finishFirebaseLogin(credential.user);
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
    setAutoVerified(null);
    confirmationRef.current = null;
  };

  return (
    <AuthContext.Provider value={{
      user, loading, pendingPhone, autoVerified,
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
