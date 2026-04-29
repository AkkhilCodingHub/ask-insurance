"use client";

import { useState, useEffect } from "react";
import { Search, X, FileText, User, Calendar, IndianRupee, RefreshCw } from "lucide-react";
import { adminApi, type AdminClaim } from "@/lib/api";

const STATUS_OPTS = ["All", "pending", "approved", "rejected", "paid", "settled"] as const;
type ClaimStatus = "pending" | "approved" | "rejected" | "paid" | "settled";

const STATUS_META: Record<ClaimStatus, { bg: string; color: string; border: string; label: string }> = {
  pending:  { bg: "#FFFBEB", color: "#D97706", border: "#FDE68A",  label: "Pending" },
  approved: { bg: "#ECFDF5", color: "#059669", border: "#A7F3D0",  label: "Approved" },
  rejected: { bg: "#FEF2F2", color: "#DC2626", border: "#FCA5A5",  label: "Rejected" },
  paid:     { bg: "#EEF2FF", color: "#4F46E5", border: "#C7D2FE",  label: "Paid" },
  settled:  { bg: "#F0FDF4", color: "#047857", border: "#6EE7B7",  label: "Settled" },
};

const STATUS_DRAWER_ORDER: ClaimStatus[] = ["pending", "approved", "rejected", "paid", "settled"];

function isClaimStatus(s: string): s is ClaimStatus {
  return (STATUS_DRAWER_ORDER as string[]).includes(s);
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_META[status as ClaimStatus] ?? { bg: "var(--bg)", color: "var(--text-muted)", label: status };
  return <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 100, background: s.bg, color: s.color }}>{s.label}</span>;
}

function ClaimDrawer({ claim, onClose, onUpdate }: {
  claim: AdminClaim;
  onClose: () => void;
  onUpdate: (id: string, status: ClaimStatus) => Promise<void>;
}) {
  const [status, setStatus] = useState<ClaimStatus>(isClaimStatus(claim.status) ? claim.status : "pending");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onUpdate(claim.id, status);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  const sm = STATUS_META[status] ?? STATUS_META.pending;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex" }}>
      <div style={{ flex: 1, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(2px)" }} onClick={onClose} />
      <div className="side-drawer" style={{ width: 500, background: "#fff", height: "100%", overflowY: "auto", display: "flex", flexDirection: "column", boxShadow: "-8px 0 32px rgba(0,0,0,0.15)" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "#fff", zIndex: 10 }}>
          <div>
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>Claim ID</p>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", fontFamily: "monospace" }}>{claim.id.slice(0, 16)}…</h3>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}>
            <X size={20} />
          </button>
        </div>

        {/* Claimant info */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", background: sm.bg + "60" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 46, height: 46, borderRadius: "50%", background: sm.bg, display: "flex", alignItems: "center", justifyContent: "center", border: `1.5px solid ${sm.border}` }}>
              <User size={20} color={sm.color} />
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 800, color: "var(--text)" }}>{claim.user?.name ?? "Unknown"}</p>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{claim.user?.phone ? `+91 ${claim.user.phone}` : ""}</p>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { icon: FileText,    label: "Policy No.",    value: claim.policy?.policyNumber ?? claim.policyId.slice(0, 8) },
              { icon: FileText,    label: "Type",          value: claim.policy?.type ? claim.policy.type.charAt(0).toUpperCase() + claim.policy.type.slice(1) : "—" },
              { icon: FileText,    label: "Provider",      value: claim.policy?.provider ?? "—" },
              { icon: IndianRupee, label: "Claim Amount",  value: `₹${claim.amount.toLocaleString("en-IN")}` },
              { icon: Calendar,    label: "Incident Date", value: new Date(claim.incidentDate).toLocaleDateString("en-IN") },
              { icon: Calendar,    label: "Filed",         value: new Date(claim.createdAt).toLocaleDateString("en-IN") },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <Icon size={13} color="var(--text-muted)" style={{ marginTop: 2 }} />
                <div>
                  <p style={{ fontSize: 10, color: "var(--text-muted)" }}>{label}</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Description */}
        {claim.description && (
          <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)" }}>
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Description</p>
            <p style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.6 }}>{claim.description}</p>
          </div>
        )}

        {/* Notes */}
        {claim.notes && (
          <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)" }}>
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Notes</p>
            <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6 }}>{claim.notes}</p>
          </div>
        )}

        {/* Status update */}
        <div style={{ padding: "20px 24px", flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 16 }}>Update Status</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
            {STATUS_DRAWER_ORDER.map(s => {
              const m = STATUS_META[s];
              return (
                <button key={s} onClick={() => setStatus(s)}
                  style={{ flex: "1 1 calc(33.33% - 6px)", minWidth: 120, padding: "10px 4px", border: status === s ? `2px solid ${m.color}` : "1.5px solid var(--border)", borderRadius: 8, background: status === s ? m.bg : "#fff", color: status === s ? m.color : "var(--text-muted)", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.15s" }}>
                  {m.label}
                </button>
              );
            })}
          </div>

          <button onClick={handleSave} disabled={saving || status === claim.status}
            style={{ width: "100%", padding: "12px", background: saved ? "#059669" : status === claim.status ? "var(--bg)" : "var(--primary)", border: "none", borderRadius: 10, color: status === claim.status ? "var(--text-muted)" : "#fff", fontSize: 14, fontWeight: 700, cursor: saving || status === claim.status ? "not-allowed" : "pointer", transition: "background 0.2s" }}>
            {saving ? "Saving…" : saved ? "✓ Saved" : "Save Changes"}
          </button>
        </div>
      </div>
      <style>{`@media (max-width: 768px) { .side-drawer { width: 100% !important; } }`}</style>
    </div>
  );
}

