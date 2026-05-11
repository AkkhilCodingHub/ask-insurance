"use client";

import { useState, useEffect } from "react";
import { Shield, CheckCircle, XCircle, Clock, Eye, ChevronDown, X, FileText, User } from "lucide-react";
import { adminApi, KycSubmission } from "@/lib/api";

const DOC_LABELS: Record<string, string> = {
  aadhaar:         "Aadhaar Card",
  driving_license: "Driving Licence",
  passport:        "Passport",
};

const STATUS_TABS = [
  { key: "submitted", label: "Pending Review" },
  { key: "verified",  label: "Approved" },
  { key: "rejected",  label: "Rejected" },
] as const;

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; icon: any }> = {
    submitted: { bg: "#FFFBEB", color: "#D97706", icon: <Clock size={12} /> },
    verified:  { bg: "#ECFDF5", color: "#059669", icon: <CheckCircle size={12} /> },
    rejected:  { bg: "#FEF2F2", color: "#DC2626", icon: <XCircle size={12} /> },
    pending:   { bg: "#F3F4F6", color: "#6B7280", icon: <Clock size={12} /> },
  };
  const s = map[status] ?? map.pending;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 100, background: s.bg, color: s.color, textTransform: "capitalize" }}>
      {s.icon}{status === "submitted" ? "Pending" : status}
    </span>
  );
}

function RejectModal({ onConfirm, onCancel }: { onConfirm: (reason: string) => void; onCancel: () => void }) {
  const [reason, setReason] = useState("");
  const presets = [
    "Document is blurry or unreadable.",
    "Document appears to be expired.",
    "Name on document does not match account.",
    "Wrong document type uploaded.",
    "Document is not a government-issued ID.",
  ];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(2px)" }} onClick={onCancel} />
      <div style={{ position: "relative", background: "#fff", borderRadius: 16, padding: 28, width: 440, maxWidth: "90vw", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>Reject KYC Submission</h3>
          <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}>
            <X size={20} />
          </button>
        </div>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 14 }}>Select a preset or write a custom rejection reason:</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
          {presets.map(p => (
            <button
              key={p}
              onClick={() => setReason(p)}
              style={{
                textAlign: "left", padding: "8px 12px", borderRadius: 8, fontSize: 13, cursor: "pointer",
                background: reason === p ? "var(--primary-light)" : "var(--bg)",
                border: `1.5px solid ${reason === p ? "var(--primary)" : "var(--border)"}`,
                color: reason === p ? "var(--primary)" : "var(--text)",
                fontWeight: reason === p ? 700 : 400,
              }}
            >
              {p}
            </button>
          ))}
        </div>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Or type a custom reason…"
          rows={3}
          style={{
            width: "100%", padding: "10px 12px", borderRadius: 8,
            border: "1.5px solid var(--border)", fontSize: 13, color: "var(--text)",
            resize: "vertical", fontFamily: "inherit", outline: "none",
            background: "var(--bg)", boxSizing: "border-box",
          }}
        />
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "1.5px solid var(--border)", background: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--text-muted)" }}>
            Cancel
          </button>
          <button
            onClick={() => reason.trim() && onConfirm(reason.trim())}
            disabled={!reason.trim()}
            style={{
              flex: 1, padding: "10px", borderRadius: 8, border: "none",
              background: reason.trim() ? "#DC2626" : "var(--border)",
              color: reason.trim() ? "#fff" : "var(--text-muted)",
              cursor: reason.trim() ? "pointer" : "not-allowed",
              fontSize: 13, fontWeight: 700,
            }}
          >
            Reject Submission
          </button>
        </div>
      </div>
    </div>
  );
}

function DocViewer({ url, docType }: { url: string; docType: string | null }) {
  const isPdf = url.toLowerCase().endsWith(".pdf") || url.includes("application/pdf");
  return (
    <div style={{ borderRadius: 10, overflow: "hidden", background: "var(--bg)", border: "1px solid var(--border)", marginBottom: 16 }}>
      {isPdf ? (
        <div style={{ padding: "20px", textAlign: "center" }}>
          <FileText size={40} color="var(--primary)" style={{ marginBottom: 8 }} />
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 10 }}>PDF document</p>
          <a href={url} target="_blank" rel="noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, background: "var(--primary)", color: "#fff", textDecoration: "none", fontSize: 13, fontWeight: 700 }}>
            <Eye size={14} /> Open PDF
          </a>
        </div>
      ) : (
        <div style={{ position: "relative" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={docType ?? "KYC document"} style={{ width: "100%", maxHeight: 320, objectFit: "contain", display: "block", background: "#f8fafc" }} />
          <a href={url} target="_blank" rel="noreferrer"
            style={{ position: "absolute", top: 8, right: 8, display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 6, background: "rgba(0,0,0,0.6)", color: "#fff", textDecoration: "none", fontSize: 11, fontWeight: 700 }}>
            <Eye size={12} /> Full size
          </a>
        </div>
      )}
    </div>
  );
}

