"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ChevronDown, ChevronUp, Check } from "lucide-react";
import { PLANS } from "@/lib/mock";
import type { Plan } from "@/lib/mock";

type Category = "All" | "Life" | "Health" | "Motor" | "Travel" | "Home";

const categories: Category[] = ["All", "Life", "Health", "Motor", "Travel", "Home"];

function PlanCard({ plan }: { plan: Plan }) {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        background: "var(--white)",
        border: `1px solid ${hovered ? plan.color + "60" : "var(--border)"}`,
        borderRadius: 16,
        overflow: "hidden",
        transition: "border-color 0.2s, box-shadow 0.2s",
        boxShadow: hovered ? "0 4px 20px rgba(0,0,0,0.07)" : "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top row */}
      <div style={{ padding: "18px 20px 14px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Avatar */}
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
              <span style={{ fontSize: 13, fontWeight: 800, color: plan.color }}>
                {plan.short}
              </span>
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>
                {plan.insurer}
              </p>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{plan.plan}</p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
            {plan.badge && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: plan.color,
                  background: plan.color + "18",
                  padding: "3px 10px",
                  borderRadius: 100,
                  whiteSpace: "nowrap",
                }}
              >
                {plan.badge}
              </span>
            )}
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--success)",
                background: "var(--success-light)",
                padding: "2px 8px",
                borderRadius: 100,
              }}
            >
              {plan.claims} claims
            </span>
          </div>
        </div>

        {/* Metrics */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 8,
            marginBottom: 14,
          }}
        >
          {[
            { label: "Premium", value: plan.premium },
            { label: "Cover", value: plan.cover },
            { label: "Category", value: plan.category },
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{
                background: "var(--bg)",
                borderRadius: 8,
                padding: "8px 10px",
              }}
            >
              <p style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 2 }}>{label}</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Expandable features */}
        {expanded && (
          <div style={{ marginBottom: 12 }}>
            {plan.features.map((f) => (
              <div
                key={f}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  padding: "5px 0",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: plan.color + "20",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  <Check size={10} color={plan.color} strokeWidth={3} />
                </div>
                <span style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.4 }}>{f}</span>
              </div>
            ))}
          </div>
        )}

        {/* Toggle features */}
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
            color: "var(--text-muted)",
            padding: 0,
            marginBottom: 14,
          }}
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {expanded ? "Hide features" : `View ${plan.features.length} features`}
        </button>

        {/* CTA */}
        <Link
          href={`/dashboard/plans/${plan.id}`}
          style={{
            display: "block",
            width: "100%",
            padding: "11px",
            textAlign: "center",
            background: `linear-gradient(135deg, ${plan.color}, ${plan.color}cc)`,
            border: "none",
            borderRadius: 10,
            color: "#fff",
            fontSize: 14,
            fontWeight: 700,
            textDecoration: "none",
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.opacity = "0.88")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.opacity = "1")
          }
        >
          Get Quote →
        </Link>
      </div>
    </div>
  );
}

export default function PlansPage() {
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [search, setSearch] = useState("");

  const filtered = PLANS.filter((p) => {
    const matchCat = activeCategory === "All" || p.category === activeCategory;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      p.plan.toLowerCase().includes(q) ||
      p.insurer.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  return (
    <div style={{ width: "100%" }}>
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: "-0.04em",
            color: "var(--text)",
            marginBottom: 4,
          }}
        >
          Compare Insurance Plans
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
          Browse {PLANS.length} plans from 38+ top insurers
        </p>
      </div>

      {/* Search */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 16px",
          border: "1.5px solid var(--border)",
          borderRadius: 12,
          background: "var(--white)",
          marginBottom: 16,
          height: 48,
        }}
      >
        <Search size={18} color="var(--text-muted)" />
        <input
          type="text"
          placeholder="Search plans, insurers…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            fontSize: 15,
            color: "var(--text)",
            background: "transparent",
          }}
        />
      </div>

      {/* Category chips */}
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 24,
        }}
      >
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
                background: active ? "var(--primary)" : "var(--white)",
                color: active ? "#fff" : "var(--text-muted)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--primary)";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--primary)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
                }
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Plan cards grid */}
      {filtered.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 20,
          }}
          className="plans-grid"
        >
          {filtered.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      ) : (
        <div
          style={{
            textAlign: "center",
            padding: "60px 24px",
            color: "var(--text-muted)",
          }}
        >
          <Search size={40} color="var(--border)" style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 16, fontWeight: 600 }}>No plans found</p>
          <p style={{ fontSize: 13 }}>Try adjusting your search or filter</p>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .plans-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
