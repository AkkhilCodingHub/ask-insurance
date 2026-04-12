"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Lock,
  ShieldCheck,
  Globe,
  Moon,
  CreditCard,
  FileText,
  HelpCircle,
  MessageSquare,
  LogOut,
  Trash2,
  ChevronRight,
  Smartphone,
  Mail,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/context/auth";

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        border: "none",
        cursor: "pointer",
        background: checked ? "var(--primary)" : "var(--border)",
        position: "relative",
        transition: "background 0.2s",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: checked ? 23 : 3,
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#fff",
          transition: "left 0.2s",
          boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
        }}
      />
    </button>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 4, paddingBottom: 12, borderBottom: "1px solid var(--border)" }}>
      <h2 style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: subtitle ? 2 : 0 }}>
        {title}
      </h2>
      {subtitle && <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{subtitle}</p>}
    </div>
  );
}

function ToggleRow({
  icon,
  iconBg,
  iconColor,
  label,
  sub,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  sub: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <span style={{ color: iconColor }}>{icon}</span>
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>{label}</p>
        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{sub}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

function NavRow({
  icon,
  iconBg,
  iconColor,
  label,
  sub,
  badge,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  sub?: string;
  badge?: string;
  onClick?: () => void;
  danger?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 0",
        background: hovered ? "var(--bg)" : "transparent",
        border: "none",
        borderBottom: "1px solid var(--border)",
        cursor: "pointer",
        textAlign: "left",
        transition: "background 0.15s",
        borderRadius: hovered ? 8 : 0,
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginLeft: hovered ? 4 : 0,
          transition: "margin 0.15s",
        }}
      >
        <span style={{ color: iconColor }}>{icon}</span>
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: danger ? "var(--error)" : "var(--text)", marginBottom: sub ? 2 : 0 }}>
          {label}
        </p>
        {sub && <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{sub}</p>}
      </div>
      {badge && (
        <span
          style={{
            background: "var(--primary-light)",
            color: "var(--primary)",
            fontSize: 11,
            fontWeight: 700,
            padding: "2px 8px",
            borderRadius: 20,
            marginRight: 4,
          }}
        >
          {badge}
        </span>
      )}
      <ChevronRight size={16} color={danger ? "var(--error)" : "var(--text-light)"} />
    </button>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--white)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: "8px 20px",
        marginBottom: 20,
      }}
    >
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { logout } = useAuth();

  // Notifications
  const [policyAlerts, setPolicyAlerts]     = useState(true);
  const [claimUpdates, setClaimUpdates]     = useState(true);
  const [renewalRemind, setRenewalRemind]   = useState(true);
  const [promoEmails, setPromoEmails]       = useState(false);
  const [smsAlerts, setSmsAlerts]           = useState(true);
  const [whatsapp, setWhatsapp]             = useState(false);

  // Security
  const [biometric, setBiometric]           = useState(false);
  const [twoFA, setTwoFA]                   = useState(false);

  // Preferences
  const [darkMode, setDarkMode]             = useState(false);

  // Confirm logout dialog state
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <div style={{ width: "100%", maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>

      {/* ── Page header ──────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.04em", marginBottom: 4 }}>
          Settings
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
          Manage your notifications, security, and preferences
        </p>
      </div>

      <div className="settings-grid" style={{ display: "grid", gridTemplateColumns: "1.4fr 0.85fr", gap: 28, alignItems: "start" }}>
        <div style={{ display: "grid", gap: 20 }}>

      {/* ── Notifications ──────────────────────── */}
      <Card>
        <SectionHeader title="Notifications" subtitle="Choose what you want to be alerted about" />
        <ToggleRow
          icon={<Bell size={18} />}
          iconBg="var(--primary-light)"
          iconColor="var(--primary)"
          label="Policy alerts"
          sub="Expiry reminders and coverage updates"
          checked={policyAlerts}
          onChange={setPolicyAlerts}
        />
        <ToggleRow
          icon={<ShieldCheck size={18} />}
          iconBg="#ECFDF5"
          iconColor="var(--success)"
          label="Claim updates"
          sub="Status changes and settlement notifications"
          checked={claimUpdates}
          onChange={setClaimUpdates}
        />
        <ToggleRow
          icon={<AlertTriangle size={18} />}
          iconBg="#FFFBEB"
          iconColor="var(--warning)"
          label="Renewal reminders"
          sub="Get notified 30, 15 and 7 days before renewal"
          checked={renewalRemind}
          onChange={setRenewalRemind}
        />
        <ToggleRow
          icon={<Mail size={18} />}
          iconBg="var(--bg)"
          iconColor="var(--text-muted)"
          label="Promotional emails"
          sub="New plans, offers and broker updates"
          checked={promoEmails}
          onChange={setPromoEmails}
        />
        <ToggleRow
          icon={<Smartphone size={18} />}
          iconBg="var(--primary-light)"
          iconColor="var(--primary)"
          label="SMS alerts"
          sub="Critical alerts via SMS on your registered number"
          checked={smsAlerts}
          onChange={setSmsAlerts}
        />
        <div style={{ borderBottom: "none" }}>
          <ToggleRow
            icon={<MessageSquare size={18} />}
            iconBg="#F0FDF4"
            iconColor="#16A34A"
            label="WhatsApp updates"
            sub="Receive policy and claim updates on WhatsApp"
            checked={whatsapp}
            onChange={setWhatsapp}
          />
        </div>
      </Card>

      {/* ── Security ───────────────────────────── */}
      <Card>
        <SectionHeader title="Security" subtitle="Keep your account safe" />
        <ToggleRow
          icon={<Smartphone size={18} />}
          iconBg="var(--primary-light)"
          iconColor="var(--primary)"
          label="Biometric login"
          sub="Use Face ID or fingerprint to sign in"
          checked={biometric}
          onChange={setBiometric}
        />
        <ToggleRow
          icon={<Lock size={18} />}
          iconBg="#F5F3FF"
          iconColor="#7C3AED"
          label="Two-factor authentication"
          sub="Extra OTP step every time you log in"
          checked={twoFA}
          onChange={setTwoFA}
        />
        <NavRow
          icon={<Lock size={18} />}
          iconBg="var(--bg)"
          iconColor="var(--text-muted)"
          label="Change PIN"
          sub="Update your 4-digit security PIN"
        />
        <div style={{ borderBottom: "none" }}>
          <NavRow
            icon={<ShieldCheck size={18} />}
            iconBg="#ECFDF5"
            iconColor="var(--success)"
            label="Active sessions"
            sub="View and revoke devices logged into your account"
            badge="2 devices"
          />
        </div>
      </Card>

      {/* ── Preferences ────────────────────────── */}
      <Card>
        <SectionHeader title="Preferences" />
        <ToggleRow
          icon={<Moon size={18} />}
          iconBg="var(--bg)"
          iconColor="var(--text-muted)"
          label="Dark mode"
          sub="Easier on the eyes in low-light environments"
          checked={darkMode}
          onChange={setDarkMode}
        />
        <NavRow
          icon={<Globe size={18} />}
          iconBg="var(--primary-light)"
          iconColor="var(--primary)"
          label="Language"
          sub="English (India)"
        />
        <div style={{ borderBottom: "none" }}>
          <NavRow
            icon={<CreditCard size={18} />}
            iconBg="#ECFDF5"
            iconColor="var(--success)"
            label="Payment methods"
            sub="Manage saved cards and UPI IDs"
          />
        </div>
      </Card>
        </div>
        <div style={{ display: "grid", gap: 20 }}>

      {/* ── Support & Legal ────────────────────── */}
      <Card>
        <SectionHeader title="Support & Legal" />
        <NavRow
          icon={<HelpCircle size={18} />}
          iconBg="var(--primary-light)"
          iconColor="var(--primary)"
          label="Help & Support"
          sub="FAQs, chat with an advisor"
        />
        <NavRow
          icon={<MessageSquare size={18} />}
          iconBg="#F0FDF4"
          iconColor="#16A34A"
          label="Send feedback"
          sub="Help us improve ASK Insurance"
        />
        <NavRow
          icon={<FileText size={18} />}
          iconBg="var(--bg)"
          iconColor="var(--text-muted)"
          label="Terms of Service"
        />
        <div style={{ borderBottom: "none" }}>
          <NavRow
            icon={<FileText size={18} />}
            iconBg="var(--bg)"
            iconColor="var(--text-muted)"
            label="Privacy Policy"
          />
        </div>
      </Card>

      {/* ── Account actions ────────────────────── */}
      <Card>
        <SectionHeader title="Account" />
        <NavRow
          icon={<LogOut size={18} />}
          iconBg="#FEF2F2"
          iconColor="var(--error)"
          label="Log out"
          sub="Sign out of your ASK account"
          danger
          onClick={() => setShowLogoutConfirm(true)}
        />
        <div style={{ borderBottom: "none" }}>
          <NavRow
            icon={<Trash2 size={18} />}
            iconBg="#FEF2F2"
            iconColor="var(--error)"
            label="Delete account"
            sub="Permanently remove your data — this cannot be undone"
            danger
          />
        </div>
      </Card>

      {/* ── Version ────────────────────────────── */}
      <p style={{ textAlign: "center", fontSize: 12, color: "var(--text-light)", paddingBottom: 32 }}>
        ASK Insurance Broker · v1.0.0
        <br />
        IRDAI Licensed · Reg. No. XXXXX
      </p>
      </div>
      </div>

      <style>{`
        @media (max-width: 960px) {
          .settings-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── Logout confirm overlay ─────────────── */}
      {showLogoutConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(10,22,40,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 200,
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            style={{
              background: "var(--white)",
              borderRadius: 20,
              padding: 28,
              width: "100%",
              maxWidth: 380,
              margin: "0 16px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: "#FEF2F2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <LogOut size={24} color="var(--error)" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", marginBottom: 8, letterSpacing: "-0.02em" }}>
              Log out?
            </h3>
            <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 24 }}>
              You&apos;ll need to verify your mobile number again to sign back in.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  flex: 1,
                  padding: "12px 0",
                  border: "1.5px solid var(--border)",
                  borderRadius: 12,
                  background: "var(--bg)",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--border)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--bg)")}
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                style={{
                  flex: 1,
                  padding: "12px 0",
                  border: "none",
                  borderRadius: 12,
                  background: "var(--error)",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#fff",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "0.88")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
