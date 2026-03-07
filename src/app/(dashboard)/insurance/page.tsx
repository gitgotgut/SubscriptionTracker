"use client";

import { useState, useEffect, useCallback } from "react";
import { signOut } from "next-auth/react";
import { Plus, LogOut, Pencil, Trash2, Layers, Shield, FileText } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InsuranceForm, type InsuranceFormData, type PolicyForForm } from "@/components/insurance-form";
import { InsuranceChart } from "@/components/insurance-chart";
import { InsuranceInsights } from "@/components/insurance-insights";
import { InsuranceDocuments } from "@/components/insurance-documents";
import { InsuranceAIInsights } from "@/components/insurance-ai-insights";
import { ModuleSwitcher } from "@/components/module-switcher";
import { LanguageToggle } from "@/components/language-toggle";
import { toMonthlyCents, centsToDisplay, formatAmount } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";

type Document = {
  id: string; fileName: string; fileUrl: string; fileType: string; uploadedAt: string;
};

type Policy = PolicyForForm & {
  premium: string; readonly?: boolean;
  updatedAt: string; createdAt: string;
};

const CURRENCIES = ["USD","EUR","GBP","SEK","NOK","DKK","CHF","CAD","AUD","JPY"];

const TYPE_COLORS: Record<string, string> = {
  health: "#16a34a", car: "#d97706", home: "#2563eb", life: "#7c3aed",
  travel: "#0891b2", pet: "#ea580c", contents: "#db2777", liability: "#dc2626",
  other: "#475569",
};

