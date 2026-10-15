"use client";

import { AlertCircle, RefreshCw } from "lucide-react";

export default function FundsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="p-3 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 mb-4">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h2 className="text-lg font-bold text-white mb-1">Failed to calculate fund analytics</h2>
      <p className="text-xs text-slate-400 max-w-md mb-6">{error.message}</p>
      <button
        onClick={() => reset()}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Retry Analysis
      </button>
    </div>
  );
}
