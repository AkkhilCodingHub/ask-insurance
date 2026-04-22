"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/auth";
import { adminApi, AgentRecord } from "@/lib/api";
import { Save, Eye, EyeOff, Loader2, Check, X, UserCog, Trash2, RefreshCw } from "lucide-react";

// ── Shared components ────────────────────────────────────────────────────────

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", marginBottom: 20 }}>
      <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--border)" }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", marginBottom: subtitle ? 2 : 0 }}>{title}</h3>
        {subtitle && <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{subtitle}</p>}
      </div>
      <div style={{ padding: "18px 22px" }}>{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 12px",
  border: "1.5px solid var(--border)", borderRadius: 8,
  fontSize: 13, outline: "none", boxSizing: "border-box",
};

function Banner({ type, msg }: { type: "success" | "error"; msg: string }) {
  const bg  = type === "success" ? "#ECFDF5" : "#FEF2F2";
  const clr = type === "success" ? "#059669"  : "#DC2626";
  const bdr = type === "success" ? "#A7F3D0" : "#FECACA";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: bg, border: `1px solid ${bdr}`, borderRadius: 8, marginBottom: 14 }}>
      {type === "success" ? <Check size={14} color={clr} /> : <X size={14} color={clr} />}
      <p style={{ fontSize: 13, color: clr, fontWeight: 500 }}>{msg}</p>
    </div>
  );
}

// ── Role badge ────────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  const isSuperadmin = role === "superadmin";
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 100, textTransform: "uppercase", letterSpacing: "0.05em",
      background: isSuperadmin ? "#EFF6FF" : "#F0FDF4",
      color:      isSuperadmin ? "#1D4ED8"  : "#15803D",
      border:     isSuperadmin ? "1px solid #BFDBFE" : "1px solid #BBF7D0",
    }}>{isSuperadmin ? "Superadmin" : "Admin"}</span>
  );
}

// ── Admin Profile section ─────────────────────────────────────────────────────

