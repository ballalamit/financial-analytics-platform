import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import Navbar from "@/components/layout/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Apex Financial Analytics | Production-Grade Platform",
  description:
    "High-performance institutional investment analytics, transaction ledger, and fund performance comparison built with Next.js App Router.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased bg-slate-950 text-slate-100 min-h-screen flex flex-col">
        {session && <Navbar user={session} />}
        {children}
      </body>
    </html>
  );
}
