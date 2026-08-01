import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackButton } from '@/components/BackButton';
import { Icon } from '@/components/Icon';
import { Colors } from '@/constants/theme';
import { useThemeColors } from '@/context/agent';

const SECTIONS = [
  {
    title: '1. Who We Are',
    body: `ASK Insurance Broker Private Limited ('ASK', 'we', 'us', or 'our') is a Direct Broker licensed by the Insurance Regulatory and Development Authority of India (IRDAI) under the IRDAI (Insurance Brokers) Regulations, 2018. Our registered office is in India.

This Privacy Policy explains how we collect, use, store, and protect your personal data when you use our mobile application and related services.`,
  },
  {
    title: '2. Information We Collect',
    body: `We collect the following categories of personal data:

• Identity information: Full name, date of birth, gender, Aadhaar number, PAN card number.
• Contact details: Mobile number, email address, postal address.
• Financial information: Income details (for underwriting), premium payment history.
• Health information: Medical history and pre-existing conditions (for health and life insurance applications).
• Device & usage data: Device identifiers, IP address, app usage logs, crash reports.
• Communication records: Chat messages with our support advisors.

We collect only what is necessary for delivering our services and meeting IRDAI KYC requirements.`,
  },
  {
    title: '3. How We Use Your Data',
    body: `We use your personal data to:

• Provide insurance brokerage services and facilitate policy issuance.
• Verify your identity as required by IRDAI KYC norms and PMLA guidelines.
• Calculate personalised insurance quotes and recommend suitable products.
• Process claims and liaise with insurers on your behalf.
• Send you policy renewal reminders, claim updates, and important notices.
• Detect and prevent fraud, money laundering, and other illegal activities.
• Improve our app through anonymised usage analytics.
• Comply with applicable laws, regulatory orders, and court directions.`,
  },
  {
    title: '4. Data Sharing',
    body: `We share your data only when necessary:

• Insurance companies: To obtain quotes, issue policies, and process claims.
• IRDAI and other regulators: When required by law, regulation, or official request.
• Payment processors: PCI-DSS compliant providers for premium collection.
• Technology partners: Cloud infrastructure providers under strict data processing agreements.
• Legal authorities: When compelled by court order, law enforcement, or to protect our legal rights.

We do NOT sell, rent, or share your personal data with marketing agencies, data brokers, or any third party for commercial advertising.`,
  },
  {
    title: '5. Data Retention',
    body: `We retain your personal data as follows:

• Active policy term: Data kept for the full duration of your policy.
• Post-policy: 5 years after policy expiry or cancellation (as mandated by IRDAI for broker records).
• Claims records: 7 years from claim settlement.
• OTP codes: Automatically deleted 5 minutes after generation.
• Deleted accounts: Retained for 90 days to allow recovery, then permanently erased.

After the applicable retention period, your data is securely deleted or anonymised.`,
  },
  {
    title: '6. Your Rights under the DPDP Act 2023',
    body: `Under India's Digital Personal Data Protection Act 2023, you have the right to:

• Access: Request a summary of the personal data we hold about you.
• Correction: Correct inaccurate or incomplete personal data.
• Erasure: Request deletion of your data (subject to regulatory retention obligations).
• Grievance redressal: Raise a complaint with our Grievance Officer.
• Nomination: Nominate a person to exercise your rights in the event of your incapacity or death.

To exercise these rights, contact our Grievance Officer at grievance@ask-insurance.in.`,
  },
  {
    title: '7. Security Measures',
    body: `We implement industry-standard security measures:

• Transport Layer Security (TLS 1.3) for all data in transit.
• AES-256 encryption for data at rest.
• OTP-based two-factor authentication for every login.
• App tokens stored in device Secure Enclave (iOS Keychain / Android Keystore).
• Regular security audits and penetration testing.
• ISO 27001-compliant data centres located within India.
• Strict role-based access controls for our staff.

However, no system is 100% secure. We encourage you to keep your OTPs confidential and report any suspicious activity immediately.`,
  },
  {
    title: '8. Cookies and Device Storage',
    body: `Our mobile app does not use browser cookies. We use device-level secure storage (expo-secure-store) to:

• Store your authentication token locally on your device.
• Cache your notification preferences.

This data never leaves your device without your consent and is automatically cleared when you log out.`,
  },
  {
    title: '9. Children\'s Privacy',
    body: `Our services are not directed to individuals under 18 years of age. We do not knowingly collect personal data from minors. If you believe a child has provided us with personal information, please contact us immediately and we will delete such data.`,
  },
  {
    title: '10. Changes to This Policy',
    body: `We may update this Privacy Policy from time to time to reflect changes in our practices or applicable law. We will notify you of material changes through the app at least 7 days before they take effect. Continued use of the app after the effective date constitutes acceptance of the updated policy.`,
  },
  {
    title: '11. Grievance Officer & Contact',
    body: `Grievance Officer
ASK Insurance Broker Private Limited
Email: grievance@ask-insurance.in
Response time: Within 14 business days

For IRDAI escalation:
Integrated Grievance Management System: igms.irda.gov.in
IRDAI Bima Bharosa: 155255 (toll-free)

For data protection enquiries:
Email: privacy@ask-insurance.in`,
  },
];

export default function PrivacyScreen() {
  const colors = useThemeColors();

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={[s.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <BackButton />
        <Text style={[s.title, { color: colors.text }]}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={[s.banner, { backgroundColor: colors.isDark ? 'rgba(21,128,255,0.15)' : Colors.primaryLight, borderColor: Colors.primary + '30' }]}>
          <View style={[s.bannerIcon, { backgroundColor: colors.isDark ? '#1F2937' : Colors.white }]}>
            <Icon name="shield-checkmark-outline" size={28} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.bannerTitle, { color: colors.text }]}>Your Privacy Matters</Text>
            <Text style={[s.bannerSub, { color: colors.textMuted }]}>Effective date: 1 January 2025 · Last updated: January 2025</Text>
          </View>
        </View>

        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {SECTIONS.map((sec, i) => (
            <React.Fragment key={i}>
              {i > 0 && <View style={[s.divider, { backgroundColor: colors.border }]} />}
              <View style={s.section}>
                <Text style={[s.sectionTitle, { color: colors.text }]}>{sec.title}</Text>
                <Text style={[s.sectionBody, { color: colors.textMuted }]}>{sec.body}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        <Text style={[s.footer, { color: colors.textMuted }]}>
          ASK Insurance Broker · IRDAI Licensed{'\n'}
          This policy is governed by the laws of the Republic of India.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title:   { fontSize: 17, fontWeight: '800', color: Colors.text },
  scroll:  { flex: 1 },
  content: { paddingBottom: 48 },
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.primaryLight, margin: 16,
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.primary + '30',
  },
  bannerIcon: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
  },
  bannerTitle: { fontSize: 15, fontWeight: '800', color: Colors.text },
  bannerSub:   { fontSize: 11, color: Colors.textMuted, marginTop: 2, lineHeight: 16 },
  card: {
    backgroundColor: Colors.white, marginHorizontal: 16, marginBottom: 16,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  divider: { height: 1, backgroundColor: Colors.bg, marginHorizontal: 16 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: Colors.text, marginBottom: 8, letterSpacing: -0.2 },
  sectionBody: { fontSize: 13, color: Colors.textMuted, lineHeight: 21 },
  footer: {
    fontSize: 11, color: Colors.textLight, textAlign: 'center',
    marginTop: 4, marginBottom: 8, lineHeight: 18,
  },
});
