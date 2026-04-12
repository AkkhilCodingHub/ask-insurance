import { Briefcase, Car, Heart, Home, Plane, Shield } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type Product = {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  tagline: string;
  desc: string;
  highlights: string[];
  plans: string;
};

export const PRODUCTS: Product[] = [
  {
    id: "life",
    label: "Life Insurance",
    icon: Shield,
    color: "#1580FF",
    bg: "#E8F2FF",
    tagline: "Protect your family's future",
    desc: "Pure term plans, whole life, and ULIPs from India's top insurers. Starting at ₹7,000/year for ₹1 Crore cover.",
    highlights: ["Cover up to ₹5 Crore", "Tax benefit under Sec 80C", "Accidental death rider", "Critical illness add-on"],
    plans: "12 plans available",
  },
  {
    id: "health",
    label: "Health Insurance",
    icon: Heart,
    color: "#059669",
    bg: "#ECFDF5",
    tagline: "Cashless treatment at 10,000+ hospitals",
    desc: "Individual, family floater, and senior citizen plans. Comprehensive coverage including OPD, maternity and day-care.",
    highlights: ["Sum insured up to ₹1 Crore", "Restoration benefit", "No-claim bonus", "Cashless network"],
    plans: "18 plans available",
  },
  {
    id: "motor",
    label: "Motor Insurance",
    icon: Car,
    color: "#0891B2",
    bg: "#E0F7FF",
    tagline: "Comprehensive cover for your vehicle",
    desc: "Third-party liability, own damage, and comprehensive plans for cars and two-wheelers. Instant policy issuance.",
    highlights: ["Zero depreciation add-on", "Roadside assistance 24×7", "Cashless garages 4,000+", "Engine protection"],
    plans: "9 plans available",
  },
  {
    id: "travel",
    label: "Travel Insurance",
    icon: Plane,
    color: "#D97706",
    bg: "#FFFBEB",
    tagline: "Travel the world without worries",
    desc: "Single trip, multi-trip, and student travel plans. Medical emergencies, trip cancellation, and baggage loss covered.",
    highlights: ["Medical cover up to $5,00,000", "Trip cancellation cover", "Baggage loss & delay", "Passport loss assistance"],
    plans: "6 plans available",
  },
  {
    id: "home",
    label: "Home Insurance",
    icon: Home,
    color: "#7C3AED",
    bg: "#F5F3FF",
    tagline: "Protect your most valuable asset",
    desc: "Structure, contents, and comprehensive home insurance. Covers fire, flood, earthquake, burglary and more.",
    highlights: ["Structure & contents cover", "Earthquake & flood", "Burglary protection", "Temporary accommodation"],
    plans: "5 plans available",
  },
  {
    id: "business",
    label: "Business Insurance",
    icon: Briefcase,
    color: "#DC2626",
    bg: "#FEF2F2",
    tagline: "Keep your business running",
    desc: "Fire & burglary, liability, marine cargo, and workmen compensation plans for SMEs and enterprises.",
    highlights: ["Fire & allied perils", "Public liability cover", "Marine cargo", "Workmen compensation"],
    plans: "8 plans available",
  },
];

export function getProductById(id: string) {
  return PRODUCTS.find((product) => product.id === id);
}
