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
import { authFieldStyles as af } from '@/constants/authFieldStyles';

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
  const claimPct = plan.insurer?.claimsRatio ?? 0;

  return (
    <View style={pc.card}>
      <View style={pc.cardBody}>
        {/* Top */}
        <View style={pc.top}>
          <View style={[pc.avatar, { borderColor: color + '30' }]}>
            <View style={[pc.avatarInner, { backgroundColor: color + '10' }]}>
              <Text style={[pc.avatarText, { color }]}>{short}</Text>
            </View>
          </View>
          <View style={pc.topMain}>
            <View style={pc.titleRow}>
              <Text style={pc.insurer} numberOfLines={1}>{plan.insurer?.name ?? '—'}</Text>
              {plan.isFeatured && (
                <View style={[pc.badge, { borderColor: color + '40' }]}>
                  <Text style={[pc.badgeText, { color }]}>Featured</Text>
                </View>
              )}
            </View>
            <Text style={pc.planName} numberOfLines={2}>{plan.name}</Text>
            <View style={pc.metaPills}>
              <View style={pc.pill}>
                <Text style={pc.pillText}>{CATEGORIES.find(c => c.key === plan.type)?.label ?? plan.type}</Text>
              </View>
              <View style={pc.pill}>
                <Text style={pc.pillTextMuted}>
                  {claimPct}% claim settlement
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stats — flat row with hairline dividers */}
        <View style={pc.statGrid}>
          <View style={pc.statCell}>
            <Text style={pc.statLabel}>Premium</Text>
            <Text style={[pc.statValue, { color }]}>{formatPremium(plan.basePremium)}</Text>
          </View>
          <View style={pc.statSep} />
          <View style={pc.statCell}>
            <Text style={pc.statLabel}>Cover</Text>
            <Text style={pc.statValue}>{formatCover(plan.maxCover)}</Text>
          </View>
          <View style={pc.statSep} />
          <View style={pc.statCellLast}>
            <Text style={pc.statLabel}>Insurer</Text>
            <Text style={pc.statValue} numberOfLines={1}>
              {plan.insurer?.shortName ?? (plan.insurer?.name ? plan.insurer.name.split(' ')[0] : '—')}
            </Text>
          </View>
        </View>

        {/* Features */}
        {expanded && features.length > 0 && (
          <View style={pc.features}>
            {features.map((f, i) => (
              <View key={i} style={pc.featureRow}>
                <View style={[pc.featureTickWrap, { borderColor: color + '30' }]}>
                  <Text style={[pc.featureTick, { color }]}>✓</Text>
                </View>
                <Text style={pc.featureText}>{f}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Actions */}
        <View style={pc.actions}>
          <TouchableOpacity onPress={() => setExpanded(!expanded)} style={pc.detailBtn} activeOpacity={0.7}>
            <Text style={pc.detailBtnText}>{expanded ? 'Less' : 'Details'}</Text>
            <Text style={pc.detailBtnCaret}>{expanded ? '˄' : '˅'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[pc.quoteBtn, { backgroundColor: color }]}
            onPress={() => router.push(`/plan/${plan.id}`)}
            activeOpacity={0.85}
          >
            <Text style={pc.quoteBtnText}>Get quote</Text>
          </TouchableOpacity>
        </View>
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

        <View style={[af.inputRow, { marginBottom: 12 }]}>
          <View style={af.prefix}>
            <Icon name="search-outline" size={20} color={Colors.primary} />
          </View>
          <TextInput
            style={af.input}
            placeholder="Search insurers or plans..."
            placeholderTextColor={Colors.textLight}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} style={{ paddingRight: 12, paddingVertical: 12 }}>
              <Text style={{ fontSize: 16, color: Colors.textMuted, fontWeight: '600' }}>✕</Text>
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
                  size={17}
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
    paddingHorizontal: 20, paddingTop: 18, paddingBottom: 4,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title: { fontSize: 22, fontWeight: '900', color: Colors.text, letterSpacing: -0.4 },
  sub:   { fontSize: 13, color: Colors.textMuted, marginTop: 4, marginBottom: 18 },

  filterList: { gap: 10, paddingBottom: 16 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 11,
    borderRadius: 24, borderWidth: 1,
    borderColor: Colors.border, backgroundColor: Colors.bgWarm,
  },
  chipActive:     {},
  chipText:       { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  chipTextActive: { color: Colors.white },

  listContent: { padding: 20, paddingBottom: BottomTabInset + 32 },
  count:       { fontSize: 11, color: Colors.textLight, fontWeight: '500', marginBottom: 16, marginTop: 4, letterSpacing: 0.2 },

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
    borderRadius: 14, marginBottom: 16,
    borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden',
  },
  cardBody:{},

  badge:     { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, backgroundColor: Colors.white },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.2 },

  top: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: 14, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 14,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 12,
    borderWidth: 1, padding: 2,
  },
  avatarInner: {
    flex: 1, borderRadius: 9, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  topMain:   { flex: 1, minWidth: 0, gap: 4 },
  titleRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  insurer:   { fontSize: 12, fontWeight: '800', color: Colors.text, letterSpacing: -0.2, textTransform: 'uppercase' },
  planName:  { fontSize: 15, fontWeight: '700', color: Colors.text, lineHeight: 20, letterSpacing: -0.2 },
  metaPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  pill:      { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: Colors.bg },
  pillText:  { fontSize: 11, fontWeight: '600', color: Colors.textMuted },
  pillTextMuted: { fontSize: 11, fontWeight: '500', color: Colors.textLight },

  statGrid: {
    flexDirection: 'row', alignItems: 'stretch',
    marginHorizontal: 18, marginBottom: 6,
    borderRadius: 10,
    borderWidth: 1, borderColor: '#E8EEF4',
    backgroundColor: '#FAFBFD',
  },
  statCell:     { flex: 1, paddingVertical: 14, paddingHorizontal: 12 },
  statCellLast: { flex: 1, paddingVertical: 14, paddingHorizontal: 12, alignItems: 'flex-end' },
  statSep:      { width: 1, backgroundColor: '#E8EEF4' },
  statLabel:    { fontSize: 9, color: Colors.textLight, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 },
  statValue:    { fontSize: 14, fontWeight: '800', color: Colors.text, letterSpacing: -0.3 },

  features: {
    paddingHorizontal: 18, paddingTop: 14, paddingBottom: 6, gap: 10,
  },
  featureRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  featureTickWrap: { width: 20, height: 20, borderRadius: 6, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  featureTick: { fontSize: 10, fontWeight: '800' },
  featureText: { fontSize: 13, color: Colors.textMuted, flex: 1, lineHeight: 19 },

  actions: {
    flexDirection: 'row', gap: 10,
    padding: 16, paddingTop: 14,
  },
  detailBtn: {
    flex: 1, minHeight: 48, paddingVertical: 14, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6,
    backgroundColor: Colors.white,
  },
  detailBtnText: { fontSize: 15, fontWeight: '700', color: Colors.text },
  detailBtnCaret:{ fontSize: 13, color: Colors.textLight, fontWeight: '400' },
  quoteBtn:      { flex: 1, minHeight: 48, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  quoteBtnText:  { fontSize: 15, fontWeight: '800', color: Colors.white, letterSpacing: 0.2 },
});
