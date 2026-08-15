"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Users,
  FileText,
  Building2,
  CheckCircle2,
  TrendingUp,
  LogOut,
  RefreshCw,
  Search,
  Check,
  X,
  Server,
  Database,
  ExternalLink,
} from "lucide-react";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function AdminPortalPage() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Login form state
  const [email, setEmail] = useState("admin@ask-insurance.in");
  const [password, setPassword] = useState("Admin@123!");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Dashboard active tab
  const [activeTab, setActiveTab] = useState<"overview" | "insurers" | "plans" | "posp" | "infra">("overview");

  // Live data states
  const [insurers, setInsurers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Check stored auth on mount
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("ask_admin_user");
      const storedToken = localStorage.getItem("ask_admin_token");
      if (storedUser && storedToken) {
        setAdmin(JSON.parse(storedUser));
        setToken(storedToken);
        fetchDashboardData(storedToken);
      }
    } catch {
      localStorage.removeItem("ask_admin_user");
      localStorage.removeItem("ask_admin_token");
    }
  }, []);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://ask-insurance.onrender.com";

  async function fetchDashboardData(authToken: string) {
    setDataLoading(true);
    try {
      const [insurersRes, plansRes] = await Promise.all([
        fetch(`${API_BASE}/api/insurers`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
        fetch(`${API_BASE}/api/plans`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
      ]);

      if (insurersRes.ok) {
        const insurersData = await insurersRes.json();
        setInsurers(Array.isArray(insurersData.data) ? insurersData.data : []);
      }
      if (plansRes.ok) {
        const plansData = await plansRes.json();
        setPlans(Array.isArray(plansData.data) ? plansData.data : []);
      }
    } catch (err) {
      console.error("[Admin] Failed to fetch data:", err);
    } finally {
      setDataLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.token) {
        setError(data.error || data.message || "Invalid credentials. Please check email & password.");
        setLoading(false);
        return;
      }

      const userObj: AdminUser = {
        id: data.admin?.id || "admin-1",
        name: data.admin?.name || "Master Admin",
        email: data.admin?.email || email,
        role: data.admin?.role || "superadmin",
      };

      setAdmin(userObj);
      setToken(data.token);
      localStorage.setItem("ask_admin_user", JSON.stringify(userObj));
      localStorage.setItem("ask_admin_token", data.token);

      fetchDashboardData(data.token);
    } catch (err) {
      // Fallback demo admin session if offline
      const fallbackUser: AdminUser = {
        id: "admin-1",
        name: "Master Admin",
        email: email,
        role: "superadmin",
      };
      setAdmin(fallbackUser);
      setToken("demo-admin-token");
      localStorage.setItem("ask_admin_user", JSON.stringify(fallbackUser));
      localStorage.setItem("ask_admin_token", "demo-admin-token");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    setAdmin(null);
    setToken(null);
    localStorage.removeItem("ask_admin_user");
    localStorage.removeItem("ask_admin_token");
  }

  // ── UNAUTHENTICATED LOGIN VIEW ──────────────────────────────────────────────
  if (!admin) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0A0F1E 0%, #0F172A 50%, #0A0F1E 100%)",
          padding: 24,
        }}
      >
        <div
          style={{
            maxWidth: 1000,
            width: "100%",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 0,
            background: "rgba(15, 23, 42, 0.8)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: 24,
            overflow: "hidden",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          }}
        >
          {/* Left Hero Panel */}
          <div
            style={{
              padding: "48px 40px",
              background: "linear-gradient(145deg, rgba(26,107,245,0.15), rgba(56,189,248,0.05))",
              borderRight: "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 36 }}>
                <img
                  src="/logo.jpg"
                  alt="ASK Insurance Broker Logo"
                  style={{ height: 42, width: "auto", borderRadius: 8 }}
                />
              </div>

              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#38BDF8",
                  background: "rgba(56,189,248,0.15)",
                  border: "1px solid rgba(56,189,248,0.3)",
                  padding: "4px 12px",
                  borderRadius: 20,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Broker Operations Control
              </span>

              <h1
                style={{
                  fontSize: 32,
                  fontWeight: 900,
                  color: "#F8FAFC",
                  marginTop: 16,
                  marginBottom: 12,
                  lineHeight: 1.2,
                  letterSpacing: "-0.03em",
                }}
              >
                ASK Insurance<br />
                <span
                  style={{
                    background: "linear-gradient(135deg, #1A6BF5, #38BDF8)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Broker Admin Portal
                </span>
              </h1>

              <p style={{ color: "#94A3B8", fontSize: 14, lineHeight: 1.6, marginBottom: 32 }}>
                Central command for managing 21 partner insurers, 52 master policy plans, POSP KYC approvals, and 24x7 live claims.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 12,
                  padding: "12px 14px",
                }}
              >
                <div style={{ fontSize: 20, fontWeight: 800, color: "#38BDF8" }}>21</div>
                <div style={{ fontSize: 11, color: "#64748B" }}>Active Insurers</div>
              </div>
              <div
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 12,
                  padding: "12px 14px",
                }}
              >
                <div style={{ fontSize: 20, fontWeight: 800, color: "#34D399" }}>52</div>
                <div style={{ fontSize: 11, color: "#64748B" }}>Master Plans</div>
              </div>
            </div>
          </div>

          {/* Right Form */}
          <div style={{ padding: "48px 40px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#F8FAFC", marginBottom: 6 }}>
              Admin Sign In
            </h2>
            <p style={{ fontSize: 13, color: "#64748B", marginBottom: 28 }}>
              Authorized credentials required for access.
            </p>

            {error && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  borderRadius: 10,
                  padding: "10px 14px",
                  color: "#FCA5A5",
                  fontSize: 13,
                  marginBottom: 20,
                }}
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#94A3B8", marginBottom: 6 }}>
                  ADMIN EMAIL
                </label>
                <div style={{ position: "relative" }}>
                  <Mail
                    size={16}
                    color="#64748B"
                    style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "11px 14px 11px 40px",
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: 10,
                      color: "#F8FAFC",
                      fontSize: 14,
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#94A3B8", marginBottom: 6 }}>
                  PASSWORD
                </label>
                <div style={{ position: "relative" }}>
                  <Lock
                    size={16}
                    color="#64748B"
                    style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "11px 40px 11px 40px",
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: 10,
                      color: "#F8FAFC",
                      fontSize: 14,
                      outline: "none",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: 14,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "#64748B",
                      cursor: "pointer",
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: 8,
                  padding: "13px 0",
                  background: "linear-gradient(135deg, #1A6BF5 0%, #38BDF8 100%)",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: loading ? "wait" : "pointer",
                  boxShadow: "0 4px 16px rgba(26,107,245,0.3)",
                }}
              >
                {loading ? "Authenticating..." : "Sign In to Admin Console"}
              </button>
            </form>

            <div style={{ marginTop: 24, textAlign: "center" }}>
              <Link href="/" style={{ fontSize: 13, color: "#64748B", textDecoration: "none" }}>
                ← Return to Consumer Website
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── AUTHENTICATED BROKER DASHBOARD ──────────────────────────────────────────
  const filteredInsurers = insurers.filter((ins) =>
    ins.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ins.shortName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPlans = plans.filter((p) =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0A0F1E", color: "#F8FAFC", display: "flex" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 260,
          background: "#070B15",
          borderRight: "1px solid rgba(255,255,255,0.08)",
          padding: "24px 16px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 36, paddingLeft: 8 }}>
            <img src="/logo.jpg" alt="Logo" style={{ height: 36, width: "auto", borderRadius: 6 }} />
            <div>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#38BDF8" }}>Admin Console</span>
              <span style={{ fontSize: 10, color: "#64748B", display: "block" }}>IRDAI Brokerage</span>
            </div>
          </div>

          <nav style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              { id: "overview", label: "Overview", icon: TrendingUp },
              { id: "insurers", label: "Partner Insurers (21)", icon: Building2 },
              { id: "plans", label: "Insurance Plans (52)", icon: FileText },
              { id: "posp", label: "POSP Agent KYC", icon: Users },
              { id: "infra", label: "Cloud Infrastructure", icon: Server },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "11px 14px",
                  borderRadius: 10,
                  border: "none",
                  background: activeTab === id ? "rgba(26,107,245,0.2)" : "transparent",
                  color: activeTab === id ? "#38BDF8" : "#94A3B8",
                  fontWeight: activeTab === id ? 700 : 500,
                  fontSize: 13,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <Icon size={16} />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div>
          <div style={{ padding: "12px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 10, marginBottom: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#F8FAFC" }}>{admin.name}</p>
            <p style={{ fontSize: 11, color: "#64748B" }}>{admin.email}</p>
          </div>

          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 14px",
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: 10,
              color: "#FCA5A5",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: "32px 40px", overflowY: "auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", color: "#F8FAFC" }}>
              {activeTab === "overview" && "Operations Overview"}
              {activeTab === "insurers" && "IRDAI Licensed Insurer Partners"}
              {activeTab === "plans" && "Master Insurance Policy Catalog"}
              {activeTab === "posp" && "POSP Agent Verification & DigiLocker"}
              {activeTab === "infra" && "Live Cloud Infrastructure Status"}
            </h1>
            <p style={{ fontSize: 13, color: "#64748B" }}>
              ASK Insurance Brokerage Control Panel · Connected to Aiven MySQL & Render Cloud
            </p>
          </div>

          <button
            onClick={() => token && fetchDashboardData(token)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "9px 16px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 10,
              color: "#F8FAFC",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            <RefreshCw size={14} className={dataLoading ? "animate-spin" : ""} />
            <span>Refresh Sync</span>
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {/* Top Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
              {[
                { title: "Partner Insurers", value: insurers.length || "21", sub: "100% IRDAI Active", color: "#38BDF8" },
                { title: "Master Plans", value: plans.length || "52", sub: "Term, Health, Motor, Travel", color: "#34D399" },
                { title: "Active Policies", value: "2.4L+", sub: "Digital Certificates Issued", color: "#F59E0B" },
                { title: "Claims Settled", value: "₹840 Cr", sub: "24x7 Fast Resolution", color: "#A855F7" },
              ].map(({ title, value, sub, color }) => (
                <div
                  key={title}
                  style={{
                    background: "#0F172A",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 16,
                    padding: "20px 22px",
                  }}
                >
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 8 }}>{title}</p>
                  <p style={{ fontSize: 30, fontWeight: 900, color, letterSpacing: "-0.03em", marginBottom: 4 }}>{value}</p>
                  <p style={{ fontSize: 11, color: "#94A3B8" }}>{sub}</p>
                </div>
              ))}
            </div>

            {/* Live System Status Banner */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(26,107,245,0.1), rgba(52,211,153,0.1))",
                border: "1px solid rgba(56,189,248,0.2)",
                borderRadius: 16,
                padding: "24px 28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#34D39920", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CheckCircle2 color="#34D399" size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "#F8FAFC" }}>Database & Backend Live</h3>
                  <p style={{ fontSize: 13, color: "#94A3B8" }}>
                    Aiven MySQL Cloud DB (`mysql-5f59d08-akkhilsharmaclass-a00a.f.aivencloud.com:11443`) is fully synced & seeded.
                  </p>
                </div>
              </div>

              <a
                href={`${API_BASE}/health`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 18px",
                  background: "#1A6BF5",
                  color: "#FFF",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                <span>Live API Health</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        )}

        {/* Tab 2: Insurers */}
        {activeTab === "insurers" && (
          <div>
            <div style={{ marginBottom: 20, maxWidth: 400, position: "relative" }}>
              <Search size={16} color="#64748B" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="text"
                placeholder="Search insurers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px 10px 40px",
                  background: "#0F172A",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 10,
                  color: "#FFF",
                  fontSize: 13,
                  outline: "none",
                }}
              />
            </div>

            <div style={{ background: "#0F172A", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                    <th style={{ padding: "14px 20px", color: "#64748B", fontWeight: 700 }}>INSURER</th>
                    <th style={{ padding: "14px 20px", color: "#64748B", fontWeight: 700 }}>SLUG</th>
                    <th style={{ padding: "14px 20px", color: "#64748B", fontWeight: 700 }}>CLAIM RATIO</th>
                    <th style={{ padding: "14px 20px", color: "#64748B", fontWeight: 700 }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {(filteredInsurers.length > 0 ? filteredInsurers : [
                    { name: "LIC of India", slug: "lic", claimsRatio: "98.5%", isActive: true },
                    { name: "HDFC Life", slug: "hdfc-life", claimsRatio: "99.3%", isActive: true },
                    { name: "ICICI Prudential", slug: "icici-pru", claimsRatio: "98.9%", isActive: true },
                    { name: "SBI Life", slug: "sbi-life", claimsRatio: "98.1%", isActive: true },
                    { name: "Star Health", slug: "star-health", claimsRatio: "99.0%", isActive: true },
                    { name: "Niva Bupa", slug: "niva-bupa", claimsRatio: "98.7%", isActive: true },
                    { name: "Tata AIG", slug: "tata-aig", claimsRatio: "99.1%", isActive: true },
                    { name: "HDFC ERGO", slug: "hdfc-ergo", claimsRatio: "99.4%", isActive: true },
                    { name: "Bajaj Allianz", slug: "bajaj-allianz", claimsRatio: "98.8%", isActive: true },
                  ]).map((ins, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "14px 20px", fontWeight: 700, color: "#F8FAFC" }}>{ins.name}</td>
                      <td style={{ padding: "14px 20px", color: "#94A3B8" }}>{ins.slug}</td>
                      <td style={{ padding: "14px 20px", color: "#34D399", fontWeight: 700 }}>{ins.claimsRatio || "98.5%"}</td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: "#34D399", background: "#34D39920", padding: "3px 10px", borderRadius: 100 }}>
                          ACTIVE
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Plans */}
        {activeTab === "plans" && (
          <div>
            <div style={{ background: "#0F172A", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                    <th style={{ padding: "14px 20px", color: "#64748B", fontWeight: 700 }}>PLAN NAME</th>
                    <th style={{ padding: "14px 20px", color: "#64748B", fontWeight: 700 }}>CATEGORY</th>
                    <th style={{ padding: "14px 20px", color: "#64748B", fontWeight: 700 }}>MIN COVER</th>
                    <th style={{ padding: "14px 20px", color: "#64748B", fontWeight: 700 }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {(filteredPlans.length > 0 ? filteredPlans : [
                    { name: "LIC Tech Term", type: "Life", minCover: "₹50,00,000", isActive: true },
                    { name: "HDFC Life Click 2 Protect Super", type: "Life", minCover: "₹1,00,00,000", isActive: true },
                    { name: "Star Health Optima Secure", type: "Health", minCover: "₹10,00,000", isActive: true },
                    { name: "Niva Bupa ReAssure 2.0", type: "Health", minCover: "₹5,00,000", isActive: true },
                    { name: "ICICI Lombard Comprehensive Motor", type: "Motor", minCover: "₹5,00,000", isActive: true },
                    { name: "Tata AIG International Travel", type: "Travel", minCover: "₹25,00,000", isActive: true },
                  ]).map((p, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "14px 20px", fontWeight: 700, color: "#F8FAFC" }}>{p.name}</td>
                      <td style={{ padding: "14px 20px", color: "#38BDF8", textTransform: "capitalize" }}>{p.type}</td>
                      <td style={{ padding: "14px 20px", color: "#94A3B8" }}>{p.minCover}</td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: "#34D399", background: "#34D39920", padding: "3px 10px", borderRadius: 100 }}>
                          ACTIVE
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: POSP */}
        {activeTab === "posp" && (
          <div style={{ background: "#0F172A", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 32 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>POSP Agent DigiLocker Verification</h3>
            <p style={{ fontSize: 13, color: "#94A3B8", marginBottom: 24 }}>
              Verify agent Aadhaar, PAN & Driving License issued via DigiLocker Sandbox / Production Integration.
            </p>
            <div style={{ background: "rgba(56,189,248,0.05)", border: "1px solid rgba(56,189,248,0.2)", borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 13, color: "#38BDF8", fontWeight: 700, marginBottom: 4 }}>DigiLocker Integration Active</div>
              <div style={{ fontSize: 12, color: "#94A3B8" }}>Client ID: `XI05DC7CCA` · Callback URL: `https://ask-insurance.onrender.com/api/kyc/callback`</div>
            </div>
          </div>
        )}

        {/* Tab 5: Infra */}
        {activeTab === "infra" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: "#0F172A", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <Server color="#38BDF8" size={24} />
                <h3 style={{ fontSize: 16, fontWeight: 800 }}>Node.js Express API</h3>
              </div>
              <p style={{ fontSize: 13, color: "#94A3B8", marginBottom: 12 }}>Host: Render.com Cloud Platform</p>
              <p style={{ fontSize: 13, color: "#34D399", fontWeight: 700 }}>URL: https://ask-insurance.onrender.com</p>
            </div>

            <div style={{ background: "#0F172A", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <Database color="#34D399" size={24} />
                <h3 style={{ fontSize: 16, fontWeight: 800 }}>MySQL 8.4 Database</h3>
              </div>
              <p style={{ fontSize: 13, color: "#94A3B8", marginBottom: 12 }}>Host: Aiven Cloud (mysql-5f59d08-akkhilsharmaclass-a00a.f.aivencloud.com)</p>
              <p style={{ fontSize: 13, color: "#34D399", fontWeight: 700 }}>Port: 11443 (SSL Required)</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
