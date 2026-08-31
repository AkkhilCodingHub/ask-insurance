import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { isDevice } from 'expo-device';
import {
  getAuth, signInWithPhoneNumber, onAuthStateChanged, signOut as firebaseSignOut,
  FirebaseAuthTypes,
} from '@react-native-firebase/auth';
import {
  authApi, usersApi, ApiUser,
  getToken, setToken, clearAllTokens,
  setRefreshToken,
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
  try {
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
  customerCode?:   string;
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
  panNumber?:         string | null;
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
    customerCode:    u.customerCode ?? undefined,
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
    panNumber:          u.panNumber          ?? undefined,
    kycDocType:         (u as any).kycDocType         ?? null,
    kycRejectionReason: (u as any).kycRejectionReason ?? null,
    kycSubmittedAt:     (u as any).kycSubmittedAt     ?? null,
  };
}

// ── Provider ──────────────────────────────────────────────────────────────────

import { initializeApp, getApps } from '@react-native-firebase/app';

function getFirebaseAuth() {
  try {
    if (getApps().length === 0) {
      initializeApp({
        apiKey: "AIzaSyAOO0lS024bTXRNW_-eUptQFx5eV5GlNos",
        appId: "1:879913171231:android:f214cb309918a1e4ea582a",
        messagingSenderId: "879913171231",
        projectId: "ask-in",
        authDomain: "ask-in.firebaseapp.com",
        databaseURL: "https://ask-in-default-rtdb.firebaseio.com",
        storageBucket: "ask-in.firebasestorage.app"
      });
    }
    return getAuth();
  } catch (e) {
    console.warn('[Auth] Firebase getAuth() initialization error:', e);
    return null;
  }
}

const USER_PROFILE_CACHE_KEY = 'user_profile_cache_v1';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState]          = useState<AuthUser | null>(null);
  const [loading, setLoading]         = useState(true);
  const [pendingPhone, setPendingPhoneState] = useState<string | null>(null);
  const pendingPhoneRef = useRef<string | null>(null);
  const setPendingPhone = (p: string | null) => {
    pendingPhoneRef.current = p;
    setPendingPhoneState(p);
  };
  const [autoVerified, setAutoVerified] = useState<{ isNewUser: boolean } | null>(null);
  const confirmationRef = useRef<FirebaseAuthTypes.ConfirmationResult | null>(null);
  const manualVerifyInProgressRef = useRef(false);
  const isLocalOtpRef = useRef(false);

  const setUser = (u: AuthUser | null) => {
    setUserState(u);
    if (u) {
      SecureStore.setItemAsync(USER_PROFILE_CACHE_KEY, JSON.stringify(u)).catch(() => {});
    } else {
      SecureStore.deleteItemAsync(USER_PROFILE_CACHE_KEY).catch(() => {});
    }
  };

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

  // ── Restore session on app launch (Instant Offline Restore + Background Revalidation) ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [cachedRaw, token] = await Promise.all([
          SecureStore.getItemAsync(USER_PROFILE_CACHE_KEY).catch(() => null),
          getToken().catch(() => null),
        ]);

        if (cachedRaw) {
          try {
            const parsed = JSON.parse(cachedRaw);
            if (parsed && !cancelled) {
              setUserState(parsed);
            }
          } catch {}
        }

        // Release loading immediately — UI appears instantly
        if (!cancelled) setLoading(false);

        // If a token exists, revalidate in background without blocking UI
        if (token) {
          try {
            const { user: apiUser } = await authApi.me();
            if (!cancelled && apiUser) {
              const mapped = mapApiUser(apiUser);
              setUser(mapped);
            }
          } catch (err: any) {
            if (err?.status === 401) {
              await clearAllTokens();
              if (!cancelled) setUser(null);
            }
          }
        } else if (!cachedRaw) {
          if (!cancelled) setUser(null);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Shared: exchange Firebase ID token for ASK JWT ───────────────────────
  const finishFirebaseLogin = async (firebaseUser: FirebaseAuthTypes.User): Promise<{ isNewUser: boolean }> => {
    const idToken = await firebaseUser.getIdToken();
    // Sign out from Firebase — we only need the ID token, ASK issues its own JWT
    const fbAuth = getFirebaseAuth();
    if (fbAuth) await firebaseSignOut(fbAuth);

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
    const fbAuth = getFirebaseAuth();
    if (!fbAuth) return;
    const unsubscribe = onAuthStateChanged(fbAuth, async (firebaseUser) => {
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
    pendingPhoneRef.current = phone;
    setPendingPhone(phone);
    authApi.sendOTP(phone).catch(err => console.warn('[Auth] background sendOTP error:', err));
    try {
      const formatted = phone.startsWith('+91') ? phone : `+91${phone}`;
      const fbAuth = getFirebaseAuth();
      if (!fbAuth) throw new Error('Firebase Auth not initialized');
      const confirmation = await signInWithPhoneNumber(fbAuth, formatted);
      confirmationRef.current = confirmation;
      setAutoVerified(null);
    } catch (firebaseErr) {
      console.warn('[Auth] Firebase sendOTP failed, falling back to local API:', firebaseErr);
      isLocalOtpRef.current = true;
      setAutoVerified(null);
    }
  };

  // ── Step 2: verify OTP entered manually by the user ───────────────────────
  const verifyOTP = async (otp: string): Promise<{ isNewUser: boolean }> => {
    manualVerifyInProgressRef.current = true;
    try {
      const targetPhone = pendingPhoneRef.current || pendingPhone || '9876543210';
      if (targetPhone) {
        try {
          const result = await authApi.verifyOTP(targetPhone, otp);
          await setToken(result.token);
          await setRefreshToken(result.refreshToken);
          setUser(mapApiUser(result.user));
          setPendingPhone(null);
          confirmationRef.current = null;
          return { isNewUser: result.isNewUser || !result.user.name };
        } catch (localErr: any) {
          console.error('[Auth] Local API verifyOTP failed details:', localErr?.message, localErr?.status, localErr);
          if (!confirmationRef.current || __DEV__) throw new Error(localErr?.message || 'Invalid OTP');
        }
      }

      if (!confirmationRef.current) {
        throw new Error('No pending verification — call sendOTP first');
      }

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
