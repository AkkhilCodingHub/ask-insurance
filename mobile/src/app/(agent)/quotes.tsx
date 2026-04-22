import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, TextInput, ActivityIndicator,
  Animated, Dimensions, Pressable, Modal, Linking, Share, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { agentApi, AgentQuote } from '@/lib/api';
import { useAgent } from '@/context/agent';
import { Icon } from '@/components/Icon';
import { Colors } from '@/constants/theme';
import { authFieldStyles as af } from '@/constants/authFieldStyles';

const { height: SCREEN_H } = Dimensions.get('window');

// ── Constants ─────────────────────────────────────────────────────────────────

const TYPE_COLOR: Record<string, string> = {
  life: '#1580FF', health: '#059669', motor: '#F59E0B',
  fire: '#EA580C', marine: '#0891B2', engineering: '#7C3AED', liability: '#DC2626',
};

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Awaiting Response', color: '#D97706', bg: '#FEF3C7' },
  responded: { label: 'Quote Sent',        color: '#1D4ED8', bg: '#DBEAFE' },
  approved:  { label: 'Payment Pending',   color: '#7C3AED', bg: '#EDE9FE' },
  converted: { label: 'Completed',         color: '#059669', bg: '#D1FAE5' },
  expired:   { label: 'Expired',           color: '#9CA3AF', bg: '#F3F4F6' },
};

const TABS = ['All', 'Pending', 'Responded', 'Approved', 'Converted'] as const;
type Tab = typeof TABS[number];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtTime(s: string) {
  return new Date(s).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}
function fmtMoney(n: number) {
  return '₹' + Number(n).toLocaleString('en-IN');
}
function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

// Human-readable key names for customer details
const DETAIL_LABELS: Record<string, string> = {
  sumInsured: 'Sum Insured', idv: 'IDV', assetValue: 'Asset Value',
  age: 'Age', dob: 'Date of Birth', gender: 'Gender',
  vehicleType: 'Vehicle Type', vehicleAge: 'Vehicle Age',
  smoker: 'Smoker', members: 'Members', city: 'City',
  coverPeriod: 'Cover Period', occupation: 'Occupation',
};

function parseDetails(raw: string | Record<string, unknown>): Array<{ label: string; value: string }> {
  let obj: Record<string, unknown> = {};
  if (typeof raw === 'string') {
    try { obj = JSON.parse(raw); } catch { return []; }
  } else if (raw && typeof raw === 'object') {
    obj = raw;
  }
  return Object.entries(obj)
    .filter(([k]) => k !== 'planId' && k !== 'userId')
    .map(([k, v]) => {
      const label = DETAIL_LABELS[k] ?? k.replace(/([A-Z])/g, ' $1').trim();
      const moneyKeys = ['sumInsured', 'idv', 'assetValue'];
      const value = moneyKeys.includes(k) && typeof v === 'number'
        ? fmtMoney(v)
        : String(v ?? '');
      return { label: label.charAt(0).toUpperCase() + label.slice(1), value };
    })
    .filter(({ value }) => value && value !== 'undefined');
}

// ── Detail Sheet ──────────────────────────────────────────────────────────────

