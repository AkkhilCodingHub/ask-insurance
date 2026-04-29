"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search, RefreshCw, X, Save, Upload, FileText,
  ExternalLink, ChevronLeft, ChevronRight, CheckCircle2,
  AlertCircle, Clock, XCircle, Shield, Activity,
  TrendingUp, Banknote, Filter, MoreHorizontal,
} from "lucide-react";
import { adminApi, type AdminPolicy } from "@/lib/api";

// ── Constants ──────────────────────────────────────────────────────────────────

const TYPE_META: Record<string, { color: string; bg: string; emoji: string; label: string }> = {
  life:     { color: "#1580FF", bg: "#EFF6FF", emoji: "❤️",  label: "Life"     },
  health:   { color: "#059669", bg: "#ECFDF5", emoji: "🏥",  label: "Health"   },
  motor:    { color: "#D97706", bg: "#FFFBEB", emoji: "🚗",  label: "Motor"    },
  travel:   { color: "#7C3AED", bg: "#F5F3FF", emoji: "✈️",  label: "Travel"   },
  home:     { color: "#0891B2", bg: "#ECFEFF", emoji: "🏠",  label: "Home"     },
  business: { color: "#E11D48", bg: "#FFF1F2", emoji: "💼",  label: "Business" },
};

const STATUS_META: Record<string, { color: string; bg: string; border: string; icon: React.FC<{size:number}> }> = {
  active:    { color: "#059669", bg: "#ECFDF5", border: "#A7F3D0", icon: CheckCircle2  },
  pending:   { color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", icon: Clock        },
  expired:   { color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", icon: AlertCircle  },
  cancelled: { color: "#64748B", bg: "#F8FAFC", border: "#E2E8F0", icon: XCircle      },
};

const STATUS_TABS = [
  { key: "All",       label: "All"       },
  { key: "active",    label: "Active"    },
  { key: "pending",   label: "Pending"   },
  { key: "expired",   label: "Expired"   },
  { key: "cancelled", label: "Cancelled" },
];

const TYPE_FILTERS = ["All", "life", "health", "motor", "travel", "home", "business"];

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)}Cr`;
  if (n >= 100_000)    return `₹${(n / 100_000).toFixed(1)}L`;
  if (n >= 1_000)      return `₹${(n / 1_000).toFixed(0)}K`;
  return `₹${n.toLocaleString("en-IN")}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function toInput(iso: string) {
  return new Date(iso).toISOString().split("T")[0];
}

function daysLeft(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

// ── Stat Card ──────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.FC<{size:number;color:string}>;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: "18px 20px", flex: 1, minWidth: 160 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={16} color={color} />
        </div>
      </div>
      <p style={{ fontSize: 26, fontWeight: 900, color: "#0F172A", letterSpacing: "-0.04em", lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 5, fontWeight: 500 }}>{sub}</p>}
    </div>
  );
}

// ── Status Badge ───────────────────────────────────────────────────────────────

function StatusBadge({ status, size = "sm" }: { status: string; size?: "sm" | "md" }) {
  const m = STATUS_META[status] ?? STATUS_META.cancelled;
  const Icon = m.icon;
  const pad = size === "md" ? "5px 12px" : "3px 9px";
  const fs  = size === "md" ? 12 : 11;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: fs, fontWeight: 700, padding: pad, borderRadius: 100, background: m.bg, color: m.color, border: `1px solid ${m.border}` }}>
      <Icon size={size === "md" ? 12 : 10} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ── Confirm Payment Modal ──────────────────────────────────────────────────────

