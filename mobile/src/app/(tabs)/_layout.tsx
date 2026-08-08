import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import React, { useRef } from 'react';
import { Animated } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/auth';
import { Colors } from '@/constants/theme';

import { useLanguage, useThemeColors } from '@/context/agent';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<string, { outline: IoniconsName; filled: IoniconsName }> = {
  index:   { outline: 'home-outline',             filled: 'home'               },
  plans:   { outline: 'document-text-outline',    filled: 'document-text'      },
  claims:  { outline: 'shield-outline',           filled: 'shield'             },
  chat:    { outline: 'chatbubble-outline',        filled: 'chatbubble'         },
  profile: { outline: 'person-outline',           filled: 'person'             },
};

/** Wraps each tab screen in a fade-in animation on focus */
export function FadeScreen({ children }: { children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useFocusEffect(() => {
    opacity.setValue(0);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
  });

  return (
    <Animated.View style={{ flex: 1, opacity }}>
      {children}
    </Animated.View>
  );
}

export default function TabLayout() {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const extraBottomPadding = insets.bottom > 0 ? insets.bottom : 10;
  const tabBarHeight = 56 + extraBottomPadding;

  if (loading) return null;
  if (!user) return <Redirect href="/login" />;

  const TAB_LABELS: Record<string, string> = {
    index:   t('home', 'Home'),
    plans:   t('plans', 'Plans'),
    claims:  t('claims', 'Claims'),
    chat:    t('chat', 'Support'),
    profile: t('profile', 'Profile'),
  };

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingTop: 6,
          paddingBottom: extraBottomPadding,
          elevation: 8,
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.05,
          shadowRadius: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 2,
          letterSpacing: -0.2,
        },
        tabBarIcon: ({ focused, color }) => {
          const icons = TAB_ICONS[route.name] ?? { outline: 'ellipse-outline', filled: 'ellipse' };
          return (
            <Ionicons
              name={focused ? icons.filled : icons.outline}
              size={22}
              color={color}
            />
          );
        },
        title: TAB_LABELS[route.name] ?? route.name,
        sceneStyle: { backgroundColor: colors.bg },
      })}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="plans" />
      <Tabs.Screen name="claims" />
      <Tabs.Screen name="chat" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
