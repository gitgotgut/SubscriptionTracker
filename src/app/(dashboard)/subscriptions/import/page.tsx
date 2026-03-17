"use client";

import { useState, useEffect, useRef } from "react";
import { Mail, CheckCircle2, XCircle, Plus, FileText, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GmailImportModal } from "@/components/gmail-import-modal";
import { OutlookImportModal } from "@/components/outlook-import-modal";
import { BankTranscriptModal } from "@/components/bank-transcript-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import Link from "next/link";
import type { BankTranscriptCandidate } from "@/lib/validations/bank-transcript";

interface BankTranscript {
  id: string;
  fileName: string;
  fileType: string;
  uploadedAt: string;
  parsedStatus: string;
  candidates: BankTranscriptCandidate[] | null;
}

export default function SubscriptionsImportPage() {
  const t = useT();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [gmailConnected, setGmailConnected] = useState(false);
  const [outlookConnected, setOutlookConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [gmailModalOpen, setGmailModalOpen] = useState(false);
  const [outlookModalOpen, setOutlookModalOpen] = useState(false);

  const [transcripts, setTranscripts] = useState<BankTranscript[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedTranscript, setSelectedTranscript] = useState<BankTranscript | null>(null);
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);

  // Fetch initial data
  useEffect(() => {
    Promise.all([
      fetch("/api/me").then((r) => r.json()),
      fetch("/api/subscriptions/transcripts").then((r) => r.json()),
    ])
      .then(([u, txs]) => {
        setGmailConnected(!!u?.gmailConnected);
        setOutlookConnected(!!u?.outlookConnected);
        setTranscripts(txs);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Poll for processing transcripts
  useEffect(() => {
    const hasProcessing = transcripts.some((t) => t.parsedStatus === "processing");

    if (hasProcessing && !pollInterval) {
      const interval = setInterval(() => {
        fetch("/api/subscriptions/transcripts")
          .then((r) => r.json())
          .then((txs) => setTranscripts(txs));
      }, 3000);
      setPollInterval(interval);
    } else if (!hasProcessing && pollInterval) {
      clearInterval(pollInterval);
      setPollInterval(null);
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [transcripts, pollInterval]);

  // Handle file upload
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/subscriptions/upload-transcript", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        toast.error(error.error || "Upload failed");
        return;
      }

      const data = await res.json();
      toast.success("File uploaded, analysing...");

      // Refresh transcript list
      const txsRes = await fetch("/api/subscriptions/transcripts");
      const txs = await txsRes.json();
      setTranscripts(txs);

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  // Handle review
  function handleReview(transcript: BankTranscript) {
    setSelectedTranscript(transcript);
    setBankModalOpen(true);
  }

  // Handle delete
  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/subscriptions/transcripts/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setTranscripts((prev) => prev.filter((t) => t.id !== id));
        toast.success("Transcript deleted");
      } else {
        toast.error("Delete failed");
      }
    } catch (error) {
      toast.error("Delete failed");
    }
  }

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

      {/* Bank Statement card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-5 w-5" />
            Bank Statement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload a bank export (PDF, CSV, or TXT) to detect recurring subscriptions.
          </p>

          {/* Upload input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.csv,.txt"
            onChange={handleFileChange}
            className="hidden"
          />

          <Button
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            <FileText className="h-4 w-4 mr-1" />
            Upload Statement
          </Button>

          {/* Transcripts list */}
          {transcripts.length > 0 && (
            <div className="space-y-2 border-t pt-4">
              <p className="text-xs font-medium text-muted-foreground">
                Recent uploads
              </p>
              {transcripts.map((transcript) => (
                <div
                  key={transcript.id}
                  className="flex items-center justify-between p-2 bg-muted rounded-md text-sm"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{transcript.fileName}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {transcript.parsedStatus === "pending" && (
                        <Badge variant="secondary" className="text-[10px]">
                          <Loader2 className="h-2 w-2 mr-1 animate-spin" />
                          Queued
                        </Badge>
                      )}
                      {transcript.parsedStatus === "processing" && (
                        <Badge variant="secondary" className="text-[10px]">
                          <Loader2 className="h-2 w-2 mr-1 animate-spin" />
                          Analysing
                        </Badge>
                      )}
                      {transcript.parsedStatus === "completed" && (
                        <Badge variant="secondary" className="text-[10px]">
                          {transcript.candidates?.length ?? 0} found
                        </Badge>
                      )}
                      {transcript.parsedStatus === "failed" && (
                        <Badge variant="destructive" className="text-[10px]">
                          <AlertCircle className="h-2 w-2 mr-1" />
                          Failed
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {transcript.parsedStatus === "completed" &&
                      (transcript.candidates?.length ?? 0) > 0 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleReview(transcript)}
                        >
                          Review
                        </Button>
                      )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(transcript.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
      {selectedTranscript && (
        <BankTranscriptModal
          open={bankModalOpen}
          fileName={selectedTranscript.fileName}
          candidates={selectedTranscript.candidates ?? []}
          onClose={() => setBankModalOpen(false)}
          onAdded={() => {
            // Refresh transcript list after adding
            fetch("/api/subscriptions/transcripts")
              .then((r) => r.json())
              .then((txs) => setTranscripts(txs));
          }}
        />
      )}
    </>
  );
}
