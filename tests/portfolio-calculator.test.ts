import { describe, it, expect } from "vitest";
import { calculatePortfolioMetrics } from "@/lib/portfolio-calculator";
import { Transaction, TransactionType } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

describe("Module 1: Portfolio Metrics & Return Calculations", () => {
  it("accurately calculates holdings, invested cost basis, and unrealized returns", () => {
    const mockTransactions: Transaction[] = [
      {
        id: "tx-1",
        portfolioId: "p-1",
        ticker: "AAPL",
        type: TransactionType.BUY,
        units: new Decimal(10),
        pricePerUnit: new Decimal(150),
        amount: new Decimal(1500),
        date: new Date("2023-01-01"),
        notes: null,
        version: 1,
        idempotencyKey: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "tx-2",
        portfolioId: "p-1",
        ticker: "AAPL",
        type: TransactionType.BUY,
        units: new Decimal(10),
        pricePerUnit: new Decimal(200),
        amount: new Decimal(2000),
        date: new Date("2023-06-01"),
        notes: null,
        version: 1,
        idempotencyKey: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "tx-3",
        portfolioId: "p-1",
        ticker: "AAPL",
        type: TransactionType.SELL,
        units: new Decimal(5),
        pricePerUnit: new Decimal(220),
        amount: new Decimal(1100),
        date: new Date("2023-09-01"),
        notes: null,
        version: 1,
        idempotencyKey: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Current market price: AAPL = $250
    const marketQuotes = [
      {
        ticker: "AAPL",
        name: "Apple Inc.",
        currentPrice: 250.0,
        change24h: 1.5,
        lastUpdated: new Date().toISOString(),
        marketStatus: "OPEN",
      },
    ];

    const cashBalance = 5000.0;
    const metrics = calculatePortfolioMetrics(mockTransactions, cashBalance, marketQuotes);

    // Initial 20 units @ (1500+2000)/20 = $175 avg cost
    // Sold 5 units -> 15 units remaining @ $175 cost basis = $2,625
    // Current value of 15 units @ $250 = $3,750
    expect(metrics.holdings).toHaveLength(1);
    const aapl = metrics.holdings[0];
    expect(aapl.units).toBe(15);
    expect(aapl.avgBuyPrice).toBe(175);
    expect(aapl.totalCostBasis).toBe(2625);
    expect(aapl.currentValue).toBe(3750);
    expect(aapl.unrealizedReturn).toBe(1125); // 3750 - 2625

    // Total portfolio value: Holdings ($3,750) + Cash ($5,000) = $8,750
    expect(metrics.totalPortfolioValue).toBe(8750);
    // Total invested capital: Cost basis ($2,625) + Cash ($5,000) = $7,625
    expect(metrics.investedAmount).toBe(7625);
    // Absolute return: $8,750 - $7,625 = $1,125
    expect(metrics.absoluteReturn).toBe(1125);
  });
});
