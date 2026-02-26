import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const db = prisma as any;

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { householdId: true },
  });

  if (!user?.householdId) {
    return NextResponse.json({ error: "Not in a household" }, { status: 404 });
  }

  const householdId = user.householdId;

  // Check if user is the owner
  const household = await db.household.findUnique({
    where: { id: householdId },
    select: { ownerId: true },
  });

  if (!household) {
    return NextResponse.json({ error: "Household not found" }, { status: 404 });
  }

  if (household.ownerId === userId) {
    // Owner: delete entire household
    await prisma.$transaction([
      // Unset householdId on all shared subscriptions
      prisma.subscription.updateMany({
        where: { householdId },
        data: { householdId: null },
      }),
      // Unset householdId on all member users
      prisma.user.updateMany({
        where: { householdId },
        data: { householdId: null },
      }),
      // Delete all members
      db.householdMember.deleteMany({
        where: { householdId },
      }),
      // Delete the household
      db.household.delete({
        where: { id: householdId },
      }),
    ]);
  } else {
    // Member: just leave
    await prisma.$transaction([
      db.householdMember.delete({
        where: { userId },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { householdId: null },
      }),
    ]);
  }

  return new NextResponse(null, { status: 204 });
}
