"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { SpendingChart } from "@/components/spending-chart";
import { SpendingTrendChart } from "@/components/spending-trend-chart";
import { SpendChangeBadge } from "@/components/spend-change-badge";
import { toMonthlyCents, centsToDisplay, formatAmount } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/lib/i18n";

type Subscription = {
  id: string;
  name: string;
  category: string;
  amountCents: number;
  currency: string;
  billingCycle: string;
  status: string;
};

export default function SubscriptionsAnalyticsPage() {
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

  // Category breakdown
  const categoryBreakdown = activeSubs.reduce<Record<string, number>>((acc, s) => {
    const monthly = convert(toMonthlyCents(s.amountCents, s.billingCycle), s.currency);
    acc[s.category] = (acc[s.category] ?? 0) + monthly;
    return acc;
  }, {});

  return (
    <>
      <h1 className="text-xl font-semibold">{t("sidebar.analytics")}</h1>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-sm font-medium text-muted-foreground mb-1">{t("dashboard.monthlySpend")}</p>
            {loading ? <Skeleton className="h-9 w-32" /> : (
              <>
                <p className="text-3xl font-bold">{formatAmount(centsToDisplay(totalMonthlyCents), displayCurrency)}</p>
                <SpendChangeBadge />
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-sm font-medium text-muted-foreground mb-1">{t("dashboard.annualSpend")}</p>
            {loading ? <Skeleton className="h-9 w-32" /> : (
              <p className="text-3xl font-bold">{formatAmount(centsToDisplay(totalMonthlyCents * 12), displayCurrency)}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-sm font-medium text-muted-foreground mb-1">Categories</p>
            {loading ? <Skeleton className="h-9 w-16" /> : (
              <p className="text-3xl font-bold">{Object.keys(categoryBreakdown).length}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-5 pb-4 px-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">{t("dashboard.byCategory")}</p>
            {loading ? <Skeleton className="h-48 w-48 mx-auto rounded-full" /> : (
              <SpendingChart
                subscriptions={activeSubs.map(s => ({ ...s, amountCents: convert(s.amountCents, s.currency), billingCycle: s.billingCycle }))}
                formatValue={(s) => formatAmount(s, displayCurrency)}
              />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 px-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{t("dashboard.spendingTrend")}</p>
            {loading ? <Skeleton className="h-48 w-full" /> : (
              <SpendingTrendChart formatValue={(s) => formatAmount(s, displayCurrency)} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category breakdown table */}
      {!loading && Object.keys(categoryBreakdown).length > 0 && (
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Category breakdown</p>
            <div className="space-y-2">
              {Object.entries(categoryBreakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([category, cents]) => {
                  const pct = totalMonthlyCents > 0 ? Math.round((cents / totalMonthlyCents) * 100) : 0;
                  return (
                    <div key={category} className="flex items-center gap-3">
                      <span className="text-sm w-28 truncate">{t(`categories.${category}`) !== `categories.${category}` ? t(`categories.${category}`) : category}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-sm font-medium tabular-nums w-20 text-right">{formatAmount(centsToDisplay(cents), displayCurrency)}</span>
                      <span className="text-xs text-muted-foreground w-10 text-right">{pct}%</span>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
