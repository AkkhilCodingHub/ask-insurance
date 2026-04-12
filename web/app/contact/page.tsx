import { Mail, Phone, MapPin, Send } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const details = [
  {
    title: "Phone support",
    value: "+91 98765 43210",
    icon: Phone,
  },
  {
    title: "Email",
    value: "support@askinsurance.in",
    icon: Mail,
  },
  {
    title: "Office",
    value: "Mumbai, Maharashtra, India",
    icon: MapPin,
  },
];

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main style={{ background: "var(--bg)", minHeight: "100vh" }}>
        <section style={{ background: "linear-gradient(135deg, #0D4D92 0%, #0EA5E9 75%)", color: "#fff", padding: "72px 24px 60px" }}>
          <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
            <p style={{ margin: 0, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", fontSize: 12, color: "rgba(255,255,255,0.8)", marginBottom: 16 }}>
              Contact ASK Insurance
            </p>
            <h1 style={{ fontSize: 42, fontWeight: 900, lineHeight: 1.05, marginBottom: 18 }}>
              Reach us for quotes, claims, or policy support.
            </h1>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(255,255,255,0.8)", maxWidth: 640, margin: "0 auto" }}>
              Our team is available by phone, email, and chat. We’ll help you compare plans, file a claim, or renew your policy with the right cover.
            </p>
          </div>
        </section>

        <section className="contact-main-grid" style={{ maxWidth: 1120, margin: "0 auto", padding: "56px 24px 80px", display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 38 }}>
          <div style={{ display: "grid", gap: 24 }}>
            {details.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} style={{ background: "#fff", borderRadius: 24, padding: "30px 28px", boxShadow: "0 18px 42px rgba(15, 23, 42, 0.08)", display: "flex", gap: 18, alignItems: "center" }}>
                  <div style={{ width: 56, height: 56, borderRadius: 18, background: "rgba(14, 165, 233, 0.12)", display: "grid", placeItems: "center" }}>
                    <Icon size={24} color="#0F172A" />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--primary)" }}>{item.title}</p>
                    <p style={{ margin: "8px 0 0", fontSize: 16, color: "var(--text)", fontWeight: 600 }}>{item.value}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ background: "#fff", borderRadius: 30, padding: "36px 32px", boxShadow: "0 18px 42px rgba(15, 23, 42, 0.08)" }}>
            <p style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", color: "var(--primary)", marginBottom: 14 }}>Send a message</p>
            <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 22 }}>We’ll respond within one business day.</h2>
            <div style={{ display: "grid", gap: 18 }}>
              <input type="text" placeholder="Your name" style={{ width: "100%", padding: "16px 18px", borderRadius: 16, border: "1px solid var(--border)", outline: "none", fontSize: 14 }} />
              <input type="email" placeholder="Your email" style={{ width: "100%", padding: "16px 18px", borderRadius: 16, border: "1px solid var(--border)", outline: "none", fontSize: 14 }} />
              <textarea placeholder="How can we help?" rows={6} style={{ width: "100%", padding: "16px 18px", borderRadius: 16, border: "1px solid var(--border)", outline: "none", fontSize: 14 }} />
              <button style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "15px 24px", borderRadius: 14, background: "var(--primary)", color: "#fff", fontWeight: 700, border: "none", cursor: "pointer" }}>
                Send message <Send size={16} />
              </button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <style>{`
        @media (max-width: 768px) {
          .contact-main-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}
