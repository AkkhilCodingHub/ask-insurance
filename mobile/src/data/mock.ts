export const INSURERS = [
  { id: '1', name: 'LIC',           short: 'LI', color: '#1580FF', rating: 4.8, claims: '98.5%' },
  { id: '2', name: 'HDFC Life',     short: 'HD', color: '#E11D48', rating: 4.9, claims: '99.1%' },
  { id: '3', name: 'Star Health',   short: 'SH', color: '#059669', rating: 4.6, claims: '94.4%' },
  { id: '4', name: 'ICICI Lombard', short: 'IL', color: '#7C3AED', rating: 4.7, claims: '93.8%' },
  { id: '5', name: 'Bajaj Allianz', short: 'BA', color: '#0891B2', rating: 4.6, claims: '95.8%' },
  { id: '6', name: 'Tata AIG',      short: 'TA', color: '#D97706', rating: 4.5, claims: '96.2%' },
];

export interface Plan {
  id: string;
  insurer: string;
  short: string;
  color: string;
  plan: string;
  category: string;
  premium: string;
  cover: string;
  claims: string;
  badge: string;
  features: string[];
  description: string;
  documents: string[];
  waiting: string;
  tenure: string;
}

export const PLANS: Plan[] = [
  {
    id: '1',
    insurer: 'LIC', short: 'LI', color: '#1580FF',
    plan: 'Tech Term', category: 'Life',
    premium: '₹8,200/yr', cover: '₹1 Crore', claims: '98.5%',
    badge: 'Most Popular',
    features: ['Pure term plan', 'Online discount', 'Accidental death benefit', 'Premium waiver on disability', 'Tax benefit u/s 80C'],
    description: 'LIC Tech Term is a pure protection plan offering high life cover at affordable premiums with an online discount.',
    documents: ['Aadhaar / PAN', 'Income proof', 'Medical reports (if required)', 'Passport photos'],
    waiting: 'No waiting period',
    tenure: '10–40 years',
  },
  {
    id: '2',
    insurer: 'HDFC Life', short: 'HD', color: '#E11D48',
    plan: 'Click 2 Protect', category: 'Life',
    premium: '₹9,100/yr', cover: '₹1 Crore', claims: '99.1%',
    badge: 'Best Claims',
    features: ['Return of premium option', 'Critical illness cover', 'Waiver of premium', 'Joint life option', 'Inflation protection'],
    description: 'HDFC Life Click 2 Protect offers comprehensive life protection with optional return of premium at policy maturity.',
    documents: ['Aadhaar / PAN', 'Income proof', 'Medical certificate'],
    waiting: 'No waiting period',
    tenure: '10–40 years',
  },
  {
    id: '3',
    insurer: 'Star Health', short: 'SH', color: '#059669',
    plan: 'Comprehensive', category: 'Health',
    premium: '₹12,400/yr', cover: '₹5 Lakh', claims: '94.4%',
    badge: '',
    features: ['Day-care procedures', 'No room rent limit', 'Free annual health check', 'Pre/post hospitalisation', 'Domiciliary treatment'],
    description: 'Star Health Comprehensive plan provides all-round health coverage with no room rent cap and an extensive network of hospitals.',
    documents: ['Aadhaar / PAN', 'Age proof', 'Medical reports'],
    waiting: '30 days (pre-existing: 4 yrs)',
    tenure: '1 year renewable',
  },
  {
    id: '4',
    insurer: 'ICICI Lombard', short: 'IL', color: '#7C3AED',
    plan: 'Complete Health', category: 'Health',
    premium: '₹11,800/yr', cover: '₹5 Lakh', claims: '93.8%',
    badge: 'Trending',
    features: ['Maternity cover', 'OPD cover', 'Global emergency cover', 'Wellness benefits', 'Mental health cover'],
    description: 'ICICI Lombard Complete Health is a comprehensive family floater plan with maternity and global emergency coverage.',
    documents: ['Aadhaar / PAN', 'Age proof', 'Income proof'],
    waiting: '30 days (maternity: 9 months)',
    tenure: '1 year renewable',
  },
  {
    id: '5',
    insurer: 'Bajaj Allianz', short: 'BA', color: '#0891B2',
    plan: 'Own Damage', category: 'Motor',
    premium: '₹4,200/yr', cover: 'IDV based', claims: '95.8%',
    badge: '',
    features: ['Zero depreciation', 'Engine protect', 'RSA included', '24x7 claim support', 'Cashless garage network'],
    description: 'Bajaj Allianz Own Damage covers your vehicle against accidents, theft, and natural calamities.',
    documents: ['RC book', 'Driving license', 'Previous policy'],
    waiting: 'No waiting period',
    tenure: '1 year',
  },
  {
    id: '6',
    insurer: 'Tata AIG', short: 'TA', color: '#D97706',
    plan: 'Travel Guard', category: 'Travel',
    premium: '₹1,100/trip', cover: '$1,00,000', claims: '96.2%',
    badge: '',
    features: ['Medical emergency', 'Trip cancellation', 'Baggage loss', 'Passport loss cover', 'Personal liability'],
    description: 'Tata AIG Travel Guard is your complete travel companion covering medical emergencies and trip disruptions globally.',
    documents: ['Passport', 'Ticket / itinerary', 'Visa copy'],
    waiting: 'No waiting period',
    tenure: 'Per trip',
  },
];

export interface MyPolicy {
  id: string;
  plan: string;
  insurer: string;
  color: string;
  type: string;
  premium: string;
  cover: string;
  status: 'Active' | 'Expired' | 'Pending';
  nextDue: string;
  policyNo: string;
}

export const MY_POLICIES: MyPolicy[] = [
  {
    id: 'p1',
    plan: 'Tech Term', insurer: 'LIC', color: '#1580FF', type: 'Life',
    premium: '₹8,200/yr', cover: '₹1 Crore', status: 'Active',
    nextDue: 'Dec 15, 2025', policyNo: 'LIC-TT-20240001',
  },
  {
    id: 'p2',
    plan: 'Complete Health', insurer: 'ICICI Lombard', color: '#7C3AED', type: 'Health',
    premium: '₹11,800/yr', cover: '₹5 Lakh', status: 'Active',
    nextDue: 'Mar 01, 2026', policyNo: 'ICL-CH-20240002',
  },
];

export interface MyClaim {
  id: string;
  type: string;
  insurer: string;
  color: string;
  amount: string;
  date: string;
  status: 'Approved' | 'Processing' | 'Submitted' | 'Rejected';
  description: string;
  claimNo: string;
  steps: string[];
  currentStep: number;
}

export const MY_CLAIMS: MyClaim[] = [
  {
    id: 'c1',
    type: 'Health', insurer: 'ICICI Lombard', color: '#7C3AED',
    amount: '₹45,000', date: 'Nov 20, 2024', status: 'Approved',
    description: 'Hospitalisation — Apollo Hospital',
    claimNo: 'ICL-CLM-2024-001',
    steps: ['Submitted', 'Under Review', 'Approved', 'Settled'],
    currentStep: 3,
  },
  {
    id: 'c2',
    type: 'Health', insurer: 'ICICI Lombard', color: '#7C3AED',
    amount: '₹12,500', date: 'Jan 05, 2025', status: 'Processing',
    description: 'Day-care procedure — Fortis Hospital',
    claimNo: 'ICL-CLM-2025-001',
    steps: ['Submitted', 'Under Review', 'Approved', 'Settled'],
    currentStep: 1,
  },
];
