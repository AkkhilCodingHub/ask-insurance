import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Dimensions, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { quotesApi, ApiError } from '@/lib/api';
import { useAuth } from '@/context/auth';
import { Colors } from '@/constants/theme';
import { authFieldStyles as af } from '@/constants/authFieldStyles';
import { useDialog } from '@/components/Dialog';
import { Icon } from '@/components/Icon';
import { BackButton } from '@/components/BackButton';

const { width: W } = Dimensions.get('window');

// If arriving from a plan, type is pre-filled so we skip step 0
// Steps when type known:  0=personal, 1=coverage, 2=review
// Steps when type unknown: 0=type, 1=personal, 2=coverage, 3=review
const TOTAL_STEPS_WITH_TYPE    = 3;
const TOTAL_STEPS_WITHOUT_TYPE = 4;

const INSURANCE_TYPES = [
  { id: 'life',   label: 'Life',   icon: '❤️', desc: 'Term & ULIP plans' },
  { id: 'health', label: 'Health', icon: '🏥', desc: 'Individual & family' },
  { id: 'motor',  label: 'Motor',  icon: '🚗', desc: 'Car & two-wheeler' },
  { id: 'travel', label: 'Travel', icon: '✈️', desc: 'Domestic & international' },
];

const GENDERS = ['Male', 'Female', 'Other'];

// Fallback presets when no plan min/max is available
const DEFAULT_COVER_OPTIONS = [
  { label: '₹25 Lakh', value: 2500000 },
  { label: '₹50 Lakh', value: 5000000 },
  { label: '₹1 Crore', value: 10000000 },
  { label: '₹2 Crore', value: 20000000 },
  { label: '₹5 Crore', value: 50000000 },
];

function roundToNice(val: number): number {
  if (val >= 1e8)  return Math.round(val / 1e7)  * 1e7;   // nearest 1 Cr
  if (val >= 1e7)  return Math.round(val / 5e6)  * 5e6;   // nearest 50 L
  if (val >= 5e6)  return Math.round(val / 1e6)  * 1e6;   // nearest 10 L
  if (val >= 1e6)  return Math.round(val / 5e5)  * 5e5;   // nearest 5 L
  if (val >= 1e5)  return Math.round(val / 1e5)  * 1e5;   // nearest 1 L
  return           Math.round(val / 1e4)  * 1e4;           // nearest 10 K
}

function fmtCover(val: number): string {
  if (val >= 1e7)  return `₹${+(val / 1e7).toFixed(2)} Cr`;
  if (val >= 1e5)  return `₹${+(val / 1e5).toFixed(1)} L`;
  if (val >= 1000) return `₹${+(val / 1000).toFixed(0)}K`;
  return `₹${val}`;
}

function buildPresets(min: number, max: number): Array<{ label: string; value: number }> {
  if (!min || !max || min >= max) return DEFAULT_COVER_OPTIONS;
  const logMin = Math.log10(min);
  const logMax = Math.log10(max);
  const COUNT  = 4;
  const seen   = new Set<number>();
  const result: Array<{ label: string; value: number }> = [];
  for (let i = 0; i < COUNT; i++) {
    const logVal = logMin + (logMax - logMin) * (i / (COUNT - 1));
    const nice   = roundToNice(Math.pow(10, logVal));
    if (!seen.has(nice)) { seen.add(nice); result.push({ label: fmtCover(nice), value: nice }); }
  }
  return result;
}

function coverStepTitle(type: string): string {
  if (type === 'motor') return 'What is your vehicle\'s\nInsured Declared Value (IDV)?';
  if (['fire', 'marine', 'engineering'].includes(type)) return 'What is the asset /\nproperty value?';
  if (type === 'liability') return 'What liability limit\ndo you need?';
  return 'How much cover\ndo you need?';
}

function ProgressBar({ step, totalSteps }: { step: number; totalSteps: number }) {
  return (
    <View style={p.wrap}>
      {Array.from({ length: totalSteps }, (_, i) => (
        <React.Fragment key={i}>
          <View style={[p.dot, step > i && p.dotDone, step === i && p.dotActive]}>
            {step > i && <Text style={p.dotCheck}>✓</Text>}
            {step <= i && <Text style={[p.dotNum, step === i && { color: Colors.primary }]}>{i + 1}</Text>}
          </View>
          {i < totalSteps - 1 && <View style={[p.line, step > i && p.lineDone]} />}
        </React.Fragment>
      ))}
    </View>
  );
}

