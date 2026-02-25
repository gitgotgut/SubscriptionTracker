import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { addDays, format } from "date-fns";
import { centsToDisplay } from "@/lib/utils";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const in7Days = addDays(now, 7);

  // Find active subscriptions renewing within 7 days, grouped by user
  const upcoming = await prisma.subscription.findMany({
    where: {
      status: "active",
      renewalDate: { gte: now, lte: in7Days },
    },
    include: { user: { select: { email: true } } },
    orderBy: { renewalDate: "asc" },
  });

  // Group by user email
  const byUser = new Map<string, typeof upcoming>();
  for (const sub of upcoming) {
    const email = sub.user.email;
    if (!byUser.has(email)) byUser.set(email, []);
    byUser.get(email)!.push(sub);
  }

  let sent = 0;
  for (const [email, subs] of byUser.entries()) {
    const rows = subs
      .map(
        (s) =>
          `<tr>
            <td style="padding:8px 0;border-bottom:1px solid #f0f0f0">${s.name}</td>
            <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:right">$${centsToDisplay(s.amountCents)}</td>
            <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:right;color:#6b7280">${format(s.renewalDate, "MMM d, yyyy")}</td>
          </tr>`
      )
      .join("");

    const html = `
      <!DOCTYPE html>
      <html>
        <body style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px 16px;color:#111">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:24px">
            <span style="font-size:18px;font-weight:700;letter-spacing:-0.5px">Subtrack</span>
          </div>
          <h2 style="font-size:20px;font-weight:600;margin:0 0 8px">Upcoming renewals</h2>
          <p style="color:#6b7280;font-size:14px;margin:0 0 24px">
            You have ${subs.length} subscription${subs.length > 1 ? "s" : ""} renewing in the next 7 days.
          </p>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <thead>
              <tr style="color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:.05em">
                <th style="text-align:left;padding-bottom:8px">Subscription</th>
                <th style="text-align:right;padding-bottom:8px">Amount</th>
                <th style="text-align:right;padding-bottom:8px">Renews</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <div style="margin-top:32px;padding-top:24px;border-top:1px solid #f0f0f0;font-size:12px;color:#9ca3af">
            You're receiving this because you use Subtrack to track your subscriptions.
          </div>
        </body>
      </html>
    `;

    await resend.emails.send({
      from: "Subtrack <alerts@subtrack.app>",
      to: email,
      subject: `${subs.length} subscription${subs.length > 1 ? "s" : ""} renewing soon`,
      html,
    });
    sent++;
  }

  return NextResponse.json({ sent });
}
