"use client";

import { useState } from "react";
import { Plus, X, Check, ToggleLeft, ToggleRight } from "lucide-react";
import { PLANS as INITIAL_PLANS, type AdminPlan } from "@/lib/mock";

const CATEGORIES = ["Life", "Health", "Motor", "Travel", "Home", "Business"] as const;

function PlanModal({ plan, onClose, onSave }: { plan: Partial<AdminPlan> | null; onClose: () => void; onSave: (p: AdminPlan) => void }) {
  const isEdit = !!plan?.id;
  const [form, setForm] = useState<Partial<AdminPlan>>(plan ?? { active: true, enrolledCount: 0, features: [] });
  const [featureInput, setFeatureInput] = useState("");

  function addFeature() {
    if (!featureInput.trim()) return;
    setForm(f => ({ ...f, features: [...(f.features ?? []), featureInput.trim()] }));
    setFeatureInput("");
  }

  function removeFeature(i: number) {
    setForm(f => ({ ...f, features: f.features?.filter((_, idx) => idx !== i) }));
  }

  function handleSave() {
    if (!form.plan || !form.insurer || !form.category || !form.premium || !form.cover) return;
    onSave({
      id: form.id ?? `plan-${Date.now()}`,
      insurer: form.insurer!,
      short: form.short ?? form.insurer!.slice(0, 4).toUpperCase(),
      color: form.color ?? "#1580FF",
      plan: form.plan!,
      category: form.category as AdminPlan["category"],
      premium: form.premium!,
      premiumRaw: form.premiumRaw ?? 0,
      cover: form.cover!,
      claims: form.claims ?? "N/A",
      badge: form.badge,
      features: form.features ?? [],
      active: form.active ?? true,
      enrolledCount: form.enrolledCount ?? 0,
    });
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(3px)" }} onClick={onClose} />
      <div style={{ position: "relative", background: "#fff", borderRadius: 18, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", margin: "0 16px" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "#fff", zIndex: 10 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>{isEdit ? "Edit Plan" : "Add New Plan"}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={20} /></button>
        </div>

        <div style={{ padding: "22px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Row 1 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 5 }}>Insurer *</label>
              <input value={form.insurer ?? ""} onChange={e => setForm(f => ({ ...f, insurer: e.target.value }))}
                style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 13, outline: "none" }} placeholder="e.g. LIC of India" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 5 }}>Short code *</label>
              <input value={form.short ?? ""} onChange={e => setForm(f => ({ ...f, short: e.target.value }))} maxLength={5}
                style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 13, outline: "none" }} placeholder="e.g. LIC" />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 5 }}>Plan Name *</label>
            <input value={form.plan ?? ""} onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}
              style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 13, outline: "none" }} placeholder="e.g. LIC Tech Term" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 5 }}>Category *</label>
              <select value={form.category ?? ""} onChange={e => setForm(f => ({ ...f, category: e.target.value as AdminPlan["category"] }))}
                style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 13, outline: "none", background: "#fff" }}>
                <option value="">Select…</option>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 5 }}>Premium *</label>
              <input value={form.premium ?? ""} onChange={e => setForm(f => ({ ...f, premium: e.target.value }))}
                style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 13, outline: "none" }} placeholder="₹8,200/yr" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 5 }}>Cover *</label>
              <input value={form.cover ?? ""} onChange={e => setForm(f => ({ ...f, cover: e.target.value }))}
                style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 13, outline: "none" }} placeholder="₹1 Crore" />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 5 }}>Claim ratio</label>
              <input value={form.claims ?? ""} onChange={e => setForm(f => ({ ...f, claims: e.target.value }))}
                style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 13, outline: "none" }} placeholder="98.5%" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 5 }}>Badge</label>
              <input value={form.badge ?? ""} onChange={e => setForm(f => ({ ...f, badge: e.target.value || undefined }))}
                style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 13, outline: "none" }} placeholder="e.g. Most Popular" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 5 }}>Brand colour</label>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="color" value={form.color ?? "#1580FF"} onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                  style={{ width: 40, height: 36, padding: 2, border: "1.5px solid var(--border)", borderRadius: 8, cursor: "pointer" }} />
                <input value={form.color ?? "#1580FF"} onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                  style={{ flex: 1, padding: "9px 10px", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 12, outline: "none" }} />
              </div>
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
              {(form.features ?? []).map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", background: "var(--bg)", borderRadius: 8 }}>
                  <Check size={13} color="var(--success)" />
                  <span style={{ flex: 1, fontSize: 13, color: "var(--text)" }}>{f}</span>
                  <button onClick={() => removeFeature(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={14} /></button>
                </div>
              ))}
            </div>
          </div>

          {/* Active toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "var(--bg)", borderRadius: 10 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Plan Active</p>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Visible to users on the platform</p>
            </div>
            <button onClick={() => setForm(f => ({ ...f, active: !f.active }))} style={{ background: "none", border: "none", cursor: "pointer" }}>
              {form.active ? <ToggleRight size={32} color="var(--primary)" /> : <ToggleLeft size={32} color="var(--text-muted)" />}
            </button>
          </div>

          <button onClick={handleSave}
            style={{ width: "100%", padding: "13px", background: "var(--primary)", border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            {isEdit ? "Save Changes" : "Add Plan"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PlansPage() {
  const [plans, setPlans] = useState<AdminPlan[]>(INITIAL_PLANS);
  const [catFilter, setCatFilter] = useState("All");
  const [modalPlan, setModalPlan] = useState<Partial<AdminPlan> | null | false>(false);

  function handleSave(p: AdminPlan) {
    setPlans(prev => {
      const idx = prev.findIndex(x => x.id === p.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = p; return n; }
      return [p, ...prev];
    });
    setModalPlan(false);
  }

  function toggleActive(id: string) {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
  }

  const filtered = plans.filter(p => catFilter === "All" || p.category === catFilter);

  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 2 }}>Plans</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{plans.filter(p => p.active).length} active plans · {plans.filter(p => !p.active).length} inactive</p>
        </div>
        <button onClick={() => setModalPlan({})}
          style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", background: "var(--primary)", border: "none", borderRadius: 10, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          <Plus size={15} /> Add Plan
        </button>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {["All", ...CATEGORIES].map(c => (
          <button key={c} onClick={() => setCatFilter(c)}
            style={{ padding: "6px 16px", borderRadius: 100, border: catFilter === c ? "none" : "1.5px solid var(--border)", background: catFilter === c ? "var(--text)" : "#fff", color: catFilter === c ? "#fff" : "var(--text-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            {c}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }} className="plans-grid">
        {filtered.map(p => (
          <div key={p.id} style={{ background: "#fff", border: `1px solid ${p.active ? "var(--border)" : "#FCA5A5"}`, borderRadius: 14, overflow: "hidden", opacity: p.active ? 1 : 0.7 }}>
            <div style={{ height: 4, background: p.active ? `linear-gradient(90deg, ${p.color}, ${p.color}88)` : "#E5E7EB" }} />
            <div style={{ padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: p.color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: p.color }}>{p.short}</span>
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>{p.plan}</p>
                    <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{p.insurer}</p>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}>
                  {p.badge && <span style={{ fontSize: 10, fontWeight: 700, color: p.color, background: p.color + "18", padding: "2px 8px", borderRadius: 100 }}>{p.badge}</span>}
                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", background: "var(--bg)", padding: "2px 8px", borderRadius: 100 }}>{p.enrolledCount} enrolled</span>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 14 }}>
                {[{ l: "Premium", v: p.premium }, { l: "Cover", v: p.cover }, { l: "Claims", v: p.claims }].map(({ l, v }) => (
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
                <button onClick={() => toggleActive(p.id)}
                  style={{ flex: 1, padding: "8px", background: p.active ? "#FEF2F2" : "#ECFDF5", border: "none", borderRadius: 8, color: p.active ? "#DC2626" : "#059669", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  {p.active ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modalPlan !== false && <PlanModal plan={modalPlan} onClose={() => setModalPlan(false)} onSave={handleSave} />}

      <style>{`
        @media (max-width: 768px) { .plans-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
