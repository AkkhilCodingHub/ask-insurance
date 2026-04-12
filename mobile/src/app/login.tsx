import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/auth';
import { Icon } from '@/components/Icon';
import { Colors } from '@/constants/theme';

export default function LoginScreen() {
  const router       = useRouter();
  const { sendOTP }  = useAuth();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const isValid = phone.length === 10;

  const handleContinue = async () => {
    if (!isValid) return;
    Keyboard.dismiss();
    setLoading(true);
    try {
      await sendOTP(phone);
      router.push('/otp');
    } catch {
      // handle error silently for now
    } finally {
      setLoading(false);
    }
  };

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

          <View style={s.logoRow}>
            <View style={s.logoCircle}>
              <Text style={s.logoText}>ASK</Text>
            </View>
          </View>

          <Text style={s.heroTitle}>Welcome to ASK</Text>
          <Text style={s.heroSub}>India's trusted insurance broker</Text>
        </View>

        {/* ── Card ──────────────────────────────────── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Enter your mobile number</Text>
          <Text style={s.cardSub}>We'll send a one-time code to verify you</Text>

          {/* Phone input */}
          <TouchableOpacity activeOpacity={1} onPress={() => inputRef.current?.focus()} style={s.inputRow}>
            <View style={s.prefix}>
              <Text style={s.flag}>🇮🇳</Text>
              <Text style={s.prefixText}>+91</Text>
            </View>
            <TextInput
              ref={inputRef}
              style={s.phoneInput}
              value={phone}
              onChangeText={t => setPhone(t.replace(/\D/g, '').slice(0, 10))}
              placeholder="0000 00000 0"
              placeholderTextColor={Colors.textLight}
              keyboardType="phone-pad"
              maxLength={10}
              returnKeyType="done"
              onSubmitEditing={handleContinue}
              autoFocus
            />
            {phone.length === 10 && (
              <View style={s.checkCircle}>
                <Icon name="checkmark" size={14} color={Colors.white} />
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.continueBtn, !isValid && s.continueBtnDisabled]}
            onPress={handleContinue}
            activeOpacity={0.85}
            disabled={!isValid || loading}
          >
            {loading
              ? <ActivityIndicator color={Colors.white} />
              : (
                <>
                  <Text style={s.continueBtnText}>Get OTP</Text>
                  <Icon name="arrow-forward-outline" size={18} color={Colors.white} />
                </>
              )
            }
          </TouchableOpacity>

          <Text style={s.consent}>
            By continuing you agree to our{' '}
            <Text style={s.consentLink}>Terms of Service</Text>
            {' '}&{' '}
            <Text style={s.consentLink}>Privacy Policy</Text>
          </Text>
        </View>

        {/* ── Footer ────────────────────────────────── */}
        <View style={s.footer}>
          <Icon name="shield-checkmark-outline" size={14} color={Colors.success} />
          <Text style={s.footerText}>Your data is encrypted & secure</Text>
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
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
    overflow: 'hidden',
  },
  heroBg1: {
    position: 'absolute', width: 250, height: 250, borderRadius: 125,
    backgroundColor: 'rgba(255,255,255,0.06)', top: -80, right: -60,
  },
  heroBg2: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.05)', bottom: 0, left: 20,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },
  logoRow:   { alignItems: 'center', marginBottom: 20 },
  logoCircle:{
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)',
  },
  logoText:  { fontSize: 18, fontWeight: '900', color: Colors.primary, letterSpacing: 2 },
  heroTitle: { fontSize: 26, fontWeight: '900', color: Colors.white, textAlign: 'center', letterSpacing: -0.5, marginBottom: 6 },
  heroSub:   { fontSize: 14, color: 'rgba(255,255,255,0.65)', textAlign: 'center' },

  // ── Card ──────────────────────────────────
  card: {
    flex: 1,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingTop: 32,
  },
  cardTitle: { fontSize: 22, fontWeight: '900', color: Colors.text, letterSpacing: -0.4, marginBottom: 6 },
  cardSub:   { fontSize: 14, color: Colors.textMuted, marginBottom: 28, lineHeight: 20 },

  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 2, borderColor: Colors.primary,
    borderRadius: 16, overflow: 'hidden',
    marginBottom: 20, backgroundColor: Colors.bg,
  },
  prefix: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 16,
    borderRightWidth: 2, borderRightColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  flag:       { fontSize: 18 },
  prefixText: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  phoneInput: {
    flex: 1, fontSize: 20, fontWeight: '700',
    color: Colors.text, paddingHorizontal: 14, paddingVertical: 16,
    letterSpacing: 1.5,
  },
  checkCircle: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.success,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 14,
  },

  continueBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 16, paddingVertical: 16,
    marginBottom: 20,
  },
  continueBtnDisabled: { backgroundColor: Colors.textLight },
  continueBtnText: { fontSize: 16, fontWeight: '800', color: Colors.white },

  consent:     { fontSize: 12, color: Colors.textMuted, textAlign: 'center', lineHeight: 18 },
  consentLink: { color: Colors.primary, fontWeight: '600' },

  // ── Footer ────────────────────────────────
  footer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 16, backgroundColor: Colors.white,
  },
  footerText: { fontSize: 12, color: Colors.textMuted, fontWeight: '500' },
});
