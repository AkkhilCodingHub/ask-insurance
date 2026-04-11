import { ShieldCheck, Zap, Headphones, Award } from "lucide-react";

const features = [
  { Icon: ShieldCheck, title: "IRDAI Licensed", desc: "Reg. No. IB-123-2023" },
  { Icon: Zap, title: "Instant Issuance", desc: "Policy in < 5 mins" },
  { Icon: Headphones, title: "24×7 Support", desc: "Call, chat or email" },
  { Icon: Award, title: "Best Price", desc: "Zero commission" },
];

export function TrustBar() {
  return (
    <section
      style={{
        background: "var(--bg-warm)",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
        padding: "32px 24px",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 24,
        }}
      >
        {features.map(({ Icon, title, desc }) => (
          <div
            key={title}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "var(--primary-light)",
                border: "1px solid rgba(26,107,245,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon size={20} color="var(--primary)" strokeWidth={2} />
            </div>
            <div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 14,
                  color: "var(--text)",
                  marginBottom: 2,
                }}
              >
                {title}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
