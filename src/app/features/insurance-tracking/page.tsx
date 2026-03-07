import Link from "next/link";
import { ArrowRight, Shield, FileText, Search, Lightbulb } from "lucide-react";
import { MarketingHeader } from "@/components/marketing-header";
import { MarketingFooter } from "@/components/marketing-footer";

export const metadata = {
  title: "Insurance Tracking — Hugo",
  description: "Review all your insurance policies in one place — detect coverage overlaps, find gaps, and get smart recommendations.",
};

export default function InsuranceTrackingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <MarketingHeader />
      <main className="flex-1">

        <section className="max-w-3xl mx-auto px-6 pt-20 pb-14 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 mb-6">
            <Shield className="h-3.5 w-3.5" /> Insurance Tracking
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-5">
            All your insurance. One place.
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed">
            Health, home, car, liability — add every policy in seconds and see
            your total premiums, renewal dates, and coverage at a glance.
          </p>
        </section>

        <section className="max-w-3xl mx-auto px-6 pb-16">
          <div className="space-y-4">
            {[
              {
                icon: <Shield className="h-5 w-5 text-emerald-600" />,
                title: "Policy management",
                body: "Enter your provider, policy type, premium, billing cycle, and renewal date. Your policy appears on the dashboard immediately with monthly and annual premium equivalents.",
              },
              {
                icon: <Search className="h-5 w-5 text-emerald-600" />,
                title: "Coverage overlap & gap detection",
                body: "Hugo automatically detects when you have multiple policies of the same type (potential overlap) or when common coverage types are missing (potential gaps). No more paying twice for the same protection.",
              },
              {
                icon: <FileText className="h-5 w-5 text-emerald-600" />,
                title: "Document upload",
                body: "Attach policy documents directly to each insurance entry. Keep all your contracts, terms, and proof of coverage organized and accessible in one place — no more digging through email.",
              },
              {
                icon: <Lightbulb className="h-5 w-5 text-emerald-600" />,
                title: "Smart recommendations",
                body: "Get actionable insights based on your insurance portfolio. Hugo highlights missing essential coverage, flags potential overlaps, and suggests ways to optimize your premiums.",
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-5 rounded-xl border border-gray-100 bg-gray-50 p-6">
                <div className="shrink-0 mt-0.5">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 border border-emerald-100">
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
            <h2 className="text-xl font-bold mb-3">Start tracking today</h2>
            <p className="text-sm text-gray-500 mb-6">Free to use, no credit card required.</p>
            <Link href="/register" className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors shadow-sm">
              Get started for free <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

      </main>
      <MarketingFooter />
    </div>
  );
}
