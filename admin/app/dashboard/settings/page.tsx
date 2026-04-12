"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth";
import { Shield, Bell, Users, Percent, AlertTriangle, Save, Eye, EyeOff } from "lucide-react";

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

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} style={{ width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer", background: checked ? "var(--primary)" : "var(--border)", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
      <span style={{ position: "absolute", top: 3, left: checked ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
    </button>
  );
}

function ToggleRow({ label, sub, checked, onChange }: { label: string; sub: string; checked: boolean; onChange: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 0", borderBottom: "1px solid var(--border)" }}>
      <div>
        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>{label}</p>
        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{sub}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

const ADMIN_ROLES = [
  { id: "adm-001", name: "Hardil Singh",  email: "admin@ask.in",   role: "super_admin",    avatar: "HS", lastActive: "Just now" },
  { id: "adm-002", name: "Priya Sharma",  email: "priya@ask.in",   role: "claims_manager", avatar: "PS", lastActive: "2 hours ago" },
  { id: "adm-003", name: "Rahul Verma",   email: "rahul@ask.in",   role: "support",         avatar: "RV", lastActive: "Yesterday" },
];

export default function SettingsPage() {
  const { admin } = useAuth();
  const [saved, setSaved] = useState(false);

  // Notifications
  const [newClaim, setNewClaim]         = useState(true);
  const [renewalAlert, setRenewalAlert] = useState(true);
  const [newUser, setNewUser]           = useState(false);
  const [dailyReport, setDailyReport]   = useState(true);

  // Security
  const [maintenance, setMaintenance]   = useState(false);
  const [twoFA, setTwoFA]               = useState(true);
  const [auditLog, setAuditLog]         = useState(true);

  // Commissions
  const [commissions, setCommissions] = useState({ life: "12", health: "11", motor: "10", travel: "12", home: "9", business: "10" });

  // Profile
  const [name, setName]           = useState(admin?.name ?? "");
  const [email, setEmail]         = useState(admin?.email ?? "");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw]         = useState("");
  const [showPw, setShowPw]       = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div style={{ width: "100%", maxWidth: 820 }}>
      {/* Admin profile */}
      <Section title="Admin Profile" subtitle="Your account information">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 5 }}>Full Name</label>
            <input value={name} onChange={e => setName(e.target.value)}
              style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 13, outline: "none" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 5 }}>Email Address</label>
            <input value={email} onChange={e => setEmail(e.target.value)}
              style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 13, outline: "none" }} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 5 }}>Current Password</label>
            <div style={{ display: "flex", alignItems: "center", border: "1.5px solid var(--border)", borderRadius: 8, padding: "0 12px", height: 38 }}>
              <input type={showPw ? "text" : "password"} value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="••••••••"
                style={{ flex: 1, border: "none", outline: "none", fontSize: 13 }} />
              <button onClick={() => setShowPw(!showPw)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 5 }}>New Password</label>
            <input type={showPw ? "text" : "password"} value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="••••••••"
              style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 13, outline: "none" }} />
          </div>
        </div>
      </Section>

      {/* Admin team */}
      <Section title="Admin Team" subtitle="Manage admin users and their roles">
        {ADMIN_ROLES.map(a => (
          <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)" }}>{a.avatar}</span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{a.name}</p>
              <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{a.email} · {a.lastActive}</p>
            </div>
            <select defaultValue={a.role}
              style={{ padding: "6px 10px", border: "1.5px solid var(--border)", borderRadius: 7, fontSize: 12, color: "var(--text)", background: "#fff", outline: "none" }}>
              <option value="super_admin">Super Admin</option>
              <option value="claims_manager">Claims Manager</option>
              <option value="support">Support</option>
            </select>
          </div>
        ))}
        <button style={{ marginTop: 14, padding: "8px 18px", background: "var(--primary-light)", border: "1.5px solid var(--primary)", borderRadius: 8, color: "var(--primary)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
          + Invite Admin
        </button>
      </Section>

      {/* Notifications */}
      <Section title="Admin Notifications" subtitle="Email alerts for key platform events">
        <ToggleRow label="New claim filed"         sub="Alert when a new claim is submitted"               checked={newClaim}     onChange={() => setNewClaim(!newClaim)} />
        <ToggleRow label="Policy renewal due"      sub="7-day advance alert for expiring policies"         checked={renewalAlert} onChange={() => setRenewalAlert(!renewalAlert)} />
        <ToggleRow label="New user registration"   sub="Alert when a new user signs up"                    checked={newUser}      onChange={() => setNewUser(!newUser)} />
        <div style={{ borderBottom: "none" }}>
          <ToggleRow label="Daily summary report"  sub="Receive a daily digest of platform metrics"        checked={dailyReport}  onChange={() => setDailyReport(!dailyReport)} />
        </div>
      </Section>

      {/* Commission rates */}
      <Section title="Commission Rates" subtitle="Default brokerage commission per category">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {Object.entries(commissions).map(([cat, rate]) => (
            <div key={cat}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 5, textTransform: "capitalize" }}>{cat} Insurance</label>
              <div style={{ display: "flex", alignItems: "center", border: "1.5px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
                <input type="number" min="0" max="30" value={rate} onChange={e => setCommissions(prev => ({ ...prev, [cat]: e.target.value }))}
                  style={{ flex: 1, padding: "8px 12px", border: "none", outline: "none", fontSize: 13 }} />
                <span style={{ padding: "8px 10px", background: "var(--bg)", fontSize: 13, fontWeight: 700, color: "var(--text-muted)" }}>%</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Security */}
      <Section title="Security & Platform" subtitle="Access controls and maintenance settings">
        <ToggleRow label="Two-factor authentication"  sub="Require 2FA for all admin logins"                    checked={twoFA}        onChange={() => setTwoFA(!twoFA)} />
        <ToggleRow label="Audit log"                  sub="Log all admin actions for compliance"                 checked={auditLog}     onChange={() => setAuditLog(!auditLog)} />
        <div>
          <ToggleRow label="Maintenance mode"         sub="Puts the user-facing app into maintenance state"      checked={maintenance}  onChange={() => setMaintenance(!maintenance)} />
          {maintenance && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, marginTop: 10 }}>
              <AlertTriangle size={15} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: "#92400E" }}>Maintenance mode is ON. Users will see a maintenance notice and cannot log in.</p>
            </div>
          )}
        </div>
      </Section>

      {/* Save button */}
      <button onClick={handleSave}
        style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 28px", background: saved ? "#059669" : "var(--primary)", border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "background 0.2s", marginBottom: 32 }}>
        <Save size={16} />
        {saved ? "Changes Saved ✓" : "Save All Settings"}
      </button>
    </div>
  );
}
