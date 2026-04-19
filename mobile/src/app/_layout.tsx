import { Stack } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { AuthProvider } from '@/context/auth';
import { DialogProvider } from '@/components/Dialog';
import { paymentsApi } from '@/lib/api';

// Register push token with the backend (best-effort, non-blocking)
async function registerPushToken() {
  try {
    // Dynamically import to avoid breaking Expo Go / web
    const Notifications = await import('expo-notifications');
    const Device = await import('expo-device');

    if (!Device.default.isDevice) return; // skip simulator

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return;

    const { data: token } = await Notifications.getExpoPushTokenAsync();
    if (token) await paymentsApi.savePushToken(token);

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
    }
  } catch {
    // Non-critical — never crash the app over push setup
  }
}

export default function RootLayout() {
  useEffect(() => { registerPushToken(); }, []);

  return (
    <DialogProvider>
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Redirect — instant, no flash */}
        <Stack.Screen name="index"      options={{ animation: 'none' }} />

        {/* Onboarding / splash — fade in gently */}
        <Stack.Screen name="welcome"    options={{ animation: 'fade' }} />

        {/* Main app — fade in after auth, feels like "entering" */}
        <Stack.Screen name="(tabs)"     options={{ animation: 'fade' }} />

        {/* Auth flow — login slides up like a sheet */}
        <Stack.Screen name="login"      options={{ animation: 'slide_from_bottom', gestureEnabled: true, gestureDirection: 'vertical' }} />

        {/* OTP & onboarding continue the flow — push right, feels like steps */}
        <Stack.Screen name="otp"        options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="onboarding" options={{ animation: 'slide_from_right' }} />

        {/* Register is just a redirect — no animation */}
        <Stack.Screen name="register"   options={{ animation: 'none' }} />

        {/* Detail screens — standard push right */}
        <Stack.Screen name="settings"   options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="plan/[id]"  options={{ animation: 'slide_from_right' }} />

        {/* Quote — slides up like a purchase sheet */}
        <Stack.Screen name="quote"        options={{ animation: 'slide_from_bottom', gestureEnabled: true, gestureDirection: 'vertical' }} />

        {/* Profile editing */}
        <Stack.Screen name="edit-profile" options={{ animation: 'slide_from_right' }} />

        {/* Legal & support content */}
        <Stack.Screen name="faq"          options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="privacy"      options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="terms"        options={{ animation: 'slide_from_right' }} />

        {/* Profile sub-screens */}
        <Stack.Screen name="my-policies"  options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="my-quotes"    options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="payments"     options={{ animation: 'slide_from_right' }} />
      </Stack>
    </AuthProvider>
    </DialogProvider>
  );
}
