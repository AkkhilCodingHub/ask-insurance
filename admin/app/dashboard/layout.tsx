"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, Users, FileText, Shield, Package,
  Building2, MessageSquare, BarChart3, Settings,
  LogOut, Bell, Search, ChevronRight, Menu, X, Headphones, HardDrive, UserCog,
} from "lucide-react";
import { useAuth } from "@/context/auth";

const nav = [
  { label: "Overview",   icon: LayoutDashboard, href: "/dashboard",           badge: false },
  { label: "Users",      icon: Users,            href: "/dashboard/users",     badge: false },
  { label: "Policies",   icon: FileText,         href: "/dashboard/policies",  badge: false },
  { label: "Claims",     icon: Shield,           href: "/dashboard/claims",    badge: false },
  { label: "Plans",      icon: Package,          href: "/dashboard/plans",     badge: false },
  { label: "Insurers",   icon: Building2,        href: "/dashboard/insurers",  badge: false },
  { label: "Quotes",     icon: MessageSquare,    href: "/dashboard/quotes",    badge: false },
  { label: "Files",      icon: HardDrive,        href: "/dashboard/files",     badge: false },
  { label: "Chat",       icon: Headphones,       href: "/dashboard/chat",      badge: true  },
  { label: "Analytics",  icon: BarChart3,        href: "/dashboard/analytics", badge: false },
  { label: "Agents",     icon: UserCog,          href: "/dashboard/agents",    badge: false },
  { label: "Settings",   icon: Settings,         href: "/dashboard/settings",  badge: false },
];

