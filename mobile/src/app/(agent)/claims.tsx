import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, Modal, TextInput, ActivityIndicator,
  Animated, Dimensions, Pressable, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { agentApi, AgentClaim } from '@/lib/api';
import { useAgent } from '@/context/agent';
import { Icon } from '@/components/Icon';
import { Colors } from '@/constants/theme';
import { authFieldStyles as af } from '@/constants/authFieldStyles';

const { height: SCREEN_H } = Dimensions.get('window');

// ── Same status set as admin web claims + common API values ───────────────────

const TABS = ['All', 'Pending', 'Approved', 'Rejected', 'Paid', 'Settled'] as const;
type Tab = typeof TABS[number];

type UpdatableStatus = 'pending' | 'approved' | 'rejected' | 'paid' | 'settled';

const STATUS_UPDATE_ORDER: UpdatableStatus[] = ['pending', 'approved', 'rejected', 'paid', 'settled'];

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  pending:      { label: 'Pending',   color: '#D97706', bg: '#FEF3C7' },
  approved:     { label: 'Approved',  color: '#059669', bg: '#D1FAE5' },
  rejected:     { label: 'Rejected',  color: '#DC2626', bg: '#FEE2E2' },
  paid:         { label: 'Paid',      color: '#4F46E5', bg: '#E0E7FF' },
  settled:      { label: 'Settled',   color: '#047857', bg: '#D1FAE5' },
  submitted:    { label: 'Submitted', color: '#1580FF', bg: '#DBEAFE' },
  under_review: { label: 'In review', color: '#D97706', bg: '#FEF3C7' },
};

