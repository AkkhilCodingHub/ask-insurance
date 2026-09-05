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
    SecureStore.getItemAsync(SEEN_KEY)
      .then(v => {
        setSeenWelcome(!!v);
        setChecking(false);
      })
      .catch(() => {
        setChecking(false);
      });
  }, []);

  if (loading || checking) return null;

  // If authenticated, enter app directly
  if (user) return <Redirect href="/(tabs)" />;

  // First time launch: show welcome briefing screen, otherwise go to login
  if (!seenWelcome) return <Redirect href="/welcome" />;
  return <Redirect href="/login" />;
}
