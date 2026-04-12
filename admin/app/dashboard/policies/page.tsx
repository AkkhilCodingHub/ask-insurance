"use client";

import { useState } from "react";
import { Search, Download } from "lucide-react";
import { POLICIES, type AdminPolicy } from "@/lib/mock";

const STATUSES = ["All", "Active", "Pending", "Expired", "Cancelled"];
const CATEGORIES = ["All", "Life", "Health", "Motor", "Travel", "Home", "Business"];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    Active:    { bg: "#ECFDF5", color: "#059669" },
    Pending:   { bg: "#FFFBEB", color: "#D97706" },
    Expired:   { bg: "#FEF2F2", color: "#DC2626" },
    Cancelled: { bg: "var(--bg)", color: "var(--text-muted)" },
  };
  const s = map[status] ?? { bg: "var(--bg)", color: "var(--text-muted)" };
  return <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 100, background: s.bg, color: s.color }}>{status}</span>;
}

export default function PoliciesPage() {
  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState("All");
  const [catF, setCatF] = useState("All");

  const filtered = POLICIES.filter(p => {
    const ms = statusF === "All" || p.status === statusF;
    const mc = catF === "All" || p.category === catF;
    const q = search.toLowerCase();
    return ms && mc && (!q || p.userName.toLowerCase().includes(q) || p.policyNo.toLowerCase().includes(q) || p.planName.toLowerCase().includes(q) || p.insurer.toLowerCase().includes(q));
  });

  const totalPremium = filtered.filter(p => p.status === "Active").reduce((s, p) => s + p.premiumRaw, 0);

  return (
    <div style={{ width: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 2 }}>Policies</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{filtered.length} policies · ₹{(totalPremium / 100000).toFixed(1)}L active premium</p>
        </div>
        <button style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", background: "var(--primary)", border: "none", borderRadius: 10, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* Filters row */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 14px", border: "1.5px solid var(--border)", borderRadius: 10, background: "#fff", height: 40, flex: 1, minWidth: 200 }}>
          <Search size={15} color="var(--text-muted)" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Policy no., user, insurer…"
            style={{ flex: 1, border: "none", outline: "none", fontSize: 13, color: "var(--text)", background: "transparent" }} />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {STATUSES.map(s => (
            <button key={s} onClick={() => setStatusF(s)}
              style={{ padding: "7px 14px", borderRadius: 8, border: statusF === s ? "none" : "1.5px solid var(--border)", background: statusF === s ? "var(--primary)" : "#fff", color: statusF === s ? "#fff" : "var(--text-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Category chips */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCatF(c)}
            style={{ padding: "5px 14px", borderRadius: 100, border: catF === c ? "none" : "1.5px solid var(--border)", background: catF === c ? "#0F172A" : "#fff", color: catF === c ? "#fff" : "var(--text-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            {c}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
          <thead>
            <tr style={{ background: "var(--bg)" }}>
              {["Policy No.", "Policyholder", "Plan / Insurer", "Category", "Premium", "Cover", "Renewal Date", "Status"].map(h => (
                <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} style={{ borderTop: "1px solid var(--border)", transition: "background 0.12s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--bg)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", fontFamily: "monospace" }}>{p.policyNo}</span>
                  </div>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{p.userName}</p>
                  <p style={{ fontSize: 11, color: "var(--text-muted)" }}>+91 {p.userPhone}</p>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{p.planName}</p>
                  <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{p.insurer}</p>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 100, background: p.color + "18", color: p.color }}>{p.category}</span>
                </td>
                <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{p.premium}</td>
                <td style={{ padding: "14px 16px", fontSize: 13, color: "var(--text-muted)" }}>{p.cover}</td>
                <td style={{ padding: "14px 16px", fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{p.renewalDate}</td>
                <td style={{ padding: "14px 16px" }}><StatusBadge status={p.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-muted)" }}>
            <Search size={36} color="var(--border)" style={{ marginBottom: 10 }} />
            <p style={{ fontWeight: 600 }}>No policies match your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
