"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth";
import { adminApi } from "@/lib/api";
import { Save, Eye, EyeOff, Loader2, Check, X } from "lucide-react";

// ── Shared components ────────────────────────────────────────────────────────

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", marginBottom: 20 }}>
      <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--border)" }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", marginBottom: subtitle ? 2 : 0 }}>{title}</h3>
        {subtitle && <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{subtitle}</p>}
      </div>
      <div style={{ padding: "18px 22px" }}>{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 12px",
  border: "1.5px solid var(--border)", borderRadius: 8,
  fontSize: 13, outline: "none", boxSizing: "border-box",
};

function Banner({ type, msg }: { type: "success" | "error"; msg: string }) {
  const bg  = type === "success" ? "#ECFDF5" : "#FEF2F2";
  const clr = type === "success" ? "#059669"  : "#DC2626";
  const bdr = type === "success" ? "#A7F3D0" : "#FECACA";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: bg, border: `1px solid ${bdr}`, borderRadius: 8, marginBottom: 14 }}>
      {type === "success" ? <Check size={14} color={clr} /> : <X size={14} color={clr} />}
      <p style={{ fontSize: 13, color: clr, fontWeight: 500 }}>{msg}</p>
    </div>
  );
}

// ── Role badge ────────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  const isSuperadmin = role === "superadmin";
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 100, textTransform: "uppercase", letterSpacing: "0.05em",
      background: isSuperadmin ? "#EFF6FF" : "#F0FDF4",
      color:      isSuperadmin ? "#1D4ED8"  : "#15803D",
      border:     isSuperadmin ? "1px solid #BFDBFE" : "1px solid #BBF7D0",
    }}>{isSuperadmin ? "Superadmin" : "Admin"}</span>
  );
}

// ── Admin Profile section ─────────────────────────────────────────────────────

