import React, { useState, useEffect, useCallback, useRef, Fragment } from 'react';
import type { ComponentProps } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Modal, TextInput, ActivityIndicator, RefreshControl, Platform,
  Animated, Dimensions, TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { claimsApi, policiesApi, ApiClaim, ApiPolicy } from '@/lib/api';
import { Icon } from '@/components/Icon';
import { Colors, BottomTabInset } from '@/constants/theme';
import { authFieldStyles as af } from '@/constants/authFieldStyles';
import { useDialog } from '@/components/Dialog';

const { height: SCREEN_H } = Dimensions.get('window');

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

const CLAIM_TIMELINE_STEPS = [
  { key: 'submitted',    label: 'Submitted',     sub: 'We received your claim' },
  { key: 'under_review', label: 'Under review', sub: 'The insurer is assessing your case' },
  { key: 'approved',     label: 'Approved',     sub: 'Payout or settlement in progress' },
  { key: 'settled',      label: 'Settled',      sub: 'Claim closed successfully' },
] as const;

const CLAIM_STEP_COLOR: Record<string, string> = {
  submitted:    '#1580FF',
  under_review: '#D97706',
  approved:     '#059669',
  settled:      '#047857',
};

const CLAIM_STATUS_CHIPS: Record<string, { label: string; color: string; bg: string }> = {
  submitted:    { label: 'Submitted',   color: '#1580FF', bg: '#DBEAFE' },
  under_review: { label: 'In review',   color: '#D97706', bg: '#FEF3C7' },
  approved:     { label: 'Approved',   color: '#059669', bg: '#D1FAE5' },
  settled:      { label: 'Settled',     color: '#047857', bg: '#D1FAE5' },
  rejected:     { label: 'Rejected',   color: '#DC2626', bg: '#FEE2E2' },
  pending:      { label: 'Pending',     color: '#D97706', bg: '#FEF3C7' },
  paid:         { label: 'Paid',       color: '#4F46E5', bg: '#E0E7FF' },
};

const TYPE_ICONS: Record<string, string> = {
  life: 'heart-outline', health: 'medical-outline', motor: 'car-outline', travel: 'airplane-outline',
  home: 'home-outline', business: 'briefcase-outline',
};

const CLAIM_STEP_LABELS = ['Policy', 'Details', 'Review'];

const ACTIVE_POLICY_STATUS = {
  label: 'Active', color: '#059669' as const, bg: '#ECFDF5' as const,
  icon: 'checkmark-circle' as ComponentProps<typeof Icon>['name'],
};

function formatPremium(v: number): string {
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)} L/yr`;
  if (v >= 1000)   return `₹${(v / 1000).toFixed(1)}K/yr`;
  return `₹${v}/yr`;
}

function formatCover(v: number): string {
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(0)} Cr`;
  if (v >= 100000)   return `₹${(v / 100000).toFixed(0)} L`;
  return `₹${v.toLocaleString('en-IN')}`;
}

function capitalize(s: string | null | undefined, fallback = '—'): string {
  if (s == null || s === '') return fallback;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Step index in CLAIM_TIMELINE_STEPS, or -1 for rejected (handled separately in the sheet). */
function claimTimelineStepIndex(status: string): number {
  const map: Record<string, number> = {
    submitted: 0, under_review: 1, approved: 2, settled: 3, rejected: -1,
    pending: 0, paid: 3,
  };
  return map[status] ?? 0;
}

function getClaimStatusChip(status: string) {
  return CLAIM_STATUS_CHIPS[status] ?? {
    label: capitalize(status),
    color: Colors.textMuted,
    bg: '#F1F5F9',
  };
}

function formatAmount(v: number): string {
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)} L`;
  if (v >= 1000)   return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${v}`;
}

// ── Bottom sheet (same pattern as my-quotes TimelineSheet) ───────────────────

