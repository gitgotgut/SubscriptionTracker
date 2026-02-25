"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, CheckSquare, Square, AlertCircle } from "lucide-react";

type Candidate = {
  serviceName: string;
  amount: number;
  currency: string;
  billingCycle: "monthly" | "annual";
  renewalDate: string;
  category: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
};

type Step = "idle" | "scanning" | "review" | "importing" | "done" | "error";

export function GmailImportModal({ open, onClose, onImported }: Props) {
  const [step, setStep] = useState<Step>("idle");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [scanned, setScanned] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  async function runScan() {
    setStep("scanning");
    setErrorMsg("");
    try {
      const res = await fetch("/api/gmail/import", { method: "POST" });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Scan failed");
      }
      const data = await res.json();
      setCandidates(data.candidates ?? []);
      setScanned(data.scanned ?? 0);
      setSelected(new Set(data.candidates.map((_: Candidate, i: number) => i)));
      setStep("review");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Unknown error");
      setStep("error");
    }
  }

  function toggle(i: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  async function importSelected() {
    setStep("importing");
    const toImport = candidates.filter((_, i) => selected.has(i));
    await Promise.all(
      toImport.map((c) =>
        fetch("/api/subscriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: c.serviceName,
            amount: String(c.amount),
            currency: c.currency,
            billingCycle: c.billingCycle,
            renewalDate: c.renewalDate,
            category: c.category,
            status: "active",
          }),
        })
      )
    );
    setStep("done");
    onImported();
  }

  function handleClose() {
    setStep("idle");
    setCandidates([]);
    setSelected(new Set());
    setErrorMsg("");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            Import from Gmail
          </DialogTitle>
        </DialogHeader>

        {/* Idle */}
        {step === "idle" && (
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Subtrack will scan your last 6 months of Gmail receipts and use AI to detect
              recurring subscriptions. Only you can see your emails — nothing is stored.
            </p>
            <Button onClick={runScan} className="w-full">
              Scan my inbox
            </Button>
          </div>
        )}

        {/* Scanning */}
        {step === "scanning" && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm text-muted-foreground">Scanning your inbox with AI…</p>
          </div>
        )}

        {/* Error */}
        {step === "error" && (
          <div className="space-y-3 py-2">
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              {errorMsg}
            </div>
            <Button variant="outline" onClick={() => setStep("idle")} className="w-full">
              Try again
            </Button>
          </div>
        )}

        {/* Review */}
        {step === "review" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Scanned {scanned} emails — found {candidates.length} subscription
              {candidates.length !== 1 ? "s" : ""}. Uncheck any you don&apos;t want.
            </p>

            {candidates.length === 0 ? (
              <p className="text-sm text-center py-4 text-muted-foreground">
                No subscription receipts detected.
              </p>
            ) : (
              <ul className="divide-y max-h-72 overflow-y-auto">
                {candidates.map((c, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 py-2 cursor-pointer"
                    onClick={() => toggle(i)}
                  >
                    {selected.has(i) ? (
                      <CheckSquare className="h-4 w-4 text-blue-600 shrink-0" />
                    ) : (
                      <Square className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.serviceName}</p>
                      <p className="text-xs text-muted-foreground">
                        Renews {c.renewalDate}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium">
                        {c.currency} {c.amount.toFixed(2)}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {c.billingCycle}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={importSelected}
                disabled={selected.size === 0}
              >
                Import {selected.size} subscription{selected.size !== 1 ? "s" : ""}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Importing */}
        {step === "importing" && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm text-muted-foreground">Importing subscriptions…</p>
          </div>
        )}

        {/* Done */}
        {step === "done" && (
          <div className="space-y-3 py-2 text-center">
            <p className="text-sm font-medium text-green-600">
              {selected.size} subscription{selected.size !== 1 ? "s" : ""} imported successfully.
            </p>
            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
