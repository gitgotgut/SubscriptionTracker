import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";

const db = prisma as any;

function getSecret() {
  const s = process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("NEXTAUTH_SECRET not set");
  return new TextEncoder().encode(s);
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login?next=/api/household/accept" + req.nextUrl.search, req.url));
  }

  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  try {
    const { payload } = await jwtVerify(token, getSecret());
    const { householdId, invitedEmail } = payload as { householdId: string; invitedEmail: string };

    if (session.user.email !== invitedEmail) {
      return NextResponse.json(
        { error: "This invite was sent to a different email address" },
        { status: 403 }
      );
    }

    // Idempotent: upsert member
    await db.householdMember.upsert({
      where: { userId: session.user.id },
      create: { householdId, userId: session.user.id, role: "member" },
      update: { householdId },
    });

    await prisma.user.update({
      where: { id: session.user.id },
      data: { householdId },
    });

    return NextResponse.redirect(new URL("/dashboard?joined=1", req.url));
  } catch {
    return NextResponse.json({ error: "Invalid or expired invite link" }, { status: 400 });
  }
}
