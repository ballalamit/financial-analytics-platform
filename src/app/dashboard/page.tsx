import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMarketQuotes } from "@/lib/market-service";
import { getChaosMode } from "@/actions/chaos-actions";
import { calculatePortfolioMetrics } from "@/lib/portfolio-calculator";
import PortfolioSummaryCards from "@/components/dashboard/PortfolioSummaryCards";
import PortfolioChart from "@/components/dashboard/PortfolioChart";
import MarketWidget from "@/components/dashboard/MarketWidget";
import HoldingsTable from "@/components/dashboard/HoldingsTable";
import ChaosSimulator from "@/components/dashboard/ChaosSimulator";

export const dynamic = "force-dynamic";

/**
 * MODULE 1 & MODULE 5: Main Portfolio Dashboard
 * Server Component: Fetches user portfolio, transactions, and resilient market data in parallel.
 */
export default async function DashboardPage() {
  const session = await requireAuth();

  // Fetch portfolio, transactions, market data, and chaos settings in parallel (No Waterfall!)
  const [userWithPortfolio, marketResult, chaosMode] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        portfolios: {
          include: {
            transactions: {
              select: {
                ticker: true,
                type: true,
                units: true,
                amount: true,
              },
            },
          },
        },
      },
    }),
    getMarketQuotes(),
    getChaosMode(),
  ]);

  if (!userWithPortfolio || userWithPortfolio.portfolios.length === 0) {
    return (
      <main className="max-w-7xl mx-auto p-6 text-center text-slate-400">
        No portfolio found for your account.
      </main>
    );
  }

  const primaryPortfolio = userWithPortfolio.portfolios[0];
  const cashBalance = Number(primaryPortfolio.cashBalance);

  // Compute financial metrics deterministically
  const metrics = calculatePortfolioMetrics(
    primaryPortfolio.transactions,
    cashBalance,
    marketResult.quotes
  );

  return (
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Module 5 Chaos Simulator (Reviewer controls for Adversarial Scenario C) */}
        <ChaosSimulator currentMode={chaosMode} />

        {/* Module 1: Metric KPI Summary Cards */}
        <PortfolioSummaryCards
          metrics={metrics}
          portfolioName={primaryPortfolio.name}
        />

        {/* Module 5: Resilient Market Data Service Widget */}
        <MarketWidget marketResult={marketResult} />

        {/* Module 1: Client-Side Interactive Performance Chart */}
        <PortfolioChart
          chartData={metrics.chartData}
          totalValue={metrics.totalPortfolioValue}
        />

        {/* Module 1: Active Asset Holdings */}
        <HoldingsTable holdings={metrics.holdings} />
      </main>
  );
}
