import { describe, expect, it } from "vitest";
import { calculateChargeCents } from "./pricing";

describe("calculateChargeCents", () => {
  it("returns 0 when no plan", () => {
    const entryAt = new Date("2026-01-01T10:00:00Z");
    const exitAt = new Date("2026-01-01T11:00:00Z");
    expect(calculateChargeCents({ entryAt, exitAt, plan: null })).toBe(0);
  });

  it("uses fixedPriceCents when provided", () => {
    const entryAt = new Date("2026-01-01T10:00:00Z");
    const exitAt = new Date("2026-01-01T10:10:00Z");
    expect(
      calculateChargeCents({
        entryAt,
        exitAt,
        plan: {
          fixedPriceCents: 1500,
          fractionMinutes: 60,
          pricePerFractionCents: 500,
          graceMinutes: 0,
          dailyMaxCents: null,
        },
      }),
    ).toBe(1500);
  });

  it("charges by fractions with grace", () => {
    const entryAt = new Date("2026-01-01T10:00:00Z");
    const exitAt = new Date("2026-01-01T11:05:00Z"); // 65 min
    // grace 10 => 55 min, fraction 30 => 2 fractions
    expect(
      calculateChargeCents({
        entryAt,
        exitAt,
        plan: {
          fixedPriceCents: null,
          fractionMinutes: 30,
          pricePerFractionCents: 700,
          graceMinutes: 10,
          dailyMaxCents: null,
        },
      }),
    ).toBe(1400);
  });

  it("applies dailyMaxCents ceiling", () => {
    const entryAt = new Date("2026-01-01T10:00:00Z");
    const exitAt = new Date("2026-01-01T18:00:00Z"); // long
    expect(
      calculateChargeCents({
        entryAt,
        exitAt,
        plan: {
          fixedPriceCents: null,
          fractionMinutes: 60,
          pricePerFractionCents: 1000,
          graceMinutes: 0,
          dailyMaxCents: 2500,
        },
      }),
    ).toBe(2500);
  });
});

