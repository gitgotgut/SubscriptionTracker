"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, Trash2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { LanguageToggle } from "@/components/language-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import { signOut } from "next-auth/react";

const CURRENCIES = ["USD", "EUR", "GBP", "SEK", "NOK", "DKK", "CHF", "CAD", "AUD", "JPY"];

export default function SubscriptionsSettingsPage() {
  const t = useT();
  const [loading, setLoading] = useState(true);
  const [emailReminders, setEmailReminders] = useState(true);
  const [displayCurrency, setDisplayCurrency] = useState("USD");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((u) => {
        if (u?.emailReminders !== undefined) setEmailReminders(u.emailReminders);
        if (u?.displayCurrency) setDisplayCurrency(u.displayCurrency);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function toggleReminders() {
    const next = !emailReminders;
    setEmailReminders(next);
    await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailReminders: next }),
    });
    toast.success(next ? "Email reminders enabled" : "Email reminders disabled");
  }

  async function handleChangeCurrency(val: string) {
    setDisplayCurrency(val);
    await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayCurrency: val }),
    });
    toast.success(`Display currency set to ${val}`);
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    const res = await fetch("/api/account", { method: "DELETE" });
    if (res.ok) {
      signOut({ callbackUrl: "/login" });
    } else {
      toast.error(t("toast.error"));
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <>
      <h1 className="text-xl font-semibold">{t("sidebar.settings")}</h1>

      {/* Email reminders */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            {emailReminders ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4 text-muted-foreground" />}
            Email reminders
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Get notified 7 days before subscriptions renew and 3 days before trials convert to paid.
          </p>
          <Button
            variant={emailReminders ? "secondary" : "default"}
            size="sm"
            onClick={toggleReminders}
          >
            {emailReminders ? "Disable reminders" : "Enable reminders"}
          </Button>
        </CardContent>
      </Card>

      {/* Display currency */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Display currency
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            All amounts will be converted to this currency using live exchange rates.
          </p>
          <Select value={displayCurrency} onValueChange={handleChangeCurrency}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Language */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Language</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Switch between English and Danish.
          </p>
          <LanguageToggle />
        </CardContent>
      </Card>

      {/* Danger zone: delete account */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base text-destructive flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            Delete account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteConfirmOpen(true)}
          >
            Delete my account
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your account, all subscriptions, insurance policies, and household data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteAccount}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete everything"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
