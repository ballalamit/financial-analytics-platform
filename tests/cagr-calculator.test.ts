import { describe, it, expect } from "vitest";
import { calculateFundAnalytics } from "@/lib/cagr-calculator";

describe("Module 3: CAGR & Financial Analytics Engine", () => {
  it("correctly calculates CAGR over a 3-year period", () => {
    // Investment grows from 100 to 172.8 over 3 years (20% CAGR: 100 * 1.2^3 = 172.8)
    const points = [
      { date: new Date("2021-01-01T00:00:00Z"), nav: 100.0 },
      { date: new Date("2024-01-01T00:00:00Z"), nav: 172.8 },
    ];

    const result = calculateFundAnalytics("TEST_FUND", "Test Fund", points);

    expect(result.error).toBeUndefined();
    expect(result.absoluteReturn).toBeCloseTo(0.728, 3);
    // Over 3 calendar years (accounting for 2024 leap year), CAGR should be ~20%
    expect(result.cagr).not.toBeNull();
    expect(result.cagr!).toBeCloseTo(0.20, 2);
  });

  it("handles edge case: horizon under 30 days should return null CAGR", () => {
    const points = [
      { date: new Date("2024-01-01T00:00:00Z"), nav: 100.0 },
      { date: new Date("2024-01-10T00:00:00Z"), nav: 105.0 },
    ];

    const result = calculateFundAnalytics("SHORT_FUND", "Short Fund", points);

    expect(result.absoluteReturn).toBeCloseTo(0.05, 3);
    expect(result.cagr).toBeNull(); // Time horizon too short for meaningful annualization
  });

  it("handles edge case: initial NAV of zero returns an error", () => {
    const points = [
      { date: new Date("2021-01-01T00:00:00Z"), nav: 0.0 },
      { date: new Date("2024-01-01T00:00:00Z"), nav: 150.0 },
    ];

    const result = calculateFundAnalytics("ZERO_FUND", "Zero Fund", points);

    expect(result.error).toBeDefined();
    expect(result.cagr).toBeNull();
  });

  it("handles negative market returns without taking imaginary roots", () => {
    // Drops from 100 to 50 over 2 years (-50% absolute return)
    const points = [
      { date: new Date("2022-01-01T00:00:00Z"), nav: 100.0 },
      { date: new Date("2024-01-01T00:00:00Z"), nav: 50.0 },
    ];

    const result = calculateFundAnalytics("BEAR_FUND", "Bear Fund", points);

    expect(result.absoluteReturn).toBeCloseTo(-0.5, 3);
    expect(result.cagr).not.toBeNull();
    // (50/100)^(1/2) - 1 = sqrt(0.5) - 1 = 0.7071 - 1 = -0.2929 (-29.29% CAGR)
    expect(result.cagr!).toBeCloseTo(-0.2929, 2);
  });
});
