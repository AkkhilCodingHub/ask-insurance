"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { api } from "@/lib/api";
import {
  ShieldCheck,
  CheckCircle2,
  Upload,
  ArrowRight,
  Fingerprint,
  FileText,
  Car,
  CreditCard,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  validateAadhaar,
  validatePAN,
  validateRC,
  validateDrivingLicense,
  validateDocumentFile,
} from "@ask/shared";

interface DocSummaryItem {
  id: "aadhaar" | "pan" | "rc" | "driving_license";
  title: string;
  subtitle: string;
  isFetched: boolean;
  source: "digilocker" | "manual_upload" | "mparivahan" | null;
  docNumber: string | null;
  fileUrl: string | null;
  formatHint: string;
}

export default function KycPage() {
  const [docsSummary, setDocsSummary] = useState<DocSummaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDigiLockerLinked, setIsDigiLockerLinked] = useState(false);
  const [dlLoading, setDlLoading] = useState(false);

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.kyc.getDocumentsSummary();
      if (res && Array.isArray(res.documents)) {
        setDocsSummary(res.documents);
        setIsDigiLockerLinked(Boolean(res.isDigiLockerLinked));
      }
    } catch {
      setDocsSummary([
        { id: "aadhaar", title: "Aadhaar Card", subtitle: "12-Digit Unique Identification", isFetched: false, source: null, docNumber: null, fileUrl: null, formatHint: "12 digits (e.g. 2345 6789 0123)" },
        { id: "pan", title: "PAN Card", subtitle: "Permanent Account Number", isFetched: false, source: null, docNumber: null, fileUrl: null, formatHint: "10 alphanumeric (e.g. ABCDE1234F)" },
        { id: "rc", title: "Vehicle Registration (RC)", subtitle: "Vehicle Registration Certificate", isFetched: false, source: null, docNumber: null, fileUrl: null, formatHint: "e.g. DL01AB1234 or MH12DE1432" },
        { id: "driving_license", title: "Driving License", subtitle: "State Transport Department License", isFetched: false, source: null, docNumber: null, fileUrl: null, formatHint: "e.g. DL1420110012345" },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleDigiLockerConnect = async () => {
    setDlLoading(true);
    try {
      const res = await api.kyc.getDigiLockerDetails();
      if (res && res.isDigiLockerLinked) {
        setIsDigiLockerLinked(true);
        await loadDocuments();
      } else {
        alert("DigiLocker KYC initialized. Please complete authentication in the popup window.");
      }
    } catch (e: any) {
      alert(e?.message || "Could not connect to DigiLocker at this moment.");
    } finally {
      setDlLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "40px 16px 80px" }}>
        <div style={{ maxWidth: 880, margin: "0 auto" }}>
          {/* Header Breadcrumbs */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
            <Link href="/" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Home</Link>
            <span>/</span>
            <span style={{ color: "var(--primary)", fontWeight: 600 }}>Government KYC &amp; Document Verification</span>
          </div>

          {/* Intro Card */}
          <div
            style={{
              background: "white",
              borderRadius: 18,
              border: "1px solid var(--border)",
              padding: 28,
              marginBottom: 24,
              boxShadow: "0 2px 14px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: "var(--primary-light)",
                    color: "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <ShieldCheck size={26} />
                </div>
                <div>
                  <h1 style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", margin: 0 }}>
                    Government KYC &amp; Document Verification
                  </h1>
                  <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "4px 0 0" }}>
                    Auto-fetch official Aadhaar, PAN, Vehicle RC, and Driving License via DigiLocker. Any document not linked can be uploaded with number validation.
                  </p>
                </div>
              </div>

              <button
                onClick={handleDigiLockerConnect}
                disabled={dlLoading}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 18px",
                  background: isDigiLockerLinked ? "#10B981" : "var(--primary)",
                  color: "white",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 800,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {dlLoading ? <Loader2 size={16} className="animate-spin" /> : <Fingerprint size={16} />}
                {isDigiLockerLinked ? "DigiLocker Connected ✓" : "Connect DigiLocker"}
              </button>
            </div>
          </div>

          {/* 4 Document Verification Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ fontSize: 14, fontWeight: 800, color: "var(--text-muted)", letterSpacing: 0.5, margin: 0, textTransform: "uppercase" }}>
                Mandatory KYC &amp; Policyholder Documents (4 Slots)
              </h2>
              {loading && <RefreshCw size={14} className="animate-spin" style={{ color: "var(--primary)" }} />}
            </div>

            {docsSummary.map((doc) => (
              <WebDocumentSlot key={doc.id} doc={doc} onReload={loadDocuments} />
            ))}
          </div>

          <div style={{ textAlign: "center" }}>
            <Link
              href="/quote"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "14px 32px",
                background: "var(--primary)",
                color: "white",
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 800,
                textDecoration: "none",
                boxShadow: "0 4px 14px rgba(21,128,255,0.3)",
              }}
            >
              Continue to Insurance Quotes <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

function WebDocumentSlot({ doc, onReload }: { doc: DocSummaryItem; onReload: () => Promise<void> }) {
  const [expanded, setExpanded] = useState(!doc.isFetched);
  const [docNumber, setDocNumber] = useState(doc.docNumber || "");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getDocIcon = () => {
    switch (doc.id) {
      case "aadhaar": return <Fingerprint size={20} />;
      case "pan": return <CreditCard size={20} />;
      case "rc": return <Car size={20} />;
      case "driving_license": return <FileText size={20} />;
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDocNumber(val);
    setError(null);
    if (!val.trim()) return;

    let res;
    if (doc.id === "aadhaar") res = validateAadhaar(val);
    else if (doc.id === "pan") res = validatePAN(val);
    else if (doc.id === "rc") res = validateRC(val);
    else if (doc.id === "driving_license") res = validateDrivingLicense(val);

    if (res && !res.isValid) {
      setError(res.error || "Invalid number format");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      const val = validateDocumentFile({
        mimetype: selected.type,
        size: selected.size,
        name: selected.name,
      });

      if (!val.isValid) {
        alert(val.error || "Please select a valid image or PDF (<10MB).");
        return;
      }
      setFile(selected);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let numRes;
    if (doc.id === "aadhaar") numRes = validateAadhaar(docNumber);
    else if (doc.id === "pan") numRes = validatePAN(docNumber);
    else if (doc.id === "rc") numRes = validateRC(docNumber);
    else if (doc.id === "driving_license") numRes = validateDrivingLicense(docNumber);

    if (numRes && !numRes.isValid) {
      setError(numRes.error || `Please enter a correct ${doc.title} number.`);
      return;
    }

    if (!file) {
      setError(`Please upload a clear copy of your ${doc.title}.`);
      return;
    }

    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("docType", doc.id);
      form.append("docNumber", docNumber);
      form.append("document", file);

      const res = await api.kyc.submitDocument(form);
      if (res && res.success) {
        alert(`${doc.title} verified and recorded successfully.`);
        await onReload();
        setExpanded(false);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to submit document. Please check the document details and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        background: "white",
        borderRadius: 16,
        border: `1.5px solid ${doc.isFetched ? "#10B981" : "var(--border)"}`,
        overflow: "hidden",
        boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
      }}
    >
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          cursor: "pointer",
          background: doc.isFetched ? "rgba(16, 185, 129, 0.04)" : "white",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: doc.isFetched ? "#ECFDF5" : "var(--primary-light)",
              color: doc.isFetched ? "#059669" : "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {getDocIcon()}
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: "var(--text)" }}>{doc.title}</span>
              {doc.isFetched ? (
                <span style={{ fontSize: 10, fontWeight: 800, color: "#059669", background: "#ECFDF5", padding: "2px 8px", borderRadius: 6, border: "1px solid #A7F3D0" }}>
                  {doc.source === "digilocker" ? "DIGILOCKER VERIFIED ✓" : "VERIFIED ✓"}
                </span>
              ) : (
                <span style={{ fontSize: 10, fontWeight: 800, color: "#D97706", background: "#FEF3C7", padding: "2px 8px", borderRadius: 6, border: "1px solid #FDE68A" }}>
                  NOT IN DIGILOCKER · UPLOAD
                </span>
              )}
            </div>
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "2px 0 0" }}>
              {doc.isFetched && doc.docNumber ? `Number: ${doc.docNumber}` : doc.subtitle}
            </p>
          </div>
        </div>

        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)" }}>
          {expanded ? "Hide Details ▲" : (doc.isFetched ? "View Details ▼" : "Enter & Upload ▼")}
        </span>
      </div>

      {expanded && (
        <div style={{ padding: 20, borderTop: "1px solid var(--border)", background: "var(--bg)" }}>
          {doc.isFetched ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 12, background: "#ECFDF5", borderRadius: 10, color: "#065F46", fontSize: 13, fontWeight: 600 }}>
              <CheckCircle2 size={18} color="#059669" />
              <span>This document has been verified and registered with your active insurance profile.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
                DigiLocker was unable to auto-fetch this document. Please enter your valid {doc.title} number and upload a clear document image (JPG, PNG) or PDF.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--text)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.4 }}>
                    {doc.title} Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={docNumber}
                    onChange={handleNumberChange}
                    placeholder={doc.formatHint}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: `1.5px solid ${error ? "#DC2626" : (docNumber.trim() ? "#10B981" : "var(--border)")}`,
                      fontSize: 13,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      boxSizing: "border-box",
                      background: "white",
                    }}
                  />
                  {error && <p style={{ fontSize: 11, color: "#DC2626", fontWeight: 700, margin: "4px 0 0" }}>{error}</p>}
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--text)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.4 }}>
                    Upload Document Copy (JPG, PNG, PDF &lt; 10MB) *
                  </label>
                  <input
                    type="file"
                    required
                    accept=".jpg,.jpeg,.png,.webp,.pdf"
                    onChange={handleFileChange}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 10,
                      border: "1.5px dashed var(--primary)",
                      background: "white",
                      fontSize: 12,
                      boxSizing: "border-box",
                    }}
                  />
                  {file && <p style={{ fontSize: 11, color: "#059669", fontWeight: 700, margin: "4px 0 0" }}>Selected: {file.name} ({(file.size / 1024).toFixed(0)} KB)</p>}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !docNumber.trim() || !file || Boolean(error)}
                style={{
                  alignSelf: "flex-start",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 22px",
                  background: (submitting || !docNumber.trim() || !file || Boolean(error)) ? "#9CA3AF" : "var(--primary)",
                  color: "white",
                  borderRadius: 10,
                  border: "none",
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: (submitting || !docNumber.trim() || !file || Boolean(error)) ? "not-allowed" : "pointer",
                }}
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                Verify &amp; Save {doc.title}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
