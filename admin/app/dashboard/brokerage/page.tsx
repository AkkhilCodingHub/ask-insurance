"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi, type Insurer } from "@/lib/api";
import { DollarSign, Award, RefreshCw, CheckCircle, Percent, Loader, Download, ArrowUpRight, Building2, BookTemplate } from "lucide-react";

interface Slab {
  id: string;
  insurerId: string;
  insuranceType: string;
  percentage: number;
  insurer?: { name: string };
}

interface PolicyBrokerage {
  id: string;
  policyNumber: string;
  premium: number;
  brokerageRate: number;
  brokerageAmount: number;
  brokerageStatus: string;
  brokeragePaidAt: string | null;
  insurer: { name: string };
  user: { name: string; phone: string };
}

interface Stats {
  totalEarned: number;
  totalPending: number;
  totalReleased: number;
}

export default function BrokeragePage() {
  const [slabs, setSlabs] = useState<Slab[]>([]);
  const [policies, setPolicies] = useState<PolicyBrokerage[]>([]);
  const [stats, setStats] = useState<Stats>({ totalEarned: 0, totalPending: 0, totalReleased: 0 });
  const [insurers, setInsurers] = useState<Insurer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [insurerId, setInsurerId] = useState("");
  const [insuranceType, setInsuranceType] = useState("health");
  const [percentage, setPercentage] = useState(15);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const slabsData = await adminApi.getBrokerageSlabs();
      setSlabs(slabsData);

      const statsData = await adminApi.getBrokerageStats();
      setPolicies(statsData.policies || []);
      setStats(statsData.stats || { totalEarned: 0, totalPending: 0, totalReleased: 0 });

      const insurersRes = await adminApi.getInsurers(1, 100);
      setInsurers(insurersRes.insurers);
      if (insurersRes.insurers.length > 0) {
        setInsurerId(insurersRes.insurers[0].id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load brokerage data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSaveSlab(e: React.FormEvent) {
    e.preventDefault();
    if (!insurerId) return;
    setSaving(true);
    try {
      await adminApi.saveBrokerageSlab(
        insurerId,
        insuranceType,
        Number(percentage)
      );
      alert("Brokerage slab saved successfully!");
      loadData();
    } catch {
      alert("Failed to save slab");
    } finally {
      setSaving(false);
    }
  }

  async function handleReleasePayout(policyId: string) {
    if (!confirm("Confirm release of payout for this policy?")) return;
    try {
      await adminApi.releaseBrokeragePayout(policyId);
      alert("Brokerage payout marked as paid!");
      loadData();
    } catch {
      alert("Failed to release payout");
    }
  }

  function fmtDate(s: string) {
    return new Date(s).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  }

  return (
    <div style={{ padding: 24, minHeight: "100vh", background: "var(--bg)" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(29, 78, 216, 0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Percent size={20} color="#1D4ED8" />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: "var(--text)", margin: 0, letterSpacing: -0.5 }}>Brokerage Commissions</h1>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: 13, margin: 0 }}>Configure partner slabs and release advisor commissions.</p>
        </div>

        {/* Quick Links */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <Link href="/dashboard/insurers" style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", background: "var(--white)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
            <Building2 size={14} color="var(--text-muted)" /> Insurers <ArrowUpRight size={13} color="var(--text-muted)" />
          </Link>
          <Link href="/dashboard/settings/templates" style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", background: "var(--white)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
            <BookTemplate size={14} color="var(--text-muted)" /> Rate Charts <ArrowUpRight size={13} color="var(--text-muted)" />
          </Link>
          <button
            onClick={async () => {
              try {
                const blob = await adminApi.exportBrokerage();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url; a.download = "brokerage-payouts.csv"; a.click();
                URL.revokeObjectURL(url);
              } catch { alert("Failed to export."); }
            }}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", background: "#1D4ED8", border: "none", borderRadius: 10, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            <Download size={14} /> Export CSV
          </button>
          <button onClick={loadData}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", background: "var(--white)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 10, color: "#DC2626", fontSize: 13, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Total Commission Earned", value: `₹${stats.totalEarned.toLocaleString("en-IN")}`, color: "#1D4ED8", bg: "rgba(29, 78, 216, 0.1)", icon: <Award size={20} color="#1D4ED8" /> },
          { label: "Commission Released (Paid)", value: `₹${stats.totalReleased.toLocaleString("en-IN")}`, color: "#059669", bg: "rgba(5, 150, 105, 0.1)", icon: <CheckCircle size={20} color="#059669" /> },
          { label: "Brokerage Receivable", value: `₹${stats.totalPending.toLocaleString("en-IN")}`, color: "#D97706", bg: "rgba(217, 119, 6, 0.1)", icon: <DollarSign size={20} color="#D97706" /> },
        ].map(s => (
          <div key={s.label} style={{ background: "var(--white)", borderRadius: 14, padding: "18px 20px", border: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", letterSpacing: 0.8, margin: "0 0 6px" }}>{s.label.toUpperCase()}</p>
              <p style={{ fontSize: 24, fontWeight: 900, color: s.color, margin: 0, letterSpacing: -0.5 }}>{s.value}</p>
            </div>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {s.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Configuration Slabs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24, marginBottom: 28 }}>
        {/* Save Slab Form */}
        <div style={{ background: "var(--white)", borderRadius: 16, border: "1px solid var(--border)", padding: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>Configure Commission Slab</h2>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 18 }}>Set percentage rates for each insurer and plan type.</p>

          <form onSubmit={handleSaveSlab} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>PARTNER INSURER</label>
              <select value={insurerId} onChange={e => setInsurerId(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 13, background: "var(--bg)", color: "var(--text)", outline: "none" }}>
                {insurers.map(i => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>INSURANCE TYPE</label>
              <select value={insuranceType} onChange={e => setInsuranceType(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 13, background: "var(--bg)", color: "var(--text)", outline: "none" }}>
                {['health', 'life', 'motor', 'travel', 'home', 'business'].map(t => (
                  <option key={t} value={t}>{t.toUpperCase()}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>COMMISSION RATE (%)</label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input type="number" step="0.1" value={percentage} onChange={e => setPercentage(Number(e.target.value))}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 13, background: "var(--bg)", color: "var(--text)", outline: "none" }} />
                <span style={{ position: "absolute", right: 12, fontSize: 13, fontWeight: 700, color: "var(--text-muted)" }}>%</span>
              </div>
            </div>

            <button type="submit" disabled={saving || insurers.length === 0}
              style={{ width: "100%", padding: 11, background: "#1D4ED8", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 6 }}>
              {saving && <Loader size={14} style={{ animation: "spin 1s linear infinite" }} />}
              Save Configuration
            </button>
          </form>
        </div>

        {/* Slabs List */}
        <div style={{ background: "var(--white)", borderRadius: 16, border: "1px solid var(--border)", padding: 20, overflow: "hidden" }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>Active Slabs</h2>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 18 }}>List of currently active brokerage slab percentages.</p>

          <div style={{ overflowY: "auto", maxHeight: 280 }}>
            {slabs.length === 0 ? (
              <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>No slabs configured yet. Use the left form to configure.</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg)" }}>
                    <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "var(--text-muted)" }}>INSURER</th>
                    <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "var(--text-muted)" }}>TYPE</th>
                    <th style={{ padding: "8px 12px", textAlign: "right", fontSize: 10, fontWeight: 700, color: "var(--text-muted)" }}>PERCENTAGE</th>
                  </tr>
                </thead>
                <tbody>
                  {slabs.map(s => (
                    <tr key={s.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{s.insurer?.name ?? "Unknown"}</td>
                      <td style={{ padding: "10px 12px", fontSize: 12, color: "var(--text-muted)", textTransform: "capitalize" }}>{s.insuranceType}</td>
                      <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 700, color: "#1D4ED8", textAlign: "right" }}>{s.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Payout Tracking Table */}
      <div style={{ background: "var(--white)", borderRadius: 16, border: "1px solid var(--border)", padding: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>Brokerage Payouts & Receivables</h2>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 18 }}>Track commission invoices paid by customers and release payments.</p>

        <div style={{ overflowX: "auto" }}>
          {policies.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>No policy payouts found. Paid policies with configured slabs will appear here.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
              <thead>
                <tr style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
                  {["Policy #", "Insurer", "Customer", "Premium Paid", "Rate", "Brokerage Amount", "Status", "Action"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: h === "Brokerage Amount" || h === "Premium Paid" ? "right" : "left", fontSize: 10, fontWeight: 700, color: "var(--text-muted)" }}>{h.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {policies.map(p => {
                  const isPaid = p.brokerageStatus === "paid";
                  const badgeBg = isPaid ? "rgba(5, 150, 105, 0.1)" : "rgba(217, 119, 6, 0.1)";
                  const badgeColor = isPaid ? "#059669" : "#D97706";
                  return (
                    <tr key={p.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{p.policyNumber}</td>
                      <td style={{ padding: "12px 14px", fontSize: 13, color: "var(--text-muted)" }}>{p.insurer.name}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", margin: 0 }}>{p.user.name}</p>
                        <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>{p.user.phone}</p>
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: 13, color: "var(--text-muted)", textAlign: "right" }}>₹{p.premium.toLocaleString("en-IN")}</td>
                      <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 600, color: "#1D4ED8" }}>{p.brokerageRate}%</td>
                      <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 700, color: "var(--text)", textAlign: "right" }}>₹{p.brokerageAmount.toLocaleString("en-IN")}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 100, background: badgeBg, color: badgeColor, textTransform: "capitalize" }}>
                          {p.brokerageStatus === "paid" ? "released" : "pending"}
                        </span>
                        {p.brokeragePaidAt && (
                          <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>Paid: {fmtDate(p.brokeragePaidAt)}</p>
                        )}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        {!isPaid ? (
                          <button onClick={() => handleReleasePayout(p.id)}
                            style={{ padding: "6px 12px", background: "#059669", color: "#fff", border: "none", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                            Mark Paid
                          </button>
                        ) : (
                          <span style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>Complete</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
