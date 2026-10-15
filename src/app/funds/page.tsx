import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
  await requireAuth();

  // 1. Parse URL Parameters for shareable comparison view
  const rawFunds = searchParams.funds?.split(",").filter(Boolean) || ["TECH_GROWTH", "BLUECHIP_INDEX"];
  const range = searchParams.range || "3Y";

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

  // 2. Fetch distinct available funds & historical NAVs in parallel (Eliminates Waterfall!)
  const [distinctFunds, navRecords] = await Promise.all([
    prisma.fundHistoricalNav.groupBy({
      by: ["fundCode", "fundName"],
    }),
    prisma.fundHistoricalNav.findMany({
      where: {
        fundCode: { in: rawFunds },
        date: { gte: startDate },
      },
      orderBy: { date: "asc" },
      select: {
        fundCode: true,
        fundName: true,
        date: true,
        nav: true,
      },
    }),
  ]);

  const availableFunds = distinctFunds.map((f) => ({
    code: f.fundCode,
    name: f.fundName,
  }));

  const activeFundCodes = rawFunds.length > 0 ? rawFunds : ["TECH_GROWTH", "BLUECHIP_INDEX"];

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
  );
}
