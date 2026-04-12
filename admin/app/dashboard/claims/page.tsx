"use client";

import { useState } from "react";
import { Search, X, FileText, User, Calendar, IndianRupee, MessageSquare } from "lucide-react";
import { CLAIMS, type AdminClaim } from "@/lib/mock";

const STATUSES = ["All", "Submitted", "Under Review", "Approved", "Settled", "Rejected"] as const;
type ClaimStatus = "Submitted" | "Under Review" | "Approved" | "Settled" | "Rejected";

const STATUS_META: Record<ClaimStatus, { bg: string; color: string; border: string }> = {
  "Submitted":    { bg: "#E0F7FF", color: "#0891B2", border: "#BAE6FD" },
  "Under Review": { bg: "#FFFBEB", color: "#D97706", border: "#FDE68A" },
  "Approved":     { bg: "#ECFDF5", color: "#059669", border: "#A7F3D0" },
  "Settled":      { bg: "#F5F3FF", color: "#7C3AED", border: "#DDD6FE" },
  "Rejected":     { bg: "#FEF2F2", color: "#DC2626", border: "#FCA5A5" },
};

function StatusBadge({ status }: { status: ClaimStatus }) {
  const s = STATUS_META[status];
  return <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 100, background: s.bg, color: s.color }}>{status}</span>;
}

const ADJUSTERS = ["Unassigned", "Priya Sharma", "Rahul Verma"];

