import { describe, expect, it } from "vitest";
import { refusesAppWorker } from "@/lib/pwa-registration";
const published = { production: true, framed: false, hostname: "cape-clergy-vault.lovable.app", search: "" };
describe("offline worker safety", () => {
  it("allows published apps only", () => {
    expect(refusesAppWorker(published)).toBe(false);
    expect(refusesAppWorker({ ...published, production: false })).toBe(true);
    expect(refusesAppWorker({ ...published, framed: true })).toBe(true);
  });
  it("blocks Lovable previews and supports the kill switch", () => {
    for (const hostname of ["id-preview--example.lovable.app", "preview--example.lovable.app", "lovableproject.com", "demo.lovableproject-dev.com", "beta.lovable.dev"]) expect(refusesAppWorker({ ...published, hostname })).toBe(true);
    expect(refusesAppWorker({ ...published, search: "?sw=off" })).toBe(true);
  });
});