function BottomSheet({
  visible, onClose, children,
}: {
  visible: boolean; onClose: () => void; children: React.ReactNode;
}) {
  const insets  = useSafeAreaInsets();
  const slideY  = useRef(new Animated.Value(SCREEN_H)).current;
  const bgOp    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideY, { toValue: 0, useNativeDriver: true, damping: 24, stiffness: 240, mass: 0.9 }),
        Animated.timing(bgOp,  { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideY, { toValue: SCREEN_H, duration: 240, useNativeDriver: true }),
        Animated.timing(bgOp,  { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, slideY, bgOp]);

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[bs.backdrop, { opacity: bgOp }]} />
      </TouchableWithoutFeedback>
      <Animated.View
        style={[
          bs.sheet,
          { maxHeight: SCREEN_H * 0.9, paddingBottom: insets.bottom || 24, transform: [{ translateY: slideY }] },
        ]}
      >
        <View style={bs.handleWrap}><View style={bs.handle} /></View>
        {children}
      </Animated.View>
    </Modal>
  );
}

function ClaimProgressSheet({ claim, visible, onClose }: {
  claim: ApiClaim; visible: boolean; onClose: () => void;
}) {
  const accent  = Colors.primary;
  const st      = getClaimStatusChip(claim.status);
  const typeKey = (claim.type ?? '').toLowerCase();
  const stepIdx = claimTimelineStepIndex(claim.status);
  const rejected = claim.status === 'rejected';

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={ts.header}>
        <View style={[ts.iconCircle, { backgroundColor: accent + '1A' }]}>
          <Icon name="git-branch-outline" size={20} color={accent} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={ts.title}>Track status</Text>
          <Text style={ts.subtitle} numberOfLines={1}>
            {capitalize(claim.type)} · {claim.claimNumber}
          </Text>
        </View>
        <View style={[ts.chip, { backgroundColor: st.bg }]}>
          <Text style={[ts.chipText, { color: st.color }]}>{st.label}</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={ts.closeBtn} activeOpacity={0.7}>
          <Icon name="close" size={16} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {rejected ? (
        <View style={ts.rejectedWrap}>
          <View style={ts.rejectedIconCircle}>
            <Icon name="close-circle-outline" size={30} color={Colors.error} />
          </View>
          <Text style={ts.rejectedTitle}>Claim not approved</Text>
          <Text style={ts.rejectedSub}>
            This claim was rejected. Contact support if you need clarification or want to appeal.
          </Text>
        </View>
      ) : (
        <View style={ts.stepsWrap}>
          {CLAIM_TIMELINE_STEPS.map((step, i) => {
            const c      = CLAIM_STEP_COLOR[step.key] ?? Colors.primary;
            const done   = i <= stepIdx;
            const cur    = i === stepIdx;
            const isLast = i === CLAIM_TIMELINE_STEPS.length - 1;
            return (
              <View key={step.key} style={ts.stepRow}>
                <View style={ts.stepTrack}>
                  <View
                    style={[
                      ts.stepDot,
                      done
                        ? { backgroundColor: c, borderColor: c }
                        : { backgroundColor: Colors.white, borderColor: Colors.border },
                    ]}
                  >
                    {done && <Icon name="checkmark" size={10} color={Colors.white} />}
                  </View>
                  {!isLast && (
                    <View
                      style={[
                        ts.stepLine,
                        { backgroundColor: i < stepIdx ? c : Colors.border },
                      ]}
                    />
                  )}
                </View>
                <View style={[ts.stepContent, !isLast && { paddingBottom: 28 }]}>
                  <View style={cur ? [ts.stepHighlight, { backgroundColor: c + '0F', borderColor: c + '30' }] : null}>
                    <View style={ts.stepTitleRow}>
                      <Text
                        style={[
                          ts.stepLabel,
                          done && { color: Colors.text },
                          cur && { color: c, fontWeight: '800' },
                        ]}
                      >
                        {step.label}
                      </Text>
                      {cur && (
                        <View style={[ts.nowBadge, { backgroundColor: c }]}>
                          <Text style={ts.nowBadgeText}>NOW</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[ts.stepSub, cur && { color: c + 'BB' }]}>{step.sub}</Text>
                    {cur && step.key === 'submitted' && (
                      <Text style={[ts.stepEta, { color: c }]}>⏱ We typically acknowledge within 24 hours</Text>
                    )}
                    {cur && step.key === 'under_review' && (
                      <Text style={[ts.stepEta, { color: c }]}>⏱ Insurer review can take a few business days</Text>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </BottomSheet>
  );
}

function ClaimCard({ claim }: { claim: ApiClaim }) {
  const [progressOpen, setProgressOpen] = useState(false);
  const color   = STATUS_COLOR[claim.status] ?? Colors.primary;
  const label   = STATUS_LABEL[claim.status]  ?? claim.status;
  const date    = new Date(claim.submittedDate || claim.incidentDate)
    .toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const typeKey = (claim.type ?? '').toLowerCase();
  const iconName = (TYPE_ICONS[typeKey] ?? 'document-text-outline') as ComponentProps<typeof Icon>['name'];

  return (
    <View style={c.card}>
      <View style={c.body}>
        <View style={c.top}>
          <View style={c.iconWrap}>
            <Icon name={iconName} size={20} color={Colors.primary} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={c.desc} numberOfLines={2}>{claim.description}</Text>
            <Text style={c.sub}>{claim.policy?.provider ?? '—'} · {date}</Text>
          </View>
          <View style={[c.statusPill, { backgroundColor: color + '12', borderColor: color + '28' }]}>
            <View style={[c.statusDot, { backgroundColor: color }]} />
            <Text style={[c.statusText, { color }]}>{label}</Text>
          </View>
        </View>

        <View style={c.meta}>
          <View style={c.metaCell}>
            <Text style={c.metaLabel}>Amount</Text>
            <Text style={c.metaValueAccent}>{formatAmount(claim.amount)}</Text>
          </View>
          <View style={c.metaSep} />
          <View style={[c.metaCell, c.metaCellMid]}>
            <Text style={c.metaLabel}>Claim no.</Text>
            <Text style={c.metaValue} numberOfLines={1}>{claim.claimNumber}</Text>
          </View>
          <View style={c.metaSep} />
          <View style={[c.metaCell, c.metaCellEnd]}>
            <Text style={c.metaLabel}>Type</Text>
            <Text style={c.metaValue} numberOfLines={1}>{capitalize(claim.type)}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={c.trackBtn}
        onPress={() => setProgressOpen(true)}
        activeOpacity={0.7}
      >
        <Text style={c.trackBtnText}>View progress</Text>
        <Icon name="chevron-down-outline" size={16} color={Colors.textMuted} />
      </TouchableOpacity>

      <ClaimProgressSheet
        claim={claim}
        visible={progressOpen}
        onClose={() => setProgressOpen(false)}
      />
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
  const [policyId, setPolicyId] = useState('');
  const [amount, setAmount]     = useState('');
  const [desc, setDesc]         = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [amountErr, setAmountErr]   = useState('');
  const [descErr, setDescErr]       = useState('');

  const activePolicies = policies.filter(p => p.status === 'active');
  const selectedPolicy = activePolicies.find(p => p.id === policyId) ?? null;

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

  const validateStep2 = (): boolean => {
    let ok = true;
    if (!amount.trim() || Number(amount) <= 0) {
      setAmountErr('Please enter a valid claim amount.');
      ok = false;
    } else {
      setAmountErr('');
    }
    if (desc.trim().length < 10) {
      setDescErr('Description must be at least 10 characters.');
      ok = false;
    } else {
      setDescErr('');
    }
    return ok;
  };

  const handleSubmit = async () => {
    if (!selectedPolicy) {
      alert({ type: 'warning', title: 'No policy selected', message: 'Please select an active policy to file a claim.' });
      return;
    }
    setSubmitting(true);
    try {
      const { claim } = await claimsApi.create({
        policyId: selectedPolicy.id,
        type: selectedPolicy.type,
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
    setStep(1); setAmount(''); setDesc(''); setPolicyId('');
    setAmountErr(''); setDescErr('');
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={s.kicker}>Claims</Text>
          <Text style={s.title}>My claims</Text>
          <Text style={s.sub}>
            {loadingClaims ? 'Fetching your claims…' : `${claims.length} on record`}
          </Text>
        </View>
        <TouchableOpacity style={s.fileBtn} onPress={openModal} activeOpacity={0.85}>
          <Icon name="add" size={18} color={Colors.white} />
          <Text style={s.fileBtnText}>File claim</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={{
          paddingHorizontal: 20, paddingTop: 16, paddingBottom: BottomTabInset + 28, gap: 12,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadClaims(true)} />}
      >
        {loadingClaims && (
          <View style={s.loadingBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        )}

        {!loadingClaims && claims.map(claim => (
          <ClaimCard key={claim.id} claim={claim} />
        ))}

        {!loadingClaims && claims.length === 0 && (
          <View style={s.emptyCard}>
            <View style={s.emptyIcon}>
              <Icon name="document-text-outline" size={28} color={Colors.primary} />
            </View>
            <Text style={s.emptyTitle}>No claims yet</Text>
            <Text style={s.emptySub}>
              When you file a claim, it appears here with status and progress in one place.
            </Text>
            <TouchableOpacity style={s.emptyCta} onPress={openModal} activeOpacity={0.88}>
              <Text style={s.emptyCtaText}>File a claim</Text>
            </TouchableOpacity>
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
            <View>
              <Text style={m.title}>File a Claim</Text>
              <Text style={m.headerSub}>{CLAIM_STEP_LABELS[step - 1] ?? 'Policy'}</Text>
            </View>
            <TouchableOpacity
              style={m.closeBtn}
              onPress={() => { setModalVisible(false); setStep(1); }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon name="close-outline" size={24} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={m.stepPillRow}>
            {CLAIM_STEP_LABELS.map((lab, i) => {
              const n     = i + 1;
              const done  = step > n;
              const current = step === n;
              return (
                <Fragment key={lab}>
                  <View style={m.stepPillCol}>
                    <View
                      style={[
                        m.stepPillDot,
                        done && m.stepPillDotDone,
                        current && m.stepPillDotCurrent,
                      ]}
                    >
                      {done ? (
                        <Icon name="checkmark" size={12} color={Colors.white} />
                      ) : (
                        <Text style={[m.stepPillNum, current && m.stepPillNumOn]}>{n}</Text>
                      )}
                    </View>
                    <Text
                      style={[m.stepPillLab, (done || current) && m.stepPillLabOn]}
                      numberOfLines={1}
                    >
                      {lab}
                    </Text>
                  </View>
                  {i < CLAIM_STEP_LABELS.length - 1 && (
                    <View style={[m.stepPillLine, step > n && m.stepPillLineDone]} />
                  )}
                </Fragment>
              );
            })}
          </View>

          <ScrollView contentContainerStyle={m.content} keyboardShouldPersistTaps="handled">
            {step === 1 && (
              <View style={m.selRoot}>
                <View style={m.selHeader}>
                  <Text style={m.selKicker}>Step 1 of 3</Text>
                  <Text style={m.selTitle}>Which policy is this for?</Text>
                  <Text style={m.selSub}>
                    Pick the active policy you are claiming against. You can add or renew policies from My
                    Policies.
                  </Text>
                </View>

                {activePolicies.length === 0 ? (
                  <View style={m.selEmpty}>
                    <View style={m.selEmptyIcon}>
                      <Icon name="shield-outline" size={28} color={Colors.primary} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={m.selEmptyTitle}>No active policies</Text>
                      <Text style={m.selEmptySub}>
                        Claims can only be submitted when you have at least one active policy on file.
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={m.selList}>
                    {activePolicies.map(p => {
                      const typeStr  = p.type ?? '';
                      const due      = new Date(p.endDate).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      });
                      const st       = ACTIVE_POLICY_STATUS;
                      const selected = policyId === p.id;
                      const iconName = (TYPE_ICONS[typeStr] ?? 'document-text-outline') as ComponentProps<typeof Icon>['name'];
                      return (
                        <TouchableOpacity
                          key={p.id}
                          style={[m.selCard, selected && m.selCardOn]}
                          onPress={() => setPolicyId(p.id)}
                          activeOpacity={0.88}
                        >
                          <View style={m.selCardBody}>
                            <View style={m.selTop}>
                              <View
                                style={[
                                  m.selIconWrap,
                                  selected && m.selIconWrapOn,
                                ]}
                              >
                                <Icon name={iconName} size={20} color={selected ? Colors.primary : Colors.silverDark} />
                              </View>
                              <View style={{ flex: 1, minWidth: 0 }}>
                                <Text style={m.selPolicyNum} numberOfLines={1}>
                                  {p.policyNumber}
                                </Text>
                                <Text style={m.selProvider} numberOfLines={1}>{p.provider || '—'}</Text>
                              </View>
                              <View
                                style={[
                                  m.selStatusTag,
                                  { backgroundColor: st.bg, borderColor: st.color + '2A' },
                                ]}
                              >
                                <Icon name={st.icon} size={12} color={st.color} />
                                <Text style={[m.selStatusText, { color: st.color }]}>{st.label}</Text>
                              </View>
                              <View
                                style={[
                                  m.selRadio,
                                  selected && m.selRadioOn,
                                ]}
                              >
                                {selected ? (
                                  <Icon name="checkmark" size={14} color={Colors.white} />
                                ) : null}
                              </View>
                            </View>

                            <View style={m.selStatGrid}>
                              <View style={m.selStatCell}>
                                <Text style={m.selStatLbl}>Cover</Text>
                                <Text style={m.selStatVal}>{formatCover(p.sumInsured)}</Text>
                              </View>
                              <View style={m.selStatSep} />
                              <View style={m.selStatCell}>
                                <Text style={m.selStatLbl}>Premium</Text>
                                <Text style={[m.selStatVal, m.selStatValAccent]}>{formatPremium(p.premium)}</Text>
                              </View>
                              <View style={m.selStatSep} />
                              <View style={[m.selStatCell, m.selStatCellEnd]}>
                                <Text style={m.selStatLbl}>Type</Text>
                                <Text style={m.selStatVal} numberOfLines={1}>{capitalize(typeStr)}</Text>
                              </View>
                            </View>

                            <View style={m.selFooter}>
                              <Icon name="calendar-outline" size={14} color={Colors.textLight} />
                              <Text style={m.selDue}>Valid until {due}</Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                <TouchableOpacity
                  style={[m.nextBtn, m.selNext, !policyId && m.nextBtnDisabled]}
                  onPress={() => setStep(2)}
                  disabled={!policyId}
                >
                  <Text style={m.nextBtnText}>Continue to details</Text>
                  <Icon name="arrow-forward-outline" size={18} color={Colors.white} />
                </TouchableOpacity>
              </View>
            )}

            {step === 2 && (
              <View style={m.stepContent}>
                <Text style={m.stepTitle}>Claim details</Text>
                <Text style={m.label}>CLAIM AMOUNT (₹)</Text>
                <View style={[af.inputRow, !!amountErr && af.inputRowError, { marginTop: 4, marginBottom: 4 }]}>
                  <TextInput
                    style={af.input}
                    placeholder="e.g. 25000"
                    placeholderTextColor={Colors.textLight}
                    value={amount}
                    onChangeText={v => { setAmount(v.replace(/\D/g, '')); setAmountErr(''); }}
                    keyboardType="numeric"
                  />
                </View>
                {!!amountErr && <Text style={m.fieldErr}>{amountErr}</Text>}
                <Text style={m.label}>DESCRIPTION</Text>
                <View style={[af.inputRow, af.inputRowTopAlign, !!descErr && af.inputRowError, { marginTop: 4, marginBottom: 4 }]}>
                  <TextInput
                    style={[af.input, af.inputMultiline, { minHeight: 100 }]}
                    placeholder="Brief description of the claim (min. 10 characters)..."
                    placeholderTextColor={Colors.textLight}
                    value={desc}
                    onChangeText={v => { setDesc(v); setDescErr(''); }}
                    multiline
                  />
                </View>
                {!!descErr
                  ? <Text style={m.fieldErr}>{descErr}</Text>
                  : <Text style={m.fieldHint}>{desc.trim().length}/10 characters minimum</Text>
                }
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                  <TouchableOpacity style={[m.nextBtn, { flex: 0.4, backgroundColor: Colors.bg, borderWidth: 1.5, borderColor: Colors.border }]} onPress={() => setStep(1)}>
                    <Text style={[m.nextBtnText, { color: Colors.textMuted }]}>← Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[m.nextBtn, { flex: 1 }]} onPress={() => { if (validateStep2()) setStep(3); }}>
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
                    <Text style={m.summaryValue}>{selectedPolicy?.type ?? '—'}</Text>
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
  safe:  { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border,
  },
  kicker: { fontSize: 10, fontWeight: '800', color: Colors.textLight, letterSpacing: 1.2, marginBottom: 4 },
  title:  { fontSize: 24, fontWeight: '900', color: Colors.text, letterSpacing: -0.5 },
  sub:    { fontSize: 13, color: Colors.textMuted, fontWeight: '500', marginTop: 3 },
  fileBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11,
  },
  fileBtnText: { fontSize: 13, fontWeight: '800', color: Colors.white },
  scroll: { flex: 1, backgroundColor: Colors.bg },
  loadingBox: { alignItems: 'center', paddingVertical: 48 },
  emptyCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    padding: 24,
    alignItems: 'center',
    marginTop: 8,
    ...Platform.select({
      ios: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2 },
      android: { elevation: 1 },
    }),
  },
  emptyIcon: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle:  { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 6, textAlign: 'center' },
  emptySub:    { fontSize: 13, color: Colors.textMuted, lineHeight: 20, textAlign: 'center' },
  emptyCta:    { marginTop: 20, backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 24 },
  emptyCtaText:{ fontSize: 14, fontWeight: '800', color: Colors.white },
});

const c = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2 },
      android: { elevation: 1 },
    }),
  },
  body: { padding: 16 },
  top:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  iconWrap: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: Colors.bg,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  desc: { fontSize: 14, fontWeight: '700', color: Colors.text, lineHeight: 19, marginBottom: 4 },
  sub:  { fontSize: 12, color: Colors.textMuted, lineHeight: 16 },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, borderWidth: 1, flexShrink: 0, maxWidth: 120,
  },
  statusDot: { width: 5, height: 5, borderRadius: 2.5 },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.15 },
  meta: {
    flexDirection: 'row', marginTop: 16, paddingTop: 16, alignItems: 'stretch',
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border,
  },
  metaCell:    { flex: 1, gap: 3 },
  metaCellMid: { alignItems: 'center' },
  metaCellEnd: { alignItems: 'flex-end' },
  metaSep:     { width: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginHorizontal: 2, alignSelf: 'stretch' },
  metaLabel:   { fontSize: 9, color: Colors.textMuted, fontWeight: '600', textTransform: 'capitalize' },
  metaValue:   { fontSize: 12, fontWeight: '800', color: Colors.text, letterSpacing: -0.2 },
  metaValueAccent: { fontSize: 13, fontWeight: '800', color: Colors.primary, letterSpacing: -0.2 },
  trackBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  trackBtnText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
});

const bs = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    shadowColor: '#000', shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12, shadowRadius: 24, elevation: 28,
  },
  handleWrap: { alignItems: 'center', paddingTop: 12, paddingBottom: 6 },
  handle:     { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0' },
});

const ts = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingTop: 4, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  iconCircle: {
    width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
  },
  title:    { fontSize: 17, fontWeight: '800', color: Colors.text, letterSpacing: -0.3 },
  subtitle: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  chip:     { paddingHorizontal: 11, paddingVertical: 5, borderRadius: 20, flexShrink: 0, maxWidth: 110 },
  chipText: { fontSize: 11, fontWeight: '700' },
  closeBtn: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  rejectedWrap: {
    alignItems: 'center', paddingHorizontal: 28, paddingTop: 20, paddingBottom: 32, gap: 10,
  },
  rejectedIconCircle: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: '#FEF2F2',
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  rejectedTitle: { fontSize: 17, fontWeight: '800', color: Colors.text },
  rejectedSub:   { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  stepsWrap: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24 },
  stepRow:   { flexDirection: 'row', gap: 16 },
  stepTrack: { alignItems: 'center', width: 26 },
  stepDot: {
    width: 26, height: 26, borderRadius: 13, borderWidth: 2, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  stepLine: { width: 2, flex: 1, marginTop: 4, minHeight: 24 },
  stepContent: { flex: 1, paddingTop: 1 },
  stepHighlight: { borderRadius: 12, padding: 12, marginBottom: 2, borderWidth: 1 },
  stepTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  stepLabel:   { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  stepSub:     { fontSize: 12, color: Colors.textLight, lineHeight: 18 },
  stepEta:     { fontSize: 11, fontWeight: '700', marginTop: 7, letterSpacing: 0.1 },
  nowBadge:    { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  nowBadgeText: { fontSize: 9, fontWeight: '800', color: Colors.white, letterSpacing: 0.5 },
});

const m = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14,
    backgroundColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border,
  },
  title:     { fontSize: 19, fontWeight: '900', color: Colors.text, letterSpacing: -0.4 },
  headerSub: { fontSize: 12, color: Colors.textMuted, fontWeight: '600', marginTop: 3 },
  closeBtn:  { marginTop: -2 },

  stepPillRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border,
  },
  stepPillCol: { alignItems: 'center', gap: 5, minWidth: 56 },
  stepPillDot: {
    width: 26, height: 26, borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border,
    backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center',
  },
  stepPillDotDone:   { backgroundColor: Colors.primary, borderColor: Colors.primary },
  stepPillDotCurrent: { borderColor: Colors.primary, borderWidth: 2, backgroundColor: Colors.primaryLight },
  stepPillNum:     { fontSize: 11, fontWeight: '800', color: Colors.textMuted },
  stepPillNumOn:   { color: Colors.primary },
  stepPillLab:     { fontSize: 10, fontWeight: '600', color: Colors.textLight, maxWidth: 72, textAlign: 'center' },
  stepPillLabOn:   { color: Colors.text, fontWeight: '700' },
  stepPillLine:    { flex: 1, height: 2, backgroundColor: Colors.border, marginHorizontal: 4, marginBottom: 18, maxWidth: 48 },
  stepPillLineDone:{ backgroundColor: Colors.primary },

  content:     { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 4 },
  stepContent: { gap: 8 },
  stepTitle:   { fontSize: 17, fontWeight: '800', color: Colors.text, marginBottom: 12 },
  label:       { fontSize: 10, fontWeight: '700', color: Colors.textMuted, letterSpacing: 0.8, marginTop: 8, marginBottom: 6 },
  fieldErr:    { fontSize: 12, color: Colors.error, fontWeight: '600', marginTop: 4 },
  fieldHint:   { fontSize: 11, color: Colors.textLight, marginTop: 4 },
  typeOption:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, backgroundColor: Colors.bg },
  typeOptionActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  typeText:    { fontSize: 15, color: Colors.text, fontWeight: '500' },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 15,
    marginTop: 8,
  },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText: { fontSize: 15, fontWeight: '800', color: Colors.white },
  summary:     { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 14, overflow: 'hidden', backgroundColor: Colors.bg },
  summaryRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  summaryLabel:{ fontSize: 13, color: Colors.textMuted, fontWeight: '500' },
  summaryValue:{ fontSize: 14, fontWeight: '700', color: Colors.text },

  selRoot:   { gap: 0, paddingTop: 8 },
  selHeader: { marginBottom: 18, gap: 6 },
  selKicker: { fontSize: 10, fontWeight: '800', color: Colors.textLight, letterSpacing: 1.2 },
  selTitle:  { fontSize: 22, fontWeight: '900', color: Colors.text, letterSpacing: -0.5, lineHeight: 28 },
  selSub:    { fontSize: 13, color: Colors.textMuted, lineHeight: 20, marginTop: 2 },

  selList: { gap: 12 },

  selCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2 },
      android: { elevation: 1 },
    }),
  },
  selCardOn: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: 'rgba(21, 128, 255, 0.2)',
  },
  selCardBody: { padding: 16 },
  selTop: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  selIconWrap: {
    width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    backgroundColor: Colors.bg,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border,
  },
  selIconWrapOn: {
    backgroundColor: 'rgba(21, 128, 255, 0.08)',
    borderColor: 'rgba(21, 128, 255, 0.18)',
  },
  selPolicyNum: { fontSize: 14, fontWeight: '800', color: Colors.text, letterSpacing: -0.2 },
  selProvider:  {
    fontSize: 11, color: Colors.textMuted, marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  selStatusTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 7, paddingVertical: 4, borderRadius: 8, borderWidth: 1, flexShrink: 0, maxWidth: 88,
  },
  selStatusText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.2 },
  selRadio: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  selRadioOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },

  selStatGrid: {
    flexDirection: 'row', marginTop: 14, paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border,
  },
  selStatCell:    { flex: 1, alignItems: 'flex-start', gap: 3 },
  selStatCellEnd: { alignItems: 'flex-end' },
  selStatSep:     { width: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginHorizontal: 4, alignSelf: 'stretch' },
  selStatLbl:     { fontSize: 9, color: Colors.textMuted, fontWeight: '600' },
  selStatVal:     { fontSize: 13, fontWeight: '800', color: Colors.text, letterSpacing: -0.2 },
  selStatValAccent: { color: Colors.primary, fontWeight: '700' },

  selFooter: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 8, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border,
  },
  selDue: { fontSize: 12, color: Colors.textLight, fontWeight: '500' },

  selEmpty: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.white, borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border,
    borderStyle: 'dashed', padding: 18,
  },
  selEmptyIcon: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  selEmptyTitle: { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  selEmptySub:   { fontSize: 12, color: Colors.textMuted, lineHeight: 18 },
  selNext: { marginTop: 20 },
});
