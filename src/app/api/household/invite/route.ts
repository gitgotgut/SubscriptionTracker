import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SignJWT } from "jose";
import { Resend } from "resend";
import { z } from "zod";

const db = prisma as any;
const resend = new Resend(process.env.RESEND_API_KEY);

function getSecret() {
  const s = process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("NEXTAUTH_SECRET not set");
  return new TextEncoder().encode(s);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = z.object({ email: z.string().email() }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const household = await db.household.findUnique({ where: { ownerId: session.user.id } });
  if (!household) {
    return NextResponse.json({ error: "Create a household first" }, { status: 404 });
  }

  const token = await new SignJWT({
    householdId: household.id,
    invitedEmail: parsed.data.email,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(getSecret());

  const acceptUrl = `${process.env.NEXTAUTH_URL}/api/household/accept?token=${token}`;

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Email not configured (missing RESEND_API_KEY)" }, { status: 503 });
  }

  const fromAddress = process.env.EMAIL_FROM || "Hugo <onboarding@resend.dev>";
  const { error: sendError } = await resend.emails.send({
    from: fromAddress,
    to: parsed.data.email,
    subject: `You've been invited to a Hugo household`,
    html: `
      <body style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px 16px">
        <h2 style="font-size:20px;font-weight:600">You're invited</h2>
        <p style="color:#6b7280;font-size:14px">
          You've been invited to join <strong>${household.name}</strong> on Hugo —
          a shared space for tracking household subscriptions together.
        </p>
        <a href="${acceptUrl}"
           style="display:inline-block;margin-top:16px;padding:10px 20px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">
          Accept invitation
        </a>
        <p style="margin-top:24px;font-size:12px;color:#9ca3af">
          This link expires in 7 days. If you didn't expect this, ignore this email.
        </p>
      </body>
    `,
  });
  if (sendError) {
    console.error("Failed to send invite email:", sendError);
    return NextResponse.json({ error: sendError.message || "Failed to send invite email" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
