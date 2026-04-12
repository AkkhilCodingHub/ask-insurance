// ── Types ────────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  name: string;
  phone: string;
  email: string;
  dob: string;
  joinedAt: string;
  status: "Verified" | "Pending" | "Blocked";
  policyCount: number;
  claimCount: number;
  premiumTotal: string;
  city: string;
}

export interface AdminPolicy {
  id: string;
  policyNo: string;
  userId: string;
  userName: string;
  userPhone: string;
  planId: string;
  planName: string;
  insurer: string;
  category: "Life" | "Health" | "Motor" | "Travel" | "Home" | "Business";
  premium: string;
  premiumRaw: number;
  cover: string;
  status: "Active" | "Expired" | "Pending" | "Cancelled";
  startDate: string;
  renewalDate: string;
  color: string;
}

export interface AdminClaim {
  id: string;
  claimNo: string;
  userId: string;
  userName: string;
  userPhone: string;
  policyId: string;
  insurer: string;
  planName: string;
  category: string;
  description: string;
  amount: number;
  filedDate: string;
  status: "Submitted" | "Under Review" | "Approved" | "Rejected" | "Settled";
  adjuster: string;
  notes: string;
  documents: string[];
  color: string;
}

export interface Insurer {
  id: string;
  name: string;
  short: string;
  color: string;
  categories: string[];
  claimRatio: string;
  activePlans: number;
  apiStatus: "Live" | "Testing" | "Offline";
  commissionRate: string;
  since: string;
  headquarters: string;
}

export interface Quote {
  id: string;
  name: string;
  phone: string;
  email: string;
  category: string;
  planName: string;
  premium: string;
  status: "New" | "Contacted" | "Converted" | "Lost";
  createdAt: string;
  source: "Web" | "Mobile" | "Direct";
}

export interface AdminPlan {
  id: string;
  insurer: string;
  short: string;
  color: string;
  plan: string;
  category: "Life" | "Health" | "Motor" | "Travel" | "Home" | "Business";
  premium: string;
  premiumRaw: number;
  cover: string;
  claims: string;
  badge?: string;
  features: string[];
  active: boolean;
  enrolledCount: number;
}

// ── Users ────────────────────────────────────────────────────────────────────

export const USERS: AdminUser[] = [
  { id: "usr-001", name: "Hardil Singh",    phone: "9876543210", email: "hardil@email.com",   dob: "15/08/1995", joinedAt: "Jan 05, 2025", status: "Verified", policyCount: 2, claimCount: 1, premiumTotal: "₹20,000", city: "Mumbai" },
  { id: "usr-002", name: "Priya Mehta",     phone: "9812345678", email: "priya@email.com",    dob: "22/03/1992", joinedAt: "Jan 12, 2025", status: "Verified", policyCount: 1, claimCount: 0, premiumTotal: "₹12,400", city: "Delhi" },
  { id: "usr-003", name: "Ravi Kumar",      phone: "9901234567", email: "ravi@email.com",     dob: "10/11/1988", joinedAt: "Jan 19, 2025", status: "Verified", policyCount: 3, claimCount: 2, premiumTotal: "₹34,500", city: "Bangalore" },
  { id: "usr-004", name: "Ananya Joshi",    phone: "9845671234", email: "ananya@email.com",   dob: "05/06/1998", joinedAt: "Jan 25, 2025", status: "Pending",  policyCount: 0, claimCount: 0, premiumTotal: "₹0",      city: "Pune" },
  { id: "usr-005", name: "Suresh Yadav",    phone: "9771234560", email: "suresh@email.com",   dob: "30/01/1980", joinedAt: "Feb 03, 2025", status: "Verified", policyCount: 2, claimCount: 1, premiumTotal: "₹17,200", city: "Hyderabad" },
  { id: "usr-006", name: "Kavya Reddy",     phone: "9823456789", email: "kavya@email.com",    dob: "14/09/1994", joinedAt: "Feb 09, 2025", status: "Verified", policyCount: 1, claimCount: 0, premiumTotal: "₹9,100",  city: "Chennai" },
  { id: "usr-007", name: "Arjun Nair",      phone: "9856789012", email: "arjun@email.com",    dob: "28/12/1990", joinedAt: "Feb 14, 2025", status: "Blocked",  policyCount: 1, claimCount: 3, premiumTotal: "₹8,200",  city: "Kochi" },
  { id: "usr-008", name: "Meera Pillai",    phone: "9934567890", email: "meera@email.com",    dob: "17/04/1986", joinedAt: "Feb 20, 2025", status: "Verified", policyCount: 2, claimCount: 0, premiumTotal: "₹21,100", city: "Jaipur" },
  { id: "usr-009", name: "Devika Sharma",   phone: "9878901234", email: "devika@email.com",   dob: "09/07/2000", joinedAt: "Mar 01, 2025", status: "Pending",  policyCount: 0, claimCount: 0, premiumTotal: "₹0",      city: "Ahmedabad" },
  { id: "usr-010", name: "Nikhil Gupta",    phone: "9867890123", email: "nikhil@email.com",   dob: "03/02/1993", joinedAt: "Mar 07, 2025", status: "Verified", policyCount: 1, claimCount: 0, premiumTotal: "₹11,800", city: "Lucknow" },
  { id: "usr-011", name: "Pooja Agarwal",   phone: "9798901235", email: "pooja@email.com",    dob: "21/10/1991", joinedAt: "Mar 12, 2025", status: "Verified", policyCount: 2, claimCount: 1, premiumTotal: "₹20,600", city: "Kolkata" },
  { id: "usr-012", name: "Sanjay Mishra",   phone: "9712345678", email: "sanjay@email.com",   dob: "07/05/1977", joinedAt: "Mar 18, 2025", status: "Verified", policyCount: 4, claimCount: 2, premiumTotal: "₹46,700", city: "Nagpur" },
];