function ConfirmPaymentModal({ policy, onClose, onDone }: {
  policy: AdminPolicy;
  onClose: () => void;
  onDone: () => void;
}) {
  const [ref, setRef]       = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState<string | null>(null);

  async function submit() {
    setSaving(true);
    setErr(null);
    try {
      await adminApi.confirmPayment(policy.id, { providerRef: ref || undefined });
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <div style={{ position: "relative", zIndex: 301, background: "#fff", borderRadius: 20, padding: 28, width: 420, boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CheckCircle2 size={22} color="#059669" />
          </div>
          <div>
            <p style={{ fontSize: 16, fontWeight: 800, color: "#0F172A" }}>Confirm Payment</p>
            <p style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>{policy.policyNumber}</p>
          </div>
          <button onClick={onClose} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#94A3B8", padding: 4 }}><X size={18} /></button>
        </div>

        <div style={{ background: "#F8FAFC", borderRadius: 12, padding: "14px 16px", marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748B", marginBottom: 8 }}>
            <span>Policyholder</span><span style={{ fontWeight: 700, color: "#0F172A" }}>{policy.user?.name ?? "—"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748B", marginBottom: 8 }}>
            <span>Premium</span><span style={{ fontWeight: 700, color: "#059669" }}>₹{policy.premium.toLocaleString("en-IN")}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748B" }}>
            <span>Type</span><span style={{ fontWeight: 700, color: "#0F172A" }}>{policy.type.charAt(0).toUpperCase() + policy.type.slice(1)} Insurance</span>
          </div>
        </div>

        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 7 }}>
          Payment Reference / UTR <span style={{ fontWeight: 400, color: "#94A3B8" }}>(optional)</span>
        </label>
        <input
          value={ref}
          onChange={e => setRef(e.target.value)}
          placeholder="e.g. UTR123456789"
          style={{ width: "100%", padding: "10px 13px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 13, outline: "none", boxSizing: "border-box", color: "#0F172A", marginBottom: 16 }}
        />

        {err && <p style={{ fontSize: 12, color: "#DC2626", marginBottom: 12 }}>{err}</p>}

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "11px", background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 11, fontSize: 13, fontWeight: 700, color: "#0F172A", cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={submit} disabled={saving}
            style={{ flex: 2, padding: "11px", background: saving ? "#A7F3D0" : "#059669", border: "none", borderRadius: 11, fontSize: 13, fontWeight: 700, color: "#fff", cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, transition: "background 0.15s" }}>
            <CheckCircle2 size={14} /> {saving ? "Confirming…" : "Confirm Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Policy Drawer ──────────────────────────────────────────────────────────────

function PolicyDrawer({ policy, onClose, onRefresh }: {
  policy: AdminPolicy | null;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [tab, setTab]       = useState<"details" | "document">("details");
  const [editing, setEditing]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [saveErr, setSaveErr]     = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const [selectedFile, setFile]   = useState<File | null>(null);
  const [form, setForm]           = useState<Partial<AdminPolicy>>({});
  const [docForm, setDocForm]     = useState({ policyNumber: "", issueDate: "", expiryDate: "" });
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!policy) return;
    setForm({ ...policy });
    setTab("details");
    setEditing(false);
    setSaveErr(null);
    setUploadErr(null);
    setFile(null);
    setDocForm({
      policyNumber: policy.policyNumber ?? "",
      issueDate:    policy.startDate ? toInput(policy.startDate) : "",
      expiryDate:   policy.endDate   ? toInput(policy.endDate)   : "",
    });
  }, [policy]);

  if (!policy) return null;

  const type   = TYPE_META[policy.type] ?? { color: "#64748B", bg: "#F8FAFC", emoji: "📋", label: policy.type };
  const status = STATUS_META[policy.status] ?? STATUS_META.cancelled;
  const days   = daysLeft(policy.endDate);
  const expiring = policy.status === "active" && days > 0 && days <= 30;

  const inp: React.CSSProperties = {
    width: "100%", padding: "9px 12px", border: "1.5px solid #E2E8F0",
    borderRadius: 10, fontSize: 13, outline: "none", boxSizing: "border-box",
    color: "#0F172A", background: "#fff",
  };
  const label: React.CSSProperties = {
    display: "block", fontSize: 11, fontWeight: 700, color: "#94A3B8",
    textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6,
  };

  async function save() {
    if (!policy) return;
    setSaving(true); setSaveErr(null);
    try {
      await adminApi.updatePolicy(policy.id, {
        status:     form.status as AdminPolicy["status"],
        premium:    form.premium,
        sumInsured: form.sumInsured,
        startDate:  form.startDate,
        endDate:    form.endDate,
        notes:      form.notes,
      });
      setEditing(false);
      onRefresh();
    } catch (e) { setSaveErr(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  }

  async function uploadDoc() {
    if (!policy) return;
    setUploading(true); setUploadErr(null);
    try {
      await adminApi.uploadPolicyDocument(policy.id, {
        file:         selectedFile ?? undefined,
        policyNumber: docForm.policyNumber || undefined,
        issueDate:    docForm.issueDate  ? new Date(docForm.issueDate).toISOString()  : undefined,
        expiryDate:   docForm.expiryDate ? new Date(docForm.expiryDate).toISOString() : undefined,
      });
      setFile(null);
      onRefresh();
    } catch (e) { setUploadErr(e instanceof Error ? e.message : "Upload failed"); }
    finally { setUploading(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, pointerEvents: "auto" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,0.35)", backdropFilter: "blur(3px)" }} onClick={onClose} />

      <div className="side-drawer" style={{
        position: "fixed", right: 0, top: 0, bottom: 0, width: 480,
        background: "#fff", display: "flex", flexDirection: "column",
        boxShadow: "-24px 0 80px rgba(0,0,0,0.12)",
        zIndex: 201, animation: "drawerIn 0.28s cubic-bezier(0.32,0,0.08,1)",
      }}>

        {/* ── Drawer hero header ── */}
        <div style={{ background: type.color, padding: "22px 24px 20px", position: "relative", overflow: "hidden" }}>
          {/* decorative circle */}
          <div style={{ position: "absolute", right: -30, top: -30, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
          <div style={{ position: "absolute", right: 30, bottom: -40, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />

          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
                {type.emoji}
              </div>
              <div>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
                  {type.label} Insurance
                </p>
                <p style={{ fontSize: 18, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em", fontFamily: "monospace" }}>
                  {policy.policyNumber}
                </p>
              </div>
            </div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 10, padding: 8, cursor: "pointer", color: "#fff", display: "flex" }}>
              <X size={17} />
            </button>
          </div>

          {/* quick stats strip */}
          <div style={{ display: "flex", gap: 0, marginTop: 18, background: "rgba(255,255,255,0.12)", borderRadius: 12, overflow: "hidden" }}>
            {[
              { label: "Premium", value: `₹${policy.premium.toLocaleString("en-IN")}` },
              { label: "Cover",   value: fmt(policy.sumInsured) },
              { label: "Claims",  value: String(policy._count?.claims ?? 0) },
            ].map((s, i) => (
              <div key={s.label} style={{ flex: 1, padding: "10px 0", textAlign: "center", borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.15)" : "none" }}>
                <p style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>{s.value}</p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", marginTop: 2, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* status + expiring badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14 }}>
            <StatusBadge status={policy.status} size="md" />
            {expiring && (
              <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 100, background: "rgba(251,191,36,0.25)", color: "#FDE68A", border: "1px solid rgba(251,191,36,0.3)" }}>
                ⚠ Expires in {days}d
              </span>
            )}
            {policy.status === "active" && !expiring && days > 0 && (
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>{days} days remaining</span>
            )}
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div style={{ display: "flex", borderBottom: "1px solid #F1F5F9", padding: "0 24px" }}>
          {(["details", "document"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: "13px 0", marginRight: 24, fontSize: 13, fontWeight: tab === t ? 700 : 500, color: tab === t ? "#1580FF" : "#94A3B8", background: "none", border: "none", cursor: "pointer", borderBottom: tab === t ? "2.5px solid #1580FF" : "2.5px solid transparent", transition: "all 0.15s" }}>
              {t === "details" ? "Details" : "Document"}
              {t === "document" && policy.documentUrl && (
                <span style={{ marginLeft: 5, fontSize: 10, background: "#ECFDF5", color: "#059669", padding: "1px 5px", borderRadius: 100, fontWeight: 700 }}>✓</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "22px 24px" }}>

          {/* ── DETAILS TAB ── */}
          {tab === "details" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>

              {/* Policyholder */}
              <section>
                <p style={label}>Policyholder</p>
                <div style={{ background: "#F8FAFC", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: type.color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 15, fontWeight: 800, flexShrink: 0 }}>
                    {(policy.user?.name ?? "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>{policy.user?.name ?? "—"}</p>
                    <p style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>{policy.user?.phone ? `+91 ${policy.user.phone}` : "—"}</p>
                  </div>
                </div>
              </section>

              {/* Provider */}
              <section>
                <p style={label}>Insurance Provider</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{policy.provider}</p>
              </section>

              {/* Status */}
              <section>
                <p style={label}>Status</p>
                {editing ? (
                  <select value={form.status ?? policy.status}
                    onChange={e => setForm({ ...form, status: e.target.value as AdminPolicy["status"] })}
                    style={{ ...inp }}>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="expired">Expired</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                ) : <StatusBadge status={policy.status} size="md" />}
              </section>

              {/* Financial */}
              <section>
                <p style={label}>Financials</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div style={{ background: "#F8FAFC", borderRadius: 10, padding: "12px 14px" }}>
                    <p style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, marginBottom: 4 }}>Annual Premium</p>
                    {editing ? (
                      <input type="number" value={form.premium ?? ""} onChange={e => setForm({ ...form, premium: +e.target.value })} style={{ ...inp, padding: "7px 10px" }} />
                    ) : (
                      <p style={{ fontSize: 16, fontWeight: 800, color: "#059669" }}>₹{policy.premium.toLocaleString("en-IN")}</p>
                    )}
                  </div>
                  <div style={{ background: "#F8FAFC", borderRadius: 10, padding: "12px 14px" }}>
                    <p style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, marginBottom: 4 }}>Sum Insured</p>
                    {editing ? (
                      <input type="number" value={form.sumInsured ?? ""} onChange={e => setForm({ ...form, sumInsured: +e.target.value })} style={{ ...inp, padding: "7px 10px" }} />
                    ) : (
                      <p style={{ fontSize: 16, fontWeight: 800, color: "#0F172A" }}>{fmt(policy.sumInsured)}</p>
                    )}
                  </div>
                </div>
              </section>

              {/* Dates */}
              <section>
                <p style={label}>Coverage Period</p>
                <div style={{ position: "relative", paddingLeft: 20 }}>
                  {/* vertical line */}
                  <div style={{ position: "absolute", left: 6, top: 8, bottom: 8, width: 2, background: "#E2E8F0", borderRadius: 2 }} />
                  {[
                    { label: "Issue Date", val: policy.startDate, key: "startDate" as const, dotColor: "#1580FF" },
                    { label: "Expiry Date", val: policy.endDate,  key: "endDate"   as const, dotColor: days <= 0 ? "#DC2626" : days <= 30 ? "#D97706" : "#059669" },
                  ].map(row => (
                    <div key={row.key} style={{ marginBottom: 14, position: "relative" }}>
                      <div style={{ position: "absolute", left: -17, top: 3, width: 10, height: 10, borderRadius: "50%", background: row.dotColor, border: "2px solid #fff", boxShadow: `0 0 0 2px ${row.dotColor}40` }} />
                      <p style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>{row.label}</p>
                      {editing ? (
                        <input type="date" value={toInput(form[row.key] ?? row.val)}
                          onChange={e => setForm({ ...form, [row.key]: new Date(e.target.value).toISOString() })}
                          style={{ ...inp, padding: "7px 10px" }} />
                      ) : (
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{fmtDate(row.val)}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* Payment status */}
              <section>
                <p style={label}>Payment</p>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 100,
                    background: policy.paymentStatus === "paid" ? "#ECFDF5" : "#FFFBEB",
                    color:      policy.paymentStatus === "paid" ? "#059669" : "#D97706",
                    border: `1px solid ${policy.paymentStatus === "paid" ? "#A7F3D0" : "#FDE68A"}`,
                  }}>
                    {policy.paymentStatus.charAt(0).toUpperCase() + policy.paymentStatus.slice(1)}
                  </span>
                </div>
              </section>

              {/* Notes */}
              <section>
                <p style={label}>Internal Notes</p>
                {editing ? (
                  <textarea value={form.notes ?? ""} onChange={e => setForm({ ...form, notes: e.target.value })}
                    placeholder="Add notes visible to customer…"
                    style={{ ...inp, minHeight: 80, resize: "vertical", fontFamily: "inherit", lineHeight: 1.5 }} />
                ) : (
                  <p style={{ fontSize: 13, color: policy.notes ? "#0F172A" : "#94A3B8", lineHeight: 1.6 }}>
                    {policy.notes || "No notes"}
                  </p>
                )}
              </section>

              {/* Meta */}
              <section style={{ borderTop: "1px solid #F1F5F9", paddingTop: 16 }}>
                {[
                  { label: "Policy ID",  val: policy.id },
                  { label: "Created",    val: fmtDate(policy.createdAt) },
                  { label: "Last update", val: fmtDate(policy.updatedAt) },
                ].map(r => (
                  <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600 }}>{r.label}</span>
                    <span style={{ fontSize: 11, color: "#64748B", fontFamily: r.label === "Policy ID" ? "monospace" : "inherit", fontWeight: r.label === "Policy ID" ? 700 : 500 }}>{r.val}</span>
                  </div>
                ))}
              </section>

              {saveErr && <p style={{ fontSize: 12, color: "#DC2626" }}>{saveErr}</p>}
            </div>
          )}

          {/* ── DOCUMENT TAB ── */}
          {tab === "document" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Current document */}
              {policy.documentUrl ? (
                <div style={{ background: "#ECFDF5", border: "1.5px solid #A7F3D0", borderRadius: 14, padding: "16px 18px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "#D1FAE5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <FileText size={18} color="#059669" />
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 800, color: "#059669" }}>Document Uploaded</p>
                      <p style={{ fontSize: 11, color: "#6EE7B7", marginTop: 1 }}>Policy document is available to the customer</p>
                    </div>
                  </div>
                  <a href={policy.documentUrl} target="_blank" rel="noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#fff", border: "1px solid #A7F3D0", borderRadius: 8, fontSize: 12, fontWeight: 700, color: "#059669", textDecoration: "none" }}>
                    <ExternalLink size={12} /> Open Document
                  </a>
                </div>
              ) : (
                <div style={{ background: "#FFF7ED", border: "1.5px solid #FED7AA", borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                  <AlertCircle size={16} color="#EA580C" />
                  <p style={{ fontSize: 13, color: "#EA580C", fontWeight: 600 }}>No document uploaded yet</p>
                </div>
              )}

              {/* Upload form */}
              <div style={{ background: "#F8FAFC", borderRadius: 14, padding: "18px" }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: "#0F172A", marginBottom: 16 }}>
                  {policy.documentUrl ? "Replace Document" : "Upload Policy Document"}
                </p>

                {/* File drop zone */}
                <div onClick={() => fileRef.current?.click()}
                  style={{ border: `2px dashed ${selectedFile ? "#1580FF" : "#CBD5E1"}`, borderRadius: 12, padding: "20px 16px", cursor: "pointer", textAlign: "center", background: selectedFile ? "#EFF6FF" : "#fff", marginBottom: 16, transition: "all 0.15s" }}>
                  {selectedFile ? (
                    <div>
                      <div style={{ fontSize: 28, marginBottom: 6 }}>📄</div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#1580FF" }}>{selectedFile.name}</p>
                      <p style={{ fontSize: 11, color: "#64748B", marginTop: 3 }}>{(selectedFile.size / 1024).toFixed(0)} KB · Click to change</p>
                    </div>
                  ) : (
                    <div>
                      <Upload size={24} color="#94A3B8" style={{ marginBottom: 8 }} />
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>Click to upload PDF or document</p>
                      <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>PDF, JPG, PNG, DOC — max 50 MB</p>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" style={{ display: "none" }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) setFile(f); }} />

                {/* Metadata */}
                <div style={{ marginBottom: 12 }}>
                  <label style={label}>Policy Number</label>
                  <input value={docForm.policyNumber} onChange={e => setDocForm({ ...docForm, policyNumber: e.target.value })}
                    placeholder={policy.policyNumber} style={inp} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={label}>Issue Date</label>
                    <input type="date" value={docForm.issueDate} onChange={e => setDocForm({ ...docForm, issueDate: e.target.value })} style={inp} />
                  </div>
                  <div>
                    <label style={label}>Expiry Date</label>
                    <input type="date" value={docForm.expiryDate} onChange={e => setDocForm({ ...docForm, expiryDate: e.target.value })} style={inp} />
                  </div>
                </div>

                {uploadErr && <p style={{ fontSize: 12, color: "#DC2626", marginBottom: 10 }}>{uploadErr}</p>}

                <button onClick={uploadDoc} disabled={uploading}
                  style={{ width: "100%", padding: "11px", background: uploading ? "#93C5FD" : "#1580FF", border: "none", borderRadius: 11, color: "#fff", fontSize: 13, fontWeight: 700, cursor: uploading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, transition: "background 0.15s" }}>
                  <Upload size={14} /> {uploading ? "Uploading…" : "Save Document"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer actions ── */}
        <div style={{ padding: "14px 24px", borderTop: "1px solid #F1F5F9", display: "flex", gap: 10 }}>
          {tab === "details" && (editing ? (
            <>
              <button onClick={() => { setEditing(false); setSaveErr(null); setForm({ ...policy }); }} disabled={saving}
                style={{ flex: 1, padding: "11px", background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 11, fontSize: 13, fontWeight: 700, color: "#0F172A", cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={save} disabled={saving}
                style={{ flex: 2, padding: "11px", background: saving ? "#93C5FD" : "#1580FF", border: "none", borderRadius: 11, color: "#fff", fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Save size={13} /> {saving ? "Saving…" : "Save Changes"}
              </button>
            </>
          ) : (
            <button onClick={() => setEditing(true)}
              style={{ flex: 1, padding: "11px", background: "#1580FF", border: "none", borderRadius: 11, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              Edit Policy
            </button>
          ))}

          {tab === "document" && (
            <button onClick={onClose}
              style={{ flex: 1, padding: "11px", background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 11, fontSize: 13, fontWeight: 700, color: "#0F172A", cursor: "pointer" }}>
              Close
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes drawerIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @media (max-width: 768px) { .side-drawer { width: 100% !important; } }
      `}</style>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function PoliciesPage() {
  const [policies, setPolicies]   = useState<AdminPolicy[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [search, setSearch]       = useState("");
  const [statusF, setStatusF]     = useState("All");
  const [typeF, setTypeF]         = useState("All");
  const [selected, setSelected]   = useState<AdminPolicy | null>(null);
  const [confirming, setConfirming] = useState<AdminPolicy | null>(null);

  const load = useCallback(async (p = 1) => {
    setLoading(true); setError(null);
    try {
      const res = await adminApi.getPolicies(p, 50);
      setPolicies(res.policies);
      setTotal(res.total);
      setPage(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = policies.filter(p => {
    const ms = statusF === "All" || p.status === statusF;
    const mt = typeF   === "All" || p.type   === typeF;
    const q  = search.toLowerCase();
    return ms && mt && (!q || p.policyNumber.toLowerCase().includes(q) || (p.user?.name ?? "").toLowerCase().includes(q) || p.provider.toLowerCase().includes(q));
  });

  // stats derived from ALL loaded policies
  const stats = {
    total:     policies.length,
    active:    policies.filter(p => p.status === "active").length,
    pending:   policies.filter(p => p.status === "pending").length,
    premium:   policies.filter(p => p.status === "active").reduce((s, p) => s + p.premium, 0),
    expiring:  policies.filter(p => p.status === "active" && daysLeft(p.endDate) <= 30 && daysLeft(p.endDate) > 0).length,
  };

  const pages = Math.ceil(total / 50);

  return (
    <div style={{ width: "100%" }}>

      {/* ── Page header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "#0F172A", letterSpacing: "-0.04em" }}>Policies</h1>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 3 }}>
            {loading ? "Loading…" : `${total.toLocaleString()} total policies · ${fmt(stats.premium)} annual premium`}
          </p>
        </div>
        <button onClick={() => load(page)} disabled={loading}
          style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, color: "#0F172A", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          <RefreshCw size={14} style={{ animation: loading ? "spin 0.7s linear infinite" : "none", color: "#1580FF" }} />
          Refresh
        </button>
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display: "flex", gap: 14, marginBottom: 24, flexWrap: "wrap" }}>
        <StatCard icon={Shield}     label="Total"    value={total.toLocaleString()}          sub={`${stats.active} active`}         color="#1580FF" />
        <StatCard icon={Activity}   label="Active"   value={stats.active.toLocaleString()}   sub="Paid & covered"                   color="#059669" />
        <StatCard icon={Clock}      label="Pending"  value={stats.pending.toLocaleString()}  sub="Awaiting payment"                 color="#D97706" />
        <StatCard icon={TrendingUp} label="Premium"  value={fmt(stats.premium)}              sub="Active policies AUM"              color="#7C3AED" />
        <StatCard icon={Banknote}   label="Expiring" value={stats.expiring.toLocaleString()} sub="Within 30 days"                   color="#E11D48" />
      </div>

      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, color: "#DC2626", fontSize: 13, marginBottom: 16 }}>
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* ── Filters ── */}
      <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 14, padding: "14px 16px", marginBottom: 16 }}>
        {/* Search + type row */}
        <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 14px", border: "1.5px solid #E2E8F0", borderRadius: 10, background: "#F8FAFC", height: 40, flex: 1, minWidth: 220 }}>
            <Search size={14} color="#94A3B8" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by policy no., name, provider…"
              style={{ flex: 1, border: "none", outline: "none", fontSize: 13, color: "#0F172A", background: "transparent" }} />
            {search && (
              <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", display: "flex" }}><X size={13} /></button>
            )}
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <Filter size={13} color="#94A3B8" />
            {TYPE_FILTERS.map(t => {
              const m = TYPE_META[t];
              const active = typeF === t;
              return (
                <button key={t} onClick={() => setTypeF(t)}
                  style={{ padding: "6px 13px", borderRadius: 100, border: active ? "none" : "1.5px solid #E2E8F0", background: active ? (m ? m.color : "#0F172A") : "#fff", color: active ? "#fff" : "#64748B", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, transition: "all 0.12s" }}>
                  {m && <span style={{ fontSize: 12 }}>{m.emoji}</span>}
                  {t === "All" ? "All Types" : m?.label ?? t}
                </button>
              );
            })}
          </div>
        </div>

        {/* Status tabs */}
        <div style={{ display: "flex", gap: 0, borderTop: "1px solid #F1F5F9", paddingTop: 12 }}>
          {STATUS_TABS.map(({ key, label }) => {
            const count = key === "All" ? policies.length : policies.filter(p => p.status === key).length;
            const active = statusF === key;
            const sm = key !== "All" ? STATUS_META[key] : null;
            return (
              <button key={key} onClick={() => setStatusF(key)}
                style={{ padding: "7px 14px", marginRight: 4, borderRadius: 8, border: "none", background: active ? (sm ? sm.bg : "#0F172A") : "transparent", color: active ? (sm ? sm.color : "#fff") : "#64748B", fontSize: 12, fontWeight: active ? 700 : 500, cursor: "pointer", transition: "all 0.12s" }}>
                {label} {count > 0 && <span style={{ marginLeft: 4, fontSize: 10, opacity: 0.75 }}>({count})</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 860 }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #F1F5F9" }}>
                {["Policy", "Holder", "Provider", "Coverage", "Premium", "Expiry", "Doc", "Status"].map(h => (
                  <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 10, fontWeight: 800, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} style={{ borderTop: "1px solid #F8FAFC" }}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} style={{ padding: "14px 16px" }}>
                        <div style={{ height: 13, background: "#F1F5F9", borderRadius: 6, width: j === 0 ? "80%" : j === 1 ? "70%" : "60%", animation: "pulse 1.5s ease-in-out infinite" }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "64px 24px", textAlign: "center" }}>
                    <Search size={32} color="#E2E8F0" style={{ marginBottom: 12 }} />
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#94A3B8" }}>No policies match your filters</p>
                    <p style={{ fontSize: 12, color: "#CBD5E1", marginTop: 4 }}>Try adjusting the search or filters above</p>
                  </td>
                </tr>
              ) : filtered.map(p => {
                const type   = TYPE_META[p.type] ?? { color: "#64748B", bg: "#F8FAFC", emoji: "📋", label: p.type };
                const days   = daysLeft(p.endDate);
                const expiring = p.status === "active" && days > 0 && days <= 30;
                const expired  = days <= 0;

                return (
                  <tr key={p.id}
                    onClick={() => setSelected(p)}
                    style={{ borderTop: "1px solid #F8FAFC", cursor: "pointer", transition: "background 0.1s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#FAFBFF")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>

                    {/* Policy */}
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 9, background: type.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                          {type.emoji}
                        </div>
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 800, color: "#1580FF", fontFamily: "monospace", letterSpacing: "0.01em" }}>{p.policyNumber}</p>
                          <p style={{ fontSize: 10, color: type.color, fontWeight: 600, marginTop: 1 }}>{type.label}</p>
                        </div>
                      </div>
                    </td>

                    {/* Holder */}
                    <td style={{ padding: "14px 16px" }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{p.user?.name ?? "—"}</p>
                      <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 1 }}>{p.user?.phone ?? ""}</p>
                    </td>

                    {/* Provider */}
                    <td style={{ padding: "14px 16px", fontSize: 13, color: "#475569", fontWeight: 500 }}>{p.provider}</td>

                    {/* Coverage */}
                    <td style={{ padding: "14px 16px" }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{fmt(p.sumInsured)}</p>
                      <p style={{ fontSize: 10, color: "#94A3B8", marginTop: 1 }}>sum insured</p>
                    </td>

                    {/* Premium */}
                    <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                      <p style={{ fontSize: 13, fontWeight: 800, color: "#059669" }}>₹{p.premium.toLocaleString("en-IN")}</p>
                      <p style={{ fontSize: 10, color: "#94A3B8", marginTop: 1 }}>per year</p>
                    </td>

                    {/* Expiry */}
                    <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                      <p style={{ fontSize: 12, color: expired ? "#DC2626" : expiring ? "#D97706" : "#475569", fontWeight: expiring || expired ? 700 : 500 }}>
                        {fmtDate(p.endDate)}
                      </p>
                      {expiring && <p style={{ fontSize: 10, color: "#D97706", fontWeight: 700, marginTop: 2 }}>⚠ {days}d left</p>}
                      {expired && p.status === "active" && <p style={{ fontSize: 10, color: "#DC2626", fontWeight: 700, marginTop: 2 }}>Overdue</p>}
                    </td>

                    {/* Doc */}
                    <td style={{ padding: "14px 16px" }}>
                      {p.documentUrl ? (
                        <a href={p.documentUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                          style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: "#059669", textDecoration: "none", padding: "4px 9px", background: "#ECFDF5", borderRadius: 6, border: "1px solid #A7F3D0" }}>
                          <FileText size={11} /> PDF
                        </a>
                      ) : (
                        <span style={{ fontSize: 11, color: "#CBD5E1" }}>—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td style={{ padding: "14px 16px" }}>
                      <StatusBadge status={p.status} />
                      {p.paymentStatus === "pending" && p.status === "pending" && (
                        <button
                          onClick={e => { e.stopPropagation(); setConfirming(p); }}
                          style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", fontSize: 11, fontWeight: 700, color: "#fff", background: "#059669", border: "none", borderRadius: 6, cursor: "pointer", whiteSpace: "nowrap" }}>
                          <CheckCircle2 size={11} /> Confirm
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {pages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderTop: "1px solid #F1F5F9" }}>
            <span style={{ fontSize: 12, color: "#64748B" }}>
              Page {page} of {pages} · {total} policies
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button disabled={page === 1} onClick={() => load(page - 1)}
                style={{ display: "flex", alignItems: "center", gap: 4, padding: "7px 12px", borderRadius: 8, border: "1.5px solid #E2E8F0", background: "#fff", color: page === 1 ? "#CBD5E1" : "#0F172A", fontSize: 12, fontWeight: 600, cursor: page === 1 ? "not-allowed" : "pointer" }}>
                <ChevronLeft size={14} /> Prev
              </button>
              {Array.from({ length: Math.min(5, pages) }).map((_, i) => {
                const n = page <= 3 ? i + 1 : page - 2 + i;
                if (n < 1 || n > pages) return null;
                return (
                  <button key={n} onClick={() => load(n)}
                    style={{ width: 34, height: 34, borderRadius: 8, border: n === page ? "none" : "1.5px solid #E2E8F0", background: n === page ? "#1580FF" : "#fff", color: n === page ? "#fff" : "#0F172A", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    {n}
                  </button>
                );
              })}
              <button disabled={page >= pages} onClick={() => load(page + 1)}
                style={{ display: "flex", alignItems: "center", gap: 4, padding: "7px 12px", borderRadius: 8, border: "1.5px solid #E2E8F0", background: "#fff", color: page >= pages ? "#CBD5E1" : "#0F172A", fontSize: 12, fontWeight: 600, cursor: page >= pages ? "not-allowed" : "pointer" }}>
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Drawers & modals ── */}
      <PolicyDrawer
        policy={selected}
        onClose={() => setSelected(null)}
        onRefresh={() => { load(page); setSelected(null); }}
      />

      {confirming && (
        <ConfirmPaymentModal
          policy={confirming}
          onClose={() => setConfirming(null)}
          onDone={() => { setConfirming(null); load(page); }}
        />
      )}

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
