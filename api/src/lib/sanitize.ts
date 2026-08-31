/**
 * Safe logging and string sanitizer to eliminate log injection vulnerabilities (CWE-117)
 */
export function sanitizeLog(val: unknown): string {
  if (val === null || val === undefined) return '';
  return encodeURIComponent(String(val).replace(/[\r\n]/g, ' ').slice(0, 500));
}
