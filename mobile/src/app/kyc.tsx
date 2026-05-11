import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Image, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { Icon } from '@/components/Icon';
import { Colors } from '@/constants/theme';
import { kycApi } from '@/lib/api';
import { useAuth } from '@/context/auth';
import { useDialog } from '@/components/Dialog';

type DocType = 'aadhaar' | 'driving_license' | 'passport';
type Step = 'idle' | 'picked' | 'uploading' | 'success' | 'error';

const DOC_OPTIONS: { type: DocType; label: string; icon: string; hint: string }[] = [
  { type: 'aadhaar',         label: 'Aadhaar Card',      icon: 'card-outline',            hint: 'Front side of Aadhaar card' },
  { type: 'driving_license', label: 'Driving Licence',   icon: 'car-outline',             hint: 'Both sides or full document' },
  { type: 'passport',        label: 'Passport',          icon: 'airplane-outline',        hint: 'First two pages (biodata)' },
];

export default function KycScreen() {
  const router          = useRouter();
  const { refreshUser, user } = useAuth();
  const { alert }       = useDialog();

  const [docType,  setDocType]  = useState<DocType | null>(null);
  const [fileUri,  setFileUri]  = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [mimeType, setMimeType] = useState<string>('');
  const [step,     setStep]     = useState<Step>('idle');

  const isImage = mimeType.startsWith('image/');

  useEffect(() => {
    if (user?.kycStatus === 'verified') setStep('success');
  }, [user?.kycStatus]);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      setFileUri(asset.uri);
      setFileName(asset.name);
      setMimeType(asset.mimeType ?? 'application/octet-stream');
      setStep('picked');
    } catch {
      alert({ type: 'error', title: 'Failed to pick file', message: 'Please try again.' });
    }
  };

  const submitDocument = async () => {
    if (!docType || !fileUri) return;
    setStep('uploading');
    try {
      await kycApi.uploadDocument(docType, fileUri, mimeType, fileName);
      await refreshUser();
      setStep('success');
    } catch (e: any) {
      alert({ type: 'error', title: 'Upload Failed', message: e?.message ?? 'Please try again.' });
      setStep('picked');
    }
  };

  const reset = () => {
    setDocType(null);
    setFileUri(null);
    setFileName('');
    setMimeType('');
    setStep('idle');
  };

  if (step === 'success') {
    const isVerified = user?.kycStatus === 'verified';
    return (
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Icon name="arrow-back-outline" size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>KYC Verification</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={s.successWrap}>
          <View style={[s.successCircle, { backgroundColor: isVerified ? '#ECFDF5' : Colors.primaryLight }]}>
            <Icon
              name={isVerified ? 'checkmark-circle' : 'time-outline'}
              size={64}
              color={isVerified ? '#059669' : Colors.primary}
            />
          </View>
          <Text style={s.successTitle}>{isVerified ? 'KYC Verified!' : 'Document Submitted!'}</Text>
          <Text style={s.successSub}>
            {isVerified
              ? 'Your identity has been verified. You can now access all features.'
              : 'Your document is under review. We\'ll notify you once it\'s verified, usually within 24 hours.'}
          </Text>
          <TouchableOpacity style={s.ctaBtn} onPress={() => router.back()}>
            <Text style={s.ctaBtnText}>Back to Home</Text>
          </TouchableOpacity>
          {!isVerified && (
            <TouchableOpacity style={s.linkBtn} onPress={reset}>
              <Text style={s.linkBtnText}>Upload a different document</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  const rejectionReason = (user as any)?.kycRejectionReason;

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Icon name="arrow-back-outline" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>KYC Verification</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>

        {/* Rejection banner */}
        {rejectionReason && (
          <View style={s.rejectBanner}>
            <Icon name="alert-circle-outline" size={18} color="#B91C1C" />
            <View style={{ flex: 1 }}>
              <Text style={s.rejectTitle}>Previous submission rejected</Text>
              <Text style={s.rejectReason}>{rejectionReason}</Text>
            </View>
          </View>
        )}

        {/* Hero */}
        <View style={s.heroCard}>
          <View style={s.heroBg1} /><View style={s.heroBg2} />
          <View style={s.heroIconCircle}>
            <Icon name="shield-checkmark-outline" size={40} color={Colors.primary} />
          </View>
          <Text style={s.heroTitle}>Verify your identity</Text>
          <Text style={s.heroSub}>
            Upload a government-issued ID to complete KYC and unlock all features.
          </Text>
        </View>

        {/* Step 1 — choose document type */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>Step 1 — Select document type</Text>
          {DOC_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.type}
              style={[s.docOption, docType === opt.type && s.docOptionSelected]}
              onPress={() => setDocType(opt.type)}
              activeOpacity={0.8}
            >
              <View style={[s.docOptionIcon, docType === opt.type && s.docOptionIconSelected]}>
                <Icon name={opt.icon as any} size={20} color={docType === opt.type ? Colors.white : Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.docOptionLabel, docType === opt.type && s.docOptionLabelSelected]}>{opt.label}</Text>
                <Text style={s.docOptionHint}>{opt.hint}</Text>
              </View>
              {docType === opt.type && <Icon name="checkmark-circle" size={20} color={Colors.primary} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Step 2 — pick file */}
        {docType && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>Step 2 — Upload document</Text>

            {fileUri ? (
              <View style={s.previewCard}>
                {isImage ? (
                  <Image source={{ uri: fileUri }} style={s.previewImage} resizeMode="contain" />
                ) : (
                  <View style={s.pdfPreview}>
                    <Icon name="document-text-outline" size={40} color={Colors.primary} />
                    <Text style={s.pdfName} numberOfLines={2}>{fileName}</Text>
                  </View>
                )}
                <TouchableOpacity style={s.changeFileBtn} onPress={pickDocument}>
                  <Icon name="refresh-outline" size={14} color={Colors.primary} />
                  <Text style={s.changeFileBtnText}>Change file</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={s.uploadArea} onPress={pickDocument} activeOpacity={0.8}>
                <Icon name="cloud-upload-outline" size={36} color={Colors.primary} />
                <Text style={s.uploadAreaTitle}>Tap to choose file</Text>
                <Text style={s.uploadAreaSub}>JPEG, PNG, WebP or PDF · Max 10 MB</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Submit */}
        {step === 'picked' && (
          <TouchableOpacity
            style={[s.ctaBtn, step !== 'picked' && s.ctaBtnDisabled]}
            activeOpacity={0.85}
            onPress={submitDocument}
            disabled={step !== 'picked'}
          >
            <>
              <Icon name="cloud-upload-outline" size={20} color={Colors.white} />
              <Text style={s.ctaBtnText}>Submit for Review</Text>
            </>
          </TouchableOpacity>
        )}

        {step === 'uploading' && (
          <View style={s.uploadingRow}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={s.uploadingText}>Uploading document securely…</Text>
          </View>
        )}

        <Text style={s.disclaimer}>
          Your document is encrypted and stored securely. It will only be reviewed by our KYC team.
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },

  body: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40, gap: 16 },

  rejectBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#FEF2F2', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#FCA5A5',
  },
  rejectTitle:  { fontSize: 12, fontWeight: '800', color: '#B91C1C', marginBottom: 2 },
  rejectReason: { fontSize: 12, color: '#B91C1C', lineHeight: 18 },

  heroCard: {
    backgroundColor: Colors.white, borderRadius: 18, padding: 24,
    alignItems: 'center', gap: 10, overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border,
    ...Platform.select({
      ios:     { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  heroBg1: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    backgroundColor: Colors.primaryLight, top: -60, right: -40,
  },
  heroBg2: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    backgroundColor: Colors.primaryLight, bottom: -30, left: -20, opacity: 0.5,
  },
  heroIconCircle: {
    width: 76, height: 76, borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  heroTitle: { fontSize: 20, fontWeight: '900', color: Colors.text, letterSpacing: -0.4 },
  heroSub:   { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },

  section: { gap: 10 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: Colors.textLight, letterSpacing: 0.5, textTransform: 'uppercase' },

  docOption: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.white, borderRadius: 14, padding: 14,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  docOptionSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  docOptionIcon: {
    width: 40, height: 40, borderRadius: 11,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  docOptionIconSelected: { backgroundColor: Colors.primary },
  docOptionLabel: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  docOptionLabelSelected: { color: Colors.primary },
  docOptionHint: { fontSize: 11, color: Colors.textMuted },

  uploadArea: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 32,
    alignItems: 'center', gap: 8,
    borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed',
  },
  uploadAreaTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  uploadAreaSub:   { fontSize: 12, color: Colors.textMuted },

  previewCard: {
    backgroundColor: Colors.white, borderRadius: 16, overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border,
  },
  previewImage: { width: '100%', height: 220, backgroundColor: Colors.bg },
  pdfPreview: {
    height: 140, alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: Colors.bg,
  },
  pdfName: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: 20 },
  changeFileBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border,
  },
  changeFileBtnText: { fontSize: 13, color: Colors.primary, fontWeight: '700' },

  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16,
  },
  ctaBtnDisabled: { opacity: 0.6 },
  ctaBtnText: { fontSize: 15, fontWeight: '800', color: Colors.white },

  uploadingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    padding: 14, backgroundColor: Colors.primaryLight, borderRadius: 12,
  },
  uploadingText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },

  disclaimer: {
    fontSize: 11, color: Colors.textLight, textAlign: 'center', lineHeight: 16, paddingHorizontal: 8,
  },

  // Success screen
  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 24 },
  successCircle: {
    width: 100, height: 100, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center',
  },
  successTitle: { fontSize: 26, fontWeight: '900', color: Colors.text, letterSpacing: -0.5 },
  successSub:   { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },
  linkBtn: { marginTop: 4 },
  linkBtnText: { fontSize: 13, color: Colors.primary, fontWeight: '700', textDecorationLine: 'underline' },
});
