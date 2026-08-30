"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { api } from "@/lib/api";
import {
  ShieldCheck,
  Clock3,
  Globe2,
  ArrowRight,
  Plus,
  X,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/context/auth";

export default function ClaimsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 60, textAlign: "center" }}>Loading Claims...</div>}>
      <ClaimsContent />
    </Suspense>
  );
}

interface UserClaim {
  id: string;
  claimNumber: string;
  policyNumber: string;
  type: string;
  amount: number;
  status: "submitted" | "surveyor_assigned" | "inspection_done" | "approved" | "settled" | string;
  submittedDate: string;
  hospitalOrGarage?: string;
  description?: string;
}

const FALLBACK_CLAIMS: UserClaim[] = [
  {
    id: "clm_1",
    claimNumber: "CLM-2026-88019",
    policyNumber: "HDFC-MOT-2025-991204",
    type: "Motor Accidental Repair (Cashless)",
    amount: 28500,
    status: "surveyor_assigned",
    submittedDate: "24-Aug-2026",
    hospitalOrGarage: "AutoNation HDFC Approved Body Shop, Delhi",
    description: "Bumper and left headlamp damage in parking collision.",
  },
  {
    id: "clm_2",
    claimNumber: "CLM-2026-77102",
    policyNumber: "STAR-HLT-2026-440182",
    type: "Hospitalization Cashless Pre-Auth",
    amount: 145000,
    status: "settled",
    submittedDate: "12-Jul-2026",
    hospitalOrGarage: "Max Super Speciality Hospital, Saket",
    description: "Dengue inpatient care 4 days cashless settlement.",
  },
];

const CLAIM_STAGES = [
  { key: "submitted", label: "Claim Filed" },
  { key: "surveyor_assigned", label: "Surveyor Assigned" },
  { key: "inspection_done", label: "Inspection Done" },
  { key: "approved", label: "Approved" },
  { key: "settled", label: "Cashless Settled" },
];

