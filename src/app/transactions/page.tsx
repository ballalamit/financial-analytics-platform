import { requireAuth, requirePortfolioOwnership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TransactionFilters from "@/components/transactions/TransactionFilters";
import TransactionTable from "@/components/transactions/TransactionTable";
import AuditLogViewer from "@/components/transactions/AuditLogViewer";
import { TransactionType, Prisma } from "@prisma/client";
import { ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

interface TransactionsPageProps {
  searchParams: {
    page?: string;
    search?: string;
    type?: string;
    sort?: string;
    portfolioId?: string;
  };
}

/**
 * MODULE 2 & ADVERSARIAL SCENARIO D
 * Transaction Explorer with database-backed pagination, URL state synchronization,
 * and high-scale query latency measurement.
 */
export default async function TransactionsPage({ searchParams }: TransactionsPageProps) {
  const session = await requireAuth();

  // 1. Multi-Tenant Authorization Check for Reads (Adversarial Scenario B)
  // If User A manually changes portfolioId in URL to User B's portfolio, strictly reject.
  let portfolio;
  if (searchParams.portfolioId) {
    try {
      const authResult = await requirePortfolioOwnership(searchParams.portfolioId);
      portfolio = authResult.portfolio;
    } catch {
      return (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16 flex items-center justify-center">
          <div className="max-w-md w-full bg-slate-900 border border-rose-800/80 rounded-2xl p-8 text-center shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold uppercase tracking-wider mb-3">
              403 Unauthorized Access
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Access Denied</h1>
            <p className="text-xs text-rose-300 leading-relaxed mb-6">
              <strong>Adversarial Scenario B Safeguard:</strong> You do not have permission to view or manipulate this portfolio. Cross-tenant reads are strictly blocked at the database level.
            </p>
            <a
              href="/transactions"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-sm"
            >
              Return to Authorized Portfolio
            </a>
          </div>
        </main>
      );
    }
  } else {
    portfolio = await prisma.portfolio.findFirst({
      where: { userId: session.userId },
    });
  }

  // 2. Parse URL Parameters
  const page = Math.max(1, parseInt(searchParams.page || "1", 10));
  const pageSize = 20;
  const search = searchParams.search?.trim();
  const typeFilter = searchParams.type;
  const sort = searchParams.sort || "date_desc";

  if (!portfolio) {
    return (
      <main className="max-w-7xl mx-auto p-6 text-center text-slate-400">
        No portfolio found for your user.
      </main>
    );
  }

  // 3. Build Prisma Query with Indexed Filtering
  const where: Prisma.TransactionWhereInput = {
    portfolioId: portfolio.id,
  };

  if (search) {
    where.OR = [
      { ticker: { contains: search.toUpperCase() } },
      { notes: { contains: search, mode: "insensitive" } },
    ];
  }

  if (typeFilter && Object.values(TransactionType).includes(typeFilter as TransactionType)) {
    where.type = typeFilter as TransactionType;
  }

  // Sorting
  let orderBy: Prisma.TransactionOrderByWithRelationInput = { date: "desc" };
  if (sort === "date_asc") orderBy = { date: "asc" };
  if (sort === "amount_desc") orderBy = { amount: "desc" };
  if (sort === "amount_asc") orderBy = { amount: "asc" };

  // 4. Measure Query Latency (Adversarial Scenario D Evidence)
  const startTime = performance.now();

  const [totalCount, transactions, auditLogs] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auditLog.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        user: { select: { name: true, email: true } },
      },
    }),
  ]);

  const queryExecutionMs = performance.now() - startTime;

  // Serialize Prisma Decimals and Dates to plain objects for Client Component
  const serializedTransactions = transactions.map((tx) => ({
    id: tx.id,
    portfolioId: tx.portfolioId,
    ticker: tx.ticker,
    type: tx.type,
    units: Number(tx.units),
    pricePerUnit: Number(tx.pricePerUnit),
    amount: Number(tx.amount),
    date: tx.date.toISOString(),
    notes: tx.notes,
    version: tx.version,
  }));

  return (
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-white">Transaction Ledger Explorer</h1>
        <p className="text-xs text-slate-400 mt-1">
          Database-backed pagination with shareable URL state and concurrency audit trail
        </p>
      </div>

      {/* Filter Controls (Synchronized with URL params) */}
      <TransactionFilters />

      {/* Main Table with Pagination */}
      <TransactionTable
        portfolioId={portfolio.id}
        transactions={serializedTransactions}
        totalCount={totalCount}
        currentPage={page}
        pageSize={pageSize}
        queryExecutionMs={queryExecutionMs}
      />

      {/* Module 6: Audit Trail Ledger */}
      <AuditLogViewer logs={auditLogs} />
    </main>
  );
}
