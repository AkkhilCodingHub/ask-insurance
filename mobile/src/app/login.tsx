import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/auth';
import { Icon } from '@/components/Icon';
import { Colors } from '@/constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/(tabs)');
    } catch {
      Alert.alert('Login failed', 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Text style={s.backText}>← Back</Text>
          </TouchableOpacity>

          {/* Logo */}
          <View style={s.logoRow}>
            <View style={s.logoCircle}>
              <Icon name="shield" size={34} color={Colors.white} />
            </View>
          </View>

          <Text style={s.title}>Welcome back</Text>
          <Text style={s.sub}>Sign in to your ASK account</Text>

          {/* Form */}
          <View style={s.form}>
            <Text style={s.label}>EMAIL ADDRESS</Text>
            <TextInput
              style={s.input}
              placeholder="you@example.com"
              placeholderTextColor={Colors.textLight}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <Text style={s.label}>PASSWORD</Text>
            <View style={s.passwordRow}>
              <TextInput
                style={[s.input, { flex: 1, marginBottom: 0 }]}
                placeholder="Enter your password"
                placeholderTextColor={Colors.textLight}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                autoComplete="password"
              />
              <TouchableOpacity
                onPress={() => setShowPass(!showPass)}
                style={s.eyeBtn}
              >
                <Icon name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={s.forgotBtn}>
              <Text style={s.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleLogin}
              style={[s.loginBtn, loading && { opacity: 0.7 }]}
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={s.loginBtnText}>Sign In</Text>
              }
            </TouchableOpacity>

            {/* Divider */}
            <View style={s.divider}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>or</Text>
              <View style={s.dividerLine} />
            </View>

            {/* Google placeholder */}
            <TouchableOpacity style={s.socialBtn}>
              <Text style={s.socialEmoji}>🔵</Text>
              <Text style={s.socialText}>Continue with Google</Text>
            </TouchableOpacity>
          </View>

          {/* Register link */}
          <TouchableOpacity
            onPress={() => router.replace('/register')}
            style={s.registerLink}
          >
            <Text style={s.registerText}>
              Don't have an account?{' '}
              <Text style={{ color: Colors.primary, fontWeight: '700' }}>Create one</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.white },
  scroll: { paddingHorizontal: 24, paddingBottom: 40 },

  backBtn:  { marginTop: 8, marginBottom: 20, alignSelf: 'flex-start' },
  backText: { fontSize: 15, color: Colors.primary, fontWeight: '600' },

  logoRow:    { alignItems: 'center', marginBottom: 24 },
  logoCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: Colors.accent,
  },
  logoEmoji: { fontSize: 34 },

  title: { fontSize: 26, fontWeight: '900', color: Colors.text, letterSpacing: -0.5, textAlign: 'center' },
  sub:   { fontSize: 14, color: Colors.textMuted, textAlign: 'center', marginTop: 6, marginBottom: 32 },

  form: { gap: 4 },
  label: {
    fontSize: 10, fontWeight: '700', color: Colors.textMuted,
    letterSpacing: 0.8, marginBottom: 6, marginTop: 12,
  },
  input: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, color: Colors.text, backgroundColor: Colors.bg,
    marginBottom: 4,
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn:      { padding: 13, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, backgroundColor: Colors.bg },
  eyeText:     { fontSize: 16 },

  forgotBtn:  { alignSelf: 'flex-end', paddingVertical: 8 },
  forgotText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },

  loginBtn: {
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 15, alignItems: 'center', marginTop: 8,
  },
  loginBtnText: { fontSize: 15, fontWeight: '800', color: Colors.white },

  divider: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 18,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: 13, color: Colors.textLight, fontWeight: '500' },

  socialBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 14,
    paddingVertical: 13, backgroundColor: Colors.white,
  },
  socialEmoji: { fontSize: 18 },
  socialText:  { fontSize: 14, fontWeight: '600', color: Colors.text },

  registerLink: { alignItems: 'center', marginTop: 24 },
  registerText: { fontSize: 14, color: Colors.textMuted },
});
