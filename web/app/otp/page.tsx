"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Smartphone, Info, AlertCircle, Shield } from "lucide-react";
import { useAuth } from "@/context/auth";
import { getRemainingOtpSeconds, startOtpCooldown, formatOtpTimer } from "@/lib/otpCooldown";

export default function OTPPage() {
  const router = useRouter();
  const { verifyOTP, pendingPhone, sendOTP } = useAuth();

  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const phone = pendingPhone || "";
  const [resendTimer, setResendTimer] = useState(() => Math.max(1, (phone ? getRemainingOtpSeconds(phone) : 300) || 300));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 5-minute (300s) Real-Time Countdown Timer
  useEffect(() => {
    if (!phone) return;
    const tick = () => {
      const remaining = getRemainingOtpSeconds(phone);
      setResendTimer(remaining);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [phone]);

  function handleDigit(index: number, value: string) {
    const char = value.replace(/\D/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);
    setError("");
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace") {
      if (digits[index]) {
        const newDigits = [...digits];
        newDigits[index] = "";
        setDigits(newDigits);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        const newDigits = [...digits];
        newDigits[index - 1] = "";
        setDigits(newDigits);
      }
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = text[i] ?? "";
    }
    setDigits(newDigits);
    const focusIdx = Math.min(text.length, 5);
    inputRefs.current[focusIdx]?.focus();
  }

  const isComplete = digits.every((d) => d !== "");

  async function handleVerify() {
    if (!isComplete) return;
    setError("");
    setLoading(true);
    try {
      const { isNewUser } = await verifyOTP(digits.join(""));
      if (isNewUser) {
        router.push("/onboarding");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Invalid OTP. Please try again.");
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendTimer > 0 || !pendingPhone) return;
    setDigits(["", "", "", "", "", ""]);
    setError("");
    startOtpCooldown(pendingPhone, 300);
    setResendTimer(300);
    await sendOTP(pendingPhone);
  }

  const maskedPhone = pendingPhone
    ? `+91 ${pendingPhone.slice(0, 5)}${"•".repeat(5)}`
    : "+91 •••••••••";

  return (
    <div
      className="otp-grid"
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
      }}
    >
      <style>{`
        @media (max-width: 768px) {
          .otp-grid { display: flex !important; flex-direction: column; }
          .otp-hero { min-height: 260px; flex-shrink: 0; }
          .otp-form-side { flex: 1; }
        }
      `}</style>
      

      {/* Left hero */}
      <div
        className="otp-hero"
        style={{
          background: "linear-gradient(135deg, #083A8C 0%, #1580FF 50%, #0EA5E9 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "60px 40px",
          position: "relative",
          overflow: "hidden",
          textAlign: "center",
        }}
      >
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
          className="animate-ring"
          style={{
            width: 96,
            height: 96,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.15)",
            border: "2px solid rgba(255,255,255,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 28,
          }}
        >
          <Smartphone size={44} color="#fff" strokeWidth={1.5} />
        </div>

        <h2
          style={{
            fontSize: 34,
            fontWeight: 800,
            letterSpacing: "-0.04em",
            color: "#fff",
            marginBottom: 12,
          }}
        >
          Verify your number
        </h2>

        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}>
          OTP sent to
        </p>
        <p
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "#fff",
            marginTop: 4,
            letterSpacing: "0.04em",
          }}
        >
          {maskedPhone}
        </p>

        {/* Logo at bottom */}
        <div
          style={{
            position: "absolute",
            bottom: 32,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Shield size={18} color="rgba(255,255,255,0.6)" />
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>
            ASK Insurance
          </span>
        </div>
      </div>

      {/* Right form */}
      <div
        className="otp-form-side"
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
            Enter the 6-digit code
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 32 }}>
            We sent a verification code to your phone
          </p>

          {/* OTP boxes */}
          <div
            style={{ display: "flex", gap: 10, marginBottom: 20 }}
            onPaste={handlePaste}
          >
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="tel"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleDigit(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                style={{
                  width: 56,
                  height: 56,
                  textAlign: "center",
                  fontSize: 22,
                  fontWeight: 700,
                  borderRadius: 10,
                  border: `1.5px solid ${d ? "var(--primary)" : "var(--border)"}`,
                  outline: "none",
                  background: d ? "var(--primary-light)" : "var(--white)",
                  color: "var(--text)",
                  transition: "border-color 0.15s, background 0.15s",
                  flex: "0 0 auto",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--primary)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(21,128,255,0.12)";
                }}
                onBlur={(e) => {
                  if (!e.currentTarget.value) {
                    e.currentTarget.style.borderColor = "var(--border)";
                  }
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            ))}
          </div>

          {/* Timer status */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 14px",
              background: "var(--bg)",
              borderRadius: 8,
              marginBottom: 24,
            }}
          >
            <Info size={14} color={resendTimer === 0 ? "var(--error)" : "var(--primary)"} />
            <span style={{ fontSize: 13, color: resendTimer === 0 ? "var(--error)" : "var(--primary)", fontWeight: 700 }}>
              {resendTimer > 0 ? `Code expires in ${formatOtpTimer(resendTimer)}` : "Code expired. Please request a new OTP."}
            </span>
          </div>

          {error && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 16,
                padding: "10px 14px",
                background: "var(--error-light)",
                borderRadius: 8,
                color: "var(--error)",
                fontSize: 13,
              }}
            >
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <button
            onClick={handleVerify}
            disabled={!isComplete || loading || resendTimer === 0}
            style={{
              width: "100%",
              height: 52,
              border: "none",
              borderRadius: 12,
              background:
                isComplete && !loading && resendTimer > 0
                  ? "linear-gradient(135deg, var(--primary), var(--accent-dark))"
                  : "var(--border)",
              color: isComplete && !loading && resendTimer > 0 ? "#fff" : "var(--text-muted)",
              fontSize: 16,
              fontWeight: 700,
              cursor: isComplete && !loading && resendTimer > 0 ? "pointer" : "not-allowed",
              marginBottom: 20,
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => {
              if (isComplete && !loading && resendTimer > 0)
                (e.currentTarget as HTMLButtonElement).style.opacity = "0.9";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.opacity = "1";
            }}
          >
            {loading ? "Verifying…" : "Verify & Continue"}
          </button>

          {/* Resend */}
          <div style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)" }}>
            {resendTimer === 0 ? (
              <span
                onClick={handleResend}
                style={{
                  color: "var(--primary)",
                  fontWeight: 700,
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Resend OTP
              </span>
            ) : (
              <span>Resend in {formatOtpTimer(resendTimer)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
