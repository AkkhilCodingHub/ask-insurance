import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { C } from "./constants/colors";

const { width: W } = Dimensions.get("window");

const insuranceTypes = ["Life", "Health", "Motor", "Travel"];

const categories = [
  { icon: "❤️", label: "Life", desc: "Term & ULIP" },
  { icon: "🏥", label: "Health", desc: "Family cover" },
  { icon: "🚗", label: "Motor", desc: "Car & bike" },
  { icon: "✈️", label: "Travel", desc: "Trips & tours" },
  { icon: "🏠", label: "Home", desc: "Property" },
  { icon: "💼", label: "Business", desc: "SME plans" },
];

const insurers = [
  { name: "LIC", short: "LI", rating: "4.8", claims: "98.5%", from: "₹5,200/yr", color: C.primary, tag: "Most Trusted" },
  { name: "HDFC Life", short: "HD", rating: "4.7", claims: "99.1%", from: "₹6,800/yr", color: "#E11D48", tag: "Best Claims" },
  { name: "ICICI Pru", short: "IC", rating: "4.6", claims: "97.8%", from: "₹5,900/yr", color: "#7C3AED", tag: "Popular" },
  { name: "SBI Life", short: "SB", rating: "4.5", claims: "96.9%", from: "₹4,800/yr", color: C.success, tag: "Budget Pick" },
];

const stats = [
  { value: "2.4L+", label: "Policies" },
  { value: "₹840Cr", label: "Claims" },
  { value: "38+", label: "Insurers" },
  { value: "4.8★", label: "Rating" },
];

