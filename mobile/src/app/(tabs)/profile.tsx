import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/auth';
import { policiesApi, claimsApi, paymentsApi, ApiPolicy, ApiClaim, ApiPayment } from '@/lib/api';
import { Icon } from '@/components/Icon';
import { Colors, BottomTabInset } from '@/constants/theme';

import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

// ── Helpers ───────────────────────────────────────────────────────────────────

function policyColor(type: string): string {
  const map: Record<string, string> = {
    life: '#1580FF', health: '#059669', motor: '#0891B2',
    travel: '#D97706', home: '#7C3AED', business: '#E11D48',
  };
  return map[type] ?? '#1580FF';
}

function formatPremium(v: number): string {
  if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K/yr`;
  return `₹${v}/yr`;
}

function formatAmount(v: number): string {
  if (v >= 100000) return `₹${(v / 100000).toFixed(2)}L`;
  if (v >= 1000)   return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${v}`;
}

function totalPremiumPaid(payments: ApiPayment[]): number {
  return payments.filter(p => p.status === 'success').reduce((s, p) => s + p.amount, 0);
}

// ── Menu row ──────────────────────────────────────────────────────────────────

interface MenuRowProps {
  icon:    IoniconsName;
  label:   string;
  sub:     string;
  onPress: () => void;
  badge?:  string;
  badgeColor?: string;
}

