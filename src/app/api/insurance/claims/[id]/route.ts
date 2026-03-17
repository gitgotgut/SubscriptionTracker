import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateClaimSchema } from "@/lib/validations/insurance-claim";

function formatClaim(c: any) {
  return {
    ...c,
    amount: c.amountCents != null ? (c.amountCents / 100).toFixed(2) : null,
  };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.insuranceClaim.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = updateClaimSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { amount, claimDate, ...rest } = parsed.data;

  const claim = await prisma.insuranceClaim.update({
    where: { id },
    data: {
      ...rest,
      ...(claimDate !== undefined ? { claimDate: new Date(claimDate) } : {}),
      ...(amount !== undefined ? { amountCents: amount } : {}),
    },
    include: { policy: { select: { provider: true, type: true } } },
  });

  return NextResponse.json(formatClaim(claim));
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.insuranceClaim.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.insuranceClaim.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
