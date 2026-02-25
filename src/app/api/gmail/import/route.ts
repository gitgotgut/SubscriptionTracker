import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

async function refreshAccessToken(userId: string, refreshToken: string): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error("Token refresh failed");
  const tokens = await res.json();
  const expiry = new Date(Date.now() + tokens.expires_in * 1000);
  await prisma.user.update({
    where: { id: userId },
    data: { gmailAccessToken: tokens.access_token, gmailTokenExpiry: expiry },
  });
  return tokens.access_token as string;
}

async function gmailFetch(path: string, accessToken: string) {
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Gmail API ${res.status}`);
  return res.json();
}

function decodeEmailBody(payload: Record<string, unknown>): string {
  if (payload.mimeType === "text/plain") {
    const body = payload.body as Record<string, string> | undefined;
    if (body?.data) return Buffer.from(body.data, "base64").toString("utf-8");
  }
  const parts = payload.parts as Record<string, unknown>[] | undefined;
  if (parts) {
    for (const part of parts) {
      const text = decodeEmailBody(part);
      if (text) return text;
    }
  }
  return "";
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY is not configured" }, { status: 500 });
  }

  const userId = session.user.id;

  try {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { gmailAccessToken: true, gmailRefreshToken: true, gmailTokenExpiry: true },
  });

  if (!user?.gmailAccessToken) {
    return NextResponse.json({ error: "Gmail not connected" }, { status: 400 });
  }

  let accessToken = user.gmailAccessToken;
  if (user.gmailTokenExpiry && user.gmailTokenExpiry < new Date()) {
    if (!user.gmailRefreshToken) {
      return NextResponse.json({ error: "Gmail token expired, please reconnect" }, { status: 400 });
    }
    accessToken = await refreshAccessToken(userId, user.gmailRefreshToken);
  }

  // Search for subscription/billing emails in the last 6 months
  const query =
    "subject:(receipt OR invoice OR subscription OR renewal OR billing OR charged OR payment) newer_than:180d";
  const listRes = await gmailFetch(
    `/users/me/messages?q=${encodeURIComponent(query)}&maxResults=50`,
    accessToken
  );

  const messages: { id: string }[] = listRes.messages ?? [];
  if (messages.length === 0) {
    return NextResponse.json({ candidates: [], scanned: 0 });
  }

  // Fetch sender, subject, date, and text body for each message
  type EmailData = { from: string; subject: string; date: string; body: string };
  const emailData: EmailData[] = [];

  for (const msg of messages) {
    try {
      const detail = await gmailFetch(
        `/users/me/messages/${msg.id}?format=full`,
        accessToken
      );
      const headers: { name: string; value: string }[] = detail.payload?.headers ?? [];
      const get = (name: string) => headers.find((h) => h.name === name)?.value ?? "";
      const body = decodeEmailBody(detail.payload).slice(0, 1500) || detail.snippet || "";
      emailData.push({ from: get("From"), subject: get("Subject"), date: get("Date"), body });
    } catch {
      // skip messages that fail to fetch
    }
  }

  // Ask Claude to extract subscription candidates from all emails in one call
  const prompt = `You are extracting subscription billing information from email receipts.

Analyze these ${emailData.length} emails and identify recurring subscription charges.
Ignore one-time purchases. Only include services that bill on a recurring basis.

Return a JSON array (empty if none found). Each object must have:
- "serviceName": string (e.g. "Netflix", "Spotify", "Adobe Creative Cloud")
- "amount": number (decimal, e.g. 15.99)
- "currency": string (ISO 4217, e.g. "USD", "EUR", "GBP")
- "billingCycle": "monthly" | "annual"
- "renewalDate": string (YYYY-MM-DD — next billing date; estimate from email date + cycle)
- "category": one of: Streaming, Music, Software, Fitness, Food, Gaming, News, Cloud, Other

Return ONLY the JSON array, no other text.

Emails:
${emailData
  .map(
    (e, i) => `--- Email ${i + 1} ---
From: ${e.from}
Subject: ${e.subject}
Date: ${e.date}
Body: ${e.body}`
  )
  .join("\n\n")}`;

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  let candidates: unknown[] = [];
  try {
    const text = (response.content[0] as { type: string; text: string }).text.trim();
    const match = text.match(/\[[\s\S]*\]/);
    if (match) candidates = JSON.parse(match[0]);
  } catch {
    candidates = [];
  }

  return NextResponse.json({ candidates, scanned: emailData.length });
  } catch (e) {
    const raw = e instanceof Error ? e.message : "Unexpected error";
    // Surface a friendly message for Anthropic credit exhaustion
    const message = raw.toLowerCase().includes("credit balance")
      ? "Anthropic API credits are exhausted. Please top up at console.anthropic.com → Plans & Billing."
      : raw;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
