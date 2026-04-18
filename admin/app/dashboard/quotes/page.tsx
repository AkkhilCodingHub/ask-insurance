"use client";

import { useState, useEffect } from "react";
import { Search, RefreshCw, Send, ChevronDown, ChevronUp } from "lucide-react";
import { adminApi, type AdminQuote, type AdminQuoteResponse } from "@/lib/api";

type Status = "pending" | "responded" | "approved" | "converted" | "expired";

const STATUS_META: Record<Status, { bg: string; color: string; label: string }> = {
  pending:   { bg: "#FFFBEB", color: "#D97706", label: "Awaiting Response" },
  responded: { bg: "#EFF6FF", color: "#1580FF", label: "Quote Sent" },
  approved:  { bg: "#F5F3FF", color: "#7C3AED", label: "Payment Pending" },
  converted: { bg: "#ECFDF5", color: "#059669", label: "Completed" },
  expired:   { bg: "#F3F4F6", color: "#6B7280", label: "Expired" },
};

const TYPE_COLORS: Record<string, string> = {
  life: "#1580FF", health: "#059669", motor: "#D97706",
  fire: "#EA580C", marine: "#0891B2", engineering: "#7C3AED", liability: "#DC2626",
};

function fmt(n: number) { return `₹${Number(n).toLocaleString("en-IN")}`; }

function StatusBadge({ status }: { status: Status }) {
  const s = STATUS_META[status] ?? STATUS_META.pending;
  return <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 100, background: s.bg, color: s.color }}>{s.label}</span>;
}

function RespondForm({ quote, onDone }: { quote: AdminQuote; onDone: () => void }) {
  const existing = quote.adminResponse;
  const [form, setForm] = useState({
    insurer:      existing?.insurer      ?? "",
    planName:     existing?.planName     ?? "",
    netPremium:   existing?.netPremium   ? String(existing.netPremium)   : "",
    gst:          existing?.gst          ? String(existing.gst)          : "",
    totalPremium: existing?.totalPremium ? String(existing.totalPremium) : "",
    notes:        existing?.notes        ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState<string | null>(null);

  // Auto-calculate GST and total when netPremium changes
  const handleNetPremium = (v: string) => {
    const net = Number(v.replace(/\D/g, ""));
    const gst = Math.round(net * 0.18);
    setForm(f => ({ ...f, netPremium: v.replace(/\D/g, ""), gst: String(gst), totalPremium: String(net + gst) }));
  };

  const handleSubmit = async () => {
    if (!form.insurer || !form.planName || !form.netPremium) {
      setErr("Insurer, Plan Name, and Net Premium are required."); return;
    }
    setSaving(true); setErr(null);
    try {
      const payload: AdminQuoteResponse = {
        insurer:      form.insurer,
        planName:     form.planName,
        netPremium:   Number(form.netPremium),
        gst:          Number(form.gst),
        totalPremium: Number(form.totalPremium),
        notes:        form.notes || undefined,
      };
      await adminApi.respondToQuote(quote.id, payload);
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to send quote");
    } finally {
      setSaving(false);
    }
  };

  const inp: React.CSSProperties = {
    width: "100%", padding: "9px 12px", border: "1.5px solid var(--border)",
    borderRadius: 8, fontSize: 13, color: "var(--text)", background: "#fff",
    outline: "none", boxSizing: "border-box",
  };
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5, display: "block" };
  const row: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 };

  return (
    <div style={{ padding: "16px 20px", background: "var(--bg)", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 14 }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
        {existing ? "Update Quote" : "Send Quote to Customer"}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={lbl}>Insurer Name</label>
          <input style={inp} value={form.insurer} onChange={e => setForm(f => ({ ...f, insurer: e.target.value }))} placeholder="e.g. HDFC Life" />
        </div>
        <div>
          <label style={lbl}>Plan Name</label>
          <input style={inp} value={form.planName} onChange={e => setForm(f => ({ ...f, planName: e.target.value }))} placeholder="e.g. Click 2 Protect Life" />
        </div>
      </div>

      <div style={row}>
        <div>
          <label style={lbl}>Net Premium (₹)</label>
          <input style={inp} type="number" value={form.netPremium} onChange={e => handleNetPremium(e.target.value)} placeholder="0" />
        </div>
        <div>
          <label style={lbl}>GST 18% (₹) — auto</label>
          <input style={{ ...inp, background: "var(--bg)", color: "var(--text-muted)" }} value={form.gst} readOnly />
        </div>
        <div>
          <label style={lbl}>Total Premium (₹) — auto</label>
          <input style={{ ...inp, background: "var(--bg)", fontWeight: 700 }} value={form.totalPremium} readOnly />
        </div>
      </div>

      <div>
        <label style={lbl}>Advisor Notes (optional — shown to customer)</label>
        <textarea style={{ ...inp, resize: "vertical", minHeight: 60 } as React.CSSProperties}
          value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          placeholder="Any terms, conditions, or next steps…" />
      </div>

      {err && <p style={{ fontSize: 12, color: "#DC2626" }}>{err}</p>}

      <button onClick={handleSubmit} disabled={saving}
        style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "var(--primary)", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, alignSelf: "flex-start" }}>
        <Send size={14} />
        {saving ? "Sending…" : existing ? "Update Quote" : "Send Quote to Customer"}
      </button>
    </div>
  );
}

