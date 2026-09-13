import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Icon } from '@/components/Icon';
import { Colors } from '@/constants/theme';
import { policiesApi, ApiPolicy, getBaseUrl } from '@/lib/api';
import { useAuth } from '@/context/auth';
import { moderateScale, fontScale, responsiveContainerStyle } from '@/utils/scaling';

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ policyId?: string; paymentId?: string; status?: string }>();
  const { refreshUser } = useAuth();

  const [policy, setPolicy] = useState<ApiPolicy | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadPolicy() {
      if (params.policyId) {
        try {
          const res = await policiesApi.get(params.policyId);
          if (isMounted && res?.policy) {
            setPolicy(res.policy);
          }
        } catch (e) {
          // If direct fetch fails, search in list
          try {
            const listRes = await policiesApi.list();
            const found = listRes.policies.find((p) => p.id === params.policyId);
            if (isMounted && found) setPolicy(found);
          } catch {}
        }
      }
      if (refreshUser) refreshUser();
      if (isMounted) setLoading(false);
    }

    loadPolicy();
    return () => {
      isMounted = false;
    };
  }, [params.policyId, refreshUser]);

  const handleDownloadCertificate = async () => {
    if (!policy) return;
    const certUrl = `${getBaseUrl()}/api/policies/${policy.id}/certificate`;
    try {
      await WebBrowser.openBrowserAsync(certUrl);
    } catch {}
  };

  const handleShare = async () => {
    if (!policy) return;
    try {
      await Share.share({
        title: `ASK Insurance Policy Schedule — ${policy.policyNumber}`,
        message: `Policy Issued: ${policy.provider} (${policy.type.toUpperCase()})\nPolicy Number: ${policy.policyNumber}\nSum Insured: ₹${policy.sumInsured.toLocaleString('en-IN')}\nPayment Reference: ${params.paymentId || 'Razorpay'}\nIssued via ASK Insurance Brokers.`,
      });
    } catch {}
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, responsiveContainerStyle]}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Header */}
        <View style={styles.header}>
          <View style={styles.iconRing}>
            <Icon name="checkmark-circle" size={moderateScale(64)} color="#10B981" />
          </View>
          <Text style={styles.title}>Payment Acknowledged! 🎉</Text>
          <Text style={styles.subtitle}>
            Your insurance policy has been successfully bound and issued.
          </Text>
          <View style={styles.irdaBadge}>
            <Text style={styles.irdaText}>IRDAI REGISTERED DIRECT BROKER · REG NO: 102/2024</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Fetching policy schedule...</Text>
          </View>
        ) : policy ? (
          <View style={styles.scheduleCard}>
            <View style={styles.scheduleHeader}>
              <View>
                <Text style={styles.scheduleHeaderLabel}>POLICY SCHEDULE NUMBER</Text>
                <Text style={styles.scheduleNumber}>{policy.policyNumber}</Text>
              </View>
              <View style={[styles.statusChip, (policy.paymentStatus !== 'paid' && policy.status !== 'active') && { backgroundColor: '#FEF3C7' }]}>
                <Text style={[styles.statusChipText, (policy.paymentStatus !== 'paid' && policy.status !== 'active') && { color: '#D97706' }]}>
                  {policy.paymentStatus === 'paid' || policy.status === 'active' ? 'ACTIVE' : 'PAYMENT PENDING'}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Underwriter / Insurer</Text>
              <Text style={styles.rowValue}>{policy.provider}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Coverage Category</Text>
              <Text style={styles.rowValue}>{policy.type.toUpperCase()} INSURANCE</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Sum Insured / IDV</Text>
              <Text style={styles.rowValueBold}>₹{policy.sumInsured.toLocaleString('en-IN')}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Total Premium Paid</Text>
              <Text style={styles.rowValueHighlight}>₹{policy.premium.toLocaleString('en-IN')}</Text>
            </View>

            {params.paymentId ? (
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Razorpay Payment ID</Text>
                <Text style={styles.rowValueRef}>{params.paymentId}</Text>
              </View>
            ) : null}

            {policy.registrationNumber ? (
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Vehicle Registration</Text>
                <Text style={styles.rowValue}>{policy.registrationNumber}</Text>
              </View>
            ) : null}

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Policy Term</Text>
              <Text style={styles.rowValue}>1 Year (365 Days)</Text>
            </View>

            <View style={styles.divider} />

            {/* Document Download CTAs */}
            <View style={styles.documentRow}>
              <TouchableOpacity
                style={styles.docButton}
                onPress={handleDownloadCertificate}
                activeOpacity={0.8}
              >
                <Icon name="document-text-outline" size={moderateScale(18)} color={Colors.primary} />
                <Text style={styles.docButtonText}>Policy Schedule (PDF)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.docButtonSecondary}
                onPress={handleShare}
                activeOpacity={0.8}
              >
                <Icon name="share-social-outline" size={moderateScale(18)} color="#475569" />
                <Text style={styles.docButtonSecondaryText}>Share Schedule</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.scheduleCard}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Payment Status</Text>
              <Text style={styles.rowValueBold}>Captured Successfully</Text>
            </View>
            {params.paymentId ? (
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Payment Reference</Text>
                <Text style={styles.rowValueRef}>{params.paymentId}</Text>
              </View>
            ) : null}
            <Text style={styles.fallbackNotice}>
              Your policy schedule is being finalized by the underwriting system. You can view it in your dashboard in moments.
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsBox}>
          <TouchableOpacity
            style={styles.primaryAction}
            onPress={() => router.replace('/my-policies')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryActionText}>View in My Policies</Text>
            <Icon name="arrow-forward" size={moderateScale(18)} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryAction}
            onPress={() => router.replace('/(tabs)')}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryActionText}>Go to Home Dashboard</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: moderateScale(20),
    paddingBottom: moderateScale(40),
  },
  header: {
    alignItems: 'center',
    marginBottom: moderateScale(24),
  },
  iconRing: {
    width: moderateScale(88),
    height: moderateScale(88),
    borderRadius: moderateScale(44),
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(14),
    borderWidth: 2,
    borderColor: '#A7F3D0',
  },
  title: {
    fontSize: fontScale(22),
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: moderateScale(6),
  },
  subtitle: {
    fontSize: fontScale(13),
    color: '#64748B',
    textAlign: 'center',
    lineHeight: fontScale(18),
    marginBottom: moderateScale(12),
  },
  irdaBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: moderateScale(20),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(5),
  },
  irdaText: {
    fontSize: fontScale(10),
    fontWeight: '700',
    color: '#1D4ED8',
    letterSpacing: 0.3,
  },
  loadingBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(32),
    alignItems: 'center',
    gap: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  loadingText: {
    fontSize: fontScale(13),
    color: '#64748B',
    fontWeight: '600',
  },
  scheduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(20),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: moderateScale(24),
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(14),
  },
  scheduleHeaderLabel: {
    fontSize: fontScale(10),
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  scheduleNumber: {
    fontSize: fontScale(16),
    fontWeight: '800',
    color: '#0F172A',
    marginTop: moderateScale(2),
  },
  statusChip: {
    backgroundColor: '#ECFDF5',
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(4),
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  statusChipText: {
    fontSize: fontScale(11),
    fontWeight: '800',
    color: '#059669',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E2E8F0',
    marginVertical: moderateScale(14),
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: moderateScale(6),
  },
  rowLabel: {
    fontSize: fontScale(13),
    color: '#64748B',
  },
  rowValue: {
    fontSize: fontScale(13),
    fontWeight: '600',
    color: '#0F172A',
    textAlign: 'right',
  },
  rowValueBold: {
    fontSize: fontScale(13),
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'right',
  },
  rowValueHighlight: {
    fontSize: fontScale(15),
    fontWeight: '900',
    color: '#059669',
    textAlign: 'right',
  },
  rowValueRef: {
    fontSize: fontScale(12),
    fontFamily: 'monospace',
    color: '#3B82F6',
    fontWeight: '700',
  },
  documentRow: {
    flexDirection: 'row',
    gap: moderateScale(10),
    marginTop: moderateScale(4),
  },
  docButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(6),
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: moderateScale(10),
    paddingVertical: moderateScale(11),
  },
  docButtonText: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: Colors.primary,
  },
  docButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(6),
    backgroundColor: '#F1F5F9',
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(11),
  },
  docButtonSecondaryText: {
    fontSize: fontScale(12),
    fontWeight: '600',
    color: '#475569',
  },
  fallbackNotice: {
    fontSize: fontScale(12),
    color: '#64748B',
    lineHeight: fontScale(18),
    marginTop: moderateScale(10),
    fontStyle: 'italic',
  },
  actionsBox: {
    gap: moderateScale(12),
  },
  primaryAction: {
    backgroundColor: Colors.primary,
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(14),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(8),
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: fontScale(15),
    fontWeight: '700',
  },
  secondaryAction: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(14),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  secondaryActionText: {
    color: '#475569',
    fontSize: fontScale(14),
    fontWeight: '700',
  },
});
