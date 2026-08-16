import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '@/context/auth';

const SEEN_KEY = 'seen_welcome_v1';

export default function Index() {
  const { user, loading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [seenWelcome, setSeenWelcome] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync(SEEN_KEY).then(v => {
      setSeenWelcome(!!v);
      setChecking(false);
    });
  }, []);

  if (loading || checking) return null;

  // If logged in, go straight to main tabs
  if (user) return <Redirect href="/(tabs)" />;

  // Otherwise, show welcome briefing screen (with Next/Skip buttons & app introduction)
  return <Redirect href="/welcome" />;
}
