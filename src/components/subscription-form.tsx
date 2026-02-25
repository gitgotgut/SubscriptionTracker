"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { centsToDisplay } from "@/lib/utils";
import { format } from "date-fns";

export type SubscriptionFormData = {
  name: string; category: string; amount: string; currency: string;
  billingCycle: string; renewalDate: string; status: string;
  trialEndDate: string | null; notes: string | null;
  monthlySavingsHint: string | null; householdId: string | null;
};

export type SubForForm = {
  id: string; name: string; category: string; amountCents: number;
  currency: string; billingCycle: string; renewalDate: string; status: string;
  trialEndDate: string | null; notes: string | null;
  monthlySavingsHintCents: number | null; householdId: string | null;
};

type Props = {
  initial?: SubForForm; householdId?: string | null;
  onSubmit: (data: SubscriptionFormData) => Promise<void>; onCancel: () => void;
};

const CATEGORIES = ["Streaming", "Fitness", "Food", "Software", "Other"];
const BILLING_CYCLES = [{ value: "monthly", label: "Monthly" }, { value: "annual", label: "Annual" }];
const STATUSES = [{ value: "active", label: "Active" }, { value: "paused", label: "Paused" }, { value: "trial", label: "Free trial" }];

export function SubscriptionForm({ initial, householdId, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState(initial?.category ?? "Other");
  const [amount, setAmount] = useState(initial ? centsToDisplay(initial.amountCents) : "");
  const [currency] = useState(initial?.currency ?? "USD");
  const [billingCycle, setBillingCycle] = useState(initial?.billingCycle ?? "monthly");
  const [renewalDate, setRenewalDate] = useState(initial ? format(new Date(initial.renewalDate), "yyyy-MM-dd") : "");
  const [status, setStatus] = useState(initial?.status ?? "active");
  const [trialEndDate, setTrialEndDate] = useState(initial?.trialEndDate ? format(new Date(initial.trialEndDate), "yyyy-MM-dd") : "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [annualPrice, setAnnualPrice] = useState("");
  const [shareWithHousehold, setShareWithHousehold] = useState(!!initial?.householdId);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const monthlySavingsHint = (() => {
    if (billingCycle !== "monthly" || !annualPrice || !amount) return null;
    const monthly = parseFloat(amount), annual = parseFloat(annualPrice);
    if (isNaN(monthly) || isNaN(annual)) return null;
    const saving = monthly - annual / 12;
    return saving > 0 ? saving.toFixed(2) : null;
  })();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError("Name is required.");
    if (!/^\d+(\.\d{1,2})?$/.test(amount)) return setError("Enter a valid amount (e.g. 9.99).");
    if (!renewalDate) return setError("Renewal date is required.");
    if (status === "trial" && !trialEndDate) return setError("Trial end date is required.");
    setLoading(true);
    try {
      await onSubmit({
        name, category, amount, currency, billingCycle, renewalDate, status,
        trialEndDate: status === "trial" && trialEndDate ? trialEndDate : null,
        notes: notes.trim() || null, monthlySavingsHint,
        householdId: shareWithHousehold && householdId ? householdId : null,
      });
    } catch { setError("Something went wrong. Please try again."); }
    finally { setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-destructive bg-destructive/10 rounded-md p-3">{error}</p>}

      <div className="space-y-2">
        <Label htmlFor="sub-name">Name</Label>
        <Input id="sub-name" placeholder="e.g. Netflix" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Billing cycle</Label>
          <Select value={billingCycle} onValueChange={setBillingCycle}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{BILLING_CYCLES.map((b) => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="sub-amount">Amount ({currency})</Label>
          <Input id="sub-amount" placeholder="9.99" value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" required />
        </div>
      </div>

      {billingCycle === "monthly" && (
        <div className="space-y-2">
          <Label htmlFor="sub-annual">Annual price — total/year (optional)</Label>
          <Input id="sub-annual" placeholder="e.g. 99.99" value={annualPrice} onChange={(e) => setAnnualPrice(e.target.value)} inputMode="decimal" />
          {monthlySavingsHint && <p className="text-xs text-green-600 font-medium">Paying annually saves ${monthlySavingsHint}/mo</p>}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sub-renewal">Next renewal</Label>
          <Input id="sub-renewal" type="date" value={renewalDate} onChange={(e) => setRenewalDate(e.target.value)} required />
        </div>
        {status === "trial" && (
          <div className="space-y-2">
            <Label htmlFor="sub-trial">Trial ends</Label>
            <Input id="sub-trial" type="date" value={trialEndDate} onChange={(e) => setTrialEndDate(e.target.value)} required />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="sub-notes">Notes (optional)</Label>
        <Textarea id="sub-notes" placeholder="e.g. Shared with partner, cancel before March" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={200} rows={2} className="resize-none" />
      </div>

      {householdId && (
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input type="checkbox" checked={shareWithHousehold} onChange={(e) => setShareWithHousehold(e.target.checked)} className="rounded border-gray-300" />
          Share with household
        </label>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>Cancel</Button>
        <Button type="submit" disabled={loading}>{loading ? "Saving…" : initial ? "Save changes" : "Add subscription"}</Button>
      </div>
    </form>
  );
}
