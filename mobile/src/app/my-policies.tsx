import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, Modal, Animated, Dimensions, Platform,
  StatusBar, Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { policiesApi, ApiPolicy } from '@/lib/api';
import { Icon } from '@/components/Icon';
import { BackButton } from '@/components/BackButton';
import { Colors } from '@/constants/theme';

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

const STATUS_META: Record<string, { color: string; bg: string; label: string }> = {
  active:    { color: '#059669', bg: '#ECFDF5', label: 'Active'    },
  pending:   { color: '#D97706', bg: '#FFFBEB', label: 'Pending'   },
  expired:   { color: '#DC2626', bg: '#FEF2F2', label: 'Expired'   },
  cancelled: { color: '#64748B', bg: '#F8FAFC', label: 'Cancelled' },
};

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

function PolicySheet({ policy, onClose }: { policy: ApiPolicy | null; onClose: () => void }) {
  const insets  = useSafeAreaInsets();
  const slideY  = useRef(new Animated.Value(SCREEN_H)).current;
  const visible = !!policy;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideY, {
        toValue: 0, damping: 22, stiffness: 260, useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideY, {
        toValue: SCREEN_H, duration: 220, useNativeDriver: true,
      }).start();
    }
  }, [visible, slideY]);

  if (!policy) return null;

  const type   = TYPE_META[policy.type] ?? { color: '#1580FF', lightBg: '#EFF6FF', emoji: '📋', label: policy.type };
  const status = STATUS_META[policy.status] ?? STATUS_META.cancelled;
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
              { label: 'Premium/yr', value: fmtAmount(policy.premium) },
              { label: 'Sum Insured', value: fmtAmount(policy.sumInsured) },
              { label: 'Status', value: policy.status.charAt(0).toUpperCase() + policy.status.slice(1) },
            ].map((m, i) => (
              <View key={m.label} style={[d.metricItem, i > 0 && d.metricBorder]}>
                <Text style={d.metricVal}>{m.value}</Text>
                <Text style={d.metricLbl}>{m.label}</Text>
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

            {/* Admin notes */}
            {!!policy.notes && (
              <View style={d.section}>
                <Text style={d.sectionTitle}>Note from Insurer</Text>
                <View style={d.noteBox}>
                  <Icon name="information-circle-outline" size={15} color="#1580FF" />
                  <Text style={d.noteText}>{policy.notes}</Text>
                </View>
              </View>
            )}

            {/* Document */}
            <View style={d.section}>
              <Text style={d.sectionTitle}>Policy Document</Text>
              {policy.documentUrl ? (
                <TouchableOpacity
                  style={[d.docBtn, { borderColor: type.color + '40' }]}
                  onPress={() => WebBrowser.openBrowserAsync(policy.documentUrl!)}
                  activeOpacity={0.75}>
                  <View style={[d.docIconWrap, { backgroundColor: type.lightBg }]}>
                    <Icon name="document-text" size={20} color={type.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[d.docBtnTitle, { color: type.color }]}>View & Download Document</Text>
                    <Text style={d.docBtnSub}>Official policy certificate</Text>
                  </View>
                  <Icon name="open-outline" size={16} color={type.color} />
                </TouchableOpacity>
              ) : (
                <View style={d.noDocBox}>
                  <Icon name="document-outline" size={18} color={Colors.textLight} />
                  <Text style={d.noDocText}>Document not yet uploaded</Text>
                </View>
              )}
            </View>

          </View>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

// ── Filter tabs ───────────────────────────────────────────────────────────────

const TABS = ['All', 'Active', 'Pending', 'Expired', 'Cancelled'] as const;
type Tab = typeof TABS[number];

// ── Policy card ───────────────────────────────────────────────────────────────

function PolicyCard({ policy, onPress }: { policy: ApiPolicy; onPress: () => void }) {
  const type   = TYPE_META[policy.type] ?? { color: '#1580FF', lightBg: '#EFF6FF', emoji: '📋', label: policy.type };
  const status = STATUS_META[policy.status] ?? STATUS_META.cancelled;
  const days   = daysLeft(policy.endDate);
  const pct    = coveragePct(policy.startDate, policy.endDate);
  const expiring = policy.status === 'active' && days > 0 && days <= 30;

  return (
    <TouchableOpacity style={c.card} onPress={onPress} activeOpacity={0.92}>
      {/* Left color bar */}
      <View style={[c.colorBar, { backgroundColor: type.color }]} />

      <View style={c.inner}>
        {/* Top row */}
        <View style={c.topRow}>
          <View style={[c.emojiWrap, { backgroundColor: type.lightBg }]}>
            <Text style={c.emoji}>{type.emoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={c.provider} numberOfLines={1}>{policy.provider}</Text>
            <Text style={c.policyNum}>{policy.policyNumber}</Text>
          </View>
          <View style={[c.statusPill, { backgroundColor: status.bg }]}>
            <View style={[c.statusDot, { backgroundColor: status.color }]} />
            <Text style={[c.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        {/* Metrics */}
        <View style={c.metrics}>
          <View style={c.metric}>
            <Text style={c.metricVal}>{fmtAmount(policy.sumInsured)}</Text>
            <Text style={c.metricLbl}>Cover</Text>
          </View>
          <View style={c.metricSep} />
          <View style={c.metric}>
            <Text style={[c.metricVal, { color: type.color }]}>{fmtAmount(policy.premium)}</Text>
            <Text style={c.metricLbl}>Premium/yr</Text>
          </View>
          <View style={c.metricSep} />
          <View style={c.metric}>
            <Text style={[c.metricVal, { color: policy.paymentStatus === 'paid' ? Colors.success : Colors.warning }]}>
              {policy.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
            </Text>
            <Text style={c.metricLbl}>Payment</Text>
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
                  {expiring ? `⚠ ${days}d left` : `${days}d left`}
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
              style={[c.docChip, { borderColor: type.color + '30', backgroundColor: type.lightBg }]}
              onPress={e => { WebBrowser.openBrowserAsync(policy.documentUrl!); }}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon name="document-text-outline" size={11} color={type.color} />
              <Text style={[c.docChipText, { color: type.color }]}>View Document</Text>
            </TouchableOpacity>
          ) : (
            <Text style={c.noDoc}>No document yet</Text>
          )}
          <View style={c.arrowWrap}>
            <Icon name="chevron-forward" size={14} color={Colors.textLight} />
          </View>
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
        <Text style={{ fontSize: 52 }}>{isAll ? '📋' : tab === 'Active' ? '✅' : tab === 'Pending' ? '⏳' : '📁'}</Text>
      </View>
      <Text style={e.title}>{isAll ? 'No policies yet' : `No ${tab} policies`}</Text>
      <Text style={e.sub}>
        {isAll
          ? 'Browse our plans and get yourself and your family covered today.'
          : `You don't have any ${tab.toLowerCase()} policies right now.`}
      </Text>
      {isAll && (
        <TouchableOpacity style={e.btn} onPress={() => router.push('/(tabs)/plans')} activeOpacity={0.85}>
          <Icon name="shield-checkmark-outline" size={16} color="#fff" />
          <Text style={e.btnText}>Browse Plans</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function MyPoliciesScreen() {
  const [policies,   setPolicies]   = useState<ApiPolicy[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab,  setActiveTab]  = useState<Tab>('All');
  const [error,      setError]      = useState<string | null>(null);
  const [selected,   setSelected]   = useState<ApiPolicy | null>(null);

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

  const filtered = activeTab === 'All'
    ? policies
    : policies.filter(p => p.status === activeTab.toLowerCase());

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
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} showsVerticalScrollIndicator={false}>
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
                    <Icon name={stat.icon} size={18} color={stat.color} />
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
              const count  = tab === 'All' ? policies.length : policies.filter(p => p.status === tab.toLowerCase()).length;
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

      <PolicySheet policy={selected} onClose={() => setSelected(null)} />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border,
  },
  headerCenter: { alignItems: 'center' },
  headerTitle:  { fontSize: 17, fontWeight: '800', color: Colors.text, letterSpacing: -0.3 },
  headerSub:    { fontSize: 11, color: Colors.textMuted, marginTop: 1 },

  center:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32 },
  errorTitle:{ fontSize: 16, fontWeight: '800', color: Colors.text, marginTop: 4 },
  errorSub:  { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  retryBtn:  { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 22, paddingVertical: 11, backgroundColor: Colors.primary, borderRadius: 12, marginTop: 8 },
  retryText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  content:    { paddingBottom: 40 },

  statsScroll:{ flexGrow: 0, marginTop: 16 },
  statsRow:   { paddingHorizontal: 16, gap: 10 },
  statCard:   { alignItems: 'center', backgroundColor: Colors.white, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16, gap: 5, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border, minWidth: 88 },
  statIconWrap:{ width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statValue:  { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  statLabel:  { fontSize: 10, color: Colors.textMuted, fontWeight: '600' },

  tabScroll:  { flexGrow: 0, marginTop: 14 },
  tabRow:     { paddingHorizontal: 16, gap: 8 },
  tab: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 100, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white,
  },
  tabText:     { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  tabTextActive:{ color: '#fff' },

  list: { paddingHorizontal: 16, gap: 10, marginTop: 14 },
});

const c = StyleSheet.create({
  card: {
    backgroundColor: Colors.white, borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border,
    overflow: 'hidden', flexDirection: 'row',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  colorBar: { width: 4 },
  inner:    { flex: 1, padding: 14 },

  topRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  emojiWrap: { width: 40, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  emoji:     { fontSize: 20 },
  provider:  { fontSize: 14, fontWeight: '800', color: Colors.text, flex: 1 },
  policyNum: { fontSize: 11, color: Colors.textMuted, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', marginTop: 1 },
  statusPill:{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 100 },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText:{ fontSize: 10, fontWeight: '700' },

  metrics:   { flexDirection: 'row', marginBottom: 12, backgroundColor: Colors.bg, borderRadius: 10, padding: 10 },
  metric:    { flex: 1, alignItems: 'center' },
  metricSep: { width: StyleSheet.hairlineWidth, backgroundColor: Colors.border },
  metricVal: { fontSize: 14, fontWeight: '800', color: Colors.text, letterSpacing: -0.3 },
  metricLbl: { fontSize: 9, color: Colors.textMuted, marginTop: 2, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },

  coverBar:      { marginBottom: 10 },
  coverTrack:    { height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden', marginBottom: 5 },
  coverFill:     { height: '100%', borderRadius: 2 },
  coverMeta:     { flexDirection: 'row', justifyContent: 'space-between' },
  coverDate:     { fontSize: 10, color: Colors.textMuted },
  coverDays:     { fontSize: 10, color: Colors.textMuted, fontWeight: '600' },
  coverExpiring: { color: '#D97706' },

  footer:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  docChip:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  docChipText: { fontSize: 11, fontWeight: '700' },
  noDoc:       { fontSize: 11, color: Colors.textLight },
  arrowWrap:   { padding: 2 },
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

  body:    { padding: 20, gap: 20 },
  section: { gap: 10 },
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
});

const e = StyleSheet.create({
  wrap:    { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40, gap: 12 },
  iconWrap:{ width: 90, height: 90, borderRadius: 24, backgroundColor: Colors.bgWarm, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  title:   { fontSize: 19, fontWeight: '900', color: Colors.text, textAlign: 'center', letterSpacing: -0.3 },
  sub:     { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  btn:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, backgroundColor: Colors.primary, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 13 },
  btnText: { fontSize: 14, fontWeight: '800', color: '#fff' },
});

const sk = StyleSheet.create({
  card:       { backgroundColor: Colors.white, borderRadius: 16, padding: 16, gap: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border },
  topRow:     { flexDirection: 'row', gap: 12, alignItems: 'center' },
  circle:     { width: 40, height: 40, borderRadius: 11, backgroundColor: Colors.bg },
  lineWide:   { height: 12, borderRadius: 6, backgroundColor: Colors.bg, width: '70%' },
  lineNarrow: { height: 10, borderRadius: 5, backgroundColor: Colors.bg, width: '45%' },
  divider:    { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border },
  bottomRow:  { flexDirection: 'row', gap: 12 },
  lineShort:  { height: 10, borderRadius: 5, backgroundColor: Colors.bg, flex: 1 },
});
