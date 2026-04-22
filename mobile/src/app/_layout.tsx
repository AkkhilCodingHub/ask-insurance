import { Stack } from 'expo-router';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { FloatingSupportChat } from '@/components/FloatingSupportChat';
import { AuthProvider } from '@/context/auth';
import { AgentProvider } from '@/context/agent';
import { DialogProvider } from '@/components/Dialog';
import { NotificationProvider } from '@/components/NotificationToast';

export default function RootLayout() {
  return (
    <NotificationProvider>
    <DialogProvider>
    <AgentProvider>
    <AuthProvider>
      <View style={styles.root}>
      <Stack screenOptions={{ headerShown: false }}>
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

const styles = StyleSheet.create({
  root: { flex: 1 },
});
