"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Shield,
  Award,
  FileText,
  Clock,
  Lock,
  Star,
  BadgeCheck,
  TrendingUp,
  PhoneCall,
} from "lucide-react";
import { PLANS } from "@/lib/mock";

export default function PlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const plan = PLANS.find((p) => p.id === id);

  if (!plan) {
    return (
      <div style={{ textAlign: "center", padding: "80px 24px" }}>
        <Shield size={48} color="var(--border)" style={{ marginBottom: 12 }} />
        <p style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Plan not found</p>
        <Link
          href="/dashboard/plans"
          style={{ color: "var(--primary)", textDecoration: "none", fontSize: 14 }}
        >
          ← Back to Plans
        </Link>
      </div>
    );
  }

  return (
    <div style={{ width: "100%" }}>
      {/* Back button */}
      <button
        onClick={() => router.back()}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 600,
          color: "var(--text-muted)",
          padding: 0,
          marginBottom: 20,
          transition: "color 0.15s",
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--primary)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)")}
      >
        <ArrowLeft size={15} />
        Back to Plans
      </button>

      {/* ── Full-width hero banner ─────────────────────────── */}
      <div
        style={{
          borderRadius: 20,
          padding: "32px 36px 0",
          marginBottom: 24,
          background: `linear-gradient(135deg, ${plan.color}18 0%, ${plan.color}08 100%)`,
          border: `1px solid ${plan.color}28`,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Decorative blobs */}
        <div
          style={{
            position: "absolute",
            top: -60,
            right: -60,
            width: 220,
            height: 220,
            borderRadius: "50%",
            background: plan.color + "0A",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            right: 180,
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: plan.color + "07",
            pointerEvents: "none",
          }}
        />

        {/* Insurer + badges row */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 68,
                height: 68,
                borderRadius: 18,
                background: "var(--white)",
                border: `2px solid ${plan.color}35`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: `0 4px 20px ${plan.color}15`,
              }}
            >
              <span style={{ fontSize: 17, fontWeight: 800, color: plan.color }}>{plan.short}</span>
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                <h1
                  style={{
                    fontSize: 24,
                    fontWeight: 900,
                    letterSpacing: "-0.04em",
                    color: "var(--text)",
                    lineHeight: 1.1,
                  }}
                >
                  {plan.plan}
                </h1>
                {plan.badge && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: plan.color,
                      background: plan.color + "18",
                      padding: "3px 10px",
                      borderRadius: 100,
                      flexShrink: 0,
                    }}
                  >
                    {plan.badge}
                  </span>
                )}
              </div>
              <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
                {plan.insurer} &nbsp;·&nbsp; {plan.category} Insurance
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: 12,
                fontWeight: 700,
                color: "#059669",
                background: "#ECFDF5",
                padding: "5px 12px",
                borderRadius: 100,
              }}
            >
              <BadgeCheck size={13} />
              IRDAI Approved
            </span>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: 12,
                fontWeight: 700,
                color: "#7C3AED",
                background: "#F5F3FF",
                padding: "5px 12px",
                borderRadius: 100,
              }}
            >
              <TrendingUp size={13} />
              {plan.claims} settled
            </span>
          </div>
        </div>

        {/* Metrics strip — white rounded top, flows into main */}
        <div
          style={{
            background: "var(--white)",
            borderRadius: "14px 14px 0 0",
            padding: "20px 28px",
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 0,
          }}
          className="hero-metrics"
        >
          {[
            { label: "Annual Premium", value: plan.premium, highlight: true },
            { label: "Sum Insured", value: plan.cover, highlight: false },
            { label: "Claim Settlement", value: plan.claims, highlight: false },
            { label: "Tenure", value: plan.tenure, highlight: false },
          ].map(({ label, value, highlight }, i, arr) => (
            <div
              key={label}
              style={{
                textAlign: "center",
                padding: "0 16px",
                borderRight: i < arr.length - 1 ? "1px solid var(--border)" : "none",
              }}
            >
              <p
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: highlight ? plan.color : "var(--text)",
                  letterSpacing: "-0.04em",
                  marginBottom: 4,
                }}
              >
                {value}
              </p>
              <p style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Two-column body ─────────────────────────────────── */}
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}
        className="detail-grid"
      >
        {/* LEFT — main content */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* About */}
          <div
            style={{
              background: "var(--white)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: "22px 24px",
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 10 }}>
              About this plan
            </h2>
            <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.75 }}>
              {plan.description}
            </p>
          </div>

          {/* Key Features */}
          <div
            style={{
              background: "var(--white)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: "22px 24px",
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 16 }}>
              Key Features
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
              className="features-grid"
            >
              {plan.features.map((f) => (
                <div
                  key={f}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    padding: "10px 12px",
                    background: "var(--bg)",
                    borderRadius: 10,
                  }}
                >
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: plan.color + "1A",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    <Check size={11} color={plan.color} strokeWidth={3} />
                  </div>
                  <span style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.5 }}>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Policy Details */}
          <div
            style={{
              background: "var(--white)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: "22px 24px",
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 16 }}>
              Policy Details
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { icon: Clock, label: "Policy Tenure", value: plan.tenure },
                { icon: Clock, label: "Waiting Period", value: plan.waiting },
                { icon: Shield, label: "Category", value: plan.category + " Insurance" },
                { icon: Award, label: "Claim Settlement", value: plan.claims },
              ].map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "14px 16px",
                    background: "var(--bg)",
                    borderRadius: 12,
                  }}
                >
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: plan.color + "15",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={17} color={plan.color} />
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 3, fontWeight: 500 }}>{label}</p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Documents Required */}
          <div
            style={{
              background: "var(--white)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: "22px 24px",
              marginBottom: 8,
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 14 }}>
              Documents Required
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {plan.documents.map((doc) => (
                <div
                  key={doc}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 14px",
                    background: "var(--bg)",
                    borderRadius: 100,
                    border: "1px solid var(--border)",
                  }}
                >
                  <FileText size={12} color="var(--text-muted)" />
                  <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>{doc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — sticky sidebar */}
        <div style={{ position: "sticky", top: 80 }} className="detail-sidebar">

          {/* CTA card */}
          <div
            style={{
              background: "var(--white)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              overflow: "hidden",
              marginBottom: 14,
            }}
          >
            {/* Color accent strip */}
            <div style={{ height: 5, background: `linear-gradient(90deg, ${plan.color}, ${plan.color}88)` }} />

            <div style={{ padding: "20px 20px 22px" }}>
              <p style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Annual Premium
              </p>
              <p
                style={{
                  fontSize: 32,
                  fontWeight: 900,
                  color: plan.color,
                  letterSpacing: "-0.05em",
                  marginBottom: 2,
                  lineHeight: 1,
                }}
              >
                {plan.premium}
              </p>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 18 }}>
                Cover: <strong style={{ color: "var(--text)" }}>{plan.cover}</strong>
              </p>

              <Link
                href={`/quote?planId=${plan.id}`}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "13px 0",
                  textAlign: "center",
                  background: `linear-gradient(135deg, ${plan.color}, ${plan.color}cc)`,
                  borderRadius: 12,
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: 700,
                  textDecoration: "none",
                  marginBottom: 10,
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.88")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
              >
                Get Quote →
              </Link>

              <button
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                  width: "100%",
                  padding: "11px 0",
                  background: "var(--bg)",
                  border: "1.5px solid var(--border)",
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  transition: "border-color 0.15s, color 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--primary)";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--primary)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
                }}
              >
                <PhoneCall size={15} />
                Talk to an Advisor
              </button>
            </div>
          </div>

          {/* Trust badges */}
          <div
            style={{
              background: "var(--white)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: "16px 18px",
              marginBottom: 14,
            }}
          >
            <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Why trust us
            </p>
            {[
              { icon: Shield, label: "IRDAI Licensed Broker", color: "var(--primary)" },
              { icon: Award, label: "Top Rated by Customers", color: "#D97706" },
              { icon: Lock, label: "Secure & 100% Private", color: "#059669" },
              { icon: Star, label: "4.8 / 5 on App Store", color: "#7C3AED" },
            ].map(({ icon: Icon, label, color }) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 0",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: color + "15",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={15} color={color} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Insurer info */}
          <div
            style={{
              background: plan.color + "0C",
              border: `1px solid ${plan.color}20`,
              borderRadius: 16,
              padding: "16px 18px",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "var(--white)",
                border: `1.5px solid ${plan.color}30`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 800, color: plan.color }}>{plan.short}</span>
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>{plan.insurer}</p>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {plan.claims} claim settlement ratio
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .detail-grid { grid-template-columns: 1fr !important; }
          .detail-sidebar { position: static !important; }
          .hero-metrics { grid-template-columns: repeat(2, 1fr) !important; }
          .features-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 600px) {
          .hero-metrics { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  );
}
