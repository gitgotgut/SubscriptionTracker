import Link from "next/link";
import { ArrowRight, Bell, Clock, SlidersHorizontal, ShieldAlert } from "lucide-react";
import { MarketingHeader } from "@/components/marketing-header";
import { MarketingFooter } from "@/components/marketing-footer";

export const metadata = {
  title: "Email Reminders — Subtrack",
  description: "Get notified before subscriptions renew and before free trials convert to paid.",
};

export default function EmailRemindersPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <MarketingHeader />
      <main className="flex-1">

        <section className="max-w-3xl mx-auto px-6 pt-20 pb-14 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 mb-6">
            <Bell className="h-3.5 w-3.5" /> Email Reminders
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-5">
            Never be surprised by a renewal again
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed">
            Subtrack sends you a heads-up email before subscriptions renew and
            before free trials convert to paid — so you can cancel or budget
            before the charge hits.
          </p>
        </section>

        <section className="max-w-3xl mx-auto px-6 pb-16">
          <div className="space-y-4">
            {[
              {
                icon: <Clock className="h-5 w-5 text-blue-600" />,
                title: "7-day renewal heads-up",
                body: "Every morning, Subtrack checks your upcoming renewals. If anything renews within 7 days, you get a single consolidated email listing each subscription, its amount, and the renewal date.",
              },
              {
                icon: <ShieldAlert className="h-5 w-5 text-amber-600" />,
                title: "Trial expiry warnings",
                body: "Tracking a free trial? Subtrack alerts you 3 days before it converts to a paid subscription — including the price it will convert to. This is the single most effective way to avoid unwanted charges.",
              },
              {
                icon: <SlidersHorizontal className="h-5 w-5 text-blue-600" />,
                title: "One-click on or off",
                body: "Toggle reminders from the dashboard header with a single click. When disabled, no emails are sent. You stay in full control — no spam, no marketing, just the alerts you asked for.",
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
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-8 flex gap-5 items-start">
              <Bell className="h-6 w-6 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Proactive, not reactive</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Most people discover unwanted charges after they happen. Subtrack
                  flips that — you get the information before the money leaves your
                  account, giving you time to act.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-20">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-xl font-bold mb-3">Stop overpaying</h2>
            <p className="text-sm text-gray-500 mb-6">Reminders are on by default — just sign up and add your subscriptions.</p>
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
