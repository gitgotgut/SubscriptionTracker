import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Validation
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = [
    "application/pdf",
    "text/csv",
    "text/plain",
    "application/vnd.ms-excel",
  ];

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File too large (max 10MB)" },
      { status: 400 }
    );
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Invalid file type. Allowed: PDF, CSV, TXT" },
      { status: 400 }
    );
  }

  try {
    // Save file to disk
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name) || ".txt";
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "transcripts",
      session.user.id
    );

    await mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, safeName);
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/transcripts/${session.user.id}/${safeName}`;

    // Create DB record
    const transcript = await prisma.bankTranscript.create({
      data: {
        userId: session.user.id,
        fileName: file.name,
        fileUrl,
        fileType: file.type,
        parsedStatus: "pending",
      },
    });

    // Fire-and-forget: trigger analysis
    fetch(`${req.nextUrl.origin}/api/subscriptions/transcripts/${transcript.id}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }).catch(console.error);

    return NextResponse.json(
      { id: transcript.id, fileName: file.name, parsedStatus: "processing" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
