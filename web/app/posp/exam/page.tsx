"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Award,
  ArrowRight,
  ArrowLeft,
  Shield,
  HelpCircle,
} from "lucide-react";

interface Question {
  id: number;
  question: string;
  options: string[];
  correct: number;
}

const EXAM_QUESTIONS: Question[] = [
  {
    id: 1,
    question: "What does POSP stand for in the Indian insurance industry?",
    options: [
      "Point of Sales Person",
      "Principal Officer of State Policy",
      "Policy Operations Service Provider",
      "Primary Online Settlement Partner",
    ],
    correct: 0,
  },
  {
    id: 2,
    question: "Which regulatory authority governs insurance business and POSP rules in India?",
    options: [
      "Reserve Bank of India (RBI)",
      "Insurance Regulatory and Development Authority of India (IRDAI)",
      "Securities and Exchange Board of India (SEBI)",
      "Ministry of Corporate Affairs (MCA)",
    ],
    correct: 1,
  },
  {
    id: 3,
    question: "What is the minimum educational qualification required to become an authorized POSP?",
    options: [
      "10th Standard (Matriculation) Passed",
      "12th Standard Passed",
      "Bachelor's Degree in Commerce",
      "Master of Business Administration (MBA)",
    ],
    correct: 0,
  },
  {
    id: 4,
    question: "What is 'Insured Declared Value' (IDV) in a motor vehicle insurance policy?",
    options: [
      "The maximum purchase price of the vehicle",
      "The current maximum sum insured / market value for total loss or theft",
      "The minimum third party liability premium",
      "The road tax value paid to the RTO",
    ],
    correct: 1,
  },
  {
    id: 5,
    question: "Under the Motor Vehicles Act, which type of motor insurance is legally mandatory in India?",
    options: [
      "Zero Depreciation Cover",
      "Comprehensive Package Policy",
      "Third Party (TP) Liability Insurance",
      "Engine Protection Add-on",
    ],
    correct: 2,
  },
  {
    id: 6,
    question: "What is 'No Claim Bonus' (NCB) rewarded for?",
    options: [
      "Making multiple claims in a single year",
      "Discount rewarded on renewal for not making any claims during the policy period",
      "Paying high deductible amounts",
      "Registering vehicle in another state",
    ],
    correct: 1,
  },
  {
    id: 7,
    question: "What is the benefit of a 'Zero Depreciation' (Bumper-to-Bumper) add-on cover?",
    options: [
      "Insurer pays claim without deducting depreciation on plastic, metal & rubber parts",
      "Reduces vehicle fuel consumption",
      "Allows free car servicing at any private garage",
      "Doubles the engine horsepower",
    ],
    correct: 0,
  },
  {
    id: 8,
    question: "In Health Insurance, what does 'Cashless Hospitalization' mean?",
    options: [
      "The patient pays zero premium forever",
      "The insurer settles medical bills directly with the network hospital (TPA)",
      "Treatment is only provided in government hospitals",
      "Bills must always be paid by cash at the counter",
    ],
    correct: 1,
  },
  {
    id: 9,
    question: "What is the standard 'Free Look Period' in Life Insurance policies?",
    options: [
      "3 days from purchase",
      "15 to 30 days from policy receipt to review terms and cancel for a full refund",
      "6 months after paying first premium",
      "There is no cancellation option in life insurance",
    ],
    correct: 1,
  },
  {
    id: 10,
    question: "Can an authorized POSP working with an Insurance Broker offer policies from multiple insurers?",
    options: [
      "Yes, an insurance broker POSP can sell plans from all partner life & general insurers",
      "No, a POSP can only sell from 1 company",
      "Only for government owned insurers",
      "Only after 10 years of experience",
    ],
    correct: 0,
  },
];

