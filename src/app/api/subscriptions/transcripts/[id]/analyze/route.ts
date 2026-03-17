import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { readFile } from "fs/promises";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

const EXTRACTION_PROMPT = `You are analyzing a bank statement to detect recurring subscription charges.
Identify recurring payments that look like software, streaming, fitness, news, gaming, cloud, food, music, or other subscription services.
Ignore one-time purchases, ATM withdrawals, transfers, and utility bills.
Return ONLY a JSON array. Each object must have:
- "serviceName": string (the subscription service name, cleaned up)
- "amount": number (decimal, positive)
- "currency": string (ISO 4217, e.g. "USD", "DKK")
- "billingCycle": "monthly" | "annual"
- "category": one of "Streaming" | "Music" | "Software" | "Fitness" | "Food" | "Gaming" | "News" | "Cloud" | "Other"
Return ONLY the JSON array. Return [] if no subscriptions found.`;

export async function POST(
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
    // Set status to processing
    await prisma.bankTranscript.update({
      where: { id },
      data: { parsedStatus: "processing" },
    });

    // Read file from disk
    const filePath = path.join(process.cwd(), "public", transcript.fileUrl);
    const fileBuffer = await readFile(filePath);

    // Prepare Claude message content
    const messageContent: Anthropic.ContentBlockParam[] = [];

    if (transcript.fileType === "application/pdf") {
      // PDF: use document block
      const base64Data = fileBuffer.toString("base64");
      messageContent.push({
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: base64Data,
        },
      });
    } else {
      // CSV/TXT: use text block directly
      const textContent = fileBuffer.toString("utf-8");
      messageContent.push({
        type: "text",
        text: textContent,
      });
    }

    // Add prompt
    messageContent.push({
      type: "text",
      text: EXTRACTION_PROMPT,
    });

    // Call Claude
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: messageContent,
        },
      ],
    });

    // Extract JSON from response
    const responseText =
      response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      throw new Error("No JSON array found in response");
    }

    const candidates = JSON.parse(jsonMatch[0]);

    // Annotate with isExisting by comparing against user's active subscriptions
    const existingSubs = await prisma.subscription.findMany({
      where: {
        userId: session.user.id,
        status: { in: ["active", "paused"] },
      },
    });

    const annotatedCandidates = candidates.map((cand: any) => {
      const normalized = cand.serviceName.toLowerCase().trim();
      const existing = existingSubs.find(
        (sub) =>
          sub.name.toLowerCase().includes(normalized) ||
          normalized.includes(sub.name.toLowerCase())
      );

      return {
        ...cand,
        isExisting: !!existing,
        existingId: existing?.id,
      };
    });

    // Update transcript with results
    await prisma.bankTranscript.update({
      where: { id },
      data: {
        candidates: annotatedCandidates,
        parsedStatus: "completed",
      },
    });

    return NextResponse.json({
      id,
      candidates: annotatedCandidates,
      parsedStatus: "completed",
    });
  } catch (error) {
    console.error("Analysis error:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const isCreditError = errorMessage.includes("credit balance");

    // Update transcript with error status
    await prisma.bankTranscript.update({
      where: { id },
      data: { parsedStatus: "failed" },
    });

    if (isCreditError) {
      return NextResponse.json(
        {
          error: "AI analysis credit limit reached. Please try again later.",
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Analysis failed" },
      { status: 500 }
    );
  }
}
