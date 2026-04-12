const steps = [
  {
    num: "01",
    title: "Compare plans",
    desc: "Search across 38+ insurers in seconds. Filter by price, coverage depth, and claim ratio.",
  },
  {
    num: "02",
    title: "Get your quote",
    desc: "Enter your details and get an accurate premium instantly — no calls, no waiting.",
  },
  {
    num: "03",
    title: "Buy securely",
    desc: "Complete KYC and payment online. Policy issued within minutes.",
  },
];

export function HowItWorks() {
  return (
    <section style={{ padding: "72px 24px", background: "var(--white)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <h2
            style={{
              fontSize: "clamp(26px, 4vw, 34px)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "var(--text)",
              marginBottom: 10,
            }}
          >
            How it works
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: 15 }}>
            Get insured in 3 simple steps
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 32,
            position: "relative",
          }}
          className="grid-responsive-howitworks"
        >
          <style>{`
            @media (max-width: 768px) {
              .grid-responsive-howitworks { grid-template-columns: 1fr !important; gap: 24px !important; }
              .howitworks-connector { display: none !important; }
            }
          `}</style>
          {/* Connector line */}
          <div
            className="howitworks-connector"
            style={{
              position: "absolute",
              top: 36,
              left: "18%",
              right: "18%",
              height: 2,
              background:
                "linear-gradient(90deg, var(--primary), var(--accent))",
              opacity: 0.25,
              borderRadius: 2,
            }}
          />

          {steps.map((s, i) => (
            <div key={i} style={{ textAlign: "center", padding: "0 20px" }}>
              <div
                className="glow-blue-sm"
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 20,
                  background:
                    "linear-gradient(135deg, var(--primary-light), var(--accent-light))",
                  border: "2px solid rgba(26,107,245,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 24px",
                  fontSize: 20,
                  fontWeight: 900,
                  color: "var(--primary)",
                  letterSpacing: "-0.02em",
                }}
              >
                {s.num}
              </div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 18,
                  color: "var(--text)",
                  marginBottom: 10,
                }}
              >
                {s.title}
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: "var(--text-muted)",
                  lineHeight: 1.65,
                }}
              >
                {s.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
