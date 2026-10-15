"use server";

import { cookies } from "next/headers";
import { revalidateTag, revalidatePath } from "next/cache";

export type ChaosMode = "normal" | "outage";

export async function setChaosModeAction(mode: ChaosMode): Promise<{ success: boolean; mode: ChaosMode }> {
  const cookieStore = cookies();
  
  if (mode === "normal") {
    cookieStore.delete("x_chaos_mode");
  } else {
    cookieStore.set("x_chaos_mode", mode, {
      path: "/",
      maxAge: 60 * 5, // 5 minutes
    });
  }

  // Force revalidation of market data tag to test immediate behavior
  revalidateTag("market-data");
  revalidatePath("/dashboard");

  return { success: true, mode };
}

export async function getChaosMode(): Promise<ChaosMode> {
  const cookieStore = cookies();
  return (cookieStore.get("x_chaos_mode")?.value as ChaosMode) || "normal";
}
