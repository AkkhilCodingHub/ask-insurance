import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/auth';
import { Icon } from '@/components/Icon';
import { BackButton } from '@/components/BackButton';
import { Colors } from '@/constants/theme';
import { useDialog } from '@/components/Dialog';

import { useLanguage, LanguagePickerModal, useThemeColors } from '@/context/agent';

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
  const colors = useThemeColors();
  return (
    <TouchableOpacity style={r.row} onPress={onPress} activeOpacity={0.7}>
      <View style={[r.icon, { backgroundColor: danger ? Colors.error + '18' : (colors.isDark ? 'rgba(96,165,250,0.15)' : colors.bgWarm) }]}>
        <Icon name={icon} size={18} color={danger ? Colors.error : (colors.isDark ? '#60A5FA' : Colors.primary)} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[r.label, { color: danger ? Colors.error : colors.text }]}>{label}</Text>
        <Text style={[r.sub, { color: colors.textMuted }]}>{sub}</Text>
      </View>
      {badge && (
        <View style={r.badge}>
          <Text style={r.badgeText}>{badge}</Text>
        </View>
      )}
      <Text style={[r.arrow, { color: danger ? Colors.error : colors.textMuted }]}>›</Text>
    </TouchableOpacity>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const router             = useRouter();
  const colors             = useThemeColors();
  const { logout }         = useAuth();
  const { alert, confirm } = useDialog();
  const { t, currentLangMeta, darkMode, setDarkMode } = useLanguage();
  const [langModalVisible, setLangModalVisible] = React.useState(false);

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
    <SafeAreaView style={[s.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={[s.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <BackButton color={colors.text} />
        <Text style={[s.title, { color: colors.text }]}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Preferences ───────────────────────────────── */}
        <Text style={[s.sectionLabel, { color: colors.textMuted }]}>PREFERENCES</Text>
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <NavRow
            icon="language-outline"
            label={t('language', 'Language')}
            sub={`${currentLangMeta.flag} ${currentLangMeta.name} (${currentLangMeta.nativeName})`}
            onPress={() => setLangModalVisible(true)}
            badge={currentLangMeta.code.toUpperCase()}
          />
          <View style={[s.divider, { backgroundColor: colors.border }]} />
          <View style={[r.row, { paddingVertical: 10 }]}>
            <View style={[r.icon, { backgroundColor: colors.isDark ? 'rgba(245,158,11,0.15)' : colors.bgWarm }]}>
              <Icon name={darkMode ? "moon" : "moon-outline"} size={18} color={colors.isDark ? '#F59E0B' : Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[r.label, { color: colors.text }]}>Dark Mode</Text>
              <Text style={[r.sub, { color: colors.textMuted }]}>{darkMode ? "Dark theme active" : "Use light theme"}</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: colors.border, true: Colors.primary }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* ── Support & Legal ───────────────────────────── */}
        <Text style={[s.sectionLabel, { color: colors.textMuted }]}>SUPPORT & LEGAL</Text>
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <NavRow
            icon="help-circle-outline" label={t('helpFaq', 'Help & FAQ')}
            sub="Common questions answered"
            onPress={() => router.push('/faq')}
          />
          <View style={[s.divider, { backgroundColor: colors.border }]} />
          <NavRow
            icon="chatbubble-outline" label={t('contactSupport', 'Contact support')}
            sub="Chat with our advisors 24×7"
            onPress={() => router.push('/(tabs)/chat')}
          />
          <View style={[s.divider, { backgroundColor: colors.border }]} />
          <NavRow
            icon="hand-left-outline" label={t('privacyPolicy', 'Privacy Policy')}
            sub="How we handle your data"
            onPress={() => router.push('/privacy')}
          />
          <View style={[s.divider, { backgroundColor: colors.border }]} />
          <NavRow
            icon="reader-outline" label={t('termsOfService', 'Terms of Service')}
            sub="Usage terms and conditions"
            onPress={() => router.push('/terms')}
          />
        </View>

        {/* ── Account ───────────────────────────────────── */}
        <Text style={[s.sectionLabel, { color: colors.textMuted }]}>ACCOUNT</Text>
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <NavRow
            icon="log-out-outline" label="Log out"
            sub="Sign out of your account"
            onPress={handleLogout}
          />
          <View style={[s.divider, { backgroundColor: colors.border }]} />
          <NavRow
            icon="trash-outline" label="Delete account"
            sub="Permanently remove all data"
            onPress={handleDeleteAccount}
            danger
          />
        </View>

        <Text style={[s.version, { color: colors.textMuted }]}>
          ASK Insurance Broker v1.0.0{'\n'}
          IRDAI Licensed · © 2025 ASK
        </Text>
      </ScrollView>
      <LanguagePickerModal visible={langModalVisible} onClose={() => setLangModalVisible(false)} />
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
