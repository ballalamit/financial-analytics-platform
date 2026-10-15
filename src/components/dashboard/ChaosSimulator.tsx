"use client";

import { useTransition } from "react";
import { setChaosModeAction, ChaosMode } from "@/actions/chaos-actions";
import { CheckCircle2, ZapOff, RefreshCw } from "lucide-react";

interface ChaosSimulatorProps {
  currentMode: ChaosMode;
}

/**
 * ADVERSARIAL SCENARIO C (Assessment Brief Section 5.C):
 * "Upstream failure: The market-data API is unavailable for 30 seconds.
 * Keep the rest of the dashboard usable, mark stale data clearly, and avoid retry storms."
 */
export default function ChaosSimulator({ currentMode }: ChaosSimulatorProps) {
  const [isPending, startTransition] = useTransition();

  const handleModeChange = (mode: ChaosMode) => {
    startTransition(async () => {
      await setChaosModeAction(mode);
    });
  };

  const isOutage = currentMode === "outage";

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`flex h-2 w-2 rounded-full ${
                isOutage ? "bg-rose-500 animate-ping" : "bg-emerald-400"
              }`}
            />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Adversarial Scenario C: Upstream Outage Simulator
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Brief Requirement: &ldquo;Market-data API is unavailable for 30 seconds. Keep the rest of the dashboard usable, mark stale data clearly, and avoid retry storms.&rdquo;
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleModeChange("normal")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              !isOutage
                ? "bg-emerald-950 border border-emerald-500/50 text-emerald-300 shadow-sm"
                : "bg-slate-800 border border-slate-700/60 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Normal (Online / 200 OK)
          </button>

          <button
            type="button"
            disabled={isPending}
            onClick={() => handleModeChange("outage")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isOutage
                ? "bg-rose-950 border border-rose-500/50 text-rose-300 shadow-sm animate-pulse"
                : "bg-slate-800 border border-slate-700/60 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <ZapOff className="w-3.5 h-3.5 text-rose-400" />
            Simulate 30s Outage (503)
          </button>

          {isPending && (
            <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin ml-1" />
          )}
        </div>
      </div>
    </div>
  );
}

