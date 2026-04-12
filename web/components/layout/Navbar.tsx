"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Shield } from "lucide-react";

const navLinks = [
  { label: "Products", href: "/products" },
  { label: "Compare", href: "/compare" },
  { label: "Claims", href: "/claims" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav
      style={{
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 1px 12px rgba(26,107,245,0.06)",
      }}
    >
      <style>{`
        .nav-desktop-links { display: flex; gap: 32px; }
        .nav-desktop-auth { display: flex; gap: 10px; align-items: center; }
        .nav-mobile-btn { display: none; }
        @media (max-width: 768px) {
          .nav-desktop-links { display: none !important; }
          .nav-desktop-auth { display: none !important; }
          .nav-mobile-btn { display: flex !important; }
        }
      `}</style>

      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px",
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
          <div
            className="animate-ring"
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              border: "2px solid var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)",
            }}
          >
            <Shield size={18} color="#fff" strokeWidth={2.5} />
          </div>
          <span
            style={{
              fontWeight: 800,
              fontSize: 20,
              letterSpacing: "-0.03em",
              color: "var(--text)",
            }}
          >
            ASK{" "}
            <span style={{ color: "var(--primary)", fontWeight: 400, fontSize: 14 }}>
              Insurance
            </span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="nav-desktop-links">
          {navLinks.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: "var(--text-muted)",
                textDecoration: "none",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "var(--primary)")}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "var(--text-muted)")}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Auth buttons */}
        <div className="nav-desktop-auth">
          <Link
            href="/login"
            style={{
              padding: "8px 20px",
              border: "1.5px solid var(--primary)",
              borderRadius: 8,
              background: "transparent",
              color: "var(--primary)",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--primary-light)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="glow-blue-sm"
            style={{
              padding: "8px 20px",
              border: "none",
              borderRadius: 8,
              background: "linear-gradient(135deg, var(--primary), var(--accent-dark))",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.9")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
          >
            Get Started
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="nav-mobile-btn"
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text)", alignItems: "center" }}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          style={{
            background: "var(--white)",
            borderTop: "1px solid var(--border)",
            padding: "16px 24px 24px",
          }}
        >
          {navLinks.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              style={{
                display: "block",
                padding: "12px 0",
                fontSize: 15,
                fontWeight: 500,
                color: "var(--text)",
                textDecoration: "none",
                borderBottom: "1px solid var(--border)",
              }}
              onClick={() => setMobileOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <Link
              href="/login"
              style={{
                flex: 1,
                padding: "10px 0",
                border: "1.5px solid var(--primary)",
                borderRadius: 8,
                color: "var(--primary)",
                fontSize: 14,
                fontWeight: 600,
                textAlign: "center",
                textDecoration: "none",
              }}
            >
              Log in
            </Link>
            <Link
              href="/register"
              style={{
                flex: 1,
                padding: "10px 0",
                background: "var(--primary)",
                borderRadius: 8,
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                textAlign: "center",
                textDecoration: "none",
              }}
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
