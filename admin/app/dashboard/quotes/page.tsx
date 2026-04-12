"use client";

import { useState } from "react";
import { Search, Phone } from "lucide-react";
import { QUOTES, type Quote } from "@/lib/mock";

type QuoteStatus = "New" | "Contacted" | "Converted" | "Lost";

const STATUS_META: Record<QuoteStatus, { bg: string; color: string }> = {
  New:       { bg: "#E8F2FF", color: "#1580FF" },
  Contacted: { bg: "#FFFBEB", color: "#D97706" },
  Converted: { bg: "#ECFDF5", color: "#059669" },
  Lost:      { bg: "#FEF2F2", color: "#DC2626" },
};

function StatusBadge({ status }: { status: QuoteStatus }) {
  const s = STATUS_META[status];
  return <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 100, background: s.bg, color: s.color }}>{status}</span>;
}

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>(QUOTES);
  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState("All");

  function updateStatus(id: string, status: QuoteStatus) {
    setQuotes(prev => prev.map(q => q.id === id ? { ...q, status } : q));
  }

  const filtered = quotes.filter(q => {
    const ms = statusF === "All" || q.status === statusF;
    const qq = search.toLowerCase();
    return ms && (!qq || q.name.toLowerCase().includes(qq) || q.phone.includes(qq) || q.category.toLowerCase().includes(qq) || q.planName.toLowerCase().includes(qq));
  });

  const converted = quotes.filter(q => q.status === "Converted").length;
  const convRate = Math.round((converted / quotes.length) * 100);
  const totalPotential = quotes.filter(q => q.status !== "Lost").reduce((s, q) => s + parseInt(q.premium.replace(/[^\d]/g, "")) || 0, 0);

  return (
    <div style={{ width: "100%" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 2 }}>Quotes</h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{quotes.length} quote requests</p>
      </div>

      {/* Funnel stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {(["New", "Contacted", "Converted", "Lost"] as QuoteStatus[]).map(s => {
          const count = quotes.filter(q => q.status === s).length;
          const sm = STATUS_META[s];
          return (
            <div key={s} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 18px", cursor: "pointer" }}
              onClick={() => setStatusF(statusF === s ? "All" : s)}>
              <p style={{ fontSize: 26, fontWeight: 900, color: sm.color, letterSpacing: "-0.05em", marginBottom: 4 }}>{count}</p>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{s}</p>
              <div style={{ marginTop: 8, height: 3, borderRadius: 2, background: sm.bg }}>
                <div style={{ height: "100%", width: `${(count / quotes.length) * 100}%`, background: sm.color, borderRadius: 2 }} />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 14px", border: "1.5px solid var(--border)", borderRadius: 10, background: "#fff", height: 42, flex: 1, minWidth: 200 }}>
          <Search size={15} color="var(--text-muted)" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Name, phone, plan…"
            style={{ flex: 1, border: "none", outline: "none", fontSize: 13, color: "var(--text)", background: "transparent" }} />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["All", "New", "Contacted", "Converted", "Lost"].map(s => (
            <button key={s} onClick={() => setStatusF(s)}
              style={{ padding: "7px 14px", borderRadius: 8, border: statusF === s ? "none" : "1.5px solid var(--border)", background: statusF === s ? "var(--primary)" : "#fff", color: statusF === s ? "#fff" : "var(--text-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
          <thead>
            <tr style={{ background: "var(--bg)" }}>
              {["Lead", "Category / Plan", "Premium", "Source", "Date", "Status", "Action"].map(h => (
                <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(q => (
              <tr key={q.id} style={{ borderTop: "1px solid var(--border)" }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--bg)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                <td style={{ padding: "14px 16px" }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{q.name}</p>
                  <p style={{ fontSize: 11, color: "var(--text-muted)" }}>+91 {q.phone}</p>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{q.planName}</p>
                  <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{q.category}</p>
                </td>
                <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{q.premium}</td>
                <td style={{ padding: "14px 16px" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 100, background: "var(--bg)", color: "var(--text-muted)" }}>{q.source}</span>
                </td>
                <td style={{ padding: "14px 16px", fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{q.createdAt}</td>
                <td style={{ padding: "14px 16px" }}><StatusBadge status={q.status as QuoteStatus} /></td>
                <td style={{ padding: "14px 16px" }}>
                  <select value={q.status} onChange={e => updateStatus(q.id, e.target.value as QuoteStatus)}
                    style={{ padding: "6px 10px", border: "1.5px solid var(--border)", borderRadius: 7, fontSize: 12, color: "var(--text)", background: "#fff", outline: "none", cursor: "pointer" }}>
                    {["New", "Contacted", "Converted", "Lost"].map(s => <option key={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
