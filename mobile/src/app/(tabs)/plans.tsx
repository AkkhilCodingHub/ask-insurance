import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FlatList, View, Text, TouchableOpacity,
  TextInput, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { plansApi, ApiPlan } from '@/lib/api';
import { Icon } from '@/components/Icon';
import { Colors, BottomTabInset } from '@/constants/theme';

const PAGE_SIZE = 10;

const CATEGORIES: { key: string; label: string; icon: string; color: string }[] = [
  { key: 'All',         label: 'All',         icon: 'grid-outline',        color: Colors.primary  },
  { key: 'life',        label: 'Life',         icon: 'heart-outline',       color: '#1580FF'       },
  { key: 'health',      label: 'Health',       icon: 'medkit-outline',      color: '#059669'       },
  { key: 'motor',       label: 'Motor',        icon: 'car-outline',         color: '#D97706'       },
  { key: 'travel',      label: 'Travel',       icon: 'airplane-outline',    color: '#0891B2'       },
  { key: 'home',        label: 'Home',         icon: 'home-outline',        color: '#7C3AED'       },
  { key: 'business',    label: 'Business',     icon: 'business-outline',    color: '#DC2626'       },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function planColor(plan: ApiPlan): string {
  return plan.insurer?.brandColor ?? '#1580FF';
}

function planShort(plan: ApiPlan): string {
  return (plan.insurer?.shortName ?? plan.insurer?.name ?? plan.name).slice(0, 2).toUpperCase();
}

function formatPremium(v: number): string {
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)} L/yr`;
  if (v >= 1000)   return `₹${(v / 1000).toFixed(1)}K/yr`;
  return `₹${v}/yr`;
}

function formatCover(v: number): string {
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(0)} Cr`;
  if (v >= 100000)   return `₹${(v / 100000).toFixed(0)} L`;
  if (v >= 1000)     return `₹${(v / 1000).toFixed(0)}K`;
  return `₹${v}`;
}

function parsedFeatures(plan: ApiPlan): string[] {
  try { return JSON.parse(plan.features) as string[]; }
  catch { return []; }
}

// ── Plan Card ─────────────────────────────────────────────────────────────────

