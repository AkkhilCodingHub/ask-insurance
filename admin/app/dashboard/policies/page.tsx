"use client";

import { useState, useEffect } from "react";
import { Search, Download, RefreshCw, X, Save } from "lucide-react";
import { adminApi, type AdminPolicy } from "@/lib/api";

const STATUS_OPTS = ["All", "pending", "active", "expired", "cancelled"];
const TYPE_OPTS = ["All", "life", "health", "motor", "travel", "home", "business"];

const TYPE_COLORS: Record<string, string> = {
  life: "#1580FF", health: "#059669", motor: "#D97706",
  travel: "#7C3AED", home: "#D97706", business: "#0891B2"
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    pending:   { bg: "#FFFBEB", color: "#D97706" },
    active:    { bg: "#ECFDF5", color: "#059669" },
    expired:   { bg: "#FEF2F2", color: "#DC2626" },
    cancelled: { bg: "var(--bg)", color: "var(--text-muted)" },
  };
  const s = map[status] ?? { bg: "var(--bg)", color: "var(--text-muted)" };
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 100, background: s.bg, color: s.color }}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function fmt(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(1)}L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

// ── Policy Details Drawer ──────────────────────────────────────────────────────
function PolicyDrawer({ policy, onClose }: { policy: AdminPolicy | null; onClose: () => void }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<AdminPolicy>>(policy || {});

  useEffect(() => {
    setForm(policy || {});
    setEditing(false);
  }, [policy]);

  async function handleSave() {
    if (!policy) return;
    setSaving(true);
    try {
      await adminApi.updatePolicy(policy.id, {
        status: form.status as any,
        premium: form.premium,
        sumInsured: form.sumInsured,
        startDate: form.startDate,
        endDate: form.endDate,
      });
      setEditing(false);
      onClose();
    } catch (e) {
      console.error("Failed to save:", e);
    } finally {
      setSaving(false);
    }
  }

  if (!policy) return null;

  const color = TYPE_COLORS[policy.type] ?? "#64748B";
  const dateToString = (date: string) => new Date(date).toISOString().split('T')[0];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", pointerEvents: policy ? "auto" : "none" }}>
      {/* Overlay */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,0.4)", backdropFilter: "blur(2px)" }} onClick={onClose} />

      {/* Drawer */}
      <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: 420, background: "#fff", boxShadow: "-20px 0 60px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column", zIndex: 201, animation: "slideIn 0.3s ease-out" }}>
        {/* Header */}
        <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>Policy Details</p>
            <p style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", fontFamily: "monospace" }}>{policy.policyNumber}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px", display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Type & Status */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 6 }}>Type</label>
              <span style={{ display: "inline-block", fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 100, background: color + "18", color }}>
                {policy.type.charAt(0).toUpperCase() + policy.type.slice(1)}
              </span>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 6 }}>Status</label>
              {editing ? (
                <select value={form.status ?? policy.status} onChange={e => setForm({ ...form, status: e.target.value as any })}
                  style={{ width: "100%", padding: "8px 10px", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }}>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              ) : (
                <StatusBadge status={policy.status} />
              )}
            </div>
          </div>

          {/* Policyholder */}
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 6 }}>Policyholder</label>
            <div style={{ padding: "10px 12px", background: "var(--bg)", borderRadius: 8 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>{policy.user?.name ?? "—"}</p>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{policy.user?.phone ? `+91 ${policy.user.phone}` : "—"}</p>
            </div>
          </div>

          {/* Provider & Premium */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 6 }}>Provider</label>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{policy.provider}</p>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 6 }}>Annual Premium</label>
              {editing ? (
                <input type="number" value={form.premium ?? policy.premium} onChange={e => setForm({ ...form, premium: parseInt(e.target.value) })}
                  style={{ width: "100%", padding: "8px 10px", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              ) : (
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>₹{policy.premium.toLocaleString("en-IN")}</p>
              )}
            </div>
          </div>

          {/* Sum Insured */}
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 6 }}>Sum Insured</label>
            {editing ? (
              <input type="number" value={form.sumInsured ?? policy.sumInsured} onChange={e => setForm({ ...form, sumInsured: parseInt(e.target.value) })}
                style={{ width: "100%", padding: "8px 10px", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            ) : (
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{fmt(policy.sumInsured)}</p>
            )}
          </div>

          {/* Dates */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 6 }}>Start Date</label>
              {editing ? (
                <input type="date" value={dateToString(form.startDate ?? policy.startDate)} onChange={e => setForm({ ...form, startDate: new Date(e.target.value).toISOString() })}
                  style={{ width: "100%", padding: "8px 10px", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              ) : (
                <p style={{ fontSize: 13, color: "var(--text)" }}>{new Date(policy.startDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
              )}
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 6 }}>End Date</label>
              {editing ? (
                <input type="date" value={dateToString(form.endDate ?? policy.endDate)} onChange={e => setForm({ ...form, endDate: new Date(e.target.value).toISOString() })}
                  style={{ width: "100%", padding: "8px 10px", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              ) : (
                <p style={{ fontSize: 13, color: "var(--text)" }}>{new Date(policy.endDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
              )}
            </div>
          </div>

          {/* Claims Count */}
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 6 }}>Associated Claims</label>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{policy._count?.claims ?? 0}</p>
          </div>

          {/* Metadata */}
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>
              <span>Created</span>
              <span>{new Date(policy.createdAt).toLocaleDateString()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)" }}>
              <span>Updated</span>
              <span>{new Date(policy.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 22px", borderTop: "1px solid var(--border)", display: "flex", gap: 10 }}>
          {editing ? (
            <>
              <button onClick={() => setEditing(false)} disabled={saving}
                style={{ flex: 1, padding: "10px", background: "var(--bg)", border: "1.5px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                style={{ flex: 1, padding: "10px", background: "var(--primary)", border: "none", borderRadius: 10, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Save size={14} /> {saving ? "Saving…" : "Save"}
              </button>
            </>
          ) : (
            <button onClick={() => setEditing(true)}
              style={{ width: "100%", padding: "10px", background: "var(--primary)", border: "none", borderRadius: 10, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              Edit Details
            </button>
          )}
        </div>

        <style>{`
          @keyframes slideIn {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        `}</style>
      </div>
    </div>
  );
}

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<AdminPolicy[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState("All");
  const [typeF, setTypeF] = useState("All");
  const [selected, setSelected] = useState<AdminPolicy | null>(null);

  async function load(p = 1) {
    setLoading(true);
    setError(null);
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
  }

  useEffect(() => { load(); }, []);

  const filtered = policies.filter(p => {
    const ms = statusF === "All" || p.status === statusF;
    const mt = typeF === "All" || p.type === typeF;
    const q = search.toLowerCase();
    return ms && mt && (!q ||
      p.policyNumber.toLowerCase().includes(q) ||
      (p.user?.name ?? "").toLowerCase().includes(q) ||
      p.provider.toLowerCase().includes(q)
    );
  });

  const totalPremium = filtered.filter(p => p.status === "active").reduce((s, p) => s + p.premium, 0);

  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 2 }}>Policies</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
            {loading ? "Loading…" : `${total} total · ${fmt(totalPremium)} active premium`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => load(page)}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 14px", background: "var(--bg)", border: "1.5px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", background: "var(--primary)", border: "none", borderRadius: 10, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <Download size={15} /> Export
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 10, color: "#DC2626", fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 14px", border: "1.5px solid var(--border)", borderRadius: 10, background: "#fff", height: 40, flex: 1, minWidth: 200 }}>
          <Search size={15} color="var(--text-muted)" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Policy no., policyholder, insurer…"
            style={{ flex: 1, border: "none", outline: "none", fontSize: 13, color: "var(--text)", background: "transparent" }} />
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {STATUS_OPTS.map(s => (
            <button key={s} onClick={() => setStatusF(s)}
              style={{ padding: "7px 14px", borderRadius: 8, border: statusF === s ? "none" : "1.5px solid var(--border)", background: statusF === s ? "var(--primary)" : "#fff", color: statusF === s ? "#fff" : "var(--text-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              {s === "All" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {TYPE_OPTS.map(t => (
          <button key={t} onClick={() => setTypeF(t)}
            style={{ padding: "5px 14px", borderRadius: 100, border: typeF === t ? "none" : "1.5px solid var(--border)", background: typeF === t ? "#0F172A" : "#fff", color: typeF === t ? "#fff" : "var(--text-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            {t === "All" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
          <thead>
            <tr style={{ background: "var(--bg)" }}>
              {["Policy No.", "Policyholder", "Provider", "Type", "Premium", "Cover", "End Date", "Status"].map(h => (
                <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-muted)" }}>Loading policies…</td></tr>
            ) : filtered.map(p => {
              const color = TYPE_COLORS[p.type] ?? "#64748B";
              return (
                <tr key={p.id} style={{ borderTop: "1px solid var(--border)", transition: "background 0.12s", cursor: "pointer" }}
                  onClick={() => setSelected(p)}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--bg)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", fontFamily: "monospace" }}>{p.policyNumber}</span>
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{p.user?.name ?? "—"}</p>
                    <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{p.user?.phone ? `+91 ${p.user.phone}` : ""}</p>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 13, color: "var(--text-muted)" }}>{p.provider}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 100, background: color + "18", color }}>
                      {p.type.charAt(0).toUpperCase() + p.type.slice(1)}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 700, color: "var(--text)", whiteSpace: "nowrap" }}>
                    ₹{p.premium.toLocaleString("en-IN")}/yr
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 13, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                    {fmt(p.sumInsured)}
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                    {new Date(p.endDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <StatusBadge status={p.status} />
                    {p.paymentStatus === "pending" && p.status === "pending" && (
                      <button
                        onClick={async () => {
                          const docUrl = prompt("Policy document URL (optional):", "");
                          const ref    = prompt("Payment reference / UTR (optional):", "");
                          try {
                            await adminApi.confirmPayment(p.id, { documentUrl: docUrl || undefined, providerRef: ref || undefined });
                            load(page);
                          } catch (e) {
                            alert(e instanceof Error ? e.message : "Failed");
                          }
                        }}
                        style={{ marginTop: 6, display: "block", padding: "5px 10px", fontSize: 11, fontWeight: 700, color: "#fff", background: "#059669", border: "none", borderRadius: 6, cursor: "pointer" }}>
                        ✓ Confirm Payment
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-muted)" }}>
            <Search size={36} color="var(--border)" style={{ marginBottom: 10 }} />
            <p style={{ fontWeight: 600 }}>No policies match your filters</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > 50 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
          <button disabled={page === 1} onClick={() => load(page - 1)}
            style={{ padding: "8px 16px", borderRadius: 8, border: "1.5px solid var(--border)", background: "#fff", color: "var(--text)", fontSize: 13, cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.5 : 1 }}>
            Prev
          </button>
          <span style={{ padding: "8px 16px", fontSize: 13, color: "var(--text-muted)" }}>
            Page {page} of {Math.ceil(total / 50)}
          </span>
          <button disabled={page >= Math.ceil(total / 50)} onClick={() => load(page + 1)}
            style={{ padding: "8px 16px", borderRadius: 8, border: "1.5px solid var(--border)", background: "#fff", color: "var(--text)", fontSize: 13, cursor: page >= Math.ceil(total / 50) ? "not-allowed" : "pointer", opacity: page >= Math.ceil(total / 50) ? 0.5 : 1 }}>
            Next
          </button>
        </div>
      )}

      <PolicyDrawer policy={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
