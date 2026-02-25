"use client";

import { useState, useEffect, useCallback } from "react";
import { signOut } from "next-auth/react";
import { Plus, LogOut, Pencil, Trash2, History, Layers, TrendingDown, Users, X, Mail } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubscriptionForm, type SubscriptionFormData, type SubForForm } from "@/components/subscription-form";
import { SpendingChart } from "@/components/spending-chart";
import { GmailImportModal } from "@/components/gmail-import-modal";
import { toMonthlyCents, centsToDisplay } from "@/lib/utils";

type Subscription = SubForForm & {
  amount: string; readonly?: boolean;
  updatedAt: string; createdAt: string;
};

type HistoryEntry = {
  id: string; field: string; oldValue: string | null;
  newValue: string | null; changedAt: string; relativeTime: string;
};

const CATEGORY_VARIANT: Record<string, "streaming"|"fitness"|"food"|"software"|"other"> = {
  Streaming: "streaming", Fitness: "fitness", Food: "food", Software: "software", Other: "other",
};

const CURRENCIES = ["USD","EUR","GBP","SEK","NOK","DKK","CHF","CAD","AUD","JPY"];

function TrialBadge({ trialEndDate }: { trialEndDate: string }) {
  const days = differenceInDays(new Date(trialEndDate), new Date());
  const isExpired = days < 0;
  const isSoon = days <= 7 && days >= 0;
  return (
    <span className={`text-xs font-medium ${isExpired ? "text-red-600" : isSoon ? "text-amber-600" : "text-amber-500"}`}>
      {isExpired ? `Trial ended ${format(new Date(trialEndDate), "MMM d")}` : days === 0 ? "Trial ends today" : `Trial ends in ${days}d`}
    </span>
  );
}

