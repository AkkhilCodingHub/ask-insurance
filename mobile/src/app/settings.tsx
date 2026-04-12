import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Switch, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/auth';
import { Icon } from '@/components/Icon';
import { Colors } from '@/constants/theme';

import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

interface ToggleRowProps {
  icon: IoniconsName;
  label: string;
  sub: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}

function ToggleRow({ icon, label, sub, value, onToggle }: ToggleRowProps) {
  return (
    <View style={r.row}>
      <View style={r.icon}>
        <Icon name={icon} size={18} color={Colors.textMuted} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={r.label}>{label}</Text>
        <Text style={r.sub}>{sub}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: Colors.border, true: Colors.primary + '70' }}
        thumbColor={value ? Colors.primary : Colors.silver}
      />
    </View>
  );
}

interface NavRowProps {
  icon: IoniconsName;
  label: string;
  sub: string;
  onPress: () => void;
  danger?: boolean;
}

function NavRow({ icon, label, sub, onPress, danger }: NavRowProps) {
  return (
    <TouchableOpacity style={r.row} onPress={onPress} activeOpacity={0.7}>
      <View style={[r.icon, danger && { backgroundColor: Colors.error + '18' }]}>
        <Icon name={icon} size={18} color={danger ? Colors.error : Colors.textMuted} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[r.label, danger && { color: Colors.error }]}>{label}</Text>
        <Text style={r.sub}>{sub}</Text>
      </View>
      <Text style={[r.arrow, danger && { color: Colors.error }]}>›</Text>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { logout } = useAuth();

  const [notifPolicy,    setNotifPolicy]    = useState(true);
  const [notifClaims,    setNotifClaims]    = useState(true);
  const [notifOffers,    setNotifOffers]    = useState(false);
  const [notifReminders, setNotifReminders] = useState(true);
  const [biometric,      setBiometric]      = useState(false);
  const [darkMode,       setDarkMode]       = useState(false);

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
          logout();
          router.replace('/welcome');
        }},
      ],
    );
  };

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => {
        logout();
        router.replace('/welcome');
      }},
    ]);
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Settings</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Notifications ──────────────────────────── */}
        <Text style={s.sectionLabel}>NOTIFICATIONS</Text>
        <View style={s.card}>
          <ToggleRow
            icon="document-text-outline" label="Policy updates"
            sub="Premium due dates, renewals"
            value={notifPolicy} onToggle={setNotifPolicy}
          />
          <View style={s.divider} />
          <ToggleRow
            icon="shield-outline" label="Claims status"
            sub="Real-time claim tracking"
            value={notifClaims} onToggle={setNotifClaims}
          />
          <View style={s.divider} />
          <ToggleRow
            icon="pricetag-outline" label="Offers & promotions"
            sub="Discounts on new plans"
            value={notifOffers} onToggle={setNotifOffers}
          />
          <View style={s.divider} />
          <ToggleRow
            icon="alarm-outline" label="Reminders"
            sub="Payment & document alerts"
            value={notifReminders} onToggle={setNotifReminders}
          />
        </View>

        {/* ── Security ───────────────────────────────── */}
        <Text style={s.sectionLabel}>SECURITY</Text>
        <View style={s.card}>
          <ToggleRow
            icon="finger-print-outline" label="Biometric login"
            sub="Use Face ID / Fingerprint"
            value={biometric} onToggle={setBiometric}
          />
          <View style={s.divider} />
          <NavRow
            icon="key-outline" label="Change password"
            sub="Update your login password"
            onPress={() => Alert.alert('Coming soon')}
          />
          <View style={s.divider} />
          <NavRow
            icon="lock-closed-outline" label="Two-factor authentication"
            sub="Add an extra layer of security"
            onPress={() => Alert.alert('Coming soon')}
          />
        </View>

        {/* ── Preferences ────────────────────────────── */}
        <Text style={s.sectionLabel}>PREFERENCES</Text>
        <View style={s.card}>
          <ToggleRow
            icon="moon-outline" label="Dark mode"
            sub="Easier on the eyes at night"
            value={darkMode} onToggle={setDarkMode}
          />
          <View style={s.divider} />
          <NavRow
            icon="globe-outline" label="Language"
            sub="English (India)"
            onPress={() => Alert.alert('Coming soon')}
          />
          <View style={s.divider} />
          <NavRow
            icon="cash-outline" label="Currency"
            sub="Indian Rupee (₹ INR)"
            onPress={() => Alert.alert('Coming soon')}
          />
        </View>

        {/* ── Support & Legal ────────────────────────── */}
        <Text style={s.sectionLabel}>SUPPORT & LEGAL</Text>
        <View style={s.card}>
          <NavRow
            icon="help-circle-outline" label="Help & FAQ"
            sub="Common questions answered"
            onPress={() => Alert.alert('Coming soon')}
          />
          <View style={s.divider} />
          <NavRow
            icon="chatbubble-outline" label="Contact support"
            sub="Chat with our advisors"
            onPress={() => Alert.alert('Coming soon')}
          />
          <View style={s.divider} />
          <NavRow
            icon="hand-left-outline" label="Privacy Policy"
            sub="How we handle your data"
            onPress={() => Alert.alert('Coming soon')}
          />
          <View style={s.divider} />
          <NavRow
            icon="reader-outline" label="Terms of Service"
            sub="Usage terms and conditions"
            onPress={() => Alert.alert('Coming soon')}
          />
        </View>

        {/* ── Account ────────────────────────────────── */}
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

const s = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn:  { width: 60 },
  backText: { fontSize: 15, color: Colors.primary, fontWeight: '600' },
  title:    { fontSize: 17, fontWeight: '800', color: Colors.text, textAlign: 'center' },
  scroll:   { flex: 1 },

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
});