export default function QuotesPage() {
  const [quotes, setQuotes]   = useState<AdminQuote[]>([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [search, setSearch]   = useState("");
  const [statusF, setStatusF] = useState("All");
  const [expanded, setExpanded] = useState<string | null>(null);

  async function load() {
    setLoading(true); setError(null);
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
    return ms && (!qq || (q.user?.name ?? "").toLowerCase().includes(qq) || (q.user?.phone ?? "").includes(qq) || q.type.toLowerCase().includes(qq));
  });

  const statusCounts = (["pending", "responded", "approved", "converted"] as Status[]).reduce((acc, s) => {
    acc[s] = quotes.filter(q => q.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 2 }}>Quote Requests</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
            {loading ? "Loading…" : `${total} requests · ${statusCounts.responded ?? 0} awaiting your response`}
          </p>
        </div>
        <button onClick={load}
          style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 14px", background: "var(--bg)", border: "1.5px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {error && <div style={{ padding: "12px 16px", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 10, color: "#DC2626", fontSize: 13, marginBottom: 16 }}>{error}</div>}

      {/* Funnel stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {(["pending", "responded", "approved", "converted"] as Status[]).map(s => {
          const count = statusCounts[s] ?? 0;
          const sm = STATUS_META[s];
          return (
            <div key={s} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 18px", cursor: "pointer", borderLeft: `3px solid ${sm.color}` }}
              onClick={() => setStatusF(statusF === s ? "All" : s)}>
              <p style={{ fontSize: 28, fontWeight: 900, color: sm.color, letterSpacing: "-0.05em", marginBottom: 4 }}>{count}</p>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{sm.label}</p>
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
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["All", "pending", "responded", "approved", "converted"].map(s => (
            <button key={s} onClick={() => setStatusF(s)}
              style={{ padding: "7px 14px", borderRadius: 8, border: statusF === s ? "none" : "1.5px solid var(--border)", background: statusF === s ? "var(--primary)" : "#fff", color: statusF === s ? "#fff" : "var(--text-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              {s === "All" ? "All" : STATUS_META[s as Status]?.label ?? s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-muted)" }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-muted)" }}>No quote requests found</div>
        ) : (
          filtered.map(q => {
            const isOpen = expanded === q.id;
            const typeColor = TYPE_COLORS[q.type] ?? "#64748B";
            let details: Record<string, unknown> = {};
            try { details = JSON.parse(q.details); } catch {}

            return (
              <div key={q.id} style={{ borderBottom: "1px solid var(--border)" }}>
                {/* Row */}
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr auto", gap: 8, padding: "14px 20px", alignItems: "center", cursor: "pointer" }}
                  onClick={() => setExpanded(isOpen ? null : q.id)}>
                  {/* Customer */}
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{q.user?.name ?? "—"}</p>
                    <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{q.user?.phone ? `+91 ${q.user.phone}` : ""}</p>
                  </div>
                  {/* Type */}
                  <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 100, background: typeColor + "18", color: typeColor, display: "inline-block" }}>
                    {q.type.charAt(0).toUpperCase() + q.type.slice(1)}
                  </span>
                  {/* Requirements */}
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {details.sumInsured ? <p>Cover: {fmt(Number(details.sumInsured))}</p> : null}
                    {details.age ? <p>Age: {String(details.age)}</p> : null}
                    {details.planName ? <p style={{ fontStyle: "italic" }}>{String(details.planName)}</p> : null}
                  </div>
                  {/* Date */}
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {new Date(q.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                  {/* Status */}
                  <StatusBadge status={q.status as Status} />
                  {/* Expand */}
                  <span style={{ color: "var(--text-muted)" }}>
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </span>
                </div>

                {/* Expanded: existing response preview + form */}
                {isOpen && (
                  <div>
                    {q.adminResponse && (
                      <div style={{ padding: "12px 20px", background: "#F0FDF4", borderTop: "1px solid var(--border)", display: "flex", gap: 24, flexWrap: "wrap" }}>
                        <div><p style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Insurer</p><p style={{ fontSize: 13, fontWeight: 700 }}>{q.adminResponse.insurer}</p></div>
                        <div><p style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Plan</p><p style={{ fontSize: 13, fontWeight: 700 }}>{q.adminResponse.planName}</p></div>
                        <div><p style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Net Premium</p><p style={{ fontSize: 13, fontWeight: 700 }}>{fmt(q.adminResponse.netPremium)}</p></div>
                        <div><p style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>GST</p><p style={{ fontSize: 13, fontWeight: 700 }}>{fmt(q.adminResponse.gst)}</p></div>
                        <div><p style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Total</p><p style={{ fontSize: 16, fontWeight: 900, color: "var(--primary)" }}>{fmt(q.adminResponse.totalPremium)}</p></div>
                      </div>
                    )}
                    {["pending", "responded"].includes(q.status) && (
                      <RespondForm quote={q} onDone={() => { load(); setExpanded(null); }} />
                    )}
                    {q.status === "approved" && (
                      <div style={{ padding: "14px 20px", background: "#F5F3FF", borderTop: "1px solid var(--border)" }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#7C3AED" }}>
                          ✓ Customer approved this quote. Send them a payment link (Razorpay / PayU) and confirm payment in the Policies section once paid.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
