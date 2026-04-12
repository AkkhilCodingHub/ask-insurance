"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Check, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/auth";

const trustPoints = [
  "IRDAI licensed insurance broker",
  "38+ top insurers on one platform",
  "Instant claims support 24 × 7",
];

export default function LoginPage() {
  const router = useRouter();
  const { sendOTP } = useAuth();

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isValid = phone.length === 10 && /^\d{10}$/.test(phone);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setError("");
    setLoading(true);
    try {
      await sendOTP(phone);
      router.push("/otp");
    } catch {
      setError("Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
      }}
    >
      <style>{`
        @media (max-width: 768px) {
          .login-grid { display: flex !important; flex-direction: column; }
          .login-hero { min-height: 280px; flex-shrink: 0; }
          .login-form-side { flex: 1; }
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
        {/* decorative circles */}
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -80,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -60,
            left: -60,
            width: 220,
            height: 220,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.06)",
          }}
        />

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 48 }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 14,
              background: "rgba(255,255,255,0.15)",
              border: "1.5px solid rgba(255,255,255,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(8px)",
            }}
          >
            <Shield size={28} color="#fff" strokeWidth={2.5} />
          </div>
          <span
            style={{
              fontWeight: 800,
              fontSize: 24,
              letterSpacing: "-0.03em",
              color: "#fff",
            }}
          >
            ASK
          </span>
        </div>

        <h1
          style={{
            fontSize: 42,
            fontWeight: 800,
            letterSpacing: "-0.04em",
            color: "#fff",
            lineHeight: 1.15,
            marginBottom: 12,
          }}
        >
          Welcome to ASK
        </h1>
        <p
          style={{
            fontSize: 17,
            color: "rgba(255,255,255,0.75)",
            marginBottom: 44,
            lineHeight: 1.5,
          }}
        >
          India&apos;s most trusted insurance advisor
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {trustPoints.map((point) => (
            <div key={point} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Check size={13} color="#fff" strokeWidth={3} />
              </div>
              <span style={{ fontSize: 14, color: "rgba(255,255,255,0.9)", fontWeight: 500 }}>
                {point}
              </span>
            </div>
          ))}
        </div>
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
        <div style={{ width: "100%", maxWidth: 420 }} className="animate-fade-up">
          <h2
            style={{
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: "-0.04em",
              color: "var(--text)",
              marginBottom: 8,
            }}
          >
            Enter your mobile number
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 32 }}>
            We&apos;ll send a one-time verification code
          </p>

          <form onSubmit={handleSubmit}>
            {/* Phone input */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                border: `1.5px solid ${error ? "var(--error)" : isValid ? "var(--success)" : "var(--border)"}`,
                borderRadius: 12,
                overflow: "hidden",
                marginBottom: 8,
                transition: "border-color 0.2s",
              }}
            >
              {/* +91 prefix */}
              <div
                style={{
                  padding: "0 16px",
                  height: 56,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "var(--bg)",
                  borderRight: "1.5px solid var(--border)",
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: 18 }}>🇮🇳</span>
                <span style={{ fontSize: 16, fontWeight: 600, color: "var(--text)" }}>+91</span>
              </div>

              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setPhone(val);
                  if (error) setError("");
                }}
                placeholder="10-digit mobile number"
                style={{
                  flex: 1,
                  height: 56,
                  border: "none",
                  outline: "none",
                  padding: "0 16px",
                  fontSize: 20,
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                  color: "var(--text)",
                  background: "transparent",
                  minWidth: 0,
                }}
              />

              {/* Checkmark when 10 digits */}
              {isValid && (
                <div style={{ paddingRight: 16 }}>
                  <CheckCircle size={20} color="var(--success)" />
                </div>
              )}
            </div>

            {error && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 16,
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
                height: 52,
                border: "none",
                borderRadius: 12,
                background:
                  isValid && !loading
                    ? "linear-gradient(135deg, var(--primary), var(--accent-dark))"
                    : "var(--border)",
                color: isValid && !loading ? "#fff" : "var(--text-muted)",
                fontSize: 16,
                fontWeight: 700,
                cursor: isValid && !loading ? "pointer" : "not-allowed",
                marginTop: 16,
                marginBottom: 24,
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => {
                if (isValid && !loading)
                  (e.currentTarget as HTMLButtonElement).style.opacity = "0.9";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.opacity = "1";
              }}
            >
              {loading ? "Sending OTP…" : "Get OTP"}
            </button>
          </form>

          <p
            style={{
              fontSize: 12,
              color: "var(--text-light)",
              textAlign: "center",
              lineHeight: 1.6,
            }}
          >
            By continuing you agree to our{" "}
            <span style={{ color: "var(--primary)", cursor: "pointer" }}>Terms of Service</span>{" "}
            &amp;{" "}
            <span style={{ color: "var(--primary)", cursor: "pointer" }}>Privacy Policy</span>
          </p>
        </div>
      </div>

      <style>{`
        .login-grid { grid-template-columns: 1fr 1fr; }
      `}</style>
    </div>
  );
}
