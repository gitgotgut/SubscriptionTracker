import Link from "next/link";
import { ArrowRight, Globe, RefreshCw, DollarSign } from "lucide-react";
import { MarketingHeader } from "@/components/marketing-header";
import { MarketingFooter } from "@/components/marketing-footer";

export const metadata = {
  title: "Multi-Currency Support — Hugo",
  description: "Track subscriptions in any currency and see totals converted to your display currency with live exchange rates.",
};

export default function MultiCurrencyPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <MarketingHeader />
      <main className="flex-1">

        <section className="max-w-3xl mx-auto px-6 pt-20 pb-14 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 mb-6">
            <Globe className="h-3.5 w-3.5" /> Multi-Currency
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-5">
            Subscriptions in any currency
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed">
            Pay for Netflix in USD, a gym in EUR, and software in GBP? Hugo
            converts everything to your preferred currency so you see one
            unified total.
          </p>
        </section>

        <section className="max-w-3xl mx-auto px-6 pb-16">
          <div className="space-y-4">
            {[
              {
                icon: <Globe className="h-5 w-5 text-blue-600" />,
                title: "10 currencies supported",
                body: "USD, EUR, GBP, SEK, NOK, DKK, CHF, CAD, AUD, and JPY. Each subscription stores its own currency, and your dashboard totals are converted to whichever display currency you choose.",
              },
              {
                icon: <RefreshCw className="h-5 w-5 text-blue-600" />,
                title: "Live exchange rates",
                body: "Rates are fetched automatically from a public exchange rate API. Your totals always reflect current market rates — no manual conversion needed.",
              },
              {
                icon: <DollarSign className="h-5 w-5 text-blue-600" />,
                title: "Switch any time",
                body: "Change your display currency from the dashboard header with a single click. All totals, charts, and insights instantly recalculate. Your underlying subscription data stays in its original currency.",
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

        <section className="pb-20">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-xl font-bold mb-3">One total, any currency</h2>
            <p className="text-sm text-gray-500 mb-6">Set your display currency during sign-up or change it any time in the dashboard.</p>
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
