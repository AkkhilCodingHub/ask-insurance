"use client";

import { useEffect, useState } from "react";
import { adminApi, PospApplicationRecord } from "@/lib/api";
import {
  Award, CheckCircle, XCircle, Clock, Eye, RefreshCw,
  Search, FileText, ExternalLink, X
} from "lucide-react";

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
  });
}

function StatusBadge({ status }: { status: string }) {
  if (status === "approved") {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 800, background: "#DCFCE7", color: "#166534" }}>
        <CheckCircle size={12} /> Approved
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 800, background: "#FEE2E2", color: "#991B1B" }}>
        <XCircle size={12} /> Rejected
      </span>
    );
  }
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 800, background: "#FEF3C7", color: "#92400E" }}>
      <Clock size={12} /> Pending Review
    </span>
  );
}

export default function PospRequestsPage() {
  const [apps, setApps] = useState<PospApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Selected Application Modal
  const [selectedApp, setSelectedApp] = useState<PospApplicationRecord | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminApi.getPospApplications();
      setApps(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load POSP applications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (appId: string) => {
    if (!confirm("Approve this POSP candidate? This will issue a unique POSP ID (ASxxxxxx) and create an active advisor account.")) return;
    setActionLoading(true);
    try {
      const res = await adminApi.approvePospApplication(appId);
      alert(res.message);
      load();
      setSelectedApp(null);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Approval failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (appId: string) => {
    setActionLoading(true);
    try {
      const res = await adminApi.rejectPospApplication(appId, rejectReason);
      alert(res.message);
      load();
      setSelectedApp(null);
      setShowRejectInput(false);
      setRejectReason("");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Rejection failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = apps.filter(a => {
    const q = search.toLowerCase();
    const matchQ = a.name.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      a.phone.includes(q) ||
      a.applicationNumber.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    return matchQ && matchStatus;
  });

  const pendingCount = apps.filter(a => a.status === "pending").length;
  const approvedCount = apps.filter(a => a.status === "approved").length;
  const rejectedCount = apps.filter(a => a.status === "rejected").length;

  return (
    <div style={{ padding: "clamp(16px, 3vw, 32px)", minHeight: "100vh", background: "var(--bg)" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 14 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(59, 130, 246, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Award size={22} color="#3B82F6" />
            </div>
            <h1 style={{ fontSize: "clamp(20px, 3vw, 26px)", fontWeight: 900, color: "var(--text)", margin: 0, letterSpacing: -0.5 }}>
              POSP Examination & Registration Requests
            </h1>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: 14, margin: 0 }}>
            Review candidate IC-38 exam results (&gt;15/50 score), Aadhaar & PAN KYC documents, and approve new POSP Advisors.
          </p>
        </div>

        <button onClick={load} style={{ display: "flex", alignItems: "center", gap: 7, padding: "11px 16px", background: "var(--white)", border: "1.5px solid var(--border)", borderRadius: 12, color: "var(--text-muted)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Total Applications", value: apps.length, color: "#3B82F6", bg: "rgba(59, 130, 246, 0.2)" },
          { label: "Pending Review",     value: pendingCount, color: "#D97706", bg: "rgba(217, 119, 6, 0.2)" },
          { label: "Approved Advisors",  value: approvedCount, color: "#10B981", bg: "rgba(16, 185, 129, 0.2)" },
          { label: "Rejected Requests",  value: rejectedCount, color: "#EF4444", bg: "rgba(239, 68, 68, 0.2)" },
        ].map(s => (
          <div key={s.label} style={{ background: "var(--white)", borderRadius: 16, padding: "18px 22px", border: "1px solid var(--border)" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: 0.8, margin: "0 0 6px" }}>{s.label.toUpperCase()}</p>
            <p style={{ fontSize: 28, fontWeight: 900, color: s.color, margin: "0 0 4px" }}>{s.value}</p>
            <div style={{ height: 3, borderRadius: 2, background: s.bg, marginTop: 6 }} />
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div style={{ display: "flex", gap: 14, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 240 }}>
          <Search size={16} color="var(--text-muted)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by candidate name, phone, email..."
            style={{ width: "100%", padding: "10px 14px 10px 40px", borderRadius: 12, border: "1.5px solid var(--border)", background: "var(--white)", fontSize: 13, color: "var(--text)", outline: "none", boxSizing: "border-box" }}
          />
        </div>

        <div style={{ display: "flex", gap: 6, background: "var(--white)", padding: 4, borderRadius: 12, border: "1px solid var(--border)", flexWrap: "wrap" }}>
          {["all", "pending", "approved", "rejected"].map(st => (
            <button key={st} onClick={() => setStatusFilter(st)} style={{
              padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, border: "none",
              background: statusFilter === st ? "#3B82F6" : "transparent",
              color: statusFilter === st ? "#fff" : "var(--text-muted)", cursor: "pointer", textTransform: "capitalize",
            }}>
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table with responsive horizontal scroll */}
      <div style={{ background: "var(--white)", borderRadius: 20, border: "1px solid var(--border)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 840 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.6fr 1.1fr 1.2fr 1fr 1fr 120px", padding: "12px 20px", background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
              {["Candidate", "Contact", "IC-38 Score", "Application Ref", "Status", "Date", "Action"].map(h => (
                <span key={h} style={{ fontSize: 10, fontWeight: 800, color: "var(--text-muted)", letterSpacing: 1 }}>{h.toUpperCase()}</span>
              ))}
            </div>

            {loading && <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Loading POSP application requests…</div>}
            {error && <div style={{ padding: 40, textAlign: "center", color: "#DC2626" }}>{error}</div>}

            {!loading && filtered.length === 0 && (
              <div style={{ padding: 60, textAlign: "center", color: "var(--text-muted)" }}>
                <Award size={36} color="var(--text-muted)" style={{ marginBottom: 10 }} />
                <p style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>No POSP registration requests found</p>
              </div>
            )}

            {!loading && filtered.map((app, i) => (
              <div
                key={app.id}
                style={{
                  display: "grid", gridTemplateColumns: "1.5fr 1.6fr 1.1fr 1.2fr 1fr 1fr 120px",
                  padding: "14px 20px", alignItems: "center",
                  borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none",
                  background: "var(--white)",
                }}
              >
                {/* Candidate Name */}
                <div>
                  <p style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", margin: 0 }}>{app.name}</p>
                  {app.assignedAgentCode && (
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#2563EB", fontFamily: "monospace" }}>
                      ID: {app.assignedAgentCode}
                    </span>
                  )}
                </div>

                {/* Contact */}
                <div>
                  <p style={{ fontSize: 13, color: "var(--text)", margin: 0 }}>{app.email}</p>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>{app.phone}</p>
                </div>

                {/* Score */}
                <div>
                  <span style={{ padding: "4px 10px", borderRadius: 8, background: "#DCFCE7", color: "#15803D", fontWeight: 900, fontSize: 13 }}>
                    {app.examScore} / 50 (&gt;15 Pass)
                  </span>
                </div>

                {/* App Ref */}
                <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "monospace", color: "var(--text)" }}>
                  {app.applicationNumber}
                </span>

                {/* Status */}
                <div><StatusBadge status={app.status} /></div>

                {/* Date */}
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{fmtDate(app.createdAt)}</span>

                {/* Action */}
                <button
                  onClick={() => setSelectedApp(app)}
                  style={{ padding: "7px 14px", borderRadius: 10, background: "#EFF6FF", border: "1px solid #BFDBFE", color: "#1D4ED8", fontSize: 12, fontWeight: 800, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}
                >
                  <Eye size={13} /> View
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Application Detail Modal */}
      {selectedApp && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "var(--white)", borderRadius: 20, width: "100%", maxWidth: 640, boxShadow: "0 24px 64px rgba(0,0,0,0.3)", border: "1px solid var(--border)", overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", letterSpacing: 1 }}>POSP CANDIDATE APPLICATION</span>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--text)", margin: "2px 0 0" }}>{selectedApp.name}</h2>
              </div>
              <button onClick={() => setSelectedApp(null)} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, width: 34, height: 34, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={16} color="var(--text-muted)" />
              </button>
            </div>

            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, maxHeight: "75vh", overflowY: "auto" }}>
              {/* Application Details Summary */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, background: "var(--bg)", padding: 16, borderRadius: 14, border: "1px solid var(--border)" }}>
                <div>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 2px" }}>Application Number</p>
                  <p style={{ fontSize: 14, fontWeight: 800, fontFamily: "monospace", margin: 0 }}>{selectedApp.applicationNumber}</p>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 2px" }}>IC-38 Exam Score</p>
                  <p style={{ fontSize: 14, fontWeight: 900, color: "#166534", margin: 0 }}>{selectedApp.examScore} / 50 (Passed)</p>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 2px" }}>Email</p>
                  <p style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>{selectedApp.email}</p>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 2px" }}>Phone</p>
                  <p style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>{selectedApp.phone}</p>
                </div>
              </div>

              {/* KYC Document Verification Section */}
              <div style={{ border: "1px solid var(--border)", borderRadius: 14, padding: 16 }}>
                <h4 style={{ fontSize: 14, fontWeight: 800, margin: "0 0 12px" }}>Uploaded Identification Documents</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {/* Aadhaar */}
                  <div style={{ padding: 12, borderRadius: 12, background: "var(--bg)", border: "1px solid var(--border)" }}>
                    <p style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", margin: "0 0 4px" }}>AADHAAR CARD</p>
                    <p style={{ fontSize: 14, fontWeight: 800, fontFamily: "monospace", margin: "0 0 8px" }}>{selectedApp.aadhaarNumber || "N/A"}</p>
                    {selectedApp.aadhaarDocUrl ? (
                      <a href={selectedApp.aadhaarDocUrl} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "#2563EB", textDecoration: "none" }}>
                        <FileText size={14} /> View Aadhaar Doc <ExternalLink size={12} />
                      </a>
                    ) : <span style={{ fontSize: 12, color: "var(--text-muted)" }}>No file uploaded</span>}
                  </div>

                  {/* PAN */}
                  <div style={{ padding: 12, borderRadius: 12, background: "var(--bg)", border: "1px solid var(--border)" }}>
                    <p style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", margin: "0 0 4px" }}>PAN CARD</p>
                    <p style={{ fontSize: 14, fontWeight: 800, fontFamily: "monospace", margin: "0 0 8px" }}>{selectedApp.panNumber || "N/A"}</p>
                    {selectedApp.panDocUrl ? (
                      <a href={selectedApp.panDocUrl} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "#2563EB", textDecoration: "none" }}>
                        <FileText size={14} /> View PAN Doc <ExternalLink size={12} />
                      </a>
                    ) : <span style={{ fontSize: 12, color: "var(--text-muted)" }}>No file uploaded</span>}
                  </div>
                </div>
              </div>

              {/* Application Status Banner */}
              {selectedApp.status === "approved" && (
                <div style={{ background: "#DCFCE7", padding: 14, borderRadius: 12, border: "1px solid #BBF7D0", color: "#166534", fontWeight: 700, fontSize: 13 }}>
                  ✓ Approved! Assigned Advisor Code: <strong>{selectedApp.assignedAgentCode}</strong>
                </div>
              )}

              {selectedApp.status === "rejected" && (
                <div style={{ background: "#FEF2F2", padding: 14, borderRadius: 12, border: "1px solid #FECACA", color: "#991B1B", fontSize: 13 }}>
                  ✕ Application Rejected. Reason: {selectedApp.rejectionReason}
                </div>
              )}

              {/* Reject Reason Form */}
              {showRejectInput && selectedApp.status === "pending" && (
                <div style={{ background: "#FFF1F2", padding: 14, borderRadius: 12, border: "1px solid #FECDD3" }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: "#9F1239", display: "block", marginBottom: 6 }}>REJECTION REASON</label>
                  <input
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder="Enter reason for rejection..."
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #FDA4AF", fontSize: 13, boxSizing: "border-box", marginBottom: 10 }}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setShowRejectInput(false)} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #FDA4AF", background: "#FFF", color: "#9F1239", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                    <button onClick={() => handleReject(selectedApp.id)} disabled={actionLoading} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#E11D48", color: "#FFF", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>Confirm Rejection</button>
                  </div>
                </div>
              )}

              {/* Action Buttons for Pending Requests */}
              {selectedApp.status === "pending" && !showRejectInput && (
                <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
                  <button
                    onClick={() => setShowRejectInput(true)}
                    disabled={actionLoading}
                    style={{ flex: 0.4, padding: "14px 0", borderRadius: 12, border: "1.5px solid #FCA5A5", background: "#FEF2F2", color: "#DC2626", fontSize: 14, fontWeight: 800, cursor: "pointer" }}
                  >
                    Reject Request
                  </button>
                  <button
                    onClick={() => handleApprove(selectedApp.id)}
                    disabled={actionLoading}
                    style={{ flex: 1, padding: "14px 0", borderRadius: 12, border: "none", background: "#10B981", color: "#FFF", fontSize: 14, fontWeight: 900, cursor: "pointer" }}
                  >
                    {actionLoading ? "Approving…" : "Approve & Issue POSP ID"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
