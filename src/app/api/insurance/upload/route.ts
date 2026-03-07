import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg"];

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name) || (file.type === "application/pdf" ? ".pdf" : ".jpg");
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "insurance", session.user.id);

    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, safeName), buffer);

    const fileUrl = `/uploads/insurance/${session.user.id}/${safeName}`;

    return NextResponse.json({
      fileUrl,
      fileName: file.name,
      fileType: file.type,
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
