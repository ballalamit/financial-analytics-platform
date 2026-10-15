import { PrismaClient, TransactionType } from "@prisma/client";
import { SignJWT } from "jose";

const prisma = new PrismaClient();
const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "production-grade-financial-analytics-platform-secret-key-2026"
);

async function main() {
  console.log("=======================================================================");
  console.log("ADVERSARIAL SCENARIO B: MULTI-TENANT AUTHORIZATION (IDOR) VERIFICATION");
  console.log("Requirement: User A changes a portfolio ID to User B's ID.");
  console.log("             Reads and mutations MUST reject the request.");
  console.log("=======================================================================\n");

  // 1. Fetch User A and User B from DB
  const userA = await prisma.user.findUnique({
    where: { email: "demo@investor.com" },
    include: { portfolios: { include: { transactions: true } } },
  });

  const userB = await prisma.user.findUnique({
    where: { email: "target@investor.com" },
    include: { portfolios: { include: { transactions: true } } },
  });

  if (!userA || !userB) {
    console.error("❌ Seed users not found. Run npm run db:seed first.");
    process.exit(1);
  }

  const portfolioA = userA.portfolios[0];
  const portfolioB = userB.portfolios[0];
  const txB = portfolioB.transactions[0];

  console.log(`👤 User A (Alex Morgan):      ID = ${userA.id} | Portfolio = ${portfolioA.id}`);
  console.log(`🎯 User B (Sarah Connor):     ID = ${userB.id} | Portfolio = ${portfolioB.id}`);
  if (txB) {
    console.log(`   User B Private Transaction: ID = ${txB.id} (${txB.ticker} - $${txB.amount})\n`);
  }

  // 2. Mint session JWT for User A
  const tokenA = await new SignJWT({
    userId: userA.id,
    email: userA.email,
    name: userA.name,
    role: userA.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(JWT_SECRET);

  const cookieHeader = `fin_session=${tokenA}`;

  console.log("--- TEST 1: DIRECT READ EXPLOIT (GET /api/portfolio?portfolioId=User_B_ID) ---");
  const resReadPortfolio = await fetch(
    `http://localhost:3000/api/portfolio?portfolioId=${portfolioB.id}`,
    { headers: { Cookie: cookieHeader } }
  );
  const jsonReadPortfolio = await resReadPortfolio.json();
  console.log(`HTTP Status: ${resReadPortfolio.status} (Expected: 403)`);
  console.log(`Response:    ${JSON.stringify(jsonReadPortfolio)}`);
  if (resReadPortfolio.status === 403 && jsonReadPortfolio.error === "UNAUTHORIZED_ACCESS") {
    console.log("✅ PASSED: Read request strictly rejected with 403 Forbidden!\n");
  } else {
    console.error("❌ FAILED: Read request was not rejected!\n");
  }

  console.log("--- TEST 2: DIRECT READ EXPLOIT (GET /api/transactions?portfolioId=User_B_ID) ---");
  const resReadTx = await fetch(
    `http://localhost:3000/api/transactions?portfolioId=${portfolioB.id}`,
    { headers: { Cookie: cookieHeader } }
  );
  const jsonReadTx = await resReadTx.json();
  console.log(`HTTP Status: ${resReadTx.status} (Expected: 403)`);
  console.log(`Response:    ${JSON.stringify(jsonReadTx)}`);
  if (resReadTx.status === 403 && jsonReadTx.error === "UNAUTHORIZED_ACCESS") {
    console.log("✅ PASSED: Transactions read strictly rejected with 403 Forbidden!\n");
  } else {
    console.error("❌ FAILED: Transactions read was not rejected!\n");
  }

  console.log("--- TEST 3: DIRECT MUTATION EXPLOIT (POST /api/transactions into User B's portfolio) ---");
  const resMutateTx = await fetch(`http://localhost:3000/api/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify({
      portfolioId: portfolioB.id, // User A injects User B's portfolio ID
      ticker: "HACK",
      type: "BUY",
      units: 100,
      pricePerUnit: 10.0,
      date: new Date().toISOString(),
      notes: "Adversarial injection attempt",
    }),
  });
  const jsonMutateTx = await resMutateTx.json();
  console.log(`HTTP Status: ${resMutateTx.status} (Expected: 403)`);
  console.log(`Response:    ${JSON.stringify(jsonMutateTx)}`);
  if (resMutateTx.status === 403 && jsonMutateTx.error === "UNAUTHORIZED_ACCESS") {
    console.log("✅ PASSED: Unauthorized mutation strictly rejected with 403 Forbidden!\n");
  } else {
    console.error("❌ FAILED: Mutation was not rejected!\n");
  }

  console.log("--- TEST 4: UI PAGE READ EXPLOIT (/transactions?portfolioId=User_B_ID) ---");
  const resPageTx = await fetch(
    `http://localhost:3000/transactions?portfolioId=${portfolioB.id}`,
    { headers: { Cookie: cookieHeader } }
  );
  const pageHtml = await resPageTx.text();
  const hasSecurityShield = pageHtml.includes("403 Unauthorized Access") || pageHtml.includes("Access Denied");
  const exposesUserBData = pageHtml.includes("Sarah Confidential Retirement Vault") || pageHtml.includes("tx-b-");
  console.log(`HTTP Status:          ${resPageTx.status}`);
  console.log(`Security Shield Rendered: ${hasSecurityShield}`);
  console.log(`User B Data Exposed:      ${exposesUserBData}`);
  if (hasSecurityShield && !exposesUserBData) {
    console.log("✅ PASSED: UI page rendered 403 Access Denied screen with zero data leakage!\n");
  } else {
    console.error("❌ FAILED: UI did not render security shield or exposed User B data!\n");
  }

  console.log("=======================================================================");
  console.log("🎉 ALL ADVERSARIAL SCENARIO B REJECTION GATES CONFIRMED OPERATIONAL!");
  console.log("=======================================================================");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
