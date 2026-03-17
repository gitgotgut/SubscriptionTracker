"use client";

import { useState, useEffect } from "react";
import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HouseholdPanel } from "@/components/household-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/lib/i18n";

export default function SubscriptionsHouseholdPage() {
  const t = useT();
  const [userId, setUserId] = useState<string | null>(null);
  const [householdName, setHouseholdName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((u) => {
        if (u?.id) setUserId(u.id);
        if (u?.householdName) setHouseholdName(u.householdName);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <>
      <h1 className="text-xl font-semibold flex items-center gap-2">
        <Users className="h-5 w-5" />
        {t("household.title")}
      </h1>

      {loading ? (
        <Card>
          <CardContent className="py-8">
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      ) : userId ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {householdName ?? t("household.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <HouseholdPanel
              userId={userId}
              onCreated={(_id, name) => {
                setHouseholdName(name);
              }}
              onLeft={() => {
                setHouseholdName(null);
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">{t("common.loading")}</p>
          </CardContent>
        </Card>
      )}
    </>
  );
}