function ClaimDrawer({ claim, onClose, onUpdate }: { claim: AdminClaim; onClose: () => void; onUpdate: (id: string, status: ClaimStatus, adjuster: string, notes: string) => void }) {
  const [status, setStatus] = useState<ClaimStatus>(claim.status as ClaimStatus);
  const [adjuster, setAdjuster] = useState(claim.adjuster);
  const [notes, setNotes] = useState(claim.notes);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    onUpdate(claim.id, status, adjuster, notes);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const sm = STATUS_META[status];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex" }}>
      <div style={{ flex: 1, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(2px)" }} onClick={onClose} />
      <div style={{ width: 520, background: "#fff", height: "100%", overflowY: "auto", display: "flex", flexDirection: "column", boxShadow: "-8px 0 32px rgba(0,0,0,0.15)" }}>
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "#fff", zIndex: 10 }}>
          <div>
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>Claim Reference</p>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>{claim.claimNo}</h3>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}>
            <X size={20} />
          </button>
        </div>

        {/* Claimant info */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", background: claim.color + "08" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 46, height: 46, borderRadius: "50%", background: claim.color + "20", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <User size={20} color={claim.color} />
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 800, color: "var(--text)" }}>{claim.userName}</p>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>+91 {claim.userPhone}</p>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { icon: FileText,      label: "Plan",        value: claim.planName },
              { icon: FileText,      label: "Insurer",     value: claim.insurer },
              { icon: IndianRupee,   label: "Claim Amount",value: `₹${claim.amount.toLocaleString("en-IN")}` },
              { icon: Calendar,      label: "Filed On",    value: claim.filedDate },
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
        <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)" }}>
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Claim Description</p>
          <p style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.6 }}>{claim.description}</p>
        </div>

        {/* Documents */}
        <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)" }}>
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Documents ({claim.documents.length})</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {claim.documents.map(doc => (
              <span key={doc} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 100, fontSize: 12, color: "var(--text)" }}>
                <FileText size={12} color="var(--text-muted)" /> {doc}
              </span>
            ))}
          </div>
        </div>

        {/* Admin controls */}
        <div style={{ padding: "20px 24px", flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 16 }}>Update Claim</p>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>Status</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
              {(["Submitted", "Under Review", "Approved", "Settled", "Rejected"] as ClaimStatus[]).map(s => {
                const m = STATUS_META[s];
                return (
                  <button key={s} onClick={() => setStatus(s)}
                    style={{ padding: "8px 4px", border: status === s ? `2px solid ${m.color}` : "1.5px solid var(--border)", borderRadius: 8, background: status === s ? m.bg : "#fff", color: status === s ? m.color : "var(--text-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}>
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>Assign Adjuster</label>
            <select value={adjuster} onChange={e => setAdjuster(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 13, color: "var(--text)", background: "#fff", outline: "none" }}>
              {ADJUSTERS.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>Adjuster Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4}
              style={{ width: "100%", padding: "10px 12px", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 13, color: "var(--text)", background: "#fff", outline: "none", resize: "vertical", lineHeight: 1.5 }}
              placeholder="Add notes about this claim…" />
          </div>

          <button onClick={handleSave}
            style={{ width: "100%", padding: "12px", background: saved ? "#059669" : "var(--primary)", border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "background 0.2s" }}>
            {saved ? "✓ Saved" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ClaimsPage() {
  const [claims, setClaims] = useState<AdminClaim[]>(CLAIMS);
  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState<typeof STATUSES[number]>("All");
  const [selected, setSelected] = useState<AdminClaim | null>(null);

  function handleUpdate(id: string, status: ClaimStatus, adjuster: string, notes: string) {
    setClaims(prev => prev.map(c => c.id === id ? { ...c, status, adjuster, notes } : c));
    setSelected(prev => prev?.id === id ? { ...prev, status, adjuster, notes } : prev);
  }

  const filtered = claims.filter(c => {
    const ms = statusF === "All" || c.status === statusF;
    const q = search.toLowerCase();
    return ms && (!q || c.userName.toLowerCase().includes(q) || c.claimNo.toLowerCase().includes(q) || c.insurer.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
  });

  const totalPending = filtered.filter(c => c.status === "Submitted" || c.status === "Under Review").reduce((s, c) => s + c.amount, 0);

  return (
    <div style={{ width: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 2 }}>Claims</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{filtered.length} claims · ₹{(totalPending / 100000).toFixed(2)}L pending</p>
        </div>
      </div>

      {/* Status filter tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {STATUSES.map(s => {
          const count = s === "All" ? claims.length : claims.filter(c => c.status === s).length;
          const active = statusF === s;
          return (
            <button key={s} onClick={() => setStatusF(s)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: active ? "none" : "1.5px solid var(--border)", background: active ? "var(--primary)" : "#fff", color: active ? "#fff" : "var(--text-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              {s}
              <span style={{ fontSize: 10, fontWeight: 800, background: active ? "rgba(255,255,255,0.25)" : "var(--bg)", padding: "1px 6px", borderRadius: 100 }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 14px", border: "1.5px solid var(--border)", borderRadius: 10, background: "#fff", marginBottom: 16, height: 42 }}>
        <Search size={15} color="var(--text-muted)" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by claimant, claim no., insurer…"
          style={{ flex: 1, border: "none", outline: "none", fontSize: 13, color: "var(--text)", background: "transparent" }} />
      </div>

      {/* Claims table */}
      <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
          <thead>
            <tr style={{ background: "var(--bg)" }}>
              {["Claim No.", "Claimant", "Description", "Insurer", "Amount", "Filed", "Adjuster", "Status", ""].map(h => (
                <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => {
              const sm = STATUS_META[c.status as ClaimStatus];
              return (
                <tr key={c.id} style={{ borderTop: "1px solid var(--border)", transition: "background 0.12s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--bg)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", fontFamily: "monospace" }}>{c.claimNo}</span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{c.userName}</p>
                    <p style={{ fontSize: 11, color: "var(--text-muted)" }}>+91 {c.userPhone}</p>
                  </td>
                  <td style={{ padding: "14px 16px", maxWidth: 200 }}>
                    <p style={{ fontSize: 13, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.description}</p>
                    <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{c.category}</p>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 13, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{c.insurer}</td>
                  <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 700, color: "var(--text)", whiteSpace: "nowrap" }}>₹{c.amount.toLocaleString("en-IN")}</td>
                  <td style={{ padding: "14px 16px", fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{c.filedDate}</td>
                  <td style={{ padding: "14px 16px", fontSize: 12, color: c.adjuster === "Unassigned" ? "#D97706" : "var(--text-muted)", whiteSpace: "nowrap" }}>{c.adjuster}</td>
                  <td style={{ padding: "14px 16px" }}><StatusBadge status={c.status as ClaimStatus} /></td>
                  <td style={{ padding: "14px 16px" }}>
                    <button onClick={() => setSelected(c)}
                      style={{ padding: "6px 14px", background: "var(--primary-light)", border: "none", borderRadius: 7, color: "var(--primary)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      Review
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-muted)" }}>
            <p style={{ fontWeight: 600 }}>No claims found</p>
          </div>
        )}
      </div>

      {selected && <ClaimDrawer claim={selected} onClose={() => setSelected(null)} onUpdate={handleUpdate} />}
    </div>
  );
}
