"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, CheckCircle, AlertCircle, ArrowRight, User, Phone, Mail, Calendar } from "lucide-react";
import { useAuth } from "@/context/auth";
import { startOtpCooldown } from "@/lib/otpCooldown";

export default function RegisterPage() {
  const router = useRouter();
  const { registerSendOTP } = useAuth();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("male");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search).get("phone");
      if (p) {
        const clean = p.replace(/\D/g, "").slice(0, 10);
        if (clean) setPhone(clean);
      }
    }
  }, []);

  const cleanPhone = phone.replace(/\D/g, "").slice(0, 10);
  const isPhoneValid = cleanPhone.length === 10 && /^[6-9]\d{9}$/.test(cleanPhone);
  const isNameValid = name.trim().length >= 2;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isValid = isNameValid && isPhoneValid && isEmailValid;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setError("");
    setLoading(true);

    try {
      await registerSendOTP({
        name: name.trim(),
        phone: cleanPhone,
        email: email.trim().toLowerCase(),
        dob: dob.trim() || undefined,
        gender,
      });

      startOtpCooldown(cleanPhone, 300);

      const query = new URLSearchParams({
        mode: "register",
        phone: cleanPhone,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        dob: dob.trim(),
        gender,
      });

      router.push(`/otp?${query.toString()}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="login-grid"
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
      }}
    >
      <style>{`
        @media (max-width: 768px) {
          .login-grid { display: flex !important; flex-direction: column; }
          .login-hero { min-height: 220px; flex-shrink: 0; padding: 32px 20px !important; }
          .login-form-side { flex: 1; padding: 28px 20px !important; }
        }
      `}</style>

      {/* Left — blue hero */}
      <div
        className="login-hero"
        style={{
          background: "linear-gradient(135deg, #083A8C 0%, #1580FF 50%, #0EA5E9 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px 56px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: 14,
              background: "rgba(255,255,255,0.15)",
              border: "1.5px solid rgba(255,255,255,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Shield size={26} color="#fff" strokeWidth={2.5} />
          </div>
          <span style={{ fontWeight: 800, fontSize: 22, color: "#fff" }}>ASK Insurance</span>
        </div>

        <h1
          style={{
            fontSize: 38,
            fontWeight: 800,
            letterSpacing: "-0.04em",
            color: "#fff",
            lineHeight: 1.2,
            marginBottom: 12,
          }}
        >
          Create your account
        </h1>
        <p
          style={{
            fontSize: 16,
            color: "rgba(255,255,255,0.8)",
            lineHeight: 1.5,
            maxWidth: 420,
          }}
        >
          Register with your details to get instant policy issuance, automated claims support, and your unique Customer ID.
        </p>
      </div>

      {/* Right — form */}
      <div
        className="login-form-side"
        style={{
          background: "var(--white)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 32px",
        }}
      >
        <div style={{ width: "100%", maxWidth: 440 }} className="animate-fade-up">
          <h2
            style={{
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "var(--text)",
              marginBottom: 4,
            }}
          >
            New Customer Registration
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
            Enter your personal information. We will send an OTP to verify your mobile number.
          </p>

          <form onSubmit={handleSubmit}>
            {/* 1. Full Name */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
                Full Name *
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  border: "1.5px solid var(--border)",
                  borderRadius: 10,
                  overflow: "hidden",
                }}
              >
                <div style={{ padding: "0 12px", color: "var(--primary)" }}>
                  <User size={18} />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Rahul Sharma"
                  style={{
                    flex: 1,
                    height: 46,
                    border: "none",
                    outline: "none",
                    padding: "0 10px",
                    fontSize: 15,
                    color: "var(--text)",
                    background: "transparent",
                  }}
                />
              </div>
            </div>

            {/* 2. Phone Number */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
                Mobile Number *
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  border: "1.5px solid var(--border)",
                  borderRadius: 10,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "0 12px",
                    height: 46,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "var(--bg)",
                    borderRight: "1px solid var(--border)",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  <span>🇮🇳</span> +91
                </div>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="98765 43210"
                  style={{
                    flex: 1,
                    height: 46,
                    border: "none",
                    outline: "none",
                    padding: "0 12px",
                    fontSize: 16,
                    fontWeight: 600,
                    letterSpacing: "0.05em",
                    color: "var(--text)",
                    background: "transparent",
                  }}
                />
                {isPhoneValid && (
                  <div style={{ paddingRight: 12 }}>
                    <CheckCircle size={18} color="var(--success)" />
                  </div>
                )}
              </div>
            </div>

            {/* 3. Email Address */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
                Email Address *
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  border: "1.5px solid var(--border)",
                  borderRadius: 10,
                  overflow: "hidden",
                }}
              >
                <div style={{ padding: "0 12px", color: "var(--primary)" }}>
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rahul@example.com"
                  style={{
                    flex: 1,
                    height: 46,
                    border: "none",
                    outline: "none",
                    padding: "0 10px",
                    fontSize: 15,
                    color: "var(--text)",
                    background: "transparent",
                  }}
                />
              </div>
            </div>

            {/* 4. Date of Birth */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
                Date of Birth (Optional)
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  border: "1.5px solid var(--border)",
                  borderRadius: 10,
                  overflow: "hidden",
                }}
              >
                <div style={{ padding: "0 12px", color: "var(--primary)" }}>
                  <Calendar size={18} />
                </div>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  style={{
                    flex: 1,
                    height: 46,
                    border: "none",
                    outline: "none",
                    padding: "0 10px",
                    fontSize: 15,
                    color: "var(--text)",
                    background: "transparent",
                  }}
                />
              </div>
            </div>

            {/* 5. Gender */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
                Gender
              </label>
              <div style={{ display: "flex", gap: 10 }}>
                {["male", "female", "other"].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    style={{
                      flex: 1,
                      padding: "8px 0",
                      borderRadius: 8,
                      border: `1.5px solid ${gender === g ? "var(--primary)" : "var(--border)"}`,
                      background: gender === g ? "rgba(21, 128, 255, 0.08)" : "transparent",
                      color: gender === g ? "var(--primary)" : "var(--text-muted)",
                      fontWeight: gender === g ? 700 : 500,
                      textTransform: "capitalize",
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 14,
                  color: "var(--error)",
                  fontSize: 13,
                }}
              >
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!isValid || loading}
              style={{
                width: "100%",
                height: 50,
                border: "none",
                borderRadius: 12,
                background:
                  isValid && !loading
                    ? "linear-gradient(135deg, var(--primary), var(--accent-dark))"
                    : "var(--border)",
                color: isValid && !loading ? "#fff" : "var(--text-muted)",
                fontSize: 15,
                fontWeight: 700,
                cursor: isValid && !loading ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginBottom: 16,
              }}
            >
              {loading ? "Sending verification code…" : "Send OTP & Register"}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <div style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "var(--primary)", fontWeight: 700, textDecoration: "none" }}>
              Sign In directly →
            </Link>
          </div>

          <p style={{ fontSize: 11, color: "var(--text-light)", textAlign: "center" }}>
            By registering, you agree to our Terms of Service &amp; Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
