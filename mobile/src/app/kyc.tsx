import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import { Icon } from '@/components/Icon';
import { Colors } from '@/constants/theme';
import * as DocumentPicker from 'expo-document-picker';
import { kycApi, documentsApi } from '@/lib/api';
import { useAuth } from '@/context/auth';
import { useDialog } from '@/components/Dialog';
import { useThemeColors } from '@/context/agent';
import { DL_STATE_KEY, DL_VERIFIER_KEY } from './kyc-callback';

type Step = 'idle' | 'success';

const BENEFITS: { icon: string; text: string }[] = [
  { icon: 'flash-outline',          text: 'Verified in seconds — no waiting for review' },
  { icon: 'shield-checkmark-outline', text: 'Government-backed identity via DigiLocker' },
  { icon: 'lock-closed-outline',    text: 'We never see your password — only the result' },
];

export default function KycScreen() {
  const router                = useRouter();
  const { refreshUser, user } = useAuth();
  const { alert }             = useDialog();
  const colors                = useThemeColors();

  const [step,   setStep]   = useState<Step>('idle');
  const [dlBusy, setDlBusy] = useState(false);

  // Keep UI in sync with server-side KYC status.
  useEffect(() => {
    const st = user?.kycStatus;
    if (!st) return;
    if (st === 'verified' || st === 'submitted') {
      setStep('success');
      return;
    }
    setStep((cur) => (cur === 'success' ? 'idle' : cur));
  }, [user?.kycStatus]);

  const verifyWithDigiLocker = async () => {
    const st = user?.kycStatus;
    if (st === 'submitted' || st === 'verified') {
      setStep('success');
      return;
    }
    setDlBusy(true);
    try {
      const { url, state, codeVerifier } = await kycApi.initiate();

      await SecureStore.setItemAsync(DL_STATE_KEY, state);
      await SecureStore.setItemAsync(DL_VERIFIER_KEY, codeVerifier);

      const redirectUrl = 'askinsurance://kyc-callback';
      const result = await WebBrowser.openAuthSessionAsync(url, redirectUrl);

      if (result.type === 'cancel' || result.type === 'dismiss') {
        setDlBusy(false);
        return;
      }

      if (result.type === 'success' && result.url) {
        const urlObj = new URL(result.url);
        const code = urlObj.searchParams.get('code');
        const stateParam = urlObj.searchParams.get('state');
        const error = urlObj.searchParams.get('error') || urlObj.searchParams.get('error_description');

        if (error) {
          throw new Error(error);
        }

        if (code && stateParam) {
          await kycApi.callback({ code, state: stateParam, codeVerifier });
          await refreshUser();
          setStep('success');
        }
      }
    } catch (e: any) {
      alert({ type: 'error', title: 'Verification failed', message: e?.message ?? 'Could not start DigiLocker verification. Please try again.' });
    } finally {
      setDlBusy(false);
    }
  };

  if (step === 'success') {
    const isVerified = user?.kycStatus === 'verified';
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: colors.bg }]} edges={['top', 'bottom']}>
        <View style={[s.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity style={[s.backBtn, { backgroundColor: colors.bg }]} onPress={() => router.back()}>
            <Icon name="arrow-back-outline" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: colors.text }]}>KYC Verification</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={s.successWrap}>
          <View style={[s.successCircle, { backgroundColor: isVerified ? '#ECFDF5' : colors.primaryLight }]}>
            <Icon
              name={isVerified ? 'checkmark-circle' : 'time-outline'}
              size={64}
              color={isVerified ? '#059669' : Colors.primary}
            />
          </View>
          <Text style={[s.successTitle, { color: colors.text }]}>{isVerified ? 'KYC Verified!' : 'KYC in progress'}</Text>
          <Text style={[s.successSub, { color: colors.textMuted }]}>
            {isVerified
              ? 'Your identity has been verified. You can now access all features.'
              : 'Your verification is being processed.'}
          </Text>
          <TouchableOpacity
            style={s.successHomeBtn}
            onPress={() => router.replace('/(tabs)')}
            activeOpacity={0.88}
          >
            <Icon name="home-outline" size={22} color={Colors.white} />
            <Text style={s.successHomeBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const rejectionReason = (user as any)?.kycRejectionReason;

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.bg }]} edges={['top', 'bottom']}>
      <View style={[s.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={[s.backBtn, { backgroundColor: colors.bg }]} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
          <Icon name="arrow-back-outline" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.text }]}>KYC Verification</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>

        {/* Rejection / retry banner */}
        {rejectionReason && (
          <View style={s.rejectBanner}>
            <Icon name="alert-circle-outline" size={18} color="#B91C1C" />
            <View style={{ flex: 1 }}>
              <Text style={s.rejectTitle}>Previous verification could not be completed</Text>
              <Text style={s.rejectReason}>{rejectionReason}</Text>
            </View>
          </View>
        )}

        {/* Hero */}
        <View style={[s.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[s.heroBg1, { backgroundColor: colors.primaryLight }]} />
          <View style={[s.heroBg2, { backgroundColor: colors.primaryLight }]} />
          <View style={[s.heroIconCircle, { backgroundColor: colors.primaryLight }]}>
            <Icon name="shield-checkmark-outline" size={40} color={Colors.primary} />
          </View>
          <Text style={[s.heroTitle, { color: colors.text }]}>Verify your identity</Text>
          <Text style={[s.heroSub, { color: colors.textMuted }]}>
            Complete KYC instantly with DigiLocker to unlock payments, policies and claims.
          </Text>
        </View>

        {/* Benefits */}
        <View style={s.benefits}>
          {BENEFITS.map(b => (
            <View key={b.text} style={s.benefitRow}>
              <View style={[s.benefitIcon, { backgroundColor: colors.primaryLight }]}>
                <Icon name={b.icon as any} size={18} color={Colors.primary} />
              </View>
              <Text style={[s.benefitText, { color: colors.text }]}>{b.text}</Text>
            </View>
          ))}
        </View>

        {/* ── PolicyBazaar-Style Backend Document Verification & OCR Widget ── */}
        <PolicyBazaarDocVerificationWidget colors={colors} alert={alert} refreshUser={refreshUser} />

        {/* Primary — DigiLocker verification */}
        <TouchableOpacity
          style={[s.dlCard, dlBusy && s.dlCardDisabled]}
          onPress={verifyWithDigiLocker}
          disabled={dlBusy}
          activeOpacity={0.88}
        >
          <View style={s.dlIcon}>
            {dlBusy
              ? <ActivityIndicator color={Colors.white} />
              : <Icon name="shield-checkmark" size={24} color={Colors.white} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.dlTitle}>{dlBusy ? 'Connecting to DigiLocker…' : 'Verify with DigiLocker'}</Text>
            <Text style={s.dlSub}>Government-backed · verified in seconds</Text>
          </View>
          {!dlBusy && <Icon name="chevron-forward" size={20} color={Colors.white} />}
        </TouchableOpacity>

        <Text style={[s.disclaimer, { color: colors.textMuted }]}>
          You'll be redirected to DigiLocker to grant access to your issued documents.
          We only receive the verification result — never your DigiLocker credentials.
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

  benefits: { gap: 12, paddingHorizontal: 4 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  benefitIcon: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  benefitText: { flex: 1, fontSize: 13, color: Colors.text, fontWeight: '600', lineHeight: 18 },

  dlCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.primary, borderRadius: 16, padding: 16,
    ...Platform.select({
      ios:     { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10 },
      android: { elevation: 4 },
    }),
  },
  dlCardDisabled: { opacity: 0.6 },
  dlIcon: {
    width: 44, height: 44, borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  dlTitle: { fontSize: 15, fontWeight: '800', color: Colors.white, marginBottom: 3 },
  dlSub:   { fontSize: 11, color: 'rgba(255,255,255,0.85)', lineHeight: 15 },

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
  successHomeBtn: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    marginTop: 8,
    minHeight: 54,
    ...Platform.select({
      ios:     { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 10 },
      android: { elevation: 5 },
    }),
  },
  successHomeBtnText: { fontSize: 16, fontWeight: '800', color: Colors.white, letterSpacing: -0.3 },
});