function statusBadge(status: string) {
  return STATUS_CFG[status] ?? { label: status, color: Colors.textMuted, bg: '#F1F5F9' };
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtAmount(n: number) {
  return '₹' + Number(n).toLocaleString('en-IN');
}
function cap(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '—';
}

// ── Claim card ────────────────────────────────────────────────────────────────

function ClaimCard({ claim, onPress }: { claim: AgentClaim; onPress: () => void }) {
  const st = statusBadge(claim.status);
  return (
    <TouchableOpacity style={card.root} onPress={onPress} activeOpacity={0.9}>
      <View style={[card.accent, { backgroundColor: Colors.primary }]} />
      <View style={card.inner}>
        <View style={card.top}>
          <View style={card.iconWrap}>
            <Icon name="document-attach-outline" size={20} color={Colors.primary} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={card.name} numberOfLines={1}>{claim.user?.name ?? '—'}</Text>
            <Text style={card.phone}>{claim.user?.phone ? `+91 ${claim.user.phone}` : ''}</Text>
          </View>
          <View style={[card.pill, { backgroundColor: st.bg }]}>
            <Text style={[card.pillText, { color: st.color }]}>{st.label}</Text>
          </View>
        </View>
        <View style={card.metrics}>
          <View style={card.metric}>
            <Text style={card.metricVal}>{fmtAmount(claim.amount)}</Text>
            <Text style={card.metricLbl}>Amount</Text>
          </View>
          <View style={card.sep} />
          <View style={card.metric}>
            <Text style={card.metricVal} numberOfLines={1}>{claim.policy?.policyNumber ?? '—'}</Text>
            <Text style={card.metricLbl}>Policy</Text>
          </View>
          <View style={card.sep} />
          <View style={card.metric}>
            <Text style={card.metricVal} numberOfLines={1}>{claim.policy?.provider ?? '—'}</Text>
            <Text style={card.metricLbl}>Provider</Text>
          </View>
        </View>
        <View style={card.footer}>
          <Text style={card.claimNo}>{claim.claimNumber}</Text>
          <Icon name="chevron-forward" size={14} color={Colors.textLight} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Detail + status sheet (admin-style) ───────────────────────────────────────

function ClaimDetailSheet({ claim, onClose, onDone }: {
  claim: AgentClaim | null; onClose: () => void; onDone: () => void;
}) {
  const insets  = useSafeAreaInsets();
  const slideY  = useRef(new Animated.Value(SCREEN_H)).current;
  const bgOp    = useRef(new Animated.Value(0)).current;
  const visible = !!claim;

  const [status,  setStatus]  = useState<UpdatableStatus>('pending');
  const [notes,   setNotes]   = useState('');
  const [saving,  setSaving]  = useState(false);
  const [saveOk, setSaveOk]   = useState(false);

  useEffect(() => {
    if (visible && claim) {
      const s = claim.status;
      setStatus(
        (['pending', 'approved', 'rejected', 'paid', 'settled'] as const).includes(s as UpdatableStatus)
          ? (s as UpdatableStatus)
          : 'pending' // e.g. submitted / under_review → start from pending in admin flow
      );
      setNotes(claim.notes ?? '');
      setSaveOk(false);
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
  }, [visible, claim?.id]);

  const handleSave = async () => {
    if (!claim) return;
    setSaving(true);
    try {
      await agentApi.updateClaimStatus(claim.id, status, notes.trim() || undefined);
      setSaveOk(true);
      setTimeout(() => { setSaveOk(false); onDone(); }, 600);
    } catch { /* keep sheet open */ }
    finally { setSaving(false); }
  };

  if (!claim) return null;
  const c = claim;
  const defaultSt: UpdatableStatus = (['pending', 'approved', 'rejected', 'paid', 'settled'] as const).includes(
    c.status as UpdatableStatus
  )
    ? (c.status as UpdatableStatus)
    : 'pending';
  const unchanged = status === defaultSt && (notes.trim() || '') === (c.notes ?? '').trim();
  const canSave   = !unchanged;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        <Animated.View style={[sh.backdrop, { opacity: bgOp }]} />
      </Pressable>
      <Animated.View style={[sh.sheet, { paddingBottom: insets.bottom + 10, maxHeight: SCREEN_H * 0.92, transform: [{ translateY: slideY }] }]}>
        <View style={sh.sheetTop}>
          <View style={sh.handleRow}><View style={sh.handle} /></View>
          <View style={sh.sheetHeader}>
            <View style={sh.sheetIcon}>
              <Icon name="document-attach" size={22} color={Colors.primary} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={sh.sheetKicker}>CLAIM</Text>
              <Text style={sh.sheetTitle} numberOfLines={1}>{c.claimNumber}</Text>
              <Text style={sh.sheetSub} numberOfLines={1}>{cap(c.type)} · {fmtAmount(c.amount)}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={sh.sheetClose} activeOpacity={0.7}>
              <Icon name="close" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={sh.scrollArea}
          contentContainerStyle={sh.body}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={sh.infoCard}>
            <Text style={sh.blockLabel}>Claimant</Text>
            <Text style={sh.blockVal}>{c.user?.name ?? '—'}</Text>
            <Text style={sh.blockMeta}>{c.user?.phone ? `+91 ${c.user.phone}` : ''}</Text>
          </View>
          <View style={sh.infoCard}>
            <Text style={sh.blockLabel}>Policy</Text>
            <Text style={sh.blockVal}>{c.policy?.policyNumber ?? c.policyId.slice(0, 8)}</Text>
            <Text style={sh.blockMeta}>{c.policy?.provider ?? '—'} · {cap(c.policy?.type ?? c.type)}</Text>
          </View>
          <View style={sh.infoCardRow}>
            <View style={sh.half}>
              <Text style={sh.blockLabel}>Incident</Text>
              <Text style={sh.blockValSm}>{fmtDate(c.incidentDate)}</Text>
            </View>
            <View style={sh.half}>
              <Text style={sh.blockLabel}>Filed</Text>
              <Text style={sh.blockValSm}>{fmtDate(c.createdAt)}</Text>
            </View>
          </View>
          {!!c.description && (
            <View style={sh.infoCard}>
              <Text style={sh.blockLabel}>Description</Text>
              <Text style={sh.descTxt}>{c.description}</Text>
            </View>
          )}

          <View style={sh.infoCard}>
            <Text style={sh.sectionInCard}>Update status</Text>
            <View style={sh.statusGrid}>
              {STATUS_UPDATE_ORDER.map(s => {
                const m = STATUS_CFG[s];
                const on = status === s;
                return (
                  <TouchableOpacity
                    key={s}
                    style={[sh.statusBtn, on && { borderColor: m.color, backgroundColor: m.bg, borderWidth: StyleSheet.hairlineWidth * 2 }]}
                    onPress={() => setStatus(s)}
                    activeOpacity={0.85}
                  >
                    <Text style={[sh.statusBtnText, { color: on ? m.color : Colors.textMuted }]}>{m.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={sh.infoCard}>
            <Text style={sh.sectionInCard}>Internal notes (optional)</Text>
            <View style={[af.inputRow, af.inputRowTopAlign]}>
              <TextInput
                style={[af.input, af.inputMultiline, { minHeight: 72 }]}
                placeholder="Add a note for the file…"
                placeholderTextColor={Colors.textLight}
                value={notes}
                onChangeText={setNotes}
                multiline
              />
            </View>
          </View>

          <TouchableOpacity
            style={[sh.saveBtn, (saving || !canSave) && sh.saveBtnOff]}
            onPress={handleSave}
            disabled={saving || !canSave}
            activeOpacity={0.88}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={sh.saveBtnText}>{saveOk ? 'Saved ✓' : 'Save changes'}</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function AgentClaimsScreen() {
  const { agent } = useAgent();
  const [claims,   setClaims]   = useState<AgentClaim[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [refresh,  setRefresh]  = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('All');
  const [search,   setSearch]   = useState('');
  const [selected,  setSelected]  = useState<AgentClaim | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefresh(true) : setLoading(true);
    try {
      const { claims: data } = await agentApi.getClaims();
      setClaims(data);
    } finally {
      setLoading(false);
      setRefresh(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = claims.filter(c => {
    const want = activeTab === 'All' ? null : (activeTab.toLowerCase() as 'pending' | 'approved' | 'rejected' | 'paid' | 'settled');
    if (want && c.status !== want) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (c.user?.name ?? '').toLowerCase().includes(q) ||
      (c.user?.phone ?? '').includes(q) ||
      (c.policy?.policyNumber ?? '').toLowerCase().includes(q) ||
      (c.policy?.provider ?? '').toLowerCase().includes(q) ||
      (c.description ?? '').toLowerCase().includes(q) ||
      c.claimNumber.toLowerCase().includes(q)
    );
  });

  const pendingN = claims.filter(c => c.status === 'pending').length;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <View>
          <Text style={s.kicker}>Advisor</Text>
          <Text style={s.title}>Claims</Text>
          <Text style={s.sub}>{agent?.name} · {pendingN} pending</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.statsRow} style={s.statsScroll}>
        {[
          { label: 'Total',  value: claims.length,     color: Colors.primary },
          { label: 'Pending', value: pendingN,         color: '#D97706' },
          { label: 'Settled', value: claims.filter(c => c.status === 'settled').length, color: '#047857' },
        ].map(st => (
          <View key={st.label} style={s.statChip}>
            <Text style={[s.statValue, { color: st.color }]}>{st.value}</Text>
            <Text style={s.statLabel}>{st.label}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={s.searchSection}>
        <View style={af.inputRow}>
          <View style={af.prefix}>
            <Icon name="search-outline" size={20} color={Colors.primary} />
          </View>
          <TextInput
            style={af.input}
            placeholder="Search name, phone, claim #, policy…"
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

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabRow} style={s.tabScroll}>
        {TABS.map(tab => {
          const active = activeTab === tab;
          const low = tab === 'All' ? null : tab.toLowerCase();
          const sm = low ? statusBadge(low) : null;
          return (
            <TouchableOpacity
              key={tab}
              style={[s.tab, active && { backgroundColor: sm?.color ?? Colors.primary, borderColor: sm?.color ?? Colors.primary }]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.75}
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
          refreshControl={<RefreshControl refreshing={refresh} onRefresh={() => load(true)} tintColor={Colors.primary} />}
        >
          {filtered.length === 0 ? (
            <View style={s.empty}>
              <View style={s.emptyIcon}>
                <Icon name="clipboard-outline" size={28} color={Colors.primary} />
              </View>
              <Text style={s.emptyTitle}>No claims</Text>
              <Text style={s.emptySub}>{search ? 'Try a different search' : 'Pull to refresh'}</Text>
            </View>
          ) : (
            filtered.map(c => (
              <ClaimCard key={c.id} claim={c} onPress={() => setSelected(c)} />
            ))
          )}
        </ScrollView>
      )}

      <ClaimDetailSheet
        claim={selected}
        onClose={() => setSelected(null)}
        onDone={() => { setSelected(null); load(); }}
      />
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.bg },
  header:      { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, backgroundColor: Colors.white, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  kicker:      { fontSize: 10, fontWeight: '800', color: Colors.textLight, letterSpacing: 1.2, marginBottom: 4 },
  title:       { fontSize: 24, fontWeight: '900', color: Colors.text, letterSpacing: -0.5 },
  sub:         { fontSize: 13, color: Colors.textMuted, fontWeight: '500', marginTop: 3 },
  statsScroll: { flexGrow: 0, backgroundColor: Colors.bg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  statsRow:    { paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  statChip:    {
    minWidth: 88,
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
  searchSection: { marginHorizontal: 16, marginVertical: 10 },
  tabScroll:   { flexGrow: 0, backgroundColor: Colors.bg },
  tabRow:      { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  tab:         { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border, backgroundColor: Colors.white },
  tabText:     { fontSize: 11, fontWeight: '700', color: Colors.textMuted },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty:       { alignItems: 'center', paddingTop: 48, gap: 12, paddingHorizontal: 24 },
  emptyIcon:   { width: 56, height: 56, borderRadius: 16, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  emptyTitle:  { fontSize: 17, fontWeight: '800', color: Colors.text, textAlign: 'center' },
  emptySub:    { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
});

const card = StyleSheet.create({
  root:   { backgroundColor: Colors.white, borderRadius: 14, overflow: 'hidden', flexDirection: 'row', borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border, ...Platform.select({ ios: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 }, android: { elevation: 1 } }) },
  accent: { width: 3 },
  inner:  { flex: 1, padding: 14 },
  top:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  iconWrap: { width: 40, height: 40, borderRadius: 11, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  name:   { fontSize: 15, fontWeight: '800', color: Colors.text },
  phone:  { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  pill:   { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 100 },
  pillText: { fontSize: 10, fontWeight: '800' },
  metrics:{ flexDirection: 'row', marginBottom: 10, backgroundColor: Colors.bg, borderRadius: 10, padding: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border },
  metric: { flex: 1, alignItems: 'center', minWidth: 0 },
  sep:    { width: StyleSheet.hairlineWidth, backgroundColor: Colors.border },
  metricVal: { fontSize: 12, fontWeight: '800', color: Colors.text },
  metricLbl: { fontSize: 8, color: Colors.textMuted, marginTop: 2, fontWeight: '600', textTransform: 'uppercase' },
  footer:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  claimNo: { fontSize: 11, fontWeight: '700', color: Colors.primary, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
});

const CARD_SHADOW = Platform.select({ ios: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 }, android: { elevation: 1 } });

const sh = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10,22,40,0.5)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.bg,
    borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.15, shadowRadius: 24 },
      android: { elevation: 24 },
    }),
  },
  sheetTop: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border,
  },
  handleRow: { alignItems: 'center', paddingTop: 10, paddingBottom: 6 },
  handle:    { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0' },
  sheetHeader:  { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 20, paddingBottom: 16 },
  sheetIcon:    { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  sheetKicker:  { fontSize: 10, fontWeight: '800', color: Colors.textLight, letterSpacing: 1.2, marginBottom: 4 },
  sheetTitle:   { fontSize: 18, fontWeight: '900', color: Colors.text, letterSpacing: -0.3 },
  sheetSub:     { fontSize: 13, color: Colors.textMuted, fontWeight: '500', marginTop: 2 },
  sheetClose:   { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
  scrollArea:   { flex: 1, backgroundColor: Colors.bg },
  body:    { paddingHorizontal: 16, paddingBottom: 28, paddingTop: 12, gap: 10 },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    padding: 14,
    ...CARD_SHADOW,
  },
  infoCardRow: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    padding: 14,
    ...CARD_SHADOW,
  },
  blockLabel: { fontSize: 10, fontWeight: '800', color: Colors.textLight, marginBottom: 4, letterSpacing: 0.5 },
  blockVal:   { fontSize: 16, fontWeight: '800', color: Colors.text },
  blockValSm: { fontSize: 14, fontWeight: '700', color: Colors.text },
  blockMeta:  { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  descTxt:    { fontSize: 14, color: Colors.text, lineHeight: 21 },
  half:       { flex: 1, minWidth: 0 },
  sectionInCard: { fontSize: 13, fontWeight: '800', color: Colors.text, marginBottom: 10 },
  statusGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusBtn:   {
    flexGrow: 1, minWidth: 100, paddingVertical: 11, paddingHorizontal: 6, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border, backgroundColor: Colors.white, alignItems: 'center',
  },
  statusBtnText: { fontSize: 12, fontWeight: '800' },
  saveBtn:     { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  saveBtnOff:  { opacity: 0.45 },
  saveBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
});
