import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Linking, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/Icon';
import { Colors } from '@/constants/theme';
import { kycApi } from '@/lib/api';
import { useAuth } from '@/context/auth';

type Step = 'idle' | 'loading' | 'browser_opened' | 'verifying' | 'success' | 'error';

export default function KycScreen() {
  const router     = useRouter();
  const { refreshUser } = useAuth();

  const [step,    setStep]    = useState<Step>('idle');
  const [errMsg,  setErrMsg]  = useState('');
  const [stateToken, setStateToken] = useState('');

  // Handle deep-link callback from DigiLocker
  const handleDeepLink = useCallback(async (url: string) => {
    try {
      const parsed = new URL(url);
      if (!parsed.pathname.includes('kyc/callback')) return;

      const code  = parsed.searchParams.get('code');
      const state = parsed.searchParams.get('state');
      if (!code || !state) {
        setErrMsg('Invalid callback — missing code or state.');
        setStep('error');
        return;
      }

      // Ensure state matches what we sent
      if (state !== stateToken) {
        setErrMsg('Security check failed — state mismatch.');
        setStep('error');
        return;
      }

      setStep('verifying');
      await kycApi.callback(code, state);
      await refreshUser();
      setStep('success');
    } catch (e: any) {
      setErrMsg(e?.message ?? 'KYC verification failed. Please try again.');
      setStep('error');
    }
  }, [stateToken, refreshUser]);

  useEffect(() => {
    const sub = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));
    return () => sub.remove();
  }, [handleDeepLink]);

  const startKyc = async () => {
    setStep('loading');
    setErrMsg('');
    try {
      const { url, state } = await kycApi.initiate();
      setStateToken(state);
      await Linking.openURL(url);
      setStep('browser_opened');
    } catch (e: any) {
      setErrMsg(e?.message ?? 'Failed to start KYC. Please try again.');
      setStep('error');
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Icon name="arrow-back-outline" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>KYC Verification</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={s.body}>

        {step === 'success' ? (
          <SuccessView onDone={() => router.back()} />
        ) : (
          <>
            {/* Hero illustration */}
            <View style={s.heroCard}>
              <View style={s.heroBg1} /><View style={s.heroBg2} />
              <View style={s.heroIconCircle}>
                <Icon name="shield-checkmark-outline" size={40} color={Colors.primary} />
              </View>
              <Text style={s.heroTitle}>Verify your identity</Text>
              <Text style={s.heroSub}>
                Complete KYC with DigiLocker to unlock all features — buy policies,
                file claims, and get instant payouts.
              </Text>
            </View>

            {/* What you need */}
            <View style={s.stepsCard}>
              <Text style={s.stepsTitle}>What happens next</Text>
              {[
                { icon: 'phone-portrait-outline',   text: 'You\'ll be redirected to DigiLocker' },
                { icon: 'lock-closed-outline',       text: 'Log in with your DigiLocker account' },
                { icon: 'document-text-outline',     text: 'Authorise access to Aadhaar & PAN' },
                { icon: 'checkmark-circle-outline',  text: 'Return here — we\'ll verify automatically' },
              ].map((item, i) => (
                <View key={i} style={s.stepRow}>
                  <View style={s.stepIconWrap}>
                    <Icon name={item.icon as any} size={18} color={Colors.primary} />
                  </View>
                  <Text style={s.stepText}>{item.text}</Text>
                </View>
              ))}
            </View>

            {/* Error */}
            {step === 'error' && (
              <View style={s.errorBanner}>
                <Icon name="alert-circle-outline" size={18} color="#B91C1C" />
                <Text style={s.errorText}>{errMsg}</Text>
              </View>
            )}

            {/* Waiting hint after browser opened */}
            {step === 'browser_opened' && (
              <View style={s.waitBanner}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={s.waitText}>
                  Waiting for DigiLocker… Complete the flow in your browser and return here.
                </Text>
              </View>
            )}

            {/* CTA */}
            <TouchableOpacity
              style={[s.ctaBtn, (step === 'loading' || step === 'verifying') && s.ctaBtnDisabled]}
              activeOpacity={0.85}
              onPress={startKyc}
              disabled={step === 'loading' || step === 'verifying'}
            >
              {(step === 'loading' || step === 'verifying') ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Icon name="shield-outline" size={20} color={Colors.white} />
                  <Text style={s.ctaBtnText}>
                    {step === 'browser_opened' ? 'Retry DigiLocker' : 'Start KYC with DigiLocker'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={s.disclaimer}>
              Your data is processed securely via DigiLocker, a Government of India initiative.
              We only read document metadata — no files are stored on our servers.
            </Text>
          </>
        )}

      </View>
    </SafeAreaView>
  );
}

function SuccessView({ onDone }: { onDone: () => void }) {
  return (
    <View style={s.successWrap}>
      <View style={s.successIconCircle}>
        <Icon name="checkmark-circle" size={64} color="#059669" />
      </View>
      <Text style={s.successTitle}>KYC Verified!</Text>
      <Text style={s.successSub}>
        Your identity has been verified successfully via DigiLocker.
        You can now access all features.
      </Text>
      <TouchableOpacity style={s.ctaBtn} activeOpacity={0.85} onPress={onDone}>
        <Text style={s.ctaBtnText}>Back to Home</Text>
      </TouchableOpacity>
    </View>
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

  body: { flex: 1, paddingHorizontal: 20, paddingTop: 24, gap: 16 },

  heroCard: {
    backgroundColor: Colors.white,
    borderRadius: 18, padding: 24, overflow: 'hidden',
    alignItems: 'center', gap: 12,
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
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  heroTitle: { fontSize: 20, fontWeight: '900', color: Colors.text, letterSpacing: -0.4 },
  heroSub:   { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },

  stepsCard: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 20, gap: 14,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border,
  },
  stepsTitle: { fontSize: 13, fontWeight: '800', color: Colors.textLight, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 2 },
  stepRow:    { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  stepText: { fontSize: 14, color: Colors.text, flex: 1, fontWeight: '500' },

  errorBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#FEF2F2', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#FCA5A5',
  },
  errorText: { fontSize: 13, color: '#B91C1C', flex: 1, lineHeight: 19 },

  waitBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.primaryLight, borderRadius: 12, padding: 14,
  },
  waitText: { fontSize: 13, color: Colors.primary, flex: 1, lineHeight: 19, fontWeight: '500' },

  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16,
    marginTop: 4,
  },
  ctaBtnDisabled: { opacity: 0.6 },
  ctaBtnText: { fontSize: 15, fontWeight: '800', color: Colors.white },

  disclaimer: {
    fontSize: 11, color: Colors.textLight, textAlign: 'center', lineHeight: 16,
    paddingHorizontal: 8, paddingBottom: 8,
  },

  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18, paddingHorizontal: 20 },
  successIconCircle: {
    width: 100, height: 100, borderRadius: 30,
    backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center',
  },
  successTitle: { fontSize: 26, fontWeight: '900', color: Colors.text, letterSpacing: -0.5 },
  successSub:   { fontSize: 15, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },
});
