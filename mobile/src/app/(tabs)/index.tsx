import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/auth';
import { MY_POLICIES, MY_CLAIMS, PLANS } from '@/data/mock';
import { Icon } from '@/components/Icon';
import { Colors, BottomTabInset } from '@/constants/theme';

const { width: W } = Dimensions.get('window');

const QUICK_ACTIONS = [
  { icon: 'document-text-outline', label: 'Compare\nPlans',   route: '/plans'   },
  { icon: 'shield-outline',        label: 'My\nPolicies',     route: '/profile' },
  { icon: 'add-circle-outline',    label: 'File\nClaim',      route: '/claims'  },
  { icon: 'refresh-outline',       label: 'Renew\nPolicy',    route: '/plans'   },
] as const;

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeTab() {
  const router   = useRouter();
  const { user } = useAuth();

  const firstName      = user?.name.split(' ')[0] ?? 'there';
  const activePolicies = MY_POLICIES.filter(p => p.status === 'Active').length;
  const openClaims     = MY_CLAIMS.filter(c => c.status === 'Processing' || c.status === 'Submitted').length;
  const featured       = PLANS.slice(0, 3);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={{ paddingBottom: BottomTabInset + 32 }}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Header ─────────────────────────────────── */}
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>{getGreeting()}</Text>
            <Text style={s.name}>{firstName} 👋</Text>
          </View>
          <View style={s.headerRight}>
            <TouchableOpacity style={s.headerIconBtn} onPress={() => router.push('/settings')}>
              <Icon name="settings-outline" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
            <View style={s.logoMark}>
              <Text style={s.logoMarkText}>ASK</Text>
            </View>
          </View>
        </View>

        {/* ── Stat chips ─────────────────────────────── */}
        <View style={s.statsRow}>
          <View style={s.statChip}>
            <View style={s.statIconWrap}>
              <Icon name="shield-checkmark-outline" size={15} color={Colors.primary} />
            </View>
            <Text style={s.statChipNum}>{activePolicies}</Text>
            <Text style={s.statChipLbl}>Active{'\n'}Policies</Text>
          </View>
          <View style={s.statChip}>
            <View style={[s.statIconWrap, { backgroundColor: Colors.warning + '18' }]}>
              <Icon name="document-text-outline" size={15} color={Colors.warning} />
            </View>
            <Text style={[s.statChipNum, { color: openClaims > 0 ? Colors.warning : Colors.text }]}>
              {openClaims}
            </Text>
            <Text style={s.statChipLbl}>Open{'\n'}Claims</Text>
          </View>
          <View style={[s.statChip, s.statChipPrimary]}>
            <View style={s.statIconWrapWhite}>
              <Icon name="business-outline" size={15} color={Colors.white} />
            </View>
            <Text style={[s.statChipNum, { color: Colors.white }]}>38+</Text>
            <Text style={[s.statChipLbl, { color: 'rgba(255,255,255,0.7)' }]}>Partner{'\n'}Insurers</Text>
          </View>
        </View>

        {/* ── Quick actions ──────────────────────────── */}
        <View style={s.section}>
          <Text style={[s.sectionTitle, { marginBottom: 14 }]}>Quick Actions</Text>
          <View style={s.actionsGrid}>
            {QUICK_ACTIONS.map((a, i) => (
              <TouchableOpacity
                key={a.label}
                style={s.actionCard}
                activeOpacity={0.72}
                onPress={() => router.push(a.route)}
              >
                <View style={[s.actionIconWrap, i === 0 && s.actionIconWrapPrimary]}>
                  <Icon name={a.icon} size={21} color={i === 0 ? Colors.white : Colors.primary} />
                </View>
                <Text style={s.actionLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── My policies ────────────────────────────── */}
        {MY_POLICIES.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionRow}>
              <Text style={s.sectionTitle}>My Policies</Text>
              <TouchableOpacity onPress={() => router.push('/profile')}>
                <Text style={s.viewAll}>View all →</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 14, paddingRight: 4 }}
            >
              {MY_POLICIES.map(p => (
                <View key={p.id} style={s.policyCard}>
                  <View style={[s.policyAccent, { backgroundColor: p.color }]} />
                  <View style={s.policyHeader}>
                    <View style={[s.policyAvatar, { backgroundColor: p.color + '18' }]}>
                      <Text style={[s.policyAvatarText, { color: p.color }]}>
                        {p.insurer.slice(0, 2)}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.policyPlan}>{p.plan}</Text>
                      <Text style={s.policyInsurer}>{p.insurer}</Text>
                    </View>
                    <View style={[s.statusPill, { backgroundColor: Colors.successLight }]}>
                      <View style={[s.statusDot, { backgroundColor: Colors.success }]} />
                      <Text style={[s.statusText, { color: Colors.success }]}>{p.status}</Text>
                    </View>
                  </View>

                  <View style={s.policyMetrics}>
                    <View>
                      <Text style={s.metricLabel}>COVER</Text>
                      <Text style={s.metricValue}>{p.cover}</Text>
                    </View>
                    <View style={s.metricDivider} />
                    <View style={{ alignItems: 'center' }}>
                      <Text style={s.metricLabel}>PREMIUM</Text>
                      <Text style={[s.metricValue, { color: p.color }]}>{p.premium}</Text>
                    </View>
                    <View style={s.metricDivider} />
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={s.metricLabel}>TYPE</Text>
                      <Text style={s.metricValue}>{p.type}</Text>
                    </View>
                  </View>

                  <View style={s.policyFooter}>
                    <Text style={s.policyDue}>Due {p.nextDue}</Text>
                    <TouchableOpacity style={[s.renewBtn, { backgroundColor: p.color + '14' }]}>
                      <Text style={[s.renewBtnText, { color: p.color }]}>Renew →</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Recommended plans ──────────────────────── */}
        <View style={s.section}>
          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>Recommended</Text>
            <TouchableOpacity onPress={() => router.push('/plans')}>
              <Text style={s.viewAll}>See all →</Text>
            </TouchableOpacity>
          </View>
          <View style={s.plansCard}>
            {featured.map((plan, i) => (
              <TouchableOpacity
                key={plan.id}
                style={[s.planRow, i < featured.length - 1 && s.planRowBorder]}
                activeOpacity={0.75}
                onPress={() => router.push(`/plan/${plan.id}`)}
              >
                <View style={[s.planAvatar, { backgroundColor: plan.color + '14' }]}>
                  <Text style={[s.planAvatarText, { color: plan.color }]}>{plan.short}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={s.planNameRow}>
                    <Text style={s.planName}>{plan.plan}</Text>
                    {plan.badge ? (
                      <View style={[s.planBadge, { backgroundColor: plan.color + '14' }]}>
                        <Text style={[s.planBadgeText, { color: plan.color }]}>{plan.badge}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={s.planMeta}>{plan.insurer} · {plan.category}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[s.planPremium, { color: plan.color }]}>{plan.premium}</Text>
                  <Text style={s.planCover}>{plan.cover}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Ask an Expert CTA ──────────────────────── */}
        <View style={s.ctaWrap}>
          <View style={s.ctaCard}>
            <View style={s.ctaBg1} />
            <View style={s.ctaBg2} />
            <View style={s.ctaBg3} />

            <View style={s.ctaContent}>
              <View style={s.ctaIconCircle}>
                <Icon name="headset-outline" size={28} color={Colors.white} />
              </View>
              <View style={s.ctaText}>
                <Text style={s.ctaLabel}>ASK AN EXPERT</Text>
                <Text style={s.ctaTitle}>Talk to a licensed{'\n'}insurance advisor</Text>
                <Text style={s.ctaSub}>Free consultation · Available 24×7</Text>
              </View>
            </View>

            <TouchableOpacity style={s.ctaBtn} activeOpacity={0.85}>
              <Text style={s.ctaBtnText}>Start conversation</Text>
              <Icon name="arrow-forward-outline" size={15} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Trust strip ────────────────────────────── */}
        <View style={s.trustStrip}>
          {['IRDAI Licensed', 'Secure & Private', '2.4L+ Customers'].map(t => (
            <View key={t} style={s.trustItem}>
              <Icon name="checkmark-circle-outline" size={13} color={Colors.success} />
              <Text style={s.trustText}>{t}</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },

  // ── Header ──────────────────────────────────
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 18,
    backgroundColor: Colors.bg,
  },
  greeting: {
    fontSize: 11, color: Colors.textMuted, fontWeight: '700',
    letterSpacing: 1, marginBottom: 3, textTransform: 'uppercase',
  },
  name:     { fontSize: 24, fontWeight: '900', color: Colors.text, letterSpacing: -0.6 },
  headerRight:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerIconBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  logoMark: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  logoMarkText: { fontSize: 11, fontWeight: '900', color: Colors.white, letterSpacing: 1.5 },

  // ── Stats ────────────────────────────────────
  statsRow: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 20, paddingBottom: 24,
  },
  statChip: {
    flex: 1, padding: 14, borderRadius: 16,
    backgroundColor: Colors.white,
    borderWidth: 1, borderColor: Colors.border,
  },
  statChipPrimary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  statIconWrap: {
    width: 30, height: 30, borderRadius: 9,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
  },
  statIconWrapWhite: {
    width: 30, height: 30, borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
  },
  statChipNum: { fontSize: 22, fontWeight: '900', color: Colors.primary, letterSpacing: -0.5, marginBottom: 3 },
  statChipLbl: { fontSize: 10, color: Colors.textMuted, lineHeight: 15, fontWeight: '600' },

  // ── Sections ─────────────────────────────────
  section:      { paddingHorizontal: 20, marginBottom: 26 },
  sectionRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: Colors.text, letterSpacing: -0.3 },
  viewAll:      { fontSize: 13, color: Colors.primary, fontWeight: '600' },

  // ── Quick actions ────────────────────────────
  actionsGrid: { flexDirection: 'row', gap: 10 },
  actionCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16, padding: 14,
    alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  actionIconWrap: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  actionIconWrapPrimary: { backgroundColor: Colors.primary },
  actionLabel: { fontSize: 12, fontWeight: '700', color: Colors.text, textAlign: 'center', lineHeight: 17 },

  // ── Policy cards ─────────────────────────────
  policyCard: {
    width: W * 0.74,
    backgroundColor: Colors.white, borderRadius: 18,
    overflow: 'hidden', borderWidth: 1, borderColor: Colors.border,
  },
  policyAccent: { height: 4 },
  policyHeader:    { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, paddingBottom: 10 },
  policyAvatar:    { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  policyAvatarText:{ fontSize: 13, fontWeight: '800' },
  policyPlan:      { fontSize: 14, fontWeight: '800', color: Colors.text, marginBottom: 2 },
  policyInsurer:   { fontSize: 11, color: Colors.textMuted },
  statusPill:      { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  statusDot:       { width: 6, height: 6, borderRadius: 3 },
  statusText:      { fontSize: 10, fontWeight: '700' },

  policyMetrics: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.bg, borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 12, marginHorizontal: 14, marginBottom: 12,
  },
  metricLabel:   { fontSize: 9, color: Colors.textLight, fontWeight: '700', letterSpacing: 0.5, marginBottom: 3 },
  metricValue:   { fontSize: 13, fontWeight: '800', color: Colors.text },
  metricDivider: { width: 1, height: 28, backgroundColor: Colors.border },

  policyFooter:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 14 },
  policyDue:     { fontSize: 11, color: Colors.textMuted },
  renewBtn:      { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  renewBtnText:  { fontSize: 12, fontWeight: '700' },

  // ── Plans card ───────────────────────────────
  plansCard:    { backgroundColor: Colors.white, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  planRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  planRowBorder:{ borderBottomWidth: 1, borderBottomColor: Colors.bg },
  planAvatar:   { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  planAvatarText:{ fontSize: 14, fontWeight: '800' },
  planNameRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  planName:     { fontSize: 14, fontWeight: '700', color: Colors.text },
  planBadge:    { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  planBadgeText:{ fontSize: 9, fontWeight: '700' },
  planMeta:     { fontSize: 12, color: Colors.textMuted },
  planPremium:  { fontSize: 13, fontWeight: '800', marginBottom: 2 },
  planCover:    { fontSize: 11, color: Colors.textMuted },

  // ── Ask an Expert CTA ─────────────────────────
  ctaWrap: { paddingHorizontal: 20, marginBottom: 20 },
  ctaCard: {
    backgroundColor: Colors.primary,
    borderRadius: 20, padding: 20,
    overflow: 'hidden',
  },
  ctaBg1: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -50, right: -30,
  },
  ctaBg2: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: 30, right: 55,
  },
  ctaBg3: {
    position: 'absolute', width: 70, height: 70, borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -15, right: 15,
  },
  ctaContent: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 18 },
  ctaIconCircle: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  ctaText: { flex: 1 },
  ctaLabel: {
    fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.55)',
    letterSpacing: 1.5, marginBottom: 5,
  },
  ctaTitle: { fontSize: 18, fontWeight: '900', color: Colors.white, letterSpacing: -0.4, lineHeight: 25, marginBottom: 5 },
  ctaSub:   { fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 17 },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.white,
    borderRadius: 12, paddingVertical: 13,
  },
  ctaBtnText: { fontSize: 14, fontWeight: '800', color: Colors.primary },

  // ── Trust strip ──────────────────────────────
  trustStrip: {
    flexDirection: 'row', justifyContent: 'center', gap: 18,
    paddingHorizontal: 20, marginBottom: 8,
  },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  trustText: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
});
