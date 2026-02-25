import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Convert integer cents to a display string like "9,999.99" */
export function centsToDisplay(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Convert a display string like "9.99" to integer cents */
export function displayToCents(value: string): number {
  const parsed = parseFloat(value);
  if (isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}

/** Normalise a subscription's amountCents to monthly cents */
export function toMonthlyCents(amountCents: number, billingCycle: string): number {
  if (billingCycle === "annual") return Math.round(amountCents / 12);
  return amountCents;
}
