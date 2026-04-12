import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import React from 'react';
import { Platform } from 'react-native';
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

export default function TabLayout() {
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
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 84 : 64,
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
      })}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="plans" />
      <Tabs.Screen name="claims" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
