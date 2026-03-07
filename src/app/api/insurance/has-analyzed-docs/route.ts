import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ hasAnalyzed: false });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { householdId: true },
  });

  const count = await prisma.insuranceDocument.count({
    where: {
      parsedStatus: "completed",
      policy: {
        OR: [
          { userId: session.user.id },
          ...(user?.householdId ? [{ householdId: user.householdId }] : []),
        ],
      },
    },
    take: 1,
  });

  return NextResponse.json({ hasAnalyzed: count > 0 });
}
