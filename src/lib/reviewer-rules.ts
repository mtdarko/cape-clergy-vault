export const OTP_FRESH_SECONDS = 600;

/** True when the session was established by an emailed one-time code within the last 10 minutes. */
export function isFreshOtp(amr: unknown, nowSec: number): boolean {
  if (!Array.isArray(amr)) return false;
  return amr.some((a: any) => ["otp", "magiclink"].includes(a?.method) && typeof a.timestamp === "number" && nowSec - a.timestamp <= OTP_FRESH_SECONDS);
}

export const SIGNED_URL_SECONDS = 60;
