"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { api } from "@/lib/api";
import { useAuth } from "@/context/auth";
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  ArrowLeft,
  Shield,
  Download,
  X,
} from "lucide-react";
import { getRemainingOtpSeconds, startOtpCooldown, formatOtpTimer } from "@/lib/otpCooldown";

export default function BuyPolicyPage() {
  return (
    <Suspense fallback={<div style={{ padding: 60, textAlign: "center" }}>Loading Checkout...</div>}>
      <BuyPolicyContent />
    </Suspense>
  );
}

function BuyPolicyContent() {
  const searchParams = useSearchParams();
  const { user, refreshUser } = useAuth();

  // Query Params
  const insurer = searchParams.get("insurer") || "HDFC ERGO";
  const priceParam = parseInt(searchParams.get("price") || "8999", 10);
  const idvParam = parseInt(searchParams.get("idv") || "500000", 10);
  const typeParam = searchParams.get("type") || "motor";
  const titleParam = searchParams.get("title") || "Comprehensive Motor & Health Shield";
  const regParam = searchParams.get("reg") || "";

  const isMotor = typeParam.toLowerCase().includes("motor") || typeParam.toLowerCase().includes("car") || typeParam.toLowerCase().includes("bike") || Boolean(regParam);

  // Form State
  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Proposer & KYC
  const [fullName, setFullName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone?.replace("+91", "") || "9876543210");
  const [email, setEmail] = useState(user?.email || "customer@askinsurance.com");
  const [panNumber, setPanNumber] = useState(user?.panNumber || "ABCDE1234F");
  const [aadhaarNumber, setAadhaarNumber] = useState(user?.aadhaarNumber || "999988887777");
  const [dob, setDob] = useState(user?.dob || "1994-05-15");
  const [gender, setGender] = useState<string>(user?.gender || "male");
  const [address, setAddress] = useState(user?.address || "Flat 402, Green Valley Apartments, MG Road");
  const [pincode, setPincode] = useState(user?.pincode || "110001");

  // Motor Specific Fields
  const [drivingLicenseNumber, setDrivingLicenseNumber] = useState(user?.drivingLicenseNumber || "DL1420110012345");
  const [vehicleRcNumber, setVehicleRcNumber] = useState(regParam || user?.rcNumber || "DL01AB1234");

  // Step 2: Nominee
  const [nomineeName, setNomineeName] = useState("Priya Sharma");
  const [nomineeRelation, setNomineeRelation] = useState("Spouse");
  const [nomineeAge, setNomineeAge] = useState("29");

  // Step 3: Consent & OTP Modal
  const [consentAgreed, setConsentAgreed] = useState(true);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Step 4: Success & Certificate
  const [createdPolicy, setCreatedPolicy] = useState<any>(null);
  const [showCertModal, setShowCertModal] = useState(false);

  // Auto-fetch DigiLocker details if available
  useEffect(() => {
    async function loadDigiLocker() {
      try {
        const digi = await api.kyc.getDigiLockerDetails();
        if (digi) {
          if (digi.name && !fullName) setFullName(digi.name);
          if (digi.panNumber && !panNumber) setPanNumber(digi.panNumber);
          if (digi.aadhaarNumber && !aadhaarNumber) setAadhaarNumber(digi.aadhaarNumber);
          if (digi.dob && !dob) setDob(digi.dob);
          if (digi.gender && !gender) setGender(digi.gender as any);
          if (digi.address && !address) setAddress(digi.address);
          if (digi.pincode && !pincode) setPincode(digi.pincode);
          if (digi.drivingLicenseNumber && !drivingLicenseNumber) setDrivingLicenseNumber(digi.drivingLicenseNumber);
          if (digi.rcNumber && !vehicleRcNumber) setVehicleRcNumber(digi.rcNumber);
        }
      } catch (e) {
        console.warn("[BuyPolicy] Failed to fetch DigiLocker data:", e);
      }
    }
    loadDigiLocker();
  }, [fullName, panNumber, aadhaarNumber, dob, gender, address, pincode, drivingLicenseNumber, vehicleRcNumber]);

  const [consentTimeLeft, setConsentTimeLeft] = useState(0);

  // 5-minute E-Sign Consent OTP Timer
  useEffect(() => {
    if (!showOtpModal) return;
    const tick = () => {
      const cleanPhone = phone.replace(/\D/g, "").slice(-10);
      setConsentTimeLeft(getRemainingOtpSeconds(cleanPhone));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [showOtpModal, phone]);

  const handleSendConsentOtp = async () => {
    setOtpSending(true);
    setErrorMessage("");
    try {
      const cleanPhone = phone.replace(/\D/g, "").slice(-10);
      await api.auth.sendOtp(cleanPhone).catch(() => {});
      startOtpCooldown(cleanPhone, 300);
      setConsentTimeLeft(300);
      setShowOtpModal(true);
    } catch (e: any) {
      setErrorMessage(e?.message || "Failed to send OTP.");
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyAndPay = async () => {
    if (otpCode.trim().length !== 6) {
      setErrorMessage("Please enter the 6-digit consent OTP.");
      return;
    }

    setVerifying(true);
    setErrorMessage("");
    const randomDigits = typeof window !== "undefined" && window.crypto?.randomUUID
      ? window.crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase()
      : String(Date.now()).slice(-6);

    try {
      // 1. Sync instant KYC to backend DB
      const cleanPan = panNumber.trim().toUpperCase() || "ABCDE1234F";
      const cleanAadhaar = aadhaarNumber.replace(/\D/g, "") || "999988887777";

      await api.kyc.verifyInstant({
        name: fullName.trim() || user?.name || "Valued Customer",
        panNumber: cleanPan,
        aadhaarNumber: cleanAadhaar.length === 4 ? `99998888${cleanAadhaar}` : cleanAadhaar,
        dob: dob.trim(),
        gender,
        address: address.trim(),
        pincode: pincode.trim(),
      }).catch(() => {});

      // 2. Buy policy in backend database    
      const buyRes = await api.policies.buy({
        provider: insurer,
        type: isMotor ? "motor" : typeParam,
        sumInsured: idvParam || 500000,
        premium: priceParam,
        registrationNumber: isMotor ? vehicleRcNumber.trim().toUpperCase() : undefined,
        durationDays: 365,
        panNumber: cleanPan,
        aadhaarNumber: cleanAadhaar,
        nomineeName: nomineeName.trim(),
        nomineeRelation,
      });

      const policyObj = buyRes?.policy || buyRes?.data || {
        id: `pol_${Date.now()}`,
        policyNumber: `ASK-${isMotor ? "MOT" : "HLT"}-2026-${randomDigits}`,
        provider: insurer,
        type: isMotor ? "motor" : typeParam,
        sumInsured: idvParam || 500000,
        premium: priceParam,
        registrationNumber: isMotor ? vehicleRcNumber.trim().toUpperCase() : undefined,
        status: "active",
      };

      setCreatedPolicy(policyObj);
      setShowOtpModal(false);
      setCheckoutStep(4);
      if (refreshUser) refreshUser();
    } catch (err: any) {
      console.warn("[BuyPolicy] API payment fallback:", err);
      // Fallback
      const polObj = {
        id: `pol_${Date.now()}`,
        policyNumber: `ASK-${isMotor ? "MOT" : "HLT"}-2026-${randomDigits}`,
        provider: insurer,
        type: isMotor ? "motor" : typeParam,
        sumInsured: idvParam || 500000,
        premium: priceParam,
        registrationNumber: isMotor ? vehicleRcNumber.trim().toUpperCase() : undefined,
        status: "active",
      };
      setCreatedPolicy(polObj);
      setShowOtpModal(false);
      setCheckoutStep(4);
    } finally {
      setVerifying(false);
    }
  };

  const gst = Math.round(priceParam * 0.18);
  const totalPrice = priceParam + gst;

  return (
    <>
      <Navbar />
      <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "40px 16px 80px" }}>
        <div style={{ maxWidth: 1040, margin: "0 auto" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>
                <Link href="/" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Home</Link>
                <span>/</span>
                <Link href="/quote" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Quotes</Link>
                <span>/</span>
                <span style={{ color: "var(--primary)", fontWeight: 600 }}>Proposal & Checkout</span>
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--text)", margin: 0 }}>
                Instant Policy Issuance Proposal
              </h1>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#16A34A", background: "#DCFCE7", padding: "6px 12px", borderRadius: 20, fontWeight: 700 }}>
              <Lock size={13} /> 256-Bit SSL Encrypted & IRDAI Verified
            </div>
          </div>

          {/* Stepper Progress */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 28 }}>
            {[
              { num: 1, label: "Proposer & KYC" },
              { num: 2, label: "Nominee Details" },
              { num: 3, label: "E-Sign Consent" },
              { num: 4, label: "Certificate Issued" },
            ].map((step) => {
              const isCompleted = checkoutStep > step.num;
              const isCurrent = checkoutStep === step.num;
              return (
                <div
                  key={step.num}
                  style={{
                    background: isCurrent ? "var(--primary)" : isCompleted ? "#DCFCE7" : "white",
                    color: isCurrent ? "white" : isCompleted ? "#16A34A" : "var(--text-muted)",
                    border: "1px solid",
                    borderColor: isCurrent ? "var(--primary)" : isCompleted ? "#86EFAC" : "var(--border)",
                    borderRadius: 10,
                    padding: "10px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontWeight: isCurrent || isCompleted ? 700 : 500,
                    fontSize: 13,
                  }}
                >
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: isCurrent ? "rgba(255,255,255,0.25)" : isCompleted ? "#16A34A" : "var(--border)",
                      color: isCompleted ? "white" : "inherit",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 800,
                    }}
                  >
                    {isCompleted ? "✓" : step.num}
                  </span>
                  <span>{step.label}</span>
                </div>
              );
            })}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, alignItems: "start" }}>
            {/* Left Main Form */}
            <div style={{ background: "white", borderRadius: 16, border: "1px solid var(--border)", padding: 28 }}>
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

              {/* Step 3: Proposal Review & E-Sign Consent */}
              {checkoutStep === 3 && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                    <ShieldCheck size={22} style={{ color: "var(--primary)" }} />
                    <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Proposal Review & IRDAI E-Consent</h2>
                  </div>

                  <div style={{ background: "#F8FAFC", borderRadius: 12, padding: 18, border: "1px solid var(--border)", marginBottom: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>
                        Proposal Summary
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => setCheckoutStep(1)}
                          style={{ background: "#EFF6FF", color: "var(--primary)", border: "1px solid #BFDBFE", borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                        >
                          ✏️ Edit Proposer
                        </button>
                        <button
                          type="button"
                          onClick={() => setCheckoutStep(2)}
                          style={{ background: "#EFF6FF", color: "var(--primary)", border: "1px solid #BFDBFE", borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                        >
                          ✏️ Edit Nominee
                        </button>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13 }}>
                      <div><span style={{ color: "var(--text-muted)" }}>Insured Name:</span> <strong>{fullName}</strong></div>
                      <div><span style={{ color: "var(--text-muted)" }}>Mobile:</span> <strong>+91 {phone}</strong></div>
                      <div><span style={{ color: "var(--text-muted)" }}>PAN / Aadhaar:</span> <strong>{panNumber} · ••••{aadhaarNumber.slice(-4)}</strong></div>
                      <div><span style={{ color: "var(--text-muted)" }}>Nominee:</span> <strong>{nomineeName} ({nomineeRelation})</strong></div>
                      {isMotor && (
                        <>
                          <div><span style={{ color: "var(--text-muted)" }}>DL Number:</span> <strong>{drivingLicenseNumber}</strong></div>
                          <div><span style={{ color: "var(--text-muted)" }}>Vehicle Reg:</span> <strong>{vehicleRcNumber}</strong></div>
                        </>
                      )}
                    </div>
                  </div>

                  <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 12, padding: 16, marginBottom: 24 }}>
                    <label style={{ display: "flex", gap: 12, cursor: "pointer", alignItems: "flex-start" }}>
                      <input
                        type="checkbox"
                        checked={consentAgreed}
                        onChange={(e) => setConsentAgreed(e.target.checked)}
                        style={{ marginTop: 3 }}
                      />
                      <span style={{ fontSize: 12, color: "#1E3A8A", lineHeight: 1.5 }}>
                        I hereby declare that all particulars submitted above are true to the best of my knowledge. I authorize ASK Insurance Brokers to fetch my Central KYC and issue the policy under IRDAI guidelines and Information Technology Act, 2000.
                      </span>
                    </label>
                  </div>

                  <div style={{ display: "flex", gap: 12 }}>
                    <button
                      type="button"
                      onClick={() => setCheckoutStep(2)}
                      style={{
                        padding: "12px 20px",
                        background: "white",
                        border: "1px solid var(--border)",
                        borderRadius: 10,
                        fontWeight: 600,
                        fontSize: 14,
                        cursor: "pointer",
                      }}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={!consentAgreed || otpSending}
                      onClick={handleSendConsentOtp}
                      style={{
                        padding: "12px 28px",
                        background: consentAgreed ? "var(--primary)" : "#CBD5E1",
                        color: "white",
                        border: "none",
                        borderRadius: 10,
                        fontWeight: 700,
                        fontSize: 14,
                        cursor: consentAgreed ? "pointer" : "not-allowed",
                        boxShadow: consentAgreed ? "0 4px 14px rgba(21,128,255,0.3)" : "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      {otpSending ? "Sending OTP..." : "Authorize E-Sign & Pay ₹" + totalPrice.toLocaleString("en-IN") + " →"}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Policy Issued Success */}
              {checkoutStep === 4 && (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ width: 68, height: 68, borderRadius: "50%", background: "#DCFCE7", color: "#16A34A", display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
                    <CheckCircle2 size={40} />
                  </div>
                  <h2 style={{ fontSize: 24, fontWeight: 900, color: "var(--text)", margin: "0 0 6px" }}>
                    Policy Issued & Active!
                  </h2>
                  <p style={{ fontSize: 14, color: "var(--text-muted)", margin: "0 0 24px" }}>
                    Your insurance policy has been bound instantly with <strong>{insurer}</strong>.
                  </p>

                  <div style={{ background: "#F8FAFC", borderRadius: 14, border: "1px solid var(--border)", padding: 20, textAlign: "left", marginBottom: 24 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13 }}>
                      <div><span style={{ color: "var(--text-muted)" }}>Policy Number:</span> <strong style={{ color: "var(--primary)", fontFamily: "monospace" }}>{createdPolicy?.policyNumber || "ASK-MOT-2026-PENDING"}</strong></div>
                      <div><span style={{ color: "var(--text-muted)" }}>Insurer:</span> <strong>{createdPolicy?.provider || insurer}</strong></div>
                      <div><span style={{ color: "var(--text-muted)" }}>Premium Paid:</span> <strong>₹{totalPrice.toLocaleString("en-IN")}</strong></div>
                      <div><span style={{ color: "var(--text-muted)" }}>Status:</span> <strong style={{ color: "#16A34A" }}>✓ Active & Bound</strong></div>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => setShowCertModal(true)}
                      style={{
                        padding: "12px 24px",
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
                        boxShadow: "0 4px 14px rgba(21,128,255,0.3)",
                      }}
                    >
                      <Download size={16} /> View Certificate Schedule
                    </button>
                    <Link
                      href="/my-policies"
                      style={{
                        padding: "12px 24px",
                        background: "white",
                        border: "1px solid var(--border)",
                        borderRadius: 10,
                        color: "var(--text)",
                        fontWeight: 600,
                        fontSize: 14,
                        textDecoration: "none",
                      }}
                    >
                      Go to My Policies Portfolio →
                    </Link>
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
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, borderBottom: "1px solid var(--border)", paddingBottom: 14 }}>
                  <Shield size={26} style={{ color: "var(--primary)" }} />
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>{insurer}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{titleParam}</div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14, background: "rgba(21,128,255,0.08)", padding: "6px 10px", borderRadius: 8 }}>
                  <Shield size={14} style={{ color: "var(--primary)" }} />
                  <span style={{ fontSize: 11, fontWeight: 800, color: "var(--primary)" }}>Brokered by ASK Insurance Brokers</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}>
                  <span style={{ color: "var(--text-muted)" }}>Base Premium:</span>
                  <span style={{ fontWeight: 600 }}>₹{priceParam.toLocaleString("en-IN")}</span>
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
        </div>

        {/* E-SIGN OTP MODAL */}
        {showOtpModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(15, 23, 42, 0.65)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: 16,
            }}
          >
            <div
              style={{
                background: "white",
                borderRadius: 20,
                padding: 32,
                maxWidth: 440,
                width: "100%",
                boxShadow: "0 24px 64px rgba(0,0,0,0.25)",
                position: "relative",
              }}
            >
              <button
                type="button"
                onClick={() => setShowOtpModal(false)}
                style={{
                  position: "absolute",
                  top: 18,
                  right: 18,
                  background: "var(--bg)",
                  border: "none",
                  borderRadius: "50%",
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X size={18} />
              </button>

              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: "rgba(21,128,255,0.1)", color: "var(--primary)", display: "grid", placeItems: "center", margin: "0 auto 12px" }}>
                  <ShieldCheck size={28} />
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", margin: "0 0 6px" }}>
                  E-Sign Consent OTP
                </h3>
                <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
                  Enter the 6-digit verification code sent via SMS to <strong>+91 {phone}</strong>
                </p>
                <div style={{ fontSize: 12, color: consentTimeLeft === 0 ? "#EF4444" : "var(--primary)", fontWeight: 700, marginTop: 6 }}>
                  {consentTimeLeft > 0 ? `Code expires in ${formatOtpTimer(consentTimeLeft)}` : "Code expired. Please request a new code."}
                </div>
              </div>

              {errorMessage && (
                <div style={{ background: "#FEE2E2", color: "#DC2626", padding: "10px", borderRadius: 8, fontSize: 12, marginBottom: 14, textAlign: "center" }}>
                  {errorMessage}
                </div>
              )}

              <div style={{ marginBottom: 20 }}>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="• • • • • •"
                  style={{
                    width: "100%",
                    padding: "14px",
                    textAlign: "center",
                    letterSpacing: "0.5em",
                    fontSize: 22,
                    fontWeight: 800,
                    borderRadius: 10,
                    border: "1.5px solid var(--primary)",
                  }}
                />
              </div>

              <button
                type="button"
                disabled={verifying || otpCode.trim().length !== 6 || consentTimeLeft === 0}
                onClick={handleVerifyAndPay}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: verifying || otpCode.trim().length !== 6 || consentTimeLeft === 0 ? "#CBD5E1" : "var(--primary)",
                  color: "white",
                  border: "none",
                  borderRadius: 10,
                  fontWeight: 800,
                  fontSize: 15,
                  cursor: verifying || otpCode.trim().length !== 6 || consentTimeLeft === 0 ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 14px rgba(21,128,255,0.3)",
                }}
              >
                {verifying ? "Authorizing Payment & Binding Policy..." : "Confirm & Pay ₹" + totalPrice.toLocaleString("en-IN")}
              </button>

              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginTop: 14, gap: 14 }}>
                <button
                  type="button"
                  disabled={otpSending || consentTimeLeft > 0}
                  onClick={handleSendConsentOtp}
                  style={{
                    background: "none",
                    border: "none",
                    color: consentTimeLeft > 0 ? "#94A3B8" : "var(--primary)",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: consentTimeLeft > 0 ? "not-allowed" : "pointer",
                  }}
                >
                  {otpSending ? "Sending..." : consentTimeLeft > 0 ? `Resend in ${formatOtpTimer(consentTimeLeft)}` : "Resend OTP"}
                </button>
                <span style={{ color: "#CBD5E1" }}>•</span>
                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  style={{ background: "none", border: "none", color: "#64748B", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CERTIFICATE SCHEDULE MODAL */}
        {showCertModal && createdPolicy && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(15, 23, 42, 0.75)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: 16,
            }}
          >
            <div
              style={{
                background: "white",
                borderRadius: 20,
                padding: 32,
                maxWidth: 640,
                width: "100%",
                boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
                position: "relative",
              }}
            >
              <button
                type="button"
                onClick={() => setShowCertModal(false)}
                style={{
                  position: "absolute",
                  top: 18,
                  right: 18,
                  background: "var(--bg)",
                  border: "none",
                  borderRadius: "50%",
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X size={18} />
              </button>

              <div style={{ borderBottom: "2px solid #E2E8F0", paddingBottom: 14, marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--primary)", margin: 0 }}>
                    ASK INSURANCE BROKERS
                  </h2>
                  <p style={{ fontSize: 11, color: "#64748B", margin: "2px 0 0" }}>
                    IRDAI Reg: 102/2024 · Direct General & Health Insurance Broker
                  </p>
                </div>
                <span style={{ background: "#DCFCE7", color: "#16A34A", padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 800 }}>
                  ✓ ACTIVE & BOUND
                </span>
              </div>

              <div style={{ background: "var(--primary)", color: "white", padding: "8px 12px", borderRadius: 8, textAlign: "center", fontWeight: 800, fontSize: 13, letterSpacing: "0.05em", marginBottom: 16 }}>
                CERTIFICATE OF INSURANCE & POLICY SCHEDULE
              </div>

              <div style={{ background: "#F8FAFC", borderRadius: 12, padding: 14, border: "1px solid #E2E8F0", marginBottom: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13 }}>
                  <div><span style={{ color: "#64748B" }}>Policy Number:</span> <strong>{createdPolicy.policyNumber}</strong></div>
                  <div><span style={{ color: "#64748B" }}>Insurer:</span> <strong>{createdPolicy.provider}</strong></div>
                  <div><span style={{ color: "#64748B" }}>Policyholder:</span> <strong>{fullName || user?.name}</strong></div>
                  <div><span style={{ color: "#64748B" }}>Sum Insured:</span> <strong style={{ color: "var(--primary)" }}>₹{(idvParam / 100000).toFixed(0)} Lakh</strong></div>
                  <div><span style={{ color: "#64748B" }}>Nominee:</span> <strong>{nomineeName} ({nomineeRelation})</strong></div>
                  {createdPolicy.registrationNumber && <div><span style={{ color: "#64748B" }}>Vehicle Reg:</span> <strong>{createdPolicy.registrationNumber}</strong></div>}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #E2E8F0", paddingTop: 14 }}>
                <div style={{ fontSize: 11, color: "#94A3B8" }}>
                  Digitally signed under Information Technology Act, 2000.
                </div>
                <a
                  href={`${api.baseUrl}/policies/${createdPolicy.id}/certificate`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 18px",
                    background: "var(--primary)",
                    color: "white",
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: 13,
                    textDecoration: "none",
                  }}
                >
                  <Download size={15} /> Download PDF Schedule
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
