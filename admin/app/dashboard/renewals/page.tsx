"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { RefreshCcw, Zap, RefreshCw, UserCog, AlertTriangle, CheckCircle2, X, Phone } from "lucide-react";

type RenewalStatus = "pending" | "contacted" | "closed" | "lost";

interface Renewal {
  id: string;
  status: RenewalStatus;
  notes: string | null;
  assignedAt: string | null;
  createdAt: string;
  policy: {
    policyNumber: string;
    type: string;
    endDate: string;
    premium: number;
    user: { id: string; name: string; phone: string };
    insurer?: { name: string };
  };
  agent?: { id: string; name: string; email: string } | null;
}

interface Agent {
  id: string;
  name: string;
  email: string;
}

const STATUS_COLUMNS: { key: RenewalStatus; label: string; color: string; bg: string; icon: React.ReactNode }[] = [
  { key: "pending",   label: "Pending",   color: "#D97706", bg: "#FFFBEB", icon: <AlertTriangle size={14} /> },
  { key: "contacted", label: "Contacted", color: "#1D4ED8", bg: "#EFF6FF", icon: <Phone size={14} /> },
  { key: "closed",    label: "Closed",    color: "#059669", bg: "#ECFDF5", icon: <CheckCircle2 size={14} /> },
  { key: "lost",      label: "Lost",      color: "#DC2626", bg: "#FEF2F2", icon: <X size={14} /> },
];

