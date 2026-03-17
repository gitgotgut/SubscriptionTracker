"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CreditCard, ArrowRight, TrendingUp, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SpendChangeBadge } from "@/components/spend-change-badge";
import { toMonthlyCents, centsToDisplay, formatAmount } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { format, differenceInDays } from "date-fns";

type Subscription = {
  id: string;
  name: string;
  category: string;
  amountCents: number;
  currency: string;
  billingCycle: string;
  renewalDate: string;
  status: string;
};

export default function SubscriptionsOverviewPage() {
  const t = useT();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayCurrency, setDisplayCurrency] = useState("USD");
  const [rates, setRates] = useState<Record<string, number>>({ USD: 1 });

  useEffect(() => {
    Promise.all([
      fetch("/api/subscriptions").then(r => r.json()),
      fetch("/api/me").then(r => r.json()),
      fetch("/api/exchange-rates").then(r => r.json()),
    ]).then(([subs, me, ratesData]) => {
      setSubscriptions(subs);
      if (me?.displayCurrency) setDisplayCurrency(me.displayCurrency);
      setRates(ratesData.rates ?? { USD: 1 });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  function convert(cents: number, fromCurrency: string): number {
    const from = rates[fromCurrency] ?? 1;
    const to = rates[displayCurrency] ?? 1;
    return Math.round(cents * (to / from));
  }

  const activeSubs = subscriptions.filter(s => s.status !== "paused");
  const totalMonthlyCents = activeSubs.reduce(
    (sum, s) => sum + convert(toMonthlyCents(s.amountCents, s.billingCycle), s.currency), 0
  );

  const upcomingRenewals = subscriptions
    .filter(s => {
      const days = differenceInDays(new Date(s.renewalDate), new Date());
      return days >= 0 && days <= 7;
    })
    .sort((a, b) => new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime());

  const categories = Array.from(new Set(subscriptions.map(s => s.category)));

  return (
    <>
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("dashboard.monthlySpend")}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-9 w-32" /> : (
              <>
                <p className="text-3xl font-bold">{formatAmount(centsToDisplay(totalMonthlyCents), displayCurrency)}</p>
                <SpendChangeBadge />
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("dashboard.annualSpend")}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-9 w-32" /> : (
              <p className="text-3xl font-bold">{formatAmount(centsToDisplay(totalMonthlyCents * 12), displayCurrency)}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5" />Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-9 w-16" /> : (
              <>
                <p className="text-3xl font-bold">{activeSubs.length}</p>
                <p className="text-xs text-muted-foreground mt-1">{categories.length} categories</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming renewals */}
      {!loading && upcomingRenewals.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />Upcoming renewals (next 7 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingRenewals.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{sub.name}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(sub.renewalDate), "MMM d, yyyy")}</p>
                  </div>
                  <p className="text-sm font-medium">
                    {formatAmount(centsToDisplay(convert(sub.amountCents, sub.currency)), displayCurrency)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/subscriptions/list">
          <Card className="hover:border-primary/40 transition-colors cursor-pointer group">
            <CardContent className="py-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-primary/15 text-primary flex items-center justify-center">
                <CreditCard className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{t("dashboard.subscriptions")}</p>
                <p className="text-xs text-muted-foreground">Manage, add, or remove subscriptions</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/subscriptions/analytics">
          <Card className="hover:border-primary/40 transition-colors cursor-pointer group">
            <CardContent className="py-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-primary/15 text-primary flex items-center justify-center">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{t("sidebar.analytics")}</p>
                <p className="text-xs text-muted-foreground">Spending trends and category breakdowns</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </>
  );
}