function PolicyBazaarDocVerificationWidget({ colors, alert, refreshUser }: { colors: any; alert: any; refreshUser: () => Promise<void> }) {
  const [selectedDocType, setSelectedDocType] = useState<'pan' | 'aadhaar' | 'rc' | 'driving_license' | 'policy_copy'>('pan');
  const [uploading, setUploading] = useState(false);
  const [extractedResult, setExtractedResult] = useState<any>(null);

  const handlePickAndVerify = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (res.canceled || !res.assets || res.assets.length === 0) return;

      const asset = res.assets[0];
      setUploading(true);
      setExtractedResult(null);

      const formData = new FormData();
      formData.append('docType', selectedDocType);
      formData.append('document', {
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType || 'image/jpeg',
      } as any);

      const response = await documentsApi.ocrVerify(formData);
      if (response && response.success) {
        setExtractedResult(response);
        await refreshUser().catch(() => {});
        alert({
          type: 'success',
          title: 'Document Verified!',
          message: `${response.extractedFields?.docType || selectedDocType.toUpperCase()} verified successfully via IRDAI compliant OCR engine.`
        });
      } else {
        alert({ type: 'error', title: 'Verification Failed', message: 'Could not extract document fields. Please re-upload a clear image.' });
      }
    } catch {
      alert({ type: 'error', title: 'Upload Error', message: 'Failed to process document verification via backend API.' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={{ backgroundColor: colors.card, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: colors.border }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 18 }}>🔍</Text>
          <View>
            <Text style={{ fontSize: 15, fontWeight: '900', color: colors.text }}>PolicyBazaar Document Verification</Text>
            <Text style={{ fontSize: 11, color: colors.textMuted }}>Backend OCR &amp; Instant Data Extraction Engine</Text>
          </View>
        </View>
        <View style={{ backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
          <Text style={{ fontSize: 10, fontWeight: '800', color: '#059669' }}>LIVE OCR</Text>
        </View>
      </View>

      {/* DocType Selector Pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 14 }}>
        {[
          { id: 'pan', label: '💳 PAN Card' },
          { id: 'aadhaar', label: '🪪 Aadhaar Card' },
          { id: 'rc', label: '🚗 Vehicle RC' },
          { id: 'driving_license', label: '📄 Driving License' },
          { id: 'policy_copy', label: '📑 Policy Copy' },
        ].map((t) => (
          <TouchableOpacity
            key={t.id}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 10,
              backgroundColor: selectedDocType === t.id ? Colors.primary : colors.bg,
              borderWidth: 1,
              borderColor: selectedDocType === t.id ? Colors.primary : colors.border,
            }}
            onPress={() => { setSelectedDocType(t.id as any); setExtractedResult(null); }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: selectedDocType === t.id ? Colors.white : colors.text }}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Action Upload Card */}
      <TouchableOpacity
        style={{
          borderWidth: 2,
          borderStyle: 'dashed',
          borderColor: Colors.primary,
          borderRadius: 14,
          padding: 16,
          alignItems: 'center',
          backgroundColor: '#F0F9FF',
          marginBottom: 12,
        }}
        onPress={handlePickAndVerify}
        disabled={uploading}
        activeOpacity={0.8}
      >
        {uploading ? (
          <View style={{ alignItems: 'center', gap: 8 }}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.primary }}>
              Uploading &amp; Running PolicyBazaar Backend OCR Verification...
            </Text>
          </View>
        ) : (
          <View style={{ alignItems: 'center', gap: 6 }}>
            <Icon name="cloud-upload-outline" size={32} color={Colors.primary} />
            <Text style={{ fontSize: 14, fontWeight: '800', color: Colors.primary }}>
              Upload {selectedDocType.toUpperCase().replace('_', ' ')} Image or PDF
            </Text>
            <Text style={{ fontSize: 11, color: Colors.textMuted }}>
              Instant OCR field extraction &amp; verification via backend API
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Extracted Verified Fields Result Card */}
      {extractedResult && (
        <View style={{ backgroundColor: '#ECFDF5', borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: '#10B981' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: '#A7F3D0' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name="checkmark-circle" size={20} color="#059669" />
              <Text style={{ fontSize: 13, fontWeight: '900', color: '#065F46' }}>
                {extractedResult.extractedFields?.docType || 'Document'} Verified ✓
              </Text>
            </View>
            <Text style={{ fontSize: 10, fontWeight: '800', color: '#059669' }}>
              {(extractedResult.confidenceScore * 100).toFixed(0)}% Confidence
            </Text>
          </View>

          <View style={{ rowGap: 6 }}>
            {Object.entries(extractedResult.extractedFields || {}).map(([k, v]) => {
              if (k === 'docType') return null;
              return (
                <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 11, color: '#047857', textTransform: 'capitalize' }}>
                    {k.replace(/([A-Z])/g, ' $1').trim()}
                  </Text>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#065F46' }}>{String(v)}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}
