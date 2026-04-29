"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Phone, Mail, Calendar, MessageSquare, FileText, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { adminApi, AdminUser, AdminPolicy, AdminClaim } from "@/lib/api";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    Verified: { bg: "#ECFDF5", color: "#059669" },
    Pending:  { bg: "#FFFBEB", color: "#D97706" },
    Blocked:  { bg: "#FEF2F2", color: "#DC2626" },
    active: { bg: "#ECFDF5", color: "#059669" },
    expired: { bg: "#FEF2F2", color: "#DC2626" },
    cancelled: { bg: "#F3F4F6", color: "#6B7280" },
    approved: { bg: "#ECFDF5", color: "#059669" },
    rejected: { bg: "#FEF2F2", color: "#DC2626" },
    pending: { bg: "#FFFBEB", color: "#D97706" },
  };
  const s = map[status] ?? { bg: "var(--bg)", color: "var(--text-muted)" };
  return <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 100, background: s.bg, color: s.color, textTransform: "capitalize" }}>{status}</span>;
}

// Claim Detail Drawer
function ClaimDrawer({ claim, onClose }: { claim: AdminClaim; onClose: () => void }) {
  const statusIcon: Record<string, any> = {
    approved: <CheckCircle size={16} color="#059669" />,
    rejected: <AlertCircle size={16} color="#DC2626" />,
    pending: <Clock size={16} color="#D97706" />,
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex" }}>
      <div style={{ flex: 1, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(2px)" }} onClick={onClose} />
      <div className="side-drawer" style={{ width: 480, background: "#fff", height: "100%", overflowY: "auto", display: "flex", flexDirection: "column", boxShadow: "-8px 0 32px rgba(0,0,0,0.15)", animation: "slideIn 0.3s ease-out" }}>
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "#fff", zIndex: 10 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>Claim Details</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "24px", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, padding: "14px 16px", background: "var(--bg)", borderRadius: 10 }}>
            {statusIcon[claim.status] || <FileText size={16} color="var(--text-muted)" />}
            <div>
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>Status</p>
              <StatusBadge status={claim.status} />
            </div>
          </div>

          {/* Claim Info Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
            {[
              { label: "Claim ID", value: claim.id.slice(0, 8) },
              { label: "Amount", value: `₹${claim.amount.toLocaleString("en-IN")}` },
              { label: "Incident Date", value: new Date(claim.incidentDate).toLocaleDateString() },
              { label: "Filed Date", value: new Date(claim.createdAt).toLocaleDateString() },
              { label: "Policy", value: claim.policy?.policyNumber || "N/A" },
              { label: "Type", value: claim.policy?.type || "N/A" },
            ].map(({ label, value }) => (
              <div key={label}>
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>{label}</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{value}</p>
              </div>
            ))}
          </div>

          {claim.description && (
            <div style={{ marginBottom: 20, padding: "12px 14px", background: "var(--bg)", borderRadius: 8 }}>
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>Description</p>
              <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.5 }}>{claim.description}</p>
            </div>
          )}

          {claim.notes && (
            <div style={{ padding: "12px 14px", background: "#FEF2F2", borderLeft: "3px solid #D97706", borderRadius: 8 }}>
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>Admin Notes</p>
              <p style={{ fontSize: 13, color: "#DC2626", lineHeight: 1.5 }}>{claim.notes}</p>
            </div>
          )}

          {claim.approvedDate && (
            <div style={{ marginTop: 20, padding: "12px 14px", background: "#ECFDF5", borderRadius: 8, borderLeft: "3px solid #059669" }}>
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Approved On</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#059669" }}>{new Date(claim.approvedDate).toLocaleDateString()}</p>
            </div>
          )}
        </div>

        <style>{`
          @keyframes slideIn {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
          @media (max-width: 768px) { .side-drawer { width: 100% !important; } }
        `}</style>
      </div>
    </div>
  );
}

function UserDrawer({ user, onClose, onChat }: { user: AdminUser; onClose: () => void; onChat: (id: string) => void }) {
  const [tab, setTab] = useState<"profile" | "policies" | "claims">("profile");
  const [policies, setPolicies] = useState<AdminPolicy[]>([]);
  const [claims, setClaims] = useState<AdminClaim[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<AdminPolicy | null>(null);
  const [selectedClaim, setSelectedClaim] = useState<AdminClaim | null>(null);

  useEffect(() => {
    async function load() {
      if (tab === "policies" && policies.length === 0) {
        setLoadingData(true);
        try {
          const resp = await adminApi.getPolicies(1, 100);
          setPolicies(resp.policies.filter(p => p.userId === user.id));
        } catch (e) {
          console.error(e);
        } finally {
          setLoadingData(false);
        }
      }
      if (tab === "claims" && claims.length === 0) {
        setLoadingData(true);
        try {
          const resp = await adminApi.getClaims(1, 100);
          setClaims(resp.claims.filter(c => c.userId === user.id));
        } catch (e) {
          console.error(e);
        } finally {
          setLoadingData(false);
        }
      }
    }
    load();
  }, [tab, user.id]);

  const tabs = [
    { id: "profile", label: "Profile", count: 0 },
    { id: "policies", label: "Policies", count: user._count?.policies || 0 },
    { id: "claims", label: "Claims", count: user._count?.claims || 0 },
  ] as const;

  return (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex" }}>
        <div style={{ flex: 1, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(2px)" }} onClick={onClose} />
        <div className="side-drawer" style={{ width: 520, background: "#fff", height: "100%", overflowY: "auto", display: "flex", flexDirection: "column", boxShadow: "-8px 0 32px rgba(0,0,0,0.15)", animation: "slideIn 0.3s ease-out" }}>
          {/* Header */}
          <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "#fff", zIndex: 10 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>
              {tab === "profile" && "User Profile"}
              {tab === "policies" && "User Policies"}
              {tab === "claims" && "User Claims"}
            </h3>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", padding: 4 }}>
              <X size={20} />
            </button>
          </div>

          {/* Profile card - always visible at top when profile tab */}
          {tab === "profile" && (
            <div style={{ padding: "22px 24px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 18, fontWeight: 800 }}>
                  {(user.name ?? user.phone).slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>{user.name ?? user.phone}</p>
                  <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Member since {new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
                {[
                  { icon: Phone,    label: "Phone",   value: "+91 " + user.phone },
                  { icon: Mail,     label: "Email",   value: user.email || "Not provided" },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <Icon size={16} color="var(--primary)" style={{ marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>{label}</p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { label: "Active Policies", value: user._count?.policies || 0 },
                  { label: "Claims Filed", value: user._count?.claims || 0 },
                ].map(({ label, value }) => (
                  <div key={label} style={{ padding: "14px", background: "var(--bg)", borderRadius: 10, textAlign: "center" }}>
                    <p style={{ fontSize: 16, fontWeight: 800, color: "var(--primary)", letterSpacing: "-0.04em" }}>{value}</p>
                    <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--border)", padding: "0 12px", background: "#fff", position: "sticky", top: tab === "profile" ? 60 : 56, zIndex: 9 }}>
            {tabs.map(({ id, label, count }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  background: tab === id ? "var(--primary)" : "transparent",
                  border: "none",
                  borderRadius: "0",
                  color: tab === id ? "#fff" : "var(--text-muted)",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  textTransform: "capitalize",
                }}
              >
                {label}
                {count > 0 && (
                  <span style={{
                    background: tab === id ? "rgba(255,255,255,0.3)" : "var(--bg)",
                    color: tab === id ? "#fff" : "var(--text-muted)",
                    fontSize: 11,
                    fontWeight: 800,
                    padding: "1px 7px",
                    borderRadius: 100,
                  }}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 12px" }}>
            {tab === "policies" && (
              loadingData ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200, color: "var(--text-muted)", fontSize: 13 }}>Loading policies...</div>
              ) : policies.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 200, color: "var(--text-muted)" }}>
                  <FileText size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
                  <p>No policies found</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {policies.map(policy => (
                    <div
                      key={policy.id}
                      onClick={() => setSelectedPolicy(policy)}
                      style={{
                        padding: "14px",
                        background: "#fff",
                        border: "1px solid var(--border)",
                        borderRadius: 10,
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = "var(--bg)";
                        e.currentTarget.style.borderColor = "var(--primary)";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = "#fff";
                        e.currentTarget.style.borderColor = "var(--border)";
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 8 }}>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{policy.policyNumber}</p>
                          <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{policy.provider}</p>
                        </div>
                        <StatusBadge status={policy.status} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <p style={{ fontSize: 11, color: "var(--text-muted)" }}>Premium: <span style={{ fontWeight: 700, color: "var(--text)" }}>₹{policy.premium.toLocaleString("en-IN")}</span></p>
                        <p style={{ fontSize: 10, color: "var(--primary)", fontWeight: 700 }}>View →</p>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {tab === "claims" && (
              loadingData ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200, color: "var(--text-muted)", fontSize: 13 }}>Loading claims...</div>
              ) : claims.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 200, color: "var(--text-muted)" }}>
                  <AlertCircle size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
                  <p>No claims found</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {claims.map(claim => (
                    <div
                      key={claim.id}
                      onClick={() => setSelectedClaim(claim)}
                      style={{
                        padding: "14px",
                        background: "#fff",
                        border: "1px solid var(--border)",
                        borderRadius: 10,
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = "var(--bg)";
                        e.currentTarget.style.borderColor = "var(--primary)";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = "#fff";
                        e.currentTarget.style.borderColor = "var(--border)";
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 8 }}>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{claim.policy?.policyNumber}</p>
                          <p style={{ fontSize: 11, color: "var(--text-muted)" }}>Incident: {new Date(claim.incidentDate).toLocaleDateString()}</p>
                        </div>
                        <StatusBadge status={claim.status} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <p style={{ fontSize: 11, color: "var(--text-muted)" }}>Amount: <span style={{ fontWeight: 700, color: "var(--text)" }}>₹{claim.amount.toLocaleString("en-IN")}</span></p>
                        <p style={{ fontSize: 10, color: "var(--primary)", fontWeight: 700 }}>View →</p>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>

          {/* Actions Footer */}
          {tab === "profile" && (
            <div style={{ padding: "16px 12px", borderTop: "1px solid var(--border)", display: "flex", gap: 10 }}>
              <button
                onClick={() => { onClose(); onChat(user.id); }}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", background: "var(--primary)", border: "none", borderRadius: 10, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "0.9")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
              >
                <MessageSquare size={16} /> Chat with User
              </button>
            </div>
          )}

          <style>{`
            @keyframes slideIn {
              from { transform: translateX(100%); }
              to { transform: translateX(0); }
            }
            @media (max-width: 768px) { .side-drawer { width: 100% !important; } }
          `}</style>
        </div>
      </div>

      {selectedPolicy && (
        <PolicyDetailDrawer policy={selectedPolicy} onClose={() => setSelectedPolicy(null)} />
      )}
      {selectedClaim && (
        <ClaimDrawer claim={selectedClaim} onClose={() => setSelectedClaim(null)} />
      )}
    </>
  );
}

// Policy Detail Drawer
function PolicyDetailDrawer({ policy, onClose }: { policy: AdminPolicy; onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 400, display: "flex" }}>
      <div style={{ flex: 1, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(2px)" }} onClick={onClose} />
      <div className="side-drawer" style={{ width: 480, background: "#fff", height: "100%", overflowY: "auto", display: "flex", flexDirection: "column", boxShadow: "-8px 0 32px rgba(0,0,0,0.15)", animation: "slideIn 0.3s ease-out" }}>
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "#fff", zIndex: 10 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>Policy Details</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "24px", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, padding: "14px 16px", background: "var(--bg)", borderRadius: 10 }}>
            <FileText size={16} color="var(--text-muted)" />
            <div>
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>Policy Number</p>
              <p style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>{policy.policyNumber}</p>
            </div>
          </div>

          {/* Status */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>Status</p>
            <StatusBadge status={policy.status} />
          </div>

          {/* Details Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
            {[
              { label: "Provider", value: policy.provider },
              { label: "Type", value: policy.type },
              { label: "Premium", value: `₹${policy.premium.toLocaleString("en-IN")}` },
              { label: "Sum Insured", value: `₹${policy.sumInsured.toLocaleString("en-IN")}` },
              { label: "Start Date", value: new Date(policy.startDate).toLocaleDateString() },
              { label: "End Date", value: new Date(policy.endDate).toLocaleDateString() },
              { label: "Payment Status", value: policy.paymentStatus },
              { label: "Claims Filed", value: policy._count?.claims || 0 },
            ].map(({ label, value }) => (
              <div key={label}>
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>{label}</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{value}</p>
              </div>
            ))}
          </div>

          {policy.insurer && (
            <div style={{ padding: "14px 16px", background: "var(--bg)", borderRadius: 10 }}>
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>Insurer</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{policy.insurer.name}</p>
            </div>
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

export default function UsersPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function goToChat(userId: string) {
    router.push(`/dashboard/chat?userId=${userId}`);
  }

  useEffect(() => {
    async function loadUsers() {
      try {
        setLoading(true);
        const response = await adminApi.getUsers(1, 100); // Get all users for now
        setUsers(response.users);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load users");
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, []);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return !q || (u.name ?? "").toLowerCase().includes(q) || u.phone.includes(q) || (u.email && u.email.toLowerCase().includes(q));
  });

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <p style={{ color: "var(--text-muted)" }}>Loading users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <p style={{ color: "var(--text-muted)" }}>Error: {error}</p>
      </div>
    );
  }

  return (
    <div style={{ width: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 2 }}>Users</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{users.length} registered users</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: "var(--primary)", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            All Users
          </button>
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
              {["User", "Phone", "Policies", "Claims", "Joined", ""].map((h, i) => (
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
                      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)" }}>{(u.name ?? u.phone).slice(0, 2).toUpperCase()}</span>
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{u.name ?? u.phone}</p>
                      <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{u.email}</p>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "14px 16px", fontSize: 13, color: "var(--text-muted)" }}>+91 {u.phone}</td>
                <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 700, color: "var(--text)", textAlign: "center" }}>{u._count?.policies || 0}</td>
                <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 700, color: "var(--text)", textAlign: "center" }}>{u._count?.claims || 0}</td>
                <td style={{ padding: "14px 16px", fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => setSelected(u)}
                      style={{ padding: "6px 14px", background: "var(--primary-light)", border: "none", borderRadius: 7, color: "var(--primary)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      View
                    </button>
                    <button onClick={() => goToChat(u.id)}
                      style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", background: "#ECFDF5", border: "none", borderRadius: 7, color: "#059669", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      <MessageSquare size={12} /> Chat
                    </button>
                  </div>
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

      {selected && <UserDrawer user={selected} onClose={() => setSelected(null)} onChat={goToChat} />}
    </div>
  );
}
