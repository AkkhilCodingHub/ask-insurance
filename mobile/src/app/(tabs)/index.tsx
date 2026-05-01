import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Dimensions, RefreshControl, Animated, Platform,
} from 'react-native';
import type { ComponentProps } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/auth';
import { usersApi, plansApi, ApiPolicy, ApiPlan, DashboardData } from '@/lib/api';
import { Icon } from '@/components/Icon';
import { Colors, BottomTabInset } from '@/constants/theme';

const { width: W } = Dimensions.get('window');

const TYPE_ICONS: Record<string, string> = {
  life: 'heart-outline', health: 'medical-outline', motor: 'car-outline', travel: 'airplane-outline',
  home: 'home-outline', business: 'briefcase-outline',
};

const POLICY_STATUS_META: Record<string, { label: string; color: string; bg: string; icon: ComponentProps<typeof Icon>['name'] }> = {
  active:    { label: 'Active',    color: '#059669', bg: '#ECFDF5', icon: 'checkmark-circle' },
  pending:   { label: 'Pending',   color: '#B45309', bg: '#FFFBEB', icon: 'time-outline' },
  expired:   { label: 'Expired',   color: '#B91C1C', bg: '#FEF2F2', icon: 'alert-circle-outline' },
  cancelled: { label: 'Cancelled', color: '#475569', bg: '#F1F5F9', icon: 'remove-circle-outline' },
};

const CATEGORIES: { key: string; label: string }[] = [
  { key: 'life', label: 'Life' }, { key: 'health', label: 'Health' }, { key: 'motor', label: 'Motor' },
  { key: 'travel', label: 'Travel' }, { key: 'home', label: 'Home' }, { key: 'business', label: 'Business' },
];

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
      <View style={sk.top}>
        <Shimmer width={48} height={48} borderRadius={12} />
        <View style={{ flex: 1, gap: 8 }}>
          <Shimmer width="50%" height={12} borderRadius={5} />
          <Shimmer width="90%" height={16} borderRadius={5} />
          <Shimmer width="40%" height={10} borderRadius={4} />
        </View>
      </View>
      <View style={sk.statGrid}>
        <Shimmer width="28%" height={24} borderRadius={4} />
        <Shimmer width="28%" height={24} borderRadius={4} />
        <Shimmer width="28%" height={24} borderRadius={4} />
      </View>
      <View style={sk.features}>
        <Shimmer width="92%" height={10} borderRadius={4} />
        <Shimmer width="75%" height={10} borderRadius={4} />
      </View>
      <View style={sk.footer}>
        <Shimmer width={56} height={18} borderRadius={6} />
        <Shimmer width={100} height={32} borderRadius={10} />
      </View>
    </View>
  );
}

