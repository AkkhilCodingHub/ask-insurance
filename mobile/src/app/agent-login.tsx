import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAgent } from '@/context/agent';
import { Icon } from '@/components/Icon';
import { Colors } from '@/constants/theme';
import { authFieldStyles as af } from '@/constants/authFieldStyles';

export default function AgentLoginScreen() {
  const router      = useRouter();
  const { login }   = useAgent();
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [showPass,  setShowPass]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace('/(agent)/quotes' as any);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          {/* Back */}
          <TouchableOpacity style={s.back} onPress={() => router.back()} activeOpacity={0.7}>
            <Icon name="arrow-back" size={20} color={Colors.textMuted} />
          </TouchableOpacity>

          {/* Header */}
          <View style={s.heroWrap}>
            <Text style={s.kicker}>Advisor</Text>
            <View style={s.heroIcon}>
              <Icon name="shield-checkmark" size={32} color={Colors.primary} />
            </View>
            <Text style={s.heroTitle}>Agent Portal</Text>
            <Text style={s.heroSub}>Sign in with your advisor credentials to manage quotes and policies.</Text>
          </View>

          {/* Form */}
          <View style={s.formCard}>
          <View style={s.form}>
            <Text style={s.label}>EMAIL</Text>
            <View style={[af.inputRow, af.fieldGap]}>
              <View style={af.prefix}>
                <Icon name="mail-outline" size={18} color={Colors.primary} />
              </View>
              <TextInput
                style={af.input}
                placeholder="advisor@example.com"
                placeholderTextColor={Colors.textLight}
                value={email}
                onChangeText={v => { setEmail(v); setError(''); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <Text style={s.label}>PASSWORD</Text>
            <View style={af.inputRow}>
              <View style={af.prefix}>
                <Icon name="lock-closed-outline" size={18} color={Colors.primary} />
              </View>
              <TextInput
                style={af.input}
                placeholder="••••••••"
                placeholderTextColor={Colors.textLight}
                value={password}
                onChangeText={v => { setPassword(v); setError(''); }}
                secureTextEntry={!showPass}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPass(v => !v)} style={s.eyeBtn} activeOpacity={0.7}>
                <Icon name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {!!error && (
              <View style={s.errBox}>
                <Icon name="alert-circle-outline" size={15} color={Colors.error} />
                <Text style={s.errText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[s.btn, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.btnText}>Sign In as Agent</Text>
              }
            </TouchableOpacity>
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

  formCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    ...Platform.select({ ios: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 }, android: { elevation: 2 } }),
  },
  form:  { gap: 4 },
  label: { fontSize: 10, fontWeight: '800', color: Colors.textMuted, letterSpacing: 1, marginBottom: 6 },
  eyeBtn: { paddingRight: 14, paddingVertical: 16, paddingLeft: 4 },

  errBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEF2F2', borderRadius: 10, padding: 12,
    marginTop: 10, borderWidth: 1, borderColor: '#FEE2E2',
  },
  errText: { flex: 1, fontSize: 13, color: Colors.error },

  btn: {
    marginTop: 24, backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  btnText: { fontSize: 16, fontWeight: '800', color: '#fff' },

  footer: { marginTop: 'auto', paddingTop: 40, fontSize: 12, color: Colors.textLight, textAlign: 'center' },
});