export default function PospExamPage() {
  const router = useRouter();

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(900); // 15 mins (900s)

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleSelect = (optionIdx: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIdx]: optionIdx,
    }));
  };

  const currentQ = EXAM_QUESTIONS[currentIdx];
  const isAnswered = selectedAnswers[currentIdx] !== undefined;
  const answeredCount = Object.keys(selectedAnswers).length;
  const totalQuestions = EXAM_QUESTIONS.length;

  const handleSubmitExam = () => {
    // Calculate score
    let correctCount = 0;
    EXAM_QUESTIONS.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correct) {
        correctCount++;
      }
    });
    const percentage = Math.round((correctCount / EXAM_QUESTIONS.length) * 100);
    router.push(`/posp/results?score=${percentage}&correct=${correctCount}&total=${EXAM_QUESTIONS.length}`);
  };

  return (
    <>
      <Navbar />
      <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "30px 16px 80px" }}>
        <div style={{ maxWidth: 840, margin: "0 auto" }}>
          {/* Top Timer Bar */}
          <div
            style={{
              background: "white",
              borderRadius: 14,
              border: "1px solid var(--border)",
              padding: "16px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 24,
              boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
            }}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", textTransform: "uppercase" }}>
                IRDAI POSP Certification Exam
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", margin: "2px 0 0" }}>
                Question {currentIdx + 1} of {totalQuestions}
              </h2>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: timeLeft < 180 ? "var(--error-light)" : "var(--primary-light)",
                color: timeLeft < 180 ? "var(--error)" : "var(--primary)",
                padding: "8px 16px",
                borderRadius: 10,
                fontWeight: 800,
                fontSize: 16,
              }}
            >
              <Clock size={18} />
              <span>{formatTime(timeLeft)}</span>
            </div>
          </div>

          {/* Question Card */}
          <div
            style={{
              background: "white",
              borderRadius: 16,
              border: "1px solid var(--border)",
              padding: 32,
              marginBottom: 24,
              boxShadow: "0 4px 16px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8 }}>
              MODULE 0{Math.floor(currentIdx / 2) + 1} • General & Life Principles
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", lineHeight: 1.5, marginBottom: 24 }}>
              {currentQ.question}
            </h3>

            {/* Options */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {currentQ.options.map((opt, optIdx) => {
                const isSelected = selectedAnswers[currentIdx] === optIdx;
                return (
                  <div
                    key={optIdx}
                    onClick={() => handleSelect(optIdx)}
                    style={{
                      padding: "16px 20px",
                      borderRadius: 12,
                      border: isSelected ? "2px solid var(--primary)" : "1px solid var(--border)",
                      background: isSelected ? "var(--primary-light)" : "white",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        border: isSelected ? "2px solid var(--primary)" : "1px solid var(--border)",
                        background: isSelected ? "var(--primary)" : "white",
                        color: isSelected ? "white" : "var(--text-muted)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        fontSize: 12,
                      }}
                    >
                      {String.fromCharCode(65 + optIdx)}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: isSelected ? 700 : 500, color: "var(--text)" }}>
                      {opt}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Navigation buttons */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32, paddingTop: 24, borderTop: "1px solid var(--border)" }}>
              <button
                onClick={() => setCurrentIdx((p) => Math.max(0, p - 1))}
                disabled={currentIdx === 0}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 20px",
                  background: "white",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  color: currentIdx === 0 ? "var(--text-light)" : "var(--text)",
                  cursor: currentIdx === 0 ? "not-allowed" : "pointer",
                }}
              >
                <ArrowLeft size={16} /> Previous
              </button>

              <div style={{ display: "flex", gap: 10 }}>
                {currentIdx < totalQuestions - 1 ? (
                  <button
                    onClick={() => setCurrentIdx((p) => Math.min(totalQuestions - 1, p + 1))}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "10px 24px",
                      background: "var(--primary)",
                      color: "white",
                      border: "none",
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Next Question <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitExam}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "10px 28px",
                      background: "var(--success)",
                      color: "white",
                      border: "none",
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 800,
                      cursor: "pointer",
                      boxShadow: "0 4px 12px rgba(5,150,105,0.3)",
                    }}
                  >
                    Submit Exam & View Results <CheckCircle2 size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Question Palette */}
          <div style={{ background: "white", borderRadius: 14, border: "1px solid var(--border)", padding: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 12, textTransform: "uppercase" }}>
              Question Palette
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {EXAM_QUESTIONS.map((_, idx) => {
                const isCurrent = currentIdx === idx;
                const hasAnswered = selectedAnswers[idx] !== undefined;
                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentIdx(idx)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      border: isCurrent ? "2px solid var(--primary)" : "1px solid var(--border)",
                      background: hasAnswered ? "var(--success)" : isCurrent ? "var(--primary-light)" : "var(--bg)",
                      color: hasAnswered ? "white" : isCurrent ? "var(--primary)" : "var(--text)",
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
