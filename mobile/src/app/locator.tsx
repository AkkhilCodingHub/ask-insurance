import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { BackButton } from '@/components/BackButton';
import { Colors } from '@/constants/theme';
import { useThemeColors } from '@/context/agent';



type FacilityType = 'hospital' | 'garage';

interface NetworkFacility {
  id: string;
  name: string;
  type: FacilityType;
  city: string;
  address: string;
  pincode: string;
  distance: string;
  phone: string;
  rating: string;
  insurers: string[];
  features: string[];
}

const NETWORK_DATA: NetworkFacility[] = [
  // Delhi NCR Hospitals
  {
    id: 'h-1',
    name: 'Max Super Speciality Hospital',
    type: 'hospital',
    city: 'Delhi NCR',
    address: 'FC-50, C & D Block, Shalimar Bagh, New Delhi',
    pincode: '110088',
    distance: '2.3 km away',
    phone: '+91 11 6642 2222',
    rating: '4.8 ★',
    insurers: ['Aditya Birla', 'Star Health', 'Tata AIG', 'Care Health', 'ICICI Lombard'],
    features: ['24x7 Cashless Desk', 'Zero Upfront Deposit', 'TPA Pre-Auth in 30 Mins'],
  },
  {
    id: 'h-2',
    name: 'Fortis Hospital',
    type: 'hospital',
    city: 'Delhi NCR',
    address: 'Sector B, Pocket 1, Aruna Asaf Ali Marg, Vasant Kunj, New Delhi',
    pincode: '110070',
    distance: '5.1 km away',
    phone: '+91 11 4277 6222',
    rating: '4.7 ★',
    insurers: ['Aditya Birla', 'HDFC ERGO', 'Bajaj Allianz', 'Star Health'],
    features: ['Instant Pre-Auth', 'Green Channel Discharge', 'Cashless Pharmacy'],
  },
  {
    id: 'h-3',
    name: 'Medanta - The Medicity',
    type: 'hospital',
    city: 'Gurugram',
    address: 'CH Bakhtawar Singh Rd, Sector 38, Gurugram, Haryana',
    pincode: '122001',
    distance: '14.2 km away',
    phone: '+91 124 414 1414',
    rating: '4.9 ★',
    insurers: ['Aditya Birla', 'Tata AIG', 'Star Health', 'Care Health', 'Bajaj Allianz'],
    features: ['Dedicated ASK Desk', ' cashless admission', 'Critical Care Support'],
  },

  // Mumbai Hospitals
  {
    id: 'h-4',
    name: 'Kokilaben Dhirubhai Ambani Hospital',
    type: 'hospital',
    city: 'Mumbai',
    address: 'Rao Saheb, Achutrao Patwardhan Marg, Four Bungalows, Andheri West, Mumbai',
    pincode: '400053',
    distance: '3.4 km away',
    phone: '+91 22 4269 6969',
    rating: '4.9 ★',
    insurers: ['Aditya Birla', 'Tata AIG', 'Star Health', 'ICICI Lombard'],
    features: ['Cashless Desk Ground Floor', '20-min Quick Approval'],
  },

  // Garages (Delhi NCR & Mumbai)
  {
    id: 'g-1',
    name: 'Hyundai Authorized Service Plaza (Dee Emm Motors)',
    type: 'garage',
    city: 'Delhi NCR',
    address: 'Plot No. 12, Shivaji Marg, Moti Nagar Industrial Area, New Delhi',
    pincode: '110015',
    distance: '1.8 km away',
    phone: '+91 11 4550 8800',
    rating: '4.8 ★',
    insurers: ['Tata AIG', 'ICICI Lombard', 'Bajaj Allianz', 'HDFC ERGO'],
    features: ['Cashless Accidental Repair', 'Zero Depreciation Priority', 'OEM Genuine Spares'],
  },
  {
    id: 'g-2',
    name: 'Maruti Suzuki Arena Service & Body Shop',
    type: 'garage',
    city: 'Delhi NCR',
    address: 'A-21, Okhla Industrial Area Phase II, New Delhi',
    pincode: '110020',
    distance: '6.2 km away',
    phone: '+91 11 4161 3300',
    rating: '4.7 ★',
    insurers: ['Tata AIG', 'Bajaj Allianz', 'Aditya Birla', 'ICICI Lombard'],
    features: ['Instant Surveyor Spot Survey', 'Direct Cashless Settlement'],
  },
  {
    id: 'g-3',
    name: 'Tata Motors Authorized Passenger Car Workshop',
    type: 'garage',
    city: 'Gurugram',
    address: 'IDCO Industrial Area, Sector 18, Gurugram, Haryana',
    pincode: '122015',
    distance: '11.5 km away',
    phone: '+91 124 492 8888',
    rating: '4.8 ★',
    insurers: ['Tata AIG', 'HDFC ERGO', 'Bajaj Allianz'],
    features: ['Cashless Paint & Body Shop', 'Free Towing Pickup'],
  },
];

