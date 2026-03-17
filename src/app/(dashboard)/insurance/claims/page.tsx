"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { centsToDisplay, formatAmount } from "@/lib/utils";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";

type Policy = { id: string; provider: string; type: string };
type Claim = {
  id: string;
  policyId: string;
  title: string;
  description?: string;
  claimDate: string;
  amountCents?: number;
  amount?: string;
  status: string;
  referenceNumber?: string;
  notes?: string;
  policy: { provider: string; type: string };
  createdAt: string;
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-100 text-blue-700",
  submitted: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  denied: "bg-red-100 text-red-700",
  closed: "bg-gray-100 text-gray-700",
};

export default function InsuranceClaimsPage() {
  const t = useT();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayCurrency, setDisplayCurrency] = useState("USD");
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Claim | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Claim | null>(null);
  // Form state
  const [formPolicyId, setFormPolicyId] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formStatus, setFormStatus] = useState("open");
  const [formRef, setFormRef] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchClaims = useCallback(async () => {
    const res = await fetch("/api/insurance/claims");
    if (res.ok) setClaims(await res.json());
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/insurance/claims").then(r => r.json()),
      fetch("/api/insurance").then(r => r.json()),
      fetch("/api/me").then(r => r.json()),
    ]).then(([claimsData, pols, me]) => {
      setClaims(claimsData);
      setPolicies(pols);
      if (me?.displayCurrency) setDisplayCurrency(me.displayCurrency);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  function resetForm() {
    setFormPolicyId(policies[0]?.id ?? "");
    setFormTitle("");
    setFormDescription("");
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormAmount("");
    setFormStatus("open");
    setFormRef("");
    setFormNotes("");
  }

  function openAdd() {
    setEditTarget(null);
    resetForm();
    setFormOpen(true);
  }

  function openEdit(claim: Claim) {
    setEditTarget(claim);
    setFormPolicyId(claim.policyId);
    setFormTitle(claim.title);
    setFormDescription(claim.description ?? "");
    setFormDate(claim.claimDate.split("T")[0]);
    setFormAmount(claim.amount ?? "");
    setFormStatus(claim.status);
    setFormRef(claim.referenceNumber ?? "");
    setFormNotes(claim.notes ?? "");
    setFormOpen(true);
  }

  async function handleSubmit() {
    setSubmitting(true);
    const body: any = {
      policyId: formPolicyId,
      title: formTitle,
      description: formDescription || null,
      claimDate: formDate,
      amount: formAmount || null,
      status: formStatus,
      referenceNumber: formRef || null,
      notes: formNotes || null,
    };

    try {
      const url = editTarget ? `/api/insurance/claims/${editTarget.id}` : "/api/insurance/claims";
      const method = editTarget ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      toast.success(editTarget ? "Claim updated" : "Claim filed");
      setFormOpen(false);
      fetchClaims();
    } catch {
      toast.error(t("toast.error"));
    }
    setSubmitting(false);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const res = await fetch(`/api/insurance/claims/${deleteTarget.id}`, { method: "DELETE" });
    if (!res.ok) { toast.error(t("toast.error")); return; }
    toast.success("Claim deleted");
    setDeleteTarget(null);
    fetchClaims();
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {t("sidebar.claims")}
        </h1>
        <Button size="sm" onClick={openAdd} disabled={policies.length === 0}>
          <Plus className="h-4 w-4 mr-1" />File claim
        </Button>
      </div>

      {claims.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">No claims filed yet.</p>
            {policies.length > 0 && (
              <Button variant="outline" className="mt-4" onClick={openAdd}>
                <Plus className="h-4 w-4 mr-1" />File your first claim
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {claims.map((claim) => (
            <Card key={claim.id} className="group">
              <CardContent className="py-4 px-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">{claim.title}</p>
                      <Badge className={`text-[10px] px-1.5 py-0 ${STATUS_COLORS[claim.status] ?? STATUS_COLORS.open}`}>
                        {claim.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span>{claim.policy.provider}</span>
                      <span>{format(new Date(claim.claimDate), "d MMM yyyy")}</span>
                      {claim.referenceNumber && <span>Ref: {claim.referenceNumber}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {claim.amountCents != null && (
                      <p className="font-semibold tabular-nums">
                        {formatAmount(centsToDisplay(claim.amountCents), displayCurrency)}
                      </p>
                    )}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(claim)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget(claim)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTarget ? "Edit claim" : "File a claim"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Policy</Label>
              <Select value={formPolicyId} onValueChange={setFormPolicyId}>
                <SelectTrigger><SelectValue placeholder="Select policy" /></SelectTrigger>
                <SelectContent>
                  {policies.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.provider} ({t(`insuranceTypes.${p.type}`)})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="e.g. Water damage claim" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date of incident</Label>
                <Input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Amount (optional)</Label>
                <Input value={formAmount} onChange={e => setFormAmount(e.target.value)} placeholder="1500.00" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formStatus} onValueChange={setFormStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["open", "submitted", "approved", "denied", "closed"].map(s => (
                      <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Reference # (optional)</Label>
                <Input value={formRef} onChange={e => setFormRef(e.target.value)} placeholder="CLM-12345" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea value={formNotes} onChange={e => setFormNotes(e.target.value)} rows={2} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setFormOpen(false)}>{t("common.cancel")}</Button>
              <Button onClick={handleSubmit} disabled={submitting || !formPolicyId || !formTitle || !formDate}>
                {submitting ? t("common.saving") : editTarget ? t("common.save") : "File claim"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete claim</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete &ldquo;{deleteTarget?.title}&rdquo;? This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
