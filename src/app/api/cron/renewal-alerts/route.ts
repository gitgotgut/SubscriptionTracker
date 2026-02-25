import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { addDays, differenceInDays, format } from "date-fns";
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
  const in3Days = addDays(now, 3);

  // Active subscriptions renewing within 7 days
  const upcoming = await prisma.subscription.findMany({
    where: {
      status: "active",
      renewalDate: { gte: now, lte: in7Days },
      user: { emailReminders: true },
    },
    include: { user: { select: { email: true } } },
    orderBy: { renewalDate: "asc" },
  });

  // Trials expiring within 3 days
  const expiringTrials = await prisma.subscription.findMany({
    where: {
      status: "trial",
      trialEndDate: { gte: now, lte: in3Days },
      user: { emailReminders: true },
    },
    include: { user: { select: { email: true } } },
    orderBy: { trialEndDate: "asc" },
  });

  // Group both by user email
  const byUserRenewals = new Map<string, typeof upcoming>();
  for (const sub of upcoming) {
    const email = sub.user.email;
    if (!byUserRenewals.has(email)) byUserRenewals.set(email, []);
    byUserRenewals.get(email)!.push(sub);
  }

  const byUserTrials = new Map<string, typeof expiringTrials>();
  for (const sub of expiringTrials) {
    const email = sub.user.email;
    if (!byUserTrials.has(email)) byUserTrials.set(email, []);
    byUserTrials.get(email)!.push(sub);
  }

  // All unique emails that need an alert
  const allEmails = new Set([...byUserRenewals.keys(), ...byUserTrials.keys()]);

  let sent = 0;
  for (const email of allEmails) {
    const renewals = byUserRenewals.get(email) ?? [];
    const trials = byUserTrials.get(email) ?? [];

    // Build renewal section
    let renewalSection = "";
    if (renewals.length > 0) {
      const rows = renewals
        .map(
          (s) =>
            `<tr>
              <td style="padding:8px 0;border-bottom:1px solid #f0f0f0">${s.name}</td>
              <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:right">$${centsToDisplay(s.amountCents)}</td>
              <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:right;color:#6b7280">${format(s.renewalDate, "MMM d, yyyy")}</td>
            </tr>`
        )
        .join("");

      renewalSection = `
        <h2 style="font-size:20px;font-weight:600;margin:0 0 8px">Upcoming renewals</h2>
        <p style="color:#6b7280;font-size:14px;margin:0 0 16px">
          ${renewals.length} subscription${renewals.length > 1 ? "s" : ""} renewing in the next 7 days.
        </p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px">
          <thead>
            <tr style="color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:.05em">
              <th style="text-align:left;padding-bottom:8px">Subscription</th>
              <th style="text-align:right;padding-bottom:8px">Amount</th>
              <th style="text-align:right;padding-bottom:8px">Renews</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>`;
    }

    // Build trial section
    let trialSection = "";
    if (trials.length > 0) {
      const rows = trials
        .map((s) => {
          const days = differenceInDays(s.trialEndDate!, now);
          const when = days === 0 ? "Today" : `In ${days} day${days > 1 ? "s" : ""}`;
          const price = `$${centsToDisplay(s.amountCents)}/${s.billingCycle === "annual" ? "yr" : "mo"}`;
          return `<tr>
            <td style="padding:8px 0;border-bottom:1px solid #f0f0f0">${s.name}</td>
            <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:right">${price}</td>
            <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:right;color:#d97706;font-weight:500">${when}</td>
          </tr>`;
        })
        .join("");

      trialSection = `
        <h2 style="font-size:20px;font-weight:600;margin:0 0 8px;color:#d97706">Trials converting to paid</h2>
        <p style="color:#6b7280;font-size:14px;margin:0 0 16px">
          ${trials.length} free trial${trials.length > 1 ? "s" : ""} ending soon — cancel before they convert if you don&apos;t want to be charged.
        </p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px">
          <thead>
            <tr style="color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:.05em">
              <th style="text-align:left;padding-bottom:8px">Service</th>
              <th style="text-align:right;padding-bottom:8px">Converts to</th>
              <th style="text-align:right;padding-bottom:8px">When</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>`;
    }

    // Subject line
    const parts: string[] = [];
    if (renewals.length > 0) parts.push(`${renewals.length} renewal${renewals.length > 1 ? "s" : ""}`);
    if (trials.length > 0) parts.push(`${trials.length} trial${trials.length > 1 ? "s" : ""} expiring`);
    const subject = parts.join(" & ");

    const html = `
      <!DOCTYPE html>
      <html>
        <body style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px 16px;color:#111">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:24px">
            <span style="font-size:18px;font-weight:700;letter-spacing:-0.5px">Subtrack</span>
          </div>
          ${renewalSection}
          ${trialSection}
          <div style="margin-top:32px;padding-top:24px;border-top:1px solid #f0f0f0;font-size:12px;color:#9ca3af">
            You're receiving this because you use Subtrack to track your subscriptions.
          </div>
        </body>
      </html>
    `;

    await resend.emails.send({
      from: "Subtrack <alerts@subtrack.app>",
      to: email,
      subject,
      html,
    });
    sent++;
  }

  return NextResponse.json({ sent });
}
