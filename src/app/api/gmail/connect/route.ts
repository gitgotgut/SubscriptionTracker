import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { SignJWT } from "jose";

const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Sign a short-lived state JWT containing the userId so we can identify
  // the user when Google redirects back to our callback.
  const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
  const state = await new SignJWT({ userId: session.user.id })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1h")
    .sign(secret);

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${process.env.NEXTAUTH_URL}/api/gmail/callback`,
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    state,
  });

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  );
}
