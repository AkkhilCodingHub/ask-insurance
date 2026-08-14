/**
 * Official IRDAI Insured Declared Value (IDV) Depreciation Calculation Engine
 * (PolicyBazaar Model)
 */

export interface IDVCalculationInput {
  exShowroomPrice: number;
  registrationYear?: number | string | undefined;
  registrationDate?: string | undefined;
  customIDV?: number | undefined;
  vehicleType?: string | undefined;
  cubicCapacity?: number | string | undefined;
}

export interface IDVCalculationResult {
  vehicleAgeMonths: number;
  vehicleAgeYears: number;
  depreciationPercent: number;
  standardIDV: number;
  minPermittedIDV: number;
  maxPermittedIDV: number;
  selectedIDV: number;
  isMutualAgreementRequired: boolean;
  depreciationLabel: string;
  ageBracketLabel: string;
}

/**
 * Calculates exact vehicle age in fractional years and months from registration date or year.
 */
export function calculateVehicleAge(registrationYear?: number | string, registrationDate?: string): { ageYears: number; ageMonths: number } {
  const now = new Date();

  if (registrationDate) {
    const parsedDate = new Date(registrationDate);
    if (!isNaN(parsedDate.getTime())) {
      const diffMs = now.getTime() - parsedDate.getTime();
      const diffDays = Math.max(0, diffMs / (1000 * 60 * 60 * 24));
      const ageYears = diffDays / 365.25;
      const ageMonths = diffDays / 30.4375;
      return { ageYears, ageMonths };
    }
  }

  if (registrationYear) {
    const year = Number(registrationYear);
    if (!isNaN(year) && year > 1900 && year <= now.getFullYear()) {
      // Default to mid-year (June 1) of registration year
      const regMidYear = new Date(year, 5, 1);
      const diffMs = now.getTime() - regMidYear.getTime();
      const diffDays = Math.max(0, diffMs / (1000 * 60 * 60 * 24));
      const ageYears = diffDays / 365.25;
      const ageMonths = diffDays / 30.4375;
      return { ageYears, ageMonths };
    }
  }

  // Default fallback: 2 years old
  return { ageYears: 2.0, ageMonths: 24 };
}

/**
 * Calculates IDV according to official IRDAI Depreciation Table & PolicyBazaar rules:
 * - Age <= 6 months: 5% depreciation
 * - 6 months < Age <= 1 Year: 15% depreciation
 * - 1 Year < Age <= 2 Years: 20% depreciation
 * - 2 Years < Age <= 3 Years: 30% depreciation
 * - 3 Years < Age <= 4 Years: 40% depreciation
 * - 4 Years < Age <= 5 Years: 50% depreciation
 * - Age > 5 Years: Mutual Agreement (less 10% per year after year 5 or mutually agreed between Insured & Insurer)
 */
export function calculateIDV(input: IDVCalculationInput): IDVCalculationResult {
  const { exShowroomPrice, registrationYear, registrationDate, customIDV } = input;
  const basePrice = Math.max(50000, exShowroomPrice || 500000);

  const { ageYears, ageMonths } = calculateVehicleAge(registrationYear, registrationDate);

  let depreciationPercent = 0;
  let isMutualAgreementRequired = false;
  let ageBracketLabel = 'New Vehicle (0% Dep)';

  if (ageMonths <= 6) {
    depreciationPercent = 5;
    ageBracketLabel = 'Age ≤ 6 months (5% Dep)';
  } else if (ageYears <= 1.0) {
    depreciationPercent = 15;
    ageBracketLabel = '6 months < Age ≤ 1 Year (15% Dep)';
  } else if (ageYears <= 2.0) {
    depreciationPercent = 20;
    ageBracketLabel = '1 Year < Age ≤ 2 Years (20% Dep)';
  } else if (ageYears <= 3.0) {
    depreciationPercent = 30;
    ageBracketLabel = '2 Years < Age ≤ 3 Years (30% Dep)';
  } else if (ageYears <= 4.0) {
    depreciationPercent = 40;
    ageBracketLabel = '3 Years < Age ≤ 4 Years (40% Dep)';
  } else if (ageYears <= 5.0) {
    depreciationPercent = 50;
    ageBracketLabel = '4 Years < Age ≤ 5 Years (50% Dep)';
  } else {
    // Age > 5 Years: 50% + 10% per additional year or Mutual Agreement
    isMutualAgreementRequired = true;
    const additionalYears = Math.floor(ageYears - 5);
    depreciationPercent = Math.min(85, 50 + additionalYears * 10);
    ageBracketLabel = `Age > 5 Years (${additionalYears + 5} Yrs Old • Mutual Agreement)`;
  }

  const standardIDV = Math.round(basePrice * (1 - depreciationPercent / 100));

  // PolicyBazaar IDV Slider Range: ±15% of standard IDV
  const minPermittedIDV = Math.round(standardIDV * 0.85);
  const maxPermittedIDV = Math.round(standardIDV * 1.15);

  let selectedIDV = standardIDV;
  if (customIDV && customIDV > 0) {
    selectedIDV = Math.min(maxPermittedIDV, Math.max(minPermittedIDV, customIDV));
  }

  const depreciationLabel = isMutualAgreementRequired
    ? `Mutual Agreement (${depreciationPercent}% Dep)`
    : `${depreciationPercent}% Depreciation`;

  return {
    vehicleAgeMonths: Math.round(ageMonths),
    vehicleAgeYears: Number(ageYears.toFixed(1)),
    depreciationPercent,
    standardIDV,
    minPermittedIDV,
    maxPermittedIDV,
    selectedIDV,
    isMutualAgreementRequired,
    depreciationLabel,
    ageBracketLabel,
  };
}

/**
 * Statutory IRDAI Third-Party (TP) Tariff Calculator
 */
export function calculateStatutoryTP(vehicleType: string = 'car', ccInput?: number | string): number {
  let cc = 1200;
  if (typeof ccInput === 'number') {
    cc = ccInput;
  } else if (typeof ccInput === 'string') {
    const parsed = parseInt(ccInput.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(parsed) && parsed > 0) cc = parsed;
  }

  if (vehicleType === 'two_wheeler') {
    if (cc < 75) return 538;
    if (cc <= 150) return 714;
    if (cc <= 350) return 1366;
    return 2804;
  }

  if (vehicleType === 'commercial') {
    return 15746; // Heavy/light commercial tariff
  }

  // Private Car TP Tariff
  if (cc < 1000) return 2094;
  if (cc <= 1500) return 3416;
  return 7897;
}
