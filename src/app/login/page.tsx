"use client";

import { useFormState, useFormStatus } from "react-dom";
import { signInAction } from "@/actions/auth-actions";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { ShieldCheck, Lock, Mail, ArrowRight, UserCheck } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? "Signing in..." : "Sign in to Dashboard"}
      {!pending && <ArrowRight className="w-4 h-4" />}
    </button>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/dashboard";
  const [state, formAction] = useFormState(signInAction, null);
  const [email, setEmail] = useState("demo@investor.com");
  const [password, setPassword] = useState("Password123!");

  const fillCredentials = (userEmail: string) => {
    setEmail(userEmail);
    setPassword("Password123!");
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Apex Analytics</h1>
          <p className="text-sm text-slate-400 mt-1">Production-Grade Financial Platform</p>
        </div>

        {/* Quick Demo Login Preset Buttons */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 mb-4 backdrop-blur">
          <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <UserCheck className="w-3.5 h-3.5 text-blue-400" />
            Quick Demo Logins (For Reviewers)
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillCredentials("demo@investor.com")}
              className={`text-left p-2.5 rounded-lg border text-xs transition-all ${
                email === "demo@investor.com"
                  ? "bg-blue-950/60 border-blue-500/50 text-blue-300"
                  : "bg-slate-800/50 border-slate-700/60 text-slate-300 hover:bg-slate-800"
              }`}
            >
              <div className="font-semibold">Alex Morgan</div>
              <div className="text-[10px] text-slate-400">User A (Primary Owner)</div>
            </button>
            <button
              type="button"
              onClick={() => fillCredentials("target@investor.com")}
              className={`text-left p-2.5 rounded-lg border text-xs transition-all ${
                email === "target@investor.com"
                  ? "bg-amber-950/60 border-amber-500/50 text-amber-300"
                  : "bg-slate-800/50 border-slate-700/60 text-slate-300 hover:bg-slate-800"
              }`}
            >
              <div className="font-semibold">Sarah Connor</div>
              <div className="text-[10px] text-slate-400">User B (Target / IDOR Test)</div>
            </button>
          </div>
        </div>

        {/* Main Login Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="from" value={from} />
            {state?.error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {state.error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="investor@example.com"
                  className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <SubmitButton />
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-blue-400 hover:text-blue-300 font-medium">
                Create new portfolio
              </Link>
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <p className="text-[11px] text-slate-500 text-center mt-4">
          Protected by cryptographically signed HTTP-only sessions with multi-tenant isolation.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 mb-3 animate-pulse">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-white">Loading Apex Analytics...</p>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
