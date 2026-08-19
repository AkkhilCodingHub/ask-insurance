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
  Bike,
  Plane,
  Download,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Clock,
  Plus,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

interface Policy {
  id: string;
  policyNumber: string;
  type: "motor" | "health" | "life" | "travel";
  icon: any;
  title: string;
  subtitle: string;
  insurer: string;
  sumInsured: string;
  premium: number;
  startDate: string;
  expiryDate: string;
  status: "active" | "expiring_soon" | "expired";
  daysLeft: number;
}

const POLICIES_DATA: Policy[] = [
  {
    id: "POL-1",
    policyNumber: "HDFC-MOT-2025-991204",
    type: "motor",
    icon: Car,
    title: "Hyundai Creta SX (O) Diesel",
    subtitle: "DL-01-AB-1234 • Comprehensive + Zero Dep",
    insurer: "HDFC ERGO General Insurance",
    sumInsured: "₹14,20,000 IDV",
    premium: 14250,
    startDate: "15-Aug-2025",
    expiryDate: "14-Aug-2026",
    status: "expiring_soon",
    daysLeft: 5,
  },
  {
    id: "POL-2",
    policyNumber: "STAR-HLT-2026-440182",
    type: "health",
    icon: HeartPulse,
    title: "1 Crore Super Health Shield",
    subtitle: "Family Floater (Self + Spouse + 1 Child) • 0% Copay",
    insurer: "Star Health & Allied Insurance",
    sumInsured: "₹1,00,00,000",
    premium: 19800,
    startDate: "01-Jan-2026",
    expiryDate: "31-Dec-2026",
    status: "active",
    daysLeft: 134,
  },
  {
    id: "POL-3",
    policyNumber: "ICICI-PRU-2024-118932",
    type: "life",
    icon: Shield,
    title: "iProtect Smart Term Plan",
    subtitle: "Pure Protection with Critical Illness Rider",
    insurer: "ICICI Prudential Life",
    sumInsured: "₹2,00,00,000",
    premium: 12900,
    startDate: "10-Mar-2024",
    expiryDate: "09-Mar-2054",
    status: "active",
    daysLeft: 10070,
  },
];

export default function MyPoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>(POLICIES_DATA);
  const [filter, setFilter] = useState<"all" | "active" | "expiring">("all");

  const filtered = policies.filter((p) => {
    if (filter === "active") return p.status === "active";
    if (filter === "expiring") return p.status === "expiring_soon";
    return true;
  });

  useEffect(() => {
    api.policies
      .getMyPolicies()
      .then((res: any) => {
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          // map API policies to UI
        }
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <Navbar />
      <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "40px 16px 80px" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>
                <Link href="/" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Home</Link>
                <span>/</span>
                <span style={{ color: "var(--primary)", fontWeight: 600 }}>My Policies</span>
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--text)", margin: 0 }}>
                Active Insurance Portfolio
              </h1>
            </div>
            <Link
              href="/quote"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
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
              { id: "expiring", label: `Expiring Soon (${policies.filter((p) => p.status === "expiring_soon").length})` },
            ].map((f) => (
              <button
                key={f.id}
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
              const IconComponent = pol.icon;
              const isExpiring = pol.status === "expiring_soon";
              return (
                <div
                  key={pol.id}
                  style={{
                    background: "white",
                    borderRadius: 16,
                    border: isExpiring ? "1.5px solid var(--warning)" : "1px solid var(--border)",
                    padding: 24,
                    boxShadow: "0 2px 14px rgba(0,0,0,0.03)",
                    display: "grid",
                    gridTemplateColumns: "1fr 260px",
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
                            {pol.title}
                          </h3>
                          <span
                            style={{
                              fontSize: 11,
                              padding: "2px 8px",
                              borderRadius: 6,
                              fontWeight: 700,
                              background: isExpiring ? "var(--warning-light)" : "var(--success-light)",
                              color: isExpiring ? "var(--warning)" : "var(--success)",
                            }}
                          >
                            {isExpiring ? `Expires in ${pol.daysLeft} Days` : "Active Policy"}
                          </span>
                        </div>
                        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{pol.subtitle}</div>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 14, fontSize: 13 }}>
                      <div>
                        <div style={{ color: "var(--text-muted)", fontSize: 11, textTransform: "uppercase" }}>Policy Number</div>
                        <div style={{ fontWeight: 700, fontFamily: "monospace", color: "var(--text)" }}>{pol.policyNumber}</div>
                      </div>
                      <div>
                        <div style={{ color: "var(--text-muted)", fontSize: 11, textTransform: "uppercase" }}>Sum Insured</div>
                        <div style={{ fontWeight: 700, color: "var(--primary)" }}>{pol.sumInsured}</div>
                      </div>
                      <div>
                        <div style={{ color: "var(--text-muted)", fontSize: 11, textTransform: "uppercase" }}>Validity</div>
                        <div style={{ fontWeight: 600 }}>{pol.startDate} → {pol.expiryDate}</div>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div style={{ borderLeft: "1px solid var(--border)", paddingLeft: 20, textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase" }}>Annual Premium</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", marginBottom: 12 }}>
                      ₹{pol.premium.toLocaleString("en-IN")}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {isExpiring ? (
                        <Link
                          href={`/quote?type=${pol.type}&renew=${pol.policyNumber}`}
                          style={{
                            width: "100%",
                            padding: "10px",
                            background: "var(--warning)",
                            color: "white",
                            borderRadius: 8,
                            fontSize: 13,
                            fontWeight: 700,
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                          }}
                        >
                          <RotateCcw size={14} /> 1-Click Renew Now
                        </Link>
                      ) : (
                        <Link
                          href={`/claims?policy=${pol.policyNumber}`}
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
                          }}
                        >
                          File a Claim <ArrowRight size={14} />
                        </Link>
                      )}

                      <button
                        onClick={() => alert(`Downloading Official Signed Policy PDF Schedule for ${pol.policyNumber}...`)}
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
                          gap: 6,
                        }}
                      >
                        <Download size={13} /> Download Policy Kit
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
