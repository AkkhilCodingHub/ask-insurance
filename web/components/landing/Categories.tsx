"use client";

import Link from "next/link";
import { Shield, Activity, Car, Plane, Truck, ChevronRight } from "lucide-react";

const categories = [
  {
    Icon: Car,
    label: "Car Insurance",
    desc: "Instant RC Auto-Fetch · 50% NCB Rollover · Zero Dep Cover",
    tag: "SAVE UPTO 50%",
    providers: ["HDFC ERGO", "ICICI Lombard", "Tata AIG", "Go Digit", "Bajaj Allianz"],
    href: "/products?type=motor",
    color: "#1A6BF5"
  },
  {
    Icon: Activity,
    label: "Health Insurance",
    desc: "10,000+ Cashless Hospitals · OPD & Critical Illness Cover",
    tag: "CASHLESS 24x7",
    providers: ["Star Health", "Niva Bupa", "HDFC ERGO Health", "Care Insurance"],
    href: "/products?type=health",
    color: "#10B981"
  },
  {
    Icon: Plane,
    label: "Travel Insurance",
    desc: "Medical Emergencies · Trip Disruptions · Baggage & Passport Cover",
    tag: "INSTANT VISA PDF",
    providers: ["Tata AIG Travel", "HDFC ERGO Travel", "Reliance General"],
    href: "/products?type=travel",
    color: "#0EA5E9"
  },
  {
    Icon: Shield,
    label: "Term Life Insurance",
    desc: "₹1 Cr Pure Protection Cover from ₹490/mo · Tax Saver u/s 80C",
    tag: "TAX SAVER 80C",
    providers: ["HDFC Life", "ICICI Prudential", "TATA AIA", "Max Life"],
    href: "/products?type=life",
    color: "#EF4444"
  },
  {
    Icon: Car,
    label: "2 Wheeler Insurance",
    desc: "Instant Bike Renewal in 60 Seconds · Third Party & Comprehensive",
    tag: "FROM ₹482/YR",
    providers: ["Go Digit", "ICICI Lombard", "Reliance General", "SBI General"],
    href: "/products?type=two_wheeler",
    color: "#8B5CF6"
  },
  {
    Icon: Truck,
    label: "Commercial Vehicle",
    desc: "Heavy & Light Goods Vehicles · Taxis & Fleet Coverage",
    tag: "BEST FLEET RATES",
    providers: ["SBI General", "Bajaj Allianz", "ICICI Lombard"],
    href: "/products?type=commercial",
    color: "#6366F1"
  },
];

export function Categories() {
  return (
    <section style={{ padding: "72px 24px", background: "var(--white)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: "var(--primary)", background: "var(--primary-light)", padding: "4px 12px", borderRadius: 100, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            POLICY PROVIDER MATRIX
          </span>
          <h2 style={{ fontSize: "clamp(26px, 4vw, 36px)", fontWeight: 900, letterSpacing: "-0.03em", color: "var(--text)", marginTop: 8, marginBottom: 8 }}>
            Available Insurance Categories &amp; Providers
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: 15, margin: 0 }}>
            Compare live quotes directly from leading IRDAI licensed insurance partners
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }} className="grid-responsive-categories">
          <style>{`
            @media (max-width: 1024px) { .grid-responsive-categories { grid-template-columns: repeat(2, 1fr) !important; } }
            @media (max-width: 640px) { .grid-responsive-categories { grid-template-columns: 1fr !important; } }
            .pb-product-card:hover {
              transform: translateY(-4px);
              border-color: var(--primary) !important;
              box-shadow: 0 12px 30px rgba(26,107,245,0.12) !important;
            }
          `}</style>
          {categories.map(({ Icon, label, desc, tag, providers, href, color }) => (
            <Link
              key={label}
              href={href}
              style={{
                background: "var(--bg)",
                border: "1.5px solid var(--border)",
                borderRadius: 16,
                padding: "22px 20px",
                textDecoration: "none",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                transition: "all 0.22s ease",
                position: "relative",
              }}
              className="pb-product-card"
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: color + "15", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={22} color={color} strokeWidth={2.5} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 800, color, background: color + "18", padding: "3px 8px", borderRadius: 100 }}>
                    {tag}
                  </span>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>
                  {label}
                </h3>
                <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 12px", lineHeight: 1.5 }}>
                  {desc}
                </p>

                {/* Partner Badges */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
                  {providers.map((p) => (
                    <span key={p} style={{ fontSize: 10, fontWeight: 700, color: "var(--text)", background: "var(--white)", border: "1px solid var(--border)", padding: "2px 6px", borderRadius: 4 }}>
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 12, fontSize: 12, fontWeight: 700, color: "var(--primary)" }}>
                Compare Live Quotes <ChevronRight size={14} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
