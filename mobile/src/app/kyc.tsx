import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Icon } from '@/components/Icon';
import { Colors } from '@/constants/theme';
import { kycApi } from '@/lib/api';
import { useAuth } from '@/context/auth';
import { useDialog } from '@/components/Dialog';

type Step = 'idle' | 'success';

// Must match DIGILOCKER_REDIRECT_URI registered on the API and DigiLocker partner portal.
const DIGILOCKER_REDIRECT = 'askinsurance://kyc/callback';

const BENEFITS: { icon: string; text: string }[] = [
  { icon: 'flash-outline',          text: 'Verified in seconds — no waiting for review' },
  { icon: 'shield-checkmark-outline', text: 'Government-backed identity via DigiLocker' },
  { icon: 'lock-closed-outline',    text: 'We never see your password — only the result' },
];

export default function KycScreen() {
  const router                = useRouter();
  const { refreshUser, user } = useAuth();
  const { alert }             = useDialog();

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
      const { url, codeVerifier } = await kycApi.initiate();

      const result = await WebBrowser.openAuthSessionAsync(url, DIGILOCKER_REDIRECT);
      if (result.type !== 'success' || !result.url) {
        // User cancelled or dismissed the browser — silently return to the screen.
        setDlBusy(false);
        return;
      }

      const { queryParams } = Linking.parse(result.url);
      const code  = queryParams?.code  as string | undefined;
      const state = queryParams?.state as string | undefined;
      const err   = queryParams?.error as string | undefined;

      if (err) {
        alert({ type: 'error', title: 'DigiLocker declined', message: 'You did not grant access. Please try again.' });
        setDlBusy(false);
        return;
      }
      if (!code || !state) {
        alert({ type: 'error', title: 'Verification failed', message: 'DigiLocker did not return a valid response. Please try again.' });
        setDlBusy(false);
        return;
      }

      await kycApi.callback(code, state, codeVerifier);
      await refreshUser();
      setStep('success');
    } catch (e: any) {
      alert({ type: 'error', title: 'Verification failed', message: e?.message ?? 'Could not verify with DigiLocker. Please try again.' });
    } finally {
      setDlBusy(false);
    }
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
          <Text style={s.successTitle}>{isVerified ? 'KYC Verified!' : 'KYC in progress'}</Text>
          <Text style={s.successSub}>
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
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Icon name="arrow-back-outline" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>KYC Verification</Text>
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
        <View style={s.heroCard}>
          <View style={s.heroBg1} /><View style={s.heroBg2} />
          <View style={s.heroIconCircle}>
            <Icon name="shield-checkmark-outline" size={40} color={Colors.primary} />
          </View>
          <Text style={s.heroTitle}>Verify your identity</Text>
          <Text style={s.heroSub}>
            Complete KYC instantly with DigiLocker to unlock payments, policies and claims.
          </Text>
        </View>

        {/* Benefits */}
        <View style={s.benefits}>
          {BENEFITS.map(b => (
            <View key={b.text} style={s.benefitRow}>
              <View style={s.benefitIcon}>
                <Icon name={b.icon as any} size={18} color={Colors.primary} />
              </View>
              <Text style={s.benefitText}>{b.text}</Text>
            </View>
          ))}
        </View>

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

        <Text style={s.disclaimer}>
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
