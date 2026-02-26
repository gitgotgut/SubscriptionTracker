import Link from "next/link";
import { ArrowRight, ShieldCheck, Eye, Layers } from "lucide-react";
import { MarketingHeader } from "@/components/marketing-header";
import { MarketingFooter } from "@/components/marketing-footer";

export const metadata = {
  title: "About — Hugo",
  description: "Hugo is a simple, private subscription tracker built to give you a clear view of what you're paying for.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <MarketingHeader />

      <main className="flex-1">

        {/* ─── Hero ─── */}
        <section className="max-w-2xl mx-auto px-6 pt-20 pb-14">
          <div className="flex items-center gap-2 mb-8">
            <Layers className="h-5 w-5 text-blue-600" />
            <span className="font-semibold tracking-tight">Hugo</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6 leading-tight">
            Built to keep your subscriptions honest.
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed">
            Subscriptions are designed to be forgotten. Small monthly charges
            that never feel urgent enough to cancel — until you add them up.
            Hugo exists to make that total impossible to ignore.
          </p>
        </section>

        {/* ─── Story ─── */}
        <section className="max-w-2xl mx-auto px-6 pb-16 space-y-5 text-sm text-gray-600 leading-relaxed">
          <p>
            Most people have no idea what they spend on recurring services each
            month. Not because they&apos;re careless — but because services make
            it easy to sign up and hard to keep track. A $9.99 here, a free
            trial that quietly converts there, a family plan that costs more
            than you remember agreeing to.
          </p>
          <p>
            Hugo is a single place to see everything. You add your
            subscriptions manually, or connect Gmail or Outlook and let AI find
            them in your billing emails. From there, Hugo shows you what you
            actually spend each month, what&apos;s renewing soon, and where your
            money goes by category.
          </p>
          <p>
            No bank connection required. No syncing your financial accounts.
            No black box that decides what counts. Just a clean, honest view of
            your subscriptions — updated when you say so.
          </p>
        </section>

        {/* ─── Values ─── */}
        <section className="bg-gray-50 border-y border-gray-100 py-16">
          <div className="max-w-2xl mx-auto px-6">
            <h2 className="text-xl font-bold mb-8">What we believe</h2>
            <div className="space-y-6">
              {[
                {
                  icon: <Eye className="h-5 w-5 text-blue-600" />,
                  title: "Clarity over features",
                  body: "A dashboard that tells you what you spend in two seconds is worth more than a hundred charts. Hugo is deliberately simple.",
                },
                {
                  icon: <ShieldCheck className="h-5 w-5 text-blue-600" />,
                  title: "Privacy by default",
                  body: "Your email is scanned in memory and discarded. Nothing is logged. Nothing is sold. We store the minimum needed and nothing more.",
                },
                {
                  icon: <Layers className="h-5 w-5 text-blue-600" />,
                  title: "Free, no asterisks",
                  body: "Hugo is free because subscription tracking shouldn't cost money. There are no paywalled features, no usage limits, and no expiry.",
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-5">
                  <div className="shrink-0 mt-0.5 h-9 w-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section className="py-20">
          <div className="max-w-2xl mx-auto px-6">
            <h2 className="text-xl font-bold mb-3">Ready to see your full picture?</h2>
            <p className="text-sm text-gray-500 mb-6">
              It takes less than two minutes. No card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
              >
                Get started for free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/faq"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Read the FAQ
              </Link>
            </div>
          </div>
        </section>

      </main>

      <MarketingFooter />
    </div>
  );
}
