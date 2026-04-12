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
  { icon: 'document-text-outline', label: 'Compare\nPlans',  route: '/plans'   },
  { icon: 'shield-outline',        label: 'My\nPolicies',    route: '/profile' },
  { icon: 'add-circle-outline',    label: 'File\nClaim',     route: '/claims'  },
  { icon: 'refresh-outline',       label: 'Renew\nPolicy',   route: '/plans'   },
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

        {/* ── Hero banner ────────────────────────────── */}
        <View style={s.hero}>
          {/* Decorative blobs */}
          <View style={s.heroBg1} />
          <View style={s.heroBg2} />
          <View style={s.heroBg3} />

          {/* Top bar */}
          <View style={s.heroTopBar}>
            <View>
              <Text style={s.greeting}>{getGreeting()}</Text>
              <Text style={s.name}>{firstName} 👋</Text>
            </View>
            <View style={s.headerRight}>
              <TouchableOpacity style={s.headerIconBtn} onPress={() => router.push('/settings')}>
                <Icon name="settings-outline" size={20} color="rgba(255,255,255,0.85)" />
              </TouchableOpacity>
              <View style={s.logoMark}>
                <Text style={s.logoMarkText}>ASK</Text>
              </View>
            </View>
          </View>

          {/* Stat chips on blue */}
          <View style={s.statsRow}>
            <View style={s.statChip}>
              <View style={s.statChipIcon}>
                <Icon name="shield-checkmark-outline" size={14} color={Colors.primary} />
              </View>
              <Text style={s.statNum}>{activePolicies}</Text>
              <Text style={s.statLbl}>Active{'\n'}Policies</Text>
            </View>
            <View style={[s.statChip, s.statChipMid]}>
              <View style={[s.statChipIcon, openClaims > 0 && { backgroundColor: Colors.warning + '20' }]}>
                <Icon name="document-text-outline" size={14} color={openClaims > 0 ? Colors.warning : Colors.primary} />
              </View>
              <Text style={[s.statNum, openClaims > 0 && { color: Colors.warning }]}>{openClaims}</Text>
              <Text style={s.statLbl}>Open{'\n'}Claims</Text>
            </View>
            <View style={s.statChip}>
              <View style={s.statChipIcon}>
                <Icon name="business-outline" size={14} color={Colors.primary} />
              </View>
              <Text style={s.statNum}>38+</Text>
              <Text style={s.statLbl}>Partner{'\n'}Insurers</Text>
            </View>
          </View>
        </View>

        {/* ── Body ───────────────────────────────────── */}
        <View style={s.body}>

          {/* ── Quick actions ──────────────────────── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Quick Actions</Text>
            <View style={s.actionsGrid}>
              {QUICK_ACTIONS.map((a, i) => (
                <TouchableOpacity
                  key={a.label}
                  style={s.actionCard}
                  activeOpacity={0.72}
                  onPress={() => router.push(a.route)}
                >
                  <View style={[s.actionIconWrap, i === 0 && s.actionIconPrimary]}>
                    <Icon name={a.icon} size={20} color={i === 0 ? Colors.white : Colors.primary} />
                  </View>
                  <Text style={s.actionLabel}>{a.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── My policies ──────────────────────── */}
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
                contentContainerStyle={s.hScroll}
              >
                {MY_POLICIES.map(p => (
                  <View key={p.id} style={s.policyCard}>
                    {/* Colored header band */}
                    <View style={[s.policyBand, { backgroundColor: p.color }]}>
                      <View style={s.policyBandInner}>
                        <View style={s.policyAvatarCircle}>
                          <Text style={s.policyAvatarText}>{p.insurer.slice(0, 2)}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={s.policyPlan}>{p.plan}</Text>
                          <Text style={s.policyInsurer}>{p.insurer}</Text>
                        </View>
                        <View style={s.statusPill}>
                          <View style={s.statusDot} />
                          <Text style={s.statusText}>{p.status}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Metrics */}
                    <View style={s.policyMetrics}>
                      <View style={s.metricCol}>
                        <Text style={s.metricLabel}>COVER</Text>
                        <Text style={s.metricValue}>{p.cover}</Text>
                      </View>
                      <View style={s.metricDivider} />
                      <View style={[s.metricCol, { alignItems: 'center' }]}>
                        <Text style={s.metricLabel}>PREMIUM</Text>
                        <Text style={[s.metricValue, { color: p.color }]}>{p.premium}</Text>
                      </View>
                      <View style={s.metricDivider} />
                      <View style={[s.metricCol, { alignItems: 'flex-end' }]}>
                        <Text style={s.metricLabel}>TYPE</Text>
                        <Text style={s.metricValue}>{p.type}</Text>
                      </View>
                    </View>

                    {/* Footer */}
                    <View style={s.policyFooter}>
                      <Text style={s.policyDue}>Due {p.nextDue}</Text>
                      <TouchableOpacity style={[s.renewBtn, { backgroundColor: p.color }]}>
                        <Text style={s.renewBtnText}>Renew →</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* ── Recommended plans ────────────────── */}
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
                  <View style={[s.planAvatar, { backgroundColor: plan.color + '18' }]}>
                    <Text style={[s.planAvatarText, { color: plan.color }]}>{plan.short}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={s.planNameRow}>
                      <Text style={s.planName}>{plan.plan}</Text>
                      {plan.badge ? (
                        <View style={[s.planBadge, { backgroundColor: plan.color + '18' }]}>
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

          {/* ── Ask an Expert ────────────────────── */}
          <View style={s.section}>
            <View style={s.ctaCard}>
              <View style={s.ctaBg1} /><View style={s.ctaBg2} /><View style={s.ctaBg3} />
              <View style={s.ctaContent}>
                <View style={s.ctaIconCircle}>
                  <Icon name="headset-outline" size={28} color={Colors.white} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.ctaEyebrow}>ASK AN EXPERT</Text>
                  <Text style={s.ctaTitle}>Talk to a licensed{'\n'}insurance advisor</Text>
                  <Text style={s.ctaSub}>Free · Available 24×7</Text>
                </View>
              </View>
              <TouchableOpacity style={s.ctaBtn} activeOpacity={0.85}>
                <Text style={s.ctaBtnText}>Start conversation</Text>
                <Icon name="arrow-forward-outline" size={15} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Trust strip ────────────────────── */}
          <View style={s.trustStrip}>
            {['IRDAI Licensed', 'Secure & Private', '2.4L+ Customers'].map(t => (
              <View key={t} style={s.trustItem}>
                <Icon name="checkmark-circle-outline" size={13} color={Colors.success} />
                <Text style={s.trustText}>{t}</Text>
              </View>
            ))}
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.primary },
  scroll: { flex: 1, backgroundColor: Colors.bg },

  // ── Hero banner ──────────────────────────────
  hero: {
    backgroundColor: Colors.primary,
    paddingTop: 12, paddingBottom: 28,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  heroBg1: {
    position: 'absolute', width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: -80, right: -60,
  },
  heroBg2: {
    position: 'absolute', width: 150, height: 150, borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: 30, right: 40,
  },
  heroBg3: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: -20, left: 40,
  },

  heroTopBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 22,
  },
  greeting: {
    fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1.2, marginBottom: 4, textTransform: 'uppercase',
  },
  name: { fontSize: 26, fontWeight: '900', color: Colors.white, letterSpacing: -0.6 },
  headerRight:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerIconBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  logoMark: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
  },
  logoMarkText: { fontSize: 11, fontWeight: '900', color: Colors.primary, letterSpacing: 1.5 },

  // ── Stat chips (on blue) ─────────────────────
  statsRow: {
    flexDirection: 'row', gap: 10,
  },
  statChip: {
    flex: 1, backgroundColor: Colors.white,
    borderRadius: 14, padding: 13,
  },
  statChipMid: {
    borderWidth: 0,
  },
  statChipIcon: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 9,
  },
  statNum: { fontSize: 20, fontWeight: '900', color: Colors.primary, letterSpacing: -0.4, marginBottom: 2 },
  statLbl: { fontSize: 10, color: Colors.textMuted, lineHeight: 14, fontWeight: '600' },

  // ── Body ────────────────────────────────────
  body: {
    backgroundColor: Colors.bg,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    marginTop: -10,
    paddingTop: 6,
  },

  // ── Sections ─────────────────────────────────
  section:    { paddingHorizontal: 18, paddingTop: 20, marginBottom: 4 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle:{ fontSize: 16, fontWeight: '800', color: Colors.text, letterSpacing: -0.3, marginBottom: 14 },
  viewAll:    { fontSize: 13, color: Colors.primary, fontWeight: '600' },

  // ── Quick actions ────────────────────────────
  actionsGrid: { flexDirection: 'row', gap: 10 },
  actionCard: {
    flex: 1, backgroundColor: Colors.white,
    borderRadius: 14, padding: 13,
    alignItems: 'center', gap: 9,
    borderWidth: 1, borderColor: Colors.border,
  },
  actionIconWrap: {
    width: 44, height: 44, borderRadius: 13,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  actionIconPrimary: { backgroundColor: Colors.primary },
  actionLabel: { fontSize: 11, fontWeight: '700', color: Colors.text, textAlign: 'center', lineHeight: 16 },

  // ── Policy cards ─────────────────────────────
  hScroll: { gap: 14, paddingRight: 6, paddingBottom: 2 },
  policyCard: {
    width: W * 0.76,
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border,
  },
  policyBand: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 14 },
  policyBandInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  policyAvatarCircle: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  policyAvatarText: { fontSize: 13, fontWeight: '900', color: Colors.white },
  policyPlan:    { fontSize: 14, fontWeight: '800', color: Colors.white, marginBottom: 2 },
  policyInsurer: { fontSize: 11, color: 'rgba(255,255,255,0.75)' },
  statusPill:    {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20,
  },
  statusDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.white },
  statusText: { fontSize: 10, fontWeight: '700', color: Colors.white },

  policyMetrics: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 14,
  },
  metricCol:     { flex: 1 },
  metricLabel:   { fontSize: 9, color: Colors.textLight, fontWeight: '700', letterSpacing: 0.5, marginBottom: 3 },
  metricValue:   { fontSize: 13, fontWeight: '800', color: Colors.text },
  metricDivider: { width: 1, height: 26, backgroundColor: Colors.border },

  policyFooter:  {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingBottom: 14, paddingTop: 2,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  policyDue:     { fontSize: 11, color: Colors.textMuted },
  renewBtn:      { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  renewBtnText:  { fontSize: 11, fontWeight: '700', color: Colors.white },

  // ── Plans card ───────────────────────────────
  plansCard:    { backgroundColor: Colors.white, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  planRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 13 },
  planRowBorder:{ borderBottomWidth: 1, borderBottomColor: Colors.bg },
  planAvatar:   { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  planAvatarText:{ fontSize: 13, fontWeight: '800' },
  planNameRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  planName:     { fontSize: 13, fontWeight: '700', color: Colors.text },
  planBadge:    { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  planBadgeText:{ fontSize: 9, fontWeight: '700' },
  planMeta:     { fontSize: 11, color: Colors.textMuted },
  planPremium:  { fontSize: 13, fontWeight: '800', marginBottom: 2 },
  planCover:    { fontSize: 11, color: Colors.textMuted },

  // ── CTA ──────────────────────────────────────
  ctaCard: {
    backgroundColor: Colors.primary, borderRadius: 18,
    padding: 18, overflow: 'hidden',
  },
  ctaBg1: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.06)', top: -50, right: -30,
  },
  ctaBg2: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.07)', top: 20, right: 55,
  },
  ctaBg3: {
    position: 'absolute', width: 70, height: 70, borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.05)', bottom: -15, right: 15,
  },
  ctaContent:   { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 16 },
  ctaIconCircle: {
    width: 52, height: 52, borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  ctaEyebrow: {
    fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.55)',
    letterSpacing: 1.5, marginBottom: 4,
  },
  ctaTitle: { fontSize: 17, fontWeight: '900', color: Colors.white, letterSpacing: -0.3, lineHeight: 23, marginBottom: 4 },
  ctaSub:   { fontSize: 12, color: 'rgba(255,255,255,0.65)' },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.white, borderRadius: 11, paddingVertical: 12,
  },
  ctaBtnText: { fontSize: 13, fontWeight: '800', color: Colors.primary },

  // ── Trust strip ──────────────────────────────
  trustStrip: {
    flexDirection: 'row', justifyContent: 'center', gap: 18,
    paddingHorizontal: 18, paddingTop: 18, paddingBottom: 4,
  },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  trustText: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
});
