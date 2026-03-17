import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateProposalSchema } from "@/lib/validations/insurance-proposal";

function formatProposal(p: any) {
  return {
    ...p,
    quotedPremium: (p.quotedPremiumCents / 100).toFixed(2),
  };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.insuranceProposal.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = updateProposalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { quotedPremium, validUntil, ...rest } = parsed.data;

  const proposal = await prisma.insuranceProposal.update({
    where: { id },
    data: {
      ...rest,
      ...(quotedPremium !== undefined ? { quotedPremiumCents: quotedPremium } : {}),
      ...(validUntil !== undefined ? { validUntil: validUntil ? new Date(validUntil) : null } : {}),
    },
  });

  return NextResponse.json(formatProposal(proposal));
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.insuranceProposal.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.insuranceProposal.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
