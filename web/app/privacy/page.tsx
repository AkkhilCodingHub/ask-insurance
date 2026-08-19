"use client";

import React from "react";
import Link from "next/link";
import { Shield, Lock, FileText, CheckCircle2 } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "40px 16px 80px" }}>
      <div style={{ maxWidth: 880, margin: "0 auto", background: "white", borderRadius: 18, border: "1px solid var(--border)", padding: "40px 36px", boxShadow: "0 2px 14px rgba(0,0,0,0.02)" }}>
        {/* Header */}
        <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: 20, marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <Shield size={26} style={{ color: "var(--primary)" }} />
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--text)", margin: 0 }}>
              Privacy Policy
            </h1>
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Last Updated: August 2026 • Compliant with IRDAI (Protection of Policyholders' Interests) Regulations
          </div>
        </div>

        <div style={{ color: "var(--text)", fontSize: 14, lineHeight: 1.7, display: "flex", flexDirection: "column", gap: 24 }}>
          <section>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>1. Introduction & Overview</h2>
            <p style={{ margin: 0, color: "var(--text-muted)" }}>
              ASK Insurance Brokers Private Limited ("ASK", "we", "our", or "us") is an IRDAI-licensed direct insurance broker (License No. 882). We are committed to protecting the privacy and personal financial data of our customers, policyholders, and POSP partners.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>2. Information We Collect</h2>
            <p style={{ margin: "0 0 8px", color: "var(--text-muted)" }}>
              To provide accurate insurance quotes, facilitate policy underwriting, and process cashless claims, we collect:
            </p>
            <ul style={{ paddingLeft: 20, margin: 0, color: "var(--text-muted)" }}>
              <li><strong>Personal Identifiers:</strong> Full Name, Date of Birth, Email, Mobile Number, Communication Address.</li>
              <li><strong>KYC Documents:</strong> PAN Card Number, Aadhaar / CKYC identifier, and address proofs.</li>
              <li><strong>Vehicle Information:</strong> Registration Number, Chassis / Engine Number, Make, Model, and Previous Policy details.</li>
              <li><strong>Medical & Health Declarations:</strong> Pre-existing medical conditions, surgical history, and family medical records.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>3. How We Use & Secure Your Data</h2>
            <p style={{ margin: 0, color: "var(--text-muted)" }}>
              We use 256-bit AES SSL encryption to safeguard all transmitted data. Your data is strictly shared with authorized insurance companies (such as HDFC ERGO, ICICI Lombard, Star Health, etc.) solely for the purpose of policy issuance, renewal, and claim settlement. We do not sell your data to any third-party advertisers.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>4. Grievance Officer & Contact</h2>
            <p style={{ margin: "0 0 8px", color: "var(--text-muted)" }}>
              In accordance with IRDAI guidelines, our designated Grievance Redressal Officer can be reached at:
            </p>
            <div style={{ background: "var(--bg)", padding: 16, borderRadius: 10, border: "1px solid var(--border)", fontSize: 13 }}>
              <div><strong>Grievance Officer:</strong> Principal Compliance Officer, ASK Insurance Brokers</div>
              <div><strong>Email:</strong> compliance@askinsurance.in / support@askinsurance.in</div>
              <div><strong>Toll-Free Helpline:</strong> 1800-209-9090 (Mon-Sat, 9 AM - 7 PM)</div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
