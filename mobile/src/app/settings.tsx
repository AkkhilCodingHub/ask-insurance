import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/auth';
import { Icon } from '@/components/Icon';
import { BackButton } from '@/components/BackButton';
import { Colors } from '@/constants/theme';
import { useDialog } from '@/components/Dialog';

import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

// ── Sub-components ────────────────────────────────────────────────────────────

interface NavRowProps {
  icon:    IoniconsName;
  label:   string;
  sub:     string;
  onPress: () => void;
  danger?: boolean;
  badge?:  string;
}

function NavRow({ icon, label, sub, onPress, danger, badge }: NavRowProps) {
  return (
    <TouchableOpacity style={r.row} onPress={onPress} activeOpacity={0.7}>
      <View style={[r.icon, danger && { backgroundColor: Colors.error + '18' }]}>
        <Icon name={icon} size={18} color={danger ? Colors.error : Colors.textMuted} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[r.label, danger && { color: Colors.error }]}>{label}</Text>
        <Text style={r.sub}>{sub}</Text>
      </View>
      {badge && (
        <View style={r.badge}>
          <Text style={r.badgeText}>{badge}</Text>
        </View>
      )}
      <Text style={[r.arrow, danger && { color: Colors.error }]}>›</Text>
    </TouchableOpacity>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const router             = useRouter();
  const { logout }         = useAuth();
  const { alert, confirm } = useDialog();

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleDeleteAccount = async () => {
    const yes = await confirm({
      title:       'Delete Account',
      message:     'This will permanently delete your account, all policies, claims, and data. This action cannot be undone.',
      confirmText: 'Delete permanently',
      cancelText:  'Cancel',
      destructive: true,
    });
    if (yes) {
      await logout();
      router.replace('/welcome');
    }
  };

  const handleLogout = async () => {
    const yes = await confirm({
      title:       'Log out',
      message:     'Are you sure you want to log out of your account?',
      confirmText: 'Log out',
      cancelText:  'Cancel',
      destructive: true,
    });
    if (yes) {
      await logout();
      router.replace('/welcome');
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <BackButton />
        <Text style={s.title}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Support & Legal ───────────────────────────── */}
        <Text style={s.sectionLabel}>SUPPORT & LEGAL</Text>
        <View style={s.card}>
          <NavRow
            icon="help-circle-outline" label="Help & FAQ"
            sub="Common questions answered"
            onPress={() => router.push('/faq')}
          />
          <View style={s.divider} />
          <NavRow
            icon="chatbubble-outline" label="Contact support"
            sub="Chat with our advisors 24×7"
            onPress={() => router.push('/(tabs)/chat')}
          />
          <View style={s.divider} />
          <NavRow
            icon="hand-left-outline" label="Privacy Policy"
            sub="How we handle your data"
            onPress={() => router.push('/privacy')}
          />
          <View style={s.divider} />
          <NavRow
            icon="reader-outline" label="Terms of Service"
            sub="Usage terms and conditions"
            onPress={() => router.push('/terms')}
          />
        </View>

        {/* ── Account ───────────────────────────────────── */}
        <Text style={s.sectionLabel}>ACCOUNT</Text>
        <View style={s.card}>
          <NavRow
            icon="log-out-outline" label="Log out"
            sub="Sign out of your account"
            onPress={handleLogout}
          />
          <View style={s.divider} />
          <NavRow
            icon="trash-outline" label="Delete account"
            sub="Permanently remove all data"
            onPress={handleDeleteAccount}
            danger
          />
        </View>

        <Text style={s.version}>
          ASK Insurance Broker v1.0.0{'\n'}
          IRDAI Licensed · © 2025 ASK
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title:   { fontSize: 17, fontWeight: '800', color: Colors.text },
  scroll:  { flex: 1 },

  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: Colors.textMuted,
    letterSpacing: 1, marginTop: 24, marginBottom: 8,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: Colors.white,
    marginHorizontal: 16, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  divider: { height: 1, backgroundColor: Colors.border, marginLeft: 66 },

  version: {
    fontSize: 12, color: Colors.textLight, textAlign: 'center',
    marginTop: 28, marginBottom: 8, lineHeight: 18,
  },
});

const r = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 13,
  },
  icon: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center',
  },
  label: { fontSize: 14, fontWeight: '600', color: Colors.text },
  sub:   { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  arrow: { fontSize: 22, color: Colors.textLight },
  badge: {
    backgroundColor: Colors.success + '18', paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 6, marginRight: 4,
  },
  badgeText: { fontSize: 10, fontWeight: '800', color: Colors.success },
});
