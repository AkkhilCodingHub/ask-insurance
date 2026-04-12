"use client";

import { useState } from "react";
import {
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Check,
  Clock,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { MY_CLAIMS, PLANS } from "@/lib/mock";
import type { Claim } from "@/lib/mock";

type ClaimStatus = "Approved" | "Processing" | "Rejected" | "Settled";
type ClaimType = "Health" | "Life" | "Motor" | "Travel";

const statusConfig: Record<ClaimStatus, { color: string; bg: string; icon: React.ReactNode }> = {
  Approved: {
    color: "#059669",
    bg: "#ECFDF5",
    icon: <Check size={13} strokeWidth={3} />,
  },
  Processing: {
    color: "#D97706",
    bg: "#FFFBEB",
    icon: <Clock size={13} />,
  },
  Rejected: {
    color: "#DC2626",
    bg: "#FEF2F2",
    icon: <XCircle size={13} />,
  },
  Settled: {
    color: "var(--primary)",
    bg: "var(--primary-light)",
    icon: <Check size={13} strokeWidth={3} />,
  },
};

const claimTimeline = [
  "Submitted",
  "Under Review",
  "Approved",
  "Settled",
];

function ClaimCard({
  claim,
}: {
  claim: Claim;
}) {
  const [expanded, setExpanded] = useState(false);
  const st = statusConfig[claim.status];
  const activeStep = claimTimeline.indexOf(
    claim.status === "Approved" ? "Approved" : claim.status === "Processing" ? "Under Review" : claim.status
  );

  return (
    <div
      style={{
        background: "var(--white)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        overflow: "hidden",
        marginBottom: 12,
      }}
    >
      {/* Main row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "16px 20px",
        }}
      >
        {/* Status color bar */}
        <div
          style={{
            width: 4,
            alignSelf: "stretch",
            background: st.color,
            borderRadius: 4,
            flexShrink: 0,
          }}
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 4,
            }}
          >
            <span
              style={{ fontSize: 13, fontWeight: 500, color: "var(--text-muted)", fontFamily: "monospace" }}
            >
              {claim.claimNo}
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: st.color,
                background: st.bg,
                padding: "2px 10px",
                borderRadius: 100,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {st.icon}
              {claim.status}
            </span>
          </div>
          <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>
            {claim.description}
          </p>
          <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {claim.insurer} • {claim.date}
          </p>
        </div>

        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <p
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: "var(--text)",
              letterSpacing: "-0.03em",
            }}
          >
            ₹{claim.amount.toLocaleString("en-IN")}
          </p>
          <p style={{ fontSize: 11, color: "var(--text-muted)" }}>Claim amount</p>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            cursor: "pointer",
            padding: 6,
            color: "var(--text-muted)",
            display: "flex",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Expandable timeline */}
      {expanded && (
        <div
          style={{
            borderTop: "1px solid var(--border)",
            padding: "16px 20px 16px 42px",
          }}
        >
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--text-muted)",
              marginBottom: 16,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Claim Timeline
          </p>
          <div style={{ display: "flex", gap: 0, alignItems: "flex-start" }}>
            {claimTimeline.map((step, idx) => {
              const done = idx <= activeStep;
              const active = idx === activeStep;
              return (
                <div
                  key={step}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    position: "relative",
                  }}
                >
                  {/* Connector line */}
                  {idx < claimTimeline.length - 1 && (
                    <div
                      style={{
                        position: "absolute",
                        top: 14,
                        left: "50%",
                        width: "100%",
                        height: 2,
                        background: done && idx < activeStep ? "#059669" : "var(--border)",
                        zIndex: 0,
                      }}
                    />
                  )}
                  {/* Circle */}
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: done ? "#059669" : "var(--bg)",
                      border: `2px solid ${done ? "#059669" : "var(--border)"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: 1,
                      flexShrink: 0,
                      transition: "all 0.2s",
                    }}
                  >
                    {done ? (
                      <Check size={13} color="#fff" strokeWidth={3} />
                    ) : (
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: "var(--border)",
                        }}
                      />
                    )}
                  </div>
                  <p
                    style={{
                      fontSize: 10,
                      fontWeight: active ? 700 : 500,
                      color: active ? "#059669" : done ? "var(--text)" : "var(--text-muted)",
                      textAlign: "center",
                      marginTop: 6,
                      lineHeight: 1.3,
                    }}
                  >
                    {step}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Multi-step File Claim Modal
function FileClaimModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [type, setType] = useState<ClaimType | null>(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const claimTypes: ClaimType[] = ["Health", "Life", "Motor", "Travel"];
  const typeColors: Record<ClaimType, string> = {
    Health: "#059669",
    Life: "#1580FF",
    Motor: "#0891B2",
    Travel: "#D97706",
  };

  function handleSubmit() {
    setSubmitted(true);
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "var(--white)",
          borderRadius: 20,
          width: "100%",
          maxWidth: 480,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>
              File a New Claim
            </h3>
            {!submitted && (
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                Step {step} of 3
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              cursor: "pointer",
              padding: 6,
              color: "var(--text-muted)",
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: "24px" }}>
          {submitted ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  background: "#ECFDF5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <Check size={28} color="#059669" strokeWidth={3} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>
                Claim Submitted!
              </h3>
              <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 24 }}>
                Your {type} claim for ₹{Number(amount).toLocaleString("en-IN")} has been submitted
                successfully. You&apos;ll receive updates on your registered number.
              </p>
              <button
                onClick={onClose}
                style={{
                  padding: "12px 32px",
                  background: "var(--primary)",
                  border: "none",
                  borderRadius: 10,
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Done
              </button>
            </div>
          ) : step === 1 ? (
            <div>
              <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 16 }}>
                Select claim type
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
                {claimTypes.map((ct) => (
                  <button
                    key={ct}
                    onClick={() => setType(ct)}
                    style={{
                      padding: "16px",
                      border: `2px solid ${type === ct ? typeColors[ct] : "var(--border)"}`,
                      borderRadius: 12,
                      background: type === ct ? typeColors[ct] + "14" : "var(--white)",
                      cursor: "pointer",
                      textAlign: "center",
                      transition: "all 0.15s",
                    }}
                  >
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: type === ct ? typeColors[ct] : "var(--text)",
                      }}
                    >
                      {ct}
                    </p>
                  </button>
                ))}
              </div>
              <button
                disabled={!type}
                onClick={() => setStep(2)}
                style={{
                  width: "100%",
                  padding: "13px",
                  background: type ? "var(--primary)" : "var(--border)",
                  border: "none",
                  borderRadius: 10,
                  color: type ? "#fff" : "var(--text-muted)",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: type ? "pointer" : "not-allowed",
                }}
              >
                Next →
              </button>
            </div>
          ) : step === 2 ? (
            <div>
              <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 16 }}>
                Claim details
              </p>
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    marginBottom: 8,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Claim Amount (₹)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  style={{
                    width: "100%",
                    height: 48,
                    border: "1.5px solid var(--border)",
                    borderRadius: 10,
                    padding: "0 14px",
                    fontSize: 16,
                    fontWeight: 600,
                    color: "var(--text)",
                    outline: "none",
                    background: "var(--white)",
                  }}
                />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    marginBottom: 8,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the claim…"
                  rows={3}
                  style={{
                    width: "100%",
                    border: "1.5px solid var(--border)",
                    borderRadius: 10,
                    padding: "12px 14px",
                    fontSize: 14,
                    color: "var(--text)",
                    outline: "none",
                    background: "var(--white)",
                    resize: "vertical",
                    fontFamily: "inherit",
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setStep(1)}
                  style={{
                    flex: 1,
                    padding: "13px",
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    color: "var(--text-muted)",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Back
                </button>
                <button
                  disabled={!amount || !description}
                  onClick={() => setStep(3)}
                  style={{
                    flex: 2,
                    padding: "13px",
                    background: amount && description ? "var(--primary)" : "var(--border)",
                    border: "none",
                    borderRadius: 10,
                    color: amount && description ? "#fff" : "var(--text-muted)",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: amount && description ? "pointer" : "not-allowed",
                  }}
                >
                  Review →
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 16 }}>
                Review your claim
              </p>
              <div
                style={{
                  background: "var(--bg)",
                  borderRadius: 12,
                  padding: "16px",
                  marginBottom: 20,
                }}
              >
                {[
                  { label: "Claim Type", value: type },
                  {
                    label: "Amount",
                    value: `₹${Number(amount).toLocaleString("en-IN")}`,
                  },
                  { label: "Description", value: description },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px 0",
                      borderBottom: label !== "Description" ? "1px solid var(--border)" : "none",
                    }}
                  >
                    <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", textAlign: "right", maxWidth: "60%" }}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 6,
                  padding: "10px 14px",
                  background: "var(--primary-light)",
                  borderRadius: 8,
                  marginBottom: 20,
                }}
              >
                <AlertCircle size={14} color="var(--primary)" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 12, color: "var(--primary)" }}>
                  By submitting, you confirm that all information provided is accurate and complete.
                </p>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setStep(2)}
                  style={{
                    flex: 1,
                    padding: "13px",
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    color: "var(--text-muted)",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  style={{
                    flex: 2,
                    padding: "13px",
                    background: "linear-gradient(135deg, var(--primary), var(--accent-dark))",
                    border: "none",
                    borderRadius: 10,
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Submit Claim
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ClaimsPage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div style={{ width: "100%" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 800,
              letterSpacing: "-0.04em",
              color: "var(--text)",
              marginBottom: 4,
            }}
          >
            My Claims
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
            {MY_CLAIMS.length} total claims
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "11px 20px",
            background: "linear-gradient(135deg, var(--primary), var(--accent-dark))",
            border: "none",
            borderRadius: 10,
            color: "#fff",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.opacity = "0.9")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.opacity = "1")
          }
        >
          <Plus size={16} />
          File a Claim
        </button>
      </div>

      {/* Summary cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          marginBottom: 24,
        }}
      >
        {[
          { label: "Total Claims", value: MY_CLAIMS.length, color: "var(--primary)", bg: "var(--primary-light)" },
          {
            label: "Approved",
            value: MY_CLAIMS.filter((c) => c.status === "Approved").length,
            color: "#059669",
            bg: "#ECFDF5",
          },
          {
            label: "Processing",
            value: MY_CLAIMS.filter((c) => c.status === "Processing").length,
            color: "#D97706",
            bg: "#FFFBEB",
          },
        ].map(({ label, value, color, bg }) => (
          <div
            key={label}
            style={{
              background: "var(--white)",
              border: "1px solid var(--border)",
              borderRadius: 14,
              padding: "16px 18px",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 10,
                height: 36,
                borderRadius: 5,
                background: color,
                flexShrink: 0,
              }}
            />
            <div>
              <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{label}</p>
              <p style={{ fontSize: 22, fontWeight: 800, color, letterSpacing: "-0.04em" }}>
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Claims list */}
      {MY_CLAIMS.map((claim) => (
        <ClaimCard key={claim.id} claim={claim} />
      ))}

      {MY_CLAIMS.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "60px 24px",
            color: "var(--text-muted)",
          }}
        >
          <p style={{ fontSize: 16, fontWeight: 600 }}>No claims yet</p>
          <p style={{ fontSize: 13 }}>File your first claim using the button above</p>
        </div>
      )}

      {showModal && <FileClaimModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
