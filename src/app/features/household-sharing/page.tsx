import Link from "next/link";
import { ArrowRight, Users, UserPlus, Eye, Shield } from "lucide-react";
import { MarketingHeader } from "@/components/marketing-header";
import { MarketingFooter } from "@/components/marketing-footer";

export const metadata = {
  title: "Household Sharing — Hugo",
  description: "Share subscription tracking with your family or household and keep everyone on the same page.",
};

export default function HouseholdSharingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <MarketingHeader />
      <main className="flex-1">

        <section className="max-w-3xl mx-auto px-6 pt-20 pb-14 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 mb-6">
            <Users className="h-3.5 w-3.5" /> Household Sharing
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-5">
            Track subscriptions as a family
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed">
            Create a household, invite your partner or family members, and see
            all shared subscriptions in one combined view — so everyone knows
            what the household is paying for.
          </p>
        </section>

        <section className="max-w-3xl mx-auto px-6 pb-16">
          <div className="space-y-4">
            {[
              {
                icon: <UserPlus className="h-5 w-5 text-blue-600" />,
                title: "Create and invite",
                body: "Create a household from the dashboard and invite members by email. Each person keeps their own account and personal subscriptions — the household is an additional shared layer.",
              },
              {
                icon: <Eye className="h-5 w-5 text-blue-600" />,
                title: "Shared visibility",
                body: "Subscriptions assigned to the household appear on every member's dashboard. Everyone sees the same list, the same totals, and the same renewal dates — no more guessing who signed up for what.",
              },
              {
                icon: <Shield className="h-5 w-5 text-blue-600" />,
                title: "Owner controls",
                body: "The household owner manages membership and can remove members at any time. Members can view and add shared subscriptions but only the owner or the original creator can delete them.",
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
              <Users className="h-6 w-6 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Shared costs, shared awareness</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Most households don&apos;t realize how much they spend on subscriptions
                  because the charges are spread across different accounts. Household
                  sharing brings everything together so you can make decisions together.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-20">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-xl font-bold mb-3">Better together</h2>
            <p className="text-sm text-gray-500 mb-6">Create a household for free and invite your family.</p>
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
