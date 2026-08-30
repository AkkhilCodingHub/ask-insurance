"use client";

import { useEffect, useState } from "react";
import { adminApi, AgentRecord } from "@/lib/api";
import {
  UserCog, Plus, Trash2, Pencil, ShieldCheck, Shield,
  ToggleLeft, ToggleRight, KeyRound, X, Eye, EyeOff, RefreshCw,
  Upload, Download, CheckCircle, AlertCircle
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function RoleBadge({ role }: { role: string }) {
  const isSuperadmin = role === "superadmin";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 700,
      background: isSuperadmin ? "#EDE9FE" : "#DBEAFE",
      color: isSuperadmin ? "#6D28D9" : "#1D4ED8",
    }}>
      {isSuperadmin ? <ShieldCheck size={11} /> : <Shield size={11} />}
      {isSuperadmin ? "Superadmin" : "Agent"}
    </span>
  );
}

// ── Create / Edit Modal ───────────────────────────────────────────────────────

interface ModalState {
  mode: "create" | "edit";
  agent?: AgentRecord;
}

function AgentModal({
  state, onClose, onSaved,
}: { state: ModalState; onClose: () => void; onSaved: (a: AgentRecord) => void }) {
  const editing = state.mode === "edit";
  const [name,      setName]      = useState(state.agent?.name ?? "");
  const [email,     setEmail]     = useState(state.agent?.email ?? "");
  const [password,  setPassword]  = useState("");
  const [loginMethod, setLoginMethod] = useState<"password" | "google">("password");
  const [role,      setRole]      = useState<"agent" | "superadmin">(state.agent?.role === "superadmin" ? "superadmin" : "agent");
  const [showPass,  setShowPass]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  const handleSave = async () => {
    if (!name.trim()) { setError("Name is required."); return; }
    if (!editing && !email.trim()) { setError("Email is required."); return; }
    if (!editing && loginMethod === "password" && !password.trim()) { setError("Password is required."); return; }
    setError(""); setLoading(true);
    try {
      let saved: AgentRecord;
      if (editing && state.agent) {
        saved = await adminApi.updateAgent(state.agent.id, {
          name: name.trim(),
          role,
          ...(password.trim() ? { password: password.trim() } : {}),
        });
      } else {
        saved = await adminApi.createAgent({
          name: name.trim(),
          email: email.trim(),
          ...(loginMethod === "password" && password.trim() ? { password } : {}),
          role,
        });
      }
      onSaved(saved);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div style={{
        background: "var(--white)", borderRadius: 20, width: "100%", maxWidth: 460,
        boxShadow: "0 24px 64px rgba(0,0,0,0.3)", border: "1px solid var(--border)",
      }}>
        {/* Header */}
        <div style={{ padding: "20px 24px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: 1, marginBottom: 4 }}>
              {editing ? "EDIT AGENT" : "NEW AGENT"}
            </p>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: "var(--text)", margin: 0 }}>
              {editing ? `Edit ${state.agent?.name}` : "Create Agent Account"}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, width: 34, height: 34, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={16} color="var(--text-muted)" />
          </button>
        </div>

        <div style={{ padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Name */}
          <div>
            <label style={{ fontSize: 10, fontWeight: 800, color: "#64748B", letterSpacing: 0.8, display: "block", marginBottom: 6 }}>FULL NAME</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Priya Sharma"
              style={{ width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "11px 14px", fontSize: 14, color: "#0F172A", background: "#F8FAFC", boxSizing: "border-box" }} />
          </div>

          {/* Email — only on create */}
          {!editing && (
            <div>
              <label style={{ fontSize: 10, fontWeight: 800, color: "#64748B", letterSpacing: 0.8, display: "block", marginBottom: 6 }}>EMAIL</label>
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="agent@example.com" type="email"
                style={{ width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "11px 14px", fontSize: 14, color: "#0F172A", background: "#F8FAFC", boxSizing: "border-box" }} />
            </div>
          )}

          {/* Login method — only on create */}
          {!editing && (
            <div>
              <label style={{ fontSize: 10, fontWeight: 800, color: "#64748B", letterSpacing: 0.8, display: "block", marginBottom: 8 }}>LOGIN METHOD</label>
              <div style={{ display: "flex", gap: 8 }}>
                {(["password", "google"] as const).map(m => (
                  <button key={m} onClick={() => setLoginMethod(m)} style={{
                    flex: 1, padding: "9px 0", borderRadius: 10,
                    border: `2px solid ${loginMethod === m ? "#3B82F6" : "#E2E8F0"}`,
                    background: loginMethod === m ? "#EFF6FF" : "#F8FAFC",
                    color: loginMethod === m ? "#1D4ED8" : "#64748B",
                    fontSize: 12, fontWeight: 700, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}>
                    {m === "google" ? (
                      <svg width="14" height="14" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    ) : <KeyRound size={13} />}
                    {m === "google" ? "Google (Gmail)" : "Password"}
                  </button>
                ))}
              </div>
              {loginMethod === "google" && (
                <p style={{ fontSize: 11, color: "#64748B", marginTop: 6 }}>
                  This agent will sign in using their Google account — no password needed.
                </p>
              )}
            </div>
          )}

          {/* Password — hidden for Google-only agents on create */}
          {(editing || loginMethod === "password") && (
          <div>
            <label style={{ fontSize: 10, fontWeight: 800, color: "#64748B", letterSpacing: 0.8, display: "block", marginBottom: 6 }}>
              {editing ? "NEW PASSWORD (leave blank to keep current)" : "PASSWORD"}
            </label>
            <div style={{ position: "relative" }}>
              <input value={password} onChange={e => setPassword(e.target.value)} placeholder={editing ? "••••••••" : "Min. 8 characters"}
                type={showPass ? "text" : "password"}
                style={{ width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "11px 40px 11px 14px", fontSize: 14, color: "#0F172A", background: "#F8FAFC", boxSizing: "border-box" }} />
              <button onClick={() => setShowPass(v => !v)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94A3B8", display: "flex", alignItems: "center" }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          )}

          {/* Role */}
          <div>
            <label style={{ fontSize: 10, fontWeight: 800, color: "#64748B", letterSpacing: 0.8, display: "block", marginBottom: 8 }}>ROLE</label>
            <div style={{ display: "flex", gap: 10 }}>
              {(["agent", "superadmin"] as const).map(r => (
                <button key={r} onClick={() => setRole(r)} style={{
                  flex: 1, padding: "10px 0", borderRadius: 10, border: `2px solid ${role === r ? "#3B82F6" : "#E2E8F0"}`,
                  background: role === r ? "#EFF6FF" : "#F8FAFC",
                  color: role === r ? "#1D4ED8" : "#64748B", fontSize: 13, fontWeight: 700, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}>
                  {r === "superadmin" ? <ShieldCheck size={14} /> : <Shield size={14} />}
                  {r === "superadmin" ? "Superadmin" : "Agent"}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 6 }}>
              {role === "superadmin" ? "Superadmin can manage all agents, settings, and full admin panel." : "Agent can manage assigned quotes and support chats."}
            </p>
          </div>

          {error && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FEE2E2", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#DC2626" }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button onClick={onClose} style={{ flex: 0.4, padding: "12px 0", borderRadius: 12, border: "1.5px solid #E2E8F0", background: "#F8FAFC", color: "#64748B", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={loading} style={{
              flex: 1, padding: "12px 0", borderRadius: 12, border: "none",
              background: loading ? "#93C5FD" : "#3B82F6", color: "#fff",
              fontSize: 14, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer",
            }}>
              {loading ? "Saving…" : editing ? "Save Changes" : "Create Agent"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Bulk Import Modal ────────────────────────────────────────────────────────

function BulkImportModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [csvText, setCsvText] = useState("");
  const [mode, setMode] = useState<"file" | "text">("file");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ importedCount: number; skippedCount: number; errors: string[] } | null>(null);

  const handleDownloadSample = () => {
    const sample = "name,email,phone,password,insurers,types\nJohn Doe,john.agent@example.com,9876543210,Agent@12345,HDFC ERGO;ICICI Lombard,health;motor\nJane Smith,jane.agent@example.com,9876543211,Agent@12345,Star Health,health";
    const blob = new Blob([sample], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "agents_sample.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    setError("");
    if (mode === "file" && !file) {
      setError("Please select a CSV file to upload.");
      return;
    }
    if (mode === "text" && !csvText.trim()) {
      setError("Please paste CSV data.");
      return;
    }

    setLoading(true);
    try {
      const res = await adminApi.bulkImportAgents(mode === "file" && file ? file : csvText);
      setResult(res);
      onDone();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Bulk import failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "var(--white)", borderRadius: 20, width: "100%", maxWidth: 520, boxShadow: "0 24px 64px rgba(0,0,0,0.3)", border: "1px solid var(--border)", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: 1, margin: "0 0 4px" }}>CSV BULK IMPORT</p>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: "var(--text)", margin: 0 }}>Import Agents via CSV</h2>
          </div>
          <button onClick={onClose} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, width: 34, height: 34, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={16} color="var(--text-muted)" />
          </button>
        </div>

        <div style={{ padding: 24 }}>
          {result ? (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 16, background: "#ECFDF5", borderRadius: 12, border: "1px solid #A7F3D0", marginBottom: 16 }}>
                <CheckCircle size={22} color="#059669" />
                <div>
                  <p style={{ fontSize: 15, fontWeight: 800, color: "#065F46", margin: 0 }}>Import Complete!</p>
                  <p style={{ fontSize: 13, color: "#047857", margin: "2px 0 0" }}>
                    Successfully imported <strong>{result.importedCount}</strong> new agents. {result.skippedCount > 0 && `(${result.skippedCount} skipped — already existed)`}
                  </p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div style={{ padding: 12, background: "#FEF2F2", borderRadius: 10, border: "1px solid #FECACA", maxHeight: 120, overflowY: "auto" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#DC2626", margin: "0 0 6px", textTransform: "uppercase" }}>Row Errors:</p>
                  {result.errors.map((err, i) => (
                    <p key={i} style={{ fontSize: 12, color: "#B91C1C", margin: "2px 0" }}>{err}</p>
                  ))}
                </div>
              )}

              <button onClick={onClose} style={{ width: "100%", marginTop: 20, padding: "12px 0", borderRadius: 12, border: "none", background: "#3B82F6", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>
                Done
              </button>
            </div>
          ) : (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setMode("file")} style={{ padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, border: "1px solid", borderColor: mode === "file" ? "#3B82F6" : "var(--border)", background: mode === "file" ? "#EFF6FF" : "#fff", color: mode === "file" ? "#1D4ED8" : "var(--text-muted)", cursor: "pointer" }}>Upload File</button>
                  <button onClick={() => setMode("text")} style={{ padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, border: "1px solid", borderColor: mode === "text" ? "#3B82F6" : "var(--border)", background: mode === "text" ? "#EFF6FF" : "#fff", color: mode === "text" ? "#1D4ED8" : "var(--text-muted)", cursor: "pointer" }}>Paste CSV</button>
                </div>
                <button onClick={handleDownloadSample} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: "#3B82F6", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  <Download size={13} /> Sample CSV
                </button>
              </div>

              {mode === "file" ? (
                <div style={{ border: "2px dashed var(--border)", borderRadius: 14, padding: "28px 20px", textAlign: "center", background: "var(--bg)", cursor: "pointer" }}>
                  <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)} style={{ display: "none" }} id="csv-file-input" />
                  <label htmlFor="csv-file-input" style={{ cursor: "pointer", display: "block" }}>
                    <Upload size={28} color="var(--text-muted)" style={{ marginBottom: 8 }} />
                    <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", margin: "0 0 4px" }}>
                      {file ? file.name : "Click to select .CSV file"}
                    </p>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
                      {file ? `${(file.size / 1024).toFixed(1)} KB` : "Supports standard CSV with headers: name, email, phone, password"}
                    </p>
                  </label>
                </div>
              ) : (
                <textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder="name,email,phone,password&#10;John Doe,john@example.com,9876543210,Agent@123"
                  rows={6}
                  style={{ width: "100%", padding: 12, border: "1.5px solid var(--border)", borderRadius: 12, fontSize: 13, fontFamily: "monospace", outline: "none", resize: "vertical", boxSizing: "border-box" }}
                />
              )}

              {error && (
                <div style={{ display: "flex", gap: 8, padding: "10px 12px", background: "#FEF2F2", borderRadius: 8, border: "1px solid #FECACA", marginTop: 14 }}>
                  <AlertCircle size={14} color="#DC2626" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "#DC2626" }}>{error}</span>
                </div>
              )}

              <button
                onClick={handleImport}
                disabled={loading}
                style={{ width: "100%", marginTop: 20, padding: "12px 0", borderRadius: 12, border: "none", background: loading ? "#93C5FD" : "#3B82F6", color: "#fff", fontSize: 14, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer" }}
              >
                {loading ? "Importing Agents..." : "Start Bulk Import"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<ModalState | null>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setError("");
    try { setAgents(await adminApi.getAgents()); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed to load agents."); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleToggleActive = async (agent: AgentRecord) => {
    setTogglingId(agent.id);
    try {
      const updated = await adminApi.updateAgent(agent.id, { isActive: !agent.isActive });
      setAgents(prev => prev.map(a => a.id === updated.id ? updated : a));
    } catch { /* ignore */ }
    finally { setTogglingId(null); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this agent? This cannot be undone.")) return;
    setDeleting(id);
    try {
      await adminApi.deleteAgent(id);
      setAgents(prev => prev.filter(a => a.id !== id));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Delete failed.");
    } finally { setDeleting(null); }
  };

  const handleSaved = (agent: AgentRecord) => {
    setAgents(prev => {
      const idx = prev.findIndex(a => a.id === agent.id);
      return idx >= 0 ? prev.map(a => a.id === agent.id ? agent : a) : [agent, ...prev];
    });
    setModal(null);
  };

  const active   = agents.filter(a => a.isActive).length;
  const superadmins = agents.filter(a => a.role === "superadmin").length;

  return (
    <div style={{ padding: 32, minHeight: "100vh", background: "var(--bg)" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(109, 40, 217, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <UserCog size={20} color="#8B5CF6" />
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: "var(--text)", margin: 0, letterSpacing: -0.5 }}>Agents</h1>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: 14, margin: 0 }}>Manage advisor accounts and system access.</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={load}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "11px 16px", background: "var(--white)", border: "1.5px solid var(--border)", borderRadius: 12, color: "var(--text-muted)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={() => setShowBulkModal(true)}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "11px 16px", background: "#EFF6FF", border: "1.5px solid #BFDBFE",
              borderRadius: 12, color: "#1D4ED8", fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}
          >
            <Upload size={14} /> Bulk Import CSV
          </button>
          <button
            onClick={() => setModal({ mode: "create" })}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "#3B82F6", color: "#fff", border: "none",
              borderRadius: 12, padding: "11px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer",
            }}
          >
            <Plus size={16} /> New Agent
          </button>
        </div>
      </div>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 28 }}>
            {[
              { label: "Total Agents", value: agents.length, color: "#3B82F6", bg: "rgba(59, 130, 246, 0.2)" },
              { label: "Active",       value: active,         color: "#10B981", bg: "rgba(16, 185, 129, 0.2)" },
              { label: "Superadmins",  value: superadmins,    color: "#8B5CF6", bg: "rgba(139, 92, 246, 0.2)" },
            ].map(s => (
              <div key={s.label} style={{ background: "var(--white)", borderRadius: 16, padding: "20px 24px", border: "1px solid var(--border)" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: 0.8, margin: "0 0 8px" }}>{s.label.toUpperCase()}</p>
                <p style={{ fontSize: 32, fontWeight: 900, color: s.color, margin: "0 0 4px", letterSpacing: -1 }}>{s.value}</p>
                <div style={{ height: 3, borderRadius: 2, background: s.bg, marginTop: 8 }} />
              </div>
            ))}
          </div>

          {/* Table */}
          <div style={{ background: "var(--white)", borderRadius: 20, border: "1px solid var(--border)", overflow: "hidden" }}>
            {/* Table header */}
            <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1.2fr 2fr 1fr 1fr 1fr 120px", padding: "12px 20px", background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
              {["Name", "Code", "Email", "Role", "Status", "Created", "Actions"].map(h => (
                <span key={h} style={{ fontSize: 10, fontWeight: 800, color: "var(--text-muted)", letterSpacing: 1 }}>{h.toUpperCase()}</span>
              ))}
            </div>

            {loading && (
              <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>Loading agents…</div>
            )}
            {error && (
              <div style={{ padding: 48, textAlign: "center", color: "#DC2626" }}>
                <p style={{ fontWeight: 700, marginBottom: 12 }}>{error}</p>
                <button onClick={load} style={{ background: "#3B82F6", color: "#fff", border: "none", borderRadius: 10, padding: "8px 20px", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>Retry</button>
              </div>
            )}
            {!loading && !error && agents.length === 0 && (
              <div style={{ padding: 64, textAlign: "center" }}>
                <UserCog size={40} color="var(--text-muted)" style={{ marginBottom: 12 }} />
                <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text-muted)", margin: "0 0 6px" }}>No agents yet</p>
                <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 20px" }}>Create the first agent account to grant portal access.</p>
                <button onClick={() => setModal({ mode: "create" })} style={{ background: "#3B82F6", color: "#fff", border: "none", borderRadius: 10, padding: "10px 24px", cursor: "pointer", fontSize: 14, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <Plus size={15} /> New Agent
                </button>
              </div>
            )}

            {!loading && agents.map((agent, i) => (
              <div
                key={agent.id}
                style={{
                  display: "grid", gridTemplateColumns: "1.8fr 1.2fr 2fr 1fr 1fr 1fr 120px",
                  padding: "14px 20px", alignItems: "center",
                  borderBottom: i < agents.length - 1 ? "1px solid var(--border)" : "none",
                  background: "var(--white)",
                  transition: "background 0.15s",
                }}
              >
                {/* Name */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, background: "rgba(139, 92, 246, 0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 800, color: "#8B5CF6", flexShrink: 0,
                  }}>
                    {agent.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{agent.name}</span>
                </div>

                {/* Code */}
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "monospace", color: "#6D28D9", background: "#F5F3FF", padding: "3px 8px", borderRadius: 6, border: "1px solid #DDD6FE" }}>
                    {agent.agentCode || "—"}
                  </span>
                </div>

                {/* Email */}
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{agent.email}</span>

                {/* Role */}
                <div><RoleBadge role={agent.role} /></div>

                {/* Status toggle */}
                <button
                  onClick={() => handleToggleActive(agent)}
                  disabled={togglingId === agent.id}
                  style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, padding: 0, opacity: togglingId === agent.id ? 0.5 : 1 }}
                >
                  {agent.isActive
                    ? <span style={{ color: "#10B981", display: "flex", alignItems: "center", gap: 6 }}><ToggleRight size={24} /> Active</span>
                    : <span style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}><ToggleLeft size={24} /> Inactive</span>
                  }
                </button>

                {/* Created */}
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{fmtDate(agent.createdAt)}</span>

                {/* Actions */}
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <button
                    onClick={() => setModal({ mode: "edit", agent })}
                    title="Edit agent"
                    style={{ width: 32, height: 32, borderRadius: 8, border: "1.5px solid var(--border)", background: "var(--bg)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <Pencil size={13} color="var(--text-muted)" />
                  </button>
                  <button
                    onClick={() => handleDelete(agent.id)}
                    disabled={deleting === agent.id}
                    title="Delete agent"
                    style={{ width: 32, height: 32, borderRadius: 8, border: "1.5px solid rgba(220, 38, 38, 0.3)", background: "rgba(220, 38, 38, 0.1)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: deleting === agent.id ? 0.5 : 1 }}
                  >
                    <Trash2 size={13} color="#DC2626" />
                  </button>
                </div>
              </div>
            ))}
          </div>
      {modal && <AgentModal state={modal} onClose={() => setModal(null)} onSaved={handleSaved} />}
      {showBulkModal && <BulkImportModal onClose={() => setShowBulkModal(false)} onDone={() => { setShowBulkModal(false); load(); }} />}
    </div>
  );
}
