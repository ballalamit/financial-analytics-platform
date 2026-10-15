"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { deleteTransactionAction } from "@/actions/transaction-actions";
import TransactionDialog from "@/components/transactions/TransactionDialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import { TransactionType } from "@prisma/client";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Edit2, 
  Trash2, 
  ArrowDownLeft, 
  ArrowUpRight, 
  DollarSign, 
  Database 
} from "lucide-react";

export interface SerializedTransaction {
  id: string;
  portfolioId: string;
  ticker: string;
  type: TransactionType;
  units: number;
  pricePerUnit: number;
  amount: number;
  date: string;
  notes: string | null;
  version: number;
}

interface TransactionTableProps {
  portfolioId: string;
  transactions: SerializedTransaction[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  queryExecutionMs: number;
}

export default function TransactionTable({
  portfolioId,
  transactions,
  totalCount,
  currentPage,
  pageSize,
  queryExecutionMs,
}: TransactionTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<SerializedTransaction | null>(null);

  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  const navigateToPage = (newPage: number) => {
    startTransition(() => {
      const current = new URLSearchParams(Array.from(searchParams.entries()));
      current.set("page", newPage.toString());
      router.push(`${pathname}?${current.toString()}`);
    });
  };

  const handleOpenCreate = () => {
    setSelectedTx(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (tx: SerializedTransaction) => {
    setSelectedTx(tx);
    setIsDialogOpen(true);
  };

  const handleDelete = (txId: string) => {
    if (confirm("Are you sure you want to delete this transaction? This action will be logged in the audit trail.")) {
      startTransition(async () => {
        await deleteTransactionAction(txId);
      });
    }
  };

  const getTypeBadge = (type: TransactionType) => {
    switch (type) {
      case TransactionType.BUY:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ArrowDownLeft className="w-3 h-3" /> Buy
          </span>
        );
      case TransactionType.SELL:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <ArrowUpRight className="w-3 h-3" /> Sell
          </span>
        );
      case TransactionType.DIVIDEND:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <DollarSign className="w-3 h-3" /> Dividend
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300">
            {type}
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
      {/* Header & New Transaction Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800/80 gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
            Ledger Records
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono">
              {totalCount.toLocaleString()} total
            </span>
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
            <Database className="w-3 h-3 text-emerald-400" />
            <span>Database-backed pagination — Queried in {queryExecutionMs.toFixed(1)}ms</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          Record Transaction
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
              <th className="pb-3 font-semibold">Date</th>
              <th className="pb-3 font-semibold">Ticker</th>
              <th className="pb-3 font-semibold">Type</th>
              <th className="pb-3 font-semibold text-right">Units</th>
              <th className="pb-3 font-semibold text-right">Price</th>
              <th className="pb-3 font-semibold text-right">Total Settlement</th>
              <th className="pb-3 font-semibold text-center">Version</th>
              <th className="pb-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {safeTransactions.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500">
                  No transactions match your filter criteria.
                </td>
              </tr>
            ) : (
              safeTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 text-slate-400">{formatDate(tx.date)}</td>
                  <td className="py-3 font-bold font-mono text-white">{tx.ticker}</td>
                  <td className="py-3">{getTypeBadge(tx.type)}</td>
                  <td className="py-3 text-right text-slate-300">{Number(tx.units).toLocaleString()}</td>
                  <td className="py-3 text-right text-slate-300">{formatCurrency(Number(tx.pricePerUnit))}</td>
                  <td className="py-3 text-right font-bold text-white font-mono">
                    {formatCurrency(Number(tx.amount))}
                  </td>
                  <td className="py-3 text-center">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono">
                      v{tx.version}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(tx)}
                        className="p-1 rounded text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors"
                        title="Edit transaction"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleDelete(tx.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        title="Delete transaction"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 mt-4 border-t border-slate-800/80 gap-3">
        <div className="text-xs text-slate-400">
          Showing <span className="font-semibold text-slate-200">{(currentPage - 1) * pageSize + 1}</span> to{" "}
          <span className="font-semibold text-slate-200">{Math.min(currentPage * pageSize, totalCount)}</span> of{" "}
          <span className="font-semibold text-slate-200">{totalCount.toLocaleString()}</span> records
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage <= 1 || isPending}
            onClick={() => navigateToPage(currentPage - 1)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-800/50 hover:bg-slate-800 text-slate-300 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Previous
          </button>

          <span className="text-xs font-mono text-slate-400 px-2">
            Page {currentPage} of {totalPages}
          </span>

          <button
            type="button"
            disabled={currentPage >= totalPages || isPending}
            onClick={() => navigateToPage(currentPage + 1)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-800/50 hover:bg-slate-800 text-slate-300 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Modal Dialog */}
      <TransactionDialog
        portfolioId={portfolioId}
        transactionToEdit={
          selectedTx
            ? {
                id: selectedTx.id,
                portfolioId: selectedTx.portfolioId,
                ticker: selectedTx.ticker,
                type: selectedTx.type,
                units: selectedTx.units,
                pricePerUnit: selectedTx.pricePerUnit,
                date: selectedTx.date,
                notes: selectedTx.notes,
                version: selectedTx.version,
              }
            : null
        }
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </div>
  );
}
