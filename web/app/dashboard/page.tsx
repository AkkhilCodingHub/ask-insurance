"use client";

import Link from "next/link";
import {
  Shield,
  FileText,
  Headphones,
  RefreshCw,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/context/auth";
import { MY_POLICIES, MY_CLAIMS, PLANS } from "@/lib/mock";

function StatCard({
  icon,
  iconBg,
  label,
  value,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string | number;
}) {
  return (
    <div
      style={{
        background: "var(--white)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: 20,
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 2 }}>{label}</p>
        <p style={{ fontSize: 24, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.04em" }}>
          {value}
        </p>
      </div>
    </div>
  );
}

const quickActions = [
  {
    icon: FileText,
    label: "Compare Plans",
    href: "/dashboard/plans",
    color: "var(--primary)",
    bg: "var(--primary-light)",
  },
  {
    icon: Shield,
    label: "File Claim",
    href: "/dashboard/claims",
    color: "#059669",
    bg: "#ECFDF5",
  },
  {
    icon: RefreshCw,
    label: "Renew Policy",
    href: "/dashboard",
    color: "#D97706",
    bg: "#FFFBEB",
  },
  {
    icon: Headphones,
    label: "Talk to Expert",
    href: "#",
    color: "#7C3AED",
    bg: "#F5F3FF",
  },
];

export default function DashboardPage() {
  const { user } = useAuth();

  const firstName = user?.name?.split(" ")[0] ?? "there";
  const openClaims = MY_CLAIMS.filter((c) => c.status === "Processing").length;

  return (
    <div style={{ width: "100%" }}>
      {/* Greeting */}
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 800,
            letterSpacing: "-0.04em",
            color: "var(--text)",
            marginBottom: 4,
          }}
        >
          Good day, {firstName}! 👋
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
          Here&apos;s your insurance overview
        </p>
      </div>

      {/* Stats row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          marginBottom: 28,
        }}
      >
        <StatCard
          icon={<Shield size={22} color="var(--primary)" />}
          iconBg="var(--primary-light)"
          label="Active Policies"
          value={MY_POLICIES.filter((p) => p.status === "Active").length}
        />
        <StatCard
          icon={<FileText size={22} color="#059669" />}
          iconBg="#ECFDF5"
          label="Open Claims"
          value={openClaims}
        />
        <StatCard
          icon={<TrendingUp size={22} color="#7C3AED" />}
          iconBg="#F5F3FF"
          label="Partner Insurers"
          value="38+"
        />
      </div>

      {/* Quick actions */}
      <div style={{ marginBottom: 28 }}>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: "var(--text)",
            letterSpacing: "-0.03em",
            marginBottom: 14,
          }}
        >
          Quick Actions
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12,
          }}
        >
          {quickActions.map(({ icon: Icon, label, href, color, bg }) => (
            <Link
              key={label}
              href={href}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
                padding: "20px 16px",
                background: "var(--white)",
                border: "1px solid var(--border)",
                borderRadius: 14,
                textDecoration: "none",
                transition: "border-color 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = color;
                (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 16px rgba(0,0,0,0.06)`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon size={20} color={color} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", textAlign: "center" }}>
                {label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* My Policies */}
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
          }}
        >
          <h2
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: "var(--text)",
              letterSpacing: "-0.03em",
            }}
          >
            My Policies
          </h2>
          <Link
            href="/dashboard/plans"
            style={{
              fontSize: 13,
              color: "var(--primary)",
              textDecoration: "none",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            Browse plans <ChevronRight size={14} />
          </Link>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {MY_POLICIES.map((policy) => (
            <div
              key={policy.id}
              style={{
                background: "var(--white)",
                border: "1px solid var(--border)",
                borderRadius: 16,
                overflow: "hidden",
              }}
            >
              {/* Colored top band */}
              <div
                style={{
                  background: policy.color,
                  padding: "16px 20px",
                }}
              >
                <p
                  style={{
                    fontSize: 15,
                    fontWeight: 800,
                    color: "#fff",
                    letterSpacing: "-0.02em",
                    marginBottom: 2,
                  }}
                >
                  {policy.planName}
                </p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>{policy.insurer}</p>
              </div>
              {/* Metrics */}
              <div style={{ padding: "14px 20px" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 8,
                    marginBottom: 14,
                  }}
                >
                  {[
                    { label: "Cover", value: policy.cover },
                    { label: "Premium", value: policy.premium },
                    { label: "Type", value: policy.category },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ background: "var(--bg)", borderRadius: 8, padding: "8px 10px" }}>
                      <p style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 2 }}>
                        {label}
                      </p>
                      <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{value}</p>
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "var(--success)",
                      }}
                    />
                    <span style={{ fontSize: 12, color: "var(--success)", fontWeight: 600 }}>
                      {policy.status}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    Renews {policy.renewalDate}
                  </span>
                </div>
                <button
                  style={{
                    marginTop: 12,
                    width: "100%",
                    padding: "9px",
                    border: `1.5px solid ${policy.color}`,
                    borderRadius: 8,
                    background: "transparent",
                    color: policy.color,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = policy.color + "18";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  }}
                >
                  Renew →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Plans */}
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
          }}
        >
          <h2
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: "var(--text)",
              letterSpacing: "-0.03em",
            }}
          >
            Recommended Plans
          </h2>
          <Link
            href="/dashboard/plans"
            style={{ fontSize: 13, color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}
          >
            View all →
          </Link>
        </div>
        <div
          style={{
            background: "var(--white)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          {PLANS.map((plan, idx) => (
            <div
              key={plan.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "14px 20px",
                borderBottom: idx < PLANS.length - 1 ? "1px solid var(--border)" : "none",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.background = "var(--bg)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.background = "transparent")
              }
            >
              {/* Avatar */}
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: plan.color + "20",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  border: `1px solid ${plan.color}30`,
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 800, color: plan.color }}>
                  {plan.short}
                </span>
              </div>
              {/* Plan info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "var(--text)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {plan.plan}
                  </span>
                  {plan.badge && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: plan.color,
                        background: plan.color + "18",
                        padding: "2px 8px",
                        borderRadius: 100,
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      {plan.badge}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{plan.category}</span>
              </div>
              {/* Metrics */}
              <div
                style={{
                  display: "flex",
                  gap: 24,
                  flexShrink: 0,
                }}
                className="plan-row-metrics"
              >
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: 11, color: "var(--text-muted)" }}>Premium</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
                    {plan.premium}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: 11, color: "var(--text-muted)" }}>Cover</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{plan.cover}</p>
                </div>
              </div>
              <Link
                href={`/dashboard/plans/${plan.id}`}
                style={{
                  padding: "8px 16px",
                  background: "var(--primary-light)",
                  color: "var(--primary)",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.background = "var(--primary)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.background = "var(--primary-light)")
                }
                onClick={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  if (el.style.background === "var(--primary)") {
                    el.style.color = "#fff";
                  }
                }}
              >
                Get Quote
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Expert CTA */}
      <div
        style={{
          background: "linear-gradient(135deg, #083A8C 0%, #1580FF 60%, #0EA5E9 100%)",
          borderRadius: 16,
          padding: "28px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Headphones size={26} color="#fff" />
          </div>
          <div>
            <p
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: "#fff",
                marginBottom: 4,
                letterSpacing: "-0.03em",
              }}
            >
              Need help choosing a plan?
            </p>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.75)" }}>
              Our licensed advisors are available 24×7 — completely free
            </p>
          </div>
        </div>
        <button
          style={{
            padding: "12px 28px",
            background: "#fff",
            border: "none",
            borderRadius: 10,
            color: "var(--primary)",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            whiteSpace: "nowrap",
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.opacity = "0.9")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.opacity = "1")
          }
        >
          Start Conversation
        </button>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .plan-row-metrics { display: none !important; }
        }
      `}</style>
    </div>
  );
}
