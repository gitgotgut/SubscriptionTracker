"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Layers, Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");
  const hint = params.get("hint");
  const registered = params.get("registered");

  const [email, setEmail] = useState(hint ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password.");
    } else {
      router.push(next ?? "/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="w-full max-w-sm">

      {/* Desktop back link */}
      <Link
        href="/"
        className="hidden lg:inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors mb-8"
      >
        <ArrowLeft className="h-3 w-3" /> Back to Hugo
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        {hint ? "Sign in to continue" : "Welcome back"}
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        {hint
          ? `Please sign in with ${hint} to accept the invitation.`
          : <>No account yet?{" "}
              <Link href="/register" className="text-blue-600 hover:text-blue-800 font-medium transition-colors">
                Sign up free
              </Link>
            </>
        }
      </p>

      {registered && (
        <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-4 py-3">
          Account created — sign in to get started.
        </div>
      )}

      {error && (
        <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-xs text-gray-400 text-center leading-relaxed">
        Your data is private and never sold ·{" "}
        <Link href="/faq" className="hover:text-gray-600 underline underline-offset-2 transition-colors">
          FAQ
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">

      {/* ─── Left panel ─── */}
      <div className="hidden lg:flex lg:w-[45%] bg-blue-600 flex-col justify-between p-12">
        <Link href="/" className="flex items-center gap-2 text-white">
          <Layers className="h-5 w-5" />
          <span className="font-semibold text-lg tracking-tight">Hugo</span>
        </Link>

        <div>
          <h2 className="text-3xl font-bold text-white leading-snug mb-4">
            Every subscription.<br />One clear view.
          </h2>
          <p className="text-blue-200 text-sm leading-relaxed mb-8">
            Stop losing track of what you pay for. Hugo gives you a single,
            honest overview of every recurring charge — no bank access required.
          </p>
          <ul className="space-y-3">
            {[
              "Free forever — no credit card needed",
              "Gmail & Outlook AI import",
              "Email reminders before renewals",
              "Household sharing for families",
            ].map((text) => (
              <li key={text} className="flex items-center gap-3 text-white text-sm">
                <span className="shrink-0 h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center">
                  <Check className="h-3 w-3 text-white" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-blue-300 text-xs">
          Hugo · Built to keep your subscriptions honest.
        </p>
      </div>

      {/* ─── Right panel ─── */}
      <div className="flex-1 flex flex-col">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between p-5 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-blue-600" />
            <span className="font-semibold tracking-tight text-sm">Hugo</span>
          </Link>
          <Link href="/" className="text-xs text-gray-500 flex items-center gap-1 hover:text-gray-700 transition-colors">
            <ArrowLeft className="h-3 w-3" /> Back
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center p-8">
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
      </div>

    </div>
  );
}
