import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/auth';
import { Icon } from '@/components/Icon';
import { Colors } from '@/constants/theme';

const OTP_LEN = 6;

export default function OTPScreen() {
  const router              = useRouter();
  const { pendingPhone, verifyOTP, sendOTP } = useAuth();
  const [digits, setDigits] = useState<string[]>(Array(OTP_LEN).fill(''));
  const [loading, setLoading]   = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const refs = useRef<Array<TextInput | null>>(Array(OTP_LEN).fill(null));

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const phone = pendingPhone ?? '';
  const masked = phone.length === 10
    ? `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`
    : '+91 ••••• •••••';

  const handleChange = (text: string, i: number) => {
    const d = text.replace(/\D/g, '').slice(-1);
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

  const handleVerify = async (otp: string) => {
    setLoading(true);
    try {
      const { isNewUser } = await verifyOTP(otp);
      if (isNewUser) {
        router.replace('/onboarding');
      } else {
        router.replace('/(tabs)');
      }
    } catch {
      Alert.alert('Invalid OTP', 'The code you entered is incorrect. Please try again.');
      setDigits(Array(OTP_LEN).fill(''));
      refs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || !phone) return;
    setResending(true);
    try {
      await sendOTP(phone);
      setDigits(Array(OTP_LEN).fill(''));
      setCountdown(30);
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

          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Icon name="arrow-back-outline" size={22} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>

          <View style={s.heroIcon}>
            <Icon name="phone-portrait-outline" size={32} color={Colors.white} />
          </View>
          <Text style={s.heroTitle}>Verify your number</Text>
          <Text style={s.heroSub}>
            We sent a 6-digit code to{'\n'}
            <Text style={s.heroPhone}>{masked}</Text>
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
                maxLength={1}
                autoFocus={i === 0}
                selectTextOnFocus
                caretHidden
              />
            ))}
          </View>

          {/* Hint */}
          <View style={s.hintRow}>
            <Icon name="information-circle-outline" size={14} color={Colors.textLight} />
            <Text style={s.hintText}>Use <Text style={{ fontWeight: '700', color: Colors.primary }}>123456</Text> for demo</Text>
          </View>

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
            {countdown > 0 ? (
              <Text style={s.resendTimer}>Resend in {countdown}s</Text>
            ) : (
              <TouchableOpacity onPress={handleResend} disabled={resending}>
                {resending
                  ? <ActivityIndicator size="small" color={Colors.primary} />
                  : <Text style={s.resendBtn}>Resend OTP</Text>
                }
              </TouchableOpacity>
            )}
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
    borderRadius: 14, borderWidth: 2, borderColor: Colors.border,
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

  verifyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 16,
    marginBottom: 20,
  },
  verifyBtnDisabled: { backgroundColor: Colors.textLight },
  verifyBtnText: { fontSize: 16, fontWeight: '800', color: Colors.white },

  resendRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  resendLabel:{ fontSize: 13, color: Colors.textMuted },
  resendTimer:{ fontSize: 13, color: Colors.textLight, fontWeight: '600' },
  resendBtn:  { fontSize: 13, color: Colors.primary, fontWeight: '700' },
});
