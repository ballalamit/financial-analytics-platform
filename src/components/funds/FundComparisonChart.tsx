"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { FundComparisonResult } from "@/lib/cagr-calculator";

interface FundComparisonChartProps {
  results: FundComparisonResult[];
}

const FUND_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

export default function FundComparisonChart({ results }: FundComparisonChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (results.length === 0) return null;

  // Build unified normalized timeline (Base 100)
  // Maps each date to { date, [fundCode]: normalizedNav }
  const dateMap = new Map<string, Record<string, number | string>>();

  results.forEach((res) => {
    const baseNav = res.initialNav || 1;
    res.navHistory.forEach((point) => {
      if (!dateMap.has(point.date)) {
        dateMap.set(point.date, { date: point.date });
      }
      const entry = dateMap.get(point.date)!;
      // Normalized return indexed to 100
      const normalized = (point.nav / baseNav) * 100;
      entry[res.fundCode] = parseFloat(normalized.toFixed(2));
    });
  });

  const chartData = Array.from(dateMap.values());

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm mb-6">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-white tracking-tight">
          Normalized Relative Performance (Base 100 Index)
        </h2>
        <p className="text-xs text-slate-400">
          Evaluates true comparative capital appreciation indexed to 100 at inception
        </p>
      </div>

      <div className="h-[320px] w-full">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
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
              tickFormatter={(v) => `${v.toFixed(0)}`}
              domain={["auto", "auto"]}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-slate-950 border border-slate-700 rounded-lg p-3 shadow-xl text-xs">
                      <div className="text-slate-400 mb-1.5 font-medium">{label}</div>
                      {payload.map((item) => (
                        <div key={item.name} className="flex items-center justify-between gap-4 py-0.5">
                          <span style={{ color: item.color }} className="font-semibold">
                            {item.name}:
                          </span>
                          <span className="font-mono text-white font-bold">
                            {item.value} (Index)
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: "10px", fontSize: "11px" }}
            />
            {results.map((res, idx) => (
              <Line
                key={res.fundCode}
                type="monotone"
                dataKey={res.fundCode}
                name={res.fundName}
                stroke={FUND_COLORS[idx % FUND_COLORS.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
        ) : (
          <div className="h-full w-full bg-slate-950/60 border border-slate-800/40 rounded-lg flex items-center justify-center text-xs text-slate-500 animate-pulse">
            Loading normalized comparison chart...
          </div>
        )}
      </div>
    </div>
  );
}
