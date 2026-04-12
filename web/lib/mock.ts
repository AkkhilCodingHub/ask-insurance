export interface Plan {
  id: string;
  insurer: string;
  short: string;
  color: string;
  plan: string;
  category: "Life" | "Health" | "Motor" | "Travel" | "Home";
  premium: string;
  cover: string;
  claims: string;
  badge?: string;
  features: string[];
  description: string;
  documents: string[];
  waiting: string;
  tenure: string;
}

export interface Policy {
  id: string;
  planId: string;
  planName: string;
  insurer: string;
  category: "Life" | "Health" | "Motor" | "Travel" | "Home";
  premium: string;
  cover: string;
  status: "Active" | "Expired" | "Pending";
  renewalDate: string;
  color: string;
}

export interface Claim {
  id: string;
  claimNo: string;
  description: string;
  insurer: string;
  planId: string;
  amount: number;
  date: string;
  status: "Approved" | "Processing" | "Rejected" | "Settled";
}

export const PLANS: Plan[] = [
  {
    id: "lic-tech-term",
    insurer: "LIC of India",
    short: "LIC",
    color: "#1580FF",
    plan: "LIC Tech Term",
    category: "Life",
    premium: "₹8,200/yr",
    cover: "₹1 Crore",
    claims: "98.5%",
    badge: "Most Popular",
    features: [
      "Pure term plan online",
      "Death benefit — lump sum payout",
      "Accidental death rider available",
      "Tax benefit under Sec 80C & 10(10D)",
      "Flexible premium payment terms",
    ],
    description:
      "LIC Tech Term is a pure online term insurance plan offering high life cover at affordable premiums. Backed by India's most trusted insurer with 98.5% claim settlement ratio.",
    documents: [
      "Aadhaar / PAN card",
      "Address proof",
      "Income proof (last 3 months salary slip or ITR)",
      "Recent passport photo",
    ],
    waiting: "No waiting period",
    tenure: "10 – 40 years",
  },
  {
    id: "hdfc-click2protect",
    insurer: "HDFC Life",
    short: "HDFC",
    color: "#E11D48",
    plan: "HDFC Click 2 Protect",
    category: "Life",
    premium: "₹9,100/yr",
    cover: "₹1 Crore",
    claims: "99.1%",
    badge: "Best Claims",
    features: [
      "Highest claim settlement ratio in India",
      "Critical illness benefit add-on",
      "Waiver of premium on disability",
      "Return of premium option available",
      "Joint life cover option",
    ],
    description:
      "HDFC Life Click 2 Protect is a comprehensive online term plan with industry-leading 99.1% claim settlement ratio and flexible coverage options for every life stage.",
    documents: [
      "Aadhaar / PAN card",
      "Address proof",
      "Income proof",
      "Recent passport photo",
      "Medical reports if applicable",
    ],
    waiting: "No waiting period",
    tenure: "5 – 40 years",
  },
  {
    id: "star-comprehensive",
    insurer: "Star Health",
    short: "Star",
    color: "#059669",
    plan: "Star Health Comprehensive",
    category: "Health",
    premium: "₹12,400/yr",
    cover: "₹5 Lakh",
    claims: "94.4%",
    badge: undefined,
    features: [
      "Cashless at 10,000+ hospitals",
      "No pre-policy medical check-up up to 45 yrs",
      "Restoration of sum insured",
      "Day-care procedures covered",
      "OPD consultation covered",
      "Maternity & newborn cover",
    ],
    description:
      "Star Health Comprehensive offers all-round health protection with cashless claims at 10,000+ network hospitals, wellness benefits, and annual sum insured restoration.",
    documents: [
      "Aadhaar / PAN card",
      "Address proof",
      "Age proof",
      "Passport photo",
    ],
    waiting: "30 days general, 1–2 yrs specific diseases",
    tenure: "1 year (renewable)",
  },
  {
    id: "icici-complete-health",
    insurer: "ICICI Lombard",
    short: "ICICI",
    color: "#7C3AED",
    plan: "ICICI Lombard Complete Health",
    category: "Health",
    premium: "₹11,800/yr",
    cover: "₹5 Lakh",
    claims: "93.8%",
    badge: "Trending",
    features: [
      "5,000+ cashless network hospitals",
      "Cumulative bonus 10% per claim-free year",
      "Domiciliary hospitalisation covered",
      "Ayurvedic treatment covered",
      "E-opinion for critical illnesses",
    ],
    description:
      "ICICI Lombard Complete Health Insurance is a feature-rich health plan offering comprehensive coverage including domiciliary care, Ayurvedic treatment, and cumulative bonus.",
    documents: [
      "Aadhaar / PAN card",
      "Address proof",
      "Medical reports if over 45",
      "Passport photo",
    ],
    waiting: "30 days general, 2–4 yrs pre-existing",
    tenure: "1 year (renewable)",
  },
  {
    id: "bajaj-own-damage",
    insurer: "Bajaj Allianz",
    short: "Bajaj",
    color: "#0891B2",
    plan: "Bajaj Allianz Own Damage",
    category: "Motor",
    premium: "₹4,200/yr",
    cover: "IDV based",
    claims: "95.8%",
    badge: undefined,
    features: [
      "Own damage cover for your vehicle",
      "Cashless repairs at 4,000+ garages",
      "Zero depreciation add-on available",
      "24x7 roadside assistance",
      "Engine & gearbox protection",
    ],
    description:
      "Bajaj Allianz Own Damage cover protects your vehicle from accidents, theft, fire and natural calamities. Get cashless repairs at over 4,000 authorised garages across India.",
    documents: [
      "RC (Registration Certificate)",
      "Previous policy copy",
      "Driver's licence",
      "Aadhaar / PAN card",
    ],
    waiting: "No waiting period",
    tenure: "1 year (renewable)",
  },
  {
    id: "tata-aig-travel",
    insurer: "Tata AIG",
    short: "TATA",
    color: "#D97706",
    plan: "Tata AIG Travel Guard",
    category: "Travel",
    premium: "₹1,100/trip",
    cover: "$1,00,000",
    claims: "96.2%",
    badge: undefined,
    features: [
      "Medical emergency cover worldwide",
      "Trip cancellation & interruption",
      "Baggage loss & delay cover",
      "Passport loss assistance",
      "24x7 global assistance",
    ],
    description:
      "Tata AIG Travel Guard provides comprehensive worldwide travel insurance covering medical emergencies, trip cancellations, baggage loss, and more for worry-free travel.",
    documents: [
      "Passport copy",
      "Visa / travel itinerary",
      "Aadhaar / PAN card",
    ],
    waiting: "No waiting period",
    tenure: "Per trip / multi-trip annual",
  },
];