function getTitle(path: string) {
  const match = nav.find((n) => (n.href === "/dashboard" ? path === "/dashboard" : path.startsWith(n.href)));
  return match?.label ?? "Admin";
}


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { admin, loading, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [chatUnread, setChatUnread] = useState(0);

  useEffect(() => {
    if (!admin) return;
    const poll = async () => {
      try {
        const { adminApi } = await import("@/lib/api");
        const n = await adminApi.getChatUnread();
        setChatUnread(n);
      } catch { /* silent */ }
    };
    poll();
    const interval = setInterval(poll, 15000);
    return () => clearInterval(interval);
  }, [admin]);

  useEffect(() => {
    if (!loading && !admin) router.replace("/login");
  }, [loading, admin, router]);

  if (loading || !admin) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--sidebar-bg)" }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", border: "3px solid #1580FF", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const sideW = collapsed ? 64 : 220;

  function handleLogout() { logout(); router.replace("/login"); }

  const Sidebar = (
    <aside
      style={{
        width: sideW,
        background: "var(--sidebar-bg)",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 50,
        transition: "width 0.2s",
        overflowX: "hidden",
        overflowY: "auto",
        borderRight: "1px solid var(--sidebar-border)",
      }}
    >
      {/* Brand */}
      <div style={{ padding: "18px 16px", borderBottom: "1px solid var(--sidebar-border)", display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 64 }}>
        {!collapsed && (
          <div>
            <p style={{ fontSize: 15, fontWeight: 800, color: "#F1F5F9", letterSpacing: "-0.03em", whiteSpace: "nowrap" }}>
              ASK <span style={{ color: "#1580FF", fontWeight: 400, fontSize: 12 }}>Admin</span>
            </p>
            <p style={{ fontSize: 10, color: "#475569", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Insurance Portal</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B", display: "flex", padding: 4, flexShrink: 0, marginLeft: collapsed ? "auto" : 0, marginRight: collapsed ? "auto" : 0 }}
        >
          {collapsed ? <ChevronRight size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 8px" }}>
        {nav.map(({ label, icon: Icon, href, badge }) => {
          const active = href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
          const showBadge = badge && chatUnread > 0;
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: collapsed ? "10px 0" : "10px 12px",
                borderRadius: 8,
                textDecoration: "none",
                fontSize: 13,
                fontWeight: active ? 700 : 500,
                color: active ? "#F1F5F9" : "#64748B",
                background: active ? "rgba(21,128,255,0.15)" : "transparent",
                marginBottom: 2,
                transition: "all 0.15s",
                justifyContent: collapsed ? "center" : "flex-start",
                whiteSpace: "nowrap",
                overflow: "hidden",
                position: "relative",
              }}
              onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}
              onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <span style={{ position: "relative", flexShrink: 0 }}>
                <Icon size={17} color={active ? "#1580FF" : "#64748B"} strokeWidth={active ? 2.5 : 2} />
                {showBadge && collapsed && (
                  <span style={{ position: "absolute", top: -3, right: -3, width: 8, height: 8, borderRadius: "50%", background: "#EF4444", border: "1.5px solid #0F172A" }} />
                )}
              </span>
              {!collapsed && label}
              {!collapsed && showBadge && (
                <span style={{ marginLeft: "auto", background: "#EF4444", color: "#fff", fontSize: 10, fontWeight: 800, padding: "1px 6px", borderRadius: 100, minWidth: 18, textAlign: "center" }}>
                  {chatUnread > 99 ? "99+" : chatUnread}
                </span>
              )}
              {!collapsed && active && !showBadge && <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: "#1580FF" }} />}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div style={{ borderTop: "1px solid var(--sidebar-border)", padding: "12px 8px" }}>
        {!collapsed ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#1580FF", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
              {admin.avatar}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#E2E8F0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{admin.name}</p>
              <p style={{ fontSize: 10, color: "#475569", textTransform: "capitalize" }}>{admin.role.replace("_", " ")}</p>
            </div>
            <button onClick={handleLogout} title="Logout" style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B", display: "flex" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#EF4444")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#64748B")}
            >
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <button onClick={handleLogout} title="Logout" style={{ width: "100%", display: "flex", justifyContent: "center", padding: "10px 0", background: "none", border: "none", cursor: "pointer", color: "#64748B" }}>
            <LogOut size={17} />
          </button>
        )}
      </div>
    </aside>
  );

  return (
    <div style={{ display: "block", minHeight: "100vh", background: "var(--bg)" }}>
      {/* Desktop sidebar */}
      <div className="admin-sidebar-desktop">{Sidebar}</div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 99 }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} onClick={() => setMobileOpen(false)} />
          <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 220, zIndex: 100 }}>{Sidebar}</div>
        </div>
      )}

      {/* Main */}
      <div style={{ marginLeft: sideW, minWidth: 0, display: "flex", flexDirection: "column", minHeight: "100vh", transition: "margin-left 0.2s" }} className="admin-main">
        {/* Topbar */}
        <header style={{ background: "var(--white)", borderBottom: "1px solid var(--border)", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", position: "sticky", top: 0, zIndex: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button className="admin-mobile-menu" onClick={() => setMobileOpen(true)} style={{ display: "none", background: "none", border: "none", cursor: "pointer", color: "var(--text)" }}>
              <Menu size={22} />
            </button>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.03em" }}>{getTitle(pathname)}</h2>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Search */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "0 12px", height: 36, width: 220 }} className="admin-search">
              <Search size={15} color="var(--text-muted)" />
              <input placeholder="Quick search…" style={{ border: "none", outline: "none", fontSize: 13, background: "transparent", color: "var(--text)", width: "100%" }} />
            </div>

            {/* Notifications */}
            <button style={{ position: "relative", background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 8, color: "var(--text-muted)" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--bg)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "none")}
            >
              <Bell size={18} />
              <span style={{ position: "absolute", top: 4, right: 4, width: 8, height: 8, borderRadius: "50%", background: "#EF4444", border: "2px solid #fff" }} />
            </button>

            {/* Avatar */}
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              {admin.avatar}
            </div>
          </div>
        </header>

        <main style={{ flex: 1, padding: "24px" }}>
          {children}
        </main>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .admin-sidebar-desktop { display: none !important; }
          .admin-main { margin-left: 0 !important; }
          .admin-mobile-menu { display: flex !important; }
          .admin-search { display: none !important; }
        }
      `}</style>
    </div>
  );
}