// ── Policies ─────────────────────────────────────────────────────────────────

export const POLICIES: AdminPolicy[] = [
  { id: "pol-001", policyNo: "ASK-LF-2025-001", userId: "usr-001", userName: "Hardil Singh",  userPhone: "9876543210", planId: "lic-tech-term",        planName: "LIC Tech Term",                insurer: "LIC of India",   category: "Life",   premium: "₹8,200",  premiumRaw: 8200,  cover: "₹1 Crore",  status: "Active",    startDate: "Jan 10, 2025", renewalDate: "Jan 10, 2026", color: "#1580FF" },
  { id: "pol-002", policyNo: "ASK-HL-2025-002", userId: "usr-001", userName: "Hardil Singh",  userPhone: "9876543210", planId: "icici-complete-health", planName: "ICICI Complete Health",         insurer: "ICICI Lombard",  category: "Health", premium: "₹11,800", premiumRaw: 11800, cover: "₹5 Lakh",   status: "Active",    startDate: "Jan 10, 2025", renewalDate: "Mar 01, 2026", color: "#7C3AED" },
  { id: "pol-003", policyNo: "ASK-HL-2025-003", userId: "usr-002", userName: "Priya Mehta",   userPhone: "9812345678", planId: "star-comprehensive",    planName: "Star Health Comprehensive",    insurer: "Star Health",    category: "Health", premium: "₹12,400", premiumRaw: 12400, cover: "₹5 Lakh",   status: "Active",    startDate: "Jan 14, 2025", renewalDate: "Jan 14, 2026", color: "#059669" },
  { id: "pol-004", policyNo: "ASK-LF-2025-004", userId: "usr-003", userName: "Ravi Kumar",    userPhone: "9901234567", planId: "hdfc-click2protect",    planName: "HDFC Click 2 Protect",         insurer: "HDFC Life",      category: "Life",   premium: "₹9,100",  premiumRaw: 9100,  cover: "₹1 Crore",  status: "Active",    startDate: "Jan 21, 2025", renewalDate: "Jan 21, 2026", color: "#E11D48" },
  { id: "pol-005", policyNo: "ASK-MT-2025-005", userId: "usr-003", userName: "Ravi Kumar",    userPhone: "9901234567", planId: "bajaj-own-damage",      planName: "Bajaj Allianz Own Damage",     insurer: "Bajaj Allianz",  category: "Motor",  premium: "₹4,200",  premiumRaw: 4200,  cover: "IDV Based", status: "Active",    startDate: "Jan 21, 2025", renewalDate: "Jan 21, 2026", color: "#0891B2" },
  { id: "pol-006", policyNo: "ASK-HL-2025-006", userId: "usr-003", userName: "Ravi Kumar",    userPhone: "9901234567", planId: "icici-complete-health", planName: "ICICI Complete Health",         insurer: "ICICI Lombard",  category: "Health", premium: "₹11,800", premiumRaw: 11800, cover: "₹5 Lakh",   status: "Expired",   startDate: "Jan 01, 2024", renewalDate: "Jan 01, 2025", color: "#7C3AED" },
  { id: "pol-007", policyNo: "ASK-LF-2025-007", userId: "usr-005", userName: "Suresh Yadav",  userPhone: "9771234560", planId: "lic-tech-term",        planName: "LIC Tech Term",                insurer: "LIC of India",   category: "Life",   premium: "₹8,200",  premiumRaw: 8200,  cover: "₹1 Crore",  status: "Active",    startDate: "Feb 05, 2025", renewalDate: "Feb 05, 2026", color: "#1580FF" },
  { id: "pol-008", policyNo: "ASK-TV-2025-008", userId: "usr-005", userName: "Suresh Yadav",  userPhone: "9771234560", planId: "tata-aig-travel",       planName: "Tata AIG Travel Guard",        insurer: "Tata AIG",       category: "Travel", premium: "₹1,100",  premiumRaw: 1100,  cover: "$1,00,000", status: "Active",    startDate: "Feb 05, 2025", renewalDate: "Feb 05, 2026", color: "#D97706" },
  { id: "pol-009", policyNo: "ASK-HL-2025-009", userId: "usr-006", userName: "Kavya Reddy",   userPhone: "9823456789", planId: "hdfc-click2protect",    planName: "HDFC Click 2 Protect",         insurer: "HDFC Life",      category: "Life",   premium: "₹9,100",  premiumRaw: 9100,  cover: "₹1 Crore",  status: "Active",    startDate: "Feb 16, 2025", renewalDate: "Feb 16, 2026", color: "#E11D48" },
  { id: "pol-010", policyNo: "ASK-LF-2025-010", userId: "usr-007", userName: "Arjun Nair",    userPhone: "9856789012", planId: "lic-tech-term",        planName: "LIC Tech Term",                insurer: "LIC of India",   category: "Life",   premium: "₹8,200",  premiumRaw: 8200,  cover: "₹1 Crore",  status: "Pending",   startDate: "Feb 22, 2025", renewalDate: "Feb 22, 2026", color: "#1580FF" },
  { id: "pol-011", policyNo: "ASK-HL-2025-011", userId: "usr-008", userName: "Meera Pillai",  userPhone: "9934567890", planId: "star-comprehensive",    planName: "Star Health Comprehensive",    insurer: "Star Health",    category: "Health", premium: "₹12,400", premiumRaw: 12400, cover: "₹5 Lakh",   status: "Active",    startDate: "Feb 22, 2025", renewalDate: "Feb 22, 2026", color: "#059669" },
  { id: "pol-012", policyNo: "ASK-LF-2025-012", userId: "usr-008", userName: "Meera Pillai",  userPhone: "9934567890", planId: "hdfc-click2protect",    planName: "HDFC Click 2 Protect",         insurer: "HDFC Life",      category: "Life",   premium: "₹9,100",  premiumRaw: 9100,  cover: "₹1 Crore",  status: "Active",    startDate: "Feb 22, 2025", renewalDate: "Feb 22, 2026", color: "#E11D48" },
  { id: "pol-013", policyNo: "ASK-HL-2025-013", userId: "usr-010", userName: "Nikhil Gupta",  userPhone: "9867890123", planId: "icici-complete-health", planName: "ICICI Complete Health",         insurer: "ICICI Lombard",  category: "Health", premium: "₹11,800", premiumRaw: 11800, cover: "₹5 Lakh",   status: "Active",    startDate: "Mar 08, 2025", renewalDate: "Mar 08, 2026", color: "#7C3AED" },
  { id: "pol-014", policyNo: "ASK-MT-2025-014", userId: "usr-011", userName: "Pooja Agarwal", userPhone: "9798901235", planId: "bajaj-own-damage",      planName: "Bajaj Allianz Own Damage",     insurer: "Bajaj Allianz",  category: "Motor",  premium: "₹4,200",  premiumRaw: 4200,  cover: "IDV Based", status: "Active",    startDate: "Mar 14, 2025", renewalDate: "Mar 14, 2026", color: "#0891B2" },
  { id: "pol-015", policyNo: "ASK-HL-2025-015", userId: "usr-011", userName: "Pooja Agarwal", userPhone: "9798901235", planId: "star-comprehensive",    planName: "Star Health Comprehensive",    insurer: "Star Health",    category: "Health", premium: "₹12,400", premiumRaw: 12400, cover: "₹5 Lakh",   status: "Active",    startDate: "Mar 14, 2025", renewalDate: "Mar 14, 2026", color: "#059669" },
  { id: "pol-016", policyNo: "ASK-LF-2025-016", userId: "usr-012", userName: "Sanjay Mishra", userPhone: "9712345678", planId: "lic-tech-term",        planName: "LIC Tech Term",                insurer: "LIC of India",   category: "Life",   premium: "₹8,200",  premiumRaw: 8200,  cover: "₹1 Crore",  status: "Active",    startDate: "Mar 20, 2025", renewalDate: "Mar 20, 2026", color: "#1580FF" },
];

