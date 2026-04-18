import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { quotesApi, ApiError } from '@/lib/api';
import { Icon } from '@/components/Icon';
import { BackButton } from '@/components/BackButton';
import { Colors } from '@/constants/theme';
import { useDialog } from '@/components/Dialog';

// ── Types ─────────────────────────────────────────────────────────────────────

type AdminResponse = {
  insurer:      string;
  planName:     string;
  netPremium:   number;
  gst:          number;
  totalPremium: number;
  notes?:       string;
};

type QuoteRequest = {
  id:             string;
  type:           string;
  details:        Record<string, unknown>;
  status:         string;
  adminResponse:  AdminResponse | null;
  adminResponseAt:string | null;
  approvedAt:     string | null;
  createdAt:      string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  life: '#1580FF', health: '#059669', motor: '#D97706',
  fire: '#EA580C', marine: '#0891B2', engineering: '#7C3AED', liability: '#DC2626',
};

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  pending:   { label: 'Awaiting Quote',  color: '#D97706', bg: '#FFFBEB', icon: 'time-outline' },
  responded: { label: 'Quote Ready',     color: '#1580FF', bg: '#EFF6FF', icon: 'checkmark-circle-outline' },
  approved:  { label: 'Payment Pending', color: '#7C3AED', bg: '#F5F3FF', icon: 'card-outline' },
  converted: { label: 'Completed',       color: '#059669', bg: '#ECFDF5', icon: 'shield-checkmark-outline' },
  expired:   { label: 'Expired',         color: '#6B7280', bg: '#F3F4F6', icon: 'close-circle-outline' },
};

function fmt(n: number) { return `₹${n.toLocaleString('en-IN')}`; }
function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Quote Card ────────────────────────────────────────────────────────────────

