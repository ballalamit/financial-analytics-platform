"use client";

import { useState, useTransition, useEffect } from "react";
import { createTransactionAction, updateTransactionAction, MutationResult } from "@/actions/transaction-actions";
import { TransactionType } from "@prisma/client";
import { X, AlertCircle, Plus, Edit2, ShieldAlert } from "lucide-react";

interface TransactionData {
  id?: string;
  portfolioId: string;
  ticker: string;
  type: TransactionType;
  units: number;
  pricePerUnit: number;
  date: string;
  notes?: string | null;
  version?: number;
}

interface TransactionDialogProps {
  portfolioId: string;
  transactionToEdit?: TransactionData | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function TransactionDialog({
  portfolioId,
  transactionToEdit,
  isOpen,
  onClose,
}: TransactionDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<MutationResult | null>(null);

  const isEditing = Boolean(transactionToEdit?.id);

  // Form State
  const [ticker, setTicker] = useState("");
  const [type, setType] = useState<TransactionType>(TransactionType.BUY);
  const [units, setUnits] = useState("");
  const [pricePerUnit, setPricePerUnit] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState("");

  useEffect(() => {
    if (transactionToEdit) {
      setTicker(transactionToEdit.ticker);
      setType(transactionToEdit.type);
      setUnits(transactionToEdit.units.toString());
      setPricePerUnit(transactionToEdit.pricePerUnit.toString());
      setDate(new Date(transactionToEdit.date).toISOString().slice(0, 10));
      setNotes(transactionToEdit.notes || "");
    } else {
      setTicker("");
      setType(TransactionType.BUY);
      setUnits("");
      setPricePerUnit("");
      setDate(new Date().toISOString().slice(0, 10));
      setNotes("");
      // Generate new idempotency token for new creations
      setIdempotencyKey(crypto.randomUUID());
    }
    setResult(null);
  }, [transactionToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("portfolioId", portfolioId);
    if (!isEditing && idempotencyKey) {
      formData.set("idempotencyKey", idempotencyKey);
    }
    if (isEditing && transactionToEdit) {
      formData.set("id", transactionToEdit.id!);
      formData.set("version", (transactionToEdit.version || 1).toString());
    }

    startTransition(async () => {
      let res: MutationResult;
      if (isEditing) {
        res = await updateTransactionAction(null, formData);
      } else {
        res = await createTransactionAction(null, formData);
      }

      setResult(res);
      if (res.success) {
        onClose();
      }
    });
  };

  const calculatedTotal = (parseFloat(units || "0") * parseFloat(pricePerUnit || "0")).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-5">
          <div className="p-2 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400">
            {isEditing ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              {isEditing ? "Edit Transaction" : "Record New Transaction"}
            </h2>
            <p className="text-xs text-slate-400">
              {isEditing ? `Modifying version v${transactionToEdit?.version || 1}` : "Validated on server & logged in audit trail"}
            </p>
          </div>
        </div>

        {/* Optimistic Concurrency Conflict Notice (Adversarial Scenario E) */}
        {result?.isConflict && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-rose-100">Conflict Detected (Adversarial Scenario E)</div>
              <div>{result.error}</div>
            </div>
          </div>
        )}

        {result?.error && !result.isConflict && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{result.error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Ticker</label>
              <input
                type="text"
                name="ticker"
                required
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                placeholder="AAPL"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Type</label>
              <select
                name="type"
                value={type}
                onChange={(e) => setType(e.target.value as TransactionType)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value={TransactionType.BUY}>Buy</option>
                <option value={TransactionType.SELL}>Sell</option>
                <option value={TransactionType.DIVIDEND}>Dividend</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Units (Quantity)</label>
              <input
                type="number"
                step="any"
                min="0.0001"
                name="units"
                required
                value={units}
                onChange={(e) => setUnits(e.target.value)}
                placeholder="10"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Price per unit ($)</label>
              <input
                type="number"
                step="any"
                min="0.01"
                name="pricePerUnit"
                required
                value={pricePerUnit}
                onChange={(e) => setPricePerUnit(e.target.value)}
                placeholder="150.00"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Total Settlement:</span>
            <span className="text-white font-bold font-mono text-sm">${calculatedTotal}</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Trade Date</label>
            <input
              type="date"
              name="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Notes (Optional)</label>
            <input
              type="text"
              name="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. DCA investment, earnings rebalance"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
            >
              {isPending ? "Submitting..." : isEditing ? "Save Changes" : "Record Transaction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
