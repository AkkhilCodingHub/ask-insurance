"use client";

import { useState, useEffect } from "react";
import { Search, RefreshCw } from "lucide-react";
import { adminApi, type Insurer } from "@/lib/api";

function ActiveBadge({ isActive }: { isActive: boolean }) {
  const bg = isActive ? "#ECFDF5" : "#FEF2F2";
  const color = isActive ? "#059669" : "#DC2626";
  const dot = isActive ? "#059669" : "#DC2626";
  const label = isActive ? "Active" : "Inactive";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 100, background: bg, color }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: dot }} />
      {label}
    </span>
  );
}

export default function InsurersPage() {
  const [insurers, setInsurers] = useState<Insurer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getInsurers(1, 50);
      setInsurers(res.insurers);
      setTotal(res.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = insurers.filter(i => {
    const q = search.toLowerCase();
    return !q ||
      i.name.toLowerCase().includes(q) ||
      i.shortName.toLowerCase().includes(q) ||
      (i.headquarters ?? "").toLowerCase().includes(q);
  });

  const active = insurers.filter(i => i.isActive).length;
  const totalPlans = insurers.reduce((s, i) => s + (i._count?.plans ?? 0), 0);

  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 2 }}>Insurers</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
            {loading ? "Loading…" : `${total} partners · ${active} active · ${totalPlans} plans`}
          </p>
        </div>
        <button onClick={load}
          style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 14px", background: "var(--bg)", border: "1.5px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 10, color: "#DC2626", fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Stats strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Partners", value: total.toString(),      color: "#1580FF" },
          { label: "Active",         value: active.toString(),     color: "#059669" },
          { label: "Total Plans",    value: totalPlans.toString(), color: "#7C3AED" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 20px" }}>
            <p style={{ fontSize: 28, fontWeight: 900, color, letterSpacing: "-0.05em", marginBottom: 4 }}>{value}</p>
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 14px", border: "1.5px solid var(--border)", borderRadius: 10, background: "#fff", marginBottom: 16, height: 42 }}>
        <Search size={15} color="var(--text-muted)" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search insurer, short name, HQ city…"
          style={{ flex: 1, border: "none", outline: "none", fontSize: 13, color: "var(--text)", background: "transparent" }} />
      </div>

      {/* Table */}
      <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
          <thead>
            <tr style={{ background: "var(--bg)" }}>
              {["Insurer", "Tagline", "Claim Ratio", "Plans", "Policies", "HQ", "Founded", "Status"].map(h => (
                <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-muted)" }}>Loading insurers…</td></tr>
            ) : filtered.map(ins => {
              const pct = ins.claimsRatio > 1 ? ins.claimsRatio : ins.claimsRatio * 100;
              const ratioColor = pct >= 97 ? "#059669" : pct >= 94 ? "#D97706" : "#DC2626";
              const color = ins.brandColor || "#1580FF";
              return (
                <tr key={ins.id} style={{ borderTop: "1px solid var(--border)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--bg)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: 16, fontWeight: 900, color }}>{ins.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{ins.name}</p>
                        {ins.website && <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{ins.website}</p>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px", maxWidth: 200 }}>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {ins.tagline ?? "—"}
                    </p>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: ratioColor }}>{pct.toFixed(1)}%</span>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 700, color: "var(--text)", textAlign: "center" }}>
                    {ins._count?.plans ?? 0}
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 13, color: "var(--text-muted)", textAlign: "center" }}>
                    {ins._count?.policies ?? 0}
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 13, color: "var(--text-muted)" }}>{ins.headquarters ?? "—"}</td>
                  <td style={{ padding: "14px 16px", fontSize: 12, color: "var(--text-muted)" }}>{ins.founded ?? "—"}</td>
                  <td style={{ padding: "14px 16px" }}><ActiveBadge isActive={ins.isActive} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-muted)" }}>
            <p style={{ fontWeight: 600 }}>No insurers match your search</p>
          </div>
        )}
      </div>
    </div>
  );
}