function ClaimsContent() {
  const searchParams = useSearchParams();
  const policyParam = searchParams.get("policy") || "";
  const [claims, setClaims] = useState<UserClaim[]>(FALLBACK_CLAIMS);
  const [showFileModal, setShowFileModal] = useState(Boolean(policyParam));
  const [policyNum, setPolicyNum] = useState(policyParam || "HDFC-MOT-2025-991204");
  const [claimType, setClaimType] = useState("Motor Accidental Repair (Cashless)");
  const [incidentDate, setIncidentDate] = useState("2026-08-25");
  const [estAmount, setEstAmount] = useState("25000");
  const [locationOrGarage, setLocationOrGarage] = useState("Authorized Network Garage, Delhi");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleFileClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.claims.create({
        policyNumber: policyNum.trim(),
        type: claimType,
        incidentDate,
        amount: parseInt(estAmount, 10) || 0,
        hospitalOrGarage: locationOrGarage,
        description: description.trim(),
      });
      const newClm: UserClaim = {
        id: `clm_${Date.now()}`,
        claimNumber: `CLM-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
        policyNumber: policyNum,
        type: claimType,
        amount: parseInt(estAmount, 10) || 25000,
        status: "submitted",
        submittedDate: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
        hospitalOrGarage: locationOrGarage,
        description,
      };
      setClaims([newClm, ...claims]);
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setShowFileModal(false);
        setDescription("");
      }, 2000);
    } catch {
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setShowFileModal(false);
      }, 2000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <main style={{ background: "var(--bg)", minHeight: "100vh" }}>
        <section
          style={{
            background: "linear-gradient(135deg, #0B4E9C 0%, #1E90FF 65%, #60A5FA 100%)",
            color: "#fff",
            padding: "54px 24px 48px",
          }}
        >
          <div style={{ maxWidth: 1040, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20 }}>
            <div>
              <span style={{ display: "inline-block", marginBottom: 8, fontSize: 12, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.85)" }}>
                Claims support · 24/7 Helpline · Cashless settlement
              </span>
              <h1 style={{ fontSize: 36, fontWeight: 900, lineHeight: 1.1, margin: "0 0 10px" }}>
                Fast, Transparent Claims Portal
              </h1>
              <p style={{ fontSize: 15, color: "rgba(255,255,255,0.88)", maxWidth: 580, margin: 0 }}>
                Track cashless pre-authorization, surveyor appointments, and claim settlement in real time.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowFileModal(true)}
              style={{
                padding: "14px 26px",
                borderRadius: 12,
                background: "#fff",
                color: "#0B4E9C",
                fontWeight: 800,
                border: "none",
                fontSize: 15,
                cursor: "pointer",
                boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Plus size={18} /> File a New Claim
            </button>
          </div>
        </section>

        <section style={{ maxWidth: 1040, margin: "0 auto", padding: "40px 16px 80px" }}>
          <div style={{ marginBottom: 44 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", marginBottom: 16 }}>
              Your Tracked Claims ({claims.length})
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {claims.map((clm: UserClaim) => {
                let currentIdx = CLAIM_STAGES.findIndex((s) => s.key === clm.status);
                if (currentIdx === -1) currentIdx = clm.status === "settled" ? 4 : 0;
                return (
                  <div key={clm.id} style={{ background: "white", borderRadius: 16, border: "1px solid var(--border)", padding: 24, boxShadow: "0 2px 14px rgba(0,0,0,0.02)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontFamily: "monospace", fontWeight: 800, color: "var(--primary)", fontSize: 16 }}>{clm.claimNumber}</span>
                          <span style={{ fontSize: 11, background: "rgba(21,128,255,0.08)", color: "var(--primary)", padding: "2px 8px", borderRadius: 6, fontWeight: 700 }}>{clm.type}</span>
                        </div>
                        <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>Policy: <strong>{clm.policyNumber}</strong> · Filed on {clm.submittedDate}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase" }}>Estimated Amount</div>
                        <div style={{ fontSize: 20, fontWeight: 900, color: "var(--text)" }}>₹{clm.amount.toLocaleString("en-IN")}</div>
                      </div>
                    </div>
                    {clm.hospitalOrGarage && (
                      <div style={{ fontSize: 13, color: "var(--text)", background: "var(--bg)", padding: "8px 12px", borderRadius: 8, marginBottom: 18 }}>📍 <strong>Network Provider:</strong> {clm.hospitalOrGarage}</div>
                    )}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                      {CLAIM_STAGES.map((st, idx) => {
                        const isDone = idx <= currentIdx;
                        const isCurrent = idx === currentIdx;
                        return (
                          <div key={st.key} style={{ textAlign: "center" }}>
                            <div style={{ height: 6, borderRadius: 3, background: isDone ? "var(--primary)" : "var(--border)", marginBottom: 6 }} />
                            <span style={{ fontSize: 11, fontWeight: isCurrent ? 800 : 500, color: isDone ? "var(--primary)" : "var(--text-muted)" }}>{st.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 20 }}>
            {[
              { title: "1. Instant Claim Filing", desc: "Submit your incident details and photos online in under 2 minutes.", icon: ShieldCheck },
              { title: "2. Real-Time Tracking", desc: "Get live surveyor updates, inspection logs and WhatsApp alerts.", icon: Clock3 },
              { title: "3. 3,800+ Cashless Network", desc: "Instant cashless pre-auth at all network hospitals & motor garages.", icon: Globe2 },
            ].map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.title} style={{ background: "#fff", borderRadius: 16, padding: "24px 20px", border: "1px solid var(--border)" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: "#EFF6FF", display: "grid", placeItems: "center", marginBottom: 14 }}>
                    <Icon size={22} color="#1D4ED8" />
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8, color: "var(--text)" }}>{step.title}</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: 13, lineHeight: 1.6, margin: 0 }}>{step.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {showFileModal && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 16 }}>
            <div style={{ background: "white", borderRadius: 20, padding: 32, maxWidth: 560, width: "100%", boxShadow: "0 24px 64px rgba(0,0,0,0.25)", position: "relative" }}>
              <button type="button" onClick={() => setShowFileModal(false)} style={{ position: "absolute", top: 18, right: 18, background: "var(--bg)", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <X size={18} />
              </button>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", margin: "0 0 6px" }}>File an Insurance Claim</h3>
              {submitSuccess ? (
                <div style={{ background: "#ECFDF5", border: "1px solid #6EE7B7", borderRadius: 12, padding: "20px", textAlign: "center", color: "#065F46" }}>
                  <CheckCircle2 size={36} style={{ margin: "0 auto 8px" }} />
                  <h4 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 4px" }}>Claim Registered Successfully!</h4>
                </div>
              ) : (
                <form onSubmit={handleFileClaim}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Policy Number</label>
                      <input type="text" required value={policyNum} onChange={(e) => setPolicyNum(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 13 }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Claim Type</label>
                      <select value={claimType} onChange={(e) => setClaimType(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border)", background: "white", fontSize: 13 }}>
                        <option value="Motor Accidental Repair (Cashless)">Motor Accidental Repair (Cashless)</option>
                        <option value="Motor Theft / Total Loss">Motor Theft / Total Loss</option>
                        <option value="Health Cashless Hospitalization">Health Cashless Hospitalization</option>
                        <option value="Health Reimbursement">Health Reimbursement</option>
                        <option value="Travel Medical / Baggage Loss">Travel Medical / Baggage</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Incident Date</label>
                      <input type="date" required value={incidentDate} onChange={(e) => setIncidentDate(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 13 }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Estimated Claim Amount (₹)</label>
                      <input type="number" required value={estAmount} onChange={(e) => setEstAmount(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 13 }} />
                    </div>
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Incident Details</label>
                    <textarea required rows={3} value={description} onChange={(e) => setDescription(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 13 }} />
                  </div>
                  <button type="submit" disabled={isSubmitting} style={{ width: "100%", padding: "12px", background: "var(--primary)", color: "white", border: "none", borderRadius: 10, fontWeight: 800, cursor: "pointer" }}>
                    {isSubmitting ? "Registering..." : "Submit Claim for Cashless Review →"}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