export default function ClaimsPage() {
  const [claims, setClaims] = useState<AdminClaim[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState<typeof STATUS_OPTS[number]>("All");
  const [selected, setSelected] = useState<AdminClaim | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getClaims(1, 100);
      setClaims(res.claims);
      setTotal(res.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleUpdate(id: string, status: ClaimStatus) {
    const updated = await adminApi.updateClaimStatus(id, status);
    setClaims(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
    setSelected(prev => prev?.id === id ? { ...prev, ...updated } : prev);
  }

  const filtered = claims.filter(c => {
    const ms = statusF === "All" || c.status === statusF;
    const q = search.toLowerCase();
    return ms && (!q ||
      (c.user?.name ?? "").toLowerCase().includes(q) ||
      (c.policy?.policyNumber ?? "").toLowerCase().includes(q) ||
      (c.policy?.provider ?? "").toLowerCase().includes(q) ||
      (c.description ?? "").toLowerCase().includes(q)
    );
  });

  const pendingAmt = filtered.filter(c => c.status === "pending").reduce((s, c) => s + c.amount, 0);

  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 2 }}>Claims</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
            {loading ? "Loading…" : `${total} total · ₹${(pendingAmt / 100000).toFixed(2)}L pending`}
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

      {/* Status tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {STATUS_OPTS.map(s => {
          const count = s === "All" ? claims.length : claims.filter(c => c.status === s).length;
          const active = statusF === s;
          return (
            <button key={s} onClick={() => setStatusF(s)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: active ? "none" : "1.5px solid var(--border)", background: active ? "var(--primary)" : "#fff", color: active ? "#fff" : "var(--text-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              {s === "All" ? "All" : (STATUS_META[s as ClaimStatus]?.label ?? s)}
              <span style={{ fontSize: 10, fontWeight: 800, background: active ? "rgba(255,255,255,0.25)" : "var(--bg)", padding: "1px 6px", borderRadius: 100 }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 14px", border: "1.5px solid var(--border)", borderRadius: 10, background: "#fff", marginBottom: 16, height: 42 }}>
        <Search size={15} color="var(--text-muted)" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by claimant, policy no., provider…"
          style={{ flex: 1, border: "none", outline: "none", fontSize: 13, color: "var(--text)", background: "transparent" }} />
      </div>

      {/* Table */}
      <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
          <thead>
            <tr style={{ background: "var(--bg)" }}>
              {["Claimant", "Policy", "Provider / Type", "Amount", "Incident Date", "Filed", "Status", ""].map(h => (
                <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-muted)" }}>Loading claims…</td></tr>
            ) : filtered.map(c => (
              <tr key={c.id} style={{ borderTop: "1px solid var(--border)", transition: "background 0.12s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--bg)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                <td style={{ padding: "14px 16px" }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{c.user?.name ?? "—"}</p>
                  <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{c.user?.phone ? `+91 ${c.user.phone}` : ""}</p>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", fontFamily: "monospace" }}>
                    {c.policy?.policyNumber ?? c.policyId.slice(0, 12)}
                  </span>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <p style={{ fontSize: 13, color: "var(--text)" }}>{c.policy?.provider ?? "—"}</p>
                  <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{c.policy?.type ? c.policy.type.charAt(0).toUpperCase() + c.policy.type.slice(1) : ""}</p>
                </td>
                <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 700, color: "var(--text)", whiteSpace: "nowrap" }}>
                  ₹{c.amount.toLocaleString("en-IN")}
                </td>
                <td style={{ padding: "14px 16px", fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                  {new Date(c.incidentDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </td>
                <td style={{ padding: "14px 16px", fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                  {new Date(c.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </td>
                <td style={{ padding: "14px 16px" }}><StatusBadge status={c.status} /></td>
                <td style={{ padding: "14px 16px" }}>
                  <button onClick={() => setSelected(c)}
                    style={{ padding: "6px 14px", background: "var(--primary-light)", border: "none", borderRadius: 7, color: "var(--primary)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-muted)" }}>
            <p style={{ fontWeight: 600 }}>No claims found</p>
          </div>
        )}
      </div>

      {selected && <ClaimDrawer claim={selected} onClose={() => setSelected(null)} onUpdate={handleUpdate} />}
    </div>
  );
}
