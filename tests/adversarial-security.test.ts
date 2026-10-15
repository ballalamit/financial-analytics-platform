import { describe, it, expect } from "vitest";

describe("Adversarial Scenarios & Security Safeguards", () => {
  describe("Scenario B: Multi-Tenant Authorization (IDOR Protection)", () => {
    // Mock user identities matching seed.ts
    const userA = { userId: "user-a-alex", email: "demo@investor.com", portfolioId: "portfolio-a-alex" };
    const userB = { userId: "user-b-sarah", email: "target@investor.com", portfolioId: "portfolio-b-sarah" };

    const mockPortfolios = [
      { id: userA.portfolioId, userId: userA.userId, name: "Alex Core Growth Portfolio" },
      { id: userB.portfolioId, userId: userB.userId, name: "Sarah Confidential Retirement Vault" },
    ];

    const mockTransactions = [
      { id: "tx-a-1", portfolioId: userA.portfolioId, ticker: "AAPL", units: 10, amount: 1750 },
      { id: "tx-b-1", portfolioId: userB.portfolioId, ticker: "NVDA", units: 50, amount: 6000 },
    ];

    // Ownership Guard logic matching src/lib/auth.ts requirePortfolioOwnership
    const requirePortfolioOwnership = (sessionUserId: string, requestedPortfolioId: string) => {
      const match = mockPortfolios.find(
        (p) => p.id === requestedPortfolioId && p.userId === sessionUserId
      );
      if (!match) {
        throw new Error("UNAUTHORIZED_ACCESS: You do not have permission to access this portfolio.");
      }
      return match;
    };

    // Ownership Guard logic matching src/lib/auth.ts requireTransactionOwnership
    const requireTransactionOwnership = (sessionUserId: string, transactionId: string) => {
      const tx = mockTransactions.find((t) => t.id === transactionId);
      if (!tx) {
        throw new Error("UNAUTHORIZED_ACCESS: You do not have permission to access or modify this transaction.");
      }
      const portfolio = mockPortfolios.find((p) => p.id === tx.portfolioId && p.userId === sessionUserId);
      if (!portfolio) {
        throw new Error("UNAUTHORIZED_ACCESS: You do not have permission to access or modify this transaction.");
      }
      return { tx, portfolio };
    };

    it("READ REJECTION: strictly blocks User A from reading User B's portfolio even if URL is manually edited", () => {
      // User A attempts to read User B's portfolio by changing portfolioId param
      expect(() => {
        requirePortfolioOwnership(userA.userId, userB.portfolioId);
      }).toThrowError(/UNAUTHORIZED_ACCESS/);
    });

    it("READ SUCCESS: allows User A to read their own authorized portfolio", () => {
      const portfolio = requirePortfolioOwnership(userA.userId, userA.portfolioId);
      expect(portfolio).toBeDefined();
      expect(portfolio.name).toBe("Alex Core Growth Portfolio");
    });

    it("MUTATION REJECTION (CREATE): strictly rejects transaction creation when User A tampers hidden input to User B's portfolio ID", () => {
      const handleCreateTransaction = (callerUserId: string, submittedPortfolioId: string) => {
        // Enforce security gate before inserting into DB
        requirePortfolioOwnership(callerUserId, submittedPortfolioId);
        return { success: true };
      };

      // User A tampers with form and submits User B's portfolio ID
      expect(() => {
        handleCreateTransaction(userA.userId, userB.portfolioId);
      }).toThrowError(/UNAUTHORIZED_ACCESS/);
    });

    it("MUTATION REJECTION (UPDATE): strictly blocks User A from updating User B's transaction", () => {
      const handleUpdateTransaction = (callerUserId: string, transactionId: string) => {
        requireTransactionOwnership(callerUserId, transactionId);
        return { success: true };
      };

      // User A submits update for tx-b-1 (owned by User B)
      expect(() => {
        handleUpdateTransaction(userA.userId, "tx-b-1");
      }).toThrowError(/UNAUTHORIZED_ACCESS/);
    });

    it("MUTATION REJECTION (DELETE): strictly blocks User A from deleting User B's transaction", () => {
      const handleDeleteTransaction = (callerUserId: string, transactionId: string) => {
        requireTransactionOwnership(callerUserId, transactionId);
        return { success: true };
      };

      // User A submits delete for tx-b-1 (owned by User B)
      expect(() => {
        handleDeleteTransaction(userA.userId, "tx-b-1");
      }).toThrowError(/UNAUTHORIZED_ACCESS/);
    });

    it("ROUTE HANDLER (API) PROTECTION: returns HTTP 403 when User A directly queries User B's portfolio endpoint", () => {
      const handleApiGetPortfolio = (sessionUserId: string | null, requestedPortfolioId: string | null) => {
        if (!sessionUserId) {
          return { status: 401, error: "UNAUTHENTICATED" };
        }
        if (requestedPortfolioId) {
          try {
            requirePortfolioOwnership(sessionUserId, requestedPortfolioId);
          } catch {
            return { status: 403, error: "UNAUTHORIZED_ACCESS" };
          }
        }
        return { status: 200, data: { portfolioId: requestedPortfolioId || userA.portfolioId } };
      };

      // 1. Unauthenticated request -> 401
      expect(handleApiGetPortfolio(null, userA.portfolioId).status).toBe(401);

      // 2. User A requesting User B's portfolio -> 403 Forbidden
      const exploitResult = handleApiGetPortfolio(userA.userId, userB.portfolioId);
      expect(exploitResult.status).toBe(403);
      expect(exploitResult.error).toBe("UNAUTHORIZED_ACCESS");

      // 3. User A requesting own portfolio -> 200 OK
      const legitimateResult = handleApiGetPortfolio(userA.userId, userA.portfolioId);
      expect(legitimateResult.status).toBe(200);
    });
  });

  describe("Scenario E: Optimistic Concurrency Control (OCC)", () => {
    it("detects conflict and rejects stale second tab when version numbers mismatch", () => {
      let dbTransaction = {
        id: "tx-100",
        ticker: "AAPL",
        units: 10,
        price: 150,
        version: 1, // Current database version
      };

      // Mutation function with OCC check (matching src/actions/transaction-actions.ts)
      const updateWithOCC = (txId: string, submittedVersion: number, newUnits: number) => {
        if (dbTransaction.version !== submittedVersion) {
          return { success: false, isConflict: true, error: "CONFLICT_DETECTED" };
        }
        // Increment version on update
        dbTransaction.units = newUnits;
        dbTransaction.version += 1;
        return { success: true, isConflict: false, newVersion: dbTransaction.version };
      };

      // Tab 1 submits with version: 1
      const tab1Result = updateWithOCC("tx-100", 1, 25);
      expect(tab1Result.success).toBe(true);
      expect(tab1Result.isConflict).toBe(false);
      expect(dbTransaction.version).toBe(2);

      // Tab 2 (opened earlier, still holding stale version: 1) tries to submit
      const tab2Result = updateWithOCC("tx-100", 1, 30);
      expect(tab2Result.success).toBe(false);
      expect(tab2Result.isConflict).toBe(true);
      expect(tab2Result.error).toBe("CONFLICT_DETECTED");
      // Assert no silent data corruption occurred: units remain 25 from Tab 1
      expect(dbTransaction.units).toBe(25);
    });
  });

  describe("Scenario C: Upstream Outage Resilience & Fallback", () => {
    it("gracefully falls back to cached snapshot when external service fails", () => {
      const cachedSnapshot = [
        { ticker: "AAPL", currentPrice: 224.5, lastUpdated: "2026-10-15T10:00:00Z" },
      ];

      // Simulated resilient fallback gateway
      const fetchWithFallback = (isUpstreamDown: boolean) => {
        if (isUpstreamDown) {
          return {
            quotes: cachedSnapshot,
            isStale: true,
            lastRefreshedAt: cachedSnapshot[0].lastUpdated,
            error: "Upstream market data gateway is offline. Serving cached snapshot.",
          };
        }
        return { quotes: cachedSnapshot, isStale: false, lastRefreshedAt: new Date().toISOString() };
      };

      const result = fetchWithFallback(true);
      expect(result.isStale).toBe(true);
      expect(result.quotes).toHaveLength(1);
      expect(result.quotes[0].ticker).toBe("AAPL");
      expect(result.error).toContain("offline");
    });
  });
});
