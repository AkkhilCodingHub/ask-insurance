"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search, RefreshCw, Send, X, Link, CheckCircle, Clock,
  AlertCircle, Copy, ExternalLink, User, Phone, Mail,
  FileText, ChevronRight, Zap,
} from "lucide-react";
import { adminApi, type AdminQuote, type AdminQuoteResponse } from "@/lib/api";

// ── Types & constants ──────────────────────────────────────────────────────────

type Status = "pending" | "responded" | "approved" | "converted" | "expired";

const STATUS_META: Record<Status, { bg: string; color: string; border: string; label: string; dot: string }> = {
  pending:   { bg: "#FFFBEB", color: "#B45309", border: "#FDE68A", label: "Awaiting Response", dot: "#F59E0B" },
  responded: { bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE", label: "Quote Sent",        dot: "#3B82F6" },
  approved:  { bg: "#F5F3FF", color: "#6D28D9", border: "#DDD6FE", label: "Payment Pending",   dot: "#8B5CF6" },
  converted: { bg: "#ECFDF5", color: "#065F46", border: "#A7F3D0", label: "Completed",          dot: "#10B981" },
  expired:   { bg: "#F8FAFC", color: "#64748B", border: "#E2E8F0", label: "Expired",            dot: "#94A3B8" },
};

const TYPE_COLORS: Record<string, string> = {
  life: "#3B82F6", health: "#10B981", motor: "#F59E0B",
  fire: "#EF4444", marine: "#06B6D4", engineering: "#8B5CF6", liability: "#EC4899",
};

const STATUSES: Status[] = ["pending", "responded", "approved", "converted", "expired"];

function fmt(n: number) {
  return "₹" + Number(n).toLocaleString("en-IN");
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

// ── Shared input styles ────────────────────────────────────────────────────────

const INP: React.CSSProperties = {
  width: "100%", padding: "9px 12px", border: "1.5px solid var(--border)",
  borderRadius: 8, fontSize: 13, color: "var(--text)", background: "#fff",
  outline: "none", boxSizing: "border-box",
};
const LBL: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: "var(--text-muted)",
  textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5, display: "block",
};

// ── Respond / Edit Quote form ─────────────────────────────────────────────────

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
  const [done, setDone]     = useState(false);

  const handleNet = (v: string) => {
    const net = parseInt(v.replace(/\D/g, "")) || 0;
    const gst = Math.round(net * 0.18);
    setForm(f => ({ ...f, netPremium: v.replace(/\D/g, ""), gst: String(gst), totalPremium: String(net + gst) }));
  };

  const handleSubmit = async () => {
    if (!form.insurer.trim() || !form.planName.trim() || !form.netPremium) {
      setErr("Insurer, plan name and net premium are required."); return;
    }
    setSaving(true); setErr(null);
    try {
      const payload: AdminQuoteResponse = {
        insurer:      form.insurer.trim(),
        planName:     form.planName.trim(),
        netPremium:   Number(form.netPremium),
        gst:          Number(form.gst),
        totalPremium: Number(form.totalPremium),
        notes:        form.notes.trim() || undefined,
      };
      await adminApi.respondToQuote(quote.id, payload);
      setDone(true);
      setTimeout(onDone, 900);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to send quote");
    } finally {
      setSaving(false);
    }
  };

  if (done) return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 0", color: "#059669" }}>
      <CheckCircle size={18} />
      <span style={{ fontSize: 14, fontWeight: 700 }}>Quote sent! Customer notified via push.</span>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="qform-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={LBL}>Insurer *</label>
          <input style={INP} value={form.insurer} onChange={e => setForm(f => ({ ...f, insurer: e.target.value }))} placeholder="e.g. HDFC Life" />
        </div>
        <div>
          <label style={LBL}>Plan Name *</label>
          <input style={INP} value={form.planName} onChange={e => setForm(f => ({ ...f, planName: e.target.value }))} placeholder="e.g. Click 2 Protect Life" />
        </div>
      </div>

      <div className="qform-3col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <div>
          <label style={LBL}>Net Premium (₹) *</label>
          <input style={INP} type="text" inputMode="numeric" value={form.netPremium} onChange={e => handleNet(e.target.value)} placeholder="0" />
        </div>
        <div>
          <label style={LBL}>GST 18% (auto)</label>
          <input style={{ ...INP, background: "#F8FAFC", color: "var(--text-muted)", cursor: "not-allowed" }}
            value={form.gst ? fmt(Number(form.gst)) : "—"} readOnly />
        </div>
        <div>
          <label style={LBL}>Total Premium (auto)</label>
          <input style={{ ...INP, background: "#F0FDF4", fontWeight: 800, color: "#059669", cursor: "not-allowed", fontSize: 14 }}
            value={form.totalPremium ? fmt(Number(form.totalPremium)) : "—"} readOnly />
        </div>
      </div>

      <div>
        <label style={LBL}>Remarks / Notes (visible to customer)</label>
        <textarea
          style={{ ...INP, resize: "vertical", minHeight: 72, fontFamily: "inherit" } as React.CSSProperties}
          value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          placeholder="Terms, validity, next steps, any conditions…"
        />
      </div>

      {err && (
        <div style={{ display: "flex", gap: 8, padding: "10px 12px", background: "#FEF2F2", borderRadius: 8, border: "1px solid #FECACA" }}>
          <AlertCircle size={14} color="#DC2626" style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 12, color: "#DC2626" }}>{err}</span>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={saving}
        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 20px", background: saving ? "#93C5FD" : "#1580FF", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", transition: "background 0.15s" }}
      >
        <Send size={14} />
        {saving ? "Sending…" : existing ? "Update & Resend Quote" : "Send Quote to Customer"}
      </button>
    </div>
  );
}

