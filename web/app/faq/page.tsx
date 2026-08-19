"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  HelpCircle,
  Search,
  ChevronDown,
  ChevronUp,
  Car,
  HeartPulse,
  Shield,
  Wrench,
  Award,
  PhoneCall,
  MessageSquare,
} from "lucide-react";

interface FAQItem {
  id: string;
  category: "Motor" | "Health" | "Life" | "Claims" | "POSP";
  question: string;
  answer: string;
}

const FAQS_DATA: FAQItem[] = [
  {
    id: "f-1",
    category: "Motor",
    question: "What is Zero Depreciation (Bumper to Bumper) car insurance?",
    answer: "Zero Depreciation cover (also known as Nil Dep or Bumper-to-Bumper) ensures that in the event of an accident claim, the insurer does not deduct depreciation on metal, rubber, nylon, and plastic parts replaced during repair, giving you 100% claim payout with minimal out-of-pocket expenses.",
  },
  {
    id: "f-2",
    category: "Motor",
    question: "Can I transfer my No Claim Bonus (NCB) when changing my car or insurer?",
    answer: "Yes! No Claim Bonus (NCB) belongs to the vehicle owner and not the car. When you buy a new vehicle or switch your insurer on ASK Insurance, you can easily transfer up to 50% accrued NCB by submitting the NCB Reserving Letter or previous policy copy.",
  },
  {
    id: "f-3",
    category: "Health",
    question: "How does Cashless Hospitalization work at network hospitals?",
    answer: "When admitted to any of our 8,500+ network hospitals, simply show your ASK Insurance e-card at the hospital TPA desk. The hospital sends the pre-authorization form to the insurer, and the medical bills are settled directly without you needing to pay upfront.",
  },
  {
    id: "f-4",
    category: "Health",
    question: "What are the tax benefits of Health Insurance under Section 80D?",
    answer: "Under Section 80D of the Income Tax Act, you can claim tax deductions up to ₹25,000 for health insurance premiums paid for self, spouse, and dependent children. You can claim an additional ₹50,000 if insuring senior citizen parents, saving up to ₹75,000 annually.",
  },
  {
    id: "f-5",
    category: "Life",
    question: "What is the difference between Term Life Insurance and ULIP / Savings plans?",
    answer: "Term Insurance provides high life cover at very affordable premiums and pays the full sum assured to your nominee in case of unfortunate demise. Investment 2.0 / Savings plans (ULIPs) combine life protection with market-linked or guaranteed wealth creation.",
  },
  {
    id: "f-6",
    category: "Claims",
    question: "What documents are required to file an accidental car insurance claim?",
    answer: "You will need: 1) Policy Copy / Number, 2) Vehicle RC Card, 3) Driver's Driving License at the time of accident, 4) Estimate of repair from the network garage, and 5) FIR copy in case of third-party injury, death, or vehicle theft.",
  },
  {
    id: "f-7",
    category: "POSP",
    question: "What is the eligibility to become an authorized POSP insurance partner?",
    answer: "Any Indian citizen aged 18 or above who has completed 10th standard (Matriculation) with a valid PAN and Aadhaar card can register as a POSP partner. We provide free online IRDAI training and certification.",
  },
];

export default function FaqPage() {
  const [selectedCat, setSelectedCat] = useState<string>("All");
  const [search, setSearch] = useState<string>("");
  const [openIds, setOpenIds] = useState<string[]>(["f-1", "f-3"]);

  const toggleAccordion = (id: string) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filtered = FAQS_DATA.filter((item) => {
    if (selectedCat !== "All" && item.category !== selectedCat) return false;
    if (
      search &&
      !item.question.toLowerCase().includes(search.toLowerCase()) &&
      !item.answer.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "40px 16px 80px" }}>
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--primary)", fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
            <HelpCircle size={16} /> Knowledge Base & Support
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: "var(--text)", margin: "0 0 10px" }}>
            Frequently Asked Questions
          </h1>
          <p style={{ fontSize: 15, color: "var(--text-muted)", maxWidth: 520, margin: "0 auto" }}>
            Find quick answers regarding policy coverage, claim settlements, renewals, and POSP certification.
          </p>

          {/* Search Box */}
          <div style={{ maxWidth: 540, margin: "24px auto 0", position: "relative" }}>
            <Search size={18} style={{ position: "absolute", left: 16, top: 14, color: "var(--text-muted)" }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions (e.g., zero dep, claim process, 80D tax)..."
              style={{
                width: "100%",
                padding: "13px 18px 13px 44px",
                borderRadius: 12,
                border: "1px solid var(--border)",
                fontSize: 14,
                boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                outline: "none",
              }}
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 32, flexWrap: "wrap" }}>
          {["All", "Motor", "Health", "Life", "Claims", "POSP"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              style={{
                padding: "8px 18px",
                borderRadius: 20,
                border: selectedCat === cat ? "1px solid var(--primary)" : "1px solid var(--border)",
                background: selectedCat === cat ? "var(--primary)" : "white",
                color: selectedCat === cat ? "white" : "var(--text)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* FAQ Accordions List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 48 }}>
          {filtered.length === 0 ? (
            <div style={{ background: "white", padding: 36, borderRadius: 14, textAlign: "center", border: "1px solid var(--border)" }}>
              <p style={{ color: "var(--text-muted)", margin: 0 }}>No questions found matching your search term.</p>
            </div>
          ) : (
            filtered.map((faq) => {
              const isOpen = openIds.includes(faq.id);
              return (
                <div
                  key={faq.id}
                  style={{
                    background: "white",
                    borderRadius: 14,
                    border: isOpen ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                    overflow: "hidden",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div
                    onClick={() => toggleAccordion(faq.id)}
                    style={{
                      padding: "18px 22px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span
                        style={{
                          fontSize: 11,
                          padding: "2px 8px",
                          borderRadius: 6,
                          fontWeight: 700,
                          background: "var(--bg)",
                          color: "var(--text-muted)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        {faq.category}
                      </span>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: 0 }}>
                        {faq.question}
                      </h3>
                    </div>
                    {isOpen ? <ChevronUp size={18} style={{ color: "var(--primary)" }} /> : <ChevronDown size={18} style={{ color: "var(--text-muted)" }} />}
                  </div>

                  {isOpen && (
                    <div
                      style={{
                        padding: "0 22px 20px",
                        fontSize: 14,
                        color: "var(--text-muted)",
                        lineHeight: 1.6,
                        borderTop: "1px solid var(--border)",
                        paddingTop: 14,
                      }}
                    >
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Contact Support CTA Box */}
        <div
          style={{
            background: "linear-gradient(135deg, #0A1628 0%, #1580FF 100%)",
            borderRadius: 18,
            padding: 32,
            color: "white",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 20,
          }}
        >
          <div>
            <h3 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 6px" }}>Still have questions?</h3>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", margin: 0 }}>
              Our licensed insurance experts are available 24/7 to guide you through claims and policy comparisons.
            </p>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <Link
              href="/chat"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 22px",
                background: "white",
                color: "var(--primary)",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              <MessageSquare size={16} /> Chat with AI Assistant
            </Link>
            <a
              href="tel:18002099090"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 22px",
                background: "rgba(255,255,255,0.15)",
                color: "white",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 700,
                textDecoration: "none",
                border: "1px solid rgba(255,255,255,0.3)",
              }}
            >
              <PhoneCall size={16} /> Call 1800-209-9090
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
