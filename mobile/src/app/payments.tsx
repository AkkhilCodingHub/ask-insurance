import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Animated, Platform,
} from 'react-native';
import type { ComponentProps } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { paymentsApi, ApiPayment } from '@/lib/api';
import { Icon } from '@/components/Icon';
import { BackButton } from '@/components/BackButton';
import { Colors } from '@/constants/theme';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatAmount(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
}

function formatAmountFull(n: number): string {
  return `₹${n.toLocaleString('en-IN')}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

type Filter = 'all' | 'success' | 'pending' | 'failed';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',     label: 'All'     },
  { key: 'success', label: 'Paid'    },
  { key: 'pending', label: 'Pending' },
  { key: 'failed',  label: 'Failed'  },
];

const TYPE_COLOR: Record<string, string> = {
  life: '#1580FF', health: '#059669', motor: '#D97706',
  fire: '#EA580C', marine: '#0891B2', engineering: '#7C3AED',
  liability: '#DC2626', home: '#7C3AED', travel: '#0891B2',
  business: '#E11D48',
};

const TYPE_ICONS: Record<string, string> = {
  life: 'heart-outline', health: 'medical-outline', motor: 'car-outline', travel: 'airplane-outline',
  home: 'home-outline', business: 'briefcase-outline', fire: 'flame-outline', marine: 'boat-outline',
  engineering: 'construct-outline', liability: 'scale-outline',
};

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: ComponentProps<typeof Icon>['name'] }> = {
  success:  { label: 'Paid',     color: '#059669', bg: '#ECFDF5', icon: 'checkmark-circle' },
  pending:  { label: 'Pending',  color: '#B45309', bg: '#FFFBEB', icon: 'time-outline' },
  failed:   { label: 'Failed',   color: '#B91C1C', bg: '#FEF2F2', icon: 'close-circle' },
  refunded: { label: 'Refunded', color: '#475569', bg: '#F1F5F9', icon: 'refresh-circle' },
};

// ── Shimmer skeleton ──────────────────────────────────────────────────────────

function Shimmer({ width, height, radius = 8, style }: {
  width: number | string; height: number; radius?: number; style?: object;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [anim]);
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });
  return (
    <Animated.View
      style={[{ width, height, borderRadius: radius, backgroundColor: Colors.border, opacity }, style]}
    />
  );
}

function PaymentCardSkeleton() {
  return (
    <View style={sk.card}>
      <View style={sk.row}>
        <Shimmer width={40} height={40} radius={10} />
        <View style={{ flex: 1, gap: 6 }}>
          <Shimmer width="60%" height={14} />
          <Shimmer width="40%" height={10} />
        </View>
        <Shimmer width={72} height={28} radius={8} />
      </View>
      <View style={sk.divider} />
      <View style={sk.metrics}>
        <Shimmer width="28%" height={12} />
        <Shimmer width="28%" height={12} />
        <Shimmer width="28%" height={12} />
      </View>
      <View style={sk.divider} />
      <View style={sk.footerRow}>
        <Shimmer width={100} height={10} />
        <Shimmer width={80} height={10} />
      </View>
    </View>
  );
}

// ── Hero stats ────────────────────────────────────────────────────────────────

function HeroStats({ payments }: { payments: ApiPayment[] }) {
  const paid    = payments.filter(p => p.status === 'success');
  const total   = paid.reduce((s, p) => s + p.amount, 0);
  const pending = payments.filter(p => p.status === 'pending').length;
  const failed  = payments.filter(p => p.status === 'failed').length;

  return (
    <View style={h.wrap}>
      {/* bg blobs */}
      <View style={h.blob1} />
      <View style={h.blob2} />

      <Text style={h.eyebrow}>TOTAL PREMIUMS PAID</Text>
      <Text style={h.total}>{formatAmountFull(total)}</Text>
      <Text style={h.sub}>{paid.length} successful transaction{paid.length !== 1 ? 's' : ''}</Text>

      <View style={h.chips}>
        <View style={h.chip}>
          <View style={[h.chipDot, { backgroundColor: '#34D399' }]} />
          <Text style={h.chipLabel}>{paid.length} Paid</Text>
        </View>
        {pending > 0 && (
          <View style={h.chip}>
            <View style={[h.chipDot, { backgroundColor: '#FCD34D' }]} />
            <Text style={h.chipLabel}>{pending} Pending</Text>
          </View>
        )}
        {failed > 0 && (
          <View style={h.chip}>
            <View style={[h.chipDot, { backgroundColor: '#F87171' }]} />
            <Text style={h.chipLabel}>{failed} Failed</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ── Payment card ──────────────────────────────────────────────────────────────

function PaymentCard({ item }: { item: ApiPayment }) {
  const st      = STATUS_CFG[item.status] ?? STATUS_CFG.pending;
  const color   = TYPE_COLOR[item.policy?.type ?? ''] ?? Colors.primary;
  const typeKey = item.policy?.type ?? '';
  const typeCap = typeKey ? typeKey.charAt(0).toUpperCase() + typeKey.slice(1) : 'Policy';
  const iconName = (TYPE_ICONS[typeKey] ?? 'document-text-outline') as ComponentProps<typeof Icon>['name'];

  return (
    <View style={pc.card}>
      <View style={pc.inner}>
        <View style={pc.topRow}>
          <View style={[pc.iconRing, { borderColor: color + '22' }]}>
            <View style={[pc.iconInner, { backgroundColor: color + '12' }]}>
              <Icon name={iconName} size={20} color={color} />
            </View>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={pc.provider} numberOfLines={1}>{item.policy?.provider ?? 'Insurance'}</Text>
            <Text style={pc.meta} numberOfLines={1}>{typeCap} · {item.policy?.policyNumber ?? '—'}</Text>
          </View>
          <View
            style={[
              pc.statusTag,
              { backgroundColor: st.bg, borderColor: st.color + '2A' },
            ]}
          >
            <Icon name={st.icon} size={12} color={st.color} />
            <Text style={[pc.statusText, { color: st.color }]}>{st.label}</Text>
          </View>
        </View>

        <View style={pc.metrics}>
          <View style={pc.metric}>
            <Text style={pc.metricLbl}>Amount</Text>
            <Text style={[pc.metricVal, { color }]}>{formatAmountFull(item.amount)}</Text>
          </View>
          <View style={pc.metricSep} />
          <View style={[pc.metric, { flex: 1.2 }]}>
            <Text style={pc.metricLbl}>Plan type</Text>
            <Text style={pc.metricVal} numberOfLines={1}>{typeCap}</Text>
          </View>
        </View>

        <View style={pc.footer}>
          <View style={pc.footerItem}>
            <Icon name="calendar-outline" size={14} color={Colors.textLight} />
            <Text style={pc.footerText}>{formatDate(item.createdAt)}</Text>
          </View>
          <View style={pc.footerItem}>
            <Icon name="time-outline" size={14} color={Colors.textLight} />
            <Text style={pc.footerText}>{formatTime(item.createdAt)}</Text>
          </View>
          {item.providerRef ? (
            <Text style={pc.ref} numberOfLines={1}>
              Ref · {item.providerRef.slice(-8).toUpperCase()}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ filter }: { filter: Filter }) {
  return (
    <View style={e.wrap}>
      <View style={e.circle}>
        <Icon name="card-outline" size={38} color={Colors.primary} />
      </View>
      <Text style={e.title}>
        {filter === 'all' ? 'No payments yet' : `No ${filter} payments`}
      </Text>
      <Text style={e.sub}>
        {filter === 'all'
          ? 'Your premium payment history will appear here once you have active policies.'
          : `You have no ${filter} transactions right now.`
        }
      </Text>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function PaymentsScreen() {
  const router = useRouter();
  const [payments,   setPayments]   = useState<ApiPayment[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [filter,     setFilter]     = useState<Filter>('all');

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await paymentsApi.list();
      setPayments(res.payments);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load payments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = filter === 'all' ? payments : payments.filter(p => p.status === filter);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* ── Header ── */}
      <View style={s.header}>
        <BackButton />
        <Text style={s.title}>Payments</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
          {[0, 1, 2, 3].map(i => <PaymentCardSkeleton key={i} />)}
        </ScrollView>
      ) : error ? (
        <View style={s.center}>
          <View style={s.errorCircle}>
            <Icon name="alert-circle-outline" size={36} color={Colors.error} />
          </View>
          <Text style={s.errorTitle}>Something went wrong</Text>
          <Text style={s.errorSub}>{error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => loadData()}>
            <Icon name="refresh-outline" size={16} color={Colors.white} />
            <Text style={s.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={s.scroll}
          contentContainerStyle={{ paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadData(true)}
              tintColor={Colors.primary}
            />
          }
        >
          {/* Hero */}
          {payments.length > 0 && <HeroStats payments={payments} />}

          {/* Filter tabs */}
          {payments.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={s.tabsScroll}
              contentContainerStyle={s.tabsContent}
            >
              {FILTERS.map(f => {
                const count = f.key === 'all' ? payments.length : payments.filter(p => p.status === f.key).length;
                const active = filter === f.key;
                return (
                  <TouchableOpacity
                    key={f.key}
                    style={[s.tab, active && s.tabActive]}
                    onPress={() => setFilter(f.key)}
                    activeOpacity={0.75}
                  >
                    <Text style={[s.tabLabel, active && s.tabLabelActive]}>{f.label}</Text>
                    {count > 0 && (
                      <View style={[s.tabBadge, active && s.tabBadgeActive]}>
                        <Text style={[s.tabBadgeText, active && s.tabBadgeTextActive]}>{count}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* Cards */}
          <View style={s.listWrap}>
            {filtered.length === 0 ? (
              <EmptyState filter={filter} />
            ) : (
              filtered.map(item => <PaymentCard key={item.id} item={item} />)
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title: { fontSize: 17, fontWeight: '800', color: Colors.text },

  tabsScroll:   { backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabsContent:  { paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  tabActive:          { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabLabel:           { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  tabLabelActive:     { color: Colors.white },
  tabBadge:           { backgroundColor: Colors.bg, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  tabBadgeActive:     { backgroundColor: 'rgba(255,255,255,0.25)' },
  tabBadgeText:       { fontSize: 10, fontWeight: '700', color: Colors.textMuted },
  tabBadgeTextActive: { color: Colors.white },

  listWrap: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 8, gap: 16 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  errorCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#FEE2E2',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  errorTitle: { fontSize: 17, fontWeight: '800', color: Colors.text },
  errorSub:   { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingHorizontal: 24, paddingVertical: 12, marginTop: 4,
  },
  retryText: { fontSize: 14, fontWeight: '700', color: Colors.white },
});

// Hero
const h = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20, paddingTop: 22, paddingBottom: 28,
    overflow: 'hidden',
  },
  blob1: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.07)', top: -60, right: -40,
  },
  blob2: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.05)', bottom: -30, left: 20,
  },
  eyebrow: {
    fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.55)',
    letterSpacing: 1.5, marginBottom: 6,
  },
  total: { fontSize: 38, fontWeight: '900', color: Colors.white, letterSpacing: -1 },
  sub:   { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 4 },
  chips: { flexDirection: 'row', gap: 10, marginTop: 16, flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
  },
  chipDot:   { width: 7, height: 7, borderRadius: 4 },
  chipLabel: { fontSize: 12, fontWeight: '600', color: Colors.white },
});

// Payment card (flat, aligned with My Policies)
const pc = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Platform.select({
      ios:     { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
      android: { elevation: 1 },
    }),
  },
  inner:    { padding: 20 },
  topRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  iconRing: { borderWidth: 1, borderRadius: 12, padding: 1 },
  iconInner:{ width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  provider: { fontSize: 15, fontWeight: '800', color: Colors.text, letterSpacing: -0.2 },
  meta:     { fontSize: 11, color: Colors.textMuted, marginTop: 2, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  statusTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, borderWidth: 1, flexShrink: 0, maxWidth: 108,
  },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.15 },

  metrics:  {
    flexDirection: 'row', paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderColor: Colors.border,
  },
  metric:   { flex: 1, alignItems: 'flex-start', gap: 4 },
  metricSep:{ width: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginHorizontal: 4, alignSelf: 'stretch' },
  metricLbl: { fontSize: 10, color: Colors.textMuted, fontWeight: '600' },
  metricVal: { fontSize: 14, fontWeight: '800', color: Colors.text, letterSpacing: -0.3 },

  footer:   {
    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10,
    marginTop: 4, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderColor: Colors.border,
    justifyContent: 'space-between',
  },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  footerText:  { fontSize: 12, color: Colors.textLight },
  ref:         { fontSize: 11, color: Colors.textLight, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
});

// Skeleton
const sk = StyleSheet.create({
  card: {
    backgroundColor: Colors.white, borderRadius: 14, padding: 20, gap: 12,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border,
  },
  row:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border },
  metrics: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between' },
});

// Empty
const e = StyleSheet.create({
  wrap:   { alignItems: 'center', paddingTop: 56, paddingHorizontal: 40, gap: 12 },
  circle: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  title: { fontSize: 18, fontWeight: '800', color: Colors.text, textAlign: 'center' },
  sub:   { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
});
