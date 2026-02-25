import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const db = prisma as any;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = z.object({ name: z.string().min(1).max(80) }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  // Check if already owns a household
  const existing = await db.household.findUnique({ where: { ownerId: session.user.id } });
  if (existing) {
    return NextResponse.json({ error: "You already own a household" }, { status: 409 });
  }

  const household = await db.household.create({
    data: {
      name: parsed.data.name,
      ownerId: session.user.id,
      members: {
        create: { userId: session.user.id, role: "owner" },
      },
    },
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { householdId: household.id },
  });

  return NextResponse.json(household, { status: 201 });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { householdId: true },
  });

  if (!user?.householdId) return NextResponse.json(null);

  const household = await db.household.findUnique({
    where: { id: user.householdId },
    include: {
      members: { include: { user: { select: { id: true, email: true } } } },
    },
  });

  return NextResponse.json(household);
}
