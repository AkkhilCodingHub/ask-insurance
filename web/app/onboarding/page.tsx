"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, User, Calendar, Lock, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/auth";

function isValidDOB(dob: string): boolean {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dob)) return false;
  const [d, m, y] = dob.split("/").map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const date = new Date(y, m - 1, d);
  const now = new Date();
  const age = now.getFullYear() - y;
  return date <= now && age >= 18 && age <= 100;
}

function formatDOB(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  let result = "";
  for (let i = 0; i < digits.length; i++) {
    if (i === 2 || i === 4) result += "/";
    result += digits[i];
  }
  return result;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { completeProfile } = useAuth();

  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const nameValid = name.trim().length >= 2;
  const dobValid = isValidDOB(dob);
  const canSubmit = nameValid && dobValid && !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError("");
    setLoading(true);
    try {
      await completeProfile(name.trim(), dob);
      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="ob-grid"
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
      }}
    >
      <style>{`
        @media (max-width: 768px) {
          .ob-grid { display: flex !important; flex-direction: column; }
          .ob-hero { min-height: 260px; flex-shrink: 0; }
          .ob-form-side { flex: 1; }
        }
      `}</style>

      {/* Left hero — green */}
      <div
        className="ob-hero"
        style={{
          background: "linear-gradient(135deg, #047857 0%, #059669 50%, #10B981 100%)",
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
            background: "rgba(255,255,255,0.06)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -60,
            left: -60,
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
          }}
        />

        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.18)",
            border: "2px solid rgba(255,255,255,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
          }}
        >
          <Sparkles size={36} color="#fff" strokeWidth={1.5} />
        </div>

        <h2
          style={{
            fontSize: 36,
            fontWeight: 800,
            letterSpacing: "-0.04em",
            color: "#fff",
            marginBottom: 8,
          }}
        >
          Almost there!
        </h2>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.75)", marginBottom: 44 }}>
          Just a moment to set up your profile
        </p>

        {/* Progress dots */}
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: i === 2 ? 28 : 10,
                height: 10,
                borderRadius: 5,
                background: i === 2 ? "#fff" : "rgba(255,255,255,0.5)",
                transition: "all 0.3s",
              }}
            />
          ))}
        </div>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 10 }}>
          Step 3 of 3
        </p>
      </div>

      {/* Right form */}
      <div
        className="ob-form-side"
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
            Just a few details
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 32 }}>
            Help us personalise your insurance experience
          </p>

          <form onSubmit={handleSubmit}>
            {/* Name input */}
            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Full Name
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  border: `1.5px solid ${nameValid && name ? "var(--success)" : "var(--border)"}`,
                  borderRadius: 12,
                  overflow: "hidden",
                  transition: "border-color 0.2s",
                }}
              >
                <div
                  style={{
                    padding: "0 14px",
                    height: 52,
                    display: "flex",
                    alignItems: "center",
                    background: "var(--bg)",
                    borderRight: "1.5px solid var(--border)",
                  }}
                >
                  <User size={18} color="var(--text-muted)" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  autoFocus
                  style={{
                    flex: 1,
                    height: 52,
                    border: "none",
                    outline: "none",
                    padding: "0 14px",
                    fontSize: 16,
                    color: "var(--text)",
                    background: "transparent",
                  }}
                  onFocus={(e) => {
                    (e.currentTarget.parentElement as HTMLElement).style.borderColor =
                      "var(--primary)";
                    (e.currentTarget.parentElement as HTMLElement).style.boxShadow =
                      "0 0 0 3px rgba(21,128,255,0.1)";
                  }}
                  onBlur={(e) => {
                    if (!nameValid) {
                      (e.currentTarget.parentElement as HTMLElement).style.borderColor =
                        "var(--border)";
                    }
                    (e.currentTarget.parentElement as HTMLElement).style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            {/* DOB input */}
            <div style={{ marginBottom: 24 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Date of Birth
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  border: `1.5px solid ${dobValid ? "var(--success)" : "var(--border)"}`,
                  borderRadius: 12,
                  overflow: "hidden",
                  transition: "border-color 0.2s",
                }}
              >
                <div
                  style={{
                    padding: "0 14px",
                    height: 52,
                    display: "flex",
                    alignItems: "center",
                    background: "var(--bg)",
                    borderRight: "1.5px solid var(--border)",
                  }}
                >
                  <Calendar size={18} color="var(--text-muted)" />
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  value={dob}
                  onChange={(e) => setDob(formatDOB(e.target.value))}
                  placeholder="DD/MM/YYYY"
                  maxLength={10}
                  style={{
                    flex: 1,
                    height: 52,
                    border: "none",
                    outline: "none",
                    padding: "0 14px",
                    fontSize: 16,
                    letterSpacing: "0.04em",
                    color: "var(--text)",
                    background: "transparent",
                    fontFamily: "monospace",
                  }}
                  onFocus={(e) => {
                    (e.currentTarget.parentElement as HTMLElement).style.borderColor =
                      "var(--primary)";
                    (e.currentTarget.parentElement as HTMLElement).style.boxShadow =
                      "0 0 0 3px rgba(21,128,255,0.1)";
                  }}
                  onBlur={(e) => {
                    if (!dobValid) {
                      (e.currentTarget.parentElement as HTMLElement).style.borderColor =
                        "var(--border)";
                    }
                    (e.currentTarget.parentElement as HTMLElement).style.boxShadow = "none";
                  }}
                />
              </div>
              <p style={{ fontSize: 12, color: "var(--text-light)", marginTop: 6 }}>
                Must be 18+ years. Format: DD/MM/YYYY
              </p>
            </div>

            {/* Info box */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "12px 14px",
                background: "var(--primary-light)",
                borderRadius: 10,
                marginBottom: 28,
              }}
            >
              <Lock size={15} color="var(--primary)" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 13, color: "var(--primary)", lineHeight: 1.5 }}>
                Your date of birth helps us show age-appropriate plans and accurate premium quotes.
              </p>
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
              type="submit"
              disabled={!canSubmit}
              style={{
                width: "100%",
                height: 52,
                border: "none",
                borderRadius: 12,
                background: canSubmit
                  ? "linear-gradient(135deg, #047857, #059669)"
                  : "var(--border)",
                color: canSubmit ? "#fff" : "var(--text-muted)",
                fontSize: 16,
                fontWeight: 700,
                cursor: canSubmit ? "pointer" : "not-allowed",
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => {
                if (canSubmit)
                  (e.currentTarget as HTMLButtonElement).style.opacity = "0.9";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.opacity = "1";
              }}
            >
              {loading ? "Setting up your account…" : "Let's go! →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
