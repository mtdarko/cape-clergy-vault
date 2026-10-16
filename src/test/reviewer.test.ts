import { describe, it, expect } from "vitest";
import { isFreshOtp } from "@/lib/reviewer-rules";

describe("dean verification freshness", () => {
  it("accepts an emailed code used 5 minutes ago", () => {
    expect(isFreshOtp([{ method: "otp", timestamp: 1000 }], 1300)).toBe(true);
  });
  it("rejects a code older than 10 minutes", () => {
    expect(isFreshOtp([{ method: "otp", timestamp: 1000 }], 1601)).toBe(false);
  });
  it("rejects password-only sessions", () => {
    expect(isFreshOtp([{ method: "password", timestamp: 1000 }], 1001)).toBe(false);
  });
});
