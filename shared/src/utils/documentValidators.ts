/**
 * Official Indian Government & IRDAI Document Validation Utilities
 * Validates Aadhaar (Verhoeff checksum), PAN (Income Tax format), Vehicle RC (MoRTH / Parivahan), and Driving License (SARATHI / MoRTH).
 */

const VERHOEFF_D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

const VERHOEFF_P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

export const INDIAN_STATE_CODES = new Set([
  'AN', 'AP', 'AR', 'AS', 'BR', 'CG', 'CH', 'DD', 'DL', 'DN',
  'GA', 'GJ', 'HP', 'HR', 'JH', 'JK', 'KA', 'KL', 'LA', 'LD',
  'MH', 'ML', 'MN', 'MP', 'MZ', 'NL', 'OD', 'PB', 'PY', 'RJ',
  'SK', 'TN', 'TR', 'TS', 'UK', 'UP', 'WB', 'BH'
]);

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  formatted?: string;
  cleanValue?: string;
}

/**
 * Validates 12-Digit Indian Aadhaar Number using Verhoeff Checksum Algorithm
 */
export function validateAadhaar(aadhaarInput: string): ValidationResult {
  if (!aadhaarInput) {
    return { isValid: false, error: 'Aadhaar number is required.' };
  }

  const clean = aadhaarInput.replace(/[\s-]/g, '');

  if (!/^\d{12}$/.test(clean)) {
    return { isValid: false, error: 'Aadhaar must be exactly 12 digits.' };
  }

  if (clean[0] === '0' || clean[0] === '1') {
    return { isValid: false, error: 'Aadhaar number cannot start with 0 or 1.' };
  }

  let c = 0;
  const reversedArray = clean.split('').reverse().map(Number);

  for (let i = 0; i < reversedArray.length; i++) {
    const digit = reversedArray[i]!;
    const row = c;
    const col = VERHOEFF_P[i % 8]![digit]!;
    c = VERHOEFF_D[row]![col]!;
  }

  if (c !== 0) {
    return { isValid: false, error: 'Invalid Aadhaar number (checksum verification failed).' };
  }

  const formatted = `${clean.slice(0, 4)} ${clean.slice(4, 8)} ${clean.slice(8, 12)}`;
  return { isValid: true, formatted, cleanValue: clean };
}

/**
 * Validates Indian PAN (Permanent Account Number) according to Income Tax Department rules
 */
export function validatePAN(panInput: string): ValidationResult {
  if (!panInput) {
    return { isValid: false, error: 'PAN number is required.' };
  }

  const clean = panInput.replace(/[\s-]/g, '').toUpperCase();

  if (clean.length !== 10) {
    return { isValid: false, error: 'PAN must be exactly 10 alphanumeric characters.' };
  }

  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (!panRegex.test(clean)) {
    return { isValid: false, error: 'Invalid PAN format. Expected format: ABCDE1234F (5 letters, 4 digits, 1 letter).' };
  }

  const entityType = clean[3]!;
  const validEntities = new Set(['P', 'C', 'H', 'F', 'A', 'T', 'B', 'L', 'J', 'G']);
  if (!validEntities.has(entityType)) {
    return { isValid: false, error: `Invalid PAN 4th character '${entityType}'. Must represent an entity type (e.g. 'P' for Individual).` };
  }

  return { isValid: true, formatted: clean, cleanValue: clean };
}

/**
 * Validates Indian Vehicle Registration Certificate (RC) number
 */
