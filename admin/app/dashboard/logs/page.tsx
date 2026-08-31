"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { ClipboardList, RefreshCw, Clock, User } from "lucide-react";

interface ActivityLog {
  id: string;
  adminId: string;
  action: string;
  details: any;
  createdAt: string;
  admin?: {
    name: string;
    email: string;
    role: string;
  };
}

export default function LogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadLogs() {
    setLoading(true);
    setError(null);
    try {
      const logsData = await adminApi.getActivityLogs();
      setLogs(logsData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load activity logs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, []);

  function fmtDate(s: string) {
    return new Date(s).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  }

  function getActionColor(action: string) {
    if (action.includes("CREATE")) return { bg: "#ECFDF5", text: "#059669" };
    if (action.includes("DELETE")) return { bg: "#FEF2F2", text: "#DC2626" };
    if (action.includes("UPDATE")) return { bg: "#EFF6FF", text: "#1D4ED8" };
    if (action.includes("KYC")) return { bg: "#F5F3FF", text: "#7C3AED" };
    if (action.includes("BROKERAGE")) return { bg: "#FFFBEB", text: "#D97706" };
    return { bg: "#F1F5F9", text: "#475569" };
  }

  return (
    <div style={{ padding: 32, minHeight: "100vh", background: "#F8FAFC" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "#EDE9FE", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ClipboardList size={20} color="#6D28D9" />
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: "#0F172A", margin: 0, letterSpacing: -0.5 }}>System Activity Audit</h1>
          </div>
          <p style={{ color: "#64748B", fontSize: 14, margin: 0 }}>Review administrative changes, KYC approvals, and brokerage updates.</p>
        </div>
        <button onClick={loadLogs}
          style={{ display: "flex", alignItems: "center", gap: 7, padding: "11px 16px", background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 12, color: "#64748B", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 10, color: "#DC2626", fontSize: 13, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* Logs Table */}
      <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #E2E8F0", padding: 24 }}>
        <div style={{ overflowX: "auto" }}>
          {logs.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center", color: "#94A3B8", fontSize: 13 }}>No activity logs recorded yet. Administrative events will appear here.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1.5px solid #E2E8F0" }}>
                  {["Timestamp", "User / Admin", "Action", "Audit Details"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#94A3B8" }}>{h.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map(log => {
                  const colors = getActionColor(log.action);
                  return (
                    <tr key={log.id} style={{ borderBottom: "1px solid #F1F5F9" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#FAFAFA")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <td style={{ padding: "14px 16px", fontSize: 13, color: "#64748B", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Clock size={13} />
                          {fmtDate(log.createdAt)}
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        {log.admin ? (
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", margin: 0, display: "flex", alignItems: "center", gap: 5 }}>
                              <User size={13} color="#64748B" />
                              {log.admin.name}
                            </p>
                            <p style={{ fontSize: 11, color: "#94A3B8", margin: 0 }}>{log.admin.email} ({log.admin.role})</p>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: "#94A3B8", fontStyle: "italic" }}>System / Unknown</span>
                        )}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 100, background: colors.bg, color: colors.text, fontStyle: "normal" }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        {log.details ? (
                          <pre style={{ margin: 0, fontSize: 11, background: "#F8FAFC", border: "1px solid #E2E8F0", padding: "8px 12px", borderRadius: 8, fontFamily: "monospace", overflowX: "auto", maxWidth: 450, color: "#334155" }}>
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        ) : (
                          <span style={{ fontSize: 12, color: "#94A3B8", fontStyle: "italic" }}>No details available</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
