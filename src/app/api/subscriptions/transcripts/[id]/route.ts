import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import path from "path";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const transcript = await prisma.bankTranscript.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!transcript) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    // Remove file from disk (ignore ENOENT if not found)
    const filePath = path.join(process.cwd(), "public", transcript.fileUrl);
    await unlink(filePath).catch(() => {});

    // Delete DB record
    await prisma.bankTranscript.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Delete failed" },
      { status: 500 }
    );
  }
}
