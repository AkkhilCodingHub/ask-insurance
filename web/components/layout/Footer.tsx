"use client";

import Link from "next/link";
import { Shield } from "lucide-react";

const footerLinks = [
  {
    title: "Products",
    links: ["Life Insurance", "Health Insurance", "Motor Insurance", "Travel Insurance", "Home Insurance", "Business Insurance"],
  },
  {
    title: "Company",
    links: ["About Us", "Careers", "Blog", "Press"],
  },
  {
    title: "Support",
    links: ["Claims", "Contact", "FAQ", "Grievance"],
  },
];

export function Footer() {
  return (
    <footer style={{ background: "#0A0F1E", color: "#fff" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 24px 28px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: 40, marginBottom: 48 }} className="grid-responsive-footer">
          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  border: "2px solid #38BDF8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "linear-gradient(135deg, #1A6BF5, #38BDF8)",
                  boxShadow: "0 0 16px rgba(56,189,248,0.4)",
                }}
              >
                <Shield size={16} color="#fff" strokeWidth={2.5} />
              </div>
              <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.03em" }}>
                ASK{" "}
                <span style={{ color: "#38BDF8", fontWeight: 400, fontSize: 13 }}>Insurance</span>
              </span>
            </div>
            <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.7, maxWidth: 240 }}>
              IRDAI licensed insurance broker. Reg. No. IB-123-2023. Making insurance simple since 2023.
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
              {["IRDAI", "ISO 27001", "SSL Secured"].map((badge) => (
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
                  key={l}
                  href="#"
                  style={{
                    display: "block",
                    fontSize: 13,
                    color: "#6B7280",
                    textDecoration: "none",
                    marginBottom: 10,
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#38BDF8")}
                  onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#6B7280")}
                >
                  {l}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <div
          style={{
            borderTop: "1px solid #1F2937",
            paddingTop: 20,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 12, color: "#4B5563" }}>
            © 2025 ASK Insurance Broker. All rights reserved.
          </span>
          <div style={{ display: "flex", gap: 20 }}>
            {["Privacy Policy", "Terms of Service", "Disclaimer"].map((l) => (
              <Link key={l} href="#" style={{ fontSize: 12, color: "#4B5563", textDecoration: "none" }}>
                {l}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