function DetailSheet({ quote, onClose, onDone }: {
  quote: AgentQuote | null; onClose: () => void; onDone: () => void;
}) {
  const insets = useSafeAreaInsets();
  const slideY = useRef(new Animated.Value(SCREEN_H)).current;
  const bgOp   = useRef(new Animated.Value(0)).current;
  const visible = !!quote;
  const color   = quote ? (TYPE_COLOR[quote.type] ?? Colors.primary) : Colors.primary;

  // Tab state inside the sheet
  type SheetTab = 'details' | 'respond' | 'payment';
  const [sheetTab, setSheetTab] = useState<SheetTab>('details');

  // Respond form state
  const [insurer,    setInsurer]    = useState('');
  const [planName,   setPlanName]   = useState('');
  const [netPremium, setNetPremium] = useState('');
  const [notes,      setNotes]      = useState('');
  const [formErr,    setFormErr]    = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formDone,   setFormDone]   = useState(false);

  // Status change state
  const [statusBusy, setStatusBusy] = useState(false);

  // Payment link state
  const [payUrl,     setPayUrl]     = useState<string | null>(null);
  const [payLoading, setPayLoading] = useState(false);
  const [payErr,     setPayErr]     = useState('');

  useEffect(() => {
    if (visible && quote) {
      const ar = quote.adminResponse;
      setInsurer(ar?.insurer ?? '');
      setPlanName(ar?.planName ?? '');
      setNetPremium(ar ? String(ar.netPremium) : '');
      setNotes(ar?.notes ?? '');
      setFormErr(''); setFormDone(false);
      setPayUrl(null); setPayErr('');
      // Default tab based on status
      setSheetTab(
        quote.status === 'approved'  ? 'payment'
        : quote.status === 'converted' ? 'details'
        : quote.status === 'pending' || quote.status === 'responded' ? 'respond'
        : 'details'
      );
      Animated.parallel([
        Animated.spring(slideY, { toValue: 0, damping: 24, stiffness: 240, mass: 0.9, useNativeDriver: true }),
        Animated.timing(bgOp,   { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideY, { toValue: SCREEN_H, duration: 240, useNativeDriver: true }),
        Animated.timing(bgOp,   { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, quote?.id]);

  const gst          = Math.round(Number(netPremium) * 0.18);
  const totalPremium = Number(netPremium) + gst;

  const handleSubmit = async () => {
    if (!insurer.trim() || !planName.trim() || !netPremium.trim()) {
      setFormErr('Insurer, plan name and net premium are required.'); return;
    }
    if (Number(netPremium) <= 0) { setFormErr('Net premium must be > 0'); return; }
    if (!quote) return;
    setSubmitting(true); setFormErr('');
    try {
      await agentApi.respondToQuote(quote.id, {
        insurer: insurer.trim(), planName: planName.trim(),
        netPremium: Number(netPremium), gst, totalPremium,
        notes: notes.trim() || undefined,
      });
      setFormDone(true);
      setTimeout(onDone, 900);
    } catch (e: unknown) {
      setFormErr(e instanceof Error ? e.message : 'Failed to submit quote.');
    } finally { setSubmitting(false); }
  };

  const changeStatus = async (status: 'pending' | 'responded' | 'approved' | 'expired') => {
    if (!quote || statusBusy) return;
    setStatusBusy(true);
    try { await agentApi.updateQuoteStatus(quote.id, status); onDone(); }
    catch { /* silent */ } finally { setStatusBusy(false); }
  };

  const generatePayment = async () => {
    if (!quote) return;
    setPayLoading(true); setPayErr('');
    try {
      const { paymentUrl } = await agentApi.generateQuotePaymentLink(quote.id);
      setPayUrl(paymentUrl);
    } catch (e: unknown) {
      setPayErr(e instanceof Error ? e.message : 'Failed to generate link');
    } finally { setPayLoading(false); }
  };

  if (!visible && !quote) return null;

  const q       = quote!;
  const ar      = q.adminResponse;
  const details = parseDetails(q.details ?? {});

  const SHEET_TABS: Array<{ id: SheetTab; label: string }> = [
    { id: 'details', label: 'Details' },
    ...(q.status !== 'converted' && q.status !== 'expired'
      ? [{ id: 'respond' as SheetTab, label: q.status === 'responded' ? 'Edit Quote' : 'Send Quote' }]
      : []),
    ...(q.status === 'approved' || q.status === 'converted'
      ? [{ id: 'payment' as SheetTab, label: 'Payment' }]
      : []),
  ];

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        <Animated.View style={[sh.backdrop, { opacity: bgOp }]} />
      </Pressable>

      <Animated.View style={[sh.sheet, { paddingBottom: insets.bottom + 8, transform: [{ translateY: slideY }] }]}>
        <View style={sh.sheetTop}>
          <View style={sh.handleRow}><View style={sh.handle} /></View>
          <View style={sh.sheetHeader}>
            <View style={[sh.headerIcon, { backgroundColor: color + '1A' }]}>
              <Icon name="document-text-outline" size={20} color={color} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={sh.headerKicker}>{q.type.toUpperCase()} · QUOTE</Text>
              <Text style={sh.headerTitle} numberOfLines={1}>{q.user?.name ?? q.user?.phone}</Text>
              <Text style={sh.headerSub}>+91 {q.user?.phone} · {fmtDate(q.createdAt)} {fmtTime(q.createdAt)}</Text>
            </View>
            <View style={[sh.statusChipHeader, { backgroundColor: (STATUS_CFG[q.status]?.bg) ?? Colors.bg, borderColor: (STATUS_CFG[q.status]?.color ?? Colors.border) + '44' }]}>
              <Text style={[sh.statusChipHeaderText, { color: STATUS_CFG[q.status]?.color ?? Colors.text }]}>{STATUS_CFG[q.status]?.label ?? q.status}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={sh.headerCloseBtn} activeOpacity={0.7}>
              <Icon name="close" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
          {ar && (
            <View style={sh.summaryLine}>
              <Icon name="checkmark-circle" size={14} color={Colors.success} />
              <Text style={sh.summaryLineText} numberOfLines={2}>
                {ar.insurer} · {ar.planName} · {fmtMoney(ar.totalPremium)}/yr
              </Text>
            </View>
          )}
        </View>

        {/* Tab bar */}
        {SHEET_TABS.length > 1 && (
          <View style={sh.tabBar}>
            {SHEET_TABS.map(t => (
              <TouchableOpacity key={t.id} style={[sh.tabBtn, sheetTab === t.id && { borderBottomColor: color, borderBottomWidth: 2 }]}
                onPress={() => setSheetTab(t.id)} activeOpacity={0.8}>
                <Text style={[sh.tabText, sheetTab === t.id && { color }]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <ScrollView
          style={sh.bodyScroll}
          contentContainerStyle={{ padding: 16, paddingBottom: 12, gap: 12 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── DETAILS TAB ── */}
          {sheetTab === 'details' && (
            <>
              {/* Customer info card */}
              <View style={sh.card}>
                <Text style={sh.cardTitle}>Customer</Text>
                <View style={sh.infoRow}>
                  <Icon name="person-circle-outline" size={16} color={Colors.textMuted} />
                  <Text style={sh.infoVal}>{q.user?.name ?? '—'}</Text>
                </View>
                <View style={sh.infoRow}>
                  <Icon name="call-outline" size={16} color={Colors.textMuted} />
                  <Text style={sh.infoVal}>+91 {q.user?.phone}</Text>
                  <TouchableOpacity onPress={() => Linking.openURL(`tel:${q.user?.phone}`)} style={sh.callBtn} activeOpacity={0.7}>
                    <Text style={[sh.callBtnText, { color }]}>Call</Text>
                  </TouchableOpacity>
                </View>
                {q.user?.email ? (
                  <View style={sh.infoRow}>
                    <Icon name="mail-outline" size={16} color={Colors.textMuted} />
                    <Text style={sh.infoVal}>{q.user.email}</Text>
                  </View>
                ) : null}
              </View>

              {/* Requirements */}
              {details.length > 0 && (
                <View style={sh.card}>
                  <Text style={sh.cardTitle}>Customer Requirements</Text>
                  <View style={sh.detailsGrid}>
                    {details.map(({ label, value }) => (
                      <View key={label} style={sh.detailItem}>
                        <Text style={sh.detailLabel}>{label}</Text>
                        <Text style={sh.detailValue}>{value}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Quoted summary if responded */}
              {ar && (
                <View style={[sh.card, sh.cardNotice]}>
                  <View style={sh.cardTitleRow}>
                    <Icon name="checkmark-circle" size={15} color={Colors.success} />
                    <Text style={[sh.cardTitle, { color: Colors.success }]}>Quote Sent</Text>
                  </View>
                  <View style={sh.detailsGrid}>
                    <View style={sh.detailItem}><Text style={sh.detailLabel}>Insurer</Text><Text style={sh.detailValue}>{ar.insurer}</Text></View>
                    <View style={sh.detailItem}><Text style={sh.detailLabel}>Plan</Text><Text style={sh.detailValue}>{ar.planName}</Text></View>
                    <View style={sh.detailItem}><Text style={sh.detailLabel}>Net Premium</Text><Text style={sh.detailValue}>{fmtMoney(ar.netPremium)}</Text></View>
                    <View style={sh.detailItem}><Text style={sh.detailLabel}>GST (18%)</Text><Text style={sh.detailValue}>{fmtMoney(ar.gst)}</Text></View>
                    <View style={sh.detailItem}><Text style={sh.detailLabel}>Total / Year</Text><Text style={[sh.detailValue, { color, fontWeight: '900', fontSize: 16 }]}>{fmtMoney(ar.totalPremium)}</Text></View>
                    {ar.notes ? <View style={sh.detailItem}><Text style={sh.detailLabel}>Notes</Text><Text style={sh.detailValue}>{ar.notes}</Text></View> : null}
                  </View>
                </View>
              )}

              {/* Converted banner */}
              {q.status === 'converted' && (
                <View style={[sh.card, sh.cardNotice]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Icon name="shield-checkmark" size={20} color={Colors.success} />
                    <View>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: Colors.text }}>Policy Issued — Completed</Text>
                      {q.approvedAt && <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 2 }}>Paid on {fmtDate(q.approvedAt)}</Text>}
                    </View>
                  </View>
                </View>
              )}

              {/* Status change */}
              {q.status !== 'converted' && (
                <View style={sh.card}>
                  <Text style={sh.cardTitle}>Change Status</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                    {(['pending', 'responded', 'approved', 'expired'] as const).map(s => {
                      const cfg = STATUS_CFG[s];
                      const active = q.status === s;
                      return (
                        <TouchableOpacity
                          key={s}
                          style={[sh.statusChip, { backgroundColor: active ? cfg.bg : Colors.bg, borderColor: active ? cfg.color : Colors.border }]}
                          onPress={() => changeStatus(s)}
                          disabled={active || statusBusy}
                          activeOpacity={0.75}
                        >
                          {statusBusy && !active ? <ActivityIndicator size="small" color={cfg.color} style={{ marginRight: 4 }} /> : null}
                          <Text style={[sh.statusChipText, { color: active ? cfg.color : Colors.textMuted, fontWeight: active ? '700' : '500' }]}>
                            {cfg.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </>
          )}

          {/* ── RESPOND TAB ── */}
          {sheetTab === 'respond' && (
            <>
              {ar && (
                <View style={[sh.card, sh.cardNotice]}>
                  <Text style={{ fontSize: 10, color: Colors.textLight, fontWeight: '800', marginBottom: 4, letterSpacing: 0.5 }}>CURRENTLY SENT</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.text }}>{ar.insurer} · {ar.planName}</Text>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: Colors.primary, marginTop: 2 }}>{fmtMoney(ar.totalPremium)}/yr</Text>
                </View>
              )}

              {formDone ? (
                <View style={[sh.card, { alignItems: 'center', gap: 8, paddingVertical: 24 }]}>
                  <Icon name="checkmark-circle" size={36} color={Colors.success} />
                  <Text style={{ fontSize: 15, fontWeight: '800', color: Colors.success }}>Quote sent!</Text>
                  <Text style={{ fontSize: 13, color: Colors.textMuted }}>Customer notified via push notification.</Text>
                </View>
              ) : (
                <View style={sh.card}>
                  <Text style={sh.cardTitle}>{ar ? 'Edit & Resend Quote' : 'Send Quote to Customer'}</Text>

                  <Text style={sh.label}>INSURER *</Text>
                  <View style={af.inputRow}>
                    <TextInput style={af.input} placeholder="e.g. LIC, HDFC Ergo, Star Health"
                      placeholderTextColor={Colors.textLight} value={insurer}
                      onChangeText={v => { setInsurer(v); setFormErr(''); }} />
                  </View>

                  <Text style={sh.label}>PLAN NAME *</Text>
                  <View style={af.inputRow}>
                    <TextInput style={af.input} placeholder="e.g. Click 2 Protect Life"
                      placeholderTextColor={Colors.textLight} value={planName}
                      onChangeText={v => { setPlanName(v); setFormErr(''); }} />
                  </View>

                  <Text style={sh.label}>NET PREMIUM (₹) *</Text>
                  <View style={af.inputRow}>
                    <TextInput style={af.input} placeholder="e.g. 12000"
                      placeholderTextColor={Colors.textLight} value={netPremium}
                      onChangeText={v => { setNetPremium(v.replace(/\D/g, '')); setFormErr(''); }}
                      keyboardType="numeric" />
                  </View>

                  {!!netPremium && Number(netPremium) > 0 && (
                    <View style={sh.calcRow}>
                      <View style={sh.calcCell}>
                        <Text style={sh.calcLabel}>GST (18%)</Text>
                        <Text style={sh.calcVal}>{fmtMoney(gst)}</Text>
                      </View>
                      <View style={sh.calcDivider} />
                      <View style={sh.calcCell}>
                        <Text style={sh.calcLabel}>TOTAL / YEAR</Text>
                        <Text style={[sh.calcVal, { color, fontSize: 20 }]}>{fmtMoney(totalPremium)}</Text>
                      </View>
                    </View>
                  )}

                  <Text style={sh.label}>NOTES (optional)</Text>
                  <View style={[af.inputRow, af.inputRowTopAlign]}>
                    <TextInput
                      style={[af.input, af.inputMultiline, { minHeight: 96 }]}
                      placeholder="Terms, validity, conditions visible to customer…"
                      placeholderTextColor={Colors.textLight}
                      value={notes} onChangeText={setNotes} multiline
                    />
                  </View>

                  {!!formErr && (
                    <View style={sh.errBox}>
                      <Icon name="alert-circle-outline" size={15} color={Colors.error} />
                      <Text style={sh.errText}>{formErr}</Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[sh.submitBtn, { backgroundColor: color, opacity: submitting ? 0.7 : 1 }]}
                    onPress={handleSubmit} disabled={submitting} activeOpacity={0.85}
                  >
                    {submitting
                      ? <ActivityIndicator color="#fff" />
                      : <><Icon name="send" size={17} color="#fff" /><Text style={sh.submitBtnText}>{ar ? 'Update & Resend Quote' : 'Send Quote to Customer'}</Text></>
                    }
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}

          {/* ── PAYMENT TAB ── */}
          {sheetTab === 'payment' && (
            <View style={sh.card}>
              {q.status === 'converted' ? (
                <View style={{ alignItems: 'center', gap: 8, paddingVertical: 12 }}>
                  <Icon name="shield-checkmark" size={40} color={Colors.success} />
                  <Text style={{ fontSize: 15, fontWeight: '800', color: '#065F46' }}>Policy already issued</Text>
                  {q.approvedAt && <Text style={{ fontSize: 13, color: Colors.textMuted }}>Paid on {fmtDate(q.approvedAt)}</Text>}
                  {ar && <Text style={{ fontSize: 18, fontWeight: '900', color: Colors.success, marginTop: 4 }}>{fmtMoney(ar.totalPremium)}/yr</Text>}
                </View>
              ) : (
                <>
                  <Text style={sh.cardTitle}>Generate Payment Link</Text>
                  <View style={sh.insetCallout}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: Colors.text, marginBottom: 4 }}>Customer approved this quote</Text>
                    <Text style={{ fontSize: 12, color: Colors.textMuted, lineHeight: 18 }}>
                      Generate a Razorpay payment link and share it. Policy activates automatically on payment.
                    </Text>
                    {ar && <Text style={{ fontSize: 18, fontWeight: '900', color: Colors.primary, marginTop: 8 }}>{fmtMoney(ar.totalPremium)}/yr</Text>}
                  </View>

                  {!!payErr && (
                    <View style={[sh.errBox, { marginBottom: 12 }]}>
                      <Icon name="alert-circle-outline" size={15} color={Colors.error} />
                      <Text style={sh.errText}>{payErr}</Text>
                    </View>
                  )}

                  {payUrl ? (
                    <>
                      <View style={[sh.insetCallout, { marginBottom: 12 }]}>
                        <Text style={{ fontSize: 11, color: Colors.textMuted, fontFamily: 'monospace' }} selectable>{payUrl}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity
                          style={[sh.submitBtn, { flex: 1, backgroundColor: Colors.primary }]}
                          onPress={() => Share.share({
                            message: `Hi${q.user?.name ? ' ' + q.user.name : ''}! Here is your ${q.type} insurance payment link:\n\n${payUrl}\n\nTotal: ${ar ? fmtMoney(ar.totalPremium) + '/yr' : ''}. Your policy activates automatically once payment is confirmed.`,
                            url: payUrl,
                          })}
                          activeOpacity={0.85}
                        >
                          <Icon name="share-outline" size={17} color="#fff" />
                          <Text style={sh.submitBtnText}>Share Link</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[sh.submitBtn, { paddingHorizontal: 18, backgroundColor: Colors.bg, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border }]}
                          onPress={() => Linking.openURL(payUrl)} activeOpacity={0.85}
                        >
                          <Icon name="open-outline" size={17} color={Colors.primary} />
                        </TouchableOpacity>
                      </View>
                      <Text style={{ fontSize: 11, color: Colors.textMuted, textAlign: 'center', marginTop: 8 }}>
                        Share via WhatsApp, SMS, or any app. Policy activates once Razorpay confirms.
                      </Text>
                    </>
                  ) : (
                    <TouchableOpacity
                      style={[sh.submitBtn, { backgroundColor: Colors.primary, opacity: payLoading ? 0.7 : 1 }]}
                      onPress={generatePayment} disabled={payLoading} activeOpacity={0.85}
                    >
                      {payLoading
                        ? <ActivityIndicator color="#fff" />
                        : <><Icon name="link-outline" size={17} color="#fff" /><Text style={sh.submitBtnText}>Generate Payment Link</Text></>
                      }
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          )}

        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

// ── Quote Card ────────────────────────────────────────────────────────────────

function QuoteCard({ q, onOpen }: { q: AgentQuote; onOpen: () => void }) {
  const color   = TYPE_COLOR[q.type] ?? Colors.primary;
  const st      = STATUS_CFG[q.status] ?? STATUS_CFG.pending;
  const ar      = q.adminResponse;
  const details = parseDetails(q.details ?? {});
  const coverEntry = details.find(d => ['Sum Insured', 'Idv', 'Asset Value'].includes(d.label));
  const ageEntry   = details.find(d => d.label === 'Age');

  return (
    <TouchableOpacity style={c.card} onPress={onOpen} activeOpacity={0.85}>
      <View style={[c.colorBar, { backgroundColor: color }]} />
      <View style={c.inner}>
        {/* Top row */}
        <View style={c.topRow}>
          <View style={[c.typeTag, { borderColor: color + '45' }]}>
            <Text style={[c.typeText, { color }]}>{q.type.toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={c.userName}>{q.user?.name ?? q.user?.phone}</Text>
            <Text style={c.userMeta}>+91 {q.user?.phone} · {fmtDate(q.createdAt)}</Text>
          </View>
          <View style={[c.statusPill, { backgroundColor: st.bg }]}>
            <Text style={[c.statusText, { color: st.color }]}>{st.label}</Text>
          </View>
        </View>

        {/* Customer detail chips */}
        {(coverEntry || ageEntry) && (
          <View style={c.chipsRow}>
            {coverEntry && (
              <View style={c.chip}>
                <Icon name="shield-outline" size={11} color={Colors.textMuted} />
                <Text style={c.chipText}>{coverEntry.label} {coverEntry.value}</Text>
              </View>
            )}
            {ageEntry && (
              <View style={c.chip}>
                <Icon name="person-outline" size={11} color={Colors.textMuted} />
                <Text style={c.chipText}>Age {ageEntry.value}</Text>
              </View>
            )}
          </View>
        )}

        {/* Quoted amount row */}
        {ar ? (
          <View style={c.responseRow}>
            <Icon name="checkmark-circle" size={14} color={Colors.success} />
            <Text style={c.responseText}>{ar.insurer} · {ar.planName}</Text>
            <Text style={c.responseAmt}>{fmtMoney(ar.totalPremium)}/yr</Text>
          </View>
        ) : (
          <Text style={c.notQuoted}>Not quoted yet — tap to respond</Text>
        )}

        {/* CTA footer */}
        <View style={c.footer}>
          <Text style={[c.ctaText, { color }]}>
            {q.status === 'pending'   ? 'Send Quote →'
             : q.status === 'responded' ? 'Edit Quote →'
             : q.status === 'approved'  ? 'Generate Payment Link →'
             : 'View Details →'}
          </Text>
          <Text style={c.timeText}>{fmtTime(q.createdAt)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function AgentQuotesScreen() {
  const { agent } = useAgent();
  const [quotes,       setQuotes]       = useState<AgentQuote[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [activeTab,    setActiveTab]    = useState<Tab>('All');
  const [selectedQuote, setSelectedQuote] = useState<AgentQuote | null>(null);
  const [search,       setSearch]       = useState('');

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const { quotes: data } = await agentApi.getQuotes();
      setQuotes(data);
    } catch { /* silent */ } finally {
      setLoading(false); setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = quotes.filter(q => {
    if (activeTab !== 'All' && q.status !== activeTab.toLowerCase()) return false;
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (q.user?.name ?? '').toLowerCase().includes(s) ||
           q.user?.phone.includes(s) ||
           q.type.includes(s);
  });

  const counts = {
    pending:   quotes.filter(q => q.status === 'pending').length,
    responded: quotes.filter(q => q.status === 'responded').length,
    approved:  quotes.filter(q => q.status === 'approved').length,
    converted: quotes.filter(q => q.status === 'converted').length,
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.kicker}>Advisor</Text>
          <Text style={s.title}>Quotes</Text>
          <Text style={s.sub}>{agent?.name} · {counts.pending} pending</Text>
        </View>
      </View>

      {/* Stats strip */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.statsRow} style={s.statsScroll}>
        {[
          { label: 'Pending',   value: counts.pending,   color: '#D97706' },
          { label: 'Responded', value: counts.responded, color: '#1D4ED8' },
          { label: 'Approved',  value: counts.approved,  color: '#7C3AED' },
          { label: 'Converted', value: counts.converted, color: '#059669' },
          { label: 'Total',     value: quotes.length,    color: Colors.primary },
        ].map(st => (
          <View key={st.label} style={s.statChip}>
            <Text style={[s.statValue, { color: st.color }]}>{st.value}</Text>
            <Text style={s.statLabel}>{st.label}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Search */}
      <View style={s.searchWrap}>
        <View style={{ flex: 1 }}>
          <View style={af.inputRow}>
            <View style={af.prefix}>
              <Icon name="search-outline" size={20} color={Colors.primary} />
            </View>
            <TextInput
              style={af.input}
              placeholder="Search name, phone, type…"
              placeholderTextColor={Colors.textLight}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
            />
            {!!search && (
              <TouchableOpacity onPress={() => setSearch('')} style={{ paddingRight: 12, paddingVertical: 12 }} activeOpacity={0.7}>
                <Icon name="close-circle" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabRow} style={s.tabScroll}>
        {TABS.map(tab => {
          const active = activeTab === tab;
          const cfg    = tab !== 'All' ? STATUS_CFG[tab.toLowerCase()] : null;
          return (
            <TouchableOpacity key={tab}
              style={[s.tab, active && { backgroundColor: cfg?.color ?? Colors.primary, borderColor: cfg?.color ?? Colors.primary }]}
              onPress={() => setActiveTab(tab)} activeOpacity={0.75}
            >
              <Text style={[s.tabText, active && { color: '#fff' }]}>{tab}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Colors.primary} />}
        >
          {filtered.length === 0 ? (
            <View style={s.empty}>
              <View style={s.emptyIcon}>
                <Icon name="receipt-outline" size={28} color={Colors.primary} />
              </View>
              <Text style={s.emptyTitle}>No {activeTab === 'All' ? '' : activeTab.toLowerCase()} quotes</Text>
              <Text style={s.emptySub}>{search ? 'Try a different search' : 'Pull down to refresh'}</Text>
            </View>
          ) : (
            filtered.map(q => (
              <QuoteCard key={q.id} q={q} onOpen={() => setSelectedQuote(q)} />
            ))
          )}
        </ScrollView>
      )}

      <DetailSheet
        quote={selectedQuote}
        onClose={() => setSelectedQuote(null)}
        onDone={() => { setSelectedQuote(null); load(); }}
      />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.bg },
  header:      { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, backgroundColor: Colors.white, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  kicker:      { fontSize: 10, fontWeight: '800', color: Colors.textLight, letterSpacing: 1.2, marginBottom: 4 },
  title:       { fontSize: 24, fontWeight: '900', color: Colors.text, letterSpacing: -0.5 },
  sub:         { fontSize: 13, color: Colors.textMuted, fontWeight: '500', marginTop: 3 },

  statsScroll: { flexGrow: 0, backgroundColor: Colors.bg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  statsRow:    { paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  statChip:    {
    minWidth: 84,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    ...Platform.select({ ios: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 }, android: { elevation: 1 } }),
  },
  statValue:   { fontSize: 20, fontWeight: '900', letterSpacing: -0.4 },
  statLabel:   { fontSize: 10, fontWeight: '600', color: Colors.textMuted },

  searchWrap:  { marginHorizontal: 16, marginVertical: 10 },

  tabScroll:   { flexGrow: 0, backgroundColor: Colors.bg },
  tabRow:      { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  tab:         { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border, backgroundColor: Colors.white },
  tabText:     { fontSize: 12, fontWeight: '700', color: Colors.textMuted },

  center:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty:       { alignItems: 'center', paddingTop: 48, gap: 12, paddingHorizontal: 24 },
  emptyIcon:   { width: 56, height: 56, borderRadius: 16, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  emptyTitle:  { fontSize: 17, fontWeight: '800', color: Colors.text, textAlign: 'center' },
  emptySub:    { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
});

const c = StyleSheet.create({
  card:         { backgroundColor: Colors.white, borderRadius: 14, overflow: 'hidden', flexDirection: 'row', borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border, ...Platform.select({ ios: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 }, android: { elevation: 1 } }) },
  colorBar:     { width: 3 },
  inner:        { flex: 1, padding: 14, gap: 8 },
  topRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  typeTag:      { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: Colors.bg, borderWidth: StyleSheet.hairlineWidth },
  typeText:     { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  userName:     { fontSize: 14, fontWeight: '800', color: Colors.text },
  userMeta:     { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  statusPill:   { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 100, alignSelf: 'flex-start' },
  statusText:   { fontSize: 10, fontWeight: '700' },
  chipsRow:     { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip:         { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.bg, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1, borderColor: Colors.border },
  chipText:     { fontSize: 11, color: Colors.textMuted, fontWeight: '500' },
  responseRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.bg, borderRadius: 10, padding: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border },
  responseText: { flex: 1, fontSize: 12, color: Colors.text, fontWeight: '600' },
  responseAmt:  { fontSize: 13, fontWeight: '900', color: Colors.primary },
  notQuoted:    { fontSize: 12, color: Colors.textLight, fontStyle: 'italic' },
  footer:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border },
  ctaText:      { fontSize: 12, fontWeight: '700' },
  timeText:     { fontSize: 11, color: Colors.textMuted },
});

const SHADOW_CARD = Platform.select({ ios: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 }, android: { elevation: 1 } });

const sh = StyleSheet.create({
  backdrop:     { flex: 1, backgroundColor: 'rgba(10,22,40,0.5)' },
  sheet:        { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '94%', overflow: 'hidden' },

  sheetTop:     { backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  handleRow:    { alignItems: 'center', paddingTop: 10, paddingBottom: 6 },
  handle:       { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0' },
  sheetHeader:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 16, paddingBottom: 8 },
  headerIcon:   { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headerKicker: { fontSize: 10, fontWeight: '800', color: Colors.textLight, letterSpacing: 1, marginBottom: 4 },
  headerTitle:  { fontSize: 17, fontWeight: '900', color: Colors.text, letterSpacing: -0.3 },
  headerSub:    { fontSize: 12, color: Colors.textMuted, fontWeight: '500', marginTop: 2 },
  statusChipHeader: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, maxWidth: 120, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border, alignSelf: 'flex-start' },
  statusChipHeaderText: { fontSize: 10, fontWeight: '800' },
  headerCloseBtn:   { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
  summaryLine:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 12, padding: 12, backgroundColor: Colors.bg, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border },
  summaryLineText: { flex: 1, fontSize: 12, color: Colors.text, fontWeight: '600' },

  bodyScroll:   { backgroundColor: Colors.bg },

  tabBar:       { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border, backgroundColor: Colors.white },
  tabBtn:       { flex: 1, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText:      { fontSize: 13, fontWeight: '600', color: Colors.textMuted },

  card:         { backgroundColor: Colors.white, borderRadius: 14, padding: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border, ...SHADOW_CARD },
  cardNotice:   { backgroundColor: Colors.bg, borderColor: Colors.border },
  cardTitle:    { fontSize: 13, fontWeight: '800', color: Colors.text, marginBottom: 12 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  insetCallout: { backgroundColor: Colors.bg, borderRadius: 10, padding: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border, marginBottom: 16 },

  infoRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  infoVal:      { flex: 1, fontSize: 14, color: Colors.text, fontWeight: '500' },
  callBtn:      { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: Colors.primaryLight },
  callBtnText:  { fontSize: 12, fontWeight: '700' },

  detailsGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  detailItem:   { width: '48%', paddingVertical: 8, paddingHorizontal: 10, backgroundColor: Colors.bg, borderRadius: 10, marginBottom: 6, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border },
  detailLabel:  { fontSize: 10, fontWeight: '600', color: Colors.textMuted, marginBottom: 2 },
  detailValue:  { fontSize: 14, fontWeight: '700', color: Colors.text },

  statusChip:   { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center' },
  statusChipText: { fontSize: 12 },

  label:        { fontSize: 10, fontWeight: '800', color: Colors.textMuted, letterSpacing: 1, marginTop: 10, marginBottom: 4 },

  calcRow:      { flexDirection: 'row', backgroundColor: Colors.bg, borderRadius: 12, overflow: 'hidden', marginTop: 4, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border },
  calcCell:     { flex: 1, alignItems: 'center', paddingVertical: 12, gap: 3 },
  calcDivider:  { width: StyleSheet.hairlineWidth, backgroundColor: Colors.border },
  calcLabel:    { fontSize: 9, fontWeight: '700', color: Colors.textLight, letterSpacing: 0.5 },
  calcVal:      { fontSize: 15, fontWeight: '900', color: Colors.text },

  errBox:       { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#FEE2E2' },
  errText:      { flex: 1, fontSize: 13, color: Colors.error },

  submitBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 15, borderRadius: 14, marginTop: 8 },
  submitBtnText:{ fontSize: 14, fontWeight: '800', color: '#fff' },
});
