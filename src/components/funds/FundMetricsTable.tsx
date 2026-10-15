import { FundComparisonResult } from "@/lib/cagr-calculator";
import { formatPercent } from "@/lib/utils";
import { TrendingUp, TrendingDown, Info } from "lucide-react";

interface FundMetricsTableProps {
  results: FundComparisonResult[];
}

export default function FundMetricsTable({ results }: FundMetricsTableProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/80">
        <div>
          <h2 className="text-sm font-semibold text-white tracking-tight">
            Fund Performance &amp; CAGR Matrix (Module 3)
          </h2>
          <p className="text-xs text-slate-400">
            Compound Annual Growth Rate calculated over actual trading dates (365.25 days/year)
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
              <th className="pb-3 font-semibold">Fund</th>
              <th className="pb-3 font-semibold text-right">Inception NAV</th>
              <th className="pb-3 font-semibold text-right">Current NAV</th>
              <th className="pb-3 font-semibold text-right">Horizon</th>
              <th className="pb-3 font-semibold text-right">Absolute Return</th>
              <th className="pb-3 font-semibold text-right">Annualized CAGR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {results.map((res) => {
              const isPositive = res.absoluteReturn >= 0;
              return (
                <tr key={res.fundCode} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3">
                    <div className="font-bold text-white">{res.fundName}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{res.fundCode}</div>
                  </td>
                  <td className="py-3 text-right font-mono text-slate-300">
                    ${res.initialNav.toFixed(2)}
                  </td>
                  <td className="py-3 text-right font-mono font-bold text-white">
                    ${res.finalNav.toFixed(2)}
                  </td>
                  <td className="py-3 text-right text-slate-400">
                    {res.years} yrs ({res.startDate} &rarr; {res.endDate})
                  </td>
                  <td className="py-3 text-right font-semibold">
                    <span className={isPositive ? "text-emerald-400" : "text-rose-400"}>
                      {formatPercent(res.absoluteReturn)}
                    </span>
                  </td>
                  <td className="py-3 text-right font-bold">
                    {res.cagr !== null ? (
                      <span className={`inline-flex items-center gap-1 font-mono ${
                        res.cagr >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}>
                        {res.cagr >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {formatPercent(res.cagr)}
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[10px]">N/A (&lt;30d)</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Assumptions & Mathematical Documentation Box (Required by Module 3) */}
      <div className="mt-5 p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-300">Documented Mathematical Assumptions: </span>
          CAGR formula applied is CAGR = (Ending NAV / Inception NAV)^(1 / n) - 1, where n = Calendar Days / 365.25 to account for leap years. Missing weekend or holiday NAV records default to the previous settlement date. Total loss scenarios are clamped to -100% without complex root degeneration.
        </div>
      </div>
    </div>
  );
}
