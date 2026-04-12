import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Dimensions, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';

const { width: W } = Dimensions.get('window');

const TOTAL_STEPS = 4;

const INSURANCE_TYPES = [
  { id: 'life',   label: 'Life',   icon: '❤️', desc: 'Term & ULIP plans' },
  { id: 'health', label: 'Health', icon: '🏥', desc: 'Individual & family' },
  { id: 'motor',  label: 'Motor',  icon: '🚗', desc: 'Car & two-wheeler' },
  { id: 'travel', label: 'Travel', icon: '✈️', desc: 'Domestic & international' },
];

const GENDERS = ['Male', 'Female', 'Other'];
const COVER_OPTIONS = ['₹25 Lakh', '₹50 Lakh', '₹1 Crore', '₹2 Crore', '₹5 Crore'];

function ProgressBar({ step }: { step: number }) {
  return (
    <View style={p.wrap}>
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <React.Fragment key={i}>
          <View style={[p.dot, step > i && p.dotDone, step === i && p.dotActive]}>
            {step > i && <Text style={p.dotCheck}>✓</Text>}
            {step <= i && <Text style={[p.dotNum, step === i && { color: Colors.primary }]}>{i + 1}</Text>}
          </View>
          {i < TOTAL_STEPS - 1 && (
            <View style={[p.line, step > i && p.lineDone]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

export default function QuoteScreen() {
  const router  = useRouter();
  const [step, setStep] = useState(0);

  // Form state
  const [insuranceType, setInsuranceType] = useState('');
  const [age, setAge]           = useState('');
  const [gender, setGender]     = useState('');
  const [smoker, setSmoker]     = useState<boolean | null>(null);
  const [cover, setCover]       = useState('');
  const [name, setName]         = useState('');
  const [phone, setPhone]       = useState('');
  const [email, setEmail]       = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]         = useState(false);

  const next = () => setStep(s => Math.min(s + 1, TOTAL_STEPS - 1));
  const back = () => {
    if (step === 0) router.back();
    else setStep(s => s - 1);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Missing fields', 'Please enter your name and phone number.');
      return;
    }
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1500));
    setSubmitting(false);
    setDone(true);
  };

  if (done) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.successScreen}>
          <View style={s.successIcon}>
            <Text style={{ fontSize: 52 }}>🎉</Text>
          </View>
          <Text style={s.successTitle}>Quote Requested!</Text>
          <Text style={s.successSub}>
            Our advisor will call you within 30 minutes with personalised plan options.
          </Text>
          <View style={s.summaryCard}>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Type</Text>
              <Text style={s.summaryValue}>{INSURANCE_TYPES.find(t => t.id === insuranceType)?.label ?? insuranceType}</Text>
            </View>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Age</Text>
              <Text style={s.summaryValue}>{age} years</Text>
            </View>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Cover</Text>
              <Text style={[s.summaryValue, { color: Colors.primary }]}>{cover}</Text>
            </View>
            <View style={[s.summaryRow, { borderBottomWidth: 0 }]}>
              <Text style={s.summaryLabel}>Phone</Text>
              <Text style={s.summaryValue}>+91 {phone}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={s.doneBtn}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={s.doneBtnText}>Back to Home →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={back}>
          <Text style={s.backText}>← {step === 0 ? 'Close' : 'Back'}</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Get a Quote</Text>
        <Text style={s.stepCount}>{step + 1}/{TOTAL_STEPS}</Text>
      </View>

      <ProgressBar step={step} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Step 0: Insurance type ───────────────── */}
        {step === 0 && (
          <View style={s.stepWrap}>
            <Text style={s.stepTitle}>What type of insurance{'\n'}are you looking for?</Text>
            <View style={s.typeGrid}>
              {INSURANCE_TYPES.map(t => (
                <TouchableOpacity
                  key={t.id}
                  style={[s.typeCard, insuranceType === t.id && s.typeCardActive]}
                  onPress={() => setInsuranceType(t.id)}
                  activeOpacity={0.8}
                >
                  <Text style={s.typeIcon}>{t.icon}</Text>
                  <Text style={[s.typeLabel, insuranceType === t.id && { color: Colors.primary }]}>
                    {t.label}
                  </Text>
                  <Text style={s.typeDesc}>{t.desc}</Text>
                  {insuranceType === t.id && (
                    <View style={s.typeCheck}>
                      <Text style={s.typeCheckText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[s.nextBtn, !insuranceType && { opacity: 0.4 }]}
              onPress={next}
              disabled={!insuranceType}
            >
              <Text style={s.nextBtnText}>Next →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Step 1: Personal details ─────────────── */}
        {step === 1 && (
          <View style={s.stepWrap}>
            <Text style={s.stepTitle}>Tell us about yourself</Text>

            <Text style={s.label}>AGE</Text>
            <TextInput
              style={s.input}
              placeholder="e.g. 28"
              placeholderTextColor={Colors.textLight}
              value={age}
              onChangeText={t => setAge(t.replace(/\D/g, '').slice(0, 2))}
              keyboardType="numeric"
            />

            <Text style={s.label}>GENDER</Text>
            <View style={s.optionRow}>
              {GENDERS.map(g => (
                <TouchableOpacity
                  key={g}
                  style={[s.optionPill, gender === g && s.optionPillActive]}
                  onPress={() => setGender(g)}
                >
                  <Text style={[s.optionText, gender === g && { color: Colors.primary }]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {insuranceType === 'life' && (
              <>
                <Text style={s.label}>DO YOU SMOKE?</Text>
                <View style={s.optionRow}>
                  {(['No', 'Yes'] as const).map(val => (
                    <TouchableOpacity
                      key={val}
                      style={[s.optionPill, smoker === (val === 'Yes') && s.optionPillActive]}
                      onPress={() => setSmoker(val === 'Yes')}
                    >
                      <Text style={[s.optionText, smoker === (val === 'Yes') && { color: Colors.primary }]}>{val}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <TouchableOpacity
              style={[s.nextBtn, (!age || !gender) && { opacity: 0.4 }]}
              onPress={next}
              disabled={!age || !gender}
            >
              <Text style={s.nextBtnText}>Next →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Step 2: Coverage ─────────────────────── */}
        {step === 2 && (
          <View style={s.stepWrap}>
            <Text style={s.stepTitle}>How much cover{'\n'}do you need?</Text>

            <View style={s.coverGrid}>
              {COVER_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt}
                  style={[s.coverCard, cover === opt && s.coverCardActive]}
                  onPress={() => setCover(opt)}
                >
                  <Text style={[s.coverText, cover === opt && { color: Colors.primary, fontWeight: '800' }]}>
                    {opt}
                  </Text>
                  {cover === opt && <Text style={{ color: Colors.primary, fontSize: 14 }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[s.nextBtn, !cover && { opacity: 0.4 }]}
              onPress={next}
              disabled={!cover}
            >
              <Text style={s.nextBtnText}>Next →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Step 3: Contact ──────────────────────── */}
        {step === 3 && (
          <View style={s.stepWrap}>
            <Text style={s.stepTitle}>Almost done!{'\n'}How can we reach you?</Text>

            <Text style={s.label}>YOUR NAME</Text>
            <TextInput
              style={s.input}
              placeholder="Full name"
              placeholderTextColor={Colors.textLight}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
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

            <Text style={s.label}>EMAIL (OPTIONAL)</Text>
            <TextInput
              style={s.input}
              placeholder="you@example.com"
              placeholderTextColor={Colors.textLight}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={s.consent}>
              By submitting, you agree to be contacted by an ASK Insurance advisor.
              Your data is protected as per our Privacy Policy.
            </Text>

            <TouchableOpacity
              style={[s.nextBtn, (!name || phone.length < 10) && { opacity: 0.4 }, submitting && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={!name || phone.length < 10 || submitting}
            >
              {submitting
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={s.nextBtnText}>Get My Quote →</Text>
              }
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const p = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  dot: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 2, borderColor: Colors.border, backgroundColor: Colors.bg,
    alignItems: 'center', justifyContent: 'center',
  },
  dotActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  dotDone:   { borderColor: Colors.primary, backgroundColor: Colors.primary },
  dotCheck:  { fontSize: 12, color: Colors.white, fontWeight: '800' },
  dotNum:    { fontSize: 11, fontWeight: '700', color: Colors.textMuted },
  line: { flex: 1, height: 2, backgroundColor: Colors.border, marginHorizontal: 4 },
  lineDone: { backgroundColor: Colors.primary },
});

const s = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backText:    { fontSize: 15, color: Colors.primary, fontWeight: '600' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: Colors.text },
  stepCount:   { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },

  scroll:        { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 48 },
  stepWrap:      { gap: 8 },

  stepTitle: {
    fontSize: 24, fontWeight: '900', color: Colors.text,
    letterSpacing: -0.5, lineHeight: 30, marginBottom: 20,
  },

  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  typeCard: {
    width: (W - 72) / 2, borderRadius: 14,
    borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.bg, padding: 16,
    alignItems: 'flex-start', gap: 4, position: 'relative',
  },
  typeCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  typeIcon:  { fontSize: 28, marginBottom: 4 },
  typeLabel: { fontSize: 15, fontWeight: '700', color: Colors.text },
  typeDesc:  { fontSize: 11, color: Colors.textMuted },
  typeCheck: {
    position: 'absolute', top: 10, right: 10,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  typeCheckText: { fontSize: 11, color: Colors.white, fontWeight: '800' },

  label: {
    fontSize: 10, fontWeight: '700', color: Colors.textMuted,
    letterSpacing: 0.8, marginBottom: 8, marginTop: 14,
  },
  input: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, color: Colors.text, backgroundColor: Colors.bg,
    marginBottom: 4,
  },
  optionRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  optionPill: {
    paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  optionPillActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  optionText:       { fontSize: 14, fontWeight: '600', color: Colors.textMuted },

  coverGrid: { gap: 10, marginBottom: 24 },
  coverCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12,
    backgroundColor: Colors.bg,
  },
  coverCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  coverText: { fontSize: 16, fontWeight: '600', color: Colors.text },

  phoneRow: { flexDirection: 'row', gap: 8 },
  prefix:   {
    paddingHorizontal: 14, paddingVertical: 13,
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: 12, backgroundColor: Colors.bg, justifyContent: 'center',
  },
  prefixText: { fontSize: 15, color: Colors.textMuted, fontWeight: '600' },

  consent: {
    fontSize: 12, color: Colors.textMuted, lineHeight: 18, marginTop: 12,
  },

  nextBtn: {
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 15, alignItems: 'center', marginTop: 16,
  },
  nextBtnText: { fontSize: 15, fontWeight: '800', color: Colors.white },

  // Success screen
  successScreen: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: 28, gap: 16,
  },
  successIcon: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: Colors.successLight, borderWidth: 3, borderColor: '#6EE7B7',
    alignItems: 'center', justifyContent: 'center',
  },
  successTitle: {
    fontSize: 26, fontWeight: '900', color: Colors.text, letterSpacing: -0.4,
  },
  successSub: {
    fontSize: 15, color: Colors.textMuted, textAlign: 'center', lineHeight: 23,
  },
  summaryCard: {
    width: '100%', borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: 14, backgroundColor: Colors.bg, overflow: 'hidden', marginTop: 8,
  },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  summaryLabel: { fontSize: 13, color: Colors.textMuted },
  summaryValue: { fontSize: 14, fontWeight: '700', color: Colors.text },
  doneBtn: {
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingHorizontal: 32, paddingVertical: 14, marginTop: 8, width: '100%',
    alignItems: 'center',
  },
  doneBtnText: { fontSize: 15, fontWeight: '800', color: Colors.white },
});
