import crypto from 'crypto';

// In-memory sliding window for rate limiting
// Maps IP hash to array of submission timestamps
const rateLimitMap = new Map<string, number[]>();

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_SUBMISSIONS_PER_WINDOW = 6; // Max 6 submissions per 10 minutes per IP

/**
 * Hash raw IP address with SHA-256 and internal salt.
 * Never stores or returns the raw IP address.
 */
export function hashClientIp(rawIp: string | null | undefined): string {
  if (!rawIp || rawIp === 'unknown' || rawIp === '::1' || rawIp === '127.0.0.1') {
    rawIp = 'localhost_dev_client';
  }
  const salt = process.env.IP_HASH_SALT || 'new_era_club_medical_form_salt_2026';
  return crypto.createHmac('sha256', salt).update(rawIp).digest('hex');
}

/**
 * Check if the hashed IP is rate limited.
 * Returns { allowed: boolean, remaining: number, resetInSeconds: number }
 */
export function checkRateLimit(ipHash: string): {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
} {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ipHash) || [];

  // Filter timestamps within current sliding window
  const recent = timestamps.filter((t) => now - t < WINDOW_MS);

  if (recent.length >= MAX_SUBMISSIONS_PER_WINDOW) {
    const oldest = recent[0];
    const resetInSeconds = Math.max(1, Math.ceil((oldest + WINDOW_MS - now) / 1000));
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds,
    };
  }

  // Record this attempt
  recent.push(now);
  rateLimitMap.set(ipHash, recent);

  return {
    allowed: true,
    remaining: MAX_SUBMISSIONS_PER_WINDOW - recent.length,
    resetInSeconds: Math.ceil(WINDOW_MS / 1000),
  };
}
