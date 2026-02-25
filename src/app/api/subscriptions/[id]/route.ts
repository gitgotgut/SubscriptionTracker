import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateSubscriptionSchema } from "@/lib/validations/subscription";
import { formatSubscription } from "@/lib/format-subscription";

type RouteParams = { params: Promise<{ id: string }> };

const TRACKED_FIELDS = [
  "name", "amountCents", "billingCycle", "status", "renewalDate", "category", "currency",
] as const;

async function getOwnedSubscription(userId: string, id: string) {
  return prisma.subscription.findFirst({ where: { id, userId } });
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { id } = await params;
  const existing = await getOwnedSubscription(userId, id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const parsed = updateSubscriptionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { amount, renewalDate, trialEndDate, monthlySavingsHint, ...rest } = parsed.data;

    const updateData: Record<string, unknown> = {
      ...rest,
      ...(amount !== undefined && { amountCents: amount }),
      ...(renewalDate !== undefined && { renewalDate: new Date(renewalDate) }),
      ...(trialEndDate !== undefined && { trialEndDate: trialEndDate ? new Date(trialEndDate) : null }),
      ...(monthlySavingsHint !== undefined && { monthlySavingsHintCents: monthlySavingsHint ?? null }),
    };

    // Diff old vs new to build history rows
    const existingRecord = existing as Record<string, unknown>;
    const historyEntries: { field: string; oldValue: string | null; newValue: string | null }[] = [];
    for (const field of TRACKED_FIELDS) {
      const newVal = updateData[field];
      if (newVal !== undefined) {
        const oldVal = existingRecord[field];
        const oldStr = oldVal instanceof Date ? oldVal.toISOString() : String(oldVal ?? "");
        const newStr = newVal instanceof Date ? (newVal as Date).toISOString() : String(newVal ?? "");
        if (oldStr !== newStr) {
          historyEntries.push({ field, oldValue: oldStr, newValue: newStr });
        }
      }
    }

    const [updated] = await prisma.$transaction([
      prisma.subscription.update({ where: { id }, data: updateData }),
      ...(historyEntries.length > 0
        ? [prisma.subscriptionHistory.createMany({
            data: historyEntries.map((e) => ({ subscriptionId: id, userId, ...e })),
          })]
        : []),
    ]);

    return NextResponse.json(formatSubscription(updated));
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getOwnedSubscription(session.user.id, id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.subscription.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
