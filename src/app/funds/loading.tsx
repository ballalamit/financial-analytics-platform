export default function FundsLoading() {
  return (
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Title Header Skeleton */}
      <div className="mb-6 animate-pulse space-y-2">
        <div className="h-6 bg-slate-800 rounded w-64" />
        <div className="h-3.5 bg-slate-800/60 rounded w-96 max-w-full" />
      </div>

      {/* Fund Selection & Horizon Controls Skeleton */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm mb-6 animate-pulse">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Fund Checkbox Pills Skeleton */}
          <div className="space-y-2">
            <div className="h-3 bg-slate-800 rounded w-44" />
            <div className="flex flex-wrap items-center gap-2">
              {[
                { name: "Apex Tech Growth Fund", width: "w-44" },
                { name: "Apex Bluechip 50 Index", width: "w-48" },
                { name: "Apex ESG Sustainable Alpha", width: "w-52" },
                { name: "Apex High Yield Bond Fund", width: "w-50" },
              ].map((fund, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700/60 bg-slate-800/60"
                >
                  <div className="w-3.5 h-3.5 rounded bg-slate-700" />
                  <div className={`h-3.5 bg-slate-700 rounded ${fund.width}`} />
                </div>
              ))}
            </div>
          </div>

          {/* Time Horizon Selector & Share Link Skeleton */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              {["1Y", "3Y", "5Y", "ALL"].map((r) => (
                <div key={r} className="h-6 w-9 bg-slate-800 rounded" />
              ))}
            </div>
            <div className="h-8 w-24 bg-slate-800 rounded-lg border border-slate-700/60" />
          </div>
        </div>
      </div>

      {/* Normalized Performance Line Chart Skeleton */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm mb-6 animate-pulse">
        <div className="mb-4 space-y-1.5">
          <div className="h-4 bg-slate-800 rounded w-72" />
          <div className="h-3 bg-slate-800/60 rounded w-96 max-w-full" />
        </div>

        {/* Chart Canvas Shimmer with baseline grid */}
        <div className="h-[320px] w-full bg-slate-950/40 border border-slate-800/40 rounded-lg flex flex-col justify-between p-6">
          <div className="w-full flex items-center justify-between border-b border-slate-800/40 pb-2">
            <div className="h-2.5 bg-slate-800 rounded w-8" />
            <div className="h-2.5 bg-slate-800/40 rounded w-full ml-4" />
          </div>
          <div className="w-full flex items-center justify-between border-b border-slate-800/40 pb-2">
            <div className="h-2.5 bg-slate-800 rounded w-8" />
            <div className="h-2.5 bg-slate-800/40 rounded w-full ml-4" />
          </div>
          <div className="w-full flex items-center justify-between border-b border-slate-800/40 pb-2">
            <div className="h-2.5 bg-slate-800 rounded w-8" />
            <div className="h-2.5 bg-slate-800/40 rounded w-full ml-4" />
          </div>
          <div className="w-full flex items-center justify-between">
            <div className="h-2.5 bg-slate-800 rounded w-8" />
            <div className="h-2.5 bg-slate-800/40 rounded w-full ml-4" />
          </div>
        </div>
      </div>

      {/* Fund Metrics & CAGR Table Skeleton */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm animate-pulse">
        <div className="pb-4 mb-4 border-b border-slate-800/80 space-y-1.5">
          <div className="h-4 bg-slate-800 rounded w-64" />
          <div className="h-3 bg-slate-800/60 rounded w-80 max-w-full" />
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
              {[1, 2, 3].map((row) => (
                <tr key={row}>
                  <td className="py-3">
                    <div className="space-y-1">
                      <div className="h-3.5 bg-slate-800 rounded w-44" />
                      <div className="h-2.5 bg-slate-800/50 rounded w-28 font-mono" />
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="h-3.5 bg-slate-800/70 rounded w-16 ml-auto" />
                  </td>
                  <td className="py-3">
                    <div className="h-3.5 bg-slate-800/70 rounded w-16 ml-auto" />
                  </td>
                  <td className="py-3">
                    <div className="h-3.5 bg-slate-800/60 rounded w-28 ml-auto" />
                  </td>
                  <td className="py-3">
                    <div className="h-3.5 bg-slate-800/70 rounded w-14 ml-auto" />
                  </td>
                  <td className="py-3">
                    <div className="h-5 bg-slate-800/80 rounded w-16 ml-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
