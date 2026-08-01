import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackButton } from '@/components/BackButton';
import { Icon } from '@/components/Icon';
import { Colors } from '@/constants/theme';
import { useThemeColors } from '@/context/agent';

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: `By downloading, installing, or using the ASK Insurance mobile application ('App'), you agree to be bound by these Terms of Service ('Terms'). If you do not agree to these Terms, please do not use the App.

These Terms constitute a legally binding agreement between you and ASK Insurance Broker Private Limited ('ASK', 'we', 'us').`,
  },
  {
    title: '2. About ASK Insurance Broker',
    body: `ASK Insurance Broker Private Limited is registered as a Direct Broker under IRDAI (Insurance Brokers) Regulations, 2018.

As a broker, we represent you — the policyholder — not the insurance company. Our role is to:
• Analyse your insurance needs objectively.
• Compare products from multiple IRDAI-registered insurers.
• Facilitate policy purchase and claims assistance.

We are remunerated by insurers through commissions as disclosed under IRDAI regulations. This does not affect our obligation to act in your best interest.`,
  },
  {
    title: '3. Eligibility',
    body: `To use this App you must:

• Be at least 18 years of age.
• Be a resident of India or a Non-Resident Indian (NRI) seeking insurance for assets or lives in India.
• Possess a valid Indian mobile number for OTP verification.
• Provide accurate and truthful information at all times.

By using the App, you represent and warrant that you meet all eligibility requirements.`,
  },
  {
    title: '4. Services Offered',
    body: `ASK provides the following services through the App:

• Insurance comparison and recommendation across life, health, motor, travel, and other categories.
• Quote generation based on information you provide.
• Facilitation of policy purchase with IRDAI-registered insurers.
• Claims assistance and advocacy with insurers.
• Policy management and renewal reminders.

IMPORTANT: ASK is a broker, not an insurer or underwriter. We do not underwrite risk or guarantee any insurance coverage. All insurance contracts are between you and the respective insurer.`,
  },
  {
    title: '5. No Guarantee of Coverage',
    body: `Quotes generated through the App are indicative and based on the information you provide. Final premium, terms, and coverage are subject to:

• The insurer's underwriting assessment.
• Verification of your KYC documents.
• Medical examination (where applicable).
• Accuracy of the information you disclose.

ASK makes no warranty that a policy will be issued or that a specific claim will be approved. The insurer has the final authority on all underwriting and claims decisions.`,
  },
  {
    title: '6. User Obligations',
    body: `You agree to:

• Provide accurate, complete, and truthful information including health history, asset details, and personal data required for KYC.
• Not misrepresent material facts — non-disclosure can void a policy.
• Maintain confidentiality of your OTPs and account access.
• Use only one account per person.
• Not use the App for any illegal purpose or in violation of IRDAI regulations.
• Promptly update your profile if your personal details change.

Misrepresentation or fraud may result in policy cancellation, claim rejection, and may constitute a criminal offence under Indian law.`,
  },
  {
    title: '7. Payment Terms',
    body: `• Insurance premiums are collected by us on behalf of the insurer and remitted promptly as required by IRDAI regulations.
• We do not hold your premium funds — they are transferred to the insurer within the period prescribed by IRDAI.
• Broker commission is earned from the insurer and is disclosed in accordance with IRDAI (Insurance Brokers) Regulations, 2018.
• In the event of a policy cancellation within the free-look period, refund timelines are governed by the insurer's policy terms.
• Payments made through the App are processed by PCI-DSS compliant payment gateways.`,
  },
  {
    title: '8. Claims Assistance',
    body: `Our claims assistance service includes:

• Helping you complete and submit your claim form correctly.
• Liaising with the insurer's claims team on your behalf.
• Providing regular status updates.
• Advising you of your rights if a claim is disputed.

However, ASK does not guarantee any specific claim outcome. The insurer makes the final determination on claim admissibility and settlement. Where a claim is rejected, we will advise you on available remedies including escalation to the Insurance Ombudsman.`,
  },
  {
    title: '9. Intellectual Property',
    body: `All content in the App including text, graphics, logos, icons, images, and software is the property of ASK Insurance Broker Private Limited and is protected under Indian copyright and intellectual property laws.

You may not reproduce, distribute, modify, or create derivative works from any content in the App without our express written permission.`,
  },
  {
    title: '10. Limitation of Liability',
    body: `To the maximum extent permitted by applicable law:

• ASK's total aggregate liability to you for any claim arising from your use of the App shall not exceed the annual premium of the policy directly in dispute.
• We are not liable for indirect, incidental, consequential, or punitive damages.
• We are not liable for the acts or omissions of any insurer, including denial of coverage or delay in claim settlement.
• We are not liable for losses arising from your failure to provide accurate or complete information.

Nothing in these Terms limits liability for death or personal injury caused by our negligence, fraud, or any other liability that cannot be excluded under applicable law.`,
  },
  {
    title: '11. Governing Law',
    body: `These Terms are governed by and construed in accordance with the laws of the Republic of India, including:

• Insurance Act, 1938
• IRDAI (Insurance Brokers) Regulations, 2018
• Consumer Protection Act, 2019
• Information Technology Act, 2000 and IT (Amendment) Act, 2008
• Digital Personal Data Protection Act, 2023

Any dispute shall be subject to the jurisdiction of courts in Mumbai, Maharashtra, India.`,
  },
  {
    title: '12. Dispute Resolution',
    body: `In the event of a dispute, the following process applies:

Step 1 — Internal Grievance: Contact our Grievance Officer at grievance@ask-insurance.in. We will respond within 14 business days.

Step 2 — IRDAI IGMS: If unresolved, escalate to IRDAI's Integrated Grievance Management System at igms.irda.gov.in or call 155255 (toll-free).

Step 3 — Insurance Ombudsman: For disputes relating to claims of up to ₹50 lakh, you may approach the Insurance Ombudsman in your region.

Step 4 — Arbitration: For commercial disputes not resolved above, the matter shall be referred to arbitration under the Arbitration and Conciliation Act, 1996, with the seat of arbitration in Mumbai.`,
  },
  {
    title: '13. Amendments',
    body: `We may update these Terms from time to time. We will notify you of material changes through in-app notifications at least 7 days before they take effect. Your continued use of the App after the effective date of any changes constitutes your acceptance of the updated Terms.

We recommend reviewing these Terms periodically.`,
  },
  {
    title: '14. Contact Us',
    body: `ASK Insurance Broker Private Limited

General enquiries: hello@ask-insurance.in
Grievances: grievance@ask-insurance.in
Legal: legal@ask-insurance.in
IRDAI Licence No.: [XXXXX]

For support, use the Chat feature in the app — our advisors are available 24×7.`,
  },
];

export default function TermsScreen() {
  const colors = useThemeColors();

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={[s.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <BackButton />
        <Text style={[s.title, { color: colors.text }]}>Terms of Service</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={[s.banner, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[s.bannerIcon, { backgroundColor: colors.isDark ? 'rgba(21,128,255,0.15)' : Colors.primaryLight }]}>
            <Icon name="reader-outline" size={28} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.bannerTitle, { color: colors.text }]}>Terms of Service</Text>
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
          These Terms are governed by the laws of India.
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
    backgroundColor: Colors.bg, margin: 16,
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  bannerIcon: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: Colors.primaryLight,
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
