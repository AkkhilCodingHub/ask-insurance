import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { isDevice } from 'expo-device';
import {
  getAuth, signInWithPhoneNumber, onAuthStateChanged, signOut as firebaseSignOut,
  FirebaseAuthTypes,
} from '@react-native-firebase/auth';
import {
  authApi, usersApi, ApiUser,
  getToken, setToken, clearAllTokens,
  setRefreshToken, clearRefreshToken,
  registerSessionExpiredCallback,
  paymentsApi,
} from '@/lib/api';

// ── Push notifications ────────────────────────────────────────────────────────

function readNotificationPermissionStatus(result: unknown): 'granted' | 'denied' | 'undetermined' {
  if (result === 'granted' || result === 'denied' || result === 'undetermined') return result;
  if (typeof result === 'object' && result !== null && 'status' in result) {
    const s = (result as { status: string }).status;
    if (s === 'granted' || s === 'denied' || s === 'undetermined') return s;
  }
  return 'undetermined';
}

export async function requestNotificationPermission(): Promise<boolean> {
  const Notifications = await import('expo-notifications');
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
    } catch {}
  }
  try {
    const existing = readNotificationPermissionStatus(await Notifications.getPermissionsAsync());
    if (existing === 'granted') return true;
    const next = readNotificationPermissionStatus(await Notifications.requestPermissionsAsync());
    return next === 'granted';
  } catch {
    return false;
  }
}

async function savePushToken() {
  if (!isDevice) return;
  try {
    const Notifications = await import('expo-notifications');
    const status = readNotificationPermissionStatus(await Notifications.getPermissionsAsync());
    if (status !== 'granted') return;
    const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
    const { data: token } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    if (token) await paymentsApi.savePushToken(token);
  } catch {}
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
  kycStatus:          string;     // pending | submitted | verified | rejected
  aadhaarVerified:    boolean;
  kycDocType?:        string | null;
  kycRejectionReason?: string | null;
  kycSubmittedAt?:    string | null;
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
    kycStatus:          u.kycStatus          ?? 'pending',
    aadhaarVerified:    u.aadhaarVerified    ?? false,
    kycDocType:         (u as any).kycDocType         ?? null,
    kycRejectionReason: (u as any).kycRejectionReason ?? null,
    kycSubmittedAt:     (u as any).kycSubmittedAt     ?? null,
  };
}

// ── Provider ──────────────────────────────────────────────────────────────────

const firebaseAuth = getAuth();

if (__DEV__) {
  firebaseAuth.settings.appVerificationDisabledForTesting = true;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]               = useState<AuthUser | null>(null);
  const [loading, setLoading]         = useState(true);
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);
  const [autoVerified, setAutoVerified] = useState<{ isNewUser: boolean } | null>(null);
  const confirmationRef = useRef<FirebaseAuthTypes.ConfirmationResult | null>(null);
  const manualVerifyInProgressRef = useRef(false);
  const isLocalOtpRef = useRef(false);

  useEffect(() => {
    registerSessionExpiredCallback(() => {
      setUser(null);
      setPendingPhone(null);
    });
    return () => registerSessionExpiredCallback(null);
  }, []);

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    if (user) savePushToken();
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
  const finishFirebaseLogin = async (firebaseUser: FirebaseAuthTypes.User): Promise<{ isNewUser: boolean }> => {
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
      // Skip if verifyOTP is already handling this sign-in
      if (manualVerifyInProgressRef.current) return;
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
    isLocalOtpRef.current = false;
    try {
      const formatted = phone.startsWith('+91') ? phone : `+91${phone}`;
      const confirmation = await signInWithPhoneNumber(firebaseAuth, formatted);
      confirmationRef.current = confirmation;
      setPendingPhone(phone);
      setAutoVerified(null);
    } catch (firebaseErr) {
      console.warn('[Auth] Firebase sendOTP failed, falling back to local API:', firebaseErr);
      try {
        const res = await authApi.sendOTP(phone);
        if (res.success) {
          isLocalOtpRef.current = true;
          setPendingPhone(phone);
          setAutoVerified(null);
          return;
        }
      } catch (localErr) {
        console.warn('[Auth] Local API fallback also failed:', localErr);
      }
      throw firebaseErr;
    }
  };

  // ── Step 2: verify OTP entered manually by the user ───────────────────────
  const verifyOTP = async (otp: string): Promise<{ isNewUser: boolean }> => {
    if (isLocalOtpRef.current) {
      manualVerifyInProgressRef.current = true;
      try {
        const result = await authApi.verifyOTP(pendingPhone!, otp);
        await setToken(result.token);
        await setRefreshToken(result.refreshToken);
        if (!result.isNewUser && result.user.name) {
          setUser(mapApiUser(result.user));
        }
        setPendingPhone(null);
        return { isNewUser: result.isNewUser || !result.user.name };
      } finally {
        manualVerifyInProgressRef.current = false;
      }
    }

    if (!confirmationRef.current) throw new Error('No pending verification — call sendOTP first');
    manualVerifyInProgressRef.current = true;
    try {
      const credential = await confirmationRef.current.confirm(otp);
      if (!credential?.user) throw new Error('Verification failed');
      return await finishFirebaseLogin(credential.user);
    } finally {
      manualVerifyInProgressRef.current = false;
    }
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
