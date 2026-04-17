import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { policiesApi, ApiPolicy } from '@/lib/api';
import { Icon } from '@/components/Icon';
import { Colors } from '@/constants/theme';

// ── Helpers ───────────────────────────────────────────────────────────────────

function policyColor(type: string): string {
  const map: Record<string, string> = {
    life: '#1580FF', health: '#059669', motor: '#0891B2',
    travel: '#D97706', home: '#7C3AED', business: '#E11D48',
  };
  return map[type] ?? '#1580FF';
}

function typeEmoji(type: string): string {
  const map: Record<string, string> = {
    life: '❤️', health: '🏥', motor: '🚗', travel: '✈️', home: '🏠', business: '💼',
  };
  return map[type] ?? '📋';
}

function formatAmount(v: number): string {
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)}Cr`;
  if (v >= 100000)   return `₹${(v / 100000).toFixed(2)}L`;
  if (v >= 1000)     return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${v}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function daysRemaining(endDate: string): number {
  const ms = new Date(endDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

function statusColor(status: string): string {
  switch (status) {
    case 'active':    return Colors.success;
    case 'expired':   return Colors.textMuted;
    case 'cancelled': return Colors.error;
    default:          return Colors.textMuted;
  }
}

function statusBg(status: string): string {
  switch (status) {
    case 'active':    return Colors.successLight ?? Colors.success + '18';
    case 'expired':   return Colors.bg;
    case 'cancelled': return Colors.error + '18';
    default:          return Colors.bg;
  }
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

const TABS = ['All', 'Active', 'Expired', 'Cancelled'] as const;
type Tab = typeof TABS[number];

// ── Policy card ───────────────────────────────────────────────────────────────

function PolicyCard({ policy, onPress }: { policy: ApiPolicy; onPress: () => void }) {
  const color = policyColor(policy.type);
  const days  = daysRemaining(policy.endDate);
  const expiringSoon = policy.status === 'active' && days <= 30 && days > 0;

  return (
    <TouchableOpacity style={c.card} onPress={onPress} activeOpacity={0.8}>
      {/* Colored header strip */}
      <View style={[c.strip, { backgroundColor: color }]}>
        <Text style={c.emoji}>{typeEmoji(policy.type)}</Text>
        <View style={{ flex: 1 }}>
          <Text style={c.provider}>{policy.provider}</Text>
          <Text style={c.policyNum}>{policy.policyNumber}</Text>
        </View>
        <View style={[c.statusBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
          <Text style={c.statusBadgeText}>{policy.status.toUpperCase()}</Text>
        </View>
      </View>

      {/* Body */}
      <View style={c.body}>
        <View style={c.metricsRow}>
          <View style={c.metric}>
            <Text style={c.metricLabel}>Cover</Text>
            <Text style={c.metricValue}>{formatAmount(policy.sumInsured)}</Text>
          </View>
          <View style={c.metricDivider} />
          <View style={c.metric}>
            <Text style={c.metricLabel}>Premium/yr</Text>
            <Text style={[c.metricValue, { color }]}>{formatAmount(policy.premium)}</Text>
          </View>
          <View style={c.metricDivider} />
          <View style={c.metric}>
            <Text style={c.metricLabel}>Payment</Text>
            <Text style={[
              c.metricValue,
              policy.paymentStatus === 'paid' ? { color: Colors.success } : { color: Colors.error }
            ]}>
              {policy.paymentStatus.charAt(0).toUpperCase() + policy.paymentStatus.slice(1)}
            </Text>
          </View>
        </View>

        <View style={c.footer}>
          <View style={c.dates}>
            <Text style={c.dateLabel}>
              {formatDate(policy.startDate)} → {formatDate(policy.endDate)}
            </Text>
          </View>
          {expiringSoon && (
            <View style={c.expireBadge}>
              <Text style={c.expireText}>Expires in {days}d</Text>
            </View>
          )}
          {policy.status === 'active' && !expiringSoon && (
            <Text style={c.daysLeft}>{days}d left</Text>
          )}
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
      <View style={e.iconCircle}>
        <Icon name="document-text-outline" size={36} color={Colors.silver} />
      </View>
      <Text style={e.title}>
        {isAll ? 'No policies yet' : `No ${tab.toLowerCase()} policies`}
      </Text>
      <Text style={e.sub}>
        {isAll
          ? 'Browse our plans and get covered today.'
          : `You don't have any ${tab.toLowerCase()} policies at the moment.`}
      </Text>
      {isAll && (
        <TouchableOpacity style={e.btn} onPress={() => router.push('/(tabs)/plans')}>
          <Text style={e.btnText}>Browse plans</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function MyPoliciesScreen() {
  const router = useRouter();
  const [policies,   setPolicies]   = useState<ApiPolicy[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab,  setActiveTab]  = useState<Tab>('All');
  const [error,      setError]      = useState<string | null>(null);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
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

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = activeTab === 'All'
    ? policies
    : policies.filter(p => p.status === activeTab.toLowerCase());

  const activePolicies  = policies.filter(p => p.status === 'active').length;
  const expiredPolicies = policies.filter(p => p.status === 'expired').length;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Icon name="arrow-back-outline" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={s.title}>My Policies</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : error ? (
        <View style={s.center}>
          <Icon name="alert-circle-outline" size={40} color={Colors.error} />
          <Text style={s.errorText}>{error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => loadData()}>
            <Text style={s.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} />}
        >
          {/* Summary */}
          {policies.length > 0 && (
            <View style={s.summaryRow}>
              <View style={s.summaryBox}>
                <Text style={s.summaryNum}>{activePolicies}</Text>
                <Text style={s.summaryLbl}>Active</Text>
              </View>
              <View style={s.summaryDiv} />
              <View style={s.summaryBox}>
                <Text style={s.summaryNum}>{policies.length}</Text>
                <Text style={s.summaryLbl}>Total</Text>
              </View>
              <View style={s.summaryDiv} />
              <View style={s.summaryBox}>
                <Text style={[s.summaryNum, expiredPolicies > 0 && { color: Colors.textMuted }]}>
                  {expiredPolicies}
                </Text>
                <Text style={s.summaryLbl}>Expired</Text>
              </View>
            </View>
          )}

          {/* Tabs */}
          <ScrollView
            horizontal showsHorizontalScrollIndicator={false}
            style={s.tabScroll} contentContainerStyle={s.tabContainer}
          >
            {TABS.map(tab => {
              const count = tab === 'All'
                ? policies.length
                : policies.filter(p => p.status === tab.toLowerCase()).length;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[s.tab, activeTab === tab && s.tabActive]}
                  onPress={() => setActiveTab(tab)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
                    {tab} {count > 0 ? `(${count})` : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* List */}
          {filtered.length === 0 ? (
            <EmptyState tab={activeTab} />
          ) : (
            <View style={s.list}>
              {filtered.map(policy => (
                <PolicyCard
                  key={policy.id}
                  policy={policy}
                  onPress={() => {/* future: router.push(`/policy/${policy.id}`) */}}
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bg },
  header:  {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn:  { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title:    { fontSize: 17, fontWeight: '800', color: Colors.text },
  scroll:   { flex: 1 },
  content:  { paddingBottom: 48 },
  center:   { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  errorText:{ fontSize: 14, color: Colors.error, textAlign: 'center' },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: Colors.primary, borderRadius: 10 },
  retryText:{ fontSize: 14, fontWeight: '700', color: Colors.white },
  list:     { paddingHorizontal: 16, gap: 12, paddingTop: 4 },

  summaryRow: {
    flexDirection: 'row', backgroundColor: Colors.white,
    marginHorizontal: 16, marginTop: 16, marginBottom: 4,
    borderRadius: 14, borderWidth: 1, borderColor: Colors.border,
    paddingVertical: 14,
  },
  summaryBox:{ flex: 1, alignItems: 'center' },
  summaryDiv:{ width: 1, backgroundColor: Colors.border },
  summaryNum:{ fontSize: 22, fontWeight: '900', color: Colors.primary, letterSpacing: -0.5 },
  summaryLbl:{ fontSize: 10, color: Colors.textMuted, marginTop: 2 },

  tabScroll:     { flexGrow: 0, marginVertical: 12 },
  tabContainer:  { paddingHorizontal: 16, gap: 8 },
  tab: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5,
    borderColor: Colors.border, backgroundColor: Colors.white,
  },
  tabActive:     { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText:       { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  tabTextActive: { color: Colors.white },
});

const c = StyleSheet.create({
  card: {
    backgroundColor: Colors.white, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  strip: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  emoji:           { fontSize: 24 },
  provider:        { fontSize: 14, fontWeight: '800', color: Colors.white },
  policyNum:       { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 1 },
  statusBadge:     { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusBadgeText: { fontSize: 10, fontWeight: '800', color: Colors.white },
  body:            { padding: 14 },
  metricsRow:      { flexDirection: 'row', marginBottom: 12 },
  metric:          { flex: 1, alignItems: 'center' },
  metricDivider:   { width: 1, backgroundColor: Colors.border },
  metricLabel:     { fontSize: 10, color: Colors.textMuted, marginBottom: 3 },
  metricValue:     { fontSize: 14, fontWeight: '800', color: Colors.text },
  footer:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dates:           { flex: 1 },
  dateLabel:       { fontSize: 11, color: Colors.textMuted },
  expireBadge:     { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  expireText:      { fontSize: 10, fontWeight: '700', color: '#D97706' },
  daysLeft:        { fontSize: 11, color: Colors.textMuted },
});

const e = StyleSheet.create({
  wrap:       { alignItems: 'center', paddingTop: 64, paddingHorizontal: 40, gap: 12 },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.bg, borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  title: { fontSize: 18, fontWeight: '800', color: Colors.text, textAlign: 'center' },
  sub:   { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  btn:   { marginTop: 8, backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  btnText: { fontSize: 14, fontWeight: '700', color: Colors.white },
});
