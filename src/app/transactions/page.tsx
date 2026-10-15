import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TransactionFilters from "@/components/transactions/TransactionFilters";
import TransactionTable from "@/components/transactions/TransactionTable";
import AuditLogViewer from "@/components/transactions/AuditLogViewer";
import { TransactionType, Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

interface TransactionsPageProps {
  searchParams: {
    page?: string;
    search?: string;
    type?: string;
    sort?: string;
  };
}

/**
 * MODULE 2 & ADVERSARIAL SCENARIO D
 * Transaction Explorer with database-backed pagination, URL state synchronization,
 * and high-scale query latency measurement.
 */
export default async function TransactionsPage({ searchParams }: TransactionsPageProps) {
  const session = await requireAuth();

  // 1. Parse URL Parameters
  const page = Math.max(1, parseInt(searchParams.page || "1", 10));
  const pageSize = 20;
  const search = searchParams.search?.trim();
  const typeFilter = searchParams.type;
  const sort = searchParams.sort || "date_desc";

  // 2. Fetch User's Portfolio
  const portfolio = await prisma.portfolio.findFirst({
    where: { userId: session.userId },
  });

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
        transactions={transactions}
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
