import { formatCurrency, formatPercent } from "@/lib/utils";
import { PortfolioMetrics } from "@/lib/portfolio-calculator";
import { Wallet, DollarSign, TrendingUp, TrendingDown } from "lucide-react";

interface PortfolioSummaryCardsProps {
  metrics: PortfolioMetrics;
  portfolioName: string;
}

/**
 * MODULE 1: Portfolio Dashboard Summary Cards
 * Rendered strictly on the server (React Server Component) for zero client bundle bloat.
 */
export default function PortfolioSummaryCards({ metrics, portfolioName }: PortfolioSummaryCardsProps) {
  const isPositive = metrics.absoluteReturn >= 0;

  const cards = [
    {
      label: "Total Portfolio Value",
      value: formatCurrency(metrics.totalPortfolioValue),
      subtext: `${portfolioName}`,
      icon: Wallet,
      color: "text-blue-400",
      bg: "bg-blue-600/10",
      border: "border-blue-500/20",
    },
    {
      label: "Total Invested Capital",
      value: formatCurrency(metrics.investedAmount),
      subtext: "Net cost basis across all holdings",
      icon: DollarSign,
      color: "text-slate-300",
      bg: "bg-slate-800/50",
      border: "border-slate-700/50",
    },
    {
      label: "Absolute Return",
      value: `${isPositive ? "+" : ""}${formatCurrency(metrics.absoluteReturn)}`,
      subtext: "Unrealized capital gain/loss",
      icon: isPositive ? TrendingUp : TrendingDown,
      color: isPositive ? "text-emerald-400" : "text-rose-400",
      bg: isPositive ? "bg-emerald-500/10" : "bg-rose-500/10",
      border: isPositive ? "border-emerald-500/20" : "border-rose-500/20",
    },
    {
      label: "Percentage Return",
      value: formatPercent(metrics.percentageReturn),
      subtext: `Total return on invested capital`,
      icon: isPositive ? TrendingUp : TrendingDown,
      color: isPositive ? "text-emerald-400" : "text-rose-400",
      bg: isPositive ? "bg-emerald-500/10" : "bg-rose-500/10",
      border: isPositive ? "border-emerald-500/20" : "border-rose-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400">{card.label}</span>
              <div className={`p-2 rounded-lg border ${card.bg} ${card.border} ${card.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold tracking-tight text-white mb-1">
                {card.value}
              </div>
              <p className="text-[11px] text-slate-400 truncate">{card.subtext}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