function SubmissionDrawer({
  submission,
  onClose,
  onApprove,
  onReject,
}: {
  submission: KycSubmission;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex" }}>
      <div style={{ flex: 1, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(2px)" }} onClick={onClose} />
      <div className="side-drawer" style={{ width: 520, background: "#fff", height: "100%", overflowY: "auto", display: "flex", flexDirection: "column", boxShadow: "-8px 0 32px rgba(0,0,0,0.15)", animation: "slideIn 0.3s ease-out" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "#fff", zIndex: 10 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>KYC Review</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ flex: 1, padding: "24px" }}>
          {/* User info */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, padding: "14px", background: "var(--bg)", borderRadius: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 16, fontWeight: 800, flexShrink: 0 }}>
              {(submission.name ?? submission.phone).slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 800, color: "var(--text)" }}>{submission.name ?? submission.phone}</p>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>+91 {submission.phone} {submission.email ? `· ${submission.email}` : ""}</p>
            </div>
            <div style={{ marginLeft: "auto" }}>
              <StatusBadge status={submission.kycStatus} />
            </div>
          </div>

          {/* Document info */}
          <div style={{ marginBottom: 16, display: "flex", gap: 10 }}>
            <div style={{ flex: 1, padding: "12px", background: "var(--bg)", borderRadius: 10 }}>
              <p style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.04em" }}>Document Type</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{DOC_LABELS[submission.kycDocType ?? ""] ?? submission.kycDocType ?? "—"}</p>
            </div>
            <div style={{ flex: 1, padding: "12px", background: "var(--bg)", borderRadius: 10 }}>
              <p style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.04em" }}>Submitted</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
                {submission.kycSubmittedAt ? new Date(submission.kycSubmittedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
              </p>
            </div>
          </div>

          {/* Document preview */}
          {submission.kycDocUrl && <DocViewer url={submission.kycDocUrl} docType={submission.kycDocType} />}

          {/* Rejection reason (if already rejected) */}
          {submission.kycRejectionReason && (
            <div style={{ padding: "12px 14px", background: "#FEF2F2", borderRadius: 10, borderLeft: "3px solid #DC2626", marginBottom: 16 }}>
              <p style={{ fontSize: 11, color: "#DC2626", fontWeight: 700, marginBottom: 4 }}>Rejection Reason</p>
              <p style={{ fontSize: 13, color: "#7F1D1D" }}>{submission.kycRejectionReason}</p>
            </div>
          )}

          {submission.kycVerifiedAt && (
            <div style={{ padding: "12px 14px", background: "#ECFDF5", borderRadius: 10, borderLeft: "3px solid #059669", marginBottom: 16 }}>
              <p style={{ fontSize: 11, color: "#059669", fontWeight: 700, marginBottom: 4 }}>Approved On</p>
              <p style={{ fontSize: 13, color: "#065F46" }}>{new Date(submission.kycVerifiedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
            </div>
          )}
        </div>

        {/* Action footer — only for pending */}
        {submission.kycStatus === "submitted" && (
          <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)", display: "flex", gap: 10 }}>
            <button
              onClick={() => onReject(submission.id)}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", background: "#FEF2F2", border: "1.5px solid #FCA5A5", borderRadius: 10, color: "#DC2626", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              <XCircle size={16} /> Reject
            </button>
            <button
              onClick={() => onApprove(submission.id)}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", background: "#059669", border: "none", borderRadius: 10, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              <CheckCircle size={16} /> Approve
            </button>
          </div>
        )}

        <style>{`
          @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
          @media (max-width: 768px) { .side-drawer { width: 100% !important; } }
        `}</style>
      </div>
    </div>
  );
}

export default function KycPage() {
  const [activeTab, setActiveTab] = useState<"submitted" | "verified" | "rejected">("submitted");
  const [submissions, setSubmissions] = useState<KycSubmission[]>([]);
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState<KycSubmission | null>(null);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = async (status: string) => {
    setLoading(true);
    try {
      const resp = await adminApi.getKycSubmissions(status);
      setSubmissions(resp.submissions);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(activeTab); }, [activeTab]);

  const handleApprove = async (userId: string) => {
    setActionLoading(true);
    try {
      await adminApi.approveKyc(userId);
      setSelected(null);
      load(activeTab);
    } catch (e: any) {
      alert(e?.message ?? "Failed to approve");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (reason: string) => {
    if (!rejectTarget) return;
    setActionLoading(true);
    try {
      await adminApi.rejectKyc(rejectTarget, reason);
      setRejectTarget(null);
      setSelected(null);
      load(activeTab);
    } catch (e: any) {
      alert(e?.message ?? "Failed to reject");
    } finally {
      setActionLoading(false);
    }
  };

  const pendingCount = activeTab === "submitted" ? submissions.length : 0;

  return (
    <div style={{ width: "100%" }}>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Shield size={20} color="var(--primary)" />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em" }}>KYC Review</h1>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Review and approve user identity documents</p>
          </div>
        </div>
        {activeTab === "submitted" && submissions.length > 0 && (
          <span style={{ fontSize: 12, fontWeight: 800, padding: "4px 12px", borderRadius: 100, background: "#FFFBEB", color: "#D97706", border: "1px solid #FDE68A" }}>
            {submissions.length} pending
          </span>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, background: "var(--bg)", borderRadius: 10, padding: 4, marginBottom: 20, width: "fit-content", border: "1px solid var(--border)" }}>
        {STATUS_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: "7px 18px", borderRadius: 8, border: "none", cursor: "pointer",
              background: activeTab === tab.key ? "#fff" : "transparent",
              color: activeTab === tab.key ? "var(--text)" : "var(--text-muted)",
              fontSize: 13, fontWeight: activeTab === tab.key ? 700 : 500,
              boxShadow: activeTab === tab.key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 24px", color: "var(--text-muted)", fontSize: 13 }}>Loading…</div>
      ) : submissions.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 24px", color: "var(--text-muted)" }}>
          <Shield size={40} color="var(--border)" style={{ marginBottom: 10 }} />
          <p style={{ fontWeight: 600, marginBottom: 4 }}>No {activeTab === "submitted" ? "pending" : activeTab} submissions</p>
          <p style={{ fontSize: 12 }}>{activeTab === "submitted" ? "All KYC submissions have been reviewed." : "Nothing here yet."}</p>
        </div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--bg)" }}>
                {["User", "Document", "Submitted", "Status", ""].map(h => (
                  <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {submissions.map(sub => (
                <tr key={sub.id} style={{ borderTop: "1px solid var(--border)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--bg)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)" }}>{(sub.name ?? sub.phone).slice(0, 2).toUpperCase()}</span>
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{sub.name ?? sub.phone}</p>
                        <p style={{ fontSize: 11, color: "var(--text-muted)" }}>+91 {sub.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{DOC_LABELS[sub.kycDocType ?? ""] ?? sub.kycDocType ?? "—"}</p>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                    {sub.kycSubmittedAt ? new Date(sub.kycSubmittedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—"}
                  </td>
                  <td style={{ padding: "14px 16px" }}><StatusBadge status={sub.kycStatus} /></td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => setSelected(sub)}
                        style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", background: "var(--primary-light)", border: "none", borderRadius: 7, color: "var(--primary)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                        <Eye size={13} /> Review
                      </button>
                      {sub.kycStatus === "submitted" && (
                        <>
                          <button onClick={() => handleApprove(sub.id)} disabled={actionLoading}
                            style={{ padding: "6px 12px", background: "#ECFDF5", border: "none", borderRadius: 7, color: "#059669", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                            ✓
                          </button>
                          <button onClick={() => setRejectTarget(sub.id)} disabled={actionLoading}
                            style={{ padding: "6px 12px", background: "#FEF2F2", border: "none", borderRadius: 7, color: "#DC2626", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                            ✗
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <SubmissionDrawer
          submission={selected}
          onClose={() => setSelected(null)}
          onApprove={id => { setSelected(null); handleApprove(id); }}
          onReject={id => { setRejectTarget(id); }}
        />
      )}

      {rejectTarget && (
        <RejectModal
          onConfirm={handleReject}
          onCancel={() => setRejectTarget(null)}
        />
      )}
    </div>
  );
}
