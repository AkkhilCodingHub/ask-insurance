import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Linking, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/Icon';
import { BackButton } from '@/components/BackButton';
import { Colors } from '@/constants/theme';
import { useThemeColors } from '@/context/agent';

interface RsaService {
  id: string;
  title: string;
  sub: string;
  icon: string;
  color: string;
  eta: string;
}

const RSA_SERVICES: RsaService[] = [
  {
    id: 'rsa-towing',
    title: 'Emergency Towing',
    sub: 'Hydraulic flatbed tow truck to nearest cashless workshop',
    icon: 'car-sport-outline',
    color: '#DC2626',
    eta: '25-35 mins',
  },
  {
    id: 'rsa-battery',
    title: 'Battery Jumpstart',
    sub: 'Mobile technician with booster kit & alternator test',
    icon: 'flash-outline',
    color: '#D97706',
    eta: '20-30 mins',
  },
  {
    id: 'rsa-tyre',
    title: 'Flat Tyre Replacement',
    sub: 'Stepney change or on-site puncture repair',
    icon: 'disc-outline',
    color: '#0284C7',
    eta: '20-25 mins',
  },
  {
    id: 'rsa-fuel',
    title: 'Emergency Fuel Delivery',
    sub: 'Up to 5 Litres petrol/diesel delivered on spot',
    icon: 'flame-outline',
    color: '#7C3AED',
    eta: '25-30 mins',
  },
];