export default function InsurancePage() {
  const t = useT();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayCurrency, setDisplayCurrency] = useState("USD");
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [householdName, setHouseholdName] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Policy | null>(null);
  const [editDocs, setEditDocs] = useState<Document[]>([]);
  const [docCounts, setDocCounts] = useState<Record<string, number>>({});
  const [hasAnalyzedDocs, setHasAnalyzedDocs] = useState(false);
  const [aiRefreshKey, setAiRefreshKey] = useState(0);

  const fetchPolicies = useCallback(async () => {
    const res = await fetch("/api/insurance");
    if (res.ok) setPolicies(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPolicies();
    fetch("/api/me").then(r => r.json()).then(u => {
      setDisplayCurrency(u.displayCurrency ?? "USD");
      setHouseholdId(u.householdId ?? null);
      setHouseholdName(u.householdName ?? null);
    });
    fetch("/api/exchange-rates").then(r => r.json()).then(d => {
      if (d.rates) setExchangeRates(d.rates);
    }).catch(() => {});
    // Check if any analyzed docs exist for AI insights
    fetch("/api/insurance/has-analyzed-docs").then(r => r.json()).then(d => {
      if (d.hasAnalyzed) setHasAnalyzedDocs(true);
    }).catch(() => {});
  }, [fetchPolicies]);

  const handleChangeCurrency = async (c: string) => {
    setDisplayCurrency(c);
    await fetch("/api/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ displayCurrency: c }) });
  };

  const fmtAmount = (cents: number, currency: string) => {
    if (currency === displayCurrency) return formatAmount(centsToDisplay(cents), displayCurrency);
    const rate = exchangeRates[currency];
    if (!rate) return formatAmount(centsToDisplay(cents), currency);
    const converted = Math.round(cents / rate);
    return formatAmount(centsToDisplay(converted), displayCurrency);
  };

  const fmtValue = (s: string) => formatAmount(s, displayCurrency);

  const activePolicies = policies.filter(p => p.status === "active");

  const totalMonthlyCents = activePolicies.reduce((sum, p) => {
    const monthly = toMonthlyCents(p.premiumCents, p.billingCycle);
    if (p.currency === displayCurrency) return sum + monthly;
    const rate = exchangeRates[p.currency];
    return sum + (rate ? Math.round(monthly / rate) : monthly);
  }, 0);

  const totalAnnualCents = totalMonthlyCents * 12;

  // Coverage summary: group active policies by type
  const coverageByType = activePolicies.reduce<Record<string, { count: number; monthlyCents: number }>>((acc, p) => {
    const monthly = toMonthlyCents(p.premiumCents, p.billingCycle);
    const converted = p.currency === displayCurrency ? monthly : (exchangeRates[p.currency] ? Math.round(monthly / exchangeRates[p.currency]) : monthly);
    if (!acc[p.type]) acc[p.type] = { count: 0, monthlyCents: 0 };
    acc[p.type].count++;
    acc[p.type].monthlyCents += converted;
    return acc;
  }, {});

  async function handleAdd(data: InsuranceFormData) {
    const res = await fetch("/api/insurance", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) { toast.error(t("toast.error")); throw new Error(); }
    toast.success(t("toast.policyAdded"));
    setFormOpen(false);
    fetchPolicies();
  }

  async function handleEdit(data: InsuranceFormData) {
    if (!editingPolicy) return;
    const res = await fetch(`/api/insurance/${editingPolicy.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) { toast.error(t("toast.error")); throw new Error(); }
    toast.success(t("toast.policyUpdated"));
    setEditingPolicy(null);
    fetchPolicies();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const res = await fetch(`/api/insurance/${deleteTarget.id}`, { method: "DELETE" });
    if (!res.ok) { toast.error(t("toast.error")); return; }
    toast.success(t("toast.policyDeleted"));
    setDeleteTarget(null);
    fetchPolicies();
  }

  async function openEditDialog(policy: Policy) {
    setEditDocs([]);
    setEditingPolicy(policy);
    try {
      const res = await fetch(`/api/insurance/${policy.id}/documents`);
      if (res.ok) {
        const docs = await res.json();
        setEditDocs(docs);
        setDocCounts((prev) => ({ ...prev, [policy.id]: docs.length }));
        if (docs.some((d: { parsedStatus?: string }) => d.parsedStatus === "completed")) {
          setHasAnalyzedDocs(true);
        }
      }
    } catch {
      // Leave docs empty on error
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-2">
            <Layers className="h-5 w-5 text-blue-600" />
            <span className="font-semibold tracking-tight">Hugo</span>
          </div>
        </header>
        <ModuleSwitcher />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2"><Skeleton className="h-4 w-28" /></CardHeader>
                <CardContent><Skeleton className="h-8 w-32" /></CardContent>
              </Card>
            ))}
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="py-4 px-5 flex items-center gap-4">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-5 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-blue-600" />
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
        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t("insurance.monthlyPremium")}</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold tracking-tight">{formatAmount(centsToDisplay(totalMonthlyCents), displayCurrency)}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t("insurance.annualPremium")}</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold tracking-tight">{formatAmount(centsToDisplay(totalAnnualCents), displayCurrency)}</p></CardContent>
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
                    <p className="text-xs text-muted-foreground">{data.count} {data.count === 1 ? t("insuranceDocuments.count", { count: "1" }).split(" ").pop() : t("insurance.policies").toLowerCase()}</p>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}

        {/* AI Coverage Insights — full width */}
        <InsuranceAIInsights hasAnalyzedDocs={hasAnalyzedDocs} refreshKey={aiRefreshKey} />

        {/* Main content: chart + insights on left, policy list on right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: chart + insights */}
          {policies.length > 0 && (
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">{t("insurance.byType")}</CardTitle></CardHeader>
                <CardContent>
                  <InsuranceChart policies={policies} formatValue={fmtValue} />
                </CardContent>
              </Card>
              <InsuranceInsights policies={policies} />
            </div>
          )}

          {/* Right column: policy list */}
          <div className={policies.length > 0 ? "lg:col-span-2 space-y-4" : "lg:col-span-3 space-y-4"}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t("insurance.policies")}</h2>
              <Button onClick={() => setFormOpen(true)} size="sm" className="gap-1">
                <Plus className="h-4 w-4" />{t("insurance.addPolicy")}
              </Button>
            </div>

            {policies.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Shield className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground">{t("insurance.noPoliciesYet")}</p>
                  <Button variant="outline" className="mt-4" onClick={() => setFormOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" />{t("insurance.addFirstPolicy")}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {policies.map((policy) => (
                  <Card key={policy.id} className="group">
                    <CardContent className="py-4 px-5">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${TYPE_COLORS[policy.type] ?? "#475569"}18` }}>
                            <Shield className="h-4 w-4" style={{ color: TYPE_COLORS[policy.type] ?? "#475569" }} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium truncate">{policy.provider}</p>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">{t(`insuranceTypes.${policy.type}`)}</Badge>
                              {policy.status === "cancelled" && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{t("insurance.cancelled")}</Badge>}
                              {policy.status === "expired" && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{t("insurance.expired")}</Badge>}
                              {policy.readonly && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{t("insurance.shared")}</Badge>}
                              {(docCounts[policy.id] ?? 0) > 0 && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5 shrink-0">
                                  <FileText className="h-3 w-3" />{docCounts[policy.id]}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                              <span>{t("insurance.renewsOn", { date: format(new Date(policy.renewalDate), "d MMM yyyy") })}</span>
                              {policy.policyNumber && <span>#{policy.policyNumber}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <p className="font-semibold tabular-nums">{fmtAmount(policy.premiumCents, policy.currency)}</p>
                            <p className="text-xs text-muted-foreground">/{policy.billingCycle === "annual" ? t("insurance.perYear") : t("insurance.perMonth")}</p>
                          </div>
                          {!policy.readonly && (
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(policy)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget(policy)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("insurance.addPolicy")}</DialogTitle></DialogHeader>
          <InsuranceForm householdId={householdId} defaultCurrency={displayCurrency} onSubmit={handleAdd} onCancel={() => setFormOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit dialog with documents */}
      <Dialog open={!!editingPolicy} onOpenChange={(open) => { if (!open) setEditingPolicy(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{t("insurance.editPolicy")}</DialogTitle></DialogHeader>
          {editingPolicy && (
            <div className="space-y-6">
              <InsuranceForm initial={editingPolicy} householdId={householdId} defaultCurrency={displayCurrency} onSubmit={handleEdit} onCancel={() => setEditingPolicy(null)} />
              <div className="border-t pt-4">
                <InsuranceDocuments
                  policyId={editingPolicy.id}
                  documents={editDocs}
                  onUpdate={() => {
                    fetch(`/api/insurance/${editingPolicy.id}/documents`)
                      .then(r => r.json())
                      .then(docs => {
                        setEditDocs(docs);
                        setDocCounts((prev) => ({ ...prev, [editingPolicy.id]: docs.length }));
                      })
                      .catch(() => {});
                  }}
                  onAnalysisComplete={() => {
                    setHasAnalyzedDocs(true);
                    setAiRefreshKey((k) => k + 1);
                  }}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("insurance.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("insurance.deleteConfirm", { name: deleteTarget?.provider ?? "" })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t("insurance.deleteTitle")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