// Quote results card

export default function QuoteScreen() {
  const router   = useRouter();
  const { user } = useAuth();
  const { alert } = useDialog();
  const params   = useLocalSearchParams<{ planId?: string; type?: string; planName?: string; minCover?: string; maxCover?: string }>();

  const typeFromPlan = params.type ?? '';
  const planMinCover = params.minCover ? Number(params.minCover) : 0;
  const planMaxCover = params.maxCover ? Number(params.maxCover) : 0;
  const coverPresets = buildPresets(planMinCover, planMaxCover);
  const TOTAL_STEPS  = typeFromPlan ? TOTAL_STEPS_WITH_TYPE : TOTAL_STEPS_WITHOUT_TYPE;

  const [step, setStep] = useState(0);

  // Form state
  const [insuranceType, setInsuranceType] = useState(typeFromPlan);
  const [age, setAge]       = useState('');
  const [gender, setGender] = useState('');
  const [smoker, setSmoker] = useState<boolean | null>(null);
  const [cover, setCover]         = useState<{ label: string; value: number } | null>(null);
  const [customCover, setCustomCover] = useState('');
  const [isCustom, setIsCustom]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const coverLabel = cover?.label ?? '';
  const next = () => setStep(s => Math.min(s + 1, TOTAL_STEPS - 1));
  const back = () => { if (step === 0) router.back(); else setStep(s => s - 1); };
  const contentStep = typeFromPlan ? step + 1 : step;

  const handleSubmit = async () => {
    if (!insuranceType || !cover) return;
    setSubmitting(true);
    try {
      if (!user) {
        alert({ type: 'info', title: 'Sign in required', message: 'Please sign in to submit a quote request.' });
        setSubmitting(false);
        return;
      }
      const details: Record<string, unknown> = {
        age:        Number(age),
        gender:     gender.toLowerCase(),
        sumInsured: cover.value,
        planId:     params.planId ?? null,
        planName:   params.planName ?? null,
        ...(insuranceType === 'life' ? { smoker } : {}),
      };

      await quotesApi.create(insuranceType, details);
      setSubmitted(true);
    } catch (e: unknown) {
      const msg = e instanceof ApiError ? e.message : 'Could not submit request. Please try again.';
      alert({ type: 'error', title: 'Error', message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Submitted screen ──────────────────────────────────────────────────────
  if (submitted) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.successScreen}>
          <View style={s.successIcon}>
            <Icon name="checkmark-circle" size={56} color={Colors.success} />
          </View>
          <Text style={s.successTitle}>Request Submitted!</Text>
          <Text style={s.successSub}>
            Our advisor will review your requirements and get back to you with the best quote within 24 hours.
          </Text>
          <View style={s.summaryCard}>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Type</Text>
              <Text style={s.summaryValue}>{INSURANCE_TYPES.find(t => t.id === insuranceType)?.label ?? insuranceType}</Text>
            </View>
            {params.planName ? (
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Plan</Text>
                <Text style={s.summaryValue}>{params.planName}</Text>
              </View>
            ) : null}
            <View style={[s.summaryRow, { borderBottomWidth: 0 }]}>
              <Text style={s.summaryLabel}>Cover</Text>
              <Text style={[s.summaryValue, { color: Colors.primary }]}>{coverLabel}</Text>
            </View>
          </View>
          <View style={s.infoBox}>
            <Icon name="information-circle-outline" size={16} color={Colors.primary} />
            <Text style={s.infoText}>
              You'll receive a notification once your quote is ready. You can also check "My Quotes" in your profile.
            </Text>
          </View>
          <TouchableOpacity style={s.doneBtn} onPress={() => router.replace('/(tabs)')}>
            <Text style={s.doneBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Form steps ─────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <BackButton onPress={back} />
        <Text style={s.headerTitle}>Get a Quote</Text>
        <Text style={s.stepCount}>{step + 1} / {TOTAL_STEPS}</Text>
      </View>

      <ProgressBar step={step} totalSteps={TOTAL_STEPS} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step 0: Insurance type — only shown when arriving without a pre-selected plan */}
        {contentStep === 0 && (
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
                  <Text style={[s.typeLabel, insuranceType === t.id && { color: Colors.primary }]}>{t.label}</Text>
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

        {/* Step 1: Personal details */}
        {contentStep === 1 && (
          <View style={s.stepWrap}>
            <Text style={s.stepTitle}>Tell us about yourself</Text>

            <Text style={s.label}>AGE</Text>
            <View style={[af.inputRow, af.fieldGap]}>
              <TextInput
                style={af.input}
                placeholder="e.g. 28"
                placeholderTextColor={Colors.textLight}
                value={age}
                onChangeText={t => setAge(t.replace(/\D/g, '').slice(0, 2))}
                keyboardType="numeric"
              />
            </View>

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

        {/* Step 2: Coverage */}
        {contentStep === 2 && (
          <View style={s.stepWrap}>
            <Text style={s.stepTitle}>{coverStepTitle(insuranceType)}</Text>
            {planMinCover > 0 && planMaxCover > 0 && (
              <Text style={s.coverRange}>
                Range: {fmtCover(planMinCover)} – {fmtCover(planMaxCover)}
              </Text>
            )}
            <View style={s.coverGrid}>
              {coverPresets.map(opt => (
                <TouchableOpacity
                  key={opt.label}
                  style={[s.coverCard, !isCustom && cover?.value === opt.value && s.coverCardActive]}
                  onPress={() => { setIsCustom(false); setCover(opt); setCustomCover(''); }}
                >
                  <Text style={[s.coverText, !isCustom && cover?.value === opt.value && { color: Colors.primary, fontWeight: '800' }]}>
                    {opt.label}
                  </Text>
                  {!isCustom && cover?.value === opt.value && <Text style={{ color: Colors.primary, fontSize: 14 }}>✓</Text>}
                </TouchableOpacity>
              ))}
              {/* Other / Custom option */}
              <TouchableOpacity
                style={[s.coverCard, isCustom && s.coverCardActive]}
                onPress={() => { setIsCustom(true); setCover(null); }}
              >
                <Text style={[s.coverText, isCustom && { color: Colors.primary, fontWeight: '800' }]}>
                  Other (Custom)
                </Text>
                {isCustom && <Text style={{ color: Colors.primary, fontSize: 14 }}>✓</Text>}
              </TouchableOpacity>
            </View>
            {isCustom && (
              <View>
                <Text style={s.label}>
                  ENTER AMOUNT{planMinCover > 0 && planMaxCover > 0 ? ` (${fmtCover(planMinCover)} – ${fmtCover(planMaxCover)})` : ''}
                </Text>
                <View style={af.inputRow}>
                  <TextInput
                    style={af.input}
                    placeholder={planMinCover > 0 ? `e.g. ${fmtCover(Math.round((planMinCover + planMaxCover) / 2))}` : 'e.g. ₹10,00,000'}
                    placeholderTextColor={Colors.textLight}
                    value={customCover}
                    onChangeText={t => {
                      const num = t.replace(/[^0-9]/g, '');
                      setCustomCover(num);
                      const val = Number(num);
                      if (val > 0) {
                        const clamped = planMinCover && planMaxCover
                          ? Math.min(Math.max(val, planMinCover), planMaxCover)
                          : val;
                        setCover({ label: fmtCover(clamped), value: clamped });
                      } else {
                        setCover(null);
                      }
                    }}
                    keyboardType="numeric"
                  />
                </View>
                {planMinCover > 0 && planMaxCover > 0 && customCover && Number(customCover) < planMinCover && (
                  <Text style={s.coverError}>Minimum cover is {fmtCover(planMinCover)}</Text>
                )}
                {planMinCover > 0 && planMaxCover > 0 && customCover && Number(customCover) > planMaxCover && (
                  <Text style={s.coverError}>Maximum cover is {fmtCover(planMaxCover)}</Text>
                )}
              </View>
            )}
            <TouchableOpacity
              style={[s.nextBtn, !cover && { opacity: 0.4 }]}
              onPress={next}
              disabled={!cover}
            >
              <Text style={s.nextBtnText}>Next →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 3: Review & Submit */}
        {contentStep === 3 && (
          <View style={s.stepWrap}>
            <Text style={s.stepTitle}>Review & get quotes</Text>

            <View style={s.summaryCard}>
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Type</Text>
                <Text style={s.summaryValue}>{INSURANCE_TYPES.find(t => t.id === insuranceType)?.label ?? insuranceType}</Text>
              </View>
              {params.planName && (
                <View style={s.summaryRow}>
                  <Text style={s.summaryLabel}>Plan</Text>
                  <Text style={s.summaryValue}>{params.planName}</Text>
                </View>
              )}
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Age</Text>
                <Text style={s.summaryValue}>{age} years</Text>
              </View>
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Gender</Text>
                <Text style={s.summaryValue}>{gender}</Text>
              </View>
              <View style={[s.summaryRow, { borderBottomWidth: 0 }]}>
                <Text style={s.summaryLabel}>Cover</Text>
                <Text style={[s.summaryValue, { color: Colors.primary }]}>{coverLabel}</Text>
              </View>
            </View>

            {!user && (
              <View style={s.authNotice}>
                <Text style={s.authNoticeText}>
                  Sign in to get personalised quotes saved to your account.
                </Text>
                <TouchableOpacity onPress={() => router.push('/login')}>
                  <Text style={[s.authNoticeText, { color: Colors.primary, fontWeight: '700', marginTop: 4 }]}>
                    Sign In →
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={[s.nextBtn, submitting && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={s.nextBtnText}>Submit Quote Request →</Text>
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
  line:      { flex: 1, height: 2, backgroundColor: Colors.border, marginHorizontal: 4 },
  lineDone:  { backgroundColor: Colors.primary },
});


const s = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: Colors.text },
  stepCount:   { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },

  scroll:        { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 48 },
  stepWrap:      { gap: 8 },
  stepTitle: { fontSize: 24, fontWeight: '900', color: Colors.text, letterSpacing: -0.5, lineHeight: 30, marginBottom: 20 },

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
  typeCheck: { position: 'absolute', top: 10, right: 10, width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  typeCheckText: { fontSize: 11, color: Colors.white, fontWeight: '800' },

  label: { fontSize: 10, fontWeight: '700', color: Colors.textMuted, letterSpacing: 0.8, marginBottom: 8, marginTop: 14 },
  optionRow:        { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  optionPill:       { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.bg },
  optionPillActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  optionText:       { fontSize: 14, fontWeight: '600', color: Colors.textMuted },

  coverGrid: { gap: 10, marginBottom: 16 },
  coverCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, backgroundColor: Colors.bg },
  coverCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  coverText: { fontSize: 16, fontWeight: '600', color: Colors.text },
  coverRange: { fontSize: 12, color: Colors.textMuted, marginBottom: 14, marginTop: -12 },
  coverError: { fontSize: 12, color: '#EF4444', marginTop: 4 },

  authNotice: {
    backgroundColor: Colors.primaryLight, borderRadius: 12, padding: 14, marginBottom: 8,
  },
  authNoticeText: { fontSize: 13, color: Colors.textMuted, lineHeight: 18 },

  nextBtn:     { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 16 },
  nextBtnText: { fontSize: 15, fontWeight: '800', color: Colors.white },

  successScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 16 },
  successIcon:   { width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.successLight, borderWidth: 3, borderColor: '#6EE7B7', alignItems: 'center', justifyContent: 'center' },
  successTitle:  { fontSize: 26, fontWeight: '900', color: Colors.text, letterSpacing: -0.4 },
  successSub:    { fontSize: 15, color: Colors.textMuted, textAlign: 'center', lineHeight: 23 },
  summaryCard:   { width: '100%', borderWidth: 1.5, borderColor: Colors.border, borderRadius: 14, backgroundColor: Colors.bg, overflow: 'hidden', marginTop: 8 },
  summaryRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  summaryLabel:  { fontSize: 13, color: Colors.textMuted },
  summaryValue:  { fontSize: 14, fontWeight: '700', color: Colors.text },
  infoBox:       { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: Colors.primaryLight, borderRadius: 12, padding: 12, width: '100%' },
  infoText:      { flex: 1, fontSize: 12, color: Colors.textMuted, lineHeight: 18 },
  doneBtn:       { backgroundColor: Colors.primary, borderRadius: 14, paddingHorizontal: 32, paddingVertical: 14, marginTop: 8, width: '100%', alignItems: 'center' },
  doneBtnText:   { fontSize: 15, fontWeight: '800', color: Colors.white },
});
