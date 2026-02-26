import Link from "next/link";
import {
  CreditCard,
  BarChart3,
  CalendarCheck,
  ArrowRight,
  Check,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { MarketingHeader } from "@/components/marketing-header";
import { MarketingFooter } from "@/components/marketing-footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">

      <MarketingHeader />

      <main className="flex-1">

        {/* ─── Hero ─── */}
        <section className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
          <p className="inline-block mb-6 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 tracking-wide uppercase">
            Free to use · No card required
          </p>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight mb-6">
            Every subscription.
            <br />
            <span className="text-blue-600">One clear view.</span>
          </h1>
          <p className="max-w-xl mx-auto text-lg text-gray-500 mb-10 leading-relaxed">
            Stop losing track of what you pay for. Hugo gives you a single,
            honest overview of every recurring charge — streaming, fitness,
            software, meal plans, and more.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
            >
              Start tracking for free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </section>

        {/* ─── Dashboard preview placeholder ─── */}
        <section className="max-w-4xl mx-auto px-6 pb-24">
          <div className="rounded-2xl border border-gray-100 bg-gray-50 overflow-hidden shadow-sm">
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-gray-200 bg-white">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
              <span className="ml-4 flex-1 rounded bg-gray-100 h-5 max-w-xs text-xs text-gray-400 flex items-center px-3">
                hugo.app/dashboard
              </span>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-xs text-gray-400 mb-1">Monthly spend</p>
                  <p className="text-2xl font-bold text-gray-900">$84.97</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-xs text-gray-400 mb-1">Annual spend</p>
                  <p className="text-2xl font-bold text-gray-900">$1,019.64</p>
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { name: "Netflix", cat: "Streaming", amount: "$15.99/mo", color: "bg-purple-100 text-purple-700" },
                  { name: "Spotify", cat: "Streaming", amount: "$9.99/mo", color: "bg-purple-100 text-purple-700" },
                  { name: "Gym membership", cat: "Fitness", amount: "$34.99/mo", color: "bg-green-100 text-green-700" },
                  { name: "HelloFresh", cat: "Food", amount: "$79.99/mo", color: "bg-orange-100 text-orange-700" },
                ].map((item) => (
                  <div key={item.name} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${item.color}`}>
                      {item.cat}
                    </span>
                    <span className="flex-1 text-sm font-medium text-gray-800">{item.name}</span>
                    <span className="text-sm font-semibold text-gray-900">{item.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── Features ─── */}
        <section className="bg-gray-50 border-y border-gray-100 py-20">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-2xl font-bold tracking-tight mb-2 text-center">
              Everything you need, nothing you don&apos;t
            </h2>
            <p className="text-gray-500 text-center mb-12 text-sm">
              Built for people who want clarity, not complexity.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: <CreditCard className="h-5 w-5 text-blue-600" />,
                  title: "Track everything",
                  description:
                    "Add any subscription in seconds. Name, cost, billing cycle, renewal date — stored cleanly in one place.",
                },
                {
                  icon: <BarChart3 className="h-5 w-5 text-blue-600" />,
                  title: "See your real spend",
                  description:
                    "Instantly see your total monthly and annual cost, broken down by category so you know exactly where your money goes.",
                },
                {
                  icon: <CalendarCheck className="h-5 w-5 text-blue-600" />,
                  title: "Stay ahead of renewals",
                  description:
                    "Know exactly when each subscription renews before the charge hits your account. No more surprise bills.",
                },
              ].map((f) => (
                <div key={f.title} className="rounded-xl border border-gray-200 bg-white p-6">
                  <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                    {f.icon}
                  </div>
                  <h3 className="font-semibold mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Email import ─── */}
        <section className="py-20">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 mb-4">
                <Sparkles className="h-3.5 w-3.5" /> AI-powered import
              </div>
              <h2 className="text-2xl font-bold tracking-tight mb-3">
                Import from your inbox automatically
              </h2>
              <p className="text-gray-500 text-sm max-w-xl mx-auto leading-relaxed">
                Connect Gmail or Outlook and let AI scan your receipts and billing emails.
                In seconds it detects your recurring subscriptions — you review and approve. No manual entry needed.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Gmail card */}
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-8 flex flex-col">
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-10 w-10 rounded-xl bg-white border border-blue-100 flex items-center justify-center shrink-0">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <path d="M22 6C22 4.9 21.1 4 20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6ZM20 6L12 11L4 6H20ZM20 18H4V8L12 13L20 8V18Z" fill="#EA4335"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Gmail</p>
                    <p className="text-xs text-gray-500">Google account</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-6 flex-1">
                  Connect your Google account. Hugo searches your last 6 months of Gmail for billing-related emails and surfaces your active subscriptions.
                </p>
                <Link
                  href="/gmail"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-900 transition-colors"
                >
                  How Gmail import works <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {/* Outlook card */}
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-8 flex flex-col">
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-10 w-10 rounded-xl bg-white border border-blue-100 flex items-center justify-center shrink-0">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <rect x="2" y="3" width="13" height="18" rx="2" fill="#0078D4"/>
                      <rect x="9" y="7" width="13" height="10" rx="1.5" fill="#28A8E8"/>
                      <path d="M9 7L15.5 12L22 7" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Outlook</p>
                    <p className="text-xs text-gray-500">Microsoft account · Hotmail · Live</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-6 flex-1">
                  Connect your Microsoft account. Hugo searches your Outlook, Hotmail, or Live inbox for receipts and billing emails to detect recurring charges.
                </p>
                <Link
                  href="/outlook"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-900 transition-colors"
                >
                  How Outlook import works <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Shared privacy note */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-500">
              {[
                { icon: <Mail className="h-3.5 w-3.5" />, text: "Read-only access — we never send or delete emails" },
                { icon: <Sparkles className="h-3.5 w-3.5" />, text: "AI parsing — no human ever sees your inbox" },
                { icon: <ShieldCheck className="h-3.5 w-3.5" />, text: "Email content is never stored" },
              ].map((item) => (
                <span key={item.text} className="flex items-center gap-1.5">
                  {item.icon} {item.text}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ─── How it works ─── */}
        <section className="py-20">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-2xl font-bold tracking-tight mb-2">
              Up and running in minutes
            </h2>
            <p className="text-gray-500 text-sm mb-14">
              Three steps. No integrations. No bank access required.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {[
                {
                  step: "01",
                  title: "Create your account",
                  description: "Sign up with just your email. Free, no credit card.",
                },
                {
                  step: "02",
                  title: "Add your subscriptions",
                  description: "Enter each service manually — name, amount, renewal date.",
                },
                {
                  step: "03",
                  title: "See the full picture",
                  description: "Your dashboard shows totals, categories, and upcoming renewals.",
                },
              ].map((s) => (
                <div key={s.step} className="flex flex-col items-center text-center">
                  <span className="mb-4 text-4xl font-bold text-blue-100 select-none">
                    {s.step}
                  </span>
                  <h3 className="font-semibold mb-2 text-sm">{s.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{s.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA strip ─── */}
        <section className="bg-blue-600 py-16">
          <div className="max-w-xl mx-auto px-6 text-center">
            <h2 className="text-2xl font-bold text-white mb-3">
              Ready to take control?
            </h2>
            <p className="text-blue-200 text-sm mb-8">
              It takes less than two minutes to get started.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-blue-600 hover:bg-blue-50 transition-colors shadow-sm"
            >
              Create free account <ArrowRight className="h-4 w-4" />
            </Link>
            <ul className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-blue-200">
              {["Free forever", "No credit card", "Delete anytime"].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5" /> {t}
                </li>
              ))}
            </ul>
          </div>
        </section>

      </main>

      <MarketingFooter />

    </div>
  );
}
