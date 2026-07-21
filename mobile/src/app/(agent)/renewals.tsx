import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
  RefreshControl, Alert, Linking, Animated, Modal, TextInput, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { agentApi } from '@/lib/api';
import { Colors, BottomTabInset } from '@/constants/theme';
import { useAgent } from '@/context/agent';

type RenewalStatus = 'pending' | 'contacted' | 'closed' | 'lost';

interface Renewal {
  id: string;
  status: RenewalStatus;
  notes: string | null;
  assignedAt: string | null;
  policy: {
    policyNumber: string;
    type: string;
    endDate: string;
    premium: number;
    user: { id: string; name: string; phone: string };
    insurer?: { name: string };
  };
}

const STATUS_META: Record<RenewalStatus, { label: string; color: string; bg: string; icon: string }> = {
  pending:   { label: 'Pending',   color: '#D97706', bg: '#FFFBEB', icon: 'time-outline' },
  contacted: { label: 'Contacted', color: '#1580FF', bg: '#E8F2FF', icon: 'call-outline' },
  closed:    { label: 'Closed',    color: '#059669', bg: '#ECFDF5', icon: 'checkmark-circle-outline' },
  lost:      { label: 'Lost',      color: '#DC2626', bg: '#FEF2F2', icon: 'close-circle-outline' },
};

const FILTER_TABS = [
  { key: 'all',       label: 'All'       },
  { key: 'pending',   label: 'Pending'   },
  { key: 'contacted', label: 'Contacted' },
  { key: 'closed',    label: 'Closed'    },
  { key: 'lost',      label: 'Lost'      },
];

