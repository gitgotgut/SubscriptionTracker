"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, FileText } from "lucide-react";
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

type Proposal = {
  id: string;
  provider: string;
  type: string;
  quotedPremiumCents: number;
  quotedPremium: string;
  currency: string;
  billingCycle: string;
  validUntil?: string;
  status: string;
  notes?: string;
  createdAt: string;
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-blue-100 text-blue-700",
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  expired: "bg-gray-100 text-gray-700",
};

const INSURANCE_TYPES = ["health", "car", "home", "life", "travel", "pet", "contents", "liability", "other"];

export default function InsuranceProposalsPage() {
  const t = useT();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayCurrency, setDisplayCurrency] = useState("USD");
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Proposal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Proposal | null>(null);
  // Form state
  const [formProvider, setFormProvider] = useState("");
  const [formType, setFormType] = useState("other");
  const [formPremium, setFormPremium] = useState("");
  const [formCurrency, setFormCurrency] = useState("USD");
  const [formCycle, setFormCycle] = useState("monthly");
  const [formValidUntil, setFormValidUntil] = useState("");
  const [formStatus, setFormStatus] = useState("pending");
  const [formNotes, setFormNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchProposals = useCallback(async () => {
    const res = await fetch("/api/insurance/proposals");
    if (res.ok) setProposals(await res.json());
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/insurance/proposals").then(r => r.json()),
      fetch("/api/me").then(r => r.json()),
    ]).then(([props, me]) => {
      setProposals(props);
      if (me?.displayCurrency) {
        setDisplayCurrency(me.displayCurrency);
        setFormCurrency(me.displayCurrency);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  function resetForm() {
    setFormProvider("");
    setFormType("other");
    setFormPremium("");
    setFormCurrency(displayCurrency);
    setFormCycle("monthly");
    setFormValidUntil("");
    setFormStatus("pending");
    setFormNotes("");
  }

  function openAdd() {
    setEditTarget(null);
    resetForm();
    setFormOpen(true);
  }

  function openEdit(p: Proposal) {
    setEditTarget(p);
    setFormProvider(p.provider);
    setFormType(p.type);
    setFormPremium(p.quotedPremium);
    setFormCurrency(p.currency);
    setFormCycle(p.billingCycle);
    setFormValidUntil(p.validUntil ? p.validUntil.split("T")[0] : "");
    setFormStatus(p.status);
    setFormNotes(p.notes ?? "");
    setFormOpen(true);
  }

  async function handleSubmit() {
    setSubmitting(true);
    const body: any = {
      provider: formProvider,
      type: formType,
      quotedPremium: formPremium,
      currency: formCurrency,
      billingCycle: formCycle,
      validUntil: formValidUntil || null,
      status: formStatus,
      notes: formNotes || null,
    };

    try {
      const url = editTarget ? `/api/insurance/proposals/${editTarget.id}` : "/api/insurance/proposals";
      const method = editTarget ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      toast.success(editTarget ? "Proposal updated" : "Proposal added");
      setFormOpen(false);
      fetchProposals();
    } catch {
      toast.error(t("toast.error"));
    }
    setSubmitting(false);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const res = await fetch(`/api/insurance/proposals/${deleteTarget.id}`, { method: "DELETE" });
    if (!res.ok) { toast.error(t("toast.error")); return; }
    toast.success("Proposal deleted");
    setDeleteTarget(null);
    fetchProposals();
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
          <FileText className="h-5 w-5" />
          {t("sidebar.proposals")}
        </h1>
        <Button size="sm" onClick={openAdd}>
          <Plus className="h-4 w-4 mr-1" />Add proposal
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Track insurance quotes and proposals to compare before committing.
      </p>

      {proposals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">No proposals yet.</p>
            <Button variant="outline" className="mt-4" onClick={openAdd}>
              <Plus className="h-4 w-4 mr-1" />Add your first proposal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {proposals.map((proposal) => (
            <Card key={proposal.id} className="group">
              <CardContent className="py-4 px-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">{proposal.provider}</p>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">{t(`insuranceTypes.${proposal.type}`)}</Badge>
                      <Badge className={`text-[10px] px-1.5 py-0 ${STATUS_COLORS[proposal.status] ?? STATUS_COLORS.pending}`}>
                        {proposal.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span>{formatAmount(proposal.quotedPremium, proposal.currency)}/{proposal.billingCycle === "annual" ? "yr" : "mo"}</span>
                      {proposal.validUntil && (
                        <span>Valid until {format(new Date(proposal.validUntil), "d MMM yyyy")}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <p className="font-semibold tabular-nums">
                      {formatAmount(proposal.quotedPremium, proposal.currency)}
                    </p>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(proposal)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget(proposal)}>
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
            <DialogTitle>{editTarget ? "Edit proposal" : "Add proposal"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Provider</Label>
              <Input value={formProvider} onChange={e => setFormProvider(e.target.value)} placeholder="e.g. Allianz" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={formType} onValueChange={setFormType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {INSURANCE_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{t(`insuranceTypes.${type}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Billing cycle</Label>
                <Select value={formCycle} onValueChange={setFormCycle}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quoted premium</Label>
                <Input value={formPremium} onChange={e => setFormPremium(e.target.value)} placeholder="99.99" />
              </div>
              <div className="space-y-2">
                <Label>Valid until (optional)</Label>
                <Input type="date" value={formValidUntil} onChange={e => setFormValidUntil(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formStatus} onValueChange={setFormStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["pending", "accepted", "rejected", "expired"].map(s => (
                    <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea value={formNotes} onChange={e => setFormNotes(e.target.value)} rows={2} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setFormOpen(false)}>{t("common.cancel")}</Button>
              <Button onClick={handleSubmit} disabled={submitting || !formProvider || !formPremium}>
                {submitting ? t("common.saving") : editTarget ? t("common.save") : "Add proposal"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete proposal</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete the proposal from {deleteTarget?.provider}?</AlertDialogDescription>
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
