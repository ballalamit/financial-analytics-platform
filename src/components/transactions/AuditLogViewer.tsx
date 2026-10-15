"use client";

import { useState } from "react";
import { AuditLog, AuditAction } from "@prisma/client";
import { History, ChevronDown, ChevronUp, FileCode } from "lucide-react";

interface AuditLogViewerProps {
  logs: (AuditLog & { user: { name: string; email: string } })[];
}

export default function AuditLogViewer({ logs }: AuditLogViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  const getActionBadge = (action: AuditAction) => {
    switch (action) {
      case AuditAction.CREATE:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">CREATE</span>;
      case AuditAction.UPDATE:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">UPDATE</span>;
      case AuditAction.DELETE:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">DELETE</span>;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm mt-6">
      <div
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
              Audit Trail Ledger (Module 6)
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px]">
                {logs.length} logged mutations
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Immutable regulatory audit log of who changed what, when, and state snapshots
            </p>
          </div>
        </div>

        <button className="text-slate-400 hover:text-white p-1 rounded-lg">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2">
          {logs.length === 0 ? (
            <p className="text-xs text-slate-500 py-3 text-center">No audit logs recorded yet.</p>
          ) : (
            logs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              return (
                <div
                  key={log.id}
                  className="bg-slate-950 border border-slate-800/80 rounded-lg p-3 text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {getActionBadge(log.action)}
                      <span className="font-mono text-slate-300 font-medium">
                        Transaction [{log.entityId.slice(0, 8)}...]
                      </span>
                      <span className="text-slate-500 text-[11px]">by {log.user.name}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-slate-400">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleExpand(log.id)}
                        className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 font-medium"
                      >
                        <FileCode className="w-3 h-3" />
                        {isExpanded ? "Hide Diff" : "View Diff"}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                      {log.beforeState && (
                        <div>
                          <div className="text-slate-400 font-semibold mb-1">State Before Mutation:</div>
                          <pre className="p-2 bg-slate-900 border border-slate-800 rounded font-mono text-[10px] text-slate-300 overflow-x-auto">
                            {JSON.stringify(log.beforeState, null, 2)}
                          </pre>
                        </div>
                      )}
                      {log.afterState && (
                        <div>
                          <div className="text-emerald-400 font-semibold mb-1">State After Mutation:</div>
                          <pre className="p-2 bg-slate-900 border border-slate-800 rounded font-mono text-[10px] text-emerald-300 overflow-x-auto">
                            {JSON.stringify(log.afterState, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
