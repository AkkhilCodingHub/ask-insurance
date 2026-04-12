"use client";

import { useState } from "react";
import { Star, ArrowRight } from "lucide-react";

const insurers = [
  { name: "LIC", rating: 4.8, claims: "98.5%", premiumFrom: "₹5,200/yr", color: "#1A6BF5", tag: "Most Trusted" },
  { name: "HDFC Life", rating: 4.7, claims: "99.1%", premiumFrom: "₹6,800/yr", color: "#E11D48", tag: "Best Claims" },
  { name: "ICICI Pru", rating: 4.6, claims: "97.8%", premiumFrom: "₹5,900/yr", color: "#7C3AED", tag: "Popular" },
  { name: "SBI Life", rating: 4.5, claims: "96.9%", premiumFrom: "₹4,800/yr", color: "#059669", tag: "Budget Pick" },
  { name: "Max Life", rating: 4.7, claims: "99.3%", premiumFrom: "₹7,100/yr", color: "#D97706", tag: "Top Rated" },
  { name: "Bajaj Allianz", rating: 4.4, claims: "95.8%", premiumFrom: "₹5,500/yr", color: "#0891B2", tag: "" },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={11}
          fill={i <= Math.floor(rating) ? "#F59E0B" : "none"}
          color="#F59E0B"
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

function InsurerCard({
  ins,
  index,
}: {
  ins: (typeof insurers)[0];
  index: number;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "var(--white)",
        border: `1.5px solid ${hovered ? ins.color : "var(--border)"}`,
        borderRadius: 18,
        padding: "22px 20px",
        cursor: "pointer",
        transition: "all 0.22s ease",
        transform: hovered ? "translateY(-5px)" : "translateY(0)",
        boxShadow: hovered
          ? `0 16px 40px ${ins.color}22`
          : "0 1px 6px rgba(0,0,0,0.05)",
        position: "relative",
        animationDelay: `${index * 60}ms`,
      }}
    >
      {ins.tag && (
        <div
          style={{
            position: "absolute",
            top: -11,
            right: 16,
            background: ins.color,
            color: "#fff",
            fontSize: 10,
            fontWeight: 700,
            padding: "3px 10px",
            borderRadius: 20,
            letterSpacing: "0.04em",
            boxShadow: `0 2px 8px ${ins.color}44`,
          }}
        >
          {ins.tag}
        </div>
      )}

      {/* Insurer avatar */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          background: ins.color + "18",
          border: `1.5px solid ${ins.color}30`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 15,
          fontWeight: 800,
          color: ins.color,
          marginBottom: 12,
          letterSpacing: "-0.02em",
        }}
      >
        {ins.name.slice(0, 2)}
      </div>

      <div
        style={{
          fontWeight: 700,
          fontSize: 15,
          color: "var(--text)",
          marginBottom: 4,
        }}
      >
        {ins.name}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 14,
        }}
      >
        <StarRating rating={ins.rating} />
        <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>
          {ins.rating}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          paddingTop: 12,
          borderTop: "1px solid var(--border)",
        }}
      >
        <div>
          <div style={{ fontSize: 10, color: "var(--text-light)", marginBottom: 2, fontWeight: 600, letterSpacing: "0.04em" }}>
            CLAIM RATIO
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--success)" }}>
            {ins.claims}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, color: "var(--text-light)", marginBottom: 2, fontWeight: 600, letterSpacing: "0.04em" }}>
            FROM
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: ins.color }}>
            {ins.premiumFrom}
          </div>
        </div>
      </div>

      <button
        style={{
          marginTop: 14,
          width: "100%",
          padding: "9px 0",
          background: hovered ? ins.color : "transparent",
          color: hovered ? "#fff" : ins.color,
          border: `1.5px solid ${ins.color}`,
          borderRadius: 10,
          fontSize: 12,
          fontWeight: 700,
          cursor: "pointer",
          transition: "all 0.18s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 5,
          boxShadow: hovered ? `0 4px 14px ${ins.color}33` : "none",
        }}
      >
        View Plans
        <ArrowRight size={12} />
      </button>
    </div>
  );
}

export function InsurerGrid() {
  return (
    <section style={{ padding: "72px 24px", background: "var(--bg)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: 36,
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "clamp(26px, 4vw, 34px)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: "var(--text)",
                marginBottom: 8,
              }}
            >
              Our insurer partners
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: 15 }}>
              IRDAI-regulated companies with verified claim ratios
            </p>
          </div>
          <a
            href="/compare"
            style={{
              fontSize: 14,
              color: "var(--primary)",
              fontWeight: 600,
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            View all 38+ <ArrowRight size={14} />
          </a>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
          }}
          className="grid-responsive-insurers"
        >
          {insurers.map((ins, i) => (
            <InsurerCard key={ins.name} ins={ins} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