// ── Claims ────────────────────────────────────────────────────────────────────

export const CLAIMS: AdminClaim[] = [
  { id: "clm-001", claimNo: "CLM-2025-001", userId: "usr-001", userName: "Hardil Singh",  userPhone: "9876543210", policyId: "pol-002", insurer: "ICICI Lombard", planName: "ICICI Complete Health",      category: "Health", description: "Hospitalisation — Surgery",         amount: 45000,  filedDate: "Jan 10, 2025", status: "Settled",      adjuster: "Priya Sharma", notes: "Approved after document verification. Surgery receipts valid.", documents: ["Discharge summary", "Hospital bills", "Lab reports"], color: "#7C3AED" },
  { id: "clm-002", claimNo: "CLM-2025-002", userId: "usr-001", userName: "Hardil Singh",  userPhone: "9876543210", policyId: "pol-002", insurer: "ICICI Lombard", planName: "ICICI Complete Health",      category: "Health", description: "Day-care Procedure",                amount: 12500,  filedDate: "Mar 05, 2025", status: "Approved",     adjuster: "Rahul Verma",  notes: "Day-care procedure claim. Pre-auth obtained.", documents: ["Pre-auth letter", "Bills"], color: "#7C3AED" },
  { id: "clm-003", claimNo: "CLM-2025-003", userId: "usr-003", userName: "Ravi Kumar",    userPhone: "9901234567", policyId: "pol-004", insurer: "HDFC Life",     planName: "HDFC Click 2 Protect",       category: "Life",   description: "Accidental Disability Rider",       amount: 200000, filedDate: "Feb 02, 2025", status: "Under Review", adjuster: "Priya Sharma", notes: "Awaiting medical certificate from treating physician.", documents: ["FIR copy", "Medical certificate pending"], color: "#E11D48" },
  { id: "clm-004", claimNo: "CLM-2025-004", userId: "usr-003", userName: "Ravi Kumar",    userPhone: "9901234567", policyId: "pol-005", insurer: "Bajaj Allianz", planName: "Bajaj Allianz Own Damage",   category: "Motor",  description: "Vehicle accident — front damage",   amount: 28000,  filedDate: "Feb 18, 2025", status: "Approved",     adjuster: "Rahul Verma",  notes: "Surveyor report submitted. Repair estimate approved.", documents: ["FIR", "Surveyor report", "Repair estimate"], color: "#0891B2" },
  { id: "clm-005", claimNo: "CLM-2025-005", userId: "usr-005", userName: "Suresh Yadav",  userPhone: "9771234560", policyId: "pol-007", insurer: "LIC of India",  planName: "LIC Tech Term",              category: "Life",   description: "Critical illness notification",     amount: 500000, filedDate: "Mar 01, 2025", status: "Submitted",    adjuster: "Unassigned",   notes: "New claim. Awaiting assignment.", documents: ["Medical reports"], color: "#1580FF" },
  { id: "clm-006", claimNo: "CLM-2025-006", userId: "usr-007", userName: "Arjun Nair",    userPhone: "9856789012", policyId: "pol-010", insurer: "LIC of India",  planName: "LIC Tech Term",              category: "Life",   description: "Death claim — nominee submission",  amount: 1000000,filedDate: "Jan 28, 2025", status: "Rejected",     adjuster: "Priya Sharma", notes: "Policy lapsed at time of claim. Premium not paid for 2 months.", documents: ["Death certificate", "Nominee ID"], color: "#1580FF" },
  { id: "clm-007", claimNo: "CLM-2025-007", userId: "usr-008", userName: "Meera Pillai",  userPhone: "9934567890", policyId: "pol-011", insurer: "Star Health",   planName: "Star Health Comprehensive",  category: "Health", description: "Maternity hospitalisation",         amount: 65000,  filedDate: "Mar 08, 2025", status: "Under Review", adjuster: "Rahul Verma",  notes: "Maternity claim. Verifying waiting period compliance.", documents: ["Hospital bills", "Discharge summary", "Policy copy"], color: "#059669" },
  { id: "clm-008", claimNo: "CLM-2025-008", userId: "usr-011", userName: "Pooja Agarwal", userPhone: "9798901235", policyId: "pol-014", insurer: "Bajaj Allianz", planName: "Bajaj Allianz Own Damage",   category: "Motor",  description: "Theft — total loss claim",          amount: 380000, filedDate: "Mar 15, 2025", status: "Submitted",    adjuster: "Unassigned",   notes: "Theft claim. FIR lodged. Awaiting surveyor.", documents: ["FIR", "RC copy", "Keys"], color: "#0891B2" },
  { id: "clm-009", claimNo: "CLM-2025-009", userId: "usr-012", userName: "Sanjay Mishra", userPhone: "9712345678", policyId: "pol-016", insurer: "LIC of India",  planName: "LIC Tech Term",              category: "Life",   description: "Terminal illness accelerated benefit", amount: 750000, filedDate: "Mar 22, 2025", status: "Under Review", adjuster: "Priya Sharma", notes: "Specialist oncologist report obtained. Reviewing.", documents: ["Oncologist report", "Medical history"], color: "#1580FF" },
];

