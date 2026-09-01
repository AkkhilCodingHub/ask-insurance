export const OTP_DURATION_SECONDS = 300; // 5 minutes

const cooldownStore = new Map<string, number>();

export function startOtpCooldown(identifier: string, seconds: number = OTP_DURATION_SECONDS): number {
  const cleanKey = identifier.replace(/\D/g, '').slice(-10) || identifier.trim().toLowerCase();
  const expiresAt = Date.now() + seconds * 1000;
  cooldownStore.set(cleanKey, expiresAt);
  return seconds;
}

export function getRemainingOtpSeconds(identifier: string): number {
  if (!identifier) return 0;
  const cleanKey = identifier.replace(/\D/g, '').slice(-10) || identifier.trim().toLowerCase();
  const expiresAt = cooldownStore.get(cleanKey);
  if (!expiresAt) return 0;
  const diffSeconds = Math.ceil((expiresAt - Date.now()) / 1000);
  if (diffSeconds <= 0) {
    cooldownStore.delete(cleanKey);
    return 0;
  }
  return diffSeconds;
}

export function formatOtpTimer(totalSeconds: number): string {
  const clamped = Math.max(0, totalSeconds);
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
