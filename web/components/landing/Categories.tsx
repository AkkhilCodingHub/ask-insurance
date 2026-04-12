"use client";

"use client";

import { Heart, Activity, Car, Home, Plane, Briefcase } from "lucide-react";

const categories = [
  { Icon: Heart, label: "Life", desc: "Term & ULIP plans", color: "#EF4444" },
  { Icon: Activity, label: "Health", desc: "Family & individual", color: "#10B981" },
  { Icon: Car, label: "Motor", desc: "Car & two-wheeler", color: "#1A6BF5" },
  { Icon: Home, label: "Home", desc: "Property protection", color: "#8B5CF6" },
  { Icon: Plane, label: "Travel", desc: "Domestic & international", color: "#0EA5E9" },
  { Icon: Briefcase, label: "Business", desc: "SME & corporate", color: "#F59E0B" },
];

export function Categories() {
  return (
    <section
      style={{
        padding: "72px 24px",
        background: "var(--white)",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2
            style={{
              fontSize: "clamp(26px, 4vw, 34px)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "var(--text)",
              marginBottom: 10,
            }}
          >
            What are you looking for?
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: 15 }}>
            Choose a category to explore tailored plans
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: 16,
          }}
          className="grid-responsive-categories"
        >
          <style>{`
            @media (max-width: 1024px) { .grid-responsive-categories { grid-template-columns: repeat(3, 1fr) !important; } }
            @media (max-width: 600px) { .grid-responsive-categories { grid-template-columns: repeat(2, 1fr) !important; } }
          `}</style>
          {categories.map(({ Icon, label, desc, color }) => (
            <div
              key={label}
              style={{
                background: "var(--bg)",
                border: "1.5px solid var(--border)",
                borderRadius: 16,
                padding: "24px 12px",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.22s ease",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "var(--primary-light)";
                el.style.borderColor = "var(--primary)";
                el.style.transform = "translateY(-4px)";
                el.style.boxShadow = "0 8px 24px rgba(26,107,245,0.12)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "var(--bg)";
                el.style.borderColor = "var(--border)";
                el.style.transform = "none";
                el.style.boxShadow = "none";
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: color + "15",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px",
                }}
              >
                <Icon size={22} color={color} strokeWidth={2} />
              </div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 14,
                  color: "var(--text)",
                  marginBottom: 4,
                }}
              >
                {label}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4 }}>
                {desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
