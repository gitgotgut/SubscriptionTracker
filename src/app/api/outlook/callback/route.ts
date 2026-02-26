import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL("/dashboard?outlook=denied", req.url));
  }
  if (!code || !state) {
    return NextResponse.redirect(new URL("/dashboard?outlook=error", req.url));
  }

  const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
  let userId: string;
  try {
    const { payload } = await jwtVerify(state, secret);
    userId = payload.userId as string;
  } catch {
    return NextResponse.redirect(new URL("/dashboard?outlook=error", req.url));
  }

  const tokenRes = await fetch(
    "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.MICROSOFT_CLIENT_ID!,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/outlook/callback`,
        grant_type: "authorization_code",
        scope: "offline_access Mail.Read",
      }),
    }
  );

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL("/dashboard?outlook=error", req.url));
  }

  const tokens = await tokenRes.json();
  const expiry = new Date(Date.now() + tokens.expires_in * 1000);

  await prisma.user.update({
    where: { id: userId },
    data: {
      outlookAccessToken: tokens.access_token,
      ...(tokens.refresh_token && { outlookRefreshToken: tokens.refresh_token }),
      outlookTokenExpiry: expiry,
    },
  });

  return NextResponse.redirect(new URL("/dashboard?outlook=connected", req.url));
}
