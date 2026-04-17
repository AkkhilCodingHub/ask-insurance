"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { adminApi, type DashboardStats, type AnalyticsData, type Insurer } from "@/lib/api";

const TYPE_COLORS: Record<string, string> = {
  life: "#1580FF", health: "#059669", motor: "#D97706",
  travel: "#7C3AED", home: "#EA580C", business: "#0891B2"
};

export default function AnalyticsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [insurers, setInsurers] = useState<Insurer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [s, a, ins] = await Promise.all([
          adminApi.getStats(),
          adminApi.getAnalytics(),
          adminApi.getInsurers(1, 30),
        ]);
        setStats(s);
        setAnalytics(a);
        setInsurers(ins.insurers);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300, color: "var(--text-muted)", fontSize: 14 }}>
        Loading analytics…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "12px 16px", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 10, color: "#DC2626", fontSize: 13 }}>
        {error}
      </div>
    );
  }

  const totalPremium = stats?.totalPremium ?? 0;
  const totalClaims  = stats?.totalClaimsAmount ?? 0;
  const avgPremium   = stats && stats.activePolicies > 0 ? Math.round(totalPremium / stats.activePolicies) : 0;

  const monthlyRevData = (analytics?.monthly ?? []).map(m => ({ label: m.label, value: m.premium }));
  const monthlyPolData = (analytics?.monthly ?? []).map(m => ({ label: m.label, value: m.policies }));

  const byTypeSegments = (analytics?.byType ?? []).map(r => ({
    label: r.type,
    value: r.policies,
    color: TYPE_COLORS[r.type] ?? "#64748B",
  }));

  const sortedInsurers = [...insurers].sort((a, b) => {
    const ra = a.claimsRatio > 1 ? a.claimsRatio : a.claimsRatio * 100;
    const rb = b.claimsRatio > 1 ? b.claimsRatio : b.claimsRatio * 100;
    return rb - ra;
  });

  return (
    <div style={{ width: "100%" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 2 }}>Analytics</h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Platform performance at a glance</p>
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }} className="analytics-kpi">
        {[
          { label: "Total Premium",       value: totalPremium >= 100000 ? `₹${(totalPremium / 100000).toFixed(1)}L` : `₹${totalPremium.toLocaleString("en-IN")}`, color: "#1580FF" },
          { label: "Claims Paid Out",     value: totalClaims >= 100000  ? `₹${(totalClaims / 100000).toFixed(1)}L`  : `₹${totalClaims.toLocaleString("en-IN")}`,  color: "#059669" },
          { label: "Avg Premium / Policy",value: `₹${avgPremium.toLocaleString("en-IN")}`,                                                                        color: "#7C3AED" },
          { label: "Active Policies",     value: (stats?.activePolicies ?? 0).toString(),                                                                          color: "#D97706" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 18px" }}>
            <p style={{ fontSize: 24, fontWeight: 900, color, letterSpacing: "-0.04em", marginBottom: 4 }}>{value}</p>
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }} className="analytics-row">
        <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, padding: "22px 24px" }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>Monthly Premium Revenue</h3>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20 }}>Last 12 months</p>
          {monthlyRevData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyRevData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" stroke="var(--text-muted)" style={{ fontSize: 9 }} />
                <YAxis stroke="var(--text-muted)" style={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 8 }} formatter={(value) => `₹${(value as number).toLocaleString("en-IN")}`} />
                <Bar dataKey="value" fill="var(--primary)" radius={[8, 8, 0, 0]} name="Premium" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 240, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>No data available</div>
          )}
        </div>
        <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, padding: "22px 24px" }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>Policies Issued</h3>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20 }}>New policies per month</p>
          {monthlyPolData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={monthlyPolData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" stroke="var(--text-muted)" style={{ fontSize: 9 }} />
                <YAxis stroke="var(--text-muted)" style={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Area type="monotone" dataKey="value" fill="#05966918" stroke="#059669" strokeWidth={2} name="Policies" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 240, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>No data available</div>
          )}
        </div>
      </div>

      {/* Charts row 2 */}
      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 16, marginBottom: 16 }} className="analytics-row2">
        {/* Category pie */}
        <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, padding: "22px 24px" }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>Policy Mix by Type</h3>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 18 }}>All policies</p>
          {byTypeSegments.length > 0 ? (
            <>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
                <ResponsiveContainer width={140} height={140}>
                  <PieChart>
                    <Pie data={byTypeSegments} cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={2} dataKey="value">
                      {byTypeSegments.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {byTypeSegments.map(({ label, value, color }) => {
                  const total = byTypeSegments.reduce((s, x) => s + x.value, 0);
                  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
                  return (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
                      <span style={{ fontSize: 12, color: "var(--text)", flex: 1, textTransform: "capitalize" }}>{label}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", width: 30, textAlign: "right" }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div style={{ height: 140, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>No data</div>
          )}
        </div>

        {/* Insurer claim ratios */}
        <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, padding: "22px 24px" }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>Insurer Claim Settlement Ratio</h3>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20 }}>Higher is better · industry avg ~94%</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {sortedInsurers.map(ins => {
              const pct = ins.claimsRatio > 1 ? ins.claimsRatio : ins.claimsRatio * 100;
              const color = pct >= 97 ? "#059669" : pct >= 94 ? "#1580FF" : pct >= 90 ? "#D97706" : "#DC2626";
              const brandColor = ins.brandColor || "#1580FF";
              return (
                <div key={ins.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 26, height: 26, borderRadius: 7, background: brandColor + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 12, fontWeight: 900, color: brandColor }}>{ins.name.charAt(0)}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{ins.name}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 800, color }}>{pct.toFixed(1)}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: "var(--bg)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: color, borderRadius: 3, transition: "width 0.5s" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top plans table */}
      {analytics?.topPlans && analytics.topPlans.length > 0 && (
        <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", marginBottom: 16 }}>
          <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--border)" }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>Top Performing Plans</h3>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--bg)" }}>
                {["Plan", "Type", "Policies Issued"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {analytics.topPlans.map((p, i) => {
                const color = TYPE_COLORS[p.type] ?? "#64748B";
                return (
                  <tr key={p.id} style={{ borderTop: "1px solid var(--border)" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--bg)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", width: 20 }}>#{i + 1}</span>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{p.name}</p>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 9px", borderRadius: 100, background: color + "18", color, textTransform: "capitalize" }}>{p.type}</span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 800, color: "var(--text)" }}>{p._count.policies}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Top insurers by premium */}
      {analytics?.topInsurers && analytics.topInsurers.length > 0 && (
        <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--border)" }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>Top Insurers by Premium</h3>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--bg)" }}>
                {["Insurer", "Policies", "Total Premium"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {analytics.topInsurers.map((ins, i) => (
                <tr key={ins.insurerId ?? i} style={{ borderTop: "1px solid var(--border)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--bg)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", width: 20 }}>#{i + 1}</span>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{ins.name}</p>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{ins.policies}</td>
                  <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 800, color: "var(--primary)" }}>
                    {ins.premium >= 100000 ? `₹${(ins.premium / 100000).toFixed(1)}L` : `₹${ins.premium.toLocaleString("en-IN")}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        @media (max-width: 1000px) { .analytics-kpi { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 768px) {
          .analytics-row  { grid-template-columns: 1fr !important; }
          .analytics-row2 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