function ProfileSection() {
  const { admin } = useAuth();
  const [name,      setName]      = useState(admin?.name ?? "");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw,     setNewPw]     = useState("");
  const [showPw,    setShowPw]    = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [banner,    setBanner]    = useState<{ type: "success" | "error"; msg: string } | null>(null);

  async function handleSave() {
    setSaving(true);
    setBanner(null);
    try {
      const payload: { name?: string; currentPassword?: string; newPassword?: string } = {};
      if (name.trim() && name.trim() !== admin?.name) payload.name = name.trim();
      if (newPw) {
        if (!currentPw) { setBanner({ type: "error", msg: "Enter your current password to set a new one." }); setSaving(false); return; }
        if (newPw.length < 8) { setBanner({ type: "error", msg: "New password must be at least 8 characters." }); setSaving(false); return; }
        payload.currentPassword = currentPw;
        payload.newPassword     = newPw;
      }
      if (Object.keys(payload).length === 0) { setBanner({ type: "error", msg: "Nothing to update." }); setSaving(false); return; }
      await adminApi.updateProfile(payload);
      setBanner({ type: "success", msg: "Profile updated successfully." });
      setCurrentPw(""); setNewPw("");
    } catch (e: unknown) {
      setBanner({ type: "error", msg: e instanceof Error ? e.message : "Failed to save changes." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Section title="Admin Profile" subtitle="Update your name and password">
      {banner && <Banner type={banner.type} msg={banner.msg} />}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <Field label="Full Name">
          <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Email Address">
          <input value={admin?.email ?? ""} disabled
            style={{ ...inputStyle, background: "var(--bg)", color: "var(--text-muted)", cursor: "not-allowed" }} />
        </Field>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
        <Field label="Current Password">
          <div style={{ display: "flex", alignItems: "center", border: "1.5px solid var(--border)", borderRadius: 8, padding: "0 12px", height: 38 }}>
            <input type={showPw ? "text" : "password"} value={currentPw} onChange={e => setCurrentPw(e.target.value)}
              placeholder="Required to change password"
              style={{ flex: 1, border: "none", outline: "none", fontSize: 13, background: "transparent" }} />
            <button onClick={() => setShowPw(!showPw)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}>
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </Field>
        <Field label="New Password">
          <input type={showPw ? "text" : "password"} value={newPw} onChange={e => setNewPw(e.target.value)}
            placeholder="Min. 8 characters" style={inputStyle} />
        </Field>
      </div>

      <button onClick={handleSave} disabled={saving}
        style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 22px", background: "var(--primary)", border: "none", borderRadius: 10, color: "#fff", fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.75 : 1 }}>
        {saving ? <Loader2 size={15} style={{ animation: "spin 0.8s linear infinite" }} /> : <Save size={15} />}
        {saving ? "Saving…" : "Save Changes"}
      </button>
    </Section>
  );
}


// ── Mobile Maintenance Section ──────────────────────────────────────────────────

import { Wrench, AlertTriangle, ShieldCheck } from "lucide-react";

function MaintenanceSection() {
  const [maintenance, setMaintenance] = useState<{
    maintenanceMode: boolean;
    maintenanceMessage: string;
    updatedAt?: string;
  }>({
    maintenanceMode: false,
    maintenanceMessage: "We are currently performing scheduled maintenance to improve your experience. The ASK Insurance app will be back online shortly.",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [banner, setBanner]   = useState<{ type: "success" | "error"; msg: string } | null>(null);

  useEffect(() => {
    adminApi.getMaintenance()
      .then(res => {
        if (res) setMaintenance(res);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleToggle(newMode: boolean) {
    setSaving(true);
    setBanner(null);
    try {
      const res = await adminApi.setMaintenance({
        maintenanceMode: newMode,
        maintenanceMessage: maintenance.maintenanceMessage,
      });
      setMaintenance(res);
      setBanner({
        type: "success",
        msg: newMode ? "⚠️ Mobile App Maintenance Mode is now ENABLED." : "✅ Mobile App Maintenance Mode is now DISABLED.",
      });
    } catch (e) {
      setBanner({ type: "error", msg: e instanceof Error ? e.message : "Failed to update maintenance mode." });
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveMessage() {
    setSaving(true);
    setBanner(null);
    try {
      const res = await adminApi.setMaintenance({
        maintenanceMode: maintenance.maintenanceMode,
        maintenanceMessage: maintenance.maintenanceMessage,
      });
      setMaintenance(res);
      setBanner({ type: "success", msg: "Maintenance announcement message updated." });
    } catch (e) {
      setBanner({ type: "error", msg: e instanceof Error ? e.message : "Failed to save message." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Section
      title="Mobile App Maintenance Mode"
      subtitle="Lock the mobile application and show a scheduled maintenance screen to all users"
    >
      {banner && <Banner type={banner.type} msg={banner.msg} />}

      <div style={{
        background: maintenance.maintenanceMode ? "#FEF2F2" : "#ECFDF5",
        border: `1.5px solid ${maintenance.maintenanceMode ? "#FECACA" : "#A7F3D0"}`,
        borderRadius: 12,
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 18,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: maintenance.maintenanceMode ? "#FEE2E2" : "#D1FAE5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            {maintenance.maintenanceMode ? (
              <AlertTriangle size={22} color="#DC2626" />
            ) : (
              <ShieldCheck size={22} color="#059669" />
            )}
          </div>
          <div>
            <p style={{
              fontSize: 15,
              fontWeight: 800,
              color: maintenance.maintenanceMode ? "#DC2626" : "#059669",
            }}>
              {maintenance.maintenanceMode ? "Mobile App Is Under Maintenance" : "Mobile App Is Live & Operational"}
            </p>
            <p style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
              {maintenance.maintenanceMode
                ? "All mobile app users are currently redirected to the Maintenance Screen."
                : "All mobile app users have normal access to browse, quote, and buy policies."}
            </p>
          </div>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => handleToggle(!maintenance.maintenanceMode)}
          disabled={loading || saving}
          style={{
            padding: "10px 20px",
            background: maintenance.maintenanceMode ? "#059669" : "#DC2626",
            border: "none",
            borderRadius: 10,
            color: "#fff",
            fontSize: 13,
            fontWeight: 800,
            cursor: loading || saving ? "not-allowed" : "pointer",
            boxShadow: maintenance.maintenanceMode
              ? "0 4px 12px rgba(5,150,105,0.25)"
              : "0 4px 12px rgba(220,38,38,0.25)",
            transition: "all 0.15s",
          }}
        >
          {saving ? "Updating…" : maintenance.maintenanceMode ? "Turn Off Maintenance (Go Live)" : "Enable Maintenance Mode"}
        </button>
      </div>

      <Field label="Maintenance Announcement Message (Shown on Mobile Screen)">
        <textarea
          value={maintenance.maintenanceMessage}
          onChange={e => setMaintenance({ ...maintenance, maintenanceMessage: e.target.value })}
          rows={3}
          style={{ ...inputStyle, resize: "vertical", marginBottom: 12, lineHeight: 1.5 }}
        />
      </Field>

      <button
        onClick={handleSaveMessage}
        disabled={saving || loading}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "9px 18px",
          background: "#1580FF",
          border: "none",
          borderRadius: 8,
          color: "#fff",
          fontSize: 12,
          fontWeight: 700,
          cursor: saving ? "not-allowed" : "pointer",
        }}
      >
        <Save size={14} /> Save Message
      </button>
    </Section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

import Link from "next/link";
import { BookTemplate, ClipboardList, ArrowRight } from "lucide-react";

export default function SettingsPage() {
  return (
    <div style={{ width: "100%", maxWidth: 820 }}>
      <ProfileSection />

      <MaintenanceSection />

      {/* Additional Settings Quick Navigation */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginTop: 24 }}>
        <Link href="/dashboard/settings/templates" style={{ textDecoration: "none" }}>
          <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 14, padding: "20px", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "transform 0.15s" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: "rgba(124, 58, 237, 0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <BookTemplate size={20} color="#7C3AED" />
              </div>
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", margin: 0 }}>Templates & Rate Charts</h4>
                <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "3px 0 0" }}>Manage quote templates and GST rates</p>
              </div>
            </div>
            <ArrowRight size={16} color="var(--text-muted)" />
          </div>
        </Link>

        <Link href="/dashboard/logs" style={{ textDecoration: "none" }}>
          <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 14, padding: "20px", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "transform 0.15s" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: "rgba(21, 128, 255, 0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ClipboardList size={20} color="#1580FF" />
              </div>
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", margin: 0 }}>System & Audit Logs</h4>
                <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "3px 0 0" }}>View security event history</p>
              </div>
            </div>
            <ArrowRight size={16} color="var(--text-muted)" />
          </div>
        </Link>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
