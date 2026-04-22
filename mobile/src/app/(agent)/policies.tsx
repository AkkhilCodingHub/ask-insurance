import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, Modal, TextInput, ActivityIndicator,
  Animated, Dimensions, Pressable, Platform, Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as WebBrowser from 'expo-web-browser';
import { agentApi, AgentPolicy } from '@/lib/api';
import { useAgent } from '@/context/agent';
import { Icon } from '@/components/Icon';
import { Colors } from '@/constants/theme';
import { authFieldStyles as af } from '@/constants/authFieldStyles';

const { height: SCREEN_H } = Dimensions.get('window');

// ── Constants ─────────────────────────────────────────────────────────────────

const TYPE_META: Record<string, { color: string; lightBg: string; emoji: string }> = {
  life:        { color: '#1580FF', lightBg: '#EFF6FF', emoji: '❤️'  },
  health:      { color: '#059669', lightBg: '#ECFDF5', emoji: '🏥'  },
  motor:       { color: '#F59E0B', lightBg: '#FFFBEB', emoji: '🚗'  },
  fire:        { color: '#EA580C', lightBg: '#FFF7ED', emoji: '🔥'  },
  marine:      { color: '#0891B2', lightBg: '#ECFEFF', emoji: '⚓'  },
  engineering: { color: '#7C3AED', lightBg: '#F5F3FF', emoji: '⚙️'  },
  liability:   { color: '#DC2626', lightBg: '#FEF2F2', emoji: '⚖️'  },
};

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  active:    { label: 'Active',    color: '#059669', bg: '#ECFDF5' },
  pending:   { label: 'Pending',   color: '#D97706', bg: '#FEF3C7' },
  expired:   { label: 'Expired',   color: '#DC2626', bg: '#FEF2F2' },
  cancelled: { label: 'Cancelled', color: '#64748B', bg: '#F8FAFC' },
};

const TABS = ['All', 'Active', 'Pending', 'Expired'] as const;
type Tab = typeof TABS[number];

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtAmount(v: number): string {
  if (v >= 10_000_000) return `₹${(v / 10_000_000).toFixed(1)}Cr`;
  if (v >= 100_000)    return `₹${(v / 100_000).toFixed(1)}L`;
  if (v >= 1_000)      return `₹${(v / 1_000).toFixed(0)}K`;
  return `₹${v}`;
}
function isoFromDisplay(d: string): string {
  // Accepts DD/MM/YYYY or YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  const [dd, mm, yyyy] = d.split('/');
  return `${yyyy}-${mm}-${dd}`;
}

// ── Policy Detail / Upload Sheet ──────────────────────────────────────────────