export default function EmergencySosScreen() {
  const router = useRouter();
  const colors = useThemeColors();

  const [activeDispatch, setActiveDispatch] = useState<RsaService | null>(null);
  const [dispatching, setDispatching] = useState(false);

  const handleTriggerRsa = (service: RsaService) => {
    Alert.alert(
      `Confirm ${service.title}`,
      `Dispatch nearest verified roadside patrol to your current GPS location?\n\nEstimated Arrival: ${service.eta}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Dispatch Now',
          style: 'default',
          onPress: () => {
            setDispatching(true);
            setTimeout(() => {
              setDispatching(false);
              setActiveDispatch(service);
              Alert.alert(
                'Patrol Dispatched! 🚨',
                `Your ${service.title} request has been assigned to ASK Roadside Rapid Response Unit #DEL-904. Driver contact: +91 98110 44221.`
              );
            }, 1200);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <BackButton />
        <View style={s.headerTitleWrap}>
          <Text style={[s.headerTitle, { color: colors.text }]}>24x7 Emergency SOS</Text>
          <Text style={[s.headerSub, { color: colors.textMuted }]}>Roadside Assistance & Claim Support</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Emergency SOS Banner */}
        <View style={s.sosHeroBanner}>
          <View style={s.sosGlow}>
            <Icon name="warning" size={32} color="#DC2626" />
          </View>
          <Text style={s.sosHeroTitle}>In an Accident or Breakdown?</Text>
          <Text style={s.sosHeroSub}>
            Tap below for 24x7 cashless roadside recovery, emergency ambulance, and priority surveyor dispatch.
          </Text>

          <View style={s.hotlineRow}>
            <TouchableOpacity
              style={s.hotlineBtn}
              onPress={() => Linking.openURL('tel:18002589000')}
            >
              <Icon name="call" size={16} color={Colors.white} />
              <Text style={s.hotlineBtnText}>Toll-Free 1800-258-9000</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Dispatch Tracker */}
        {activeDispatch && (
          <View style={s.activeDispatchCard}>
            <View style={s.dispatchHeader}>
              <View style={s.pulseDot} />
              <Text style={s.dispatchHeaderText}>PATROL EN ROUTE (ETA {activeDispatch.eta})</Text>
            </View>
            <Text style={s.dispatchTitle}>{activeDispatch.title} Active</Text>
            <Text style={s.dispatchSub}>
              Patrol Vehicle: Tata Xenon RSA #DL1LAB4412 • Officer: Rajesh Kumar (+91 98110 44221)
            </Text>
            <View style={s.dispatchActions}>
              <TouchableOpacity
                style={s.callPatrolBtn}
                onPress={() => Linking.openURL('tel:+919811044221')}
              >
                <Icon name="call" size={14} color={Colors.white} />
                <Text style={s.callPatrolBtnText}>Call Driver</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.cancelDispatchBtn}
                onPress={() => setActiveDispatch(null)}
              >
                <Text style={s.cancelDispatchBtnText}>Cancel Request</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 1-Tap RSA Grid */}
        <Text style={[s.sectionHeader, { color: colors.text }]}>1-Tap Roadside Assistance (RSA)</Text>
        <View style={s.rsaGrid}>
          {RSA_SERVICES.map((serv) => (
            <TouchableOpacity
              key={serv.id}
              style={[s.rsaCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => handleTriggerRsa(serv)}
              activeOpacity={0.7}
            >
              <View style={[s.rsaIconBox, { backgroundColor: serv.color + '15' }]}>
                <Icon name={serv.icon as any} size={24} color={serv.color} />
              </View>
              <Text style={[s.rsaTitle, { color: colors.text }]}>{serv.title}</Text>
              <Text style={[s.rsaSub, { color: colors.textMuted }]}>{serv.sub}</Text>
              <View style={s.etaRow}>
                <Icon name="time-outline" size={12} color="#059669" />
                <Text style={s.etaText}>Avg ETA: {serv.eta}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Emergency Medical / Claim Actions */}
        <Text style={[s.sectionHeader, { color: colors.text, marginTop: 24 }]}>Medical & Spot Claims</Text>

        <View style={[s.medicalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.medicalRow}>
            <View style={s.ambulanceIconBox}>
              <Icon name="medical" size={26} color="#DC2626" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.medicalTitle, { color: colors.text }]}>Emergency Ambulance SOS</Text>
              <Text style={[s.medicalSub, { color: colors.textMuted }]}>
                Immediate tie-up with 108 / CATS & cashless network hospital emergency rooms.
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={s.ambulanceBtn}
            onPress={() => Linking.openURL('tel:108')}
          >
            <Icon name="call" size={16} color={Colors.white} />
            <Text style={s.ambulanceBtnText}>Call Emergency 108 / 112</Text>
          </TouchableOpacity>
        </View>

        <View style={[s.medicalCard, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 12 }]}>
          <View style={s.medicalRow}>
            <View style={[s.ambulanceIconBox, { backgroundColor: '#E8F2FF' }]}>
              <Icon name="camera-outline" size={26} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.medicalTitle, { color: colors.text }]}>On-Spot Digital Surveyor</Text>
              <Text style={[s.medicalSub, { color: colors.textMuted }]}>
                Take instant damage photos and submit claim directly to insurer for immediate clearance.
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={s.surveyorBtn}
            onPress={() => router.push('/claims' as any)}
          >
            <Icon name="shield-outline" size={16} color={Colors.primary} />
            <Text style={s.surveyorBtnText}>Open Claim Filing</Text>
          </TouchableOpacity>
        </View>
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
  scroll: { flex: 1, padding: 16 },

  sosHeroBanner: {
    backgroundColor: '#FEF2F2',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    alignItems: 'center',
    marginBottom: 20,
  },
  sosGlow: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  sosHeroTitle: { fontSize: 18, fontWeight: '900', color: '#991B1B', marginBottom: 4 },
  sosHeroSub: { fontSize: 12, color: '#7F1D1D', textAlign: 'center', lineHeight: 17, marginBottom: 14 },
  hotlineRow: { flexDirection: 'row', gap: 10 },
  hotlineBtn: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  hotlineBtnText: { color: Colors.white, fontSize: 14, fontWeight: '900' },

  activeDispatchCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  dispatchHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E' },
  dispatchHeaderText: { color: '#86EFAC', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  dispatchTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', marginBottom: 4 },
  dispatchSub: { color: '#94A3B8', fontSize: 12, lineHeight: 16, marginBottom: 12 },
  dispatchActions: { flexDirection: 'row', gap: 10 },
  callPatrolBtn: {
    flex: 1,
    backgroundColor: '#22C55E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  callPatrolBtnText: { color: '#000000', fontSize: 12, fontWeight: '900' },
  cancelDispatchBtn: {
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  cancelDispatchBtnText: { color: '#CBD5E1', fontSize: 12, fontWeight: '700' },

  sectionHeader: { fontSize: 14, fontWeight: '800', marginBottom: 12 },
  rsaGrid: { gap: 10 },
  rsaCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  rsaIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  rsaTitle: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
  rsaSub: { fontSize: 12, lineHeight: 16, marginBottom: 8 },
  etaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  etaText: { fontSize: 11, fontWeight: '800', color: '#059669' },

  medicalCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  medicalRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  ambulanceIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  medicalTitle: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  medicalSub: { fontSize: 12, lineHeight: 16 },
  ambulanceBtn: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  ambulanceBtnText: { color: Colors.white, fontSize: 13, fontWeight: '800' },
  surveyorBtn: {
    backgroundColor: '#E8F2FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  surveyorBtnText: { color: Colors.primary, fontSize: 13, fontWeight: '800' },
});
