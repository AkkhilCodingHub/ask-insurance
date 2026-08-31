import { Redirect } from 'expo-router';
// Registration is now handled through the OTP flow starting at /login
export default function Register() {
  return <Redirect href="/login" />;
import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Keyboard, Image, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/auth';
import { Icon } from '@/components/Icon';
import { BackButton } from '@/components/BackButton';
import { Colors } from '@/constants/theme';
import { authFieldStyles as af } from '@/constants/authFieldStyles';
import { useDialog } from '@/components/Dialog';

export default function RegisterScreen() {
  const router = useRouter();
  const { sendOTP } = useAuth();
  const { alert } = useDialog();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const phoneRef = useRef<TextInput>(null);

  const cleanPhone = phone.replace(/\D/g, '').slice(0, 10);
  const isValidPhone = cleanPhone.length === 10 && /^[6-9]\d{9}$/.test(cleanPhone);

  const handleRegister = async () => {
    if (!isValidPhone) {
      alert({
        type: 'warning',
        title: 'Valid Phone Required',
        message: 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.',
      });
      return;
    }
    Keyboard.dismiss();
    setLoading(true);
    try {
      await sendOTP(cleanPhone);
      router.push({
        pathname: '/otp',
        params: { phone: cleanPhone, newUserName: name.trim(), mode: 'signup' },
      } as any);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Could not send verification OTP. Please try again.';
      alert({ type: 'error', title: 'Registration Failed', message: msg });
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
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Blue hero ─────────────────────────────── */}
          <View style={s.hero}>
            <View style={s.heroBg1} /><View style={s.heroBg2} />

            <BackButton color="rgba(255,255,255,0.9)" style={s.backBtn} />

            <View style={s.logoRow}>
              <View style={s.logoCircle}>
                <Image
                  source={require('../../assets/images/icon.png')}
                  style={{ width: 56, height: 56, borderRadius: 14 }}
                  resizeMode="contain"
                />
              </View>
            </View>

            <Text style={s.heroTitle}>Create Account</Text>
            <Text style={s.heroSub}>Join India's smartest insurance platform</Text>

            {/* USPs row */}
            <View style={s.uspsRow}>
              <View style={s.uspItem}>
                <Icon name="shield-checkmark" size={13} color="#93C5FD" />
                <Text style={s.uspText}>38+ Insurers</Text>
              </View>
              <View style={s.uspItem}>
                <Icon name="flash" size={13} color="#93C5FD" />
                <Text style={s.uspText}>Instant Policy</Text>
              </View>
              <View style={s.uspItem}>
                <Icon name="document-text" size={13} color="#93C5FD" />
                <Text style={s.uspText}>Paperless</Text>
              </View>
            </View>
          </View>

          {/* ── Card ──────────────────────────────────── */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Get Started</Text>
            <Text style={s.cardSub}>Enter your details to create your insurance account</Text>

            {/* Full Name */}
            <Text style={s.fieldLabel}>FULL NAME (OPTIONAL)</Text>
            <View style={[af.inputRow, af.fieldGap]}>
              <View style={af.prefix}>
                <Icon name="person-outline" size={18} color={Colors.primary} />
              </View>
              <TextInput
                style={af.input}
                placeholder="e.g. Rahul Sharma"
                placeholderTextColor={Colors.textLight}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoComplete="name"
                returnKeyType="next"
                onSubmitEditing={() => phoneRef.current?.focus()}
              />
              {name.trim().length >= 2 && (
                <View style={s.checkCircle}>
                  <Icon name="checkmark" size={14} color={Colors.white} />
                </View>
              )}
            </View>

            {/* Mobile Number */}
            <Text style={s.fieldLabel}>MOBILE NUMBER</Text>
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => phoneRef.current?.focus()}
              style={[af.inputRow, af.fieldGap]}
            >
              <View style={af.prefix}>
                <Text style={s.flag}>🇮🇳</Text>
                <Text style={s.prefixText}>+91</Text>
              </View>
              <TextInput
                ref={phoneRef}
                style={[af.input, af.inputPhone]}
                value={phone}
                onChangeText={t => setPhone(t.replace(/\D/g, '').slice(0, 10))}
                placeholder="98765 43210"
                placeholderTextColor={Colors.textLight}
                keyboardType="phone-pad"
                maxLength={10}
                returnKeyType="done"
                onSubmitEditing={handleRegister}
              />
              {isValidPhone && (
                <View style={s.checkCircle}>
                  <Icon name="checkmark" size={14} color={Colors.white} />
                </View>
              )}
            </TouchableOpacity>

            <Text style={s.helperText}>
              We will send a 6-digit OTP via SMS to verify your mobile number.
            </Text>

            {/* CTA */}
            <TouchableOpacity
              style={[s.continueBtn, (!isValidPhone || loading) && s.continueBtnDisabled]}
              onPress={handleRegister}
              activeOpacity={0.85}
              disabled={!isValidPhone || loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Text style={s.continueBtnText}>Verify & Create Account</Text>
                  <Icon name="arrow-forward-outline" size={18} color={Colors.white} />
                </>
              )}
            </TouchableOpacity>

            <Text style={s.consent}>
              By continuing you agree to our{' '}
              <Text style={s.consentLink} onPress={() => router.push('/terms' as any)}>Terms of Service</Text>
              {' '}&{' '}
              <Text style={s.consentLink} onPress={() => router.push('/privacy' as any)}>Privacy Policy</Text>
            </Text>

            {/* Switch to Sign In */}
            <View style={s.switchRow}>
              <Text style={s.switchText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/login' as any)}>
                <Text style={s.switchLink}>Sign In →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
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
  uspsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  uspItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  uspText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E2E8F0',
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
  flag: {
    fontSize: 18,
  },
  prefixText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  helperText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: -12,
    marginBottom: 18,
    lineHeight: 16,
  },
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
  consent: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 18,
  },
  consentLink: {
    color: Colors.primary,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingVertical: 8,
  },
  switchText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  switchLink: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '700',
  },
});
