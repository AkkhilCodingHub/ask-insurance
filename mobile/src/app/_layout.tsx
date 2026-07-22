import { Stack, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { View, StyleSheet, BackHandler } from 'react-native';
import { FloatingSupportChat } from '@/components/FloatingSupportChat';
import { AuthProvider } from '@/context/auth';
import { AgentProvider, LanguageProvider, useThemeColors } from '@/context/agent';
import { DialogProvider } from '@/components/Dialog';
import { NotificationProvider } from '@/components/NotificationToast';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

// Prevent splash screen auto-hiding while loading fonts
SplashScreen.preventAutoHideAsync().catch(() => {});

function RootContent() {
  const colors = useThemeColors();
  const router = useRouter();

  useEffect(() => {
    const onBackPress = () => {
      if (!router.canGoBack()) {
        BackHandler.exitApp();
        return true;
      }
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [router]);

  return (
    <NotificationProvider>
    <DialogProvider>
    <AgentProvider>
    <AuthProvider>
      <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar style={colors.isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="index"        options={{ animation: 'none' }} />
        <Stack.Screen name="welcome"      options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)"       options={{ animation: 'fade' }} />
        <Stack.Screen name="login"        options={{ animation: 'slide_from_bottom', gestureEnabled: true, gestureDirection: 'vertical' }} />
        <Stack.Screen name="otp"          options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="onboarding"   options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="register"     options={{ animation: 'none' }} />
        <Stack.Screen name="settings"     options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="plan/[id]"    options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="quote"        options={{ animation: 'slide_from_bottom', gestureEnabled: true, gestureDirection: 'vertical' }} />
        <Stack.Screen name="edit-profile" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="faq"          options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="privacy"      options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="terms"        options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="my-policies"  options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="my-quotes"    options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="payments"     options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="kyc"          options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="kyc-callback" options={{ animation: 'none' }} />

        {/* Agent portal */}
        <Stack.Screen name="agent-login"  options={{ animation: 'slide_from_bottom', gestureEnabled: true, gestureDirection: 'vertical' }} />
        <Stack.Screen name="(agent)"      options={{ animation: 'fade' }} />
      </Stack>
      <FloatingSupportChat />
      </View>
    </AuthProvider>
    </AgentProvider>
    </DialogProvider>
    </NotificationProvider>
  );
}

import { AnimatedSplashScreen } from '@/components/AnimatedSplashScreen';

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...Ionicons.font,
  });

  useEffect(() => {
    if (error) console.error('[RootLayout] Font loading error:', error);
  }, [error]);

  if (!loaded) {
    return null;
  }

  return (
    <LanguageProvider>
      <AnimatedSplashScreen>
        <RootContent />
      </AnimatedSplashScreen>
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
