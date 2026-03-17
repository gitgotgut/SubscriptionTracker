"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, History, TrendingDown, Users, X, Mail, ExternalLink } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { SubscriptionForm, type SubscriptionFormData, type SubForForm } from "@/components/subscription-form";
import { SpendingChart } from "@/components/spending-chart";
import { SpendingTrendChart } from "@/components/spending-trend-chart";
import { SpendChangeBadge } from "@/components/spend-change-badge";
import { GmailImportModal } from "@/components/gmail-import-modal";
import { OutlookImportModal } from "@/components/outlook-import-modal";
import { SubscriptionLogo } from "@/components/subscription-logo";
import { getCancelUrl } from "@/lib/cancel-urls";
import { toMonthlyCents, centsToDisplay, formatAmount } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";

type Subscription = SubForForm & {
  amount: string; readonly?: boolean;
  updatedAt: string; createdAt: string;
};

type HistoryEntry = {
  id: string; field: string; oldValue: string | null;
  newValue: string | null; changedAt: string; relativeTime: string;
};

const CATEGORY_COLORS: Record<string, string> = {
  Streaming: "#7c3aed", Music: "#db2777", Gaming: "#d97706", "News & Media": "#0284c7",
  Fitness: "#16a34a", Food: "#ea580c", Software: "#2563eb", "Cloud Storage": "#0891b2",
  Education: "#4f46e5", "VPN & Security": "#dc2626", Productivity: "#65a30d",
  Shopping: "#c026d3", Other: "#475569",
};

const CATEGORY_VARIANT: Record<string, "streaming"|"music"|"gaming"|"news"|"fitness"|"food"|"software"|"cloud"|"education"|"security"|"productivity"|"shopping"|"other"> = {
  Streaming: "streaming", Music: "music", Gaming: "gaming", "News & Media": "news",
  Fitness: "fitness", Food: "food", Software: "software", "Cloud Storage": "cloud",
  Education: "education", "VPN & Security": "security", Productivity: "productivity",
  Shopping: "shopping", Other: "other",
};

function TrialBadge({ trialEndDate }: { trialEndDate: string }) {
  const t = useT();
  const days = differenceInDays(new Date(trialEndDate), new Date());
  const isExpired = days < 0;
  const isCritical = days >= 0 && days <= 3;
  const isSoon = days >= 0 && days <= 7;
  return (
    <span className={`text-xs font-medium ${isExpired ? "text-red-600" : isCritical ? "text-red-500 animate-pulse" : isSoon ? "text-amber-600" : "text-amber-500"}`}>
      {isExpired
        ? t("dashboard.trialEnded", { date: format(new Date(trialEndDate), "MMM d") })
        : days === 0
          ? t("dashboard.trialEndsToday")
          : isCritical
            ? t("dashboard.trialEndsCritical", { days: String(days) })
            : t("dashboard.trialEndsSoon", { days: String(days) })}
    </span>
  );
}

