export const APP_NAME = "ASK Insurance";
export const APP_TAGLINE = "Insurance that actually works for you";
export const APP_DESCRIPTION =
  "Compare 38+ insurers, get instant quotes, and buy in minutes. No agents, no paperwork, no confusion.";

export const INSURANCE_CATEGORIES = [
  { key: "life", label: "Life", desc: "Term & ULIP plans", icon: "heart" },
  { key: "health", label: "Health", desc: "Family & individual", icon: "activity" },
  { key: "motor", label: "Motor", desc: "Car & two-wheeler", icon: "car" },
  { key: "home", label: "Home", desc: "Property protection", icon: "home" },
  { key: "travel", label: "Travel", desc: "Domestic & international", icon: "plane" },
  { key: "business", label: "Business", desc: "SME & corporate", icon: "briefcase" },
] as const;

export const COVER_AMOUNTS = [
  { label: "₹25 Lakh", value: 2500000 },
  { label: "₹50 Lakh", value: 5000000 },
  { label: "₹1 Crore", value: 10000000 },
  { label: "₹2 Crore", value: 20000000 },
];

export const PLATFORM_STATS = [
  { value: "2.4L+", label: "Policies Sold" },
  { value: "₹840Cr", label: "Claims Settled" },
  { value: "38+", label: "Insurer Partners" },
  { value: "4.8★", label: "Customer Rating" },
];

export const NAV_LINKS = ["Products", "Compare", "Claims", "About", "Contact"];
