import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, displayCurrency: true, householdId: true, gmailAccessToken: true },
  });

  return NextResponse.json({ ...user, gmailConnected: !!user?.gmailAccessToken, gmailAccessToken: undefined });
}

const updateSchema = z.object({
  displayCurrency: z.string().length(3).toUpperCase(),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: { displayCurrency: parsed.data.displayCurrency },
    select: { id: true, email: true, displayCurrency: true },
  });

  return NextResponse.json(updated);
}