function PlanCard({ plan }: { plan: ApiPlan }) {
  const router   = useRouter();
  const [expanded, setExpanded] = useState(false);
  const color    = planColor(plan);
  const short    = planShort(plan);
  const features = parsedFeatures(plan);

  return (
    <View style={pc.card}>
      {/* Top */}
      <View style={pc.top}>
        <View style={[pc.avatar, { backgroundColor: color + '18' }]}>
          <Text style={[pc.avatarText, { color }]}>{short}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={pc.insurer}>{plan.insurer?.name ?? '—'}</Text>
            {plan.isFeatured && (
              <View style={[pc.badge, { backgroundColor: color + '18' }]}>
                <Text style={[pc.badgeText, { color }]}>Featured</Text>
              </View>
            )}
          </View>
          <Text style={pc.planName}>{plan.name}</Text>
        </View>
        <View style={pc.claimBox}>
          <Text style={pc.claimLabel}>CLAIM</Text>
          <Text style={pc.claimValue}>{plan.insurer?.claimsRatio ?? 0}%</Text>
        </View>
      </View>

      {/* Meta row */}
      <View style={pc.metaRow}>
        <View style={pc.metaItem}>
          <Text style={pc.metaLabel}>PREMIUM</Text>
          <Text style={[pc.metaValue, { color }]}>{formatPremium(plan.basePremium)}</Text>
        </View>
        <View style={[pc.metaItem, { alignItems: 'center' }]}>
          <Text style={pc.metaLabel}>COVER</Text>
          <Text style={pc.metaValue}>{formatCover(plan.maxCover)}</Text>
        </View>
        <View style={[pc.metaItem, { alignItems: 'flex-end' }]}>
          <Text style={pc.metaLabel}>CATEGORY</Text>
          <Text style={pc.metaValue}>{CATEGORIES.find(c => c.key === plan.type)?.label ?? plan.type}</Text>
        </View>
      </View>

      {/* Features */}
      {expanded && features.length > 0 && (
        <View style={pc.features}>
          {features.map((f, i) => (
            <View key={i} style={pc.featureRow}>
              <View style={[pc.featureDot, { backgroundColor: color + '18' }]}>
                <Text style={[pc.featureTick, { color }]}>✓</Text>
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
          style={[pc.quoteBtn, { backgroundColor: color }]}
          onPress={() => router.push(`/plan/${plan.id}`)}
        >
          <Text style={pc.quoteBtnText}>Get Quote</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function PlansTab() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch]   = useState('');
  const [plans, setPlans]     = useState<ApiPlan[]>([]);
  const [page, setPage]       = useState(1);
  const [total, setTotal]     = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading]     = useState(true);   // initial / filter change
  const [loadingMore, setLoadingMore] = useState(false); // next-page load
  const [refreshing, setRefreshing]   = useState(false);
  const [error, setError]     = useState<string | null>(null);

  // Debounce timer ref for search
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch a specific page; if page === 1 replace list, else append
  const fetchPage = useCallback(async (
    pg: number,
    cat: string,
    q: string,
    isRefresh = false
  ) => {
    if (pg === 1) {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);
    try {
      const res = await plansApi.list({
        page: pg,
        limit: PAGE_SIZE,
        type: cat !== 'All' ? cat : undefined,
        search: q.trim() || undefined,
      });
      if (pg === 1) setPlans(res.plans);
      else setPlans(prev => [...prev, ...res.plans]);
      setTotal(res.total);
      setHasMore(res.hasMore);
      setPage(pg);
    } catch {
      setError('Could not load plans. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, []);

  // Reset to page 1 when category changes immediately
  useEffect(() => {
    fetchPage(1, activeCategory, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);

  // Debounce search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      fetchPage(1, activeCategory, search);
    }, 400);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleLoadMore = () => {
    if (!loadingMore && !loading && hasMore) {
      fetchPage(page + 1, activeCategory, search);
    }
  };

  const handleRefresh = () => {
    fetchPage(1, activeCategory, search, true);
  };

  // ── Render helpers ──────────────────────────────────────────────────────────

  const renderItem = useCallback(({ item }: { item: ApiPlan }) => (
    <PlanCard plan={item} />
  ), []);

  const keyExtractor = useCallback((item: ApiPlan) => item.id, []);

  const ListHeaderComponent = total > 0 ? (
    <Text style={s.count}>{total} plan{total !== 1 ? 's' : ''}</Text>
  ) : null;

  const ListEmptyComponent = !loading ? (
    <View style={s.empty}>
      <Icon name="search-outline" size={40} color={Colors.border} />
      <Text style={s.emptyTitle}>No plans found</Text>
      <Text style={s.emptySub}>Try a different category or search term</Text>
    </View>
  ) : null;

  const ListFooterComponent = (
    <View style={s.footer}>
      {loadingMore && (
        <View style={s.footerLoading}>
          <ActivityIndicator color={Colors.primary} size="small" />
          <Text style={s.footerText}>Loading more plans…</Text>
        </View>
      )}
      {!loadingMore && !hasMore && plans.length > 0 && (
        <Text style={s.footerEnd}>
          Showing all {plans.length} of {total} plan{total !== 1 ? 's' : ''}
        </Text>
      )}
    </View>
  );

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

        <FlatList
          horizontal
          data={CATEGORIES}
          keyExtractor={c => c.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.filterList}
          renderItem={({ item: cat }) => {
            const active = activeCategory === cat.key;
            return (
              <TouchableOpacity
                onPress={() => setActiveCategory(cat.key)}
                style={[s.chip, active && { backgroundColor: cat.color, borderColor: cat.color }]}
              >
                <Icon
                  name={cat.icon as any}
                  size={14}
                  color={active ? Colors.white : cat.color}
                />
                <Text style={[s.chipText, active && s.chipTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Error state */}
      {error && !loading && (
        <View style={s.errorBanner}>
          <Icon name="cloud-offline-outline" size={16} color={Colors.error} />
          <Text style={s.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => fetchPage(1, activeCategory, search)}>
            <Text style={s.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Initial loading */}
      {loading && (
        <View style={s.centred}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}

      {/* Plan list */}
      {!loading && (
        <FlatList
          data={plans}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          ListHeaderComponent={ListHeaderComponent}
          ListEmptyComponent={ListEmptyComponent}
          ListFooterComponent={ListFooterComponent}
          removeClippedSubviews
        />
      )}
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

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
  searchInput: { flex: 1, paddingVertical: 11, fontSize: 14, color: Colors.text },

  filterList: { gap: 8, paddingBottom: 12 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 13, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1.5,
    borderColor: Colors.border, backgroundColor: Colors.white,
  },
  chipActive:     {},
  chipText:       { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  chipTextActive: { color: Colors.white },

  listContent: { padding: 16, paddingBottom: BottomTabInset + 24 },
  count:       { fontSize: 11, color: Colors.textLight, fontWeight: '500', marginBottom: 12, letterSpacing: 0.2 },

  centred:    { flex: 1, paddingTop: 80, alignItems: 'center' },
  empty:      { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  emptySub:   { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },

  footer:        { paddingTop: 12, paddingBottom: 8, alignItems: 'center' },
  footerLoading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  footerText:    { fontSize: 13, color: Colors.textMuted },
  footerEnd:     { fontSize: 12, color: Colors.textLight, fontWeight: '500' },

  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEF2F2', paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#FECACA',
  },
  errorText: { flex: 1, fontSize: 13, color: Colors.error },
  retryText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
});

const pc = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16, marginBottom: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  badge:     { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
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
  detailBtn: {
    flex: 1, paddingVertical: 9, borderRadius: 10,
    borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center',
    backgroundColor: Colors.white,
  },
  detailBtnText: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
  quoteBtn:      { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center' },
  quoteBtnText:  { fontSize: 12, fontWeight: '700', color: Colors.white },
});
