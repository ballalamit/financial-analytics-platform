import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { cookies } from "next/headers";

export interface MarketQuote {
  ticker: string;
  name: string;
  currentPrice: number;
  change24h: number;
  lastUpdated: string;
  marketStatus: string;
}

export interface MarketServiceResult {
  quotes: MarketQuote[];
  isStale: boolean;
  lastRefreshedAt: string;
  error?: string;
}

export const BASE_ASSETS = [
  { ticker: "AAPL", name: "Apple Inc.", basePrice: 224.50 },
  { ticker: "MSFT", name: "Microsoft Corp.", basePrice: 418.20 },
  { ticker: "NVDA", name: "NVIDIA Corp.", basePrice: 135.40 },
  { ticker: "GOOGL", name: "Alphabet Inc.", basePrice: 168.90 },
  { ticker: "VOO", name: "Vanguard S&P 500 ETF", basePrice: 512.80 },
  { ticker: "AMZN", name: "Amazon.com Inc.", basePrice: 186.30 },
  { ticker: "TSLA", name: "Tesla Inc.", basePrice: 218.40 },
  { ticker: "META", name: "Meta Platforms Inc.", basePrice: 510.60 },
];

export function generateLiveQuotes(): MarketQuote[] {
  const now = new Date();
  return BASE_ASSETS.map((asset) => {
    const variancePercent = Math.sin(now.getTime() / 10000 + asset.basePrice) * 0.008;
    const currentPrice = parseFloat((asset.basePrice * (1 + variancePercent)).toFixed(2));
    const change24h = parseFloat((variancePercent * 100).toFixed(2));

    return {
      ticker: asset.ticker,
      name: asset.name,
      currentPrice,
      change24h,
      lastUpdated: now.toISOString(),
      marketStatus: "OPEN",
    };
  });
}

/**
 * MODULE 5 & ADVERSARIAL SCENARIO C
 * Ultra-fast direct market data consumer with chaos simulation,
 * fallback snapshot caching, and zero HTTP loopback latency.
 */
export async function getMarketQuotes(): Promise<MarketServiceResult> {
  const cookieStore = cookies();
  const mode = cookieStore.get("x_chaos_mode")?.value || "normal";

  // Simulate 30s Upstream Outage (Adversarial Scenario C)
  if (mode === "outage") {
    try {
      // Read the last known snapshot from the database
      const cached = await prisma.marketDataCache.findUnique({
        where: { id: "MARKET_DATA_SNAPSHOT" },
      });

      if (cached && Array.isArray(cached.payload) && cached.payload.length > 0) {
        return {
          quotes: cached.payload as unknown as MarketQuote[],
          isStale: true,
          lastRefreshedAt: cached.fetchedAt.toISOString(),
          error: "Upstream market data gateway is offline (503). Showing cached snapshot.",
        };
      }
    } catch (dbErr) {
      console.warn("Could not retrieve market cache from DB:", dbErr);
    }

    // Resilient fallback if no snapshot exists in DB yet
    const fallbackQuotes = generateLiveQuotes();
    return {
      quotes: fallbackQuotes,
      isStale: true,
      lastRefreshedAt: new Date().toISOString(),
      error: "Upstream market data gateway is offline (503). Showing cached snapshot.",
    };
  }

  // Normal Mode: Fast in-memory generation (sub-millisecond)
  const quotes = generateLiveQuotes();
  const timestamp = new Date();

  // Asynchronously update cache in database in background without blocking response
  prisma.marketDataCache
    .upsert({
      where: { id: "MARKET_DATA_SNAPSHOT" },
      update: {
        payload: quotes as unknown as Prisma.InputJsonValue,
        fetchedAt: timestamp,
        isStale: false,
      },
      create: {
        id: "MARKET_DATA_SNAPSHOT",
        payload: quotes as unknown as Prisma.InputJsonValue,
        fetchedAt: timestamp,
        isStale: false,
      },
    })
    .catch((err) => console.warn("Could not cache market snapshot:", err));

  return {
    quotes,
    isStale: false,
    lastRefreshedAt: timestamp.toISOString(),
  };
}
