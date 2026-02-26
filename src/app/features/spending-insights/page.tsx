import Link from "next/link";
import { ArrowRight, BarChart3, TrendingUp, PieChart, Target } from "lucide-react";
import { MarketingHeader } from "@/components/marketing-header";
import { MarketingFooter } from "@/components/marketing-footer";

export const metadata = {
  title: "Spending Insights — Hugo",
  description: "See monthly spending trends, category breakdowns, and month-over-month changes at a glance.",
};

export default function SpendingInsightsPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <MarketingHeader />
      <main className="flex-1">

        <section className="max-w-3xl mx-auto px-6 pt-20 pb-14 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 mb-6">
            <BarChart3 className="h-3.5 w-3.5" /> Spending Insights
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-5">
            Know where your money goes
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed">
            Hugo doesn&apos;t just list your subscriptions — it shows you
            trends, categories, and changes over time so you can make smarter
            spending decisions.
          </p>
        </section>

        <section className="max-w-3xl mx-auto px-6 pb-16">
          <div className="space-y-4">
            {[
              {
                icon: <TrendingUp className="h-5 w-5 text-blue-600" />,
                title: "6-month spending trend",
                body: "A bar chart on your dashboard shows your total monthly subscription spend over the last 6 months. See at a glance whether your costs are climbing, steady, or dropping.",
              },
              {
                icon: <BarChart3 className="h-5 w-5 text-blue-600" />,
                title: "Month-over-month change",
                body: "A badge on your dashboard instantly tells you how your spending changed compared to last month — e.g. \"+12% from last month\" in red, or \"-8%\" in green. No calculation needed.",
              },
              {
                icon: <PieChart className="h-5 w-5 text-blue-600" />,
                title: "Category breakdown",
                body: "See your subscriptions grouped by category — Streaming, Fitness, Food, Software, and more — in a color-coded donut chart. Instantly spot which category costs you the most.",
              },
              {
                icon: <Target className="h-5 w-5 text-blue-600" />,
                title: "Built from real data",
                body: "Insights are calculated from your actual subscription records and change history — not estimates. When you update a subscription amount, the historical trend adjusts to show what you were really paying each month.",
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
            <h2 className="text-xl font-bold mb-3">See the full picture</h2>
            <p className="text-sm text-gray-500 mb-6">Insights appear automatically once you start tracking subscriptions.</p>
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
