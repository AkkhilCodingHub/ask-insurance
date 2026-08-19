"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  Upload,
  Camera,
  FileCheck,
  AlertCircle,
  ArrowRight,
  Fingerprint,
} from "lucide-react";
import { useAuth } from "@/context/auth";

export default function KycPage() {
  const { user } = useAuth();

  const [pan, setPan] = useState("ABCDE1234F");
  const [aadhaar, setAadhaar] = useState("4589 1234 9876");
  const [dob, setDob] = useState("15/08/1998");
  const [fatherName, setFatherName] = useState("Rajesh Sharma");
  const [kycStatus, setKycStatus] = useState<"pending" | "verifying" | "verified">("pending");
  const [uploadedPan, setUploadedPan] = useState<string | null>("pan_card_front.jpg");
  const [uploadedAadhaar, setUploadedAadhaar] = useState<string | null>("aadhaar_front.jpg");

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setKycStatus("verifying");
    setTimeout(() => {
      setKycStatus("verified");
    }, 1800);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "40px 16px 80px" }}>
      <div style={{ maxWidth: 840, margin: "0 auto" }}>
        {/* Header Breadcrumbs */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
          <Link href="/" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Home</Link>
          <span>/</span>
          <span style={{ color: "var(--primary)", fontWeight: 600 }}>Central KYC (CKYC) Verification</span>
        </div>

        <div style={{ background: "white", borderRadius: 20, border: "1px solid var(--border)", padding: 36, boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid var(--border)", paddingBottom: 20, marginBottom: 28 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <ShieldCheck size={28} style={{ color: "var(--primary)" }} />
                <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text)", margin: 0 }}>
                  Mandatory IRDAI CKYC Verification
                </h1>
              </div>
              <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0 }}>
                As mandated by IRDAI, all general and life insurance purchases require verified Central KYC.
              </p>
            </div>

            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 700,
                background: kycStatus === "verified" ? "var(--success-light)" : "var(--primary-light)",
                color: kycStatus === "verified" ? "var(--success)" : "var(--primary)",
              }}
            >
              {kycStatus === "verified" ? "✓ Verified & Compliant" : "Verification Required"}
            </span>
          </div>

          {kycStatus === "verified" ? (
            <div style={{ textAlign: "center", padding: "30px 20px" }}>
              <div
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: "50%",
                  background: "var(--success-light)",
                  color: "var(--success)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <CheckCircle2 size={40} />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>
                Your CKYC is Fully Verified!
              </h2>
              <p style={{ fontSize: 14, color: "var(--text-muted)", maxWidth: 520, margin: "0 auto 24px" }}>
                CKYC Number: <strong style={{ fontFamily: "monospace", color: "var(--primary)" }}>CKYC-7497007881-2026</strong>. You can now buy and renew any insurance policy with 100% instant paperless issuance.
              </p>
              <Link
                href="/quote"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 28px",
                  background: "var(--primary)",
                  color: "white",
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 14,
                  textDecoration: "none",
                }}
              >
                Explore Insurance Plans →
              </Link>
            </div>
          ) : (
            <form onSubmit={handleVerify}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 24 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>PAN Card Number</label>
                  <input
                    type="text"
                    required
                    value={pan}
                    onChange={(e) => setPan(e.target.value.toUpperCase())}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", textTransform: "uppercase" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Aadhaar Card Number</label>
                  <input
                    type="text"
                    required
                    value={aadhaar}
                    onChange={(e) => setAadhaar(e.target.value)}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Date of Birth (as on Aadhaar)</label>
                  <input
                    type="text"
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Father's / Spouse Name</label>
                  <input
                    type="text"
                    required
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)" }}
                  />
                </div>
              </div>

              {/* Upload Documents Box */}
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 12 }}>
                Upload Identity Documents (Optional if CKYC Registry found)
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
                <div style={{ border: "2px dashed var(--border)", borderRadius: 12, padding: 20, textAlign: "center", background: "var(--bg)" }}>
                  <Upload size={24} style={{ color: "var(--primary)", margin: "0 auto 8px" }} />
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>PAN Card Front Image</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{uploadedPan || "JPG, PNG or PDF (< 5MB)"}</div>
                </div>
                <div style={{ border: "2px dashed var(--border)", borderRadius: 12, padding: 20, textAlign: "center", background: "var(--bg)" }}>
                  <Fingerprint size={24} style={{ color: "var(--primary)", margin: "0 auto 8px" }} />
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Aadhaar Front / Digilocker</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{uploadedAadhaar || "Connect Digilocker XML"}</div>
                </div>
              </div>

              <button
                type="submit"
                disabled={kycStatus === "verifying"}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: "var(--primary)",
                  color: "white",
                  borderRadius: 10,
                  border: "none",
                  fontWeight: 800,
                  fontSize: 15,
                  cursor: kycStatus === "verifying" ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 14px rgba(21,128,255,0.35)",
                }}
              >
                {kycStatus === "verifying" ? "Verifying with CERSAI CKYC Registry..." : "Verify CKYC Instantly →"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
