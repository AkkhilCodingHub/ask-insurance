"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ChevronDown, ChevronUp, Check, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PLANS } from "@/lib/mock";
import type { Plan } from "@/lib/mock";

type Category = "All" | "Life" | "Health" | "Motor" | "Travel" | "Home";
const categories: Category[] = ["All", "Life", "Health", "Motor", "Travel", "Home"];

function PlanCard({ plan }: { plan: Plan }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid var(--border)",
        borderRadius: 16,
        overflow: "hidden",
        transition: "box-shadow 0.2s",
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.07)")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.boxShadow = "none")}
    >
      <div style={{ height: 4, background: `linear-gradient(90deg, ${plan.color}, ${plan.color}88)` }} />
      <div style={{ padding: "18px 20px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: plan.color + "18",
                border: `1.5px solid ${plan.color}30`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 800, color: plan.color }}>{plan.short}</span>
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>{plan.insurer}</p>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{plan.plan}</p>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}>
            {plan.badge && (
              <span style={{ fontSize: 10, fontWeight: 700, color: plan.color, background: plan.color + "18", padding: "2px 9px", borderRadius: 100 }}>
                {plan.badge}
              </span>
            )}
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--success)", background: "var(--success-light)", padding: "2px 8px", borderRadius: 100 }}>
              {plan.claims} settled
            </span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 14 }}>
          {[{ label: "Premium", value: plan.premium }, { label: "Cover", value: plan.cover }, { label: "Category", value: plan.category }].map(({ label, value }) => (
            <div key={label} style={{ background: "var(--bg)", borderRadius: 8, padding: "8px 10px" }}>
              <p style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 2 }}>{label}</p>
              <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{value}</p>
            </div>
          ))}
        </div>

        {expanded && (
          <div style={{ marginBottom: 12 }}>
            {plan.features.map((f) => (
              <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "5px 0", borderBottom: "1px solid var(--border)" }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: plan.color + "20", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                  <Check size={10} color={plan.color} strokeWidth={3} />
                </div>
                <span style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.4 }}>{f}</span>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", padding: 0, marginBottom: 14 }}
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {expanded ? "Hide features" : `View ${plan.features.length} features`}
        </button>

        <Link
          href="/login"
          style={{
            display: "block",
            width: "100%",
            padding: "11px",
            textAlign: "center",
            background: `linear-gradient(135deg, ${plan.color}, ${plan.color}cc)`,
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
          Get Quote →
        </Link>
      </div>
    </div>
  );
}

export default function ComparePage() {
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [search, setSearch] = useState("");

  const filtered = PLANS.filter((p) => {
    const matchCat = activeCategory === "All" || p.category === activeCategory;
    const q = search.toLowerCase();
    return matchCat && (!q || p.plan.toLowerCase().includes(q) || p.insurer.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
  });

  return (
    <>
      <Navbar />
      <main style={{ background: "var(--bg)", minHeight: "100vh" }}>
        {/* Hero */}
        <div style={{ background: "linear-gradient(135deg, #083A8C 0%, #1580FF 60%, #0EA5E9 100%)", padding: "60px 24px 72px", textAlign: "center" }}>
          <div style={{ maxWidth: 640, margin: "0 auto" }}>
            <h1 style={{ fontSize: 40, fontWeight: 900, color: "#fff", letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: 14 }}>
              Compare insurance plans<br />side by side
            </h1>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.75)", marginBottom: 28, lineHeight: 1.6 }}>
              Browse {PLANS.length} plans from India's top insurers. Sign up for personalised quotes and instant policy issuance.
            </p>
            <Link
              href="/register"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "13px 28px",
                background: "#fff",
                borderRadius: 12,
                color: "var(--primary)",
                fontSize: 14,
                fontWeight: 700,
                textDecoration: "none",
                transition: "opacity 0.15s",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.9")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
            >
              Get personalised quotes <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px 80px" }}>
          {/* Search */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 16px", border: "1.5px solid var(--border)", borderRadius: 12, background: "#fff", marginBottom: 16, height: 48 }}>
            <Search size={18} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search plans, insurers…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, border: "none", outline: "none", fontSize: 15, color: "var(--text)", background: "transparent" }}
            />
          </div>

          {/* Category chips */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 28 }}>
            {categories.map((cat) => {
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: "8px 18px",
                    borderRadius: 100,
                    border: active ? "none" : "1.5px solid var(--border)",
                    background: active ? "var(--primary)" : "#fff",
                    color: active ? "#fff" : "var(--text-muted)",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Plans grid */}
          {filtered.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }} className="compare-grid">
              {filtered.map((plan) => <PlanCard key={plan.id} plan={plan} />)}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "60px 24px", color: "var(--text-muted)" }}>
              <Search size={40} color="var(--border)" style={{ marginBottom: 12 }} />
              <p style={{ fontSize: 16, fontWeight: 600 }}>No plans found</p>
              <p style={{ fontSize: 13 }}>Try adjusting your search or filter</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
      <style>{`
        @media (max-width: 900px) { .compare-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 600px) { .compare-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </>
  );
}
