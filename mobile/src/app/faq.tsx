import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, LayoutAnimation, Platform, UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/Icon';
import { Colors } from '@/constants/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ── FAQ data ──────────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    q: 'What is an insurance broker?',
    a: 'An insurance broker is a licensed intermediary who represents you — the policyholder — not the insurance company. ASK Insurance is registered as a Direct Broker under IRDAI (Insurance Brokers) Regulations, 2018. We compare plans across multiple insurers so you always get unbiased advice and the best coverage for your needs.',
  },
  {
    q: 'Is ASK Insurance registered with IRDAI?',
    a: 'Yes. ASK Insurance Broker is duly licensed by the Insurance Regulatory and Development Authority of India (IRDAI) as a Direct Broker (Life & General). Our licence is renewed annually and our compliance team ensures all operations meet IRDAI guidelines at all times.',
  },
  {
    q: 'How do I buy a policy through ASK?',
    a: 'It\'s simple:\n1. Tap "Plans" and browse by category (Health, Life, Motor, etc.).\n2. Select a plan and tap "Get Quote".\n3. Fill in your personal details (age, coverage needed).\n4. Compare quotes from multiple insurers.\n5. Select the best fit and our advisor will contact you to complete KYC and issuance.\nMost policies are issued within 24–48 hours.',
  },
  {
    q: 'What documents are needed for KYC?',
    a: 'IRDAI mandates KYC for all insurance products. You typically need:\n• Identity proof: Aadhaar card or PAN card\n• Address proof: Aadhaar, driving licence, or utility bill\n• Date of birth proof: Aadhaar, birth certificate, or passport\n• Passport-size photograph\n\nFor health insurance, a medical report may also be required depending on age and sum insured.',
  },
  {
    q: 'How are claims processed?',
    a: 'File your claim via the Claims tab. Our broker team will:\n1. Verify your claim documents.\n2. Liaise with the insurer\'s claims department on your behalf.\n3. Provide regular status updates through the app.\n\nAs your broker, we advocate for you throughout the process. Note: the final settlement decision rests with the insurer. Our goal is to ensure your claim is assessed fairly and quickly.',
  },
  {
    q: 'Are my insurance premiums tax-deductible?',
    a: 'Yes, subject to Income Tax Act provisions:\n\n• Health Insurance (Sec 80D): Up to ₹25,000/year for self & family; ₹50,000 if you or your parents are senior citizens.\n• Life Insurance (Sec 80C): Premiums up to ₹1.5 lakh/year towards the overall 80C limit.\n• Term life riders, critical illness riders may qualify separately.\n\nPlease consult your tax advisor for your specific situation.',
  },
  {
    q: 'How is my personal data protected?',
    a: 'We take data security seriously:\n• All data in transit is encrypted using TLS 1.3.\n• Data at rest is encrypted with AES-256 in ISO 27001-compliant servers located in India.\n• Your data is never sold to third parties.\n• We comply with India\'s Digital Personal Data Protection (DPDP) Act 2023.\n• OTPs are automatically deleted after 5 minutes.\n• You can request data export or deletion at any time via the app.',
  },
  {
    q: 'What is the difference between a broker and an agent?',
    a: 'An insurance agent represents one specific insurer and can only sell that company\'s products. A broker like ASK represents you and can compare products from many insurers to find the best fit. Brokers have a fiduciary duty to the client; agents have a duty to the insurer. This means our advice is always unbiased.',
  },
  {
    q: 'Can I cancel my policy?',
    a: 'Yes. All insurance policies have a free-look period of 15–30 days from the date of receipt of the policy document. During this period you can cancel and receive a refund (net of applicable charges). After the free-look period, cancellation terms vary by insurer and product type. Contact our support team through the Chat tab for assistance.',
  },
  {
    q: 'How do I raise a complaint or grievance?',
    a: 'Step 1: Contact our support team via the Chat tab or email grievance@ask-insurance.in. We aim to resolve within 14 business days.\n\nStep 2: If unresolved, escalate to IRDAI via the Integrated Grievance Management System (IGMS) at igms.irda.gov.in.\n\nStep 3: You may also approach the Insurance Ombudsman in your region for disputes related to claims, policy issuance, or servicing.',
  },
  {
    q: 'What happens if I miss a premium payment?',
    a: 'Policies typically have a grace period of 15–30 days (depending on the insurer and product) after the premium due date. If the premium is not paid within the grace period:\n• The policy lapses and coverage ceases.\n• You may be able to revive a lapsed policy within 2 years by paying overdue premiums + interest.\n\nEnable payment reminders in Settings → Notifications to avoid missing due dates.',
  },
] as const;

