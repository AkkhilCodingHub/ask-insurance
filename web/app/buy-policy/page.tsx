"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Shield,
  CheckCircle2,
  Lock,
  ArrowRight,
  ArrowLeft,
  CreditCard,
  Building2,
  Smartphone,
  FileCheck,
  Download,
  Share2,
  Award,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/context/auth";

export default function BuyPolicyPage() {
  return (
    <Suspense fallback={<div style={{ padding: "80px 20px", textAlign: "center" }}>Loading Checkout...</div>}>
      <BuyPolicyContent />
    </Suspense>
  );
}

function BuyPolicyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const insurer = searchParams.get("insurer") || "HDFC ERGO General Insurance";
  const planTitle = searchParams.get("title") || "Comprehensive Motor & OD Shield";
  const rawPrice = searchParams.get("price") || "13510";
  const basePrice = parseInt(rawPrice, 10) || 13510;
  const gst = Math.round(basePrice * 0.18);
  const totalPrice = basePrice + gst;
  const regNumber = searchParams.get("reg") || "DL01AB1234";

  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 3 | 4>(1);

  // Form Details
  const [fullName, setFullName] = useState(user?.name || "Akkhil Sharma");
  const [phone, setPhone] = useState(user?.phone || "+91 7497007881");
  const [email, setEmail] = useState("support@askinsurance.in");
  const [dob, setDob] = useState("15/08/1998");
  const [panNumber, setPanNumber] = useState("ABCDE1234F");
  const [address, setAddress] = useState("Sector 62, Noida, Uttar Pradesh");
  const [pincode, setPincode] = useState("201309");

  // Nominee Details
  const [nomineeName, setNomineeName] = useState("Priya Sharma");
  const [nomineeRelation, setNomineeRelation] = useState("Spouse");
  const [nomineeAge, setNomineeAge] = useState("26");

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card" | "netbanking">("upi");
  const [upiId, setUpiId] = useState("7497007881@okaxis");
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedPolicyNum, setGeneratedPolicyNum] = useState("");

  const handlePay = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      const polNum = `ASK-POL-${Math.floor(100000 + Math.random() * 900000)}`;
      setGeneratedPolicyNum(polNum);
      setCheckoutStep(4);
    }, 1800);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "40px 16px 80px" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto" }}>
        {/* Header Breadcrumb */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>
              <Link href="/" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Home</Link>
              <span>/</span>
              <Link href="/quote" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Quote</Link>
              <span>/</span>
              <span style={{ color: "var(--primary)", fontWeight: 600 }}>Checkout & Issuance</span>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--text)", margin: 0 }}>
              Complete Your Policy Purchase
            </h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--success)", fontWeight: 700 }}>
            <Lock size={15} /> 256-Bit SSL Encrypted & IRDAI Licensed
          </div>
        </div>

        {/* Step 4: Success Screen */}
        {checkoutStep === 4 ? (
          <div
            style={{
              background: "white",
              borderRadius: 20,
              border: "1px solid var(--border)",
              padding: "48px 32px",
              textAlign: "center",
              boxShadow: "0 8px 32px rgba(21,128,255,0.08)",
              maxWidth: 680,
              margin: "0 auto",
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "var(--success-light)",
                color: "var(--success)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}
            >
              <CheckCircle2 size={44} />
            </div>

            <span
              style={{
                background: "var(--success-light)",
                color: "var(--success)",
                padding: "4px 14px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 800,
                textTransform: "uppercase",
              }}
            >
              Policy Issued Successfully
            </span>

            <h2 style={{ fontSize: 24, fontWeight: 800, color: "var(--text)", margin: "16px 0 6px" }}>
              Congratulations, {fullName}!
            </h2>
            <p style={{ fontSize: 14, color: "var(--text-muted)", margin: "0 0 24px" }}>
              Your insurance policy has been approved and issued instantly. Policy kit sent to <strong>{email}</strong>.
            </p>

            {/* Policy Info Card */}
            <div
              style={{
                background: "var(--bg)",
                borderRadius: 14,
                border: "1px solid var(--border)",
                padding: 20,
                textAlign: "left",
                marginBottom: 28,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 13 }}>
                <span style={{ color: "var(--text-muted)" }}>Policy Number:</span>
                <strong style={{ color: "var(--primary)", fontFamily: "monospace", fontSize: 15 }}>{generatedPolicyNum}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 13 }}>
                <span style={{ color: "var(--text-muted)" }}>Insurer:</span>
                <strong>{insurer}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 13 }}>
                <span style={{ color: "var(--text-muted)" }}>Vehicle / Subject:</span>
                <strong>{regNumber}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "var(--text-muted)" }}>Total Paid:</span>
                <strong style={{ color: "var(--success)", fontSize: 15 }}>₹{totalPrice.toLocaleString("en-IN")}</strong>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={() => alert(`Downloading Official PDF Policy Schedule for ${generatedPolicyNum}...`)}
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
                <Download size={16} /> Download Policy PDF
              </button>
              <Link
                href="/my-policies"
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
                View in My Policies →
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 28 }}>
            {/* Left: Stepped Checkout Form */}
            <div style={{ background: "white", borderRadius: 16, border: "1px solid var(--border)", padding: 28, boxShadow: "0 2px 12px rgba(0,0,0,0.02)" }}>
              {/* Stepper Tabs */}
              <div style={{ display: "flex", gap: 12, marginBottom: 28, borderBottom: "1px solid var(--border)", paddingBottom: 16 }}>
                {[
                  { num: 1, label: "Proposer Details" },
                  { num: 2, label: "Nominee & KYC" },
                  { num: 3, label: "Payment Method" },
                ].map((s) => (
                  <button
                    key={s.num}
                    onClick={() => checkoutStep > s.num && setCheckoutStep(s.num as any)}
                    style={{
                      background: "transparent",
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 14,
                      fontWeight: checkoutStep === s.num ? 700 : 500,
                      color: checkoutStep === s.num ? "var(--primary)" : "var(--text-muted)",
                      cursor: checkoutStep > s.num ? "pointer" : "default",
                    }}
                  >
                    <span
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        background: checkoutStep >= s.num ? "var(--primary)" : "var(--border)",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {checkoutStep > s.num ? "✓" : s.num}
                    </span>
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Step 1: Proposer Details */}
              {checkoutStep === 1 && (
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", marginBottom: 16 }}>
                    Proposer (Policyholder) Information
                  </h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Full Legal Name</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Mobile Number</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Email Address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Date of Birth (DD/MM/YYYY)</label>
                      <input
                        type="text"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)" }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Communication Address</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", marginBottom: 10 }}
                    />
                    <div style={{ width: "48%" }}>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Pincode</label>
                      <input
                        type="text"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)" }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => setCheckoutStep(2)}
                    style={{
                      padding: "12px 28px",
                      background: "var(--primary)",
                      color: "white",
                      border: "none",
                      borderRadius: 10,
                      fontWeight: 700,
                      fontSize: 14,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    Continue to Nominee Details <ArrowRight size={16} />
                  </button>
                </div>
              )}

              {/* Step 2: Nominee & KYC */}
              {checkoutStep === 2 && (
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", marginBottom: 16 }}>
                    Nominee & Mandatory CKYC Details
                  </h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Nominee Full Name</label>
                      <input
                        type="text"
                        value={nomineeName}
                        onChange={(e) => setNomineeName(e.target.value)}
                        style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Relationship with Proposer</label>
                      <select
                        value={nomineeRelation}
                        onChange={(e) => setNomineeRelation(e.target.value)}
                        style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "white" }}
                      >
                        <option value="Spouse">Spouse</option>
                        <option value="Father">Father</option>
                        <option value="Mother">Mother</option>
                        <option value="Son">Son</option>
                        <option value="Daughter">Daughter</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Nominee Age</label>
                      <input
                        type="number"
                        value={nomineeAge}
                        onChange={(e) => setNomineeAge(e.target.value)}
                        style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>PAN Card Number</label>
                      <input
                        type="text"
                        value={panNumber}
                        onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                        style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", textTransform: "uppercase" }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <button
                      onClick={() => setCheckoutStep(1)}
                      style={{ padding: "12px 20px", background: "white", border: "1px solid var(--border)", borderRadius: 10, cursor: "pointer", fontWeight: 600 }}
                    >
                      <ArrowLeft size={16} /> Back
                    </button>
                    <button
                      onClick={() => setCheckoutStep(3)}
                      style={{
                        padding: "12px 28px",
                        background: "var(--primary)",
                        color: "white",
                        border: "none",
                        borderRadius: 10,
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      Proceed to Payment <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Payment Method */}
              {checkoutStep === 3 && (
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", marginBottom: 16 }}>
                    Select Payment Method
                  </h3>

                  <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                    {[
                      { id: "upi", label: "Instant UPI (GPay / PhonePe / Paytm)", icon: Smartphone },
                      { id: "card", label: "Credit / Debit Card (Visa, Mastercard, RuPay)", icon: CreditCard },
                      { id: "netbanking", label: "Net Banking (All Indian Banks)", icon: Building2 },
                    ].map((p) => {
                      const IconC = p.icon;
                      const isSel = paymentMethod === p.id;
                      return (
                        <div
                          key={p.id}
                          onClick={() => setPaymentMethod(p.id as any)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 14,
                            padding: "16px 20px",
                            borderRadius: 12,
                            border: isSel ? "2px solid var(--primary)" : "1px solid var(--border)",
                            background: isSel ? "var(--primary-light)" : "white",
                            cursor: "pointer",
                          }}
                        >
                          <input type="radio" checked={isSel} onChange={() => {}} style={{ accentColor: "var(--primary)" }} />
                          <IconC size={20} style={{ color: isSel ? "var(--primary)" : "var(--text-muted)" }} />
                          <span style={{ fontSize: 15, fontWeight: isSel ? 700 : 500, color: "var(--text)" }}>{p.label}</span>
                        </div>
                      );
                    })}
                  </div>

                  {paymentMethod === "upi" && (
                    <div style={{ background: "var(--bg)", padding: 16, borderRadius: 10, border: "1px solid var(--border)", marginBottom: 24 }}>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Enter Virtual Payment Address (VPA)</label>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="yourname@okhdfcbank"
                        style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)" }}
                      />
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <button
                      onClick={() => setCheckoutStep(2)}
                      style={{ padding: "12px 20px", background: "white", border: "1px solid var(--border)", borderRadius: 10, cursor: "pointer", fontWeight: 600 }}
                    >
                      <ArrowLeft size={16} /> Back
                    </button>
                    <button
                      onClick={handlePay}
                      disabled={isProcessing}
                      style={{
                        padding: "14px 36px",
                        background: "var(--success)",
                        color: "white",
                        border: "none",
                        borderRadius: 10,
                        fontWeight: 800,
                        fontSize: 16,
                        cursor: isProcessing ? "not-allowed" : "pointer",
                        boxShadow: "0 4px 16px rgba(5,150,105,0.35)",
                      }}
                    >
                      {isProcessing ? "Processing Secure Payment..." : `Pay ₹${totalPrice.toLocaleString("en-IN")}`}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Policy Summary Card */}
            <div>
              <div
                style={{
                  background: "white",
                  borderRadius: 16,
                  border: "1px solid var(--border)",
                  padding: 24,
                  position: "sticky",
                  top: 90,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, borderBottom: "1px solid var(--border)", paddingBottom: 14 }}>
                  <Shield size={26} style={{ color: "var(--primary)" }} />
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>{insurer}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{planTitle}</div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}>
                  <span style={{ color: "var(--text-muted)" }}>Base Premium:</span>
                  <span style={{ fontWeight: 600 }}>₹{basePrice.toLocaleString("en-IN")}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 12 }}>
                  <span style={{ color: "var(--text-muted)" }}>GST (18%):</span>
                  <span style={{ fontWeight: 600 }}>₹{gst.toLocaleString("en-IN")}</span>
                </div>

                <div
                  style={{
                    borderTop: "1px dashed var(--border)",
                    paddingTop: 12,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 20,
                  }}
                >
                  <span style={{ fontWeight: 700, color: "var(--text)" }}>Final Payable:</span>
                  <span style={{ fontSize: 22, fontWeight: 900, color: "var(--primary)" }}>
                    ₹{totalPrice.toLocaleString("en-IN")}
                  </span>
                </div>

                <div style={{ background: "var(--bg)", padding: 12, borderRadius: 10, fontSize: 12, color: "var(--text-muted)", lineHeight: 1.4 }}>
                  🛡️ <strong>Instant Issuance:</strong> Digital policy schedule with IRDAI QR code will be generated immediately after successful payment.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
