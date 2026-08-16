import React, { useEffect, useState, useCallback, useRef, type ComponentProps } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, Modal, Animated, Dimensions, Platform,
  StatusBar, Pressable, TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { policiesApi, endorsementsApi, ApiPolicy, EndorsementData } from '@/lib/api';
import { useDialog } from '@/components/Dialog';
import { Icon } from '@/components/Icon';
import { BackButton } from '@/components/BackButton';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { ReportModal, ReportData } from '@/components/ReportModal';

const { height: SCREEN_H } = Dimensions.get('window');

// ── Type metadata ─────────────────────────────────────────────────────────────

const TYPE_META: Record<string, { color: string; lightBg: string; emoji: string; label: string }> = {
  life:     { color: '#1580FF', lightBg: '#EFF6FF', emoji: '❤️',  label: 'Life Insurance'     },
  health:   { color: '#059669', lightBg: '#ECFDF5', emoji: '🏥',  label: 'Health Insurance'   },
  motor:    { color: '#F59E0B', lightBg: '#FFFBEB', emoji: '🚗',  label: 'Motor Insurance'    },
  travel:   { color: '#7C3AED', lightBg: '#F5F3FF', emoji: '✈️',  label: 'Travel Insurance'   },
  home:     { color: '#0891B2', lightBg: '#ECFEFF', emoji: '🏠',  label: 'Home Insurance'     },
  business: { color: '#E11D48', lightBg: '#FFF1F2', emoji: '💼',  label: 'Business Insurance' },
};

const TYPE_ICONS: Record<string, string> = {
  life: 'heart-outline',
  health: 'medical-outline',
  motor: 'car-outline',
  travel: 'airplane-outline',
  home: 'home-outline',
  business: 'briefcase-outline',
};

type IonIcon = ComponentProps<typeof Icon>['name'];

const STATUS_META: Record<string, { color: string; bg: string; label: string; icon: IonIcon }> = {
  active:    { color: '#059669', bg: '#ECFDF5', label: 'Active',            icon: 'checkmark-circle' },
  pending:   { color: '#B45309', bg: '#FFFBEB', label: 'Pending',           icon: 'time-outline' },
  expired:   { color: '#B91C1C', bg: '#FEF2F2', label: 'Expired',           icon: 'alert-circle-outline' },
  claimed:   { color: '#7C3AED', bg: '#F5F3FF', label: 'Claimed & Settled', icon: 'shield-checkmark-outline' },
  settled:   { color: '#7C3AED', bg: '#F5F3FF', label: 'Claimed & Settled', icon: 'shield-checkmark-outline' },
  cancelled: { color: '#475569', bg: '#F1F5F9', label: 'Cancelled',         icon: 'remove-circle-outline' },
};

const stTag = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 9,
    borderWidth: 1,
    maxWidth: 200,
  },
  wrapCompact: {
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
    maxWidth: 130,
  },
  text: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  textCompact: { fontSize: 10, letterSpacing: 0.1 },
});

