import Link from "next/link";
import { ArrowRight, CreditCard, Layers, CalendarCheck, Tags } from "lucide-react";
import { MarketingHeader } from "@/components/marketing-header";
import { MarketingFooter } from "@/components/marketing-footer";

export const metadata = {
  title: "Subscription Tracking — Hugo",
  description: "Track all your recurring subscriptions in one clean dashboard — streaming, fitness, software, and more.",
};

export default function SubscriptionTrackingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <MarketingHeader />
      <main className="flex-1">

        <section className="max-w-3xl mx-auto px-6 pt-20 pb-14 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 mb-6">
            <CreditCard className="h-3.5 w-3.5" /> Subscription Tracking
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-5">
            All your subscriptions. One place.
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed">
            Netflix, Spotify, gym, meal kits, SaaS tools — add every recurring
            charge in seconds and see your total monthly and annual spend at a glance.
          </p>
        </section>

        <section className="max-w-3xl mx-auto px-6 pb-16">
          <div className="space-y-4">
            {[
              {
                icon: <Layers className="h-5 w-5 text-blue-600" />,
                title: "Add anything in seconds",
                body: "Enter a name, amount, billing cycle (monthly or annual), renewal date, and category. That's it. Your subscription appears on the dashboard immediately with its monthly and annual equivalent.",
              },
              {
                icon: <Tags className="h-5 w-5 text-blue-600" />,
                title: "Organize by category",
                body: "Streaming, Fitness, Food, Software, or Other — assign a category to each subscription and see your spending grouped visually. The dashboard shows color-coded badges and a category breakdown chart.",
              },
              {
                icon: <CalendarCheck className="h-5 w-5 text-blue-600" />,
                title: "Know when things renew",
                body: "Every subscription shows its next renewal date. Upcoming renewals are highlighted so you always know what's coming up before it hits your bank account.",
              },
              {
                icon: <CreditCard className="h-5 w-5 text-blue-600" />,
                title: "Monthly and annual totals",
                body: "The dashboard summary shows your total monthly spend and the annualized total. Annual subscriptions are automatically converted to a monthly equivalent for easy comparison.",
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
            <h2 className="text-xl font-bold mb-3">Start tracking today</h2>
            <p className="text-sm text-gray-500 mb-6">Free to use, no credit card required.</p>
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
