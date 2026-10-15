import { PrismaClient, TransactionType, Role, AuditAction } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const FUNDS = [
  {
    code: "TECH_GROWTH",
    name: "Horizon Tech Growth Fund",
    baseNav: 100,
    annualGrowth: 0.18, // 18% CAGR
    volatility: 0.05,
  },
  {
    code: "BLUECHIP_INDEX",
    name: "Apex BlueChip 50 Index Fund",
    baseNav: 150,
    annualGrowth: 0.12, // 12% CAGR
    volatility: 0.02,
  },
  {
    code: "ESG_CLEAN",
    name: "GreenFuture ESG Opportunities",
    baseNav: 80,
    annualGrowth: 0.14, // 14% CAGR
    volatility: 0.04,
  },
  {
    code: "GOVT_BOND",
    name: "Sovereign Treasury Bond Fund",
    baseNav: 1000,
    annualGrowth: 0.06, // 6% CAGR
    volatility: 0.01,
  },
];

const TICKERS = [
  { symbol: "AAPL", basePrice: 175.5 },
  { symbol: "MSFT", basePrice: 420.0 },
  { symbol: "NVDA", basePrice: 120.0 },
  { symbol: "GOOGL", basePrice: 165.0 },
  { symbol: "VOO", basePrice: 490.0 },
  { symbol: "AMZN", basePrice: 185.0 },
  { symbol: "TSLA", basePrice: 215.0 },
  { symbol: "META", basePrice: 505.0 },
];

