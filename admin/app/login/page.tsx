"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/auth";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) { setError("Please enter email and password."); return; }
    setLoading(true);
    setError("");
    const res = await login(email, password);
    setLoading(false);
    if (!res.ok) { setError(res.error || "Login failed."); return; }
    router.replace("/dashboard");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "var(--sidebar-bg)",
      }}
    >
      {/* Left — brand panel */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px 64px",
          position: "relative",
          overflow: "hidden",
        }}
        className="login-brand"
      >
        {/* Decorative blobs */}
        <div style={{ position: "absolute", top: -100, left: -80, width: 380, height: 380, borderRadius: "50%", background: "rgba(21,128,255,0.08)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -60, right: -40, width: 280, height: 280, borderRadius: "50%", background: "rgba(21,128,255,0.05)", pointerEvents: "none" }} />

        <div style={{ position: "relative" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 64 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, #1580FF, #0EA5E9)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Shield size={20} color="#fff" strokeWidth={2.5} />
            </div>
            <div>
              <p style={{ fontSize: 18, fontWeight: 800, color: "#F1F5F9", letterSpacing: "-0.03em" }}>
                ASK <span style={{ color: "#1580FF", fontWeight: 400, fontSize: 14 }}>Insurance</span>
              </p>
              <p style={{ fontSize: 10, color: "#475569", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>Admin Portal</p>
            </div>
          </div>

          <h1 style={{ fontSize: 40, fontWeight: 900, color: "#F1F5F9", letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: 16 }}>
            Internal<br />operations<br />dashboard
          </h1>
          <p style={{ fontSize: 15, color: "#64748B", lineHeight: 1.7, maxWidth: 360, marginBottom: 48 }}>
            Manage users, policies, claims, and insurers from one secure place. Authorised access only.
          </p>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, maxWidth: 320 }}>
            {[
              { value: "2,400+", label: "Active users" },
              { value: "₹4.2 Cr", label: "Premium collected" },
              { value: "98.5%", label: "Claim settlement" },
              { value: "38", label: "Partner insurers" },
            ].map(({ value, label }) => (
              <div key={label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 16px" }}>
                <p style={{ fontSize: 22, fontWeight: 800, color: "#1580FF", letterSpacing: "-0.04em", marginBottom: 2 }}>{value}</p>
                <p style={{ fontSize: 11, color: "#64748B", fontWeight: 500 }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — login form */}
      <div
        style={{
          width: 480,
          background: "var(--white)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 48px",
          flexShrink: 0,
        }}
        className="login-form"
      >
        <div style={{ width: "100%" }}>
          <h2 style={{ fontSize: 26, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 6 }}>
            Welcome back
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 32 }}>
            Sign in to your admin account
          </p>

          {/* Demo credentials hint */}
          <div style={{ background: "var(--primary-light)", border: "1px solid #C7DEFF", borderRadius: 10, padding: "10px 14px", marginBottom: 24 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--primary)", marginBottom: 2 }}>Demo credentials</p>
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>admin@ask.in &nbsp;/&nbsp; Admin@123</p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>
                Email address
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 10, border: "1.5px solid var(--border)", borderRadius: 10, padding: "0 14px", height: 46, background: "var(--bg)", transition: "border-color 0.15s" }}
                onFocusCapture={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
                onBlurCapture={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              >
                <Mail size={16} color="var(--text-muted)" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@ask.in"
                  style={{ flex: 1, border: "none", outline: "none", fontSize: 14, color: "var(--text)", background: "transparent" }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>
                Password
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 10, border: "1.5px solid var(--border)", borderRadius: 10, padding: "0 14px", height: 46, background: "var(--bg)", transition: "border-color 0.15s" }}
                onFocusCapture={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
                onBlurCapture={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              >
                <Lock size={16} color="var(--text-muted)" />
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ flex: 1, border: "none", outline: "none", fontSize: 14, color: "var(--text)", background: "transparent" }}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--error-light)", border: "1px solid #FCA5A5", borderRadius: 8, padding: "10px 12px", marginBottom: 20 }}>
                <AlertCircle size={15} color="var(--error)" />
                <p style={{ fontSize: 13, color: "var(--error)" }}>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                height: 48,
                background: loading ? "#93C5FD" : "var(--primary)",
                border: "none",
                borderRadius: 12,
                color: "#fff",
                fontSize: 15,
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "opacity 0.15s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {loading ? (
                <>
                  <span style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                  Signing in…
                </>
              ) : "Sign in to Admin Panel"}
            </button>
          </form>

          <p style={{ fontSize: 12, color: "var(--text-light)", textAlign: "center", marginTop: 28, lineHeight: 1.6 }}>
            This portal is for authorised ASK Insurance staff only.<br />
            Unauthorised access is prohibited.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .login-brand { display: none !important; }
          .login-form { width: 100% !important; }
        }
      `}</style>
    </div>
  );
}
