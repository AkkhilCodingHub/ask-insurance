"use client";

import { useEffect, useRef, useState } from "react";

const stats = [
  { value: "2.4L+", label: "Policies Sold" },
  { value: "₹840Cr", label: "Claims Settled" },
  { value: "38+", label: "Insurer Partners" },
  { value: "4.8★", label: "Customer Rating" },
];

export function Stats() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.3 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      style={{
        background: "linear-gradient(135deg, var(--primary-deep) 0%, var(--primary) 50%, var(--accent-dark) 100%)",
        padding: "44px 24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle ring pattern from logo */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle at 20% 50%, rgba(56,189,248,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(56,189,248,0.1) 0%, transparent 50%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 24,
          position: "relative",
        }}
      >
        {stats.map((s, i) => (
          <div
            key={i}
            style={{
              textAlign: "center",
              opacity: visible ? 1 : 0,
              transform: visible ? "none" : "translateY(12px)",
              transition: `all 0.5s ease ${i * 80}ms`,
            }}
          >
            <div
              style={{
                fontSize: 36,
                fontWeight: 900,
                color: "#fff",
                letterSpacing: "-0.03em",
                marginBottom: 4,
                textShadow: "0 0 20px rgba(56,189,248,0.4)",
              }}
            >
              {s.value}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", fontWeight: 500 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