// ── Insurers ──────────────────────────────────────────────────────────────────

export const INSURERS: Insurer[] = [
  { id: "ins-001", name: "LIC of India",       short: "LIC",   color: "#1580FF", categories: ["Life"],                   claimRatio: "98.5%", activePlans: 3,  apiStatus: "Live",    commissionRate: "12%", since: "2023", headquarters: "Mumbai" },
  { id: "ins-002", name: "HDFC Life",           short: "HDFC",  color: "#E11D48", categories: ["Life"],                   claimRatio: "99.1%", activePlans: 4,  apiStatus: "Live",    commissionRate: "14%", since: "2023", headquarters: "Mumbai" },
  { id: "ins-003", name: "Star Health",         short: "Star",  color: "#059669", categories: ["Health"],                 claimRatio: "94.4%", activePlans: 5,  apiStatus: "Live",    commissionRate: "11%", since: "2023", headquarters: "Chennai" },
  { id: "ins-004", name: "ICICI Lombard",       short: "ICICI", color: "#7C3AED", categories: ["Health", "Motor", "Travel"], claimRatio: "93.8%", activePlans: 6,  apiStatus: "Live",    commissionRate: "13%", since: "2023", headquarters: "Mumbai" },
  { id: "ins-005", name: "Bajaj Allianz",       short: "Bajaj", color: "#0891B2", categories: ["Motor", "Health"],        claimRatio: "95.8%", activePlans: 4,  apiStatus: "Live",    commissionRate: "10%", since: "2023", headquarters: "Pune" },
  { id: "ins-006", name: "Tata AIG",            short: "TATA",  color: "#D97706", categories: ["Travel", "Health", "Motor"], claimRatio: "96.2%", activePlans: 3,  apiStatus: "Live",    commissionRate: "12%", since: "2024", headquarters: "Mumbai" },
  { id: "ins-007", name: "Max Bupa",            short: "Max",   color: "#DC2626", categories: ["Health"],                 claimRatio: "92.6%", activePlans: 2,  apiStatus: "Testing", commissionRate: "11%", since: "2024", headquarters: "Delhi" },
  { id: "ins-008", name: "New India Assurance", short: "NIA",   color: "#374151", categories: ["Motor", "Home"],          claimRatio: "90.1%", activePlans: 2,  apiStatus: "Offline", commissionRate: "9%",  since: "2024", headquarters: "Mumbai" },
];

