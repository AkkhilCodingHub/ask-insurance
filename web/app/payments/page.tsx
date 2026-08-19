"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CreditCard,
  Download,
  CheckCircle2,
  FileCheck,
  Calendar,
  ArrowRight,
  Shield,
  FileText,
  DollarSign,
} from "lucide-react";

interface PaymentRecord {
  id: string;
  txId: string;
  policyNumber: string;
  insurer: string;
  amount: number;
  date: string;
  mode: "UPI (AutoPay)" | "Credit Card" | "Net Banking";
  status: "success" | "pending";
  taxEligible: "80D" | "80C" | "General";
}

const PAYMENTS_HISTORY: PaymentRecord[] = [
  {
    id: "PAY-1",
    txId: "TXN-2026-0818-8921",
    policyNumber: "HDFC-MOT-2025-991204",
    insurer: "HDFC ERGO General Insurance",
    amount: 14250,
    date: "15 Aug 2025",
    mode: "UPI (AutoPay)",
    status: "success",
    taxEligible: "General",
  },
  {
    id: "PAY-2",
    txId: "TXN-2026-0101-4412",
    policyNumber: "STAR-HLT-2026-440182",
    insurer: "Star Health & Allied Insurance",
    amount: 19800,
    date: "01 Jan 2026",
    mode: "Credit Card",
    status: "success",
    taxEligible: "80D",
  },
  {
    id: "PAY-3",
    txId: "TXN-2024-0310-9901",
    policyNumber: "ICICI-PRU-2024-118932",
    insurer: "ICICI Prudential Life",
    amount: 12900,
    date: "10 Mar 2024",
    mode: "Net Banking",
    status: "success",
    taxEligible: "80C",
  },
];

export default function PaymentsPage() {
  const [payments] = useState<PaymentRecord[]>(PAYMENTS_HISTORY);

  return (
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
              Total Paid: <strong>₹{payments.reduce((acc, p) => acc + p.amount, 0).toLocaleString("en-IN")}</strong>
            </span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "var(--bg)", color: "var(--text-muted)", fontSize: 12, textTransform: "uppercase" }}>
                  <th style={{ padding: "12px 24px" }}>Transaction ID / Date</th>
                  <th style={{ padding: "12px 20px" }}>Policy & Insurer</th>
                  <th style={{ padding: "12px 20px" }}>Payment Mode</th>
                  <th style={{ padding: "12px 20px" }}>Tax Benefit</th>
                  <th style={{ padding: "12px 20px" }}>Amount</th>
                  <th style={{ padding: "12px 24px", textAlign: "right" }}>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((pay) => (
                  <tr key={pay.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "16px 24px" }}>
                      <div style={{ fontWeight: 700, fontFamily: "monospace", color: "var(--text)" }}>{pay.txId}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{pay.date}</div>
                    </td>
                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ fontWeight: 700, color: "var(--text)" }}>{pay.insurer}</div>
                      <div style={{ fontSize: 12, color: "var(--primary)", fontFamily: "monospace" }}>{pay.policyNumber}</div>
                    </td>
                    <td style={{ padding: "16px 20px", color: "var(--text-muted)" }}>
                      {pay.mode}
                    </td>
                    <td style={{ padding: "16px 20px" }}>
                      <span
                        style={{
                          background: pay.taxEligible === "80D" ? "var(--success-light)" : pay.taxEligible === "80C" ? "var(--primary-light)" : "var(--bg)",
                          color: pay.taxEligible === "80D" ? "var(--success)" : pay.taxEligible === "80C" ? "var(--primary)" : "var(--text-muted)",
                          padding: "3px 8px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {pay.taxEligible === "General" ? "Standard" : `Section ${pay.taxEligible}`}
                      </span>
                    </td>
                    <td style={{ padding: "16px 20px", fontWeight: 800, color: "var(--text)", fontSize: 15 }}>
                      ₹{pay.amount.toLocaleString("en-IN")}
                    </td>
                    <td style={{ padding: "16px 24px", textAlign: "right" }}>
                      <button
                        onClick={() => alert(`Downloading GST Tax Invoice for ${pay.txId}...`)}
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
                          cursor: "pointer",
                        }}
                      >
                        <Download size={13} /> Invoice
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