const CITIES = ['All', 'Delhi NCR', 'Gurugram', 'Mumbai', 'Bengaluru', 'Pune'];

export default function NetworkLocatorScreen() {
  const colors = useThemeColors();

  const [activeType, setActiveType] = useState<FacilityType>('hospital');
  const [selectedCity, setSelectedCity] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredData = NETWORK_DATA.filter((item) => {
    if (item.type !== activeType) return false;
    if (selectedCity !== 'All' && item.city !== selectedCity) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.address.toLowerCase().includes(q) ||
        item.pincode.includes(q) ||
        item.insurers.some((ins) => ins.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <BackButton />
        <View style={s.headerTitleWrap}>
          <Text style={[s.headerTitle, { color: colors.text }]}>Cashless Network Locator</Text>
          <Text style={[s.headerSub, { color: colors.textMuted }]}>10,000+ Hospitals & 5,000+ Garages</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Main Switcher: Hospitals vs Garages */}
      <View style={[s.switchContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[s.typeTab, activeType === 'hospital' && s.typeTabActive]}
          onPress={() => setActiveType('hospital')}
        >
          <Icon
            name="medical-outline"
            size={18}
            color={activeType === 'hospital' ? Colors.primary : colors.textMuted}
          />
          <Text style={[s.typeTabText, activeType === 'hospital' && s.typeTabTextActive]}>
            Cashless Hospitals ({NETWORK_DATA.filter((x) => x.type === 'hospital').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.typeTab, activeType === 'garage' && s.typeTabActive]}
          onPress={() => setActiveType('garage')}
        >
          <Icon
            name="car-sport-outline"
            size={18}
            color={activeType === 'garage' ? Colors.primary : colors.textMuted}
          />
          <Text style={[s.typeTabText, activeType === 'garage' && s.typeTabTextActive]}>
            Cashless Garages ({NETWORK_DATA.filter((x) => x.type === 'garage').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search & City Filter */}
      <View style={[s.searchContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={[s.searchBar, { borderColor: colors.border, backgroundColor: '#F8FAFC' }]}>
          <Icon name="search-outline" size={16} color={Colors.textLight} />
          <TextInput
            style={[s.searchInput, { color: colors.text }]}
            placeholder={
              activeType === 'hospital'
                ? 'Search hospital, locality, or insurer...'
                : 'Search garage, car make, or area...'
            }
            placeholderTextColor={Colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close-circle" size={16} color={Colors.textLight} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* City Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.cityScroll}
          contentContainerStyle={{ gap: 6, paddingVertical: 4 }}
        >
          {CITIES.map((c) => (
            <TouchableOpacity
              key={c}
              style={[s.cityChip, selectedCity === c && s.cityChipActive]}
              onPress={() => setSelectedCity(c)}
            >
              <Text style={[s.cityChipText, selectedCity === c && s.cityChipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Facilities List */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={{ padding: 16, paddingBottom: 60, gap: 14 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.countRow}>
          <Text style={[s.countText, { color: colors.textMuted }]}>
            Showing {filteredData.length} Cashless {activeType === 'hospital' ? 'Hospitals' : 'Garages'}
          </Text>
          <View style={s.cashlessGuaranteeBadge}>
            <Icon name="shield-checkmark" size={12} color="#059669" />
            <Text style={s.cashlessGuaranteeText}>100% Cashless TPA Guarantee</Text>
          </View>
        </View>

        {filteredData.map((item) => (
          <View
            key={item.id}
            style={[s.facilityCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            {/* Top row */}
            <View style={s.cardTop}>
              <View style={s.iconBadgeBox}>
                <Icon
                  name={item.type === 'hospital' ? 'business-outline' : 'construct-outline'}
                  size={24}
                  color={Colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <View style={s.facilityNameRow}>
                  <Text style={[s.facilityName, { color: colors.text }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={s.ratingBadge}>{item.rating}</Text>
                </View>
                <View style={s.distanceRow}>
                  <Icon name="navigate-outline" size={12} color={Colors.primary} />
                  <Text style={s.distanceText}>{item.distance}</Text>
                  <Text style={s.dotSep}>•</Text>
                  <Text style={[s.cityBadge, { color: colors.textMuted }]}>{item.city}</Text>
                </View>
              </View>
            </View>

            {/* Address */}
            <View style={s.addressRow}>
              <Icon name="location-outline" size={14} color={Colors.textLight} />
              <Text style={[s.addressText, { color: colors.textMuted }]} numberOfLines={2}>
                {item.address} - {item.pincode}
              </Text>
            </View>

            {/* Features Tags */}
            <View style={s.featureTagsRow}>
              {item.features.map((feat) => (
                <View key={feat} style={s.featureChip}>
                  <Icon name="checkmark" size={10} color="#059669" />
                  <Text style={s.featureChipText}>{feat}</Text>
                </View>
              ))}
            </View>

            {/* Supported Insurers */}
            <View style={s.insurersBox}>
              <Text style={s.insurersLabel}>EMPANELLED INSURERS:</Text>
              <View style={s.insurersList}>
                {item.insurers.map((ins) => (
                  <View key={ins} style={s.insurerPill}>
                    <Text style={s.insurerPillText}>{ins}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Action buttons */}
            <View style={s.cardActions}>
              <TouchableOpacity
                style={s.callBtn}
                onPress={() => Linking.openURL(`tel:${item.phone.replace(/[^0-9+]/g, '')}`)}
              >
                <Icon name="call-outline" size={15} color={Colors.primary} />
                <Text style={s.callBtnText}>Cashless Desk</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={s.directionBtn}
                onPress={() =>
                  Linking.openURL(
                    `https://maps.google.com/?q=${encodeURIComponent(item.name + ' ' + item.address)}`
                  )
                }
              >
                <Icon name="navigate" size={15} color={Colors.white} />
                <Text style={s.directionBtnText}>Get Directions</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitleWrap: { alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800' },
  headerSub: { fontSize: 11, marginTop: 1 },

  switchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 8,
  },
  typeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
  },
  typeTabActive: {
    backgroundColor: '#E8F2FF',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  typeTabText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  typeTabTextActive: { color: Colors.primary, fontWeight: '800' },

  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 13, padding: 0 },
  cityScroll: { marginTop: 8 },
  cityChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  cityChipActive: {
    backgroundColor: Colors.primary,
  },
  cityChipText: { fontSize: 11, fontWeight: '700', color: '#475569' },
  cityChipTextActive: { color: Colors.white, fontWeight: '800' },

  scroll: { flex: 1 },
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  countText: { fontSize: 12, fontWeight: '700' },
  cashlessGuaranteeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cashlessGuaranteeText: { fontSize: 10, fontWeight: '800', color: '#059669' },

  facilityCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardTop: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  iconBadgeBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E8F2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  facilityNameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  facilityName: { fontSize: 15, fontWeight: '800', flex: 1, marginRight: 8 },
  ratingBadge: {
    backgroundColor: '#FEF08A',
    color: '#854D0E',
    fontSize: 11,
    fontWeight: '900',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  distanceRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  distanceText: { fontSize: 11, fontWeight: '800', color: Colors.primary },
  dotSep: { color: '#CBD5E1', fontSize: 11 },
  cityBadge: { fontSize: 11, fontWeight: '600' },

  addressRow: { flexDirection: 'row', gap: 6, marginBottom: 10, alignItems: 'flex-start' },
  addressText: { fontSize: 12, lineHeight: 16, flex: 1 },

  featureTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  featureChipText: { fontSize: 10, fontWeight: '700', color: '#059669' },

  insurersBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  insurersLabel: { fontSize: 9, fontWeight: '800', color: '#64748B', letterSpacing: 0.5, marginBottom: 4 },
  insurersList: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  insurerPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  insurerPillText: { fontSize: 10, fontWeight: '700', color: '#334155' },

  cardActions: { flexDirection: 'row', gap: 10 },
  callBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#E8F2FF',
    paddingVertical: 10,
    borderRadius: 10,
  },
  callBtnText: { fontSize: 12, fontWeight: '800', color: Colors.primary },
  directionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: 10,
  },
  directionBtnText: { fontSize: 12, fontWeight: '800', color: Colors.white },
});
