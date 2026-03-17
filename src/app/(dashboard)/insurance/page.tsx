"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Shield, ArrowRight, FileText, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InsuranceChart } from "@/components/insurance-chart";
import { InsuranceInsights } from "@/components/insurance-insights";
import { InsuranceAIInsights } from "@/components/insurance-ai-insights";
import { toMonthlyCents, centsToDisplay, formatAmount } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/lib/i18n";

type Policy = {
  id: string;
  provider: string;
  type: string;
  premiumCents: number;
  currency: string;
  billingCycle: string;
  renewalDate: string;
  status: string;
  policyNumber?: string;
  coverageNotes?: string;
};

const TYPE_COLORS: Record<string, string> = {
  health: "#16a34a", car: "#d97706", home: "#2563eb", life: "#7c3aed",
  travel: "#0891b2", pet: "#ea580c", contents: "#db2777", liability: "#dc2626",
  other: "#475569",
};

export default function InsuranceHomePage() {
  const t = useT();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayCurrency, setDisplayCurrency] = useState("USD");
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [hasAnalyzedDocs, setHasAnalyzedDocs] = useState(false);

  const fetchPolicies = useCallback(async () => {
    const res = await fetch("/api/insurance");
    if (res.ok) setPolicies(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPolicies();
    fetch("/api/me").then(r => r.json()).then(u => {
      setDisplayCurrency(u.displayCurrency ?? "USD");
    });
    fetch("/api/exchange-rates").then(r => r.json()).then(d => {
      if (d.rates) setExchangeRates(d.rates);
    }).catch(() => {});
    fetch("/api/insurance/has-analyzed-docs").then(r => r.json()).then(d => {
      if (d.hasAnalyzed) setHasAnalyzedDocs(true);
    }).catch(() => {});
  }, [fetchPolicies]);

  const fmtValue = (s: string) => formatAmount(s, displayCurrency);

  const activePolicies = policies.filter(p => p.status === "active");

  const totalMonthlyCents = activePolicies.reduce((sum, p) => {
    const monthly = toMonthlyCents(p.premiumCents, p.billingCycle);
    if (p.currency === displayCurrency) return sum + monthly;
    const rate = exchangeRates[p.currency];
    return sum + (rate ? Math.round(monthly / rate) : monthly);
  }, 0);

  const coverageByType = activePolicies.reduce<Record<string, { count: number; monthlyCents: number }>>((acc, p) => {
    const monthly = toMonthlyCents(p.premiumCents, p.billingCycle);
    const converted = p.currency === displayCurrency ? monthly : (exchangeRates[p.currency] ? Math.round(monthly / exchangeRates[p.currency]) : monthly);
    if (!acc[p.type]) acc[p.type] = { count: 0, monthlyCents: 0 };
    acc[p.type].count++;
    acc[p.type].monthlyCents += converted;
    return acc;
  }, {});

  return (
    <>
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t("insurance.monthlyPremium")}</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-32" /> : (
              <p className="text-2xl font-bold tracking-tight">{formatAmount(centsToDisplay(totalMonthlyCents), displayCurrency)}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t("insurance.annualPremium")}</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-32" /> : (
              <p className="text-2xl font-bold tracking-tight">{formatAmount(centsToDisplay(totalMonthlyCents * 12), displayCurrency)}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" />Active policies</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16" /> : (
              <p className="text-2xl font-bold tracking-tight">{activePolicies.length}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Coverage summary grid */}
      {Object.keys(coverageByType).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Object.entries(coverageByType)
            .sort(([, a], [, b]) => b.monthlyCents - a.monthlyCents)
            .map(([type, data]) => (
              <Card key={type} className="py-0">
                <CardContent className="py-3 px-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: TYPE_COLORS[type] ?? "#475569" }} />
                    <span className="text-xs font-medium truncate">{t(`insuranceTypes.${type}`)}</span>
                  </div>
                  <p className="text-sm font-semibold tabular-nums">{formatAmount(centsToDisplay(data.monthlyCents), displayCurrency)}<span className="text-xs font-normal text-muted-foreground">{t("charts.perMo")}</span></p>
                  <p className="text-xs text-muted-foreground">{data.count} {data.count === 1 ? "policy" : t("insurance.policies").toLowerCase()}</p>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* AI Coverage Insights */}
      <InsuranceAIInsights hasAnalyzedDocs={hasAnalyzedDocs} refreshKey={0} />

      {/* Chart + Insights */}
      {policies.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">{t("insurance.byType")}</CardTitle></CardHeader>
            <CardContent>
              <InsuranceChart policies={policies} formatValue={fmtValue} />
            </CardContent>
          </Card>
          <InsuranceInsights policies={policies} />
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/insurance/policies">
          <Card className="hover:border-primary/40 transition-colors cursor-pointer group">
            <CardContent className="py-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Shield className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{t("insurance.policies")}</p>
                <p className="text-xs text-muted-foreground">{activePolicies.length} active</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/insurance/claims">
          <Card className="hover:border-primary/40 transition-colors cursor-pointer group">
            <CardContent className="py-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{t("sidebar.claims")}</p>
                <p className="text-xs text-muted-foreground">Track filed claims</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/insurance/files">
          <Card className="hover:border-primary/40 transition-colors cursor-pointer group">
            <CardContent className="py-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{t("sidebar.files")}</p>
                <p className="text-xs text-muted-foreground">Policy documents</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </>
  );
}
