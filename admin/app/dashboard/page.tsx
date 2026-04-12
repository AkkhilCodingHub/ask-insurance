"use client";

import { Users, FileText, Shield, TrendingUp, ArrowUpRight, Clock, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { USERS, POLICIES, CLAIMS, QUOTES, MONTHLY_REVENUE, CATEGORY_BREAKDOWN } from "@/lib/mock";

function KpiCard({ label, value, sub, icon: Icon, color, trend }: { label: string; value: string; sub: string; icon: React.ElementType; color: string; trend?: string }) {
  return (
    <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, padding: "20px 22px", display: "flex", alignItems: "flex-start", gap: 14 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={20} color={color} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500, marginBottom: 4 }}>{label}</p>
        <p style={{ fontSize: 28, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.05em", lineHeight: 1, marginBottom: 4 }}>{value}</p>
        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{sub}</p>
      </div>
      {trend && (
        <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 12, fontWeight: 700, color: "#059669", background: "#ECFDF5", padding: "3px 8px", borderRadius: 100, flexShrink: 0 }}>
          <ArrowUpRight size={12} /> {trend}
        </span>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    "Verified":     { bg: "#ECFDF5", color: "#059669" },
    "Pending":      { bg: "#FFFBEB", color: "#D97706" },
    "Blocked":      { bg: "#FEF2F2", color: "#DC2626" },
    "Active":       { bg: "#ECFDF5", color: "#059669" },
    "Expired":      { bg: "#FEF2F2", color: "#DC2626" },
    "Submitted":    { bg: "#E0F7FF", color: "#0891B2" },
    "Under Review": { bg: "#FFFBEB", color: "#D97706" },
    "Approved":     { bg: "#ECFDF5", color: "#059669" },
    "Settled":      { bg: "#F5F3FF", color: "#7C3AED" },
    "Rejected":     { bg: "#FEF2F2", color: "#DC2626" },
    "New":          { bg: "#E8F2FF", color: "#1580FF" },
    "Contacted":    { bg: "#FFFBEB", color: "#D97706" },
    "Converted":    { bg: "#ECFDF5", color: "#059669" },
    "Lost":         { bg: "#FEF2F2", color: "#DC2626" },
  };
  const s = map[status] ?? { bg: "var(--bg)", color: "var(--text-muted)" };
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 100, background: s.bg, color: s.color }}>
      {status}
    </span>
  );
}

export default function OverviewPage() {
  const totalPremium = POLICIES.filter(p => p.status === "Active").reduce((s, p) => s + p.premiumRaw, 0);
  const activePolicies = POLICIES.filter(p => p.status === "Active").length;
  const pendingClaims = CLAIMS.filter(c => c.status === "Submitted" || c.status === "Under Review").length;
  const newQuotes = QUOTES.filter(q => q.status === "New").length;

  const maxRev = Math.max(...MONTHLY_REVENUE.map(r => r.revenue));

  return (
    <div style={{ width: "100%" }}>
      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }} className="kpi-grid">
        <KpiCard label="Total Users"       value={USERS.length.toString()}      sub={`${USERS.filter(u => u.status === "Verified").length} verified`}          icon={Users}     color="#1580FF" trend="+12%" />
        <KpiCard label="Active Policies"   value={activePolicies.toString()}    sub={`${POLICIES.filter(p => p.status === "Expired").length} expired`}         icon={FileText}  color="#059669" trend="+8%"  />
        <KpiCard label="Open Claims"       value={pendingClaims.toString()}     sub={`${CLAIMS.filter(c => c.status === "Settled").length} settled this month`} icon={Shield}    color="#D97706"             />
        <KpiCard label="Monthly Premium"   value={`₹${(totalPremium/100000).toFixed(1)}L`} sub={`from ${activePolicies} active policies`}                      icon={TrendingUp} color="#7C3AED" trend="+15%" />
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, marginBottom: 24 }} className="charts-row">
        {/* Revenue bar chart */}
        <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, padding: "22px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.02em" }}>Premium Revenue</h3>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Last 6 months</p>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#059669", background: "#ECFDF5", padding: "4px 10px", borderRadius: 100 }}>↑ 21% YoY</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 140 }}>
            {MONTHLY_REVENUE.map(({ month, revenue }) => (
              <div key={month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600 }}>₹{(revenue/1000).toFixed(0)}k</span>
                <div
                  style={{
                    width: "100%",
                    height: `${(revenue / maxRev) * 100}px`,
                    background: month === "Mar" ? "var(--primary)" : "var(--primary-light)",
                    borderRadius: "6px 6px 0 0",
                    transition: "opacity 0.15s",
                    cursor: "pointer",
                    minHeight: 8,
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.opacity = "0.75")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.opacity = "1")}
                />
                <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>{month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category donut */}
        <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, padding: "22px 24px" }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 4 }}>By Category</h3>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20 }}>Active policy mix</p>

          {/* SVG Donut */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <svg width="120" height="120" viewBox="0 0 120 120">
              {(() => {
                let offset = -25;
                return CATEGORY_BREAKDOWN.map(({ category, value, color }) => {
                  const circumference = 2 * Math.PI * 40;
                  const dash = (value / 100) * circumference;
                  const el = (
                    <circle
                      key={category}
                      cx="60" cy="60" r="40"
                      fill="none"
                      stroke={color}
                      strokeWidth="18"
                      strokeDasharray={`${dash} ${circumference - dash}`}
                      strokeDashoffset={-offset * circumference / 100}
                      style={{ transition: "opacity 0.15s", cursor: "pointer" }}
                    />
                  );
                  offset += value;
                  return el;
                });
              })()}
              <text x="60" y="64" textAnchor="middle" style={{ fontSize: 14, fontWeight: 800, fill: "var(--text)" }}>
                {activePolicies}
              </text>
            </svg>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {CATEGORY_BREAKDOWN.map(({ category, value, color }) => (
              <div key={category} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "var(--text)", flex: 1 }}>{category}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>{value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom tables row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="tables-row">
        {/* Recent claims */}
        <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>Recent Claims</h3>
            <a href="/dashboard/claims" style={{ fontSize: 12, fontWeight: 600, color: "var(--primary)" }}>View all →</a>
          </div>
          {CLAIMS.slice(0, 5).map((c) => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 22px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.userName}</p>
                <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{c.description} · ₹{c.amount.toLocaleString("en-IN")}</p>
              </div>
              <StatusBadge status={c.status} />
            </div>
          ))}
        </div>

        {/* Recent signups */}
        <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>New Quotes</h3>
            <a href="/dashboard/quotes" style={{ fontSize: 12, fontWeight: 600, color: "var(--primary)" }}>View all →</a>
          </div>
          {QUOTES.slice(0, 5).map((q) => (
            <div key={q.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 22px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)" }}>{q.name.split(" ").map(n => n[0]).join("").slice(0,2)}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{q.name}</p>
                <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{q.category} · {q.premium}</p>
              </div>
              <StatusBadge status={q.status} />
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 1100px) { .kpi-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 768px) {
          .kpi-grid { grid-template-columns: 1fr 1fr !important; }
          .charts-row { grid-template-columns: 1fr !important; }
          .tables-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
