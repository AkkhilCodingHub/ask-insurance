"use client";

import React from "react";
import Link from "next/link";
import { FileText, Shield, CheckCircle2 } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "40px 16px 80px" }}>
      <div style={{ maxWidth: 880, margin: "0 auto", background: "white", borderRadius: 18, border: "1px solid var(--border)", padding: "40px 36px", boxShadow: "0 2px 14px rgba(0,0,0,0.02)" }}>
        {/* Header */}
        <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: 20, marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <FileText size={26} style={{ color: "var(--primary)" }} />
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--text)", margin: 0 }}>
              Terms of Service & Broker Disclaimer
            </h1>
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Effective: August 2026 • Governed by the Laws of the Republic of India
          </div>
        </div>

        <div style={{ color: "var(--text)", fontSize: 14, lineHeight: 1.7, display: "flex", flexDirection: "column", gap: 24 }}>
          <section>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>1. Role as an Insurance Broker</h2>
            <p style={{ margin: 0, color: "var(--text-muted)" }}>
              ASK Insurance Brokers Pvt. Ltd. acts as an IRDAI-registered Direct Broker facilitating insurance quotes, comparisons, policy purchases, and claim support. Insurance is the subject matter of solicitation. Policy underwriting, acceptance, and claim settlement remain at the sole discretion of the respective insurance company.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>2. Accuracy of Information & Utmost Good Faith</h2>
            <p style={{ margin: 0, color: "var(--text-muted)" }}>
              Insurance contracts in India operate under the doctrine of <em>Uberrimae Fidei</em> (Utmost Good Faith). The customer is responsible for disclosing all true and material facts regarding previous claims, pre-existing medical conditions, vehicle modifications, and nominee details. Concealment or misrepresentation may lead to rejection of claims by the insurer.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>3. Free Look Period & Cancellation</h2>
            <p style={{ margin: 0, color: "var(--text-muted)" }}>
              In accordance with IRDAI regulations, life and health insurance policies come with a 15 to 30 day Free Look Period starting from the date of physical or electronic policy receipt. During this period, policyholders may cancel the policy for a refund minus applicable stamp duty, medical test charges, and proportionate risk premium.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>4. Governing Law & Jurisdiction</h2>
            <p style={{ margin: 0, color: "var(--text-muted)" }}>
              These Terms of Service are governed by the laws of India. Any disputes arising out of the use of this website or mobile application shall be subject to the exclusive jurisdiction of the competent courts in New Delhi, India.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
