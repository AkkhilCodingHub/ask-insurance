/**
 * Safe logging and string sanitizer to eliminate log injection vulnerabilities (CWE-117)
 */
export function sanitizeLog(val: unknown): string {
  if (val === null || val === undefined) return '';
  return String(val).replace(/[\r\n\x00-\x1f\x7f-\x9f]/g, ' ').slice(0, 500);
}

