import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { SignJWT } from "jose";

const SCOPES = ["offline_access", "Mail.Read"];

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
  const state = await new SignJWT({ userId: session.user.id })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1h")
    .sign(secret);

  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID!,
    redirect_uri: `${process.env.NEXTAUTH_URL}/api/outlook/callback`,
    response_type: "code",
    scope: SCOPES.join(" "),
    response_mode: "query",
    state,
  });

  return NextResponse.redirect(
    `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params}`
  );
}