// ── Payment link section ───────────────────────────────────────────────────────

function PaymentLinkSection({ quote }: { quote: AdminQuote }) {
  const [loading, setLoading]     = useState(false);
  const [url, setUrl]             = useState<string | null>(null);
  const [err, setErr]             = useState<string | null>(null);
  const [copied, setCopied]       = useState(false);

  const generate = async () => {
    setLoading(true); setErr(null);
    try {
      const r = await adminApi.generateQuotePaymentLink(quote.id);
      setUrl(r.paymentUrl);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to generate link");
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ padding: "12px 14px", background: "#F5F3FF", borderRadius: 10, border: "1px solid #DDD6FE" }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#6D28D9", margin: 0 }}>Customer approved this quote</p>
        <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "4px 0 0" }}>
          Generate a Razorpay payment link and share it with the customer. Policy activates automatically on payment.
        </p>
        {quote.adminResponse && (
          <p style={{ fontSize: 15, fontWeight: 900, color: "#6D28D9", margin: "8px 0 0" }}>
            Amount: {fmt(quote.adminResponse.totalPremium)}/yr
          </p>
        )}
      </div>

      {!url ? (
        <button
          onClick={generate}
          disabled={loading}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 20px", background: loading ? "#C4B5FD" : "#8B5CF6", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}
        >
          <Link size={14} />
          {loading ? "Generating…" : "Generate Payment Link"}
        </button>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", gap: 8, padding: "10px 12px", background: "#fff", borderRadius: 10, border: "1.5px solid #DDD6FE", alignItems: "center" }}>
            <span style={{ flex: 1, fontSize: 12, fontFamily: "monospace", color: "var(--text)", wordBreak: "break-all" }}>{url}</span>
            <button onClick={copy}
              style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", background: copied ? "#ECFDF5" : "#F5F3FF", border: "1px solid", borderColor: copied ? "#6EE7B7" : "#DDD6FE", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer", color: copied ? "#059669" : "#6D28D9" }}>
              <Copy size={11} />{copied ? "Copied!" : "Copy"}
            </button>
            <a href={url} target="_blank" rel="noopener noreferrer"
              style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", background: "#8B5CF6", borderRadius: 7, fontSize: 12, fontWeight: 700, color: "#fff", textDecoration: "none" }}>
              <ExternalLink size={11} /> Open
            </a>
          </div>
          <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>Share via WhatsApp or SMS. Policy activates once Razorpay confirms payment.</p>
        </div>
      )}

      {err && (
        <div style={{ display: "flex", gap: 8, padding: "10px 12px", background: "#FEF2F2", borderRadius: 8, border: "1px solid #FECACA" }}>
          <AlertCircle size={14} color="#DC2626" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: "#DC2626" }}>{err}</span>
        </div>
      )}
    </div>
  );
}

