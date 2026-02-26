import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { MarketingHeader } from "@/components/marketing-header";
import { MarketingFooter } from "@/components/marketing-footer";
import { FEATURES } from "@/lib/features";

export const metadata = {
  title: "Pricing — Hugo",
  description: "Hugo is completely free. Every feature, no credit card required.",
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <MarketingHeader />

      <main className="flex-1">

        {/* ─── Hero ─── */}
        <section className="max-w-3xl mx-auto px-6 pt-20 pb-14 text-center">
          <p className="inline-block mb-6 rounded-full border border-green-100 bg-green-50 px-3 py-1 text-xs font-medium text-green-700 tracking-wide uppercase">
            No credit card required
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-5">
            Free. Completely.
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed max-w-xl mx-auto">
            Hugo is free to use with no hidden tiers, no feature paywalls, and
            no expiry. Every feature is available to every user from day one.
          </p>
        </section>

        {/* ─── Pricing card ─── */}
        <section className="max-w-lg mx-auto px-6 pb-20">
          <div className="rounded-2xl border-2 border-blue-200 bg-white shadow-sm overflow-hidden">
            <div className="bg-blue-600 px-8 py-6 text-white text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-200 mb-1">Free plan</p>
              <p className="text-5xl font-bold mb-1">$0</p>
              <p className="text-sm text-blue-200">forever · no card needed</p>
            </div>
            <div className="px-8 py-8">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">
                Everything included
              </p>
              <ul className="space-y-3">
                {[
                  "Unlimited subscriptions",
                  "Monthly & annual spend totals",
                  "Category breakdowns",
                  "Renewal date tracking",
                  "Gmail AI import",
                  "Outlook AI import",
                  "Email renewal reminders",
                  "Trial expiry alerts",
                  "Spending history & trends",
                  "Price change detection",
                  "Multi-currency support",
                  "Cancel savings calculator",
                  "Household sharing",
                  "Account deletion any time",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-gray-700">
                    <span className="shrink-0 h-5 w-5 rounded-full bg-green-50 border border-green-200 flex items-center justify-center">
                      <Check className="h-3 w-3 text-green-600" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="mt-8 flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
              >
                Get started for free <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ─── Why free ─── */}
        <section className="bg-gray-50 border-y border-gray-100 py-16">
          <div className="max-w-2xl mx-auto px-6 text-center">
            <h2 className="text-xl font-bold mb-4">Why is it free?</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Hugo was built out of frustration with losing track of recurring charges —
              not as a business model. Keeping it free removes the barrier to actually
              using it. If Hugo ever introduces a paid tier in the future, all existing
              features will remain free.
            </p>
          </div>
        </section>

        {/* ─── FAQ teaser ─── */}
        <section className="py-16">
          <div className="max-w-2xl mx-auto px-6 text-center">
            <p className="text-sm text-gray-500 mb-3">Still have questions?</p>
            <Link
              href="/faq"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              Read the FAQ <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>

      </main>

      <MarketingFooter />
    </div>
  );
}