// ── Quotes ─────────────────────────────────────────────────────────────────────

export const QUOTES: Quote[] = [
  { id: "qt-001", name: "Rajesh Kumar",    phone: "9988776655", email: "rajesh@email.com",   category: "Life",   planName: "LIC Tech Term",              premium: "₹8,200",  status: "Converted", createdAt: "Jan 08, 2025", source: "Web" },
  { id: "qt-002", name: "Sunita Patel",    phone: "9977665544", email: "sunita@email.com",   category: "Health", planName: "Star Health Comprehensive",   premium: "₹12,400", status: "Converted", createdAt: "Jan 12, 2025", source: "Mobile" },
  { id: "qt-003", name: "Aakash Verma",    phone: "9966554433", email: "aakash@email.com",   category: "Motor",  planName: "Bajaj Allianz Own Damage",    premium: "₹4,200",  status: "Lost",      createdAt: "Jan 19, 2025", source: "Web" },
  { id: "qt-004", name: "Deepa Nair",      phone: "9955443322", email: "deepa@email.com",    category: "Travel", planName: "Tata AIG Travel Guard",       premium: "₹1,100",  status: "Converted", createdAt: "Jan 25, 2025", source: "Web" },
  { id: "qt-005", name: "Vikram Singh",    phone: "9944332211", email: "vikram@email.com",   category: "Life",   planName: "HDFC Click 2 Protect",        premium: "₹9,100",  status: "Contacted", createdAt: "Feb 02, 2025", source: "Direct" },
  { id: "qt-006", name: "Ritu Sharma",     phone: "9933221100", email: "ritu@email.com",     category: "Health", planName: "ICICI Complete Health",        premium: "₹11,800", status: "Converted", createdAt: "Feb 10, 2025", source: "Mobile" },
  { id: "qt-007", name: "Manish Jain",     phone: "9922110099", email: "manish@email.com",   category: "Health", planName: "Star Health Comprehensive",   premium: "₹12,400", status: "Contacted", createdAt: "Feb 16, 2025", source: "Web" },
  { id: "qt-008", name: "Lata Desai",      phone: "9911009988", email: "lata@email.com",     category: "Motor",  planName: "Bajaj Allianz Own Damage",    premium: "₹4,200",  status: "Lost",      createdAt: "Feb 22, 2025", source: "Web" },
  { id: "qt-009", name: "Pranav Mehta",    phone: "9900998877", email: "pranav@email.com",   category: "Life",   planName: "LIC Tech Term",               premium: "₹8,200",  status: "New",       createdAt: "Mar 03, 2025", source: "Mobile" },
  { id: "qt-010", name: "Smita Roy",       phone: "9890887766", email: "smita@email.com",    category: "Health", planName: "ICICI Complete Health",        premium: "₹11,800", status: "New",       createdAt: "Mar 09, 2025", source: "Web" },
  { id: "qt-011", name: "Kiran Bose",      phone: "9880776655", email: "kiran@email.com",    category: "Travel", planName: "Tata AIG Travel Guard",        premium: "₹1,100",  status: "New",       createdAt: "Mar 14, 2025", source: "Mobile" },
  { id: "qt-012", name: "Tarun Saxena",    phone: "9870665544", email: "tarun@email.com",    category: "Life",   planName: "HDFC Click 2 Protect",        premium: "₹9,100",  status: "Contacted", createdAt: "Mar 20, 2025", source: "Direct" },
];