// ── Side Drawer ────────────────────────────────────────────────────────────────

function Drawer({ quote, onClose, onRefresh }: { quote: AdminQuote; onClose: () => void; onRefresh: () => void }) {
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  const st = STATUS_META[quote.status as Status] ?? STATUS_META.pending;
  const typeColor = TYPE_COLORS[quote.type] ?? "#64748B";
  const ar = quote.adminResponse;

  let details: Record<string, unknown> = {};
  try { details = JSON.parse(quote.details); } catch {}
  const coverVal = details.sumInsured ?? details.idv ?? details.assetValue;

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const changeStatus = async (s: "pending" | "responded" | "approved" | "expired") => {
    if (updatingStatus || s === quote.status) return;
    setUpdatingStatus(true);
    try {
      await adminApi.updateQuoteStatus(quote.id, s);
      onRefresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const detailEntries = Object.entries(details).filter(([k]) => k !== "planId");

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 200, backdropFilter: "blur(2px)" }}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="side-drawer"
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0, width: 500,
          background: "#fff", zIndex: 201, display: "flex", flexDirection: "column",
          boxShadow: "-4px 0 40px rgba(0,0,0,0.15)",
          animation: "slideIn 0.22s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        {/* ── Drawer header ── */}
        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: typeColor + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: typeColor }}>{quote.type.slice(0, 2).toUpperCase()}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", margin: 0 }}>
              {quote.user?.name ?? "Unknown Customer"}
            </p>
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "2px 0 0" }}>
              {quote.type.charAt(0).toUpperCase() + quote.type.slice(1)} Insurance · {fmtDate(quote.createdAt)} at {fmtTime(quote.createdAt)}
            </p>
          </div>
          <span style={{ padding: "4px 10px", borderRadius: 100, background: st.bg, color: st.color, border: `1px solid ${st.border}`, fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
            {st.label}
          </span>
          <button onClick={onClose}
            style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer", padding: 7, display: "flex", color: "var(--text-muted)", flexShrink: 0 }}>
            <X size={16} />
          </button>
        </div>

        {/* ── Drawer body (scrollable) ── */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>

          {/* ── CUSTOMER REQUIREMENTS — compact strip ── */}
          {detailEntries.length > 0 && (
            <div style={{ padding: "12px 24px", background: "var(--bg)", borderBottom: "1px solid var(--border)", display: "flex", gap: 20, flexWrap: "wrap" }}>
              {detailEntries.map(([k, v]) => (
                <div key={k}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", margin: 0 }}>{k.replace(/([A-Z])/g, " $1")}</p>
                  <p style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", margin: "2px 0 0" }}>
                    {k === "sumInsured" || k === "idv" || k === "assetValue" ? fmt(Number(v)) : String(v)}
                  </p>
                </div>
              ))}
              {quote.user?.phone && (
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", margin: 0 }}>Phone</p>
                  <p style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", margin: "2px 0 0" }}>+91 {quote.user.phone}</p>
                </div>
              )}
            </div>
          )}

          {/* ── PRIMARY ACTION ── */}
          <div style={{ padding: "20px 24px" }}>

            {/* Converted — read-only summary */}
            {quote.status === "converted" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "20px", background: "#ECFDF5", borderRadius: 12, border: "1px solid #A7F3D0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <CheckCircle size={22} color="#059669" />
                  <p style={{ fontSize: 15, fontWeight: 800, color: "#065F46", margin: 0 }}>Policy Issued — Completed</p>
                </div>
                {quote.approvedAt && <p style={{ fontSize: 12, color: "#6B7280", margin: 0 }}>Paid on {fmtDate(quote.approvedAt)}</p>}
                {ar && (
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 4 }}>
                    <span style={{ fontSize: 13, color: "#374151" }}><strong>Insurer:</strong> {ar.insurer}</span>
                    <span style={{ fontSize: 13, color: "#374151" }}><strong>Plan:</strong> {ar.planName}</span>
                    <span style={{ fontSize: 15, fontWeight: 900, color: "#059669" }}>{fmt(ar.totalPremium)}/yr</span>
                  </div>
                )}
              </div>

            ) : quote.status === "approved" ? (
              /* Approved — generate payment link */
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: "#F5F3FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Link size={13} color="#8B5CF6" />
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", margin: 0 }}>Generate Payment Link</p>
                </div>
                <PaymentLinkSection quote={quote} />
              </div>

            ) : (
              /* pending / responded / expired — always show the quote form */
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Send size={13} color="#1580FF" />
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", margin: 0 }}>
                    {ar ? "Edit & Resend Quote" : "Send Quote to Customer"}
                  </p>
                </div>

                {ar && (
                  <div style={{ padding: "12px 14px", background: "#F0FDF4", borderRadius: 10, border: "1px solid #D1FAE5", marginBottom: 18, display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
                    <div>
                      <p style={{ fontSize: 10, color: "#059669", textTransform: "uppercase", fontWeight: 700, margin: 0 }}>Currently sent</p>
                      <p style={{ fontSize: 13, fontWeight: 700, margin: "3px 0 0" }}>{ar.insurer} · {ar.planName}</p>
                    </div>
                    <p style={{ fontSize: 18, fontWeight: 900, color: "#059669", margin: 0, marginLeft: "auto" }}>{fmt(ar.totalPremium)}<span style={{ fontSize: 12, fontWeight: 500, color: "#6B7280" }}>/yr</span></p>
                  </div>
                )}

                <RespondForm quote={quote} onDone={() => { onRefresh(); onClose(); }} />
              </div>
            )}

            {/* ── STATUS CHANGE ── */}
            {quote.status !== "converted" && (
              <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}>Change Status</p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {(["pending", "responded", "approved", "expired"] as const).map(s => {
                    const sm = STATUS_META[s];
                    const active = quote.status === s;
                    return (
                      <button key={s} onClick={() => changeStatus(s)} disabled={updatingStatus || active}
                        style={{ padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: active ? "default" : "pointer", display: "flex", alignItems: "center", gap: 5, background: active ? sm.bg : "#fff", border: `1.5px solid ${active ? sm.color : "var(--border)"}`, color: active ? sm.color : "var(--text-muted)", opacity: updatingStatus && !active ? 0.5 : 1 }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: sm.dot, flexShrink: 0 }} />
                        {sm.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Drawer footer ── */}
        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", flexShrink: 0 }}>
          <button onClick={onClose}
            style={{ padding: "9px 20px", background: "var(--bg)", border: "1.5px solid var(--border)", borderRadius: 9, fontSize: 13, fontWeight: 600, color: "var(--text-muted)", cursor: "pointer" }}>
            Close
          </button>
        </div>
      </div>

      <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } } @media (max-width: 768px) { .side-drawer { width: 100% !important; } }`}</style>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function QuotesPage() {
  const [quotes, setQuotes]           = useState<AdminQuote[]>([]);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const [hasMore, setHasMore]         = useState(false);
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selected, setSelected]       = useState<AdminQuote | null>(null);
  const PAGE_SIZE = 25;

  const load = useCallback(async (pg = 1, replace = true) => {
    if (pg === 1) setLoading(true); else setLoadingMore(true);
    setError(null);
    try {
      const res = await adminApi.getQuotes(pg, PAGE_SIZE);
      if (replace) setQuotes(res.quotes); else setQuotes(p => [...p, ...res.quotes]);
      setTotal(res.total);
      setHasMore(pg * PAGE_SIZE < res.total);
      setPage(pg);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load quotes");
    } finally {
      setLoading(false); setLoadingMore(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Re-sync selected quote after refresh
  const refresh = useCallback(async () => {
    await load(1, true);
    // Keep drawer open, caller must close if desired
  }, [load]);

  const filtered = quotes.filter(q => {
    if (statusFilter !== "All" && q.status !== statusFilter) return false;
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      (q.user?.name ?? "").toLowerCase().includes(s) ||
      (q.user?.phone ?? "").includes(s) ||
      (q.user?.email ?? "").toLowerCase().includes(s) ||
      q.type.toLowerCase().includes(s)
    );
  });

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = quotes.filter(q => q.status === s).length; return acc;
  }, {} as Record<string, number>);

  const FUNNEL: { status: Status; label: string; sub: string }[] = [
    { status: "pending",   label: String(counts.pending ?? 0),   sub: "Awaiting Response" },
    { status: "responded", label: String(counts.responded ?? 0), sub: "Quote Sent" },
    { status: "approved",  label: String(counts.approved ?? 0),  sub: "Payment Pending" },
    { status: "converted", label: String(counts.converted ?? 0), sub: "Completed" },
  ];

  return (
    <div style={{ width: "100%" }}>

      {/* ── Page header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em", margin: 0 }}>Quote Requests</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "4px 0 0" }}>
            {loading ? "Loading…" : `${total} total · click any row to open actions`}
          </p>
        </div>
        <button
          onClick={() => load()}
          style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", background: "#fff", border: "1.5px solid var(--border)", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", color: "var(--text)" }}
        >
          <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} /> Refresh
        </button>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, color: "#DC2626", fontSize: 13, marginBottom: 16, display: "flex", gap: 8, alignItems: "center" }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* ── Funnel stat cards ── */}
      <div className="quote-funnel-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        {FUNNEL.map(({ status, label, sub }) => {
          const sm = STATUS_META[status];
          const active = statusFilter === status;
          return (
            <div
              key={status}
              onClick={() => setStatusFilter(statusFilter === status ? "All" : status)}
              style={{
                padding: "16px 20px", borderRadius: 14, cursor: "pointer", transition: "all 0.15s",
                background: active ? sm.bg : "#fff",
                border: `1.5px solid ${active ? sm.color : "var(--border)"}`,
                borderLeft: `4px solid ${sm.dot}`,
              }}
            >
              <p style={{ fontSize: 32, fontWeight: 900, color: sm.color, letterSpacing: "-0.05em", margin: 0, lineHeight: 1 }}>{label}</p>
              <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "6px 0 0", fontWeight: 600 }}>{sub}</p>
            </div>
          );
        })}
      </div>

      {/* ── Search + status chips ── */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 14px", border: "1.5px solid var(--border)", borderRadius: 10, background: "#fff", height: 42, flex: "1 1 240px", minWidth: 180 }}>
          <Search size={14} color="var(--text-muted)" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, phone, insurance type…"
            style={{ flex: 1, border: "none", outline: "none", fontSize: 13, color: "var(--text)", background: "transparent" }}
          />
          {search && <button onClick={() => setSearch("")} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 16, padding: 0 }}>✕</button>}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["All", ...STATUSES].map(s => {
            const sm = s !== "All" ? STATUS_META[s as Status] : null;
            const active = statusFilter === s;
            return (
              <button key={s} onClick={() => setStatusFilter(s)}
                style={{ padding: "7px 13px", borderRadius: 8, border: "1.5px solid", borderColor: active ? (sm?.color ?? "var(--primary)") : "var(--border)", background: active ? (sm?.bg ?? "var(--primary)") : "#fff", color: active ? (sm?.color ?? "#fff") : "var(--text-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                {s === "All" ? "All" : sm?.label ?? s}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Quote cards ── */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "80px 0", color: "var(--text-muted)" }}>
          <RefreshCw size={22} style={{ animation: "spin 1s linear infinite" }} />
          <span style={{ fontSize: 13 }}>Loading quotes…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: "80px 0", textAlign: "center" }}>
          <FileText size={36} color="var(--border)" style={{ marginBottom: 14 }} />
          <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: "0 0 6px" }}>
            {search || statusFilter !== "All" ? "No matching quotes" : "No quote requests yet"}
          </p>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
            {search || statusFilter !== "All" ? "Try adjusting your search or filter." : "Quote requests from the app will appear here."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(q => {
            const st  = STATUS_META[q.status as Status] ?? STATUS_META.pending;
            const tc  = TYPE_COLORS[q.type] ?? "#64748B";
            const ar  = q.adminResponse;
            let det: Record<string, unknown> = {};
            try { det = JSON.parse(q.details); } catch {}
            const coverRaw = det.sumInsured ?? det.idv ?? det.assetValue;
            const coverNum = Number(coverRaw);
            const hasCover = coverRaw != null && coverRaw !== "" && Number.isFinite(coverNum);
            const ageRaw = det.age;
            const hasAge = ageRaw != null && ageRaw !== "";

            // CTA label + color per status
            const cta =
              q.status === "pending"   ? { label: "Send Quote",    color: "#1580FF", bg: "#EFF6FF", border: "#BFDBFE", icon: <Zap size={11} /> } :
              q.status === "responded" ? { label: "Edit Quote",    color: "#0369A1", bg: "#E0F2FE", border: "#BAE6FD", icon: <Send size={11} /> } :
              q.status === "approved"  ? { label: "Payment Link",  color: "#6D28D9", bg: "#F5F3FF", border: "#DDD6FE", icon: <Link size={11} /> } :
              null;

            return (
              <div
                key={q.id}
                onClick={() => setSelected(q)}
                style={{
                  background: "#fff",
                  border: "1.5px solid var(--border)",
                  borderRadius: 14,
                  cursor: "pointer",
                  overflow: "hidden",
                  transition: "box-shadow 0.15s, border-color 0.15s",
                  display: "flex",
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)";
                  el.style.borderColor = tc + "60";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.boxShadow = "none";
                  el.style.borderColor = "var(--border)";
                }}
              >
                {/* Colour accent bar */}
                <div style={{ width: 4, background: tc, flexShrink: 0, borderRadius: "0" }} />

                {/* Card body */}
                <div className="quote-card-body" style={{ flex: 1, padding: "14px 18px", display: "flex", alignItems: "center", gap: 16, minWidth: 0 }}>

                  {/* Avatar */}
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: tc + "15", border: `1.5px solid ${tc}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 900, color: tc, letterSpacing: "-0.02em" }}>
                      {q.type.slice(0, 2).toUpperCase()}
                    </span>
                  </div>

                  {/* Name + meta row */}
                  <div className="quote-card-meta" style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 5 }}>
                      <p style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {q.user?.name ?? "Unknown"}
                      </p>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 100, background: tc + "15", color: tc, flexShrink: 0 }}>
                        {q.type.charAt(0).toUpperCase() + q.type.slice(1)}
                      </span>
                    </div>
                    {/* Detail chips row */}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                      {q.user?.phone && (
                        <span style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 3 }}>
                          <Phone size={10} /> +91 {q.user.phone}
                        </span>
                      )}
                      {hasCover && (
                        <span style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 3 }}>
                          <span style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--border)", display: "inline-block" }} />
                          Cover {fmt(coverNum)}
                        </span>
                      )}
                      {hasAge && (
                        <span style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 3 }}>
                          <span style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--border)", display: "inline-block" }} />
                          Age {String(ageRaw)} yrs
                        </span>
                      )}
                      <span style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 3 }}>
                        <span style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--border)", display: "inline-block" }} />
                        {fmtDate(q.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Quote amount block */}
                  <div className="quote-card-amount" style={{ textAlign: "right", flexShrink: 0, minWidth: 110 }}>
                    {ar ? (
                      <>
                        <p style={{ fontSize: 16, fontWeight: 900, color: tc, margin: 0, letterSpacing: "-0.03em" }}>
                          {fmt(ar.totalPremium)}<span style={{ fontSize: 11, fontWeight: 500, color: "var(--text-muted)" }}>/yr</span>
                        </p>
                        <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "2px 0 0" }}>{ar.insurer}</p>
                      </>
                    ) : (
                      <p style={{ fontSize: 12, color: "#CBD5E1", margin: 0, fontStyle: "italic" }}>Not quoted yet</p>
                    )}
                  </div>

                  {/* Status pill */}
                  <div className="quote-card-status" style={{ flexShrink: 0, textAlign: "center" }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      fontSize: 11, fontWeight: 700, padding: "5px 11px",
                      borderRadius: 100, background: st.bg, color: st.color, border: `1px solid ${st.border}`,
                      whiteSpace: "nowrap",
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: st.dot, flexShrink: 0 }} />
                      {st.label}
                    </span>
                  </div>

                  {/* CTA button or chevron */}
                  <div className="quote-card-cta" style={{ flexShrink: 0 }}>
                    {cta ? (
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        fontSize: 12, fontWeight: 700, padding: "7px 13px",
                        borderRadius: 9, background: cta.bg, color: cta.color,
                        border: `1.5px solid ${cta.border}`, whiteSpace: "nowrap",
                      }}>
                        {cta.icon} {cta.label}
                      </span>
                    ) : (
                      <ChevronRight size={16} color="var(--text-muted)" />
                    )}
                  </div>

                </div>
              </div>
            );
          })}

          {/* Load more */}
          {hasMore && (
            <div style={{ textAlign: "center", paddingTop: 8 }}>
              <button
                onClick={() => load(page + 1, false)}
                disabled={loadingMore}
                style={{ padding: "10px 32px", background: "#fff", border: "1.5px solid var(--border)", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "var(--text)", cursor: loadingMore ? "not-allowed" : "pointer", opacity: loadingMore ? 0.6 : 1 }}
              >
                {loadingMore ? "Loading…" : `Load ${total - quotes.length} more`}
              </button>
            </div>
          )}

          <p style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "right", margin: "4px 0 0" }}>
            {filtered.length} of {total} requests
          </p>
        </div>
      )}

      {/* ── Side Drawer ── */}
      {selected && (
        <Drawer
          key={selected.id}
          quote={quotes.find(q => q.id === selected.id) ?? selected}
          onClose={() => setSelected(null)}
          onRefresh={refresh}
        />
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        @media (max-width: 640px) {
          .quote-funnel-grid { grid-template-columns: repeat(2, 1fr) !important; }

          .quote-card-body { flex-wrap: wrap !important; row-gap: 8px !important; align-items: flex-start !important; }
          .quote-card-meta { width: calc(100% - 60px); flex: unset !important; min-width: 0; }
          .quote-card-amount { order: 4; min-width: unset !important; text-align: left !important; }
          .quote-card-status { order: 3; }
          .quote-card-cta { order: 5; }

          .qform-2col { grid-template-columns: 1fr !important; }
          .qform-3col { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  );
}
