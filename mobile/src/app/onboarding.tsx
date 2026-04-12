import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/auth';
import { Icon } from '@/components/Icon';
import { Colors } from '@/constants/theme';

function formatDOB(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export default function OnboardingScreen() {
  const router                  = useRouter();
  const { completeProfile }     = useAuth();
  const [name, setName]         = useState('');
  const [dob, setDob]           = useState('');
  const [loading, setLoading]   = useState(false);

  const dobDigits = dob.replace(/\D/g, '');
  const isValid   = name.trim().length >= 2 && dobDigits.length === 8;

  const handleDone = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      await completeProfile(name.trim(), dob);
      router.replace('/(tabs)');
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
          {/* ── Green hero ──────────────────────────── */}
          <View style={s.hero}>
            <View style={s.heroBg1} /><View style={s.heroBg2} />
            <View style={s.heroIcon}>
              <Icon name="sparkles-outline" size={34} color={Colors.white} />
            </View>
            <Text style={s.heroTitle}>Almost there!</Text>
            <Text style={s.heroSub}>Tell us a little about yourself{'\n'}so we can personalise your experience</Text>

            {/* Step indicator */}
            <View style={s.steps}>
              <View style={[s.stepDot, s.stepDone]}><Icon name="checkmark" size={10} color={Colors.white} /></View>
              <View style={s.stepLine} />
              <View style={[s.stepDot, s.stepDone]}><Icon name="checkmark" size={10} color={Colors.white} /></View>
              <View style={s.stepLine} />
              <View style={[s.stepDot, s.stepActive]}><Text style={s.stepNum}>3</Text></View>
            </View>
            <Text style={s.stepLabel}>Step 3 of 3 — Profile</Text>
          </View>

          {/* ── Card ──────────────────────────────────── */}
          <View style={s.card}>

            {/* Name */}
            <Text style={s.fieldLabel}>YOUR FULL NAME</Text>
            <View style={s.inputWrap}>
              <View style={s.inputIcon}>
                <Icon name="person-outline" size={18} color={Colors.primary} />
              </View>
              <TextInput
                style={s.input}
                placeholder="e.g. Priya Sharma"
                placeholderTextColor={Colors.textLight}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoComplete="name"
                returnKeyType="next"
              />
            </View>

            {/* DOB */}
            <Text style={s.fieldLabel}>DATE OF BIRTH</Text>
            <View style={s.inputWrap}>
              <View style={s.inputIcon}>
                <Icon name="calendar-outline" size={18} color={Colors.primary} />
              </View>
              <TextInput
                style={s.input}
                placeholder="DD / MM / YYYY"
                placeholderTextColor={Colors.textLight}
                value={dob}
                onChangeText={t => setDob(formatDOB(t))}
                keyboardType="number-pad"
                maxLength={10}
                returnKeyType="done"
                onSubmitEditing={handleDone}
              />
              {dobDigits.length === 8 && (
                <View style={s.checkCircle}>
                  <Icon name="checkmark" size={13} color={Colors.white} />
                </View>
              )}
            </View>

            {/* Why we ask */}
            <View style={s.infoBox}>
              <Icon name="lock-closed-outline" size={14} color={Colors.primary} />
              <Text style={s.infoText}>
                Your date of birth helps us show you age-appropriate plans and comply with IRDAI guidelines.
              </Text>
            </View>

            {/* CTA */}
            <TouchableOpacity
              style={[s.doneBtn, !isValid && s.doneBtnDisabled]}
              onPress={handleDone}
              disabled={!isValid || loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color={Colors.white} />
                : (
                  <>
                    <Text style={s.doneBtnText}>Let's go!</Text>
                    <Icon name="rocket-outline" size={18} color={Colors.white} />
                  </>
                )
              }
            </TouchableOpacity>

            <Text style={s.note}>
              You can always update these details later in your Profile.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const HERO_COLOR = '#059669'; // success green — a celebratory tone

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: HERO_COLOR },

  // ── Hero ──────────────────────────────────
  hero: {
    backgroundColor: HERO_COLOR,
    paddingHorizontal: 24, paddingBottom: 48, paddingTop: 16,
    alignItems: 'center', overflow: 'hidden',
  },
  heroBg1: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.07)', top: -60, right: -40,
  },
  heroBg2: {
    position: 'absolute', width: 130, height: 130, borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.05)', bottom: 0, left: -10,
  },
  heroIcon: {
    width: 68, height: 68, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle:{ fontSize: 26, fontWeight: '900', color: Colors.white, letterSpacing: -0.5, marginBottom: 8 },
  heroSub:  { fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 21, marginBottom: 28 },

  steps: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  stepDot: {
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  stepDone:   { backgroundColor: 'rgba(255,255,255,0.35)' },
  stepActive: { backgroundColor: Colors.white },
  stepNum:    { fontSize: 12, fontWeight: '800', color: HERO_COLOR },
  stepLine:   { width: 32, height: 2, backgroundColor: 'rgba(255,255,255,0.3)' },
  stepLabel:  { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '600', letterSpacing: 0.3 },

  // ── Card ──────────────────────────────────
  card: {
    flex: 1,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingTop: 30, paddingBottom: 32,
  },

  fieldLabel: {
    fontSize: 10, fontWeight: '800', color: Colors.textMuted,
    letterSpacing: 1.2, marginBottom: 8, marginTop: 4,
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 2, borderColor: Colors.border,
    borderRadius: 14, backgroundColor: Colors.bg,
    marginBottom: 22, overflow: 'hidden',
  },
  inputIcon: {
    width: 48, height: 52, alignItems: 'center', justifyContent: 'center',
    borderRightWidth: 1, borderRightColor: Colors.border,
    backgroundColor: Colors.primaryLight,
  },
  input: {
    flex: 1, fontSize: 16, fontWeight: '600', color: Colors.text,
    paddingHorizontal: 14, paddingVertical: 14,
  },
  checkCircle: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.success,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },

  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: Colors.primaryLight, borderRadius: 12,
    padding: 12, marginBottom: 28,
  },
  infoText: { flex: 1, fontSize: 12, color: Colors.primary, lineHeight: 18, fontWeight: '500' },

  doneBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: HERO_COLOR, borderRadius: 16, paddingVertical: 16,
    marginBottom: 16,
  },
  doneBtnDisabled: { backgroundColor: Colors.textLight },
  doneBtnText: { fontSize: 16, fontWeight: '800', color: Colors.white },

  note: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', lineHeight: 18 },
});
