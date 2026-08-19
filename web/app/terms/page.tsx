"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FileText, Shield, Scale, Download, AlertCircle, CheckCircle2, HelpCircle } from "lucide-react";

const TERMS_SECTIONS = [
  {
    id: "acceptance",
    title: "1. Acceptance of Terms",
    content: (
      <>
        <p>
          By accessing or using the ASK Insurance website (<strong>askinsurance.in</strong>), mobile applications, APIs, or customer portal, you agree to be bound by these Terms of Service (&apos;Terms&apos;). If you do not agree to these Terms, you must not access or use our services.
        </p>
        <p>
          These Terms constitute a legally binding agreement between you and <strong>ASK Insurance Brokers Private Limited</strong> (&apos;ASK&apos;, &apos;we&apos;, &apos;us&apos;).
        </p>
      </>
    ),
  },
  {
    id: "broker-status",
    title: "2. About ASK Insurance & IRDAI License",
    content: (
      <>
        <p>
          ASK Insurance Brokers Private Limited is registered as a <strong>Direct Insurance Broker (Life &amp; General)</strong> under the <em>Insurance Regulatory and Development Authority of India (Insurance Brokers) Regulations, 2018</em> with IRDAI License No. <strong>882</strong>.
        </p>
        <p>
          As an independent insurance broker, we represent <strong>you (the policyholder)</strong>, not any single insurance company. Our statutory role is to:
        </p>
        <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
          <li>Provide unbiased, objective comparisons across 40+ IRDAI-registered general and life insurers.</li>
          <li>Assist you in selecting coverage that aligns with your specific risk profile and budget.</li>
          <li>Advocate on your behalf during claims, cashless approvals, and dispute resolutions.</li>
        </ul>
      </>
    ),
  },
  {
    id: "underwriting-disclaimer",
    title: "3. Scope of Service & Underwriting Disclaimer",
    content: (
      <>
        <div style={{ background: "var(--warning-light)", color: "#92400E", padding: 14, borderRadius: 10, fontWeight: 600, marginBottom: 12 }}>
          ⚠️ <strong>Insurance is the Subject Matter of Solicitation:</strong> Quotes generated on our platform are indicative estimates. Policy issuance, acceptance of risk, premium loading, and claim settlements are subject to the sole underwriting discretion of the respective insurance company.
        </div>
        <p>
          ASK Insurance does not underwrite risk or guarantee policy issuance. All contracts of insurance are executed directly between you and the respective insurer.
        </p>
      </>
    ),
  },
  {
    id: "user-obligations",
    title: "4. Duty of Utmost Good Faith (Uberrimae Fidei)",
    content: (
      <>
        <p>
          Insurance contracts in India are governed by the fundamental legal doctrine of <strong>Uberrimae Fidei (Utmost Good Faith)</strong>. You agree to:
        </p>
        <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
          <li>Disclose all true, complete, and material facts regarding previous accidents, pre-existing medical conditions, vehicle modifications, and claims history.</li>
          <li>Ensure all nominee, age, and identity records match government KYC documents exactly.</li>
          <li>Understand that non-disclosure, concealment, or fraudulent misrepresentation can render the policy void <em>ab initio</em> and result in rejection of claims by the insurer under Section 45 of the Insurance Act, 1938.</li>
        </ul>
      </>
    ),
  },
  {
    id: "free-look-period",
    title: "5. Free Look Period & Policy Cancellation",
    content: (
      <>
        <p>
          In accordance with IRDAI (Protection of Policyholders&apos; Interests) Regulations:
        </p>
        <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
          <li><strong>Life &amp; Health Policies:</strong> You are entitled to a <strong>15-day Free Look Period</strong> (30 days for policies purchased electronically/online) from the date of policy schedule receipt to review terms.</li>
          <li>If you disagree with any terms, you may cancel the policy during this period for a full refund of premium, less proportionate risk premium for the period on cover, medical examination expenses incurred by the insurer, and stamp duty charges.</li>
          <li><strong>Motor Insurance:</strong> Cancellation of standalone own-damage or comprehensive motor insurance requires proof of alternative active insurance coverage on the vehicle.</li>
        </ul>
      </>
    ),
  },
  {
    id: "claims-assistance",
    title: "6. Claims Assistance & Insurance Ombudsman",
    content: (
      <>
        <p>
          ASK Insurance provides 24/7 dedicated cashless claim assistance and documentation support. If a claim is rejected or disputed by an insurer, our grievance team will guide you through internal grievance redressal and the <strong>Insurance Ombudsman</strong> network established under the Insurance Ombudsman Rules, 2017.
        </p>
        <p>
          Ombudsman offices are situated across New Delhi, Mumbai, Bengaluru, Chennai, Kolkata, Hyderabad, Ahmedabad, Chandigarh, and Pune for free, speedy resolution of insurance disputes up to ₹50 Lakhs.
        </p>
      </>
    ),
  },
  {
    id: "posp-code",
    title: "7. POSP Agent Partner Code of Conduct",
    content: (
      <>
        <p>
          Point of Sales Persons (POSP) registered through the ASK platform must strictly adhere to the IRDAI Guidelines on Point of Sales Persons (2015 &amp; amendments). POSPs shall not:
        </p>
        <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
          <li>Induce or force customers to purchase insurance products through misleading statements or premium rebating (prohibited under Section 41 of the Insurance Act, 1938).</li>
          <li>Collect premiums in personal bank accounts; all premium payments must be routed directly to the insurer or broker escrow.</li>
          <li>Operate as a POSP with more than one insurance intermediary concurrently.</li>
        </ul>
      </>
    ),
  },
  {
    id: "governing-law",
    title: "8. Governing Law & Jurisdiction",
    content: (
      <>
        <p>
          These Terms of Service and any contractual or non-contractual disputes arising out of the use of ASK Insurance services shall be governed exclusively by and construed in accordance with the laws of the Republic of India.
        </p>
        <p>
          The competent courts in <strong>New Delhi, India</strong> shall have exclusive jurisdiction to settle any dispute or claim arising under these Terms.
        </p>
      </>
    ),
  },
];