export function validateRC(rcInput: string): ValidationResult {
  if (!rcInput) {
    return { isValid: false, error: 'Vehicle RC number is required.' };
  }

  const clean = rcInput.replace(/[\s-]/g, '').toUpperCase();

  const bhRegex = /^[0-9]{2}BH[0-9]{4}[A-Z]{1,2}$/;
  if (bhRegex.test(clean)) {
    return { isValid: true, formatted: clean, cleanValue: clean };
  }

  const standardRegex = /^([A-Z]{2})([0-9]{1,2})([A-Z]{0,3})([0-9]{4})$/;
  const match = clean.match(standardRegex);

  if (!match) {
    return { isValid: false, error: 'Invalid Vehicle RC format. Example: DL01AB1234 or MH12DE1432.' };
  }

  const stateCode = match[1]!;
  if (!INDIAN_STATE_CODES.has(stateCode)) {
    return { isValid: false, error: `Invalid State code '${stateCode}' in RC number.` };
  }

  return { isValid: true, formatted: clean, cleanValue: clean };
}

/**
 * Validates Indian Driving License (SARATHI / MoRTH format)
 */
export function validateDrivingLicense(dlInput: string): ValidationResult {
  if (!dlInput) {
    return { isValid: false, error: 'Driving License number is required.' };
  }

  const clean = dlInput.replace(/[\s-]/g, '').toUpperCase();

  if (clean.length < 10 || clean.length > 18) {
    return { isValid: false, error: 'Driving License must be between 10 and 18 characters.' };
  }

  const stateCode = clean.slice(0, 2);
  if (!INDIAN_STATE_CODES.has(stateCode)) {
    return { isValid: false, error: `Invalid State code '${stateCode}' in Driving License.` };
  }

  const sarathiRegex = /^([A-Z]{2})([0-9]{2})([0-9]{4})([0-9]{7})$/;
  const match = clean.match(sarathiRegex);

  if (match) {
    const year = parseInt(match[3]!, 10);
    const currentYear = new Date().getFullYear();
    if (year < 1960 || year > currentYear) {
      return { isValid: false, error: `Invalid Driving License issue year (${year}). Must be between 1960 and ${currentYear}.` };
    }
    const formatted = `${match[1]}-${match[2]}-${match[3]}-${match[4]}`;
    return { isValid: true, formatted, cleanValue: clean };
  }

  const generalDlRegex = /^[A-Z]{2}[0-9A-Z]{8,14}$/;
  if (!generalDlRegex.test(clean)) {
    return { isValid: false, error: 'Invalid Driving License format. Example: DL1420110012345 or MH0220180045678.' };
  }

  return { isValid: true, formatted: clean, cleanValue: clean };
}

/**
 * Validates an uploaded document file for MIME type, file size and format.
 */
export function validateDocumentFile(file: {
  mimetype?: string;
  size?: number;
  name?: string;
}): ValidationResult {
  if (!file) {
    return { isValid: false, error: 'No document file provided.' };
  }

  const allowedMimeTypes = new Set([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/pdf',
  ]);

  if (file.mimetype && !allowedMimeTypes.has(file.mimetype.toLowerCase())) {
    return {
      isValid: false,
      error: 'Invalid file format. Only PDF, JPG, PNG, and WebP files are accepted.',
    };
  }

  const maxSizeBytes = 10 * 1024 * 1024; // 10 MB
  if (file.size && file.size > maxSizeBytes) {
    return {
      isValid: false,
      error: 'File size exceeds maximum allowed limit of 10 MB.',
    };
  }

  if (file.size !== undefined && file.size === 0) {
    return {
      isValid: false,
      error: 'Uploaded file is empty. Please select a valid document.',
    };
  }

  return { isValid: true };
}

export type DocumentTypeKey = 'aadhaar' | 'pan' | 'rc' | 'driving_license';

/**
 * Universal document validator selector
 */
export function validateDocumentByType(docType: DocumentTypeKey, numberInput: string): ValidationResult {
  switch (docType) {
    case 'aadhaar':
      return validateAadhaar(numberInput);
    case 'pan':
      return validatePAN(numberInput);
    case 'rc':
      return validateRC(numberInput);
    case 'driving_license':
      return validateDrivingLicense(numberInput);
    default:
      return { isValid: false, error: 'Unsupported document type.' };
  }
}
