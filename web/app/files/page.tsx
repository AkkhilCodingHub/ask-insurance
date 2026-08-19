"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Folder,
  FileText,
  Upload,
  Download,
  Trash2,
  Share2,
  Shield,
  Eye,
  Plus,
  CheckCircle2,
  Lock,
} from "lucide-react";

interface LockerFile {
  id: string;
  name: string;
  category: "Vehicle RC" | "Driving License" | "Policy Copy" | "Medical Report" | "Identity KYC";
  size: string;
  uploadDate: string;
}

const INITIAL_FILES: LockerFile[] = [
  {
    id: "DOC-1",
    name: "Hyundai_Creta_RC_Card.pdf",
    category: "Vehicle RC",
    size: "1.4 MB",
    uploadDate: "15 Aug 2026",
  },
  {
    id: "DOC-2",
    name: "Driving_License_Akkhil.pdf",
    category: "Driving License",
    size: "820 KB",
    uploadDate: "15 Aug 2026",
  },
  {
    id: "DOC-3",
    name: "HDFC_Optima_Policy_Schedule_2025.pdf",
    category: "Policy Copy",
    size: "2.1 MB",
    uploadDate: "01 Jan 2026",
  },
  {
    id: "DOC-4",
    name: "Aadhaar_Card_Verified.pdf",
    category: "Identity KYC",
    size: "650 KB",
    uploadDate: "18 Aug 2026",
  },
];

export default function DigitalFilesLockerPage() {
  const [files, setFiles] = useState<LockerFile[]>(INITIAL_FILES);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const filtered = files.filter(
    (f) => selectedCategory === "All" || f.category === selectedCategory
  );

  const handleDelete = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "40px 16px 80px" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto" }}>
        {/* Header Breadcrumb */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>
              <Link href="/" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Home</Link>
              <span>/</span>
              <span style={{ color: "var(--primary)", fontWeight: 600 }}>Digital Document Locker</span>
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--text)", margin: 0 }}>
              Digital Insurance Document Locker
            </h1>
          </div>

          <button
            onClick={() => alert("Upload Modal: Select file from your computer (RC, DL, Health Card, PAN)...")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              background: "var(--primary)",
              color: "white",
              borderRadius: 10,
              border: "none",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(21,128,255,0.3)",
            }}
          >
            <Upload size={16} /> Upload New Document
          </button>
        </div>

        {/* Security Banner */}
        <div
          style={{
            background: "white",
            borderRadius: 14,
            border: "1px solid var(--border)",
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 24,
            color: "var(--text)",
            fontSize: 13,
          }}
        >
          <Lock size={20} style={{ color: "var(--success)" }} />
          <span>
            <strong>DigiLocker & Cloud Encrypted:</strong> All uploaded vehicle documents, policies, and health records are stored with 256-bit AES encryption for 1-click claim settlement.
          </span>
        </div>

        {/* Category Filter Pills */}
        <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
          {["All", "Vehicle RC", "Driving License", "Policy Copy", "Identity KYC", "Medical Report"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: "8px 16px",
                borderRadius: 20,
                border: selectedCategory === cat ? "1px solid var(--primary)" : "1px solid var(--border)",
                background: selectedCategory === cat ? "var(--primary)" : "white",
                color: selectedCategory === cat ? "white" : "var(--text)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Files Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
          {filtered.map((file) => (
            <div
              key={file.id}
              style={{
                background: "white",
                borderRadius: 14,
                border: "1px solid var(--border)",
                padding: 20,
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: "var(--primary-light)",
                      color: "var(--primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FileText size={22} />
                  </div>
                  <span style={{ fontSize: 10, background: "var(--bg)", padding: "3px 8px", borderRadius: 6, fontWeight: 700, color: "var(--text-muted)" }}>
                    {file.category}
                  </span>
                </div>

                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 4, wordBreak: "break-word" }}>
                  {file.name}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {file.size} • {file.uploadDate}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 18, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                <button
                  onClick={() => alert(`Downloading ${file.name}...`)}
                  style={{
                    flex: 1,
                    padding: "6px",
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                  }}
                >
                  <Download size={13} /> Download
                </button>
                <button
                  onClick={() => handleDelete(file.id)}
                  style={{
                    padding: "6px 10px",
                    background: "white",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    color: "var(--error)",
                    cursor: "pointer",
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