export default function TermsOfServicePage() {
  const [activeSection, setActiveSection] = useState("acceptance");

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "40px 16px 80px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
          <Link href="/" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Home</Link>
          <span>/</span>
          <span style={{ color: "var(--primary)", fontWeight: 600 }}>Terms of Service</span>
        </div>

        {/* Hero banner */}
        <div
          style={{
            background: "linear-gradient(135deg, #0A1628 0%, #1580FF 100%)",
            borderRadius: 20,
            padding: "36px 32px",
            color: "white",
            marginBottom: 32,
            boxShadow: "0 8px 32px rgba(21,128,255,0.15)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 20,
          }}
        >
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.15)", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 800, textTransform: "uppercase" }}>
              <Scale size={14} /> IRDAI Broker License Reg. No. 882
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 900, margin: "12px 0 6px" }}>
              Terms of Service &amp; Broker Terms
            </h1>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", margin: 0 }}>
              Effective Date: August 2026 • Governed by Insurance Act 1938 &amp; IRDAI Regulations
            </p>
          </div>

          <button
            onClick={() => window.print()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 20px",
              background: "white",
              color: "var(--primary)",
              borderRadius: 10,
              border: "none",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            <Download size={15} /> Print / Save PDF
          </button>
        </div>

        {/* Grid layout */}
        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 32, alignItems: "flex-start" }}>
          {/* Left Table of Contents */}
          <div
            style={{
              background: "white",
              borderRadius: 16,
              border: "1px solid var(--border)",
              padding: 20,
              position: "sticky",
              top: 90,
              boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 14, letterSpacing: "0.5px" }}>
              Sections
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {TERMS_SECTIONS.map((sec) => (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  onClick={() => setActiveSection(sec.id)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: activeSection === sec.id ? 700 : 500,
                    color: activeSection === sec.id ? "var(--primary)" : "var(--text)",
                    background: activeSection === sec.id ? "var(--primary-light)" : "transparent",
                    textDecoration: "none",
                    transition: "all 0.15s ease",
                    display: "block",
                  }}
                >
                  {sec.title}
                </a>
              ))}
            </div>

            <div style={{ marginTop: 24, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
                Looking for Data Privacy?
              </div>
              <Link
                href="/privacy"
                style={{
                  color: "var(--primary)",
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                View Privacy Policy →
              </Link>
            </div>
          </div>

          {/* Right Main Content */}
          <div
            style={{
              background: "white",
              borderRadius: 18,
              border: "1px solid var(--border)",
              padding: 36,
              boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
              display: "flex",
              flexDirection: "column",
              gap: 32,
            }}
          >
            {TERMS_SECTIONS.map((sec) => (
              <section key={sec.id} id={sec.id} style={{ scrollMarginTop: 100 }}>
                <h2 style={{ fontSize: 19, fontWeight: 800, color: "var(--text)", marginBottom: 12, borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
                  {sec.title}
                </h2>
                <div style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.7 }}>
                  {sec.content}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
