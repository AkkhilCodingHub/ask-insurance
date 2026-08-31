"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  Car,
  Bike,
  Truck,
  HeartPulse,
  Home as HomeIcon,
  Plane,
  TrendingUp,
  Bot,
  Shield,
  DollarSign,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sliders,
  ChevronRight,
  Layers,
} from "lucide-react";
import { useAuth } from "@/context/auth";

const INSURANCE_TYPES = [
  { id: "motor", label: "Car Insurance", icon: Car, desc: "Reg lookup, NCB discount & 12+ add-ons", category: "General", badge: "Instant" },
  { id: "two_wheeler", label: "Two Wheeler", icon: Bike, desc: "Quick bike & scooter quote & renewal", category: "General", badge: "Popular" },
  { id: "commercial", label: "Commercial Vehicle", icon: Truck, desc: "Heavy & light goods transport", category: "General" },
  { id: "health", label: "Health Insurance", icon: HeartPulse, desc: "1 Cr cover, OPD & 0% Copay", category: "General", badge: "Top Rated" },
  { id: "home", label: "Home Insurance", icon: HomeIcon, desc: "Structure, contents & fire protection", category: "General" },
  { id: "travel", label: "Travel Insurance", icon: Plane, desc: "Schengen, USA & worldwide coverage", category: "General" },
  { id: "investment_20", label: "Investment 2.0", icon: TrendingUp, desc: "Modern tax-free savings & high returns", category: "Life", badge: "New" },
  { id: "nivesh_mitra", label: "PBP Nivesh Mitra", icon: Bot, desc: "AI-guided retirement & wealth planner", category: "Life", badge: "AI" },
  { id: "life", label: "Term Online", icon: Shield, desc: "Pure life protection with zero hassle", category: "Life", badge: "Essential" },
  { id: "dollar_invest", label: "Dollar Investment", icon: DollarSign, desc: "Global portfolio in USD currency", category: "Life" },
];

const CAR_CATALOG = [
  { make: "Maruti Suzuki", model: "Swift", variant: "ZXi (Petrol)", cc: "1197 CC", idv: 650000, basePrem: 8450 },
  { make: "Hyundai", model: "Creta", variant: "SX (O) (Diesel)", cc: "1493 CC", idv: 1420000, basePrem: 17800 },
  { make: "Tata", model: "Nexon", variant: "XZ Plus (Petrol)", cc: "1199 CC", idv: 980000, basePrem: 11900 },
  { make: "Mahindra", model: "XUV700", variant: "AX7 (Diesel)", cc: "2198 CC", idv: 1850000, basePrem: 23400 },
  { make: "Kia", model: "Seltos", variant: "HTX (Petrol)", cc: "1497 CC", idv: 1250000, basePrem: 14800 },
];

const ADDONS = [
  { id: "zero_dep", name: "Zero Depreciation Cover", price: 2800, desc: "100% claim settlement on metal & plastic parts" },
  { id: "rsa", name: "24x7 Roadside Assistance", price: 850, desc: "Free towing, flat tyre fix & emergency jumpstart" },
  { id: "engine_protect", name: "Engine & Gearbox Protection", price: 1950, desc: "Covers water ingress & hydrostatic lock repairs" },
  { id: "consumables", name: "Consumables Cover", price: 1100, desc: "Covers engine oil, coolants, nuts & bolts" },
  { id: "tyre_secure", name: "Tyre & Rim Secure", price: 1450, desc: "Replacement cost for cut or damaged tyres" },
  { id: "return_to_invoice", name: "Return to Invoice (RTI)", price: 2400, desc: "Get full ex-showroom price in total loss/theft" },
];

const SAMPLE_PLANS = [
  {
    id: "plan-hdfc",
    insurer: "HDFC ERGO",
    planName: "Optima Secure / Motor Protect",
    logo: "🛡️",
    rating: 4.8,
    csr: "99.1% Claim Settlement",
    garages: "9,800+ Cashless Garages",
    price: 11450,
    features: ["Zero Inspection", "Instant Digital Policy", "Paperless Claims"],
  },
  {
    id: "plan-icici",
    insurer: "ICICI Lombard",
    planName: "Elevate Complete Shield",
    logo: "⭐",
    rating: 4.7,
    csr: "98.7% Claim Settlement",
    garages: "10,200+ Cashless Garages",
    price: 10990,
    features: ["Doorstep Repair Service", "24x7 Claim Support", "No Claim Bonus Shield"],
  },
  {
    id: "plan-tata",
    insurer: "Tata AIG",
    planName: "Auto Secure Elite",
    logo: "💎",
    rating: 4.9,
    csr: "99.4% Claim Settlement",
    garages: "8,900+ Cashless Garages",
    price: 12150,
    features: ["Free Pickup & Drop", "Warranty on Repairs", "Personal Accident 15L"],
  },
  {
    id: "plan-digit",
    insurer: "Go Digit",
    planName: "On-the-Go Smart Plan",
    logo: "🚀",
    rating: 4.6,
    csr: "97.9% Claim Settlement",
    garages: "7,500+ Cashless Garages",
    price: 9890,
    features: ["Self-Inspection in 7 Mins", "Zero Hardcopy", "Fast Payouts"],
  },
];

