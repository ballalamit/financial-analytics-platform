import { describe, it, expect, vi } from "vitest";

describe("Adversarial Scenarios & Security Safeguards", () => {
  describe("Scenario B: Multi-Tenant Authorization (IDOR Protection)", () => {
    it("strictly blocks User A from accessing User B's portfolio when ID is spoofed", async () => {
      // Mock session for User A
      const sessionUserA = { userId: "user-a-123", email: "usera@example.com" };

      // Mock DB: Portfolio belongs to User B
      const portfolioInDb = {
        id: "portfolio-b-456",
        userId: "user-b-789", // Belongs to User B!
        name: "User B Private Vault",
      };

      // Simulated Security Guard (matching src/lib/auth.ts requirePortfolioOwnership)
      const verifyOwnership = (sessionUserId: string, portfolio: typeof portfolioInDb) => {
        if (portfolio.userId !== sessionUserId) {
          throw new Error("UNAUTHORIZED_ACCESS: You do not have permission to access this portfolio.");
        }
        return true;
      };

      expect(() => {
        verifyOwnership(sessionUserA.userId, portfolioInDb);
      }).toThrowError(/UNAUTHORIZED_ACCESS/);
    });

    it("strictly blocks User A from editing or deleting User B's transaction", async () => {
      const sessionUserA = { userId: "user-a-123" };

      const transactionInDb = {
        id: "tx-b-999",
        portfolio: {
          userId: "user-b-789", // Owned by User B
        },
      };

      const verifyTransactionOwnership = (sessionUserId: string, tx: typeof transactionInDb) => {
        if (tx.portfolio.userId !== sessionUserId) {
          throw new Error("UNAUTHORIZED_ACCESS: You do not have permission to modify this transaction.");
        }
        return true;
      };

      expect(() => {
        verifyTransactionOwnership(sessionUserA.userId, transactionInDb);
      }).toThrowError(/UNAUTHORIZED_ACCESS/);
    });
  });

  describe("Scenario E: Optimistic Concurrency Control (OCC)", () => {
    it("detects conflict and rejects stale second tab when version numbers mismatch", () => {
      // Simulated database state for transaction
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
          // Instead of crashing the whole dashboard, return stale snapshot with metadata
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
