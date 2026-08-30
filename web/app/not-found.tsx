"use client";

import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ShieldAlert, Home, Search, PhoneCall, Shield } from "lucide-react";

export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      <Navbar />
      
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 24px" }}>
        <div
          style={{
            maxWidth: 580,
            width: "100%",
            background: "var(--white)",
            border: "1px solid var(--border)",
            borderRadius: 24,
            padding: "48px 36px",
            textAlign: "center",
            boxShadow: "0 20px 40px -15px rgba(26,107,245,0.08)",
            position: "relative",
            overflow: "hidden",
          }}
          className="animate-fade-up"
        >
          {/* Subtle accent backdrop circle */}
          <div
            style={{
              position: "absolute",
              top: -60,
              right: -60,
              width: 200,
              height: 200,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(26,107,245,0.1) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          {/* 404 Visual Icon */}
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 24,
              background: "var(--primary-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
              position: "relative",
            }}
          >
            <ShieldAlert size={44} color="var(--primary)" strokeWidth={2} />
            <span
              style={{
                position: "absolute",
                top: -6,
                right: -6,
                background: "#EF4444",
                color: "#fff",
                fontSize: 11,
                fontWeight: 900,
                padding: "2px 8px",
                borderRadius: 100,
              }}
            >
              404
            </span>
          </div>

          <h1 style={{ fontSize: "clamp(24px, 4vw, 32px)", fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 10 }}>
            Policy Page Not Found
          </h1>

          <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 32 }}>
            The insurance policy page or link you are looking for might have been moved, renamed, or expired.
          </p>

          {/* Navigation Action Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Link
              href="/"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                background: "linear-gradient(135deg, var(--primary), var(--accent-dark))",
                color: "#fff",
                padding: "14px 24px",
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 700,
                textDecoration: "none",
                transition: "all 0.15s ease",
                boxShadow: "0 4px 14px rgba(26,107,245,0.25)",
              }}
            >
              <Home size={18} /> Return to Homepage
            </Link>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Link
                href="/products"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                  padding: "12px 16px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                <Search size={15} color="var(--primary)" /> Browse Products
              </Link>
              <Link
                href="/claims"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                  padding: "12px 16px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                <PhoneCall size={15} color="#059669" /> Claim Assistance
              </Link>
            </div>
          </div>

          <div style={{ marginTop: 32, paddingTop: 20, borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Shield size={16} color="var(--text-muted)" />
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>ASK Insurance · IRDAI Registered Insurance Broker</span>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
