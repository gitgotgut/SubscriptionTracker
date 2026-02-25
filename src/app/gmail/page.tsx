import Link from "next/link";
import {
  Layers,
  ArrowRight,
  Mail,
  ShieldCheck,
  Sparkles,
  KeyRound,
  Eye,
  Ban,
  Check,
} from "lucide-react";

export const metadata = {
  title: "Gmail Integration — Subtrack",
  description:
    "Learn how Subtrack uses your Gmail to detect subscriptions, what data we access, and what we never store.",
};

export default function GmailPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">

      {/* ─── Header ─── */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-blue-600" />
            <span className="font-semibold tracking-tight">Subtrack</span>
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Get started <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      <main className="flex-1">

        {/* ─── Hero ─── */}
        <section className="max-w-3xl mx-auto px-6 pt-20 pb-14 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 mb-6">
            <Mail className="h-3.5 w-3.5" /> Gmail integration
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-5">
            How Gmail import works
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed">
            Subtrack can scan your Gmail receipts to detect recurring
            subscriptions automatically. Here&apos;s exactly what happens — and
            what we never touch.
          </p>
        </section>

        {/* ─── Step by step ─── */}
        <section className="max-w-3xl mx-auto px-6 pb-16">
          <div className="space-y-4">
            {[
              {
                icon: <KeyRound className="h-5 w-5 text-blue-600" />,
                step: "1",
                title: "You grant read-only access",
                body: "When you click Connect Gmail, you're taken to Google's own sign-in and consent screen. You decide whether to allow access. Subtrack requests only the minimum permission required: read-only access to your Gmail messages. We cannot send, delete, or modify anything.",
              },
              {
                icon: <Eye className="h-5 w-5 text-blue-600" />,
                step: "2",
                title: "We search for billing emails",
                body: "Once connected, clicking Import from Gmail triggers a search of your last 6 months of email for messages with billing-related keywords in the subject — things like receipt, invoice, subscription, renewal, and payment. We fetch a maximum of 50 matching emails.",
              },
              {
                icon: <Sparkles className="h-5 w-5 text-blue-600" />,
                step: "3",
                title: "AI reads and parses the emails",
                body: "The sender, subject, date, and a short excerpt of each email are sent to an AI model in a single request. The AI identifies recurring subscription charges — service name, amount, billing cycle, and next renewal date. No human at Subtrack ever sees your emails. The raw email content is never written to disk or a database.",
              },
              {
                icon: <Check className="h-5 w-5 text-blue-600" />,
                step: "4",
                title: "You review and choose what to import",
                body: "The AI's suggestions appear in a review panel. Every item is pre-selected, but you can uncheck anything you don't want. Only the subscriptions you explicitly approve are saved to your Subtrack account — as ordinary subscription records, identical to ones you'd add manually.",
              },
              {
                icon: <Ban className="h-5 w-5 text-blue-600" />,
                step: "5",
                title: "Disconnect any time",
                body: "You can revoke Subtrack's access to your Gmail at any time by clicking the Gmail button in the dashboard header and choosing Disconnect. This immediately deletes your stored OAuth tokens from our database. You can also revoke access directly from your Google Account at myaccount.google.com/permissions.",
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-5 rounded-xl border border-gray-100 bg-gray-50 p-6">
                <div className="shrink-0 mt-0.5">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 border border-blue-100">
                    {item.icon}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">
                    Step {item.step}
                  </p>
                  <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Data table ─── */}
        <section className="bg-gray-50 border-y border-gray-100 py-16">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-xl font-bold mb-2">What we store — and what we don&apos;t</h2>
            <p className="text-sm text-gray-500 mb-8">
              Plain answers to what happens to your data.
            </p>
            <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-5 py-3 font-medium text-gray-600">Data</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-600">Stored?</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-600">Why</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    {
                      data: "Gmail OAuth tokens",
                      stored: "Yes",
                      yes: true,
                      why: "Needed to call the Gmail API on your behalf when you trigger a scan.",
                    },
                    {
                      data: "Email subject, sender, date",
                      stored: "No",
                      yes: false,
                      why: "Read into memory during the scan, then discarded immediately.",
                    },
                    {
                      data: "Email body content",
                      stored: "No",
                      yes: false,
                      why: "Only a short excerpt is passed to the AI. Never written to our database.",
                    },
                    {
                      data: "AI-parsed subscription candidates",
                      stored: "No",
                      yes: false,
                      why: "Shown in the review panel only. Discarded when you close the modal.",
                    },
                    {
                      data: "Subscriptions you choose to import",
                      stored: "Yes",
                      yes: true,
                      why: "Saved as normal subscription records in your account — same as adding manually.",
                    },
                  ].map((row) => (
                    <tr key={row.data}>
                      <td className="px-5 py-3 text-gray-800">{row.data}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${row.yes ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700"}`}>
                          {row.yes ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-500">{row.why}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ─── Privacy callout ─── */}
        <section className="py-16">
          <div className="max-w-3xl mx-auto px-6">
            <div className="rounded-2xl border border-green-100 bg-green-50 p-8 flex gap-5 items-start">
              <ShieldCheck className="h-6 w-6 text-green-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Our privacy commitment</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Your inbox is private. Subtrack reads the minimum necessary to
                  detect subscriptions — and nothing more. Email content is
                  never logged, never stored, and never shared with anyone
                  except the AI service used for parsing. You are always in
                  control: the import only runs when you trigger it, and you
                  approve every subscription before it is added to your account.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section className="pb-20">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-xl font-bold mb-3">Ready to try it?</h2>
            <p className="text-sm text-gray-500 mb-6">
              Create a free account and connect Gmail in under two minutes.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
            >
              Get started for free <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <Link href="/" className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-600" />
              <span className="font-semibold text-sm tracking-tight">Subtrack</span>
            </Link>
            <div className="flex gap-6 text-xs text-gray-400">
              <Link href="/" className="hover:text-gray-600 transition-colors">Home</Link>
              <Link href="/register" className="hover:text-gray-600 transition-colors">Get started</Link>
              <Link href="/login" className="hover:text-gray-600 transition-colors">Sign in</Link>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
