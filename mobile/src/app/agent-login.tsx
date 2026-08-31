import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Redirect } from 'expo-router';
import { useAgent } from '@/context/agent';
import { Icon } from '@/components/Icon';
import { BackButton } from '@/components/BackButton';
import { Colors } from '@/constants/theme';
import { authFieldStyles as af } from '@/constants/authFieldStyles';

export default function AgentLoginScreen() {
  const router      = useRouter();
  const { agent, login } = useAgent();

  if (agent) return <Redirect href="/(agent)/quotes" />;
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [showPass,  setShowPass]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  const handleLogin = async () => {
    const targetEmail = email.trim();
    const targetPass = password.trim();
    if (!targetEmail || !targetPass) {
      setError('Email or POSP ID and password are required.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { clearToken } = await import('@/lib/api');
      await clearToken();
      await login(targetEmail, targetPass);
      router.replace('/(agent)/quotes' as any);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
    <SafeAreaView style={s.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          {/* Back */}
          <TouchableOpacity style={s.back} onPress={() => router.back()} activeOpacity={0.7}>
            <Icon name="arrow-back" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* ── Hero ─────────────────────────────── */}
          <View style={s.hero}>
            <View style={s.heroBg1} /><View style={s.heroBg2} />

          {/* Header */}
          <View style={s.heroWrap}>
            <Text style={s.kicker}>Advisor</Text>
            <View style={s.heroIcon}>
              <Icon name="shield-checkmark" size={32} color={Colors.primary} />
            <BackButton color="rgba(255,255,255,0.9)" style={s.backBtn} />

            <View style={s.logoRow}>
              <View style={s.logoCircle}>
                <Icon name="shield-checkmark" size={32} color={Colors.primary} />
              </View>
            </View>

            <Text style={s.heroTitle}>POSP Advisor Portal</Text>
            <Text style={s.heroSub}>Sign in with your POSP advisor credentials to manage quotes and policies.</Text>

            <TouchableOpacity
              style={s.pospRegisterBtn}
              onPress={() => router.push('/posp-register' as any)}
              activeOpacity={0.85}
            >
              <Icon name="school-outline" size={16} color={Colors.primary} />
              <Text style={s.pospRegisterBtnText}>New Advisor? Take IC-38 Exam & Register</Text>
            </TouchableOpacity>
            <Text style={s.heroSub}>Manage quotes, policies & client commissions</Text>
          </View>

          {/* Form */}
          <View style={s.formCard}>
          <View style={s.form}>
            <Text style={s.label}>EMAIL OR POSP ID (AS...)</Text>
          {/* ── Card ──────────────────────────────────── */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Advisor Sign In</Text>
            <Text style={s.cardSub}>Use your POSP credentials or registered email to sign in</Text>

            {/* Email / ID */}
            <Text style={s.fieldLabel}>EMAIL OR POSP ID (AS...)</Text>
            <View style={[af.inputRow, af.fieldGap]}>
              <View style={af.prefix}>
                <Icon name="mail-outline" size={18} color={Colors.primary} />
              </View>
              <TextInput
                style={s.agentInput}
                placeholder="Email or POSP ID"
                placeholderTextColor={Colors.textMuted}
                placeholder="advisor@example.com"
                placeholderTextColor={Colors.textLight}
                value={email}
                onChangeText={v => { setEmail(v); setError(''); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                numberOfLines={1}
                multiline={false}
                returnKeyType="next"
              />
            </View>

            <Text style={s.label}>PASSWORD</Text>
            <View style={af.inputRow}>
            {/* Password */}
            <Text style={s.fieldLabel}>PASSWORD</Text>
            <View style={[af.inputRow, { marginBottom: 12 }]}>
              <View style={af.prefix}>
                <Icon name="lock-closed-outline" size={18} color={Colors.primary} />
              </View>
              <TextInput
                style={s.agentInput}
                placeholder="••••••••"
                placeholderTextColor={Colors.textLight}
                value={password}
                onChangeText={v => { setPassword(v); setError(''); }}
                secureTextEntry={!showPass}
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity onPress={() => setShowPass(v => !v)} style={s.eyeBtn} activeOpacity={0.7}>
                <Icon name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {!!error && (
              <View style={s.errBox}>
                <Icon name="alert-circle-outline" size={15} color={Colors.error} />
                <Icon name="alert-circle" size={16} color={Colors.error} />
                <Text style={s.errText}>{error}</Text>
              </View>
            )}

            {/* CTA Button */}
            <TouchableOpacity
              style={[s.btn, loading && { opacity: 0.7 }]}
              style={[s.continueBtn, loading && s.continueBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.btnText}>Sign In as POSP Advisor</Text>
              }
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Text style={s.continueBtnText}>Sign In as POSP Advisor</Text>
                  <Icon name="arrow-forward-outline" size={18} color={Colors.white} />
                </>
              )}
            </TouchableOpacity>

            {/* Exam / New Advisor Register Option */}
            <TouchableOpacity
              style={s.pospRegisterBtn}
              onPress={() => router.push('/posp-register' as any)}
              activeOpacity={0.85}
            >
              <Icon name="school-outline" size={16} color={Colors.primary} />
              <Text style={s.pospRegisterBtnText}>New Advisor? Take IC-38 Exam & Register</Text>
            </TouchableOpacity>

            <View style={s.customerSwitchRow}>
              <Text style={s.customerSwitchText}>Looking for policy quotes? </Text>
              <TouchableOpacity onPress={() => router.push('/login' as any)}>
                <Text style={s.customerSwitchLink}>Customer Sign In →</Text>
              </TouchableOpacity>
            </View>
          </View>
          </View>

          <Text style={s.footer}>This portal is for licensed insurance advisors only.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg },
  scroll: { flexGrow: 1, padding: 24 },
  back:   { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border },

  heroWrap:  { alignItems: 'center', marginBottom: 28, gap: 12 },
  kicker:    { fontSize: 10, fontWeight: '800', color: Colors.textLight, letterSpacing: 1.2 },
  heroIcon:  { width: 72, height: 72, borderRadius: 22, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontSize: 26, fontWeight: '900', color: Colors.text, letterSpacing: -0.5 },
  heroSub:   { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 20, maxWidth: 280 },
  pospRegisterBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
    borderWidth: 1.5, borderColor: Colors.primary, backgroundColor: Colors.primary + '10',
    marginTop: 6,
  safe: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  pospRegisterBtnText: { fontSize: 13, fontWeight: '800', color: Colors.primary },

  formCard: {
    backgroundColor: Colors.white,
  hero: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 28,
    alignItems: 'center',
    overflow: 'hidden',
  },
  heroBg1: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(21, 128, 255, 0.22)',
  },
  heroBg2: {
    position: 'absolute',
    bottom: -40,
    left: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  backBtn: {
    position: 'absolute',
    top: 12,
    left: 16,
    zIndex: 10,
  },
  logoRow: {
    marginBottom: 8,
    marginTop: 4,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 16,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    ...Platform.select({ ios: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 }, android: { elevation: 2 } }),
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#1580FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  form:  { gap: 4 },
  label: { fontSize: 10, fontWeight: '800', color: Colors.textMuted, letterSpacing: 1, marginBottom: 6 },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -0.5,
    marginBottom: 3,
  },
  heroSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
    textAlign: 'center',
  },
  card: {
    flex: 1,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 36,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  agentInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    fontWeight: '700',
    color: Colors.text,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  eyeBtn: { paddingRight: 14, paddingVertical: 16, paddingLeft: 4 },

  eyeBtn: {
    paddingRight: 14,
    paddingVertical: 16,
    paddingLeft: 4,
  },
  errBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEF2F2', borderRadius: 10, padding: 12,
    marginTop: 10, borderWidth: 1, borderColor: '#FEE2E2',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  errText: { flex: 1, fontSize: 13, color: Colors.error },

  btn: {
    marginTop: 24, backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  errText: {
    flex: 1,
    fontSize: 13,
    color: Colors.error,
    fontWeight: '600',
  },
  btnText: { fontSize: 16, fontWeight: '800', color: '#fff' },

  footer: { marginTop: 'auto', paddingTop: 40, fontSize: 12, color: Colors.textLight, textAlign: 'center' },
  continueBtn: {
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
    marginTop: 8,
    marginBottom: 16,
  },
  continueBtnDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  pospRegisterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
    marginBottom: 16,
  },
  pospRegisterBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  customerSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  customerSwitchText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  customerSwitchLink: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '700',
  },
});
