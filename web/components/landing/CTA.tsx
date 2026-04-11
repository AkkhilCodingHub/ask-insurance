import Link from "next/link";
import { ArrowRight, Shield } from "lucide-react";

export function CTA() {
  return (
    <section
      style={{
        background:
          "linear-gradient(135deg, var(--primary-deep) 0%, var(--primary) 50%, var(--accent-dark) 100%)",
        padding: "80px 24px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative ring — echoes the logo */}
      <div
        className="animate-ring"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 500,
          height: 500,
          borderRadius: "50%",
          border: "1px solid rgba(56,189,248,0.15)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 350,
          height: 350,
          borderRadius: "50%",
          border: "1px solid rgba(56,189,248,0.1)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative" }}>
        {/* Shield icon */}
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: "50%",
            border: "2px solid rgba(56,189,248,0.6)",
            background: "rgba(255,255,255,0.1)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
            boxShadow: "0 0 24px rgba(56,189,248,0.4)",
          }}
        >
          <Shield size={26} color="#fff" strokeWidth={2} />
        </div>

        <h2
          style={{
            fontSize: "clamp(28px, 5vw, 42px)",
            fontWeight: 900,
            color: "#fff",
            letterSpacing: "-0.03em",
            marginBottom: 14,
          }}
        >
          Ready to get covered?
        </h2>
        <p
          style={{
            color: "rgba(255,255,255,0.75)",
            fontSize: 16,
            marginBottom: 36,
            maxWidth: 440,
            margin: "0 auto 36px",
            lineHeight: 1.6,
          }}
        >
          Join 2.4 lakh+ Indians who&apos;ve found smarter, simpler insurance with ASK.
        </p>

        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/compare"
            style={{
              padding: "15px 36px",
              background: "#fff",
              border: "none",
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 700,
              color: "var(--primary-dark)",
              cursor: "pointer",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              transition: "transform 0.15s ease",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.transform = "translateY(-2px)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.transform = "none")
            }
          >
            Compare plans for free
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/register"
            style={{
              padding: "15px 36px",
              background: "rgba(255,255,255,0.12)",
              border: "1.5px solid rgba(255,255,255,0.4)",
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 600,
              color: "#fff",
              cursor: "pointer",
              textDecoration: "none",
              transition: "background 0.15s ease",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.2)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.12)")
            }
          >
            Create account
          </Link>
        </div>
      </div>
    </section>
  );
}