export default function QuotePage() {
  return (
    <Suspense fallback={<div style={{ padding: "80px 20px", textAlign: "center" }}>Loading Quote Engine...</div>}>
      <QuoteContent />
    </Suspense>
  );
}

function QuoteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const prefilledType = searchParams.get("type") || "motor";

  const [step, setStep] = useState(1);
  const [insuranceType, setInsuranceType] = useState(prefilledType);
  const [regNumber, setRegNumber] = useState("");
  const [vehicleData, setVehicleData] = useState<any>(null);
  const [idv, setIdv] = useState(0);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [customerName, setCustomerName] = useState(user?.name || "");
  const [customerPhone, setCustomerPhone] = useState(user?.phone || "");
  const [sortBy, setSortBy] = useState<"price_asc" | "rating" | "csr">("price_asc");

  // Sum total addons cost
  const addonsCost = useMemo(() => {
    return selectedAddons.reduce((sum, id) => {
      const addon = ADDONS.find((a) => a.id === id);
      return sum + (addon?.price || 0);
    }, 0);
  }, [selectedAddons]);

  const toggleAddon = (id: string) => {
    setSelectedAddons((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleLookupReg = () => {
    const clean = regNumber.toUpperCase().replace(/\s/g, "");
    const hash = clean.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const chosen = CAR_CATALOG[hash % CAR_CATALOG.length];
    setVehicleData(chosen);
    setIdv(chosen.idv);
    setStep(2);
  };

  return (
    <>
      <Navbar />
      <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "40px 16px 80px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Header Breadcrumbs */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>
              <Link href="/" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Home</Link>
              <span>/</span>
              <span style={{ color: "var(--primary)", fontWeight: 600 }}>Get Instant Quote</span>
            </div>
            <h1 style={{ fontSize: 30, fontWeight: 800, color: "var(--text)", margin: 0, letterSpacing: "-0.5px" }}>
              Instant Insurance Quote & Comparison
            </h1>
          </div>
          <Link
            href="/my-quotes"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "9px 18px",
              background: "white",
              border: "1px solid var(--border)",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              color: "var(--primary)",
              textDecoration: "none",
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
            }}
          >
            <Layers size={16} />
            View Saved Quotes
          </Link>
        </div>

        {/* Progress Stepper */}
        <div
          style={{
            background: "white",
            padding: "18px 28px",
            borderRadius: 16,
            border: "1px solid var(--border)",
            marginBottom: 32,
            boxShadow: "0 4px 16px rgba(21,128,255,0.04)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "relative",
          }}
        >
          {[
            { num: 1, label: "Select Insurance Type" },
            { num: 2, label: "Vehicle & Personal Details" },
            { num: 3, label: "Customize IDV & Add-ons" },
            { num: 4, label: "Compare & Buy" },
          ].map((s, idx) => (
            <div
              key={s.num}
              onClick={() => step > s.num && setStep(s.num)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                cursor: step > s.num ? "pointer" : "default",
                opacity: step >= s.num ? 1 : 0.45,
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: step > s.num ? "var(--success)" : step === s.num ? "var(--primary)" : "var(--border)",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 14,
                  boxShadow: step === s.num ? "0 0 12px rgba(21,128,255,0.4)" : "none",
                }}
              >
                {step > s.num ? "✓" : s.num}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: step === s.num ? "var(--primary)" : "var(--text)" }}>
                  Step {s.num}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.label}</div>
              </div>
              {idx < 3 && (
                <ChevronRight size={18} style={{ color: "var(--border)", marginLeft: 16 }} />
              )}
            </div>
          ))}
        </div>

        {/* STEP 1: Insurance Type Selection */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", marginBottom: 16 }}>
              Choose What You Want to Protect
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16, marginBottom: 32 }}>
              {INSURANCE_TYPES.map((item) => {
                const IconComponent = item.icon;
                const isSelected = insuranceType === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setInsuranceType(item.id);
                    }}
                    style={{
                      background: isSelected ? "var(--primary-light)" : "white",
                      border: isSelected ? "2px solid var(--primary)" : "1px solid var(--border)",
                      borderRadius: 14,
                      padding: 20,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      position: "relative",
                      boxShadow: isSelected ? "0 8px 24px rgba(21,128,255,0.15)" : "0 2px 8px rgba(0,0,0,0.02)",
                    }}
                  >
                    {item.badge && (
                      <span
                        style={{
                          position: "absolute",
                          top: 12,
                          right: 12,
                          background: isSelected ? "var(--primary)" : "rgba(21,128,255,0.1)",
                          color: isSelected ? "white" : "var(--primary)",
                          padding: "2px 8px",
                          borderRadius: 20,
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: "uppercase",
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: isSelected ? "var(--primary)" : "var(--primary-light)",
                        color: isSelected ? "white" : "var(--primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 14,
                      }}
                    >
                      <IconComponent size={24} />
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.4 }}>
                      {item.desc}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setStep(2)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "14px 32px",
                  background: "var(--primary)",
                  color: "white",
                  border: "none",
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 16px rgba(21,128,255,0.35)",
                }}
              >
                Proceed to Details
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Details & Lookup */}
        {step === 2 && (
          <div style={{ background: "white", borderRadius: 16, border: "1px solid var(--border)", padding: 32, boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>
              {insuranceType === "motor" || insuranceType === "two_wheeler" || insuranceType === "commercial"
                ? "Enter Vehicle Registration Number"
                : "Personal & Coverage Requirements"}
            </h2>
            <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 28 }}>
              We fetch instant RTO records, previous policy details, and eligible No Claim Bonus (NCB).
            </p>

            {(insuranceType === "motor" || insuranceType === "two_wheeler" || insuranceType === "commercial") ? (
              <div style={{ maxWidth: 580 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
                  Vehicle Number (e.g. DL-01-AB-1234 or HR-26-DQ-5501)
                </label>
                <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                  <input
                    type="text"
                    value={regNumber}
                    onChange={(e) => setRegNumber(e.target.value.toUpperCase())}
                    placeholder="Enter Registration No."
                    style={{
                      flex: 1,
                      padding: "14px 18px",
                      fontSize: 16,
                      fontWeight: 700,
                      letterSpacing: "1px",
                      borderRadius: 10,
                      border: "2px solid var(--primary-glow)",
                      outline: "none",
                      textTransform: "uppercase",
                    }}
                  />
                  <button
                    onClick={handleLookupReg}
                    style={{
                      padding: "14px 24px",
                      background: "var(--primary)",
                      color: "white",
                      border: "none",
                      borderRadius: 10,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Fetch Details
                  </button>
                </div>

                {/* Auto detected card preview */}
                <div style={{ background: "var(--bg)", padding: 20, borderRadius: 12, border: "1px solid var(--border)", marginBottom: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Detected Vehicle Profile
                    </span>
                    <span style={{ fontSize: 12, background: "var(--success-light)", color: "var(--success)", padding: "2px 8px", borderRadius: 6, fontWeight: 700 }}>
                      Verified RTO Record
                    </span>
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>
                    {vehicleData.make} {vehicleData.model} — {vehicleData.variant}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)", display: "flex", gap: 16 }}>
                    <span>Engine: {vehicleData.cc}</span>
                    <span>•</span>
                    <span>Fuel: Petrol</span>
                    <span>•</span>
                    <span>Reg Year: 2022</span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, maxWidth: 650, marginBottom: 24 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Full Name</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    style={{ width: "100%", padding: "12px 16px", borderRadius: 8, border: "1px solid var(--border)" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Phone Number</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    style={{ width: "100%", padding: "12px 16px", borderRadius: 8, border: "1px solid var(--border)" }}
                  />
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32, borderTop: "1px solid var(--border)", paddingTop: 24 }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 24px",
                  background: "transparent",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <ArrowLeft size={16} /> Back
              </button>
              <button
                onClick={() => setStep(3)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 28px",
                  background: "var(--primary)",
                  color: "white",
                  border: "none",
                  borderRadius: 10,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Customize Add-ons & IDV <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Customize IDV & Add-ons */}
        {step === 3 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 28 }}>
            {/* Left: IDV & Addon Selection */}
            <div>
              {/* IDV Slider Card */}
              <div style={{ background: "white", padding: 28, borderRadius: 16, border: "1px solid var(--border)", marginBottom: 24, boxShadow: "0 4px 16px rgba(0,0,0,0.02)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", margin: 0 }}>
                      Vehicle Insured Declared Value (IDV)
                    </h3>
                    <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "4px 0 0" }}>
                      Current market value of your vehicle in case of total loss or theft.
                    </p>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: "var(--primary)" }}>
                    ₹{idv.toLocaleString("en-IN")}
                  </div>
                </div>

                <input
                  type="range"
                  min={Math.round(vehicleData.idv * 0.8)}
                  max={Math.round(vehicleData.idv * 1.2)}
                  step={10000}
                  value={idv}
                  onChange={(e) => setIdv(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "var(--primary)", cursor: "pointer", marginTop: 8 }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
                  <span>Min: ₹{Math.round(vehicleData.idv * 0.8).toLocaleString("en-IN")}</span>
                  <span style={{ fontWeight: 700, color: "var(--success)" }}>Recommended: ₹{vehicleData.idv.toLocaleString("en-IN")}</span>
                  <span>Max: ₹{Math.round(vehicleData.idv * 1.2).toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Addons Grid */}
              <div style={{ background: "white", padding: 28, borderRadius: 16, border: "1px solid var(--border)", boxShadow: "0 4px 16px rgba(0,0,0,0.02)" }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>
                  Select Recommended Add-on Covers
                </h3>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
                  Add extra protective layers for zero out-of-pocket expenses during claims.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
                  {ADDONS.map((addon) => {
                    const isChecked = selectedAddons.includes(addon.id);
                    return (
                      <div
                        key={addon.id}
                        onClick={() => toggleAddon(addon.id)}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "16px 20px",
                          borderRadius: 12,
                          border: isChecked ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                          background: isChecked ? "var(--primary-light)" : "white",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            style={{ width: 18, height: 18, accentColor: "var(--primary)", cursor: "pointer" }}
                          />
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{addon.name}</div>
                            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{addon.desc}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", whiteSpace: "nowrap" }}>
                          + ₹{addon.price.toLocaleString("en-IN")}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Real-time Premium Summary Sidebar */}
            <div>
              <div
                style={{
                  background: "white",
                  borderRadius: 16,
                  border: "1px solid var(--border)",
                  padding: 24,
                  position: "sticky",
                  top: 90,
                  boxShadow: "0 8px 28px rgba(0,0,0,0.04)",
                }}
              >
                <h4 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", marginBottom: 16, borderBottom: "1px solid var(--border)", paddingBottom: 12 }}>
                  Premium Calculation Summary
                </h4>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 10 }}>
                  <span style={{ color: "var(--text-muted)" }}>Base OD Premium:</span>
                  <span style={{ fontWeight: 600 }}>₹{Math.round(idv * 0.018).toLocaleString("en-IN")}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 10 }}>
                  <span style={{ color: "var(--text-muted)" }}>Mandatory TP Cover:</span>
                  <span style={{ fontWeight: 600 }}>₹3,416</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 10 }}>
                  <span style={{ color: "var(--success)" }}>NCB Discount ({ncb}%):</span>
                  <span style={{ color: "var(--success)", fontWeight: 700 }}>
                    - ₹{Math.round(idv * 0.018 * (ncb / 100)).toLocaleString("en-IN")}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 12 }}>
                  <span style={{ color: "var(--text-muted)" }}>Add-ons ({selectedAddons.length}):</span>
                  <span style={{ fontWeight: 600 }}>+ ₹{addonsCost.toLocaleString("en-IN")}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 16, borderTop: "1px dashed var(--border)", paddingTop: 12 }}>
                  <span style={{ color: "var(--text-muted)" }}>GST (18%):</span>
                  <span style={{ fontWeight: 600 }}>
                    ₹{Math.round((idv * 0.018 * (1 - ncb / 100) + 3416 + addonsCost) * 0.18).toLocaleString("en-IN")}
                  </span>
                </div>

                <div
                  style={{
                    background: "var(--primary-light)",
                    padding: 16,
                    borderRadius: 12,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 20,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--primary-dark)", textTransform: "uppercase" }}>
                      Estimated Total Premium
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: "var(--primary)" }}>
                      ₹{Math.round((idv * 0.018 * (1 - ncb / 100) + 3416 + addonsCost) * 1.18).toLocaleString("en-IN")}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, background: "white", padding: "4px 8px", borderRadius: 6, fontWeight: 700, color: "var(--text)" }}>
                    / year
                  </span>
                </div>

                <button
                  onClick={() => setStep(4)}
                  style={{
                    width: "100%",
                    padding: "14px",
                    background: "var(--primary)",
                    color: "white",
                    border: "none",
                    borderRadius: 12,
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 4px 16px rgba(21,128,255,0.35)",
                    marginBottom: 10,
                  }}
                >
                  View Insurer Quotes
                </button>

                <button
                  onClick={() => setStep(2)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    background: "transparent",
                    border: "none",
                    color: "var(--text-muted)",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  ← Edit Details
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Quotes Comparison & Buy */}
        {step === 4 && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", margin: 0 }}>
                  Compare Plans for {vehicleData.make} {vehicleData.model}
                </h2>
                <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "4px 0 0" }}>
                  IDV: ₹{idv.toLocaleString("en-IN")} • {selectedAddons.length} Add-ons Selected • NCB: {ncb}%
                </p>
              </div>

              {/* Sort By */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: "white",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  <option value="price_asc">Lowest Premium</option>
                  <option value="rating">Highest Rated</option>
                  <option value="csr">Claim Settlement Ratio</option>
                </select>
              </div>
            </div>

            {/* Plan Cards List */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 40 }}>
              {SAMPLE_PLANS.map((plan) => {
                const totalPlanPrice = plan.price + addonsCost;
                return (
                  <div
                    key={plan.id}
                    style={{
                      background: "white",
                      borderRadius: 16,
                      border: "1px solid var(--border)",
                      padding: 24,
                      display: "grid",
                      gridTemplateColumns: "240px 1fr 200px",
                      alignItems: "center",
                      gap: 24,
                      boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
                      transition: "transform 0.15s ease, box-shadow 0.15s ease",
                    }}
                  >
                    {/* Insurer Info */}
                    <div style={{ borderRight: "1px solid var(--border)", paddingRight: 20 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        <span style={{ fontSize: 24 }}>{plan.logo}</span>
                        <div>
                          <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text)" }}>{plan.insurer}</div>
                          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{plan.planName}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
                        <span style={{ background: "var(--warning-light)", color: "var(--warning)", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                          ★ {plan.rating}
                        </span>
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>({plan.csr})</span>
                      </div>
                    </div>

                    {/* Features & Coverage */}
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase" }}>
                        Coverage Highlights
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                        {plan.features.map((f, i) => (
                          <span
                            key={i}
                            style={{
                              background: "var(--bg)",
                              border: "1px solid var(--border)",
                              borderRadius: 8,
                              padding: "4px 10px",
                              fontSize: 12,
                              fontWeight: 600,
                              color: "var(--text)",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <CheckCircle2 size={13} style={{ color: "var(--success)" }} />
                            {f}
                          </span>
                        ))}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--primary)", fontWeight: 600 }}>
                        📍 {plan.garages} across India
                      </div>
                    </div>

                    {/* Pricing & CTA */}
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase" }}>Net Premium</div>
                      <div style={{ fontSize: 26, fontWeight: 900, color: "var(--primary)", lineHeight: 1.2 }}>
                        ₹{totalPlanPrice.toLocaleString("en-IN")}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 14 }}>+ 18% GST (Includes Addons)</div>

                      <button
                        onClick={() => {
                          router.push(
                            `/buy-policy?planId=${plan.id}&insurer=${encodeURIComponent(plan.insurer)}&price=${totalPlanPrice}&idv=${idv}&reg=${regNumber}`
                          );
                        }}
                        style={{
                          width: "100%",
                          padding: "12px 18px",
                          background: "var(--primary)",
                          color: "white",
                          border: "none",
                          borderRadius: 10,
                          fontSize: 14,
                          fontWeight: 700,
                          cursor: "pointer",
                          boxShadow: "0 4px 14px rgba(21,128,255,0.3)",
                        }}
                      >
                        Buy Now →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button
                onClick={() => setStep(3)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 24px",
                  background: "white",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <ArrowLeft size={16} /> Modify Add-ons & IDV
              </button>
              <Link
                href="/compare"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 24px",
                  background: "white",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text)",
                  textDecoration: "none",
                }}
              >
                <Sliders size={16} /> Detailed Side-by-Side Comparison
              </Link>
            </div>
          </div>
        )}
        </div>
      </div>
      <Footer />
    </>
  );
}
