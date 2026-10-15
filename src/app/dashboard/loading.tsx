export default function DashboardLoading() {
  return (
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Module 5 Chaos Simulator Skeleton */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm animate-pulse">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-slate-700" />
              <div className="h-3.5 bg-slate-800 rounded w-64" />
            </div>
            <div className="h-2.5 bg-slate-800/60 rounded w-80 sm:w-96 max-w-full" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-28 bg-slate-800/80 rounded-lg border border-slate-700/50" />
            <div className="h-8 w-44 bg-slate-800/80 rounded-lg border border-slate-700/50" />
          </div>
        </div>
      </div>

      {/* Module 1: Metric KPI Summary Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between h-32"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="h-3 bg-slate-800 rounded w-28" />
              <div className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700/50" />
            </div>
            <div className="space-y-2">
              <div className="h-7 bg-slate-800 rounded w-36" />
              <div className="h-2.5 bg-slate-800/60 rounded w-44 max-w-full" />
            </div>
          </div>
        ))}
      </div>

      {/* Module 5: Resilient Market Data Service Widget Skeleton */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm animate-pulse">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800/80 gap-3">
          <div className="space-y-1.5">
            <div className="h-4 bg-slate-800 rounded w-52" />
            <div className="h-3 bg-slate-800/60 rounded w-64 sm:w-80" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-7 w-44 bg-slate-800/80 rounded-full border border-slate-700/50" />
            <div className="h-7 w-20 bg-slate-800/80 rounded-lg border border-slate-700/50" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-3.5 bg-slate-700 rounded w-12" />
                <div className="h-3 bg-slate-700/60 rounded w-14" />
              </div>
              <div className="h-5 bg-slate-700 rounded w-20" />
              <div className="h-2.5 bg-slate-700/50 rounded w-24" />
            </div>
          ))}
        </div>
      </div>

      {/* Module 1: Interactive Performance Chart Skeleton */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm animate-pulse">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800/80 gap-3">
          <div className="space-y-2">
            <div className="h-3 bg-slate-800 rounded w-36" />
            <div className="flex items-baseline gap-2">
              <div className="h-7 bg-slate-800 rounded w-36" />
              <div className="h-3.5 bg-slate-800/60 rounded w-24" />
            </div>
          </div>
          <div className="h-8 w-44 bg-slate-950 border border-slate-800 rounded-lg" />
        </div>
        <div className="h-[280px] w-full bg-slate-950/40 border border-slate-800/40 rounded-lg flex flex-col justify-end p-4">
          <div className="w-full flex items-end justify-between gap-2 h-44 opacity-25">
            {[35, 45, 40, 55, 50, 65, 60, 75, 70, 85, 80, 95].map((h, idx) => (
              <div
                key={idx}
                className="flex-1 bg-blue-500/30 rounded-t"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Module 1: Active Asset Holdings Skeleton */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm animate-pulse">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/80">
          <div className="space-y-1.5">
            <div className="h-4 bg-slate-800 rounded w-36" />
            <div className="h-3 bg-slate-800/60 rounded w-64" />
          </div>
          <div className="h-3.5 bg-slate-800 rounded w-28" />
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-6 gap-4 pb-2 border-b border-slate-800 text-[10px]">
            <div className="h-3 bg-slate-800 rounded w-16" />
            <div className="h-3 bg-slate-800 rounded w-14 ml-auto" />
            <div className="h-3 bg-slate-800 rounded w-14 ml-auto" />
            <div className="h-3 bg-slate-800 rounded w-16 ml-auto" />
            <div className="h-3 bg-slate-800 rounded w-18 ml-auto" />
            <div className="h-3 bg-slate-800 rounded w-16 ml-auto" />
          </div>
          {[1, 2, 3, 4].map((r) => (
            <div key={r} className="grid grid-cols-6 gap-4 py-2.5 border-b border-slate-800/40">
              <div className="space-y-1">
                <div className="h-3.5 bg-slate-800 rounded w-16" />
                <div className="h-2.5 bg-slate-800/50 rounded w-24" />
              </div>
              <div className="h-3.5 bg-slate-800/70 rounded w-12 ml-auto" />
              <div className="h-3.5 bg-slate-800/70 rounded w-14 ml-auto" />
              <div className="h-3.5 bg-slate-800/70 rounded w-14 ml-auto" />
              <div className="h-3.5 bg-slate-800/70 rounded w-16 ml-auto" />
              <div className="h-3.5 bg-slate-800/70 rounded w-14 ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
