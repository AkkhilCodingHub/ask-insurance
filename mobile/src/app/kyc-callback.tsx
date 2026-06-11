import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import { kycApi } from '@/lib/api';
import { useAuth } from '@/context/auth';
import { useDialog } from '@/components/Dialog';
import { Colors } from '@/constants/theme';

// Keys must match those written by the KYC screen before opening DigiLocker.
export const DL_STATE_KEY    = 'dl_kyc_state';
export const DL_VERIFIER_KEY = 'dl_kyc_verifier';

// Deep-link target for the DigiLocker HTTPS bridge: askinsurance://kyc-callback
// DigiLocker → HTTPS bridge → this route, which completes the PKCE token exchange.
export default function KycCallbackScreen() {
  const params = useLocalSearchParams<{ code?: string; state?: string; error?: string }>();
  const router = useRouter();
  const { refreshUser } = useAuth();
  const { alert } = useDialog();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    (async () => {
      // Close the DigiLocker browser tab left open behind the app. dismissBrowser
      // can return undefined (not a promise) on Android, so guard with try/catch.
      try { await WebBrowser.dismissBrowser(); } catch {}

      try {
        const code  = typeof params.code  === 'string' ? params.code  : undefined;
        const state = typeof params.state === 'string' ? params.state : undefined;
        const err   = typeof params.error === 'string' ? params.error : undefined;

        const verifier   = await SecureStore.getItemAsync(DL_VERIFIER_KEY);
        const savedState = await SecureStore.getItemAsync(DL_STATE_KEY);
        try { await SecureStore.deleteItemAsync(DL_VERIFIER_KEY); } catch {}
        try { await SecureStore.deleteItemAsync(DL_STATE_KEY); } catch {}

        if (err)   throw new Error('You did not grant DigiLocker access. Please try again.');
        if (!code || !state || !verifier) throw new Error('DigiLocker returned an incomplete response. Please try again.');
        if (savedState && savedState !== state) throw new Error('Verification could not be matched to your request. Please try again.');

        await kycApi.callback(code, state, verifier);
        await refreshUser();
      } catch (e: any) {
        alert({ type: 'error', title: 'Verification failed', message: e?.message ?? 'Could not verify with DigiLocker. Please try again.' });
      } finally {
        // Back to the KYC screen, which reflects the (now verified) status.
        router.replace('/kyc');
      }
    })();
  }, []);

  return (
    <View style={s.wrap}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
});
