import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { generateLiveQuotes } from "@/lib/market-service";

/**
 * MODULE 5 & ADVERSARIAL SCENARIO C
 * Mock Market Data Service with explicit failure modes and chaos simulator.
 */
export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const searchParams = request.nextUrl.searchParams;
  
  // Chaos mode can be set via query param or session cookie
  const mode = searchParams.get("mode") || cookieStore.get("x_chaos_mode")?.value || "normal";

  // Scenario C: Upstream Outage Simulation (503 Error)
  if (mode === "outage") {
    return NextResponse.json(
      { error: "UPSTREAM_SERVICE_UNAVAILABLE", message: "Market data exchange gateway unreachable (503)." },
      { status: 503 }
    );
  }

  const quotes = generateLiveQuotes();

  return NextResponse.json({
    status: "SUCCESS",
    timestamp: new Date().toISOString(),
    provider: "MockApexExchange-v1",
    quotes,
  }, {
    headers: {
      "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
    },
  });
}
