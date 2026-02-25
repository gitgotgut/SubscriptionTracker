import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { subMonths, startOfMonth, endOfMonth, format } from "date-fns";
import { toMonthlyCents } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const months: { label: string; start: Date; end: Date }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = subMonths(now, i);
    months.push({
      label: format(d, "MMM yyyy"),
      start: startOfMonth(d),
      end: endOfMonth(d),
    });
  }

  // All user subscriptions (including cancelled — for history)
  const subscriptions = await prisma.subscription.findMany({
    where: { userId: session.user.id },
    select: { id: true, amountCents: true, billingCycle: true, status: true, createdAt: true },
  });

  // amountCents change history in the window
  const history = await prisma.subscriptionHistory.findMany({
    where: {
      userId: session.user.id,
      field: "amountCents",
      changedAt: { gte: months[0].start },
    },
    orderBy: { changedAt: "asc" },
  });

  // For each month, reconstruct what amountCents was at that point
  const monthlyTotals = months.map((month) => {
    let total = 0;
    for (const sub of subscriptions) {
      // Skip if sub didn't exist yet
      if (sub.createdAt > month.end) continue;
      // Only count active/trial subs (skip paused)
      if (sub.status === "paused") continue;

      // Find the most recent amountCents change up to this month's end
      const changesForSub = history
        .filter((h) => h.subscriptionId === sub.id && h.changedAt <= month.end)
        .sort((a, b) => b.changedAt.getTime() - a.changedAt.getTime());

      const effectiveAmount =
        changesForSub.length > 0
          ? parseInt(changesForSub[0].newValue ?? String(sub.amountCents))
          : sub.amountCents;

      total += toMonthlyCents(effectiveAmount, sub.billingCycle);
    }
    return { label: month.label, totalCents: total };
  });

  return NextResponse.json({ months: monthlyTotals });
}
