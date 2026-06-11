// Normalises incoming DigiLocker deep links to the /kyc-callback route.
//
// The HTTPS bridge may hand back either `askinsurance://kyc/callback?...` (the
// originally-deployed path) or `askinsurance://kyc-callback?...` (current path).
// expo-router has no `/kyc/callback` route (it would collide with /kyc), so the
// old form lands on "Unmatched Route". Rewrite both to /kyc-callback, preserving
// the OAuth query (code, state, error) so the handler can complete verification.
export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  try {
    if (typeof path === 'string' && (path.includes('kyc/callback') || path.includes('kyc-callback'))) {
      const q = path.includes('?') ? path.slice(path.indexOf('?')) : '';
      return '/kyc-callback' + q;
    }
  } catch {
    // fall through to default routing
  }
  return path;
}
