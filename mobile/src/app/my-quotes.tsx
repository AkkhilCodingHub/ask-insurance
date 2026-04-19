import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal,
  RefreshControl, ActivityIndicator, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { quotesApi, paymentsApi, ApiError } from '@/lib/api';
import { Icon } from '@/components/Icon';
import { BackButton } from '@/components/BackButton';
import { Colors } from '@/constants/theme';
import { useDialog } from '@/components/Dialog';

// ── Types ─────────────────────────────────────────────────────────────────────

type AdminResponse = {
  insurer: string; planName: string;
  netPremium: number; gst: number; totalPremium: number; notes?: string;
};

type QuoteRequest = {
  id: string; type: string;
  details: Record<string, unknown>;
  status: string;
  adminResponse: AdminResponse | null;
  adminResponseAt: string | null;
  approvedAt: string | null;
  createdAt: string;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const TYPE_COLOR: Record<string, string> = {
  life: '#1580FF', health: '#059669', motor: '#D97706',
  fire: '#EA580C', marine: '#0891B2', engineering: '#7C3AED', liability: '#DC2626',
};

const TYPE_LABEL: Record<string, string> = {
  life: 'Life', health: 'Health', motor: 'Motor',
  fire: 'Fire', marine: 'Marine', engineering: 'Engineering', liability: 'Liability',
};

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Awaiting Quote',  color: '#D97706', bg: '#FEF3C7' },
  responded: { label: 'Quote Ready',     color: '#059669', bg: '#D1FAE5' },
  approved:  { label: 'Payment Pending', color: '#7C3AED', bg: '#EDE9FE' },
  converted: { label: 'Policy Active',   color: '#1580FF', bg: '#DBEAFE' },
  expired:   { label: 'Expired',         color: '#9CA3AF', bg: '#F3F4F6' },
};

const TIMELINE_STEPS = [
  { key: 'pending',   label: 'Request Submitted',  sub: 'We received your requirements' },
  { key: 'responded', label: 'Quote Received',      sub: 'Advisor has sent a quote' },
  { key: 'approved',  label: 'Quote Accepted',      sub: 'Awaiting payment confirmation' },
  { key: 'converted', label: 'Policy Issued',       sub: 'Your policy is active' },
];

