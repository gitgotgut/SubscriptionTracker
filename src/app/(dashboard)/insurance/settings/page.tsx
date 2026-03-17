"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, ShieldAlert, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";

export default function InsuranceSettingsPage() {
  const t = useT();
  const [loading, setLoading] = useState(true);
  const [emailReminders, setEmailReminders] = useState(true);
  const [renewalDays, setRenewalDays] = useState("30");

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((u) => {
        if (u?.emailReminders !== undefined) setEmailReminders(u.emailReminders);
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
    toast.success(next ? "Renewal reminders enabled" : "Renewal reminders disabled");
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
      <h1 className="text-xl font-semibold flex items-center gap-2">
        <Settings2 className="h-5 w-5" />
        {t("sidebar.settings")}
      </h1>

      <p className="text-sm text-muted-foreground">
        Configure notifications and preferences for your insurance policies.
      </p>

      {/* Renewal reminders */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            {emailReminders ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4 text-muted-foreground" />}
            Renewal reminders
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Get notified before your insurance policies are up for renewal so you can review and compare options.
          </p>
          <div className="flex items-center gap-4">
            <Button
              variant={emailReminders ? "secondary" : "default"}
              size="sm"
              onClick={toggleReminders}
            >
              {emailReminders ? "Disable reminders" : "Enable reminders"}
            </Button>
            {emailReminders && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Notify</span>
                <Select value={renewalDays} onValueChange={setRenewalDays}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="60">60 days</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">before renewal</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Coverage gap alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            Coverage gap alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Hugo&apos;s AI analysis will flag potential gaps in your insurance coverage. When enabled, gap alerts appear on the Insurance home page.
          </p>
          <p className="text-xs text-muted-foreground">
            Coverage analysis runs automatically when you add or update policies. No additional setup is needed.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
