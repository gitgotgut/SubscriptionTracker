import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createProposalSchema } from "@/lib/validations/insurance-proposal";

function formatProposal(p: any) {
  return {
    ...p,
    quotedPremium: (p.quotedPremiumCents / 100).toFixed(2),
  };
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const proposals = await prisma.insuranceProposal.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(proposals.map(formatProposal));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createProposalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { quotedPremium, validUntil, ...rest } = parsed.data;

  const proposal = await prisma.insuranceProposal.create({
    data: {
      userId: session.user.id,
      quotedPremiumCents: quotedPremium,
      validUntil: validUntil ? new Date(validUntil) : null,
      ...rest,
    },
  });

  return NextResponse.json(formatProposal(proposal), { status: 201 });
}
