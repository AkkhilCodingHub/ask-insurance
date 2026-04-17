import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Modal, TextInput, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { claimsApi, policiesApi, ApiClaim, ApiPolicy } from '@/lib/api';
import { Icon } from '@/components/Icon';
import { Colors, BottomTabInset } from '@/constants/theme';
import { useDialog } from '@/components/Dialog';

const STATUS_COLOR: Record<string, string> = {
  approved:    Colors.success,
  settled:     Colors.success,
  under_review: Colors.warning,
  submitted:   Colors.primary,
  rejected:    Colors.error,
};

const STATUS_LABEL: Record<string, string> = {
  approved:    'Approved',
  settled:     'Settled',
  under_review: 'In Review',
  submitted:   'Submitted',
  rejected:    'Rejected',
};

const CLAIM_STEPS = ['Submitted', 'Under Review', 'Approved', 'Settled'];

function statusToStep(status: string): number {
  const map: Record<string, number> = {
    submitted: 0, under_review: 1, approved: 2, settled: 3, rejected: 1
  };
  return map[status] ?? 0;
}

function formatAmount(v: number): string {
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)} L`;
  if (v >= 1000)   return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${v}`;
}

function ClaimTimeline({ status }: { status: string }) {
  const currentStep = statusToStep(status);
  const color       = STATUS_COLOR[status] ?? Colors.primary;
  return (
    <View style={t.wrap}>
      {CLAIM_STEPS.map((step, i) => {
        const done    = i <= currentStep;
        const current = i === currentStep;
        return (
          <View key={step} style={t.row}>
            <View style={t.col}>
              <View style={[
                t.circle,
                done    && { backgroundColor: color, borderColor: color },
                current && { borderWidth: 2.5 },
              ]}>
                {done && <Text style={t.tick}>✓</Text>}
              </View>
              {i < CLAIM_STEPS.length - 1 && (
                <View style={[t.line, done && { backgroundColor: color }]} />
              )}
            </View>
            <View style={t.body}>
              <Text style={[t.stepLabel, current && { color, fontWeight: '700' }]}>{step}</Text>
              {current && <Text style={[t.stepSub, { color }]}>In progress</Text>}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function ClaimCard({ claim }: { claim: ApiClaim }) {
  const [expanded, setExpanded] = useState(false);
  const color  = STATUS_COLOR[claim.status]  ?? Colors.primary;
  const label  = STATUS_LABEL[claim.status]  ?? claim.status;
  const date   = new Date(claim.submittedDate || claim.incidentDate)
    .toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const typeColor = '#7C3AED';

  return (
    <View style={c.card}>
      <View style={[c.colorBar, { backgroundColor: typeColor }]} />
      <View style={c.top}>
        <View style={[c.icon, { backgroundColor: typeColor + '18' }]}>
          <Text style={[c.iconText, { color: typeColor }]}>{claim.type.slice(0, 2).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={c.desc}>{claim.description}</Text>
          <Text style={c.sub}>{claim.policy?.provider ?? '—'} · {date}</Text>
        </View>
        <View style={[c.statusPill, { backgroundColor: color + '18' }]}>
          <Text style={[c.statusText, { color }]}>{label}</Text>
        </View>
      </View>

      <View style={c.meta}>
        <View>
          <Text style={c.metaLabel}>AMOUNT</Text>
          <Text style={[c.metaValue, { color: typeColor }]}>{formatAmount(claim.amount)}</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={c.metaLabel}>CLAIM NO.</Text>
          <Text style={c.metaValue}>{claim.claimNumber}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={c.metaLabel}>TYPE</Text>
          <Text style={c.metaValue}>{claim.type}</Text>
        </View>
      </View>

      <TouchableOpacity style={c.trackBtn} onPress={() => setExpanded(!expanded)}>
        <Text style={c.trackBtnText}>{expanded ? 'Hide timeline ↑' : 'Track status ↓'}</Text>
      </TouchableOpacity>

      {expanded && <ClaimTimeline status={claim.status} />}
    </View>
  );
}

export default function ClaimsTab() {
  const { alert } = useDialog();
  const [claims, setClaims]         = useState<ApiClaim[]>([]);
  const [policies, setPolicies]     = useState<ApiPolicy[]>([]);
  const [loadingClaims, setLoadingClaims] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // File claim form state
  const [step, setStep]         = useState(1);
  const [claimType, setClaimType] = useState('Health');
  const [policyId, setPolicyId] = useState('');
  const [amount, setAmount]     = useState('');
  const [desc, setDesc]         = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadClaims = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoadingClaims(true);
    try {
      const [claimsRes, policiesRes] = await Promise.allSettled([
        claimsApi.list(),
        policiesApi.list()
      ]);
      if (claimsRes.status === 'fulfilled')   setClaims(claimsRes.value.claims);
      if (policiesRes.status === 'fulfilled') setPolicies(policiesRes.value.policies);
    } finally {
      setLoadingClaims(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadClaims(); }, [loadClaims]);

  const handleSubmit = async () => {
    if (!amount.trim() || !desc.trim()) {
      alert({ type: 'warning', title: 'Missing info', message: 'Please fill in all fields.' });
      return;
    }
    const policy = policies.find(p => p.id === policyId) ?? policies[0];
    if (!policy) {
      alert({ type: 'warning', title: 'No policy', message: 'You need an active policy to file a claim.' });
      return;
    }
    setSubmitting(true);
    try {
      const { claim } = await claimsApi.create({
        policyId: policy.id,
        type: claimType,
        amount: Number(amount),
        description: desc,
        incidentDate: new Date().toISOString()
      });
      setClaims(prev => [claim, ...prev]);
      setModalVisible(false);
      setStep(1); setAmount(''); setDesc('');
      alert({ type: 'success', title: 'Claim Submitted!', message: `Your claim has been received.\nClaim No: ${claim.claimNumber}` });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Please try again.';
      alert({ type: 'error', title: 'Error', message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const openModal = () => {
    setStep(1); setAmount(''); setDesc('');
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>My Claims</Text>
          <Text style={s.sub}>{claims.length} claim{claims.length !== 1 ? 's' : ''} on record</Text>
        </View>
        <TouchableOpacity style={s.fileBtn} onPress={openModal} activeOpacity={0.85}>
          <Text style={s.fileBtnText}>+ File Claim</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={{ padding: 16, paddingBottom: BottomTabInset + 24, gap: 14 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadClaims(true)} />}
      >
        {loadingClaims && (
          <View style={{ paddingTop: 60, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        )}

        {!loadingClaims && claims.map(claim => (
          <ClaimCard key={claim.id} claim={claim} />
        ))}

        {!loadingClaims && claims.length === 0 && (
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

                {/* Policy selector */}
                {policies.length > 0 && (
                  <>
                    <Text style={[m.stepTitle, { fontSize: 14, marginTop: 16 }]}>Select policy</Text>
                    {policies.map(p => (
                      <TouchableOpacity
                        key={p.id}
                        style={[m.typeOption, policyId === p.id && m.typeOptionActive]}
                        onPress={() => setPolicyId(p.id)}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[m.typeText, policyId === p.id && { color: Colors.primary }]}>
                            {p.provider}
                          </Text>
                          <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 2 }}>
                            {p.policyNumber} · {p.type}
                          </Text>
                        </View>
                        {policyId === p.id && <Text style={{ color: Colors.primary }}>✓</Text>}
                      </TouchableOpacity>
                    ))}
                  </>
                )}

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
  fileBtn: { backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 },
  fileBtnText: { fontSize: 13, fontWeight: '700', color: Colors.white },
  scroll: { flex: 1 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  emptySub:   { fontSize: 13, color: Colors.textMuted },
});

const c = StyleSheet.create({
  card: { backgroundColor: Colors.white, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  colorBar: { height: 3 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, paddingBottom: 10 },
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
  trackBtn: { paddingHorizontal: 14, paddingVertical: 11, borderTopWidth: 1, borderTopColor: Colors.border, alignItems: 'center' },
  trackBtnText: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
});

const t = StyleSheet.create({
  wrap: { paddingHorizontal: 14, paddingBottom: 14, paddingTop: 4, borderTopWidth: 1, borderTopColor: Colors.border },
  row:  { flexDirection: 'row', gap: 12 },
  col:  { alignItems: 'center', width: 24 },
  circle: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: Colors.border,
    backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center',
  },
  tick: { fontSize: 11, color: Colors.white, fontWeight: '800' },
  line: { width: 2, flex: 1, minHeight: 20, backgroundColor: Colors.border, marginVertical: 2 },
  body: { flex: 1, paddingVertical: 4 },
  stepLabel: { fontSize: 13, color: Colors.textMuted, fontWeight: '500' },
  stepSub:   { fontSize: 11, marginTop: 1 },
});

const m = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.white },
  header:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title:   { fontSize: 18, fontWeight: '800', color: Colors.text },
  close:   { fontSize: 20, color: Colors.textMuted, padding: 4 },
  steps:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 40, paddingVertical: 16 },
  stepRow: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.bg, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  stepNum: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  stepLine:{ flex: 1, height: 2, backgroundColor: Colors.border, marginHorizontal: 4 },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  stepContent: { gap: 8 },
  stepTitle:   { fontSize: 17, fontWeight: '800', color: Colors.text, marginBottom: 12 },
  label:       { fontSize: 10, fontWeight: '700', color: Colors.textMuted, letterSpacing: 0.8, marginTop: 8, marginBottom: 6 },
  input:       { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: Colors.text, backgroundColor: Colors.bg },
  typeOption:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, backgroundColor: Colors.bg },
  typeOptionActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  typeText:    { fontSize: 15, color: Colors.text, fontWeight: '500' },
  nextBtn:     { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  nextBtnText: { fontSize: 15, fontWeight: '700', color: Colors.white },
  summary:     { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 14, overflow: 'hidden', backgroundColor: Colors.bg },
  summaryRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  summaryLabel:{ fontSize: 13, color: Colors.textMuted, fontWeight: '500' },
  summaryValue:{ fontSize: 14, fontWeight: '700', color: Colors.text },
});
