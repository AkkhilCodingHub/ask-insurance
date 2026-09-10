import { useEffect, useState } from 'react';
import { View, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '@/context/auth';
import { useAgent, useThemeColors } from '@/context/agent';
import { Colors } from '@/constants/theme';

const SEEN_KEY = 'seen_welcome_v1';

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const { agent, loading: agentLoading } = useAgent();
  const colors = useThemeColors();
  const [checking, setChecking] = useState(true);
  const [seenWelcome, setSeenWelcome] = useState(false);

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

  // Show branded splash screen while checking session to prevent black/blank screens
  if (authLoading || checking || agentLoading) {
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

  // 1. If customer authenticated, enter main app tabs
  if (user) return <Redirect href="/(tabs)" />;

  // 2. If agent authenticated, enter agent portal
  if (agent) return <Redirect href="/(agent)/quotes" />;

  // 3. First time launch: show welcome briefing, otherwise login
  if (!seenWelcome) return <Redirect href="/welcome" />;
  return <Redirect href="/login" />;
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
