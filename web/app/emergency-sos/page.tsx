"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  PhoneCall,
  Truck,
  HeartPulse,
  Wrench,
  BatteryCharging,
  Fuel,
  Key,
  Shield,
  MapPin,
  CheckCircle2,
  Navigation,
} from "lucide-react";

export default function EmergencySosPage() {
  const [sosTriggered, setSosTriggered] = useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(null);

  const handleTriggerSOS = (serviceName: string) => {
    setSelectedService(serviceName);
    setSosTriggered(true);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "40px 16px 80px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        {/* Header Breadcrumbs */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
          <Link href="/" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Home</Link>
          <span>/</span>
          <span style={{ color: "var(--error)", fontWeight: 700 }}>24x7 Emergency SOS</span>
        </div>

        {/* Big Alert Card */}
        <div
          style={{
            background: "linear-gradient(135deg, #DC2626 0%, #991B1B 100%)",
            borderRadius: 20,
            padding: "36px 32px",
            color: "white",
            boxShadow: "0 12px 36px rgba(220,38,38,0.25)",
            marginBottom: 36,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 20,
          }}
        >
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.2)", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 800, textTransform: "uppercase" }}>
              <AlertTriangle size={15} /> 24/7 Roadside Assistance & Emergency Response
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 900, margin: "12px 0 6px" }}>
              Emergency SOS & Instant Towing Desk
            </h1>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.9)", margin: 0, maxWidth: 560, lineHeight: 1.5 }}>
              Stranded on the highway, met with an accident, or need an emergency medical ambulance? We dispatch instant assistance with live GPS tracking.
            </p>
          </div>

          <a
            href="tel:18002099090"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "16px 28px",
              background: "white",
              color: "#DC2626",
              borderRadius: 14,
              fontSize: 16,
              fontWeight: 900,
              textDecoration: "none",
              boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
            }}
          >
            <PhoneCall size={22} /> Call Toll-Free: 1800-209-9090
          </a>
        </div>

        {/* Modal / Alert confirmation when SOS is triggered */}
        {sosTriggered && (
          <div
            style={{
              background: "white",
              borderRadius: 16,
              border: "2px solid var(--success)",
              padding: 24,
              marginBottom: 32,
              boxShadow: "0 6px 24px rgba(5,150,105,0.15)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "var(--success-light)",
                  color: "var(--success)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CheckCircle2 size={28} />
              </div>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: "var(--text)", margin: "0 0 2px" }}>
                  Emergency SOS Dispatched for {selectedService}!
                </h3>
                <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
                  Nearest recovery vehicle assigned. Estimated Arrival: <strong>14 Minutes</strong>. Our incident manager is calling your phone now.
                </p>
              </div>
            </div>
            <button
              onClick={() => setSosTriggered(false)}
              style={{
                padding: "8px 16px",
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Emergency Services Grid */}
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", marginBottom: 16 }}>
          Select Required On-Spot Assistance
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18, marginBottom: 36 }}>
          {[
            {
              id: "towing",
              name: "Accident / Breakdown Towing",
              desc: "Flatbed or hydraulic crane towing to the nearest cashless garage.",
              icon: Truck,
              eta: "15 - 25 Mins",
            },
            {
              id: "ambulance",
              name: "Emergency Medical Ambulance",
              desc: "Immediate ALS/BLS paramedic transport to nearest NABH trauma center.",
              icon: HeartPulse,
              eta: "10 - 15 Mins",
            },
            {
              id: "flat_tyre",
              name: "Flat Tyre / Puncture Replacement",
              desc: "Technician dispatched to replace stepney or repair puncture on-site.",
              icon: Wrench,
              eta: "20 Mins",
            },
            {
              id: "battery",
              name: "Battery Jumpstart & Boost",
              desc: "Instant jumpstart cables and battery health diagnostic check.",
              icon: BatteryCharging,
              eta: "20 Mins",
            },
            {
              id: "fuel",
              name: "Emergency Fuel Delivery (5L)",
              desc: "Petrol or diesel delivery directly to your stalled location.",
              icon: Fuel,
              eta: "25 Mins",
            },
            {
              id: "lockout",
              name: "Key Lockout / Lost Key Assistance",
              desc: "Safe retrieval of locked keys or dispatch of authorized locksmith.",
              icon: Key,
              eta: "30 Mins",
            },
          ].map((item) => {
            const IconC = item.icon;
            return (
              <div
                key={item.id}
                style={{
                  background: "white",
                  padding: 24,
                  borderRadius: 16,
                  border: "1px solid var(--border)",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: "var(--primary-light)",
                        color: "var(--primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <IconC size={22} />
                    </div>
                    <span style={{ fontSize: 11, background: "var(--bg)", padding: "3px 8px", borderRadius: 6, fontWeight: 700, color: "var(--text-muted)" }}>
                      ETA: {item.eta}
                    </span>
                  </div>

                  <h3 style={{ fontSize: 17, fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>
                    {item.name}
                  </h3>
                  <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.4, margin: "0 0 20px" }}>
                    {item.desc}
                  </p>
                </div>

                <button
                  onClick={() => handleTriggerSOS(item.name)}
                  style={{
                    width: "100%",
                    padding: "10px 16px",
                    background: "var(--error)",
                    color: "white",
                    border: "none",
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                    boxShadow: "0 2px 10px rgba(220,38,38,0.25)",
                  }}
                >
                  Request {item.name.split(" ")[0]} Now →
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