export default function App() {
  const [activeType, setActiveType] = useState("Life");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Navbar ── */}
        <View style={s.nav}>
          <View style={s.navBrand}>
            <LinearGradient
              colors={[C.primary, C.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.navLogo}
            >
              <Text style={s.navLogoText}>🛡️</Text>
            </LinearGradient>
            <View>
              <Text style={s.navName}>ASK</Text>
              <Text style={s.navSub}>Insurance Broker</Text>
            </View>
          </View>
          <TouchableOpacity style={s.loginBtn}>
            <Text style={s.loginBtnText}>Log in</Text>
          </TouchableOpacity>
        </View>

        {/* ── Hero ── */}
        <LinearGradient
          colors={["#EBF2FF", "#F0F8FF", "#E0F6FF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.hero}
        >
          {/* Live badge */}
          <View style={s.liveBadge}>
            <View style={s.liveDot} />
            <Text style={s.liveBadgeText}>India&apos;s fastest growing broker</Text>
          </View>

          <Text style={s.heroTitle}>
            Insurance that{"\n"}
            <Text style={s.heroTitleAccent}>actually works{"\n"}</Text>
            for you
          </Text>

          <Text style={s.heroSubtitle}>
            Compare 38+ IRDAI-regulated insurers and get instant quotes in minutes.
          </Text>

          {/* Quote card */}
          <View style={s.quoteCard}>
            <Text style={s.quoteCardTitle}>Find your plan</Text>

            {/* Type tabs */}
            <View style={s.typeTabs}>
              {insuranceTypes.map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setActiveType(t)}
                  style={[s.typeTab, activeType === t && s.typeTabActive]}
                >
                  <Text style={[s.typeTabText, activeType === t && s.typeTabTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Age input */}
            <Text style={s.inputLabel}>YOUR AGE</Text>
            <TextInput
              style={s.input}
              placeholder="e.g. 28"
              placeholderTextColor={C.textLight}
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
            />

            {/* Phone input */}
            <Text style={s.inputLabel}>MOBILE NUMBER</Text>
            <View style={s.phoneRow}>
              <View style={s.phonePrefix}>
                <Text style={s.phonePrefixText}>+91</Text>
              </View>
              <TextInput
                style={[s.input, s.phoneInput]}
                placeholder="Enter mobile number"
                placeholderTextColor={C.textLight}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>

            {/* CTA */}
            <TouchableOpacity activeOpacity={0.85} style={s.ctaWrap}>
              <LinearGradient
                colors={[C.primary, C.accentDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.cta}
              >
                <Text style={s.ctaText}>Compare Free Quotes →</Text>
              </LinearGradient>
            </TouchableOpacity>

            <Text style={s.quoteFooter}>No spam · No hidden charges · 100% free</Text>
          </View>
        </LinearGradient>

        {/* ── Stats bar ── */}
        <LinearGradient
          colors={[C.primaryDeep, C.primary, C.accentDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={s.statsBar}
        >
          {stats.map((st, i) => (
            <View key={i} style={s.statItem}>
              <Text style={s.statValue}>{st.value}</Text>
              <Text style={s.statLabel}>{st.label}</Text>
            </View>
          ))}
        </LinearGradient>

        {/* ── Categories ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>What are you looking for?</Text>
          <Text style={s.sectionSubtitle}>Choose a category to explore tailored plans</Text>
          <View style={s.categoriesGrid}>
            {categories.map((c) => (
              <TouchableOpacity key={c.label} style={s.categoryCard} activeOpacity={0.75}>
                <Text style={s.categoryIcon}>{c.icon}</Text>
                <Text style={s.categoryLabel}>{c.label}</Text>
                <Text style={s.categoryDesc}>{c.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Insurer Cards ── */}
        <View style={[s.section, { backgroundColor: C.bg }]}>
          <View style={s.sectionHeader}>
            <View>
              <Text style={s.sectionTitle}>Our partners</Text>
              <Text style={s.sectionSubtitle}>IRDAI-regulated, verified</Text>
            </View>
            <TouchableOpacity>
              <Text style={s.viewAllText}>View all 38+</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.insurerScroll}>
            {insurers.map((ins) => (
              <View key={ins.name} style={[s.insurerCard, { borderColor: ins.color + "33" }]}>
                {ins.tag ? (
                  <View style={[s.insurerTag, { backgroundColor: ins.color }]}>
                    <Text style={s.insurerTagText}>{ins.tag}</Text>
                  </View>
                ) : null}
                <View style={[s.insurerAvatar, { backgroundColor: ins.color + "18" }]}>
                  <Text style={[s.insurerAvatarText, { color: ins.color }]}>{ins.short}</Text>
                </View>
                <Text style={s.insurerName}>{ins.name}</Text>
                <Text style={s.insurerRating}>{"★".repeat(Math.floor(parseFloat(ins.rating)))} {ins.rating}</Text>
                <View style={s.insurerMeta}>
                  <View>
                    <Text style={s.insurerMetaLabel}>Claim ratio</Text>
                    <Text style={[s.insurerMetaValue, { color: C.success }]}>{ins.claims}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={s.insurerMetaLabel}>From</Text>
                    <Text style={[s.insurerMetaValue, { color: ins.color }]}>{ins.from}</Text>
                  </View>
                </View>
                <TouchableOpacity style={[s.viewPlansBtn, { borderColor: ins.color }]}>
                  <Text style={[s.viewPlansBtnText, { color: ins.color }]}>View Plans</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* ── How it works ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>How it works</Text>
          <Text style={s.sectionSubtitle}>Get insured in 3 simple steps</Text>
          {[
            { num: "01", title: "Compare plans", desc: "Search 38+ insurers in seconds." },
            { num: "02", title: "Get your quote", desc: "Accurate premium instantly, no calls." },
            { num: "03", title: "Buy securely", desc: "KYC & payment online. Policy in minutes." },
          ].map((step, i) => (
            <View key={i} style={s.stepRow}>
              <LinearGradient
                colors={[C.primaryLight, C.accentLight]}
                style={s.stepNum}
              >
                <Text style={s.stepNumText}>{step.num}</Text>
              </LinearGradient>
              <View style={s.stepContent}>
                <Text style={s.stepTitle}>{step.title}</Text>
                <Text style={s.stepDesc}>{step.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Bottom CTA ── */}
        <LinearGradient
          colors={[C.primaryDeep, C.primary, C.accentDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.bottomCTA}
        >
          <Text style={s.bottomCTATitle}>Ready to get covered?</Text>
          <Text style={s.bottomCTASubtitle}>
            Join 2.4 lakh+ Indians who&apos;ve found smarter insurance
          </Text>
          <TouchableOpacity style={s.bottomCTABtn} activeOpacity={0.85}>
            <Text style={s.bottomCTABtnText}>Compare plans for free →</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* ── Footer ── */}
        <View style={s.footer}>
          <Text style={s.footerBrand}>ASK Insurance Broker</Text>
          <Text style={s.footerNote}>
            IRDAI licensed broker · Reg. No. IB-123-2023
          </Text>
          <Text style={s.footerCopy}>© 2025 ASK Insurance. All rights reserved.</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.white },
  scroll: { flex: 1 },

  // Navbar
  nav: {
    height: 60,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  navBrand: { flexDirection: "row", alignItems: "center", gap: 10 },
  navLogo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  navLogoText: { fontSize: 18 },
  navName: { fontSize: 18, fontWeight: "900", color: C.text, letterSpacing: -0.5 },
  navSub: { fontSize: 10, color: C.textMuted, marginTop: -2 },
  loginBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: C.primary,
  },
  loginBtnText: { fontSize: 13, fontWeight: "600", color: C.primary },

  // Hero
  hero: { padding: 24, paddingTop: 32 },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.successLight,
    borderWidth: 1,
    borderColor: "#6EE7B7",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignSelf: "flex-start",
    marginBottom: 20,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.success },
  liveBadgeText: { fontSize: 12, color: C.success, fontWeight: "600" },
  heroTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: C.text,
    lineHeight: 38,
    letterSpacing: -1,
    marginBottom: 14,
  },
  heroTitleAccent: { color: C.primary },
  heroSubtitle: {
    fontSize: 15,
    color: C.textMuted,
    lineHeight: 23,
    marginBottom: 28,
    maxWidth: W * 0.8,
  },

  // Quote card
  quoteCard: {
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 22,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  quoteCardTitle: { fontSize: 16, fontWeight: "700", color: C.text, marginBottom: 16 },
  typeTabs: {
    flexDirection: "row",
    backgroundColor: C.bg,
    borderRadius: 12,
    padding: 4,
    marginBottom: 18,
    gap: 4,
  },
  typeTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: "center",
  },
  typeTabActive: {
    backgroundColor: C.primary,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  typeTabText: { fontSize: 12, fontWeight: "600", color: C.textMuted },
  typeTabTextActive: { color: C.white },
  inputLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: C.textMuted,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontSize: 14,
    color: C.text,
    backgroundColor: C.white,
    marginBottom: 14,
  },
  phoneRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  phonePrefix: {
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 10,
    backgroundColor: C.bg,
    justifyContent: "center",
  },
  phonePrefixText: { fontSize: 14, color: C.textMuted },
  phoneInput: { flex: 1, marginBottom: 0 },
  ctaWrap: { borderRadius: 12, overflow: "hidden", marginBottom: 0 },
  cta: {
    paddingVertical: 15,
    alignItems: "center",
    borderRadius: 12,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaText: { fontSize: 15, fontWeight: "700", color: C.white, letterSpacing: 0.2 },
  quoteFooter: {
    fontSize: 11,
    color: C.textLight,
    textAlign: "center",
    marginTop: 10,
  },

  // Stats
  statsBar: {
    flexDirection: "row",
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  statItem: { flex: 1, alignItems: "center" },
  statValue: {
    fontSize: 22,
    fontWeight: "900",
    color: C.white,
    letterSpacing: -0.5,
    textShadowColor: "rgba(56,189,248,0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  statLabel: { fontSize: 11, color: "rgba(255,255,255,0.65)", marginTop: 3, fontWeight: "500" },

  // Sections
  section: { padding: 24, backgroundColor: C.white },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: C.text,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  sectionSubtitle: { fontSize: 13, color: C.textMuted, marginBottom: 20 },
  viewAllText: { fontSize: 13, color: C.primary, fontWeight: "600" },

  // Categories
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  categoryCard: {
    width: (W - 68) / 3,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
  },
  categoryIcon: { fontSize: 26, marginBottom: 6 },
  categoryLabel: { fontSize: 13, fontWeight: "700", color: C.text, marginBottom: 2 },
  categoryDesc: { fontSize: 10, color: C.textMuted, textAlign: "center" },

  // Insurer cards (horizontal scroll)
  insurerScroll: { marginHorizontal: -24, paddingHorizontal: 24 },
  insurerCard: {
    width: 175,
    backgroundColor: C.white,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginRight: 12,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  insurerTag: {
    position: "absolute",
    top: -9,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  insurerTagText: { fontSize: 9, fontWeight: "700", color: C.white, letterSpacing: 0.3 },
  insurerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  insurerAvatarText: { fontSize: 14, fontWeight: "800" },
  insurerName: { fontSize: 14, fontWeight: "700", color: C.text, marginBottom: 3 },
  insurerRating: { fontSize: 12, color: "#F59E0B", marginBottom: 10 },
  insurerMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 10,
    marginBottom: 10,
  },
  insurerMetaLabel: { fontSize: 9, color: C.textLight, fontWeight: "600", letterSpacing: 0.4, marginBottom: 2 },
  insurerMetaValue: { fontSize: 13, fontWeight: "700" },
  viewPlansBtn: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: 7,
    alignItems: "center",
  },
  viewPlansBtnText: { fontSize: 12, fontWeight: "700" },

  // Steps
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    marginBottom: 20,
  },
  stepNum: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(26,107,245,0.2)",
    flexShrink: 0,
  },
  stepNumText: { fontSize: 16, fontWeight: "900", color: C.primary },
  stepContent: { flex: 1, paddingTop: 6 },
  stepTitle: { fontSize: 16, fontWeight: "700", color: C.text, marginBottom: 4 },
  stepDesc: { fontSize: 13, color: C.textMuted, lineHeight: 19 },

  // Bottom CTA
  bottomCTA: { padding: 40, alignItems: "center" },
  bottomCTATitle: {
    fontSize: 26,
    fontWeight: "900",
    color: C.white,
    letterSpacing: -0.5,
    marginBottom: 10,
    textAlign: "center",
  },
  bottomCTASubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
    marginBottom: 28,
    lineHeight: 20,
  },
  bottomCTABtn: {
    backgroundColor: C.white,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  bottomCTABtnText: { fontSize: 15, fontWeight: "700", color: C.primaryDark },

  // Footer
  footer: {
    backgroundColor: "#0A0F1E",
    padding: 32,
    alignItems: "center",
    gap: 6,
  },
  footerBrand: { fontSize: 16, fontWeight: "800", color: C.white },
  footerNote: { fontSize: 12, color: "#6B7280", textAlign: "center" },
  footerCopy: { fontSize: 11, color: "#4B5563", marginTop: 8 },
});
