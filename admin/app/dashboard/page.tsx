"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText, Shield, Users, TrendingUp, Clock,
  PhoneCall, Award, Layers, Zap, ChevronRight,
  Send, AlertTriangle, FileCheck, RefreshCw, BadgeCheck, DollarSign
} from "lucide-react";
import { adminApi, DashboardStats, AdminClaim, AdminUser } from "@/lib/api";

interface BrokerTaskCardProps {
  title: string;
  count: number;
  badgeColor: string;
  bgColor: string;
  icon: React.ElementType;
  href: string;
  subtext: string;
  urgent?: boolean;
}

function ActionTaskCard({ title, count, badgeColor, bgColor, icon: Icon, href, subtext, urgent }: BrokerTaskCardProps) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 16px",
        background: "var(--white)",
        border: `1px solid ${urgent ? "#FCA5A5" : "var(--border)"}`,
        borderRadius: 12,
        textDecoration: "none",
        transition: "all 0.2s ease",
        boxShadow: urgent ? "0 2px 8px rgba(239, 68, 68, 0.08)" : "none",
      }}
      className="task-hover-card"
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: bgColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={18} color={badgeColor} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {title}
          </p>
          <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "2px 0 0" }}>{subtext}</p>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 900, padding: "4px 10px", borderRadius: 100, background: bgColor, color: badgeColor }}>
          {count}
        </span>
        <ChevronRight size={15} color="var(--text-muted)" />
      </div>
    </Link>
  );
}

