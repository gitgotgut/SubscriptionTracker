"use client";

import { useState, useEffect } from "react";
import { Mail, CheckCircle2, XCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GmailImportModal } from "@/components/gmail-import-modal";
import { OutlookImportModal } from "@/components/outlook-import-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/lib/i18n";
import Link from "next/link";

export default function SubscriptionsImportPage() {
  const t = useT();
  const [gmailConnected, setGmailConnected] = useState(false);
  const [outlookConnected, setOutlookConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [gmailModalOpen, setGmailModalOpen] = useState(false);
  const [outlookModalOpen, setOutlookModalOpen] = useState(false);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((u) => {
        setGmailConnected(!!u?.gmailConnected);
        setOutlookConnected(!!u?.outlookConnected);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <>
      <h1 className="text-xl font-semibold">{t("sidebar.import")}</h1>
      <p className="text-sm text-muted-foreground">
        Connect your email to automatically detect subscriptions from receipts and billing emails.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Gmail card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-5 w-5" />
              Gmail
              {!loading && (
                gmailConnected
                  ? <CheckCircle2 className="h-4 w-4 text-green-600 ml-auto" />
                  : <XCircle className="h-4 w-4 text-muted-foreground ml-auto" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <Skeleton className="h-20 w-full" />
            ) : gmailConnected ? (
              <>
                <p className="text-sm text-green-700 font-medium">Connected</p>
                <p className="text-xs text-muted-foreground">
                  Hugo can scan your Gmail receipts to detect subscriptions.
                </p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setGmailModalOpen(true)}>
                    <Mail className="h-4 w-4 mr-1" />{t("dashboard.importFromGmail")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      await fetch("/api/gmail/disconnect", { method: "DELETE" });
                      setGmailConnected(false);
                    }}
                  >
                    Disconnect
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Connect your Google account to scan your last 6 months of billing emails.
                </p>
                <Button
                  size="sm"
                  onClick={() => { window.location.href = "/api/gmail/connect"; }}
                >
                  <Mail className="h-4 w-4 mr-1" />{t("dashboard.connectGmail")}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Outlook card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-5 w-5" />
              Outlook
              {!loading && (
                outlookConnected
                  ? <CheckCircle2 className="h-4 w-4 text-primary ml-auto" />
                  : <XCircle className="h-4 w-4 text-muted-foreground ml-auto" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <Skeleton className="h-20 w-full" />
            ) : outlookConnected ? (
              <>
                <p className="text-sm text-primary font-medium">Connected</p>
                <p className="text-xs text-muted-foreground">
                  Hugo can scan your Outlook receipts to detect subscriptions.
                </p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setOutlookModalOpen(true)}>
                    <Mail className="h-4 w-4 mr-1" />{t("dashboard.importFromOutlook")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      await fetch("/api/outlook/disconnect", { method: "DELETE" });
                      setOutlookConnected(false);
                    }}
                  >
                    Disconnect
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Connect your Microsoft account (Outlook, Hotmail, Live) to scan billing emails.
                </p>
                <Button
                  size="sm"
                  onClick={() => { window.location.href = "/api/outlook/connect"; }}
                >
                  <Mail className="h-4 w-4 mr-1" />{t("dashboard.connectOutlook")}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Manual add CTA */}
      <Card>
        <CardContent className="py-6 flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-primary/15 text-primary flex items-center justify-center">
            <Plus className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Add manually</p>
            <p className="text-xs text-muted-foreground">
              You can always add subscriptions by hand from the subscriptions list.
            </p>
          </div>
          <Link href="/subscriptions/list">
            <Button variant="outline" size="sm">Go to list</Button>
          </Link>
        </CardContent>
      </Card>

      <GmailImportModal
        open={gmailModalOpen}
        onClose={() => setGmailModalOpen(false)}
        onImported={() => setGmailModalOpen(false)}
      />
      <OutlookImportModal
        open={outlookModalOpen}
        onClose={() => setOutlookModalOpen(false)}
        onImported={() => setOutlookModalOpen(false)}
      />
    </>
  );
}
