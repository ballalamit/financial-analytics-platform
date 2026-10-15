"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { Search, Filter, ArrowUpDown, X, RefreshCw } from "lucide-react";

export default function TransactionFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSearch = searchParams.get("search") || "";
  const currentType = searchParams.get("type") || "ALL";
  const currentSort = searchParams.get("sort") || "date_desc";

  const [searchTerm, setSearchTerm] = useState(currentSearch);

  const createQueryString = useCallback(
    (params: Record<string, string | null>) => {
      const current = new URLSearchParams(Array.from(searchParams.entries()));
      for (const [key, value] of Object.entries(params)) {
        if (value === null || value === "" || value === "ALL") {
          current.delete(key);
        } else {
          current.set(key, value);
        }
      }
      // Reset page to 1 when filters change
      if (!("page" in params)) {
        current.delete("page");
      }
      return current.toString();
    },
    [searchParams]
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(() => {
      const qs = createQueryString({ search: searchTerm });
      router.push(`${pathname}?${qs}`);
    });
  };

  const handleTypeChange = (type: string) => {
    startTransition(() => {
      const qs = createQueryString({ type });
      router.push(`${pathname}?${qs}`);
    });
  };

  const handleSortChange = (sort: string) => {
    startTransition(() => {
      const qs = createQueryString({ sort });
      router.push(`${pathname}?${qs}`);
    });
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    startTransition(() => {
      router.push(pathname);
    });
  };

  const hasActiveFilters = currentSearch || currentType !== "ALL" || currentSort !== "date_desc";

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search bar */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ticker (e.g. AAPL) or trade notes..."
            className="w-full pl-9 pr-20 py-2 bg-slate-800/80 border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          <button
            type="submit"
            className="absolute inset-y-1 right-1 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-medium transition-colors"
          >
            Search
          </button>
        </form>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Type Filter */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={currentType}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">All Types</option>
              <option value="BUY" className="bg-slate-900">Buy</option>
              <option value="SELL" className="bg-slate-900">Sell</option>
              <option value="DIVIDEND" className="bg-slate-900">Dividend</option>
            </select>
          </div>

          {/* Sort Filter */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={currentSort}
              onChange={(e) => handleSortChange(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="date_desc" className="bg-slate-900">Date: Newest First</option>
              <option value="date_asc" className="bg-slate-900">Date: Oldest First</option>
              <option value="amount_desc" className="bg-slate-900">Amount: Highest First</option>
              <option value="amount_asc" className="bg-slate-900">Amount: Lowest First</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-700/60 bg-slate-800 text-slate-400 hover:text-white text-xs transition-colors"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          )}

          {isPending && (
            <RefreshCw className="w-4 h-4 text-blue-400 animate-spin ml-1" />
          )}
        </div>
      </div>
    </div>
  );
}
