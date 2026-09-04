"use client";

import Link from "next/link";

const footerLinks = [
  {
    title: "Insurance Products",
    links: [
      { name: "Car Insurance", href: "/quote?type=motor" },
      { name: "Two Wheeler", href: "/quote?type=two_wheeler" },
      { name: "Health Insurance", href: "/quote?type=health" },
      { name: "Term Life Insurance", href: "/quote?type=life" },
      { name: "Investment 2.0 (ULIP)", href: "/quote?type=investment_20" },
      { name: "Travel & Commercial", href: "/quote?type=travel" },
    ],
  },
  {
    title: "Services & Portals",
    links: [
      { name: "My Active Policies", href: "/my-policies" },
      { name: "Saved Quotes", href: "/my-quotes" },
      { name: "Become a POSP Partner", href: "/posp" },
      { name: "POSP Online Exam", href: "/posp/exam" },
      { name: "Digital Document Locker", href: "/files" },
      { name: "Tax Receipts (80D/80C)", href: "/payments" },
    ],
  },
  {
    title: "Help & Support",
    links: [
      { name: "Cashless Network Garages", href: "/locator" },
      { name: "24x7 Roadside SOS", href: "/emergency-sos" },
      { name: "File / Track a Claim", href: "/claims" },
      { name: "24x7 Support Chat", href: "/chat" },
      { name: "Knowledge Base & FAQs", href: "/faq" },
      { name: "Central KYC (CKYC)", href: "/kyc" },
    ],
  },
];

export function Footer() {
  return (
    <footer style={{ background: "#0A0F1E", color: "#fff" }}>
      <style>{`
        .grid-responsive-footer { display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr; gap: 40px; margin-bottom: 48px; }
        @media (max-width: 900px) { .grid-responsive-footer { grid-template-columns: 1fr 1fr !important; } }
        @media (max-width: 540px) { .grid-responsive-footer { grid-template-columns: 1fr !important; } }
        .footer-bottom { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }
        @media (max-width: 540px) { .footer-bottom { flex-direction: column !important; align-items: flex-start !important; } }
      `}</style>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 24px 28px" }}>
        <div className="grid-responsive-footer">
          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <img
                src="/logo.jpg"
                alt="ASK Insurance Broker Logo"
                style={{
                  height: 38,
                  width: "auto",
                  objectFit: "contain",
                  borderRadius: 6,
                }}
              />
            </div>
            <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.7, maxWidth: 240 }}>
              IRDAI licensed insurance broker. Direct Broker Reg. No. 882. Delivering transparent, 1-click digital insurance coverage.
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
              {["IRDAI Certified", "ISO 27001", "256-Bit SSL"].map((badge) => (
                <span
                  key={badge}
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    padding: "3px 8px",
                    borderRadius: 4,
                    border: "1px solid #1f2937",
                    color: "#6B7280",
                  }}
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {footerLinks.map(({ title, links }) => (
            <div key={title}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#E2E8F0", marginBottom: 14, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                {title}
              </div>
              {links.map((l) => (
                <Link
                  key={l.name}
                  href={l.href}
                  style={{
                    display: "block",
                    fontSize: 13,
                    color: "#6B7280",
                    textDecoration: "none",
                    marginBottom: 10,
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={(e: any) => ((e.target as HTMLElement).style.color = "#38BDF8")}
                  onMouseLeave={(e: any) => ((e.target as HTMLElement).style.color = "#6B7280")}
                >
                  {l.name}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <div
          className="footer-bottom"
          style={{
            borderTop: "1px solid #1F2937",
            paddingTop: 20,
          }}
        >
          <span style={{ fontSize: 12, color: "#4B5563" }}>
            © 2026 ASK Insurance Brokers Pvt. Ltd. All rights reserved.
          </span>
          <div style={{ display: "flex", gap: 20 }}>
            {[
              { name: "Privacy Policy", href: "/privacy" },
              { name: "Terms of Service", href: "/terms" },
              { name: "Claims Grievance", href: "/faq" },
            ].map((l) => (
              <Link key={l.name} href={l.href} style={{ fontSize: 12, color: "#4B5563", textDecoration: "none" }}>
                {l.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
