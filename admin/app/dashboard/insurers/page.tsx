"use client";

import { useState, useEffect } from "react";
import { Search, RefreshCw, Plus, X, Loader, Trash2, Edit } from "lucide-react";
import { adminApi, type Insurer } from "@/lib/api";

function ActiveBadge({ isActive }: { isActive: boolean }) {
  const bg = isActive ? "#ECFDF5" : "#FEF2F2";
  const color = isActive ? "#059669" : "#DC2626";
  const dot = isActive ? "#059669" : "#DC2626";
  const label = isActive ? "Active" : "Inactive";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 100, background: bg, color }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: dot }} />
      {label}
    </span>
  );
}

interface InsurerFormData {
  name: string;
  slug: string;
  shortName: string;
  logo: string;
  brandColor: string;
  tagline: string;
  founded: number;
  headquarters: string;
  website: string;
  claimsRatio: number;
  rating: number;
  isActive: boolean;
}

function InsurerModal({ insurer, onClose, onSave }: {
  insurer: Insurer | null;
  onClose: () => void;
  onSave: (data: InsurerFormData, id?: string) => Promise<void>;
}) {
  const isEdit = !!insurer;
  const [form, setForm] = useState<InsurerFormData>({
    name: insurer?.name ?? "",
    slug: insurer?.slug ?? "",
    shortName: insurer?.shortName ?? "",
    logo: insurer?.logo ?? "https://ask-insurance-admin-nu.vercel.app/icons/insurer-default.png",
    brandColor: insurer?.brandColor ?? "#1580FF",
    tagline: insurer?.tagline ?? "",
    founded: insurer?.founded ?? 2000,
    headquarters: insurer?.headquarters ?? "",
    website: insurer?.website ?? "",
    claimsRatio: insurer?.claimsRatio ?? 95,
    rating: insurer?.rating ?? 4.5,
    isActive: insurer?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function autoSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  async function handleSave() {
    if (!form.name || !form.shortName || !form.claimsRatio) {
      setErr("Name, Short Name, and Claims Ratio are required.");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      const data = { ...form, slug: form.slug || autoSlug(form.name) };
      await onSave(data, insurer?.id);
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
      <div style={{ position: "relative", background: "#fff", borderRadius: 18, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto", margin: "0 16px", boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "#fff", zIndex: 10 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>{isEdit ? "Edit Insurer" : "Add Partner Insurer"}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={20} /></button>
        </div>

        <div style={{ padding: "22px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          {err && <div style={{ padding: "10px 14px", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 8, color: "#DC2626", fontSize: 13 }}>{err}</div>}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 5 }}>Company Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: autoSlug(e.target.value) }))}
                style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 13, outline: "none" }} placeholder="e.g. HDFC Ergo" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 5 }}>Short Name *</label>
              <input value={form.shortName} onChange={e => setForm(f => ({ ...f, shortName: e.target.value }))}
                style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 13, outline: "none" }} placeholder="e.g. HDFC" />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 5 }}>Logo URL</label>
              <input value={form.logo} onChange={e => setForm(f => ({ ...f, logo: e.target.value }))}
                style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 13, outline: "none" }} placeholder="Logo Image URL" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 5 }}>Brand Color *</label>
              <input value={form.brandColor} onChange={e => setForm(f => ({ ...f, brandColor: e.target.value }))}
                style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 13, outline: "none" }} placeholder="e.g. #FF6600" />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 5 }}>Tagline</label>
            <input value={form.tagline} onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))}
              style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 13, outline: "none" }} placeholder="e.g. Suraksha Hamesha" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 5 }}>Claims Ratio (%) *</label>
              <input type="number" step="0.1" value={form.claimsRatio} onChange={e => setForm(f => ({ ...f, claimsRatio: Number(e.target.value) }))}
                style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 13, outline: "none" }} placeholder="98.5" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 5 }}>Rating (0-5)</label>
              <input type="number" step="0.1" value={form.rating} onChange={e => setForm(f => ({ ...f, rating: Number(e.target.value) }))}
                style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 13, outline: "none" }} placeholder="4.5" />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 5 }}>Founded Year</label>
              <input type="number" value={form.founded} onChange={e => setForm(f => ({ ...f, founded: Number(e.target.value) }))}
                style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 13, outline: "none" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 5 }}>Headquarters</label>
              <input value={form.headquarters} onChange={e => setForm(f => ({ ...f, headquarters: e.target.value }))}
                style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 13, outline: "none" }} placeholder="e.g. Mumbai" />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 5 }}>Website</label>
            <input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
              style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 13, outline: "none" }} placeholder="e.g. https://hdfcergo.com" />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "var(--bg)", borderRadius: 10, marginTop: 4 }}>
            <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} id="isActive" style={{ cursor: "pointer" }} />
            <label htmlFor="isActive" style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", cursor: "pointer" }}>Is Active partner (visible to agents & customers)</label>
          </div>

          <button onClick={handleSave} disabled={saving}
            style={{ width: "100%", padding: "13px", background: saving ? "var(--bg)" : "var(--primary)", border: "none", borderRadius: 12, color: saving ? "var(--text-muted)" : "#fff", fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {saving && <Loader size={16} style={{ animation: "spin 1s linear infinite" }} />}
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Partner"}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function InsurersPage() {
  const [insurers, setInsurers] = useState<Insurer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [modalInsurer, setModalInsurer] = useState<Insurer | null | false>(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getInsurers(1, 50);
      setInsurers(res.insurers);
      setTotal(res.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSave(data: InsurerFormData, id?: string) {
    if (id) {
      const updated = await adminApi.updateInsurer(id, data);
      setInsurers(prev => prev.map(i => i.id === id ? updated : i));
    } else {
      const created = await adminApi.createInsurer(data);
      setInsurers(prev => [created, ...prev]);
      setTotal(t => t + 1);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this partner? This will delete all associated plans!")) return;
    try {
      await adminApi.deleteInsurer(id);
      setInsurers(prev => prev.filter(i => i.id !== id));
      setTotal(t => t - 1);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete");
    }
  }

  const filtered = insurers.filter(i => {
    const q = search.toLowerCase();
    return !q ||
      i.name.toLowerCase().includes(q) ||
      i.shortName.toLowerCase().includes(q) ||
      (i.headquarters ?? "").toLowerCase().includes(q);
  });

  const active = insurers.filter(i => i.isActive).length;
  const totalPlans = insurers.reduce((s, i) => s + (i._count?.plans ?? 0), 0);

  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 2 }}>Insurers</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
            {loading ? "Loading…" : `${total} partners · ${active} active · ${totalPlans} plans`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={load}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 14px", background: "var(--bg)", border: "1.5px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={() => setModalInsurer(null)}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", background: "var(--primary)", border: "none", borderRadius: 10, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <Plus size={15} /> Add Partner
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 10, color: "#DC2626", fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Stats strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Partners", value: total.toString(),      color: "#1580FF" },
          { label: "Active",         value: active.toString(),     color: "#059669" },
          { label: "Total Plans",    value: totalPlans.toString(), color: "#7C3AED" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 20px" }}>
            <p style={{ fontSize: 28, fontWeight: 900, color, letterSpacing: "-0.05em", marginBottom: 4 }}>{value}</p>
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 14px", border: "1.5px solid var(--border)", borderRadius: 10, background: "#fff", marginBottom: 16, height: 42 }}>
        <Search size={15} color="var(--text-muted)" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search insurer, short name, HQ city…"
          style={{ flex: 1, border: "none", outline: "none", fontSize: 13, color: "var(--text)", background: "transparent" }} />
      </div>

      {/* Table */}
      <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
          <thead>
            <tr style={{ background: "var(--bg)" }}>
              {["Insurer", "Tagline", "Claim Ratio", "Plans", "Policies", "HQ", "Founded", "Status", "Actions"].map(h => (
                <th key={h} style={{ padding: "11px 16px", textAlign: h === "Actions" ? "center" : "left", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-muted)" }}>Loading insurers…</td></tr>
            ) : filtered.map(ins => {
              const pct = ins.claimsRatio > 1 ? ins.claimsRatio : ins.claimsRatio * 100;
              const ratioColor = pct >= 97 ? "#059669" : pct >= 94 ? "#D97706" : "#DC2626";
              const color = ins.brandColor || "#1580FF";
              return (
                <tr key={ins.id} style={{ borderTop: "1px solid var(--border)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--bg)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: 16, fontWeight: 900, color }}>{ins.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{ins.name}</p>
                        {ins.website && <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{ins.website}</p>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px", maxWidth: 200 }}>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {ins.tagline ?? "—"}
                    </p>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: ratioColor }}>{pct.toFixed(1)}%</span>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 700, color: "var(--text)", textAlign: "center" }}>
                    {ins._count?.plans ?? 0}
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 13, color: "var(--text-muted)", textAlign: "center" }}>
                    {ins._count?.policies ?? 0}
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 13, color: "var(--text-muted)" }}>{ins.headquarters ?? "—"}</td>
                  <td style={{ padding: "14px 16px", fontSize: 12, color: "var(--text-muted)" }}>{ins.founded ?? "—"}</td>
                  <td style={{ padding: "14px 16px" }}><ActiveBadge isActive={ins.isActive} /></td>
                  <td style={{ padding: "14px 16px", textAlign: "center" }}>
                    <div style={{ display: "inline-flex", gap: 6 }}>
                      <button onClick={() => setModalInsurer(ins)}
                        style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", background: "var(--primary-light)", border: "none", borderRadius: 8, color: "var(--primary)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                        <Edit size={12} /> Edit
                      </button>
                      <button onClick={() => handleDelete(ins.id)}
                        style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", background: "#FEF2F2", border: "none", borderRadius: 8, color: "#DC2626", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-muted)" }}>
            <p style={{ fontWeight: 600 }}>No insurers match your search</p>
          </div>
        )}
      </div>

      {modalInsurer !== false && (
        <InsurerModal
          insurer={modalInsurer}
          onClose={() => setModalInsurer(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
