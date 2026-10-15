"use client";

import { useState, useEffect, useCallback } from "react";
import { MarketServiceResult, MarketQuote } from "@/lib/market-service";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";

interface MarketWidgetProps {
  marketResult: MarketServiceResult;
}

const REFRESH_INTERVAL_SECONDS = 30;

export default function MarketWidget({ marketResult: initialResult }: MarketWidgetProps) {
  const [data, setData] = useState<MarketServiceResult>(initialResult);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL_SECONDS);

  // Sync state if initialResult prop changes (e.g., from server revalidation)
  useEffect(() => {
    setData(initialResult);
  }, [initialResult]);

  // Fetch latest quotes from the mock API route with 3-second AbortController (Scenario C)
  const refreshQuotes = useCallback(async () => {
    setIsRefreshing(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    try {
      const res = await fetch("/api/mock/market-data", { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Upstream returned ${res.status}`);
      }
      const json = await res.json();
      if (!Array.isArray(json?.quotes) || json.quotes.length === 0) {
        throw new Error("Invalid payload: quotes is missing or empty");
      }
      setData({
        quotes: json.quotes as MarketQuote[],
        isStale: false,
        lastRefreshedAt: json.timestamp || new Date().toISOString(),
      });
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const isTimeout = err instanceof DOMException && err.name === "AbortError";
      const errorMsg = isTimeout
        ? "Market data gateway timed out (>3s). Showing cached snapshot."
        : "Upstream market data gateway is offline (503). Showing cached snapshot.";

      // In case of error/outage, preserve last known prices but mark as stale
      setData((prev) => ({
        quotes: Array.isArray(prev?.quotes) && prev.quotes.length > 0
          ? prev.quotes
          : (Array.isArray(initialResult?.quotes) ? initialResult.quotes : []),
        isStale: true,
        lastRefreshedAt: prev?.lastRefreshedAt || initialResult?.lastRefreshedAt || new Date().toISOString(),
        error: errorMsg,
      }));
    } finally {
      setIsRefreshing(false);
      setCountdown(REFRESH_INTERVAL_SECONDS);
    }
  }, [initialResult]);

  // 30-second automatic polling timer (Explicit Refresh Policy)
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          refreshQuotes();
          return REFRESH_INTERVAL_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [refreshQuotes]);

  const quotes = Array.isArray(data?.quotes) 
    ? data.quotes 
    : (Array.isArray(initialResult?.quotes) ? initialResult.quotes : []);
  const isStale = data?.isStale ?? false;
  const lastRefreshedAt = data?.lastRefreshedAt || initialResult?.lastRefreshedAt || new Date().toISOString();
  const error = data?.error;

  const formattedTime = new Date(lastRefreshedAt).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800/80 gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
            Market Data Service (Module 5)
            <span className="text-[10px] text-slate-400 font-normal">
              (Auto-refreshes in {countdown}s)
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Mock upstream financial exchange feed • 30s TTL Caching Policy
          </p>
        </div>

        {/* Status Badge & Manual Refresh Button */}
        <div className="flex items-center gap-2">
          {isStale ? (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span suppressHydrationWarning>Offline / Stale (Data as of {formattedTime})</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span suppressHydrationWarning>Live Feed (Refreshed at {formattedTime})</span>
            </div>
          )}

          {/* Manual Refresh Button */}
          <button
            type="button"
            onClick={refreshQuotes}
            disabled={isRefreshing}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors disabled:opacity-50"
            title="Refresh feed now"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-blue-400" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/40 text-amber-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid of Market Tickers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quotes.map((quote) => {
          const isPositive = quote.change24h >= 0;
          return (
            <div
              key={quote.ticker}
              className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-lg p-3 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-white text-xs">{quote.ticker}</span>
                <div
                  className={`flex items-center text-[11px] font-semibold ${
                    isPositive ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {isPositive ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                  {formatPercent(quote.change24h / 100)}
                </div>
              </div>
              <div className="text-base font-semibold text-slate-100 font-mono">
                {formatCurrency(quote.currentPrice)}
              </div>
              <div className="text-[10px] text-slate-400 truncate mt-0.5">{quote.name}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
