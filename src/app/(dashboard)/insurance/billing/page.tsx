"use client";

import { useState, useEffect } from "react";
import { CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toMonthlyCents, centsToDisplay, formatAmount } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { format, addMonths, addYears, isBefore, isAfter } from "date-fns";

type Policy = {
  id: string;
  provider: string;
  type: string;
  premiumCents: number;
  currency: string;
  billingCycle: string;
  renewalDate: string;
  status: string;
};

type BillingItem = {
  policy: Policy;
  dueDate: Date;
  amountCents: number;
};

export default function InsuranceBillingPage() {
  const t = useT();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayCurrency, setDisplayCurrency] = useState("USD");
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});

  useEffect(() => {
    Promise.all([
      fetch("/api/insurance").then(r => r.json()),
      fetch("/api/me").then(r => r.json()),
      fetch("/api/exchange-rates").then(r => r.json()),
    ]).then(([pols, me, ratesData]) => {
      setPolicies(pols);
      if (me?.displayCurrency) setDisplayCurrency(me.displayCurrency);
      if (ratesData.rates) setExchangeRates(ratesData.rates);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const fmtAmount = (cents: number, currency: string) => {
    if (currency === displayCurrency) return formatAmount(centsToDisplay(cents), displayCurrency);
    const rate = exchangeRates[currency];
    if (!rate) return formatAmount(centsToDisplay(cents), currency);
    return formatAmount(centsToDisplay(Math.round(cents / rate)), displayCurrency);
  };

  // Generate billing schedule for the next 12 months
  const activePolicies = policies.filter(p => p.status === "active");
  const now = new Date();
  const horizon = addYears(now, 1);

  const billingItems: BillingItem[] = [];
  for (const policy of activePolicies) {
    let date = new Date(policy.renewalDate);
    // Move forward if in the past
    while (isBefore(date, now)) {
      date = policy.billingCycle === "annual" ? addYears(date, 1) : addMonths(date, 1);
    }
    // Add all upcoming dates within horizon
    while (isBefore(date, horizon)) {
      billingItems.push({
        policy,
        dueDate: new Date(date),
        amountCents: policy.premiumCents,
      });
      date = policy.billingCycle === "annual" ? addYears(date, 1) : addMonths(date, 1);
    }
  }

  // Sort by date
  billingItems.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  // Group by month
  const groupedByMonth: Record<string, BillingItem[]> = {};
  for (const item of billingItems) {
    const key = format(item.dueDate, "yyyy-MM");
    if (!groupedByMonth[key]) groupedByMonth[key] = [];
    groupedByMonth[key].push(item);
  }

  const totalMonthlyCents = activePolicies.reduce((sum, p) => {
    const monthly = toMonthlyCents(p.premiumCents, p.billingCycle);
    if (p.currency === displayCurrency) return sum + monthly;
    const rate = exchangeRates[p.currency];
    return sum + (rate ? Math.round(monthly / rate) : monthly);
  }, 0);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <>
      <h1 className="text-xl font-semibold flex items-center gap-2">
        <CreditCard className="h-5 w-5" />
        {t("sidebar.billing")}
      </h1>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("insurance.monthlyPremium")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatAmount(centsToDisplay(totalMonthlyCents), displayCurrency)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("insurance.annualPremium")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatAmount(centsToDisplay(totalMonthlyCents * 12), displayCurrency)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Billing schedule by month */}
      {billingItems.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No upcoming premium payments.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByMonth).map(([monthKey, items]) => {
            const monthLabel = format(new Date(monthKey + "-01"), "MMMM yyyy");
            const monthTotal = items.reduce((sum, item) => {
              const cents = item.amountCents;
              const currency = item.policy.currency;
              if (currency === displayCurrency) return sum + cents;
              const rate = exchangeRates[currency];
              return sum + (rate ? Math.round(cents / rate) : cents);
            }, 0);

            return (
              <div key={monthKey}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold">{monthLabel}</h2>
                  <span className="text-sm font-medium text-muted-foreground">
                    {formatAmount(centsToDisplay(monthTotal), displayCurrency)}
                  </span>
                </div>
                <div className="space-y-2">
                  {items.map((item, i) => (
                    <Card key={`${item.policy.id}-${i}`}>
                      <CardContent className="py-3 px-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div>
                            <p className="text-sm font-medium truncate">{item.policy.provider}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(item.dueDate, "d MMM yyyy")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">{t(`insuranceTypes.${item.policy.type}`)}</Badge>
                          <span className="text-sm font-semibold tabular-nums">
                            {fmtAmount(item.amountCents, item.policy.currency)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
