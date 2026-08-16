import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { plansApi, ApiPlan } from '@/lib/api';
import { Icon } from '@/components/Icon';
import { BackButton } from '@/components/BackButton';
import { Colors } from '@/constants/theme';
import { useThemeColors } from '@/context/agent';

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

export default function PlanDetailScreen() {
  const { id }  = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();
  const colors  = useThemeColors();

  const [plan, setPlan]       = useState<ApiPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  useEffect(() => {
    if (!id) return;
    plansApi.get(id)
      .then(({ plan: p }) => setPlan(p))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: colors.bg }]}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !plan) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: colors.bg }]}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <Icon name="search-outline" size={40} color={colors.border} />
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>Plan not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={s.backPillBtn}>
            <Text style={s.backPillText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const color    = plan.insurer?.brandColor ?? '#1580FF';
  const short    = (plan.insurer?.shortName ?? plan.insurer?.name ?? plan.name).slice(0, 2).toUpperCase();
  const features = (() => { try { return JSON.parse(plan.features) as string[]; } catch { return []; } })();

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.card, borderBottomColor: color + '40' }]}>
        <BackButton />
        <Text style={[s.headerTitle, { color: colors.text }]}>{plan.insurer?.name ?? plan.name}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={[s.hero, { backgroundColor: color + '12' }]}>
          <View style={[s.heroAvatar, { backgroundColor: color + '22' }]}>
            <Text style={[s.heroAvatarText, { color }]}>{short}</Text>
          </View>
          {plan.isFeatured && (
            <View style={[s.badge, { backgroundColor: color }]}>
              <Text style={s.badgeText}>Featured</Text>
            </View>
          )}
          <Text style={[s.planName, { color: colors.text }]}>{plan.name}</Text>
          <Text style={[s.planInsurer, { color: colors.textMuted }]}>{plan.insurer?.name} · {plan.type}</Text>

          <View style={[s.keyMetrics, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={s.metric}>
              <Text style={[s.metricValue, { color }]}>{formatPremium(plan.basePremium)}</Text>
              <Text style={[s.metricLabel, { color: colors.textMuted }]}>PREMIUM</Text>
            </View>
            <View style={[s.metricDivider, { backgroundColor: colors.border }]} />
            <View style={s.metric}>
              <Text style={[s.metricValue, { color: colors.text }]}>{formatCover(plan.maxCover)}</Text>
              <Text style={[s.metricLabel, { color: colors.textMuted }]}>COVER</Text>
            </View>
            <View style={[s.metricDivider, { backgroundColor: colors.border }]} />
            <View style={s.metric}>
              <Text style={[s.metricValue, { color: Colors.success }]}>{plan.insurer?.claimsRatio ?? 0}%</Text>
              <Text style={[s.metricLabel, { color: colors.textMuted }]}>CLAIM RATIO</Text>
            </View>
          </View>
        </View>

        {/* About */}
        <View style={[s.section, { borderTopColor: colors.border }]}>
          <Text style={[s.sectionTitle, { color: colors.text }]}>About this plan</Text>
          <Text style={[s.description, { color: colors.textMuted }]}>{plan.description}</Text>
        </View>

        {/* Features */}
        {features.length > 0 && (
          <View style={[s.section, { borderTopColor: colors.border }]}>
            <Text style={[s.sectionTitle, { color: colors.text }]}>Key features</Text>
            <View style={s.featureList}>
              {features.map((f, i) => (
                <View key={i} style={s.featureRow}>
                  <View style={[s.featureTick, { backgroundColor: color + '18' }]}>
                    <Text style={[s.featureTickText, { color }]}>✓</Text>
                  </View>
                  <Text style={[s.featureText, { color: colors.textMuted }]}>{f}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Policy details */}
        <View style={[s.section, { borderTopColor: colors.border }]}>
          <Text style={[s.sectionTitle, { color: colors.text }]}>Policy details</Text>
          <View style={[s.detailsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={s.detailRow}>
              <Text style={[s.detailLabel, { color: colors.textMuted }]}>Min cover</Text>
              <Text style={[s.detailValue, { color: colors.text }]}>{formatCover(plan.minCover)}</Text>
            </View>
            <View style={[s.detailDivider, { backgroundColor: colors.border }]} />
            <View style={s.detailRow}>
              <Text style={[s.detailLabel, { color: colors.textMuted }]}>Max cover</Text>
              <Text style={[s.detailValue, { color: colors.text }]}>{formatCover(plan.maxCover)}</Text>
            </View>
            {plan.minAge != null && (
              <>
                <View style={[s.detailDivider, { backgroundColor: colors.border }]} />
                <View style={s.detailRow}>
                  <Text style={[s.detailLabel, { color: colors.textMuted }]}>Eligible age</Text>
                  <Text style={[s.detailValue, { color: colors.text }]}>{plan.minAge}–{plan.maxAge ?? '—'} years</Text>
                </View>
              </>
            )}
            <View style={[s.detailDivider, { backgroundColor: colors.border }]} />
            <View style={s.detailRow}>
              <Text style={[s.detailLabel, { color: colors.textMuted }]}>Category</Text>
              <Text style={[s.detailValue, { color: colors.text }]}>{plan.type.charAt(0).toUpperCase() + plan.type.slice(1)}</Text>
            </View>
            <View style={[s.detailDivider, { backgroundColor: colors.border }]} />
            <View style={s.detailRow}>
              <Text style={[s.detailLabel, { color: colors.textMuted }]}>Claim settlement</Text>
              <Text style={[s.detailValue, { color: Colors.success }]}>{plan.insurer?.claimsRatio ?? 0}%</Text>
            </View>
          </View>
        </View>

        {/* Trust badges */}
        <View style={[s.trustRow, { backgroundColor: colors.bgWarm, borderTopColor: colors.border }]}>
          {['IRDAI Approved', 'Instant Policy', 'Secure Payment', '24×7 Support'].map(t => (
            <View key={t} style={[s.trustChip, { backgroundColor: colors.primaryLight, borderColor: colors.primary + '30' }]}>
              <Text style={s.trustText}>✓ {t}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View style={[s.stickyBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={[s.stickyPremium, { color: colors.text }]}>{formatPremium(plan.basePremium)}</Text>
          <Text style={[s.stickyCover, { color: colors.textMuted }]}>Cover: {formatCover(plan.maxCover)}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            style={[s.ctaBtn, { backgroundColor: colors.isDark ? '#1E293B' : '#F1F5F9', borderWidth: 1, borderColor: color, paddingHorizontal: 16 }]}
            activeOpacity={0.85}
            onPress={() => router.push({ pathname: '/quote', params: { planId: plan.id, type: plan.type, planName: plan.name, minCover: plan.minCover, maxCover: plan.maxCover } })}
          >
            <Text style={[s.ctaBtnText, { color }]}>Get Quote</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.ctaBtn, { backgroundColor: color, paddingHorizontal: 20 }]}
            activeOpacity={0.85}
            onPress={() => router.push({ pathname: '/buy-policy' as any, params: { planId: plan.id, type: plan.type, planName: plan.name } })}
          >
            <Text style={s.ctaBtnText}>⚡ Buy Policy Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: Colors.white },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: Colors.white, borderBottomWidth: 1,
  },
  headerTitle:  { fontSize: 16, fontWeight: '700', color: Colors.text },
  backPillBtn:  { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: Colors.primary, borderRadius: 10 },
  backPillText: { fontSize: 14, fontWeight: '700', color: Colors.white },

  scroll: { flex: 1 },

  hero: { padding: 24, alignItems: 'center' },
  heroAvatar: {
    width: 80, height: 80, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  heroAvatarText: { fontSize: 28, fontWeight: '900' },
  badge:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginBottom: 10 },
  badgeText: { fontSize: 11, fontWeight: '700', color: Colors.white },
  planName: {
    fontSize: 22, fontWeight: '900', color: Colors.text, letterSpacing: -0.4,
    textAlign: 'center', marginBottom: 4,
  },
  planInsurer: { fontSize: 14, color: Colors.textMuted, marginBottom: 20 },

  keyMetrics: {
    flexDirection: 'row', backgroundColor: Colors.white,
    borderRadius: 14, borderWidth: 1, borderColor: Colors.border,
    paddingVertical: 14, paddingHorizontal: 10, width: '100%',
  },
  metric:        { flex: 1, alignItems: 'center' },
  metricDivider: { width: 1, backgroundColor: Colors.border },
  metricValue:   { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 3 },
  metricLabel:   { fontSize: 9, color: Colors.textLight, fontWeight: '600', letterSpacing: 0.5 },

  section: { paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: Colors.border },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.text, marginBottom: 12 },
  description:  { fontSize: 14, color: Colors.textMuted, lineHeight: 22 },

  featureList: { gap: 10 },
  featureRow:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureTick: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  featureTickText: { fontSize: 13, fontWeight: '800' },
  featureText:     { fontSize: 14, color: Colors.textMuted, flex: 1 },

  detailsCard:   { borderWidth: 1, borderColor: Colors.border, borderRadius: 14, overflow: 'hidden', backgroundColor: Colors.bg },
  detailRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  detailDivider: { height: 1, backgroundColor: Colors.border },
  detailLabel:   { fontSize: 13, color: Colors.textMuted },
  detailValue:   { fontSize: 14, fontWeight: '700', color: Colors.text },

  trustRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    paddingHorizontal: 20, paddingVertical: 16,
    borderTopWidth: 1, borderTopColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  trustChip: {
    paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: Colors.primaryLight, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.primary + '30',
  },
  trustText: { fontSize: 11, color: Colors.primary, fontWeight: '600' },

  stickyBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderTopWidth: 1, borderTopColor: Colors.border,
    paddingHorizontal: 20, paddingVertical: 14, paddingBottom: 28,
  },
  stickyPremium: { fontSize: 18, fontWeight: '900', color: Colors.text, letterSpacing: -0.3 },
  stickyCover:   { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  ctaBtn: { paddingHorizontal: 28, paddingVertical: 13, borderRadius: 12 },
  ctaBtnText: { fontSize: 15, fontWeight: '800', color: Colors.white },
});
