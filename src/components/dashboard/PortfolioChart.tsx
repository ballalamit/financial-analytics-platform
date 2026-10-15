"use client";

import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface PortfolioChartProps {
  chartData: {
    "1M": { date: string; value: number }[];
    "6M": { date: string; value: number }[];
    "1Y": { date: string; value: number }[];
    ALL: { date: string; value: number }[];
  };
  totalValue: number;
}

type TimeRange = "1M" | "6M" | "1Y" | "ALL";

export default function PortfolioChart({ chartData, totalValue }: PortfolioChartProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedRange, setSelectedRange] = useState<TimeRange>("6M");

  useEffect(() => {
    setMounted(true);
  }, []);

  const activePoints = chartData[selectedRange] || [];
  const startValue = activePoints.length > 0 ? activePoints[0].value : totalValue;
  const endValue = activePoints.length > 0 ? activePoints[activePoints.length - 1].value : totalValue;
  const diff = endValue - startValue;
  const isPositive = diff >= 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800/80 gap-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Portfolio Equity Trajectory
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-white tracking-tight">
              {formatCurrency(totalValue)}
            </span>
            <span className={`text-xs font-semibold ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
              {isPositive ? "+" : ""}{formatCurrency(diff)} ({selectedRange})
            </span>
          </div>
        </div>

        {/* Client-Side Time Range Selector */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 self-start sm:self-auto">
          {(["1M", "6M", "1Y", "ALL"] as TimeRange[]).map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setSelectedRange(range)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                selectedRange === range
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-[280px] w-full">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={activePoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isPositive ? "#10b981" : "#3b82f6"} stopOpacity={0.3} />
                <stop offset="95%" stopColor={isPositive ? "#10b981" : "#3b82f6"} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "#334155" }}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-slate-950 border border-slate-700/80 rounded-lg p-2.5 shadow-xl">
                      <p className="text-[10px] text-slate-400">{payload[0].payload.date}</p>
                      <p className="text-sm font-bold text-white mt-0.5">
                        {formatCurrency(payload[0].value as number)}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={isPositive ? "#10b981" : "#3b82f6"}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#equityGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
        ) : (
          <div className="h-full w-full bg-slate-950/60 border border-slate-800/40 rounded-lg flex items-center justify-center text-xs text-slate-500 animate-pulse">
            Loading interactive chart...
          </div>
        )}
      </div>
    </div>
  );
}
