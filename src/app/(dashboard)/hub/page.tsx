"use client";

import { useState, useEffect, useCallback } from "react";
import { signOut } from "next-auth/react";
import { LogOut, CreditCard, Shield, Lightbulb, CalendarClock, ArrowRight } from "lucide-react";
import { HugoLogo } from "@/components/hugo-logo";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toMonthlyCents, centsToDisplay, formatAmount } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { LanguageToggle } from "@/components/language-toggle";
import { ModuleSwitcher } from "@/components/module-switcher";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { Recommendation } from "@/lib/recommendations";

const CURRENCIES = ["USD","EUR","GBP","SEK","NOK","DKK","CHF","CAD","AUD","JPY"];

type Renewal = {
  type: "subscription" | "insurance";
  name: string;
  renewalDate: string;
  monthlyCents: number;
  currency: string;
};

type HubData = {
  totalMonthlySubscriptionsCents: number;
  totalMonthlyInsuranceCents: number;
  subscriptionCount: number;
  policyCount: number;
  upcomingRenewals: Renewal[];
  recommendations: Recommendation[];
};

const SEGMENT_COLORS = { subscriptions: "#2563eb", insurance: "#059669" };

export default function HubPage() {
  const t = useT();
  const [data, setData] = useState<HubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayCurrency, setDisplayCurrency] = useState("USD");
  const [rates, setRates] = useState<Record<string, number>>({ USD: 1 });

  const fetchData = useCallback(async () => {
    const [hubRes, meRes, ratesRes] = await Promise.all([
      fetch("/api/hub"),
      fetch("/api/me"),
      fetch("/api/exchange-rates"),
    ]);
    if (hubRes.ok) setData(await hubRes.json());
    if (meRes.ok) {
      const me = await meRes.json();
      if (me?.displayCurrency) setDisplayCurrency(me.displayCurrency);
    }
    if (ratesRes.ok) {
      const r = await ratesRes.json();
      setRates(r.rates ?? { USD: 1 });
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function convert(cents: number, fromCurrency: string): number {
    const from = rates[fromCurrency] ?? 1;
    const to = rates[displayCurrency] ?? 1;
    return Math.round(cents * (to / from));
  }

  function fmtAmount(cents: number): string {
    return formatAmount(centsToDisplay(cents), displayCurrency);
  }

  async function handleChangeCurrency(val: string) {
    setDisplayCurrency(val);
    await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayCurrency: val }),
    });
  }

  // Chart data
  const chartData = data ? [
    { name: "subscriptions", value: data.totalMonthlySubscriptionsCents, display: fmtAmount(data.totalMonthlySubscriptionsCents) },
    { name: "insurance", value: data.totalMonthlyInsuranceCents, display: fmtAmount(data.totalMonthlyInsuranceCents) },
  ].filter((d) => d.value > 0) : [];

  const totalMonthly = data ? data.totalMonthlySubscriptionsCents + data.totalMonthlyInsuranceCents : 0;

  const RECO_ICONS: Record<string, string> = { savings: "text-green-600", warning: "text-amber-600", info: "text-primary" };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <HugoLogo size={24} />
            <span className="font-semibold tracking-tight">Hugo</span>
          </div>
          <div className="flex items-center gap-2">
            <Select value={displayCurrency} onValueChange={handleChangeCurrency}>
              <SelectTrigger className="w-24 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <LanguageToggle />
            <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>
              <LogOut className="h-4 w-4 mr-1" />{t("common.signOut")}
            </Button>
          </div>
        </div>
      </header>

      <ModuleSwitcher />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Summary strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t("hub.combinedMonthly")}</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-9 w-32" /> : (
                <p className="text-3xl font-bold">{fmtAmount(totalMonthly)}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5" />{t("hub.subscriptionsLabel")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-9 w-24" /> : (
                <>
                  <p className="text-2xl font-bold">{fmtAmount(data?.totalMonthlySubscriptionsCents ?? 0)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t("hub.totalSubscriptions", { count: String(data?.subscriptionCount ?? 0) })}</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" />{t("hub.insuranceLabel")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-9 w-24" /> : (
                <>
                  <p className="text-2xl font-bold">{fmtAmount(data?.totalMonthlyInsuranceCents ?? 0)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t("hub.totalPolicies", { count: String(data?.policyCount ?? 0) })}</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: chart + recommendations */}
          <div className="space-y-6">
            {/* Combined donut chart */}
            {loading ? (
              <Card>
                <CardContent className="py-6 flex justify-center">
                  <Skeleton className="h-48 w-48 rounded-full" />
                </CardContent>
              </Card>
            ) : chartData.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">{t("hub.combinedMonthly")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={68}
                        outerRadius={92}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {chartData.map((entry) => (
                          <Cell key={entry.name} fill={SEGMENT_COLORS[entry.name as keyof typeof SEGMENT_COLORS]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(_value: any, _name: any, props: any) => [
                          props.payload.display,
                          t(`hub.${props.payload.name}Label`),
                        ]}
                        contentStyle={{
                          borderRadius: "10px",
                          border: "1px solid #e2e8f0",
                          boxShadow: "0 4px 12px rgb(0 0 0 / 0.08)",
                          fontSize: "13px",
                          padding: "8px 12px",
                        }}
                      />
                      <text x="50%" y="46%" textAnchor="middle" className="text-lg font-bold fill-foreground">
                        {fmtAmount(totalMonthly)}
                      </text>
                      <text x="50%" y="58%" textAnchor="middle" className="text-xs fill-muted-foreground">
                        /mo
                      </text>
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Legend */}
                  <div className="flex justify-center gap-4 mt-2">
                    {chartData.map((d) => (
                      <div key={d.name} className="flex items-center gap-1.5 text-xs">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SEGMENT_COLORS[d.name as keyof typeof SEGMENT_COLORS] }} />
                        {t(`hub.${d.name}Label`)}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            {!loading && data && data.recommendations.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                    <Lightbulb className="h-4 w-4" />{t("hub.recommendations")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data.recommendations.map((rec) => (
                    <div key={rec.id} className="border rounded-lg px-3 py-2.5">
                      <p className={`text-sm font-medium ${RECO_ICONS[rec.type]}`}>
                        {t(rec.titleKey, rec.vars)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t(rec.descriptionKey, rec.vars)}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right column: renewals + quick actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upcoming renewals */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                  <CalendarClock className="h-4 w-4" />{t("hub.upcomingRenewals")}
                  <Badge variant="outline" className="ml-auto text-xs font-normal">{t("hub.next30Days")}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="flex-1 space-y-1.5">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                        <Skeleton className="h-4 w-16" />
                      </div>
                    ))}
                  </div>
                ) : data && data.upcomingRenewals.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">{t("hub.noUpcomingRenewals")}</p>
                ) : (
                  <div className="space-y-2">
                    {data?.upcomingRenewals.map((r, i) => (
                      <div key={i} className="flex items-center gap-3 py-2 border-b last:border-0">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${r.type === "subscription" ? "bg-primary/15 text-primary" : "bg-emerald-100 text-emerald-600"}`}>
                          {r.type === "subscription" ? <CreditCard className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{r.name}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(r.renewalDate), "MMM d, yyyy")}</p>
                        </div>
                        <p className="text-sm font-medium">{formatAmount(centsToDisplay(convert(r.monthlyCents, r.currency)), displayCurrency)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link href="/dashboard">
                <Card className="hover:border-primary/40 transition-colors cursor-pointer group">
                  <CardContent className="py-5 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/15 text-primary flex items-center justify-center">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{t("hub.manageSubscriptions")}</p>
                      <p className="text-xs text-muted-foreground">{t("hub.totalSubscriptions", { count: String(data?.subscriptionCount ?? 0) })}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </CardContent>
                </Card>
              </Link>
              <Link href="/insurance">
                <Card className="hover:border-emerald-300 transition-colors cursor-pointer group">
                  <CardContent className="py-5 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{t("hub.manageInsurance")}</p>
                      <p className="text-xs text-muted-foreground">{t("hub.totalPolicies", { count: String(data?.policyCount ?? 0) })}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
