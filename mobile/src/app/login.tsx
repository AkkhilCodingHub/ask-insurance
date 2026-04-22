import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/auth';
import { useAgent } from '@/context/agent';
import { Icon } from '@/components/Icon';
import { BackButton } from '@/components/BackButton';
import { Colors } from '@/constants/theme';
import { authFieldStyles as af } from '@/constants/authFieldStyles';
import { useDialog } from '@/components/Dialog';

export default function LoginScreen() {
  const router       = useRouter();
  const { sendOTP }  = useAuth();
  const { login: agentLogin } = useAgent();
  const { alert }    = useDialog();

  const [mode,    setMode]    = useState<'customer' | 'agent'>('customer');
  const [phone,   setPhone]   = useState('');
  const [email,   setEmail]   = useState('');
  const [password,setPassword]= useState('');
  const [showPass,setShowPass]= useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const isValidCustomer = phone.length === 10;
  const isValidAgent    = email.trim().length > 0 && password.trim().length >= 6;

  const handleCustomerContinue = async () => {
    if (!isValidCustomer) return;
    Keyboard.dismiss();
    setLoading(true);
    try {
      await sendOTP(phone);
      router.push('/otp');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Could not send OTP. Please try again.';
      alert({ type: 'error', title: 'Error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleAgentLogin = async () => {
    if (!isValidAgent) return;
    Keyboard.dismiss();
    setLoading(true);
    try {
      await agentLogin(email.trim().toLowerCase(), password);
      router.replace('/(agent)/quotes' as any);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Invalid credentials. Please try again.';
      alert({ type: 'error', title: 'Login Failed', message: msg });
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

          <BackButton color="rgba(255,255,255,0.9)" style={s.backBtn} />

          <View style={s.logoRow}>
            <View style={s.logoCircle}>
              <Text style={s.logoText}>ASK</Text>
            </View>
          </View>

          <Text style={s.heroTitle}>Welcome to ASK</Text>
          <Text style={s.heroSub}>India's trusted insurance broker</Text>

          {/* ── Mode switcher inside hero ── */}
          <View style={s.segWrap}>
            <TouchableOpacity
              style={[s.segBtn, mode === 'customer' && s.segBtnActive]}
              onPress={() => setMode('customer')} activeOpacity={0.8}
            >
              <Icon name="person-outline" size={14} color={mode === 'customer' ? Colors.primary : 'rgba(255,255,255,0.7)'} />
              <Text style={[s.segText, mode === 'customer' && s.segTextActive]}>Customer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.segBtn, mode === 'agent' && s.segBtnActive]}
              onPress={() => setMode('agent')} activeOpacity={0.8}
            >
              <Icon name="shield-checkmark-outline" size={14} color={mode === 'agent' ? Colors.primary : 'rgba(255,255,255,0.7)'} />
              <Text style={[s.segText, mode === 'agent' && s.segTextActive]}>Agent</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Card ──────────────────────────────────── */}
        <View style={s.card}>
          {mode === 'customer' ? (
            <>
              <Text style={s.cardTitle}>Enter your mobile number</Text>
              <Text style={s.cardSub}>We'll send a one-time code to verify you</Text>

              <TouchableOpacity activeOpacity={1} onPress={() => inputRef.current?.focus()} style={[af.inputRow, af.fieldGap]}>
                <View style={af.prefix}>
                  <Text style={s.flag}>🇮🇳</Text>
                  <Text style={s.prefixText}>+91</Text>
                </View>
                <TextInput
                  ref={inputRef}
                  style={[af.input, af.inputPhone]}
                  value={phone}
                  onChangeText={t => setPhone(t.replace(/\D/g, '').slice(0, 10))}
                  placeholder="0000 00000 0"
                  placeholderTextColor={Colors.textLight}
                  keyboardType="phone-pad"
                  maxLength={10}
                  returnKeyType="done"
                  onSubmitEditing={handleCustomerContinue}
                  autoFocus
                />
                {phone.length === 10 && (
                  <View style={s.checkCircle}>
                    <Icon name="checkmark" size={14} color={Colors.white} />
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.continueBtn, !isValidCustomer && s.continueBtnDisabled]}
                onPress={handleCustomerContinue}
                activeOpacity={0.85}
                disabled={!isValidCustomer || loading}
              >
                {loading
                  ? <ActivityIndicator color={Colors.white} />
                  : <><Text style={s.continueBtnText}>Get OTP</Text><Icon name="arrow-forward-outline" size={18} color={Colors.white} /></>
                }
              </TouchableOpacity>

              <Text style={s.consent}>
                By continuing you agree to our{' '}
                <Text style={s.consentLink}>Terms of Service</Text>
                {' '}&{' '}
                <Text style={s.consentLink}>Privacy Policy</Text>
              </Text>
            </>
          ) : (
            <>
              <Text style={s.cardTitle}>Agent Sign In</Text>
              <Text style={s.cardSub}>Use your advisor credentials to access the portal</Text>

              {/* ── Email — mirrors inputRow ── */}
              <View style={[af.inputRow, af.fieldGap]}>
                <View style={af.prefix}>
                  <Icon name="mail-outline" size={18} color={Colors.primary} />
                </View>
                <TextInput
                  style={af.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="advisor@example.com"
                  placeholderTextColor={Colors.textLight}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
                {email.includes('@') && email.includes('.') && (
                  <View style={s.checkCircle}>
                    <Icon name="checkmark" size={14} color={Colors.white} />
                  </View>
                )}
              </View>

              {/* ── Password — mirrors inputRow ── */}
              <View style={[af.inputRow, { marginBottom: 20 }]}>
                <View style={af.prefix}>
                  <Icon name="lock-closed-outline" size={18} color={Colors.primary} />
                </View>
                <TextInput
                  style={af.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password"
                  placeholderTextColor={Colors.textLight}
                  secureTextEntry={!showPass}
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleAgentLogin}
                />
                <TouchableOpacity onPress={() => setShowPass(v => !v)} style={s.eyeBtn} activeOpacity={0.7}>
                  <Icon name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[s.continueBtn, !isValidAgent && s.continueBtnDisabled]}
                onPress={handleAgentLogin}
                activeOpacity={0.85}
                disabled={!isValidAgent || loading}
              >
                {loading
                  ? <ActivityIndicator color={Colors.white} />
                  : <><Text style={s.continueBtnText}>Sign In</Text><Icon name="arrow-forward-outline" size={18} color={Colors.white} /></>
                }
              </TouchableOpacity>

              <Text style={s.consent}>Licensed insurance advisors only</Text>
            </>
          )}
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
  heroSub:   { fontSize: 14, color: 'rgba(255,255,255,0.65)', textAlign: 'center', marginBottom: 20 },

  // ── Mode segmented switcher ────────────────
  segWrap: {
    flexDirection: 'row', gap: 6,
    backgroundColor: 'rgba(0,0,0,0.18)', borderRadius: 14, padding: 4,
  },
  segBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 9, borderRadius: 10,
  },
  segBtnActive: { backgroundColor: Colors.white },
  segText:      { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.7)' },
  segTextActive:{ color: Colors.primary },

  // ── Card ──────────────────────────────────
  card: {
    flex: 1,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingTop: 32,
  },
  cardTitle: { fontSize: 22, fontWeight: '900', color: Colors.text, letterSpacing: -0.4, marginBottom: 6 },
  cardSub:   { fontSize: 14, color: Colors.textMuted, marginBottom: 28, lineHeight: 20 },

  flag:       { fontSize: 18 },
  prefixText: { fontSize: 15, fontWeight: '700', color: Colors.primary },
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

  eyeBtn: { paddingHorizontal: 14, paddingVertical: 16 },

  // ── Footer ────────────────────────────────
  footer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 16, backgroundColor: Colors.white,
  },
  footerText: { fontSize: 12, color: Colors.textMuted, fontWeight: '500' },
});
