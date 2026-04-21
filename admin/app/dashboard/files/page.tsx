"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Upload, Trash2, Download, RefreshCw, HardDrive, File, Image, FileText } from "lucide-react";
import { adminApi, type AdminFile } from "@/lib/api";

const QUOTA_BYTES = 10 * 1024 * 1024 * 1024; // 10 GB

function fmtBytes(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  if (bytes >= 1024)      return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function fileIcon(mime: string): React.ReactNode {
  if (mime.startsWith("image/")) return <Image size={16} color="#7C3AED" />;
  if (mime === "application/pdf") return <FileText size={16} color="#DC2626" />;
  return <File size={16} color="#64748B" />;
}

export default function FilesPage() {
  const [files, setFiles]           = useState<AdminFile[]>([]);
  const [total, setTotal]           = useState(0);
  const [storageUsed, setUsed]      = useState(0);
  const [loading, setLoading]       = useState(true);
  const [uploading, setUploading]   = useState(false);
  const [uploadProgress, setProgress] = useState(0);
  const [error, setError]           = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getFiles(1, 100);
      setFiles(res.files);
      setTotal(res.total);
      setUsed(res.storageUsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load files");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { setError("File too large — max 50 MB per upload"); return; }

    setUploading(true);
    setProgress(0);
    setError(null);

    // Simulate progress during upload
    const interval = setInterval(() => setProgress(p => Math.min(p + 10, 90)), 300);
    try {
      await adminApi.uploadFile(file);
      setProgress(100);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      clearInterval(interval);
      setUploading(false);
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this file? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await adminApi.deleteFile(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  const usedPct = Math.min(100, (storageUsed / QUOTA_BYTES) * 100);
  const gaugeColor = usedPct > 90 ? "#EF4444" : usedPct > 70 ? "#F59E0B" : "#1580FF";

  return (
    <div style={{ width: "100%", maxWidth: 960 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 2 }}>
            File Storage
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
            {total} file{total !== 1 ? "s" : ""} · {fmtBytes(storageUsed)} of 10 GB used
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={load} disabled={loading}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 14px", background: "var(--bg)", border: "1.5px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: 13, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }}>
            <RefreshCw size={14} style={{ animation: loading ? "spin 0.8s linear infinite" : "none" }} /> Refresh
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", background: "var(--primary)", border: "none", borderRadius: 10, color: "#fff", fontSize: 13, fontWeight: 600, cursor: uploading ? "not-allowed" : "pointer", opacity: uploading ? 0.7 : 1 }}>
            <Upload size={15} /> {uploading ? `Uploading… ${uploadProgress}%` : "Upload File"}
          </button>
          <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={handleUpload} />
        </div>
      </div>

      {/* Storage gauge */}
      <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 22px", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <HardDrive size={16} color="var(--text-muted)" />
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Storage Quota</span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: gaugeColor }}>
            {fmtBytes(storageUsed)} / 10 GB ({usedPct.toFixed(1)}%)
          </span>
        </div>
        <div style={{ height: 8, background: "var(--bg)", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${usedPct}%`, background: gaugeColor, borderRadius: 4, transition: "width 0.4s ease" }} />
        </div>
        <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>
          {fmtBytes(QUOTA_BYTES - storageUsed)} remaining · Max 50 MB per file
        </p>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 10, color: "#DC2626", fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Upload progress bar */}
      {uploading && (
        <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 18px", marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>Uploading…</p>
          <div style={{ height: 6, background: "var(--bg)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${uploadProgress}%`, background: "var(--primary)", borderRadius: 3, transition: "width 0.3s" }} />
          </div>
        </div>
      )}

      {/* File list */}
      <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-muted)" }}>Loading files…</div>
        ) : files.length === 0 ? (
          <div style={{ padding: "64px 24px", textAlign: "center" }}>
            <HardDrive size={40} color="var(--border)" style={{ marginBottom: 12 }} />
            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>No files yet</p>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Upload photos, PDFs, or any document up to 50 MB.</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--bg)" }}>
                {["File", "Type", "Size", "Uploaded", ""].map(h => (
                  <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {files.map(f => (
                <tr key={f.id}
                  style={{ borderTop: "1px solid var(--border)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--bg)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {fileIcon(f.mimeType)}
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {f.name}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "13px 16px", fontSize: 12, color: "var(--text-muted)" }}>
                    {f.mimeType.split("/")[1]?.toUpperCase() ?? f.mimeType}
                  </td>
                  <td style={{ padding: "13px 16px", fontSize: 13, color: "var(--text)", fontVariantNumeric: "tabular-nums" }}>
                    {fmtBytes(f.size)}
                  </td>
                  <td style={{ padding: "13px 16px", fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                    {fmtDate(f.createdAt)}
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      <a href={f.url} target="_blank" rel="noreferrer"
                        style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", background: "var(--bg)", border: "1.5px solid var(--border)", borderRadius: 7, color: "var(--text)", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                        <Download size={12} /> Download
                      </a>
                      <button
                        onClick={() => handleDelete(f.id)}
                        disabled={deletingId === f.id}
                        style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", background: "#FEF2F2", border: "1.5px solid #FECACA", borderRadius: 7, color: "#DC2626", fontSize: 12, fontWeight: 600, cursor: deletingId === f.id ? "not-allowed" : "pointer", opacity: deletingId === f.id ? 0.6 : 1 }}>
                        <Trash2 size={12} /> {deletingId === f.id ? "…" : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
