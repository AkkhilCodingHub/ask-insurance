"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Wrench,
  HeartPulse,
  Phone,
  Navigation,
  Search,
  Filter,
  CheckCircle2,
  ExternalLink,
  Shield,
  Clock,
} from "lucide-react";

interface LocatorItem {
  id: string;
  type: "garage" | "hospital";
  name: string;
  category: string;
  city: string;
  address: string;
  phone: string;
  rating: number;
  distanceKm: number;
  insurers: string[];
  features: string[];
}

const LOCATOR_DATA: LocatorItem[] = [
  {
    id: "LOC-1",
    type: "garage",
    name: "Carnation Auto Care & Express Body Shop",
    category: "Authorized Multi-Brand Cashless Garage",
    city: "Delhi NCR",
    address: "Plot 12, Sector 18, Electronic City, Gurugram, Haryana - 122008",
    phone: "+91 98112 34567",
    rating: 4.8,
    distanceKm: 2.4,
    insurers: ["HDFC ERGO", "ICICI Lombard", "Tata AIG", "Bajaj Allianz", "Go Digit"],
    features: ["Zero Paperwork", "Free Towing < 10km", "6 Months Repair Warranty"],
  },
  {
    id: "LOC-2",
    type: "hospital",
    name: "Max Super Speciality Hospital",
    category: "NABH Accredited Multi-Speciality Network Hospital",
    city: "Delhi NCR",
    address: "1, 2, Press Enclave Marg, Saket, New Delhi - 110017",
    phone: "011 2651 5050",
    rating: 4.9,
    distanceKm: 3.8,
    insurers: ["Star Health", "Care Health", "HDFC ERGO Health", "Niva Bupa", "ICICI Lombard"],
    features: ["24x7 Emergency TPA Desk", "Cashless OPD & IPD", "Instant Pre-Auth"],
  },
  {
    id: "LOC-3",
    type: "garage",
    name: "GoMechanic Prime Workshop",
    category: "Cashless Claim Hub",
    city: "Delhi NCR",
    address: "B-44, Okhla Industrial Area Phase 1, New Delhi - 110020",
    phone: "+91 88001 99220",
    rating: 4.7,
    distanceKm: 4.5,
    insurers: ["HDFC ERGO", "Go Digit", "Reliance General", "SBI General"],
    features: ["Doorstep Inspection", "Free Sanitization", "Genuine OEM Parts"],
  },
  {
    id: "LOC-4",
    type: "hospital",
    name: "Fortis Memorial Research Institute (FMRI)",
    category: "Cashless Network Hospital",
    city: "Delhi NCR",
    address: "Sector 44, Opp. HUDA City Centre Metro, Gurugram - 122002",
    phone: "0124 496 2200",
    rating: 4.8,
    distanceKm: 5.2,
    insurers: ["Star Health", "Care Health", "Aditya Birla Health", "Tata AIG", "Niva Bupa"],
    features: ["Zero Out-of-Pocket on Room Rent", "Fast 30-min Discharge", "Green Channel TPA"],
  },
  {
    id: "LOC-5",
    type: "garage",
    name: "Mahindra First Choice Wheels & Service",
    category: "Multi-Brand Service Station",
    city: "Mumbai",
    address: "Andheri Kurla Road, Sakinaka, Andheri East, Mumbai - 400072",
    phone: "022 6691 0000",
    rating: 4.6,
    distanceKm: 3.1,
    insurers: ["ICICI Lombard", "Bajaj Allianz", "Tata AIG", "HDFC ERGO"],
    features: ["Dedicated Surveyor Desk", "Paint Booth Facility", "Fast Track Claim"],
  },
];

