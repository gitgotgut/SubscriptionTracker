"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Shield, FileText } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { InsuranceForm, type InsuranceFormData, type PolicyForForm } from "@/components/insurance-form";
import { InsuranceDocuments } from "@/components/insurance-documents";
import { centsToDisplay, formatAmount } from "@/lib/utils";
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

const TYPE_COLORS: Record<string, string> = {
  health: "#16a34a", car: "#d97706", home: "#2563eb", life: "#7c3aed",
  travel: "#0891b2", pet: "#ea580c", contents: "#db2777", liability: "#dc2626",
  other: "#475569",
};

export default function InsurancePoliciesPage() {
  const t = useT();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayCurrency, setDisplayCurrency] = useState("USD");
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Policy | null>(null);
  const [editDocs, setEditDocs] = useState<Document[]>([]);
  const [docCounts, setDocCounts] = useState<Record<string, number>>({});
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
      setHouseholdId(u.householdId ?? null);
    });
    fetch("/api/exchange-rates").then(r => r.json()).then(d => {
      if (d.rates) setExchangeRates(d.rates);
    }).catch(() => {});
  }, [fetchPolicies]);

  const fmtAmount = (cents: number, currency: string) => {
    if (currency === displayCurrency) return formatAmount(centsToDisplay(cents), displayCurrency);
    const rate = exchangeRates[currency];
    if (!rate) return formatAmount(centsToDisplay(cents), currency);
    const converted = Math.round(cents / rate);
    return formatAmount(centsToDisplay(converted), displayCurrency);
  };

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
    } catch {}
  }

  if (loading) {
    return (
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
    );
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t("insurance.policies")}</h1>
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
    </>
  );
}