export default function RenewalsScreen() {
  const insets = useSafeAreaInsets();
  const [renewals, setRenewals] = useState<Renewal[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter]     = useState<string>('all');
  const [selected, setSelected] = useState<Renewal | null>(null);
  const [modalStatus, setModalStatus] = useState<RenewalStatus>('pending');
  const [modalNotes,  setModalNotes]  = useState('');
  const [saving, setSaving] = useState(false);
  const slideAnim = useRef(new Animated.Value(600)).current;

  const load = useCallback(async () => {
    try {
      const data = await agentApi.getRenewals();
      setRenewals(data || []);
    } catch (e: any) {
      console.warn('[Renewals] load error:', e?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Trigger a local push notification for urgent (<=7 days) pending renewals
  useEffect(() => {
    if (!renewals.length) return;
    const urgent = renewals.filter(r => {
      const days = daysLeft(r.policy.endDate);
      return days >= 0 && days <= 7 && r.status === 'pending';
    });
    if (!urgent.length) return;
    (async () => {
      try {
        const Notifications = await import('expo-notifications');
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Urgent Renewals',
            body: urgent.length + ' polic' + (urgent.length === 1 ? 'y' : 'ies') + ' expi' + (urgent.length === 1 ? 'res' : 're') + ' within 7 days.',
            sound: true,
          },
          trigger: null,
        });
      } catch { /* Expo Go may suppress */ }
    })();
  }, [renewals]);

  function daysLeft(endDate: string): number {
    return Math.ceil((new Date(endDate).getTime() - Date.now()) / 86_400_000);
  }

  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function callCustomer(phone: string) {
    Linking.openURL('tel:' + phone).catch(() =>
      Alert.alert('Error', 'Cannot open dialer.')
    );
  }

  function whatsappCustomer(phone: string, r: Renewal) {
    const msg = encodeURIComponent(
      'Hi ' + r.policy.user.name + ', I am reaching out regarding your ' + r.policy.type + ' policy (' + r.policy.policyNumber + ') which expires on ' + fmtDate(r.policy.endDate) + '. Let us discuss your renewal options!'
    );
    Linking.openURL('https://wa.me/' + phone.replace(/\D/g, '') + '?text=' + msg).catch(() =>
      Alert.alert('Error', 'WhatsApp not installed.')
    );
  }

  function openUpdate(r: Renewal) {
    setSelected(r);
    setModalStatus(r.status);
    setModalNotes(r.notes || '');
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 10 }).start();
  }

  function closeModal() {
    Animated.timing(slideAnim, { toValue: 600, duration: 220, useNativeDriver: true }).start(() => setSelected(null));
  }

  async function saveUpdate() {
    if (!selected) return;
    setSaving(true);
    try {
      await agentApi.updateRenewalStatus(selected.id, modalStatus, modalNotes || undefined);
      closeModal();
      load();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to update.');
    } finally {
      setSaving(false);
    }
  }

  const filtered = filter === 'all' ? renewals : renewals.filter(r => r.status === filter);
  const urgentCount = renewals.filter(r => { const d = daysLeft(r.policy.endDate); return d >= 0 && d <= 7 && r.status === 'pending'; }).length;

  const renderItem = ({ item: r }: { item: Renewal }) => {
    const meta  = STATUS_META[r.status];
    const days  = daysLeft(r.policy.endDate);
    const urgent = days >= 0 && days <= 7;

    return (
      <View style={[s.card, urgent && s.cardUrgent]}>
        <View style={s.cardHeader}>
          <View style={s.typeBadge}><Text style={s.typeBadgeText}>{r.policy.type.toUpperCase()}</Text></View>
          <View style={[s.statusBadge, { backgroundColor: meta.bg }]}>
            <Ionicons name={meta.icon as any} size={11} color={meta.color} />
            <Text style={[s.statusText, { color: meta.color }]}>{meta.label}</Text>
          </View>
        </View>

        <View style={[s.daysRow, { backgroundColor: urgent ? '#FEF2F2' : '#F8FAFC' }]}>
          <Ionicons name="calendar-outline" size={14} color={urgent ? '#DC2626' : '#8C9DB0'} />
          <Text style={[s.daysText, { color: urgent ? '#DC2626' : '#8C9DB0' }]}>
            {days < 0 ? 'Expired' : days === 0 ? 'Expires today!' : days + ' days left'}
          </Text>
          <Text style={s.expDate}>Expires {fmtDate(r.policy.endDate)}</Text>
        </View>

        <View style={s.customerRow}>
          <View style={s.customerAvatar}><Text style={s.avatarText}>{r.policy.user.name.charAt(0).toUpperCase()}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.customerName}>{r.policy.user.name}</Text>
            <Text style={s.policyNo}>{r.policy.policyNumber}</Text>
          </View>
        </View>

        <View style={s.detailRow}>
          <View style={s.detailChip}>
            <Ionicons name="business-outline" size={12} color="#8C9DB0" />
            <Text style={s.detailText}>{r.policy.insurer?.name || 'Unknown Insurer'}</Text>
          </View>
          <View style={s.detailChip}>
            <Ionicons name="cash-outline" size={12} color="#8C9DB0" />
            <Text style={s.detailText}>Rs {(r.policy.premium || 0).toLocaleString('en-IN')}</Text>
          </View>
        </View>

        {r.notes ? (
          <View style={s.notesRow}>
            <Ionicons name="document-text-outline" size={12} color="#8C9DB0" />
            <Text style={s.notesText} numberOfLines={2}>{r.notes}</Text>
          </View>
        ) : null}

        <View style={s.actions}>
          <TouchableOpacity style={s.actionBtn} onPress={() => callCustomer(r.policy.user.phone)} activeOpacity={0.7}>
            <Ionicons name="call" size={16} color="#059669" />
            <Text style={[s.actionLabel, { color: '#059669' }]}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionBtn} onPress={() => whatsappCustomer(r.policy.user.phone, r)} activeOpacity={0.7}>
            <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
            <Text style={[s.actionLabel, { color: '#25D366' }]}>WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.actionBtn, s.updateBtn]} onPress={() => openUpdate(r)} activeOpacity={0.7}>
            <Ionicons name="pencil" size={14} color="#1580FF" />
            <Text style={[s.actionLabel, { color: '#1580FF' }]}>Update</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Renewals</Text>
        {urgentCount > 0 && (
          <View style={s.urgentBadge}>
            <Ionicons name="warning" size={12} color="#fff" />
            <Text style={s.urgentBadgeText}>{urgentCount} urgent</Text>
          </View>
        )}
      </View>

      <View style={s.summaryBar}>
        {(['pending','contacted','closed','lost'] as RenewalStatus[]).map(st => {
          const meta = STATUS_META[st];
          const count = renewals.filter(r => r.status === st).length;
          return (
            <TouchableOpacity key={st} style={[s.summaryCard, { backgroundColor: meta.bg }]} onPress={() => setFilter(st)} activeOpacity={0.7}>
              <Text style={[s.summaryCount, { color: meta.color }]}>{count}</Text>
              <Text style={[s.summaryLabel, { color: meta.color }]}>{meta.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterBar}>
        {FILTER_TABS.map(tab => (
          <TouchableOpacity key={tab.key} onPress={() => setFilter(tab.key)} style={[s.filterTab, filter === tab.key && s.filterTabActive]} activeOpacity={0.7}>
            <Text style={[s.filterTabLabel, filter === tab.key && s.filterTabLabelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color="#1580FF" /></View>
      ) : filtered.length === 0 ? (
        <View style={s.center}>
          <Ionicons name="refresh-circle-outline" size={56} color="#DFE8F0" />
          <Text style={s.emptyTitle}>No renewals</Text>
          <Text style={s.emptySubtitle}>{filter === 'all' ? 'No renewal leads assigned to you yet.' : 'No ' + filter + ' renewals.'}</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={r => r.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: BottomTabInset + 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={['#1580FF']} tintColor="#1580FF" />}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal transparent visible={!!selected} animationType="none" onRequestClose={closeModal}>
        <View style={s.backdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeModal} activeOpacity={1} />
          <Animated.View style={[s.sheet, { transform: [{ translateY: slideAnim }] }]}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>Update Renewal Progress</Text>
            {selected && (
              <View style={s.sheetCustomer}>
                <Text style={s.sheetCustomerName}>{selected.policy.user.name}</Text>
                <Text style={s.sheetPolicyNo}>{selected.policy.policyNumber} · {selected.policy.type}</Text>
                <Text style={s.sheetExpiry}>Expires {fmtDate(selected.policy.endDate)}</Text>
              </View>
            )}
            <Text style={s.fieldLabel}>Status</Text>
            <View style={s.statusPicker}>
              {(['pending','contacted','closed','lost'] as RenewalStatus[]).map(st => {
                const meta = STATUS_META[st];
                const active = modalStatus === st;
                return (
                  <TouchableOpacity key={st} onPress={() => setModalStatus(st)} style={[s.statusOption, active && { backgroundColor: meta.bg, borderColor: meta.color }]} activeOpacity={0.7}>
                    <Ionicons name={meta.icon as any} size={18} color={active ? meta.color : '#8C9DB0'} />
                    <Text style={[s.statusOptionLabel, active && { color: meta.color, fontWeight: '700' }]}>{meta.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={s.fieldLabel}>Notes (optional)</Text>
            <TextInput style={s.notesInput} value={modalNotes} onChangeText={setModalNotes} placeholder="Add a note about this contact..." placeholderTextColor="#8C9DB0" multiline numberOfLines={3} textAlignVertical="top" />
            <View style={s.sheetActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={closeModal} activeOpacity={0.7}>
                <Text style={s.cancelBtnLabel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.saveBtn} onPress={saveUpdate} disabled={saving} activeOpacity={0.7}>
                {saving ? <ActivityIndicator size="small" color="#fff" /> : (
                  <><Ionicons name="checkmark-circle" size={16} color="#fff" /><Text style={s.saveBtnLabel}>Save Progress</Text></>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F9FC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#DDE4EC' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#0A1628', letterSpacing: -0.5 },
  urgentBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#DC2626', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  urgentBadgeText: { fontSize: 11, fontWeight: '800', color: '#fff' },
  summaryBar: { flexDirection: 'row', padding: 12, gap: 8 },
  summaryCard: { flex: 1, borderRadius: 12, padding: 10, alignItems: 'center' },
  summaryCount: { fontSize: 18, fontWeight: '900' },
  summaryLabel: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
  filterBar: { paddingHorizontal: 14, paddingBottom: 4, gap: 8, flexDirection: 'row' },
  filterTab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 100, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#DDE4EC' },
  filterTabActive: { backgroundColor: '#1580FF', borderColor: '#1580FF' },
  filterTabLabel: { fontSize: 12, fontWeight: '600', color: '#5A6B80' },
  filterTabLabelActive: { color: '#fff', fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#0A1628', marginTop: 12 },
  emptySubtitle: { fontSize: 13, color: '#5A6B80', marginTop: 4, textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#DDE4EC', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardUrgent: { borderColor: '#FCA5A5' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  typeBadge: { backgroundColor: '#E8F2FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  typeBadgeText: { fontSize: 10, fontWeight: '800', color: '#1580FF', letterSpacing: 0.5 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100 },
  statusText: { fontSize: 10, fontWeight: '700' },
  daysRow: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8, borderRadius: 10, marginBottom: 10 },
  daysText: { fontSize: 12, fontWeight: '700', flex: 1 },
  expDate: { fontSize: 11, color: '#8C9DB0' },
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  customerAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#E8F2FF', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '800', color: '#1580FF' },
  customerName: { fontSize: 14, fontWeight: '800', color: '#0A1628' },
  policyNo: { fontSize: 11, color: '#5A6B80', marginTop: 1 },
  detailRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  detailChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F6F9FC', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  detailText: { fontSize: 11, color: '#5A6B80', fontWeight: '600' },
  notesRow: { flexDirection: 'row', gap: 6, backgroundColor: '#EFF3F8', padding: 8, borderRadius: 8, marginBottom: 10, alignItems: 'flex-start' },
  notesText: { fontSize: 12, color: '#5A6B80', flex: 1, lineHeight: 18 },
  actions: { flexDirection: 'row', gap: 8, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderColor: '#DDE4EC', marginTop: 2 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, borderRadius: 10, backgroundColor: '#F6F9FC', borderWidth: 1, borderColor: '#DDE4EC' },
  updateBtn: { backgroundColor: '#E8F2FF', borderColor: '#1580FF44' },
  actionLabel: { fontSize: 12, fontWeight: '700' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32 },
  sheetHandle: { width: 40, height: 4, backgroundColor: '#DDE4EC', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontWeight: '900', color: '#0A1628', marginBottom: 14 },
  sheetCustomer: { backgroundColor: '#F6F9FC', borderRadius: 12, padding: 12, marginBottom: 16 },
  sheetCustomerName: { fontSize: 14, fontWeight: '800', color: '#0A1628' },
  sheetPolicyNo: { fontSize: 12, color: '#5A6B80', marginTop: 2 },
  sheetExpiry: { fontSize: 11, color: '#8C9DB0', marginTop: 2 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#5A6B80', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  statusPicker: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statusOption: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: '#DDE4EC', backgroundColor: '#F6F9FC', gap: 4 },
  statusOptionLabel: { fontSize: 10, fontWeight: '600', color: '#5A6B80' },
  notesInput: { borderWidth: 1.5, borderColor: '#DDE4EC', borderRadius: 12, padding: 12, fontSize: 13, color: '#0A1628', backgroundColor: '#F6F9FC', minHeight: 80, marginBottom: 20 },
  sheetActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, alignItems: 'center', paddingVertical: 13, borderRadius: 14, backgroundColor: '#F6F9FC', borderWidth: 1.5, borderColor: '#DDE4EC' },
  cancelBtnLabel: { fontSize: 14, fontWeight: '700', color: '#5A6B80' },
  saveBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderRadius: 14, backgroundColor: '#1580FF' },
  saveBtnLabel: { fontSize: 14, fontWeight: '800', color: '#fff' },
});
