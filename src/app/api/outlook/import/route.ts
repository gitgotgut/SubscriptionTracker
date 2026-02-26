import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

async function refreshAccessToken(userId: string, refreshToken: string): Promise<string> {
  const res = await fetch(
    "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID!,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
        scope: "offline_access Mail.Read",
      }),
    }
  );
  if (!res.ok) throw new Error("Token refresh failed");
  const tokens = await res.json();
  const expiry = new Date(Date.now() + tokens.expires_in * 1000);
  await prisma.user.update({
    where: { id: userId },
    data: { outlookAccessToken: tokens.access_token, outlookTokenExpiry: expiry },
  });
  return tokens.access_token as string;
}

async function graphFetch(path: string, accessToken: string) {
  const res = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Graph API ${res.status}`);
  return res.json();
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
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
      select: {
        outlookAccessToken: true,
        outlookRefreshToken: true,
        outlookTokenExpiry: true,
      },
    });

    if (!user?.outlookAccessToken) {
      return NextResponse.json({ error: "Outlook not connected" }, { status: 400 });
    }

    let accessToken = user.outlookAccessToken;
    if (user.outlookTokenExpiry && user.outlookTokenExpiry < new Date()) {
      if (!user.outlookRefreshToken) {
        return NextResponse.json(
          { error: "Outlook token expired, please reconnect" },
          { status: 400 }
        );
      }
      accessToken = await refreshAccessToken(userId, user.outlookRefreshToken);
    }

    // Search for billing/subscription emails via Microsoft Graph
    const since = new Date();
    since.setDate(since.getDate() - 180);
    const sinceISO = since.toISOString();

    const keywords = ["receipt", "invoice", "subscription", "renewal", "billing", "charged", "payment"];
    const searchParam = encodeURIComponent(`"${keywords.join('" OR "')}"`);
    const selectFields = "id,subject,from,receivedDateTime,body";

    const listRes = await graphFetch(
      `/me/messages?$search=${searchParam}&$top=50&$select=${selectFields}&$filter=receivedDateTime ge ${sinceISO}`,
      accessToken
    ).catch(async () => {
      // $filter + $search not supported together — fall back to search only
      return graphFetch(
        `/me/messages?$search=${searchParam}&$top=50&$select=${selectFields}`,
        accessToken
      );
    });

    const messages: Array<{
      id: string;
      subject: string;
      from: { emailAddress: { name: string; address: string } };
      receivedDateTime: string;
      body: { contentType: string; content: string };
    }> = listRes.value ?? [];

    if (messages.length === 0) {
      return NextResponse.json({ candidates: [], scanned: 0 });
    }

    type EmailData = { from: string; subject: string; date: string; body: string };
    const emailData: EmailData[] = messages.map((msg) => {
      const rawBody = msg.body?.content ?? "";
      const bodyText =
        msg.body?.contentType === "html" ? stripHtml(rawBody) : rawBody;
      return {
        from: msg.from?.emailAddress?.address ?? "",
        subject: msg.subject ?? "",
        date: msg.receivedDateTime ?? "",
        body: bodyText.slice(0, 1500),
      };
    });

    // Ask Claude to extract subscription candidates
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

    type RawCandidate = {
      serviceName: string;
      amount: number;
      currency: string;
      billingCycle: string;
      renewalDate: string;
      category: string;
    };
    let candidates: RawCandidate[] = [];
    try {
      const text = (response.content[0] as { type: string; text: string }).text.trim();
      const match = text.match(/\[[\s\S]*\]/);
      if (match) candidates = JSON.parse(match[0]);
    } catch {
      candidates = [];
    }

    // Detect price changes against existing subscriptions
    const existingSubs = await prisma.subscription.findMany({
      where: { userId },
      select: { id: true, name: true, amountCents: true, billingCycle: true, currency: true },
    });

    const normalize = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
    const existingMap = new Map(existingSubs.map((s) => [normalize(s.name), s]));

    const annotated = candidates.map((c) => {
      const match = existingMap.get(normalize(c.serviceName));
      const newAmountCents = Math.round(c.amount * 100);
      if (match) {
        return {
          ...c,
          isExisting: true,
          priceChanged: match.amountCents !== newAmountCents,
          existingId: match.id,
          existingAmountCents: match.amountCents,
          newAmountCents,
        };
      }
      return { ...c, isExisting: false, priceChanged: false };
    });

    return NextResponse.json({ candidates: annotated, scanned: emailData.length });
  } catch (e) {
    const raw = e instanceof Error ? e.message : "Unexpected error";
    const message = raw.toLowerCase().includes("credit balance")
      ? "Anthropic API credits are exhausted. Please top up at console.anthropic.com → Plans & Billing."
      : raw;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
