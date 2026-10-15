import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/layout/Navbar";
import FundSelector from "@/components/funds/FundSelector";
import FundComparisonChart from "@/components/funds/FundComparisonChart";
import FundMetricsTable from "@/components/funds/FundMetricsTable";
import { calculateFundAnalytics, FundComparisonResult } from "@/lib/cagr-calculator";

export const dynamic = "force-dynamic";

interface FundsPageProps {
  searchParams: {
    funds?: string;
    range?: string;
  };
}

/**
 * MODULE 3: Fund Analytics & Comparative CAGR Engine
 * Server Component: Queries historical NAV data and computes annualized returns deterministically.
 */
export default async function FundsPage({ searchParams }: FundsPageProps) {
  const session = await requireAuth();

  // 1. Parse URL Parameters for shareable comparison view
  const rawFunds = searchParams.funds?.split(",").filter(Boolean) || ["TECH_GROWTH", "BLUECHIP_INDEX"];
  const range = searchParams.range || "3Y";

  // 2. Fetch distinct available funds from database
  const distinctFunds = await prisma.fundHistoricalNav.groupBy({
    by: ["fundCode", "fundName"],
  });

  const availableFunds = distinctFunds.map((f) => ({
    code: f.fundCode,
    name: f.fundName,
  }));

  const availableCodes = new Set(availableFunds.map((f) => f.code));
  // Filter out any invalid/spoofed fund codes from the URL
  const validatedFunds = rawFunds.filter((c) => availableCodes.has(c));
  const activeFundCodes = validatedFunds.length > 0 ? validatedFunds : ["TECH_GROWTH", "BLUECHIP_INDEX"];

  // Calculate Start Date based on range
  const now = new Date();
  let startDate = new Date("2021-01-01T00:00:00Z");
  if (range === "1Y") {
    startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  } else if (range === "3Y") {
    startDate = new Date(now.getFullYear() - 3, now.getMonth(), now.getDate());
  } else if (range === "5Y") {
    startDate = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate());
  }

  // 3. Fetch Historical NAVs for selected funds
  const navRecords = await prisma.fundHistoricalNav.findMany({
    where: {
      fundCode: { in: activeFundCodes },
      date: { gte: startDate },
    },
    orderBy: { date: "asc" },
  });

  // Group by fundCode
  const recordsByFund = new Map<string, typeof navRecords>();
  for (const r of navRecords) {
    if (!recordsByFund.has(r.fundCode)) {
      recordsByFund.set(r.fundCode, []);
    }
    recordsByFund.get(r.fundCode)!.push(r);
  }

  // 4. Calculate CAGR and performance metrics for each fund
  const results: FundComparisonResult[] = [];
  for (const fundCode of activeFundCodes) {
    const records = recordsByFund.get(fundCode) || [];
    const fundMeta = availableFunds.find((f) => f.code === fundCode);
    const fundName = fundMeta ? fundMeta.name : fundCode;

    const dataPoints = records.map((r) => ({
      date: r.date,
      nav: Number(r.nav),
    }));

    const analysis = calculateFundAnalytics(
      fundCode,
      fundName,
      dataPoints,
      startDate,
      now
    );

    results.push(analysis);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar user={session} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold tracking-tight text-white">Institutional Fund Analytics</h1>
          <p className="text-xs text-slate-400 mt-1">
            Comparative performance, historical NAV trajectories, and annualized CAGR calculations
          </p>
        </div>

        {/* Selection & Horizon Controls */}
        <FundSelector
          availableFunds={availableFunds}
          selectedFundCodes={activeFundCodes}
          selectedRange={range}
        />

        {/* Performance Line Chart */}
        <FundComparisonChart results={results} />

        {/* Matrix Table with CAGR */}
        <FundMetricsTable results={results} />
      </main>
    </div>
  );
}
