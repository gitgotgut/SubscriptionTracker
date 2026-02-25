import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createSubscriptionSchema } from "@/lib/validations/subscription";
import { formatSubscription } from "@/lib/format-subscription";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { householdId: true },
  });

  const subscriptions = await prisma.subscription.findMany({
    where: {
      OR: [
        { userId: session.user.id },
        ...(user?.householdId ? [{ householdId: user.householdId }] : []),
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  const userId = session.user.id;
  return NextResponse.json(
    subscriptions.map((s) => ({ ...formatSubscription(s), readonly: s.userId !== userId }))
  );
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createSubscriptionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { amount, renewalDate, trialEndDate, monthlySavingsHint, ...rest } = parsed.data;

    const subscription = await prisma.subscription.create({
      data: {
        ...rest,
        amountCents: amount,
        renewalDate: new Date(renewalDate),
        trialEndDate: trialEndDate ? new Date(trialEndDate) : null,
        monthlySavingsHintCents: monthlySavingsHint ?? null,
        userId: session.user.id,
      },
    });

    return NextResponse.json(formatSubscription(subscription), { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
