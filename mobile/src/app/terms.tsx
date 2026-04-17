import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackButton } from '@/components/BackButton';
import { Colors } from '@/constants/theme';

function Section({ title, body }: { title: string; body: string }) {
  return (
    <View style={p.section}>
      <Text style={p.sectionTitle}>{title}</Text>
      <Text style={p.sectionBody}>{body}</Text>
    </View>
  );
}

export default function TermsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <BackButton />
        <Text style={s.title}>Terms of Service</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header banner */}
        <View style={s.banner}>
          <View style={s.bannerIcon}>
            <Icon name="reader-outline" size={28} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.bannerTitle}>Terms of Service</Text>
            <Text style={s.bannerSub}>Effective date: 1 January 2025 · Last updated: January 2025</Text>
          </View>
        </View>

        <View style={s.card}>
          <Section
            title="1. Acceptance of Terms"
            body="By downloading, installing, or using the ASK Insurance mobile application ('App'), you agree to be bound by these Terms of Service ('Terms'). If you do not agree to these Terms, please do not use the App.\n\nThese Terms constitute a legally binding agreement between you and ASK Insurance Broker Private Limited ('ASK', 'we', 'us')."
          />
          <View style={s.divider} />
          <Section
            title="2. About ASK Insurance Broker"
            body="ASK Insurance Broker Private Limited is registered as a Direct Broker under IRDAI (Insurance Brokers) Regulations, 2018.\n\nAs a broker, we represent you — the policyholder — not the insurance company. Our role is to:\n• Analyse your insurance needs objectively.\n• Compare products from multiple IRDAI-registered insurers.\n• Facilitate policy purchase and claims assistance.\n\nWe are remunerated by insurers through commissions as disclosed under IRDAI regulations. This does not affect our obligation to act in your best interest."
          />
          <View style={s.divider} />
          <Section
            title="3. Eligibility"
            body="To use this App you must:\n\n• Be at least 18 years of age.\n• Be a resident of India or a Non-Resident Indian (NRI) seeking insurance for assets or lives in India.\n• Possess a valid Indian mobile number for OTP verification.\n• Provide accurate and truthful information at all times.\n\nBy using the App, you represent and warrant that you meet all eligibility requirements."
          />
          <View style={s.divider} />
          <Section
            title="4. Services Offered"
            body="ASK provides the following services through the App:\n\n• Insurance comparison and recommendation across life, health, motor, travel, and other categories.\n• Quote generation based on information you provide.\n• Facilitation of policy purchase with IRDAI-registered insurers.\n• Claims assistance and advocacy with insurers.\n• Policy management and renewal reminders.\n\nIMPORTANT: ASK is a broker, not an insurer or underwriter. We do not underwrite risk or guarantee any insurance coverage. All insurance contracts are between you and the respective insurer."
          />
          <View style={s.divider} />
          <Section
            title="5. No Guarantee of Coverage"
            body="Quotes generated through the App are indicative and based on the information you provide. Final premium, terms, and coverage are subject to:\n\n• The insurer's underwriting assessment.\n• Verification of your KYC documents.\n• Medical examination (where applicable).\n• Accuracy of the information you disclose.\n\nASK makes no warranty that a policy will be issued or that a specific claim will be approved. The insurer has the final authority on all underwriting and claims decisions."
          />
          <View style={s.divider} />
          <Section
            title="6. User Obligations"
            body="You agree to:\n\n• Provide accurate, complete, and truthful information including health history, asset details, and personal data required for KYC.\n• Not misrepresent material facts — non-disclosure can void a policy.\n• Maintain confidentiality of your OTPs and account access.\n• Use only one account per person.\n• Not use the App for any illegal purpose or in violation of IRDAI regulations.\n• Promptly update your profile if your personal details change.\n\nMisrepresentation or fraud may result in policy cancellation, claim rejection, and may constitute a criminal offence under Indian law."
          />
          <View style={s.divider} />
          <Section
            title="7. Payment Terms"
            body="• Insurance premiums are collected by us on behalf of the insurer and remitted promptly as required by IRDAI regulations.\n• We do not hold your premium funds — they are transferred to the insurer within the period prescribed by IRDAI.\n• Broker commission is earned from the insurer and is disclosed in accordance with IRDAI (Insurance Brokers) Regulations, 2018.\n• In the event of a policy cancellation within the free-look period, refund timelines are governed by the insurer's policy terms.\n• Payments made through the App are processed by PCI-DSS compliant payment gateways."
          />
          <View style={s.divider} />
          <Section
            title="8. Claims Assistance"
            body="Our claims assistance service includes:\n\n• Helping you complete and submit your claim form correctly.\n• Liaising with the insurer's claims team on your behalf.\n• Providing regular status updates.\n• Advising you of your rights if a claim is disputed.\n\nHowever, ASK does not guarantee any specific claim outcome. The insurer makes the final determination on claim admissibility and settlement. Where a claim is rejected, we will advise you on available remedies including escalation to the Insurance Ombudsman."
          />
          <View style={s.divider} />
          <Section
            title="9. Intellectual Property"
            body="All content in the App including text, graphics, logos, icons, images, and software is the property of ASK Insurance Broker Private Limited and is protected under Indian copyright and intellectual property laws.\n\nYou may not reproduce, distribute, modify, or create derivative works from any content in the App without our express written permission."
          />
          <View style={s.divider} />
          <Section
            title="10. Limitation of Liability"
            body="To the maximum extent permitted by applicable law:\n\n• ASK's total aggregate liability to you for any claim arising from your use of the App shall not exceed the annual premium of the policy directly in dispute.\n• We are not liable for indirect, incidental, consequential, or punitive damages.\n• We are not liable for the acts or omissions of any insurer, including denial of coverage or delay in claim settlement.\n• We are not liable for losses arising from your failure to provide accurate or complete information.\n\nNothing in these Terms limits liability for death or personal injury caused by our negligence, fraud, or any other liability that cannot be excluded under applicable law."
          />
          <View style={s.divider} />
          <Section
            title="11. Governing Law"
            body="These Terms are governed by and construed in accordance with the laws of the Republic of India, including:\n\n• Insurance Act, 1938\n• IRDAI (Insurance Brokers) Regulations, 2018\n• Consumer Protection Act, 2019\n• Information Technology Act, 2000 and IT (Amendment) Act, 2008\n• Digital Personal Data Protection Act, 2023\n\nAny dispute shall be subject to the jurisdiction of courts in Mumbai, Maharashtra, India."
          />
          <View style={s.divider} />
          <Section
            title="12. Dispute Resolution"
            body="In the event of a dispute, the following process applies:\n\nStep 1 — Internal Grievance: Contact our Grievance Officer at grievance@ask-insurance.in. We will respond within 14 business days.\n\nStep 2 — IRDAI IGMS: If unresolved, escalate to IRDAI's Integrated Grievance Management System at igms.irda.gov.in or call 155255 (toll-free).\n\nStep 3 — Insurance Ombudsman: For disputes relating to claims of up to ₹50 lakh, you may approach the Insurance Ombudsman in your region.\n\nStep 4 — Arbitration: For commercial disputes not resolved above, the matter shall be referred to arbitration under the Arbitration and Conciliation Act, 1996, with the seat of arbitration in Mumbai."
          />
          <View style={s.divider} />
          <Section
            title="13. Amendments"
            body="We may update these Terms from time to time. We will notify you of material changes through in-app notifications at least 7 days before they take effect. Your continued use of the App after the effective date of any changes constitutes your acceptance of the updated Terms.\n\nWe recommend reviewing these Terms periodically."
          />
          <View style={s.divider} />
          <Section
            title="14. Contact Us"
            body="ASK Insurance Broker Private Limited\n\nGeneral enquiries: hello@ask-insurance.in\nGrievances: grievance@ask-insurance.in\nLegal: legal@ask-insurance.in\nIRDAI Licence No.: [XXXXX]\n\nFor support, use the Chat feature in the app — our advisors are available 24×7."
          />
        </View>

        <Text style={s.footer}>
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

  footer: {
    fontSize: 11, color: Colors.textLight, textAlign: 'center',
    marginTop: 4, marginBottom: 8, lineHeight: 18,
  },
});

const p = StyleSheet.create({
  section:      { padding: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: Colors.text, marginBottom: 8, letterSpacing: -0.2 },
  sectionBody:  { fontSize: 13, color: Colors.textMuted, lineHeight: 21 },
});
