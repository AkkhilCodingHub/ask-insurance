import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Animated, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { paymentsApi, ApiPayment } from '@/lib/api';
import { Icon } from '@/components/Icon';
import { BackButton } from '@/components/BackButton';
import { Colors } from '@/constants/theme';

const { width: W } = Dimensions.get('window');

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

const TYPE_EMOJI: Record<string, string> = {
  life: '❤️', health: '🏥', motor: '🚗', travel: '✈️',
  home: '🏠', business: '💼', fire: '🔥', marine: '⚓',
  engineering: '⚙️', liability: '⚖️',
};

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  success:  { label: 'Paid',     color: '#059669', bg: '#D1FAE5', icon: 'checkmark-circle' },
  pending:  { label: 'Pending',  color: '#D97706', bg: '#FEF3C7', icon: 'time'             },
  failed:   { label: 'Failed',   color: '#DC2626', bg: '#FEE2E2', icon: 'close-circle'     },
  refunded: { label: 'Refunded', color: '#6B7280', bg: '#F3F4F6', icon: 'refresh-circle'   },
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
      <View style={sk.band} />
      <View style={sk.body}>
        <View style={sk.row}>
          <Shimmer width={42} height={42} radius={13} />
          <View style={{ flex: 1, gap: 7 }}>
            <Shimmer width="55%" height={14} />
            <Shimmer width="35%" height={11} />
          </View>
          <View style={{ alignItems: 'flex-end', gap: 7 }}>
            <Shimmer width={60} height={16} />
            <Shimmer width={44} height={20} radius={10} />
          </View>
        </View>
        <View style={sk.footer}>
          <Shimmer width={120} height={11} />
          <Shimmer width={80}  height={11} />
        </View>
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
  const emoji   = TYPE_EMOJI[item.policy?.type ?? ''] ?? '📋';
  const typeStr = item.policy?.type ?? '';
  const typeCap = typeStr.charAt(0).toUpperCase() + typeStr.slice(1);

  return (
    <View style={pc.card}>
      {/* Left colour band */}
      <View style={[pc.band, { backgroundColor: color }]} />

      <View style={pc.body}>
        {/* Top row */}
        <View style={pc.top}>
          <View style={[pc.avatar, { backgroundColor: color + '18' }]}>
            <Text style={pc.emoji}>{emoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={pc.provider} numberOfLines={1}>{item.policy?.provider ?? 'Insurance'}</Text>
            <Text style={pc.meta}>{typeCap} · {item.policy?.policyNumber ?? '—'}</Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 5 }}>
            <Text style={[pc.amount, { color }]}>{formatAmount(item.amount)}</Text>
            <View style={[pc.badge, { backgroundColor: st.bg }]}>
              <Icon name={st.icon as any} size={10} color={st.color} />
              <Text style={[pc.badgeText, { color: st.color }]}>{st.label}</Text>
            </View>
          </View>
        </View>

        {/* Footer row */}
        <View style={pc.footer}>
          <View style={pc.footerLeft}>
            <Icon name="calendar-outline" size={11} color={Colors.textLight} />
            <Text style={pc.footerText}>{formatDate(item.createdAt)}</Text>
          </View>
          <View style={pc.footerLeft}>
            <Icon name="time-outline" size={11} color={Colors.textLight} />
            <Text style={pc.footerText}>{formatTime(item.createdAt)}</Text>
          </View>
          {item.providerRef && (
            <Text style={pc.ref} numberOfLines={1}>
              Ref: {item.providerRef.slice(-8).toUpperCase()}
            </Text>
          )}
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
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
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

  listWrap: { padding: 16, gap: 12 },

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

// Payment card
const pc = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  band: { width: 4 },
  body: { flex: 1, padding: 14 },
  top: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  emoji:    { fontSize: 22 },
  provider: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  meta:     { fontSize: 11, color: Colors.textMuted },
  amount:   { fontSize: 16, fontWeight: '900', letterSpacing: -0.3 },
  badge:    { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText:{ fontSize: 10, fontWeight: '700' },

  footer: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderTopWidth: 1, borderTopColor: Colors.bg,
    paddingTop: 10,
  },
  footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 11, color: Colors.textLight },
  ref:        { flex: 1, fontSize: 10, color: Colors.textLight, textAlign: 'right', fontFamily: 'monospace' },
});

// Skeleton
const sk = StyleSheet.create({
  card: {
    flexDirection: 'row', backgroundColor: Colors.white,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  band:   { width: 4, backgroundColor: Colors.border },
  body:   { flex: 1, padding: 14, gap: 12 },
  row:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: Colors.bg, paddingTop: 10 },
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
