"use client";

import { useEffect, useState } from "react";
import { adminApi, type Insurer } from "@/lib/api";
import { DollarSign, Settings, Award, RefreshCw, CheckCircle, Percent, Plus, Loader, Download } from "lucide-react";

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
      // Get slabs
      const slabsData = await adminApi.getBrokerageSlabs();
      setSlabs(slabsData);

      // Get stats and policies
      const statsData = await adminApi.getBrokerageStats();
      setPolicies(statsData.policies || []);
      setStats(statsData.stats || { totalEarned: 0, totalPending: 0, totalReleased: 0 });

      // Get insurers
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
    } catch (e) {
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
    } catch (e) {
      alert("Failed to release payout");
    }
  }

  function fmtDate(s: string) {
    return new Date(s).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  }

  return (
    <div style={{ padding: 32, minHeight: "100vh", background: "#F8FAFC" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Percent size={20} color="#1D4ED8" />
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: "#0F172A", margin: 0, letterSpacing: -0.5 }}>Brokerage Commissions</h1>
          </div>
          <p style={{ color: "#64748B", fontSize: 14, margin: 0 }}>Configure partner slabs and release advisor commissions.</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
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
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "11px 16px", background: "#1D4ED8", border: "none", borderRadius: 12, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <Download size={14} /> Export CSV
          </button>
          <button onClick={loadData}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "11px 16px", background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 12, color: "#64748B", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
        {[
          { label: "Total Commission Earned", value: `₹${stats.totalEarned.toLocaleString("en-IN")}`, color: "#1E3A8A", bg: "#EFF6FF", icon: <Award size={20} color="#1D4ED8" /> },
          { label: "Commission Released (Paid)", value: `₹${stats.totalReleased.toLocaleString("en-IN")}`, color: "#064E3B", bg: "#ECFDF5", icon: <CheckCircle size={20} color="#059669" /> },
          { label: "Brokerage Receivable", value: `₹${stats.totalPending.toLocaleString("en-IN")}`, color: "#78350F", bg: "#FFFBEB", icon: <DollarSign size={20} color="#D97706" /> },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", border: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: 0.8, margin: "0 0 8px" }}>{s.label.toUpperCase()}</p>
              <p style={{ fontSize: 28, fontWeight: 900, color: s.color, margin: 0, letterSpacing: -0.5 }}>{s.value}</p>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {s.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Configuration Slabs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24, marginBottom: 32 }}>
        {/* Save Slab Form */}
        <div style={{ background: "#fff", borderRadius: 18, border: "1px solid #E2E8F0", padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", marginBottom: 6 }}>Configure Commission Slab</h2>
          <p style={{ fontSize: 12, color: "#64748B", marginBottom: 20 }}>Set percentage rates for each insurer and plan type.</p>

          <form onSubmit={handleSaveSlab} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 6 }}>PARTNER INSURER</label>
              <select value={insurerId} onChange={e => setInsurerId(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #E2E8F0", fontSize: 13, background: "#F8FAFC", outline: "none" }}>
                {insurers.map(i => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 6 }}>INSURANCE TYPE</label>
              <select value={insuranceType} onChange={e => setInsuranceType(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #E2E8F0", fontSize: 13, background: "#F8FAFC", outline: "none" }}>
                {['health', 'life', 'motor', 'travel', 'home', 'business'].map(t => (
                  <option key={t} value={t}>{t.toUpperCase()}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 6 }}>COMMISSION RATE (%)</label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input type="number" step="0.1" value={percentage} onChange={e => setPercentage(Number(e.target.value))}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #E2E8F0", fontSize: 13, background: "#F8FAFC", outline: "none" }} />
                <span style={{ position: "absolute", right: 12, fontSize: 13, fontWeight: 700, color: "#64748B" }}>%</span>
              </div>
            </div>

            <button type="submit" disabled={saving || insurers.length === 0}
              style={{ width: "100%", padding: 12, background: "#3B82F6", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 10 }}>
              {saving && <Loader size={14} style={{ animation: "spin 1s linear infinite" }} />}
              Save Configuration
            </button>
          </form>
        </div>

        {/* Slabs List */}
        <div style={{ background: "#fff", borderRadius: 18, border: "1px solid #E2E8F0", padding: 24, overflow: "hidden" }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", marginBottom: 6 }}>Active Slabs</h2>
          <p style={{ fontSize: 12, color: "#64748B", marginBottom: 20 }}>List of currently active brokerage slab percentages.</p>

          <div style={{ overflowY: "auto", maxHeight: 280 }}>
            {slabs.length === 0 ? (
              <div style={{ padding: "40px 0", textAlign: "center", color: "#94A3B8", fontSize: 13 }}>No slabs configured yet. Use the left form to configure.</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1.5px solid #E2E8F0", background: "#F8FAFC" }}>
                    <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#94A3B8" }}>INSURER</th>
                    <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#94A3B8" }}>TYPE</th>
                    <th style={{ padding: "8px 12px", textAlign: "right", fontSize: 10, fontWeight: 700, color: "#94A3B8" }}>PERCENTAGE</th>
                  </tr>
                </thead>
                <tbody>
                  {slabs.map(s => (
                    <tr key={s.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                      <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{s.insurer?.name ?? "Unknown"}</td>
                      <td style={{ padding: "10px 12px", fontSize: 12, color: "#64748B", textTransform: "capitalize" }}>{s.insuranceType}</td>
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
      <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #E2E8F0", padding: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", marginBottom: 6 }}>Brokerage Payouts & Receivables</h2>
        <p style={{ fontSize: 12, color: "#64748B", marginBottom: 20 }}>Track commission invoices paid by customers and release payments.</p>

        <div style={{ overflowX: "auto" }}>
          {policies.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center", color: "#94A3B8", fontSize: 13 }}>No policy payouts found. Paid policies with configured slabs will appear here.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1.5px solid #E2E8F0" }}>
                  {["Policy #", "Insurer", "Customer", "Premium Paid", "Rate", "Brokerage Amount", "Status", "Action"].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: h === "Brokerage Amount" || h === "Premium Paid" ? "right" : "left", fontSize: 10, fontWeight: 700, color: "#94A3B8" }}>{h.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {policies.map(p => {
                  const isPaid = p.brokerageStatus === "paid";
                  const badgeBg = isPaid ? "#ECFDF5" : "#FFFBEB";
                  const badgeColor = isPaid ? "#059669" : "#D97706";
                  return (
                    <tr key={p.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                      <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{p.policyNumber}</td>
                      <td style={{ padding: "14px 16px", fontSize: 13, color: "#475569" }}>{p.insurer.name}</td>
                      <td style={{ padding: "14px 16px" }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", margin: 0 }}>{p.user.name}</p>
                        <p style={{ fontSize: 11, color: "#94A3B8", margin: 0 }}>{p.user.phone}</p>
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 13, color: "#475569", textAlign: "right" }}>₹{p.premium.toLocaleString("en-IN")}</td>
                      <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 600, color: "#1D4ED8" }}>{p.brokerageRate}%</td>
                      <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 700, color: "#0F172A", textAlign: "right" }}>₹{p.brokerageAmount.toLocaleString("en-IN")}</td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 100, background: badgeBg, color: badgeColor, textTransform: "capitalize" }}>
                          {p.brokerageStatus === "paid" ? "released" : "pending"}
                        </span>
                        {p.brokeragePaidAt && (
                          <p style={{ fontSize: 10, color: "#94A3B8", marginTop: 4 }}>Paid: {fmtDate(p.brokeragePaidAt)}</p>
                        )}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        {!isPaid ? (
                          <button onClick={() => handleReleasePayout(p.id)}
                            style={{ padding: "6px 12px", background: "#059669", color: "#fff", border: "none", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                            Mark Paid
                          </button>
                        ) : (
                          <span style={{ fontSize: 11, color: "#94A3B8", fontStyle: "italic" }}>Complete</span>
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
