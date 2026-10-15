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

  // Rate limit simulation (429 Too Many Requests)
  if (mode === "ratelimit") {
    return NextResponse.json(
      { error: "RATE_LIMIT_EXCEEDED", message: "API limit of 60 req/min exceeded." },
      { status: 429, headers: { "Retry-After": "30" } }
    );
  }

  // Timeout simulation (sleep for 5 seconds to test client 3s abort controller)
  if (mode === "timeout") {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    return NextResponse.json(
      { error: "GATEWAY_TIMEOUT", message: "Market data gateway timed out after 5000ms." },
      { status: 504 }
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