export const MY_POLICIES: Policy[] = [
  {
    id: "pol-001",
    planId: "lic-tech-term",
    planName: "LIC Tech Term",
    insurer: "LIC of India",
    category: "Life",
    premium: "₹8,200/yr",
    cover: "₹1 Crore",
    status: "Active",
    renewalDate: "Dec 15, 2025",
    color: "#1580FF",
  },
  {
    id: "pol-002",
    planId: "icici-complete-health",
    planName: "ICICI Complete Health",
    insurer: "ICICI Lombard",
    category: "Health",
    premium: "₹11,800/yr",
    cover: "₹5 Lakh",
    status: "Active",
    renewalDate: "Mar 01, 2026",
    color: "#7C3AED",
  },
];

export const MY_CLAIMS: Claim[] = [
  {
    id: "clm-001",
    claimNo: "CLM-2024-001",
    description: "Hospitalisation — Surgery",
    insurer: "ICICI Lombard",
    planId: "icici-complete-health",
    amount: 45000,
    date: "Jan 10, 2025",
    status: "Approved",
  },
  {
    id: "clm-002",
    claimNo: "CLM-2024-002",
    description: "Day-care Procedure",
    insurer: "ICICI Lombard",
    planId: "icici-complete-health",
    amount: 12500,
    date: "Mar 05, 2025",
    status: "Processing",
  },
];
