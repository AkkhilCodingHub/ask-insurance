"use client";

import { MONTHLY_REVENUE, CATEGORY_BREAKDOWN, POLICIES, CLAIMS, USERS, INSURERS } from "@/lib/mock";

function BarChart({ data, maxVal, color }: { data: { label: string; value: number }[]; maxVal: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 160 }}>
      {data.map(({ label, value }) => (
        <div key={label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600 }}>
            {value >= 100000 ? `₹${(value / 100000).toFixed(1)}L` : value >= 1000 ? `₹${(value / 1000).toFixed(0)}k` : value.toString()}
          </span>
          <div
            style={{ width: "100%", height: `${Math.max((value / maxVal) * 120, 6)}px`, background: color, borderRadius: "5px 5px 0 0", transition: "opacity 0.15s", cursor: "pointer" }}
            onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.opacity = "0.7")}
            onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.opacity = "1")}
          />
          <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600 }}>{label}</span>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const r = 44; const c = 2 * Math.PI * r;
  let acc = -25;
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      {segments.map(({ label, value, color }) => {
        const dash = (value / 100) * c;
        const offset = -(acc * c) / 100;
        acc += value;
        return (
          <circle key={label} cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="22"
            strokeDasharray={`${dash} ${c - dash}`} strokeDashoffset={offset} />
        );
      })}
      <text x="70" y="74" textAnchor="middle" style={{ fontSize: 16, fontWeight: 800, fill: "var(--text)" }}>
        {POLICIES.filter(p => p.status === "Active").length}
      </text>
    </svg>
  );
}

export default function AnalyticsPage() {
  const activePolicies = POLICIES.filter(p => p.status === "Active");
  const totalPremium = activePolicies.reduce((s, p) => s + p.premiumRaw, 0);
  const settledClaims = CLAIMS.filter(c => c.status === "Settled" || c.status === "Approved");
  const settledAmt = settledClaims.reduce((s, c) => s + c.amount, 0);

  const insurerClaims = INSURERS.map(ins => ({
    label: ins.short,
    value: parseFloat(ins.claimRatio),
    color: ins.color,
  }));

  const monthlyPolicies = [
    { month: "Oct", count: 8 }, { month: "Nov", count: 12 }, { month: "Dec", count: 9 },
    { month: "Jan", count: 18 }, { month: "Feb", count: 15 }, { month: "Mar", count: 22 },
  ];

  return (
    <div style={{ width: "100%" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 2 }}>Analytics</h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Platform performance at a glance</p>
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }} className="analytics-kpi">
        {[
          { label: "Total Premium (Active)", value: `₹${(totalPremium / 100000).toFixed(2)}L`, color: "#1580FF" },
          { label: "Claim Amount Settled",    value: `₹${(settledAmt / 100000).toFixed(2)}L`,  color: "#059669" },
          { label: "Avg Premium / Policy",    value: `₹${Math.round(totalPremium / (activePolicies.length || 1)).toLocaleString("en-IN")}`, color: "#7C3AED" },
          { label: "Conversion Rate",         value: `${Math.round((POLICIES.length / (POLICIES.length + 4)) * 100)}%`, color: "#D97706" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 18px" }}>
            <p style={{ fontSize: 24, fontWeight: 900, color, letterSpacing: "-0.04em", marginBottom: 4 }}>{value}</p>
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }} className="analytics-row">
        {/* Revenue */}
        <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, padding: "22px 24px" }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>Monthly Premium Revenue</h3>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20 }}>Oct 2024 – Mar 2025</p>
          <BarChart data={MONTHLY_REVENUE.map(r => ({ label: r.month, value: r.revenue }))} maxVal={Math.max(...MONTHLY_REVENUE.map(r => r.revenue))} color="var(--primary)" />
        </div>

        {/* Policies sold */}
        <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, padding: "22px 24px" }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>Policies Sold</h3>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20 }}>New policies per month</p>
          <BarChart data={monthlyPolicies.map(r => ({ label: r.month, value: r.count }))} maxVal={Math.max(...monthlyPolicies.map(r => r.count))} color="#059669" />
        </div>
      </div>

      {/* Charts row 2 */}
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16, marginBottom: 16 }} className="analytics-row2">
        {/* Category donut */}
        <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, padding: "22px 24px" }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>Policy Mix by Category</h3>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 18 }}>Active policies only</p>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
            <DonutChart segments={CATEGORY_BREAKDOWN.map(({ category, value, color }) => ({ label: category, value, color }))} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {CATEGORY_BREAKDOWN.map(({ category, value, color }) => (
              <div key={category} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
                <span style={{ fontSize: 12, color: "var(--text)", flex: 1 }}>{category}</span>
                <div style={{ width: 80, height: 6, borderRadius: 3, background: "var(--bg)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${value}%`, background: color, borderRadius: 3 }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", width: 30, textAlign: "right" }}>{value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Insurer claim ratios */}
        <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, padding: "22px 24px" }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>Insurer Claim Settlement Ratio</h3>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 24 }}>Higher is better · industry avg ~94%</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {INSURERS.sort((a, b) => parseFloat(b.claimRatio) - parseFloat(a.claimRatio)).map(ins => {
              const pct = parseFloat(ins.claimRatio);
              const color = pct >= 97 ? "#059669" : pct >= 94 ? "#1580FF" : pct >= 90 ? "#D97706" : "#DC2626";
              return (
                <div key={ins.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 26, height: 26, borderRadius: 7, background: ins.color + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 9, fontWeight: 800, color: ins.color }}>{ins.short}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{ins.name}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 800, color }}>{ins.claimRatio}</span>
                  </div>
                  <div style={{ height: 7, borderRadius: 4, background: "var(--bg)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4, transition: "width 0.5s" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top plans table */}
      <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--border)" }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>Top Performing Plans</h3>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--bg)" }}>
              {["Plan", "Insurer", "Category", "Enrolled", "Premium", "Claim Ratio"].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {POLICIES.reduce((acc: {planName: string; insurer: string; category: string; color: string; premium: string; claims: string; count: number}[], p) => {
              const idx = acc.findIndex(a => a.planName === p.planName);
              if (idx >= 0) { acc[idx].count++; return acc; }
              return [...acc, { planName: p.planName, insurer: p.insurer, category: p.category, color: p.color, premium: p.premium, claims: "95%+", count: 1 }];
            }, []).sort((a, b) => b.count - a.count).map((p, i) => (
              <tr key={i} style={{ borderTop: "1px solid var(--border)" }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--bg)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", width: 18 }}>#{i + 1}</span>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{p.planName}</p>
                  </div>
                </td>
                <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--text-muted)" }}>{p.insurer}</td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 9px", borderRadius: 100, background: p.color + "18", color: p.color }}>{p.category}</span>
                </td>
                <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 800, color: "var(--text)" }}>{p.count}</td>
                <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--text-muted)" }}>{p.premium}</td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#059669" }}>{p.claims}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`
        @media (max-width: 1000px) { .analytics-kpi { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 768px) {
          .analytics-row { grid-template-columns: 1fr !important; }
          .analytics-row2 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
