import { Stack } from 'expo-router';
import React from 'react';
import { AuthProvider } from '@/context/auth';
import { DialogProvider } from '@/components/Dialog';

export default function RootLayout() {
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
        <Stack.Screen name="payments"     options={{ animation: 'slide_from_right' }} />
      </Stack>
    </AuthProvider>
    </DialogProvider>
  );
}
