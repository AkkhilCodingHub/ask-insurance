import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Dimensions, RefreshControl, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/auth';
import { usersApi, plansApi, ApiPolicy, ApiPlan, DashboardData } from '@/lib/api';
import { Icon } from '@/components/Icon';
import { Colors, BottomTabInset } from '@/constants/theme';

const { width: W } = Dimensions.get('window');

// ── Shimmer ───────────────────────────────────────────────────────────────────

function Shimmer({ width, height, borderRadius = 8, style }: {
  width: number | string; height: number; borderRadius?: number; style?: object;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 850, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 850, useNativeDriver: true }),
      ])
    ).start();
  }, [anim]);
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.75] });
  return (
    <Animated.View
      style={[{ width, height, borderRadius, backgroundColor: Colors.border, opacity }, style]}
    />
  );
}

function RecommendedCardSkeleton() {
  return (
    <View style={sk.card}>
      <View style={sk.header}>
        <View style={sk.headerTop}>
          <Shimmer width={38} height={38} borderRadius={19} />
          <Shimmer width={70} height={14} borderRadius={6} style={{ marginLeft: 8 }} />
        </View>
        <Shimmer width="80%" height={16} borderRadius={6} style={{ marginTop: 12 }} />
        <Shimmer width="55%" height={12} borderRadius={6} style={{ marginTop: 6 }} />
      </View>
      <View style={sk.metrics}>
        <View style={sk.metricBox}>
          <Shimmer width={36} height={9}  borderRadius={4} />
          <Shimmer width={52} height={14} borderRadius={5} style={{ marginTop: 4 }} />
        </View>
        <View style={[sk.metricBox, { alignItems: 'center' }]}>
          <Shimmer width={48} height={9}  borderRadius={4} />
          <Shimmer width={40} height={14} borderRadius={5} style={{ marginTop: 4 }} />
        </View>
        <View style={[sk.metricBox, { alignItems: 'flex-end' }]}>
          <Shimmer width={36} height={9}  borderRadius={4} />
          <Shimmer width={44} height={14} borderRadius={5} style={{ marginTop: 4 }} />
        </View>
      </View>
      <View style={sk.features}>
        <Shimmer width="90%" height={11} borderRadius={5} />
        <Shimmer width="70%" height={11} borderRadius={5} style={{ marginTop: 6 }} />
      </View>
      <View style={sk.footer}>
        <Shimmer width={52} height={20} borderRadius={10} />
        <Shimmer width={90} height={30} borderRadius={8} />
      </View>
    </View>
  );
}

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

function formatPremium(v: number): string {
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)} L/yr`;
  if (v >= 1000)   return `₹${(v / 1000).toFixed(1)}K/yr`;
  return `₹${v}/yr`;
}

function formatCover(v: number): string {
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(0)} Cr`;
  if (v >= 100000)   return `₹${(v / 100000).toFixed(0)} L`;
  return `₹${v}`;
}

function policyColor(type: string): string {
  const map: Record<string, string> = {
    life: '#1580FF', health: '#059669', motor: '#0891B2',
    travel: '#D97706', home: '#7C3AED', business: '#E11D48'
  };
  return map[type] ?? '#1580FF';
}

