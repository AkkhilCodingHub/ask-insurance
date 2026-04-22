import React from 'react';
import { Tabs, Redirect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAgent } from '@/context/agent';
import { Colors } from '@/constants/theme';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

export default function AgentLayout() {
  const { agent, loading, logout } = useAgent();
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const tabH    = 52 + insets.bottom;

  if (loading) return null;
  if (!agent)  return <Redirect href="/agent-login" />;

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Sign out of the agent portal?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => { logout(); router.replace('/(tabs)' as any); } },
    ]);
  };

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor:   Colors.primary,
        tabBarInactiveTintColor: Colors.textLight,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor:  Colors.border,
          borderTopWidth:  StyleSheet.hairlineWidth,
          height:          tabH,
          paddingTop:      8,
          paddingBottom:   insets.bottom > 0 ? insets.bottom : 8,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 1 },
        sceneStyle:       { backgroundColor: Colors.bg },
        tabBarIcon: ({ focused, color }) => {
          const icons: Record<string, { on: IoniconsName; off: IoniconsName }> = {
            quotes:   { on: 'document-text',     off: 'document-text-outline'     },
            policies: { on: 'shield-checkmark',  off: 'shield-checkmark-outline'  },
            claims:   { on: 'clipboard',         off: 'clipboard-outline'         },
            chat:     { on: 'chatbubbles',       off: 'chatbubbles-outline'       },
          };
          const set  = icons[route.name] ?? { on: 'grid', off: 'grid-outline' };
          const name = focused ? set.on : set.off;
          return <Ionicons name={name} size={24} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="quotes"   options={{ title: 'Quotes'   }} />
      <Tabs.Screen name="policies" options={{ title: 'Policies' }} />
      <Tabs.Screen name="claims"   options={{ title: 'Claims'   }} />
      <Tabs.Screen name="chat"     options={{ title: 'Chat'     }} />
      <Tabs.Screen
        name="logout"
        options={{
          tabBarButton: () => (
            <TouchableOpacity
              onPress={handleLogout}
              activeOpacity={0.7}
              style={s.logoutBtn}
            >
              <Ionicons name="log-out-outline" size={22} color={Colors.error} />
              <Text style={s.logoutLabel}>Sign Out</Text>
            </TouchableOpacity>
          ),
        }}
      />
    </Tabs>
  );
}

const s = StyleSheet.create({
  logoutBtn:   { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 8, paddingBottom: 4, gap: 3 },
  logoutLabel: { fontSize: 10, fontWeight: '600', color: Colors.error },
});
