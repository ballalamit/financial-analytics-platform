export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6 max-w-7xl mx-auto animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="h-14 bg-slate-900 border border-slate-800 rounded-xl" />

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="h-4 bg-slate-800 rounded w-1/3" />
            <div className="h-7 bg-slate-800 rounded w-2/3" />
          </div>
        ))}
      </div>

      {/* Market Widget Skeleton */}
      <div className="h-32 bg-slate-900 border border-slate-800 rounded-xl" />

      {/* Chart Skeleton */}
      <div className="h-72 bg-slate-900 border border-slate-800 rounded-xl" />

      {/* Holdings Skeleton */}
      <div className="h-48 bg-slate-900 border border-slate-800 rounded-xl" />
    </div>
  );
}
