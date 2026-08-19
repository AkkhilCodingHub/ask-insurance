"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Bot,
  Send,
  User,
  Sparkles,
  Shield,
  ArrowRight,
  HelpCircle,
  Car,
  HeartPulse,
  DollarSign,
  FileCheck,
} from "lucide-react";
import { useAuth } from "@/context/auth";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  suggestions?: { label: string; link: string }[];
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: "m-1",
    sender: "bot",
    text: "Hello! I am your ASK AI Insurance Assistant 🤖. How can I help you today? You can ask me to compare policies, explain claim steps, or find the best plan for your needs.",
    timestamp: "Just now",
    suggestions: [
      { label: "🚗 Get Car Insurance Quote", link: "/quote?type=motor" },
      { label: "🏥 1 Crore Health Cover", link: "/quote?type=health" },
      { label: "📍 Find Cashless Garages", link: "/locator" },
      { label: "💼 Become a POSP Partner", link: "/posp" },
    ],
  },
];

export default function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setIsTyping(true);

    // AI Response generation simulation
    setTimeout(() => {
      let botResponse = "";
      let suggestions: { label: string; link: string }[] | undefined = undefined;

      const q = query.toLowerCase();
      if (q.includes("claim") || q.includes("accident")) {
        botResponse =
          "To file a cashless claim: 1) Notify us immediately via the 24/7 SOS helpline or Claims page, 2) Take photos of the damage, and 3) Take your car to any of our 10,000+ cashless network garages. Would you like to file a claim or locate a garage?";
        suggestions = [
          { label: "File a Claim Now", link: "/claims" },
          { label: "Locate Cashless Garage", link: "/locator" },
        ];
      } else if (q.includes("health") || q.includes("medical") || q.includes("hospital")) {
        botResponse =
          "We offer 1 Crore Super Health Cover with 0% copay, zero room rent capping, and cashless hospitalization at 8,500+ top hospitals (Fortis, Max, Apollo). Plus, save up to ₹75,000 in income tax under Section 80D!";
        suggestions = [
          { label: "View Health Insurance Quotes", link: "/quote?type=health" },
          { label: "Download 80D Tax Receipt", link: "/payments" },
        ];
      } else if (q.includes("car") || q.includes("bike") || q.includes("motor") || q.includes("zero dep")) {
        botResponse =
          "For motor vehicles, our comprehensive plans include Zero Depreciation (Bumper to Bumper), 24x7 Roadside Assistance, and Engine Protection add-ons with up to 50% NCB discounts!";
        suggestions = [
          { label: "Get Instant Car Quote", link: "/quote?type=motor" },
          { label: "Two Wheeler Quote", link: "/quote?type=two_wheeler" },
        ];
      } else if (q.includes("posp") || q.includes("agent") || q.includes("partner") || q.includes("earn")) {
        botResponse =
          "You can become an IRDAI Certified POSP Insurance Partner with ASK Insurance! Zero investment required, 15-minute online certification exam, and earn high commissions across 40+ insurers.";
        suggestions = [
          { label: "Register as POSP Partner", link: "/posp/register" },
          { label: "Take Free POSP Exam", link: "/posp/exam" },
        ];
      } else {
        botResponse = `Thank you for your question about "${query}". At ASK Insurance, we partner with 40+ leading insurers to bring you transparent, instant policies with 1-click digital issuance and 24x7 cashless claims assistance.`;
        suggestions = [
          { label: "Get a Quick Quote", link: "/quote" },
          { label: "Browse All Products", link: "/products" },
          { label: "View FAQs", link: "/faq" },
        ];
      }

      const botMsg: Message = {
        id: `b-${Date.now()}`,
        sender: "bot",
        text: botResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        suggestions,
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 1100);
  };

  return (
    <div style={{ minHeight: "calc(100vh - 64px)", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, maxWidth: 900, width: "100%", margin: "0 auto", padding: "24px 16px 20px", display: "flex", flexDirection: "column" }}>
        {/* Top Header Card */}
        <div
          style={{
            background: "white",
            borderRadius: 16,
            border: "1px solid var(--border)",
            padding: "16px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
            boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: "var(--primary-light)",
                color: "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Bot size={24} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", display: "flex", alignItems: "center", gap: 6 }}>
                ASK AI Insurance Assistant <Sparkles size={14} style={{ color: "var(--primary)" }} />
              </div>
              <div style={{ fontSize: 12, color: "var(--success)", fontWeight: 600 }}>
                ● Online • Instant answers powered by IRDAI Insurance Knowledge
              </div>
            </div>
          </div>

          <Link
            href="/quote"
            style={{
              padding: "8px 16px",
              background: "var(--primary-light)",
              color: "var(--primary)",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Get Live Quote →
          </Link>
        </div>

        {/* Messages Scroll Area */}
        <div
          style={{
            flex: 1,
            background: "white",
            borderRadius: 16,
            border: "1px solid var(--border)",
            padding: 24,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            maxHeight: "calc(100vh - 280px)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.02)",
          }}
        >
          {messages.map((m) => {
            const isBot = m.sender === "bot";
            return (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  alignSelf: isBot ? "flex-start" : "flex-end",
                  maxWidth: "80%",
                }}
              >
                {isBot && (
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: "var(--primary-light)",
                      color: "var(--primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Bot size={18} />
                  </div>
                )}

                <div>
                  <div
                    style={{
                      background: isBot ? "var(--bg)" : "var(--primary)",
                      color: isBot ? "var(--text)" : "white",
                      padding: "14px 18px",
                      borderRadius: 14,
                      borderTopLeftRadius: isBot ? 2 : 14,
                      borderTopRightRadius: !isBot ? 2 : 14,
                      fontSize: 14,
                      lineHeight: 1.5,
                    }}
                  >
                    {m.text}
                  </div>

                  {/* Suggestion action pills */}
                  {m.suggestions && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                      {m.suggestions.map((s, idx) => (
                        <Link
                          key={idx}
                          href={s.link}
                          style={{
                            fontSize: 12,
                            padding: "6px 12px",
                            borderRadius: 20,
                            background: "white",
                            border: "1px solid var(--border)",
                            color: "var(--primary)",
                            fontWeight: 700,
                            textDecoration: "none",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          {s.label} →
                        </Link>
                      ))}
                    </div>
                  )}

                  <div style={{ fontSize: 10, color: "var(--text-light)", marginTop: 4, textAlign: isBot ? "left" : "right" }}>
                    {m.timestamp}
                  </div>
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div style={{ display: "flex", gap: 10, alignItems: "center", color: "var(--text-muted)", fontSize: 13 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--primary-light)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Bot size={18} />
              </div>
              <span>ASK AI Assistant is typing...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask about car insurance, health cover, claim process, POSP exam..."
            style={{
              flex: 1,
              padding: "14px 20px",
              borderRadius: 12,
              border: "1px solid var(--border)",
              fontSize: 14,
              outline: "none",
              background: "white",
              boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
            }}
          />
          <button
            onClick={() => handleSend()}
            style={{
              padding: "14px 24px",
              background: "var(--primary)",
              color: "white",
              border: "none",
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              boxShadow: "0 4px 14px rgba(21,128,255,0.3)",
            }}
          >
            <Send size={16} /> Send
          </button>
        </div>
      </div>
    </div>
  );
}