function ProfileSection() {
  const { admin } = useAuth();
  const [name,      setName]      = useState(admin?.name ?? "");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw,     setNewPw]     = useState("");
  const [showPw,    setShowPw]    = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [banner,    setBanner]    = useState<{ type: "success" | "error"; msg: string } | null>(null);

  async function handleSave() {
    setSaving(true);
    setBanner(null);
    try {
      const payload: { name?: string; currentPassword?: string; newPassword?: string } = {};
      if (name.trim() && name.trim() !== admin?.name) payload.name = name.trim();
      if (newPw) {
        if (!currentPw) { setBanner({ type: "error", msg: "Enter your current password to set a new one." }); setSaving(false); return; }
        if (newPw.length < 8) { setBanner({ type: "error", msg: "New password must be at least 8 characters." }); setSaving(false); return; }
        payload.currentPassword = currentPw;
        payload.newPassword     = newPw;
      }
      if (Object.keys(payload).length === 0) { setBanner({ type: "error", msg: "Nothing to update." }); setSaving(false); return; }
      await adminApi.updateProfile(payload);
      setBanner({ type: "success", msg: "Profile updated successfully." });
      setCurrentPw(""); setNewPw("");
    } catch (e: unknown) {
      setBanner({ type: "error", msg: e instanceof Error ? e.message : "Failed to save changes." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Section title="Admin Profile" subtitle="Update your name and password">
      {banner && <Banner type={banner.type} msg={banner.msg} />}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <Field label="Full Name">
          <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Email Address">
          <input value={admin?.email ?? ""} disabled
            style={{ ...inputStyle, background: "var(--bg)", color: "var(--text-muted)", cursor: "not-allowed" }} />
        </Field>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
        <Field label="Current Password">
          <div style={{ display: "flex", alignItems: "center", border: "1.5px solid var(--border)", borderRadius: 8, padding: "0 12px", height: 38 }}>
            <input type={showPw ? "text" : "password"} value={currentPw} onChange={e => setCurrentPw(e.target.value)}
              placeholder="Required to change password"
              style={{ flex: 1, border: "none", outline: "none", fontSize: 13, background: "transparent" }} />
            <button onClick={() => setShowPw(!showPw)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}>
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </Field>
        <Field label="New Password">
          <input type={showPw ? "text" : "password"} value={newPw} onChange={e => setNewPw(e.target.value)}
            placeholder="Min. 8 characters" style={inputStyle} />
        </Field>
      </div>

      <button onClick={handleSave} disabled={saving}
        style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 22px", background: "var(--primary)", border: "none", borderRadius: 10, color: "#fff", fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.75 : 1 }}>
        {saving ? <Loader2 size={15} style={{ animation: "spin 0.8s linear infinite" }} /> : <Save size={15} />}
        {saving ? "Saving…" : "Save Changes"}
      </button>
    </Section>
  );
}

// ── Agent Team section ────────────────────────────────────────────────────────

type RoleOption = "admin" | "superadmin";

function AgentTeamSection() {
  const { admin: self } = useAuth();
  const [agents,    setAgents]    = useState<AgentRecord[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [banner,    setBanner]    = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [savingId,  setSavingId]  = useState<string | null>(null);
  const [deletingId,setDeletingId]= useState<string | null>(null);

  // Inline edit state per row: { [agentId]: { name, role, password } }
  const [edits, setEdits] = useState<Record<string, { name: string; role: RoleOption; password: string; expanded: boolean }>>({});

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const list = await adminApi.getAgents();
      setAgents(list);
      const init: typeof edits = {};
      list.forEach(a => { init[a.id] = { name: a.name, role: a.role as RoleOption, password: "", expanded: false }; });
      setEdits(init);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load agents");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function setEdit(id: string, patch: Partial<typeof edits[string]>) {
    setEdits(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  async function handleSave(agent: AgentRecord) {
    const ed = edits[agent.id];
    if (!ed) return;
    setSavingId(agent.id); setBanner(null);
    try {
      const payload: Parameters<typeof adminApi.updateAgent>[1] = {};
      if (ed.name.trim() !== agent.name)   payload.name = ed.name.trim();
      if (ed.role         !== agent.role)   payload.role = ed.role;
      if (ed.password.trim())               payload.password = ed.password.trim();
      if (Object.keys(payload).length === 0) { setBanner({ type: "error", msg: "No changes to save." }); return; }
      const updated = await adminApi.updateAgent(agent.id, payload);
      setAgents(prev => prev.map(a => a.id === updated.id ? updated : a));
      setEdit(agent.id, { password: "", expanded: false });
      setBanner({ type: "success", msg: `${updated.name} updated successfully.` });
    } catch (e: unknown) {
      setBanner({ type: "error", msg: e instanceof Error ? e.message : "Failed to update agent." });
    } finally { setSavingId(null); }
  }

  async function handleToggleActive(agent: AgentRecord) {
    setSavingId(agent.id);
    try {
      const updated = await adminApi.updateAgent(agent.id, { isActive: !agent.isActive });
      setAgents(prev => prev.map(a => a.id === updated.id ? updated : a));
    } catch (e: unknown) {
      setBanner({ type: "error", msg: e instanceof Error ? e.message : "Failed to update status." });
    } finally { setSavingId(null); }
  }

  async function handleDelete(agent: AgentRecord) {
    if (!confirm(`Delete ${agent.name}? This cannot be undone.`)) return;
    setDeletingId(agent.id);
    try {
      await adminApi.deleteAgent(agent.id);
      setAgents(prev => prev.filter(a => a.id !== agent.id));
      setBanner({ type: "success", msg: `${agent.name} deleted.` });
    } catch (e: unknown) {
      setBanner({ type: "error", msg: e instanceof Error ? e.message : "Failed to delete agent." });
    } finally { setDeletingId(null); }
  }

  const isSelf   = (id: string) => id === self?.id;
  const isSuperSelf = self?.role === "superadmin";

  return (
    <Section title="Admin Team" subtitle="Manage admin users and their access">
      {banner && <Banner type={banner.type} msg={banner.msg} />}

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "24px 0" }}>
          <Loader2 size={22} color="var(--primary)" style={{ animation: "spin 0.8s linear infinite" }} />
        </div>
      ) : error ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 0" }}>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{error}</p>
          <button onClick={load} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--primary)", fontSize: 13, fontWeight: 600 }}>Retry</button>
        </div>
      ) : agents.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--text-muted)", padding: "12px 0" }}>No agents found.</p>
      ) : (
        agents.map(agent => {
          const ed        = edits[agent.id] ?? { name: agent.name, role: agent.role as RoleOption, password: "", expanded: false };
          const isBusy    = savingId === agent.id || deletingId === agent.id;
          const canEdit   = isSuperSelf && !isSelf(agent.id);

          return (
            <div key={agent.id} style={{ borderBottom: "1px solid var(--border)", paddingBottom: 16, marginBottom: 16 }}>
              {/* Top row */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {/* Avatar */}
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: agent.isActive ? "var(--primary)" : "var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                  {agent.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{agent.name}</p>
                    <RoleBadge role={agent.role} />
                    {!agent.isActive && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 100, background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>Inactive</span>}
                    {isSelf(agent.id) && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 100, background: "#F0FDF4", color: "#15803D", border: "1px solid #BBF7D0" }}>You</span>}
                  </div>
                  <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{agent.email}</p>
                </div>

                {/* Actions */}
                {canEdit && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {/* Toggle active */}
                    <button
                      onClick={() => handleToggleActive(agent)}
                      disabled={isBusy}
                      title={agent.isActive ? "Deactivate" : "Activate"}
                      style={{ padding: "6px 12px", borderRadius: 7, border: "1.5px solid var(--border)", background: agent.isActive ? "#FEF2F2" : "#F0FDF4", color: agent.isActive ? "#DC2626" : "#15803D", fontSize: 12, fontWeight: 600, cursor: isBusy ? "not-allowed" : "pointer", opacity: isBusy ? 0.5 : 1 }}
                    >
                      {agent.isActive ? "Deactivate" : "Activate"}
                    </button>

                    {/* Expand edit */}
                    <button
                      onClick={() => setEdit(agent.id, { expanded: !ed.expanded })}
                      title="Edit"
                      style={{ padding: 7, borderRadius: 7, border: "1.5px solid var(--border)", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center" }}
                    >
                      <UserCog size={14} color="var(--primary)" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(agent)}
                      disabled={isBusy}
                      title="Delete"
                      style={{ padding: 7, borderRadius: 7, border: "1.5px solid #FECACA", background: "#FEF2F2", cursor: isBusy ? "not-allowed" : "pointer", display: "flex", alignItems: "center", opacity: isBusy ? 0.5 : 1 }}
                    >
                      {deletingId === agent.id ? <Loader2 size={14} color="#DC2626" style={{ animation: "spin 0.8s linear infinite" }} /> : <Trash2 size={14} color="#DC2626" />}
                    </button>
                  </div>
                )}
              </div>

              {/* Expanded edit form */}
              {ed.expanded && canEdit && (
                <div style={{ marginTop: 14, padding: "14px 16px", background: "var(--bg)", borderRadius: 10, border: "1px solid var(--border)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
                    <Field label="Name">
                      <input value={ed.name} onChange={e => setEdit(agent.id, { name: e.target.value })} style={inputStyle} />
                    </Field>
                    <Field label="Role">
                      <select value={ed.role} onChange={e => setEdit(agent.id, { role: e.target.value as RoleOption })}
                        style={{ ...inputStyle, background: "#fff" }}>
                        <option value="admin">Admin</option>
                        <option value="superadmin">Superadmin</option>
                      </select>
                    </Field>
                    <Field label="Reset Password (optional)">
                      <input type="password" value={ed.password} onChange={e => setEdit(agent.id, { password: e.target.value })}
                        placeholder="Min. 8 chars" style={inputStyle} />
                    </Field>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => handleSave(agent)} disabled={isBusy}
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", background: "var(--primary)", border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 700, cursor: isBusy ? "not-allowed" : "pointer", opacity: isBusy ? 0.75 : 1 }}>
                      {savingId === agent.id ? <Loader2 size={13} style={{ animation: "spin 0.8s linear infinite" }} /> : <Save size={13} />}
                      Save
                    </button>
                    <button onClick={() => setEdit(agent.id, { expanded: false, password: "" })}
                      style={{ padding: "8px 18px", background: "#fff", border: "1.5px solid var(--border)", borderRadius: 8, color: "var(--text-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
        <button onClick={load}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "var(--bg)", border: "1.5px solid var(--border)", borderRadius: 8, color: "var(--text-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          <RefreshCw size={13} /> Refresh
        </button>
        {isSuperSelf && (
          <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
            To create new agents use the <strong>Agents</strong> page. Only superadmins can edit or delete.
          </p>
        )}
      </div>
    </Section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  return (
    <div style={{ width: "100%", maxWidth: 820 }}>
      <ProfileSection />
      <AgentTeamSection />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
