"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Award,
  TrendingUp,
  Shield,
  CheckCircle2,
  Users,
  Building2,
  BookOpen,
  DollarSign,
  ArrowRight,
  Briefcase,
  Clock,
  Sparkles,
} from "lucide-react";

export default function PospLandingPage() {
  const router = useRouter();

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Hero Banner */}
      <section
        style={{
          background: "linear-gradient(135deg, #0A1628 0%, #1580FF 100%)",
          color: "white",
          padding: "80px 20px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <span
            style={{
              background: "rgba(255,255,255,0.15)",
              color: "white",
              padding: "6px 16px",
              borderRadius: 30,
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "1px",
              textTransform: "uppercase",
            }}
          >
            IRDAI Authorized POSP Career Program
          </span>
          <h1 style={{ fontSize: 44, fontWeight: 900, margin: "20px 0 16px", letterSpacing: "-1px", lineHeight: 1.15 }}>
            Become a Certified Insurance Partner & Earn Unlimited Income
          </h1>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.9)", maxWidth: 700, margin: "0 auto 36px", lineHeight: 1.6 }}>
            Partner with ASK Insurance to sell Motor, Health, Life & Commercial policies from 40+ leading insurance companies with zero investment.
          </p>

          <div style={{ display: "flex", gap: 14, justifyContent: "center" }}>
            <Link
              href="/posp/register"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "16px 36px",
                background: "white",
                color: "var(--primary)",
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 800,
                textDecoration: "none",
                boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
              }}
            >
              Start POSP Registration <ArrowRight size={18} />
            </Link>
            <Link
              href="/posp/exam"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "16px 28px",
                background: "rgba(255,255,255,0.15)",
                color: "white",
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 700,
                textDecoration: "none",
                border: "1px solid rgba(255,255,255,0.3)",
              }}
            >
              Take Free Practice Exam
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section style={{ padding: "60px 20px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: "var(--text)", margin: "0 0 10px" }}>
            Why Partner with ASK Insurance?
          </h2>
          <p style={{ fontSize: 15, color: "var(--text-muted)" }}>
            Everything you need to build a high-growth insurance advisory practice.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
          {[
            {
              icon: DollarSign,
              title: "Instant Commission Payouts",
              desc: "Earn the highest industry commissions on Motor, Health and Life policies directly in your bank account.",
            },
            {
              icon: Building2,
              title: "40+ Insurers on One Platform",
              desc: "Sell plans from HDFC ERGO, ICICI Lombard, Tata AIG, Star Health, Care, LIC, and many more without separate tie-ups.",
            },
            {
              icon: BookOpen,
              title: "Free IRDAI POSP Certification",
              desc: "Complete 15-module online training and pass the official 15-minute exam from the comfort of your home.",
            },
            {
              icon: TrendingUp,
              title: "Dedicated POSP CRM Portal",
              desc: "Track client renewals, manage active policies, issue instant quotes, and generate marketing banners with your name.",
            },
            {
              icon: Shield,
              title: "Dedicated Claim Support Desk",
              desc: "24/7 claim settlement team to assist your customers with cashless hospitalizations and accident claims.",
            },
            {
              icon: Users,
              title: "Zero Experience Needed",
              desc: "Anyone who has passed 10th standard can become an authorized POSP. We provide end-to-end product training.",
            },
          ].map((item, idx) => {
            const IconC = item.icon;
            return (
              <div
                key={idx}
                style={{
                  background: "white",
                  padding: 28,
                  borderRadius: 16,
                  border: "1px solid var(--border)",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.02)",
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: "var(--primary-light)",
                    color: "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                  }}
                >
                  <IconC size={26} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>{item.title}</h3>
                <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.5, margin: 0 }}>{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4 Steps to become POSP */}
      <section style={{ background: "white", padding: "60px 20px", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1040, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <h2 style={{ fontSize: 30, fontWeight: 800, color: "var(--text)", margin: "0 0 8px" }}>
              4 Simple Steps to Get Your POSP License
            </h2>
            <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Start issuing policies and earning within 24 hours.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
            {[
              { step: "01", title: "Fill Registration", desc: "Submit basic details, PAN, Aadhaar and 10th mark sheet." },
              { step: "02", title: "Complete Modules", desc: "Watch 15-module interactive video training on insurance rules." },
              { step: "03", title: "Pass Online Exam", desc: "Answer 15 multiple choice questions. Pass mark is 40%." },
              { step: "04", title: "Get Certified", desc: "Download IRDAI Certificate & start selling policies immediately." },
            ].map((s, idx) => (
              <div key={idx} style={{ background: "var(--bg)", padding: 22, borderRadius: 14, border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: "var(--primary)", marginBottom: 8 }}>{s.step}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.4 }}>{s.desc}</div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: 40 }}>
            <Link
              href="/posp/register"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "14px 32px",
                background: "var(--primary)",
                color: "white",
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Register Now as POSP Partner →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
