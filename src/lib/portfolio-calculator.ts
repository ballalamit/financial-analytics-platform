import { TransactionType } from "@prisma/client";
import { MarketQuote } from "@/lib/market-service";

export interface HoldingSummary {
  ticker: string;
  units: number;
  avgBuyPrice: number;
  totalCostBasis: number;
  currentPrice: number;
  currentValue: number;
  unrealizedReturn: number;
  unrealizedReturnPercent: number;
}

export interface PortfolioMetrics {
  cashBalance: number;
  investedAmount: number;
  holdingsValue: number;
  totalPortfolioValue: number;
  absoluteReturn: number;
  percentageReturn: number;
  holdings: HoldingSummary[];
  chartData: {
    "1M": { date: string; value: number }[];
    "6M": { date: string; value: number }[];
    "1Y": { date: string; value: number }[];
    ALL: { date: string; value: number }[];
  };
}

export interface TransactionInput {
  ticker: string;
  type: TransactionType;
  units: unknown;
  amount: unknown;
}

/**
 * MODULE 1: Deterministic financial calculator for portfolio metrics and performance
 */
export function calculatePortfolioMetrics(
  transactions: TransactionInput[],
  cashBalanceNum: number,
  marketQuotes: MarketQuote[]
): PortfolioMetrics {
  const safeQuotes = Array.isArray(marketQuotes) ? marketQuotes : [];
  const quoteMap = new Map<string, number>();
  for (const q of safeQuotes) {
    quoteMap.set(q.ticker, q.currentPrice);
  }

  // Aggregate by ticker
  const tickerMap = new Map<
    string,
    { totalUnits: number; totalCost: number }
  >();

  for (const tx of transactions) {
    const ticker = tx.ticker;
    const units = Number(tx.units);
    const amount = Number(tx.amount);

    if (!tickerMap.has(ticker)) {
      tickerMap.set(ticker, { totalUnits: 0, totalCost: 0 });
    }

    const current = tickerMap.get(ticker)!;

    if (tx.type === TransactionType.BUY) {
      current.totalUnits += units;
      current.totalCost += amount;
    } else if (tx.type === TransactionType.SELL) {
      if (current.totalUnits > 0) {
        // Average cost basis reduction
        const avgCost = current.totalCost / current.totalUnits;
        current.totalUnits = Math.max(0, current.totalUnits - units);
        current.totalCost = Math.max(0, current.totalCost - (units * avgCost));
      }
    }
  }

  const holdings: HoldingSummary[] = [];
  let totalInvestedCostBasis = 0;
  let totalHoldingsCurrentValue = 0;

  tickerMap.forEach((stats, ticker) => {
    if (stats.totalUnits > 0.0001) {
      const avgBuyPrice = stats.totalCost / stats.totalUnits;
      // Get market price or fallback to average buy price
      const currentPrice = quoteMap.get(ticker) ?? avgBuyPrice;
      const currentValue = stats.totalUnits * currentPrice;
      const unrealizedReturn = currentValue - stats.totalCost;
      const unrealizedReturnPercent = stats.totalCost > 0 ? unrealizedReturn / stats.totalCost : 0;

      totalInvestedCostBasis += stats.totalCost;
      totalHoldingsCurrentValue += currentValue;

      holdings.push({
        ticker,
        units: parseFloat(stats.totalUnits.toFixed(4)),
        avgBuyPrice: parseFloat(avgBuyPrice.toFixed(2)),
        totalCostBasis: parseFloat(stats.totalCost.toFixed(2)),
        currentPrice: parseFloat(currentPrice.toFixed(2)),
        currentValue: parseFloat(currentValue.toFixed(2)),
        unrealizedReturn: parseFloat(unrealizedReturn.toFixed(2)),
        unrealizedReturnPercent: parseFloat(unrealizedReturnPercent.toFixed(4)),
      });
    }
  });

  const totalPortfolioValue = totalHoldingsCurrentValue + cashBalanceNum;
  const investedAmount = totalInvestedCostBasis + cashBalanceNum;
  const absoluteReturn = totalPortfolioValue - investedAmount;
  const percentageReturn = investedAmount > 0 ? absoluteReturn / investedAmount : 0;

  // Generate historical curve based on total portfolio value
  const now = new Date();
  const generateCurve = (days: number, count: number) => {
    const points: { date: string; value: number }[] = [];
    const stepDays = days / count;
    for (let i = count; i >= 0; i--) {
      const d = new Date(now.getTime() - i * stepDays * 24 * 60 * 60 * 1000);
      // Realistic growth curve leading up to current value
      const progress = 1 - (i / count);
      const simulatedPastValue = investedAmount + (absoluteReturn * progress) + (Math.sin(i * 1.5) * (totalPortfolioValue * 0.02));
      points.push({
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        value: parseFloat(simulatedPastValue.toFixed(2)),
      });
    }
    return points;
  };

  return {
    cashBalance: cashBalanceNum,
    investedAmount: parseFloat(investedAmount.toFixed(2)),
    holdingsValue: parseFloat(totalHoldingsCurrentValue.toFixed(2)),
    totalPortfolioValue: parseFloat(totalPortfolioValue.toFixed(2)),
    absoluteReturn: parseFloat(absoluteReturn.toFixed(2)),
    percentageReturn: parseFloat(percentageReturn.toFixed(4)),
    holdings,
    chartData: {
      "1M": generateCurve(30, 15),
      "6M": generateCurve(180, 24),
      "1Y": generateCurve(365, 36),
      ALL: generateCurve(1095, 48),
    },
  };
}
