import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

const SESSION_COOKIE_NAME = "fin_session";
const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "production-grade-financial-analytics-platform-secret-key-2026"
);

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
}

/**
 * Creates a signed JWT session cookie
 */
export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);

  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

/**
 * Clears the session cookie
 */
export async function destroySession(): Promise<void> {
  const cookieStore = cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Retrieves and cryptographically validates the current session
 */
export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as string,
    };
  } catch {
    return null;
  }
}

/**
 * Enforces authenticated user in Server Components and Server Actions
 */
export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

/**
 * SECURITY GUARD (Module 4 & Adversarial Scenario B)
 * Verifies that the authenticated user actually owns the portfolio.
 * Prevents IDOR (Insecure Direct Object Reference) exploits.
 */
export async function requirePortfolioOwnership(portfolioId: string) {
  const session = await requireAuth();

  const portfolio = await prisma.portfolio.findFirst({
    where: {
      id: portfolioId,
      userId: session.userId,
    },
  });

  if (!portfolio) {
    throw new Error("UNAUTHORIZED_ACCESS: You do not have permission to access this portfolio.");
  }

  return { session, portfolio };
}

/**
 * SECURITY GUARD (Module 4 & Adversarial Scenario B)
 * Verifies that the authenticated user owns the transaction via its parent portfolio.
 */
export async function requireTransactionOwnership(transactionId: string) {
  const session = await requireAuth();

  const transaction = await prisma.transaction.findFirst({
    where: {
      id: transactionId,
      portfolio: {
        userId: session.userId,
      },
    },
    include: {
      portfolio: true,
    },
  });

  if (!transaction) {
    throw new Error("UNAUTHORIZED_ACCESS: You do not have permission to access or modify this transaction.");
  }

  return { session, transaction };
}
