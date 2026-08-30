"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { BookTemplate, Trash2, RefreshCw, Save, MessageSquare, Mail, Bell, FileText, TrendingUp, X } from "lucide-react";

type TabKey = "quotation" | "rateCharts" | "communication";

interface Insurer { id: string; name: string; }

const INSURANCE_TYPES = ["life", "health", "motor", "travel", "home", "business"];

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "quotation",     label: "Quotation Templates",     icon: <FileText size={15} /> },
  { key: "rateCharts",    label: "Premium Rate Charts",     icon: <TrendingUp size={15} /> },
  { key: "communication", label: "Communication Templates", icon: <MessageSquare size={15} /> },
];

const COMM_CHANNELS = [
  { value: "email", label: "Email",      icon: <Mail size={14} /> },
  { value: "sms",   label: "SMS",        icon: <MessageSquare size={14} /> },
  { value: "push",  label: "Push Notif", icon: <Bell size={14} /> },
];

const DEFAULT_TRIGGERS = [
  "policy_expiry", "quote_approved", "claim_update", "payment_due", "kyc_verified", "policy_issued"
];

export default function TemplatesPage() {
  const [tab, setTab] = useState<TabKey>("quotation");
  const [quotTemplates, setQuotTemplates] = useState<any[]>([]);
  const [rateCharts, setRateCharts] = useState<any[]>([]);
  const [commTemplates, setCommTemplates] = useState<any[]>([]);
  const [insurers, setInsurers] = useState<Insurer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Quotation form
  const [qtForm, setQtForm] = useState({ id: "", name: "", type: "health", subject: "", headerText: "", footerText: "", termsAndConditions: "", isDefault: false });
  const [qtSaving, setQtSaving] = useState(false);

  // Rate chart form
  const [rcForm, setRcForm] = useState({ id: "", insurerId: "", insuranceType: "health", minAge: "", maxAge: "", baseRate: "", rateType: "flat", gstPercentage: "18" });
  const [rcSaving, setRcSaving] = useState(false);

  // Communication form
  const [ctForm, setCtForm] = useState({ id: "", name: "", channel: "email", trigger: "policy_expiry", content: "" });
  const [ctSaving, setCtSaving] = useState(false);

  async function load() {
    setLoading(true); setError("");
    try {
      const [qt, rc, ct, ins] = await Promise.all([
        adminApi.getQuotationTemplates(),
        adminApi.getRateCharts(),
        adminApi.getCommunicationTemplates(),
        (adminApi as any).getInsurers?.() ?? [],
      ]);
      setQuotTemplates(Array.isArray(qt) ? qt : []);
      setRateCharts(Array.isArray(rc) ? rc : []);
      setCommTemplates(Array.isArray(ct) ? ct : []);
      const insData = Array.isArray(ins) ? ins : (ins?.insurers || []);
      setInsurers(insData.map((i: any) => ({ id: i.id, name: i.name })));
    } catch (e: any) { setError(e?.message || "Failed to load."); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function saveQt() {
    if (!qtForm.name || !qtForm.type) return;
    setQtSaving(true);
    try {
      await adminApi.saveQuotationTemplate({ ...qtForm, id: qtForm.id || undefined });
      setQtForm({ id: "", name: "", type: "health", subject: "", headerText: "", footerText: "", termsAndConditions: "", isDefault: false });
      load();
    } catch (e: any) { alert(e?.message || "Failed."); }
    finally { setQtSaving(false); }
  }

  async function saveRc() {
    if (!rcForm.insurerId || !rcForm.baseRate) return;
    setRcSaving(true);
    try {
      await adminApi.saveRateChart({
        ...rcForm,
        id: rcForm.id || undefined,
        minAge: rcForm.minAge ? parseInt(rcForm.minAge) : null,
        maxAge: rcForm.maxAge ? parseInt(rcForm.maxAge) : null,
        baseRate: parseFloat(rcForm.baseRate),
        gstPercentage: parseFloat(rcForm.gstPercentage || "18")
      });
      setRcForm({ id: "", insurerId: "", insuranceType: "health", minAge: "", maxAge: "", baseRate: "", rateType: "flat", gstPercentage: "18" });
      load();
    } catch (e: any) { alert(e?.message || "Failed."); }
    finally { setRcSaving(false); }
  }

  async function saveCt() {
    if (!ctForm.name || !ctForm.content) return;
    setCtSaving(true);
    try {
      await adminApi.saveCommunicationTemplate({ ...ctForm, id: ctForm.id || undefined });
      setCtForm({ id: "", name: "", channel: "email", trigger: "policy_expiry", content: "" });
      load();
    } catch (e: any) { alert(e?.message || "Failed."); }
    finally { setCtSaving(false); }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--border)",
    fontSize: 13, outline: "none", background: "var(--bg)", color: "var(--text)", fontFamily: "inherit", boxSizing: "border-box"
  };
  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 6 };

  return (
    <div style={{ padding: 24, minHeight: "100vh", background: "var(--bg)" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(124, 58, 237, 0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <BookTemplate size={20} color="#7C3AED" />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: "var(--text)", margin: 0, letterSpacing: -0.5 }}>Templates & Settings</h1>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: 13, margin: 0 }}>Configure quotation templates, rate charts, and communication messages.</p>
        </div>
        <button onClick={load} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", background: "var(--white)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {error && <div style={{ padding: "12px 16px", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 10, color: "#DC2626", fontSize: 13, marginBottom: 20 }}>{error}</div>}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "var(--white)", padding: "6px", borderRadius: 12, border: "1px solid var(--border)", width: "fit-content" }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "all 0.15s",
              background: tab === t.key ? "#7C3AED" : "transparent", color: tab === t.key ? "#fff" : "var(--text-muted)" }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #7C3AED", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 24 }}>
          {/* Quotation Templates */}
          {tab === "quotation" && (
            <>
              {/* Form */}
              <div style={{ background: "var(--white)", borderRadius: 16, padding: 20, border: "1px solid var(--border)" }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", marginTop: 0, marginBottom: 18 }}>
                  {qtForm.id ? "Edit Template" : "New Template"}
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Template Name *</label>
                      <input style={inputStyle} value={qtForm.name} onChange={e => setQtForm({ ...qtForm, name: e.target.value })} placeholder="e.g. Standard Health Quote" />
                    </div>
                    <div>
                      <label style={labelStyle}>Insurance Type *</label>
                      <select style={inputStyle} value={qtForm.type} onChange={e => setQtForm({ ...qtForm, type: e.target.value })}>
                        {INSURANCE_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Email Subject</label>
                    <input style={inputStyle} value={qtForm.subject} onChange={e => setQtForm({ ...qtForm, subject: e.target.value })} placeholder="Your Health Insurance Quotation" />
                  </div>
                  <div>
                    <label style={labelStyle}>Header Text</label>
                    <textarea style={{ ...inputStyle, resize: "vertical" }} rows={2} value={qtForm.headerText} onChange={e => setQtForm({ ...qtForm, headerText: e.target.value })} placeholder="Header content for quotation PDF…" />
                  </div>
                  <div>
                    <label style={labelStyle}>Footer Text</label>
                    <textarea style={{ ...inputStyle, resize: "vertical" }} rows={2} value={qtForm.footerText} onChange={e => setQtForm({ ...qtForm, footerText: e.target.value })} placeholder="Footer content…" />
                  </div>
                  <div>
                    <label style={labelStyle}>Terms & Conditions</label>
                    <textarea style={{ ...inputStyle, resize: "vertical" }} rows={4} value={qtForm.termsAndConditions} onChange={e => setQtForm({ ...qtForm, termsAndConditions: e.target.value })} placeholder="T&C content…" />
                  </div>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                    <input type="checkbox" checked={qtForm.isDefault} onChange={e => setQtForm({ ...qtForm, isDefault: e.target.checked })} />
                    <span style={{ fontSize: 13, color: "var(--text)" }}>Set as default for this type</span>
                  </label>
                  <div style={{ display: "flex", gap: 10 }}>
                    {qtForm.id && <button onClick={() => setQtForm({ id: "", name: "", type: "health", subject: "", headerText: "", footerText: "", termsAndConditions: "", isDefault: false })} style={{ padding: "10px 16px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer", fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}><X size={14} /></button>}
                    <button onClick={saveQt} disabled={qtSaving} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "10px", background: "#7C3AED", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: qtSaving ? 0.7 : 1 }}>
                      <Save size={14} /> {qtSaving ? "Saving…" : qtForm.id ? "Update" : "Create Template"}
                    </button>
                  </div>
                </div>
              </div>
              {/* List */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {quotTemplates.length === 0 && <div style={{ background: "var(--white)", borderRadius: 14, padding: "40px 24px", textAlign: "center", border: "1px dashed var(--border)", color: "var(--text-muted)", fontSize: 13 }}>No quotation templates yet. Create one!</div>}
                {quotTemplates.map(t => (
                  <div key={t.id} style={{ background: "var(--white)", borderRadius: 14, padding: "16px 20px", border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>{t.name}</span>
                        {t.isDefault && <span style={{ fontSize: 9, fontWeight: 800, background: "rgba(124, 58, 237, 0.12)", color: "#7C3AED", padding: "2px 7px", borderRadius: 100 }}>DEFAULT</span>}
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => setQtForm({ id: t.id, name: t.name, type: t.type, subject: t.subject || "", headerText: t.headerText || "", footerText: t.footerText || "", termsAndConditions: t.termsAndConditions || "", isDefault: t.isDefault })}
                          style={{ padding: "5px 10px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6, cursor: "pointer", fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>Edit</button>
                        <button onClick={async () => { if (confirm("Delete this template?")) { await adminApi.deleteQuotationTemplate(t.id); load(); } }}
                          style={{ padding: "5px 10px", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 6, cursor: "pointer", color: "#DC2626" }}><Trash2 size={12} /></button>
                      </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#7C3AED", background: "rgba(124, 58, 237, 0.12)", padding: "2px 8px", borderRadius: 100, textTransform: "capitalize" }}>{t.type}</span>
                    {t.subject && <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "6px 0 0" }}>Subject: {t.subject}</p>}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Premium Rate Charts */}
          {tab === "rateCharts" && (
            <>
              <div style={{ background: "var(--white)", borderRadius: 16, padding: 20, border: "1px solid var(--border)" }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", marginTop: 0, marginBottom: 18 }}>
                  {rcForm.id ? "Edit Rate Chart" : "New Rate Chart"}
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Insurer *</label>
                    <select style={inputStyle} value={rcForm.insurerId} onChange={e => setRcForm({ ...rcForm, insurerId: e.target.value })}>
                      <option value="">— Select Insurer —</option>
                      {insurers.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                    </select>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Insurance Type *</label>
                      <select style={inputStyle} value={rcForm.insuranceType} onChange={e => setRcForm({ ...rcForm, insuranceType: e.target.value })}>
                        {INSURANCE_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Rate Type *</label>
                      <select style={inputStyle} value={rcForm.rateType} onChange={e => setRcForm({ ...rcForm, rateType: e.target.value })}>
                        <option value="flat">Flat Amount (₹)</option>
                        <option value="percentage_of_sum_insured">% of Sum Insured</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Min Age</label>
                      <input style={inputStyle} type="number" value={rcForm.minAge} onChange={e => setRcForm({ ...rcForm, minAge: e.target.value })} placeholder="e.g. 18" />
                    </div>
                    <div>
                      <label style={labelStyle}>Max Age</label>
                      <input style={inputStyle} type="number" value={rcForm.maxAge} onChange={e => setRcForm({ ...rcForm, maxAge: e.target.value })} placeholder="e.g. 65" />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Base Rate *</label>
                      <input style={inputStyle} type="number" step="0.01" value={rcForm.baseRate} onChange={e => setRcForm({ ...rcForm, baseRate: e.target.value })} placeholder="e.g. 5000 or 2.5" />
                    </div>
                    <div>
                      <label style={labelStyle}>GST %</label>
                      <input style={inputStyle} type="number" value={rcForm.gstPercentage} onChange={e => setRcForm({ ...rcForm, gstPercentage: e.target.value })} placeholder="18" />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    {rcForm.id && <button onClick={() => setRcForm({ id: "", insurerId: "", insuranceType: "health", minAge: "", maxAge: "", baseRate: "", rateType: "flat", gstPercentage: "18" })} style={{ padding: "10px 16px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer", fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}><X size={14} /></button>}
                    <button onClick={saveRc} disabled={rcSaving} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "10px", background: "#7C3AED", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: rcSaving ? 0.7 : 1 }}>
                      <Save size={14} /> {rcSaving ? "Saving…" : rcForm.id ? "Update" : "Add Rate Chart"}
                    </button>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {rateCharts.length === 0 && <div style={{ background: "var(--white)", borderRadius: 14, padding: "40px 24px", textAlign: "center", border: "1px dashed var(--border)", color: "var(--text-muted)", fontSize: 13 }}>No rate charts yet.</div>}
                {rateCharts.map(rc => (
                  <div key={rc.id} style={{ background: "var(--white)", borderRadius: 14, padding: "16px 20px", border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>{rc.insurer?.name}</span>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => setRcForm({ id: rc.id, insurerId: rc.insurerId, insuranceType: rc.insuranceType, minAge: rc.minAge?.toString() || "", maxAge: rc.maxAge?.toString() || "", baseRate: rc.baseRate?.toString() || "", rateType: rc.rateType, gstPercentage: rc.gstPercentage?.toString() || "18" })}
                          style={{ padding: "5px 10px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6, cursor: "pointer", fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>Edit</button>
                        <button onClick={async () => { if (confirm("Delete this rate chart?")) { await adminApi.deleteRateChart(rc.id); load(); } }}
                          style={{ padding: "5px 10px", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 6, cursor: "pointer", color: "#DC2626" }}><Trash2 size={12} /></button>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#7C3AED", background: "rgba(124, 58, 237, 0.12)", padding: "2px 8px", borderRadius: 100, textTransform: "capitalize" }}>{rc.insuranceType}</span>
                      <span style={{ fontSize: 11, color: "var(--text-muted)", background: "var(--bg)", padding: "2px 8px", borderRadius: 100 }}>
                        ₹{rc.baseRate} {rc.rateType === "percentage_of_sum_insured" ? "% of SI" : "flat"}
                      </span>
                      {(rc.minAge || rc.maxAge) && <span style={{ fontSize: 11, color: "var(--text-muted)", background: "var(--bg)", padding: "2px 8px", borderRadius: 100 }}>Age {rc.minAge || "—"}–{rc.maxAge || "—"}</span>}
                      <span style={{ fontSize: 11, color: "var(--text-muted)", background: "var(--bg)", padding: "2px 8px", borderRadius: 100 }}>GST {rc.gstPercentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Communication Templates */}
          {tab === "communication" && (
            <>
              <div style={{ background: "var(--white)", borderRadius: 16, padding: 20, border: "1px solid var(--border)" }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", marginTop: 0, marginBottom: 18 }}>
                  {ctForm.id ? "Edit Template" : "New Template"}
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Template Name *</label>
                    <input style={inputStyle} value={ctForm.name} onChange={e => setCtForm({ ...ctForm, name: e.target.value })} placeholder="e.g. Policy Expiry Reminder" />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Channel *</label>
                      <select style={inputStyle} value={ctForm.channel} onChange={e => setCtForm({ ...ctForm, channel: e.target.value })}>
                        {COMM_CHANNELS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Trigger Event *</label>
                      <select style={inputStyle} value={ctForm.trigger} onChange={e => setCtForm({ ...ctForm, trigger: e.target.value })}>
                        {DEFAULT_TRIGGERS.map(t => <option key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Message Content *</label>
                    <textarea style={{ ...inputStyle, resize: "vertical" }} rows={6} value={ctForm.content} onChange={e => setCtForm({ ...ctForm, content: e.target.value })}
                      placeholder="Use {name}, {policyNumber}, {expiryDate}, {insurer} as dynamic variables…" />
                    <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>Variables: {"{name}"}, {"{policyNumber}"}, {"{expiryDate}"}, {"{insurer}"}, {"{premium}"}</p>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    {ctForm.id && <button onClick={() => setCtForm({ id: "", name: "", channel: "email", trigger: "policy_expiry", content: "" })} style={{ padding: "10px 16px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer", fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}><X size={14} /></button>}
                    <button onClick={saveCt} disabled={ctSaving} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "10px", background: "#7C3AED", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: ctSaving ? 0.7 : 1 }}>
                      <Save size={14} /> {ctSaving ? "Saving…" : ctForm.id ? "Update" : "Create Template"}
                    </button>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {commTemplates.length === 0 && <div style={{ background: "var(--white)", borderRadius: 14, padding: "40px 24px", textAlign: "center", border: "1px dashed var(--border)", color: "var(--text-muted)", fontSize: 13 }}>No communication templates yet.</div>}
                {commTemplates.map(ct => {
                  const ch = COMM_CHANNELS.find(c => c.value === ct.channel);
                  return (
                    <div key={ct.id} style={{ background: "var(--white)", borderRadius: 14, padding: "16px 20px", border: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>{ct.name}</span>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => setCtForm({ id: ct.id, name: ct.name, channel: ct.channel, trigger: ct.trigger, content: ct.content })}
                            style={{ padding: "5px 10px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6, cursor: "pointer", fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>Edit</button>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: "#7C3AED", background: "rgba(124, 58, 237, 0.12)", padding: "2px 8px", borderRadius: 100 }}>{ch?.icon} {ct.channel.toUpperCase()}</span>
                        <span style={{ fontSize: 11, color: "var(--text-muted)", background: "var(--bg)", padding: "2px 8px", borderRadius: 100 }}>{ct.trigger.replace(/_/g, " ")}</span>
                      </div>
                      <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{ct.content}</p>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