function QuoteCard({ q, onApprove }: { q: QuoteRequest; onApprove: (id: string) => void }) {
  const color    = TYPE_COLORS[q.type] ?? Colors.primary;
  const meta     = STATUS_META[q.status] ?? STATUS_META.pending;
  const details  = q.details ?? {};

  return (
    <View style={c.card}>
      {/* Header strip */}
      <View style={[c.strip, { backgroundColor: color }]}>
        <Text style={c.stripType}>{q.type.toUpperCase()}</Text>
        <View style={[c.statusBadge, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
          <Text style={c.statusText}>{meta.label}</Text>
        </View>
      </View>

      <View style={c.body}>
        {/* Requirements */}
        <View style={c.detailsRow}>
          {details.planName ? (
            <View style={c.detail}>
              <Text style={c.detailLabel}>Plan</Text>
              <Text style={c.detailValue} numberOfLines={1}>{String(details.planName)}</Text>
            </View>
          ) : null}
          {details.sumInsured ? (
            <View style={c.detail}>
              <Text style={c.detailLabel}>Cover</Text>
              <Text style={c.detailValue}>{fmt(Number(details.sumInsured))}</Text>
            </View>
          ) : null}
          {details.age ? (
            <View style={c.detail}>
              <Text style={c.detailLabel}>Age</Text>
              <Text style={c.detailValue}>{String(details.age)} yrs</Text>
            </View>
          ) : null}
          <View style={c.detail}>
            <Text style={c.detailLabel}>Requested</Text>
            <Text style={c.detailValue}>{formatDate(q.createdAt)}</Text>
          </View>
        </View>

        {/* Admin quote response */}
        {q.adminResponse && (
          <View style={c.quoteBox}>
            <Text style={c.quoteBoxTitle}>Advisor Quote</Text>
            <View style={c.quoteRows}>
              <View style={c.quoteRow}>
                <Text style={c.quoteLabel}>Insurer</Text>
                <Text style={c.quoteValue}>{q.adminResponse.insurer}</Text>
              </View>
              <View style={c.quoteRow}>
                <Text style={c.quoteLabel}>Plan</Text>
                <Text style={c.quoteValue}>{q.adminResponse.planName}</Text>
              </View>
              <View style={c.quoteRow}>
                <Text style={c.quoteLabel}>Net Premium</Text>
                <Text style={c.quoteValue}>{fmt(q.adminResponse.netPremium)}</Text>
              </View>
              <View style={c.quoteRow}>
                <Text style={c.quoteLabel}>GST (18%)</Text>
                <Text style={c.quoteValue}>{fmt(q.adminResponse.gst)}</Text>
              </View>
              <View style={[c.quoteRow, c.quoteRowTotal]}>
                <Text style={[c.quoteLabel, { fontWeight: '800', color: Colors.text }]}>Total Premium</Text>
                <Text style={[c.quoteValue, { fontWeight: '900', color: color, fontSize: 16 }]}>
                  {fmt(q.adminResponse.totalPremium)} / yr
                </Text>
              </View>
            </View>
            {q.adminResponse.notes ? (
              <Text style={c.notes}>{q.adminResponse.notes}</Text>
            ) : null}

            {q.status === 'responded' && (
              <TouchableOpacity style={[c.approveBtn, { backgroundColor: color }]} onPress={() => onApprove(q.id)}>
                <Text style={c.approveBtnText}>Accept & Proceed →</Text>
              </TouchableOpacity>
            )}

            {q.status === 'approved' && (
              <View style={c.pendingPaymentBox}>
                <Icon name="card-outline" size={16} color={Colors.primary} />
                <Text style={c.pendingPaymentText}>
                  Our advisor will contact you with a payment link shortly.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Waiting state */}
        {q.status === 'pending' && (
          <View style={c.waitingBox}>
            <Icon name="time-outline" size={16} color={Colors.textMuted} />
            <Text style={c.waitingText}>Our advisor is working on your quote. Expected within 24 hours.</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function MyQuotesScreen() {
  const router = useRouter();
  const { alert } = useDialog();
  const [quotes, setQuotes]       = useState<QuoteRequest[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [approving, setApproving] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const { quotes: data } = await quotesApi.list();
      setQuotes(data as unknown as QuoteRequest[]);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load quotes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (quoteId: string) => {
    setApproving(quoteId);
    try {
      await quotesApi.approve(quoteId);
      alert({
        type: 'success',
        title: 'Application Submitted!',
        message: 'Our advisor will contact you with a payment link within 24 hours.',
      });
      load();
    } catch (e) {
      alert({ type: 'error', title: 'Error', message: e instanceof ApiError ? e.message : 'Something went wrong' });
    } finally {
      setApproving(null);
    }
  };

  const pending   = quotes.filter(q => q.status === 'pending').length;
  const responded = quotes.filter(q => q.status === 'responded').length;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <BackButton />
        <Text style={s.headerTitle}>My Quotes</Text>
        <TouchableOpacity onPress={() => router.push('/quote')} style={s.newBtn}>
          <Icon name="add" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Summary pills */}
      {quotes.length > 0 && (
        <View style={s.pills}>
          <View style={s.pill}>
            <Text style={s.pillNum}>{pending}</Text>
            <Text style={s.pillLabel}>Pending</Text>
          </View>
          <View style={[s.pill, { backgroundColor: '#EFF6FF' }]}>
            <Text style={[s.pillNum, { color: Colors.primary }]}>{responded}</Text>
            <Text style={s.pillLabel}>Quotes Ready</Text>
          </View>
          <View style={[s.pill, { backgroundColor: '#ECFDF5' }]}>
            <Text style={[s.pillNum, { color: '#059669' }]}>
              {quotes.filter(q => q.status === 'converted').length}
            </Text>
            <Text style={s.pillLabel}>Completed</Text>
          </View>
        </View>
      )}

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : error ? (
        <View style={s.center}>
          <Icon name="alert-circle-outline" size={40} color={Colors.error} />
          <Text style={s.errorText}>{error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => load()}>
            <Text style={s.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : quotes.length === 0 ? (
        <View style={s.center}>
          <Icon name="document-text-outline" size={48} color={Colors.border} />
          <Text style={s.emptyTitle}>No quote requests yet</Text>
          <Text style={s.emptySubtitle}>Browse plans and tap "Get a Quote" to get started.</Text>
          <TouchableOpacity style={s.ctaBtn} onPress={() => router.push('/(tabs)/plans')}>
            <Text style={s.ctaBtnText}>Browse Plans →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={s.scroll}
          contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Colors.primary} />}
        >
          {quotes.map(q => (
            approving === q.id
              ? <View key={q.id} style={[c.card, { alignItems: 'center', padding: 32 }]}>
                  <ActivityIndicator color={Colors.primary} />
                  <Text style={{ color: Colors.textMuted, marginTop: 8, fontSize: 13 }}>Submitting…</Text>
                </View>
              : <QuoteCard key={q.id} q={q} onApprove={handleApprove} />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const c = StyleSheet.create({
  card:        { backgroundColor: Colors.white, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  strip:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  stripType:   { fontSize: 11, fontWeight: '800', color: Colors.white, letterSpacing: 0.8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 100 },
  statusText:  { fontSize: 11, fontWeight: '700', color: Colors.white },
  body:        { padding: 14 },
  detailsRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  detail:      { minWidth: 80 },
  detailLabel: { fontSize: 10, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  detailValue: { fontSize: 13, fontWeight: '700', color: Colors.text },
  quoteBox:    { backgroundColor: Colors.bg, borderRadius: 12, padding: 14, gap: 2 },
  quoteBoxTitle:{ fontSize: 11, fontWeight: '800', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  quoteRows:   { gap: 6 },
  quoteRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: Colors.border },
  quoteRowTotal:{ borderBottomWidth: 0, marginTop: 4 },
  quoteLabel:  { fontSize: 13, color: Colors.textMuted },
  quoteValue:  { fontSize: 13, fontWeight: '700', color: Colors.text },
  notes:       { fontSize: 12, color: Colors.textMuted, marginTop: 10, lineHeight: 18, fontStyle: 'italic' },
  approveBtn:  { marginTop: 14, paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  approveBtnText: { fontSize: 14, fontWeight: '800', color: Colors.white },
  pendingPaymentBox: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: Colors.primaryLight, borderRadius: 10, padding: 10, marginTop: 12 },
  pendingPaymentText: { flex: 1, fontSize: 12, color: Colors.textMuted, lineHeight: 18 },
  waitingBox:  { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: Colors.bg, borderRadius: 10, padding: 10 },
  waitingText: { flex: 1, fontSize: 12, color: Colors.textMuted, lineHeight: 18 },
});

const s = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: Colors.white },
  header:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { fontSize: 17, fontWeight: '800', color: Colors.text },
  newBtn:   { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  pills:    { flexDirection: 'row', gap: 10, padding: 14, paddingBottom: 0 },
  pill:     { flex: 1, backgroundColor: '#FFFBEB', borderRadius: 10, padding: 10, alignItems: 'center' },
  pillNum:  { fontSize: 20, fontWeight: '900', color: '#D97706', letterSpacing: -0.5 },
  pillLabel:{ fontSize: 10, color: Colors.textMuted, marginTop: 2, fontWeight: '600' },
  scroll:   { flex: 1 },
  center:   { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  errorText:{ fontSize: 14, color: Colors.error, textAlign: 'center' },
  retryBtn: { backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  retryText:{ fontSize: 13, fontWeight: '700', color: Colors.white },
  emptyTitle:   { fontSize: 17, fontWeight: '800', color: Colors.text, textAlign: 'center' },
  emptySubtitle:{ fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  ctaBtn:   { backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, marginTop: 8 },
  ctaBtnText: { fontSize: 14, fontWeight: '700', color: Colors.white },
});
