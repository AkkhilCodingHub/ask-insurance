"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Shield, Lock, FileText, CheckCircle2, ChevronRight, Mail, Phone, MapPin, Download } from "lucide-react";

const SECTIONS = [
  {
    id: "who-we-are",
    title: "1. Who We Are & Regulatory Status",
    content: (
      <>
        <p>
          <strong>ASK Insurance Broker Private Limited</strong> (&apos;ASK&apos;, &apos;we&apos;, &apos;us&apos;, or &apos;our&apos;) is registered as a Direct Insurance Broker (Life &amp; General) with the <strong>Insurance Regulatory and Development Authority of India (IRDAI)</strong> under License No. <strong>882</strong> (Category: Direct Broker - Life &amp; General) in accordance with the IRDAI (Insurance Brokers) Regulations, 2018.
        </p>
        <p>
          This Privacy Policy sets out how we collect, process, store, and protect your personal and financial data across our website (<strong>askinsurance.in</strong>), mobile applications, and customer portal in strict compliance with the <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong> and IRDAI cybersecurity guidelines.
        </p>
      </>
    ),
  },
  {
    id: "data-collected",
    title: "2. Personal Data We Collect",
    content: (
      <>
        <p>To provide quotes, facilitate policy underwriting, and process cashless claims, we collect the following categories of data:</p>
        <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
          <li><strong>Identity Data:</strong> Full Name, Date of Birth, Gender, PAN Card number, Aadhaar / CKYC identifier.</li>
          <li><strong>Contact Information:</strong> Mobile Number, Email Address, Residential and Communication Postal Address with PIN code.</li>
          <li><strong>Vehicle &amp; Asset Data:</strong> Vehicle Registration Number, Engine Number, Chassis Number, Manufacturing Year, Previous Policy Copy, and Claim History.</li>
          <li><strong>Health &amp; Medical Declarations:</strong> Pre-existing medical conditions, surgical history, hospitalization records, lifestyle habits (tobacco/alcohol usage).</li>
          <li><strong>Financial &amp; Payment Data:</strong> Bank Account / UPI VPA for commission payouts or claim reimbursements. Payment card details are processed directly by RBI-authorized PCI-DSS Level 1 payment gateways and are never stored on our servers.</li>
          <li><strong>Technical &amp; Log Data:</strong> IP address, browser type, device identifier, session cookies, and security telemetry.</li>
        </ul>
      </>
    ),
  },
  {
    id: "purpose-of-processing",
    title: "3. Purpose and Legal Basis of Processing",
    content: (
      <>
        <p>Your personal data is processed strictly for legitimate insurance purposes:</p>
        <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
          <li>To compare insurance products from 40+ IRDAI-registered insurance companies and generate personalized quotes.</li>
          <li>To transmit proposal forms and KYC records to chosen insurers for policy issuance.</li>
          <li>To verify customer identity as mandated by IRDAI Anti-Money Laundering (AML) and CKYC norms.</li>
          <li>To assist with 24/7 cashless hospital admissions, accident towing, surveyor inspection, and claim advocacy.</li>
          <li>To send statutory policy renewal notices, endorsement updates, and claims status communications via SMS and Email.</li>
          <li>To detect and prevent fraudulent claims and cybersecurity threats.</li>
        </ul>
      </>
    ),
  },
  {
    id: "data-sharing",
    title: "4. Data Sharing & Disclosure",
    content: (
      <>
        <p>We share your data only on a strictly need-to-know basis with:</p>
        <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
          <li><strong>Authorized Insurance Companies:</strong> (e.g., HDFC ERGO, ICICI Lombard, Star Health, Tata AIG, Care Health, LIC) to underwrite and issue your policy.</li>
          <li><strong>Third Party Administrators (TPAs) &amp; Cashless Garages:</strong> To authorize cashless hospitalization and repair claims.</li>
          <li><strong>Regulatory Authorities:</strong> IRDAI, Financial Intelligence Unit (FIU-IND), and statutory law enforcement bodies when mandated by Indian law.</li>
        </ul>
        <div style={{ background: "var(--success-light)", color: "var(--success)", padding: 14, borderRadius: 10, fontWeight: 700, marginTop: 12 }}>
          🔒 <strong>Zero Third-Party Advertising:</strong> We do NOT sell, rent, or trade your personal data to marketing telemarketers, data brokers, or advertising networks.
        </div>
      </>
    ),
  },
  {
    id: "dpdp-rights",
    title: "5. Your Rights Under the DPDP Act 2023",
    content: (
      <>
        <p>As a Data Principal under India&apos;s Digital Personal Data Protection Act 2023, you have the right to:</p>
        <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
          <li><strong>Right to Access:</strong> Request a full summary of your personal data processed by ASK Insurance.</li>
          <li><strong>Right to Correction:</strong> Update inaccurate or out-of-date personal, contact, or nominee records.</li>
          <li><strong>Right to Erasure:</strong> Request deletion of your account and data, subject to the mandatory 5-year record retention requirement prescribed by IRDAI for insurance intermediaries.</li>
          <li><strong>Right of Grievance Redressal:</strong> File a formal grievance regarding any data processing concern.</li>
          <li><strong>Right to Nominate:</strong> Nominate a representative to exercise your data rights in the event of death or incapacity.</li>
        </ul>
      </>
    ),
  },
  {
    id: "security",
    title: "6. Security & Storage in India",
    content: (
      <>
        <p>
          All customer data is hosted in ISO 27001 and SOC-2 certified tier-4 cloud data centers located physically within the territory of India (Mumbai / Delhi NCR).
        </p>
        <p>
          We employ <strong>256-bit AES encryption</strong> for stored data, <strong>TLS 1.3 encryption</strong> for data in transit, automated vulnerability assessments, and strict multi-factor authentication (MFA) for employee access.
        </p>
      </>
    ),
  },
  {
    id: "grievance-officer",
    title: "7. Grievance Redressal Officer & Contact",
    content: (
      <>
        <p>If you have any questions, feedback, or grievances regarding this Privacy Policy, please contact our designated officer:</p>
        <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: 20, marginTop: 12 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: "var(--text)", marginBottom: 6 }}>Grievance Redressal Officer</div>
          <div style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.6 }}>
            <div><strong>Designation:</strong> Principal Compliance Officer</div>
            <div><strong>Company:</strong> ASK Insurance Brokers Private Limited</div>
            <div><strong>Email:</strong> <a href="mailto:grievance@askinsurance.in" style={{ color: "var(--primary)" }}>grievance@askinsurance.in</a> / <a href="mailto:compliance@askinsurance.in" style={{ color: "var(--primary)" }}>compliance@askinsurance.in</a></div>
            <div><strong>Toll-Free Helpline:</strong> 1800-209-9090 (Monday to Saturday, 9:30 AM to 6:30 PM IST)</div>
            <div><strong>Address:</strong> ASK House, Sector 62, Noida, Uttar Pradesh - 201309, India</div>
          </div>
        </div>
      </>
    ),
  },
];

export default function PrivacyPolicyPage() {
  const [activeSection, setActiveSection] = useState("who-we-are");

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "40px 16px 80px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Header Breadcrumbs */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
          <Link href="/" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Home</Link>
          <span>/</span>
          <span style={{ color: "var(--primary)", fontWeight: 600 }}>Privacy Policy</span>
        </div>

        {/* Hero title card */}
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
              <Lock size={14} /> DPDP Act 2023 &amp; IRDAI Compliant
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 900, margin: "12px 0 6px" }}>
              Privacy Policy &amp; Data Protection
            </h1>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", margin: 0 }}>
              Last Updated: August 2026 • Valid for all ASK Insurance Web, Mobile &amp; POSP Services
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

        {/* Content Layout: Sticky Sidebar Navigation + Article Content */}
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
              Table of Contents
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {SECTIONS.map((sec) => (
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
                Need emergency support?
              </div>
              <Link
                href="/emergency-sos"
                style={{
                  color: "var(--error)",
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                24x7 Roadside SOS Desk →
              </Link>
            </div>
          </div>

          {/* Right Main Policy Content */}
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
            {SECTIONS.map((sec) => (
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