export default function RenewalsPage() {
  const [renewals, setRenewals] = useState<Renewal[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [selected, setSelected] = useState<Renewal | null>(null);
  const [editStatus, setEditStatus] = useState<RenewalStatus>("pending");
  const [editAgent, setEditAgent] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true); setError("");
    try {
      const data = await (adminApi as any).getRenewals();
      setRenewals(data.renewals || []);
      const agData = await (adminApi as any).getAdminList?.() ?? { admins: [] };
      setAgents(agData.admins?.filter((a: any) => a.role === "admin") || []);
    } catch (e: any) { setError(e?.message || "Failed to load renewals."); }
    finally { setLoading(false); }
  }

  async function autoDetect() {
    setDetecting(true);
    try {
      const result = await (adminApi as any).autoDetectRenewals();
      alert(`Detected ${result.detectedCount} expiring policies. Created ${result.createdCount} new renewal leads.`);
      load();
    } catch (e: any) { alert(e?.message || "Failed."); }
    finally { setDetecting(false); }
  }

  async function saveEdit() {
    if (!selected) return;
    setSaving(true);
    try {
      await (adminApi as any).updateRenewal(selected.id, { status: editStatus, agentId: editAgent || null, notes: editNotes || null });
      setSelected(null); load();
    } catch (e: any) { alert(e?.message || "Failed."); }
    finally { setSaving(false); }
  }

  function openEdit(r: Renewal) { setSelected(r); setEditStatus(r.status); setEditAgent(r.agent?.id || ""); setEditNotes(r.notes || ""); }

  useEffect(() => { load(); }, []);

  function daysLeft(endDate: string) {
    return Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }

  return (
    <div style={{ padding: 24, minHeight: "100vh", background: "var(--bg)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(5, 150, 105, 0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <RefreshCcw size={20} color="#059669" />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: "var(--text)", margin: 0, letterSpacing: -0.5 }}>Renewals Pipeline</h1>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: 13, margin: 0 }}>Track and manage policies nearing expiry.</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={autoDetect} disabled={detecting}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", background: "#059669", border: "none", borderRadius: 10, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: detecting ? 0.7 : 1 }}>
            <Zap size={14} /> {detecting ? "Detecting…" : "Auto Detect"}
          </button>
          <button onClick={load}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", background: "var(--white)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {error && <div style={{ padding: "12px 16px", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 10, color: "#DC2626", fontSize: 13, marginBottom: 20 }}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
        {STATUS_COLUMNS.map(col => {
          const count = renewals.filter(r => r.status === col.key).length;
          return (
            <div key={col.key} style={{ background: "var(--white)", borderRadius: 14, padding: "16px 18px", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: col.bg, display: "flex", alignItems: "center", justifyContent: "center", color: col.color }}>{col.icon}</div>
              <div>
                <p style={{ fontSize: 20, fontWeight: 900, color: "var(--text)", margin: 0 }}>{count}</p>
                <p style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: 0.6 }}>{col.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #059669", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, alignItems: "start" }}>
          {STATUS_COLUMNS.map(col => {
            const colRenewals = renewals.filter(r => r.status === col.key);
            return (
              <div key={col.key}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, padding: "8px 12px", background: col.bg, borderRadius: 10, border: `1px solid ${col.color}33` }}>
                  <span style={{ color: col.color }}>{col.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: col.color }}>{col.label}</span>
                  <span style={{ marginLeft: "auto", background: col.color, color: "#fff", fontSize: 10, fontWeight: 800, padding: "1px 7px", borderRadius: 100 }}>{colRenewals.length}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {colRenewals.length === 0 && (
                    <div style={{ padding: "30px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: 13, background: "var(--white)", borderRadius: 12, border: "1px dashed var(--border)" }}>No renewals</div>
                  )}
                  {colRenewals.map(r => {
                    const days = daysLeft(r.policy.endDate);
                    const urgent = days <= 7;
                    return (
                      <div key={r.id} onClick={() => openEdit(r)}
                        style={{ background: "var(--white)", borderRadius: 14, padding: "14px 16px", border: `1px solid ${urgent ? "#FCA5A5" : "var(--border)"}`, cursor: "pointer", transition: "box-shadow 0.15s" }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 14px rgba(0,0,0,0.07)"}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = "none"}>
                        <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>{r.policy.type}</span>
                          <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 800, color: urgent ? "#DC2626" : "#D97706", background: urgent ? "#FEF2F2" : "#FFFBEB", padding: "2px 7px", borderRadius: 100 }}>{days}d left</span>
                        </div>
                        <p style={{ fontSize: 12, fontWeight: 800, color: "var(--text)", margin: "0 0 3px" }}>{r.policy.user.name}</p>
                        <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 3px" }}>{r.policy.policyNumber}</p>
                        <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>{r.policy.insurer?.name || "—"} · ₹{r.policy.premium?.toLocaleString("en-IN")}</p>
                        {r.agent && (
                          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--border)" }}>
                            <UserCog size={11} color="var(--text-muted)" />
                            <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{r.agent.name}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "var(--white)", borderRadius: 18, width: "100%", maxWidth: 500, padding: 24, border: "1px solid var(--border)", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: "var(--text)", margin: 0 }}>Update Renewal</h3>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={18} /></button>
            </div>
            <div style={{ background: "var(--bg)", borderRadius: 10, padding: "12px 14px", marginBottom: 18 }}>
              <p style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", margin: "0 0 4px" }}>{selected.policy.user.name}</p>
              <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 2px" }}>{selected.policy.policyNumber} · {selected.policy.type}</p>
              <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>Expires: {new Date(selected.policy.endDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", display: "block", marginBottom: 6 }}>Status</label>
                <select value={editStatus} onChange={e => setEditStatus(e.target.value as RenewalStatus)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 13, outline: "none", background: "var(--bg)", color: "var(--text)" }}>
                  {STATUS_COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", display: "block", marginBottom: 6 }}>Assign Agent</label>
                <select value={editAgent} onChange={e => setEditAgent(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 13, outline: "none", background: "var(--bg)", color: "var(--text)" }}>
                  <option value="">— Unassigned —</option>
                  {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", display: "block", marginBottom: 6 }}>Notes</label>
                <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={3} placeholder="Optional notes…"
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 13, outline: "none", background: "var(--bg)", color: "var(--text)", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => setSelected(null)}
                style={{ flex: 1, padding: "10px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", color: "var(--text-muted)" }}>
                Cancel
              </button>
              <button onClick={saveEdit} disabled={saving}
                style={{ flex: 2, padding: "10px", background: "#059669", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", color: "#fff", opacity: saving ? 0.7 : 1 }}>
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