function PolicySheet({ policy, onClose, onDone }: {
  policy: AgentPolicy | null; onClose: () => void; onDone: () => void;
}) {
  const insets  = useSafeAreaInsets();
  const slideY  = useRef(new Animated.Value(SCREEN_H)).current;
  const bgOp    = useRef(new Animated.Value(0)).current;
  const visible = !!policy;
  const meta    = policy ? (TYPE_META[policy.type] ?? { color: Colors.primary, lightBg: Colors.primaryLight, emoji: '📋' }) : { color: Colors.primary, lightBg: Colors.primaryLight, emoji: '📋' };
  const color   = meta.color;

  const [tab, setTab] = useState<'details' | 'upload' | 'payment'>('details');
  const [statusBusy, setStatusBusy] = useState(false);

  // Upload form
  const [file,         setFile]         = useState<{ uri: string; name: string; type: string } | null>(null);
  const [policyNumber, setPolicyNumber] = useState('');
  const [issueDate,    setIssueDate]    = useState('');
  const [expiryDate,   setExpiryDate]   = useState('');
  const [docNotes,     setDocNotes]     = useState('');
  const [uploading,    setUploading]    = useState(false);
  const [uploadErr,    setUploadErr]    = useState('');

  // Payment confirm
  const [utr,          setUtr]          = useState('');
  const [confirming,   setConfirming]   = useState(false);
  const [payErr,       setPayErr]       = useState('');

  useEffect(() => {
    if (visible) {
      setTab('details');
      setFile(null); setPolicyNumber(''); setIssueDate(''); setExpiryDate(''); setDocNotes('');
      setUtr(''); setUploadErr(''); setPayErr(''); setStatusBusy(false);
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
  }, [visible]);

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
    if (!result.canceled && result.assets[0]) {
      const a = result.assets[0];
      setFile({ uri: a.uri, name: a.name, type: a.mimeType ?? 'application/pdf' });
      setUploadErr('');
    }
  };

  const handleUpload = async () => {
    if (!file) { setUploadErr('Please select a PDF file.'); return; }
    if (!policyNumber.trim()) { setUploadErr('Policy number is required.'); return; }
    if (!issueDate.trim() || !expiryDate.trim()) { setUploadErr('Issue date and expiry date are required.'); return; }
    if (!policy) return;
    setUploading(true);
    try {
      await agentApi.uploadPolicyDocument(policy.id, {
        file,
        policyNumber: policyNumber.trim(),
        issueDate:    isoFromDisplay(issueDate),
        expiryDate:   isoFromDisplay(expiryDate),
        notes:        docNotes.trim() || undefined,
      });
      onDone();
    } catch (e: unknown) {
      setUploadErr(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const changeStatus = async (status: string) => {
    if (!policy || statusBusy) return;
    setStatusBusy(true);
    try { await agentApi.updatePolicyStatus(policy.id, status); onDone(); }
    catch { /* silent */ } finally { setStatusBusy(false); }
  };

  const handleConfirmPayment = async () => {
    if (!utr.trim()) { setPayErr('UTR number is required.'); return; }
    if (!policy) return;
    setConfirming(true);
    try {
      await agentApi.confirmPayment(policy.id, utr.trim());
      onDone();
    } catch (e: unknown) {
      setPayErr(e instanceof Error ? e.message : 'Failed to confirm payment.');
    } finally {
      setConfirming(false);
    }
  };

  if (!visible && !policy) return null;
  const st = policy ? (STATUS_CFG[policy.status] ?? STATUS_CFG.pending) : STATUS_CFG.pending;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        <Animated.View style={[ps.backdrop, { opacity: bgOp }]} />
      </Pressable>

      <Animated.View style={[ps.sheet, { paddingBottom: insets.bottom + 8, transform: [{ translateY: slideY }] }]}>
        <View style={ps.sheetTop}>
          <View style={ps.handleRow}><View style={ps.handle} /></View>
          <View style={ps.headerRow}>
            <View style={[ps.headerIcon, { backgroundColor: color + '1A' }]}>
              <Text style={{ fontSize: 24 }}>{meta.emoji}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={ps.headerKicker}>{policy?.type?.toUpperCase()}</Text>
              <Text style={ps.headerTitle} numberOfLines={1}>{policy?.provider}</Text>
              <Text style={ps.headerSub} numberOfLines={1}>{policy?.policyNumber}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={ps.headerClose} activeOpacity={0.7}>
              <Icon name="close" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
          <View style={ps.metricCard}>
            {[
              { label: 'PREMIUM', value: fmtAmount(policy?.premium ?? 0) },
              { label: 'SUM INSURED', value: fmtAmount(policy?.sumInsured ?? 0) },
              { label: 'STATUS', value: st.label },
            ].map((m, i) => (
              <View key={m.label} style={[ps.metricItem, i > 0 && ps.metricBorder]}>
                <Text style={ps.metricValDark}>{m.value}</Text>
                <Text style={ps.metricLblDark}>{m.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Tab switcher */}
        <View style={ps.tabRow}>
          {(['details', 'upload', 'payment'] as const).map(t => (
            <TouchableOpacity key={t} style={[ps.tabBtn, tab === t && { borderBottomColor: color, borderBottomWidth: 2 }]}
              onPress={() => setTab(t)} activeOpacity={0.75}>
              <Text style={[ps.tabText, tab === t && { color }]}>
                {t === 'details' ? 'Details' : t === 'upload' ? `Document${policy?.documentUrl ? ' ✓' : ''}` : 'Payment'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView style={{ backgroundColor: Colors.bg }} contentContainerStyle={ps.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* ── Details tab ── */}
          {tab === 'details' && (
            <View style={{ gap: 16 }}>
              {/* Customer card */}
              <View style={ps.infoCard}>
                <View style={ps.infoRow}>
                  <Icon name="person-outline" size={15} color={Colors.textMuted} />
                  <Text style={ps.infoLabel}>Policyholder</Text>
                  <Text style={ps.infoValue}>{policy?.user?.name ?? policy?.user?.phone}</Text>
                </View>
                <View style={ps.infoDiv} />
                <View style={ps.infoRow}>
                  <Icon name="call-outline" size={15} color={Colors.textMuted} />
                  <Text style={ps.infoLabel}>Phone</Text>
                  <Text style={ps.infoValue}>{policy?.user?.phone}</Text>
                  <TouchableOpacity onPress={() => Linking.openURL(`tel:${policy?.user?.phone}`)} style={ps.callBtn} activeOpacity={0.7}>
                    <Text style={[ps.callBtnText, { color }]}>Call</Text>
                  </TouchableOpacity>
                </View>
                <View style={ps.infoDiv} />
                <View style={ps.infoRow}>
                  <Icon name="calendar-outline" size={15} color={Colors.textMuted} />
                  <Text style={ps.infoLabel}>Start Date</Text>
                  <Text style={ps.infoValue}>{fmtDate(policy?.startDate ?? '')}</Text>
                </View>
                <View style={ps.infoDiv} />
                <View style={ps.infoRow}>
                  <Icon name="calendar-outline" size={15} color={Colors.textMuted} />
                  <Text style={ps.infoLabel}>End Date</Text>
                  <Text style={ps.infoValue}>{fmtDate(policy?.endDate ?? '')}</Text>
                </View>
                <View style={ps.infoDiv} />
                <View style={ps.infoRow}>
                  <Icon name="card-outline" size={15} color={Colors.textMuted} />
                  <Text style={ps.infoLabel}>Payment</Text>
                  <Text style={[ps.infoValue, { color: policy?.paymentStatus === 'paid' ? Colors.success : Colors.warning }]}>
                    {policy?.paymentStatus === 'paid' ? 'Confirmed' : 'Pending'}
                  </Text>
                </View>
                <View style={ps.infoDiv} />
                <View style={ps.infoRow}>
                  <Icon name="alert-circle-outline" size={15} color={Colors.textMuted} />
                  <Text style={ps.infoLabel}>Claims</Text>
                  <Text style={ps.infoValue}>{policy?._count?.claims ?? 0}</Text>
                </View>
              </View>

              {/* Status change */}
              <View style={ps.sectionCard}>
                <Text style={ps.sectionTitle}>Change Status</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {(['active', 'pending', 'expired', 'cancelled'] as const).map(s => {
                    const cfg = STATUS_CFG[s];
                    const active = policy?.status === s;
                    return (
                      <TouchableOpacity key={s}
                        style={[ps.statusChip, { backgroundColor: active ? cfg.bg : Colors.bg, borderColor: active ? cfg.color : Colors.border }]}
                        onPress={() => changeStatus(s)} disabled={active || statusBusy} activeOpacity={0.75}>
                        {statusBusy && !active
                          ? <ActivityIndicator size="small" color={cfg.color} style={{ marginRight: 4 }} />
                          : null}
                        <Text style={[ps.statusChipText, { color: active ? cfg.color : Colors.textMuted, fontWeight: active ? '700' : '500' }]}>
                          {cfg.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Document */}
              {policy?.documentUrl && (
                <TouchableOpacity style={[ps.docBtn, { borderColor: color + '40' }]}
                  onPress={() => WebBrowser.openBrowserAsync(policy.documentUrl!)} activeOpacity={0.75}>
                  <Icon name="document-text" size={18} color={color} />
                  <Text style={[ps.docBtnText, { color }]}>View Policy Document</Text>
                  <Icon name="open-outline" size={14} color={color} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* ── Upload tab ── */}
          {tab === 'upload' && (
            <View style={{ gap: 6 }}>
              {policy?.documentUrl && (
                <View style={ps.existingDoc}>
                  <Icon name="checkmark-circle" size={16} color={Colors.success} />
                  <Text style={ps.existingDocText}>Document already uploaded — uploading again will replace it.</Text>
                </View>
              )}

              <TouchableOpacity style={ps.filePicker} onPress={pickFile} activeOpacity={0.8}>
                <Icon name={file ? 'document-text' : 'cloud-upload-outline'} size={22} color={file ? color : Colors.textMuted} />
                <Text style={[ps.filePickerText, file && { color }]}>
                  {file ? file.name : 'Tap to select PDF'}
                </Text>
              </TouchableOpacity>

              <Text style={ps.uploadLabel}>POLICY NUMBER</Text>
              <View style={af.inputRow}>
                <TextInput style={af.input} placeholder="e.g. POL/2024/001234" placeholderTextColor={Colors.textLight}
                  value={policyNumber} onChangeText={v => { setPolicyNumber(v); setUploadErr(''); }} />
              </View>

              <Text style={ps.uploadLabel}>ISSUE DATE (DD/MM/YYYY)</Text>
              <View style={af.inputRow}>
                <TextInput style={af.input} placeholder="01/01/2024" placeholderTextColor={Colors.textLight}
                  value={issueDate} onChangeText={v => { setIssueDate(v); setUploadErr(''); }} keyboardType="numeric" />
              </View>

              <Text style={ps.uploadLabel}>EXPIRY DATE (DD/MM/YYYY)</Text>
              <View style={af.inputRow}>
                <TextInput style={af.input} placeholder="31/12/2024" placeholderTextColor={Colors.textLight}
                  value={expiryDate} onChangeText={v => { setExpiryDate(v); setUploadErr(''); }} keyboardType="numeric" />
              </View>

              <Text style={ps.uploadLabel}>NOTES (optional)</Text>
              <View style={[af.inputRow, af.inputRowTopAlign]}>
                <TextInput
                  style={[af.input, af.inputMultiline, { minHeight: 88 }]}
                  placeholder="Any notes for the customer..." placeholderTextColor={Colors.textLight}
                  value={docNotes} onChangeText={setDocNotes} multiline
                />
              </View>

              {!!uploadErr && (
                <View style={ps.errBox}>
                  <Icon name="alert-circle-outline" size={15} color={Colors.error} />
                  <Text style={ps.errText}>{uploadErr}</Text>
                </View>
              )}

              <TouchableOpacity style={[ps.actionBtn, { backgroundColor: color, opacity: uploading ? 0.7 : 1 }]}
                onPress={handleUpload} disabled={uploading} activeOpacity={0.85}>
                {uploading
                  ? <ActivityIndicator color="#fff" />
                  : <><Icon name="cloud-upload-outline" size={18} color="#fff" /><Text style={ps.actionBtnText}>Upload Document</Text></>
                }
              </TouchableOpacity>
            </View>
          )}

          {/* ── Payment tab ── */}
          {tab === 'payment' && (
            <View style={{ gap: 12 }}>
              {policy?.paymentStatus === 'paid' ? (
                <View style={ps.paidBanner}>
                  <Icon name="checkmark-circle" size={22} color={Colors.success} />
                  <Text style={ps.paidText}>Payment already confirmed for this policy.</Text>
                </View>
              ) : (
                <>
                  <View style={ps.infoCard}>
                    <View style={ps.infoRow}>
                      <Icon name="cash-outline" size={15} color={Colors.textMuted} />
                      <Text style={ps.infoLabel}>Amount Due</Text>
                      <Text style={[ps.infoValue, { color }]}>₹{policy?.premium?.toLocaleString('en-IN')}</Text>
                    </View>
                  </View>

                  <Text style={ps.uploadLabel}>UTR / REFERENCE NUMBER</Text>
                  <View style={af.inputRow}>
                    <TextInput style={af.input} placeholder="e.g. UTR123456789012" placeholderTextColor={Colors.textLight}
                      value={utr} onChangeText={v => { setUtr(v); setPayErr(''); }} autoCapitalize="characters" />
                  </View>

                  {!!payErr && (
                    <View style={ps.errBox}>
                      <Icon name="alert-circle-outline" size={15} color={Colors.error} />
                      <Text style={ps.errText}>{payErr}</Text>
                    </View>
                  )}

                  <TouchableOpacity style={[ps.actionBtn, { backgroundColor: Colors.success, opacity: confirming ? 0.7 : 1 }]}
                    onPress={handleConfirmPayment} disabled={confirming} activeOpacity={0.85}>
                    {confirming
                      ? <ActivityIndicator color="#fff" />
                      : <><Icon name="checkmark-circle" size={18} color="#fff" /><Text style={ps.actionBtnText}>Confirm Payment</Text></>
                    }
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

// ── Policy Card ───────────────────────────────────────────────────────────────

function PolicyCard({ policy, onPress }: { policy: AgentPolicy; onPress: () => void }) {
  const meta  = TYPE_META[policy.type] ?? { color: Colors.primary, lightBg: Colors.primaryLight, emoji: '📋' };
  const st    = STATUS_CFG[policy.status] ?? STATUS_CFG.pending;

  return (
    <TouchableOpacity style={card.card} onPress={onPress} activeOpacity={0.9}>
      <View style={[card.colorBar, { backgroundColor: meta.color }]} />
      <View style={card.inner}>
        <View style={card.topRow}>
          <View style={card.emojiWrap}>
            <Text style={{ fontSize: 20 }}>{meta.emoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={card.provider} numberOfLines={1}>{policy.provider}</Text>
            <Text style={card.user}>{policy.user?.name ?? policy.user?.phone}</Text>
          </View>
          <View style={[card.statusPill, { backgroundColor: st.bg }]}>
            <Text style={[card.statusText, { color: st.color }]}>{st.label}</Text>
          </View>
        </View>
        <View style={card.metrics}>
          <View style={card.metric}>
            <Text style={[card.metricVal, { color: meta.color }]}>{fmtAmount(policy.premium)}</Text>
            <Text style={card.metricLbl}>Premium</Text>
          </View>
          <View style={card.metricSep} />
          <View style={card.metric}>
            <Text style={card.metricVal}>{fmtAmount(policy.sumInsured)}</Text>
            <Text style={card.metricLbl}>Cover</Text>
          </View>
          <View style={card.metricSep} />
          <View style={card.metric}>
            <Text style={[card.metricVal, { color: policy.paymentStatus === 'paid' ? Colors.success : Colors.warning }]}>
              {policy.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
            </Text>
            <Text style={card.metricLbl}>Payment</Text>
          </View>
        </View>
        <View style={card.footer}>
          {policy.documentUrl
            ? <View style={card.docChip}><Icon name="document-text-outline" size={11} color={Colors.success} /><Text style={card.docChipText}>Document uploaded</Text></View>
            : <Text style={card.noDoc}>No document</Text>
          }
          <Icon name="chevron-forward" size={14} color={Colors.textLight} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function AgentPoliciesScreen() {
  const { agent } = useAgent();
  const [policies,  setPolicies]  = useState<AgentPolicy[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('All');
  const [selected,  setSelected]  = useState<AgentPolicy | null>(null);
  const [search,    setSearch]    = useState('');

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const { policies: data } = await agentApi.getPolicies();
      setPolicies(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = policies.filter(p => {
    if (activeTab !== 'All' && p.status !== activeTab.toLowerCase()) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (p.user?.name ?? '').toLowerCase().includes(q) ||
           p.user?.phone.includes(q) ||
           p.provider.toLowerCase().includes(q) ||
           p.policyNumber.toLowerCase().includes(q) ||
           p.type.includes(q);
  });

  const counts = {
    active:  policies.filter(p => p.status === 'active').length,
    pending: policies.filter(p => p.status === 'pending').length,
    noDocs:  policies.filter(p => !p.documentUrl).length,
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <View>
          <Text style={s.kicker}>Advisor</Text>
          <Text style={s.title}>Policies</Text>
          <Text style={s.sub}>{agent?.name} · {counts.noDocs} need documents</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.statsRow} style={s.statsScroll}>
        {[
          { label: 'Active',   value: counts.active,   color: '#059669' },
          { label: 'Pending',  value: counts.pending,  color: '#D97706' },
          { label: 'Expired',  value: policies.filter(p => p.status === 'expired').length, color: '#DC2626' },
          { label: 'No Docs',  value: counts.noDocs,   color: Colors.primary },
          { label: 'Total',    value: policies.length, color: Colors.primary },
        ].map(st => (
          <View key={st.label} style={s.statChip}>
            <Text style={[s.statValue, { color: st.color }]}>{st.value}</Text>
            <Text style={s.statLabel}>{st.label}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Search */}
      <View style={[s.searchWrap]}>
        <View style={{ flex: 1 }}>
          <View style={af.inputRow}>
            <View style={af.prefix}>
              <Icon name="search-outline" size={20} color={Colors.primary} />
            </View>
            <TextInput
              style={af.input}
              placeholder="Search name, phone, provider, policy #…"
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

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabRow} style={s.tabScroll}>
        {TABS.map(tab => {
          const active = activeTab === tab;
          const sm = tab !== 'All' ? STATUS_CFG[tab.toLowerCase()] : null;
          return (
            <TouchableOpacity key={tab}
              style={[s.tab, active && { backgroundColor: sm?.color ?? Colors.primary, borderColor: sm?.color ?? Colors.primary }]}
              onPress={() => setActiveTab(tab)} activeOpacity={0.75}>
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
                <Icon name="shield-checkmark-outline" size={28} color={Colors.primary} />
              </View>
              <Text style={s.emptyTitle}>No {activeTab === 'All' ? '' : activeTab.toLowerCase()} policies</Text>
              <Text style={s.emptySub}>{search ? 'Try a different search' : 'Pull down to refresh'}</Text>
            </View>
          ) : (
            filtered.map(p => (
              <PolicyCard key={p.id} policy={p} onPress={() => setSelected(p)} />
            ))
          )}
        </ScrollView>
      )}

      <PolicySheet
        policy={selected}
        onClose={() => setSelected(null)}
        onDone={() => { setSelected(null); load(); }}
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

const card = StyleSheet.create({
  card:       { backgroundColor: Colors.white, borderRadius: 14, overflow: 'hidden', flexDirection: 'row', borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border, ...Platform.select({ ios: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 }, android: { elevation: 1 } }) },
  colorBar:   { width: 3 },
  inner:      { flex: 1, padding: 14 },
  topRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  emojiWrap:  { width: 40, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primaryLight },
  provider:   { fontSize: 14, fontWeight: '800', color: Colors.text },
  user:       { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  statusText: { fontSize: 10, fontWeight: '700' },
  metrics:    { flexDirection: 'row', marginBottom: 12, backgroundColor: Colors.bg, borderRadius: 10, padding: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border },
  metric:     { flex: 1, alignItems: 'center' },
  metricSep:  { width: StyleSheet.hairlineWidth, backgroundColor: Colors.border },
  metricVal:  { fontSize: 14, fontWeight: '800', color: Colors.text, letterSpacing: -0.3 },
  metricLbl:  { fontSize: 9, color: Colors.textMuted, marginTop: 2, fontWeight: '600', textTransform: 'uppercase' },
  footer:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  docChip:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
  docChipText:{ fontSize: 11, color: Colors.success, fontWeight: '700' },
  noDoc:      { fontSize: 11, color: Colors.textLight },
});

const PS_CARD_SH = Platform.select({ ios: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 }, android: { elevation: 1 } });

const ps = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10,22,40,0.5)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    maxHeight: '92%', overflow: 'hidden',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.15, shadowRadius: 24 },
      android: { elevation: 24 },
    }),
  },
  sheetTop:    { backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  handleRow:   { alignItems: 'center', paddingTop: 10, paddingBottom: 6 },
  handle:      { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0' },
  headerRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 16, paddingBottom: 4 },
  headerIcon:  { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headerKicker:{ fontSize: 10, fontWeight: '800', color: Colors.textLight, letterSpacing: 1, marginBottom: 4 },
  headerTitle: { fontSize: 17, fontWeight: '900', color: Colors.text, letterSpacing: -0.3 },
  headerSub:   { fontSize: 12, color: Colors.textMuted, fontWeight: '500', marginTop: 2 },
  headerClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
  metricCard:  { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, backgroundColor: Colors.white, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border, overflow: 'hidden', ...PS_CARD_SH },
  metricItem:  { flex: 1, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4 },
  metricBorder:{ borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: Colors.border },
  metricValDark:  { fontSize: 14, fontWeight: '800', color: Colors.text, letterSpacing: -0.2 },
  metricLblDark:  { fontSize: 8, color: Colors.textLight, marginTop: 2, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },

  tabRow:  { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  tabBtn:  { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },

  body:  { padding: 16, paddingBottom: 8, gap: 4, backgroundColor: Colors.bg },

  infoCard: { backgroundColor: Colors.white, borderRadius: 14, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border, ...PS_CARD_SH },
  infoRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
  infoDiv:  { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginHorizontal: 14 },
  infoLabel:{ flex: 1, fontSize: 13, color: Colors.textMuted },
  infoValue:{ fontSize: 13, fontWeight: '700', color: Colors.text },

  docBtn:     { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border, backgroundColor: Colors.white, ...PS_CARD_SH },
  docBtnText: { flex: 1, fontSize: 14, fontWeight: '700' },

  existingDoc:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.bg, borderRadius: 10, padding: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border },
  existingDocText: { flex: 1, fontSize: 12, color: Colors.success, fontWeight: '600' },

  filePicker:     { borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed', borderRadius: 14, paddingVertical: 24, alignItems: 'center', gap: 8, backgroundColor: Colors.bg },
  filePickerText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },

  uploadLabel: { fontSize: 10, fontWeight: '800', color: Colors.textMuted, letterSpacing: 1, marginTop: 10, marginBottom: 4 },

  errBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#FEE2E2', marginTop: 4 },
  errText:{ flex: 1, fontSize: 13, color: Colors.error },

  actionBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 15, borderRadius: 14, marginTop: 10 },
  actionBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },

  paidBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.bg, borderRadius: 14, padding: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border, ...PS_CARD_SH },
  paidText:   { flex: 1, fontSize: 14, fontWeight: '700', color: Colors.text },

  callBtn:      { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: Colors.primaryLight },
  callBtnText:  { fontSize: 12, fontWeight: '700' },

  sectionCard:     { backgroundColor: Colors.white, borderRadius: 14, padding: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border, gap: 12, ...PS_CARD_SH },
  sectionTitle:    { fontSize: 13, fontWeight: '800', color: Colors.text },
  statusChip:      { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center' },
  statusChipText:  { fontSize: 12 },
});
