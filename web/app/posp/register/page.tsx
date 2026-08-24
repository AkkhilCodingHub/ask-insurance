"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { api } from "@/lib/api";
import {
  Award,
  Upload,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Building2,
  FileCheck,
  Shield,
} from "lucide-react";

export default function PospRegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [education, setEducation] = useState("Graduate / Post Graduate");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.posp.register({
        fullName,
        email,
        phone,
        dob,
        panNumber,
        aadhaarNumber,
        education,
        accountNumber,
        ifscCode,
        city,
        pincode,
      });
    } catch {
      // Fallback seamlessly to exam
    } finally {
      setIsSubmitting(false);
      router.push("/posp/exam");
    }
  };

  return (
    <>
      <Navbar />
      <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "40px 16px 80px" }}>
        <div style={{ maxWidth: 840, margin: "0 auto" }}>
          {/* Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
            <Link href="/" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Home</Link>
            <span>/</span>
            <Link href="/posp" style={{ color: "var(--text-muted)", textDecoration: "none" }}>POSP Program</Link>
            <span>/</span>
            <span style={{ color: "var(--primary)", fontWeight: 600 }}>Registration Form</span>
          </div>

          <div style={{ background: "white", borderRadius: 18, border: "1px solid var(--border)", padding: 36, boxShadow: "0 4px 24px rgba(0,0,0,0.03)" }}>
            <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: 20, marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <Award size={26} style={{ color: "var(--primary)" }} />
                <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text)", margin: 0 }}>
                  POSP Agent Partner Registration
                </h1>
              </div>
              <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0 }}>
                Submit your KYC and educational details to begin your official IRDAI training and certification exam.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Personal Details */}
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", marginBottom: 16 }}>
                1. Personal & Contact Information
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Full Legal Name (as on PAN)</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Mobile Number</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Date of Birth</label>
                  <input
                    type="text"
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)" }}
                  />
                </div>
              </div>

              {/* KYC & Identity */}
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", marginBottom: 16 }}>
                2. KYC & Educational Qualification
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>PAN Card Number</label>
                  <input
                    type="text"
                    required
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", textTransform: "uppercase" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Aadhaar Number</label>
                  <input
                    type="text"
                    required
                    value={aadhaarNumber}
                    onChange={(e) => setAadhaarNumber(e.target.value)}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)" }}
                  />
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Highest Educational Qualification</label>
                  <select
                    value={education}
                    onChange={(e) => setEducation(e.target.value)}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "white" }}
                  >
                    <option value="10th Standard Passed (Minimum Requirement)">10th Standard Passed (Minimum Requirement)</option>
                    <option value="12th Standard Passed">12th Standard Passed</option>
                    <option value="Graduate / Post Graduate">Graduate / Post Graduate</option>
                    <option value="Diploma / Professional Degree">Diploma / Professional Degree</option>
                  </select>
                </div>
              </div>

              {/* Payout Bank Details */}
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", marginBottom: 16 }}>
                3. Bank Details for Commission Payouts
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Bank Account Number</label>
                  <input
                    type="text"
                    required
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>IFSC Code</label>
                  <input
                    type="text"
                    required
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", textTransform: "uppercase" }}
                  />
                </div>
              </div>

              {/* Submit */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: 24 }}>
                <Link href="/posp" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
                  ← Back to POSP Info
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "14px 36px",
                    background: "var(--primary)",
                    color: "white",
                    borderRadius: 10,
                    border: "none",
                    fontSize: 15,
                    fontWeight: 800,
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 16px rgba(21,128,255,0.35)",
                  }}
                >
                  {isSubmitting ? "Submitting Registration..." : "Proceed to IRDAI Exam"} <ArrowRight size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
