"use client";

import { useState } from "react";
import { Building2, Search } from "lucide-react";
import { INSURERS } from "@/lib/mock";

function ApiStatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; dot: string }> = {
    Live:    { bg: "#ECFDF5", color: "#059669", dot: "#059669" },
    Testing: { bg: "#FFFBEB", color: "#D97706", dot: "#D97706" },
    Offline: { bg: "#FEF2F2", color: "#DC2626", dot: "#DC2626" },
  };
  const s = map[status] ?? map["Offline"];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 100, background: s.bg, color: s.color }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot }} />
      {status}
    </span>
  );
}

export default function InsurersPage() {
  const [search, setSearch] = useState("");

  const filtered = INSURERS.filter(i => {
    const q = search.toLowerCase();
    return !q || i.name.toLowerCase().includes(q) || i.headquarters.toLowerCase().includes(q) || i.categories.some(c => c.toLowerCase().includes(q));
  });

  const live = INSURERS.filter(i => i.apiStatus === "Live").length;
  const totalPlans = INSURERS.reduce((s, i) => s + i.activePlans, 0);

  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 2 }}>Insurers</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{INSURERS.length} partners · {live} live · {totalPlans} active plans</p>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Partners", value: INSURERS.length.toString(), color: "#1580FF" },
          { label: "API Live",       value: live.toString(),             color: "#059669" },
          { label: "Active Plans",   value: totalPlans.toString(),       color: "#7C3AED" },
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
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search insurer, category, HQ city…"
          style={{ flex: 1, border: "none", outline: "none", fontSize: 13, color: "var(--text)", background: "transparent" }} />
      </div>

      {/* Table */}
      <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
          <thead>
            <tr style={{ background: "var(--bg)" }}>
              {["Insurer", "Categories", "Claim Ratio", "Active Plans", "Commission", "HQ", "Since", "API Status"].map(h => (
                <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(ins => (
              <tr key={ins.id} style={{ borderTop: "1px solid var(--border)" }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--bg)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: ins.color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: ins.color }}>{ins.short}</span>
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{ins.name}</p>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    {ins.categories.map(c => (
                      <span key={c} style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 100, background: "var(--bg)", color: "var(--text-muted)" }}>{c}</span>
                    ))}
                  </div>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: parseFloat(ins.claimRatio) >= 95 ? "#059669" : parseFloat(ins.claimRatio) >= 90 ? "#D97706" : "#DC2626" }}>
                    {ins.claimRatio}
                  </span>
                </td>
                <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 700, color: "var(--text)", textAlign: "center" }}>{ins.activePlans}</td>
                <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 600, color: "var(--primary)" }}>{ins.commissionRate}</td>
                <td style={{ padding: "14px 16px", fontSize: 13, color: "var(--text-muted)" }}>{ins.headquarters}</td>
                <td style={{ padding: "14px 16px", fontSize: 12, color: "var(--text-muted)" }}>{ins.since}</td>
                <td style={{ padding: "14px 16px" }}><ApiStatusBadge status={ins.apiStatus} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
