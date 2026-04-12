import React, { useState } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity,
  TextInput, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { PLANS } from '@/data/mock';
import { Icon } from '@/components/Icon';
import { Colors, BottomTabInset } from '@/constants/theme';

const CATEGORIES = ['All', 'Life', 'Health', 'Motor', 'Travel', 'Home'];

function PlanCard({ plan }: { plan: (typeof PLANS)[0] }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={pc.card}>
      {/* Top */}
      <View style={pc.top}>
        <View style={[pc.avatar, { backgroundColor: plan.color + '18' }]}>
          <Text style={[pc.avatarText, { color: plan.color }]}>{plan.short}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={pc.insurer}>{plan.insurer}</Text>
            {plan.badge ? (
              <View style={[pc.badge, { backgroundColor: plan.color + '18' }]}>
                <Text style={[pc.badgeText, { color: plan.color }]}>{plan.badge}</Text>
              </View>
            ) : null}
          </View>
          <Text style={pc.planName}>{plan.plan}</Text>
        </View>
        <View style={pc.claimBox}>
          <Text style={pc.claimLabel}>CLAIM</Text>
          <Text style={pc.claimValue}>{plan.claims}</Text>
        </View>
      </View>

      {/* Meta row */}
      <View style={pc.metaRow}>
        <View style={pc.metaItem}>
          <Text style={pc.metaLabel}>PREMIUM</Text>
          <Text style={[pc.metaValue, { color: plan.color }]}>{plan.premium}</Text>
        </View>
        <View style={[pc.metaItem, { alignItems: 'center' }]}>
          <Text style={pc.metaLabel}>COVER</Text>
          <Text style={pc.metaValue}>{plan.cover}</Text>
        </View>
        <View style={[pc.metaItem, { alignItems: 'flex-end' }]}>
          <Text style={pc.metaLabel}>CATEGORY</Text>
          <Text style={pc.metaValue}>{plan.category}</Text>
        </View>
      </View>

      {/* Features */}
      {expanded && (
        <View style={pc.features}>
          {plan.features.map(f => (
            <View key={f} style={pc.featureRow}>
              <View style={[pc.featureDot, { backgroundColor: plan.color + '18' }]}>
                <Text style={[pc.featureTick, { color: plan.color }]}>✓</Text>
              </View>
              <Text style={pc.featureText}>{f}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Actions */}
      <View style={pc.actions}>
        <TouchableOpacity onPress={() => setExpanded(!expanded)} style={pc.detailBtn}>
          <Text style={pc.detailBtnText}>{expanded ? 'Hide details ↑' : 'View details ↓'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[pc.quoteBtn, { backgroundColor: plan.color }]}
          onPress={() => router.push(`/plan/${plan.id}`)}
        >
          <Text style={pc.quoteBtnText}>Get Quote</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function PlansTab() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = PLANS.filter(p => {
    const matchCat    = activeCategory === 'All' || p.category === activeCategory;
    const matchSearch = search === '' ||
      p.insurer.toLowerCase().includes(search.toLowerCase()) ||
      p.plan.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Fixed header */}
      <View style={s.header}>
        <Text style={s.title}>Compare Plans</Text>
        <Text style={s.sub}>Find the best coverage for your needs</Text>

        <View style={s.searchBox}>
          <Icon name="search-outline" size={16} color={Colors.textLight} />
          <TextInput
            style={s.searchInput}
            placeholder="Search insurers or plans..."
            placeholderTextColor={Colors.textLight}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={{ fontSize: 16, color: Colors.textMuted, paddingRight: 4 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.filterList}
        >
          {CATEGORIES.map(c => (
            <TouchableOpacity
              key={c}
              onPress={() => setActiveCategory(c)}
              style={[s.chip, activeCategory === c && s.chipActive]}
            >
              <Text style={[s.chipText, activeCategory === c && s.chipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Plan list */}
      <ScrollView
        style={s.list}
        contentContainerStyle={{ padding: 16, paddingBottom: BottomTabInset + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.count}>
          {filtered.length} plan{filtered.length !== 1 ? 's' : ''} found
        </Text>

        {filtered.map(plan => <PlanCard key={plan.id} plan={plan} />)}

        {filtered.length === 0 && (
          <View style={s.empty}>
            <Icon name="search-outline" size={40} color={Colors.border} />
            <Text style={s.emptyTitle}>No plans found</Text>
            <Text style={s.emptySub}>Try a different category or search term</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.white },
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16, paddingTop: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title: { fontSize: 22, fontWeight: '900', color: Colors.text, letterSpacing: -0.4 },
  sub:   { fontSize: 13, color: Colors.textMuted, marginTop: 2, marginBottom: 14 },

  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.bg, borderRadius: 10,
    borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: 12, marginBottom: 12,
  },
  searchIcon:  { fontSize: 14 },
  searchInput: { flex: 1, paddingVertical: 11, fontSize: 14, color: Colors.text },

  filterList: { gap: 8, paddingBottom: 12 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1.5,
    borderColor: Colors.border, backgroundColor: Colors.white,
  },
  chipActive:     { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText:       { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  chipTextActive: { color: Colors.white },

  list:  { flex: 1, backgroundColor: Colors.bg },
  count: { fontSize: 12, color: Colors.textMuted, fontWeight: '600', marginBottom: 14, letterSpacing: 0.3 },

  empty:      { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyIcon:  { fontSize: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  emptySub:   { fontSize: 13, color: Colors.textMuted },
});

const pc = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16, marginBottom: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  badge: {
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8,
  },
  badgeText: { fontSize: 9, fontWeight: '700' },

  top: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, padding: 14, paddingBottom: 10,
  },
  avatar: {
    width: 46, height: 46, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '800' },
  insurer:    { fontSize: 13, fontWeight: '700', color: Colors.text },
  planName:   { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  claimBox:   { alignItems: 'flex-end' },
  claimLabel: { fontSize: 9, color: Colors.textLight, fontWeight: '600', letterSpacing: 0.3 },
  claimValue: { fontSize: 14, fontWeight: '700', color: Colors.success },

  metaRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: Colors.bg,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  metaItem:  { flex: 1 },
  metaLabel: { fontSize: 9, color: Colors.textLight, fontWeight: '600', letterSpacing: 0.3, marginBottom: 3 },
  metaValue: { fontSize: 13, fontWeight: '700', color: Colors.text },

  features: {
    paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8, gap: 9,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  featureRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureDot:  { width: 24, height: 24, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  featureTick: { fontSize: 11, fontWeight: '800' },
  featureText: { fontSize: 13, color: Colors.textMuted, flex: 1 },

  actions: {
    flexDirection: 'row', gap: 10,
    padding: 14, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  detailBtn:     {
    flex: 1, paddingVertical: 9, borderRadius: 10,
    borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center',
    backgroundColor: Colors.white,
  },
  detailBtnText: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
  quoteBtn:      { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center' },
  quoteBtnText:  { fontSize: 12, fontWeight: '700', color: Colors.white },
});
