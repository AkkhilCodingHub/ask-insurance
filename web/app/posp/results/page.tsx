"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Award,
  CheckCircle2,
  XCircle,
  Download,
  Share2,
  ArrowRight,
  Shield,
  QrCode,
  FileCheck,
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
  const certificateId = `ASK-POSP-${Math.floor(100000 + Math.random() * 900000)}`;
  const issueDate = "19-Aug-2026";

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "40px 16px 80px" }}>
      <div style={{ maxWidth: 840, margin: "0 auto" }}>
        {/* Result Header Card */}
        <div
          style={{
            background: "white",
            borderRadius: 20,
            border: "1px solid var(--border)",
            padding: "40px 32px",
            textAlign: "center",
            boxShadow: "0 4px 24px rgba(0,0,0,0.03)",
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: "50%",
              background: isPassed ? "var(--success-light)" : "var(--error-light)",
              color: isPassed ? "var(--success)" : "var(--error)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            {isPassed ? <Award size={38} /> : <XCircle size={38} />}
          </div>

          <span
            style={{
              background: isPassed ? "var(--success-light)" : "var(--error-light)",
              color: isPassed ? "var(--success)" : "var(--error)",
              padding: "4px 14px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 800,
              textTransform: "uppercase",
            }}
          >
            {isPassed ? "Exam Passed — Officially Certified" : "Need Improvement"}
          </span>

          <h1 style={{ fontSize: 28, fontWeight: 900, color: "var(--text)", margin: "16px 0 8px" }}>
            {isPassed ? "Congratulations, You are now a Certified POSP Partner!" : "Exam Result: Try Again"}
          </h1>
          <p style={{ fontSize: 15, color: "var(--text-muted)", margin: "0 0 24px" }}>
            You scored <strong>{score}%</strong> ({correct} out of {total} correct answers). Passing score is 40%.
          </p>

          {isPassed && (
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={() => alert(`Downloading Official IRDAI POSP Certificate ${certificateId}...`)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 24px",
                  background: "var(--primary)",
                  color: "white",
                  borderRadius: 10,
                  border: "none",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                <Download size={16} /> Download POSP Certificate PDF
              </button>
              <Link
                href="/quote"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 24px",
                  background: "white",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 14,
                  color: "var(--text)",
                  textDecoration: "none",
                }}
              >
                Start Selling Policies <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </div>

        {/* Official Certificate Visual Mockup */}
        {isPassed && (
          <div
            style={{
              background: "white",
              borderRadius: 16,
              border: "8px solid #DFE8F0",
              padding: 40,
              boxShadow: "0 12px 40px rgba(0,0,0,0.06)",
              textAlign: "center",
              position: "relative",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <img src="/logo.jpg" alt="ASK Logo" style={{ height: 38, borderRadius: 6 }} />
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
  );
}
