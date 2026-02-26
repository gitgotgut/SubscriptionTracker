"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Layers, Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Registration failed.");
    } else {
      router.push("/login?registered=1");
    }
  }

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
          <div className="w-full max-w-sm">

            {/* Desktop back link */}
            <Link
              href="/"
              className="hidden lg:inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors mb-8"
            >
              <ArrowLeft className="h-3 w-3" /> Back to Hugo
            </Link>

            <h1 className="text-2xl font-bold text-gray-900 mb-1">Create your free account</h1>
            <p className="text-sm text-gray-500 mb-6">
              Already have one?{" "}
              <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium transition-colors">
                Sign in
              </Link>
            </p>

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
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  minLength={8}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating account…" : "Create free account"}
              </Button>
            </form>

            <p className="mt-6 text-xs text-gray-400 text-center leading-relaxed">
              No credit card required · We never sell your data ·{" "}
              <Link href="/faq" className="hover:text-gray-600 underline underline-offset-2 transition-colors">
                FAQ
              </Link>
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
