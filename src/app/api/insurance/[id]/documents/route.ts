import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import path from "path";
import { z } from "zod";

type RouteParams = { params: Promise<{ id: string }> };

const createDocSchema = z.object({
  fileUrl: z.string().min(1),
  fileName: z.string().min(1),
  fileType: z.string().min(1),
});

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { householdId: true },
  });

  const policy = await prisma.insurancePolicy.findFirst({
    where: {
      id,
      OR: [
        { userId: session.user.id },
        ...(user?.householdId ? [{ householdId: user.householdId }] : []),
      ],
    },
  });

  if (!policy) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const documents = await prisma.insuranceDocument.findMany({
    where: { policyId: id },
    orderBy: { uploadedAt: "desc" },
  });

  return NextResponse.json(documents.map((d) => ({
    ...d,
    uploadedAt: d.uploadedAt.toISOString(),
  })));
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const policy = await prisma.insurancePolicy.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!policy) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const parsed = createDocSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const doc = await prisma.insuranceDocument.create({
      data: {
        policyId: id,
        ...parsed.data,
      },
    });

    return NextResponse.json({
      ...doc,
      uploadedAt: doc.uploadedAt.toISOString(),
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const docId = searchParams.get("docId");

  if (!docId) {
    return NextResponse.json({ error: "docId required" }, { status: 400 });
  }

  // Verify ownership: policy must belong to user
  const policy = await prisma.insurancePolicy.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!policy) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const doc = await prisma.insuranceDocument.findFirst({
    where: { id: docId, policyId: id },
  });
  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Delete file from disk
  try {
    const filePath = path.join(process.cwd(), "public", doc.fileUrl);
    await unlink(filePath);
  } catch {
    // File may already be deleted, continue
  }

  await prisma.insuranceDocument.delete({ where: { id: docId } });
  return new NextResponse(null, { status: 204 });
}
