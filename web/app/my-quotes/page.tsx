"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Car,
  HeartPulse,
  Shield,
  Bike,
  Plane,
  Download,
  Share2,
  Trash2,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Layers,
} from "lucide-react";

interface SavedQuote {
  id: string;
  type: string;
  icon: any;
  title: string;
  subtitle: string;
  insurer: string;
  idvCover: string;
  premium: number;
  date: string;
  expiryDate: string;
  status: "active" | "expiring_soon" | "expired";
  addons: string[];
}

const INITIAL_QUOTES: SavedQuote[] = [
  {
    id: "Q-2026-8819",
    type: "motor",
    icon: Car,
    title: "Hyundai Creta SX (O) Diesel",
    subtitle: "DL-01-AB-1234 • 2022 Model",
    insurer: "HDFC ERGO General Insurance",
    idvCover: "₹14,20,000",
    premium: 14250,
    date: "18 Aug 2026",
    expiryDate: "25 Aug 2026",
    status: "active",
    addons: ["Zero Depreciation", "24x7 Roadside Assistance", "Engine Protect"],
  },
  {
    id: "Q-2026-7734",
    type: "health",
    icon: HeartPulse,
    title: "1 Crore Super Health Cover",
    subtitle: "2 Adults (Self + Spouse) • 0% Copay",
    insurer: "Star Health & Allied Insurance",
    idvCover: "₹1,00,00,000",
    premium: 18900,
    date: "15 Aug 2026",
    expiryDate: "22 Aug 2026",
    status: "expiring_soon",
    addons: ["Restore Benefit", "AYUSH Treatment", "No Claim Bonus 100%"],
  },
  {
    id: "Q-2026-6512",
    type: "life",
    icon: Shield,
    title: "Term Life Pure Protection",
    subtitle: "Cover till age 70 • Monthly payout",
    insurer: "ICICI Prudential Life Insurance",
    idvCover: "₹2,00,00,000",
    premium: 12400,
    date: "10 Aug 2026",
    expiryDate: "17 Aug 2026",
    status: "expired",
    addons: ["Critical Illness Rider 25L", "Accidental Death Benefit 50L"],
  },
];

export default function MyQuotesPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<SavedQuote[]>(INITIAL_QUOTES);
  const [filter, setFilter] = useState<"all" | "active" | "expired">("all");

  const filteredQuotes = quotes.filter((q) => {
    if (filter === "all") return true;
    if (filter === "active") return q.status === "active" || q.status === "expiring_soon";
    if (filter === "expired") return q.status === "expired";
    return true;
  });

  const handleDelete = (id: string) => {
    setQuotes((prev) => prev.filter((q) => q.id !== id));
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "40px 16px 80px" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>
              <Link href="/" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Home</Link>
              <span>/</span>
              <span style={{ color: "var(--primary)", fontWeight: 600 }}>My Saved Quotes</span>
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--text)", margin: 0, letterSpacing: "-0.5px" }}>
              Saved Quotes & Proposals
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
            <Plus size={16} /> Get New Quote
          </Link>
        </div>

        {/* Filter Pills */}
        <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
          {[
            { id: "all", label: `All Quotes (${quotes.length})` },
            { id: "active", label: `Active (${quotes.filter((q) => q.status !== "expired").length})` },
            { id: "expired", label: `Expired (${quotes.filter((q) => q.status === "expired").length})` },
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
                transition: "all 0.15s ease",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Quotes List */}
        {filteredQuotes.length === 0 ? (
          <div
            style={{
              background: "white",
              borderRadius: 16,
              border: "1px solid var(--border)",
              padding: "60px 20px",
              textAlign: "center",
            }}
          >
            <Layers size={48} style={{ color: "var(--text-light)", margin: "0 auto 16px" }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>No saved quotes found</h3>
            <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 20 }}>
              Calculate premium quotes for Car, Health, or Life insurance in seconds.
            </p>
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
              }}
            >
              Start a Quote →
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {filteredQuotes.map((q) => {
              const IconComp = q.icon;
              return (
                <div
                  key={q.id}
                  style={{
                    background: "white",
                    borderRadius: 16,
                    border: "1px solid var(--border)",
                    padding: 24,
                    boxShadow: "0 2px 12px rgba(0,0,0,0.02)",
                    display: "grid",
                    gridTemplateColumns: "1fr 240px",
                    gap: 20,
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          background: "var(--primary-light)",
                          color: "var(--primary)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <IconComp size={22} />
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", margin: 0 }}>
                            {q.title}
                          </h3>
                          <span
                            style={{
                              fontSize: 11,
                              padding: "2px 8px",
                              borderRadius: 6,
                              fontWeight: 700,
                              background:
                                q.status === "active"
                                  ? "var(--success-light)"
                                  : q.status === "expiring_soon"
                                  ? "var(--warning-light)"
                                  : "var(--error-light)",
                              color:
                                q.status === "active"
                                  ? "var(--success)"
                                  : q.status === "expiring_soon"
                                  ? "var(--warning)"
                                  : "var(--error)",
                            }}
                          >
                            {q.status === "active"
                              ? "Active Quote"
                              : q.status === "expiring_soon"
                              ? "Expiring in 3 Days"
                              : "Expired"}
                          </span>
                        </div>
                        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{q.subtitle}</div>
                      </div>
                    </div>

                    {/* Insurer & Addons */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 16, fontSize: 13, color: "var(--text)", marginTop: 12 }}>
                      <div>
                        <span style={{ color: "var(--text-muted)" }}>Insurer: </span>
                        <strong>{q.insurer}</strong>
                      </div>
                      <div>
                        <span style={{ color: "var(--text-muted)" }}>Cover / IDV: </span>
                        <strong style={{ color: "var(--primary)" }}>{q.idvCover}</strong>
                      </div>
                      <div>
                        <span style={{ color: "var(--text-muted)" }}>Quote ID: </span>
                        <code>{q.id}</code>
                      </div>
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
                      {q.addons.map((a, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: 11,
                            background: "var(--bg)",
                            padding: "3px 8px",
                            borderRadius: 6,
                            color: "var(--text-muted)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          + {a}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions & Price */}
                  <div style={{ textAlign: "right", borderLeft: "1px solid var(--border)", paddingLeft: 20 }}>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase" }}>Annual Premium</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: "var(--primary)", marginBottom: 12 }}>
                      ₹{q.premium.toLocaleString("en-IN")}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <button
                        onClick={() => {
                          router.push(
                            `/buy-policy?planId=${q.id}&insurer=${encodeURIComponent(q.insurer)}&price=${q.premium}&idv=${q.idvCover}&title=${encodeURIComponent(q.title)}`
                          );
                        }}
                        style={{
                          width: "100%",
                          padding: "10px",
                          background: "var(--primary)",
                          color: "white",
                          border: "none",
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                        }}
                      >
                        Continue to Buy <ArrowRight size={14} />
                      </button>

                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => alert(`Downloading Quote Summary for ${q.id}...`)}
                          style={{
                            flex: 1,
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
                          <Download size={13} /> PDF
                        </button>
                        <button
                          onClick={() => handleDelete(q.id)}
                          style={{
                            padding: "8px 12px",
                            background: "white",
                            border: "1px solid var(--border)",
                            borderRadius: 8,
                            color: "var(--error)",
                            cursor: "pointer",
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
