import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { Colors } from '@/constants/theme';

export interface ReportData {
  type: 'acknowledgement' | 'certificate';
  referenceId: string;
  insuranceType: string;
  status: string;
  date: string;
  validUntil?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  provider?: string;
  planName?: string;
  sumInsured?: number;
  premium?: number;
  details?: Record<string, any>;
  notes?: string;
}

function fmtMoney(amount?: number): string {
  if (!amount) return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

export function ReportModal({
  visible,
  data,
  onClose,
}: {
  visible: boolean;
  data: ReportData | null;
  onClose: () => void;
}) {
  if (!visible || !data) return null;

  const isCert = data.type === 'certificate';
  const gst = data.premium ? Math.round(data.premium * 0.18) : 0;
  const net = data.premium ? data.premium - gst : 0;

  const handleShare = async () => {
    try {
      const title = isCert
        ? `ASK Insurance Certificate - ${data.referenceId}`
        : `ASK Insurance Quote Acknowledgement - ${data.referenceId}`;
      const msg = `${title}\nCustomer: ${data.customerName}\nType: ${data.insuranceType.toUpperCase()}\nCover: ${fmtMoney(data.sumInsured)}\nStatus: ${data.status.toUpperCase()}\nIRDAI Direct Broker Reg: IRDAI/DB 792/19\nASK Insurance Brokers Pvt. Ltd.`;
      await Share.share({ message: msg, title });
    } catch {}
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Top Navbar */}
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.navBtn} onPress={onClose} activeOpacity={0.7}>
            <Icon name="close" size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>{isCert ? 'Policy Certificate' : 'Quote Acknowledgement'}</Text>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.7}>
            <Icon name="share-outline" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Certificate / Slip Paper Container */}
          <View style={styles.paper}>
            {/* Header */}
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={styles.brandTitle}>ASK INSURANCE BROKERS</Text>
                <Text style={styles.brandSub}>IRDAI Direct Broker License: IRDAI/DB 792/19</Text>
                <Text style={styles.brandSub}>CIN: U66010DL2018PTC334589</Text>
                <Text style={styles.brandAddress}>Regd: ASK Tower, B-4 Netaji Subhash Place, Pitampura, New Delhi - 110034</Text>
              </View>
              <View style={[styles.badge, isCert ? styles.badgeCert : styles.badgeQuote]}>
                <Text style={[styles.badgeText, isCert ? styles.badgeTextCert : styles.badgeTextQuote]}>
                  {isCert ? '✓ Active Policy' : '⏳ Quote Slip'}
                </Text>
              </View>
            </View>

            {/* Title Banner */}
            <View style={[styles.banner, isCert ? styles.bannerCert : styles.bannerQuote]}>
              <Text style={styles.bannerText}>
                {isCert ? 'OFFICIAL CERTIFICATE OF INSURANCE & SCHEDULE' : 'OFFICIAL QUOTE REQUEST ACKNOWLEDGEMENT SLIP'}
              </Text>
            </View>

            {/* Reference info strip */}
            <View style={styles.refBox}>
              <Text style={styles.refTitle}>
                {isCert ? 'Policy No: ' : 'Reference ID: '}
                <Text style={styles.refVal}>{data.referenceId}</Text>
              </Text>
              <Text style={styles.refDesc}>
                {isCert
                  ? 'This document confirms active coverage underwritten in compliance with IRDAI statutory regulations.'
                  : 'Your request has been registered in the underwriting queue. Quotes from 38+ IRDAI insurers are being prepared.'}
              </Text>
            </View>

            {/* Policyholder & Coverage Details */}
            <View style={styles.grid}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Applicant / Insured</Text>
                <View style={styles.row}>
                  <Text style={styles.lbl}>Name:</Text>
                  <Text style={styles.val}>{data.customerName}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.lbl}>Phone:</Text>
                  <Text style={styles.val}>{data.customerPhone || '—'}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.lbl}>Date:</Text>
                  <Text style={styles.val}>{data.date}</Text>
                </View>
                {data.validUntil && (
                  <View style={styles.row}>
                    <Text style={styles.lbl}>Valid Until:</Text>
                    <Text style={styles.val}>{data.validUntil}</Text>
                  </View>
                )}
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Coverage Specs</Text>
                <View style={styles.row}>
                  <Text style={styles.lbl}>Type:</Text>
                  <Text style={[styles.val, { textTransform: 'capitalize' }]}>{data.insuranceType} Insurance</Text>
                </View>
                {data.provider && (
                  <View style={styles.row}>
                    <Text style={styles.lbl}>Insurer:</Text>
                    <Text style={styles.val}>{data.provider}</Text>
                  </View>
                )}
                {data.planName && (
                  <View style={styles.row}>
                    <Text style={styles.lbl}>Plan:</Text>
                    <Text style={styles.val}>{data.planName}</Text>
                  </View>
                )}
                {data.sumInsured ? (
                  <View style={styles.row}>
                    <Text style={styles.lbl}>{data.insuranceType === 'motor' ? 'IDV:' : 'Sum Insured:'}</Text>
                    <Text style={[styles.val, { color: Colors.primary, fontWeight: '800' }]}>{fmtMoney(data.sumInsured)}</Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* Vehicle specifics if available */}
            {data.details && (data.details.make || data.details.registrationNumber) && (
              <View style={[styles.card, { marginBottom: 16 }]}>
                <Text style={styles.cardTitle}>Vehicle Identification</Text>
                {data.details.registrationNumber && (
                  <View style={styles.row}>
                    <Text style={styles.lbl}>Registration Number:</Text>
                    <Text style={[styles.val, { color: Colors.primary }]}>{data.details.registrationNumber}</Text>
                  </View>
                )}
                {data.details.make && (
                  <View style={styles.row}>
                    <Text style={styles.lbl}>Vehicle Make & Model:</Text>
                    <Text style={styles.val}>{data.details.make} {data.details.model || ''} ({data.details.registrationYear || '2021'})</Text>
                  </View>
                )}
                {data.details.fuelType && (
                  <View style={styles.row}>
                    <Text style={styles.lbl}>Fuel / Engine:</Text>
                    <Text style={styles.val}>{data.details.fuelType.toUpperCase()} {data.details.cubicCapacity ? `(${data.details.cubicCapacity} CC)` : ''}</Text>
                  </View>
                )}
                {data.details.ncbPercentage !== undefined && (
                  <View style={styles.row}>
                    <Text style={styles.lbl}>No Claim Bonus (NCB):</Text>
                    <Text style={[styles.val, { color: Colors.success }]}>{data.details.ncbPercentage}% Rollover</Text>
                  </View>
                )}
              </View>
            )}

            {/* Premium Table for certificates or quotes with prices */}
            {data.premium ? (
              <View style={styles.tableCard}>
                <Text style={styles.cardTitle}>Premium Summary (INR)</Text>
                <View style={styles.tableRow}>
                  <Text style={styles.tableLbl}>Net Base Premium (Annual)</Text>
                  <Text style={styles.tableVal}>{fmtMoney(net)}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.tableLbl}>Goods & Services Tax (GST @ 18%)</Text>
                  <Text style={styles.tableVal}>{fmtMoney(gst)}</Text>
                </View>
                <View style={[styles.tableRow, styles.totalRow]}>
                  <Text style={styles.totalLbl}>Total Premium {isCert ? 'Paid' : 'Quoted'}</Text>
                  <Text style={[styles.totalVal, { color: isCert ? Colors.primary : Colors.success }]}>{fmtMoney(data.premium)}</Text>
                </View>
              </View>
            ) : null}

            {/* Footer / Digital Seal */}
            <View style={styles.footer}>
              <View style={styles.legalBox}>
                <Text style={styles.legalText}>
                  {isCert
                    ? 'Important: This official schedule confirms active cover under Direct Insurance Broking license. For 24x7 cashless assistance or claims, call 1800-ASK-INS.'
                    : 'Notice: This acknowledgement certifies your insurance application is registered in central underwriting. Final rate subject to underwriter review.'}
                </Text>
              </View>

              <View style={styles.sealBox}>
                <View style={[styles.sealCircle, isCert ? styles.sealCert : styles.sealQuote]}>
                  <Text style={styles.sealTop}>{isCert ? 'ASK BROKERS' : 'UNDERWRITING'}</Text>
                  <Text style={styles.sealMid}>★ VERIFIED ★</Text>
                  <Text style={styles.sealBot}>{isCert ? 'DIGITAL SEAL' : 'INSPECTION'}</Text>
                </View>
                <Text style={styles.sealAuth}>{isCert ? 'Authorized Signatory' : 'Customer Desk'}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F172A' },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  navBtn: { padding: 6 },
  navTitle: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  shareBtn: {
    backgroundColor: '#38BDF820',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  scroll: { flex: 1, backgroundColor: '#0F172A' },
  scrollContent: { padding: 16, paddingBottom: 40 },

  paper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1.5,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 14,
    marginBottom: 14,
  },
  brandTitle: { fontSize: 18, fontWeight: '900', color: '#0284C7', letterSpacing: -0.3 },
  brandSub: { fontSize: 10, color: '#64748B', marginTop: 2, fontWeight: '500' },
  brandAddress: { fontSize: 9, color: '#94A3B8', marginTop: 3 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  badgeCert: { backgroundColor: '#ECFDF5', borderColor: '#10B981' },
  badgeQuote: { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' },
  badgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  badgeTextCert: { color: '#047857' },
  badgeTextQuote: { color: '#B45309' },

  banner: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, marginBottom: 14 },
  bannerCert: { backgroundColor: '#0284C7' },
  bannerQuote: { backgroundColor: '#0F766E' },
  bannerText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800', textAlign: 'center', letterSpacing: 0.4 },

  refBox: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 12, marginBottom: 14 },
  refTitle: { fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 4 },
  refVal: { color: '#0284C7', fontWeight: '900' },
  refDesc: { fontSize: 11, color: '#64748B', lineHeight: 16 },

  grid: { gap: 12, marginBottom: 14 },
  card: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 12 },
  cardTitle: { fontSize: 11, fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  lbl: { fontSize: 11, color: '#64748B', fontWeight: '500' },
  val: { fontSize: 11, color: '#0F172A', fontWeight: '700' },

  tableCard: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 12, marginBottom: 14 },
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  tableLbl: { fontSize: 11, color: '#64748B' },
  tableVal: { fontSize: 11, fontWeight: '700', color: '#0F172A' },
  totalRow: { borderBottomWidth: 0, paddingTop: 8, marginTop: 4 },
  totalLbl: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  totalVal: { fontSize: 14, fontWeight: '900' },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1.5,
    borderTopColor: '#E2E8F0',
    paddingTop: 14,
    marginTop: 6,
  },
  legalBox: { flex: 1, paddingRight: 12 },
  legalText: { fontSize: 9, color: '#94A3B8', lineHeight: 14 },
  sealBox: { alignItems: 'center' },
  sealCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  sealCert: { borderColor: '#0284C7' },
  sealQuote: { borderColor: '#0F766E' },
  sealTop: { fontSize: 8, fontWeight: '800', color: '#0284C7', textAlign: 'center' },
  sealMid: { fontSize: 7, fontWeight: '900', color: '#047857', marginVertical: 2 },
  sealBot: { fontSize: 7, fontWeight: '700', color: '#64748B', textAlign: 'center' },
  sealAuth: { fontSize: 9, fontWeight: '700', color: '#475569', marginTop: 4 },
});
