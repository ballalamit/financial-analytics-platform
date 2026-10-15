export default function TransactionsLoading() {
  return (
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Title Header Skeleton */}
      <div className="mb-6 animate-pulse space-y-2">
        <div className="h-6 bg-slate-800 rounded w-64" />
        <div className="h-3.5 bg-slate-800/60 rounded w-96 max-w-full" />
      </div>

      {/* Filter Controls Skeleton */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm mb-6 animate-pulse">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="h-9 bg-slate-800/80 border border-slate-700/80 rounded-lg flex-1" />
          <div className="flex items-center gap-2">
            <div className="h-8 w-28 bg-slate-800/80 border border-slate-700/80 rounded-lg" />
            <div className="h-8 w-36 bg-slate-800/80 border border-slate-700/80 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Main Table Skeleton */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm animate-pulse">
        {/* Table Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800/80 gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="h-4 bg-slate-800 rounded w-28" />
              <div className="h-4 w-16 bg-slate-800 rounded-full" />
            </div>
            <div className="h-3 bg-slate-800/60 rounded w-64" />
          </div>
          <div className="h-8 w-36 bg-blue-600/30 rounded-lg border border-blue-500/30" />
        </div>

        {/* Table Header & Rows */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="pb-3 font-semibold w-28">Date</th>
                <th className="pb-3 font-semibold w-24">Ticker</th>
                <th className="pb-3 font-semibold w-24">Type</th>
                <th className="pb-3 font-semibold text-right w-20">Units</th>
                <th className="pb-3 font-semibold text-right w-24">Price</th>
                <th className="pb-3 font-semibold text-right w-32">Total Settlement</th>
                <th className="pb-3 font-semibold text-center w-20">Version</th>
                <th className="pb-3 font-semibold text-right w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((row) => (
                <tr key={row} className="py-3">
                  <td className="py-3">
                    <div className="h-3.5 bg-slate-800 rounded w-20" />
                  </td>
                  <td className="py-3">
                    <div className="h-3.5 bg-slate-800 rounded w-14 font-mono" />
                  </td>
                  <td className="py-3">
                    <div className="h-5 bg-slate-800/80 rounded w-16" />
                  </td>
                  <td className="py-3">
                    <div className="h-3.5 bg-slate-800/70 rounded w-12 ml-auto" />
                  </td>
                  <td className="py-3">
                    <div className="h-3.5 bg-slate-800/70 rounded w-16 ml-auto" />
                  </td>
                  <td className="py-3">
                    <div className="h-3.5 bg-slate-800/70 rounded w-20 ml-auto" />
                  </td>
                  <td className="py-3">
                    <div className="h-4 bg-slate-800/60 rounded w-8 mx-auto" />
                  </td>
                  <td className="py-3">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-6 w-6 bg-slate-800 rounded" />
                      <div className="h-6 w-6 bg-slate-800 rounded" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 mt-2 border-t border-slate-800 gap-3">
          <div className="h-3 bg-slate-800/60 rounded w-44" />
          <div className="flex items-center gap-2">
            <div className="h-7 w-20 bg-slate-800 rounded-lg" />
            <div className="h-7 w-20 bg-slate-800 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Module 6: Audit Log Viewer Skeleton */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm mt-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700/50" />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="h-3.5 bg-slate-800 rounded w-48" />
                <div className="h-3.5 w-24 bg-slate-800 rounded-full" />
              </div>
              <div className="h-2.5 bg-slate-800/60 rounded w-80 max-w-full" />
            </div>
          </div>
          <div className="w-6 h-6 bg-slate-800 rounded-lg" />
        </div>
      </div>
    </main>
  );
}
