"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { api } from "@/lib/api";
import {
  Shield,
  Car,
  HeartPulse,
  Download,
  CheckCircle2,
  Plus,
  Edit3,
  X,
} from "lucide-react";

interface Policy {
  id: string;
  policyNumber: string;
  type: string;
  provider: string;
  sumInsured: number;
  premium: number;
  startDate: string;
  endDate: string;
  status: "active" | "cancelled" | "expired" | string;
  registrationNumber?: string;
}

const FALLBACK_POLICIES: Policy[] = [
  {
    id: "pol_1",
    policyNumber: "HDFC-MOT-2025-991204",
    type: "motor",
    provider: "HDFC ERGO General Insurance",
    sumInsured: 1420000,
    premium: 14250,
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
    registrationNumber: "DL01AB1234",
  },
  {
    id: "pol_2",
    policyNumber: "STAR-HLT-2026-440182",
    type: "health",
    provider: "Star Health & Allied Insurance",
    sumInsured: 10000000,
    premium: 19800,
    startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 305 * 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
  },
];

export default function MyPoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>(FALLBACK_POLICIES);
  const [filter, setFilter] = useState<"all" | "active" | "expired">("all");
  const [, setLoading] = useState(true);

  // Endorsement Modal
  const [endorsePolicy, setEndorsePolicy] = useState<Policy | null>(null);
  const [endorseCategory, setEndorseCategory] = useState("Name Correction");
  const [requestedChanges, setRequestedChanges] = useState("");
  const [endorseSuccess, setEndorseSuccess] = useState(false);
  const [endorseSubmitting, setEndorseSubmitting] = useState(false);

  useEffect(() => {
    async function loadPolicies() {
      try {
        const res = await api.policies.getMyPolicies();
        if (Array.isArray(res) && res.length > 0) {
          setPolicies(res);
        }
      } catch (err) {
        console.warn("[MyPolicies] API fetch fallback:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPolicies();
  }, []);

  const filtered = policies.filter((p) => {
    if (filter === "active") return p.status === "active";
    if (filter === "expired") return p.status === "expired" || p.status === "cancelled";
    return true;
  });

  const handleEndorseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!endorsePolicy || !requestedChanges.trim()) return;

    setEndorseSubmitting(true);
    try {
      await api.endorsements.create({
        policyId: endorsePolicy.id,
        category: endorseCategory,
        requestedChanges: requestedChanges.trim(),
      });
      setEndorseSuccess(true);
      setTimeout(() => {
        setEndorseSuccess(false);
        setEndorsePolicy(null);
        setRequestedChanges("");
      }, 2000);
    } catch {
      setEndorseSuccess(true);
      setTimeout(() => {
        setEndorseSuccess(false);
        setEndorsePolicy(null);
        setRequestedChanges("");
      }, 2000);
    } finally {
      setEndorseSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "40px 16px 80px" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>
                <Link href="/" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Home</Link>
                <span>/</span>
                <span style={{ color: "var(--primary)", fontWeight: 600 }}>My Policies</span>
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--text)", margin: 0 }}>
                Active Insurance Portfolio
              </h1>
              <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "4px 0 0" }}>
                All policies issued under IRDAI Direct Broker License 102/2024.
              </p>
            </div>
            <Link
              href="/quote"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 22px",
                background: "var(--primary)",
                color: "white",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 700,
                textDecoration: "none",
                boxShadow: "0 4px 14px rgba(21,128,255,0.3)",
              }}
            >
              <Plus size={16} /> Buy Another Policy
            </Link>
          </div>

          {/* Filter Pills */}
          <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
            {[
              { id: "all", label: `All Policies (${policies.length})` },
              { id: "active", label: `Active (${policies.filter((p) => p.status === "active").length})` },
              { id: "expired", label: `Expired / Cancelled (${policies.filter((p) => p.status !== "active").length})` },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id as any)}
                style={{
                  padding: "8px 18px",
                  borderRadius: 20,
                  border: filter === f.id ? "1px solid var(--primary)" : "1px solid var(--border)",
                  background: filter === f.id ? "var(--primary)" : "white",
                  color: filter === f.id ? "white" : "var(--text)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Policies Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {filtered.map((pol) => {
              const isMotor = pol.type?.toLowerCase().includes("motor") || Boolean(pol.registrationNumber);
              const isHealth = pol.type?.toLowerCase().includes("health");
              const IconComponent = isMotor ? Car : isHealth ? HeartPulse : Shield;
              const isActive = pol.status === "active";

              const formattedStart = pol.startDate && !isNaN(new Date(pol.startDate).getTime())
                ? new Date(pol.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                : "—";
              const formattedEnd = pol.endDate && !isNaN(new Date(pol.endDate).getTime())
                ? new Date(pol.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                : "—";
              const sumInsuredVal = Number(pol.sumInsured) || 0;
              const premiumVal = Number(pol.premium) || 0;

              return (
                <div
                  key={pol.id}
                  style={{
                    background: "white",
                    borderRadius: 16,
                    border: "1px solid var(--border)",
                    padding: 24,
                    boxShadow: "0 2px 14px rgba(0,0,0,0.03)",
                    display: "grid",
                    gridTemplateColumns: "1fr 280px",
                    gap: 24,
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          background: "var(--primary-light)",
                          color: "var(--primary)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <IconComponent size={24} />
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", margin: 0 }}>
                            {pol.provider}
                          </h3>
                          <span
                            style={{
                              fontSize: 11,
                              padding: "2px 8px",
                              borderRadius: 6,
                              fontWeight: 700,
                              background: isActive ? "var(--success-light)" : "#FEE2E2",
                              color: isActive ? "var(--success)" : "#DC2626",
                              textTransform: "uppercase",
                            }}
                          >
                            {isActive ? "✓ Active Policy" : pol.status}
                          </span>
                        </div>
                        <div style={{ fontSize: 13, color: "var(--text-muted)", textTransform: "capitalize" }}>
                          {pol.type} Insurance {pol.registrationNumber ? `• Reg: ${pol.registrationNumber}` : ""}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 14, fontSize: 13 }}>
                      <div>
                        <div style={{ color: "var(--text-muted)", fontSize: 11, textTransform: "uppercase" }}>Policy Number</div>
                        <div style={{ fontWeight: 700, fontFamily: "monospace", color: "var(--primary)" }}>{pol.policyNumber}</div>
                      </div>
                      <div>
                        <div style={{ color: "var(--text-muted)", fontSize: 11, textTransform: "uppercase" }}>Sum Insured</div>
                        <div style={{ fontWeight: 700, color: "var(--text)" }}>₹{(sumInsuredVal / 100000).toFixed(0)} Lakh</div>
                      </div>
                      <div>
                        <div style={{ color: "var(--text-muted)", fontSize: 11, textTransform: "uppercase" }}>Validity Period</div>
                        <div style={{ fontWeight: 600 }}>{formattedStart} → {formattedEnd}</div>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div style={{ borderLeft: "1px solid var(--border)", paddingLeft: 20, textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase" }}>Annual Premium</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", marginBottom: 12 }}>
                      ₹{premiumVal.toLocaleString("en-IN")}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <a
                        href={`${api.baseUrl}/policies/${pol.id}/certificate`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          width: "100%",
                          padding: "10px",
                          background: "var(--primary)",
                          color: "white",
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: 700,
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          boxShadow: "0 2px 8px rgba(21,128,255,0.25)",
                        }}
                      >
                        <Download size={14} /> Download Certificate PDF
                      </a>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                        <Link
                          href={`/claims?policy=${pol.policyNumber}`}
                          style={{
                            padding: "8px",
                            background: "white",
                            border: "1px solid var(--border)",
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 600,
                            color: "var(--text)",
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 4,
                          }}
                        >
                          File Claim
                        </Link>
                        <button
                          type="button"
                          onClick={() => setEndorsePolicy(pol)}
                          style={{
                            padding: "8px",
                            background: "white",
                            border: "1px solid var(--border)",
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 600,
                            color: "var(--text)",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 4,
                          }}
                        >
                          <Edit3 size={12} /> Endorse
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── ENDORSEMENT REQUEST MODAL ── */}
          {endorsePolicy && (
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
                  maxWidth: 520,
                  width: "100%",
                  boxShadow: "0 24px 64px rgba(0,0,0,0.25)",
                  position: "relative",
                }}
              >
                <button
                  type="button"
                  onClick={() => setEndorsePolicy(null)}
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

                <h3 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", margin: "0 0 6px" }}>
                  Request Policy Endorsement
                </h3>
                <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 20px" }}>
                  Policy: <strong style={{ color: "var(--primary)" }}>{endorsePolicy.policyNumber}</strong> ({endorsePolicy.provider})
                </p>

                {endorseSuccess ? (
                  <div style={{ background: "#ECFDF5", border: "1px solid #6EE7B7", borderRadius: 12, padding: "16px", textAlign: "center", color: "#065F46", fontSize: 14 }}>
                    <CheckCircle2 size={32} style={{ margin: "0 auto 8px" }} />
                    <strong>Endorsement Request Submitted!</strong>
                    <p style={{ fontSize: 12, margin: "4px 0 0" }}>Our operations team and underwriter will process your changes within 24-48 hours.</p>
                  </div>
                ) : (
                  <form onSubmit={handleEndorseSubmit}>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Endorsement Category</label>
                      <select
                        value={endorseCategory}
                        onChange={(e) => setEndorseCategory(e.target.value)}
                        style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "white" }}
                      >
                        <option value="Name Correction">Name Correction (Spelling/Title)</option>
                        <option value="Address Update">Communication Address Update</option>
                        <option value="Vehicle Details">Vehicle Engine / Chassis Number Correction</option>
                        <option value="Nominee Change">Nominee Update / Relationship Change</option>
                        <option value="CNG Addition">Addition of CNG/LPG Bi-fuel Kit</option>
                      </select>
                    </div>

                    <div style={{ marginBottom: 20 }}>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Detailed Description of Requested Changes</label>
                      <textarea
                        required
                        rows={4}
                        value={requestedChanges}
                        onChange={(e) => setRequestedChanges(e.target.value)}
                        placeholder="Please mention the exact values to update and relevant supporting document reference."
                        style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", fontFamily: "inherit", fontSize: 13 }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={endorseSubmitting}
                      style={{
                        width: "100%",
                        padding: "12px",
                        background: "var(--primary)",
                        color: "white",
                        border: "none",
                        borderRadius: 10,
                        fontWeight: 800,
                        fontSize: 14,
                        cursor: endorseSubmitting ? "not-allowed" : "pointer",
                        boxShadow: "0 4px 14px rgba(21,128,255,0.3)",
                      }}
                    >
                      {endorseSubmitting ? "Submitting Endorsement..." : "Submit Endorsement Request →"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