function StatusTag({ statusKey, compact }: { statusKey: string; compact?: boolean }) {
  const meta = STATUS_META[statusKey] ?? STATUS_META.cancelled;
  return (
    <View
      style={[
        stTag.wrap,
        compact && stTag.wrapCompact,
        { backgroundColor: meta.bg, borderColor: meta.color + '2A' },
      ]}
    >
      <Icon name={meta.icon} size={compact ? 12 : 15} color={meta.color} />
      <Text style={[stTag.text, compact && stTag.textCompact, { color: meta.color }]}>{meta.label}</Text>
    </View>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtAmount(v: number): string {
  if (v >= 10_000_000) return `₹${(v / 10_000_000).toFixed(2)}Cr`;
  if (v >= 100_000)    return `₹${(v / 100_000).toFixed(1)}L`;
  if (v >= 1_000)      return `₹${(v / 1_000).toFixed(0)}K`;
  return `₹${v}`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function daysLeft(endDate: string): number {
  return Math.ceil((new Date(endDate).getTime() - Date.now()) / 86_400_000);
}

function coveragePct(startDate: string, endDate: string): number {
  const start = new Date(startDate).getTime();
  const end   = new Date(endDate).getTime();
  const now   = Date.now();
  if (now >= end)   return 100;
  if (now <= start) return 0;
  return Math.round(((now - start) / (end - start)) * 100);
}

// ── Skeleton card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  const anim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1,   duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  return (
    <Animated.View style={[sk.card, { opacity: anim }]}>
      <View style={sk.topRow}>
        <View style={sk.circle} />
        <View style={{ flex: 1, gap: 6 }}>
          <View style={sk.lineWide} />
          <View style={sk.lineNarrow} />
        </View>
      </View>
      <View style={sk.divider} />
      <View style={sk.bottomRow}>
        <View style={sk.lineShort} />
        <View style={sk.lineShort} />
        <View style={sk.lineShort} />
      </View>
    </Animated.View>
  );
}

// ── Policy detail bottom sheet ────────────────────────────────────────────────

function PolicySheet({
  policy, onClose, onShowCertificate,
}: {
  policy: ApiPolicy | null; onClose: () => void;
  onShowCertificate: (p: ApiPolicy) => void;
}) {
  const insets  = useSafeAreaInsets();
  const slideY  = useRef(new Animated.Value(SCREEN_H)).current;
  const visible = !!policy;
  const { alert } = useDialog();

  const [endorsements, setEndorsements] = useState<EndorsementData[]>([]);
  const [showEndorsementModal, setShowEndorsementModal] = useState(false);
  const [category, setCategory] = useState('name_correction');
  const [requestedChanges, setRequestedChanges] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadEndorsements = useCallback(async () => {
    if (!policy) return;
    try {
      const res = await endorsementsApi.getByPolicy(policy.id);
      setEndorsements(res.endorsements || []);
    } catch {
      // ignore
    }
  }, [policy]);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideY, {
        toValue: 0, damping: 22, stiffness: 260, useNativeDriver: true,
      }).start();
      loadEndorsements();
    } else {
      Animated.timing(slideY, {
        toValue: SCREEN_H, duration: 220, useNativeDriver: true,
      }).start();
    }
  }, [visible, slideY, loadEndorsements]);

  if (!policy) return null;

  const handleSubmitEndorsement = async () => {
    if (!policy || requestedChanges.trim().length < 5) {
      alert({ type: 'warning', title: 'Invalid Request', message: 'Please describe your requested changes (at least 5 characters).' });
      return;
    }
    setSubmitting(true);
    try {
      await endorsementsApi.submit({
        policyId: policy.id,
        category,
        requestedChanges: requestedChanges.trim()
      });
      alert({ type: 'success', title: 'Endorsement Submitted', message: 'Your policy endorsement request has been sent for admin review.' });
      setShowEndorsementModal(false);
      setRequestedChanges('');
      loadEndorsements();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Could not submit endorsement request';
      alert({ type: 'error', title: 'Error', message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const type   = TYPE_META[policy.type] ?? { color: '#1580FF', lightBg: '#EFF6FF', emoji: '📋', label: policy.type };
  const days   = daysLeft(policy.endDate);
  const pct    = coveragePct(policy.startDate, policy.endDate);
  const expiring = policy.status === 'active' && days > 0 && days <= 30;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose} statusBarTranslucent>
      {/* Backdrop */}
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        <View style={d.backdrop} />
      </Pressable>

      <Animated.View style={[d.sheet, { transform: [{ translateY: slideY }], paddingBottom: insets.bottom + 16 }]}>
        {/* Hero header — handle sits inside the colour, no white gap */}
        <View style={[d.hero, { backgroundColor: type.color }]}>
          {/* Drag pill on colour */}
          <View style={d.handleRow}><View style={d.handlePill} /></View>
          <View style={d.heroDecor1} />
          <View style={d.heroDecor2} />
          <View style={d.heroTop}>
            <View style={d.heroIcon}>
              <Text style={{ fontSize: 28 }}>{type.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={d.heroLabel}>{type.label}</Text>
              <Text style={d.heroNum}>{policy.policyNumber}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={d.closeBtn} activeOpacity={0.7}>
              <Icon name="close" size={18} color="rgba(255,255,255,0.9)" />
            </TouchableOpacity>
          </View>

          {/* 3-metric strip */}
          <View style={d.metricStrip}>
            {[
              { kind: 'text' as const, label: 'Premium/yr', value: fmtAmount(policy.premium) },
              { kind: 'text' as const, label: 'Sum Insured', value: fmtAmount(policy.sumInsured) },
              { kind: 'status' as const, label: 'Status' },
            ].map((m, i) => (
              <View key={m.label} style={[d.metricItem, i > 0 && d.metricBorder]}>
                {m.kind === 'status' ? (
                  <>
                    <StatusTag statusKey={policy.status} compact />
                    <Text style={d.metricLbl}>{m.label}</Text>
                  </>
                ) : (
                  <>
                    <Text style={d.metricVal}>{m.value}</Text>
                    <Text style={d.metricLbl}>{m.label}</Text>
                  </>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Scrollable body */}
        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: SCREEN_H * 0.52 }}>
          <View style={d.body}>

            {/* Coverage progress */}
            {(policy.status === 'active' || policy.status === 'expired') && (
              <View style={d.section}>
                <Text style={d.sectionTitle}>Coverage Period</Text>
                <View style={d.progressRow}>
                  <Text style={d.progressDate}>{fmtDate(policy.startDate)}</Text>
                  <Text style={d.progressDate}>{fmtDate(policy.endDate)}</Text>
                </View>
                <View style={d.progressTrack}>
                  <View style={[d.progressFill, { width: `${pct}%` as any, backgroundColor: pct >= 100 ? Colors.error : type.color }]} />
                </View>
                <View style={d.progressMeta}>
                  {policy.status === 'active' && days > 0 ? (
                    <Text style={[d.progressCaption, expiring && { color: '#D97706' }]}>
                      {expiring ? `⚠ Expires in ${days} days` : `${days} days remaining`}
                    </Text>
                  ) : (
                    <Text style={[d.progressCaption, { color: Colors.error }]}>Coverage ended</Text>
                  )}
                  <Text style={d.progressCaption}>{pct}% elapsed</Text>
                </View>
              </View>
            )}

            {/* Provider */}
            <View style={d.section}>
              <Text style={d.sectionTitle}>Provider</Text>
              <View style={d.infoRow}>
                <View style={[d.infoIcon, { backgroundColor: type.lightBg }]}>
                  <Icon name="business-outline" size={16} color={type.color} />
                </View>
                <Text style={d.infoText}>{policy.provider}</Text>
              </View>
            </View>

            {/* Feature 5: Policy Endorsement & Revised Policy Downloads */}
            <View style={d.section}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={d.sectionTitle}>Policy Endorsements</Text>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                  onPress={() => setShowEndorsementModal(true)}
                >
                  <Icon name="create-outline" size={14} color={Colors.primary} />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.primary }}>Request Endorsement</Text>
                </TouchableOpacity>
              </View>

              {endorsements.length > 0 ? (
                <View style={{ gap: 8 }}>
                  {endorsements.map((end) => (
                    <View key={end.id} style={d.endorsementItem}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={{ fontSize: 13, fontWeight: '800', color: Colors.text }}>
                            {end.endorsementNumber} ({end.category.replace('_', ' ').toUpperCase()})
                          </Text>
                          <View style={[d.statusBadge, end.status === 'approved' ? d.statusApproved : d.statusPending]}>
                            <Text style={d.statusBadgeText}>{end.status.toUpperCase()}</Text>
                          </View>
                        </View>
                        <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 4 }}>
                          Changes: {end.requestedChanges}
                        </Text>
                        {!!end.revisedDocumentUrl && (
                          <TouchableOpacity
                            style={d.downloadRevisedBtn}
                            onPress={() => WebBrowser.openBrowserAsync(end.revisedDocumentUrl!)}
                            activeOpacity={0.8}
                          >
                            <Icon name="download-outline" size={14} color="#fff" />
                            <Text style={d.downloadRevisedBtnText}>Download Revised Policy PDF</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={d.noEndorsementBox}>
                  <Text style={d.noDocText}>No endorsements requested for this policy</Text>
                </View>
              )}
            </View>

            {/* Payment */}
            <View style={d.section}>
              <Text style={d.sectionTitle}>Payment</Text>
              <View style={d.infoRow}>
                <View style={[d.infoIcon, { backgroundColor: policy.paymentStatus === 'paid' ? Colors.successLight : '#FFFBEB' }]}>
                  <Icon name="card-outline" size={16} color={policy.paymentStatus === 'paid' ? Colors.success : Colors.warning} />
                </View>
                <View>
                  <Text style={d.infoText}>
                    {policy.paymentStatus === 'paid' ? 'Payment Confirmed' : 'Payment Pending'}
                  </Text>
                  <Text style={d.infoSub}>₹{policy.premium.toLocaleString('en-IN')} / year</Text>
                </View>
              </View>
            </View>

              {/* Document */}
              <View style={d.section}>
                <Text style={d.sectionTitle}>Policy Document & Certificate</Text>
                <TouchableOpacity
                  style={[d.docBtn, { borderColor: type.color + '40' }]}
                  onPress={() => {
                    onClose();
                    onShowCertificate(policy);
                  }}
                  activeOpacity={0.75}>
                  <View style={[d.docIconWrap, { backgroundColor: type.lightBg }]}>
                    <Icon name="document-text" size={20} color={type.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[d.docBtnTitle, { color: type.color }]}>View & Download Certificate</Text>
                    <Text style={d.docBtnSub}>Official IRDAI policy schedule & certificate</Text>
                  </View>
                  <Icon name="open-outline" size={16} color={type.color} />
                </TouchableOpacity>
              </View>

          </View>
        </ScrollView>
      </Animated.View>

      {/* Endorsement Request Modal */}
      <Modal visible={showEndorsementModal} transparent animationType="fade">
        <Pressable style={d.modalBackdrop} onPress={() => setShowEndorsementModal(false)}>
          <View style={d.modalBox}>
            <Text style={d.modalTitle}>Request Policy Endorsement</Text>
            <Text style={d.modalSub}>Specify the correction or policy change required</Text>

            <Text style={d.inputLabel}>Endorsement Category</Text>
            <View style={d.categoryRow}>
              {[
                { id: 'name_correction', label: 'Name' },
                { id: 'address_update', label: 'Address' },
                { id: 'nominee_change', label: 'Nominee' },
                { id: 'vehicle_reg_update', label: 'Vehicle' },
                { id: 'sum_insured_change', label: 'Cover Sum' }
              ].map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[d.catPill, category === cat.id && d.catPillActive]}
                  onPress={() => setCategory(cat.id)}
                >
                  <Text style={[d.catText, category === cat.id && d.catTextActive]}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={d.inputLabel}>Requested Changes / Details</Text>
            <TextInput
              style={d.textArea}
              placeholder="e.g. Correct policyholder name to Rajesh Kumar Sharma..."
              placeholderTextColor={Colors.textLight}
              value={requestedChanges}
              onChangeText={setRequestedChanges}
              multiline
              numberOfLines={4}
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <TouchableOpacity
                style={d.cancelModalBtn}
                onPress={() => setShowEndorsementModal(false)}
              >
                <Text style={d.cancelModalText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={d.submitModalBtn}
                onPress={handleSubmitEndorsement}
                disabled={submitting}
              >
                <Text style={d.submitModalText}>{submitting ? 'Submitting...' : 'Submit Request'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </Modal>
  );
}

// ── Filter tabs ───────────────────────────────────────────────────────────────

const TABS = ['All', 'Active', 'Claimed', 'Expired', 'Cancelled'] as const;
type Tab = typeof TABS[number];

// ── Policy card ───────────────────────────────────────────────────────────────

function PolicyCard({ policy, onPress }: { policy: ApiPolicy; onPress: () => void }) {
  const type   = TYPE_META[policy.type] ?? { color: '#1580FF', lightBg: '#EFF6FF', emoji: '📋', label: policy.type };
  const days   = daysLeft(policy.endDate);
  const pct    = coveragePct(policy.startDate, policy.endDate);
  const expiring = policy.status === 'active' && days > 0 && days <= 30;
  const iconName = (TYPE_ICONS[policy.type] ?? 'document-text-outline') as React.ComponentProps<typeof Icon>['name'];

  return (
    <TouchableOpacity style={c.card} onPress={onPress} activeOpacity={0.88}>
      <View style={c.inner}>
        {/* Top row */}
        <View style={c.topRow}>
          <View style={[c.iconRing, { borderColor: type.color + '22' }]}>
            <View style={[c.iconInner, { backgroundColor: type.lightBg }]}>
              <Icon name={iconName} size={20} color={type.color} />
            </View>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={c.provider} numberOfLines={1}>{policy.provider}</Text>
            <Text style={c.policyNum}>{policy.policyNumber}</Text>
            {!!(policy as any).registrationNumber && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                <Icon name="car" size={12} color={type.color} />
                <Text style={{ fontSize: 11, fontWeight: '800', color: type.color, letterSpacing: 0.5 }}>
                  {(policy as any).registrationNumber}
                </Text>
              </View>
            )}
          </View>
          <View style={c.statusTagSlot}>
            <StatusTag statusKey={policy.status} />
          </View>
        </View>

        {/* Metrics */}
        <View style={c.metrics}>
          <View style={c.metric}>
            <Text style={c.metricLbl}>Cover</Text>
            <Text style={c.metricVal}>{fmtAmount(policy.sumInsured)}</Text>
          </View>
          <View style={c.metricSep} />
          <View style={c.metric}>
            <Text style={c.metricLbl}>Premium / yr</Text>
            <Text style={[c.metricVal, { color: type.color }]}>{fmtAmount(policy.premium)}</Text>
          </View>
          <View style={c.metricSep} />
          <View style={c.metric}>
            <Text style={c.metricLbl}>Payment</Text>
            <Text style={[c.metricVal, { color: policy.paymentStatus === 'paid' ? Colors.success : Colors.warning }]}>
              {policy.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
            </Text>
          </View>
        </View>

        {/* Coverage bar (only for active / expired) */}
        {(policy.status === 'active' || policy.status === 'expired') && (
          <View style={c.coverBar}>
            <View style={c.coverTrack}>
              <View style={[c.coverFill, {
                width: `${pct}%` as any,
                backgroundColor: pct >= 100 ? Colors.error : expiring ? '#F59E0B' : type.color,
              }]} />
            </View>
            <View style={c.coverMeta}>
              <Text style={c.coverDate}>{fmtDate(policy.startDate)}</Text>
              {policy.status === 'active' && days > 0 ? (
                <Text style={[c.coverDays, expiring && c.coverExpiring]}>
                  {expiring ? `Expiring · ${days}d` : `${days}d left`}
                </Text>
              ) : (
                <Text style={c.coverDate}>{fmtDate(policy.endDate)}</Text>
              )}
            </View>
          </View>
        )}

        {/* Footer row */}
        <View style={c.footer}>
          {policy.documentUrl ? (
            <TouchableOpacity
              style={[c.docBtn, { borderColor: type.color + '40', backgroundColor: type.lightBg }]}
              onPress={() => WebBrowser.openBrowserAsync(policy.documentUrl!)}
              activeOpacity={0.7}
            >
              <Icon name="document-text-outline" size={18} color={type.color} />
              <Text style={[c.docHint, { color: type.color }]}>Open policy PDF</Text>
            </TouchableOpacity>
          ) : (
            <Text style={c.noDoc}>No document</Text>
          )}
          <Icon name="chevron-forward" size={16} color={Colors.textLight} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ tab }: { tab: Tab }) {
  const router = useRouter();
  const isAll  = tab === 'All';
  return (
    <View style={e.wrap}>
      <View style={e.iconWrap}>
        <Text style={{ fontSize: 52 }}>{isAll ? '📋' : tab === 'Active' ? '✅' : tab === 'Claimed' ? '🛡️' : '📁'}</Text>
      </View>
      <Text style={e.title}>{isAll ? 'No policies yet' : `No ${tab} policies`}</Text>
      <Text style={e.sub}>
        {isAll
          ? 'Browse our plans and get yourself and your family covered today.'
          : `You don't have any ${tab.toLowerCase()} policies right now.`}
      </Text>
      {isAll && (
        <TouchableOpacity style={e.btn} onPress={() => router.push('/(tabs)/plans')} activeOpacity={0.85}>
          <Icon name="shield-checkmark-outline" size={20} color="#fff" />
          <Text style={e.btnText}>Browse Plans</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function MyPoliciesScreen() {
  const { user } = useAuth();
  const [policies,   setPolicies]   = useState<ApiPolicy[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab,  setActiveTab]  = useState<Tab>('All');
  const [error,      setError]      = useState<string | null>(null);
  const [selected,   setSelected]   = useState<ApiPolicy | null>(null);
  const [searchReg,  setSearchReg]  = useState('');
  const [reportModalData, setReportModalData] = useState<ReportData | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const res = await policiesApi.list();
      setPolicies(res.policies);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load policies');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const stats = {
    total:    policies.length,
    active:   policies.filter(p => p.status === 'active').length,
    premium:  policies.filter(p => p.status === 'active').reduce((s, p) => s + p.premium, 0),
    expiring: policies.filter(p => p.status === 'active' && daysLeft(p.endDate) <= 30 && daysLeft(p.endDate) > 0).length,
  };

  let filtered = activeTab === 'All'
    ? policies
    : activeTab === 'Claimed'
    ? policies.filter(p => p.status === 'claimed' || p.status === 'settled')
    : policies.filter(p => p.status === activeTab.toLowerCase());

  if (searchReg.trim()) {
    const q = searchReg.toUpperCase().replace(/[^A-Z0-9]/g, '');
    filtered = filtered.filter(p => {
      const reg = (p as any).registrationNumber?.toUpperCase().replace(/[^A-Z0-9]/g, '') || '';
      const num = p.policyNumber.toUpperCase();
      const prov = p.provider.toUpperCase();
      return reg.includes(q) || num.includes(q) || prov.includes(q);
    });
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* ── Header ── */}
      <View style={s.header}>
        <BackButton />
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>My Policies</Text>
          {!loading && <Text style={s.headerSub}>{stats.active} active · {stats.total} total</Text>}
        </View>
        <View style={{ width: 40 }} />
      </View>

      {loading && !refreshing ? (
        <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 12, gap: 16 }} showsVerticalScrollIndicator={false}>
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </ScrollView>
      ) : error ? (
        <View style={s.center}>
          <Icon name="cloud-offline-outline" size={48} color={Colors.border} />
          <Text style={s.errorTitle}>Something went wrong</Text>
          <Text style={s.errorSub}>{error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => load()} activeOpacity={0.8}>
            <Icon name="refresh-outline" size={15} color="#fff" />
            <Text style={s.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Colors.primary} />}
        >
          {/* ── Vehicle Reg Number Search Bar ── */}
          <View style={s.searchContainer}>
            <Icon name="car-outline" size={20} color={Colors.primary} />
            <TextInput
              style={s.searchInput}
              placeholder="Search by Vehicle Reg Number (e.g. DL01AB1234)..."
              placeholderTextColor={Colors.textLight}
              value={searchReg}
              onChangeText={setSearchReg}
              autoCapitalize="characters"
            />
            {!!searchReg && (
              <TouchableOpacity onPress={() => setSearchReg('')}>
                <Icon name="close-circle" size={18} color={Colors.textLight} />
              </TouchableOpacity>
            )}
          </View>

          {/* ── Stats strip ── */}
          {policies.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.statsRow} style={s.statsScroll}>
              {[
                { icon: 'shield-checkmark' as const, label: 'Active',   value: String(stats.active),         color: Colors.success },
                { icon: 'layers-outline'  as const, label: 'Total',    value: String(stats.total),           color: Colors.primary },
                { icon: 'cash-outline'    as const, label: 'Premium',  value: fmtAmount(stats.premium),      color: '#7C3AED'      },
                { icon: 'time-outline'    as const, label: 'Expiring', value: String(stats.expiring),        color: '#D97706'      },
              ].map(stat => (
                <View key={stat.label} style={s.statCard}>
                  <View style={[s.statIconWrap, { backgroundColor: stat.color + '18' }]}>
                    <Icon name={stat.icon} size={20} color={stat.color} />
                  </View>
                  <Text style={[s.statValue, { color: stat.color }]}>{stat.value}</Text>
                  <Text style={s.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </ScrollView>
          )}

          {/* ── Filter tabs ── */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.tabRow} style={s.tabScroll}>
            {TABS.map(tab => {
              const count = tab === 'All'
                ? policies.length
                : tab === 'Claimed'
                ? policies.filter(p => p.status === 'claimed' || p.status === 'settled').length
                : policies.filter(p => p.status === tab.toLowerCase()).length;
              const active = activeTab === tab;
              const sm     = tab !== 'All' ? STATUS_META[tab.toLowerCase()] : null;
              return (
                <TouchableOpacity key={tab}
                  style={[s.tab, active && { backgroundColor: sm?.color ?? Colors.primary, borderColor: sm?.color ?? Colors.primary }]}
                  onPress={() => setActiveTab(tab)}
                  activeOpacity={0.75}>
                  <Text style={[s.tabText, active && s.tabTextActive]}>
                    {tab}{count > 0 ? ` ${count}` : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* ── List ── */}
          {filtered.length === 0 ? (
            <EmptyState tab={activeTab} />
          ) : (
            <View style={s.list}>
              {filtered.map(p => (
                <PolicyCard key={p.id} policy={p} onPress={() => setSelected(p)} />
              ))}
            </View>
          )}
        </ScrollView>
      )}

      <PolicySheet
        policy={selected}
        onClose={() => setSelected(null)}
        onShowCertificate={(p) => {
          setReportModalData({
            type: 'certificate',
            referenceId: p.policyNumber,
            insuranceType: p.type,
            status: p.status,
            date: fmtDate(p.startDate),
            validUntil: fmtDate(p.endDate),
            customerName: (p as any)?.userName || user?.name || 'Policyholder',
            customerPhone: (p as any)?.userPhone || user?.phone || '',
            customerEmail: (p as any)?.userEmail || user?.email || '',
            provider: p.provider,
            planName: `${p.provider} Comprehensive ${p.type.toUpperCase()}`,
            sumInsured: p.sumInsured,
            premium: p.premium,
            details: {
              registrationNumber: (p as any)?.registrationNumber,
            },
          });
        }}
      />
      <ReportModal
        visible={!!reportModalData}
        data={reportModalData}
        onClose={() => setReportModalData(null)}
      />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border,
  },
  headerCenter: { alignItems: 'center' },
  headerTitle:  { fontSize: 17, fontWeight: '800', color: Colors.text, letterSpacing: -0.3 },
  headerSub:    { fontSize: 11, color: Colors.textMuted, marginTop: 4 },

  center:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 40 },
  errorTitle:{ fontSize: 16, fontWeight: '800', color: Colors.text, marginTop: 4 },
  errorSub:  { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  retryBtn:  { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 28, paddingVertical: 15, backgroundColor: Colors.primary, borderRadius: 14, marginTop: 8, minWidth: 160, justifyContent: 'center' },
  retryText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  content:    { paddingTop: 12, paddingBottom: 56, paddingHorizontal: 20 },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    padding: 0,
  },

  statsScroll:{ flexGrow: 0, marginTop: 4 },
  statsRow:   { gap: 12, paddingRight: 4 },
  statCard:   { alignItems: 'center', backgroundColor: Colors.white, borderRadius: 16, paddingVertical: 18, paddingHorizontal: 20, gap: 8, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border, minWidth: 100 },
  statIconWrap:{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statValue:  { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  statLabel:  { fontSize: 10, color: Colors.textMuted, fontWeight: '600' },

  tabScroll:  { flexGrow: 0, marginTop: 22 },
  tabRow:     { gap: 10, paddingRight: 4 },
  tab: {
    paddingHorizontal: 18, paddingVertical: 11,
    borderRadius: 100, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white,
  },
  tabText:     { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  tabTextActive:{ color: '#fff' },

  list: { gap: 16, marginTop: 20 },
});

const c = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
      android: { elevation: 1 },
    }),
  },
  inner:    { padding: 20 },

  topRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  iconRing:  { borderWidth: 1, borderRadius: 12, padding: 1 },
  iconInner: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  provider:  { fontSize: 14, fontWeight: '800', color: Colors.text, flex: 1 },
  policyNum: { fontSize: 11, color: Colors.textMuted, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', marginTop: 1 },
  statusTagSlot: { flexShrink: 0, marginLeft: 4 },

  metrics:   {
    flexDirection: 'row',
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
  metric:    { flex: 1, alignItems: 'flex-start', gap: 4 },
  metricSep: { width: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginHorizontal: 8, alignSelf: 'stretch' },
  metricVal: { fontSize: 14, fontWeight: '800', color: Colors.text, letterSpacing: -0.3 },
  metricLbl: { fontSize: 10, color: Colors.textMuted, fontWeight: '600' },

  coverBar:      { marginBottom: 4 },
  coverTrack:    { height: 3, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden', marginBottom: 6 },
  coverFill:     { height: '100%', borderRadius: 2 },
  coverMeta:     { flexDirection: 'row', justifyContent: 'space-between' },
  coverDate:     { fontSize: 10, color: Colors.textMuted },
  coverDays:     { fontSize: 10, color: Colors.textMuted, fontWeight: '600' },
  coverExpiring: { color: '#D97706' },

  footer:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 2, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderColor: Colors.border },
  docBtn:      { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1 },
  docHint:     { fontSize: 15, fontWeight: '700' },
  noDoc:       { fontSize: 13, color: Colors.textLight },
});

const d = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10,22,40,0.5)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.15, shadowRadius: 24 },
      android: { elevation: 24 },
    }),
  },
  handleRow:  { alignItems: 'center', paddingTop: 12, paddingBottom: 14 },
  handlePill: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.35)' },

  hero: { paddingHorizontal: 20, paddingTop: 0, paddingBottom: 20, position: 'relative', overflow: 'hidden', borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  heroDecor1:{ position: 'absolute', right: -20, top: -20, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.08)' },
  heroDecor2:{ position: 'absolute', right: 40, bottom: -30, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.06)' },
  heroTop:   { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  heroIcon:  { width: 52, height: 52, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  heroLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  heroNum:   { fontSize: 17, fontWeight: '900', color: '#fff', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', letterSpacing: -0.3 },
  closeBtn:  { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },

  metricStrip: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, overflow: 'hidden' },
  metricItem:  { flex: 1, alignItems: 'center', paddingVertical: 10 },
  metricBorder:{ borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.15)' },
  metricVal:   { fontSize: 15, fontWeight: '800', color: '#fff' },
  metricLbl:   { fontSize: 9, color: 'rgba(255,255,255,0.65)', marginTop: 2, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },

  body:    { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 8, gap: 24 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 },

  progressRow:     { flexDirection: 'row', justifyContent: 'space-between' },
  progressDate:    { fontSize: 11, color: Colors.textMuted },
  progressTrack:   { height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden', marginVertical: 6 },
  progressFill:    { height: '100%', borderRadius: 3 },
  progressMeta:    { flexDirection: 'row', justifyContent: 'space-between' },
  progressCaption: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },

  infoRow:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoIcon:   { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  infoText:   { fontSize: 14, fontWeight: '700', color: Colors.text },
  infoSub:    { fontSize: 12, color: Colors.textMuted, marginTop: 2 },

  noteBox:  { flexDirection: 'row', gap: 8, backgroundColor: '#EFF6FF', borderRadius: 10, padding: 12, alignItems: 'flex-start' },
  noteText: { flex: 1, fontSize: 13, color: Colors.text, lineHeight: 19 },

  docBtn:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1.5, backgroundColor: Colors.bg },
  docIconWrap:{ width: 42, height: 42, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  docBtnTitle:{ fontSize: 14, fontWeight: '800' },
  docBtnSub:  { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  noDocBox:   { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderRadius: 12, backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border },
  noDocText:  { fontSize: 13, color: Colors.textLight },

  endorsementItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  noEndorsementBox: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusPending: { backgroundColor: '#FEF3C7' },
  statusApproved: { backgroundColor: '#D1FAE5' },
  statusBadgeText: { fontSize: 9, fontWeight: '800', color: Colors.text },
  downloadRevisedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  downloadRevisedBtnText: { fontSize: 12, fontWeight: '800', color: '#fff' },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalBox: { width: '100%', backgroundColor: Colors.white, borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: Colors.text },
  modalSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2, marginBottom: 14 },
  inputLabel: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, marginTop: 10, marginBottom: 6, textTransform: 'uppercase' },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  catPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bg },
  catPillActive: { borderColor: Colors.primary, backgroundColor: '#EFF6FF' },
  catText: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
  catTextActive: { fontWeight: '800', color: Colors.primary },
  textArea: {
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 12, padding: 12,
    fontSize: 13, color: Colors.text, height: 80, textAlignVertical: 'top', backgroundColor: '#F8FAFC',
  },
  cancelModalBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  cancelModalText: { fontSize: 14, fontWeight: '700', color: Colors.textMuted },
  submitModalBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: Colors.primary, alignItems: 'center' },
  submitModalText: { fontSize: 14, fontWeight: '800', color: '#fff' },
});

const e = StyleSheet.create({
  wrap:    { alignItems: 'center', paddingTop: 48, paddingHorizontal: 32, gap: 16 },
  iconWrap:{ width: 90, height: 90, borderRadius: 24, backgroundColor: Colors.bgWarm, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  title:   { fontSize: 19, fontWeight: '900', color: Colors.text, textAlign: 'center', letterSpacing: -0.3 },
  sub:     { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },
  btn:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, backgroundColor: Colors.primary, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 16, minWidth: 200, justifyContent: 'center' },
  btnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
});

const sk = StyleSheet.create({
  card:       { backgroundColor: Colors.white, borderRadius: 14, padding: 20, gap: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border },
  topRow:     { flexDirection: 'row', gap: 12, alignItems: 'center' },
  circle:     { width: 40, height: 40, borderRadius: 10, backgroundColor: Colors.bg },
  lineWide:   { height: 12, borderRadius: 6, backgroundColor: Colors.bg, width: '70%' },
  lineNarrow: { height: 10, borderRadius: 5, backgroundColor: Colors.bg, width: '45%' },
  divider:    { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginVertical: 2 },
  bottomRow:  { flexDirection: 'row', gap: 12 },
  lineShort:  { height: 10, borderRadius: 5, backgroundColor: Colors.bg, flex: 1 },
});
