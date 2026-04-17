import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { paymentsApi, ApiPayment } from '@/lib/api';
import { Icon } from '@/components/Icon';
import { BackButton } from '@/components/BackButton';
import { Colors } from '@/constants/theme';

function statusColor(status: string): string {
  switch (status) {
    case 'success': return Colors.success;
    case 'failed':  return Colors.error;
    case 'refunded': return Colors.textMuted;
    default:        return Colors.warning ?? '#D97706';
  }
}

function statusBg(status: string): string {
  switch (status) {
    case 'success': return Colors.successLight ?? Colors.success + '18';
    case 'failed':  return Colors.error + '18';
    case 'refunded': return Colors.bg;
    default:        return '#FEF3C7';
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'success': return 'Paid';
    case 'failed':  return 'Failed';
    case 'refunded': return 'Refunded';
    default:        return 'Pending';
  }
}

function typeIcon(type: string): string {
  const map: Record<string, string> = {
    life: '❤️', health: '🏥', motor: '🚗', travel: '✈️', home: '🏠', business: '💼',
  };
  return map[type] ?? '📋';
}

function formatAmount(amount: number): string {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
  if (amount >= 1000)   return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <View style={e.wrap}>
      <View style={e.iconCircle}>
        <Icon name="card-outline" size={36} color={Colors.silver} />
      </View>
      <Text style={e.title}>No payments yet</Text>
      <Text style={e.sub}>
        Your premium payment history will appear here once you have active policies.
      </Text>
    </View>
  );
}

// ── Payment row ───────────────────────────────────────────────────────────────

function PaymentRow({ item }: { item: ApiPayment }) {
  const color = statusColor(item.status);
  const bg    = statusBg(item.status);
  const label = statusLabel(item.status);

  return (
    <View style={p.row}>
      <View style={p.left}>
        <Text style={p.emoji}>{typeIcon(item.policy.type)}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={p.provider} numberOfLines={1}>{item.policy.provider}</Text>
        <Text style={p.meta}>
          {item.policy.type.charAt(0).toUpperCase() + item.policy.type.slice(1)} · {item.policy.policyNumber}
        </Text>
        <Text style={p.date}>{formatDate(item.createdAt)}</Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        <Text style={[p.amount, { color }]}>{formatAmount(item.amount)}</Text>
        <View style={[p.badge, { backgroundColor: bg }]}>
          <Text style={[p.badgeText, { color }]}>{label}</Text>
        </View>
      </View>
    </View>
  );
}

// ── Summary bar ───────────────────────────────────────────────────────────────

function SummaryBar({ payments }: { payments: ApiPayment[] }) {
  const total   = payments.filter(p => p.status === 'success').reduce((s, p) => s + p.amount, 0);
  const count   = payments.filter(p => p.status === 'success').length;
  const pending = payments.filter(p => p.status === 'pending').length;

  return (
    <View style={sb.row}>
      <View style={sb.box}>
        <Text style={sb.num}>{formatAmount(total)}</Text>
        <Text style={sb.lbl}>Total Paid</Text>
      </View>
      <View style={sb.div} />
      <View style={sb.box}>
        <Text style={sb.num}>{count}</Text>
        <Text style={sb.lbl}>Transactions</Text>
      </View>
      <View style={sb.div} />
      <View style={sb.box}>
        <Text style={[sb.num, pending > 0 && { color: Colors.warning ?? '#D97706' }]}>{pending}</Text>
        <Text style={sb.lbl}>Pending</Text>
      </View>
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

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <BackButton />
        <Text style={s.title}>Payment History</Text>
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
          {payments.length > 0 && <SummaryBar payments={payments} />}

          {payments.length === 0 ? (
            <EmptyState />
          ) : (
            <View style={s.card}>
              {payments.map((item, i) => (
                <View key={item.id}>
                  <PaymentRow item={item} />
                  {i < payments.length - 1 && <View style={s.divider} />}
                </View>
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
  title:   { fontSize: 17, fontWeight: '800', color: Colors.text },
  scroll:  { flex: 1 },
  content: { paddingBottom: 48 },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  errorText: { fontSize: 14, color: Colors.error, textAlign: 'center' },
  retryBtn:  { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: Colors.primary, borderRadius: 10 },
  retryText: { fontSize: 14, fontWeight: '700', color: Colors.white },
  card: {
    backgroundColor: Colors.white, marginHorizontal: 16, marginBottom: 16,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  divider: { height: 1, backgroundColor: Colors.bg, marginHorizontal: 16 },
});

const sb = StyleSheet.create({
  row: {
    flexDirection: 'row', backgroundColor: Colors.white,
    marginHorizontal: 16, marginTop: 16, marginBottom: 8,
    borderRadius: 14, borderWidth: 1, borderColor: Colors.border,
    paddingVertical: 14,
  },
  box:  { flex: 1, alignItems: 'center' },
  div:  { width: 1, backgroundColor: Colors.border },
  num:  { fontSize: 20, fontWeight: '900', color: Colors.primary, letterSpacing: -0.4 },
  lbl:  { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
});

const p = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  left:      { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
  emoji:     { fontSize: 20 },
  provider:  { fontSize: 14, fontWeight: '700', color: Colors.text },
  meta:      { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  date:      { fontSize: 11, color: Colors.textLight, marginTop: 1 },
  amount:    { fontSize: 15, fontWeight: '800' },
  badge:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: '700' },
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
});
