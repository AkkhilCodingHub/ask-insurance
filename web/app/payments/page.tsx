"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Download, CreditCard, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";

interface PaymentItem {
  id: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  providerRef?: string | null;
  createdAt: string;
  policy?: {
    id: string;
    policyNumber: string;
    type: string;
    provider: string;
  } | null;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPayments() {
      try {
        const data = await api.payments.list();
        setPayments(Array.isArray(data) ? data : []);
      } catch (err) {
        console.warn("[PaymentsPage] Failed to fetch payments:", err);
        setPayments([]);
      } finally {
        setLoading(false);
      }
    }
    loadPayments();
  }, []);

  const totalPaid = payments
    .filter((p) => p.status === "success")
    .reduce((acc, p) => acc + (p.amount || 0), 0);

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return isNaN(d.getTime())
        ? "—"
        : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return "—";
    }
  };

  return (
    <>
      <Navbar />
      <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "40px 16px 80px" }}>
        <div style={{ maxWidth: 1040, margin: "0 auto" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>
                <Link href="/" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Home</Link>
                <span>/</span>
                <span style={{ color: "var(--primary)", fontWeight: 600 }}>Payment History & Receipts</span>
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--text)", margin: 0 }}>
                Premium Payments & Tax Receipts
              </h1>
            </div>

            <button
              onClick={() => alert("Generating Consolidated 80D / 80C Tax Exemption Summary Statement for FY 2025-26...")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
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
              <Download size={16} /> Download 80D Certificate
            </button>
          </div>

          {/* Tax Benefit Banner */}
          <div
            style={{
              background: "linear-gradient(135deg, #0A1628 0%, #1580FF 100%)",
              borderRadius: 16,
              padding: 24,
              color: "white",
              marginBottom: 32,
              boxShadow: "0 8px 24px rgba(21,128,255,0.15)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <span style={{ background: "rgba(255,255,255,0.2)", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
                Tax Savings Under IT Act 1961
              </span>
              <h3 style={{ fontSize: 20, fontWeight: 800, margin: "8px 0 4px" }}>
                Save up to ₹75,000 in Income Tax with Health & Life Insurance
              </h3>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", margin: 0 }}>
                Download official IRDAI digitally signed tax exemption receipts under Section 80D (Health) & Section 80C (Life).
              </p>
            </div>
          </div>

          {/* Transactions Table */}
          <div style={{ background: "white", borderRadius: 16, border: "1px solid var(--border)", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.02)" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: "var(--text)", margin: 0 }}>
                Transaction History
              </h3>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                Total Paid: <strong>₹{totalPaid.toLocaleString("en-IN")}</strong>
              </span>
            </div>

            {loading ? (
              <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-muted)" }}>
                Loading payment records...
              </div>
            ) : payments.length === 0 ? (
              <div style={{ padding: "64px 24px", textAlign: "center" }}>
                <div style={{ width: 56, height: 56, borderRadius: 28, background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "var(--text-muted)" }}>
                  <CreditCard size={28} />
                </div>
                <h4 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
                  No Payments Recorded Yet
                </h4>
                <p style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 400, margin: "0 auto 20px" }}>
                  Your premium payments, official policy schedules, and 80D tax receipts will appear here once you purchase an insurance policy.
                </p>
                <Link
                  href="/products"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "10px 18px",
                    background: "var(--primary)",
                    color: "white",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  <ShieldCheck size={16} /> Explore Insurance Plans
                </Link>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: "var(--bg)", color: "var(--text-muted)", fontSize: 12, textTransform: "uppercase" }}>
                      <th style={{ padding: "12px 24px" }}>Transaction ID / Date</th>
                      <th style={{ padding: "12px 20px" }}>Policy & Insurer</th>
                      <th style={{ padding: "12px 20px" }}>Payment Mode</th>
                      <th style={{ padding: "12px 20px" }}>Amount</th>
                      <th style={{ padding: "12px 24px", textAlign: "right" }}>Schedule / Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((pay) => (
                      <tr key={pay.id} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "16px 24px" }}>
                          <div style={{ fontWeight: 700, fontFamily: "monospace", color: "var(--text)" }}>
                            {pay.providerRef || pay.id.slice(-10).toUpperCase()}
                          </div>
                          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                            {formatDate(pay.createdAt)}
                          </div>
                        </td>
                        <td style={{ padding: "16px 20px" }}>
                          <div style={{ fontWeight: 700, color: "var(--text)" }}>
                            {pay.policy?.provider || "ASK Insurance"}
                          </div>
                          <div style={{ fontSize: 12, color: "var(--primary)", fontFamily: "monospace" }}>
                            {pay.policy?.policyNumber || "Policy Pending"}
                          </div>
                        </td>
                        <td style={{ padding: "16px 20px", color: "var(--text-muted)" }}>
                          Razorpay {pay.provider ? `(${pay.provider.toUpperCase()})` : ""}
                        </td>
                        <td style={{ padding: "16px 20px", fontWeight: 800, color: "var(--text)", fontSize: 15 }}>
                          ₹{(pay.amount || 0).toLocaleString("en-IN")}
                        </td>
                        <td style={{ padding: "16px 24px", textAlign: "right" }}>
                          {pay.policy?.id ? (
                            <a
                              href={api.policies.getCertificateUrl(pay.policy.id)}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "6px 12px",
                                background: "white",
                                border: "1px solid var(--border)",
                                borderRadius: 8,
                                fontSize: 12,
                                fontWeight: 600,
                                color: "var(--primary)",
                                textDecoration: "none",
                              }}
                            >
                              <Download size={13} /> Schedule
                            </a>
                          ) : (
                            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Processing</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
