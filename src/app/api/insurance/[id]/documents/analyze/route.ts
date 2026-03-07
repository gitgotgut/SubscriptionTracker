import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { readFile } from "fs/promises";
import path from "path";

type RouteParams = { params: Promise<{ id: string }> };

const anthropic = new Anthropic();

const MEDIA_MAP: Record<string, string> = {
  "application/pdf": "application/pdf",
  "image/png": "image/png",
  "image/jpeg": "image/jpeg",
  "image/jpg": "image/jpeg",
};

const EXTRACTION_PROMPT = `You are analyzing an insurance policy document. Extract the following structured information from this document.

Return ONLY a valid JSON object with these fields:
- "coverageType": one of "health", "car", "home", "life", "travel", "pet", "contents", "liability", or "other"
- "coveredItems": array of strings describing what/who is covered
- "deductible": string describing the deductible/excess amount, or null if not found
- "coverageLimits": string describing coverage limits/maximum payouts, or null if not found
- "exclusions": array of strings listing key exclusions
- "effectiveDates": object with "start" (YYYY-MM-DD) and "end" (YYYY-MM-DD), or null if not found
- "keyTerms": array of up to 5 important terms or conditions
- "summary": a 2-3 sentence plain language summary of the policy

If a field cannot be determined from the document, use null for strings/objects or empty array for arrays.
Return ONLY the JSON object, no other text.`;

export async function POST(req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY is not configured" }, { status: 500 });
  }

  const { id } = await params;
  let docId: string | undefined;

  try {
    const body = await req.json();
    docId = body.docId;
    if (!docId) {
      return NextResponse.json({ error: "docId required" }, { status: 400 });
    }

    // Verify policy ownership
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

    // Find document
    const doc = await prisma.insuranceDocument.findFirst({
      where: { id: docId, policyId: id },
    });

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Set processing status
    await prisma.insuranceDocument.update({
      where: { id: docId },
      data: { parsedStatus: "processing" },
    });

    // Read file from disk
    const filePath = path.join(process.cwd(), "public", doc.fileUrl);
    const fileBuffer = await readFile(filePath);
    const base64Data = fileBuffer.toString("base64");

    const mediaType = MEDIA_MAP[doc.fileType];
    if (!mediaType) {
      await prisma.insuranceDocument.update({
        where: { id: docId },
        data: { parsedStatus: "failed" },
      });
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }

    // Send to Claude for analysis
    const isPdf = doc.fileType === "application/pdf";

    const content: Anthropic.Messages.ContentBlockParam[] = [
      isPdf
        ? {
            type: "document" as const,
            source: {
              type: "base64" as const,
              media_type: "application/pdf" as const,
              data: base64Data,
            },
          }
        : {
            type: "image" as const,
            source: {
              type: "base64" as const,
              media_type: mediaType as "image/png" | "image/jpeg",
              data: base64Data,
            },
          },
      { type: "text" as const, text: EXTRACTION_PROMPT },
    ];

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      messages: [{ role: "user", content }],
    });

    // Parse response
    const text = (response.content[0] as { type: string; text: string }).text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      await prisma.insuranceDocument.update({
        where: { id: docId },
        data: { parsedStatus: "failed" },
      });
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    const analysisResult = JSON.parse(jsonMatch[0]);

    // Store result
    const updated = await prisma.insuranceDocument.update({
      where: { id: docId },
      data: {
        parsedStatus: "completed",
        analysisResult,
      },
    });

    return NextResponse.json({
      ...updated,
      uploadedAt: updated.uploadedAt.toISOString(),
    });
  } catch (e) {
    // Mark document as failed if we have the docId
    if (docId) {
      try {
        await prisma.insuranceDocument.update({
          where: { id: docId },
          data: { parsedStatus: "failed" },
        });
      } catch {
        // Ignore cleanup errors
      }
    }

    const raw = e instanceof Error ? e.message : "Unexpected error";
    const message = raw.toLowerCase().includes("credit balance")
      ? "Anthropic API credits are exhausted. Please top up at console.anthropic.com."
      : raw;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
