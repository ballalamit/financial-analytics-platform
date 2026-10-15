"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, requirePortfolioOwnership, requireTransactionOwnership } from "@/lib/auth";
import { TransactionType, AuditAction } from "@prisma/client";
import { revalidateTag, revalidatePath } from "next/cache";

const TransactionSchema = z.object({
  portfolioId: z.string().min(1, "Portfolio ID is required"),
  ticker: z.string().min(1, "Ticker is required").max(12).toUpperCase(),
  type: z.nativeEnum(TransactionType),
  units: z.coerce.number().positive("Units must be greater than 0"),
  pricePerUnit: z.coerce.number().positive("Price must be greater than 0"),
  date: z.string().min(1, "Transaction date is required"),
  notes: z.string().max(500).optional(),
  idempotencyKey: z.string().optional(),
});

const UpdateTransactionSchema = TransactionSchema.extend({
  id: z.string().min(1, "Transaction ID is required"),
  version: z.coerce.number().int().min(1),
});

export type MutationResult = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  isConflict?: boolean;
};

/**
 * MODULE 6: Create Transaction with Idempotency & Audit Trail
 */
export async function createTransactionAction(
  prevState: MutationResult | null,
  formData: FormData
): Promise<MutationResult> {
  const session = await requireAuth();

  const raw = {
    portfolioId: formData.get("portfolioId"),
    ticker: formData.get("ticker"),
    type: formData.get("type"),
    units: formData.get("units"),
    pricePerUnit: formData.get("pricePerUnit"),
    date: formData.get("date"),
    notes: formData.get("notes") || undefined,
    idempotencyKey: formData.get("idempotencyKey") || undefined,
  };

  const validated = TransactionSchema.safeParse(raw);
  if (!validated.success) {
    return {
      error: "Validation failed. Please review your inputs.",
      fieldErrors: validated.error.flatten().fieldErrors,
    };
  }

  const data = validated.data;

  try {
    // 1. Multi-Tenant Authorization Check (Security Gate)
    await requirePortfolioOwnership(data.portfolioId);

    // 2. Idempotency Check (Prevent duplicate submissions / double clicking)
    if (data.idempotencyKey) {
      const existing = await prisma.transaction.findUnique({
        where: { idempotencyKey: data.idempotencyKey },
      });
      if (existing) {
        return { success: true }; // Already created safely
      }
    }

    const amount = parseFloat((data.units * data.pricePerUnit).toFixed(4));
    const txDate = new Date(data.date);

    // 3. Atomically create Transaction and AuditLog
    await prisma.$transaction(async (tx) => {
      const createdTx = await tx.transaction.create({
        data: {
          portfolioId: data.portfolioId,
          ticker: data.ticker,
          type: data.type,
          units: data.units,
          pricePerUnit: data.pricePerUnit,
          amount,
          date: txDate,
          notes: data.notes,
          version: 1,
          idempotencyKey: data.idempotencyKey,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: session.userId,
          transactionId: createdTx.id,
          action: AuditAction.CREATE,
          entityType: "TRANSACTION",
          entityId: createdTx.id,
          afterState: {
            ticker: createdTx.ticker,
            type: createdTx.type,
            units: createdTx.units.toString(),
            pricePerUnit: createdTx.pricePerUnit.toString(),
            amount: createdTx.amount.toString(),
            date: createdTx.date.toISOString(),
          },
        },
      });
    });

    // 4. Surgical Cache Invalidation (Adversarial Scenario A)
    revalidateTag(`portfolio-${session.userId}`);
    revalidatePath("/transactions");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (err: unknown) {
    console.error("Create transaction error:", err);
    return { error: err instanceof Error ? err.message : "Failed to record transaction." };
  }
}

/**
 * MODULE 6: Update Transaction with Optimistic Concurrency Control (OCC)
 * Solves Adversarial Scenario E (Concurrent edits across multiple tabs)
 */
export async function updateTransactionAction(
  prevState: MutationResult | null,
  formData: FormData
): Promise<MutationResult> {
  const session = await requireAuth();

  const raw = {
    id: formData.get("id"),
    portfolioId: formData.get("portfolioId"),
    ticker: formData.get("ticker"),
    type: formData.get("type"),
    units: formData.get("units"),
    pricePerUnit: formData.get("pricePerUnit"),
    date: formData.get("date"),
    notes: formData.get("notes") || undefined,
    version: formData.get("version"),
  };

  const validated = UpdateTransactionSchema.safeParse(raw);
  if (!validated.success) {
    return {
      error: "Validation failed. Please review your inputs.",
      fieldErrors: validated.error.flatten().fieldErrors,
    };
  }

  const data = validated.data;

  try {
    // 1. Multi-Tenant Authorization Check (User A cannot edit User B's transaction)
    const { transaction: existing } = await requireTransactionOwnership(data.id);

    const amount = parseFloat((data.units * data.pricePerUnit).toFixed(4));
    const txDate = new Date(data.date);

    const beforeSnapshot = {
      ticker: existing.ticker,
      type: existing.type,
      units: existing.units.toString(),
      pricePerUnit: existing.pricePerUnit.toString(),
      amount: existing.amount.toString(),
      version: existing.version,
    };

    // 2. Optimistic Concurrency Control (OCC) Update
    // Matches id AND submitted version. If version is stale, count will be 0.
    const result = await prisma.$transaction(async (tx) => {
      const updateResult = await tx.transaction.updateMany({
        where: {
          id: data.id,
          version: data.version, // MUST MATCH submitted version!
          portfolio: { userId: session.userId },
        },
        data: {
          ticker: data.ticker,
          type: data.type,
          units: data.units,
          pricePerUnit: data.pricePerUnit,
          amount,
          date: txDate,
          notes: data.notes,
          version: { increment: 1 }, // Increment version on every successful edit
        },
      });

      if (updateResult.count === 0) {
        return { isConflict: true };
      }

      // Record Audit Log with full before/after diff
      await tx.auditLog.create({
        data: {
          userId: session.userId,
          transactionId: data.id,
          action: AuditAction.UPDATE,
          entityType: "TRANSACTION",
          entityId: data.id,
          beforeState: beforeSnapshot,
          afterState: {
            ticker: data.ticker,
            type: data.type,
            units: data.units.toString(),
            pricePerUnit: data.pricePerUnit.toString(),
            amount: amount.toString(),
            version: data.version + 1,
          },
        },
      });

      return { isConflict: false };
    });

    if (result.isConflict) {
      return {
        error: "CONFLICT DETECTED: This transaction was modified in another tab or session. Please refresh to load the latest version before editing.",
        isConflict: true,
      };
    }

    // Surgical Cache Invalidation
    revalidateTag(`portfolio-${session.userId}`);
    revalidatePath("/transactions");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (err: unknown) {
    console.error("Update transaction error:", err);
    return { error: err instanceof Error ? err.message : "Failed to update transaction." };
  }
}

/**
 * MODULE 6: Delete Transaction with Audit Trail
 */
export async function deleteTransactionAction(transactionId: string): Promise<MutationResult> {
  const session = await requireAuth();

  try {
    const { transaction } = await requireTransactionOwnership(transactionId);

    await prisma.$transaction(async (tx) => {
      // Record Audit Log prior to delete
      await tx.auditLog.create({
        data: {
          userId: session.userId,
          transactionId: null, // detached because row is deleted
          action: AuditAction.DELETE,
          entityType: "TRANSACTION",
          entityId: transaction.id,
          beforeState: {
            ticker: transaction.ticker,
            type: transaction.type,
            units: transaction.units.toString(),
            amount: transaction.amount.toString(),
          },
        },
      });

      await tx.transaction.delete({
        where: { id: transactionId },
      });
    });

    revalidateTag(`portfolio-${session.userId}`);
    revalidatePath("/transactions");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (err: unknown) {
    console.error("Delete transaction error:", err);
    return { error: err instanceof Error ? err.message : "Failed to delete transaction." };
  }
}
