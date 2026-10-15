import { requireAuth, requirePortfolioOwnership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMarketQuotes } from "@/lib/market-service";
import { getChaosMode } from "@/actions/chaos-actions";
import { calculatePortfolioMetrics } from "@/lib/portfolio-calculator";
import PortfolioSummaryCards from "@/components/dashboard/PortfolioSummaryCards";
import PortfolioChart from "@/components/dashboard/PortfolioChart";
import MarketWidget from "@/components/dashboard/MarketWidget";
import HoldingsTable from "@/components/dashboard/HoldingsTable";
import ChaosSimulator from "@/components/dashboard/ChaosSimulator";
import { ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

interface DashboardPageProps {
  searchParams?: {
    portfolioId?: string;
  };
}

/**
 * MODULE 1 & MODULE 5: Main Portfolio Dashboard
 * Server Component: Fetches user portfolio, transactions, and resilient market data in parallel.
 */
export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await requireAuth();

  // Multi-Tenant Authorization Check for Reads (Adversarial Scenario B)
  // If User A changes portfolioId in URL to User B's portfolio, strictly reject.
  if (searchParams?.portfolioId) {
    try {
      await requirePortfolioOwnership(searchParams.portfolioId);
    } catch {
      return (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16 flex items-center justify-center">
          <div className="max-w-md w-full bg-slate-900 border border-rose-800/80 rounded-2xl p-8 text-center shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold uppercase tracking-wider mb-3">
              403 Unauthorized Access
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Access Denied</h1>
            <p className="text-xs text-rose-300 leading-relaxed mb-6">
              <strong>Adversarial Scenario B Safeguard:</strong> You do not have permission to view or manipulate this portfolio. Cross-tenant reads are strictly blocked at the database level.
            </p>
            <a
              href="/dashboard"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-sm"
            >
              Return to Authorized Dashboard
            </a>
          </div>
        </main>
      );
    }
  }

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
