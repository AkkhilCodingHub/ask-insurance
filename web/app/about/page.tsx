import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Shield, Users, Sparkles, Globe2 } from "lucide-react";

const values = [
  {
    title: "Trusted insurance advice",
    desc: "We partner with 38+ leading insurers to bring you unbiased, IRDAI-compliant recommendations.",
    icon: Shield,
  },
  {
    title: "Fast digital experience",
    desc: "From quote to purchase to policy renewal, the entire journey is online and easy to complete.",
    icon: Sparkles,
  },
  {
    title: "Customer-first service",
    desc: "A dedicated team handles claims, renewals, and policy updates so you can focus on what matters.",
    icon: Users,
  },
  {
    title: "Coverage across India",
    desc: "Access plans for individuals, families, vehicles, homes, travel and businesses in every state.",
    icon: Globe2,
  },
];

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main style={{ background: "var(--bg)", minHeight: "100vh" }}>
        <section style={{ padding: "72px 24px 62px", maxWidth: 1040, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 40, alignItems: "center" }}>
            <div>
              <span style={{ display: "inline-block", marginBottom: 16, fontSize: 12, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--primary)" }}>
                About ASK Insurance
              </span>
              <h1 style={{ fontSize: 42, lineHeight: 1.05, fontWeight: 900, marginBottom: 22 }}>
                We make insurance easy, reliable and fast for every Indian household.
              </h1>
              <p style={{ fontSize: 17, lineHeight: 1.8, color: "var(--text-muted)", maxWidth: 640 }}>
                ASK Insurance is an IRDAI licensed broker focused on helping customers compare, buy, and manage insurance with clarity. We simplify the process using digital tools and expert support.
              </p>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 32 }}>
                <Link href="/products" style={{ padding: "14px 26px", borderRadius: 12, background: "var(--primary)", color: "#fff", fontWeight: 700, textDecoration: "none" }}>
                  View products
                </Link>
                <Link href="/contact" style={{ padding: "14px 26px", borderRadius: 12, border: "1px solid var(--border)", background: "transparent", color: "var(--text)", fontWeight: 700, textDecoration: "none" }}>
                  Talk to our team
                </Link>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 20 }}>
              {[
                { value: "38+", label: "Insurers", accent: "#0EA5E9" },
                { value: "4.9/5", label: "Customer rating", accent: "#22C55E" },
                { value: "98%", label: "Renewal support", accent: "#F97316" },
                { value: "24/7", label: "Claims help", accent: "#8B5CF6" },
              ].map((stat) => (
                <div key={stat.label} style={{ borderRadius: 24, padding: "28px 24px", background: "#fff", boxShadow: "0 20px 42px rgba(15, 23, 42, 0.08)" }}>
                  <p style={{ margin: 0, fontSize: 30, fontWeight: 900, color: stat.accent }}>{stat.value}</p>
                  <p style={{ margin: 0, marginTop: 10, color: "var(--text-muted)", fontSize: 13 }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ background: "#fff", padding: "58px 24px 72px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, marginBottom: 40 }}>
              {values.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} style={{ display: "flex", gap: 18, padding: "24px 24px 24px 22px", borderRadius: 22, border: "1px solid var(--border)", background: "#F8FAFC" }}>
                    <div style={{ width: 52, height: 52, borderRadius: 18, background: "rgba(59, 130, 246, 0.1)", display: "grid", placeItems: "center" }}>
                      <Icon size={24} color="#0F172A" />
                    </div>
                    <div>
                      <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>{item.title}</h2>
                      <p style={{ margin: 0, color: "var(--text-muted)", lineHeight: 1.75 }}>{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 26, alignItems: "start" }}>
              <div style={{ background: "#F8FAFC", borderRadius: 24, padding: "32px" }}>
                <p style={{ color: "var(--primary)", fontWeight: 700, marginBottom: 12 }}>Our promise</p>
                <h2 style={{ marginTop: 0, fontSize: 24, fontWeight: 800, marginBottom: 16 }}>Transparent policies. Zero hidden fees. Human support.</h2>
                <p style={{ color: "var(--text-muted)", lineHeight: 1.8 }}>
                  We explain policy terms in plain language, compare the best options for you, and stay with you through renewals and claims.
                </p>
              </div>
              <div style={{ display: "grid", gap: 16 }}>
                {[
                  "IRDAI licensed broker",
                  "Instant digital quotes",
                  "Expert policy advisory",
                  "Secure customer portal",
                ].map((item) => (
                  <div key={item} style={{ background: "#fff", borderRadius: 20, padding: "22px", border: "1px solid var(--border)" }}>
                    <p style={{ margin: 0, fontWeight: 700, color: "var(--text)" }}>{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
