"use client";

import { Smartphone } from "lucide-react";

function AppleLogo() {
  return (
    <svg width="20" height="24" viewBox="0 0 170 170" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.197-2.12-9.973-3.17-14.34-3.17-4.58 0-9.492 1.05-14.746 3.17-5.262 2.13-9.501 3.24-12.742 3.35-4.929.21-9.842-1.96-14.746-6.52-3.13-2.73-7.045-7.41-11.735-14.04-5.032-7.08-9.169-15.29-12.41-24.65-3.471-10.11-5.211-19.9-5.211-29.378 0-10.857 2.346-20.221 7.045-28.068 3.693-6.303 8.606-11.275 14.755-14.925s12.793-5.51 19.948-5.629c3.915 0 9.049 1.211 15.429 3.591 6.362 2.388 10.447 3.599 12.238 3.599 1.339 0 5.877-1.416 13.57-4.239 7.275-2.618 13.415-3.702 18.445-3.275 13.63 1.1 23.87 6.473 30.68 16.153-12.19 7.386-18.22 17.731-18.1 31.002.11 10.337 3.86 18.939 11.23 25.769 3.34 3.17 7.07 5.62 11.22 7.36-.9 2.61-1.85 5.11-2.86 7.51zM119.11 7.24c0 8.102-2.96 15.667-8.86 22.669-7.12 8.324-15.732 13.134-25.071 12.375a25.222 25.222 0 0 1-.188-3.068c0-7.765 3.386-16.089 9.399-22.87 3.002-3.439 6.82-6.3 11.45-8.597 4.62-2.261 8.99-3.507 13.1-3.71.12 1.003.17 2.007.17 3.201z" />
    </svg>
  );
}

function PlayStoreLogo() {
  return (
    <svg width="22" height="24" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ps-a" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#00C6FF" />
          <stop offset="100%" stopColor="#0072FF" />
        </linearGradient>
        <linearGradient id="ps-b" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD000" />
          <stop offset="100%" stopColor="#FF6D00" />
        </linearGradient>
        <linearGradient id="ps-c" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF3A44" />
          <stop offset="100%" stopColor="#C31162" />
        </linearGradient>
        <linearGradient id="ps-d" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#32FF7A" />
          <stop offset="100%" stopColor="#00CC44" />
        </linearGradient>
      </defs>
      {/* Play button triangle shape split into 4 colour segments */}
      <path d="M27 5 L256 256 L27 507 C12 499 0 484 0 464V48C0 28 12 13 27 5Z" fill="url(#ps-a)" />
      <path d="M341 171 L27 5C42 -3 60 -1 76 8L341 171Z" fill="url(#ps-d)" />
      <path d="M512 256C512 276 500 293 484 302L341 341 256 256 341 171 484 210C500 219 512 236 512 256Z" fill="url(#ps-b)" />
      <path d="M27 507L341 341 256 256 27 507Z" fill="url(#ps-c)" />
    </svg>
  );
}

export function AppDownload() {
  return (
    <section
      className="app-download-section"
      style={{
        background: "linear-gradient(135deg, #0A1628 0%, #0D2247 50%, #0A1628 100%)",
        padding: "48px 24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle background glow */}
      <div style={{ position: "absolute", top: "50%", left: "15%", transform: "translateY(-50%)", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(21,128,255,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "50%", right: "10%", transform: "translateY(-50%)", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(77,184,255,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div
        className="app-download-inner"
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 40,
          position: "relative",
        }}
      >
        {/* Left — text */}
        <div className="app-download-text" style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              background: "rgba(21,128,255,0.15)",
              border: "1px solid rgba(77,184,255,0.3)",
              borderRadius: 20,
              padding: "5px 14px",
              marginBottom: 16,
            }}
          >
            <Smartphone size={13} color="#4DB8FF" />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#4DB8FF", letterSpacing: "0.04em" }}>
              Available on iOS & Android
            </span>
          </div>

          <h2
            style={{
              fontSize: "clamp(22px, 3.5vw, 32px)",
              fontWeight: 900,
              color: "#F1F5F9",
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
              marginBottom: 10,
            }}
          >
            Manage your insurance{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #1580FF, #4DB8FF)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              on the go
            </span>
          </h2>
          <p
            style={{
              fontSize: 14,
              color: "#64748B",
              lineHeight: 1.65,
              maxWidth: 400,
              marginBottom: 28,
            }}
          >
            View policies, file claims, renew coverage, and chat with an expert — all from your pocket.
          </p>

          {/* Store badges */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {/* App Store */}
            <a
              href="#"
              className="store-badge"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 11,
                padding: "11px 20px",
                background: "#fff",
                borderRadius: 12,
                textDecoration: "none",
                transition: "transform 0.18s, box-shadow 0.18s",
                boxShadow: "0 2px 12px rgba(0,0,0,0.25)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.35)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "none";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.25)";
              }}
            >
              <span style={{ color: "#0A1628", display: "flex", alignItems: "center" }}>
                <AppleLogo />
              </span>
              <div>
                <p style={{ fontSize: 10, color: "#6B7280", fontWeight: 500, marginBottom: 1, lineHeight: 1 }}>Download on the</p>
                <p style={{ fontSize: 16, fontWeight: 800, color: "#0A1628", letterSpacing: "-0.02em", lineHeight: 1 }}>App Store</p>
              </div>
            </a>

            {/* Google Play */}
            <a
              href="#"
              className="store-badge"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 11,
                padding: "11px 20px",
                background: "#fff",
                borderRadius: 12,
                textDecoration: "none",
                transition: "transform 0.18s, box-shadow 0.18s",
                boxShadow: "0 2px 12px rgba(0,0,0,0.25)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.35)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "none";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.25)";
              }}
            >
              <PlayStoreLogo />
              <div>
                <p style={{ fontSize: 10, color: "#6B7280", fontWeight: 500, marginBottom: 1, lineHeight: 1 }}>Get it on</p>
                <p style={{ fontSize: 16, fontWeight: 800, color: "#0A1628", letterSpacing: "-0.02em", lineHeight: 1 }}>Google Play</p>
              </div>
            </a>
          </div>
        </div>

        {/* Right — stats / app preview hints */}
        <div className="app-download-stats" style={{ display: "flex", gap: 16, flexShrink: 0 }}>
          {[
            { value: "4.8★", sub: "App Store", color: "#F59E0B" },
            { value: "4.7★", sub: "Google Play", color: "#4DB8FF" },
            { value: "2L+", sub: "Downloads", color: "#34D399" },
          ].map(({ value, sub, color }) => (
            <div
              key={sub}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16,
                padding: "20px 22px",
                textAlign: "center",
                minWidth: 90,
              }}
            >
              <p
                style={{
                  fontSize: 22,
                  fontWeight: 900,
                  color,
                  letterSpacing: "-0.04em",
                  marginBottom: 4,
                  lineHeight: 1,
                }}
              >
                {value}
              </p>
              <p style={{ fontSize: 11, color: "#64748B", fontWeight: 500 }}>{sub}</p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .app-download-inner { flex-direction: column !important; align-items: flex-start !important; }
          .app-download-stats { width: 100%; justify-content: flex-start; }
          .app-download-section { padding: 40px 16px !important; }
        }
        @media (max-width: 480px) {
          .app-download-stats { gap: 10px !important; }
          .app-download-stats > div { min-width: 76px !important; padding: 14px 14px !important; }
        }
      `}</style>
    </section>
  );
}
