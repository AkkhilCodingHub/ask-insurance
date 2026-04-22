import React, { useMemo } from 'react';
import { View, StyleSheet, Platform, Pressable } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/auth';
import { Icon } from '@/components/Icon';
import { Colors } from '@/constants/theme';

const TAB_BAR_BASE = 52;

/** When true, the main tab bar is visible (user is inside the tab navigator). */
function useInTabGroup(): boolean {
  const segments = useSegments();
  return segments[0] === '(tabs)';
}

/**
 * When to show the floating support button (customer app only).
 * Hidden on auth/onboarding, agent portal, and on the Support tab itself.
 */
function useShowFloatingChat(): boolean {
  const { user } = useAuth();
  const segments = useSegments();
  const pathKey = segments.join('/');

  return useMemo(() => {
    if (!user) return false;
    if (!segments.length) return false;
    const root = segments[0];
    if (root === '(agent)') return false;
    if (root === '(tabs)' && segments[1] === 'chat') return false;
    const hideRoots = new Set([
      'login', 'otp', 'onboarding', 'welcome', 'register', 'agent-login', 'index',
    ]);
    if (root && hideRoots.has(String(root))) return false;
    return true;
  }, [user, pathKey]);
}

export function FloatingSupportChat() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const inTabGroup = useInTabGroup();
  const visible = useShowFloatingChat();

  const bottom = inTabGroup
    ? TAB_BAR_BASE + (insets.bottom > 0 ? insets.bottom : 8) + 10
    : Math.max(insets.bottom, 12) + 16;

  if (!visible) return null;

  return (
    <View
      style={[StyleSheet.absoluteFill, styles.wrap]}
      pointerEvents="box-none"
    >
      <View style={[styles.fabContainer, { bottom, right: 16 }]}>
        <Pressable
          onPress={() => router.push('/(tabs)/chat')}
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
          accessibilityLabel="Open support chat"
          accessibilityRole="button"
        >
          <Icon name="chatbubbles" size={26} color={Colors.white} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    zIndex: 200,
    elevation: 200,
  },
  fabContainer: {
    position: 'absolute',
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.22,
        shadowRadius: 8,
      },
      android: { elevation: 8 },
    }),
  },
  fabPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
});