function FollowUpCard({ title, value, status, icon: Icon, href, actionText }: { title: string; value: string; status: string; icon: React.ElementType; href: string; actionText: string }) {
  return (
    <div style={{ padding: "14px 16px", background: "var(--white)", border: "1px solid var(--border)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={16} color="var(--primary)" />
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", margin: 0 }}>{title}</p>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{status}</span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>{value}</span>
        <Link href={href} style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)", textDecoration: "none" }}>
          {actionText} →
        </Link>
      </div>
    </div>
  );
}

export default function BrokerAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [claims, setClaims] = useState<AdminClaim[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  
  const [loading, setLoading] = useState(true);
    useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const [statsData, claimsData, usersData] = await Promise.all([
          adminApi.getStats(),
          adminApi.getClaims(1, 6),
          adminApi.getUsers(1, 6)
        ]);
        setStats(statsData);
        setClaims(claimsData.claims);
        setUsers(usersData.users);
      } catch (e) {
        console.error("Broker Dashboard load error:", e);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid var(--primary)", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
        <p style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>Loading IRDAI Broker Dashboard...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const activePoliciesCount = stats?.activePolicies || 0;
  const pendingClaimsCount = stats?.pendingClaims || 0;
  const totalUsersCount = stats?.totalUsers || 0;
  const totalPremium = stats?.totalPremium || 0;

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 20 }}>
      
      {/* Broker Header Banner */}
      <div style={{
        background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
        borderRadius: 16,
        padding: "20px 24px",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.2)"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 900, background: "#1580FF", color: "#fff", padding: "2px 8px", borderRadius: 4, letterSpacing: "0.05em" }}>
              ASK BROKER BACK-OFFICE
            </span>
            <span style={{ fontSize: 12, color: "#94A3B8" }}>IRDAI Registered Broker Portal</span>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: "#F8FAFC", margin: 0, letterSpacing: "-0.03em" }}>
            Welcome to ASK Insurance Broker Management System
          </h1>
          <p style={{ fontSize: 12, color: "#94A3B8", margin: "4px 0 0" }}>
            Live operation queue: Policy Issuance, POSP Onboarding, Claim Intimations &amp; ORS Revenue Tracking
          </p>
        </div>

        {/* Action Button Pills */}
        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/dashboard/policies" style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.1)", color: "#fff", padding: "8px 14px", borderRadius: 10, fontSize: 12, fontWeight: 700, textDecoration: "none", backdropFilter: "blur(4px)" }}>
            <FileText size={14} /> New Policy Entry
          </Link>
          <Link href="/dashboard/posp-requests" style={{ display: "flex", alignItems: "center", gap: 6, background: "#1580FF", color: "#fff", padding: "8px 14px", borderRadius: 10, fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
            <Award size={14} /> Verify POSP Agents
          </Link>
        </div>
      </div>

      {/* Quick KPI Overview Bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }} className="kpi-grid">
        <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: "#E8F2FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FileText size={20} color="#1580FF" />
          </div>
          <div>
            <p style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, margin: 0 }}>Active Policies Issued</p>
            <p style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", margin: "2px 0 0" }}>{activePoliciesCount}</p>
          </div>
        </div>

        <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: "#FFFBEB", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Shield size={20} color="#D97706" />
          </div>
          <div>
            <p style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, margin: 0 }}>Open Claim Tasks</p>
            <p style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", margin: "2px 0 0" }}>{pendingClaimsCount}</p>
          </div>
        </div>

        <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Users size={20} color="#059669" />
          </div>
          <div>
            <p style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, margin: 0 }}>Total Registered Clients</p>
            <p style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", margin: "2px 0 0" }}>{totalUsersCount}</p>
          </div>
        </div>

        <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: "#F5F3FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <DollarSign size={20} color="#7C3AED" />
          </div>
          <div>
            <p style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, margin: 0 }}>Total Gross Premium</p>
            <p style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", margin: "2px 0 0" }}>
              ₹{totalPremium >= 100000 ? `${(totalPremium / 100000).toFixed(1)}L` : `${(totalPremium / 1000).toFixed(0)}k`}
            </p>
          </div>
        </div>
      </div>

      {/* Main SAIBAOnline-Style 2-Column Broker Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20 }} className="broker-main-grid">
        
        {/* Left Column: Actionable Tasks (Urgent Operations Queue) */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Zap size={18} color="#1580FF" />
              <h2 style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", margin: 0 }}>Actionable Tasks Queue</h2>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#1580FF", background: "#E8F2FF", padding: "3px 8px", borderRadius: 6 }}>
              IRDAI Operational Worklist
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <ActionTaskCard
              title="Policy Entry Pending"
              count={122}
              badgeColor="#DC2626"
              bgColor="#FEF2F2"
              icon={FileText}
              href="/dashboard/policies"
              subtext="Payment done; Insurer issuance pending"
              urgent={true}
            />
            <ActionTaskCard
              title="Claim Intimation Tasks"
              count={52}
              badgeColor="#D97706"
              bgColor="#FFFBEB"
              icon={Shield}
              href="/dashboard/claims"
              subtext="Active claim intimations to process"
              urgent={true}
            />
            <ActionTaskCard
              title="Active Enquiries / Leads"
              count={242}
              badgeColor="#1580FF"
              bgColor="#E8F2FF"
              icon={TrendingUp}
              href="/dashboard/quotes"
              subtext="Live customer quote requests"
            />
            <ActionTaskCard
              title="Quote Slips Approved"
              count={14}
              badgeColor="#059669"
              bgColor="#ECFDF5"
              icon={FileCheck}
              href="/dashboard/quotes"
              subtext="Approved proposal quote slips"
            />
            <ActionTaskCard
              title="POSP Agent Verification"
              count={8}
              badgeColor="#7C3AED"
              bgColor="#F5F3FF"
              icon={Award}
              href="/dashboard/posp-requests"
              subtext="KYC &amp; IC-38 certification audit"
            />
            <ActionTaskCard
              title="Policy Renewals Due"
              count={35}
              badgeColor="#0891B2"
              bgColor="#E0F7FF"
              icon={RefreshCw}
              href="/dashboard/renewals"
              subtext="Policies expiring in 30 days"
            />
            <ActionTaskCard
              title="QC Audit &amp; Proposal Check"
              count={12}
              badgeColor="#D97706"
              bgColor="#FFFBEB"
              icon={BadgeCheck}
              href="/dashboard/policies"
              subtext="Document verification checker"
            />
            <ActionTaskCard
              title="Appointment &amp; Meetings"
              count={18}
              badgeColor="#059669"
              bgColor="#ECFDF5"
              icon={PhoneCall}
              href="/dashboard/chat"
              subtext="Client consultation schedules"
            />
          </div>
        </div>

        {/* Right Column: Operational Follow-ups & Dispatch Tracker */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Clock size={18} color="#059669" />
              <h2 style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", margin: 0 }}>Operational Follow-ups &amp; Dispatches</h2>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#059669", background: "#ECFDF5", padding: "3px 8px", borderRadius: 6 }}>
              Dispatch Status
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <FollowUpCard
              title="Policy / Endorsement Dispatch to Customer"
              value="24 Pending"
              status="Issued PDFs waiting for WhatsApp/Email send"
              icon={Send}
              href="/dashboard/policies"
              actionText="Dispatch PDF"
            />
            <FollowUpCard
              title="Policy / Endorsement Not Received from Insurer"
              value="15 Delayed"
              status="Payment complete; Insurer PDF not arrived"
              icon={AlertTriangle}
              href="/dashboard/policies"
              actionText="Liaise Insurer"
            />
            <FollowUpCard
              title="Quote Slip Follow-ups"
              value="18 Active"
              status="Custom offline quote responses from insurers"
              icon={FileText}
              href="/dashboard/quotes"
              actionText="Follow Up"
            />
            <FollowUpCard
              title="Pending ORS &amp; Brokerage Payouts"
              value="₹1.42L"
              status="Insurer commission receivables reconciliation"
              icon={DollarSign}
              href="/dashboard/brokerage"
              actionText="Reconcile"
            />
            <FollowUpCard
              title="Health Card &amp; Physical Booklet Dispatch"
              value="9 Courier"
              status="Physical health cards &amp; motor booklets"
              icon={Layers}
              href="/dashboard/files"
              actionText="View Tracking"
            />
          </div>
        </div>
      </div>

      {/* Live Recent Operations Tables */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }} className="tables-grid">
        
        {/* Recent Claim Intimations */}
        <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Shield size={16} color="#D97706" />
              <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", margin: 0 }}>Recent Claim Intimations</h3>
            </div>
            <Link href="/dashboard/claims" style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", textDecoration: "none" }}>
              View All Claims →
            </Link>
          </div>
          <div>
            {claims.length > 0 ? (
              claims.map((c) => (
                <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", margin: 0 }}>Claim #{c.id.slice(0, 8).toUpperCase()}</p>
                    <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "2px 0 0" }}>
                      Intimated {new Date(c.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 100, background: c.status === "approved" ? "#ECFDF5" : "#FFFBEB", color: c.status === "approved" ? "#059669" : "#D97706" }}>
                      {c.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: 20, textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>No claim intimations recorded</div>
            )}
          </div>
        </div>

        {/* Recent Client Onboarding & Leads */}
        <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Users size={16} color="#1580FF" />
              <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", margin: 0 }}>Client Leads &amp; Registrations</h3>
            </div>
            <Link href="/dashboard/users" style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", textDecoration: "none" }}>
              View All Clients →
            </Link>
          </div>
          <div>
            {users.length > 0 ? (
              users.map((u) => (
                <div key={u.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#E8F2FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#1580FF" }}>
                      {(u.name || u.phone || "U").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", margin: 0 }}>{u.name || u.phone}</p>
                      <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "2px 0 0" }}>Joined {new Date(u.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 100, background: "#ECFDF5", color: "#059669" }}>
                    ACTIVE LEAD
                  </span>
                </div>
              ))
            ) : (
              <div style={{ padding: 20, textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>No client leads registered</div>
            )}
          </div>
        </div>

      </div>

      <style>{`
        .task-hover-card:hover {
          transform: translateY(-2px);
          border-color: var(--primary) !important;
          box-shadow: 0 4px 12px rgba(21, 128, 255, 0.12) !important;
        }
        @media (max-width: 1024px) {
          .broker-main-grid { grid-template-columns: 1fr !important; }
          .tables-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .kpi-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

    </div>
  );
}
