"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
    <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "40px 16px 80px" }}>
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        {/* Header with Timer */}
        <div
          style={{
            background: "white",
            borderRadius: 16,
            border: "1px solid var(--border)",
            padding: "18px 24px",
            marginBottom: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
          }}
        >
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", textTransform: "uppercase" }}>
              IRDAI POSP Certification Examination
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>
              Question {currentIdx + 1} of {EXAM_QUESTIONS.length}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: timeLeft < 180 ? "var(--error-light)" : "var(--primary-light)",
              color: timeLeft < 180 ? "var(--error)" : "var(--primary)",
              padding: "8px 16px",
              borderRadius: 20,
              fontWeight: 800,
              fontSize: 15,
            }}
          >
            <Clock size={18} />
            <span>Time Remaining: {formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Question Card */}
        <div
          style={{
            background: "white",
            borderRadius: 18,
            border: "1px solid var(--border)",
            padding: 36,
            boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
            marginBottom: 24,
          }}
        >
          <div style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600, marginBottom: 8 }}>
            Module: Insurance Essentials & Rules
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", lineHeight: 1.4, marginBottom: 28 }}>
            {currentQ.question}
          </h2>

          {/* Options */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 36 }}>
            {currentQ.options.map((option, oIdx) => {
              const isSelected = selectedAnswers[currentIdx] === oIdx;
              return (
                <div
                  key={oIdx}
                  onClick={() => handleSelect(oIdx)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "16px 20px",
                    borderRadius: 12,
                    border: isSelected ? "2px solid var(--primary)" : "1px solid var(--border)",
                    background: isSelected ? "var(--primary-light)" : "white",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      border: isSelected ? "2px solid var(--primary)" : "1px solid var(--border-dark)",
                      background: isSelected ? "var(--primary)" : "white",
                      color: isSelected ? "white" : "var(--text)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: 13,
                    }}
                  >
                    {String.fromCharCode(65 + oIdx)}
                  </div>
                  <span style={{ fontSize: 15, fontWeight: isSelected ? 700 : 500, color: "var(--text)" }}>
                    {option}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Navigation buttons */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: 20 }}>
            <button
              onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
              disabled={currentIdx === 0}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 20px",
                background: "white",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontWeight: 600,
                cursor: currentIdx === 0 ? "not-allowed" : "pointer",
                opacity: currentIdx === 0 ? 0.4 : 1,
              }}
            >
              <ArrowLeft size={16} /> Previous
            </button>

            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
              {answeredCount} of {EXAM_QUESTIONS.length} Questions Answered
            </span>

            {currentIdx < EXAM_QUESTIONS.length - 1 ? (
              <button
                onClick={() => setCurrentIdx((prev) => prev + 1)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 24px",
                  background: "var(--primary)",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Next <ArrowRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleSubmitExam}
                style={{
                  padding: "12px 28px",
                  background: "var(--success)",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 800,
                  fontSize: 14,
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(5,150,105,0.35)",
                }}
              >
                Submit Exam & View Result
              </button>
            )}
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
  );
}
