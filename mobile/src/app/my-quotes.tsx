import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal,
  RefreshControl, ActivityIndicator, Linking, Animated, Dimensions,
  TouchableWithoutFeedback, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { quotesApi, paymentsApi, ApiError } from '@/lib/api';
import { Icon } from '@/components/Icon';
import { BackButton } from '@/components/BackButton';
import { Colors } from '@/constants/theme';
import { useDialog } from '@/components/Dialog';

const { height: SCREEN_H } = Dimensions.get('window');

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

// ── Payment Bottom Sheet ──────────────────────────────────────────────────────

function PaymentSheet({
  visible, quote, onClose, onDone,
}: {
  visible: boolean; quote: QuoteRequest | null;
  onClose: () => void; onDone: () => void;
}) {
  const insets        = useSafeAreaInsets();
  const slideY        = useRef(new Animated.Value(SCREEN_H)).current;
  const bgOpacity     = useRef(new Animated.Value(0)).current;

  const [loading, setLoading] = useState(false);
  const [payUrl,  setPayUrl]  = useState<string | null>(null);
  const [err,     setErr]     = useState<string | null>(null);
  const { alert } = useDialog();

  const color = quote ? (TYPE_COLOR[quote.type] ?? Colors.primary) : Colors.primary;
  const ar    = quote?.adminResponse;

  useEffect(() => {
    if (visible) {
      setPayUrl(null); setErr(null);
      Animated.parallel([
        Animated.spring(slideY,    { toValue: 0, useNativeDriver: true, damping: 24, stiffness: 240, mass: 0.9 }),
        Animated.timing(bgOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideY,    { toValue: SCREEN_H, duration: 240, useNativeDriver: true }),
        Animated.timing(bgOpacity, { toValue: 0,        duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleAccept = async () => {
    if (!quote) return;
    setLoading(true); setErr(null);
    try {
      if (quote.status === 'approved') {
        const { paymentUrl: url } = await paymentsApi.createRazorpayLink(undefined, quote.id);
        setPayUrl(url);
        return;
      }
      const { policy } = await quotesApi.approve(quote.id);
      const { paymentUrl } = await paymentsApi.createRazorpayLink(policy.id);
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
      onDone();
    } catch {
      alert({ type: 'error', title: 'Error', message: 'Could not open payment page.' });
    }
  };

  if (!visible && !quote) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[ps.backdrop, { opacity: bgOpacity }]} />
      </TouchableWithoutFeedback>

      <Animated.View style={[ps.sheet, { maxHeight: SCREEN_H * 0.92, paddingBottom: insets.bottom || 24, transform: [{ translateY: slideY }] }]}>

        {/* ── Hero — flush to rounded top corners ── */}
        <View style={[ps.hero, { backgroundColor: color }]}>
          {/* Decorative blobs */}
          <View style={ps.blob1} />
          <View style={ps.blob2} />
          <View style={ps.blob3} />

          {/* Drag pill sits on colour */}
          <View style={ps.pillRow}><View style={ps.pill} /></View>

          {/* Top row: type pill + close */}
          <View style={ps.heroTopRow}>
            <View style={ps.typePill}>
              <Text style={ps.typePillText}>
                {TYPE_LABEL[quote?.type ?? ''] ?? quote?.type?.toUpperCase()} INSURANCE
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={ps.closeBtn} activeOpacity={0.7}>
              <Icon name="close" size={17} color="rgba(255,255,255,0.9)" />
            </TouchableOpacity>
          </View>

          {/* Insurer + plan */}
          <Text style={ps.heroInsurer} numberOfLines={1}>{ar?.insurer ?? '—'}</Text>
          <Text style={ps.heroPlan}    numberOfLines={1}>{ar?.planName ?? ''}</Text>

          {/* Amount band */}
          {ar && (
            <View style={ps.amountBand}>
              <View style={ps.amountLeft}>
                <Text style={ps.amountEyebrow}>TOTAL DUE</Text>
                <Text style={ps.amountValue}>{fmtInr(ar.totalPremium)}</Text>
                <Text style={ps.amountSub}>per year · incl. 18% GST</Text>
              </View>
              <View style={ps.amountRight}>
                <View style={ps.amountChip}>
                  <Icon name="shield-checkmark" size={12} color="rgba(255,255,255,0.9)" />
                  <Text style={ps.amountChipText}>Secured</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* ── Scrollable body ── */}
        <ScrollView
          contentContainerStyle={[ps.body, { paddingBottom: 8 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Premium breakdown table */}
          {ar && (
            <View style={ps.section}>
              <Text style={ps.sectionLabel}>PREMIUM BREAKDOWN</Text>
              <View style={[ps.table, { borderTopWidth: 3, borderTopColor: color }]}>
                <View style={ps.tableRow}>
                  <Text style={ps.tableLabel}>Net Premium</Text>
                  <Text style={ps.tableValue}>{fmtInr(ar.netPremium)}</Text>
                </View>
                <View style={ps.tableDivider} />
                <View style={ps.tableRow}>
                  <View>
                    <Text style={ps.tableLabel}>GST</Text>
                    <Text style={ps.tableSubLabel}>@ 18%</Text>
                  </View>
                  <Text style={ps.tableValue}>{fmtInr(ar.gst)}</Text>
                </View>
                <View style={[ps.tableDivider, { borderStyle: 'dashed' }]} />
                <View style={[ps.tableRow, ps.totalRow]}>
                  <Text style={ps.totalLabel}>Total / Year</Text>
                  <Text style={[ps.totalValue, { color }]}>{fmtInr(ar.totalPremium)}</Text>
                </View>
                {ar.notes && (
                  <View style={ps.notesRow}>
                    <Icon name="chatbubble-ellipses-outline" size={13} color={Colors.textMuted} />
                    <Text style={ps.notesText}>"{ar.notes}"</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Trust badges */}
          <View style={ps.trustRow}>
            {[
              { icon: 'lock-closed',      label: '256-bit SSL' },
              { icon: 'shield-checkmark', label: 'Razorpay' },
              { icon: 'checkmark-circle', label: 'IRDAI Licensed' },
            ].map(t => (
              <View key={t.label} style={ps.trustBadge}>
                <Icon name={t.icon as any} size={13} color={Colors.success} />
                <Text style={ps.trustText}>{t.label}</Text>
              </View>
            ))}
          </View>

          {/* Error */}
          {err && (
            <View style={ps.errBox}>
              <Icon name="alert-circle-outline" size={16} color={Colors.error} />
              <Text style={ps.errText}>{err}</Text>
            </View>
          )}

          {/* ── State: pre-payment ── */}
          {!payUrl ? (
            <View style={ps.ctaSection}>
              <View style={ps.infoBox}>
                <Icon name="information-circle-outline" size={16} color={Colors.primary} />
                <Text style={ps.infoText}>
                  Accepting this quote creates your policy and generates a secure Razorpay payment link.
                </Text>
              </View>

              <TouchableOpacity
                style={[ps.ctaBtn, { backgroundColor: color, opacity: loading ? 0.72 : 1 }]}
                onPress={handleAccept}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <>
                    <ActivityIndicator color={Colors.white} size="small" />
                    <Text style={ps.ctaBtnText}>Creating Payment Link…</Text>
                  </>
                ) : (
                  <>
                    <Icon name="checkmark-circle" size={20} color={Colors.white} />
                    <Text style={ps.ctaBtnText}>Accept Quote & Pay</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={ps.cancelBtn} onPress={onClose} activeOpacity={0.6}>
                <Text style={ps.cancelText}>Maybe later</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* ── State: link ready ── */
            <View style={ps.ctaSection}>
              <View style={ps.successBanner}>
                <View style={[ps.successIcon, { backgroundColor: '#DCFCE7' }]}>
                  <Icon name="checkmark-circle" size={26} color={Colors.success} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={ps.successTitle}>Quote Accepted!</Text>
                  <Text style={ps.successSub}>Your secure Razorpay link is ready.</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[ps.ctaBtn, { backgroundColor: color }]}
                onPress={openPayment}
                activeOpacity={0.85}
              >
                <Icon name="card-outline" size={20} color={Colors.white} />
                <Text style={ps.ctaBtnText}>Pay Now via Razorpay</Text>
                <Icon name="arrow-forward" size={18} color="rgba(255,255,255,0.75)" />
              </TouchableOpacity>

              <Text style={ps.footnote}>
                You'll be redirected to a secure Razorpay page.{'\n'}Your policy activates automatically after payment.
              </Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

// ── Status Timeline (shared) ──────────────────────────────────────────────────

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
              <Text style={[tl.label, cur && { color: c, fontWeight: '800' }]}>{s.label}</Text>
              <Text style={[tl.sub, cur && { color: c }]}>{s.sub}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ── Bottom sheet base ─────────────────────────────────────────────────────────
// Content-height: sheet grows to fit its children, capped at 90% of screen.

function BottomSheet({
  visible, onClose, children, noHandle = false,
}: {
  visible: boolean; onClose: () => void; children: React.ReactNode; noHandle?: boolean;
}) {
  const insets    = useSafeAreaInsets();
  const slideY    = useRef(new Animated.Value(SCREEN_H)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideY,    { toValue: 0, useNativeDriver: true, damping: 24, stiffness: 240, mass: 0.9 }),
        Animated.timing(bgOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideY,    { toValue: SCREEN_H, duration: 240, useNativeDriver: true }),
        Animated.timing(bgOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[bs.backdrop, { opacity: bgOpacity }]} />
      </TouchableWithoutFeedback>
      <Animated.View style={[bs.sheet, { maxHeight: SCREEN_H * 0.9, paddingBottom: insets.bottom || 24 }, { transform: [{ translateY: slideY }] }]}>
        {!noHandle && <View style={bs.handleWrap}><View style={bs.handle} /></View>}
        {children}
      </Animated.View>
    </Modal>
  );
}

// ── Timeline Sheet ────────────────────────────────────────────────────────────

function TimelineSheet({ visible, quote, onClose }: {
  visible: boolean; quote: QuoteRequest | null; onClose: () => void;
}) {
  const color       = quote ? (TYPE_COLOR[quote.type] ?? Colors.primary) : Colors.primary;
  const st          = quote ? (STATUS_CFG[quote.status] ?? STATUS_CFG.pending) : STATUS_CFG.pending;
  const currentStep = statusToStep(quote?.status ?? 'pending');

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      {/* ── Sheet header ── */}
      <View style={ts.header}>
        <View style={[ts.iconCircle, { backgroundColor: color + '1A' }]}>
          <Icon name="git-branch-outline" size={20} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={ts.title}>Track Status</Text>
          <Text style={ts.subtitle}>{TYPE_LABEL[quote?.type ?? ''] ?? quote?.type} Insurance</Text>
        </View>
        <View style={[ts.chip, { backgroundColor: st.bg }]}>
          <Text style={[ts.chipText, { color: st.color }]}>{st.label}</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={ts.closeBtn} activeOpacity={0.7}>
          <Icon name="close" size={16} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* ── Steps ── */}
      {quote?.status === 'expired' ? (
        <View style={ts.expiredWrap}>
          <View style={ts.expiredIconCircle}>
            <Icon name="close-circle-outline" size={30} color="#9CA3AF" />
          </View>
          <Text style={ts.expiredTitle}>Quote Expired</Text>
          <Text style={ts.expiredSub}>This request has expired. Submit a new one to get a fresh quote.</Text>
        </View>
      ) : (
        <View style={ts.stepsWrap}>
          {TIMELINE_STEPS.map((step, i) => {
            const done = i <= currentStep;
            const cur  = i === currentStep;
            const c    = STATUS_CFG[step.key]?.color ?? Colors.primary;
            const isLast = i === TIMELINE_STEPS.length - 1;
            return (
              <View key={step.key} style={ts.stepRow}>
                {/* Left: dot + connector line */}
                <View style={ts.stepTrack}>
                  <View style={[ts.stepDot,
                    done ? { backgroundColor: c, borderColor: c } : { backgroundColor: Colors.white, borderColor: Colors.border }
                  ]}>
                    {done && <Icon name="checkmark" size={10} color={Colors.white} />}
                  </View>
                  {!isLast && (
                    <View style={[ts.stepLine, { backgroundColor: i < currentStep ? c : Colors.border }]} />
                  )}
                </View>
                {/* Right: text */}
                <View style={[ts.stepContent, !isLast && { paddingBottom: 28 }]}>
                  <View style={cur ? [ts.stepHighlight, { backgroundColor: c + '0F', borderColor: c + '30' }] : null}>
                    <View style={ts.stepTitleRow}>
                      <Text style={[ts.stepLabel, done && { color: Colors.text }, cur && { color: c, fontWeight: '800' }]}>
                        {step.label}
                      </Text>
                      {cur && (
                        <View style={[ts.nowBadge, { backgroundColor: c }]}>
                          <Text style={ts.nowBadgeText}>NOW</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[ts.stepSub, cur && { color: c + 'BB' }]}>{step.sub}</Text>
                    {cur && step.key === 'pending' && (
                      <Text style={[ts.stepEta, { color: c }]}>⏱ Usually within 24 hours</Text>
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

// ── Details Sheet ─────────────────────────────────────────────────────────────

const DETAIL_LABEL: Record<string, string> = {
  sumInsured: 'Sum Insured', idv: 'IDV', assetValue: 'Asset Value',
  planName: 'Plan', dob: 'Date of Birth', age: 'Age', smoker: 'Smoker',
  members: 'Members', vehicleType: 'Vehicle Type', fuelType: 'Fuel Type',
  makeModel: 'Make / Model', year: 'Year', destination: 'Destination',
  travelDays: 'Travel Days', travellers: 'Travellers', propertyType: 'Property Type',
  city: 'City', pincode: 'Pincode', industry: 'Industry', employees: 'Employees',
};

function DetailsSheet({ visible, quote, onClose }: {
  visible: boolean; quote: QuoteRequest | null; onClose: () => void;
}) {
  const color = quote ? (TYPE_COLOR[quote.type] ?? Colors.primary) : Colors.primary;
  const ar    = quote?.adminResponse;

  const detailRows = Object.entries(quote?.details ?? {})
    .filter(([k]) => k !== 'planName' && DETAIL_LABEL[k])
    .map(([k, v]) => ({ label: DETAIL_LABEL[k], value: String(v) }));

  return (
    <BottomSheet visible={visible} onClose={onClose} noHandle>
      {/* ── Coloured hero — fills right to the rounded top edge ── */}
      <View style={[ds.hero, { backgroundColor: color }]}>
        <View style={ds.heroBg1} />
        <View style={ds.heroBg2} />
        {/* Drag pill sits on the colour, not on white */}
        <View style={ds.handleRow}>
          <View style={ds.handlePill} />
        </View>
        <View style={ds.heroInner}>
          <View style={{ flex: 1 }}>
            <Text style={ds.heroEyebrow}>QUOTE DETAILS</Text>
            <Text style={ds.heroType}>{TYPE_LABEL[quote?.type ?? ''] ?? quote?.type} Insurance</Text>
            {ar && <Text style={ds.heroSub} numberOfLines={1}>{ar.insurer} · {ar.planName}</Text>}
          </View>
          <TouchableOpacity onPress={onClose} style={ds.closeBtn} activeOpacity={0.7}>
            <Icon name="close" size={17} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Scrollable content ── */}
      <ScrollView
        contentContainerStyle={ds.body}
        showsVerticalScrollIndicator={false}
        style={{ maxHeight: SCREEN_H * 0.55 }}
      >
        {/* Submission */}
        <View style={ds.section}>
          <Text style={ds.sectionLabel}>SUBMISSION</Text>
          <View style={ds.table}>
            <View style={ds.tableRow}>
              <Text style={ds.tableLabel}>Requested on</Text>
              <Text style={ds.tableValue}>{fmtDate(quote?.createdAt ?? '')}</Text>
            </View>
            <View style={ds.tableDivider} />
            <View style={ds.tableRow}>
              <Text style={ds.tableLabel}>Type</Text>
              <Text style={ds.tableValue}>{TYPE_LABEL[quote?.type ?? ''] ?? quote?.type ?? '—'}</Text>
            </View>
            <View style={ds.tableDivider} />
            <View style={[ds.tableRow, ds.tableRowLast]}>
              <Text style={ds.tableLabel}>Status</Text>
              <View style={[ds.inlineChip, { backgroundColor: STATUS_CFG[quote?.status ?? 'pending']?.bg }]}>
                <Text style={[ds.inlineChipText, { color: STATUS_CFG[quote?.status ?? 'pending']?.color }]}>
                  {STATUS_CFG[quote?.status ?? 'pending']?.label}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Requirements */}
        {detailRows.length > 0 && (
          <View style={ds.section}>
            <Text style={ds.sectionLabel}>YOUR REQUIREMENTS</Text>
            <View style={ds.table}>
              {detailRows.map((row, i) => (
                <View key={row.label}>
                  <View style={[ds.tableRow, i === detailRows.length - 1 && ds.tableRowLast]}>
                    <Text style={ds.tableLabel}>{row.label}</Text>
                    <Text style={ds.tableValue}>{row.value}</Text>
                  </View>
                  {i < detailRows.length - 1 && <View style={ds.tableDivider} />}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Advisor quote */}
        {ar && (
          <View style={ds.section}>
            <Text style={ds.sectionLabel}>ADVISOR'S QUOTE</Text>
            <View style={[ds.table, { borderTopWidth: 3, borderTopColor: color }]}>
              <View style={ds.tableRow}>
                <Text style={ds.tableLabel}>Insurer</Text>
                <Text style={[ds.tableValue, { fontWeight: '800', color: Colors.text }]}>{ar.insurer}</Text>
              </View>
              <View style={ds.tableDivider} />
              <View style={ds.tableRow}>
                <Text style={ds.tableLabel}>Plan</Text>
                <Text style={ds.tableValue}>{ar.planName}</Text>
              </View>
              <View style={ds.tableDivider} />
              <View style={ds.tableRow}>
                <Text style={ds.tableLabel}>Net Premium</Text>
                <Text style={ds.tableValue}>{fmtInr(ar.netPremium)}</Text>
              </View>
              <View style={ds.tableDivider} />
              <View style={ds.tableRow}>
                <Text style={ds.tableLabel}>GST (18%)</Text>
                <Text style={ds.tableValue}>{fmtInr(ar.gst)}</Text>
              </View>
              <View style={[ds.tableDivider, { borderStyle: 'dashed' }]} />
              <View style={[ds.tableRow, ds.totalRow]}>
                <Text style={ds.totalLabel}>Total / Year</Text>
                <Text style={[ds.totalValue, { color }]}>{fmtInr(ar.totalPremium)}</Text>
              </View>
              {ar.notes && (
                <View style={ds.notesRow}>
                  <Icon name="chatbubble-ellipses-outline" size={13} color={Colors.textMuted} />
                  <Text style={ds.notesText}>"{ar.notes}"</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </BottomSheet>
  );
}

// ── Quote Card — mirrors PlanCard structure exactly ───────────────────────────

function QuoteCard({
  q, onAccept, onTrack, onDetails,
}: {
  q: QuoteRequest;
  onAccept:  (q: QuoteRequest) => void;
  onTrack:   (q: QuoteRequest) => void;
  onDetails: (q: QuoteRequest) => void;
}) {
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
          {/* Advisor banner */}
          <View style={qc.advisorBanner}>
            <View style={qc.advisorAvatar}>
              <Icon name="person-outline" size={14} color={color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={qc.advisorLabel}>Quote from your advisor</Text>
              <Text style={qc.advisorName}>{ar.insurer}</Text>
            </View>
            <View style={[qc.advisorBadge, { backgroundColor: color + '15' }]}>
              <Text style={[qc.advisorBadgeText, { color }]}>{ar.planName}</Text>
            </View>
          </View>

          {/* Premium breakdown strip */}
          <View style={qc.premiumStrip}>
            <View style={qc.premiumStripItem}>
              <Text style={qc.premiumStripLabel}>NET</Text>
              <Text style={qc.premiumStripVal}>{fmtInr(ar.netPremium)}</Text>
            </View>
            <View style={qc.premiumStripPlus}>
              <Text style={qc.premiumStripPlusText}>+</Text>
            </View>
            <View style={qc.premiumStripItem}>
              <Text style={qc.premiumStripLabel}>GST 18%</Text>
              <Text style={qc.premiumStripVal}>{fmtInr(ar.gst)}</Text>
            </View>
            <View style={qc.premiumStripEq}>
              <Text style={qc.premiumStripPlusText}>=</Text>
            </View>
            <View style={[qc.premiumStripItem, qc.premiumStripTotal]}>
              <Text style={qc.premiumStripLabel}>TOTAL / YR</Text>
              <Text style={[qc.premiumStripVal, qc.premiumStripTotalVal, { color }]}>
                {fmtInr(ar.totalPremium)}
              </Text>
            </View>
          </View>

          {ar.notes && (
            <View style={qc.notesRow}>
              <Icon name="chatbubble-outline" size={12} color={Colors.textMuted} />
              <Text style={qc.quoteNotes}>"{ar.notes}"</Text>
            </View>
          )}

          {q.status === 'approved' && (
            <View style={qc.infoRow}>
              <Icon name="time-outline" size={13} color="#D97706" />
              <Text style={qc.infoText}>Payment received — verifying within 1–2 hrs.</Text>
            </View>
          )}
          {q.status === 'converted' && (
            <View style={[qc.infoRow, { backgroundColor: Colors.successLight ?? '#ECFDF5' }]}>
              <Icon name="shield-checkmark-outline" size={13} color={Colors.success} />
              <Text style={[qc.infoText, { color: Colors.success }]}>Policy issued. Check My Policies.</Text>
            </View>
          )}
        </View>
      )}

      {/* Pending awaiting state */}
      {q.status === 'pending' && (
        <View style={qc.awaitingRow}>
          <View style={qc.awaitingIconWrap}>
            <Icon name="time-outline" size={16} color="#D97706" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={qc.awaitingTitle}>Advisor is on it</Text>
            <Text style={qc.awaitingText}>Your personalised quote is being prepared — usually ready within 24 hours.</Text>
          </View>
        </View>
      )}

      {/* ── Actions row ──────────────────────────────────── */}
      <View style={qc.actions}>
        <TouchableOpacity style={qc.actionBtn} onPress={() => onDetails(q)} activeOpacity={0.75}>
          <Icon name="document-text-outline" size={14} color={Colors.textMuted} />
          <Text style={qc.actionBtnText}>Details</Text>
        </TouchableOpacity>
        <View style={qc.actionDivider} />
        <TouchableOpacity style={qc.actionBtn} onPress={() => onTrack(q)} activeOpacity={0.75}>
          <Icon name="git-branch-outline" size={14} color={Colors.textMuted} />
          <Text style={qc.actionBtnText}>Track Status</Text>
        </TouchableOpacity>
        {q.status === 'responded' && (
          <>
            <View style={qc.actionDivider} />
            <TouchableOpacity style={[qc.acceptBtn, { backgroundColor: color }]} onPress={() => onAccept(q)} activeOpacity={0.85}>
              <Icon name="card-outline" size={14} color={Colors.white} />
              <Text style={qc.acceptBtnText}>Accept & Pay</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

const AUTO_REFRESH_MS = 30_000; // 30 s

export default function MyQuotesScreen() {
  const router = useRouter();
  const { alert } = useDialog();
  const [quotes, setQuotes]             = useState<QuoteRequest[]>([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [spinning, setSpinning]         = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [paymentQuote, setPaymentQuote] = useState<QuoteRequest | null>(null);
  const [trackingQuote, setTrackingQuote] = useState<QuoteRequest | null>(null);
  const [detailsQuote,  setDetailsQuote]  = useState<QuoteRequest | null>(null);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const spinLoop = useRef<Animated.CompositeAnimation | null>(null);

  const startSpin = useCallback(() => {
    spinAnim.setValue(0);
    spinLoop.current = Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 700, useNativeDriver: true })
    );
    spinLoop.current.start();
  }, [spinAnim]);

  const stopSpin = useCallback(() => {
    spinLoop.current?.stop();
    spinAnim.setValue(0);
  }, [spinAnim]);

  const load = useCallback(async (refresh = false, silent = false) => {
    if (refresh) setRefreshing(true);
    else if (!silent) setLoading(true);
    if (silent) { setSpinning(true); startSpin(); }
    setError(null);
    try {
      const { quotes: data } = await quotesApi.list();
      setQuotes(data as unknown as QuoteRequest[]);
    } catch (e) {
      if (!silent) setError(e instanceof ApiError ? e.message : 'Failed to load quotes');
    } finally {
      setLoading(false); setRefreshing(false);
      setSpinning(false); stopSpin();
    }
  }, [startSpin, stopSpin]);

  // Initial load
  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 30 s while screen is focused
  useFocusEffect(
    useCallback(() => {
      const timer = setInterval(() => load(false, true), AUTO_REFRESH_MS);
      return () => clearInterval(timer);
    }, [load])
  );

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
        <TouchableOpacity
          style={s.refreshBtn}
          onPress={() => load(false, true)}
          disabled={spinning || refreshing}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Animated.View style={{
            transform: [{
              rotate: spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] })
            }]
          }}>
            <Icon name="refresh-outline" size={20} color={spinning ? Colors.primary : Colors.textMuted} />
          </Animated.View>
        </TouchableOpacity>
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
            <QuoteCard
              key={q.id} q={q}
              onAccept={setPaymentQuote}
              onTrack={setTrackingQuote}
              onDetails={setDetailsQuote}
            />
          ))}
        </ScrollView>
      )}

      <PaymentSheet
        visible={!!paymentQuote}
        quote={paymentQuote}
        onClose={() => setPaymentQuote(null)}
        onDone={handlePaymentDone}
      />
      <TimelineSheet
        visible={!!trackingQuote}
        quote={trackingQuote}
        onClose={() => setTrackingQuote(null)}
      />
      <DetailsSheet
        visible={!!detailsQuote}
        quote={detailsQuote}
        onClose={() => setDetailsQuote(null)}
      />
    </SafeAreaView>
  );
}

// ── Quote Card Styles ─────────────────────────────────────────────────────────

const qc = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 18, marginBottom: 16,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  top: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, padding: 16, paddingBottom: 12,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText:     { fontSize: 15, fontWeight: '800' },
  typeLine:       { fontSize: 14, fontWeight: '700', color: Colors.text },
  planNameInline: { fontSize: 12, fontWeight: '500', color: Colors.textMuted },
  subLine:        { fontSize: 12, color: Colors.textMuted, marginTop: 3 },
  statusPill:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, alignSelf: 'flex-start' },
  statusText:     { fontSize: 10, fontWeight: '700' },

  metaRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 13,
    backgroundColor: Colors.bg,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  metaItem:  { flex: 1 },
  metaLabel: { fontSize: 9, color: Colors.textLight, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4, textTransform: 'uppercase' },
  metaValue: { fontSize: 13, fontWeight: '700', color: Colors.text },

  // Advisor quote panel
  quotePanel: {
    paddingHorizontal: 16, paddingVertical: 14, gap: 10,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },

  // Advisor banner row
  advisorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.bg, borderRadius: 12, padding: 11,
  },
  advisorAvatar: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  advisorLabel: { fontSize: 10, color: Colors.textLight, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  advisorName:  { fontSize: 13, fontWeight: '800', color: Colors.text, marginTop: 1 },
  advisorBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, maxWidth: 110 },
  advisorBadgeText: { fontSize: 10, fontWeight: '700', numberOfLines: 1 } as any,

  // Premium strip
  premiumStrip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bg, borderRadius: 12, padding: 12, gap: 4,
  },
  premiumStripItem:     { flex: 1, alignItems: 'center' },
  premiumStripLabel:    { fontSize: 8, fontWeight: '700', color: Colors.textLight, letterSpacing: 0.5, marginBottom: 3, textTransform: 'uppercase' },
  premiumStripVal:      { fontSize: 12, fontWeight: '800', color: Colors.text },
  premiumStripPlus:     { paddingHorizontal: 2 },
  premiumStripEq:       { paddingHorizontal: 2 },
  premiumStripPlusText: { fontSize: 13, color: Colors.textLight, fontWeight: '500' },
  premiumStripTotal:    { flex: 1.4 },
  premiumStripTotalVal: { fontSize: 14, fontWeight: '900', letterSpacing: -0.3 },

  notesRow:   { flexDirection: 'row', gap: 7, alignItems: 'flex-start' },
  quoteNotes: { flex: 1, fontSize: 12, color: Colors.textMuted, fontStyle: 'italic', lineHeight: 17 },

  infoRow: {
    flexDirection: 'row', gap: 8, alignItems: 'center',
    backgroundColor: '#FFFBEB', borderRadius: 10, padding: 11,
  },
  infoText: { flex: 1, fontSize: 12, color: '#92400E', lineHeight: 17 },

  // Awaiting advisor banner
  awaitingRow: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    marginHorizontal: 16, marginTop: 12, marginBottom: 14,
    backgroundColor: '#FFFBEB',
    borderRadius: 12, padding: 13,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  awaitingIconWrap: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#FEF3C7',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  awaitingTitle: { fontSize: 13, fontWeight: '700', color: '#92400E', marginBottom: 3 },
  awaitingText:  { fontSize: 12, color: '#B45309', lineHeight: 17 },

  actions: {
    flexDirection: 'row', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 13,
  },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
  actionDivider: { width: 1, height: 20, backgroundColor: Colors.border },
  acceptBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 13, margin: 10, borderRadius: 12,
  },
  acceptBtnText: { fontSize: 12, fontWeight: '800', color: Colors.white },
});

// ── Timeline Styles (used by StatusTimeline inside DetailsSheet) ──────────────

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

// ── Shared bottom sheet base styles ──────────────────────────────────────────

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

// ── Timeline Sheet Styles ─────────────────────────────────────────────────────

const ts = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingTop: 4, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  iconCircle: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  title:    { fontSize: 17, fontWeight: '800', color: Colors.text, letterSpacing: -0.3 },
  subtitle: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  chip: { paddingHorizontal: 11, paddingVertical: 5, borderRadius: 20 },
  chipText: { fontSize: 11, fontWeight: '700' },
  closeBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center',
  },

  // Expired
  expiredWrap: {
    alignItems: 'center', paddingHorizontal: 32,
    paddingTop: 28, paddingBottom: 32, gap: 10,
  },
  expiredIconCircle: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  expiredTitle: { fontSize: 17, fontWeight: '800', color: Colors.text },
  expiredSub:   { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },

  // Steps
  stepsWrap: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24 },
  stepRow:   { flexDirection: 'row', gap: 16 },

  stepTrack: { alignItems: 'center', width: 26 },
  stepDot: {
    width: 26, height: 26, borderRadius: 13,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  stepLine: { width: 2, flex: 1, marginTop: 4, minHeight: 24 },

  stepContent: { flex: 1, paddingTop: 1 },
  stepHighlight: {
    borderRadius: 12, padding: 12, marginBottom: 2,
    borderWidth: 1,
  },
  stepTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  stepLabel:    { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  stepSub:      { fontSize: 12, color: Colors.textLight, lineHeight: 18 },
  stepEta:      { fontSize: 11, fontWeight: '700', marginTop: 7, letterSpacing: 0.1 },
  nowBadge:     { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  nowBadgeText: { fontSize: 9, fontWeight: '800', color: Colors.white, letterSpacing: 0.5 },
});

// ── Details Sheet Styles ──────────────────────────────────────────────────────

const ds = StyleSheet.create({
  // Hero — starts flush at the rounded sheet top, no white gap
  hero: {
    paddingHorizontal: 20, paddingTop: 0, paddingBottom: 22,
    overflow: 'hidden',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
  },
  handleRow:   { alignItems: 'center', paddingTop: 12, paddingBottom: 14 },
  handlePill:  { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.35)' },
  heroBg1: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.08)', top: -60, right: -30,
  },
  heroBg2: {
    position: 'absolute', width: 90, height: 90, borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.06)', bottom: -10, left: 50,
  },
  heroInner:   { flexDirection: 'row', alignItems: 'flex-start' },
  heroEyebrow: { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.55)', letterSpacing: 1.8, marginBottom: 6 },
  heroType:    { fontSize: 23, fontWeight: '900', color: Colors.white, letterSpacing: -0.5, lineHeight: 29 },
  heroSub:     { fontSize: 12, color: 'rgba(255,255,255,0.72)', marginTop: 5 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center', marginLeft: 12,
  },

  // Body
  body: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 8, gap: 18 },

  section:      { gap: 8 },
  sectionLabel: {
    fontSize: 10, fontWeight: '800', color: Colors.textLight,
    letterSpacing: 1.2, paddingLeft: 4,
  },

  // Table card
  table: {
    backgroundColor: Colors.white,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 13,
  },
  tableRowLast: {},
  tableDivider: { height: 1, backgroundColor: Colors.bg, marginHorizontal: 16 },
  tableLabel:   { fontSize: 13, color: Colors.textMuted },
  tableValue:   { fontSize: 13, fontWeight: '600', color: Colors.text, textAlign: 'right', maxWidth: '58%' },

  inlineChip:     { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  inlineChipText: { fontSize: 11, fontWeight: '700' },

  // Total row
  totalRow: {
    paddingHorizontal: 16, paddingVertical: 15,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.bg,
  },
  totalLabel: { fontSize: 14, fontWeight: '700', color: Colors.text },
  totalValue: { fontSize: 24, fontWeight: '900', letterSpacing: -0.6 },

  // Notes
  notesRow: {
    flexDirection: 'row', gap: 9, alignItems: 'flex-start',
    paddingHorizontal: 16, paddingVertical: 13,
    borderTopWidth: 1, borderTopColor: Colors.bg,
  },
  notesText: { flex: 1, fontSize: 12, color: Colors.textMuted, fontStyle: 'italic', lineHeight: 18 },
});

// ── Payment Sheet Styles ──────────────────────────────────────────────────────

const ps = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.52)',
  },

  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.14, shadowRadius: 24, elevation: 28,
  },

  // Hero — flush to rounded top, same pattern as DetailsSheet
  hero: {
    paddingHorizontal: 20, paddingBottom: 20,
    overflow: 'hidden',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
  },
  blob1: {
    position: 'absolute', width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.07)', top: -80, right: -50,
  },
  blob2: {
    position: 'absolute', width: 130, height: 130, borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.05)', bottom: -30, left: 30,
  },
  blob3: {
    position: 'absolute', width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.06)', top: 20, left: -10,
  },

  // Handle pill sits inside the hero colour
  pillRow:  { alignItems: 'center', paddingTop: 12, paddingBottom: 14 },
  pill:     { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.35)' },

  // Top row inside hero
  heroTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  typePill: {
    flex: 1, alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  typePillText: { fontSize: 9, fontWeight: '800', color: Colors.white, letterSpacing: 1.2 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center', marginLeft: 10,
  },

  heroInsurer: { fontSize: 24, fontWeight: '900', color: Colors.white, letterSpacing: -0.5, lineHeight: 30 },
  heroPlan:    { fontSize: 13, color: 'rgba(255,255,255,0.72)', marginTop: 3, marginBottom: 18 },

  // Amount band at the bottom of the hero
  amountBand: {
    flexDirection: 'row', alignItems: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 16, padding: 14, gap: 10,
  },
  amountLeft:     { flex: 1, gap: 2 },
  amountEyebrow:  { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.55)', letterSpacing: 1.8 },
  amountValue:    { fontSize: 34, fontWeight: '900', color: Colors.white, letterSpacing: -1, lineHeight: 40 },
  amountSub:      { fontSize: 11, color: 'rgba(255,255,255,0.6)' },
  amountRight:    { paddingBottom: 4 },
  amountChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
  },
  amountChipText: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.9)' },

  // Scrollable body
  body: { paddingHorizontal: 16, paddingTop: 18, gap: 14 },

  // Section label + table (matches DetailsSheet)
  section:      { gap: 8 },
  sectionLabel: { fontSize: 10, fontWeight: '800', color: Colors.textLight, letterSpacing: 1.2, paddingLeft: 4 },
  table: {
    backgroundColor: Colors.white,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 13,
  },
  tableLabel:    { fontSize: 13, color: Colors.textMuted },
  tableSubLabel: { fontSize: 11, color: Colors.textLight, marginTop: 2 },
  tableValue:    { fontSize: 13, fontWeight: '600', color: Colors.text },
  tableDivider:  { height: 1, backgroundColor: Colors.bg, marginHorizontal: 16 },

  totalRow: {
    backgroundColor: Colors.bg,
    paddingVertical: 15,
  },
  totalLabel: { fontSize: 14, fontWeight: '700', color: Colors.text },
  totalValue: { fontSize: 24, fontWeight: '900', letterSpacing: -0.6 },

  notesRow:  { flexDirection: 'row', gap: 8, alignItems: 'flex-start', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: Colors.bg },
  notesText: { flex: 1, fontSize: 12, color: Colors.textMuted, fontStyle: 'italic', lineHeight: 17 },

  // Trust badges
  trustRow: {
    flexDirection: 'row', justifyContent: 'center', gap: 8,
    backgroundColor: '#F0FDF4', borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: '#BBF7D0',
  },
  trustBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1, justifyContent: 'center' },
  trustText:  { fontSize: 10, fontWeight: '700', color: '#059669' },

  // Error
  errBox: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: '#FEF2F2', borderRadius: 12, padding: 13,
    borderWidth: 1, borderColor: '#FEE2E2',
  },
  errText: { flex: 1, fontSize: 13, color: Colors.error, lineHeight: 18 },

  // CTA section wrapper
  ctaSection: { gap: 12, paddingBottom: 4 },

  infoBox: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: Colors.primaryLight, borderRadius: 12, padding: 13,
  },
  infoText: { flex: 1, fontSize: 13, color: Colors.primary, lineHeight: 19 },

  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 17, borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 10, elevation: 5,
  },
  ctaBtnText: { fontSize: 16, fontWeight: '800', color: Colors.white, letterSpacing: -0.2 },

  cancelBtn:  { alignItems: 'center', paddingVertical: 6 },
  cancelText: { fontSize: 13, color: Colors.textMuted },

  // Success state
  successBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#F0FDF4', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#BBF7D0',
  },
  successIcon:  { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontSize: 15, fontWeight: '800', color: '#065F46' },
  successSub:   { fontSize: 12, color: '#059669', marginTop: 2 },

  footnote: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', lineHeight: 19 },
});

// ── Screen Styles ─────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.bg },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.white },
  title:      { fontSize: 17, fontWeight: '800', color: Colors.text },
  refreshBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
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
