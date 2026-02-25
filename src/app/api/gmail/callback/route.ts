import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL("/dashboard?gmail=denied", req.url));
  }
  if (!code || !state) {
    return NextResponse.redirect(new URL("/dashboard?gmail=error", req.url));
  }

  // Verify the state JWT we created in /api/gmail/connect
  const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
  let userId: string;
  try {
    const { payload } = await jwtVerify(state, secret);
    userId = payload.userId as string;
  } catch {
    return NextResponse.redirect(new URL("/dashboard?gmail=error", req.url));
  }

  // Exchange the auth code for access + refresh tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/gmail/callback`,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL("/dashboard?gmail=error", req.url));
  }

  const tokens = await tokenRes.json();
  const expiry = new Date(Date.now() + tokens.expires_in * 1000);

  await prisma.user.update({
    where: { id: userId },
    data: {
      gmailAccessToken: tokens.access_token,
      ...(tokens.refresh_token && { gmailRefreshToken: tokens.refresh_token }),
      gmailTokenExpiry: expiry,
    },
  });

  return NextResponse.redirect(new URL("/dashboard?gmail=connected", req.url));
}
