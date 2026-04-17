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
// INSURERS  — only companies on ASK's partner list
// ─────────────────────────────────────────────────────────────────────────────
const INSURERS = [

  // ── Life Insurance ────────────────────────────────────────────────────────
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

  // ── Health Insurance ──────────────────────────────────────────────────────
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
    name: 'ManipalCigna Health Insurance',
    slug: 'manipalcigna',
    shortName: 'ManipalCigna',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/ManipalCigna_Health_Insurance_Logo.svg/1200px-ManipalCigna_Health_Insurance_Logo.svg.png',
    brandColor: '#0063A3',
    tagline: 'Good Health is Great Wealth',
    founded: 2014,
    headquarters: 'Mumbai, Maharashtra',
    website: 'https://www.manipalcigna.com',
    claimsRatio: 89.40,
    rating: 4.2,
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

  // ── General Insurance (PSU) ───────────────────────────────────────────────
  {
    name: 'The New India Assurance Company Ltd',
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
    name: 'National Insurance Company Ltd',
    slug: 'national-insurance',
    shortName: 'National Insurance',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/National_Insurance_Company_Logo.svg/1200px-National_Insurance_Company_Logo.svg.png',
    brandColor: '#1A4B8F',
    tagline: 'Serving the Nation Since 1906',
    founded: 1906,
    headquarters: 'Kolkata, West Bengal',
    website: 'https://nationalinsurance.nic.co.in',
    claimsRatio: 93.10,
    rating: 4.0,
  },
  {
    name: 'Oriental Insurance Company Ltd',
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
    name: 'United India Insurance Company Ltd',
    slug: 'united-india',
    shortName: 'United India',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/United_India_Insurance_Co._Ltd._Logo.svg/1200px-United_India_Insurance_Co._Ltd._Logo.svg.png',
    brandColor: '#005A9E',
    tagline: 'United We Serve',
    founded: 1938,
    headquarters: 'Chennai, Tamil Nadu',
    website: 'https://www.uiic.co.in',
    claimsRatio: 91.80,
    rating: 4.0,
  },

  // ── General Insurance (Private) ───────────────────────────────────────────
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
    name: 'Reliance General Insurance',
    slug: 'reliance-general',
    shortName: 'Reliance General',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Reliance_Industries_Logo.svg/1200px-Reliance_Industries_Logo.svg.png',
    brandColor: '#003087',
    tagline: 'Grow Confident',
    founded: 2000,
    headquarters: 'Mumbai, Maharashtra',
    website: 'https://www.reliancegeneral.co.in',
    claimsRatio: 85.60,
    rating: 4.0,
  },
  {
    name: 'IFFCO Tokio General Insurance',
    slug: 'iffco-tokio',
    shortName: 'IFFCO Tokio',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/IFFCO_Tokio_General_Insurance_Co._Ltd._Logo.svg/1200px-IFFCO_Tokio_General_Insurance_Co._Ltd._Logo.svg.png',
    brandColor: '#006C35',
    tagline: 'Your Lifetime Partner',
    founded: 2000,
    headquarters: 'Gurugram, Haryana',
    website: 'https://www.iffcotokio.co.in',
    claimsRatio: 87.40,
    rating: 4.1,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PLANS  — ASK's product catalogue
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

  // ════════════════════════════════════════════════════════════════════════════
  // LIFE INSURANCE
  // ════════════════════════════════════════════════════════════════════════════

  // ── Term Plans ────────────────────────────────────────────────────────────
  {
    slug: 'lic-tech-term',
    name: 'LIC Tech Term',
    insurerSlug: 'lic',
    type: 'life',
    description: 'Pure online term plan from LIC with high sum assured, flexible payout options and tax benefits under Sec 80C.',
    features: [
      'Sum assured up to ₹5 Crore',
      'Lump sum or monthly income payout',
      'Accidental death benefit rider available',
      'Tax benefit under Sec 80C & 10(10D)',
      'Grace period: 30 days',
      'Free look period: 15 days',
      'Exclusion: Suicide within 12 months',
    ],
    minAge: 18, maxAge: 65, minCover: 5000000, maxCover: 500000000, basePremium: 11820, isFeatured: true,
  },
  {
    slug: 'hdfc-click2protect-super',
    name: 'HDFC Life Click 2 Protect Super',
    insurerSlug: 'hdfc-life',
    type: 'life',
    description: 'Comprehensive online term plan with life cover, income benefit and return of premium options.',
    features: [
      '3 plan options: Life, Extra Life & Income',
      'Return of premium on survival',
      'Waiver of premium on disability',
      '99.39% claims settlement ratio',
      'Instant policy issuance',
      'Flexible premium payment terms',
      'Exclusion: Fraud or misrepresentation',
    ],
    minAge: 18, maxAge: 65, minCover: 10000000, maxCover: 1000000000, basePremium: 9490, isFeatured: true,
  },
  {
    slug: 'max-life-smart-secure-plus',
    name: 'Max Life Smart Secure Plus',
    insurerSlug: 'max-life',
    type: 'life',
    description: 'Feature-rich term plan with the highest claims settlement ratio among private life insurers in India.',
    features: [
      '99.34% claims settlement ratio',
      'In-built terminal illness cover',
      'Special exit value option',
      'Accidental death benefit add-on',
      'Critical illness rider available',
      'Joint life cover option',
      'Exclusion: Pre-existing undisclosed illness',
    ],
    minAge: 18, maxAge: 65, minCover: 5000000, maxCover: 1000000000, basePremium: 8040, isFeatured: true,
  },
  {
    slug: 'icici-pru-iprotect-smart',
    name: 'ICICI Pru iProtect Smart',
    insurerSlug: 'icici-pru-life',
    type: 'life',
    description: 'India\'s award-winning term plan with comprehensive protection including 34 critical illness cover.',
    features: [
      'Life, Life Plus, Life & Health options',
      '34 critical illnesses covered',
      'Accidental death benefit',
      'Permanent disability cover',
      'Monthly income option for family',
      'Online discount up to 5%',
      'Exclusion: Suicide within first year',
    ],
    minAge: 18, maxAge: 60, minCover: 5000000, maxCover: 2000000000, basePremium: 8545, isFeatured: false,
  },
  {
    slug: 'sbi-eshield-next',
    name: 'SBI Life eShield Next',
    insurerSlug: 'sbi-life',
    type: 'life',
    description: 'Comprehensive online term plan with increasing cover benefit to protect against inflation.',
    features: [
      'Level or increasing sum assured',
      '5% annual increment in cover',
      'Accidental total & permanent disability rider',
      'Critical illness rider available',
      'Waiver of premium on disability',
      'Online purchase discount',
      'Exclusion: War risk, self-inflicted injury',
    ],
    minAge: 18, maxAge: 65, minCover: 5000000, maxCover: 500000000, basePremium: 10020, isFeatured: false,
  },

  // ── Endowment Plans ───────────────────────────────────────────────────────
  {
    slug: 'lic-jeevan-anand',
    name: 'LIC Jeevan Anand',
    insurerSlug: 'lic',
    type: 'life',
    description: 'A participating non-linked endowment plan combining savings and protection with whole-life cover after maturity.',
    features: [
      'Death benefit + maturity benefit',
      'Whole life cover continues post maturity',
      'Bonus accumulation (simple reversionary)',
      'Accidental death & disability benefit rider',
      'Loan facility against policy',
      'Tax benefit under Sec 80C & 10(10D)',
      'Exclusion: Suicide within first year (adjusted)',
    ],
    minAge: 18, maxAge: 50, minCover: 100000, maxCover: 10000000, basePremium: 32000, isFeatured: true,
  },
  {
    slug: 'hdfc-sanchay-plus',
    name: 'HDFC Life Sanchay Plus',
    insurerSlug: 'hdfc-life',
    type: 'life',
    description: 'A non-participating savings plan with guaranteed returns and multiple income options for long-term financial security.',
    features: [
      'Guaranteed income for chosen period',
      '4 plan options: Immediate, Deferred, Whole Life, Long Term',
      'Return of premiums on death',
      'Loyalty additions post premium payment',
      'No medical exam up to age 45',
      'Tax benefits under Sec 80C & 10(10D)',
      'Exclusion: Misrepresentation of health data',
    ],
    minAge: 5, maxAge: 60, minCover: 200000, maxCover: 50000000, basePremium: 48000, isFeatured: false,
  },
  {
    slug: 'bajaj-allianz-guaranteed-savings',
    name: 'Bajaj Allianz Guaranteed Savings Goal',
    insurerSlug: 'bajaj-allianz-life',
    type: 'life',
    description: 'A non-linked guaranteed savings plan offering life cover and assured maturity benefits.',
    features: [
      'Guaranteed maturity benefit',
      'Life cover throughout policy term',
      'Flexible premium payment: 5 or 7 years',
      'Enhanced sum assured for females',
      'Loan facility available',
      'Tax deduction under Sec 80C',
      'Exclusion: Fraud/misrepresentation',
    ],
    minAge: 18, maxAge: 55, minCover: 200000, maxCover: 20000000, basePremium: 36000, isFeatured: false,
  },

  // ── ULIPs ─────────────────────────────────────────────────────────────────
  {
    slug: 'icici-pru-wealth-builder',
    name: 'ICICI Pru Wealth Builder II',
    insurerSlug: 'icici-pru-life',
    type: 'life',
    description: 'A unit-linked insurance plan offering market-linked wealth creation with life cover and flexible fund options.',
    features: [
      '7 fund options (equity, debt, balanced)',
      'Unlimited free switches between funds',
      'Loyalty additions from year 6 onwards',
      'Partial withdrawal after 5 years',
      'Life cover: 10× annual premium',
      'Return of mortality charges on maturity',
      'Exclusion: Market risk is borne by policyholder',
    ],
    minAge: 7, maxAge: 60, minCover: 500000, maxCover: 100000000, basePremium: 60000, isFeatured: true,
  },
  {
    slug: 'sbi-life-smart-platina-supreme',
    name: 'SBI Life Smart Platina Supreme',
    insurerSlug: 'sbi-life',
    type: 'life',
    description: 'A ULIP with single/limited premium options offering life cover and wealth accumulation through market-linked funds.',
    features: [
      'Single or 5/10-year premium payment',
      '10 fund options including ESG fund',
      'Portfolio Strategy Programme (auto-rebalancing)',
      'Guaranteed additions from year 6',
      'Tax-free fund switches',
      'Surrender value after 5 years',
      'Exclusion: Investment risk on policyholder',
    ],
    minAge: 18, maxAge: 65, minCover: 1000000, maxCover: 500000000, basePremium: 100000, isFeatured: false,
  },

  // ── Pension / Annuity Plans ───────────────────────────────────────────────
  {
    slug: 'lic-jeevan-shanti',
    name: 'LIC Jeevan Shanti',
    insurerSlug: 'lic',
    type: 'life',
    description: 'A single-premium deferred or immediate annuity plan providing guaranteed lifelong income.',
    features: [
      'Immediate or deferred annuity',
      '10 annuity options (life / joint life)',
      'Single premium — no further payment',
      'Return of purchase price on death',
      'Loan facility after 1 policy year',
      'No medical examination required',
      'Exclusion: No investment risk — fixed returns',
    ],
    minAge: 30, maxAge: 85, minCover: 100000, maxCover: 0, basePremium: 500000, isFeatured: true,
  },
  {
    slug: 'hdfc-systematic-retirement',
    name: 'HDFC Life Systematic Retirement Plan',
    insurerSlug: 'hdfc-life',
    type: 'life',
    description: 'A non-linked pension plan offering flexible annuity options with guaranteed income from vesting date.',
    features: [
      'Regular premium pension plan',
      'Guaranteed additions: 3% p.a. of premiums paid',
      'Flexible vesting age: 45–75 years',
      'Commutation of up to 1/3rd corpus at vesting',
      'Joint life annuity with spouse',
      'Tax benefit under Sec 80CCC',
      'Exclusion: Surrender not allowed in first 5 years',
    ],
    minAge: 25, maxAge: 65, minCover: 0, maxCover: 0, basePremium: 24000, isFeatured: false,
  },

  // ════════════════════════════════════════════════════════════════════════════
  // HEALTH INSURANCE
  // ════════════════════════════════════════════════════════════════════════════

  // ── Individual Health ─────────────────────────────────────────────────────
  {
    slug: 'star-individual-health-optima',
    name: 'Star Health Individual Optima',
    insurerSlug: 'star-health',
    type: 'health',
    description: 'Comprehensive individual health plan with no room rent capping and automatic recharge benefit.',
    features: [
      'Sum insured: ₹1L – ₹25L',
      'No room rent capping',
      'Automatic recharge of sum insured',
      '14,000+ network hospitals',
      '60-day pre & 90-day post hospitalisation',
      'AYUSH treatments covered',
      'Exclusion: Pre-existing diseases (2-yr wait)',
    ],
    minAge: 18, maxAge: 65, minCover: 100000, maxCover: 2500000, basePremium: 7200, isFeatured: true,
  },
  {
    slug: 'niva-bupa-reassure-2',
    name: 'Niva Bupa ReAssure 2.0',
    insurerSlug: 'niva-bupa',
    type: 'health',
    description: 'India\'s first health plan with unlimited recharge and a booster benefit that never expires.',
    features: [
      'Unlimited recharge of base sum insured',
      'Booster benefit — never expires',
      'No capping on room rent',
      'Direct claim settlement (no TPA)',
      '8,500+ network hospitals',
      'Annual health check-up included',
      'Exclusion: Cosmetic surgery, self-inflicted injury',
    ],
    minAge: 18, maxAge: 65, minCover: 300000, maxCover: 10000000, basePremium: 20200, isFeatured: true,
  },
  {
    slug: 'care-health-supreme',
    name: 'Care Health Supreme',
    insurerSlug: 'care-health',
    type: 'health',
    description: 'Premium individual plan with unlimited restoration, international emergency cover and air ambulance.',
    features: [
      'Unlimited restoration of sum insured',
      'No claim bonus up to 50%',
      'International emergency cover',
      'Air ambulance cover',
      '21,000+ network hospitals',
      'Personal accident cover included',
      'Exclusion: Waiting period for listed diseases (4 yrs)',
    ],
    minAge: 5, maxAge: 99, minCover: 500000, maxCover: 60000000, basePremium: 17350, isFeatured: false,
  },

  // ── Family Floater ────────────────────────────────────────────────────────
  {
    slug: 'star-family-health-optima',
    name: 'Star Family Health Optima',
    insurerSlug: 'star-health',
    type: 'health',
    description: 'Family floater covering up to 6 members with automatic recharge and maternity cover after 3 years.',
    features: [
      'Family floater — up to 6 members',
      'No room rent capping',
      'Automatic recharge of sum insured',
      'Maternity cover after 3 years',
      '14,000+ network hospitals',
      'Pre/post hospitalisation cover',
      'Exclusion: Pre-existing diseases (3-yr wait)',
    ],
    minAge: 18, maxAge: 65, minCover: 300000, maxCover: 2500000, basePremium: 18500, isFeatured: true,
  },
  {
    slug: 'hdfc-ergo-optima-restore',
    name: 'HDFC ERGO Optima Restore Family',
    insurerSlug: 'hdfc-ergo',
    type: 'health',
    description: 'Family floater with restore benefit that reinstates the full sum insured after every claim.',
    features: [
      'Restore benefit — 100% SI reinstated',
      'Multiplier benefit: 50% bonus per claim-free year',
      'No sub-limits on room rent',
      '13,000+ cashless hospitals',
      'Covers 586 day-care procedures',
      'Lifelong renewability',
      'Exclusion: Cosmetic surgery, dental (unless accidental)',
    ],
    minAge: 18, maxAge: 65, minCover: 300000, maxCover: 2500000, basePremium: 18900, isFeatured: false,
  },
  {
    slug: 'manipalcigna-prime-active',
    name: 'ManipalCigna Prime Active Family',
    insurerSlug: 'manipalcigna',
    type: 'health',
    description: 'A wellness-linked family floater rewarding healthy habits with premium discounts and OPD cover.',
    features: [
      'Wellness-linked premium discount',
      'OPD cover included',
      'No room rent capping',
      'Co-payment waiver for healthy members',
      '7,500+ network hospitals',
      'Home healthcare covered',
      'Exclusion: Pre-existing diseases (2-yr wait)',
    ],
    minAge: 18, maxAge: 65, minCover: 300000, maxCover: 10000000, basePremium: 19800, isFeatured: false,
  },

  // ── Group Health ──────────────────────────────────────────────────────────
  {
    slug: 'new-india-group-mediclaim',
    name: 'New India Group Mediclaim Policy',
    insurerSlug: 'new-india',
    type: 'health',
    description: 'Group health policy for employers covering employees and dependants with corporate pricing.',
    features: [
      'Covers employees + spouse + 2 children',
      'No pre-policy medical examination',
      'Pre-existing diseases covered from day 1',
      'Maternity benefit (with waiting)',
      'Cashless at 3,000+ network hospitals',
      'Floater or individual SI option',
      'Exclusion: Elective cosmetic procedures',
    ],
    minAge: 18, maxAge: 60, minCover: 100000, maxCover: 500000, basePremium: 4500, isFeatured: false,
  },
  {
    slug: 'oriental-group-mediclaim',
    name: 'Oriental Group Mediclaim Policy',
    insurerSlug: 'oriental',
    type: 'health',
    description: 'Affordable group health cover for organisations with flexible benefit structure and add-on options.',
    features: [
      'Flexible sum insured per employee grade',
      'Top-up cover option',
      'Personal accident cover add-on',
      'OPD benefit add-on',
      'Covers hospitalisation + daycare',
      'No co-payment for under-60s',
      'Exclusion: Self-inflicted injuries',
    ],
    minAge: 18, maxAge: 65, minCover: 100000, maxCover: 500000, basePremium: 4200, isFeatured: false,
  },

  // ── Critical Illness ──────────────────────────────────────────────────────
  {
    slug: 'care-critical-illness-plus',
    name: 'Care Critical Illness Plus',
    insurerSlug: 'care-health',
    type: 'health',
    description: 'Lump sum benefit plan covering 32 critical illnesses including cancer, heart attack and stroke.',
    features: [
      '32 critical illnesses covered',
      'Lump sum payout on diagnosis',
      'No hospitalisation required for claim',
      'Cancer cover: all stages',
      'Waiver of premium on CI diagnosis',
      'No sub-limits or co-payment',
      'Exclusion: Pre-existing CI within 90 days',
    ],
    minAge: 5, maxAge: 65, minCover: 500000, maxCover: 30000000, basePremium: 12000, isFeatured: true,
  },
  {
    slug: 'aditya-birla-activ-one-max',
    name: 'Aditya Birla Activ One Max',
    insurerSlug: 'aditya-birla-health',
    type: 'health',
    description: 'India\'s first health plan that rewards healthy living with HealthReturns™ and Day 1 maternity cover.',
    features: [
      'HealthReturns™ — earn up to 30% premium back',
      'Chronic Management Programme',
      '64 critical illnesses covered',
      'Day 1 maternity cover',
      'International second opinion',
      'Annual health risk assessment',
      'Exclusion: Obesity treatment, cosmetic surgery',
    ],
    minAge: 18, maxAge: 65, minCover: 500000, maxCover: 60000000, basePremium: 21600, isFeatured: true,
  },

  // ════════════════════════════════════════════════════════════════════════════
  // MOTOR INSURANCE
  // ════════════════════════════════════════════════════════════════════════════

  // ── Third Party / Liability Only ──────────────────────────────────────────
  {
    slug: 'new-india-tp-car',
    name: 'New India Third Party Car Policy',
    insurerSlug: 'new-india',
    type: 'motor',
    description: 'Mandatory IRDAI-compliant Third Party Liability Only policy for private cars. Covers third-party bodily injury, death, and property damage.',
    features: [
      'Unlimited liability for third-party death/injury',
      'Third-party property damage up to ₹7.5 lakh',
      'Personal accident cover for owner-driver: ₹15 lakh',
      'IRDAI mandated — minimum legal requirement',
      'Valid for 1 year (new cars: 3-year bundled)',
      'Premium fixed by IRDAI tariff',
      'Exclusion: Own damage not covered',
    ],
    minAge: 18, maxAge: 70, minCover: 750000, maxCover: 750000, basePremium: 2094, isFeatured: false,
  },
  {
    slug: 'united-india-tp-bike',
    name: 'United India Third Party Two-Wheeler Policy',
    insurerSlug: 'united-india',
    type: 'motor',
    description: 'Mandatory Third Party Liability Only cover for two-wheelers (motorcycles and scooters).',
    features: [
      'Third-party injury and death liability',
      'Property damage up to ₹1 lakh',
      'Personal accident cover: ₹15 lakh owner-driver',
      'IRDAI tariff-based fixed premium',
      'Valid for 1 year (new bikes: 5-year TP bundled)',
      'Covers all engine capacities',
      'Exclusion: No own damage or theft cover',
    ],
    minAge: 18, maxAge: 70, minCover: 100000, maxCover: 100000, basePremium: 714, isFeatured: false,
  },

  // ── Package Policy (Comprehensive) ────────────────────────────────────────
  {
    slug: 'bajaj-allianz-package-car',
    name: 'Bajaj Allianz Comprehensive Car Package',
    insurerSlug: 'bajaj-allianz-general',
    type: 'motor',
    description: 'All-round package policy for private cars — own damage + third party liability in one policy.',
    features: [
      'Own damage (accident, theft, fire, flood)',
      'Third-party liability (unlimited for injury/death)',
      '6,500+ cashless garages pan-India',
      'Personal accident: ₹15 lakh owner-driver',
      'Zero depreciation add-on available',
      'NCB: up to 50% on own damage premium',
      'Exclusion: Drunk driving, mechanical breakdown, wear & tear',
    ],
    minAge: 18, maxAge: 70, minCover: 100000, maxCover: 5000000, basePremium: 6480, isFeatured: true,
  },
  {
    slug: 'icici-lombard-package-bike',
    name: 'ICICI Lombard Comprehensive Two-Wheeler Package',
    insurerSlug: 'icici-lombard',
    type: 'motor',
    description: 'Comprehensive package policy for two-wheelers covering own damage and third-party liability.',
    features: [
      'Own damage + third-party cover',
      '5,000+ cashless garages',
      'Personal accident: ₹15 lakh',
      'Roadside assistance 24x7',
      'Zero depreciation add-on',
      'NCB up to 50%',
      'Exclusion: Racing, commercial use without endorsement',
    ],
    minAge: 18, maxAge: 70, minCover: 20000, maxCover: 200000, basePremium: 1850, isFeatured: false,
  },
  {
    slug: 'hdfc-ergo-package-commercial',
    name: 'HDFC ERGO Commercial Vehicle Package',
    insurerSlug: 'hdfc-ergo',
    type: 'motor',
    description: 'Package policy for trucks, tankers, tippers and other commercial vehicles — goods carrying and passenger vehicles.',
    features: [
      'Covers trucks, tankers, tippers, buses, autos',
      'Goods in transit cover available as add-on',
      'Third-party liability (unlimited for injury/death)',
      'Driver PA cover included',
      'Compulsory deductible as per IRDAI norms',
      'Fleet discount available',
      'Exclusion: Overloading, unlicensed driver',
    ],
    minAge: 18, maxAge: 70, minCover: 200000, maxCover: 5000000, basePremium: 14500, isFeatured: false,
  },

  // ── Nil Depreciation ──────────────────────────────────────────────────────
  {
    slug: 'tata-aig-nil-dep-car',
    name: 'Tata AIG Zero Depreciation Car Cover',
    insurerSlug: 'tata-aig-general',
    type: 'motor',
    description: 'Nil Depreciation add-on (bumper-to-bumper) for private cars — full claim without depreciation deduction.',
    features: [
      'Zero depreciation on all parts (plastic, rubber, metal)',
      'Full claim amount — no deduction on age of parts',
      'Available for cars up to 5 years old',
      '2 claims per policy year allowed',
      '7,500+ cashless garages',
      'Compulsory deductible applies',
      'Exclusion: Wear & tear, mechanical breakdown',
    ],
    minAge: 18, maxAge: 70, minCover: 100000, maxCover: 5000000, basePremium: 8200, isFeatured: true,
  },

  // ── Bundled Policy ────────────────────────────────────────────────────────
  {
    slug: 'reliance-bundled-car',
    name: 'Reliance Bundled Car Policy',
    insurerSlug: 'reliance-general',
    type: 'motor',
    description: 'IRDAI-mandated bundled policy for new private cars — 3 years TP + 1 year OD in one policy.',
    features: [
      '3-year third-party cover (IRDAI mandate)',
      '1-year own damage cover',
      'Single policy document',
      'No need to renew TP for 3 years',
      'OD can be renewed separately each year',
      'Personal accident: ₹15 lakh',
      'Exclusion: Own damage exclusions apply in OD year',
    ],
    minAge: 18, maxAge: 70, minCover: 100000, maxCover: 5000000, basePremium: 7800, isFeatured: false,
  },

  // ── Misc / Special Vehicles ───────────────────────────────────────────────
  {
    slug: 'iffco-tokio-misc-vehicle',
    name: 'IFFCO Tokio Miscellaneous Vehicle Policy',
    insurerSlug: 'iffco-tokio',
    type: 'motor',
    description: 'Cover for special-purpose miscellaneous vehicles — tractors, road rollers, JCBs, combine harvesters, recovery vans.',
    features: [
      'Covers tractors, JCB, road rollers, combine harvesters',
      'Own damage + third-party liability',
      'Implements/attachments cover optional',
      'Agricultural use endorsement available',
      'Fleet discount for 5+ vehicles',
      'PA cover for driver/owner',
      'Exclusion: Use outside stated purpose',
    ],
    minAge: 18, maxAge: 70, minCover: 100000, maxCover: 3000000, basePremium: 9500, isFeatured: false,
  },

  // ════════════════════════════════════════════════════════════════════════════
  // FIRE INSURANCE
  // (covers property, stocks, furniture & fixtures)
  // ════════════════════════════════════════════════════════════════════════════

  {
    slug: 'new-india-suksham-udyam',
    name: 'New India Suksham Udyam Suraksha',
    insurerSlug: 'new-india',
    type: 'fire',
    description: 'Micro-enterprise fire policy for sum insured up to ₹5 crore covering property, stocks and contents under a simple single-section format.',
    features: [
      'SI up to ₹5 crore — single-section policy',
      'Covers building, plant, stock, furniture',
      'Fire, lightning, explosion, aircraft damage',
      'Riot, strike, malicious damage (RSMD)',
      'Flood, inundation, storm, cyclone',
      'Burglary & housebreaking cover',
      'Exclusion: War, nuclear peril, intentional damage',
    ],
    minAge: 18, maxAge: 99, minCover: 100000, maxCover: 50000000, basePremium: 2800, isFeatured: false,
  },
  {
    slug: 'national-laghu-udyam',
    name: 'National Insurance Laghu Udyam Suraksha',
    insurerSlug: 'national-insurance',
    type: 'fire',
    description: 'Small-enterprise fire and allied perils policy for SI between ₹5 crore and ₹50 crore with enhanced coverage.',
    features: [
      'SI ₹5Cr – ₹50Cr',
      'Fire & allied perils (11 standard perils)',
      'Add-on: Earthquake, flood, terrorism',
      'Covers building, plant, machinery, stock',
      'Business interruption (loss of profit) add-on',
      'Reinstatement value basis available',
      'Exclusion: Wear & tear, consequential loss (without add-on)',
    ],
    minAge: 18, maxAge: 99, minCover: 50000000, maxCover: 500000000, basePremium: 12000, isFeatured: false,
  },
  {
    slug: 'oriental-fire-special-perils',
    name: 'Oriental Fire & Special Perils Policy',
    insurerSlug: 'oriental',
    type: 'fire',
    description: 'Standard fire policy covering 12 perils for commercial, industrial and residential properties.',
    features: [
      '12 standard perils: fire, lightning, explosion, etc.',
      'RSMD: Riot, strike, malicious damage',
      'STFI: Storm, tempest, flood, inundation',
      'Impact damage (rail, road, aircraft)',
      'Subsidence, landslide & rockslide',
      'Terrorism cover available as add-on',
      'Exclusion: War, nuclear risks, willful acts',
    ],
    minAge: 18, maxAge: 99, minCover: 500000, maxCover: 2000000000, basePremium: 5500, isFeatured: true,
  },
  {
    slug: 'united-india-fire-open-policy',
    name: 'United India Fire Open Policy',
    insurerSlug: 'united-india',
    type: 'fire',
    description: 'Declaration-based fire open policy for large enterprises with fluctuating stocks or properties at multiple locations.',
    features: [
      'Single policy for multiple locations',
      'Monthly declaration of stock values',
      'Premium adjusted on actual exposure',
      'Minimum declared value: ₹1 crore',
      'All standard fire perils covered',
      'Ideal for seasonal or fluctuating stocks',
      'Exclusion: Declared value must not be understated',
    ],
    minAge: 18, maxAge: 99, minCover: 10000000, maxCover: 5000000000, basePremium: 25000, isFeatured: false,
  },
  {
    slug: 'icici-lombard-stock-godown',
    name: 'ICICI Lombard Fire Open Cover — Stock in Godown',
    insurerSlug: 'icici-lombard',
    type: 'fire',
    description: 'Specific fire cover for stocks stored in warehouses and godowns with per-location and per-event limits.',
    features: [
      'Covers stock at multiple godown locations',
      'Per-location and per-event SI limits',
      'Automatic reinstatement of cover after claim',
      'Floater option for stock in transit',
      'All standard fire & allied perils',
      'Sprinkler leakage add-on',
      'Exclusion: Spontaneous combustion (unless added)',
    ],
    minAge: 18, maxAge: 99, minCover: 500000, maxCover: 1000000000, basePremium: 9500, isFeatured: false,
  },

  // ════════════════════════════════════════════════════════════════════════════
  // MARINE INSURANCE
  // (transit risks by rail, road, air or ship)
  // ════════════════════════════════════════════════════════════════════════════

  {
    slug: 'national-marine-cargo-transit',
    name: 'National Marine Cargo Transit Policy',
    insurerSlug: 'national-insurance',
    type: 'marine',
    description: 'Single-transit marine cargo policy covering goods in transit by road, rail, inland waterway or air.',
    features: [
      'All-risk transit cover (ICC-A clause)',
      'Covers road, rail, inland water & air',
      'Loading/unloading risk included',
      'Theft, pilferage & non-delivery',
      'Accidental damage during handling',
      'Claim payable at destination',
      'Exclusion: Delay, war (without add-on), inherent vice',
    ],
    minAge: 18, maxAge: 99, minCover: 50000, maxCover: 100000000, basePremium: 1200, isFeatured: false,
  },
  {
    slug: 'new-india-marine-open-policy',
    name: 'New India Marine Open Policy',
    insurerSlug: 'new-india',
    type: 'marine',
    description: 'Floating marine open policy for regular importers/exporters — automatic cover on all shipments up to declared limit.',
    features: [
      'Automatic cover on all shipments',
      'Covers sea, air, road & rail legs',
      'Monthly declaration basis',
      'Institute Cargo Clauses (A/B/C)',
      'War & SRCC available as add-on',
      'Ideal for regular traders & manufacturers',
      'Exclusion: Wilful misconduct, inherent vice',
    ],
    minAge: 18, maxAge: 99, minCover: 1000000, maxCover: 5000000000, basePremium: 15000, isFeatured: true,
  },
  {
    slug: 'oriental-marine-inland-transit',
    name: 'Oriental Marine Inland Transit (All Risk)',
    insurerSlug: 'oriental',
    type: 'marine',
    description: 'All-risk inland transit cover for goods moved within India — by road, rail or river.',
    features: [
      'All-risk cover during inland transit',
      'Covers fire, accident, theft in transit',
      'Loading and unloading risk',
      'Covers packaged, bulk and machinery',
      'Institute Cargo Clauses (A) basis',
      'Continuous transit clause',
      'Exclusion: Leakage/breakage of fragile items unless impact',
    ],
    minAge: 18, maxAge: 99, minCover: 50000, maxCover: 100000000, basePremium: 800, isFeatured: false,
  },

  // ════════════════════════════════════════════════════════════════════════════
  // ENGINEERING INSURANCE
  // ════════════════════════════════════════════════════════════════════════════

  {
    slug: 'icici-lombard-electronic-equipment',
    name: 'ICICI Lombard Electronic Equipment Policy',
    insurerSlug: 'icici-lombard',
    type: 'engineering',
    description: 'All-risk policy for electronic and electrical equipment — computers, servers, medical equipment, telecom gear.',
    features: [
      'Covers accidental damage from any unforeseen cause',
      'Short circuit, overloading, operator error',
      'Theft of equipment (with forced entry)',
      'Data restoration costs (limited)',
      'Replacement on new-for-old basis',
      'External data media cover optional',
      'Exclusion: Wear & tear, gradual deterioration',
    ],
    minAge: 18, maxAge: 99, minCover: 100000, maxCover: 500000000, basePremium: 4500, isFeatured: true,
  },
  {
    slug: 'hdfc-ergo-contractors-all-risk',
    name: 'HDFC ERGO Contractors All Risk (CAR)',
    insurerSlug: 'hdfc-ergo',
    type: 'engineering',
    description: 'All-risk cover for civil construction projects — buildings, dams, roads, bridges — covering material damage and third-party liability.',
    features: [
      'Section I: Material damage to works under construction',
      'Section II: Third-party liability for injury/property damage',
      'Covers fire, flood, storm, earthquake, theft',
      'Temporary structures, scaffolding included',
      'Removal of debris cover',
      'Surrounding property cover',
      'Exclusion: Defective design/material (excess applies)',
    ],
    minAge: 18, maxAge: 99, minCover: 1000000, maxCover: 10000000000, basePremium: 18000, isFeatured: true,
  },
  {
    slug: 'bajaj-allianz-storage-erection',
    name: 'Bajaj Allianz Storage cum Erection Policy',
    insurerSlug: 'bajaj-allianz-general',
    type: 'engineering',
    description: 'Combines storage risk (at site before installation) and erection all-risks in a single policy for plant and machinery.',
    features: [
      'Storage risk from point of delivery',
      'Erection/installation all-risk cover',
      'Testing & commissioning period cover',
      'Third-party liability section',
      'Covers mechanical/electrical breakdown during erection',
      'Removal of debris',
      'Exclusion: Consequential loss, defective design',
    ],
    minAge: 18, maxAge: 99, minCover: 1000000, maxCover: 5000000000, basePremium: 22000, isFeatured: false,
  },
  {
    slug: 'national-contractors-plant-machinery',
    name: 'National CPM — Contractors Plant & Machinery',
    insurerSlug: 'national-insurance',
    type: 'engineering',
    description: 'All-risk policy for contractor\'s mobile plant and machinery — cranes, excavators, bulldozers, compressors.',
    features: [
      'Covers all mobile construction equipment',
      'Accidental damage, overturning, collision',
      'Theft of entire machines (with force)',
      'Fire, explosion, flood damage',
      'Covers equipment at work site & in transit',
      'Hired-in plant cover option',
      'Exclusion: Wear & tear, mechanical/electrical breakdown',
    ],
    minAge: 18, maxAge: 99, minCover: 500000, maxCover: 500000000, basePremium: 12000, isFeatured: false,
  },
  {
    slug: 'tata-aig-machinery-breakdown',
    name: 'Tata AIG Machinery Breakdown Policy',
    insurerSlug: 'tata-aig-general',
    type: 'engineering',
    description: 'Covers sudden and unforeseen physical breakdown of stationary machinery — manufacturing plant, generators, boilers.',
    features: [
      'Covers electrical & mechanical breakdown',
      'Short circuit, overloading, operator error',
      'Centrifugal force, vibration, abnormal voltage',
      'Repair or replacement on reinstatement value',
      'Consequential loss (loss of profit) add-on',
      'Expediting expenses covered',
      'Exclusion: Wear & tear, planned maintenance, fire',
    ],
    minAge: 18, maxAge: 99, minCover: 200000, maxCover: 2000000000, basePremium: 6500, isFeatured: false,
  },

  // ════════════════════════════════════════════════════════════════════════════
  // LIABILITY INSURANCE
  // ════════════════════════════════════════════════════════════════════════════

  {
    slug: 'new-india-public-liability-industrial',
    name: 'New India Public Liability (Industrial)',
    insurerSlug: 'new-india',
    type: 'liability',
    description: 'Covers legal liability to third parties for bodily injury or property damage arising from industrial operations.',
    features: [
      'Third-party bodily injury & death',
      'Third-party property damage',
      'Pollution liability (sudden & accidental)',
      'Legal defence costs',
      'Medical expenses to third parties',
      'Covers factory premises & off-site activities',
      'Exclusion: Employee injury (WC covers this), contractual liability',
    ],
    minAge: 18, maxAge: 99, minCover: 1000000, maxCover: 500000000, basePremium: 8500, isFeatured: true,
  },
  {
    slug: 'oriental-public-liability-non-industrial',
    name: 'Oriental Public Liability (Non-Industrial)',
    insurerSlug: 'oriental',
    type: 'liability',
    description: 'Third-party liability cover for shops, offices, hotels, schools and other non-industrial establishments.',
    features: [
      'Bodily injury & property damage to public',
      'Covers premises & business activities',
      'Food poisoning cover for hotels/restaurants',
      'Product liability add-on',
      'Legal defence costs included',
      'Unlimited third-party personal injury',
      'Exclusion: Intentional acts, war & nuclear',
    ],
    minAge: 18, maxAge: 99, minCover: 500000, maxCover: 100000000, basePremium: 4500, isFeatured: false,
  },
  {
    slug: 'united-india-lpg-dealer',
    name: 'United India LPG Dealers Policy',
    insurerSlug: 'united-india',
    type: 'liability',
    description: 'Compulsory statutory policy for LPG distributors and dealers covering third-party liability under PNGRB norms.',
    features: [
      'Compulsory cover for LPG distributors',
      'Third-party death/injury from cylinder accident',
      'Property damage from fire/explosion',
      'PNGRB regulation compliant',
      'Covers depot, delivery vehicles & customers',
      'Legal defence costs',
      'Exclusion: War, intentional acts, nuclear',
    ],
    minAge: 18, maxAge: 99, minCover: 1000000, maxCover: 50000000, basePremium: 5500, isFeatured: false,
  },
  {
    slug: 'icici-lombard-product-liability',
    name: 'ICICI Lombard Product Liability Policy',
    insurerSlug: 'icici-lombard',
    type: 'liability',
    description: 'Covers manufacturers and sellers against claims arising from bodily injury or property damage caused by their products.',
    features: [
      'Bodily injury caused by defective product',
      'Property damage from product defect',
      'Worldwide cover option',
      'Recall costs (limited) add-on',
      'Legal defence costs covered',
      'Covers all product categories',
      'Exclusion: Known defects at time of sale',
    ],
    minAge: 18, maxAge: 99, minCover: 2000000, maxCover: 1000000000, basePremium: 12000, isFeatured: false,
  },
  {
    slug: 'national-carriers-legal-liability',
    name: 'National Carriers Legal Liability Policy',
    insurerSlug: 'national-insurance',
    type: 'liability',
    description: 'Covers transport companies and truck operators for legal liability to goods owners for loss or damage during transit.',
    features: [
      'Liability for goods in custody and control',
      'Loss/damage to consignor\'s goods during carriage',
      'Fire, theft, accident during transit',
      'Covers road, rail and inland water carriers',
      'Legal defence costs',
      'Per-consignment and annual limits available',
      'Exclusion: Wilful misconduct, consequential loss',
    ],
    minAge: 18, maxAge: 99, minCover: 500000, maxCover: 200000000, basePremium: 7500, isFeatured: false,
  },
  {
    slug: 'bajaj-allianz-workmen-compensation',
    name: 'Bajaj Allianz Workmen\'s Compensation Policy',
    insurerSlug: 'bajaj-allianz-general',
    type: 'liability',
    description: 'Statutory cover for employers\' liability to workers under the Employees\' Compensation Act, 1923.',
    features: [
      'Compensation for work-related injury/death',
      'Permanent partial & total disablement',
      'Medical expenses to injured workers',
      'Covers all categories of workmen',
      'EC Act 1923 & Fatal Accidents Act 1855 compliant',
      'Legal defence costs',
      'Exclusion: Intoxication, deliberate self-injury',
    ],
    minAge: 18, maxAge: 65, minCover: 100000, maxCover: 10000000, basePremium: 6000, isFeatured: true,
  },
  {
    slug: 'tata-aig-directors-officers',
    name: 'Tata AIG Directors & Officers (D&O) Liability',
    insurerSlug: 'tata-aig-general',
    type: 'liability',
    description: 'Protects company directors and officers against claims of wrongful acts in their managerial capacity.',
    features: [
      'Covers directors, officers & company',
      'Wrongful act: error, omission, misstatement',
      'Securities claims defence',
      'Investigation costs covered',
      'Extradition defence costs',
      'Worldwide jurisdiction option',
      'Exclusion: Fraudulent acts, bodily injury',
    ],
    minAge: 18, maxAge: 99, minCover: 5000000, maxCover: 2000000000, basePremium: 35000, isFeatured: false,
  },
  {
    slug: 'hdfc-ergo-fidelity-guarantee',
    name: 'HDFC ERGO Fidelity Guarantee Policy',
    insurerSlug: 'hdfc-ergo',
    type: 'liability',
    description: 'Covers employers against financial loss caused by dishonest acts (fraud, embezzlement) of specified employees.',
    features: [
      'Covers fraud, theft, embezzlement by employees',
      'Individual, blanket or floater cover',
      'Covers cash, securities, inventory',
      'Computer fraud add-on',
      'Legal costs of recovery',
      'Covers managers, accountants, cashiers',
      'Exclusion: Acts known to employer beforehand',
    ],
    minAge: 18, maxAge: 99, minCover: 500000, maxCover: 100000000, basePremium: 5000, isFeatured: false,
  },
  {
    slug: 'iffco-tokio-bankers-indemnity',
    name: 'IFFCO Tokio Bankers Indemnity Policy',
    insurerSlug: 'iffco-tokio',
    type: 'liability',
    description: 'Comprehensive indemnity cover for banks and financial institutions against employee dishonesty, burglary, robbery and forgery.',
    features: [
      'Employee dishonesty & fraud',
      'On-premises burglary & robbery',
      'In-transit cash robbery',
      'Forgery & counterfeit currency',
      'Computer & electronic funds transfer fraud',
      'Directors & officers liability section',
      'Exclusion: War, nuclear, voluntary disclosure',
    ],
    minAge: 18, maxAge: 99, minCover: 5000000, maxCover: 5000000000, basePremium: 50000, isFeatured: false,
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

  // ── 3. Admin ───────────────────────────────────────────────────────────────
  console.log('\n🔐 Seeding admin...');
  const adminHash = await bcrypt.hash('Admin@123!', 12);
  await prisma.admin.create({
    data: { name: 'ASK Admin', email: 'admin@ask-insurance.in', passwordHash: adminHash, role: 'super_admin' }
  });
  console.log('   ✓ admin@ask-insurance.in (Admin@123!)');

  // ── 4. Users ───────────────────────────────────────────────────────────────
  console.log('\n👤 Seeding users...');
  const userIds: string[] = [];
  for (const data of USERS) {
    const user = await prisma.user.create({ data });
    userIds.push(user.id);
    process.stdout.write(`   ✓ ${user.name} (${user.phone})\n`);
  }

  const [arjunId, priyaId, rohitId, kavithaId, vikramId] = userIds as [string, string, string, string, string];

  // ── 5. Policies ────────────────────────────────────────────────────────────
  console.log('\n📜 Seeding policies...');
  const policies = await Promise.all([
    // Arjun — term life + health + motor package
    prisma.policy.create({ data: {
      policyNumber: 'POL-2025-LIC-001', type: 'life', provider: 'LIC',
      insurerId: insurerMap.get('lic'), planId: planMap.get('lic-tech-term'),
      sumInsured: 10000000, premium: 11820,
      startDate: daysAgo(180), endDate: daysFromNow(185),
      status: 'active', paymentStatus: 'paid', userId: arjunId,
    }}),
    prisma.policy.create({ data: {
      policyNumber: 'POL-2025-STH-002', type: 'health', provider: 'Star Health',
      insurerId: insurerMap.get('star-health'), planId: planMap.get('star-family-health-optima'),
      sumInsured: 1000000, premium: 18500,
      startDate: daysAgo(90), endDate: daysFromNow(275),
      status: 'active', paymentStatus: 'paid', userId: arjunId,
    }}),
    prisma.policy.create({ data: {
      policyNumber: 'POL-2025-BAJ-003', type: 'motor', provider: 'Bajaj Allianz',
      insurerId: insurerMap.get('bajaj-allianz-general'), planId: planMap.get('bajaj-allianz-package-car'),
      sumInsured: 600000, premium: 6480,
      startDate: daysAgo(60), endDate: daysFromNow(305),
      status: 'active', paymentStatus: 'paid', userId: arjunId,
    }}),

    // Priya — health individual + life endowment
    prisma.policy.create({ data: {
      policyNumber: 'POL-2025-NB-004', type: 'health', provider: 'Niva Bupa',
      insurerId: insurerMap.get('niva-bupa'), planId: planMap.get('niva-bupa-reassure-2'),
      sumInsured: 500000, premium: 20200,
      startDate: daysAgo(200), endDate: daysFromNow(165),
      status: 'active', paymentStatus: 'paid', userId: priyaId,
    }}),
    prisma.policy.create({ data: {
      policyNumber: 'POL-2025-HDFC-005', type: 'life', provider: 'HDFC Life',
      insurerId: insurerMap.get('hdfc-life'), planId: planMap.get('hdfc-sanchay-plus'),
      sumInsured: 2000000, premium: 48000,
      startDate: daysAgo(400), endDate: daysFromNow(330),
      status: 'expired', paymentStatus: 'paid', userId: priyaId,
    }}),

    // Rohit — term life + nil dep motor + fire
    prisma.policy.create({ data: {
      policyNumber: 'POL-2025-MAX-006', type: 'life', provider: 'Max Life',
      insurerId: insurerMap.get('max-life'), planId: planMap.get('max-life-smart-secure-plus'),
      sumInsured: 15000000, premium: 8040,
      startDate: daysAgo(60), endDate: daysFromNow(305),
      status: 'active', paymentStatus: 'paid', userId: rohitId,
    }}),
    prisma.policy.create({ data: {
      policyNumber: 'POL-2025-TATA-007', type: 'motor', provider: 'Tata AIG',
      insurerId: insurerMap.get('tata-aig-general'), planId: planMap.get('tata-aig-nil-dep-car'),
      sumInsured: 750000, premium: 8200,
      startDate: daysAgo(30), endDate: daysFromNow(335),
      status: 'active', paymentStatus: 'paid', userId: rohitId,
    }}),
    prisma.policy.create({ data: {
      policyNumber: 'POL-2025-ORI-008', type: 'fire', provider: 'Oriental Insurance',
      insurerId: insurerMap.get('oriental'), planId: planMap.get('oriental-fire-special-perils'),
      sumInsured: 5000000, premium: 5500,
      startDate: daysAgo(5), endDate: daysFromNow(360),
      status: 'active', paymentStatus: 'pending', userId: rohitId,
    }}),

    // Kavitha — health + workmen comp + critical illness
    prisma.policy.create({ data: {
      policyNumber: 'POL-2025-AB-009', type: 'health', provider: 'Aditya Birla Health',
      insurerId: insurerMap.get('aditya-birla-health'), planId: planMap.get('aditya-birla-activ-one-max'),
      sumInsured: 1000000, premium: 21600,
      startDate: daysAgo(120), endDate: daysFromNow(245),
      status: 'active', paymentStatus: 'paid', userId: kavithaId,
    }}),
    prisma.policy.create({ data: {
      policyNumber: 'POL-2025-BAJ-010', type: 'liability', provider: 'Bajaj Allianz',
      insurerId: insurerMap.get('bajaj-allianz-general'), planId: planMap.get('bajaj-allianz-workmen-compensation'),
      sumInsured: 2000000, premium: 6000,
      startDate: daysAgo(45), endDate: daysFromNow(320),
      status: 'active', paymentStatus: 'paid', userId: kavithaId,
    }}),

    // Vikram — ULIP + health + marine (cancelled)
    prisma.policy.create({ data: {
      policyNumber: 'POL-2025-IPRU-011', type: 'life', provider: 'ICICI Pru Life',
      insurerId: insurerMap.get('icici-pru-life'), planId: planMap.get('icici-pru-wealth-builder'),
      sumInsured: 10000000, premium: 60000,
      startDate: daysAgo(270), endDate: daysFromNow(95),
      status: 'active', paymentStatus: 'paid', userId: vikramId,
    }}),
    prisma.policy.create({ data: {
      policyNumber: 'POL-2025-CARE-012', type: 'health', provider: 'Care Health',
      insurerId: insurerMap.get('care-health'), planId: planMap.get('care-critical-illness-plus'),
      sumInsured: 500000, premium: 12000,
      startDate: daysAgo(100), endDate: daysFromNow(265),
      status: 'active', paymentStatus: 'paid', userId: vikramId,
    }}),
    prisma.policy.create({ data: {
      policyNumber: 'POL-2025-NIA-013', type: 'marine', provider: 'New India',
      insurerId: insurerMap.get('new-india'), planId: planMap.get('new-india-marine-open-policy'),
      sumInsured: 5000000, premium: 15000,
      startDate: daysAgo(200), endDate: daysFromNow(165),
      status: 'cancelled', paymentStatus: 'paid',
      cancelledAt: daysAgo(50), userId: vikramId,
    }}),
  ]);

  policies.forEach(p => process.stdout.write(`   ✓ ${p.policyNumber} — ${p.type} (${p.provider})\n`));

  // ── 6. Payments ────────────────────────────────────────────────────────────
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

  // ── 7. Claims ──────────────────────────────────────────────────────────────
  console.log('\n📋 Seeding claims...');
  await Promise.all([
    // Arjun — health claim (settled)
    prisma.claim.create({ data: {
      claimNumber: 'CLM-2025-001', type: 'hospitalisation', amount: 85000,
      status: 'paid',
      description: 'Emergency appendix surgery at Manipal Hospital, Bengaluru — surgery, anaesthesia, 4-day ICU stay, post-op medication.',
      incidentDate: daysAgo(60), submittedDate: daysAgo(55),
      approvedDate: daysAgo(50), paidDate: daysAgo(45),
      notes: 'All documents verified. Settled within SLA.',
      userId: arjunId, policyId: policies[1]!.id,
    }}),
    // Arjun — motor claim (approved, awaiting payout)
    prisma.claim.create({ data: {
      claimNumber: 'CLM-2025-002', type: 'accident', amount: 42000,
      status: 'approved',
      description: 'Front-end collision on Outer Ring Road — bonnet, headlights, bumper, radiator damaged.',
      incidentDate: daysAgo(25), submittedDate: daysAgo(23), approvedDate: daysAgo(15),
      notes: 'Surveyor report attached. Garage estimate approved.',
      userId: arjunId, policyId: policies[2]!.id,
    }}),
    // Rohit — fire claim (under investigation)
    prisma.claim.create({ data: {
      claimNumber: 'CLM-2025-003', type: 'fire', amount: 350000,
      status: 'submitted',
      description: 'Short-circuit fire in storage area — stock of raw materials and fixtures partially damaged.',
      incidentDate: daysAgo(10), submittedDate: daysAgo(8),
      notes: 'Surveyor assigned. Site inspection scheduled.',
      userId: rohitId, policyId: policies[7]!.id,
    }}),
    // Priya — health claim (rejected)
    prisma.claim.create({ data: {
      claimNumber: 'CLM-2025-004', type: 'hospitalisation', amount: 28000,
      status: 'rejected',
      description: 'Dental surgery claim filed under health policy.',
      incidentDate: daysAgo(40), submittedDate: daysAgo(38), rejectedDate: daysAgo(30),
      notes: 'Rejected: Dental treatment not covered under policy terms.',
      userId: priyaId, policyId: policies[3]!.id,
    }}),
  ]);
  console.log('   ✓ 4 claims created');

  // ── 8. Notifications ────────────────────────────────────────────────────────
  console.log('\n🔔 Seeding notifications...');
  await Promise.all([
    prisma.notification.create({ data: {
      userId: arjunId, type: 'claim_update',
      title: 'Claim Approved — ₹42,000',
      body: 'Your motor insurance claim CLM-2025-002 has been approved. Payment will be processed within 3 working days.',
      read: false,
    }}),
    prisma.notification.create({ data: {
      userId: arjunId, type: 'policy_renewal',
      title: 'Health Policy Renewing in 30 Days',
      body: 'Your Star Health Family Optima policy (POL-2025-STH-002) is due for renewal in 30 days.',
      read: true,
    }}),
    prisma.notification.create({ data: {
      userId: rohitId, type: 'claim_update',
      title: 'Claim Received — Under Investigation',
      body: 'Your fire insurance claim CLM-2025-003 has been received. A surveyor has been assigned.',
      read: false,
    }}),
  ]);
  console.log('   ✓ 3 notifications created');

  console.log('\n✅ Seed complete!\n');
  console.log('   Admin login : admin@ask-insurance.in / Admin@123!');
  console.log('   Test user   : 9876543210 (Arjun Sharma)');
  console.log('   Test user   : 9823456789 (Priya Nair)\n');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => prisma.$disconnect());
