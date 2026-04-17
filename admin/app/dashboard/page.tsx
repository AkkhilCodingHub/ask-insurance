"use client";

import { useEffect, useState } from "react";
import { Users, FileText, Shield, TrendingUp, ArrowUpRight } from "lucide-react";
import { LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { adminApi, DashboardStats, AdminClaim, AdminUser, ClaimsResponse, UsersResponse, AnalyticsData } from "@/lib/api";

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
    "pending":      { bg: "#FFFBEB", color: "#D97706" },
    "approved":     { bg: "#ECFDF5", color: "#059669" },
    "rejected":     { bg: "#FEF2F2", color: "#DC2626" },
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
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [claims, setClaims] = useState<AdminClaim[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [statsData, claimsData, usersData, analyticsData] = await Promise.all([
          adminApi.getStats(),
          adminApi.getClaims(1, 5),
          adminApi.getUsers(1, 5),
          adminApi.getAnalytics()
        ]);

        setStats(statsData);
        setClaims(claimsData.claims);
        setUsers(usersData.users);
        setAnalytics(analyticsData);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load dashboard data";
        setError(message);
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <p style={{ color: "var(--text-muted)" }}>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: 12 }}>
        <p style={{ color: "var(--text-muted)" }}>Error loading dashboard</p>
        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{error}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <p style={{ color: "var(--text-muted)" }}>No data available</p>
      </div>
    );
  }

  const premiumDisplay = stats.totalPremium >= 100000 ? `₹${(stats.totalPremium / 100000).toFixed(1)}L` : `₹${(stats.totalPremium / 1000).toFixed(0)}k`;

  // Real revenue trend data from analytics
  const revenueData = (analytics?.monthly || []).slice(-4).map(m => ({
    name: m.label,
    revenue: m.premium
  }));

  // Real claims by status
  const claimsData = [
    { name: "Approved", value: stats.approvedClaimsLastMonth, color: "#059669" },
    { name: "Pending", value: stats.pendingClaims, color: "#D97706" },
    { name: "Rejected", value: Math.max(0, stats.totalClaims - stats.approvedClaimsLastMonth - stats.pendingClaims), color: "#DC2626" },
  ].filter(d => d.value > 0);

  // Real insurers data
  const insurersData = (analytics?.topInsurers || []).slice(0, 4).map(ins => ({
    name: ins.name || ins.shortName,
    policies: ins.policies,
    premium: ins.premium
  }));

  return (
    <div style={{ width: "100%" }}>
      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }} className="kpi-grid">
        <KpiCard 
          label="Total Users" 
          value={stats.totalUsers.toString()} 
          sub={`${stats.newUsersLastMonth} joined this month`}
          icon={Users} 
          color="#1580FF" 
          trend={`+${Math.round((stats.newUsersLastMonth / Math.max(stats.totalUsers, 1)) * 100)}%`}
        />
        <KpiCard 
          label="Active Policies" 
          value={stats.activePolicies.toString()}
          sub={`${stats.totalPolicies - stats.activePolicies} inactive`}
          icon={FileText} 
          color="#059669"
          trend="+8%"
        />
        <KpiCard 
          label="Open Claims" 
          value={stats.pendingClaims.toString()}
          sub={`${stats.approvedClaimsLastMonth} approved this month`}
          icon={Shield} 
          color="#D97706"
        />
        <KpiCard 
          label="Monthly Premium" 
          value={premiumDisplay}
          sub={`from ${stats.activePolicies} active policies`}
          icon={TrendingUp} 
          color="#7C3AED" 
          trend="+15%"
        />
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 24 }} className="charts-row">
        {/* Revenue chart */}
        <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, padding: "22px 24px" }}>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.02em" }}>Premium Revenue Trend</h3>
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Last months</p>
          </div>
          {revenueData && revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" style={{ fontSize: 11 }} />
                <YAxis stroke="var(--text-muted)" style={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Line type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={2} dot={{ fill: "var(--primary)", r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 240, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
              No revenue data available
            </div>
          )}
        </div>

        {/* Claims distribution */}
        <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, padding: "22px 24px" }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 20 }}>Claims Distribution</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={claimsData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                {claimsData.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => value && value.toString ? value.toString() : '0'} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
            {claimsData.map(d => (
              <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: d.color }} />
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{d.name}: {d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Insurers chart */}
      <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, padding: "22px 24px", marginBottom: 24 }}>
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.02em" }}>Top Performing Insurers</h3>
          <p style={{ fontSize: 12, color: "var(--text-muted)" }}>By policies and premium</p>
        </div>
        {insurersData && insurersData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={insurersData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--text-muted)" style={{ fontSize: 11 }} />
              <YAxis stroke="var(--text-muted)" style={{ fontSize: 11 }} yAxisId="left" />
              <YAxis orientation="right" stroke="var(--text-muted)" style={{ fontSize: 11 }} yAxisId="right" />
              <Tooltip contentStyle={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 8 }} />
              <Legend />
              <Bar yAxisId="left" dataKey="policies" fill="var(--primary)" radius={[8, 8, 0, 0]} name="Policies" />
              <Bar yAxisId="right" dataKey="premium" fill="#059669" radius={[8, 8, 0, 0]} name="Premium (₹)" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
            No insurer data available
          </div>
        )}
      </div>

      {/* Bottom tables row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="tables-row">
        {/* Recent claims */}
        <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>Recent Claims</h3>
            <a href="/dashboard/claims" style={{ fontSize: 12, fontWeight: 600, color: "var(--primary)" }}>View all →</a>
          </div>
          {claims.length > 0 ? (
            claims.map((c) => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 22px", borderBottom: "1px solid var(--border)" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.status === "approved" ? "#059669" : c.status === "rejected" ? "#DC2626" : "#D97706", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Claim #{c.id.slice(0, 8)}</p>
                  <p style={{ fontSize: 11, color: "var(--text-muted)" }}>Created {new Date(c.createdAt).toLocaleDateString()}</p>
                </div>
                <StatusBadge status={c.status} />
              </div>
            ))
          ) : (
            <div style={{ padding: "20px 22px", textAlign: "center", color: "var(--text-muted)" }}>No recent claims</div>
          )}
        </div>

        {/* Recent users */}
        <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>New Users</h3>
            <a href="/dashboard/users" style={{ fontSize: 12, fontWeight: 600, color: "var(--primary)" }}>View all →</a>
          </div>
          {users.length > 0 ? (
            users.map((u) => (
              <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 22px", borderBottom: "1px solid var(--border)" }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)" }}>{u.phone.slice(-2)}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.name || u.phone}</p>
                  <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{new Date(u.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: "20px 22px", textAlign: "center", color: "var(--text-muted)" }}>No new users</div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 1100px) { .kpi-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 768px) {
          .kpi-grid { grid-template-columns: 1fr !important; }
          .charts-row { grid-template-columns: 1fr !important; }
          .tables-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