// ── Plans ─────────────────────────────────────────────────────────────────────

export const PLANS: AdminPlan[] = [
  { id: "lic-tech-term",        insurer: "LIC of India",   short: "LIC",   color: "#1580FF", plan: "LIC Tech Term",                category: "Life",   premium: "₹8,200/yr",  premiumRaw: 8200,  cover: "₹1 Crore",  claims: "98.5%", badge: "Most Popular", features: ["Pure term plan online", "Death benefit lump sum", "Accidental death rider", "Tax benefit 80C", "Flexible payment terms"],                               active: true,  enrolledCount: 342 },
  { id: "hdfc-click2protect",   insurer: "HDFC Life",      short: "HDFC",  color: "#E11D48", plan: "HDFC Click 2 Protect",         category: "Life",   premium: "₹9,100/yr",  premiumRaw: 9100,  cover: "₹1 Crore",  claims: "99.1%", badge: "Best Claims",  features: ["99.1% claim settlement", "Critical illness add-on", "Waiver of premium", "Return of premium option", "Joint life cover"],                      active: true,  enrolledCount: 287 },
  { id: "star-comprehensive",   insurer: "Star Health",    short: "Star",  color: "#059669", plan: "Star Health Comprehensive",    category: "Health", premium: "₹12,400/yr", premiumRaw: 12400, cover: "₹5 Lakh",   claims: "94.4%", badge: undefined,     features: ["Cashless 10,000+ hospitals", "No pre-policy check up to 45", "Restoration of sum insured", "Day-care covered", "OPD consultation", "Maternity"],     active: true,  enrolledCount: 198 },
  { id: "icici-complete-health",insurer: "ICICI Lombard",  short: "ICICI", color: "#7C3AED", plan: "ICICI Lombard Complete Health",category: "Health", premium: "₹11,800/yr", premiumRaw: 11800, cover: "₹5 Lakh",   claims: "93.8%", badge: "Trending",    features: ["5,000+ cashless hospitals", "10% NCB per year", "Domiciliary cover", "Ayurvedic treatment", "E-opinion"],                                              active: true,  enrolledCount: 224 },
  { id: "bajaj-own-damage",     insurer: "Bajaj Allianz",  short: "Bajaj", color: "#0891B2", plan: "Bajaj Allianz Own Damage",     category: "Motor",  premium: "₹4,200/yr",  premiumRaw: 4200,  cover: "IDV based", claims: "95.8%", badge: undefined,     features: ["Own damage cover", "Cashless 4,000+ garages", "Zero depreciation add-on", "24×7 roadside assistance", "Engine protection"],                           active: true,  enrolledCount: 156 },
  { id: "tata-aig-travel",      insurer: "Tata AIG",       short: "TATA",  color: "#D97706", plan: "Tata AIG Travel Guard",         category: "Travel", premium: "₹1,100/trip", premiumRaw: 1100,  cover: "$1,00,000", claims: "96.2%", badge: undefined,     features: ["Medical emergency worldwide", "Trip cancellation", "Baggage loss & delay", "Passport loss", "24×7 global assistance"],                                active: true,  enrolledCount: 89  },
  { id: "max-bupa-health",      insurer: "Max Bupa",       short: "Max",   color: "#DC2626", plan: "Max Bupa ReAssure 2.0",         category: "Health", premium: "₹14,200/yr", premiumRaw: 14200, cover: "₹10 Lakh",  claims: "92.6%", badge: undefined,     features: ["Unlimited restoration", "International cover", "No room rent capping", "Chronic disease cover", "Annual health check-up"],                             active: false, enrolledCount: 12  },
];

// ── Analytics data ────────────────────────────────────────────────────────────

export const MONTHLY_REVENUE = [
  { month: "Oct", revenue: 180000 },
  { month: "Nov", revenue: 224000 },
  { month: "Dec", revenue: 198000 },
  { month: "Jan", revenue: 312000 },
  { month: "Feb", revenue: 287000 },
  { month: "Mar", revenue: 348000 },
];

export const CATEGORY_BREAKDOWN = [
  { category: "Life",   value: 38, color: "#1580FF" },
  { category: "Health", value: 32, color: "#059669" },
  { category: "Motor",  value: 18, color: "#0891B2" },
  { category: "Travel", value: 8,  color: "#D97706" },
  { category: "Home",   value: 4,  color: "#7C3AED" },
];
