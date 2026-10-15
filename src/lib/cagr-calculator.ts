/**
 * MODULE 3: Financial Analytics Math Engine for CAGR and Fund Comparison
 */

export interface FundNavPoint {
  date: Date | string;
  nav: number;
}

export interface FundComparisonResult {
  fundCode: string;
  fundName: string;
  initialNav: number;
  finalNav: number;
  startDate: string;
  endDate: string;
  years: number;
  absoluteReturn: number;
  cagr: number | null;
  error?: string;
  navHistory: { date: string; nav: number }[];
}

/**
 * Calculates CAGR (Compound Annual Growth Rate) and Absolute Return
 * Formula: CAGR = (Final NAV / Initial NAV) ^ (1 / n) - 1
 *
 * Edge cases handled:
 * 1. n <= 0 or identical dates -> CAGR cannot be annualized over zero duration
 * 2. initialNav <= 0 -> Invalid financial denominator (division by zero)
 * 3. Final NAV <= 0 -> Total loss scenario (-100%)
 * 4. Leap years -> Normalized with 365.25 days per calendar year
 * 5. Sparse/missing dates -> Finds nearest date boundaries
 */
export function calculateFundAnalytics(
  fundCode: string,
  fundName: string,
  dataPoints: FundNavPoint[],
  fromDate?: Date | string,
  toDate?: Date | string
): FundComparisonResult {
  if (!dataPoints || dataPoints.length < 2) {
    return {
      fundCode,
      fundName,
      initialNav: 0,
      finalNav: 0,
      startDate: "",
      endDate: "",
      years: 0,
      absoluteReturn: 0,
      cagr: null,
      error: "Insufficient historical NAV data points (minimum 2 required).",
      navHistory: [],
    };
  }

  // Sort chronologically
  const sorted = [...dataPoints]
    .map((p) => ({ date: new Date(p.date), nav: Number(p.nav) }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  // Filter by requested date range if supplied
  const startFilter = fromDate ? new Date(fromDate) : sorted[0].date;
  const endFilter = toDate ? new Date(toDate) : sorted[sorted.length - 1].date;

  const inRange = sorted.filter(
    (p) => p.date >= startFilter && p.date <= endFilter
  );

  const activePoints = inRange.length >= 2 ? inRange : sorted;

  const firstPoint = activePoints[0];
  const lastPoint = activePoints[activePoints.length - 1];

  const initialNav = firstPoint.nav;
  const finalNav = lastPoint.nav;

  // Validation: Zero or negative initial value
  if (initialNav <= 0) {
    return {
      fundCode,
      fundName,
      initialNav,
      finalNav,
      startDate: firstPoint.date.toISOString().slice(0, 10),
      endDate: lastPoint.date.toISOString().slice(0, 10),
      years: 0,
      absoluteReturn: 0,
      cagr: null,
      error: "Invalid initial NAV (must be greater than 0).",
      navHistory: [],
    };
  }

  // Total Absolute Return = (V_f - V_i) / V_i
  const absoluteReturn = (finalNav - initialNav) / initialNav;

  // Calculate fractional years considering leap years (365.25 days/year)
  const diffDays =
    (lastPoint.date.getTime() - firstPoint.date.getTime()) / (1000 * 60 * 60 * 24);
  const years = diffDays / 365.25;

  let cagr: number | null = null;

  // Edge case: Time period under 30 days is too short for meaningful annualization
  if (years >= 0.08) {
    if (finalNav > 0) {
      // CAGR = (V_f / V_i) ^ (1 / n) - 1
      cagr = Math.pow(finalNav / initialNav, 1 / years) - 1;
    } else {
      cagr = -1.0; // 100% loss
    }
  }

  return {
    fundCode,
    fundName,
    initialNav: parseFloat(initialNav.toFixed(4)),
    finalNav: parseFloat(finalNav.toFixed(4)),
    startDate: firstPoint.date.toISOString().slice(0, 10),
    endDate: lastPoint.date.toISOString().slice(0, 10),
    years: parseFloat(years.toFixed(2)),
    absoluteReturn: parseFloat(absoluteReturn.toFixed(4)),
    cagr: cagr !== null ? parseFloat(cagr.toFixed(4)) : null,
    navHistory: activePoints.map((p) => ({
      date: p.date.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      nav: p.nav,
    })),
  };
}
