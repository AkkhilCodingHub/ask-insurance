"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  Bell,
  Fingerprint,
  Lock,
  Globe,
  DollarSign,
  LogOut,
  Shield,
} from "lucide-react";
import { useAuth } from "@/context/auth";
import { MY_POLICIES, MY_CLAIMS } from "@/lib/mock";

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      role="switch"
      aria-checked={checked}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        background: checked ? "var(--primary)" : "var(--border)",
        border: "none",
        cursor: "pointer",
        position: "relative",
        transition: "background 0.2s",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 3,
          left: checked ? 23 : 3,
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#fff",
          transition: "left 0.2s",
        }}
      />
    </button>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [notifications, setNotifications] = useState(true);
  const [biometric, setBiometric] = useState(false);
  const [language, setLanguage] = useState("English");

  if (!user) return null;

  function getInitials(name: string) {
    return name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2);
  }

  const activePolicies = MY_POLICIES.filter((p) => p.status === "Active").length;
  const approvedClaims = MY_CLAIMS.filter((c) => c.status === "Approved").length;

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <div style={{ width: "100%" }}>
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: "-0.04em",
            color: "var(--text)",
            marginBottom: 4,
          }}
        >
          Profile & Settings
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
          Manage your account and preferences
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "300px 1fr",
          gap: 20,
          alignItems: "start",
        }}
        className="profile-grid"
      >
        {/* Profile card */}
        <div
          style={{
            background: "var(--white)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: 24,
            textAlign: "center",
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--primary), var(--accent-dark))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 26,
              fontWeight: 800,
              margin: "0 auto 16px",
            }}
          >
            {getInitials(user.name)}
          </div>

          <h2
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: "var(--text)",
              letterSpacing: "-0.03em",
              marginBottom: 4,
            }}
          >
            {user.name}
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>
            +91 {user.phone}
          </p>
          {user.dob && (
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>
              DOB: {user.dob}
            </p>
          )}

          {/* Verified badge */}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              fontWeight: 700,
              color: "#059669",
              background: "#ECFDF5",
              padding: "5px 12px",
              borderRadius: 100,
              marginBottom: 20,
            }}
          >
            <CheckCircle size={13} />
            Verified Account
          </span>

          {/* Stats */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 8,
              borderTop: "1px solid var(--border)",
              paddingTop: 16,
            }}
          >
            {[
              { label: "Policies", value: activePolicies },
              { label: "Claims", value: MY_CLAIMS.length },
              { label: "Approved", value: approvedClaims },
            ].map(({ label, value }) => (
              <div key={label} style={{ textAlign: "center" }}>
                <p
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: "var(--primary)",
                    letterSpacing: "-0.04em",
                  }}
                >
                  {value}
                </p>
                <p style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 500 }}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Settings panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Notifications */}
          <div
            style={{
              background: "var(--white)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: 20,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "var(--primary-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Bell size={16} color="var(--primary)" />
              </div>
              <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>
                Notifications
              </span>
            </div>

            {[
              {
                label: "Policy renewal reminders",
                sub: "Get notified 30 days before renewal",
                checked: notifications,
                toggle: () => setNotifications(!notifications),
              },
              {
                label: "Claim status updates",
                sub: "Real-time updates on your claims",
                checked: true,
                toggle: () => {},
              },
              {
                label: "Offers & promotions",
                sub: "Exclusive deals from partner insurers",
                checked: false,
                toggle: () => {},
              },
            ].map(({ label, sub, checked, toggle }) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 0",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{label}</p>
                  <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{sub}</p>
                </div>
                <Toggle checked={checked} onChange={toggle} />
              </div>
            ))}
          </div>

          {/* Security */}
          <div
            style={{
              background: "var(--white)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: 20,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "#ECFDF5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Shield size={16} color="#059669" />
              </div>
              <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>Security</span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 0",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Fingerprint size={18} color="var(--text-muted)" />
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
                    Biometric Login
                  </p>
                  <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    Use fingerprint or Face ID
                  </p>
                </div>
              </div>
              <Toggle checked={biometric} onChange={() => setBiometric(!biometric)} />
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 0",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Lock size={18} color="var(--text-muted)" />
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Change PIN</p>
                  <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    Update your 4-digit security PIN
                  </p>
                </div>
              </div>
              <button
                style={{
                  padding: "7px 16px",
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  color: "var(--text-muted)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Change
              </button>
            </div>
          </div>

          {/* App Preferences */}
          <div
            style={{
              background: "var(--white)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: 20,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "#FFFBEB",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Globe size={16} color="#D97706" />
              </div>
              <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>
                App Preferences
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 0",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Globe size={16} color="var(--text-muted)" />
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Language</span>
              </div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={{
                  padding: "7px 12px",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 13,
                  color: "var(--text)",
                  background: "var(--white)",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                <option>English</option>
                <option>Hindi</option>
                <option>Tamil</option>
                <option>Telugu</option>
                <option>Marathi</option>
              </select>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 0",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <DollarSign size={16} color="var(--text-muted)" />
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Currency</span>
              </div>
              <span
                style={{
                  padding: "7px 16px",
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text)",
                }}
              >
                INR (₹)
              </span>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              width: "100%",
              padding: "14px",
              background: "var(--white)",
              border: "1.5px solid var(--error)",
              borderRadius: 12,
              color: "var(--error)",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background = "var(--error-light)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background = "var(--white)")
            }
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .profile-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
