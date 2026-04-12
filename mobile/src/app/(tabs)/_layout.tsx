import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import React, { useRef } from 'react';
import { Animated } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<string, { outline: IoniconsName; filled: IoniconsName }> = {
  index:   { outline: 'home-outline',          filled: 'home'            },
  plans:   { outline: 'document-text-outline', filled: 'document-text'   },
  claims:  { outline: 'shield-outline',        filled: 'shield'          },
  profile: { outline: 'person-outline',        filled: 'person'          },
};

const TAB_LABELS: Record<string, string> = {
  index:   'Home',
  plans:   'Plans',
  claims:  'Claims',
  profile: 'Profile',
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
  const insets = useSafeAreaInsets();
  const tabBarHeight = 52 + insets.bottom;

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textLight,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingTop: 8,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 1,
        },
        tabBarIcon: ({ focused, color }) => {
          const icons = TAB_ICONS[route.name] ?? { outline: 'ellipse-outline', filled: 'ellipse' };
          return (
            <Ionicons
              name={focused ? icons.filled : icons.outline}
              size={24}
              color={color}
            />
          );
        },
        title: TAB_LABELS[route.name] ?? route.name,
        // Fade between tab screens
        sceneStyle: { backgroundColor: Colors.bg },
      })}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="plans" />
      <Tabs.Screen name="claims" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
