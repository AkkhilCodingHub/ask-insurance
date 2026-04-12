import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ShieldCheck, Clock3, Globe2, ArrowRight } from "lucide-react";

const claimSteps = [
  {
    title: "Start your claim",
    desc: "Submit your policy number, incident details, and documents in minutes using our guided form.",
    icon: ShieldCheck,
  },
  {
    title: "Track progress",
    desc: "Follow each update instantly in your dashboard and receive SMS, email and app notifications.",
    icon: Clock3,
  },
  {
    title: "Get cashless help",
    desc: "Access our 3,800+ cashless network hospitals and receive support from our claims team.",
    icon: Globe2,
  },
];

export default function ClaimsPage() {
  return (
    <>
      <Navbar />
      <main style={{ background: "var(--bg)", minHeight: "100vh" }}>
        <section
          style={{
            background: "linear-gradient(135deg, #0B4E9C 0%, #1E90FF 65%, #60A5FA 100%)",
            color: "#fff",
            padding: "72px 24px 64px",
            textAlign: "center",
          }}
        >
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <span style={{ display: "inline-block", marginBottom: 16, fontSize: 12, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.78)" }}>
              Claims support · 24/7 · Cashless network
            </span>
            <h1 style={{ fontSize: 44, fontWeight: 900, lineHeight: 1.05, marginBottom: 20 }}>
              Fast, guided claims for every policy.
            </h1>
            <p style={{ fontSize: 17, lineHeight: 1.8, color: "rgba(255,255,255,0.86)", maxWidth: 640, margin: "0 auto" }}>
              Our claims team helps you settle health, motor, home, and life claims quickly with real-time tracking, document collection, and a trusted cashless network.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap", marginTop: 32 }}>
              <Link href="/login" style={{ padding: "14px 26px", borderRadius: 12, background: "#fff", color: "#0B4E9C", fontWeight: 700, textDecoration: "none" }}>
                Start a claim
              </Link>
              <Link href="/register" style={{ padding: "14px 26px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.9)", background: "transparent", color: "#fff", fontWeight: 700, textDecoration: "none" }}>
                Create policy
              </Link>
            </div>
          </div>
        </section>

        <section style={{ maxWidth: 1120, margin: "0 auto", padding: "56px 24px 80px" }}>
          <div className="claims-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 24 }}>
            {claimSteps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.title} style={{ background: "#fff", borderRadius: 24, padding: "32px 28px", boxShadow: "0 18px 42px rgba(15, 23, 42, 0.08)", minHeight: 260 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 16, background: "#EFF6FF", display: "grid", placeItems: "center", marginBottom: 20 }}>
                    <Icon size={24} color="#1D4ED8" />
                  </div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 14, color: "var(--text)" }}>{step.title}</h2>
                  <p style={{ color: "var(--text-muted)", lineHeight: 1.75 }}>{step.desc}</p>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 56, display: "flex", flexDirection: "column", gap: 22, background: "#fff", borderRadius: 24, padding: "34px 32px" }}>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 20 }}>
              <div style={{ maxWidth: 560 }}>
                <p style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", color: "#0F172A", letterSpacing: "0.12em", marginBottom: 10 }}>
                  Why claims with ASK?</p>
                <h2 style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.2, marginBottom: 14 }}>
                  Clear status updates, expert claims support, and faster payout.
                </h2>
                <p style={{ color: "var(--text-muted)", lineHeight: 1.8 }}>
                  We remove the paperwork friction and keep you informed at every step. Your dedicated claims specialist helps verify documents, liaise with insurers, and deliver the outcome you deserve.
                </p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12, flexShrink: 0, minWidth: 240 }}>
                {[
                  { label: "98%", value: "Claim assistance approval" },
                  { label: "3.6k+", value: "Cashless hospitals" },
                  { label: "10 min", value: "Response time" },
                  { label: "4.9/5", value: "Customer satisfaction" },
                ].map((item) => (
                  <div key={item.label} style={{ padding: "16px", borderRadius: 18, background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                    <p style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", marginBottom: 4 }}>{item.label}</p>
                    <p style={{ fontSize: 13, color: "#475569" }}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <p style={{ margin: 0, color: "var(--text)", fontWeight: 600 }}>
                Need help filing a claim right now? Our team is ready to assist across phone, chat, and e-mail.
              </p>
              <Link href="/contact" style={{ padding: "14px 22px", borderRadius: 12, background: "#1D4ED8", color: "#fff", fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8 }}>
                Contact support <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <style>{`
        @media (max-width: 980px) { .claims-grid { grid-template-columns: 1fr !important; } }
        @media (max-width: 768px) { .claims-grid { grid-template-columns: 1fr !important; } }
        @media (max-width: 640px) { .claims-stats { grid-template-columns: 1fr !important; } }
      `}</style>
    </>
  );
}
