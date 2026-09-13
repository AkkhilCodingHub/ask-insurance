import { useEffect, useState } from 'react';
import { View, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '@/context/auth';
import { useAgent, useThemeColors } from '@/context/agent';
import { Colors } from '@/constants/theme';

const SEEN_KEY = 'seen_welcome_v1';

export default function Index() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { agent, loading: agentLoading } = useAgent();
  const colors = useThemeColors();
  const [checking, setChecking] = useState(true);
  const [seenWelcome, setSeenWelcome] = useState(false);
  const [redirected, setRedirected] = useState(false);

  useEffect(() => {
    let active = true;
    SecureStore.getItemAsync(SEEN_KEY)
      .then(v => {
        if (active) {
          setSeenWelcome(!!v);
          setChecking(false);
        }
      })
      .catch(() => {
        if (active) {
          setChecking(false);
        }
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (authLoading || checking || agentLoading || redirected) return;
    setRedirected(true);

    if (user) {
      router.replace('/(tabs)');
    } else if (agent) {
      router.replace('/(agent)/quotes' as any);
    } else if (!seenWelcome) {
      router.replace('/welcome');
    } else {
      router.replace('/login');
    }
  }, [authLoading, checking, agentLoading, user, agent, seenWelcome, redirected, router]);

  // Show branded splash screen while checking session / determining initial route
  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Image
        source={require('@/assets/images/icon.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <ActivityIndicator size="small" color={Colors.primary} style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 20,
  },
  loader: {
    marginTop: 24,
  },
});
