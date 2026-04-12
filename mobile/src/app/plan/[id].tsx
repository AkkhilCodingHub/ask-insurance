import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { PLANS } from '@/data/mock';
import { Icon } from '@/components/Icon';
import { Colors } from '@/constants/theme';

export default function PlanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();
  const plan    = PLANS.find(p => p.id === id);

  if (!plan) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <Icon name="search-outline" size={40} color={Colors.border} />
          <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.text }}>Plan not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={s.backPillBtn}>
            <Text style={s.backPillText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={[s.header, { borderBottomColor: plan.color + '40' }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>{plan.insurer}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ─────────────────────────────────── */}
        <View style={[s.hero, { backgroundColor: plan.color + '12' }]}>
          <View style={[s.heroAvatar, { backgroundColor: plan.color + '22' }]}>
            <Text style={[s.heroAvatarText, { color: plan.color }]}>{plan.short}</Text>
          </View>
          {plan.badge ? (
            <View style={[s.badge, { backgroundColor: plan.color }]}>
              <Text style={s.badgeText}>{plan.badge}</Text>
            </View>
          ) : null}
          <Text style={s.planName}>{plan.plan}</Text>
          <Text style={s.planInsurer}>{plan.insurer} · {plan.category}</Text>

          <View style={s.keyMetrics}>
            <View style={s.metric}>
              <Text style={[s.metricValue, { color: plan.color }]}>{plan.premium}</Text>
              <Text style={s.metricLabel}>PREMIUM</Text>
            </View>
            <View style={s.metricDivider} />
            <View style={s.metric}>
              <Text style={s.metricValue}>{plan.cover}</Text>
              <Text style={s.metricLabel}>COVER</Text>
            </View>
            <View style={s.metricDivider} />
            <View style={s.metric}>
              <Text style={[s.metricValue, { color: Colors.success }]}>{plan.claims}</Text>
              <Text style={s.metricLabel}>CLAIM RATIO</Text>
            </View>
          </View>
        </View>

        {/* ── About ─────────────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>About this plan</Text>
          <Text style={s.description}>{plan.description}</Text>
        </View>

        {/* ── Features ──────────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Key features</Text>
          <View style={s.featureList}>
            {plan.features.map((f, i) => (
              <View key={i} style={s.featureRow}>
                <View style={[s.featureTick, { backgroundColor: plan.color + '18' }]}>
                  <Text style={[s.featureTickText, { color: plan.color }]}>✓</Text>
                </View>
                <Text style={s.featureText}>{f}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Policy details ────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Policy details</Text>
          <View style={s.detailsCard}>
            <View style={s.detailRow}>
              <Text style={s.detailLabel}>Tenure</Text>
              <Text style={s.detailValue}>{plan.tenure}</Text>
            </View>
            <View style={s.detailDivider} />
            <View style={s.detailRow}>
              <Text style={s.detailLabel}>Waiting period</Text>
              <Text style={s.detailValue}>{plan.waiting}</Text>
            </View>
            <View style={s.detailDivider} />
            <View style={s.detailRow}>
              <Text style={s.detailLabel}>Category</Text>
              <Text style={s.detailValue}>{plan.category}</Text>
            </View>
            <View style={s.detailDivider} />
            <View style={s.detailRow}>
              <Text style={s.detailLabel}>Claim settlement</Text>
              <Text style={[s.detailValue, { color: Colors.success }]}>{plan.claims}</Text>
            </View>
          </View>
        </View>

        {/* ── Documents ─────────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Documents required</Text>
          <View style={s.docList}>
            {plan.documents.map((doc, i) => (
              <View key={i} style={s.docRow}>
                <Icon name="document-outline" size={18} color={Colors.textMuted} />
                <Text style={s.docText}>{doc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Trust badges ──────────────────────────── */}
        <View style={s.trustRow}>
          {['IRDAI Approved', 'Instant Policy', 'Secure Payment', '24×7 Support'].map(t => (
            <View key={t} style={s.trustChip}>
              <Text style={s.trustText}>✓ {t}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* ── Sticky CTA ─────────────────────────────── */}
      <View style={s.stickyBar}>
        <View>
          <Text style={s.stickyPremium}>{plan.premium}</Text>
          <Text style={s.stickyCover}>Cover: {plan.cover}</Text>
        </View>
        <TouchableOpacity
          style={[s.ctaBtn, { backgroundColor: plan.color }]}
          activeOpacity={0.85}
          onPress={() => router.push('/quote')}
        >
          <Text style={s.ctaBtnText}>Get Quote →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: Colors.white },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
  },
  backBtn:     { width: 60 },
  backText:    { fontSize: 15, color: Colors.primary, fontWeight: '600' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },

  backPillBtn: {
    paddingHorizontal: 20, paddingVertical: 10,
    backgroundColor: Colors.primary, borderRadius: 10,
  },
  backPillText: { fontSize: 14, fontWeight: '700', color: Colors.white },

  scroll: { flex: 1 },

  hero: {
    padding: 24, alignItems: 'center',
  },
  heroAvatar: {
    width: 80, height: 80, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  heroAvatarText: { fontSize: 28, fontWeight: '900' },
  badge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginBottom: 10,
  },
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

  section: {
    paddingHorizontal: 20, paddingVertical: 16,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.text, marginBottom: 12 },
  description:  { fontSize: 14, color: Colors.textMuted, lineHeight: 22 },

  featureList: { gap: 10 },
  featureRow:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureTick: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  featureTickText: { fontSize: 13, fontWeight: '800' },
  featureText:     { fontSize: 14, color: Colors.textMuted, flex: 1 },

  detailsCard: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: 14,
    overflow: 'hidden', backgroundColor: Colors.bg,
  },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  detailDivider: { height: 1, backgroundColor: Colors.border },
  detailLabel:   { fontSize: 13, color: Colors.textMuted },
  detailValue:   { fontSize: 14, fontWeight: '700', color: Colors.text },

  docList: { gap: 10 },
  docRow:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  docIcon: { fontSize: 18 },
  docText: { fontSize: 14, color: Colors.textMuted, flex: 1 },

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
    paddingHorizontal: 20, paddingVertical: 14,
    paddingBottom: 28,
  },
  stickyPremium: { fontSize: 18, fontWeight: '900', color: Colors.text, letterSpacing: -0.3 },
  stickyCover:   { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  ctaBtn: {
    paddingHorizontal: 28, paddingVertical: 13, borderRadius: 12,
  },
  ctaBtnText: { fontSize: 15, fontWeight: '800', color: Colors.white },
});
