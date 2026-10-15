import { HoldingSummary } from "@/lib/portfolio-calculator";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { PieChart, TrendingUp, TrendingDown, ArrowUpRight } from "lucide-react";
import Link from "next/link";

interface HoldingsTableProps {
  holdings: HoldingSummary[];
}

export default function HoldingsTable({ holdings }: HoldingsTableProps) {
  const safeHoldings = Array.isArray(holdings) ? holdings : [];

  if (safeHoldings.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
        <PieChart className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-white">No active holdings</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Start recording transactions to calculate your real-time holdings, cost basis, and performance.
        </p>
        <Link
          href="/transactions"
          className="inline-flex items-center gap-1.5 mt-4 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors"
        >
          Add First Transaction
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/80">
        <div>
          <h2 className="text-sm font-semibold text-white tracking-tight">Active Asset Holdings</h2>
          <p className="text-xs text-slate-400">Calculated from transaction ledger and market quotes</p>
        </div>
        <Link
          href="/transactions"
          className="text-xs text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1"
        >
          View all transactions <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
              <th className="pb-3 font-semibold">Asset</th>
              <th className="pb-3 font-semibold text-right">Units Held</th>
              <th className="pb-3 font-semibold text-right">Avg Cost</th>
              <th className="pb-3 font-semibold text-right">Market Price</th>
              <th className="pb-3 font-semibold text-right">Current Value</th>
              <th className="pb-3 font-semibold text-right">Unrealized P&amp;L</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {safeHoldings.map((h) => {
              const isProfit = h.unrealizedReturn >= 0;
              return (
                <tr key={h.ticker} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 font-bold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-slate-800 border border-slate-700/60 flex items-center justify-center text-[10px] text-blue-400">
                      {h.ticker.slice(0, 2)}
                    </span>
                    {h.ticker}
                  </td>
                  <td className="py-3 text-right text-slate-300">{h.units.toLocaleString()}</td>
                  <td className="py-3 text-right text-slate-300">{formatCurrency(h.avgBuyPrice)}</td>
                  <td className="py-3 text-right font-medium text-slate-200">
                    {formatCurrency(h.currentPrice)}
                  </td>
                  <td className="py-3 text-right font-bold text-white">
                    {formatCurrency(h.currentValue)}
                  </td>
                  <td className="py-3 text-right font-semibold">
                    <div className={`inline-flex items-center gap-1 ${isProfit ? "text-emerald-400" : "text-rose-400"}`}>
                      {isProfit ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      <span>{isProfit ? "+" : ""}{formatCurrency(h.unrealizedReturn)}</span>
                      <span className="text-[10px] opacity-75">({formatPercent(h.unrealizedReturnPercent)})</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
