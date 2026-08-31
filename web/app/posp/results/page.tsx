"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  CheckCircle2,
  XCircle,
  Download,
  ArrowRight,
  Shield,
} from "lucide-react";
import { useAuth } from "@/context/auth";

export default function PospResultsPage() {
  return (
    <Suspense fallback={<div style={{ padding: "80px 20px", textAlign: "center" }}>Loading Results...</div>}>
      <PospResultsContent />
    </Suspense>
  );
}

function PospResultsContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const score = parseInt(searchParams.get("score") || "90", 10);
  const correct = parseInt(searchParams.get("correct") || "9", 10);
  const total = parseInt(searchParams.get("total") || "10", 10);
  const isPassed = score >= 40;

  const candidateName = user?.name || "Akkhil Sharma";
  const [certificateId] = useState(() => {
    if (typeof window !== "undefined" && window.crypto?.randomUUID) {
      const hex = window.crypto.randomUUID().replace(/-/g, "").slice(0, 6);
      return `ASK-POSP-${hex.toUpperCase()}`;
    }
    return "ASK-POSP-582910";
  });
  const issueDate = "19-Aug-2026";

  return (
    <>
      <Navbar />
      <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "40px 16px 80px" }}>
        <div style={{ maxWidth: 840, margin: "0 auto" }}>
          {/* Result Card */}
          <div
            style={{
              background: "white",
              borderRadius: 20,
              border: "1px solid var(--border)",
              padding: "40px 32px",
              textAlign: "center",
              marginBottom: 32,
              boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: isPassed ? "var(--success-light)" : "var(--error-light)",
                color: isPassed ? "var(--success)" : "var(--error)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}
            >
              {isPassed ? <CheckCircle2 size={42} /> : <XCircle size={42} />}
            </div>

            <span
              style={{
                fontSize: 12,
                fontWeight: 800,
                padding: "4px 12px",
                borderRadius: 20,
                background: isPassed ? "var(--success-light)" : "var(--error-light)",
                color: isPassed ? "var(--success)" : "var(--error)",
                textTransform: "uppercase",
              }}
            >
              {isPassed ? "Examination Passed • Certified" : "Need 40% to Pass • Try Again"}
            </span>

            <h1 style={{ fontSize: 32, fontWeight: 900, color: "var(--text)", margin: "16px 0 8px" }}>
              {isPassed ? "Congratulations! You are now a Certified POSP Agent" : "Examination Not Cleared"}
            </h1>

            <p style={{ fontSize: 15, color: "var(--text-muted)", maxWidth: 520, margin: "0 auto 28px", lineHeight: 1.5 }}>
              {isPassed
                ? "Your official IRDAI POSP Appointment Certificate has been generated. You are authorized to issue policies across Motor, Health and Life sectors."
                : "You scored below 40%. Don't worry! You can retake the practice exam right away to master the concepts."}
            </p>

            {/* Score Metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, maxWidth: 520, margin: "0 auto 32px" }}>
              <div style={{ background: "var(--bg)", padding: 16, borderRadius: 12, border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase" }}>Your Score</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: isPassed ? "var(--success)" : "var(--error)" }}>
                  {score}%
                </div>
              </div>
              <div style={{ background: "var(--bg)", padding: 16, borderRadius: 12, border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase" }}>Correct Answers</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: "var(--text)" }}>
                  {correct} / {total}
                </div>
              </div>
              <div style={{ background: "var(--bg)", padding: 16, borderRadius: 12, border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase" }}>Passing Criteria</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: "var(--primary)" }}>
                  40%
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              {isPassed ? (
                <>
                  <button
                    onClick={() => alert(`Downloading Official IRDAI POSP Appointment Certificate for ${candidateName} (PDF)...`)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "14px 28px",
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
                    <Download size={16} /> Download Signed Certificate
                  </button>
                  <Link
                    href="/posp"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "14px 24px",
                      background: "white",
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      fontSize: 14,
                      fontWeight: 700,
                      color: "var(--text)",
                      textDecoration: "none",
                    }}
                  >
                    Go to Agent Dashboard <ArrowRight size={16} />
                  </Link>
                </>
              ) : (
                <Link
                  href="/posp/exam"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "14px 32px",
                    background: "var(--primary)",
                    color: "white",
                    borderRadius: 10,
                    fontSize: 15,
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  Retake Exam Now →
                </Link>
              )}
            </div>
          </div>

          {/* Certificate Preview Card */}
          {isPassed && (
            <div
              style={{
                background: "linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)",
                borderRadius: 16,
                border: "2px solid #CBD5E1",
                padding: 40,
                boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                textAlign: "center",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: 16, marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Shield size={20} style={{ color: "var(--primary)" }} />
                  <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>ASK Insurance Brokers Pvt. Ltd.</span>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "right" }}>
                  <div>IRDAI Direct Broker (Life & General)</div>
                  <div>Reg. No: 882 • License Valid</div>
                </div>
              </div>

              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--primary)", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 12 }}>
                Certificate of Competency & Appointment
              </div>

              <div style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 8 }}>
                This is to certify that
              </div>

              <div style={{ fontSize: 26, fontWeight: 900, color: "var(--text)", letterSpacing: "0.5px", marginBottom: 12, borderBottom: "2px solid var(--primary-light)", display: "inline-block", paddingBottom: 4 }}>
                {candidateName}
              </div>

              <p style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 580, margin: "0 auto 24px", lineHeight: 1.6 }}>
                has successfully completed the mandatory training and passed the online certification examination prescribed by the <strong>Insurance Regulatory and Development Authority of India (IRDAI)</strong> for Point of Sales Persons (POSP).
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, borderTop: "1px solid var(--border)", paddingTop: 20, textAlign: "left", fontSize: 12 }}>
                <div>
                  <div style={{ color: "var(--text-muted)" }}>Certificate ID:</div>
                  <strong style={{ fontFamily: "monospace", color: "var(--primary)" }}>{certificateId}</strong>
                </div>
                <div>
                  <div style={{ color: "var(--text-muted)" }}>Date of Issue:</div>
                  <strong>{issueDate}</strong>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "var(--text-muted)" }}>Authorized Signatory:</div>
                  <strong>Principal Officer, ASK</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