export default function SubscriptionsListPage() {
  const t = useT();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Subscription | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Subscription | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [historyTarget, setHistoryTarget] = useState<Subscription | null>(null);
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [displayCurrency, setDisplayCurrency] = useState("USD");
  const [rates, setRates] = useState<Record<string, number>>({ USD: 1 });
  const [categoryFilter, setCategoryFilter] = useState<Set<string>>(new Set());
  const [calcMode, setCalcMode] = useState(false);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailModalOpen, setGmailModalOpen] = useState(false);
  const [gmailNotice, setGmailNotice] = useState<string | null>(null);
  const [outlookConnected, setOutlookConnected] = useState(false);
  const [outlookModalOpen, setOutlookModalOpen] = useState(false);

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
      setOutlookConnected(!!u?.outlookConnected);
    });
    const params = new URLSearchParams(window.location.search);
    const gmailStatus = params.get("gmail");
    const outlookStatus = params.get("outlook");
    const joined = params.get("joined");
    if (gmailStatus === "connected") setGmailNotice(t("dashboard.gmailConnectedSuccess"));
    else if (gmailStatus === "denied") setGmailNotice(t("dashboard.gmailDenied"));
    else if (gmailStatus === "error") setGmailNotice(t("dashboard.gmailError"));
    else if (outlookStatus === "connected") { setOutlookConnected(true); setGmailNotice(t("dashboard.outlookConnectedSuccess")); }
    else if (outlookStatus === "denied") setGmailNotice(t("dashboard.outlookDenied"));
    else if (outlookStatus === "error") setGmailNotice(t("dashboard.outlookError"));
    else if (joined === "1") setGmailNotice(t("dashboard.joinedHousehold"));
    if (gmailStatus || outlookStatus || joined) window.history.replaceState({}, "", "/subscriptions/list");
    fetch("/api/exchange-rates").then(r => r.json()).then(d => {
      setRates(d.rates ?? { USD: 1 });
    });
  }, []);

  function convert(cents: number, fromCurrency: string): number {
    const from = rates[fromCurrency] ?? 1;
    const to = rates[displayCurrency] ?? 1;
    return Math.round(cents * (to / from));
  }

  const availableCategories = Array.from(new Set(subscriptions.map(s => s.category))).sort();

  function toggleCategory(cat: string) {
    setCategoryFilter(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
    setExcluded(new Set());
  }

  const filteredSubscriptions = categoryFilter.size === 0
    ? subscriptions
    : subscriptions.filter(s => categoryFilter.has(s.category));

  const activeSubs = filteredSubscriptions.filter(s => s.status !== "paused");
  const calcActiveSubs = calcMode ? activeSubs.filter(s => !excluded.has(s.id)) : activeSubs;
  const totalMonthlyCents = calcActiveSubs.reduce((sum, s) => sum + convert(toMonthlyCents(s.amountCents, s.billingCycle), s.currency), 0);
  const realMonthlyCents = activeSubs.reduce((sum, s) => sum + convert(toMonthlyCents(s.amountCents, s.billingCycle), s.currency), 0);
  const savingCents = realMonthlyCents - totalMonthlyCents;

  async function handleAdd(data: SubscriptionFormData) {
    const res = await fetch("/api/subscriptions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, renewalDate: data.renewalDate ? new Date(data.renewalDate).toISOString() : undefined, trialEndDate: data.trialEndDate ? new Date(data.trialEndDate).toISOString() : null }),
    });
    if (!res.ok) { toast.error(t("toast.error")); throw new Error("Failed"); }
    toast.success(t("toast.subscriptionAdded"));
    const created = await res.json();
    setSubscriptions(prev => [created, ...prev]);
    setModalOpen(false);
  }

  async function handleEdit(data: SubscriptionFormData) {
    if (!editTarget) return;
    const res = await fetch(`/api/subscriptions/${editTarget.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, renewalDate: data.renewalDate ? new Date(data.renewalDate).toISOString() : undefined, trialEndDate: data.trialEndDate ? new Date(data.trialEndDate).toISOString() : null }),
    });
    if (!res.ok) { toast.error(t("toast.error")); throw new Error("Failed"); }
    toast.success(t("toast.subscriptionUpdated"));
    const updated = await res.json();
    setSubscriptions(prev => prev.map(s => s.id === updated.id ? updated : s));
    setEditTarget(null); setModalOpen(false);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteError("");
    const res = await fetch(`/api/subscriptions/${deleteTarget.id}`, { method: "DELETE" });
    if (!res.ok) { toast.error(t("toast.error")); setDeleteError("Failed to delete."); return; }
    toast.success(t("toast.subscriptionDeleted"));
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
    <>
      {/* Summary strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-sm font-medium text-muted-foreground mb-1">{t("dashboard.monthlySpend")}</p>
            <p className="text-3xl font-bold">{formatAmount(centsToDisplay(totalMonthlyCents), displayCurrency)}</p>
            <SpendChangeBadge />
            {calcMode && savingCents > 0 && <p className="text-sm text-green-600 font-medium mt-1">{t("dashboard.savingPerMonth", { amount: formatAmount(centsToDisplay(savingCents), displayCurrency) })}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-sm font-medium text-muted-foreground mb-1">{t("dashboard.annualSpend")}</p>
            <p className="text-3xl font-bold">{formatAmount(centsToDisplay(totalMonthlyCents * 12), displayCurrency)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Category filter pills */}
      {availableCategories.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setCategoryFilter(new Set()); setExcluded(new Set()); }}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              categoryFilter.size === 0
                ? "bg-foreground text-background border-foreground"
                : "bg-background text-muted-foreground border-border hover:border-foreground hover:text-foreground"
            }`}
          >
            {t("dashboard.all")}
          </button>
          {availableCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                categoryFilter.has(cat)
                  ? "text-white border-transparent"
                  : "bg-background text-muted-foreground border-border hover:border-foreground hover:text-foreground"
              }`}
              style={categoryFilter.has(cat) ? { backgroundColor: CATEGORY_COLORS[cat] ?? "#475569", borderColor: CATEGORY_COLORS[cat] ?? "#475569" } : undefined}
            >
              {t(`categories.${cat}`) !== `categories.${cat}` ? t(`categories.${cat}`) : cat}
            </button>
          ))}
        </div>
      )}

      {/* Chart + List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {subscriptions.length > 0 && (
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardContent className="pt-5 pb-4 px-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">{t("dashboard.byCategory")}</p>
                <SpendingChart
                  subscriptions={calcActiveSubs.map(s => ({ ...s, amountCents: convert(s.amountCents, s.currency), billingCycle: s.billingCycle }))}
                  formatValue={(s) => formatAmount(s, displayCurrency)}
                />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-4 px-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{t("dashboard.spendingTrend")}</p>
                <SpendingTrendChart
                  formatValue={(s) => formatAmount(s, displayCurrency)}
                  categories={categoryFilter.size > 0 ? Array.from(categoryFilter) : undefined}
                />
              </CardContent>
            </Card>
          </div>
        )}

        <div className={subscriptions.length > 0 ? "lg:col-span-2" : "lg:col-span-3"}>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-lg font-semibold">{t("dashboard.subscriptions")}</h2>
            <div className="flex items-center gap-2">
              <Button size="sm" variant={calcMode ? "secondary" : "outline"}
                onClick={() => { setCalcMode(!calcMode); setExcluded(new Set()); }}>
                <TrendingDown className="h-4 w-4 mr-1" />{calcMode ? t("dashboard.exitCalculator") : t("dashboard.cancelCalculator")}
              </Button>
              {gmailConnected && (
                <Button size="sm" variant="outline" onClick={() => setGmailModalOpen(true)}>
                  <Mail className="h-4 w-4 mr-1" />{t("dashboard.importFromGmail")}
                </Button>
              )}
              {outlookConnected && (
                <Button size="sm" variant="outline" onClick={() => setOutlookModalOpen(true)}>
                  <Mail className="h-4 w-4 mr-1" />{t("dashboard.importFromOutlook")}
                </Button>
              )}
              <Button size="sm" onClick={() => { setEditTarget(null); setModalOpen(true); }}>
                <Plus className="h-4 w-4 mr-1" />{t("dashboard.add")}
              </Button>
            </div>
          </div>

          {calcMode && (
            <p className="text-xs text-muted-foreground mb-3">{t("dashboard.calcHint")}</p>
          )}

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="py-4 px-5 flex items-center gap-4">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-5 w-20" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : subscriptions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">{t("dashboard.noSubscriptionsYet")}</p>
                <Button onClick={() => { setEditTarget(null); setModalOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />{t("dashboard.addFirstSubscription")}
                </Button>
              </CardContent>
            </Card>
          ) : filteredSubscriptions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground text-sm">{t("dashboard.noSubscriptionsMatchFilter")}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredSubscriptions.map((sub) => {
                const isExcluded = excluded.has(sub.id);
                return (
                  <Card key={sub.id} className={`transition-opacity ${sub.status === "paused" ? "opacity-60" : ""} ${calcMode && isExcluded ? "opacity-40" : ""}`}>
                    <CardContent className="py-4 px-5 flex items-center gap-4">
                      {calcMode && sub.status !== "paused" && (
                        <input type="checkbox" checked={!isExcluded}
                          onChange={() => setExcluded(prev => { const next = new Set(prev); next.has(sub.id) ? next.delete(sub.id) : next.add(sub.id); return next; })}
                          className="h-4 w-4 rounded border-gray-300 shrink-0" />
                      )}
                      <SubscriptionLogo name={sub.name} size={32} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium truncate">{sub.name}</span>
                          <Badge variant={CATEGORY_VARIANT[sub.category] ?? "other"}>{t(`categories.${sub.category}`) !== `categories.${sub.category}` ? t(`categories.${sub.category}`) : sub.category}</Badge>
                          {sub.status === "paused" && <Badge variant="secondary">{t("dashboard.paused")}</Badge>}
                          {sub.status === "trial" && <Badge variant="outline" className="border-amber-400 text-amber-700">{t("dashboard.trial")}</Badge>}
                          {sub.readonly && <Badge variant="outline" className="border-primary/40 text-primary"><Users className="h-3 w-3 mr-1" />{t("dashboard.shared")}</Badge>}
                        </div>
                        {sub.status === "trial" && sub.trialEndDate && (
                          <TrialBadge trialEndDate={sub.trialEndDate} />
                        )}
                        {sub.notes && <p className="text-xs text-muted-foreground mt-0.5 truncate">{sub.notes}</p>}
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {t("dashboard.renewsOn", { date: format(new Date(sub.renewalDate), "MMM d, yyyy") })}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold">
                          {formatAmount(centsToDisplay(convert(sub.amountCents, sub.currency)), displayCurrency)}
                          <span className="text-xs text-muted-foreground ml-1">/{sub.billingCycle === "annual" ? t("dashboard.perYear") : t("dashboard.perMonth")}</span>
                        </p>
                        {sub.billingCycle === "annual" && (
                          <p className="text-xs text-muted-foreground">
                            {formatAmount(centsToDisplay(convert(toMonthlyCents(sub.amountCents, sub.billingCycle), sub.currency)), displayCurrency)}{t("charts.perMo")}
                          </p>
                        )}
                        {sub.monthlySavingsHintCents != null && sub.monthlySavingsHintCents > 0 && (
                          <p className="text-xs text-green-600">{t("dashboard.savePerMonthAnnually", { amount: formatAmount(centsToDisplay(convert(sub.monthlySavingsHintCents, sub.currency)), displayCurrency) })}</p>
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

      {/* Gmail notice banner */}
      {gmailNotice && (
        <div className="fixed bottom-4 right-4 bg-card border rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 text-sm z-50">
          <Mail className="h-4 w-4 text-primary shrink-0" />
          {gmailNotice}
          <button onClick={() => setGmailNotice(null)} className="ml-2 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <GmailImportModal
        open={gmailModalOpen}
        onClose={() => setGmailModalOpen(false)}
        onImported={() => { fetchSubscriptions(); setGmailModalOpen(false); }}
      />

      <OutlookImportModal
        open={outlookModalOpen}
        onClose={() => setOutlookModalOpen(false)}
        onImported={() => { fetchSubscriptions(); setOutlookModalOpen(false); }}
      />

      {/* Add/Edit modal */}
      <Dialog open={modalOpen} onOpenChange={(o) => { if (!o) { setModalOpen(false); setEditTarget(null); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editTarget ? t("dashboard.editSubscription") : t("dashboard.addSubscription")}</DialogTitle></DialogHeader>
          <SubscriptionForm initial={editTarget ?? undefined} householdId={householdId}
            defaultCurrency={displayCurrency}
            onSubmit={editTarget ? handleEdit : handleAdd}
            onCancel={() => { setModalOpen(false); setEditTarget(null); }} />
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) { setDeleteTarget(null); setDeleteError(""); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dashboard.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dashboard.deleteConfirm", { name: deleteTarget?.name ?? "" })}
              {deleteError && <span className="block mt-2 text-destructive">{deleteError}</span>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteTarget && getCancelUrl(deleteTarget.name) && (
            <a
              href={getCancelUrl(deleteTarget.name)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary hover:bg-primary/15 transition-colors"
            >
              <ExternalLink className="h-4 w-4 shrink-0" />
              <span>
                <span className="font-medium">{t("dashboard.manageSubscription", { name: deleteTarget.name })}</span>
                <span className="block text-xs text-primary/70 mt-0.5">{t("dashboard.cancelHint", { name: deleteTarget.name })}</span>
              </span>
            </a>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>{t("dashboard.keepIt")}</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>{t("dashboard.removeFromHugo")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* History panel */}
      <Dialog open={!!historyTarget} onOpenChange={(o) => { if (!o) { setHistoryTarget(null); setHistoryEntries([]); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-4 w-4" /> {t("dashboard.historyTitle", { name: historyTarget?.name ?? "" })}
            </DialogTitle>
          </DialogHeader>
          {historyLoading ? (
            <p className="text-sm text-muted-foreground py-4">{t("dashboard.historyLoading")}</p>
          ) : historyEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">{t("dashboard.noChanges")}</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {historyEntries.map((h) => (
                <div key={h.id} className="flex gap-3 text-sm">
                  <div className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                  <div>
                    <p><span className="font-medium">{h.field}</span> changed from <span className="line-through text-muted-foreground">{h.oldValue ?? "—"}</span> to <span className="font-medium">{h.newValue ?? "—"}</span></p>
                    <p className="text-xs text-muted-foreground">{h.relativeTime}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Button variant="outline" size="sm" className="mt-2" onClick={() => { setHistoryTarget(null); setHistoryEntries([]); }}>
            <X className="h-4 w-4 mr-1" /> {t("common.close")}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
