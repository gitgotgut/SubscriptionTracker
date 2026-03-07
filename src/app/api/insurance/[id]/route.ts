import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateInsurancePolicySchema } from "@/lib/validations/insurance";
import { formatInsurancePolicy } from "@/lib/format-insurance";

type RouteParams = { params: Promise<{ id: string }> };

async function getOwnedPolicy(userId: string, id: string) {
  return prisma.insurancePolicy.findFirst({ where: { id, userId } });
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getOwnedPolicy(session.user.id, id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const parsed = updateInsurancePolicySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { premium, renewalDate, ...rest } = parsed.data;
    const updateData: Record<string, unknown> = {
      ...rest,
      ...(premium !== undefined && { premiumCents: premium }),
      ...(renewalDate !== undefined && { renewalDate: new Date(renewalDate) }),
    };

    const updated = await prisma.insurancePolicy.update({ where: { id }, data: updateData });
    return NextResponse.json(formatInsurancePolicy(updated));
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
  const existing = await getOwnedPolicy(session.user.id, id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.insurancePolicy.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
