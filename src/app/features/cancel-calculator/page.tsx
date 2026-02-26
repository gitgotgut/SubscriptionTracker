import Link from "next/link";
import { ArrowRight, Calculator, ToggleRight, Wallet } from "lucide-react";
import { MarketingHeader } from "@/components/marketing-header";
import { MarketingFooter } from "@/components/marketing-footer";

export const metadata = {
  title: "Cancel Calculator — Hugo",
  description: "Toggle subscriptions on and off to see exactly how much you'd save by cancelling.",
};

export default function CancelCalculatorPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <MarketingHeader />
      <main className="flex-1">

        <section className="max-w-3xl mx-auto px-6 pt-20 pb-14 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 mb-6">
            <Calculator className="h-3.5 w-3.5" /> Cancel Calculator
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-5">
            See what you&apos;d save
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed">
            Not sure which subscriptions are worth keeping? The cancel calculator
            lets you toggle services on and off to see the impact on your
            monthly bill — without actually cancelling anything.
          </p>
        </section>

        <section className="max-w-3xl mx-auto px-6 pb-16">
          <div className="space-y-4">
            {[
              {
                icon: <ToggleRight className="h-5 w-5 text-blue-600" />,
                title: "Toggle to simulate",
                body: "Enter calculator mode from the dashboard toolbar. Click any subscription to exclude it from your total. The dashboard instantly shows your projected monthly spend and the savings.",
              },
              {
                icon: <Wallet className="h-5 w-5 text-green-600" />,
                title: "Instant savings preview",
                body: "A green savings badge appears showing exactly how much you'd save per month — e.g. \"Saving $24.98/mo.\" Try different combinations to find the right balance between cost and value.",
              },
              {
                icon: <Calculator className="h-5 w-5 text-blue-600" />,
                title: "No commitment",
                body: "The calculator is purely visual — nothing is cancelled or changed. Exit calculator mode and everything goes back to normal. It's a safe way to think through your spending before making real decisions.",
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
            <h2 className="text-xl font-bold mb-3">Make better decisions</h2>
            <p className="text-sm text-gray-500 mb-6">The calculator is built into your dashboard — no setup needed.</p>
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
