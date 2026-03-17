import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createClaimSchema } from "@/lib/validations/insurance-claim";

function formatClaim(c: any) {
  return {
    ...c,
    amount: c.amountCents != null ? (c.amountCents / 100).toFixed(2) : null,
  };
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const claims = await prisma.insuranceClaim.findMany({
    where: { userId: session.user.id },
    include: { policy: { select: { provider: true, type: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(claims.map(formatClaim));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createClaimSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { policyId, title, description, claimDate, amount, status, referenceNumber, notes } = parsed.data;

  // Verify ownership of the policy
  const policy = await prisma.insurancePolicy.findFirst({
    where: { id: policyId, userId: session.user.id },
  });
  if (!policy) {
    return NextResponse.json({ error: "Policy not found" }, { status: 404 });
  }

  const claim = await prisma.insuranceClaim.create({
    data: {
      policyId,
      userId: session.user.id,
      title,
      description: description ?? null,
      claimDate: new Date(claimDate),
      amountCents: amount ?? null,
      status,
      referenceNumber: referenceNumber ?? null,
      notes: notes ?? null,
    },
    include: { policy: { select: { provider: true, type: true } } },
  });

  return NextResponse.json(formatClaim(claim), { status: 201 });
}
