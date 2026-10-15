import { NextResponse } from "next/server";
import { getSession, requirePortfolioOwnership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TransactionType, AuditAction } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * MODULE 4 & ADVERSARIAL SCENARIO B:
 * GET /api/transactions
 * Reads transactions with strict ownership check on portfolioId.
 */
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "UNAUTHENTICATED", message: "Authentication required." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const requestedPortfolioId = searchParams.get("portfolioId");

  try {
    let portfolioId: string;
    if (requestedPortfolioId) {
      // Security Gate: Reject if User A queries User B's portfolio transactions
      await requirePortfolioOwnership(requestedPortfolioId);
      portfolioId = requestedPortfolioId;
    } else {
      const userPortfolio = await prisma.portfolio.findFirst({
        where: { userId: session.userId },
        select: { id: true },
      });
      if (!userPortfolio) {
        return NextResponse.json(
          { error: "NOT_FOUND", message: "No portfolio found for current user." },
          { status: 404 }
        );
      }
      portfolioId = userPortfolio.id;
    }

    const transactions = await prisma.transaction.findMany({
      where: { portfolioId },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ transactions });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error: "UNAUTHORIZED_ACCESS",
        message: err instanceof Error ? err.message : "You do not have permission to access these transactions.",
      },
      { status: 403 }
    );
  }
}

/**
 * MODULE 4 & MODULE 6:
 * POST /api/transactions
 * Direct endpoint mutation with multi-tenant authorization check.
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "UNAUTHENTICATED", message: "Authentication required." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { portfolioId, ticker, type, units, pricePerUnit, date, notes } = body;

    if (!portfolioId || !ticker || !type || !units || !pricePerUnit || !date) {
      return NextResponse.json(
        { error: "VALIDATION_FAILED", message: "Missing required fields." },
        { status: 400 }
      );
    }

    // Security Gate: Reject if User A attempts to create a transaction in User B's portfolio
    await requirePortfolioOwnership(portfolioId);

    const numUnits = parseFloat(units);
    const numPrice = parseFloat(pricePerUnit);
    const amount = parseFloat((numUnits * numPrice).toFixed(4));

    const createdTx = await prisma.transaction.create({
      data: {
        portfolioId,
        ticker: String(ticker).toUpperCase(),
        type: type as TransactionType,
        units: numUnits,
        pricePerUnit: numPrice,
        amount,
        date: new Date(date),
        notes: notes ? String(notes) : null,
        version: 1,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        transactionId: createdTx.id,
        action: AuditAction.CREATE,
        entityType: "TRANSACTION",
        entityId: createdTx.id,
        afterState: {
          ticker: createdTx.ticker,
          type: createdTx.type,
          amount: amount.toString(),
        },
      },
    });

    return NextResponse.json({ success: true, transaction: createdTx }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error: "UNAUTHORIZED_ACCESS",
        message: err instanceof Error ? err.message : "You do not have permission to mutate this portfolio.",
      },
      { status: 403 }
    );
  }
}