const PAYMENT_UPI = 'askinsurance@upi';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtMoney(n: number) {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)} Cr`;
  if (n >= 100_000)    return `₹${(n / 100_000).toFixed(1)} L`;
  if (n >= 1_000)      return `₹${(n / 1_000).toFixed(0)}K`;
  return `₹${n}`;
}

function fmtInr(n: number) { return `₹${n.toLocaleString('en-IN')}`; }

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function statusToStep(s: string) {
  return ({ pending: 0, responded: 1, approved: 2, converted: 3 } as Record<string, number>)[s] ?? 0;
}

function typeInitials(type: string) { return type.slice(0, 2).toUpperCase(); }

// ── Payment Sheet (Razorpay) ──────────────────────────────────────────────────

function PaymentSheet({
  visible, quote, onClose, onDone,
}: {
  visible: boolean; quote: QuoteRequest | null;
  onClose: () => void; onDone: () => void;
}) {
  const [loading, setLoading]   = useState(false);
  const [payUrl, setPayUrl]     = useState<string | null>(null);
  const [err, setErr]           = useState<string | null>(null);
  const { alert } = useDialog();

  const color = quote ? (TYPE_COLOR[quote.type] ?? Colors.primary) : Colors.primary;
  const ar    = quote?.adminResponse;

  // Reset when sheet opens for a new quote
  React.useEffect(() => {
    if (visible) { setPayUrl(null); setErr(null); }
  }, [visible, quote?.id]);

  const handleAccept = async () => {
    if (!quote) return;
    setLoading(true); setErr(null);
    try {
      // 1. Accept quote → creates pending policy
      await quotesApi.approve(quote.id);
      // 2. Get Razorpay payment link for the created policy
      //    The backend returns the link from the pending policy linked to this quote
      const { paymentUrl } = await paymentsApi.createRazorpayLink(quote.id);
      setPayUrl(paymentUrl);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openPayment = async () => {
    if (!payUrl) return;
    try {
      await Linking.openURL(payUrl);
      // After returning from browser, reload quotes
      onDone();
    } catch {
      alert({ type: 'error', title: 'Error', message: 'Could not open payment page.' });
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={ps.safe}>
        <View style={ps.header}>
          <TouchableOpacity onPress={onClose} style={ps.closeBtn}>
            <Icon name="close" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
          <Text style={ps.title}>Accept & Pay</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={ps.body} showsVerticalScrollIndicator={false}>
          {/* Premium summary */}
          {ar && (
            <View style={[ps.amountCard, { borderTopColor: color }]}>
              <View style={ps.amountTop}>
                <View style={{ flex: 1 }}>
                  <Text style={ps.amountInsurer}>{ar.insurer}</Text>
                  <Text style={ps.amountPlan}>{ar.planName}</Text>
                </View>
                <View style={[ps.typeBadge, { backgroundColor: color + '18' }]}>
                  <Text style={[ps.typeText, { color }]}>
                    {TYPE_LABEL[quote?.type ?? ''] ?? quote?.type?.toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={ps.amountBreakdown}>
                <View style={ps.breakRow}>
                  <Text style={ps.breakLabel}>Net Premium</Text>
                  <Text style={ps.breakVal}>{fmtInr(ar.netPremium)}</Text>
                </View>
                <View style={ps.breakRow}>
                  <Text style={ps.breakLabel}>GST (18%)</Text>
                  <Text style={ps.breakVal}>{fmtInr(ar.gst)}</Text>
                </View>
                <View style={[ps.breakRow, ps.breakTotal]}>
                  <Text style={ps.breakTotalLabel}>Total Due</Text>
                  <Text style={[ps.breakTotalVal, { color }]}>
                    {fmtInr(ar.totalPremium)}
                    <Text style={ps.breakTotalSub}> / yr</Text>
                  </Text>
                </View>
              </View>
              {ar.notes ? <Text style={ps.notes}>"{ar.notes}"</Text> : null}
            </View>
          )}

          {err && (
            <View style={ps.errBox}>
              <Icon name="alert-circle-outline" size={15} color={Colors.error} />
              <Text style={ps.errText}>{err}</Text>
            </View>
          )}

          {!payUrl ? (
            <>
              <View style={ps.infoBox}>
                <Icon name="shield-checkmark-outline" size={16} color={Colors.success} />
                <Text style={ps.infoText}>
                  By accepting, we'll create your policy and generate a secure Razorpay payment link for you.
                </Text>
              </View>
              <TouchableOpacity
                style={[ps.mainBtn, { backgroundColor: color, opacity: loading ? 0.6 : 1 }]}
                onPress={handleAccept}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color={Colors.white} />
                  : <>
                      <Icon name="checkmark-circle-outline" size={18} color={Colors.white} />
                      <Text style={ps.mainBtnText}>Accept Quote & Get Payment Link</Text>
                    </>
                }
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={[ps.infoBox, { backgroundColor: Colors.successLight }]}>
                <Icon name="checkmark-circle-outline" size={16} color={Colors.success} />
                <Text style={[ps.infoText, { color: Colors.success }]}>
                  Quote accepted! Your secure payment link is ready.
                </Text>
              </View>
              <TouchableOpacity style={[ps.mainBtn, { backgroundColor: color }]} onPress={openPayment}>
                <Icon name="open-outline" size={18} color={Colors.white} />
                <Text style={ps.mainBtnText}>Open Payment Page</Text>
              </TouchableOpacity>
              <Text style={ps.footNote}>
                You'll be taken to a secure Razorpay page. Come back to the app after payment — your policy will activate automatically.
              </Text>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ── Status Timeline ───────────────────────────────────────────────────────────

function StatusTimeline({ status }: { status: string }) {
  const step = statusToStep(status);
  if (status === 'expired') {
    return (
      <View style={tl.expiredRow}>
        <Icon name="close-circle-outline" size={15} color="#9CA3AF" />
        <Text style={tl.expiredText}>This quote has expired. Please submit a new request.</Text>
      </View>
    );
  }
  return (
    <View style={tl.wrap}>
      {TIMELINE_STEPS.map((s, i) => {
        const done = i <= step; const cur = i === step;
        const c = STATUS_CFG[s.key]?.color ?? Colors.primary;
        return (
          <View key={s.key} style={tl.row}>
            <View style={tl.col}>
              <View style={[tl.dot, { backgroundColor: done ? c : Colors.bg, borderColor: done ? c : Colors.border }]}>
                {done && <Icon name="checkmark" size={9} color={Colors.white} />}
              </View>
              {i < TIMELINE_STEPS.length - 1 && (
                <View style={[tl.line, { backgroundColor: i < step ? c : Colors.border }]} />
              )}
            </View>
            <View style={tl.info}>
              <Text style={[tl.label, cur && { color: c, fontWeight: '700' }]}>{s.label}</Text>
              <Text style={[tl.sub, cur && { color: c }]}>{s.sub}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ── Quote Card — mirrors PlanCard structure exactly ───────────────────────────

function QuoteCard({
  q, onAccept,
}: {
  q: QuoteRequest; onAccept: (q: QuoteRequest) => void;
}) {
  const [showTimeline, setShowTimeline] = useState(false);
  const color   = TYPE_COLOR[q.type] ?? Colors.primary;
  const st      = STATUS_CFG[q.status] ?? STATUS_CFG.pending;
  const ar      = q.adminResponse;
  const details = q.details ?? {};

  // Cover/IDV/asset value — whichever is present
  const coverVal = (details.sumInsured ?? details.idv ?? details.assetValue) as number | undefined;
  // Plan name from details (set when user picked a plan)
  const planName = details.planName as string | undefined;

  return (
    <View style={qc.card}>
      {/* ── Top: avatar + name + status ──────────────────── */}
      <View style={qc.top}>
        <View style={[qc.avatar, { backgroundColor: color + '18' }]}>
          <Text style={[qc.avatarText, { color }]}>{typeInitials(q.type)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={qc.typeLine}>
            {TYPE_LABEL[q.type] ?? q.type} Insurance
            {planName ? <Text style={qc.planNameInline}> · {planName}</Text> : null}
          </Text>
          {ar
            ? <Text style={qc.subLine}>{ar.insurer} — {ar.planName}</Text>
            : <Text style={qc.subLine}>Submitted {fmtDate(q.createdAt)}</Text>
          }
        </View>
        <View style={[qc.statusPill, { backgroundColor: st.bg }]}>
          <Text style={[qc.statusText, { color: st.color }]}>{st.label}</Text>
        </View>
      </View>

      {/* ── Meta row: cover · type · date ────────────────── */}
      <View style={qc.metaRow}>
        <View style={qc.metaItem}>
          <Text style={qc.metaLabel}>{q.type === 'motor' ? 'IDV' : 'COVER'}</Text>
          <Text style={[qc.metaValue, { color }]}>
            {coverVal ? fmtMoney(coverVal) : '—'}
          </Text>
        </View>
        <View style={[qc.metaItem, { alignItems: 'center' }]}>
          <Text style={qc.metaLabel}>TYPE</Text>
          <Text style={qc.metaValue}>{TYPE_LABEL[q.type] ?? q.type}</Text>
        </View>
        <View style={[qc.metaItem, { alignItems: 'flex-end' }]}>
          <Text style={qc.metaLabel}>REQUESTED</Text>
          <Text style={qc.metaValue}>{fmtDate(q.createdAt)}</Text>
        </View>
      </View>

      {/* ── Quote panel — shown when quote is ready ───────── */}
      {ar && (
        <View style={qc.quotePanel}>
          <View style={qc.quotePanelRow}>
            <View style={{ flex: 1 }}>
              <Text style={qc.quotePanelInsurer}>{ar.insurer}</Text>
              <Text style={qc.quotePanelPlan}>{ar.planName}</Text>
              <Text style={qc.quotePanelBreakdown}>
                Net {fmtInr(ar.netPremium)} + GST {fmtInr(ar.gst)}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[qc.quotePremium, { color }]}>{fmtInr(ar.totalPremium)}</Text>
              <Text style={qc.quotePremiumSub}>per year</Text>
            </View>
          </View>
          {ar.notes ? <Text style={qc.quoteNotes}>"{ar.notes}"</Text> : null}

          {q.status === 'approved' && (
            <View style={qc.infoRow}>
              <Icon name="time-outline" size={13} color="#D97706" />
              <Text style={qc.infoText}>Payment received — verifying within 1–2 hrs.</Text>
            </View>
          )}
          {q.status === 'converted' && (
            <View style={[qc.infoRow, { backgroundColor: Colors.successLight }]}>
              <Icon name="shield-checkmark-outline" size={13} color={Colors.success} />
              <Text style={[qc.infoText, { color: Colors.success }]}>Policy issued. Check My Policies.</Text>
            </View>
          )}
        </View>
      )}

      {/* Pending awaiting state */}
      {q.status === 'pending' && (
        <View style={qc.awaitingRow}>
          <Icon name="time-outline" size={13} color="#D97706" />
          <Text style={qc.awaitingText}>Our advisor is working on your quote — usually within 24 hours.</Text>
        </View>
      )}

      {/* ── Timeline (expandable) ─────────────────────────── */}
      {showTimeline && (
        <View style={qc.timelineWrap}>
          <StatusTimeline status={q.status} />
        </View>
      )}

      {/* ── Actions row: mirrors plans.tsx actions ─────────── */}
      <View style={qc.actions}>
        <TouchableOpacity style={qc.trackBtn} onPress={() => setShowTimeline(v => !v)}>
          <Text style={qc.trackBtnText}>{showTimeline ? 'Hide timeline ↑' : 'Track status ↓'}</Text>
        </TouchableOpacity>
        {q.status === 'responded' && (
          <TouchableOpacity style={[qc.acceptBtn, { backgroundColor: color }]} onPress={() => onAccept(q)}>
            <Text style={qc.acceptBtnText}>Accept & Pay</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function MyQuotesScreen() {
  const router = useRouter();
  const { alert } = useDialog();
  const [quotes, setQuotes]             = useState<QuoteRequest[]>([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [paymentQuote, setPaymentQuote] = useState<QuoteRequest | null>(null);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const { quotes: data } = await quotesApi.list();
      setQuotes(data as unknown as QuoteRequest[]);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load quotes');
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handlePaymentDone = () => {
    setPaymentQuote(null);
    load();
    alert({ type: 'success', title: 'Payment Initiated', message: 'Your policy will activate automatically once your payment is confirmed.' });
  };

  const pending   = quotes.filter(q => q.status === 'pending').length;
  const responded = quotes.filter(q => q.status === 'responded').length;
  const completed = quotes.filter(q => q.status === 'converted').length;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <BackButton />
        <Text style={s.title}>My Quotes</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Summary pills */}
      {!loading && quotes.length > 0 && (
        <View style={s.pills}>
          <View style={[s.pill, { backgroundColor: '#FEF3C7' }]}>
            <Text style={[s.pillNum, { color: '#D97706' }]}>{pending}</Text>
            <Text style={s.pillLabel}>Pending</Text>
          </View>
          <View style={[s.pill, { backgroundColor: '#D1FAE5' }]}>
            <Text style={[s.pillNum, { color: Colors.success }]}>{responded}</Text>
            <Text style={s.pillLabel}>Ready</Text>
          </View>
          <View style={[s.pill, { backgroundColor: Colors.primaryLight }]}>
            <Text style={[s.pillNum, { color: Colors.primary }]}>{completed}</Text>
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
          <Icon name="alert-circle-outline" size={44} color={Colors.error} />
          <Text style={s.errorText}>{error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => load()}>
            <Text style={s.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : quotes.length === 0 ? (
        <View style={s.center}>
          <View style={s.emptyIconWrap}>
            <Icon name="document-text-outline" size={36} color={Colors.primary} />
          </View>
          <Text style={s.emptyTitle}>No quote requests yet</Text>
          <Text style={s.emptySub}>Browse our plans and tap "Get a Quote" to get a personalised quote from our advisors.</Text>
          <TouchableOpacity style={s.ctaBtn} onPress={() => router.push('/(tabs)/plans')}>
            <Text style={s.ctaText}>Browse Plans →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={s.scroll}
          contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Colors.primary} />}
        >
          {quotes.map(q => (
            <QuoteCard key={q.id} q={q} onAccept={setPaymentQuote} />
          ))}
        </ScrollView>
      )}

      <PaymentSheet
        visible={!!paymentQuote}
        quote={paymentQuote}
        onClose={() => setPaymentQuote(null)}
        onDone={handlePaymentDone}
      />
    </SafeAreaView>
  );
}

// ── Quote Card Styles (mirrors pc from plans.tsx) ─────────────────────────────

const qc = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16, marginBottom: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  top: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, padding: 14, paddingBottom: 10,
  },
  avatar: {
    width: 46, height: 46, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText:   { fontSize: 14, fontWeight: '800' },
  typeLine:     { fontSize: 13, fontWeight: '700', color: Colors.text },
  planNameInline: { fontSize: 12, fontWeight: '500', color: Colors.textMuted },
  subLine:      { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  statusPill:   { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 100, alignSelf: 'flex-start' },
  statusText:   { fontSize: 10, fontWeight: '700' },

  metaRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: Colors.bg,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  metaItem:  { flex: 1 },
  metaLabel: { fontSize: 9, color: Colors.textLight, fontWeight: '600', letterSpacing: 0.3, marginBottom: 3 },
  metaValue: { fontSize: 13, fontWeight: '700', color: Colors.text },

  quotePanel: {
    paddingHorizontal: 14, paddingVertical: 12, gap: 6,
    borderTopWidth: 1, borderTopColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  quotePanelRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  quotePanelInsurer: { fontSize: 13, fontWeight: '800', color: Colors.text },
  quotePanelPlan:    { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  quotePanelBreakdown:{ fontSize: 11, color: Colors.textLight, marginTop: 3 },
  quotePremium:      { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  quotePremiumSub:   { fontSize: 11, color: Colors.textMuted, textAlign: 'right', marginTop: 1 },
  quoteNotes:        { fontSize: 12, color: Colors.textMuted, fontStyle: 'italic', lineHeight: 17 },
  infoRow: {
    flexDirection: 'row', gap: 7, alignItems: 'center',
    backgroundColor: '#FFFBEB', borderRadius: 8, padding: 9, marginTop: 2,
  },
  infoText: { flex: 1, fontSize: 12, color: Colors.textMuted, lineHeight: 17 },

  awaitingRow: {
    flexDirection: 'row', gap: 7, alignItems: 'center',
    marginHorizontal: 14, marginBottom: 2, marginTop: 0,
    backgroundColor: '#FFFBEB', borderRadius: 8, padding: 10,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  awaitingText: { flex: 1, fontSize: 12, color: Colors.textMuted, lineHeight: 17 },

  timelineWrap: {
    paddingHorizontal: 14, paddingBottom: 4,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },

  actions: {
    flexDirection: 'row', gap: 10,
    padding: 14, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  trackBtn: {
    flex: 1, paddingVertical: 9, borderRadius: 10,
    borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', backgroundColor: Colors.white,
  },
  trackBtnText: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
  acceptBtn:    { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center' },
  acceptBtnText:{ fontSize: 12, fontWeight: '700', color: Colors.white },
});

// ── Timeline Styles ───────────────────────────────────────────────────────────

const tl = StyleSheet.create({
  wrap:        { paddingTop: 12, paddingBottom: 4, gap: 0 },
  row:         { flexDirection: 'row', gap: 10, minHeight: 42 },
  col:         { alignItems: 'center', width: 22 },
  dot:         { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  line:        { width: 2, flex: 1, marginVertical: 2 },
  info:        { flex: 1, paddingBottom: 6 },
  label:       { fontSize: 13, color: Colors.textMuted, fontWeight: '500', paddingTop: 1 },
  sub:         { fontSize: 11, color: Colors.textLight, marginTop: 1, lineHeight: 15 },
  expiredRow:  { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 8, padding: 10, marginTop: 8 },
  expiredText: { flex: 1, fontSize: 12, color: '#6B7280', lineHeight: 17 },
});

// ── Payment Sheet Styles ──────────────────────────────────────────────────────

const ps = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.white },
  header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  closeBtn:{ width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
  title:   { fontSize: 17, fontWeight: '800', color: Colors.text },
  body:    { padding: 20, paddingBottom: 48, gap: 14 },

  amountCard:     { borderTopWidth: 3, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 16, backgroundColor: Colors.bg },
  amountTop:      { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  amountInsurer:  { fontSize: 16, fontWeight: '800', color: Colors.text },
  amountPlan:     { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  typeBadge:      { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 2 },
  typeText:       { fontSize: 11, fontWeight: '800' },
  amountBreakdown:{ gap: 6 },
  breakRow:       { flexDirection: 'row', justifyContent: 'space-between' },
  breakLabel:     { fontSize: 13, color: Colors.textMuted },
  breakVal:       { fontSize: 13, fontWeight: '700', color: Colors.text },
  breakTotal:     { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 10, marginTop: 4 },
  breakTotalLabel:{ fontSize: 15, fontWeight: '800', color: Colors.text },
  breakTotalVal:  { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  breakTotalSub:  { fontSize: 13, fontWeight: '500', color: Colors.textMuted },
  notes:          { fontSize: 12, color: Colors.textMuted, fontStyle: 'italic', marginTop: 10, lineHeight: 18 },

  infoBox: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: Colors.primaryLight, borderRadius: 12, padding: 14 },
  infoText:{ flex: 1, fontSize: 13, color: Colors.textMuted, lineHeight: 19 },

  errBox:  { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: '#FEF2F2', borderRadius: 10, padding: 12 },
  errText: { flex: 1, fontSize: 13, color: Colors.error, lineHeight: 18 },

  mainBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 14 },
  mainBtnText:{ fontSize: 15, fontWeight: '800', color: Colors.white },
  footNote:   { fontSize: 12, color: Colors.textMuted, textAlign: 'center', lineHeight: 18 },
});

// ── Screen Styles ─────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.bg },
  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.white },
  title:     { fontSize: 17, fontWeight: '800', color: Colors.text },
  pills:     { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  pill:      { flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  pillNum:   { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  pillLabel: { fontSize: 10, color: Colors.textMuted, marginTop: 2, fontWeight: '600', textTransform: 'uppercase' },
  scroll:    { flex: 1 },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  errorText: { fontSize: 14, color: Colors.error, textAlign: 'center' },
  retryBtn:  { borderWidth: 1.5, borderColor: Colors.primary, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  retryText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle:{ fontSize: 18, fontWeight: '800', color: Colors.text, textAlign: 'center' },
  emptySub:  { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 20, maxWidth: 280 },
  ctaBtn:    { backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 28, paddingVertical: 13, marginTop: 4 },
  ctaText:   { fontSize: 14, fontWeight: '700', color: Colors.white },
});
