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

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Password mismatch', 'Passwords do not match.');
      return;
    }
    if (phone.length < 10) {
      Alert.alert('Invalid phone', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    setLoading(true);
    try {
      await register(name.trim(), email.trim(), phone.trim(), password);
      router.replace('/(tabs)');
    } catch {
      Alert.alert('Registration failed', 'Something went wrong. Please try again.');
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

          <Text style={s.title}>Create account</Text>
          <Text style={s.sub}>Join 2.4 lakh+ insured Indians</Text>

          <View style={s.form}>
            <Text style={s.label}>FULL NAME</Text>
            <TextInput
              style={s.input}
              placeholder="Your full name"
              placeholderTextColor={Colors.textLight}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoComplete="name"
            />

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

            <Text style={s.label}>MOBILE NUMBER</Text>
            <View style={s.phoneRow}>
              <View style={s.prefix}><Text style={s.prefixText}>+91</Text></View>
              <TextInput
                style={[s.input, { flex: 1, marginBottom: 0 }]}
                placeholder="10-digit number"
                placeholderTextColor={Colors.textLight}
                value={phone}
                onChangeText={t => setPhone(t.replace(/\D/g, '').slice(0, 10))}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>

            <Text style={s.label}>PASSWORD</Text>
            <View style={s.passwordRow}>
              <TextInput
                style={[s.input, { flex: 1, marginBottom: 0 }]}
                placeholder="Min. 8 characters"
                placeholderTextColor={Colors.textLight}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={s.eyeBtn}>
                <Icon name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={s.label}>CONFIRM PASSWORD</Text>
            <TextInput
              style={[s.input, confirm && confirm !== password && { borderColor: Colors.error }]}
              placeholder="Re-enter password"
              placeholderTextColor={Colors.textLight}
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry={!showPass}
            />
            {confirm && confirm !== password && (
              <Text style={s.errorText}>Passwords do not match</Text>
            )}

            <Text style={s.consent}>
              By creating an account you agree to our{' '}
              <Text style={{ color: Colors.primary }}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={{ color: Colors.primary }}>Privacy Policy</Text>.
            </Text>

            <TouchableOpacity
              onPress={handleRegister}
              style={[s.registerBtn, loading && { opacity: 0.7 }]}
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={s.registerBtnText}>Create Account</Text>
              }
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => router.replace('/login')}
            style={s.loginLink}
          >
            <Text style={s.loginLinkText}>
              Already have an account?{' '}
              <Text style={{ color: Colors.primary, fontWeight: '700' }}>Sign in</Text>
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

  title: { fontSize: 26, fontWeight: '900', color: Colors.text, letterSpacing: -0.5 },
  sub:   { fontSize: 14, color: Colors.textMuted, marginTop: 6, marginBottom: 28 },

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
  phoneRow: { flexDirection: 'row', gap: 8 },
  prefix: {
    paddingHorizontal: 14, paddingVertical: 13,
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: 12, backgroundColor: Colors.bg, justifyContent: 'center',
  },
  prefixText: { fontSize: 15, color: Colors.textMuted, fontWeight: '600' },
  passwordRow: { flexDirection: 'row', gap: 8 },
  eyeBtn: { padding: 13, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, backgroundColor: Colors.bg },
  eyeText: { fontSize: 16 },
  errorText: { fontSize: 12, color: Colors.error, marginTop: 2 },
  consent: { fontSize: 12, color: Colors.textMuted, lineHeight: 18, marginTop: 12 },

  registerBtn: {
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 15, alignItems: 'center', marginTop: 20,
  },
  registerBtnText: { fontSize: 15, fontWeight: '800', color: Colors.white },

  loginLink: { alignItems: 'center', marginTop: 24 },
  loginLinkText: { fontSize: 14, color: Colors.textMuted },
});
