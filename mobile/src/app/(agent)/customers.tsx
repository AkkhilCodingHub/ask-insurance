import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Modal, TextInput, ActivityIndicator, Alert, Pressable, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/Icon';
import { Colors } from '@/constants/theme';
import { agentApi } from '@/lib/api';
import { useAgent } from '@/context/agent';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  kycStatus: string;
  createdAt: string;
}

export default function AgentCustomersScreen() {
  const router = useRouter();
  const { agent } = useAgent();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  const loadCustomers = useCallback(async (isRef = false) => {
    if (isRef) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await agentApi.getCustomers();
      setCustomers(data);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to load customers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleAddCustomer = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Validation Error', 'Name and Phone are required.');
      return;
    }
    setBusy(true);
    try {
      await agentApi.addCustomer({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || null
      });
      Alert.alert('Success', 'Customer registered successfully!');
      setModalVisible(false);
      setName('');
      setPhone('');
      setEmail('');
      loadCustomers();
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to add customer');
    } finally {
      setBusy(false);
    }
  };

  const renderCustomerItem = ({ item }: { item: Customer }) => {
    const isKyc = item.kycStatus === 'verified';
    return (
      <View style={s.itemCard}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{item.name.slice(0,2).toUpperCase()}</Text>
        </View>
        <View style={s.details}>
          <Text style={s.customerName}>{item.name}</Text>
          <Text style={s.customerPhone}>📞 {item.phone}</Text>
          {item.email && <Text style={s.customerEmail}>✉️ {item.email}</Text>}
        </View>
        <View style={[s.badge, { backgroundColor: isKyc ? '#ECFDF5' : '#FFFBEB' }]}>
          <Text style={[s.badgeText, { color: isKyc ? '#059669' : '#D97706' }]}>
            {isKyc ? 'Verified' : 'Pending'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.headerTitle}>My Customers</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setModalVisible(true)} activeOpacity={0.8}>
          <Icon name="add" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* KYC Warning banner if agent KYC is not verified */}
      {agent?.kycStatus !== 'verified' && (
        <TouchableOpacity
          style={s.kycBanner}
          onPress={() => router.push('/(agent)/kyc' as any)}
          activeOpacity={0.9}
        >
          <Icon name="alert-circle" size={20} color="#78350F" />
          <Text style={s.kycBannerText}>
            KYC Pending: Upload identity proof to activate advisor privileges. Tap here.
          </Text>
          <Icon name="chevron-forward" size={16} color="#78350F" />
        </TouchableOpacity>
      )}

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={customers}
          keyExtractor={item => item.id}
          renderItem={renderCustomerItem}
          contentContainerStyle={s.list}
          refreshing={refreshing}
          onRefresh={() => loadCustomers(true)}
          ListEmptyComponent={
            <View style={s.empty}>
              <Icon name="people-outline" size={48} color="#CBD5E1" />
              <Text style={s.emptyText}>No registered customers yet.</Text>
              <Text style={s.emptySub}>Tap the "+" icon in the top right to register a new lead.</Text>
            </View>
          }
        />
      )}

      {/* Add Customer Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <Pressable style={s.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Register Customer</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close" size={22} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={s.modalForm}>
              <Text style={s.label}>FULL NAME *</Text>
              <TextInput value={name} onChangeText={setName} placeholder="e.g. Ramesh Kumar" placeholderTextColor="#94A3B8" style={s.input} />

              <Text style={s.label}>PHONE NUMBER *</Text>
              <TextInput value={phone} onChangeText={setPhone} placeholder="e.g. +919876543210" keyboardType="phone-pad" placeholderTextColor="#94A3B8" style={s.input} />

              <Text style={s.label}>EMAIL ADDRESS (OPTIONAL)</Text>
              <TextInput value={email} onChangeText={setEmail} placeholder="e.g. ramesh@gmail.com" keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#94A3B8" style={s.input} />

              <TouchableOpacity onPress={handleAddCustomer} disabled={busy} style={s.saveBtn} activeOpacity={0.88}>
                {busy ? <ActivityIndicator color={Colors.white} size="small" /> : <Text style={s.saveBtnText}>Register Customer</Text>}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  header: {
    height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: Colors.text, letterSpacing: -0.5 },
  addBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center'
  },
  kycBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12,
    backgroundColor: '#FEF3C7', borderBottomWidth: 1, borderBottomColor: '#FDE68A'
  },
  kycBannerText: { flex: 1, fontSize: 12, fontWeight: '700', color: '#78350F', lineHeight: 16 },
  list: { padding: 16, gap: 12 },
  itemCard: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, backgroundColor: '#F8FAFC'
  },
  avatar: {
    width: 42, height: 42, borderRadius: 12, backgroundColor: '#EFF6FF',
    alignItems: 'center', justifyContent: 'center', marginRight: 12
  },
  avatarText: { fontSize: 14, fontWeight: '800', color: '#1D4ED8' },
  details: { flex: 1, gap: 2 },
  customerName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  customerPhone: { fontSize: 12, color: Colors.textLight },
  customerEmail: { fontSize: 11, color: Colors.textLight },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 100 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 64, gap: 8 },
  emptyText: { fontSize: 15, fontWeight: '700', color: '#94A3B8' },
  emptySub: { fontSize: 12, color: '#CBD5E1', textAlign: 'center', paddingHorizontal: 32 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  modalForm: { gap: 14 },
  label: { fontSize: 10, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.8 },
  input: {
    width: '100%', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 10,
    padding: 12, fontSize: 14, color: Colors.text, backgroundColor: '#F8FAFC'
  },
  saveBtn: {
    height: 48, borderRadius: 12, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center', marginTop: 10
  },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: Colors.white }
});