const QUICK_ACTIONS = [
  { icon: 'document-text-outline', label: 'Compare\nPlans',  route: '/plans'   },
  { icon: 'shield-outline',        label: 'My\nPolicies',    route: '/profile' },
  { icon: 'add-circle-outline',    label: 'File\nClaim',     route: '/claims'  },
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
  const { user, refreshUser } = useAuth();

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

          {/* KYC banner — shown for logged-in users with pending KYC */}
          {user && user.kycStatus !== 'verified' && (
            <View style={s.section}>
              <TouchableOpacity
                style={s.kycBanner}
                activeOpacity={0.85}
                onPress={() => router.push('/kyc')}
              >
                <View style={s.kycBannerBg} />
                <View style={s.kycBannerLeft}>
                  <View style={s.kycIconCircle}>
                    <Icon name="shield-outline" size={20} color="#D97706" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.kycBannerTitle}>Complete your KYC</Text>
                    <Text style={s.kycBannerSub}>Verify identity via DigiLocker to buy policies</Text>
                  </View>
                </View>
                <View style={s.kycBannerCta}>
                  <Text style={s.kycBannerCtaText}>Verify</Text>
                  <Icon name="arrow-forward-outline" size={14} color="#D97706" />
                </View>
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
                    const st = POLICY_STATUS_META[p.status] ?? POLICY_STATUS_META.pending;
                    const iconName = (TYPE_ICONS[typeStr] ?? 'document-text-outline') as ComponentProps<typeof Icon>['name'];
                    return (
                      <TouchableOpacity
                        key={p.id}
                        style={s.policyCard}
                        activeOpacity={0.88}
                        onPress={() => router.push('/my-policies')}
                      >
                        <View style={s.policyInner}>
                          <View style={s.policyTop}>
                            <View style={[s.policyIconRing, { borderColor: color + '22' }]}>
                              <View style={[s.policyIconInner, { backgroundColor: color + '12' }]}>
                                <Icon name={iconName} size={20} color={color} />
                              </View>
                            </View>
                            <View style={{ flex: 1, minWidth: 0 }}>
                              <Text style={s.policyNum} numberOfLines={1}>{p.policyNumber}</Text>
                              <Text style={s.policyProvider} numberOfLines={1}>{providerStr || '—'}</Text>
                            </View>
                            <View style={[s.policyStatusTag, { backgroundColor: st.bg, borderColor: st.color + '2A' }]}>
                              <Icon name={st.icon} size={12} color={st.color} />
                              <Text style={[s.policyStatusText, { color: st.color }]}>{st.label}</Text>
                            </View>
                          </View>
                          <View style={s.policyStatGrid}>
                            <View style={s.policyStatCell}>
                              <Text style={s.policyStatLbl}>Cover</Text>
                              <Text style={s.policyStatVal}>{formatCover(p.sumInsured)}</Text>
                            </View>
                            <View style={s.policyStatSep} />
                            <View style={s.policyStatCell}>
                              <Text style={s.policyStatLbl}>Premium</Text>
                              <Text style={[s.policyStatVal, { color }]}>{formatPremium(p.premium)}</Text>
                            </View>
                            <View style={s.policyStatSep} />
                            <View style={[s.policyStatCell, s.policyStatCellLast]}>
                              <Text style={s.policyStatLbl}>Type</Text>
                              <Text style={s.policyStatVal} numberOfLines={1}>{capitalize(typeStr)}</Text>
                            </View>
                          </View>
                          <View style={s.policyFooter}>
                            <Icon name="calendar-outline" size={14} color={Colors.textLight} />
                            <Text style={s.policyDue}>Renews / ends {due}</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
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
                  const claimPct = plan.insurer?.claimsRatio ?? 0;
                  const typeLabel  = CATEGORIES.find(c => c.key === plan.type)?.label ?? capitalize(plan.type);

                  return (
                    <TouchableOpacity
                      key={plan.id}
                      style={s.recCard}
                      activeOpacity={0.88}
                      onPress={() => router.push(`/plan/${plan.id}`)}
                    >
                      <View style={s.recBody}>
                        <View style={s.recTop}>
                          <View style={[s.recAvatar, { borderColor: color + '30' }]}>
                            <View style={[s.recAvatarInner, { backgroundColor: color + '10' }]}>
                              <Text style={[s.recAvatarText, { color }]}>{short}</Text>
                            </View>
                          </View>
                          <View style={s.recTopMain}>
                            <View style={s.recTitleRow}>
                              <Text style={s.recInsurerLab} numberOfLines={1}>{plan.insurer?.name ?? '—'}</Text>
                              {plan.isFeatured && (
                                <View style={[s.recBadge, { borderColor: color + '40' }]}>
                                  <Text style={[s.recBadgeText, { color }]}>Featured</Text>
                                </View>
                              )}
                            </View>
                            <Text style={s.recPlanTitle} numberOfLines={2}>{plan.name}</Text>
                            <View style={s.recPills}>
                              <View style={s.recPill}>
                                <Text style={s.recPillText}>{typeLabel}</Text>
                              </View>
                              <View style={s.recPill}>
                                <Text style={s.recPillMuted}>{claimPct ? `${claimPct}% claims` : 'Top insurer'}</Text>
                              </View>
                            </View>
                          </View>
                        </View>

                        <View style={s.recStatGrid}>
                          <View style={s.recStatCell}>
                            <Text style={s.recStatLbl}>Premium</Text>
                            <Text style={[s.recStatVal, { color }]}>{premium}</Text>
                          </View>
                          <View style={s.recStatSep} />
                          <View style={s.recStatCell}>
                            <Text style={s.recStatLbl}>Cover</Text>
                            <Text style={s.recStatVal}>{cover}</Text>
                          </View>
                          <View style={s.recStatSep} />
                          <View style={[s.recStatCell, s.recStatCellEnd]}>
                            <Text style={s.recStatLbl}>Insurer</Text>
                            <Text style={s.recStatVal} numberOfLines={1}>
                              {plan.insurer?.shortName ?? (plan.insurer?.name ? plan.insurer.name.split(' ')[0] : '—')}
                            </Text>
                          </View>
                        </View>

                        {features.length > 0 && (
                          <View style={s.recFeatureBlock}>
                            {features.slice(0, 2).map((f, fi) => (
                              <View key={fi} style={s.recFeatRow}>
                                <View style={[s.recFeatTick, { borderColor: color + '30' }]}>
                                  <Text style={[s.recFeatTickMark, { color }]}>✓</Text>
                                </View>
                                <Text style={s.recFeatTxt} numberOfLines={2}>{f}</Text>
                              </View>
                            ))}
                          </View>
                        )}

                        <View style={s.recCardFooter}>
                          <Text style={s.recTypeTxt}>{(plan.type ?? 'plan').toUpperCase()}</Text>
                          <View style={[s.recViewCta, { backgroundColor: color }]}>
                            <Text style={s.recViewCtaText}>View plan</Text>
                            <Icon name="chevron-forward" size={16} color={Colors.white} />
                          </View>
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
    borderRadius: 14, padding: 14,
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.35)',
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

  section:    { paddingHorizontal: 20, paddingTop: 22, marginBottom: 2 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.text, letterSpacing: -0.3, marginBottom: 14 },
  viewAll:    { fontSize: 13, color: Colors.primary, fontWeight: '600' },

  actionsGrid: { flexDirection: 'row', gap: 12 },
  actionCard: {
    flex: 1, backgroundColor: Colors.white,
    borderRadius: 14, paddingVertical: 16, paddingHorizontal: 10,
    alignItems: 'center', gap: 10,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border,
    ...Platform.select({
      ios: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
      android: { elevation: 1 },
    }),
  },
  actionIconWrap: {
    width: 44, height: 44, borderRadius: 13,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  actionIconPrimary: { backgroundColor: Colors.primary },
  actionLabel: { fontSize: 11, fontWeight: '700', color: Colors.text, textAlign: 'center', lineHeight: 16 },

  hScroll: { gap: 16, paddingRight: 8, paddingBottom: 4, paddingLeft: 2 },

  policyCard: {
    width: W * 0.78,
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
      android: { elevation: 1 },
    }),
  },
  policyInner:  { padding: 18 },
  policyTop:    { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  policyIconRing: { borderWidth: 1, borderRadius: 12, padding: 1 },
  policyIconInner: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  policyNum:    { fontSize: 14, fontWeight: '800', color: Colors.text, letterSpacing: -0.2 },
  policyProvider:{ fontSize: 11, color: Colors.textMuted, marginTop: 2, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  policyStatusTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, borderWidth: 1, flexShrink: 0, maxWidth: 108,
  },
  policyStatusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.15 },

  policyStatGrid: {
    flexDirection: 'row', paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderColor: Colors.border,
  },
  policyStatCell: { flex: 1, alignItems: 'flex-start', gap: 4 },
  policyStatCellLast: { alignItems: 'flex-end' },
  policyStatSep: { width: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginHorizontal: 6, alignSelf: 'stretch' },
  policyStatLbl: { fontSize: 10, color: Colors.textMuted, fontWeight: '600' },
  policyStatVal: { fontSize: 14, fontWeight: '800', color: Colors.text, letterSpacing: -0.3 },

  policyFooter: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 4, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderColor: Colors.border,
  },
  policyDue: { fontSize: 12, color: Colors.textLight, fontWeight: '500' },

  recScroll: { gap: 16, paddingRight: 8, paddingBottom: 4, paddingLeft: 2 },
  recCard: {
    width: W * 0.78,
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: 2,
    ...Platform.select({
      ios: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
      android: { elevation: 1 },
    }),
  },
  recBody:    { paddingBottom: 4 },
  recTop:     { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 },
  recAvatar:  { width: 48, height: 48, borderRadius: 12, borderWidth: 1, padding: 2 },
  recAvatarInner: { flex: 1, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  recAvatarText:{ fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  recTopMain: { flex: 1, minWidth: 0, gap: 4 },
  recTitleRow:{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  recInsurerLab: { fontSize: 11, fontWeight: '800', color: Colors.text, letterSpacing: -0.2, textTransform: 'uppercase' },
  recBadge:   { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, backgroundColor: Colors.white },
  recBadgeText:{ fontSize: 9, fontWeight: '800', letterSpacing: 0.2 },
  recPlanTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, lineHeight: 20, letterSpacing: -0.2 },
  recPills:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  recPill:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: Colors.bg },
  recPillText:{ fontSize: 11, fontWeight: '600', color: Colors.textMuted },
  recPillMuted:{ fontSize: 11, fontWeight: '500', color: Colors.textLight },

  recStatGrid: {
    flexDirection: 'row', alignItems: 'stretch',
    marginHorizontal: 16, marginTop: 12, marginBottom: 4,
    borderRadius: 10, borderWidth: 1, borderColor: '#E8EEF4', backgroundColor: '#FAFBFD',
  },
  recStatCell: { flex: 1, paddingVertical: 12, paddingHorizontal: 8 },
  recStatCellEnd: { alignItems: 'flex-end' },
  recStatSep: { width: 1, backgroundColor: '#E8EEF4' },
  recStatLbl: { fontSize: 9, color: Colors.textLight, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 4 },
  recStatVal: { fontSize: 13, fontWeight: '800', color: Colors.text, letterSpacing: -0.3 },

  recFeatureBlock: { paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  recFeatRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  recFeatTick: { width: 20, height: 20, borderRadius: 6, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  recFeatTickMark: { fontSize: 9, fontWeight: '800' },
  recFeatTxt:  { fontSize: 12, color: Colors.textMuted, flex: 1, lineHeight: 17 },

  recCardFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14, gap: 10,
  },
  recTypeTxt: { fontSize: 10, fontWeight: '800', color: Colors.textMuted, letterSpacing: 0.6 },
  recViewCta: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
  },
  recViewCtaText: { fontSize: 13, fontWeight: '800', color: Colors.white },

  // ── Guest banner ──────────────────────────
  guestBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.white, borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border,
    padding: 18, overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
      android: { elevation: 1 },
    }),
  },
  guestBannerBg: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    backgroundColor: Colors.primaryLight, top: -36, right: -24, opacity: 0.5,
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

  // ── KYC banner ────────────────────────────
  kycBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFFBEB',
    borderRadius: 14, borderWidth: 1, borderColor: '#FDE68A',
    padding: 16, overflow: 'hidden',
  },
  kycBannerBg: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#FEF3C7', top: -36, right: -24, opacity: 0.6,
  },
  kycBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  kycIconCircle: {
    width: 42, height: 42, borderRadius: 13,
    backgroundColor: '#FEF3C7',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  kycBannerTitle: { fontSize: 14, fontWeight: '800', color: '#92400E', marginBottom: 2 },
  kycBannerSub:   { fontSize: 11, color: '#B45309' },
  kycBannerCta: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: '#FEF3C7', borderRadius: 10, borderWidth: 1, borderColor: '#FDE68A',
    flexShrink: 0,
  },
  kycBannerCtaText: { fontSize: 12, fontWeight: '800', color: '#D97706' },

  // ── Empty states ──────────────────────────
  emptyCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.white, borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border,
    borderStyle: 'dashed', padding: 18,
    ...Platform.select({
      ios: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2 },
      android: { elevation: 1 },
    }),
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
    width: W * 0.78, backgroundColor: Colors.white,
    borderRadius: 14, marginRight: 16, padding: 16, gap: 12,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border,
  },
  top:    { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  statGrid: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  features: { gap: 8, paddingTop: 4 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border },
});
