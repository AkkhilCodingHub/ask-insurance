"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { api } from "@/lib/api";
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
  const [filter, setFilter] = useState<"all" | "active" | "expiring" | "expired">("all");

  const filtered = quotes.filter((q) => {
    if (filter === "all") return true;
    if (filter === "active") return q.status === "active";
    if (filter === "expiring") return q.status === "expiring_soon";
    if (filter === "expired") return q.status === "expired";
    return true;
  });

  const handleDelete = (id: string) => {
    setQuotes((prev) => prev.filter((q) => q.id !== id));
  };

  const handleBuyQuote = (q: SavedQuote) => {
    router.push(
      `/buy-policy?planId=${q.id}&insurer=${encodeURIComponent(q.insurer)}&price=${q.premium}&idv=${q.idvCover}&title=${encodeURIComponent(q.title)}`
    );
  };

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
                <span style={{ color: "var(--primary)", fontWeight: 600 }}>Saved Quotes</span>
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--text)", margin: 0 }}>
                My Saved Quotes & Proposals
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
              <Plus size={16} /> Generate New Quote
            </Link>
          </div>

          {/* Filter Bar */}
          <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
            {[
              { id: "all", label: `All Quotes (${quotes.length})` },
              { id: "active", label: `Active (${quotes.filter((q) => q.status === "active").length})` },
              { id: "expiring", label: `Expiring Soon (${quotes.filter((q) => q.status === "expiring_soon").length})` },
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

          {/* Quotes List */}
          {filtered.length === 0 ? (
            <div style={{ background: "white", padding: 60, borderRadius: 16, textAlign: "center", border: "1px solid var(--border)" }}>
              <FileText size={48} style={{ color: "var(--text-light)", margin: "0 auto 16px" }} />
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>No quotes found</h3>
              <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 20 }}>
                Compare quotes from 40+ insurers and save your proposals here.
              </p>
              <Link
                href="/quote"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 24px",
                  background: "var(--primary)",
                  color: "white",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                Get Instant Quote Now →
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {filtered.map((q) => {
                const IconC = q.icon;
                const isExpiring = q.status === "expiring_soon";
                return (
                  <div
                    key={q.id}
                    style={{
                      background: "white",
                      borderRadius: 16,
                      border: isExpiring ? "1.5px solid var(--warning)" : "1px solid var(--border)",
                      padding: 24,
                      boxShadow: "0 2px 14px rgba(0,0,0,0.02)",
                      display: "grid",
                      gridTemplateColumns: "1fr 240px",
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
                          <IconC size={24} />
                        </div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", margin: 0 }}>
                              {q.title}
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
                              {isExpiring ? "Lock Price • Expires in 2 Days" : "Price Guaranteed"}
                            </span>
                          </div>
                          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{q.subtitle} • {q.insurer}</div>
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 14, fontSize: 13 }}>
                        <div>
                          <div style={{ color: "var(--text-muted)", fontSize: 11, textTransform: "uppercase" }}>Quote Reference</div>
                          <div style={{ fontWeight: 700, fontFamily: "monospace", color: "var(--text)" }}>{q.id}</div>
                        </div>
                        <div>
                          <div style={{ color: "var(--text-muted)", fontSize: 11, textTransform: "uppercase" }}>IDV / Cover Amount</div>
                          <div style={{ fontWeight: 700, color: "var(--primary)" }}>{q.idvCover}</div>
                        </div>
                        <div>
                          <div style={{ color: "var(--text-muted)", fontSize: 11, textTransform: "uppercase" }}>Generated Date</div>
                          <div style={{ fontWeight: 600 }}>{q.date}</div>
                        </div>
                      </div>

                      {/* Add-on Badges */}
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 14 }}>
                        {q.addons.map((a, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: 11,
                              background: "var(--bg)",
                              border: "1px solid var(--border)",
                              padding: "3px 8px",
                              borderRadius: 6,
                              color: "var(--text-muted)",
                              fontWeight: 600,
                            }}
                          >
                            + {a}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Right Actions */}
                    <div style={{ borderLeft: "1px solid var(--border)", paddingLeft: 20, textAlign: "right" }}>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase" }}>Final Net Premium</div>
                      <div style={{ fontSize: 24, fontWeight: 900, color: "var(--text)", marginBottom: 12 }}>
                        ₹{q.premium.toLocaleString("en-IN")}
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <button
                          onClick={() => handleBuyQuote(q)}
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
                            boxShadow: "0 2px 10px rgba(21,128,255,0.25)",
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
      <Footer />
    </>
  );
}
