"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const insuranceTypes = ["Life", "Health", "Motor", "Travel"];

const coverOptions = [
  { label: "₹25 Lakh", value: "25L" },
  { label: "₹50 Lakh", value: "50L" },
  { label: "₹1 Crore", value: "1Cr" },
  { label: "₹2 Crore", value: "2Cr" },
];

const trustBadges = ["Zero commission", "Instant policy", "24×7 support"];

export function Hero() {
  const [activeType, setActiveType] = useState("Life");
  const [age, setAge] = useState("");
  const [cover, setCover] = useState("");
  const [phone, setPhone] = useState("");

  return (
    <section
      style={{
        background: "linear-gradient(145deg, #EBF2FF 0%, #F0F8FF 40%, #E0F6FF 70%, #EBF2FF 100%)",
        padding: "72px 24px 80px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background orbs */}
      <div
        style={{
          position: "absolute",
          top: -80,
          right: "10%",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -60,
          left: "5%",
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(26,107,245,0.1) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr 420px",
          gap: 56,
          alignItems: "center",
          position: "relative",
        }}
        className="grid-responsive-hero"
      >
        {/* Left — headline */}
        <div className="animate-fade-up">
          {/* Live badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              background: "var(--success-light)",
              border: "1px solid #6EE7B7",
              borderRadius: 20,
              padding: "5px 14px",
              marginBottom: 24,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "var(--success)",
                display: "inline-block",
                boxShadow: "0 0 6px #059669",
              }}
            />
            <span style={{ fontSize: 12, color: "var(--success)", fontWeight: 600 }}>
              India&apos;s fastest growing insurance broker
            </span>
          </div>

          <h1
            style={{
              fontSize: "clamp(36px, 5vw, 56px)",
              fontWeight: 900,
              lineHeight: 1.08,
              letterSpacing: "-0.04em",
              color: "var(--text)",
              marginBottom: 20,
            }}
          >
            Insurance that{" "}
            <span
              style={{
                background: "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              actually works
            </span>
            <br />
            for you
          </h1>

          <p
            style={{
              fontSize: 17,
              color: "var(--text-muted)",
              lineHeight: 1.7,
              maxWidth: 460,
              marginBottom: 36,
            }}
          >
            Compare 38+ IRDAI-regulated insurers, get instant quotes, and buy
            in minutes. No agents, no paperwork, no confusion.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
            {trustBadges.map((b) => (
              <div key={b} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <CheckCircle2 size={15} color="var(--success)" />
                <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>
                  {b}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — quote card */}
        <div
          className="animate-fade-up-delay glow-blue-sm"
          style={{
            background: "var(--white)",
            borderRadius: 24,
            padding: 32,
            border: "1px solid var(--border)",
            boxShadow: "0 12px 48px rgba(26,107,245,0.1)",
          }}
        >
          <div
            style={{
              fontSize: 17,
              fontWeight: 700,
              marginBottom: 22,
              color: "var(--text)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "var(--accent)",
                display: "inline-block",
                boxShadow: "0 0 8px var(--accent)",
              }}
            />
            Find your plan
          </div>

          {/* Type tabs */}
          <div
            style={{
              display: "flex",
              gap: 4,
              background: "var(--bg)",
              borderRadius: 12,
              padding: 4,
              marginBottom: 20,
            }}
          >
            {insuranceTypes.map((t) => (
              <button
                key={t}
                onClick={() => setActiveType(t)}
                style={{
                  flex: 1,
                  padding: "8px 0",
                  borderRadius: 9,
                  border: "none",
                  background:
                    activeType === t
                      ? "linear-gradient(135deg, var(--primary), var(--accent-dark))"
                      : "transparent",
                  color: activeType === t ? "#fff" : "var(--text-muted)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: activeType === t ? "0 2px 8px rgba(26,107,245,0.35)" : "none",
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Inputs */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  display: "block",
                  marginBottom: 6,
                  letterSpacing: "0.05em",
                }}
              >
                YOUR AGE
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 28"
                style={{
                  width: "100%",
                  padding: "10px 13px",
                  border: "1.5px solid var(--border)",
                  borderRadius: 10,
                  fontSize: 14,
                  outline: "none",
                  background: "var(--white)",
                  color: "var(--text)",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  display: "block",
                  marginBottom: 6,
                  letterSpacing: "0.05em",
                }}
              >
                COVER AMOUNT
              </label>
              <select
                value={cover}
                onChange={(e) => setCover(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 13px",
                  border: "1.5px solid var(--border)",
                  borderRadius: 10,
                  fontSize: 14,
                  outline: "none",
                  background: "var(--white)",
                  color: cover ? "var(--text)" : "var(--text-muted)",
                  cursor: "pointer",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              >
                <option value="">Select</option>
                {coverOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Phone */}
          <div style={{ marginBottom: 18 }}>
            <label
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--text-muted)",
                display: "block",
                marginBottom: 6,
                letterSpacing: "0.05em",
              }}
            >
              MOBILE NUMBER
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <span
                style={{
                  padding: "10px 13px",
                  border: "1.5px solid var(--border)",
                  borderRadius: 10,
                  fontSize: 14,
                  color: "var(--text-muted)",
                  background: "var(--bg)",
                  whiteSpace: "nowrap",
                }}
              >
                +91
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter mobile number"
                maxLength={10}
                style={{
                  flex: 1,
                  padding: "10px 13px",
                  border: "1.5px solid var(--border)",
                  borderRadius: 10,
                  fontSize: 14,
                  outline: "none",
                  background: "var(--white)",
                  color: "var(--text)",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>
          </div>

          {/* CTA */}
          <button
            className="glow-blue"
            style={{
              width: "100%",
              padding: "15px 0",
              background: "linear-gradient(135deg, var(--primary) 0%, var(--accent-dark) 100%)",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "transform 0.15s, box-shadow 0.15s",
              letterSpacing: "0.01em",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "none";
            }}
          >
            Compare Free Quotes
            <ArrowRight size={16} />
          </button>

          <p
            style={{
              fontSize: 11,
              color: "var(--text-light)",
              textAlign: "center",
              marginTop: 12,
            }}
          >
            No spam · No hidden charges · 100% free
          </p>
        </div>
      </div>
    </section>
  );
}
