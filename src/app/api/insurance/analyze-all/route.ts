import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY is not configured" }, { status: 500 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { householdId: true },
    });

    // Fetch all active policies with analyzed documents
    const policies = await prisma.insurancePolicy.findMany({
      where: {
        status: "active",
        OR: [
          { userId: session.user.id },
          ...(user?.householdId ? [{ householdId: user.householdId }] : []),
        ],
      },
      include: {
        documents: {
          where: { parsedStatus: "completed" },
          select: { analysisResult: true, fileName: true },
        },
      },
    });

    // Build context from analyzed documents
    const policySummaries = policies
      .filter((p) => p.documents.length > 0)
      .map((p) => ({
        provider: p.provider,
        type: p.type,
        policyNumber: p.policyNumber,
        analyses: p.documents.map((d) => d.analysisResult),
      }));

    if (policySummaries.length === 0) {
      return NextResponse.json({ insights: [], noData: true });
    }

    const prompt = `You are an insurance advisor analyzing a user's insurance portfolio. Below are their active policies with AI-extracted document analyses.

Analyze this portfolio and identify:
1. **Coverage overlaps**: Where two or more policies cover the same things (wasteful spending)
2. **Coverage gaps**: Important coverage the user is missing
3. **Optimization suggestions**: Ways to save money or improve coverage

Return a JSON array of insights. Each insight must have:
- "type": one of "overlap", "gap", "suggestion"
- "title": short title (max 80 chars)
- "description": detailed explanation (1-2 sentences)
- "severity": "high", "medium", or "low"
- "relatedPolicies": array of provider names involved (if applicable)

Return ONLY the JSON array, no other text. Return an empty array [] if no notable insights are found.

Portfolio:
${JSON.stringify(policySummaries, null, 2)}`;

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const text = (response.content[0] as { type: string; text: string }).text.trim();
    const jsonMatch = text.match(/\[[\s\S]*\]/);

    let insights: Array<{
      type: string;
      title: string;
      description: string;
      severity: string;
      relatedPolicies: string[];
    }> = [];

    if (jsonMatch) {
      insights = JSON.parse(jsonMatch[0]);
    }

    return NextResponse.json({ insights });
  } catch (e) {
    const raw = e instanceof Error ? e.message : "Unexpected error";
    const message = raw.toLowerCase().includes("credit balance")
      ? "Anthropic API credits are exhausted. Please top up at console.anthropic.com."
      : raw;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