function MenuRow({ icon, label, sub, onPress, badge, badgeColor }: MenuRowProps) {
  return (
    <TouchableOpacity style={m.row} onPress={onPress} activeOpacity={0.7}>
      <View style={m.icon}>
        <Icon name={icon} size={20} color={Colors.textMuted} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={m.label}>{label}</Text>
        <Text style={m.sub}>{sub}</Text>
      </View>
      {badge !== undefined && (
        <View style={[m.badge, badgeColor ? { backgroundColor: badgeColor + '18' } : {}]}>
          <Text style={[m.badgeText, badgeColor ? { color: badgeColor } : {}]}>{badge}</Text>
        </View>
      )}
      <Text style={m.arrow}>›</Text>
    </TouchableOpacity>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function ProfileTab() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [policies,   setPolicies]   = useState<ApiPolicy[]>([]);
  const [claims,     setClaims]     = useState<ApiClaim[]>([]);
  const [payments,   setPayments]   = useState<ApiPayment[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (!user) { setLoading(false); return; }
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [polRes, claimRes, payRes] = await Promise.allSettled([
        policiesApi.list(),
        claimsApi.list(),
        paymentsApi.list(),
      ]);
      if (polRes.status   === 'fulfilled') setPolicies(polRes.value.policies);
      if (claimRes.status === 'fulfilled') setClaims(claimRes.value.claims);
      if (payRes.status   === 'fulfilled') setPayments(payRes.value.payments);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleLogout = async () => {
    await logout();
    router.replace('/welcome');
  };

  const initials = (user?.name ?? 'U')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const activePolicies  = policies.filter(p => p.status === 'active').length;
  const pendingClaims   = claims.filter(c => c.status === 'pending' || c.status === 'submitted').length;
  const approvedClaims  = claims.filter(c => c.status === 'approved' || c.status === 'settled').length;
  const totalPaid       = totalPremiumPaid(payments);

  // ── Guest view ─────────────────────────────────────────────────────────────
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
          <Text style={s.guestSub}>
            Sign in to view your policies, file claims, and track everything in one place.
          </Text>
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} />}
      >
        {/* Header */}
        <View style={s.header}>
          <Text style={s.pageTitle}>Profile</Text>
          <TouchableOpacity style={s.editBtn} onPress={() => router.push('/edit-profile')}>
            <Icon name="create-outline" size={16} color={Colors.primary} />
            <Text style={s.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Avatar card */}
        <View style={s.avatarCard}>
          <View style={s.avatarCircle}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.userName}>{user.name ?? 'Add your name'}</Text>
            <Text style={s.userSub}>{user.email ?? user.phone}</Text>
            {user.email && (
              <Text style={s.userSub}>{user.phone}</Text>
            )}
            {(user.city || user.state) && (
              <Text style={s.userLocation}>
                <Icon name="location-outline" size={11} color={Colors.textMuted} />{' '}
                {[user.city, user.state].filter(Boolean).join(', ')}
              </Text>
            )}
          </View>
          <View style={s.verifiedBadge}>
            <Text style={s.verifiedText}>✓ Verified</Text>
          </View>
        </View>

        {/* Stats */}
        {loading ? (
          <ActivityIndicator style={{ marginVertical: 20 }} color={Colors.primary} />
        ) : (
          <View style={s.statsRow}>
            <View style={s.statBox}>
              <Text style={s.statNum}>{activePolicies}</Text>
              <Text style={s.statLbl}>Active{'\n'}Policies</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statBox}>
              <Text style={s.statNum}>{claims.length}</Text>
              <Text style={s.statLbl}>Total{'\n'}Claims</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statBox}>
              <Text style={[s.statNum, { color: Colors.success }]}>
                {totalPaid >= 1000
                  ? `₹${(totalPaid / 1000).toFixed(0)}K`
                  : `₹${totalPaid}`
                }
              </Text>
              <Text style={s.statLbl}>Total{'\n'}Paid</Text>
            </View>
          </View>
        )}

        {/* Active policies preview */}
        {!loading && activePolicies > 0 && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Active Policies</Text>
              <TouchableOpacity onPress={() => router.push('/my-policies')}>
                <Text style={s.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            {policies.filter(p => p.status === 'active').slice(0, 2).map(p => {
              const color = policyColor(p.type);
              const due   = new Date(p.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
              return (
                <View key={p.id} style={[s.policyRow, { borderLeftColor: color }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.policyPlan}>{p.provider}</Text>
                    <Text style={s.policyMeta}>{p.type} · {p.policyNumber}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[s.policyPremium, { color }]}>{formatPremium(p.premium)}</Text>
                    <Text style={s.policyDue}>Until {due}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Recent claims preview */}
        {!loading && claims.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Recent Claims</Text>
            </View>
            {claims.slice(0, 2).map(claim => {
              const isApproved = claim.status === 'approved' || claim.status === 'settled';
              const isPending  = claim.status === 'pending' || claim.status === 'submitted';
              const color = isApproved ? Colors.success : isPending ? '#D97706' : Colors.error;
              const bgColor = isApproved ? (Colors.successLight ?? Colors.success + '18') : isPending ? '#FEF3C7' : Colors.error + '18';
              return (
                <View key={claim.id} style={s.claimRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.claimType}>{claim.type} · {claim.claimNumber}</Text>
                    <Text style={s.claimAmt}>{formatAmount(claim.amount)}</Text>
                  </View>
                  <View style={[s.claimBadge, { backgroundColor: bgColor }]}>
                    <Text style={[s.claimBadgeText, { color }]}>
                      {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Menu */}
        <View style={s.menu}>
          <MenuRow
            icon="document-text-outline"
            label="My Policies"
            sub={activePolicies > 0 ? `${activePolicies} active plan${activePolicies > 1 ? 's' : ''}` : 'View & manage plans'}
            onPress={() => router.push('/my-policies')}
            badge={activePolicies > 0 ? String(activePolicies) : undefined}
            badgeColor={Colors.primary}
          />
          <View style={s.menuDivider} />
          <MenuRow
            icon="card-outline"
            label="Payment History"
            sub={payments.length > 0 ? `${payments.filter(p => p.status === 'success').length} successful payments` : 'Premiums & receipts'}
            onPress={() => router.push('/payments')}
          />
          <View style={s.menuDivider} />
          <MenuRow
            icon="settings-outline"
            label="Settings"
            sub="App preferences & legal"
            onPress={() => router.push('/settings')}
          />
          <View style={s.menuDivider} />
          <MenuRow
            icon="headset-outline"
            label="Help & Support"
            sub="24×7 advisor chat"
            onPress={() => router.push('/(tabs)/chat')}
          />
        </View>

        {/* Logout */}
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Icon name="log-out-outline" size={18} color={Colors.error} />
          <Text style={s.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={s.version}>ASK Insurance Broker · v1.0.0{'\n'}IRDAI Licensed · Reg. No. XXXXX</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  pageTitle: { fontSize: 22, fontWeight: '900', color: Colors.text, letterSpacing: -0.4 },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8,
    borderWidth: 1.5, borderColor: Colors.primary,
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
  avatarText:   { fontSize: 22, fontWeight: '900', color: Colors.white },
  userName:     { fontSize: 17, fontWeight: '800', color: Colors.text, marginBottom: 2 },
  userSub:      { fontSize: 12, color: Colors.textMuted, marginBottom: 1 },
  userLocation: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  verifiedBadge:{ backgroundColor: Colors.successLight ?? Colors.success + '18', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  verifiedText: { fontSize: 11, fontWeight: '700', color: Colors.success },

  statsRow: {
    flexDirection: 'row', backgroundColor: Colors.white,
    marginHorizontal: 16, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border,
    paddingVertical: 14, marginBottom: 16,
  },
  statBox:     { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: Colors.border },
  statNum:     { fontSize: 22, fontWeight: '900', color: Colors.primary, letterSpacing: -0.5 },
  statLbl:     { fontSize: 10, color: Colors.textMuted, marginTop: 2, textAlign: 'center', lineHeight: 14 },

  section: {
    backgroundColor: Colors.white, marginHorizontal: 16, marginBottom: 16,
    borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 16,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle:  { fontSize: 15, fontWeight: '800', color: Colors.text },
  seeAll:        { fontSize: 13, fontWeight: '600', color: Colors.primary },

  policyRow: {
    flexDirection: 'row', alignItems: 'center',
    borderLeftWidth: 3, paddingLeft: 12, paddingVertical: 8, marginBottom: 8,
  },
  policyPlan:    { fontSize: 14, fontWeight: '700', color: Colors.text },
  policyMeta:    { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  policyPremium: { fontSize: 13, fontWeight: '700' },
  policyDue:     { fontSize: 11, color: Colors.textMuted, marginTop: 2 },

  claimRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.bg,
  },
  claimType:      { fontSize: 13, fontWeight: '600', color: Colors.text },
  claimAmt:       { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  claimBadge:     { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  claimBadgeText: { fontSize: 11, fontWeight: '700' },

  menu: {
    backgroundColor: Colors.white, marginHorizontal: 16, marginBottom: 16,
    borderRadius: 14, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  menuDivider: { height: 1, backgroundColor: Colors.border, marginLeft: 66 },

  logoutBtn: {
    marginHorizontal: 16, marginBottom: 16,
    borderWidth: 1.5, borderColor: Colors.error,
    borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 8,
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: Colors.error },

  version: {
    fontSize: 11, color: Colors.textLight, textAlign: 'center',
    marginBottom: 8, lineHeight: 17,
  },

  guestWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36, gap: 14 },
  guestIconCircle: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: Colors.bg, borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  guestTitle:     { fontSize: 20, fontWeight: '800', color: Colors.text, textAlign: 'center', letterSpacing: -0.3 },
  guestSub:       { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 21, marginBottom: 8 },
  guestLoginBtn:  { width: '100%', backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  guestLoginText: { fontSize: 15, fontWeight: '800', color: Colors.white },
});

const m = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  icon:      { width: 38, height: 38, borderRadius: 10, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
  label:     { fontSize: 14, fontWeight: '600', color: Colors.text },
  sub:       { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  arrow:     { fontSize: 20, color: Colors.textLight },
  badge:     { backgroundColor: Colors.primary + '18', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginRight: 4 },
  badgeText: { fontSize: 11, fontWeight: '800', color: Colors.primary },
});
