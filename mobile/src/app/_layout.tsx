import { Stack } from 'expo-router';
import React from 'react';
import { AuthProvider } from '@/context/auth';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
    </AuthProvider>
  );
}