function capitalize(s: string | null | undefined, fallback = '—'): string {
  if (s == null || s === '') return fallback;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function HomeTab() {
  const router   = useRouter();
  const { user } = useAuth();

  const [dashboard, setDashboard]       = useState<DashboardData | null>(null);
  const [featured, setFeatured]         = useState<ApiPlan[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [refreshing, setRefreshing]     = useState(false);

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoadingFeatured(true);
    try {
      const [dash, plansRes] = await Promise.allSettled([
        user ? usersApi.dashboard() : Promise.reject(new Error('not logged in')),
        plansApi.list({ featured: true })
      ]);
      if (dash.status === 'fulfilled')    setDashboard(dash.value);
      if (plansRes.status === 'fulfilled') setFeatured(plansRes.value.plans.slice(0, 3));
    } finally {
      setLoadingFeatured(false);
      if (isRefresh) setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const activePolicies = dashboard?.activePolicies ?? 0;
  const openClaims     = (dashboard?.recentClaims ?? []).filter(
    c => c.status === 'submitted' || c.status === 'under_review'
  ).length;
  const policies = dashboard?.policies ?? [];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={{ paddingBottom: BottomTabInset + 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
      >

        {/* ── Hero banner ────────────────────────────── */}
        <View style={s.hero}>
          <View style={s.heroBg1} />
          <View style={s.heroBg2} />
          <View style={s.heroBg3} />

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

          {/* Stat chips */}
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

          {/* Guest nudge — shown when not logged in */}
          {!user && (
            <View style={s.section}>
              <TouchableOpacity
                style={s.guestBanner}
                activeOpacity={0.85}
                onPress={() => router.push('/login')}
              >
                <View style={s.guestBannerBg} />
                <View style={s.guestBannerLeft}>
                  <View style={s.guestIconCircle}>
                    <Icon name="person-outline" size={20} color={Colors.primary} />
                  </View>
                  <View>
                    <Text style={s.guestBannerTitle}>Sign in to your account</Text>
                    <Text style={s.guestBannerSub}>View policies, track claims & get quotes</Text>
                  </View>
                </View>
                <Icon name="arrow-forward-outline" size={18} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          )}

          {/* Quick actions */}
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

          {/* My policies */}
          {user && (
            <View style={s.section}>
              <View style={s.sectionRow}>
                <Text style={s.sectionTitle}>My Policies</Text>
                <TouchableOpacity onPress={() => router.push('/profile')}>
                  <Text style={s.viewAll}>View all →</Text>
                </TouchableOpacity>
              </View>
              {policies.length === 0 ? (
                <TouchableOpacity
                  style={s.emptyCard}
                  activeOpacity={0.8}
                  onPress={() => router.push('/plans')}
                >
                  <View style={s.emptyIconCircle}>
                    <Icon name="shield-outline" size={26} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.emptyTitle}>No active policies</Text>
                    <Text style={s.emptySub}>Browse plans and get covered in minutes</Text>
                  </View>
                  <View style={s.emptyArrow}>
                    <Icon name="arrow-forward-outline" size={16} color={Colors.primary} />
                  </View>
                </TouchableOpacity>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={s.hScroll}
                >
                  {policies.map((p: ApiPolicy) => {
                    const typeStr = p.type ?? '';
                    const color = policyColor(typeStr);
                    const due   = new Date(p.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                    const providerStr = p.provider ?? '';
                    const initials = (providerStr.slice(0, 2) || '—').toUpperCase();
                    return (
                      <View key={p.id} style={s.policyCard}>
                        <View style={[s.policyBand, { backgroundColor: color }]}>
                          <View style={s.policyBandInner}>
                            <View style={s.policyAvatarCircle}>
                              <Text style={s.policyAvatarText}>{initials}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={s.policyPlan}>{p.policyNumber}</Text>
                              <Text style={s.policyInsurer}>{providerStr || '—'}</Text>
                            </View>
                            <View style={s.statusPill}>
                              <View style={s.statusDot} />
                              <Text style={s.statusText}>{capitalize(p.status)}</Text>
                            </View>
                          </View>
                        </View>

                        <View style={s.policyMetrics}>
                          <View style={s.metricCol}>
                            <Text style={s.metricLabel}>COVER</Text>
                            <Text style={s.metricValue}>{formatCover(p.sumInsured)}</Text>
                          </View>
                          <View style={s.metricDivider} />
                          <View style={[s.metricCol, { alignItems: 'center' }]}>
                            <Text style={s.metricLabel}>PREMIUM</Text>
                            <Text style={[s.metricValue, { color }]}>{formatPremium(p.premium)}</Text>
                          </View>
                          <View style={s.metricDivider} />
                          <View style={[s.metricCol, { alignItems: 'flex-end' }]}>
                            <Text style={s.metricLabel}>TYPE</Text>
                            <Text style={s.metricValue}>{capitalize(typeStr)}</Text>
                          </View>
                        </View>

                        <View style={s.policyFooter}>
                          <Text style={s.policyDue}>Expires {due}</Text>
                          <TouchableOpacity style={[s.renewBtn, { backgroundColor: color }]}>
                            <Text style={s.renewBtnText}>Renew →</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          )}

          {/* Recommended plans — skeletons while loading */}
          {(loadingFeatured || featured.length > 0) && (
            <View style={s.section}>
              <View style={s.sectionRow}>
                <Text style={s.sectionTitle}>Recommended</Text>
                <TouchableOpacity onPress={() => router.push('/plans')}>
                  <Text style={s.viewAll}>See all →</Text>
                </TouchableOpacity>
              </View>

              {loadingFeatured ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.recScroll} scrollEnabled={false}>
                  {[0, 1, 2].map(i => <RecommendedCardSkeleton key={i} />)}
                </ScrollView>
              ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.recScroll}
              >
                {featured.map(plan => {
                  const color   = plan.insurer?.brandColor ?? '#1580FF';
                  const short   = (plan.insurer?.shortName ?? plan.insurer?.name ?? '').slice(0, 2).toUpperCase();
                  const premium = plan.basePremium >= 1000
                    ? `₹${(plan.basePremium / 1000).toFixed(1)}K/yr`
                    : `₹${plan.basePremium}/yr`;
                  const cover = plan.maxCover >= 10000000
                    ? `₹${(plan.maxCover / 10000000).toFixed(0)} Cr`
                    : plan.maxCover >= 100000
                    ? `₹${(plan.maxCover / 100000).toFixed(0)} L`
                    : `₹${plan.maxCover}`;
                  let features: string[] = [];
                  try { features = JSON.parse(plan.features ?? '[]'); } catch { features = []; }
                  const rating = plan.insurer?.rating ?? 4.5;
                  const stars  = '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));

                  return (
                    <TouchableOpacity
                      key={plan.id}
                      style={s.recCard}
                      activeOpacity={0.88}
                      onPress={() => router.push(`/plan/${plan.id}`)}
                    >
                      {/* Coloured header */}
                      <View style={[s.recHeader, { backgroundColor: color }]}>
                        <View style={s.recHeaderBg1} />
                        <View style={s.recHeaderBg2} />

                        <View style={s.recHeaderTop}>
                          <View style={s.recInsurerCircle}>
                            <Text style={s.recInsurerText}>{short}</Text>
                          </View>
                          {plan.isFeatured && (
                            <View style={s.recFeaturedBadge}>
                              <Text style={s.recFeaturedText}>★ TOP PICK</Text>
                            </View>
                          )}
                        </View>

                        <Text style={s.recPlanName} numberOfLines={2}>{plan.name}</Text>
                        <Text style={s.recInsurerName}>{plan.insurer?.name}</Text>
                      </View>

                      {/* Metrics strip */}
                      <View style={s.recMetrics}>
                        <View style={s.recMetricBox}>
                          <Text style={s.recMetricLabel}>PREMIUM</Text>
                          <Text style={[s.recMetricValue, { color }]}>{premium}</Text>
                        </View>
                        <View style={s.recMetricDivider} />
                        <View style={[s.recMetricBox, { alignItems: 'center' }]}>
                          <Text style={s.recMetricLabel}>MAX COVER</Text>
                          <Text style={s.recMetricValue}>{cover}</Text>
                        </View>
                        <View style={s.recMetricDivider} />
                        <View style={[s.recMetricBox, { alignItems: 'flex-end' }]}>
                          <Text style={s.recMetricLabel}>RATING</Text>
                          <Text style={[s.recMetricValue, { color: '#D97706', fontSize: 11 }]}>{stars}</Text>
                        </View>
                      </View>

                      {/* Feature bullets */}
                      {features.length > 0 && (
                        <View style={s.recFeatures}>
                          {features.slice(0, 2).map((f, fi) => (
                            <View key={fi} style={s.recFeatureRow}>
                              <View style={[s.recFeatureDot, { backgroundColor: color }]} />
                              <Text style={s.recFeatureText} numberOfLines={1}>{f}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* CTA footer */}
                      <View style={s.recFooter}>
                        <Text style={s.recTypeChip}>{(plan.type ?? '').toUpperCase() || 'PLAN'}</Text>
                        <View style={[s.recViewBtn, { backgroundColor: color }]}>
                          <Text style={s.recViewBtnText}>View plan →</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              )}
            </View>
          )}

          {/* Ask an Expert CTA */}
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
              <TouchableOpacity
                style={s.ctaBtn}
                activeOpacity={0.85}
                onPress={() => router.push('/(tabs)/chat')}
              >
                <Text style={s.ctaBtnText}>Start conversation</Text>
                <Icon name="arrow-forward-outline" size={15} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Trust strip */}
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

  hero: {
    backgroundColor: Colors.primary,
    paddingTop: 12, paddingBottom: 28,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  heroBg1: {
    position: 'absolute', width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.05)', top: -80, right: -60,
  },
  heroBg2: {
    position: 'absolute', width: 150, height: 150, borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.06)', top: 30, right: 40,
  },
  heroBg3: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.04)', bottom: -20, left: 40,
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

  statsRow: { flexDirection: 'row', gap: 10 },
  statChip: {
    flex: 1, backgroundColor: Colors.white,
    borderRadius: 14, padding: 13,
  },
  statChipMid: {},
  statChipIcon: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 9,
  },
  statNum: { fontSize: 20, fontWeight: '900', color: Colors.primary, letterSpacing: -0.4, marginBottom: 2 },
  statLbl: { fontSize: 10, color: Colors.textMuted, lineHeight: 14, fontWeight: '600' },

  body: {
    backgroundColor: Colors.bg,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    marginTop: -10,
    paddingTop: 6,
  },

  section:    { paddingHorizontal: 18, paddingTop: 20, marginBottom: 4 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.text, letterSpacing: -0.3, marginBottom: 14 },
  viewAll:    { fontSize: 13, color: Colors.primary, fontWeight: '600' },

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

  hScroll: { gap: 14, paddingRight: 6, paddingBottom: 2 },
  policyCard: {
    width: W * 0.76,
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border,
  },
  policyBand:      { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 14 },
  policyBandInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  policyAvatarCircle: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  policyAvatarText: { fontSize: 13, fontWeight: '900', color: Colors.white },
  policyPlan:    { fontSize: 14, fontWeight: '800', color: Colors.white, marginBottom: 2 },
  policyInsurer: { fontSize: 11, color: 'rgba(255,255,255,0.75)' },
  statusPill: {
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

  // ── Recommended cards ─────────────────────
  recScroll: { gap: 14, paddingRight: 6, paddingBottom: 4 },
  recCard: {
    width: W * 0.72,
    backgroundColor: Colors.white,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 4,
  },

  // Header band
  recHeader: {
    paddingHorizontal: 14, paddingTop: 14, paddingBottom: 14,
    overflow: 'hidden',
  },
  recHeaderBg1: {
    position: 'absolute', width: 130, height: 130, borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.1)', top: -40, right: -30,
  },
  recHeaderBg2: {
    position: 'absolute', width: 70, height: 70, borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.08)', top: 20, right: 55,
  },
  recHeaderTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 12,
  },
  recInsurerCircle: {
    width: 42, height: 42, borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)',
  },
  recInsurerText: { fontSize: 14, fontWeight: '900', color: Colors.white },
  recFeaturedBadge: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20,
  },
  recFeaturedText: { fontSize: 9, fontWeight: '800', color: Colors.white, letterSpacing: 0.5 },
  recPlanName:   { fontSize: 16, fontWeight: '900', color: Colors.white, letterSpacing: -0.3, lineHeight: 21, marginBottom: 4 },
  recInsurerName: { fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },

  // Metrics
  recMetrics: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.bg,
  },
  recMetricBox:     { flex: 1 },
  recMetricDivider: { width: 1, height: 28, backgroundColor: Colors.border, marginHorizontal: 8 },
  recMetricLabel:   { fontSize: 9, fontWeight: '700', color: Colors.textLight, letterSpacing: 0.5, marginBottom: 3 },
  recMetricValue:   { fontSize: 13, fontWeight: '800', color: Colors.text },

  // Features
  recFeatures: { paddingHorizontal: 14, paddingVertical: 10, gap: 6 },
  recFeatureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recFeatureDot: { width: 6, height: 6, borderRadius: 3 },
  recFeatureText: { fontSize: 12, color: Colors.textMuted, flex: 1 },

  // Footer
  recFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingBottom: 14, paddingTop: 4,
  },
  recTypeChip: {
    fontSize: 9, fontWeight: '800', color: Colors.textMuted,
    letterSpacing: 0.8, backgroundColor: Colors.bg,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
    borderWidth: 1, borderColor: Colors.border,
  },
  recViewBtn:     { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  recViewBtnText: { fontSize: 12, fontWeight: '800', color: Colors.white },

  // ── Guest banner ──────────────────────────
  guestBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.white, borderRadius: 16,
    borderWidth: 1.5, borderColor: Colors.primary + '30',
    padding: 16, overflow: 'hidden',
  },
  guestBannerBg: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    backgroundColor: Colors.primaryLight, top: -40, right: -20,
  },
  guestBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  guestIconCircle: {
    width: 42, height: 42, borderRadius: 13,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  guestBannerTitle: { fontSize: 14, fontWeight: '800', color: Colors.text, marginBottom: 2 },
  guestBannerSub:   { fontSize: 11, color: Colors.textMuted },

  // ── Empty states ──────────────────────────
  emptyCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.white, borderRadius: 16,
    borderWidth: 1.5, borderColor: Colors.border,
    borderStyle: 'dashed', padding: 16,
  },
  emptyIconCircle: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  emptySub:   { fontSize: 12, color: Colors.textMuted },
  emptyArrow: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },

  ctaCard: {
    backgroundColor: Colors.primary, borderRadius: 18,
    padding: 18, overflow: 'hidden',
  },
  ctaBg1: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.06)', top: -50, right: -30 },
  ctaBg2: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.07)', top: 20, right: 55 },
  ctaBg3: { position: 'absolute', width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.05)', bottom: -15, right: 15 },
  ctaContent:   { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 16 },
  ctaIconCircle: {
    width: 52, height: 52, borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  ctaEyebrow: { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.55)', letterSpacing: 1.5, marginBottom: 4 },
  ctaTitle:   { fontSize: 17, fontWeight: '900', color: Colors.white, letterSpacing: -0.3, lineHeight: 23, marginBottom: 4 },
  ctaSub:     { fontSize: 12, color: 'rgba(255,255,255,0.65)' },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.white, borderRadius: 11, paddingVertical: 12,
  },
  ctaBtnText: { fontSize: 13, fontWeight: '800', color: Colors.primary },

  trustStrip: {
    flexDirection: 'row', justifyContent: 'center', gap: 18,
    paddingHorizontal: 18, paddingTop: 18, paddingBottom: 4,
  },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  trustText: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
});

const sk = StyleSheet.create({
  card: {
    width: 220, backgroundColor: Colors.white,
    borderRadius: 16, marginRight: 14,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  header:    { padding: 14, backgroundColor: Colors.bg },
  headerTop: { flexDirection: 'row', alignItems: 'center' },
  metrics: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  metricBox: { flex: 1 },
  features:  { paddingHorizontal: 14, paddingBottom: 12, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 10, gap: 4 },
  footer: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
});
