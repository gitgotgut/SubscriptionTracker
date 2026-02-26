import Link from "next/link";
import { ArrowRight, TrendingUp, Search, History, ShieldCheck } from "lucide-react";
import { MarketingHeader } from "@/components/marketing-header";
import { MarketingFooter } from "@/components/marketing-footer";

export const metadata = {
  title: "Price Change Detection — Subtrack",
  description: "Automatically detect when your subscriptions change price by re-scanning your Gmail receipts.",
};

export default function PriceDetectionPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <MarketingHeader />
      <main className="flex-1">

        <section className="max-w-3xl mx-auto px-6 pt-20 pb-14 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 mb-6">
            <TrendingUp className="h-3.5 w-3.5" /> Price Detection
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-5">
            Catch price increases before they add up
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed">
            Services quietly raise prices all the time. Subtrack flags changes
            automatically when you re-scan your Gmail, so you never miss a
            silent increase.
          </p>
        </section>

        <section className="max-w-3xl mx-auto px-6 pb-16">
          <div className="space-y-4">
            {[
              {
                icon: <Search className="h-5 w-5 text-blue-600" />,
                title: "Automatic comparison",
                body: "When you run a Gmail import scan, Subtrack compares every detected subscription against the ones you already track. If the name matches but the price differs, it's flagged as a price change.",
              },
              {
                icon: <TrendingUp className="h-5 w-5 text-amber-600" />,
                title: "Clear visual diff",
                body: "Price changes are highlighted in amber in the import modal — showing the old price, the new price, and the exact difference (e.g. \"$15.99 → $22.99 (+$7.00)\"). No guessing required.",
              },
              {
                icon: <History className="h-5 w-5 text-blue-600" />,
                title: "One-click update with history",
                body: "Accept the new price with a single click. Subtrack updates the subscription and records the change in your price history — so you can see exactly when each increase happened over time.",
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-5 rounded-xl border border-gray-100 bg-gray-50 p-6">
                <div className="shrink-0 mt-0.5">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 border border-blue-100">
                    {item.icon}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-3xl mx-auto px-6">
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-8 flex gap-5 items-start">
              <ShieldCheck className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">The silent cost of not noticing</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  A $3/month increase across 5 services is $180/year you never agreed to.
                  Price detection gives you back the power to decide whether the new price is still worth it.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-20">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-xl font-bold mb-3">Stay on top of your costs</h2>
            <p className="text-sm text-gray-500 mb-6">Connect Gmail and re-scan any time to check for changes.</p>
            <Link href="/register" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm">
              Get started for free <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

      </main>
      <MarketingFooter />
    </div>
  );
}
