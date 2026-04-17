"use client";

import { useState, useEffect } from "react";
import { Plus, X, Check, ToggleLeft, ToggleRight, RefreshCw, Loader } from "lucide-react";
import { adminApi, type Plan, type Insurer } from "@/lib/api";

const PLAN_TYPES = ["life", "health", "motor", "travel", "home", "business"] as const;
type PlanType = typeof PLAN_TYPES[number];

const TYPE_COLORS: Record<PlanType, string> = {
  life: "#1580FF", health: "#059669", motor: "#D97706",
  travel: "#7C3AED", home: "#EA580C", business: "#0891B2"
};

function fmt(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(0)}Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(0)}L`;
  if (n >= 1000)     return `₹${(n / 1000).toFixed(0)}k`;
  return `₹${n}`;
}

interface PlanFormData {
  name: string;
  slug: string;
  insurerId: string;
  type: PlanType;
  description: string;
  features: string[];
  basePremium: number;
  minCover: number;
  maxCover: number;
  minAge: number;
  maxAge: number;
  isFeatured: boolean;
  isActive: boolean;
}

function PlanModal({ plan, insurers, onClose, onSave }: {
  plan: Plan | null;
  insurers: Insurer[];
  onClose: () => void;
  onSave: (data: PlanFormData, id?: string) => Promise<void>;
}) {
  const isEdit = !!plan;
  const [form, setForm] = useState<PlanFormData>({
    name: plan?.name ?? "",
    slug: plan?.slug ?? "",
    insurerId: plan?.insurerId ?? (insurers[0]?.id ?? ""),
    type: (plan?.type ?? "life") as PlanType,
    description: plan?.description ?? "",
    features: Array.isArray(plan?.features) ? plan.features : [],
    basePremium: plan?.basePremium ?? 0,
    minCover: plan?.minCover ?? 0,
    maxCover: plan?.maxCover ?? 0,
    minAge: plan?.minAge ?? 18,
    maxAge: plan?.maxAge ?? 65,
    isFeatured: plan?.isFeatured ?? false,
    isActive: plan?.isActive ?? true,
  });
  const [featureInput, setFeatureInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function autoSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function addFeature() {
    if (!featureInput.trim()) return;
    setForm(f => ({ ...f, features: [...f.features, featureInput.trim()] }));
    setFeatureInput("");
  }

  function removeFeature(i: number) {
    setForm(f => ({ ...f, features: f.features.filter((_, idx) => idx !== i) }));
  }

  async function handleSave() {
    if (!form.name || !form.insurerId || !form.basePremium) {
      setErr("Name, insurer, and base premium are required");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      const data = { ...form, slug: form.slug || autoSlug(form.name) };
      await onSave(data, plan?.id);
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(3px)" }} onClick={onClose} />
      <div style={{ position: "relative", background: "#fff", borderRadius: 18, width: "100%", maxWidth: 580, maxHeight: "90vh", overflowY: "auto", margin: "0 16px" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "#fff", zIndex: 10 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>{isEdit ? "Edit Plan" : "Add New Plan"}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={20} /></button>
        </div>

        <div style={{ padding: "22px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          {err && <div style={{ padding: "10px 14px", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 8, color: "#DC2626", fontSize: 13 }}>{err}</div>}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 5 }}>Insurer *</label>
              <select value={form.insurerId} onChange={e => setForm(f => ({ ...f, insurerId: e.target.value }))}
                style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 13, outline: "none", background: "#fff" }}>
                {insurers.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 5 }}>Type *</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as PlanType }))}
                style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 13, outline: "none", background: "#fff" }}>
                {PLAN_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 5 }}>Plan Name *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: autoSlug(e.target.value) }))}
              style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 13, outline: "none" }} placeholder="e.g. LIC Tech Term" />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 5 }}>Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
              style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 13, outline: "none", resize: "vertical" }} placeholder="Short description of the plan" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 5 }}>Base Premium (₹/yr) *</label>
              <input type="number" value={form.basePremium} onChange={e => setForm(f => ({ ...f, basePremium: Number(e.target.value) }))}
                style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 13, outline: "none" }} placeholder="8200" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 5 }}>Min Cover (₹)</label>
              <input type="number" value={form.minCover} onChange={e => setForm(f => ({ ...f, minCover: Number(e.target.value) }))}
                style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 13, outline: "none" }} placeholder="500000" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 5 }}>Max Cover (₹)</label>
              <input type="number" value={form.maxCover} onChange={e => setForm(f => ({ ...f, maxCover: Number(e.target.value) }))}
                style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 13, outline: "none" }} placeholder="10000000" />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 5 }}>Min Age</label>
              <input type="number" value={form.minAge} onChange={e => setForm(f => ({ ...f, minAge: Number(e.target.value) }))}
                style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 13, outline: "none" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 5 }}>Max Age</label>
              <input type="number" value={form.maxAge} onChange={e => setForm(f => ({ ...f, maxAge: Number(e.target.value) }))}
                style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 13, outline: "none" }} />
            </div>
          </div>

          {/* Features */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>Features</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <input value={featureInput} onChange={e => setFeatureInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addFeature()}
                style={{ flex: 1, padding: "9px 12px", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 13, outline: "none" }} placeholder="Add a feature and press Enter" />
              <button onClick={addFeature} style={{ padding: "9px 14px", background: "var(--primary-light)", border: "none", borderRadius: 8, color: "var(--primary)", fontWeight: 700, cursor: "pointer" }}>
                <Plus size={16} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {form.features.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", background: "var(--bg)", borderRadius: 8 }}>
                  <Check size={13} color="#059669" />
                  <span style={{ flex: 1, fontSize: 13, color: "var(--text)" }}>{f}</span>
                  <button onClick={() => removeFeature(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={14} /></button>
                </div>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {([
              { key: "isActive" as const,   label: "Plan Active",   desc: "Visible to users on platform" },
              { key: "isFeatured" as const, label: "Featured Plan", desc: "Show in featured section" },
            ]).map(({ key, label, desc }) => (
              <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "var(--bg)", borderRadius: 10 }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{label}</p>
                  <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{desc}</p>
                </div>
                <button onClick={() => setForm(f => ({ ...f, [key]: !f[key] }))} style={{ background: "none", border: "none", cursor: "pointer" }}>
                  {form[key] ? <ToggleRight size={32} color="var(--primary)" /> : <ToggleLeft size={32} color="var(--text-muted)" />}
                </button>
              </div>
            ))}
          </div>

          <button onClick={handleSave} disabled={saving}
            style={{ width: "100%", padding: "13px", background: saving ? "var(--bg)" : "var(--primary)", border: "none", borderRadius: 12, color: saving ? "var(--text-muted)" : "#fff", fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {saving && <Loader size={16} style={{ animation: "spin 1s linear infinite" }} />}
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Plan"}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [insurers, setInsurers] = useState<Insurer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState("All");
  const [modalPlan, setModalPlan] = useState<Plan | null | false>(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [plansRes, insurersRes] = await Promise.all([
        adminApi.getPlans(1, 100),
        adminApi.getInsurers(1, 50),
      ]);
      setPlans(plansRes.plans);
      setTotal(plansRes.total);
      setInsurers(insurersRes.insurers);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSave(data: PlanFormData, id?: string) {
    if (id) {
      const updated = await adminApi.updatePlan(id, data);
      setPlans(prev => prev.map(p => p.id === id ? updated : p));
    } else {
      const created = await adminApi.createPlan(data);
      setPlans(prev => [created, ...prev]);
      setTotal(t => t + 1);
    }
  }

  async function handleToggle(plan: Plan) {
    const updated = await adminApi.updatePlan(plan.id, { isActive: !plan.isActive });
    setPlans(prev => prev.map(p => p.id === plan.id ? updated : p));
  }

  const filtered = plans.filter(p => typeFilter === "All" || p.type === typeFilter);

  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 2 }}>Plans</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
            {loading ? "Loading…" : `${plans.filter(p => p.isActive).length} active · ${plans.filter(p => !p.isActive).length} inactive`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={load}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 14px", background: "var(--bg)", border: "1.5px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={() => setModalPlan(null)}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", background: "var(--primary)", border: "none", borderRadius: 10, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <Plus size={15} /> Add Plan
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 10, color: "#DC2626", fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {["All", ...PLAN_TYPES].map(t => (
          <button key={t} onClick={() => setTypeFilter(t)}
            style={{ padding: "6px 16px", borderRadius: 100, border: typeFilter === t ? "none" : "1.5px solid var(--border)", background: typeFilter === t ? "var(--text)" : "#fff", color: typeFilter === t ? "#fff" : "var(--text-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            {t === "All" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>Loading plans…</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }} className="plans-grid">
          {filtered.map(p => {
            const color = TYPE_COLORS[p.type as PlanType] ?? "#64748B";
            const insurerName = p.insurer?.name ?? "—";
            const firstLetter = (p.insurer?.name ?? insurerName).charAt(0);
            return (
              <div key={p.id} style={{ background: "#fff", border: `1px solid ${p.isActive ? "var(--border)" : "#FCA5A5"}`, borderRadius: 14, overflow: "hidden", opacity: p.isActive ? 1 : 0.75 }}>
                <div style={{ height: 4, background: p.isActive ? `linear-gradient(90deg, ${color}, ${color}88)` : "#E5E7EB" }} />
                <div style={{ padding: "16px 18px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: 16, fontWeight: 900, color }}>{firstLetter}</span>
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>{p.name}</p>
                        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{insurerName}</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}>
                      {p.isFeatured && (
                        <span style={{ fontSize: 10, fontWeight: 700, color, background: color + "18", padding: "2px 8px", borderRadius: 100 }}>Featured</span>
                      )}
                      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", background: "var(--bg)", padding: "2px 8px", borderRadius: 100 }}>
                        {p._count?.policies ?? 0} enrolled
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 14 }}>
                    {[
                      { l: "Base Premium", v: `₹${p.basePremium.toLocaleString("en-IN")}/yr` },
                      { l: "Max Cover",    v: fmt(p.maxCover) },
                      { l: "Type",         v: p.type.charAt(0).toUpperCase() + p.type.slice(1) },
                    ].map(({ l, v }) => (
                      <div key={l} style={{ background: "var(--bg)", borderRadius: 8, padding: "8px 10px" }}>
                        <p style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 2 }}>{l}</p>
                        <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{v}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setModalPlan(p)}
                      style={{ flex: 1, padding: "8px", background: "var(--primary-light)", border: "none", borderRadius: 8, color: "var(--primary)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      Edit
                    </button>
                    <button onClick={() => handleToggle(p)}
                      style={{ flex: 1, padding: "8px", background: p.isActive ? "#FEF2F2" : "#ECFDF5", border: "none", borderRadius: 8, color: p.isActive ? "#DC2626" : "#059669", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      {p.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalPlan !== false && (
        <PlanModal
          plan={modalPlan}
          insurers={insurers}
          onClose={() => setModalPlan(false)}
          onSave={handleSave}
        />
      )}

      <style>{`
        @media (max-width: 768px) { .plans-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