// ── FAQ item component ────────────────────────────────────────────────────────

function FAQItem({ q, a, isLast }: { q: string; a: string; isLast: boolean }) {
  const [open, setOpen] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(v => !v);
  };

  return (
    <View style={[fi.wrap, !isLast && fi.border]}>
      <TouchableOpacity style={fi.header} onPress={toggle} activeOpacity={0.75}>
        <View style={fi.qCircle}>
          <Text style={fi.qMark}>Q</Text>
        </View>
        <Text style={fi.question}>{q}</Text>
        <Icon
          name={open ? 'chevron-up-outline' : 'chevron-down-outline'}
          size={16}
          color={Colors.textMuted}
        />
      </TouchableOpacity>
      {open && (
        <View style={fi.body}>
          <Text style={fi.answer}>{a}</Text>
        </View>
      )}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function FAQScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Icon name="arrow-back-outline" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={s.title}>Help & FAQ</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={s.hero}>
          <View style={s.heroIcon}>
            <Icon name="help-circle-outline" size={32} color={Colors.primary} />
          </View>
          <Text style={s.heroTitle}>Frequently Asked Questions</Text>
          <Text style={s.heroSub}>
            Everything you need to know about ASK Insurance, IRDAI regulations, and your policies.
          </Text>
        </View>

        {/* FAQ list */}
        <View style={s.card}>
          {FAQ_ITEMS.map((item, i) => (
            <FAQItem
              key={i}
              q={item.q}
              a={item.a}
              isLast={i === FAQ_ITEMS.length - 1}
            />
          ))}
        </View>

        {/* Support CTA */}
        <View style={s.ctaCard}>
          <Icon name="chatbubble-ellipses-outline" size={24} color={Colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={s.ctaTitle}>Still have questions?</Text>
            <Text style={s.ctaSub}>Our advisors are available 24×7</Text>
          </View>
          <TouchableOpacity
            style={s.ctaBtn}
            onPress={() => router.push('/(tabs)/chat')}
          >
            <Text style={s.ctaBtnText}>Chat now</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.footer}>
          ASK Insurance Broker · IRDAI Licensed{'\n'}
          Last updated: January 2025
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title:   { fontSize: 17, fontWeight: '800', color: Colors.text },
  scroll:  { flex: 1 },
  content: { paddingBottom: 48 },

  hero: {
    backgroundColor: Colors.white, margin: 16, borderRadius: 16,
    padding: 20, alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  heroIcon: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  heroTitle: { fontSize: 18, fontWeight: '800', color: Colors.text, textAlign: 'center', letterSpacing: -0.3 },
  heroSub:   { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },

  card: {
    backgroundColor: Colors.white, marginHorizontal: 16, marginBottom: 16,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },

  ctaCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.primaryLight, marginHorizontal: 16, marginBottom: 16,
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.primary + '30',
  },
  ctaTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  ctaSub:   { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  ctaBtn: {
    backgroundColor: Colors.primary, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  ctaBtnText: { fontSize: 12, fontWeight: '700', color: Colors.white },

  footer: {
    fontSize: 11, color: Colors.textLight, textAlign: 'center',
    marginTop: 4, marginBottom: 8, lineHeight: 18,
  },
});

const fi = StyleSheet.create({
  wrap:   { overflow: 'hidden' },
  border: { borderBottomWidth: 1, borderBottomColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  qCircle: {
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginTop: 1,
  },
  qMark:    { fontSize: 11, fontWeight: '900', color: Colors.primary },
  question: { flex: 1, fontSize: 14, fontWeight: '700', color: Colors.text, lineHeight: 20 },
  body: {
    paddingHorizontal: 16, paddingBottom: 14, paddingTop: 0,
    paddingLeft: 54,   // aligns under the question text (26 circle + 12 gap + 16 padding)
  },
  answer:   { fontSize: 13, color: Colors.textMuted, lineHeight: 21 },
});
