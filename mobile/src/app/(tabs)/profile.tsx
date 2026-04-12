import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/auth';
import { MY_POLICIES, MY_CLAIMS } from '@/data/mock';
import { Icon } from '@/components/Icon';
import { Colors, BottomTabInset } from '@/constants/theme';

const MENU_ITEMS = [
  { icon: 'document-text-outline',   label: 'My Policies',    sub: 'View & manage active plans',  route: null },
  { icon: 'folder-outline',          label: 'Documents',       sub: 'Policy docs, ID cards',       route: null },
  { icon: 'card-outline',            label: 'Payment History', sub: 'Premiums & receipts',         route: null },
  { icon: 'notifications-outline',   label: 'Notifications',   sub: 'Alerts & reminders',          route: null },
  { icon: 'settings-outline',        label: 'Settings',        sub: 'App preferences',             route: '/settings' },
  { icon: 'headset-outline',         label: 'Help & Support',  sub: '24×7 advisor chat & call',    route: null },
  { icon: 'star-outline',            label: 'Rate the App',    sub: 'Share your experience',       route: null },
] as const;

export default function ProfileTab() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const initials = (user?.name ?? 'U')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const activePolicies = MY_POLICIES.filter(p => p.status === 'Active').length;
  const totalClaims    = MY_CLAIMS.length;
  const approvedClaims = MY_CLAIMS.filter(c => c.status === 'Approved').length;

  const handleLogout = () => {
    logout();
    router.replace('/welcome');
  };

  // ── Guest view ────────────────────────────────────────
  if (!user) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.header}>
          <Text style={s.pageTitle}>Profile</Text>
        </View>
        <View style={s.guestWrap}>
          <View style={s.guestIconCircle}>
            <Icon name="person-outline" size={40} color={Colors.silver} />
          </View>
          <Text style={s.guestTitle}>You're browsing as a guest</Text>
          <Text style={s.guestSub}>Sign in to view your policies, file claims, and track everything in one place.</Text>
          <TouchableOpacity style={s.guestLoginBtn} onPress={() => router.push('/login')} activeOpacity={0.85}>
            <Text style={s.guestLoginText}>Sign In / Create Account</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={{ paddingBottom: BottomTabInset + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ─────────────────────────────────── */}
        <View style={s.header}>
          <Text style={s.pageTitle}>Profile</Text>
          <TouchableOpacity style={s.editBtn}>
            <Text style={s.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* ── Avatar card ────────────────────────────── */}
        <View style={s.avatarCard}>
          <View style={s.avatarCircle}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.userName}>{user.name}</Text>
            <Text style={s.userEmail}>{user.phone}</Text>
            {user.dob ? <Text style={s.userPhone}>DOB: {user.dob}</Text> : null}
          </View>
          <View style={s.verifiedBadge}>
            <Text style={s.verifiedText}>✓ Verified</Text>
          </View>
        </View>

        {/* ── Stats ──────────────────────────────────── */}
        <View style={s.statsRow}>
          <View style={s.statBox}>
            <Text style={s.statNum}>{activePolicies}</Text>
            <Text style={s.statLbl}>Active{'\n'}Policies</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statBox}>
            <Text style={s.statNum}>{totalClaims}</Text>
            <Text style={s.statLbl}>Total{'\n'}Claims</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statBox}>
            <Text style={[s.statNum, { color: Colors.success }]}>{approvedClaims}</Text>
            <Text style={s.statLbl}>Claims{'\n'}Approved</Text>
          </View>
        </View>

        {/* ── Active policies mini list ───────────────── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Active Policies</Text>
          {MY_POLICIES.map(p => (
            <View key={p.id} style={[s.policyRow, { borderLeftColor: p.color }]}>
              <View style={{ flex: 1 }}>
                <Text style={s.policyPlan}>{p.plan}</Text>
                <Text style={s.policyMeta}>{p.insurer} · {p.type} · {p.policyNo}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[s.policyPremium, { color: p.color }]}>{p.premium}</Text>
                <Text style={s.policyDue}>Due {p.nextDue}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Menu ───────────────────────────────────── */}
        <View style={s.menu}>
          {MENU_ITEMS.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              style={[s.menuItem, i === MENU_ITEMS.length - 1 && { borderBottomWidth: 0 }]}
              activeOpacity={0.7}
              onPress={() => item.route && router.push(item.route as never)}
            >
              <View style={s.menuIcon}>
                <Icon name={item.icon} size={20} color={Colors.textMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.menuLabel}>{item.label}</Text>
                <Text style={s.menuSub}>{item.sub}</Text>
              </View>
              <Text style={s.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Logout ─────────────────────────────────── */}
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Text style={s.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={s.version}>ASK Insurance Broker · v1.0.0{'\n'}IRDAI Licensed · Reg. No. XXXXX</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  pageTitle: { fontSize: 22, fontWeight: '900', color: Colors.text, letterSpacing: -0.4 },
  editBtn: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 8, borderWidth: 1.5, borderColor: Colors.primary,
  },
  editBtnText: { fontSize: 13, fontWeight: '600', color: Colors.primary },

  avatarCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.white, margin: 16, borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: Colors.border,
  },
  avatarCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: Colors.accent,
  },
  avatarText:  { fontSize: 22, fontWeight: '900', color: Colors.white },
  userName:    { fontSize: 17, fontWeight: '800', color: Colors.text, marginBottom: 2 },
  userEmail:   { fontSize: 12, color: Colors.textMuted, marginBottom: 2 },
  userPhone:   { fontSize: 12, color: Colors.textMuted },
  verifiedBadge: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    alignSelf: 'flex-start',
  },
  verifiedText: { fontSize: 11, fontWeight: '700', color: Colors.success },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.white, marginHorizontal: 16,
    borderRadius: 14, borderWidth: 1, borderColor: Colors.border,
    paddingVertical: 14, marginBottom: 16,
  },
  statBox:    { flex: 1, alignItems: 'center' },
  statDivider:{ width: 1, backgroundColor: Colors.border },
  statNum:    { fontSize: 22, fontWeight: '900', color: Colors.primary, letterSpacing: -0.5 },
  statLbl:    { fontSize: 10, color: Colors.textMuted, marginTop: 2, textAlign: 'center', lineHeight: 14 },

  section: {
    backgroundColor: Colors.white, marginHorizontal: 16, marginBottom: 16,
    borderRadius: 14, borderWidth: 1, borderColor: Colors.border,
    padding: 16,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 12 },
  policyRow: {
    flexDirection: 'row', alignItems: 'center',
    borderLeftWidth: 3, paddingLeft: 12, paddingVertical: 8,
    marginBottom: 8,
  },
  policyPlan:    { fontSize: 14, fontWeight: '700', color: Colors.text },
  policyMeta:    { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  policyPremium: { fontSize: 13, fontWeight: '700' },
  policyDue:     { fontSize: 11, color: Colors.textMuted, marginTop: 2 },

  menu: {
    backgroundColor: Colors.white, marginHorizontal: 16, marginBottom: 16,
    borderRadius: 14, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  menuIcon: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center',
  },
  menuEmoji: { fontSize: 18 },
  menuLabel: { fontSize: 14, fontWeight: '600', color: Colors.text },
  menuSub:   { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  menuArrow: { fontSize: 20, color: Colors.textLight },

  logoutBtn: {
    marginHorizontal: 16, marginBottom: 16,
    borderWidth: 1.5, borderColor: Colors.error,
    borderRadius: 12, paddingVertical: 14, alignItems: 'center',
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: Colors.error },

  version: {
    fontSize: 11, color: Colors.textLight, textAlign: 'center',
    marginBottom: 8, lineHeight: 17,
  },

  // Guest (logged-out) state
  guestWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 36, gap: 14,
  },
  guestIconCircle: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: Colors.bg, borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  guestTitle: {
    fontSize: 20, fontWeight: '800', color: Colors.text,
    textAlign: 'center', letterSpacing: -0.3,
  },
  guestSub: {
    fontSize: 14, color: Colors.textMuted, textAlign: 'center',
    lineHeight: 21, marginBottom: 8,
  },
  guestLoginBtn: {
    width: '100%', backgroundColor: Colors.primary,
    borderRadius: 14, paddingVertical: 14, alignItems: 'center',
  },
  guestLoginText: { fontSize: 15, fontWeight: '800', color: Colors.white },
  guestRegisterBtn: {
    width: '100%', borderWidth: 1.5, borderColor: Colors.primary,
    borderRadius: 14, paddingVertical: 13, alignItems: 'center',
  },
  guestRegisterText: { fontSize: 15, fontWeight: '700', color: Colors.primary },
});
