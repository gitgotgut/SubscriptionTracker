import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatDistanceToNow } from "date-fns";

const db = prisma as any;

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const owned = await prisma.subscription.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!owned) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const history = await db.subscriptionHistory.findMany({
    where: { subscriptionId: id },
    orderBy: { changedAt: "desc" },
  });

  return NextResponse.json(
    history.map((h: any) => ({
      ...h,
      changedAt: h.changedAt.toISOString(),
      relativeTime: formatDistanceToNow(h.changedAt, { addSuffix: true }),
    }))
  );
}
