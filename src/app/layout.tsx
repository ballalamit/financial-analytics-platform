import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Apex Financial Analytics | Production-Grade Platform",
  description:
    "High-performance institutional investment analytics, transaction ledger, and fund performance comparison built with Next.js App Router.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased bg-slate-950 text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
