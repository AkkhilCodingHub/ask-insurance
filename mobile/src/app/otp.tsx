import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/auth';
import { Icon } from '@/components/Icon';
import { BackButton } from '@/components/BackButton';
import { Colors } from '@/constants/theme';
import { useDialog } from '@/components/Dialog';

import * as Clipboard from 'expo-clipboard';
import { AppState, DeviceEventEmitter } from 'react-native';

const OTP_LEN = 6;

export default function OTPScreen() {
  const router              = useRouter();
  const params              = useLocalSearchParams<{ phone?: string; policyId?: string; policyType?: string }>();
  const { pendingPhone, verifyOTP, sendOTP, autoVerified } = useAuth();
  const { alert }           = useDialog();
  const [digits, setDigits] = useState<string[]>(Array(OTP_LEN).fill(''));
  const [loading, setLoading]     = useState(false);
  const [resending, setResending] = useState(false);
  // Show "Checking SIM…" spinner on Android for up to 6s while Firebase tries auto-verify
  const [autoChecking, setAutoChecking] = useState(Platform.OS === 'android');
  const [clipboardCode, setClipboardCode] = useState<string | null>(null);
  const refs = useRef<Array<TextInput | null>>(Array(OTP_LEN).fill(null));
  const autoVerifiedRef = useRef(false);
  const processedCodeRef = useRef<string | null>(null);

  // Native Android SMS Receiver Listener (Zero user tap required!)
  useEffect(() => {
    const listener = DeviceEventEmitter.addListener('onSmsReceived', (event: { code?: string }) => {
      if (event?.code && event.code.length === OTP_LEN && processedCodeRef.current !== event.code) {
        processedCodeRef.current = event.code;
        const arr = event.code.split('');
        setDigits(arr);
        handleVerify(event.code);
      }
    });
    return () => listener.remove();
  }, []);

  // Auto-read clipboard for Truecaller "Copy OTP" or copied SMS (ignoring stale pre-existing clipboard)
  useEffect(() => {
    let active = true;
    let baselineClipboard: string | null = null;
    let baselineInitialized = false;

    const checkClipboard = async () => {
      if (!active) return;
      try {
        const text = await Clipboard.getStringAsync();
        if (!text) {
          baselineInitialized = true;
          return;
        }
        const cleaned = text.replace(/\D/g, '');

        // On first check on screen mount, record existing clipboard so stale OTPs are ignored
        if (!baselineInitialized) {
          baselineClipboard = cleaned;
          baselineInitialized = true;
          return;
        }

        // Only trigger if clipboard changed to a fresh 6-digit code after opening this screen
        if (cleaned.length === OTP_LEN && cleaned !== baselineClipboard && processedCodeRef.current !== cleaned) {
          processedCodeRef.current = cleaned;
          setClipboardCode(cleaned);
          const arr = cleaned.split('');
          setDigits(arr);
          handleVerify(cleaned);
        }
      } catch {}
    };

    checkClipboard();
    const interval = setInterval(checkClipboard, 1000);
    const sub = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') checkClipboard();
    });

    return () => {
      active = false;
      clearInterval(interval);
      sub.remove();
    };
  }, []);

  // Hide auto-check spinner after 6s (auto-verify window)
  useEffect(() => {
    if (!autoChecking) return;
    const t = setTimeout(() => setAutoChecking(false), 6000);
    return () => clearTimeout(t);
  }, [autoChecking]);

  // Redirect when Firebase auto-verifies (Android Play Integrity / silent SMS)
  useEffect(() => {
    if (!autoVerified) return;
    autoVerifiedRef.current = true;
    if (autoVerified.isNewUser) {
      router.replace('/onboarding');
    } else if (params.policyType) {
      router.replace({ pathname: '/quote', params: { type: params.policyType } });
    } else {
      router.replace('/(tabs)');
    }
  }, [autoVerified, params.policyType]);

  const rawPhoneParam = typeof params.phone === 'string' ? params.phone.replace(/\D/g, '').slice(-10) : '';
  const phone = pendingPhone || rawPhoneParam || '9876543210';
  const masked = phone.length === 10
    ? `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`
    : '+91 ••••• •••••';

  const handleChange = (text: string, i: number) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length > 1) {
      const chars = cleaned.slice(0, OTP_LEN).split('');
      const next = [...digits];
      chars.forEach((c, idx) => {
        if (i + idx < OTP_LEN) next[i + idx] = c;
      });
      setDigits(next);
      const targetIdx = Math.min(i + chars.length, OTP_LEN - 1);
      refs.current[targetIdx]?.focus();
      if (next.every(x => x !== '')) handleVerify(next.join(''));
      return;
    }
    const d = cleaned.slice(-1);
    const next = [...digits];
    next[i] = d;
    setDigits(next);
    if (d && i < OTP_LEN - 1) refs.current[i + 1]?.focus();
    if (next.every(x => x !== '')) handleVerify(next.join(''));
  };

  const handleKey = (key: string, i: number) => {
    if (key === 'Backspace' && !digits[i] && i > 0) {
      const next = [...digits];
      next[i - 1] = '';
      setDigits(next);
      refs.current[i - 1]?.focus();
    }
  };

  const verifyingRef = useRef(false);

  const handleVerify = async (otp: string) => {
    if (verifyingRef.current) return;
    verifyingRef.current = true;
    setLoading(true);
    try {
      const { isNewUser } = await verifyOTP(otp);
      if (isNewUser) {
        router.replace('/onboarding');
      } else if (params.policyType) {
        router.replace({ pathname: '/quote', params: { type: params.policyType } });
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      if (autoVerifiedRef.current) return;
      alert({ type: 'error', title: 'Verification Failed', message: err?.message || 'Invalid OTP. Please try again.' });
      setDigits(Array(OTP_LEN).fill(''));
      refs.current[0]?.focus();
    } finally {
      setLoading(false);
      verifyingRef.current = false;
    }
  };

  const handleResend = async () => {
    if (!phone) return;
    setResending(true);
    try {
      await sendOTP(phone);
      setDigits(Array(OTP_LEN).fill(''));
      setAutoChecking(Platform.OS === 'android');
      refs.current[0]?.focus();
    } finally {
      setResending(false);
    }
  };

  const filled = digits.filter(Boolean).length;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ── Blue hero ─────────────────────────────── */}
        <View style={s.hero}>
          <View style={s.heroBg1} /><View style={s.heroBg2} />

          <BackButton color="rgba(255,255,255,0.9)" style={s.backBtn} />

          <View style={s.heroIcon}>
            <Icon name="phone-portrait-outline" size={32} color={Colors.white} />
          </View>
          <Text style={s.heroTitle}>Verify your number</Text>
          <Text style={s.heroSub}>
            {autoChecking
              ? 'Checking your SIM automatically…'
              : <>We sent a 6-digit code to{'\n'}<Text style={s.heroPhone}>{masked}</Text></>
            }
          </Text>
        </View>

        {/* ── Card ──────────────────────────────────── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Enter OTP</Text>
          <Text style={s.cardSub}>Code expires in 10 minutes</Text>

          {/* OTP boxes */}
          <View style={s.otpRow}>
            {digits.map((d, i) => (
              <TextInput
                key={i}
                ref={el => { refs.current[i] = el; }}
                style={[
                  s.otpBox,
                  d ? s.otpBoxFilled : null,
                  i < filled && !d ? s.otpBoxError : null,
                ]}
                value={d}
                onChangeText={t => handleChange(t, i)}
                onKeyPress={({ nativeEvent }) => handleKey(nativeEvent.key, i)}
                keyboardType="number-pad"
                maxLength={OTP_LEN}
                autoComplete={i === 0 ? "one-time-code" : "off"}
                textContentType={i === 0 ? "oneTimeCode" : "none"}
                autoFocus={i === 0}
                selectTextOnFocus
                caretHidden
              />
            ))}
          </View>

          {/* Auto-checking indicator */}
          {autoChecking && (
            <View style={[s.hintRow, { marginBottom: 28 }]}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={[s.hintText, { color: Colors.primary }]}>Checking SIM automatically…</Text>
            </View>
          )}

          {/* Clipboard detected code pill */}
          {clipboardCode && (
            <TouchableOpacity
              style={s.pastePill}
              onPress={() => {
                const arr = clipboardCode.split('');
                setDigits(arr);
                handleVerify(clipboardCode);
              }}
              activeOpacity={0.8}
            >
              <Icon name="clipboard-outline" size={16} color={Colors.primary} />
              <Text style={s.pastePillText}>Paste detected code ({clipboardCode})</Text>
            </TouchableOpacity>
          )}

          {/* Verify button */}
          <TouchableOpacity
            style={[s.verifyBtn, filled < OTP_LEN && s.verifyBtnDisabled]}
            onPress={() => handleVerify(digits.join(''))}
            disabled={filled < OTP_LEN || loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={Colors.white} />
              : (
                <>
                  <Text style={s.verifyBtnText}>Verify & Continue</Text>
                  <Icon name="arrow-forward-outline" size={18} color={Colors.white} />
                </>
              )
            }
          </TouchableOpacity>

          {/* Resend */}
          <View style={s.resendRow}>
            <Text style={s.resendLabel}>Didn't receive the code? </Text>
            <TouchableOpacity onPress={handleResend} disabled={resending}>
              {resending
                ? <ActivityIndicator size="small" color={Colors.primary} />
                : <Text style={s.resendBtn}>Resend OTP</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.primary },

  // ── Hero ──────────────────────────────────
  hero: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24, paddingBottom: 44, paddingTop: 12,
    alignItems: 'center', overflow: 'hidden',
  },
  heroBg1: {
    position: 'absolute', width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.06)', top: -70, right: -50,
  },
  heroBg2: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.05)', bottom: 10, left: -20,
  },
  backBtn: {
    alignSelf: 'flex-start',
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  heroIcon: {
    width: 68, height: 68, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: { fontSize: 24, fontWeight: '900', color: Colors.white, letterSpacing: -0.4, marginBottom: 8 },
  heroSub:   { fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 22 },
  heroPhone: { color: Colors.white, fontWeight: '800' },

  // ── Card ──────────────────────────────────
  card: {
    flex: 1,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingTop: 30,
  },
  cardTitle: { fontSize: 20, fontWeight: '900', color: Colors.text, marginBottom: 4, letterSpacing: -0.3 },
  cardSub:   { fontSize: 13, color: Colors.textMuted, marginBottom: 28 },

  // ── OTP boxes ─────────────────────────────
  otpRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  otpBox: {
    flex: 1, aspectRatio: 1,
    borderRadius: 16, borderWidth: 2, borderColor: Colors.border,
    backgroundColor: Colors.bg,
    textAlign: 'center', fontSize: 24, fontWeight: '800', color: Colors.text,
  },
  otpBoxFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
    color: Colors.primary,
  },
  otpBoxError: { borderColor: Colors.error },

  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 28 },
  hintText: { fontSize: 12, color: Colors.textLight },

  pastePill: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.primaryLight, borderRadius: 12, paddingVertical: 10,
    marginBottom: 16, borderWidth: 1, borderColor: Colors.primary + '30',
  },
  pastePillText: { fontSize: 13, fontWeight: '700', color: Colors.primary },

  verifyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 16,
    marginBottom: 20,
  },
  verifyBtnDisabled: { backgroundColor: Colors.textLight },
  verifyBtnText: { fontSize: 16, fontWeight: '800', color: Colors.white },

  resendRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  resendLabel:{ fontSize: 13, color: Colors.textMuted },
  resendBtn:  { fontSize: 13, color: Colors.primary, fontWeight: '700' },
});
