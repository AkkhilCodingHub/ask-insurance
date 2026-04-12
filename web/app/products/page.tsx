"use client";

import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ArrowRight } from "lucide-react";
import { PRODUCTS } from "@/lib/products";

export default function ProductsPage() {
  return (
    <>
      <Navbar />
      <main style={{ background: "var(--bg)", minHeight: "100vh" }}>
        {/* Hero */}
        <div
          style={{
            background: "linear-gradient(135deg, #083A8C 0%, #1580FF 60%, #0EA5E9 100%)",
            padding: "72px 24px 80px",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ position: "absolute", top: -80, left: "10%", width: 320, height: 320, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -60, right: "8%", width: 260, height: 260, borderRadius: "50%", background: "rgba(255,255,255,0.03)", pointerEvents: "none" }} />
          <div style={{ maxWidth: 680, margin: "0 auto", position: "relative" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 14 }}>
              38+ Top Insurers · IRDAI Licensed
            </span>
            <h1 style={{ fontSize: 44, fontWeight: 900, color: "#fff", letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: 16 }}>
              Insurance products<br />for every need
            </h1>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.75)", lineHeight: 1.6, maxWidth: 520, margin: "0 auto" }}>
              Compare plans from India top insurers, get instant quotes, and buy in minutes. 100% online, zero paperwork.
            </p>
          </div>
        </div>

        {/* Products grid */}
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 24px 80px" }}>
          <div
            style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}
            className="products-grid"
          >
            {PRODUCTS.map(({ id, label, icon: Icon, color, bg, tagline, desc, highlights, plans }) => (
              <div
                key={id}
                style={{
                  background: "#fff",
                  border: "1px solid var(--border)",
                  borderRadius: 20,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  transition: "box-shadow 0.2s, transform 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 32px ${color}18`;
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                }}
              >
                {/* Card header */}
                <div style={{ padding: "24px 24px 20px", background: bg }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 14,
                        background: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: `0 4px 12px ${color}20`,
                      }}
                    >
                      <Icon size={22} color={color} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color, background: "#fff", padding: "3px 10px", borderRadius: 100 }}>
                      {plans}
                    </span>
                  </div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 4 }}>{label}</h2>
                  <p style={{ fontSize: 13, fontWeight: 600, color }}>{tagline}</p>
                </div>

                {/* Card body */}
                <div style={{ padding: "18px 24px 20px", flex: 1, display: "flex", flexDirection: "column" }}>
                  <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.65, marginBottom: 16 }}>{desc}</p>
                  <div style={{ flex: 1 }}>
                    {highlights.map((h) => (
                      <div key={h} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: "var(--text)" }}>{h}</span>
                      </div>
                    ))}
                  </div>
                  <Link
                    href={`/products/${id}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 7,
                      marginTop: 20,
                      padding: "11px 0",
                      background: color,
                      borderRadius: 10,
                      color: "#fff",
                      fontSize: 14,
                      fontWeight: 700,
                      textDecoration: "none",
                      transition: "opacity 0.15s",
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.88")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
                  >
                    Explore {label} <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
      <style>{`
        @media (max-width: 900px) { .products-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 600px) { .products-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </>
  );
}