async function main() {
  console.log("🌱 Starting production database seed...");

  // 1. Clear existing data safely
  console.log("Cleaning old records...");
  await prisma.auditLog.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.portfolio.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.fundHistoricalNav.deleteMany({});
  await prisma.marketDataCache.deleteMany({});

  const hashedPassword = await bcrypt.hash("Password123!", 10);

  // 2. Create User A (Primary Demo Investor)
  const userA = await prisma.user.create({
    data: {
      email: "demo@investor.com",
      name: "Alex Morgan",
      passwordHash: hashedPassword,
      role: Role.USER,
      portfolios: {
        create: {
          name: "Alex Core Growth Portfolio",
          cashBalance: 75000.0,
        },
      },
    },
    include: { portfolios: true },
  });
  const portfolioA = userA.portfolios[0];
  console.log(`✅ Created User A: ${userA.email} (Portfolio ID: ${portfolioA.id})`);

  // 3. Create User B (Adversarial Target User)
  const userB = await prisma.user.create({
    data: {
      email: "target@investor.com",
      name: "Sarah Connor",
      passwordHash: hashedPassword,
      role: Role.USER,
      portfolios: {
        create: {
          name: "Sarah Confidential Retirement Vault",
          cashBalance: 250000.0,
        },
      },
    },
    include: { portfolios: true },
  });
  const portfolioB = userB.portfolios[0];
  console.log(`✅ Created User B: ${userB.email} (Portfolio ID: ${portfolioB.id})`);

  // 4. Seed Historical NAV Data for Fund Analytics (5 years of monthly points)
  console.log("📈 Seeding Fund Historical NAV data (2021 - 2026)...");
  const navRecords: {
    fundCode: string;
    fundName: string;
    date: Date;
    nav: number;
  }[] = [];

  const startDate = new Date("2021-01-01T00:00:00Z");
  const endDate = new Date("2026-03-01T00:00:00Z");

  for (const fund of FUNDS) {
    let currentNav = fund.baseNav;
    let currentDate = new Date(startDate);
    const monthsTotal = 62; // ~5 years
    const monthlyRate = Math.pow(1 + fund.annualGrowth, 1 / 12) - 1;

    let monthIndex = 0;
    while (currentDate <= endDate) {
      // Small predictable fluctuation for realistic chart shape
      const noise = Math.sin(monthIndex * 0.7) * fund.volatility;
      currentNav = currentNav * (1 + monthlyRate + noise);

      navRecords.push({
        fundCode: fund.code,
        fundName: fund.name,
        date: new Date(currentDate),
        nav: parseFloat(currentNav.toFixed(4)),
      });

      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1);
      monthIndex++;
    }
  }

  await prisma.fundHistoricalNav.createMany({
    data: navRecords,
  });
  console.log(`✅ Inserted ${navRecords.length} historical fund NAV data points.`);

  // 5. Seed Core Seed Transactions for User A (Curated realistic dataset)
  console.log("💼 Seeding initial realistic transactions for User A & User B...");
  const sampleTransactions = [
    { ticker: "VOO", type: TransactionType.BUY, units: 100, price: 420.0, date: new Date("2023-01-15"), notes: "Initial index allocation" },
    { ticker: "AAPL", type: TransactionType.BUY, units: 150, price: 150.0, date: new Date("2023-03-20"), notes: "Q1 accumulation" },
    { ticker: "MSFT", type: TransactionType.BUY, units: 80, price: 310.0, date: new Date("2023-06-10"), notes: "Cloud segment bet" },
    { ticker: "NVDA", type: TransactionType.BUY, units: 200, price: 45.0, date: new Date("2023-08-05"), notes: "Pre-split AI position" },
    { ticker: "AAPL", type: TransactionType.DIVIDEND, units: 150, price: 0.24, date: new Date("2023-11-15"), notes: "Q4 Cash dividend" },
    { ticker: "AMZN", type: TransactionType.BUY, units: 75, price: 135.0, date: new Date("2024-01-12"), notes: "E-commerce expansion" },
    { ticker: "VOO", type: TransactionType.BUY, units: 50, price: 470.0, date: new Date("2024-04-18"), notes: "Monthly DCA" },
    { ticker: "NVDA", type: TransactionType.SELL, units: 50, price: 115.0, date: new Date("2024-07-22"), notes: "Rebalancing profit take" },
    { ticker: "GOOGL", type: TransactionType.BUY, units: 120, price: 155.0, date: new Date("2024-10-05"), notes: "Search & DeepMind growth" },
    { ticker: "META", type: TransactionType.BUY, units: 60, price: 480.0, date: new Date("2025-01-14"), notes: "Ad revenue rebound" },
  ];

  for (const t of sampleTransactions) {
    const totalAmount = t.units * t.price;
    const tx = await prisma.transaction.create({
      data: {
        portfolioId: portfolioA.id,
        ticker: t.ticker,
        type: t.type,
        units: t.units,
        pricePerUnit: t.price,
        amount: totalAmount,
        date: t.date,
        notes: t.notes,
        version: 1,
      },
    });

    // Create Audit Log for curated transactions
    await prisma.auditLog.create({
      data: {
        userId: userA.id,
        transactionId: tx.id,
        action: AuditAction.CREATE,
        entityType: "TRANSACTION",
        entityId: tx.id,
        afterState: {
          ticker: tx.ticker,
          type: tx.type,
          units: tx.units.toString(),
          pricePerUnit: tx.pricePerUnit.toString(),
          amount: tx.amount.toString(),
        },
      },
    });
  }

  // 6. User B Confidential Transactions (To test IDOR security exploit)
  const txB = await prisma.transaction.create({
    data: {
      portfolioId: portfolioB.id,
      ticker: "BRK.A",
      type: TransactionType.BUY,
      units: 2,
      pricePerUnit: 620000.0,
      amount: 1240000.0,
      date: new Date("2024-05-01"),
      notes: "CONFIDENTIAL USER B ASSET - DO NOT EXPOSE",
      version: 1,
    },
  });
  await prisma.auditLog.create({
    data: {
      userId: userB.id,
      transactionId: txB.id,
      action: AuditAction.CREATE,
      entityType: "TRANSACTION",
      entityId: txB.id,
      afterState: { ticker: "BRK.A", amount: "1240000.00" },
    },
  });

  // 7. Generate Bulk Historical Transactions for User A (Scale testing: 5,000 baseline)
  console.log("⚡ Generating 5,000 indexed historical transactions for scale testing...");
  const bulkTransactions = [];
  const startEpoch = new Date("2020-01-01").getTime();
  const endEpoch = new Date("2026-03-01").getTime();

  for (let i = 0; i < 5000; i++) {
    const randomTicker = TICKERS[i % TICKERS.length];
    const randomTime = new Date(startEpoch + Math.random() * (endEpoch - startEpoch));
    const randomUnits = Math.floor(Math.random() * 50) + 1;
    const priceVariance = (Math.random() - 0.5) * 20;
    const randomPrice = Math.max(10, parseFloat((randomTicker.basePrice + priceVariance).toFixed(2)));
    const randomType = i % 15 === 0 ? TransactionType.DIVIDEND : (i % 4 === 0 ? TransactionType.SELL : TransactionType.BUY);
    const amount = parseFloat((randomUnits * randomPrice).toFixed(2));

    bulkTransactions.push({
      portfolioId: portfolioA.id,
      ticker: randomTicker.symbol,
      type: randomType,
      units: randomUnits,
      pricePerUnit: randomPrice,
      amount: amount,
      date: randomTime,
      notes: `System-generated trade #${i + 1}`,
      version: 1,
    });
  }

  // Batch insert
  const BATCH_SIZE = 1000;
  for (let i = 0; i < bulkTransactions.length; i += BATCH_SIZE) {
    const batch = bulkTransactions.slice(i, i + BATCH_SIZE);
    await prisma.transaction.createMany({
      data: batch,
    });
  }
  console.log(`✅ Successfully seeded 5,000+ transactions for Portfolio A.`);

  // 8. Seed Initial Market Data Cache
  await prisma.marketDataCache.upsert({
    where: { id: "MARKET_DATA_SNAPSHOT" },
    update: {},
    create: {
      id: "MARKET_DATA_SNAPSHOT",
      payload: [
        { ticker: "AAPL", name: "Apple Inc.", price: 224.5, change24h: 1.35, status: "OPEN" },
        { ticker: "MSFT", name: "Microsoft Corp.", price: 418.2, change24h: -0.42, status: "OPEN" },
        { ticker: "NVDA", name: "NVIDIA Corp.", price: 135.4, change24h: 3.84, status: "OPEN" },
        { ticker: "GOOGL", name: "Alphabet Inc.", price: 168.9, change24h: 0.88, status: "OPEN" },
        { ticker: "VOO", name: "Vanguard S&P 500 ETF", price: 512.8, change24h: 0.65, status: "OPEN" },
      ],
      fetchedAt: new Date(),
      isStale: false,
    },
  });

  console.log("\n🎉 Database seed complete! Ready for development.");
  console.log("------------------------------------------------");
  console.log("Demo Credentials:");
  console.log("👤 User A (Owner): email: demo@investor.com | password: Password123!");
  console.log("👤 User B (Target): email: target@investor.com | password: Password123!");
  console.log("------------------------------------------------\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
