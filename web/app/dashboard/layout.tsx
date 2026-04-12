"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  Shield,
  User,
  Settings,
  Bell,
  Headphones,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/context/auth";

const navItems = [
  { label: "Home", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Compare Plans", icon: FileText, href: "/dashboard/plans" },
  { label: "My Claims", icon: Shield, href: "/dashboard/claims" },
  { label: "Profile", icon: User, href: "/dashboard/profile" },
  { label: "Settings", icon: Settings, href: "/dashboard/settings" },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getPageTitle(pathname: string) {
  if (pathname === "/dashboard") return "Overview";
  if (pathname.startsWith("/dashboard/plans") && pathname !== "/dashboard/plans") return "Plan Details";
  if (pathname === "/dashboard/plans") return "Compare Plans";
  if (pathname === "/dashboard/claims") return "My Claims";
  if (pathname === "/dashboard/profile") return "Profile";
  if (pathname === "/dashboard/settings") return "Settings";
  return "Dashboard";
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg)",
        }}
      >
        <div
          className="animate-ring"
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            border: "3px solid var(--primary)",
            borderTopColor: "transparent",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const initials = getInitials(user.name);
  const pageTitle = getPageTitle(pathname);

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <div style={{ display: "block", minHeight: "100vh", background: "var(--bg)" }}>
      {/* ── Sidebar ── */}
      <aside
        style={{
          width: 240,
          flexShrink: 0,
          background: "var(--white)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          zIndex: 50,
          overflowY: "auto",
        }}
        className="sidebar-desktop"
      >
        {/* Logo — links back to landing */}
        <Link
          href="/"
          style={{
            padding: "20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.75")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
        >
          <div
            className="animate-ring"
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              border: "2px solid var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)",
              flexShrink: 0,
            }}
          >
            <Shield size={16} color="#fff" strokeWidth={2.5} />
          </div>
          <span
            style={{
              fontWeight: 800,
              fontSize: 18,
              letterSpacing: "-0.03em",
              color: "var(--text)",
            }}
          >
            ASK{" "}
            <span style={{ color: "var(--primary)", fontWeight: 400, fontSize: 13 }}>
              Insurance
            </span>
          </span>
        </Link>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: "12px 0" }}>
          {navItems.map(({ label, icon: Icon, href }) => {
            const isActive =
              href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "11px 20px",
                  textDecoration: "none",
                  fontSize: 14,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? "var(--primary)" : "var(--text-muted)",
                  background: isActive ? "var(--primary-light)" : "transparent",
                  borderLeft: isActive ? "3px solid var(--primary)" : "3px solid transparent",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = "var(--bg)";
                    (e.currentTarget as HTMLElement).style.color = "var(--text)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                    (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
                  }
                }}
              >
                <Icon
                  size={18}
                  strokeWidth={isActive ? 2.5 : 2}
                  color={isActive ? "var(--primary)" : "var(--text-muted)"}
                />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Talk to Expert card */}
        <div style={{ padding: "0 16px 16px" }}>
          <div
            style={{
              background: "linear-gradient(135deg, #083A8C 0%, #1580FF 100%)",
              borderRadius: 12,
              padding: "16px",
              color: "#fff",
            }}
          >
            <Headphones size={22} color="#fff" style={{ marginBottom: 8 }} />
            <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Talk to an Expert</p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 12 }}>
              Free consultation available
            </p>
            <button
              style={{
                width: "100%",
                padding: "8px 0",
                background: "rgba(255,255,255,0.18)",
                border: "1px solid rgba(255,255,255,0.35)",
                borderRadius: 8,
                color: "#fff",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(255,255,255,0.28)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(255,255,255,0.18)";
              }}
            >
              Chat now
            </button>
          </div>
        </div>

        {/* User footer */}
        <div
          style={{
            borderTop: "1px solid var(--border)",
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--text)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {user.name}
            </p>
            <p
              style={{
                fontSize: 11,
                color: "var(--text-light)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              +91 {user.phone}
            </p>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
              borderRadius: 6,
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.color = "var(--error)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)")
            }
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom nav ── */}
      <nav
        className="mobile-nav"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "var(--white)",
          borderTop: "1px solid var(--border)",
          display: "none",
          justifyContent: "space-around",
          zIndex: 60,
          padding: "8px 0",
        }}
      >
        {navItems.slice(0, 4).map(({ label, icon: Icon, href }) => {
          const isActive =
            href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                padding: "4px 12px",
                textDecoration: "none",
                color: isActive ? "var(--primary)" : "var(--text-muted)",
              }}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500 }}>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ── Main content area ── */}
      <div style={{ marginLeft: 240, minWidth: 0, display: "flex", flexDirection: "column", minHeight: "100vh" }} className="main-area">
        {/* Top bar */}
        <header
          style={{
            background: "var(--white)",
            borderBottom: "1px solid var(--border)",
            position: "sticky",
            top: 0,
            zIndex: 40,
            height: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              style={{
                display: "none",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text)",
              }}
            >
              {mobileSidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: "var(--text)",
                letterSpacing: "-0.03em",
              }}
            >
              {pageTitle}
            </h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              style={{
                position: "relative",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 6,
                borderRadius: 8,
                color: "var(--text-muted)",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background = "var(--bg)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background = "none")
              }
            >
              <Bell size={20} />
            </button>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {initials}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: "24px", overflowX: "hidden" }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
          .mobile-nav { display: flex !important; }
          .mobile-menu-btn { display: flex !important; }
          .main-area { margin-left: 0 !important; padding-bottom: 70px; }
        }
      `}</style>
    </div>
  );
}
