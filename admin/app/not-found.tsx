"use client";

import Link from "next/link";
import { ShieldAlert, LayoutDashboard, ArrowLeft } from "lucide-react";

export default function AdminNotFound() {
  return (
    <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div
        style={{
          maxWidth: 480,
          width: "100%",
          background: "var(--white)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          padding: "40px 32px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            background: "#FEF2F2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <ShieldAlert size={36} color="#DC2626" />
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", marginBottom: 8, letterSpacing: "-0.03em" }}>
          Admin Route Not Found (404)
        </h1>

        <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5, marginBottom: 28 }}>
          The broker back-office page you requested does not exist or has been moved to another section.
        </p>

        <Link
          href="/dashboard"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            background: "var(--primary)",
            color: "#fff",
            padding: "12px 20px",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 700,
            textDecoration: "none",
            width: "100%",
          }}
        >
          <LayoutDashboard size={16} /> Return to Broker Dashboard
        </Link>
      </div>
    </div>
  );
}
