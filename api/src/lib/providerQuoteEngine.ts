import { calculateIDV, calculateStatutoryTP, IDVCalculationResult } from './idvCalculator';

export interface ProviderQuoteRequest {
  registrationNumber?: string | undefined;
  registrationYear?: number | string | undefined;
  registrationDate?: string | undefined;
  make?: string | undefined;
  model?: string | undefined;
  variant?: string | undefined;
  exShowroomPrice?: number | undefined;
  ncbPercent?: number | undefined;
  hasPreviousClaim?: boolean | undefined;
  selectedAddons?: string[] | undefined;
  customIDV?: number | undefined;
  vehicleType?: string | undefined;
  cubicCapacity?: number | string | undefined;
}

export interface PremiumBreakdown {
  idv: number;
  baseODPremium: number;
  ncbDiscountPercent: number;
  ncbDiscountAmount: number;
  netODPremium: number;
  tpPremium: number;
  addonsCost: number;
  addonsTotal?: number;
  netPremium: number;
  gstAmount: number; // 18%
  totalPremium: number;
}

export interface ProviderQuote {
  id: string;
  insurerId: string;
  insurerName: string;
  shortName: string;
  logo: string;
  brandColor: string;
  claimsRatio: number; // e.g. 98.5
  rating: number; // e.g. 4.8
  planName: string;
  tagline: string;
  breakdown: PremiumBreakdown;
  addonsIncluded: string[];
  features: string[];
  isRecommended?: boolean | undefined;
}

export interface LiveQuotesResponsePayload {
  registrationNumber?: string | undefined;
  vehicleSummary: {
    make: string;
    model: string;
    variant: string;
    vehicleType: string;
    registrationYear?: string | undefined;
  };
  idvDetails: IDVCalculationResult;
  ncbWarningAlert?: {
    warning: boolean;
    code: string;
    title: string;
    message: string;
  } | null | undefined;
  quotes: ProviderQuote[];
}

const PARTNER_INSURERS = [
  {
    id: 'hdfc-ergo',
    name: 'HDFC ERGO General Insurance',
    shortName: 'HDFC ERGO',
    brandColor: '#D12027',
    logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
    claimsRatio: 98.6,
    rating: 4.9,
    baseODRate: 0.0165, // 1.65% of IDV
    tagline: 'Instant Cashless at 10,000+ Network Garages',
    features: ['Instant Digital Policy', 'Zero Touch Settlement', '24x7 RSA Support'],
  },
  {
    id: 'icici-lombard',
    name: 'ICICI Lombard General Insurance',
    shortName: 'ICICI Lombard',
    brandColor: '#003366',
    logo: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=150',
    claimsRatio: 97.8,
    rating: 4.8,
    baseODRate: 0.0158,
    tagline: 'Take-It-Easy Cashless Claim Settlement',
    features: ['Doorstep Pick & Drop Repair', 'Live Claim Tracking', 'Engine Protect Option'],
  },
  {
    id: 'bajaj-allianz',
    name: 'Bajaj Allianz General Insurance',
    shortName: 'Bajaj Allianz',
    brandColor: '#0055A5',
    logo: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=150',
    claimsRatio: 98.1,
    rating: 4.7,
    baseODRate: 0.0162,
    tagline: 'DriveSmart Telematics & Instant Spot Approval',
    features: ['Spot Claim Approval up to ₹30,000', '24/7 Roadside Assistance'],
  },
  {
    id: 'tata-aig',
    name: 'Tata AIG General Insurance',
    shortName: 'Tata AIG',
    brandColor: '#00A859',
    logo: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=150',
    claimsRatio: 99.1,
    rating: 4.9,
    baseODRate: 0.0152,
    tagline: 'Trusted Protection with 99.1% Claim Settlement Ratio',
    features: ['Highest Claim Settlement Ratio', 'Zero Dep Cover Included', 'Consumables Protection'],
    isRecommended: true,
  },
  {
    id: 'go-digit',
    name: 'Go Digit General Insurance',
    shortName: 'Go Digit',
    brandColor: '#FF6600',
    logo: 'https://images.unsplash.com/photo-1616469829941-c7200edec809?w=150',
    claimsRatio: 96.5,
    rating: 4.7,
    baseODRate: 0.0145,
    tagline: '100% Smartphone Self-Inspection & Fast Payouts',
    features: ['Smartphone Self-Inspection', 'No Physical Paperwork', 'Instant Transfer'],
  },
  {
    id: 'sbi-general',
    name: 'SBI General Insurance',
    shortName: 'SBI General',
    brandColor: '#1A365D',
    logo: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=150',
    claimsRatio: 96.2,
    rating: 4.6,
    baseODRate: 0.0155,
    tagline: 'State-Backed Security with Nation-wide Coverage',
    features: ['Nationwide Garage Coverage', 'Hassle-free Renewals', 'RSA Assistance'],
  },
  {
    id: 'reliance-general',
    name: 'Reliance General Insurance',
    shortName: 'Reliance General',
    brandColor: '#E53E3E',
    logo: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=150',
    claimsRatio: 95.8,
    rating: 4.5,
    baseODRate: 0.0149,
    tagline: 'Affordable Rates with Comprehensive Coverage',
    features: ['Budget Friendly Premiums', 'Cashless Repairs', 'NCB Protector'],
  },
];

