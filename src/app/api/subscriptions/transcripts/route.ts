import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const transcripts = await prisma.bankTranscript.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      fileName: true,
      fileType: true,
      uploadedAt: true,
      parsedStatus: true,
      candidates: true,
    },
    orderBy: { uploadedAt: "desc" },
  });

  return NextResponse.json(transcripts);
}
