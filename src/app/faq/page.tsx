import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MarketingHeader } from "@/components/marketing-header";
import { MarketingFooter } from "@/components/marketing-footer";
import { FaqAccordion } from "@/components/faq-accordion";

export const metadata = {
  title: "FAQ — Hugo",
  description: "Frequently asked questions about Hugo — the free subscription tracker.",
};

const FAQS = [
  {
    q: "Is Hugo really free?",
    a: "Yes. Hugo is completely free with no hidden tiers, no feature limits, and no expiry. Every feature — including Gmail import, Outlook import, household sharing, and email reminders — is available to all users at no cost.",
  },
  {
    q: "Do I need to connect my email?",
    a: "No. Email import is optional. You can add every subscription manually in under a minute each. The Gmail and Outlook integrations exist to save time — they're never required.",
  },
  {
    q: "What happens to my emails when I run an import?",
    a: "Your emails are read into memory, parsed by AI, and then immediately discarded. Email content is never written to our database or logs. The only thing saved is the list of subscriptions you explicitly approve. You can read the full explanation on the Gmail or Outlook integration pages.",
  },
  {
    q: "What email providers are supported?",
    a: "Gmail (Google accounts) and Outlook (Microsoft accounts — including Hotmail and Live). Both use read-only OAuth access, so Hugo can never send, delete, or modify any email.",
  },
  {
    q: "Does Hugo need access to my bank account?",
    a: "No. Hugo never connects to any bank or financial institution. You enter subscription amounts manually, or import them from billing emails. That's it.",
  },
  {
    q: "How accurate is the AI import?",
    a: "It's good at spotting clear billing emails — receipts, invoices, renewal notices — but not perfect. It may miss subscriptions that don't send formatted receipts, or occasionally suggest something that isn't a recurring charge. That's why every result goes through a review step where you approve or reject each item before anything is saved.",
  },
  {
    q: "What currencies are supported?",
    a: "Hugo supports any currency. Each subscription can be tracked in its original currency, and your dashboard converts everything to a single display currency using live exchange rates. You can set your preferred display currency in your account settings.",
  },
  {
    q: "Can I share subscriptions with my partner or family?",
    a: "Yes. Hugo has household sharing — one person creates a household, invites others by email, and shared subscriptions appear in everyone's dashboard. Each member can also have their own private subscriptions that stay separate.",
  },
  {
    q: "Will I get notified before a subscription renews?",
    a: "Yes. Hugo sends email reminders 7 days before any subscription renewal date. If a subscription has a trial end date, you'll also get an alert 3 days before the trial converts to paid. Reminders can be turned off in account settings.",
  },
  {
    q: "How does price change detection work?",
    a: "When you run a Gmail or Outlook import scan, Hugo compares the detected amounts against your existing subscriptions. If the name matches but the price is different, it flags it as a potential price change — showing old vs new price — so you can decide whether to accept the update.",
  },
  {
    q: "Can I delete my account?",
    a: "Yes. You can permanently delete your account and all associated data from the dashboard settings at any time. Deletion is immediate and irreversible — there is no recovery period.",
  },
  {
    q: "Is my data secure?",
    a: "Passwords are hashed with bcrypt before storage. OAuth tokens (Gmail/Outlook) are stored encrypted and scoped to read-only access. We use HTTPS for all connections. Email content is never persisted — it's read into memory, processed, and discarded.",
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <MarketingHeader />

      <main className="flex-1">

        {/* Hero */}
        <section className="max-w-2xl mx-auto px-6 pt-20 pb-14">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-5">
            Frequently asked questions
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed">
            Straight answers to the questions we get asked most.
          </p>
        </section>

        {/* Accordion */}
        <section className="max-w-2xl mx-auto px-6 pb-20">
          <FaqAccordion items={FAQS} />
        </section>

        {/* CTA */}
        <section className="bg-gray-50 border-t border-gray-100 py-16">
          <div className="max-w-2xl mx-auto px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <p className="font-semibold text-gray-900 mb-1">Still have a question?</p>
              <p className="text-sm text-gray-500">We&apos;re happy to help — reach out any time.</p>
            </div>
            <Link
              href="/register"
              className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
            >
              Get started free <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

      </main>

      <MarketingFooter />
    </div>
  );
}
