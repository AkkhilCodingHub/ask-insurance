import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Keyboard, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/auth';
import { Icon } from '@/components/Icon';
import { BackButton } from '@/components/BackButton';
import { Colors } from '@/constants/theme';
import { authFieldStyles as af } from '@/constants/authFieldStyles';
import { useDialog } from '@/components/Dialog';

const GENDERS = [
  { id: 'male', label: 'Male', icon: 'man-outline' as const },
  { id: 'female', label: 'Female', icon: 'woman-outline' as const },
  { id: 'other', label: 'Other', icon: 'person-outline' as const },
];

export default function RegisterScreen() {
  const router            = useRouter();
  const { registerSendOTP } = useAuth();
  const { alert, confirm } = useDialog();

  const [name, setName]         = useState('');
  const [phone, setPhone]       = useState('');
  const [email, setEmail]       = useState('');
  const [dob, setDob]           = useState('');
  const [gender, setGender]     = useState<string>('male');
  const [loading, setLoading]   = useState(false);

  const phoneRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const dobRef   = useRef<TextInput>(null);

  const cleanPhone = phone.replace(/\D/g, '').slice(-10);
  const isPhoneValid = cleanPhone.length === 10 && /^[6-9]\d{9}$/.test(cleanPhone);
  const isNameValid  = name.trim().length >= 2;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isFormValid  = isNameValid && isPhoneValid && isEmailValid;

  // Format DOB input automatically as DD/MM/YYYY
  const handleDobChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 8);
    let formatted = cleaned;
    if (cleaned.length > 2 && cleaned.length <= 4) {
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    } else if (cleaned.length > 4) {
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
    }
    setDob(formatted);
  };

  const handleRegister = async () => {
    if (!isFormValid) return;
    Keyboard.dismiss();
    setLoading(true);

    try {
      await registerSendOTP({
        name: name.trim(),
        phone: cleanPhone,
        email: email.trim().toLowerCase(),
        dateOfBirth: dob.trim() || undefined,
        gender,
      });

      router.push({
        pathname: '/otp',
        params: {
          phone: cleanPhone,
          mode: 'register',
          name: name.trim(),
          email: email.trim().toLowerCase(),
          dob: dob.trim() || '',
          gender: gender || '',
        },
      } as any);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Registration failed. Please try again.';
      const isConflict = msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists');

      if (isConflict) {
        const goToLogin = await confirm({
          title: 'Already Registered',
          message: 'An account with this phone number or email already exists. Would you like to sign in directly?',
          confirmText: 'Sign In',
          cancelText: 'Edit Details',
        });
        if (goToLogin) {
          router.replace('/login' as any);
        }
      } else {
        alert({ type: 'error', title: 'Registration Failed', message: msg });
      }
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
          {/* ── Blue Hero Header ────────────────────────── */}
          <View style={s.hero}>
            <View style={s.heroBg1} /><View style={s.heroBg2} />

            <BackButton color="rgba(255,255,255,0.9)" style={s.backBtn} />

            <View style={s.heroIcon}>
              <Icon name="person-add" size={30} color={Colors.white} />
            </View>

            <Text style={s.heroTitle}>Create Account</Text>
            <Text style={s.heroSub}>Join ASK Insurance for instant coverage & exclusive plans</Text>
          </View>

          {/* ── Registration Form Card ──────────────────── */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Personal Details</Text>
            <Text style={s.cardSub}>Enter your details below. We'll verify your phone with OTP.</Text>

            {/* 1. Full Name */}
            <Text style={s.fieldLabel}>Full Name *</Text>
            <View style={[af.inputRow, s.fieldGap]}>
              <View style={af.prefix}>
                <Icon name="person-outline" size={18} color={Colors.primary} />
              </View>
              <TextInput
                style={af.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Rahul Sharma"
                placeholderTextColor={Colors.textLight}
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={() => phoneRef.current?.focus()}
              />
              {isNameValid && (
                <View style={s.checkCircle}>
                  <Icon name="checkmark" size={14} color={Colors.white} />
                </View>
              )}
            </View>

            {/* 2. Phone Number */}
            <Text style={s.fieldLabel}>Mobile Number *</Text>
            <View style={[af.inputRow, s.fieldGap]}>
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
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
              />
              {isPhoneValid && (
                <View style={s.checkCircle}>
                  <Icon name="checkmark" size={14} color={Colors.white} />
                </View>
              )}
            </View>

            {/* 3. Email Address */}
            <Text style={s.fieldLabel}>Email Address *</Text>
            <View style={[af.inputRow, s.fieldGap]}>
              <View style={af.prefix}>
                <Icon name="mail-outline" size={18} color={Colors.primary} />
              </View>
              <TextInput
                ref={emailRef}
                style={af.input}
                value={email}
                onChangeText={setEmail}
                placeholder="name@example.com"
                placeholderTextColor={Colors.textLight}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => dobRef.current?.focus()}
              />
              {isEmailValid && (
                <View style={s.checkCircle}>
                  <Icon name="checkmark" size={14} color={Colors.white} />
                </View>
              )}
            </View>

            {/* 4. Date of Birth (DD/MM/YYYY) */}
            <Text style={s.fieldLabel}>Date of Birth (DD/MM/YYYY)</Text>
            <View style={[af.inputRow, s.fieldGap]}>
              <View style={af.prefix}>
                <Icon name="calendar-outline" size={18} color={Colors.primary} />
              </View>
              <TextInput
                ref={dobRef}
                style={af.input}
                value={dob}
                onChangeText={handleDobChange}
                placeholder="DD/MM/YYYY (Optional)"
                placeholderTextColor={Colors.textLight}
                keyboardType="number-pad"
                maxLength={10}
                returnKeyType="done"
              />
            </View>

            {/* 5. Gender */}
            <Text style={s.fieldLabel}>Gender</Text>
            <View style={s.genderRow}>
              {GENDERS.map(g => {
                const active = gender === g.id;
                return (
                  <TouchableOpacity
                    key={g.id}
                    style={[s.genderBtn, active && s.genderBtnActive]}
                    onPress={() => setGender(g.id)}
                    activeOpacity={0.8}
                  >
                    <Icon
                      name={g.icon}
                      size={16}
                      color={active ? Colors.primary : Colors.textMuted}
                    />
                    <Text style={[s.genderText, active && s.genderTextActive]}>
                      {g.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[s.submitBtn, !isFormValid && s.submitBtnDisabled]}
              onPress={handleRegister}
              activeOpacity={0.85}
              disabled={!isFormValid || loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Text style={s.submitBtnText}>Send OTP & Register</Text>
                  <Icon name="arrow-forward-outline" size={18} color={Colors.white} />
                </>
              )}
            </TouchableOpacity>

            {/* Already registered link */}
            <View style={s.loginLinkRow}>
              <Text style={s.loginLinkPrompt}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.replace('/login' as any)}>
                <Text style={s.loginLinkText}>Sign In directly →</Text>
              </TouchableOpacity>
            </View>

            <Text style={s.consent}>
              By signing up, you agree to our{' '}
              <Text style={s.consentLink}>Terms of Service</Text>
              {' '}&{' '}
              <Text style={s.consentLink}>Privacy Policy</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.primary },

  hero: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingBottom: 28,
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
    marginBottom: 16,
  },
  heroIcon: {
    width: 58, height: 58, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: 12,
  },
  heroTitle: {
    fontSize: 24, fontWeight: '900', color: Colors.white,
    textAlign: 'center', letterSpacing: -0.5, marginBottom: 4,
  },
  heroSub: {
    fontSize: 13, color: 'rgba(255,255,255,0.7)',
    textAlign: 'center', paddingHorizontal: 16,
  },

  card: {
    flex: 1,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingTop: 26, paddingBottom: 32,
  },
  cardTitle: { fontSize: 20, fontWeight: '900', color: Colors.text, letterSpacing: -0.4, marginBottom: 4 },
  cardSub:   { fontSize: 13, color: Colors.textMuted, marginBottom: 20, lineHeight: 18 },

  fieldLabel: {
    fontSize: 12, fontWeight: '700', color: Colors.text,
    marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4,
  },
  fieldGap: { marginBottom: 16 },

  flag: { fontSize: 18 },
  prefixText: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  checkCircle: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.success,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 14,
  },

  genderRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  genderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  genderBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: '#EFF6FF',
  },
  genderText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  genderTextActive: {
    color: Colors.primary,
    fontWeight: '800',
  },

  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 16, paddingVertical: 16,
    marginBottom: 16,
  },
  submitBtnDisabled: { backgroundColor: Colors.textLight },
  submitBtnText: { fontSize: 16, fontWeight: '800', color: Colors.white },

  loginLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  loginLinkPrompt: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  loginLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },

  consent:     { fontSize: 12, color: Colors.textMuted, textAlign: 'center', lineHeight: 18 },
  consentLink: { color: Colors.primary, fontWeight: '600' },
});
