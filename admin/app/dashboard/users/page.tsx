"use client";

import { useState } from "react";
import { Search, Filter, CheckCircle, Clock, Ban, X, Phone, Mail, MapPin, Calendar, FileText, Shield } from "lucide-react";
import { USERS, POLICIES, CLAIMS, type AdminUser } from "@/lib/mock";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    Verified: { bg: "#ECFDF5", color: "#059669" },
    Pending:  { bg: "#FFFBEB", color: "#D97706" },
    Blocked:  { bg: "#FEF2F2", color: "#DC2626" },
  };
  const s = map[status] ?? { bg: "var(--bg)", color: "var(--text-muted)" };
  return <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 100, background: s.bg, color: s.color }}>{status}</span>;
}

function UserDrawer({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const [tab, setTab] = useState<"policies" | "claims">("policies");
  const policies = POLICIES.filter(p => p.userId === user.id);
  const claims = CLAIMS.filter(c => c.userId === user.id);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex" }}>
      <div style={{ flex: 1, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(2px)" }} onClick={onClose} />
      <div style={{ width: 480, background: "#fff", height: "100%", overflowY: "auto", display: "flex", flexDirection: "column", boxShadow: "-8px 0 32px rgba(0,0,0,0.15)" }}>
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "#fff", zIndex: 10 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>User Profile</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {/* Profile card */}
        <div style={{ padding: "24px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 18, fontWeight: 800 }}>
              {user.name.split(" ").map(n => n[0]).join("").slice(0,2)}
            </div>
            <div>
              <p style={{ fontSize: 17, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>{user.name}</p>
              <StatusBadge status={user.status} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { icon: Phone,    label: "Phone",   value: "+91 " + user.phone },
              { icon: Mail,     label: "Email",   value: user.email },
              { icon: MapPin,   label: "City",    value: user.city },
              { icon: Calendar, label: "DOB",     value: user.dob },
              { icon: Calendar, label: "Joined",  value: user.joinedAt },
              { icon: FileText, label: "Premium", value: user.premiumTotal },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <Icon size={14} color="var(--text-muted)" style={{ marginTop: 2, flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 1 }}>{label}</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", borderBottom: "1px solid var(--border)" }}>
          {[
            { label: "Policies", value: user.policyCount },
            { label: "Claims",   value: user.claimCount },
            { label: "Total premium", value: user.premiumTotal },
          ].map(({ label, value }) => (
            <div key={label} style={{ padding: "14px 16px", textAlign: "center", borderRight: "1px solid var(--border)" }}>
              <p style={{ fontSize: 18, fontWeight: 800, color: "var(--primary)", letterSpacing: "-0.04em" }}>{value}</p>
              <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
          {(["policies", "claims"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ flex: 1, padding: "12px", border: "none", background: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", color: tab === t ? "var(--primary)" : "var(--text-muted)", borderBottom: tab === t ? "2px solid var(--primary)" : "2px solid transparent" }}>
              {t.charAt(0).toUpperCase() + t.slice(1)} ({tab === "policies" ? policies.length : claims.length})
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, padding: "16px 24px" }}>
          {tab === "policies" ? (
            policies.length ? policies.map(p => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{p.planName}</p>
                  <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{p.policyNo} · {p.premium}</p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 100, background: p.status === "Active" ? "#ECFDF5" : "#FEF2F2", color: p.status === "Active" ? "#059669" : "#DC2626" }}>{p.status}</span>
              </div>
            )) : <p style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", paddingTop: 32 }}>No policies found</p>
          ) : (
            claims.length ? claims.map(c => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                <Shield size={14} color={c.color} style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{c.description}</p>
                  <p style={{ fontSize: 11, color: "var(--text-muted)" }}>₹{c.amount.toLocaleString("en-IN")} · {c.filedDate}</p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700 }}>{c.status}</span>
              </div>
            )) : <p style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", paddingTop: 32 }}>No claims found</p>
          )}
        </div>

        {/* Actions */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)", display: "flex", gap: 10 }}>
          {user.status !== "Verified" && (
            <button style={{ flex: 1, padding: "10px", background: "#ECFDF5", border: "1.5px solid #A7F3D0", borderRadius: 10, color: "#059669", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              ✓ Verify KYC
            </button>
          )}
          {user.status !== "Blocked" ? (
            <button style={{ flex: 1, padding: "10px", background: "#FEF2F2", border: "1.5px solid #FCA5A5", borderRadius: 10, color: "#DC2626", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              Block User
            </button>
          ) : (
            <button style={{ flex: 1, padding: "10px", background: "var(--bg)", border: "1.5px solid var(--border)", borderRadius: 10, color: "var(--text-muted)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              Unblock User
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selected, setSelected] = useState<AdminUser | null>(null);

  const filtered = USERS.filter(u => {
    const matchStatus = statusFilter === "All" || u.status === statusFilter;
    const q = search.toLowerCase();
    return matchStatus && (!q || u.name.toLowerCase().includes(q) || u.phone.includes(q) || u.email.toLowerCase().includes(q) || u.city.toLowerCase().includes(q));
  });

  return (
    <div style={{ width: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 2 }}>Users</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{USERS.length} registered users</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["All", "Verified", "Pending", "Blocked"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              style={{ padding: "7px 16px", borderRadius: 8, border: statusFilter === s ? "none" : "1.5px solid var(--border)", background: statusFilter === s ? "var(--primary)" : "#fff", color: statusFilter === s ? "#fff" : "var(--text-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 14px", border: "1.5px solid var(--border)", borderRadius: 10, background: "#fff", marginBottom: 16, height: 44 }}>
        <Search size={16} color="var(--text-muted)" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone, email or city…"
          style={{ flex: 1, border: "none", outline: "none", fontSize: 14, color: "var(--text)", background: "transparent" }} />
      </div>

      {/* Table */}
      <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--bg)" }}>
              {["User", "Phone", "City", "Policies", "Claims", "Premium", "Joined", "Status", ""].map(h => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} style={{ borderTop: "1px solid var(--border)", transition: "background 0.12s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--bg)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)" }}>{u.name.split(" ").map(n => n[0]).join("").slice(0,2)}</span>
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{u.name}</p>
                      <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{u.email}</p>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "14px 16px", fontSize: 13, color: "var(--text-muted)" }}>+91 {u.phone}</td>
                <td style={{ padding: "14px 16px", fontSize: 13, color: "var(--text-muted)" }}>{u.city}</td>
                <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 700, color: "var(--text)", textAlign: "center" }}>{u.policyCount}</td>
                <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 700, color: "var(--text)", textAlign: "center" }}>{u.claimCount}</td>
                <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{u.premiumTotal}</td>
                <td style={{ padding: "14px 16px", fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{u.joinedAt}</td>
                <td style={{ padding: "14px 16px" }}><StatusBadge status={u.status} /></td>
                <td style={{ padding: "14px 16px" }}>
                  <button onClick={() => setSelected(u)}
                    style={{ padding: "6px 14px", background: "var(--primary-light)", border: "none", borderRadius: 7, color: "var(--primary)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-muted)" }}>
            <Search size={36} color="var(--border)" style={{ marginBottom: 10 }} />
            <p style={{ fontWeight: 600 }}>No users found</p>
          </div>
        )}
      </div>

      {selected && <UserDrawer user={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
