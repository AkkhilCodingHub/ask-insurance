"use client";

import { useState, useEffect } from "react";
import { Search, RefreshCw } from "lucide-react";
import { adminApi, type AdminQuote } from "@/lib/api";

type ApiQuoteStatus = "pending" | "viewed" | "converted" | "expired";

const STATUS_META: Record<ApiQuoteStatus, { bg: string; color: string; label: string }> = {
  pending:   { bg: "#E8F2FF", color: "#1580FF", label: "New" },
  viewed:    { bg: "#FFFBEB", color: "#D97706", label: "Contacted" },
  converted: { bg: "#ECFDF5", color: "#059669", label: "Converted" },
  expired:   { bg: "#FEF2F2", color: "#DC2626", label: "Expired" },
};

function StatusBadge({ status }: { status: ApiQuoteStatus }) {
  const s = STATUS_META[status];
  return <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 100, background: s.bg, color: s.color }}>{s.label}</span>;
}

const TYPE_COLORS: Record<string, string> = {
  life: "#1580FF", health: "#059669", motor: "#D97706",
  travel: "#7C3AED", home: "#EA580C", business: "#0891B2"
};

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<AdminQuote[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState("All");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getQuotes(1, 100);
      setQuotes(res.quotes);
      setTotal(res.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = quotes.filter(q => {
    const ms = statusF === "All" || q.status === statusF;
    const qq = search.toLowerCase();
    return ms && (!qq ||
      (q.user?.name ?? "").toLowerCase().includes(qq) ||
      (q.user?.phone ?? "").includes(qq) ||
      q.type.toLowerCase().includes(qq)
    );
  });

  const converted = quotes.filter(q => q.status === "converted").length;
  const convRate = total > 0 ? Math.round((converted / total) * 100) : 0;

  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 2 }}>Quotes</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
            {loading ? "Loading…" : `${total} requests · ${convRate}% conversion`}
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

      {/* Funnel stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {(["pending", "viewed", "converted", "expired"] as ApiQuoteStatus[]).map(s => {
          const count = quotes.filter(q => q.status === s).length;
          const sm = STATUS_META[s];
          return (
            <div key={s} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 18px", cursor: "pointer" }}
              onClick={() => setStatusF(statusF === s ? "All" : s)}>
              <p style={{ fontSize: 26, fontWeight: 900, color: sm.color, letterSpacing: "-0.05em", marginBottom: 4 }}>{count}</p>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{sm.label}</p>
              <div style={{ marginTop: 8, height: 3, borderRadius: 2, background: sm.bg }}>
                <div style={{ height: "100%", width: total > 0 ? `${(count / total) * 100}%` : "0%", background: sm.color, borderRadius: 2 }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Search + filter */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 14px", border: "1.5px solid var(--border)", borderRadius: 10, background: "#fff", height: 42, flex: 1, minWidth: 200 }}>
          <Search size={15} color="var(--text-muted)" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Name, phone, insurance type…"
            style={{ flex: 1, border: "none", outline: "none", fontSize: 13, color: "var(--text)", background: "transparent" }} />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["All", "pending", "viewed", "converted", "expired"].map(s => (
            <button key={s} onClick={() => setStatusF(s)}
              style={{ padding: "7px 14px", borderRadius: 8, border: statusF === s ? "none" : "1.5px solid var(--border)", background: statusF === s ? "var(--primary)" : "#fff", color: statusF === s ? "#fff" : "var(--text-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              {s === "All" ? "All" : STATUS_META[s as ApiQuoteStatus].label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
          <thead>
            <tr style={{ background: "var(--bg)" }}>
              {["Lead", "Insurance Type", "Quote ID", "Requested", "Status"].map(h => (
                <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-muted)" }}>Loading quotes…</td></tr>
            ) : filtered.map(q => {
              const typeColor = TYPE_COLORS[q.type] ?? "#64748B";
              return (
                <tr key={q.id} style={{ borderTop: "1px solid var(--border)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--bg)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ padding: "14px 16px" }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{q.user?.name ?? "—"}</p>
                    <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{q.user?.phone ? `+91 ${q.user.phone}` : ""}</p>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 100, background: typeColor + "18", color: typeColor }}>
                      {q.type.charAt(0).toUpperCase() + q.type.slice(1)}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)", fontFamily: "monospace" }}>{q.id.slice(0, 16)}…</span>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                    {new Date(q.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td style={{ padding: "14px 16px" }}><StatusBadge status={q.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-muted)" }}>
            <p style={{ fontWeight: 600 }}>No quotes found</p>
          </div>
        )}
      </div>
    </div>
  );
}
