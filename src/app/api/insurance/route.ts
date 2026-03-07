import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createInsurancePolicySchema } from "@/lib/validations/insurance";
import { formatInsurancePolicy } from "@/lib/format-insurance";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { householdId: true },
  });

  const policies = await prisma.insurancePolicy.findMany({
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
    policies.map((p) => ({ ...formatInsurancePolicy(p), readonly: p.userId !== userId }))
  );
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createInsurancePolicySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { premium, renewalDate, ...rest } = parsed.data;

    const policy = await prisma.insurancePolicy.create({
      data: {
        ...rest,
        premiumCents: premium,
        renewalDate: renewalDate ? new Date(renewalDate) : new Date(),
        userId: session.user.id,
      },
    });

    return NextResponse.json(formatInsurancePolicy(policy), { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
