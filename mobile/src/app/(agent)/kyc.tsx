import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Platform, ScrollView, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { Icon } from '@/components/Icon';
import { Colors } from '@/constants/theme';
import { agentApi } from '@/lib/api';
import { useAgent } from '@/context/agent';

type DocType = 'marksheet_10_12' | 'aadhaar' | 'pan' | 'appointment_letter';

export default function AgentKycScreen() {
  const router = useRouter();
  const { agent, refreshAgent } = useAgent();

  const [docType, setDocType] = useState<DocType>('marksheet_10_12');
  const [file, setFile] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    refreshAgent();
  }, []);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true
      });

      if (result.canceled) return;
      const asset = result.assets[0];
      setFile({
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType ?? 'application/octet-stream'
      });
      setError(null);
    } catch (e) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      setError('Please pick a document first.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await agentApi.uploadKycDocument(
        docType,
        file.uri,
        file.type,
        file.name
      );
      Alert.alert('Success', 'Authorization Letter submitted successfully!');
      refreshAgent();
      setFile(null);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to upload document');
    } finally {
      setBusy(false);
    }
  };

  const kycStatus = agent?.kycStatus ?? 'pending';

  if (kycStatus === 'verified') {
    return (
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Icon name="arrow-back-outline" size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Verification Status</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={s.centerWrap}>
          <View style={[s.iconCircle, { backgroundColor: '#ECFDF5' }]}>
            <Icon name="checkmark-circle" size={64} color="#059669" />
          </View>
          <Text style={s.statusTitle}>Authorization Verified!</Text>
          <Text style={s.statusSub}>
            Your official ASK Insurance authorization letter has been approved by the administrators. You have full advisor portal access.
          </Text>
          <TouchableOpacity style={s.homeBtn} onPress={() => router.replace('/(agent)/quotes')}>
            <Text style={s.homeBtnText}>Go to Quotes</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (kycStatus === 'submitted') {
    return (
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Icon name="arrow-back-outline" size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Verification Status</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={s.centerWrap}>
          <View style={[s.iconCircle, { backgroundColor: '#EFF6FF' }]}>
            <Icon name="time-outline" size={64} color="#1D4ED8" />
          </View>
          <Text style={s.statusTitle}>Pending Approval</Text>
          <Text style={s.statusSub}>
            Your authorization letter is under review by the administrator. This usually takes less than 24 hours.
          </Text>
          <TouchableOpacity style={s.homeBtn} onPress={() => router.replace('/(agent)/quotes')}>
            <Text style={s.homeBtnText}>Go to Quotes</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Icon name="arrow-back-outline" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Upload Authorization Letter</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.title}>Verify Advisor Authorization</Text>
        <Text style={s.subtitle}>
          Upload the Official Appointment or Authorization Letter provided by ASK Insurance officials to verify and activate your advisor account.
        </Text>

        {kycStatus === 'rejected' && agent?.kycRejectionReason && (
          <View style={s.rejectionBox}>
            <Icon name="alert-circle-outline" size={20} color="#DC2626" />
            <View style={{ flex: 1 }}>
              <Text style={s.rejectionTitle}>Verification Rejected</Text>
              <Text style={s.rejectionReason}>{agent.kycRejectionReason}</Text>
            </View>
          </View>
        )}

        <Text style={s.sectionLabel}>SELECT DOCUMENT TYPE</Text>
        <View style={s.docSelector}>
          {([
            { id: 'marksheet_10_12', label: '📄 10th / 12th Educational Marksheet (POSP Certification Proof)' },
            { id: 'aadhaar', label: '🆔 Aadhaar Card (Front & Back Proof)' },
            { id: 'pan', label: '💳 PAN Card (Tax & Payout Verification)' },
            { id: 'appointment_letter', label: '📜 ASK Insurance Appointment Letter (Official)' }
          ] as const).map(item => {
            const active = docType === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => setDocType(item.id)}
                style={[s.docOpt, active && s.docOptActive]}
                activeOpacity={0.7}
              >
                <View style={[s.radio, active && s.radioActive]}>
                  {active && <View style={s.radioDot} />}
                </View>
                <Text style={[s.docOptLabel, active && s.docOptLabelActive]}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={s.sectionLabel}>ATTACH DOCUMENT</Text>
        <TouchableOpacity
          onPress={handlePickDocument}
          style={s.uploadArea}
          activeOpacity={0.7}
        >
          <Icon name={file ? 'document-attach' : 'cloud-upload-outline'} size={40} color={file ? Colors.primary : '#94A3B8'} />
          <Text style={s.uploadText}>
            {file ? file.name : 'Pick PDF or Image Document'}
          </Text>
          <Text style={s.uploadSub}>Max size: 5MB (PDF, PNG, JPG)</Text>
        </TouchableOpacity>

        {error && <Text style={s.errorText}>{error}</Text>}

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={busy}
          style={[s.submitBtn, busy && s.submitBtnBusy]}
          activeOpacity={0.88}
        >
          {busy ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <Text style={s.submitBtnText}>Submit for Verification</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  header: {
    height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  scroll: { padding: 24 },
  title: { fontSize: 24, fontWeight: '900', color: Colors.text, marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: Colors.textLight, lineHeight: 20, marginBottom: 24 },
  rejectionBox: {
    flexDirection: 'row', gap: 12, padding: 14, backgroundColor: '#FEF2F2',
    borderWidth: 1, borderColor: '#FCA5A5', borderRadius: 12, marginBottom: 24
  },
  rejectionTitle: { fontSize: 14, fontWeight: '700', color: '#DC2626', marginBottom: 2 },
  rejectionReason: { fontSize: 13, color: '#DC2626', lineHeight: 18 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.8, marginBottom: 10 },
  docSelector: { gap: 10, marginBottom: 24 },
  docOpt: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 12, backgroundColor: '#F8FAFC'
  },
  docOptActive: { borderColor: Colors.primary, backgroundColor: '#EFF6FF' },
  radio: {
    width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#CBD5E1',
    alignItems: 'center', justifyContent: 'center'
  },
  radioActive: { borderColor: Colors.primary },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  docOptLabel: { fontSize: 14, fontWeight: '600', color: '#475569' },
  docOptLabelActive: { color: '#1D4ED8', fontWeight: '700' },
  uploadArea: {
    borderWidth: 2, borderStyle: 'dashed', borderColor: '#CBD5E1', borderRadius: 16,
    padding: 24, alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#F8FAFC',
    marginBottom: 24
  },
  uploadText: { fontSize: 14, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  uploadSub: { fontSize: 11, color: '#94A3B8' },
  errorText: { fontSize: 13, color: '#DC2626', fontWeight: '600', marginBottom: 16 },
  submitBtn: {
    height: 48, borderRadius: 12, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center'
  },
  submitBtnBusy: { opacity: 0.8 },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: Colors.white },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  iconCircle: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  statusTitle: { fontSize: 22, fontWeight: '900', color: Colors.text, marginBottom: 8 },
  statusSub: { fontSize: 14, color: Colors.textLight, textAlign: 'center', lineHeight: 20, marginBottom: 32 },
  homeBtn: {
    height: 48, paddingHorizontal: 24, borderRadius: 12, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center'
  },
  homeBtnText: { fontSize: 14, fontWeight: '700', color: Colors.white }
});
