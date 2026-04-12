import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Modal, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MY_CLAIMS, MyClaim } from '@/data/mock';
import { Icon } from '@/components/Icon';
import { Colors, BottomTabInset } from '@/constants/theme';

const STATUS_COLOR: Record<string, string> = {
  Approved:   Colors.success,
  Processing: Colors.warning,
  Submitted:  Colors.primary,
  Rejected:   Colors.error,
};

function ClaimTimeline({ claim }: { claim: MyClaim }) {
  return (
    <View style={t.wrap}>
      {claim.steps.map((step, i) => {
        const done    = i <= claim.currentStep;
        const current = i === claim.currentStep;
        return (
          <View key={step} style={t.row}>
            <View style={t.col}>
              <View style={[
                t.circle,
                done    && { backgroundColor: claim.color, borderColor: claim.color },
                current && { borderWidth: 2.5 },
              ]}>
                {done && <Text style={t.tick}>✓</Text>}
              </View>
              {i < claim.steps.length - 1 && (
                <View style={[t.line, done && { backgroundColor: claim.color }]} />
              )}
            </View>
            <View style={t.body}>
              <Text style={[t.stepLabel, current && { color: claim.color, fontWeight: '700' }]}>
                {step}
              </Text>
              {current && (
                <Text style={[t.stepSub, { color: claim.color }]}>In progress</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function ClaimCard({ claim }: { claim: MyClaim }) {
  const [expanded, setExpanded] = useState(false);
  const color = STATUS_COLOR[claim.status] ?? Colors.primary;

  return (
    <View style={c.card}>
      {/* Thin color indicator */}
      <View style={[c.colorBar, { backgroundColor: claim.color }]} />
      {/* Top row */}
      <View style={c.top}>
        <View style={[c.icon, { backgroundColor: claim.color + '18' }]}>
          <Text style={[c.iconText, { color: claim.color }]}>{claim.type.slice(0, 2)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={c.desc}>{claim.description}</Text>
          <Text style={c.sub}>{claim.insurer} · {claim.date}</Text>
        </View>
        <View style={[c.statusPill, { backgroundColor: color + '18' }]}>
          <Text style={[c.statusText, { color }]}>{claim.status}</Text>
        </View>
      </View>

      {/* Meta */}
      <View style={c.meta}>
        <View>
          <Text style={c.metaLabel}>AMOUNT</Text>
          <Text style={[c.metaValue, { color: claim.color }]}>{claim.amount}</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={c.metaLabel}>CLAIM NO.</Text>
          <Text style={c.metaValue}>{claim.claimNo}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={c.metaLabel}>TYPE</Text>
          <Text style={c.metaValue}>{claim.type}</Text>
        </View>
      </View>

      {/* Expand toggle */}
      <TouchableOpacity style={c.trackBtn} onPress={() => setExpanded(!expanded)}>
        <Text style={c.trackBtnText}>{expanded ? 'Hide timeline ↑' : 'Track status ↓'}</Text>
      </TouchableOpacity>

      {expanded && <ClaimTimeline claim={claim} />}
    </View>
  );
}

export default function ClaimsTab() {
  const [modalVisible, setModalVisible] = useState(false);
  const [step, setStep]       = useState(1);
  const [claimType, setClaimType] = useState('Health');
  const [amount, setAmount]   = useState('');
  const [desc, setDesc]       = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!amount.trim() || !desc.trim()) {
      Alert.alert('Missing info', 'Please fill in all fields.');
      return;
    }
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1200));
    setSubmitting(false);
    setModalVisible(false);
    setStep(1); setAmount(''); setDesc('');
    Alert.alert('Claim Submitted!', 'Your claim has been received. Claim No: ICL-CLM-2025-002');
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>My Claims</Text>
          <Text style={s.sub}>{MY_CLAIMS.length} claim{MY_CLAIMS.length !== 1 ? 's' : ''} on record</Text>
        </View>
        <TouchableOpacity
          style={s.fileBtn}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.85}
        >
          <Text style={s.fileBtnText}>+ File Claim</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={{ padding: 16, paddingBottom: BottomTabInset + 24, gap: 14 }}
        showsVerticalScrollIndicator={false}
      >
        {MY_CLAIMS.map(claim => (
          <ClaimCard key={claim.id} claim={claim} />
        ))}

        {MY_CLAIMS.length === 0 && (
          <View style={s.empty}>
            <Icon name="document-outline" size={40} color={Colors.border} />
            <Text style={s.emptyTitle}>No claims yet</Text>
            <Text style={s.emptySub}>File a claim and we'll track it for you</Text>
          </View>
        )}
      </ScrollView>

      {/* File Claim Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={m.safe}>
          <View style={m.header}>
            <Text style={m.title}>File a Claim</Text>
            <TouchableOpacity onPress={() => { setModalVisible(false); setStep(1); }}>
              <Text style={m.close}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Steps indicator */}
          <View style={m.steps}>
            {[1, 2, 3].map(n => (
              <View key={n} style={m.stepRow}>
                <View style={[m.stepDot, step >= n && { backgroundColor: Colors.primary }]}>
                  <Text style={[m.stepNum, step >= n && { color: Colors.white }]}>{n}</Text>
                </View>
                {n < 3 && <View style={[m.stepLine, step > n && { backgroundColor: Colors.primary }]} />}
              </View>
            ))}
          </View>

          <ScrollView contentContainerStyle={m.content} keyboardShouldPersistTaps="handled">
            {step === 1 && (
              <View style={m.stepContent}>
                <Text style={m.stepTitle}>Select insurance type</Text>
                {['Health', 'Life', 'Motor', 'Travel'].map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[m.typeOption, claimType === type && m.typeOptionActive]}
                    onPress={() => setClaimType(type)}
                  >
                    <Text style={[m.typeText, claimType === type && { color: Colors.primary }]}>
                      {type === 'Health' ? '🏥' : type === 'Life' ? '❤️' : type === 'Motor' ? '🚗' : '✈️'} {type}
                    </Text>
                    {claimType === type && <Text style={{ color: Colors.primary }}>✓</Text>}
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={m.nextBtn} onPress={() => setStep(2)}>
                  <Text style={m.nextBtnText}>Next →</Text>
                </TouchableOpacity>
              </View>
            )}

            {step === 2 && (
              <View style={m.stepContent}>
                <Text style={m.stepTitle}>Claim details</Text>
                <Text style={m.label}>CLAIM AMOUNT (₹)</Text>
                <TextInput
                  style={m.input}
                  placeholder="e.g. 25000"
                  placeholderTextColor={Colors.textLight}
                  value={amount}
                  onChangeText={t => setAmount(t.replace(/\D/g, ''))}
                  keyboardType="numeric"
                />
                <Text style={m.label}>DESCRIPTION</Text>
                <TextInput
                  style={[m.input, { height: 90, textAlignVertical: 'top', paddingTop: 12 }]}
                  placeholder="Brief description of the claim..."
                  placeholderTextColor={Colors.textLight}
                  value={desc}
                  onChangeText={setDesc}
                  multiline
                />
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                  <TouchableOpacity style={[m.nextBtn, { flex: 0.4, backgroundColor: Colors.bg, borderWidth: 1.5, borderColor: Colors.border }]} onPress={() => setStep(1)}>
                    <Text style={[m.nextBtnText, { color: Colors.textMuted }]}>← Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[m.nextBtn, { flex: 1 }]} onPress={() => setStep(3)}>
                    <Text style={m.nextBtnText}>Next →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {step === 3 && (
              <View style={m.stepContent}>
                <Text style={m.stepTitle}>Review & Submit</Text>
                <View style={m.summary}>
                  <View style={m.summaryRow}>
                    <Text style={m.summaryLabel}>Type</Text>
                    <Text style={m.summaryValue}>{claimType}</Text>
                  </View>
                  <View style={m.summaryRow}>
                    <Text style={m.summaryLabel}>Amount</Text>
                    <Text style={[m.summaryValue, { color: Colors.primary }]}>₹{amount}</Text>
                  </View>
                  <View style={[m.summaryRow, { borderBottomWidth: 0 }]}>
                    <Text style={m.summaryLabel}>Description</Text>
                    <Text style={[m.summaryValue, { flex: 1, textAlign: 'right' }]}>{desc}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                  <TouchableOpacity style={[m.nextBtn, { flex: 0.4, backgroundColor: Colors.bg, borderWidth: 1.5, borderColor: Colors.border }]} onPress={() => setStep(2)}>
                    <Text style={[m.nextBtnText, { color: Colors.textMuted }]}>← Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[m.nextBtn, { flex: 1, opacity: submitting ? 0.7 : 1 }]}
                    onPress={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting
                      ? <ActivityIndicator color={Colors.white} />
                      : <Text style={m.nextBtnText}>Submit Claim</Text>
                    }
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title: { fontSize: 22, fontWeight: '900', color: Colors.text, letterSpacing: -0.4 },
  sub:   { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  fileBtn: {
    backgroundColor: Colors.primary, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 9,
  },
  fileBtnText: { fontSize: 13, fontWeight: '700', color: Colors.white },
  scroll: { flex: 1 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyIcon:  { fontSize: 42 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  emptySub:   { fontSize: 13, color: Colors.textMuted },
});

const c = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border,
  },
  colorBar: { height: 3 },
  top: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, padding: 14, paddingBottom: 10,
  },
  icon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 14, fontWeight: '800' },
  desc:   { fontSize: 13, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  sub:    { fontSize: 11, color: Colors.textMuted },
  statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700' },
  meta: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: Colors.bg,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  metaLabel: { fontSize: 9, color: Colors.textLight, fontWeight: '600', letterSpacing: 0.3, marginBottom: 2 },
  metaValue: { fontSize: 13, fontWeight: '700', color: Colors.text },
  trackBtn: {
    paddingHorizontal: 14, paddingVertical: 11,
    borderTopWidth: 1, borderTopColor: Colors.border,
    alignItems: 'center',
  },
  trackBtnText: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
});

const t = StyleSheet.create({
  wrap: {
    paddingHorizontal: 14, paddingBottom: 14, paddingTop: 4,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  row: { flexDirection: 'row', gap: 12 },
  col: { alignItems: 'center', width: 24 },
  circle: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: Colors.border,
    backgroundColor: Colors.bg,
    alignItems: 'center', justifyContent: 'center',
  },
  tick: { fontSize: 11, color: Colors.white, fontWeight: '800' },
  line: { width: 2, flex: 1, minHeight: 20, backgroundColor: Colors.border, marginVertical: 2 },
  body: { flex: 1, paddingVertical: 4 },
  stepLabel: { fontSize: 13, color: Colors.textMuted, fontWeight: '500' },
  stepSub:   { fontSize: 11, marginTop: 1 },
});

const m = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.white },
  header:  {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title:   { fontSize: 18, fontWeight: '800', color: Colors.text },
  close:   { fontSize: 20, color: Colors.textMuted, padding: 4 },
  steps: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 40, paddingVertical: 16,
  },
  stepRow: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  stepDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.bg, borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  stepNum: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  stepLine: { flex: 1, height: 2, backgroundColor: Colors.border, marginHorizontal: 4 },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  stepContent: { gap: 8 },
  stepTitle: { fontSize: 17, fontWeight: '800', color: Colors.text, marginBottom: 12 },
  label: { fontSize: 10, fontWeight: '700', color: Colors.textMuted, letterSpacing: 0.8, marginTop: 8, marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, color: Colors.text, backgroundColor: Colors.bg,
  },
  typeOption: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 13,
    backgroundColor: Colors.bg,
  },
  typeOptionActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  typeText: { fontSize: 15, color: Colors.text, fontWeight: '500' },
  nextBtn: {
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', marginTop: 8,
  },
  nextBtnText: { fontSize: 15, fontWeight: '700', color: Colors.white },
  summary: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 14, overflow: 'hidden',
    backgroundColor: Colors.bg,
  },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  summaryLabel: { fontSize: 13, color: Colors.textMuted, fontWeight: '500' },
  summaryValue: { fontSize: 14, fontWeight: '700', color: Colors.text },
});
