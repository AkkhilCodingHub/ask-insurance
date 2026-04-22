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

  // First install — show welcome/overview
  if (!seenWelcome) return <Redirect href="/welcome" />;

  // Returning user with active session
  if (user) return <Redirect href="/(tabs)" />;

  // Returning user but not logged in — go straight to login
  return <Redirect href="/login" />;
}
