import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://api.frankfurter.app/latest?from=USD", {
      next: { revalidate: 3600 },
    });

    if (!res.ok) throw new Error("Upstream error");
    const data = await res.json();

    return NextResponse.json({ base: "USD", rates: { USD: 1, ...data.rates } });
  } catch {
    // Fall back to USD-only so the UI still works offline
    return NextResponse.json({ base: "USD", rates: { USD: 1 }, fallback: true });
  }
}
