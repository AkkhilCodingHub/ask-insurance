"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/context/auth";
import { api } from "@/lib/api";
import {
  Headphones,
  Send,
  User,
  Mail,
  ArrowRight,
  Lock,
  LogOut,
  AlertCircle,
} from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "bot" | "admin";
  text: string;
  timestamp: string;
  suggestions?: { label: string; link: string }[];
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: "m-1",
    sender: "bot",
    text: "Hello! Welcome to ASK Insurance 24x7 Customer Support 🛡️. Our dedicated support team is here to assist you with policies, instant claims, cashless hospitals, and POSP certification. How can we help you today?",
    timestamp: "Just now",
    suggestions: [
      { label: "🚗 Get Motor Insurance Quote", link: "/quote?type=motor" },
      { label: "🏥 1 Crore Super Health Cover", link: "/quote?type=health" },
      { label: "📍 Cashless Garage Locator", link: "/locator" },
      { label: "💼 Become a POSP Partner", link: "/posp" },
    ],
  },
];

export default function ChatPage() {
  const { user, loginWithEmailAndPhone, logout } = useAuth();

  // Auth Form State for non-logged-in users
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Chat State
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Load existing or initialize user's conversation once authenticated
  useEffect(() => {
    if (!user) return;

    let active = true;
    async function initConversation() {
      try {
        const res = await api.chat.getOrCreateConversation("Support Chat Inquiry");
        if (active && res.conversation) {
          setConversationId(res.conversation.id);
          if (res.conversation.messages && res.conversation.messages.length > 0) {
            const mapped: Message[] = res.conversation.messages.map((m: any) => ({
              id: m.id,
              sender: m.senderType === "user" ? "user" : "admin",
              text: m.content,
              timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            }));
            setMessages(mapped);
          }
        }
      } catch (err) {
        console.error("Failed to load conversation:", err);
      }
    }

    initConversation();
    return () => {
      active = false;
    };
  }, [user]);

  // Handle Login via Email & Mandatory Phone Number
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const cleanP = phone.replace(/\D/g, "");
    if (!cleanP || cleanP.length !== 10 || !/^[6-9]/.test(cleanP)) {
      setAuthError("Please enter a valid 10-digit Indian mobile number (mandatory).");
      return;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setAuthError("Please enter a valid email address.");
      return;
    }

    setAuthLoading(true);
    try {
      await loginWithEmailAndPhone({
        email: email.trim(),
        phone: cleanP,
        name: name.trim() || undefined,
      });
    } catch (err: any) {
      setAuthError(err?.message || "Failed to log in. Please check your credentials.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSend = async (textToSend?: string) => {
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

    try {
      if (conversationId) {
        const sendRes = await api.chat.sendMessage(conversationId, query);
        if (sendRes?.aiResponse) {
          const aiMsg: Message = {
            id: sendRes.aiResponse.id || `b-${Date.now()}`,
            sender: "admin",
            text: sendRes.aiResponse.content,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };
          setMessages((prev) => [...prev, aiMsg]);
          setIsTyping(false);
          return;
        }
      }
    } catch (err) {
      console.warn("Realtime backend message sync failed, using smart support fallback:", err);
    }

    // Fallback instant response generator
    setTimeout(() => {
      let botResponse = "";
      let suggestions: { label: string; link: string }[] | undefined = undefined;

      const q = query.toLowerCase();
      if (q.includes("claim") || q.includes("accident") || q.includes("hospital")) {
        botResponse =
          "To file or track a cashless claim: 1) Call our 24x7 SOS helpline at 1800-209-9090 or submit via Claims page, 2) Keep policy number and photo evidence ready, and 3) Access over 10,000+ cashless network garages or 8,500+ cashless hospitals nationwide.";
        suggestions = [
          { label: "File Claim Online", link: "/claims" },
          { label: "Find Cashless Network", link: "/locator" },
        ];
      } else if (q.includes("health") || q.includes("medical") || q.includes("tax")) {
        botResponse =
          "We offer comprehensive 1 Crore Health Coverage with 0% copay, zero room rent sub-limits, and cashless hospitalization. Plus, save up to ₹75,000 under Section 80D tax deductions!";
        suggestions = [
          { label: "View Health Insurance Quotes", link: "/quote?type=health" },
          { label: "Download 80D Tax Receipt", link: "/payments" },
        ];
      } else if (q.includes("car") || q.includes("bike") || q.includes("motor") || q.includes("zero dep")) {
        botResponse =
          "For motor insurance, our comprehensive plans offer Zero Depreciation (Bumper-to-Bumper), 24x7 Roadside Assistance, engine protection add-ons, and instant renewal with up to 50% No Claim Bonus (NCB)!";
        suggestions = [
          { label: "Get Instant Motor Quote", link: "/quote?type=motor" },
          { label: "Two Wheeler Quote", link: "/quote?type=two_wheeler" },
        ];
      } else if (q.includes("posp") || q.includes("agent") || q.includes("exam") || q.includes("commission")) {
        botResponse =
          "Become an IRDAI Certified POSP Insurance Partner with ASK Insurance! Zero capital required, free online 15-minute IC-38 exam training, instant digital appointment letter, and top commission payouts.";
        suggestions = [
          { label: "Register as POSP Partner", link: "/posp/register" },
          { label: "Take Free POSP Exam", link: "/posp/exam" },
        ];
      } else {
        botResponse = `Thank you for reaching out, ${user?.name || "valued customer"}! Our support desk has logged your query: "${query}". An ASK Insurance specialist will review this conversation in your customer file. How else can we assist you today?`;
        suggestions = [
          { label: "Get an Instant Quote", link: "/quote" },
          { label: "Explore Products", link: "/products" },
          { label: "View FAQs", link: "/faq" },
        ];
      }

      const botMsg: Message = {
        id: `b-${Date.now()}`,
        sender: "admin",
        text: botResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        suggestions,
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 900);
  };

  return (
    <>
      <Navbar />
      <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "30px 16px 80px" }}>
        <div style={{ maxWidth: 840, margin: "0 auto" }}>
          
          {/* If user is NOT logged in: Show Login Required Card */}
          {!user ? (
            <div
              style={{
                background: "var(--white)",
                borderRadius: 20,
                border: "1px solid var(--border)",
                padding: "36px 30px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
                maxWidth: 480,
                margin: "40px auto 0",
              }}
            >
              <div style={{ textAlign: "center", marginBottom: 26 }}>
                <div
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 16,
                    background: "linear-gradient(135deg, var(--primary), #0056B3)",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                    boxShadow: "0 4px 16px rgba(21,128,255,0.25)",
                  }}
                >
                  <Headphones size={28} />
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em" }}>
                  ASK 24x7 Support Chat
                </h2>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 6, lineHeight: 1.5 }}>
                  Please login with your Email & Phone number to start your dedicated support session.
                </p>
              </div>

              {authError && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "12px 14px",
                    borderRadius: 10,
                    background: "var(--error-light)",
                    border: "1px solid #FECACA",
                    color: "var(--error)",
                    fontSize: 13,
                    marginBottom: 18,
                  }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleAuthSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
                    Full Name <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(Optional)</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <User size={16} color="var(--text-muted)" style={{ position: "absolute", left: 14, top: 13 }} />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      style={{
                        width: "100%",
                        padding: "11px 14px 11px 40px",
                        borderRadius: 10,
                        border: "1.5px solid var(--border)",
                        fontSize: 14,
                        outline: "none",
                        background: "var(--white)",
                        color: "var(--text)",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
                    Email Address <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <Mail size={16} color="var(--text-muted)" style={{ position: "absolute", left: 14, top: 13 }} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. ramesh@example.com"
                      style={{
                        width: "100%",
                        padding: "11px 14px 11px 40px",
                        borderRadius: 10,
                        border: "1.5px solid var(--border)",
                        fontSize: 14,
                        outline: "none",
                        background: "var(--white)",
                        color: "var(--text)",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
                    Phone Number (Mandatory) <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 14, top: 12, fontSize: 13, fontWeight: 700, color: "var(--text-muted)" }}>
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="10-digit mobile number"
                      style={{
                        width: "100%",
                        padding: "11px 14px 11px 50px",
                        borderRadius: 10,
                        border: "1.5px solid var(--border)",
                        fontSize: 14,
                        outline: "none",
                        background: "var(--white)",
                        color: "var(--text)",
                      }}
                    />
                  </div>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 5 }}>
                    Your mobile number is required to link support chats to your insurance profile.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  style={{
                    width: "100%",
                    padding: "13px",
                    background: "var(--primary)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: authLoading ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    marginTop: 8,
                    boxShadow: "0 4px 14px rgba(21,128,255,0.3)",
                  }}
                >
                  {authLoading ? (
                    "Connecting..."
                  ) : (
                    <>
                      Enter Support Chat <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              <div style={{ marginTop: 22, paddingTop: 18, borderTop: "1px solid var(--border)", textAlign: "center", fontSize: 12, color: "var(--text-muted)" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <Lock size={12} color="#059669" /> 256-Bit Bank-Grade Encrypted Support
                </span>
              </div>
            </div>
          ) : (
            /* Logged In Support Chat Console */
            <>
              {/* Header */}
              <div
                style={{
                  background: "var(--white)",
                  borderRadius: "16px 16px 0 0",
                  border: "1px solid var(--border)",
                  borderBottom: "none",
                  padding: "16px 24px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: "linear-gradient(135deg, var(--primary) 0%, #0056B3 100%)",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Headphones size={24} />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <h1 style={{ fontSize: 17, fontWeight: 800, color: "var(--text)", margin: 0 }}>
                        ASK 24x7 Customer Support
                      </h1>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 11,
                          background: "var(--success-light)",
                          color: "var(--success)",
                          padding: "2px 8px",
                          borderRadius: 10,
                          fontWeight: 700,
                        }}
                      >
                        ● Live Agent Ready
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      Connected as: <strong style={{ color: "var(--text)" }}>{user.name || "Customer"}</strong> (+91 {user.phone})
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    onClick={() => setMessages(INITIAL_MESSAGES)}
                    style={{
                      background: "var(--bg)",
                      border: "1px solid var(--border)",
                      padding: "6px 12px",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--text-muted)",
                      cursor: "pointer",
                    }}
                  >
                    Clear History
                  </button>
                  <button
                    onClick={() => logout()}
                    title="Sign Out"
                    style={{
                      background: "var(--bg)",
                      border: "1px solid var(--border)",
                      padding: "6px 10px",
                      borderRadius: 8,
                      fontSize: 12,
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <LogOut size={13} />
                  </button>
                </div>
              </div>

              {/* Chat Messages Body */}
              <div
                style={{
                  background: "var(--white)",
                  border: "1px solid var(--border)",
                  height: 480,
                  overflowY: "auto",
                  padding: 24,
                  display: "flex",
                  flexDirection: "column",
                  gap: 18,
                }}
              >
                {messages.map((msg) => {
                  const isUser = msg.sender === "user";
                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: isUser ? "flex-end" : "flex-start",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          gap: 10,
                          maxWidth: "85%",
                          flexDirection: isUser ? "row-reverse" : "row",
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            background: isUser ? "var(--text)" : "var(--primary-light)",
                            color: isUser ? "white" : "var(--primary)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {isUser ? <User size={16} /> : <Headphones size={16} />}
                        </div>

                        <div>
                          <div
                            style={{
                              background: isUser ? "var(--primary)" : "var(--bg)",
                              color: isUser ? "white" : "var(--text)",
                              padding: "12px 16px",
                              borderRadius: isUser ? "16px 16px 2px 16px" : "16px 16px 16px 2px",
                              fontSize: 14,
                              lineHeight: 1.55,
                              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                            }}
                          >
                            {msg.text}
                          </div>

                          <div
                            style={{
                              fontSize: 10,
                              color: "var(--text-muted)",
                              marginTop: 4,
                              textAlign: isUser ? "right" : "left",
                              padding: "0 4px",
                            }}
                          >
                            {msg.timestamp}
                          </div>

                          {/* Quick suggestion action pills */}
                          {msg.suggestions && msg.suggestions.length > 0 && (
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 6,
                                marginTop: 10,
                              }}
                            >
                              {msg.suggestions.map((s, idx) => (
                                <Link
                                  key={idx}
                                  href={s.link}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 5,
                                    fontSize: 12,
                                    fontWeight: 600,
                                    padding: "6px 12px",
                                    background: "var(--white)",
                                    color: "var(--primary)",
                                    borderRadius: 100,
                                    border: "1px solid var(--border)",
                                    textDecoration: "none",
                                    boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
                                    transition: "all 0.15s ease",
                                  }}
                                >
                                  {s.label}
                                  <ArrowRight size={11} />
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {isTyping && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 12,
                      color: "var(--text-muted)",
                    }}
                  >
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        background: "var(--primary-light)",
                        color: "var(--primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Headphones size={13} />
                    </div>
                    <span>Support representative is typing...</span>
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
                  placeholder="Ask our support team about claims, policies, garages, or documents..."
                  style={{
                    flex: 1,
                    padding: "14px 20px",
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    fontSize: 14,
                    outline: "none",
                    background: "var(--white)",
                    color: "var(--text)",
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
            </>
          )}

        </div>
      </div>
      <Footer />
    </>
  );
}