/**
 * Calculates live provider quotes based on PolicyBazaar IDV calculation math
 */
export function calculateLiveProviderQuotes(req: ProviderQuoteRequest): LiveQuotesResponsePayload {
  const vehicleType = req.vehicleType || 'car';
  const exShowroom = req.exShowroomPrice || (vehicleType === 'two_wheeler' ? 95000 : 750000);

  // 1. Calculate IDV using IRDAI 5-year depreciation table
  const idvDetails = calculateIDV({
    exShowroomPrice: exShowroom,
    registrationYear: req.registrationYear,
    registrationDate: req.registrationDate,
    customIDV: req.customIDV,
    vehicleType,
    cubicCapacity: req.cubicCapacity,
  });

  // 2. Handle NCB Discrepancy Alert
  const declaredNcb = req.ncbPercent || 0;
  const hasClaim = Boolean(req.hasPreviousClaim);
  const ncbDiscrepancy = hasClaim && declaredNcb > 0;
  const effectiveNcb = ncbDiscrepancy ? 0 : declaredNcb;

  const ncbWarningAlert = ncbDiscrepancy ? {
    warning: true,
    code: 'NCB_DISCREPANCY',
    title: '⚠️ NCB Discrepancy & Penalty Risk Warning Alert',
    message: `Claim reported in previous policy year! Claiming ${declaredNcb}% NCB will result in policy rejection or claim repudiation during verification. NCB reset to 0%.`
  } : null;

  // 3. Statutory TP Premium
  const tpPremium = calculateStatutoryTP(vehicleType, req.cubicCapacity);

  // 4. Calculate Add-on Costs
  const addons = req.selectedAddons || ['Zero Depreciation', '24x7 Roadside Assistance (RSA)'];
  let addonsCost = 0;
  if (addons.includes('Zero Depreciation')) addonsCost += Math.round(idvDetails.selectedIDV * 0.0035);
  if (addons.includes('24x7 Roadside Assistance (RSA)')) addonsCost += 249;
  if (addons.includes('Engine Protection Cover')) addonsCost += Math.round(idvDetails.selectedIDV * 0.0018);
  if (addons.includes('Consumables Cover')) addonsCost += 150;
  if (addons.includes('Key & Lock Replacement')) addonsCost += 120;
  if (addons.includes('NCB Protector')) addonsCost += Math.round(idvDetails.selectedIDV * 0.0012);

  // 5. Generate quotes per insurer
  const quotes: ProviderQuote[] = PARTNER_INSURERS.map((ins) => {
    const baseODPremium = Math.round(idvDetails.selectedIDV * ins.baseODRate);
    const ncbDiscountAmount = Math.round((baseODPremium * effectiveNcb) / 100);
    const netODPremium = Math.max(500, baseODPremium - ncbDiscountAmount);

    const netPremium = netODPremium + tpPremium + addonsCost;
    const gstAmount = Math.round(netPremium * 0.18);
    const totalPremium = netPremium + gstAmount;

    return {
      id: `quote-${ins.id}-${Date.now()}`,
      insurerId: ins.id,
      insurerName: ins.name,
      shortName: ins.shortName,
      logo: ins.logo,
      brandColor: ins.brandColor,
      claimsRatio: ins.claimsRatio,
      rating: ins.rating,
      planName: `${ins.shortName} Comprehensive Motor Secure`,
      tagline: ins.tagline,
      breakdown: {
        idv: idvDetails.selectedIDV,
        baseODPremium,
        ncbDiscountPercent: effectiveNcb,
        ncbDiscountAmount,
        netODPremium,
        tpPremium,
        addonsCost,
        addonsTotal: addonsCost,
        netPremium,
        gstAmount,
        totalPremium,
      },
      addonsIncluded: addons,
      features: ins.features,
      isRecommended: ins.isRecommended ?? false,
    };
  });

  // Sort by lowest price first
  quotes.sort((a, b) => a.breakdown.totalPremium - b.breakdown.totalPremium);

  return {
    registrationNumber: req.registrationNumber,
    vehicleSummary: {
      make: req.make || 'Hyundai',
      model: req.model || 'Creta',
      variant: req.variant || '1.5L SX (O)',
      vehicleType,
      registrationYear: req.registrationYear ? String(req.registrationYear) : '2023',
    },
    idvDetails,
    ncbWarningAlert,
    quotes,
  };
}
