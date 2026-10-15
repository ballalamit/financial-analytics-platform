"use client";

import { useRouter, usePathname } from "next/navigation";
import { useTransition, useState, useEffect } from "react";
import { Check, Share2 } from "lucide-react";

interface AvailableFund {
  code: string;
  name: string;
}

interface FundSelectorProps {
  availableFunds: AvailableFund[];
  selectedFundCodes: string[];
  selectedRange: string;
}

export default function FundSelector({
  availableFunds,
  selectedFundCodes,
  selectedRange,
}: FundSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  // Sync default parameters to the URL immediately on first load if query string is empty
  useEffect(() => {
    if (typeof window !== "undefined" && !window.location.search) {
      const params = new URLSearchParams();
      if (selectedFundCodes.length > 0) {
        params.set("funds", selectedFundCodes.join(","));
      }
      params.set("range", selectedRange);
      window.history.replaceState(null, "", `${pathname}?${params.toString()}`);
    }
  }, [pathname, selectedFundCodes, selectedRange]);

  const updateUrl = (funds: string[], range: string) => {
    startTransition(() => {
      const params = new URLSearchParams();
      if (funds.length > 0) {
        params.set("funds", funds.join(","));
      }
      if (range) {
        params.set("range", range);
      }
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const toggleFund = (code: string) => {
    let next: string[];
    if (selectedFundCodes.includes(code)) {
      if (selectedFundCodes.length <= 1) return; // Keep at least one
      next = selectedFundCodes.filter((c) => c !== code);
    } else {
      next = [...selectedFundCodes, code];
    }
    updateUrl(next, selectedRange);
  };

  const setRange = (range: string) => {
    updateUrl(selectedFundCodes, range);
  };

  const copyShareableUrl = () => {
    const params = new URLSearchParams();
    if (selectedFundCodes.length > 0) {
      params.set("funds", selectedFundCodes.join(","));
    }
    params.set("range", selectedRange);
    const fullShareableUrl = `${window.location.origin}${pathname}?${params.toString()}`;
    navigator.clipboard.writeText(fullShareableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Fund Checkboxes */}
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
            Select Funds to Compare:
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {availableFunds.map((fund) => {
              const isSelected = selectedFundCodes.includes(fund.code);
              return (
                <button
                  key={fund.code}
                  type="button"
                  disabled={isPending}
                  onClick={() => toggleFund(fund.code)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    isSelected
                      ? "bg-blue-600/10 border-blue-500/50 text-blue-300 shadow-sm"
                      : "bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                  }`}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[9px] ${
                      isSelected
                        ? "bg-blue-600 border-blue-500 text-white"
                        : "border-slate-600 bg-slate-900"
                    }`}
                  >
                    {isSelected && <Check className="w-2.5 h-2.5" />}
                  </div>
                  <span>{fund.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Horizon Selector & Share Link */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            {["1Y", "3Y", "5Y", "ALL"].map((range) => (
              <button
                key={range}
                type="button"
                disabled={isPending}
                onClick={() => setRange(range)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  selectedRange === range
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={copyShareableUrl}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700/80 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            title="Copy shareable link"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copied ? "Link Copied!" : "Share View"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
