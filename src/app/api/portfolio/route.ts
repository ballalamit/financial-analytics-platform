import { NextResponse } from "next/server";
import { getSession, requirePortfolioOwnership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * MODULE 4 & ADVERSARIAL SCENARIO B:
 * GET /api/portfolio
 * Protects reads from unauthorized IDOR exploits when callers invoke endpoints directly.
 */
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "UNAUTHENTICATED", message: "Authentication required to access portfolio." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const requestedPortfolioId = searchParams.get("portfolioId");

  try {
    if (requestedPortfolioId) {
      // Security Gate: Reject if User A requests User B's portfolio ID
      const { portfolio } = await requirePortfolioOwnership(requestedPortfolioId);
      return NextResponse.json({ portfolio });
    }

    // Default: Return authenticated user's portfolio
    const portfolio = await prisma.portfolio.findFirst({
      where: { userId: session.userId },
      include: {
        transactions: {
          select: {
            id: true,
            ticker: true,
            type: true,
            units: true,
            amount: true,
            date: true,
          },
        },
      },
    });

    if (!portfolio) {
      return NextResponse.json(
        { error: "NOT_FOUND", message: "No portfolio found for current user." },
        { status: 404 }
      );
    }

    return NextResponse.json({ portfolio });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error: "UNAUTHORIZED_ACCESS",
        message: err instanceof Error ? err.message : "You do not have permission to access this portfolio.",
      },
      { status: 403 }
    );
  }
}
