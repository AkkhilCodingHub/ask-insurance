import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../src/generated/prisma/client';

const url = new URL(process.env.DATABASE_URL ?? '');
const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: Number(url.port) || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.replace(/^\//, ''),
  connectionLimit: 5
});
const prisma = new PrismaClient({ adapter });

// ─────────────────────────────────────────────────────────────────────────────
// INSURERS
// ─────────────────────────────────────────────────────────────────────────────
const INSURERS = [
  // ── Life ──────────────────────────────────────────────────────────────────
  {
    name: 'Life Insurance Corporation of India',
    slug: 'lic',
    shortName: 'LIC',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/9b/LIC_India_logo.svg/1200px-LIC_India_logo.svg.png',
    brandColor: '#FF6600',
    tagline: 'Yogakshemam Vahamyaham',
    founded: 1956,
    headquarters: 'Mumbai, Maharashtra',
    website: 'https://www.licindia.in',
    claimsRatio: 98.74,
    rating: 4.6,
  },
  {
    name: 'HDFC Life Insurance',
    slug: 'hdfc-life',
    shortName: 'HDFC Life',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/HDFC_Life_Logo.svg/1200px-HDFC_Life_Logo.svg.png',
    brandColor: '#004C8A',
    tagline: 'Sar Utha Ke Jiyo',
    founded: 2000,
    headquarters: 'Mumbai, Maharashtra',
    website: 'https://www.hdfclife.com',
    claimsRatio: 99.39,
    rating: 4.7,
  },
  {
    name: 'ICICI Prudential Life Insurance',
    slug: 'icici-pru-life',
    shortName: 'ICICI Pru Life',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/ICICI_Prudential_Life_Insurance.svg/1200px-ICICI_Prudential_Life_Insurance.svg.png',
    brandColor: '#F37021',
    tagline: 'Zimmedari Ka Ehsaas',
    founded: 2001,
    headquarters: 'Mumbai, Maharashtra',
    website: 'https://www.iciciprulife.com',
    claimsRatio: 97.82,
    rating: 4.5,
  },
  {
    name: 'SBI Life Insurance',
    slug: 'sbi-life',
    shortName: 'SBI Life',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/SBI_Life_Insurance_Logo.svg/1200px-SBI_Life_Insurance_Logo.svg.png',
    brandColor: '#0060AA',
    tagline: 'With SBI Life, I Am Sure',
    founded: 2001,
    headquarters: 'Mumbai, Maharashtra',
    website: 'https://www.sbilife.co.in',
    claimsRatio: 96.91,
    rating: 4.4,
  },
  {
    name: 'Max Life Insurance',
    slug: 'max-life',
    shortName: 'Max Life',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Max_Life_Insurance_logo.svg/1200px-Max_Life_Insurance_logo.svg.png',
    brandColor: '#E31837',
    tagline: 'Dil Se Sahi',
    founded: 2001,
    headquarters: 'New Delhi',
    website: 'https://www.maxlifeinsurance.com',
    claimsRatio: 99.34,
    rating: 4.8,
  },
  {
    name: 'Tata AIA Life Insurance',
    slug: 'tata-aia-life',
    shortName: 'Tata AIA',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Tata_logo.svg/1200px-Tata_logo.svg.png',
    brandColor: '#008BD0',
    tagline: 'Insure Your Possibilities',
    founded: 2001,
    headquarters: 'Mumbai, Maharashtra',
    website: 'https://www.tataaia.com',
    claimsRatio: 98.53,
    rating: 4.6,
  },
  {
    name: 'Bajaj Allianz Life Insurance',
    slug: 'bajaj-allianz-life',
    shortName: 'Bajaj Allianz Life',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Bajaj_Allianz_Life_Insurance_logo.svg/1200px-Bajaj_Allianz_Life_Insurance_logo.svg.png',
    brandColor: '#003DA5',
    tagline: 'Jiyo Befikar',
    founded: 2001,
    headquarters: 'Pune, Maharashtra',
    website: 'https://www.bajajallianzlife.com',
    claimsRatio: 99.04,
    rating: 4.5,
  },
  {
    name: 'Kotak Mahindra Life Insurance',
    slug: 'kotak-life',
    shortName: 'Kotak Life',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Kotak_Mahindra_Bank_logo.svg/1200px-Kotak_Mahindra_Bank_logo.svg.png',
    brandColor: '#EF3340',
    tagline: 'Karo Zyada Ka Iraada',
    founded: 2001,
    headquarters: 'Mumbai, Maharashtra',
    website: 'https://insurance.kotak.com',
    claimsRatio: 98.51,
    rating: 4.5,
  },
  // ── Health ─────────────────────────────────────────────────────────────────
  {
    name: 'Star Health and Allied Insurance',
    slug: 'star-health',
    shortName: 'Star Health',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Star_Health_Insurance_Logo.svg/1200px-Star_Health_Insurance_Logo.svg.png',
    brandColor: '#D12026',
    tagline: 'Everything Else Can Wait',
    founded: 2006,
    headquarters: 'Chennai, Tamil Nadu',
    website: 'https://www.starhealth.in',
    claimsRatio: 90.37,
    rating: 4.4,
  },
  {
    name: 'Niva Bupa Health Insurance',
    slug: 'niva-bupa',
    shortName: 'Niva Bupa',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Niva_Bupa_Health_Insurance_Logo.svg/1200px-Niva_Bupa_Health_Insurance_Logo.svg.png',
    brandColor: '#00A3E0',
    tagline: 'Be Fearless',
    founded: 2010,
    headquarters: 'New Delhi',
    website: 'https://www.nivabupa.com',
    claimsRatio: 91.24,
    rating: 4.5,
  },
  {
    name: 'Care Health Insurance',
    slug: 'care-health',
    shortName: 'Care Health',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Care_Health_Insurance_logo.svg/1200px-Care_Health_Insurance_logo.svg.png',
    brandColor: '#E4002B',
    tagline: 'Ab Health Insurance Simple',
    founded: 2012,
    headquarters: 'Gurugram, Haryana',
    website: 'https://www.careinsurance.com',
    claimsRatio: 88.57,
    rating: 4.3,
  },
  {
    name: 'Aditya Birla Health Insurance',
    slug: 'aditya-birla-health',
    shortName: 'ABHI',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Aditya_Birla_Capital_Logo.svg/1200px-Aditya_Birla_Capital_Logo.svg.png',
    brandColor: '#E40046',
    tagline: 'Rewarding a Healthy Life',
    founded: 2016,
    headquarters: 'Mumbai, Maharashtra',
    website: 'https://www.adityabirlacapital.com/healthinsurance',
    claimsRatio: 87.42,
    rating: 4.2,
  },
  // ── General / Motor / Travel ───────────────────────────────────────────────
  {
    name: 'ICICI Lombard General Insurance',
    slug: 'icici-lombard',
    shortName: 'ICICI Lombard',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/ICICI_Lombard_General_Insurance_Logo.svg/1200px-ICICI_Lombard_General_Insurance_Logo.svg.png',
    brandColor: '#F37021',
    tagline: 'Nibhate Hain Hum',
    founded: 2001,
    headquarters: 'Mumbai, Maharashtra',
    website: 'https://www.icicilombard.com',
    claimsRatio: 88.21,
    rating: 4.4,
  },
  {
    name: 'Bajaj Allianz General Insurance',
    slug: 'bajaj-allianz-general',
    shortName: 'Bajaj Allianz',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Bajaj_Allianz_Life_Insurance_logo.svg/1200px-Bajaj_Allianz_Life_Insurance_logo.svg.png',
    brandColor: '#003DA5',
    tagline: 'Jiyo Befikar',
    founded: 2001,
    headquarters: 'Pune, Maharashtra',
    website: 'https://www.bajajallianz.com',
    claimsRatio: 87.60,
    rating: 4.3,
  },
  {
    name: 'HDFC ERGO General Insurance',
    slug: 'hdfc-ergo',
    shortName: 'HDFC ERGO',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/HDFC_Ergo_Logo.svg/1200px-HDFC_Ergo_Logo.svg.png',
    brandColor: '#ED1C24',
    tagline: 'You Are The Centre of Our Universe',
    founded: 2002,
    headquarters: 'Mumbai, Maharashtra',
    website: 'https://www.hdfcergo.com',
    claimsRatio: 89.53,
    rating: 4.5,
  },
  {
    name: 'Go Digit General Insurance',
    slug: 'go-digit',
    shortName: 'Digit Insurance',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Go_Digit_General_Insurance_Logo.svg/1200px-Go_Digit_General_Insurance_Logo.svg.png',
    brandColor: '#FFC72C',
    tagline: 'Keep It Simple',
    founded: 2017,
    headquarters: 'Bengaluru, Karnataka',
    website: 'https://www.godigit.com',
    claimsRatio: 86.85,
    rating: 4.4,
  },
  {
    name: 'Tata AIG General Insurance',
    slug: 'tata-aig-general',
    shortName: 'Tata AIG',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Tata_logo.svg/1200px-Tata_logo.svg.png',
    brandColor: '#008BD0',
    tagline: 'Insurance Redefined',
    founded: 2001,
    headquarters: 'Mumbai, Maharashtra',
    website: 'https://www.tataaig.com',
    claimsRatio: 87.90,
    rating: 4.3,
  },
  {
    name: 'New India Assurance',
    slug: 'new-india',
    shortName: 'New India',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/New-India-Assurance-logo.svg/1200px-New-India-Assurance-logo.svg.png',
    brandColor: '#00457C',
    tagline: 'Trusted Since 1919',
    founded: 1919,
    headquarters: 'Mumbai, Maharashtra',
    website: 'https://www.newindia.co.in',
    claimsRatio: 92.34,
    rating: 4.2,
  },
  {
    name: 'Oriental Insurance Company',
    slug: 'oriental',
    shortName: 'Oriental',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Oriental_Insurance_Company_logo.svg/1200px-Oriental_Insurance_Company_logo.svg.png',
    brandColor: '#007DC6',
    tagline: 'We Cover the World',
    founded: 1947,
    headquarters: 'New Delhi',
    website: 'https://orientalinsurance.org.in',
    claimsRatio: 91.20,
    rating: 4.1,
  },
  {
    name: 'Royal Sundaram General Insurance',
    slug: 'royal-sundaram',
    shortName: 'Royal Sundaram',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Royal_Sundaram_logo.svg/1200px-Royal_Sundaram_logo.svg.png',
    brandColor: '#CE0E2D',
    tagline: 'Your Trust, Our Strength',
    founded: 2001,
    headquarters: 'Chennai, Tamil Nadu',
    website: 'https://www.royalsundaram.in',
    claimsRatio: 86.20,
    rating: 4.2,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PLANS  (name, type, description, features[], minAge, maxAge, minCover, maxCover, basePremium)
// ─────────────────────────────────────────────────────────────────────────────
const PLANS: {
  slug: string;
  name: string;
  insurerSlug: string;
  type: string;
  description: string;
  features: string[];
  minAge: number;
  maxAge: number;
  minCover: number;
  maxCover: number;
  basePremium: number;
  isFeatured: boolean;
}[] = [
  // ── LIFE ──────────────────────────────────────────────────────────────────
  {
    slug: 'lic-tech-term',
    name: 'LIC Tech Term',
    insurerSlug: 'lic',
    type: 'life',
    description: 'A pure online term insurance plan from LIC offering high sum assured at affordable premiums with multiple payout options.',
    features: [
      'Sum assured up to ₹5 Crore',
      'Lump sum or monthly income payout',
      'Accidental death benefit rider',
      'Tax benefit under Sec 80C & 10(10D)',
      'Grace period of 30 days',
      'Free look period 15 days',
    ],
    minAge: 18, maxAge: 65, minCover: 5000000, maxCover: 500000000, basePremium: 11820, isFeatured: true,
  },
  {
    slug: 'hdfc-click2protect-super',
    name: 'HDFC Life Click 2 Protect Super',
    insurerSlug: 'hdfc-life',
    type: 'life',
    description: 'A comprehensive online term plan with life cover, income benefit and return of premium options to suit every need.',
    features: [
      '3 plan options: Life, Extra Life & Income',
      'Return of premium on survival',
      'Waiver of premium on disability',
      '99.39% claims settlement ratio',
      'Instant policy issuance',
      'Flexible premium payment terms',
    ],
    minAge: 18, maxAge: 65, minCover: 10000000, maxCover: 1000000000, basePremium: 9490, isFeatured: true,
  },
  {
    slug: 'icici-pru-iprotect-smart',
    name: 'ICICI Pru iProtect Smart',
    insurerSlug: 'icici-pru-life',
    type: 'life',
    description: 'India\'s award-winning term plan with comprehensive protection options including critical illness cover.',
    features: [
      'Life, Life Plus, Life & Health options',
      '34 critical illness covered',
      'Accidental death benefit',
      'Permanent disability cover',
      'Monthly income option',
      'Online discount up to 5%',
    ],
    minAge: 18, maxAge: 60, minCover: 5000000, maxCover: 2000000000, basePremium: 8545, isFeatured: true,
  },
  {
    slug: 'max-life-smart-secure-plus',
    name: 'Max Life Smart Secure Plus',
    insurerSlug: 'max-life',
    type: 'life',
    description: 'A feature-rich term plan with the highest claims settlement ratio among private insurers in India.',
    features: [
      '99.34% claims settlement ratio',
      'In-built terminal illness cover',
      'Special exit value option',
      'Accidental cover add-on',
      'Critical illness rider available',
      'Joint life cover option',
    ],
    minAge: 18, maxAge: 65, minCover: 5000000, maxCover: 1000000000, basePremium: 8040, isFeatured: true,
  },
  {
    slug: 'tata-aia-sampoorna-raksha-supreme',
    name: 'Tata AIA Sampoorna Raksha Supreme',
    insurerSlug: 'tata-aia-life',
    type: 'life',
    description: 'A comprehensive term plan with whole life coverage option and multiple payout modes.',
    features: [
      'Coverage up to 100 years of age',
      'Whole life cover option',
      'Increasing sum assured benefit',
      '40+ critical illnesses covered',
      'Premium waiver on CI diagnosis',
      'Non-smoker discount available',
    ],
    minAge: 18, maxAge: 70, minCover: 10000000, maxCover: 1000000000, basePremium: 9150, isFeatured: false,
  },
  {
    slug: 'sbi-eshield-next',
    name: 'SBI Life eShield Next',
    insurerSlug: 'sbi-life',
    type: 'life',
    description: 'SBI Life\'s comprehensive online term insurance with increasing cover benefit to match inflation.',
    features: [
      'Level or increasing sum assured',
      '5% annual increment in cover',
      'Accidental total & permanent disability rider',
      'Critical illness rider available',
      'Waiver of premium benefit',
      'Online purchase discount',
    ],
    minAge: 18, maxAge: 65, minCover: 5000000, maxCover: 500000000, basePremium: 10020, isFeatured: false,
  },
  // ── HEALTH ────────────────────────────────────────────────────────────────
  {
    slug: 'star-family-health-optima',
    name: 'Star Family Health Optima',
    insurerSlug: 'star-health',
    type: 'health',
    description: 'A comprehensive family floater health plan with automatic recharge and no room rent capping.',
    features: [
      'Family floater up to 6 members',
      'No room rent capping',
      'Automatic recharge of sum insured',
      '14,000+ network hospitals',
      'Pre/post hospitalisation cover',
      'Maternity cover after 3 years',
      'AYUSH treatment covered',
    ],
    minAge: 18, maxAge: 65, minCover: 300000, maxCover: 2500000, basePremium: 18500, isFeatured: true,
  },
  {
    slug: 'niva-bupa-reassure-2',
    name: 'Niva Bupa ReAssure 2.0',
    insurerSlug: 'niva-bupa',
    type: 'health',
    description: 'India\'s first health plan with unlimited recharge and a booster that never expires.',
    features: [
      'Unlimited recharge of base sum insured',
      'Booster that never expires',
      'No capping on room rent',
      'Direct claim settlement without TPA',
      '8,500+ network hospitals',
      'Annual health check-up',
      'OPD cover available as add-on',
    ],
    minAge: 18, maxAge: 65, minCover: 300000, maxCover: 10000000, basePremium: 20200, isFeatured: true,
  },
  {
    slug: 'hdfc-ergo-optima-restore',
    name: 'HDFC ERGO Optima Restore',
    insurerSlug: 'hdfc-ergo',
    type: 'health',
    description: 'A feature-packed health plan with restore benefit that reinstates the full sum insured after every claim.',
    features: [
      'Restore benefit — 100% SI reinstated',
      'Multiplier benefit — 50% bonus each year',
      'No sub-limits on room rent',
      '13,000+ cashless hospitals',
      'Covers 586 day-care procedures',
      'Lifelong renewability',
      'Free health check-up from year 2',
    ],
    minAge: 18, maxAge: 65, minCover: 300000, maxCover: 2500000, basePremium: 18900, isFeatured: true,
  },
  {
    slug: 'icici-lombard-complete-health',
    name: 'ICICI Lombard Complete Health Insurance',
    insurerSlug: 'icici-lombard',
    type: 'health',
    description: 'A balanced health plan covering individual and family with cashless access at 6,500+ hospitals.',
    features: [
      'Sum insured up to ₹50 lakh',
      '6,500+ cashless hospitals',
      'No co-payment for age < 46',
      'Mental illness treatment covered',
      'Organ donor cover',
      'Road ambulance cover',
      'OPD expenses covered',
    ],
    minAge: 18, maxAge: 70, minCover: 300000, maxCover: 5000000, basePremium: 15800, isFeatured: false,
  },
  {
    slug: 'care-health-supreme',
    name: 'Care Health Supreme',
    insurerSlug: 'care-health',
    type: 'health',
    description: 'A premium health plan with unlimited cover on restoration and international emergency coverage.',
    features: [
      'Unlimited restoration of sum insured',
      'No claim bonus up to 50%',
      'International emergency cover',
      'Air ambulance cover',
      'Mental wellness support',
      '21,000+ network hospitals',
      'Personal accident cover',
    ],
    minAge: 5, maxAge: 99, minCover: 500000, maxCover: 60000000, basePremium: 17350, isFeatured: false,
  },
  {
    slug: 'aditya-birla-activ-one-max',
    name: 'Aditya Birla Activ One Max',
    insurerSlug: 'aditya-birla-health',
    type: 'health',
    description: 'India\'s first health plan that rewards healthy living with premium discounts and wellness benefits.',
    features: [
      'HealthReturns™ — earn up to 30% premium back',
      'Chronic Management Program',
      'Wellness coaching included',
      'No sub-limits on modern treatments',
      'International second opinion',
      'Day 1 maternity cover',
      'Annual health risk assessment',
    ],
    minAge: 18, maxAge: 65, minCover: 500000, maxCover: 60000000, basePremium: 21600, isFeatured: true,
  },
  // ── MOTOR ─────────────────────────────────────────────────────────────────
  {
    slug: 'bajaj-allianz-comprehensive-car',
    name: 'Bajaj Allianz Comprehensive Car Insurance',
    insurerSlug: 'bajaj-allianz-general',
    type: 'motor',
    description: 'All-round protection for your car against accidents, theft, natural disasters and third-party liability.',
    features: [
      'Own damage + third-party cover',
      '6,500+ cashless garages',
      'Zero depreciation add-on available',
      '24x7 roadside assistance',
      'Engine protection cover',
      'Consumables cover',
      'Return to invoice cover',
    ],
    minAge: 18, maxAge: 70, minCover: 100000, maxCover: 5000000, basePremium: 6480, isFeatured: true,
  },
  {
    slug: 'digit-comprehensive-car',
    name: 'Digit Comprehensive Car Insurance',
    insurerSlug: 'go-digit',
    type: 'motor',
    description: 'A digital-first car insurance with self-inspection for quick claims and transparent pricing.',
    features: [
      'Self-inspection via app',
      'Spot claim settlement',
      '6,900+ cashless garages',
      'Zero depreciation standard',
      'Engine & gearbox protection',
      '24x7 on-call assistance',
      'No-claim bonus protection',
    ],
    minAge: 18, maxAge: 70, minCover: 100000, maxCover: 5000000, basePremium: 6190, isFeatured: true,
  },
  {
    slug: 'hdfc-ergo-comprehensive-car',
    name: 'HDFC ERGO Comprehensive Car Insurance',
    insurerSlug: 'hdfc-ergo',
    type: 'motor',
    description: 'Award-winning car insurance with 100% paperless claims processing and immediate settlement.',
    features: [
      'Instant paperless claim settlement',
      '6,800+ cashless garages',
      'Personal accident cover of ₹15 lakh',
      'Zero depreciation available',
      'NCB protection rider',
      'Key replacement cover',
      'Tyre protection cover',
    ],
    minAge: 18, maxAge: 70, minCover: 100000, maxCover: 5000000, basePremium: 6820, isFeatured: false,
  },
  {
    slug: 'tata-aig-comprehensive-car',
    name: 'Tata AIG Comprehensive Car Insurance',
    insurerSlug: 'tata-aig-general',
    type: 'motor',
    description: 'Tata AIG\'s comprehensive motor policy with widest add-on options and quick claim processing.',
    features: [
      '7,500+ cashless garages',
      'New for old benefit',
      'Accident shield rider',
      'Roadside assistance 24x7',
      'Emergency medical expenses',
      'Lost key cover',
      'Ambulance charges covered',
    ],
    minAge: 18, maxAge: 70, minCover: 100000, maxCover: 5000000, basePremium: 6640, isFeatured: false,
  },
  // ── TRAVEL ────────────────────────────────────────────────────────────────
  {
    slug: 'bajaj-allianz-travel-elite',
    name: 'Bajaj Allianz Travel Elite',
    insurerSlug: 'bajaj-allianz-general',
    type: 'travel',
    description: 'Comprehensive international travel insurance with emergency medical, trip cancellation and baggage loss cover.',
    features: [
      'Emergency medical up to $500,000',
      'Trip cancellation & interruption',
      'Checked baggage loss cover',
      'Flight delay compensation',
      'Personal accident cover',
      'Passport loss assistance',
      'Home burglary while travelling',
    ],
    minAge: 3, maxAge: 70, minCover: 3000000, maxCover: 37500000, basePremium: 3480, isFeatured: true,
  },
  {
    slug: 'hdfc-ergo-travel-insurance',
    name: 'HDFC ERGO Individual International Travel',
    insurerSlug: 'hdfc-ergo',
    type: 'travel',
    description: 'Single trip international coverage with cashless medical services at 1 million+ hospitals worldwide.',
    features: [
      'Cashless at 1 million+ hospitals',
      'Medical evacuation covered',
      'Political evacuation cover',
      'Sports activities covered',
      'Covid-19 hospitalisation cover',
      'Sponsor protection cover',
      '24x7 travel helpline',
    ],
    minAge: 6, maxAge: 70, minCover: 1500000, maxCover: 37500000, basePremium: 3820, isFeatured: false,
  },
  {
    slug: 'tata-aig-travel-guard',
    name: 'Tata AIG Travel Guard',
    insurerSlug: 'tata-aig-general',
    type: 'travel',
    description: 'A Schengen-compliant travel insurance plan with round-the-clock global assistance.',
    features: [
      'Schengen visa compliant',
      'Medical expenses up to $500,000',
      'Dental pain relief expenses',
      'Hijacking distress allowance',
      'Legal expenses abroad',
      'Adventure sports covered',
      'Automatic trip extension',
    ],
    minAge: 6, maxAge: 70, minCover: 3000000, maxCover: 37500000, basePremium: 3210, isFeatured: false,
  },
  // ── HOME ──────────────────────────────────────────────────────────────────
  {
    slug: 'hdfc-ergo-home-shield',
    name: 'HDFC ERGO Home Shield',
    insurerSlug: 'hdfc-ergo',
    type: 'home',
    description: 'All-in-one home insurance protecting your building and contents from fire, theft, natural disasters and more.',
    features: [
      'Building + contents cover',
      'Fire, flood, earthquake protection',
      'Burglary & theft cover',
      'Electrical & mechanical breakdown',
      'Public liability cover',
      'Rent for alternate accommodation',
      'Valuable articles cover',
    ],
    minAge: 18, maxAge: 80, minCover: 1000000, maxCover: 100000000, basePremium: 4200, isFeatured: true,
  },
  {
    slug: 'bajaj-allianz-home-insurance',
    name: 'Bajaj Allianz Home Insurance',
    insurerSlug: 'bajaj-allianz-general',
    type: 'home',
    description: 'Comprehensive protection for your home against structural damage, contents and personal accident.',
    features: [
      'Structure cover up to ₹5 Crore',
      'Contents cover separately',
      'Terrorism cover included',
      'Plate glass breakage',
      'Pedal cycle cover',
      'Jewellery & art cover add-on',
      'Loss of rent cover',
    ],
    minAge: 18, maxAge: 80, minCover: 1000000, maxCover: 50000000, basePremium: 3850, isFeatured: false,
  },
  // ── BUSINESS ──────────────────────────────────────────────────────────────
  {
    slug: 'icici-lombard-commercial-package',
    name: 'ICICI Lombard Commercial Package',
    insurerSlug: 'icici-lombard',
    type: 'business',
    description: 'A modular business insurance solution covering property, liability, marine, employees and cyber risk.',
    features: [
      'Property all-risk cover',
      'Public & product liability',
      'Marine cargo & transit',
      'Employee compensation',
      'Cyber risk cover add-on',
      'Business interruption cover',
      'Directors & officers liability',
    ],
    minAge: 18, maxAge: 99, minCover: 5000000, maxCover: 1000000000, basePremium: 24500, isFeatured: true,
  },
  {
    slug: 'bajaj-allianz-sme-package',
    name: 'Bajaj Allianz SME Package',
    insurerSlug: 'bajaj-allianz-general',
    type: 'business',
    description: 'Tailored insurance for small and medium businesses covering assets, liability and workers.',
    features: [
      'Fire & allied perils',
      'Burglary & theft',
      'Employer\'s liability',
      'Money in transit cover',
      'Electronic equipment cover',
      'Fidelity guarantee',
      'Group personal accident',
    ],
    minAge: 18, maxAge: 99, minCover: 2000000, maxCover: 500000000, basePremium: 18750, isFeatured: false,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SEED USERS
// ─────────────────────────────────────────────────────────────────────────────
const USERS = [
  {
    phone: '9876543210',
    name: 'Arjun Sharma',
    email: 'arjun.sharma@gmail.com',
    dateOfBirth: new Date('1990-03-15'),
    gender: 'male',
    address: '42, MG Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
  },
  {
    phone: '9823456789',
    name: 'Priya Nair',
    email: 'priya.nair@outlook.com',
    dateOfBirth: new Date('1988-07-22'),
    gender: 'female',
    address: '15, Anna Salai',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600002',
  },
  {
    phone: '9712345678',
    name: 'Rohit Gupta',
    email: 'rohit.gupta@yahoo.com',
    dateOfBirth: new Date('1995-11-08'),
    gender: 'male',
    address: '7, Sector 18',
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: '201301',
  },
  {
    phone: '9654321098',
    name: 'Kavitha Reddy',
    email: 'kavitha.reddy@gmail.com',
    dateOfBirth: new Date('1985-05-30'),
    gender: 'female',
    address: '28, Banjara Hills',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500034',
  },
  {
    phone: '9543210987',
    name: 'Vikram Patel',
    email: 'vikram.patel@icloud.com',
    dateOfBirth: new Date('1992-09-18'),
    gender: 'male',
    address: '3, Satellite Road',
    city: 'Ahmedabad',
    state: 'Gujarat',
    pincode: '380015',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);
const daysFromNow = (n: number) => new Date(Date.now() + n * 86_400_000);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🌱 Starting seed...\n');

  // ── 0. Clean existing data ─────────────────────────────────────────────────
  console.log('🗑  Cleaning existing data...');
  await prisma.notification.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.claim.deleteMany();
  await prisma.policy.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.otpChallenge.deleteMany();
  await prisma.user.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.insurer.deleteMany();
  await prisma.admin.deleteMany();

  // ── 1. Insurers ────────────────────────────────────────────────────────────
  console.log('🏢 Seeding insurers...');
  const insurerMap = new Map<string, string>(); // slug → id
  for (const data of INSURERS) {
    const ins = await prisma.insurer.create({ data });
    insurerMap.set(ins.slug, ins.id);
    process.stdout.write(`   ✓ ${ins.shortName}\n`);
  }

  // ── 2. Plans ───────────────────────────────────────────────────────────────
  console.log('\n📋 Seeding plans...');
  const planMap = new Map<string, string>(); // slug → id
  for (const { insurerSlug, ...data } of PLANS) {
    const insurerId = insurerMap.get(insurerSlug);
    if (!insurerId) { console.warn(`   ⚠  Insurer not found: ${insurerSlug}`); continue; }
    const plan = await prisma.plan.create({
      data: { ...data, insurerId, features: JSON.stringify(data.features) }
    });
    planMap.set(plan.slug, plan.id);
    process.stdout.write(`   ✓ ${plan.name}\n`);
  }

  // ── 3. Users ───────────────────────────────────────────────────────────────
  console.log('\n👤 Seeding users...');
  const userIds: string[] = [];
  for (const data of USERS) {
    const user = await prisma.user.create({ data });
    userIds.push(user.id);
    process.stdout.write(`   ✓ ${user.name} (${user.phone})\n`);
  }

  const [arjunId, priyaId, rohitId, kavithaId, vikramId] = userIds as [string, string, string, string, string];

  // ── 4. Policies ────────────────────────────────────────────────────────────
  console.log('\n📜 Seeding policies...');

  const policies = await Promise.all([
    // Arjun — term life + health
    prisma.policy.create({ data: {
      policyNumber: 'POL-2024-LIC-001',
      type: 'life', provider: 'LIC',
      insurerId: insurerMap.get('lic'), planId: planMap.get('lic-tech-term'),
      sumInsured: 10000000, premium: 11820,
      startDate: daysAgo(365), endDate: daysFromNow(0),
      status: 'active', paymentStatus: 'paid', userId: arjunId,
    }}),
    prisma.policy.create({ data: {
      policyNumber: 'POL-2024-STH-002',
      type: 'health', provider: 'Star Health',
      insurerId: insurerMap.get('star-health'), planId: planMap.get('star-family-health-optima'),
      sumInsured: 1000000, premium: 18500,
      startDate: daysAgo(180), endDate: daysFromNow(185),
      status: 'active', paymentStatus: 'paid', userId: arjunId,
    }}),
    prisma.policy.create({ data: {
      policyNumber: 'POL-2024-BAJ-003',
      type: 'motor', provider: 'Bajaj Allianz',
      insurerId: insurerMap.get('bajaj-allianz-general'), planId: planMap.get('bajaj-allianz-comprehensive-car'),
      sumInsured: 600000, premium: 6480,
      startDate: daysAgo(90), endDate: daysFromNow(275),
      status: 'active', paymentStatus: 'paid', userId: arjunId,
    }}),

    // Priya — health + travel
    prisma.policy.create({ data: {
      policyNumber: 'POL-2024-NB-004',
      type: 'health', provider: 'Niva Bupa',
      insurerId: insurerMap.get('niva-bupa'), planId: planMap.get('niva-bupa-reassure-2'),
      sumInsured: 500000, premium: 20200,
      startDate: daysAgo(200), endDate: daysFromNow(165),
      status: 'active', paymentStatus: 'paid', userId: priyaId,
    }}),
    prisma.policy.create({ data: {
      policyNumber: 'POL-2024-HDFC-005',
      type: 'life', provider: 'HDFC Life',
      insurerId: insurerMap.get('hdfc-life'), planId: planMap.get('hdfc-click2protect-super'),
      sumInsured: 20000000, premium: 9490,
      startDate: daysAgo(400), endDate: daysFromNow(330),  // expired recently
      status: 'expired', paymentStatus: 'paid', userId: priyaId,
    }}),
    prisma.policy.create({ data: {
      policyNumber: 'POL-2024-BAJ-006',
      type: 'travel', provider: 'Bajaj Allianz',
      insurerId: insurerMap.get('bajaj-allianz-general'), planId: planMap.get('bajaj-allianz-travel-elite'),
      sumInsured: 3750000, premium: 3480,
      startDate: daysAgo(10), endDate: daysFromNow(5),
      status: 'active', paymentStatus: 'paid', userId: priyaId,
    }}),

    // Rohit — life + motor + home
    prisma.policy.create({ data: {
      policyNumber: 'POL-2024-MAX-007',
      type: 'life', provider: 'Max Life',
      insurerId: insurerMap.get('max-life'), planId: planMap.get('max-life-smart-secure-plus'),
      sumInsured: 15000000, premium: 8040,
      startDate: daysAgo(60), endDate: daysFromNow(305),
      status: 'active', paymentStatus: 'paid', userId: rohitId,
    }}),
    prisma.policy.create({ data: {
      policyNumber: 'POL-2024-DIG-008',
      type: 'motor', provider: 'Digit Insurance',
      insurerId: insurerMap.get('go-digit'), planId: planMap.get('digit-comprehensive-car'),
      sumInsured: 750000, premium: 6190,
      startDate: daysAgo(30), endDate: daysFromNow(335),
      status: 'active', paymentStatus: 'paid', userId: rohitId,
    }}),
    prisma.policy.create({ data: {
      policyNumber: 'POL-2024-HEH-009',
      type: 'home', provider: 'HDFC ERGO',
      insurerId: insurerMap.get('hdfc-ergo'), planId: planMap.get('hdfc-ergo-home-shield'),
      sumInsured: 5000000, premium: 4200,
      startDate: daysAgo(5), endDate: daysFromNow(360),
      status: 'active', paymentStatus: 'pending', userId: rohitId,
    }}),

    // Kavitha — health + business
    prisma.policy.create({ data: {
      policyNumber: 'POL-2024-AB-010',
      type: 'health', provider: 'Aditya Birla Health',
      insurerId: insurerMap.get('aditya-birla-health'), planId: planMap.get('aditya-birla-activ-one-max'),
      sumInsured: 1000000, premium: 21600,
      startDate: daysAgo(120), endDate: daysFromNow(245),
      status: 'active', paymentStatus: 'paid', userId: kavithaId,
    }}),
    prisma.policy.create({ data: {
      policyNumber: 'POL-2024-ICL-011',
      type: 'business', provider: 'ICICI Lombard',
      insurerId: insurerMap.get('icici-lombard'), planId: planMap.get('icici-lombard-commercial-package'),
      sumInsured: 20000000, premium: 24500,
      startDate: daysAgo(45), endDate: daysFromNow(320),
      status: 'active', paymentStatus: 'paid', userId: kavithaId,
    }}),

    // Vikram — term + health + motor (cancelled motor)
    prisma.policy.create({ data: {
      policyNumber: 'POL-2024-IPRU-012',
      type: 'life', provider: 'ICICI Pru Life',
      insurerId: insurerMap.get('icici-pru-life'), planId: planMap.get('icici-pru-iprotect-smart'),
      sumInsured: 10000000, premium: 8545,
      startDate: daysAgo(270), endDate: daysFromNow(95),
      status: 'active', paymentStatus: 'paid', userId: vikramId,
    }}),
    prisma.policy.create({ data: {
      policyNumber: 'POL-2024-CARE-013',
      type: 'health', provider: 'Care Health',
      insurerId: insurerMap.get('care-health'), planId: planMap.get('care-health-supreme'),
      sumInsured: 500000, premium: 17350,
      startDate: daysAgo(100), endDate: daysFromNow(265),
      status: 'active', paymentStatus: 'paid', userId: vikramId,
    }}),
    prisma.policy.create({ data: {
      policyNumber: 'POL-2024-TATA-014',
      type: 'motor', provider: 'Tata AIG',
      insurerId: insurerMap.get('tata-aig-general'), planId: planMap.get('tata-aig-comprehensive-car'),
      sumInsured: 450000, premium: 6640,
      startDate: daysAgo(200), endDate: daysFromNow(165),
      status: 'cancelled', paymentStatus: 'paid',
      cancelledAt: daysAgo(50), userId: vikramId,
    }}),
  ]);

  policies.forEach(p => process.stdout.write(`   ✓ ${p.policyNumber} — ${p.type} (${p.provider})\n`));

  // ── 5. Payments ────────────────────────────────────────────────────────────
  console.log('\n💳 Seeding payments...');
  for (const policy of policies.filter(p => p.paymentStatus === 'paid')) {
    await prisma.payment.create({ data: {
      amount: policy.premium,
      status: 'success',
      provider: 'razorpay',
      providerRef: `pay_${Math.random().toString(36).slice(2, 14).toUpperCase()}`,
      userId: policy.userId,
      policyId: policy.id,
    }});
  }
  console.log(`   ✓ ${policies.filter(p => p.paymentStatus === 'paid').length} payments created`);

  // ── 6. Claims ──────────────────────────────────────────────────────────────
  console.log('\n📋 Seeding claims...');
  const claims = await Promise.all([
    // Arjun — health claim (approved & paid)
    prisma.claim.create({ data: {
      claimNumber: 'CLM-2024-001',
      type: 'hospitalisation',
      amount: 85000,
      status: 'paid',
      description: 'Emergency appendix surgery at Manipal Hospital, Bangalore. Includes surgery, anaesthesia, 4-day ICU stay and post-op medication.',
      incidentDate: daysAgo(120),
      submittedDate: daysAgo(115),
      approvedDate: daysAgo(110),
      paidDate: daysAgo(105),
      notes: 'Claim verified. All documents in order. Approved within SLA.',
      userId: arjunId,
      policyId: policies[1]!.id,
    }}),
    // Arjun — motor claim (approved, awaiting payment)
    prisma.claim.create({ data: {
      claimNumber: 'CLM-2024-002',
      type: 'accident',
      amount: 42000,
      status: 'approved',
      description: 'Front-end collision damage to Maruti Swift on Outer Ring Road. Bonnet, headlights, bumper and radiator require replacement.',
      incidentDate: daysAgo(40),
      submittedDate: daysAgo(38),
      approvedDate: daysAgo(30),
      notes: 'Surveyor report attached. Garage estimate approved.',
      userId: arjunId,
      policyId: policies[2]!.id,
    }}),

    // Priya — health claim (pending review)
    prisma.claim.create({ data: {
      claimNumber: 'CLM-2024-003',
      type: 'maternity',
      amount: 120000,
      status: 'pending',
      description: 'Planned C-section delivery at Apollo Hospitals, Chennai. Includes pre-natal, delivery and 5-day post-natal hospitalisation.',
      incidentDate: daysAgo(7),
      submittedDate: daysAgo(5),
      userId: priyaId,
      policyId: policies[3]!.id,
    }}),

    // Rohit — motor claim (rejected)
    prisma.claim.create({ data: {
      claimNumber: 'CLM-2024-004',
      type: 'theft',
      amount: 750000,
      status: 'rejected',
      description: 'Claimed total vehicle theft while parked at Noida Sector 18 market. FIR filed with Noida Police Station.',
      incidentDate: daysAgo(80),
      submittedDate: daysAgo(75),
      approvedDate: daysAgo(60),
      notes: 'Claim rejected — police investigation found vehicle was sold by owner. FIR details did not match. Fraud indicator raised.',
      userId: rohitId,
      policyId: policies[7]!.id,
    }}),

    // Kavitha — health claim (paid)
    prisma.claim.create({ data: {
      claimNumber: 'CLM-2024-005',
      type: 'critical_illness',
      amount: 250000,
      status: 'paid',
      description: 'Type 2 diabetes complications leading to 12-day hospitalisation for diabetic ketoacidosis. Treated at KIMS Hospital, Hyderabad.',
      incidentDate: daysAgo(200),
      submittedDate: daysAgo(195),
      approvedDate: daysAgo(185),
      paidDate: daysAgo(178),
      notes: 'All diagnostic reports verified. Claim settled under critical illness benefit.',
      userId: kavithaId,
      policyId: policies[9]!.id,
    }}),

    // Kavitha — business claim (pending)
    prisma.claim.create({ data: {
      claimNumber: 'CLM-2024-006',
      type: 'property_damage',
      amount: 850000,
      status: 'pending',
      description: 'Office premises flooded due to heavy rains on August 14. Server room, furniture and electrical fittings severely damaged. Business interrupted for 6 days.',
      incidentDate: daysAgo(20),
      submittedDate: daysAgo(18),
      userId: kavithaId,
      policyId: policies[10]!.id,
    }}),

    // Vikram — health claim (approved)
    prisma.claim.create({ data: {
      claimNumber: 'CLM-2024-007',
      type: 'accident',
      amount: 65000,
      status: 'approved',
      description: 'Road accident resulting in fractured tibia. Emergency surgery at Sterling Hospital, Ahmedabad followed by 7-day hospitalisation.',
      incidentDate: daysAgo(55),
      submittedDate: daysAgo(52),
      approvedDate: daysAgo(45),
      notes: 'Surgery reports and physiotherapy bills verified. Approved in full.',
      userId: vikramId,
      policyId: policies[12]!.id,
    }}),
  ]);
  claims.forEach(c => process.stdout.write(`   ✓ ${c.claimNumber} — ${c.type} ₹${c.amount.toLocaleString('en-IN')} [${c.status}]\n`));

  // ── 7. Notifications ───────────────────────────────────────────────────────
  console.log('\n🔔 Seeding notifications...');
  await prisma.notification.createMany({ data: [
    // Arjun
    { userId: arjunId, type: 'claim_update', title: 'Claim Paid', body: 'Your claim CLM-2024-001 for ₹85,000 has been settled. Amount transferred to your account.', isRead: true, readAt: daysAgo(104), createdAt: daysAgo(105) },
    { userId: arjunId, type: 'claim_update', title: 'Claim Approved', body: 'Your motor claim CLM-2024-002 for ₹42,000 has been approved. Payment will be processed within 3 working days.', isRead: false, createdAt: daysAgo(30) },
    { userId: arjunId, type: 'policy_expiry', title: 'Policy Expiring Soon', body: 'Your LIC Tech Term policy (POL-2024-LIC-001) expires in 30 days. Renew now to avoid a lapse in coverage.', isRead: false, createdAt: daysAgo(1) },
    { userId: arjunId, type: 'general', title: 'Welcome to ASK Insurance!', body: 'Your account is set up and your policies are active. View your portfolio on the dashboard.', isRead: true, readAt: daysAgo(364), createdAt: daysAgo(365) },

    // Priya
    { userId: priyaId, type: 'claim_update', title: 'Claim Under Review', body: 'Your maternity claim CLM-2024-003 is under review. We will update you within 7 working days.', isRead: false, createdAt: daysAgo(4) },
    { userId: priyaId, type: 'policy_expiry', title: 'Policy Expired', body: 'Your HDFC Life Click 2 Protect policy (POL-2024-HDFC-005) has expired. Please renew to restore your life cover.', isRead: false, createdAt: daysAgo(0) },
    { userId: priyaId, type: 'payment_due', title: 'Premium Due', body: 'The annual premium of ₹20,200 for your Niva Bupa ReAssure 2.0 policy is due in 15 days.', isRead: true, readAt: daysAgo(10), createdAt: daysAgo(15) },

    // Rohit
    { userId: rohitId, type: 'claim_update', title: 'Claim Rejected', body: 'Your theft claim CLM-2024-004 has been rejected after investigation. Please contact our support team for details.', isRead: true, readAt: daysAgo(58), createdAt: daysAgo(60) },
    { userId: rohitId, type: 'payment_due', title: 'Premium Due', body: 'Payment of ₹4,200 for HDFC ERGO Home Shield (POL-2024-HEH-009) is due. Complete payment to activate your policy.', isRead: false, createdAt: daysAgo(5) },

    // Kavitha
    { userId: kavithaId, type: 'claim_update', title: 'Claim Paid', body: 'Your critical illness claim CLM-2024-005 for ₹2,50,000 has been settled. Stay healthy!', isRead: true, readAt: daysAgo(177), createdAt: daysAgo(178) },
    { userId: kavithaId, type: 'claim_update', title: 'Claim Submitted', body: 'Your property damage claim CLM-2024-006 for ₹8,50,000 has been submitted. Our surveyor will contact you within 48 hours.', isRead: true, readAt: daysAgo(17), createdAt: daysAgo(18) },

    // Vikram
    { userId: vikramId, type: 'claim_update', title: 'Claim Approved', body: 'Your accident claim CLM-2024-007 for ₹65,000 is approved. Payment will be credited within 5 working days.', isRead: false, createdAt: daysAgo(45) },
    { userId: vikramId, type: 'general', title: 'Policy Cancelled', body: 'Your Tata AIG motor policy (POL-2024-TATA-014) has been cancelled as requested. Pro-rata refund will be processed.', isRead: true, readAt: daysAgo(48), createdAt: daysAgo(50) },
  ]});
  console.log('   ✓ Notifications created');

  // ── 8. Admin users ─────────────────────────────────────────────────────────
  console.log('\n🔐 Seeding admin users...');
  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const superPassword = await bcrypt.hash('Super@123', 12);
  await prisma.admin.createMany({ data: [
    { name: 'Super Admin',    email: 'superadmin@askinsurance.in', password: superPassword, role: 'superadmin' },
    { name: 'Rahul Verma',    email: 'rahul.verma@askinsurance.in', password: adminPassword, role: 'admin' },
    { name: 'Sneha Kapoor',   email: 'sneha.kapoor@askinsurance.in', password: adminPassword, role: 'admin' },
  ]});
  console.log('   ✓ superadmin@askinsurance.in (Super@123)');
  console.log('   ✓ rahul.verma@askinsurance.in (Admin@123)');
  console.log('   ✓ sneha.kapoor@askinsurance.in (Admin@123)');

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(55));
  console.log('✅ Seed complete!\n');
  console.log(`   Insurers   : ${INSURERS.length}`);
  console.log(`   Plans      : ${PLANS.length}`);
  console.log(`   Users      : ${USERS.length}`);
  console.log(`   Policies   : ${policies.length}`);
  console.log(`   Claims     : ${claims.length}`);
  console.log(`   Admins     : 3`);
  console.log('─'.repeat(55) + '\n');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