export default function DashboardPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Subscription | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Subscription | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [historyTarget, setHistoryTarget] = useState<Subscription | null>(null);
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  // Currency
  const [displayCurrency, setDisplayCurrency] = useState("USD");
  const [rates, setRates] = useState<Record<string, number>>({ USD: 1 });
  const [ratesFallback, setRatesFallback] = useState(false);
  // Cancel calculator
  const [calcMode, setCalcMode] = useState(false);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  // Household
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [householdName, setHouseholdName] = useState<string | null>(null);
  // Gmail
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailModalOpen, setGmailModalOpen] = useState(false);
  const [gmailNotice, setGmailNotice] = useState<string | null>(null);

  const fetchSubscriptions = useCallback(async () => {
    const res = await fetch("/api/subscriptions");
    if (res.ok) setSubscriptions(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchSubscriptions(); }, [fetchSubscriptions]);

  useEffect(() => {
    fetch("/api/me").then(r => r.json()).then(u => {
      if (u?.displayCurrency) setDisplayCurrency(u.displayCurrency);
      if (u?.householdId) setHouseholdId(u.householdId);
      setGmailConnected(!!u?.gmailConnected);
    });
    // Show a notice if Google redirected back with a status param
    const params = new URLSearchParams(window.location.search);
    const gmailStatus = params.get("gmail");
    if (gmailStatus === "connected") setGmailNotice("Gmail connected successfully.");
    else if (gmailStatus === "denied") setGmailNotice("Gmail access was denied.");
    else if (gmailStatus === "error") setGmailNotice("Gmail connection failed. Please try again.");
    if (gmailStatus) window.history.replaceState({}, "", "/dashboard");
    fetch("/api/exchange-rates").then(r => r.json()).then(d => {
      setRates(d.rates ?? { USD: 1 });
      setRatesFallback(d.fallback ?? false);
    });
    fetch("/api/household").then(r => r.json()).then(h => {
      if (h?.name) setHouseholdName(h.name);
    });
  }, []);

  function convert(cents: number, fromCurrency: string): number {
    const from = rates[fromCurrency] ?? 1;
    const to = rates[displayCurrency] ?? 1;
    return Math.round(cents * (to / from));
  }

  // Only active subs count toward totals (paused excluded); also apply calculator exclusions
  const activeSubs = subscriptions.filter(s => s.status !== "paused");
  const calcActiveSubs = calcMode ? activeSubs.filter(s => !excluded.has(s.id)) : activeSubs;
  const totalMonthlyCents = calcActiveSubs.reduce((sum, s) => sum + convert(toMonthlyCents(s.amountCents, s.billingCycle), s.currency), 0);
  const realMonthlyCents = activeSubs.reduce((sum, s) => sum + convert(toMonthlyCents(s.amountCents, s.billingCycle), s.currency), 0);
  const savingCents = realMonthlyCents - totalMonthlyCents;

  const currencySymbol: Record<string, string> = { USD: "$", EUR: "€", GBP: "£", SEK: "kr", NOK: "kr", DKK: "kr", CHF: "CHF", CAD: "CA$", AUD: "A$", JPY: "¥" };
  const sym = currencySymbol[displayCurrency] ?? displayCurrency + " ";

  async function handleChangeCurrency(val: string) {
    setDisplayCurrency(val);
    await fetch("/api/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ displayCurrency: val }) });
  }

  async function handleAdd(data: SubscriptionFormData) {
    const res = await fetch("/api/subscriptions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, renewalDate: new Date(data.renewalDate).toISOString(), trialEndDate: data.trialEndDate ? new Date(data.trialEndDate).toISOString() : null }),
    });
    if (!res.ok) throw new Error("Failed");
    const created = await res.json();
    setSubscriptions(prev => [created, ...prev]);
    setModalOpen(false);
  }

  async function handleEdit(data: SubscriptionFormData) {
    if (!editTarget) return;
    const res = await fetch(`/api/subscriptions/${editTarget.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, renewalDate: new Date(data.renewalDate).toISOString(), trialEndDate: data.trialEndDate ? new Date(data.trialEndDate).toISOString() : null }),
    });
    if (!res.ok) throw new Error("Failed");
    const updated = await res.json();
    setSubscriptions(prev => prev.map(s => s.id === updated.id ? updated : s));
    setEditTarget(null); setModalOpen(false);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteError("");
    const res = await fetch(`/api/subscriptions/${deleteTarget.id}`, { method: "DELETE" });
    if (!res.ok) { setDeleteError("Failed to delete."); return; }
    setSubscriptions(prev => prev.filter(s => s.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  async function openHistory(sub: Subscription) {
    setHistoryTarget(sub);
    setHistoryLoading(true);
    const res = await fetch(`/api/subscriptions/${sub.id}/history`);
    if (res.ok) setHistoryEntries(await res.json());
    setHistoryLoading(false);
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-blue-600" />
            <span className="font-semibold tracking-tight">Subtrack</span>
            {householdName && <span className="text-xs text-muted-foreground border rounded-full px-2 py-0.5 flex items-center gap-1"><Users className="h-3 w-3" />{householdName}</span>}
          </div>
          <div className="flex items-center gap-2">
            {ratesFallback && <span className="text-xs text-amber-600">Rates unavailable — showing USD</span>}
            {gmailConnected ? (
              <Button variant="ghost" size="sm" className="text-xs gap-1 text-green-700"
                onClick={async () => { await fetch("/api/gmail/disconnect", { method: "DELETE" }); setGmailConnected(false); }}>
                <Mail className="h-3.5 w-3.5" />Gmail
              </Button>
            ) : (
              <Button variant="ghost" size="sm" className="text-xs gap-1"
                onClick={() => { window.location.href = "/api/gmail/connect"; }}>
                <Mail className="h-3.5 w-3.5" />Connect Gmail
              </Button>
            )}
            <Select value={displayCurrency} onValueChange={handleChangeCurrency}>
              <SelectTrigger className="w-24 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>
              <LogOut className="h-4 w-4 mr-1" />Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Summary strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Monthly spend</CardTitle></CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{sym}{centsToDisplay(totalMonthlyCents)}</p>
              {calcMode && savingCents > 0 && <p className="text-sm text-green-600 font-medium mt-1">Saving {sym}{centsToDisplay(savingCents)}/mo</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Annual spend</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">{sym}{centsToDisplay(totalMonthlyCents * 12)}</p></CardContent>
          </Card>
        </div>

        {/* Chart + List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {subscriptions.length > 0 && (
            <Card className="lg:col-span-1">
              <CardHeader><CardTitle className="text-base">By category</CardTitle></CardHeader>
              <CardContent><SpendingChart subscriptions={calcActiveSubs} /></CardContent>
            </Card>
          )}

          <div className={subscriptions.length > 0 ? "lg:col-span-2" : "lg:col-span-3"}>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="text-lg font-semibold">Subscriptions</h2>
              <div className="flex items-center gap-2">
                <Button size="sm" variant={calcMode ? "secondary" : "outline"}
                  onClick={() => { setCalcMode(!calcMode); setExcluded(new Set()); }}>
                  <TrendingDown className="h-4 w-4 mr-1" />{calcMode ? "Exit calculator" : "Cancel calculator"}
                </Button>
                {gmailConnected && (
                  <Button size="sm" variant="outline" onClick={() => setGmailModalOpen(true)}>
                    <Mail className="h-4 w-4 mr-1" />Import from Gmail
                  </Button>
                )}
                <Button size="sm" onClick={() => { setEditTarget(null); setModalOpen(true); }}>
                  <Plus className="h-4 w-4 mr-1" />Add
                </Button>
              </div>
            </div>

            {calcMode && (
              <p className="text-xs text-muted-foreground mb-3">Uncheck subscriptions to see your potential savings.</p>
            )}

            {loading ? (
              <p className="text-muted-foreground text-sm">Loading…</p>
            ) : subscriptions.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground mb-4">No subscriptions yet.</p>
                  <Button onClick={() => { setEditTarget(null); setModalOpen(true); }}>
                    <Plus className="h-4 w-4 mr-2" />Add your first subscription
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {subscriptions.map((sub) => {
                  const isExcluded = excluded.has(sub.id);
                  return (
                    <Card key={sub.id} className={`transition-opacity ${sub.status === "paused" ? "opacity-60" : ""} ${calcMode && isExcluded ? "opacity-40" : ""}`}>
                      <CardContent className="py-4 px-5 flex items-center gap-4">
                        {calcMode && sub.status !== "paused" && (
                          <input type="checkbox" checked={!isExcluded}
                            onChange={() => setExcluded(prev => { const next = new Set(prev); next.has(sub.id) ? next.delete(sub.id) : next.add(sub.id); return next; })}
                            className="h-4 w-4 rounded border-gray-300 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium truncate">{sub.name}</span>
                            <Badge variant={CATEGORY_VARIANT[sub.category] ?? "other"}>{sub.category}</Badge>
                            {sub.status === "paused" && <Badge variant="secondary">Paused</Badge>}
                            {sub.status === "trial" && <Badge variant="outline" className="border-amber-400 text-amber-700">Trial</Badge>}
                            {sub.readonly && <Badge variant="outline" className="border-blue-300 text-blue-700"><Users className="h-3 w-3 mr-1" />Shared</Badge>}
                          </div>
                          {sub.status === "trial" && sub.trialEndDate && (
                            <TrialBadge trialEndDate={sub.trialEndDate} />
                          )}
                          {sub.notes && <p className="text-xs text-muted-foreground mt-0.5 truncate">{sub.notes}</p>}
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Renews {format(new Date(sub.renewalDate), "MMM d, yyyy")}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-semibold">
                            {sub.currency !== "USD" ? "" : "$"}{sub.amount}
                            <span className="text-xs text-muted-foreground ml-1">/{sub.billingCycle === "annual" ? "yr" : "mo"}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {sym}{centsToDisplay(convert(toMonthlyCents(sub.amountCents, sub.billingCycle), sub.currency))}/mo
                          </p>
                          {sub.monthlySavingsHintCents != null && sub.monthlySavingsHintCents > 0 && (
                            <p className="text-xs text-green-600">Save ${centsToDisplay(sub.monthlySavingsHintCents)}/mo annually</p>
                          )}
                        </div>
                        {!sub.readonly && (
                          <div className="flex gap-1 shrink-0">
                            <Button variant="ghost" size="icon" onClick={() => openHistory(sub)} aria-label="History">
                              <History className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => { setEditTarget(sub); setModalOpen(true); }}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(sub)} className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Gmail notice banner */}
      {gmailNotice && (
        <div className="fixed bottom-4 right-4 bg-card border rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 text-sm z-50">
          <Mail className="h-4 w-4 text-blue-600 shrink-0" />
          {gmailNotice}
          <button onClick={() => setGmailNotice(null)} className="ml-2 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Gmail import modal */}
      <GmailImportModal
        open={gmailModalOpen}
        onClose={() => setGmailModalOpen(false)}
        onImported={() => { fetchSubscriptions(); setGmailModalOpen(false); }}
      />

      {/* Add/Edit modal */}
      <Dialog open={modalOpen} onOpenChange={(o) => { if (!o) { setModalOpen(false); setEditTarget(null); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editTarget ? "Edit subscription" : "Add subscription"}</DialogTitle></DialogHeader>
          <SubscriptionForm initial={editTarget ?? undefined} householdId={householdId}
            onSubmit={editTarget ? handleEdit : handleAdd}
            onCancel={() => { setModalOpen(false); setEditTarget(null); }} />
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) { setDeleteTarget(null); setDeleteError(""); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete subscription</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.
              {deleteError && <span className="block mt-2 text-destructive">{deleteError}</span>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* History panel */}
      <Dialog open={!!historyTarget} onOpenChange={(o) => { if (!o) { setHistoryTarget(null); setHistoryEntries([]); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-4 w-4" /> Change history — {historyTarget?.name}
            </DialogTitle>
          </DialogHeader>
          {historyLoading ? (
            <p className="text-sm text-muted-foreground py-4">Loading…</p>
          ) : historyEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No changes recorded yet.</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {historyEntries.map((h) => (
                <div key={h.id} className="flex gap-3 text-sm">
                  <div className="mt-1 h-2 w-2 rounded-full bg-blue-400 shrink-0" />
                  <div>
                    <p><span className="font-medium">{h.field}</span> changed from <span className="line-through text-muted-foreground">{h.oldValue ?? "—"}</span> to <span className="font-medium">{h.newValue ?? "—"}</span></p>
                    <p className="text-xs text-muted-foreground">{h.relativeTime}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Button variant="outline" size="sm" className="mt-2" onClick={() => { setHistoryTarget(null); setHistoryEntries([]); }}>
            <X className="h-4 w-4 mr-1" /> Close
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