export default function LocatorPage() {
  const [activeTab, setActiveTab] = useState<"all" | "garage" | "hospital">("all");
  const [selectedCity, setSelectedCity] = useState("Delhi NCR");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInsurer, setSelectedInsurer] = useState("All");

  const filtered = LOCATOR_DATA.filter((item) => {
    if (activeTab !== "all" && item.type !== activeTab) return false;
    if (selectedCity !== "All" && item.city !== selectedCity) return false;
    if (selectedInsurer !== "All" && !item.insurers.includes(selectedInsurer)) return false;
    if (
      searchQuery &&
      !item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !item.address.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "40px 16px 80px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>
            <Link href="/" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Home</Link>
            <span>/</span>
            <span style={{ color: "var(--primary)", fontWeight: 600 }}>Network Locator</span>
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: "var(--text)", margin: 0 }}>
            Cashless Garages & Network Hospitals Locator
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)", margin: "6px 0 0" }}>
            Search over 10,000+ cashless network garages and 8,500+ cashless hospitals across India.
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div
          style={{
            background: "white",
            borderRadius: 16,
            border: "1px solid var(--border)",
            padding: 20,
            boxShadow: "0 4px 16px rgba(0,0,0,0.02)",
            marginBottom: 24,
          }}
        >
          {/* Top Tabs */}
          <div style={{ display: "flex", gap: 10, marginBottom: 18, borderBottom: "1px solid var(--border)", paddingBottom: 16 }}>
            {[
              { id: "all", label: "All Network Centers", icon: Shield },
              { id: "garage", label: "Cashless Garages (Motor)", icon: Wrench },
              { id: "hospital", label: "Network Hospitals (Health)", icon: HeartPulse },
            ].map((tab) => {
              const IconC = tab.icon;
              const isSel = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 20px",
                    borderRadius: 10,
                    border: isSel ? "1px solid var(--primary)" : "1px solid var(--border)",
                    background: isSel ? "var(--primary-light)" : "white",
                    color: isSel ? "var(--primary)" : "var(--text)",
                    fontWeight: isSel ? 700 : 500,
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  <IconC size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search inputs row */}
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: 14 }}>
            <div style={{ position: "relative" }}>
              <Search size={16} style={{ position: "absolute", left: 14, top: 13, color: "var(--text-muted)" }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by center name, locality, landmark..."
                style={{ width: "100%", padding: "10px 14px 10px 38px", borderRadius: 8, border: "1px solid var(--border)" }}
              />
            </div>

            <div>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "white" }}
              >
                <option value="Delhi NCR">Delhi NCR (Delhi, Noida, Gurgaon)</option>
                <option value="Mumbai">Mumbai / MMR</option>
                <option value="Bengaluru">Bengaluru</option>
                <option value="Chennai">Chennai</option>
                <option value="Hyderabad">Hyderabad</option>
                <option value="Pune">Pune</option>
                <option value="All">All Cities</option>
              </select>
            </div>

            <div>
              <select
                value={selectedInsurer}
                onChange={(e) => setSelectedInsurer(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "white" }}
              >
                <option value="All">All Partner Insurers</option>
                <option value="HDFC ERGO">HDFC ERGO</option>
                <option value="ICICI Lombard">ICICI Lombard</option>
                <option value="Star Health">Star Health</option>
                <option value="Care Health">Care Health</option>
                <option value="Tata AIG">Tata AIG</option>
                <option value="Go Digit">Go Digit</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {filtered.length === 0 ? (
            <div style={{ background: "white", padding: 40, borderRadius: 14, textAlign: "center", border: "1px solid var(--border)" }}>
              <MapPin size={40} style={{ color: "var(--text-light)", margin: "0 auto 12px" }} />
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 6px" }}>No network centers matched your search</h3>
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Try adjusting your insurer filter or searching for a nearby locality.</p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                style={{
                  background: "white",
                  borderRadius: 16,
                  border: "1px solid var(--border)",
                  padding: 24,
                  display: "grid",
                  gridTemplateColumns: "1fr 240px",
                  gap: 20,
                  alignItems: "center",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <span
                      style={{
                        background: item.type === "garage" ? "var(--primary-light)" : "var(--success-light)",
                        color: item.type === "garage" ? "var(--primary)" : "var(--success)",
                        padding: "3px 10px",
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 800,
                        textTransform: "uppercase",
                      }}
                    >
                      {item.type === "garage" ? "Cashless Garage" : "Network Hospital"}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--warning)", fontWeight: 700 }}>
                      ★ {item.rating} Rating
                    </span>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      • ~{item.distanceKm} km away
                    </span>
                  </div>

                  <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", margin: "0 0 4px" }}>
                    {item.name}
                  </h3>
                  <div style={{ fontSize: 13, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                    <MapPin size={14} style={{ color: "var(--primary)" }} />
                    {item.address}
                  </div>

                  {/* Insurers accepted */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>Cashless In:</span>
                    {item.insurers.map((ins, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: 11,
                          background: "var(--bg)",
                          border: "1px solid var(--border)",
                          padding: "2px 8px",
                          borderRadius: 6,
                          color: "var(--text)",
                          fontWeight: 600,
                        }}
                      >
                        {ins}
                      </span>
                    ))}
                  </div>

                  {/* Features */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                    {item.features.map((f, i) => (
                      <span key={i} style={{ fontSize: 12, color: "var(--success)", display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 600 }}>
                        <CheckCircle2 size={13} /> {f}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right Action buttons */}
                <div style={{ borderLeft: "1px solid var(--border)", paddingLeft: 20, textAlign: "right", display: "flex", flexDirection: "column", gap: 10 }}>
                  <a
                    href={`tel:${item.phone.replace(/\s/g, "")}`}
                    style={{
                      padding: "10px 16px",
                      background: "var(--primary)",
                      color: "white",
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 700,
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <Phone size={14} /> Call Helpline
                  </a>

                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${item.name} ${item.address}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: "10px 16px",
                      background: "white",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--text)",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <Navigation size={14} /> Get Directions
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
